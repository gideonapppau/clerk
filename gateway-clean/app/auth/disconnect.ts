import { getSnapshot, stopConnection } from './connect'
import { getReachoutRestriction } from './reachout-restriction'
import { cancelReconnect } from './reconnect'
import { releasePhoneOwner } from './phone-registry'
import { clearSession } from './session-store'
import { notifyConnected } from '../transport/core-client'
import type { SessionSnapshot } from '../types/whatsapp'

export async function disconnectMerchant(merchantId: string): Promise<SessionSnapshot> {
  cancelReconnect(merchantId)
  const phone = getSnapshot(merchantId).phone
  await stopConnection(merchantId, true)
  releasePhoneOwner(merchantId, phone)
  clearSession(merchantId)
  await notifyConnected(merchantId, false, undefined, true)
  return { merchantId, status: 'idle' }
}

export function connectionStatus(merchantId: string): SessionSnapshot {
  const snap = getSnapshot(merchantId)
  return {
    ...snap,
    // Always attach live restriction state (snapshot patches can drop it).
    reachout: getReachoutRestriction(merchantId) ?? snap.reachout ?? null
  }
}
