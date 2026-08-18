import { getSnapshot, isSessionLive, listSocketMerchantIds } from './connect'
import { isReachoutRestricted } from './reachout-restriction'
import { isReconnectScheduled } from './reconnect'
import { listRegisteredMerchants } from './session-store'
import type { ConnectionStatus } from '../types/whatsapp'

export type SessionHealthRow = {
  merchantId: string
  status: ConnectionStatus
  live: boolean
  reconnecting: boolean
  phone: string | null
}

export type SessionHealthSummary = {
  process: 'ok'
  registered: number
  live: number
  connecting: number
  qr: number
  stale: number
  idle: number
  disconnected: number
  conflict: number
  reachoutRestricted: number
  sessions: SessionHealthRow[]
}

export function collectSessionHealth(): SessionHealthSummary {
  const ids = new Set<string>()
  for (const id of listRegisteredMerchants()) {
    ids.add(id)
  }
  for (const id of listSocketMerchantIds()) {
    ids.add(id)
  }

  const summary: SessionHealthSummary = {
    process: 'ok',
    registered: 0,
    live: 0,
    connecting: 0,
    qr: 0,
    stale: 0,
    idle: 0,
    disconnected: 0,
    conflict: 0,
    reachoutRestricted: 0,
    sessions: []
  }

  for (const merchantId of ids) {
    const snap = getSnapshot(merchantId)
    const live = isSessionLive(merchantId)
    const reconnecting = isReconnectScheduled(merchantId)

    if (snap.status === 'connected' && live) {
      summary.live += 1
    } else if (snap.status === 'connected' && !live) {
      summary.stale += 1
    } else if (snap.status === 'qr' || snap.pairingCode) {
      summary.qr += 1
    } else if (snap.status === 'connecting' || reconnecting) {
      summary.connecting += 1
    } else if (snap.status === 'disconnected') {
      summary.disconnected += 1
    } else {
      summary.idle += 1
    }

    if (snap.conflict) {
      summary.conflict += 1
    }
    if (isReachoutRestricted(merchantId)) {
      summary.reachoutRestricted += 1
    }

    summary.sessions.push({
      merchantId,
      status: snap.status,
      live,
      reconnecting,
      phone: snap.phone ?? null
    })
  }

  summary.registered = listRegisteredMerchants().length
  summary.sessions.sort((a, b) => a.merchantId.localeCompare(b.merchantId))
  return summary
}
