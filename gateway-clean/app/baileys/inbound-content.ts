import type { proto } from '@whiskeysockets/baileys'

export type InboundContent =
  | { kind: 'text'; text: string }
  // media_only: the customer sent an image, audio, video or sticker without a
  // text caption. We must tell them we can only read text — but keep it brief.
  | { kind: 'media_only' }
  // unsupported: system events (reactions, protocol messages, polls) — drop silently.
  | { kind: 'unsupported' }

/** Unwrap ephemeral / view-once / edited wrappers to the inner payload. */
function unwrap(message: proto.IMessage | null | undefined): proto.IMessage | null {
  if (!message) return null
  if (message.ephemeralMessage?.message) return unwrap(message.ephemeralMessage.message)
  if (message.viewOnceMessage?.message) return unwrap(message.viewOnceMessage.message)
  if (message.viewOnceMessageV2?.message) return unwrap(message.viewOnceMessageV2.message)
  if (message.documentWithCaptionMessage?.message) return unwrap(message.documentWithCaptionMessage.message)
  if (message.editedMessage?.message) return unwrap(message.editedMessage.message)
  return message
}

function extractCaption(message: proto.IMessage): string {
  return (
    message.conversation ??
    message.extendedTextMessage?.text ??
    message.imageMessage?.caption ??
    message.videoMessage?.caption ??
    message.documentMessage?.caption ??
    message.buttonsResponseMessage?.selectedDisplayText ??
    message.listResponseMessage?.title ??
    message.templateButtonReplyMessage?.selectedDisplayText ??
    ''
  ).trim()
}

function isNonTextPayload(message: proto.IMessage): boolean {
  return Boolean(
    message.imageMessage ||
      message.videoMessage ||
      message.ptvMessage ||
      message.audioMessage ||
      message.stickerMessage ||
      message.documentMessage ||
      message.locationMessage ||
      message.liveLocationMessage ||
      message.contactMessage ||
      message.contactsArrayMessage ||
      message.albumMessage ||
      message.interactiveMessage ||
      message.requestPaymentMessage ||
      message.sendPaymentMessage ||
      message.reactionMessage ||
      message.protocolMessage ||
      message.pollCreationMessage ||
      message.pollUpdateMessage
  )
}

/**
 * Classify an inbound WhatsApp payload.
 * Only plain text (or media captions / button replies) are forwarded to Core.
 * Images, voice notes, videos, stickers, etc. without text are ignored.
 */
export function parseInboundContent(raw: proto.IMessage | null | undefined): InboundContent {
  const message = unwrap(raw)
  if (!message) return { kind: 'unsupported' }

  if (
    message.reactionMessage ||
    message.protocolMessage ||
    message.pollCreationMessage ||
    message.pollUpdateMessage
  ) {
    return { kind: 'unsupported' }
  }

  const text = extractCaption(message)
  if (text) return { kind: 'text', text }

  if (isNonTextPayload(message)) return { kind: 'media_only' }

  // Unknown empty payload — stay silent rather than trigger a generic bot reply.
  return { kind: 'unsupported' }
}
