import type { WASocket } from '@whiskeysockets/baileys'
import { extractText } from '../baileys/extract-text'
import { isDirectCustomerJid, phoneFromJid } from '../baileys/jid'
import { recordMerchantMessage } from '../transport/core-client'
import { registerIdentity } from '../utils/identity'
import { logger } from '../utils/logger'

/** Merchant replies sent from their phone — record in Core for audit and dashboard sync. */
export function registerOutboundHandler(sock: WASocket, merchantId: string): void {
  sock.ev.on('messages.upsert', async (event) => {
    if (event.type !== 'notify') return

    for (const msg of event.messages) {
      if (!msg.key.fromMe || !msg.message) continue

      const jid = msg.key.remoteJid
      if (!jid || !isDirectCustomerJid(jid)) continue

      const text = extractText(msg.message)
      if (!text) continue

      const rawPhone = phoneFromJid(jid)
      const customerId = registerIdentity(merchantId, rawPhone, jid)

      try {
        await recordMerchantMessage(merchantId, customerId, text)
        logger.info({ merchantId, customerId }, 'recorded merchant outbound message')
      } catch (err) {
        logger.warn({ err, merchantId, customerId }, 'failed to record merchant outbound')
      }
    }
  })
}
