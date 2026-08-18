import type { SessionSnapshot } from '../types/whatsapp'

export function waitForSnapshot(
  merchantId: string,
  read: (id: string) => SessionSnapshot,
  timeoutMs = 20_000
): Promise<SessionSnapshot> {
  return new Promise((resolve) => {
    const deadline = Date.now() + timeoutMs

    const tick = () => {
      const snap = read(merchantId)
      if (snap.qr || snap.pairingCode || snap.status === 'connected' || snap.status === 'disconnected') {
        resolve(snap)
        return
      }
      if (Date.now() >= deadline) {
        resolve(snap)
        return
      }
      setTimeout(tick, 250)
    }

    tick()
  })
}
