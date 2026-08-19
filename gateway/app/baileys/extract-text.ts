import type { proto } from '@whiskeysockets/baileys'
import { parseInboundContent } from './inbound-content'

export function extractText(message: proto.IMessage | null | undefined): string {
  const content = parseInboundContent(message)
  return content.kind === 'text' ? content.text : ''
}
