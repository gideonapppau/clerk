import type { WASocket } from '@whiskeysockets/baileys'
import { getSnapshot, ensureSessionLive, isSessionLive } from '../auth/connect'
import { canMerchantHandleInbound } from '../auth/phone-registry'
import { parseInboundContent } from '../baileys/inbound-content'
import { isDirectCustomerJid, phoneFromJid } from '../baileys/jid'
import { forwardMessage, resolveCheckout } from '../transport/core-client'
import { acknowledgeInbound, sendText } from '../transport/sender'
import { inboundScheduler, type InboundBatch } from '../utils/inbound-scheduler'
import { looksLikeInventoryImport } from '../utils/normalize'
import { registerIdentity } from '../utils/identity'
import { ReachoutRestrictedError } from '../utils/reachout-error'
import { logger } from '../utils/logger'

function socketPhone(sock: WASocket): string | undefined {
  return sock.user?.id?.split(':')[0]?.split('@')[0]
}

async function processInboundBatch(sock: WASocket, batch: InboundBatch): Promise<void> {
  const { merchantId, jid, customerId, text, messageKind, inboundKeys } = batch

  try {
    const lastKey = inboundKeys[inboundKeys.length - 1]
    const [response] = await Promise.all([
      forwardMessage({
        merchantId,
        customerPhone: customerId,
        text,
        messageKind
      }),
      lastKey ? acknowledgeInbound(sock, jid, lastKey) : Promise.resolve()
    ])

    inboundScheduler.markProcessed(merchantId, inboundKeys)

    if (response.reply) {
      try {
        await sendText(sock, jid, response.reply, { skipAck: true, merchantId })
      } catch (sendErr) {
        if (sendErr instanceof ReachoutRestrictedError) {
          logger.warn(
            { merchantId, customerId, message: sendErr.message },
            'clerk reply blocked — whatsapp reachout restriction'
          )
        } else {
          logger.error({ sendErr, merchantId, customerId }, 'failed to send whatsapp reply')
          throw sendErr
        }
      }
    } else if (response.route === 'bot') {
      logger.info({ merchantId, customerId, intent: response.intent }, 'core returned no whatsapp reply')
    }

    if (response.route === 'dispatch') {
      const logPayload = {
        merchantId,
        customerId,
        conversationId: response.conversationId,
        status: response.status,
        briefing: response.briefing,
        order: response.order,
        event: response.event
      }

      if (
        response.order &&
        response.conversationId &&
        (response.event?.type === 'ORDER_CREATED' || response.resendPaymentLink)
      ) {
        logger.info(
          { ...logPayload, resend: response.resendPaymentLink },
          response.resendPaymentLink ? 'resending checkout link' : 'new order — resolving checkout'
        )
        try {
          const resolution = await resolveCheckout(
            merchantId,
            response.order.id,
            response.conversationId,
            customerId
          )

          let message: string
          if (resolution.rail === 'momo') {
            const network = (resolution.network ?? '').toUpperCase() || 'MoMo'
            const amount = response.order.subtotal.toLocaleString('en-GH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })
            message =
              `Please send GHS ${amount} to ${resolution.momoNumber} (${network}).\n\n` +
              `Reference: ${resolution.reference}\n\n` +
              `Please reply here once payment is complete.`
          } else if (resolution.rail === 'paystack' || resolution.rail === 'moolre') {
            message = `Please use this link to complete your payment:\n${resolution.checkoutUrl}`
          } else if (resolution.rail === 'manual') {
            message = `Order received. The seller will send payment details shortly.`
          } else {
            message = `Order received. We will send payment details shortly.`
          }

          await sendText(sock, jid, message, { skipAck: true, merchantId })
        } catch (tokenErr) {
          if (tokenErr instanceof ReachoutRestrictedError) {
            logger.warn({ merchantId, message: tokenErr.message }, 'checkout message blocked — whatsapp reachout restriction')
          } else {
            logger.warn({ tokenErr, merchantId }, 'checkout resolve failed')
          }
        }
      } else if (response.status === 'WAITING_MERCHANT') {
        logger.info(logPayload, 'escalated — waiting for merchant')
      } else {
        logger.info(logPayload, 'merchant-owned chat — bot silent')
      }
    }
  } catch (err) {
    logger.error({ err, merchantId, customerId }, 'failed to handle inbound batch')
    ensureSessionLive(merchantId)
  }
}

export function registerMessagesHandler(sock: WASocket, merchantId: string): void {
  sock.ev.on('messages.upsert', async (event) => {
    if (event.type !== 'notify') return

    const snap = getSnapshot(merchantId)
    if (snap.status === 'idle' || snap.status === 'disconnected' || snap.conflict) {
      logger.warn({ merchantId, status: snap.status, conflict: snap.conflict }, 'ignoring inbound — session not ready')
      return
    }
    if (!isSessionLive(merchantId)) {
      logger.warn({ merchantId, status: snap.status }, 'ignoring inbound — whatsapp socket not live')
      return
    }

    const merchantPhone = socketPhone(sock) ?? snap.phone
    if (!canMerchantHandleInbound(merchantId, merchantPhone)) {
      logger.warn({ merchantId, phone: merchantPhone }, 'ignoring inbound — whatsapp number owned by another account')
      return
    }

    for (const msg of event.messages) {
      if (msg.key.fromMe || !msg.message) continue

      const jid = msg.key.remoteJid
      if (!jid || !isDirectCustomerJid(jid)) continue

      if (inboundScheduler.isDuplicate(merchantId, msg.key)) {
        logger.debug({ merchantId, messageId: msg.key.id }, 'duplicate inbound — skipped')
        continue
      }

      const content = parseInboundContent(msg.message)
      if (content.kind === 'unsupported') {
        inboundScheduler.markProcessed(merchantId, [msg.key])
        logger.debug({ merchantId, messageId: msg.key.id }, 'ignoring unsupported inbound message')
        continue
      }
      if (content.kind === 'media_only') {
        inboundScheduler.markProcessed(merchantId, [msg.key])
        logger.debug({ merchantId, messageId: msg.key.id }, 'ignoring media-only inbound — sending text-only notice')
        try {
          await sendText(sock, jid, 'I can only read text messages. Please type what you need.', {
            skipAck: true,
            merchantId
          })
        } catch {
          // Best-effort — if send fails, we still drop the message gracefully.
        }
        continue
      }
      const text = content.text

      const rawPhone = phoneFromJid(jid)
      const pushName = typeof (msg as { pushName?: string }).pushName === 'string'
        ? (msg as { pushName?: string }).pushName
        : undefined
      const customerId = registerIdentity(merchantId, rawPhone, jid, pushName)

      logger.info(
        { merchantId, customerId, messageId: msg.key.id, chars: text.length },
        'inbound whatsapp message queued'
      )

      inboundScheduler.enqueue(
        merchantId,
        {
          jid,
          customerId,
          text,
          messageKind: looksLikeInventoryImport(text) ? 'inventory_import' : 'customer_message',
          inboundKeys: [msg.key]
        },
        (batch) => processInboundBatch(sock, batch)
      )
    }
  })
}
