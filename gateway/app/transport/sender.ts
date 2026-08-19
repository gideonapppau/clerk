import type { proto, WASocket } from '@whiskeysockets/baileys'
import { canSendOutbound } from '../auth/reachout-restriction'
import { logger } from '../utils/logger'
import { ReachoutRestrictedError } from '../utils/reachout-error'
import { readingDelayMs, sleep, typingDelayMs, waitWithTyping } from '../utils/human-emulation'

/**
 * Simulate a human noticing and reading an inbound message.
 * Run in parallel with core processing so the pause overlaps "thinking" time.
 */
export async function acknowledgeInbound(
  sock: WASocket,
  jid: string,
  inboundKey: proto.IMessageKey
): Promise<void> {
  try {
    await sock.sendPresenceUpdate('available')
  } catch (err) {
    logger.debug({ err, jid }, 'available presence failed')
  }

  try {
    await sock.readMessages([inboundKey])
  } catch (err) {
    logger.debug({ err, jid }, 'read receipt failed')
  }

  const readMs = readingDelayMs()
  await sleep(readMs)
  logger.debug({ jid, readMs }, 'inbound acknowledged')
}

/**
 * Send a reply with human-like typing indicators and variable delay.
 * When `skipAck` is true (merchant/API-initiated), only the typing sequence runs.
 */
export async function sendText(
  sock: WASocket,
  jid: string,
  text: string,
  opts?: { inboundKey?: proto.IMessageKey; skipAck?: boolean; merchantId?: string }
): Promise<void> {
  if (opts?.merchantId) {
    const gate = canSendOutbound(opts.merchantId)
    if (!gate.ok) {
      throw new ReachoutRestrictedError(gate.message)
    }
  }

  if (opts?.inboundKey && !opts.skipAck) {
    await acknowledgeInbound(sock, jid, opts.inboundKey)
  }

  const delayMs = typingDelayMs(text)

  await waitWithTyping(async () => {
    try {
      await sock.sendPresenceUpdate('composing', jid)
    } catch (err) {
      logger.debug({ err, jid }, 'composing presence failed')
    }
  }, delayMs)

  // Baileys auto-attaches a link preview when text contains a URL and
  // link-preview-js is installed (see baileys/link-preview.ts). We pass
  // linkPreview: null to disable this behavior and avoid Baileys crashes.
  await sock.sendMessage(jid, { text, linkPreview: null })

  try {
    await sock.sendPresenceUpdate('paused', jid)
  } catch {
    // best-effort cleanup
  }

  const hasUrl = /https?:\/\/\S+/i.test(text)
  logger.info({ jid, delayMs, chars: text.length, hasUrl }, 'sent message')
}
