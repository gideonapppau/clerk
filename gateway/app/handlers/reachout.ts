import type { WASocket } from '@whiskeysockets/baileys'
import {
  clearReachoutRestriction,
  isReachoutRestricted,
  markReachoutRestricted
} from '../auth/reachout-restriction'
import { notifyReachout } from '../transport/core-client'
import type { SessionSnapshot } from '../types/whatsapp'
import { logger } from '../utils/logger'

type SnapshotPatcher = (merchantId: string, patch: Partial<SessionSnapshot>) => SessionSnapshot

/** Apply reachout restriction, persist to core, and alert the merchant UI. */
export function applyReachoutRestriction(
  merchantId: string,
  signal: Parameters<typeof markReachoutRestricted>[1],
  setSnapshot: SnapshotPatcher
): void {
  const wasRestricted = isReachoutRestricted(merchantId)
  const reachout = markReachoutRestricted(merchantId, signal)
  setSnapshot(merchantId, { reachout })
  logger.warn(
    { merchantId, reason: signal.reason, endsAt: reachout.endsAt, newlyActive: !wasRestricted },
    'whatsapp reachout restriction — outbound sends paused'
  )
  void notifyReachout(merchantId, reachout)
}

/** Clear reachout restriction in gateway memory and core DB. */
export function clearReachoutRestrictionState(
  merchantId: string,
  setSnapshot: SnapshotPatcher
): void {
  clearReachoutRestriction(merchantId)
  setSnapshot(merchantId, { reachout: null })
  void notifyReachout(merchantId, { restricted: false })
}

/** Watch message ack updates for server-side 463 rejections. */
export function registerReachoutHandler(
  sock: WASocket,
  merchantId: string,
  setSnapshot: SnapshotPatcher
): void {
  sock.ev.on('messages.update', (updates) => {
    for (const update of updates) {
      const status = (update.update as { status?: number })?.status
      const err = (update as { error?: { code?: string | number } }).error
      const code = err?.code != null ? String(err.code) : ''
      if (code === '463' || status === 463) {
        applyReachoutRestriction(merchantId, { reason: 'ack_463' }, setSnapshot)
      }
    }
  })
}
