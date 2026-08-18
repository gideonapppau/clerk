import type { WASocket } from '@whiskeysockets/baileys'
import { isDirectCustomerJid } from '../baileys/jid'
import { inboundScheduler } from '../utils/inbound-scheduler'
import { logger } from '../utils/logger'

/** Pause bot replies while the customer is still typing in WhatsApp. */
export function registerPresenceHandler(sock: WASocket, merchantId: string): void {
  sock.ev.on('presence.update', ({ id, presences }) => {
    if (!id || !isDirectCustomerJid(id)) return

    for (const update of Object.values(presences ?? {})) {
      const state = update?.lastKnownPresence
      if (state === 'composing') {
        inboundScheduler.setTyping(merchantId, id, true)
        logger.debug({ merchantId, jid: id }, 'customer typing — holding reply')
        return
      }
      if (state === 'paused' || state === 'available' || state === 'recording') {
        inboundScheduler.setTyping(merchantId, id, false)
        logger.debug({ merchantId, jid: id }, 'customer stopped typing')
        return
      }
    }
  })
}
