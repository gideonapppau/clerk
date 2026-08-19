import { getPushConfig, getPushStatus, sendTestPush, subscribePush, unsubscribePush } from '@/lib/api'

export const PUSH_BANNER_DISMISS_KEY = 'clerk_push_banner_dismissed'

export function dismissPushBanner(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PUSH_BANNER_DISMISS_KEY, '1')
  }
}

function urlBase64ToUint8Array(base64: string): BufferSource {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength)
}

export function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export async function getNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!pushSupported()) return 'unsupported'
  return Notification.permission
}

export async function enablePushNotifications(): Promise<void> {
  if (!pushSupported()) {
    throw new Error('Push notifications are not supported in this browser.')
  }

  const config = await getPushConfig()
  if (!config.enabled || !config.publicKey) {
    throw new Error('Push is not configured on this server. Contact support.')
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Notification permission was denied.')
  }

  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(config.publicKey),
    })
  }

  const json = sub.toJSON()
  await subscribePush({
    endpoint: json.endpoint!,
    p256dh: json.keys!.p256dh!,
    auth: json.keys!.auth!,
    userAgent: navigator.userAgent,
  })
}

export async function disablePushNotifications(): Promise<void> {
  if (!pushSupported()) return
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (!sub) return
  const endpoint = sub.endpoint
  await unsubscribePush(endpoint)
  await sub.unsubscribe()
}

export async function hasActivePushSubscription(): Promise<boolean> {
  if (!pushSupported()) return false
  try {
    const status = await getPushStatus()
    return status.configured && status.subscribed
  } catch {
    return false
  }
}

/** True when the dashboard should not prompt for push setup. */
export async function pushNotificationsComplete(): Promise<boolean> {
  if (!pushSupported()) return true
  if (Notification.permission === 'denied') return true
  return hasActivePushSubscription()
}

export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

/** Re-register an existing browser subscription with Core after login or deploy. */
export async function syncPushSubscriptionIfGranted(): Promise<void> {
  if (!pushSupported()) return
  if (Notification.permission !== 'granted') return

  const config = await getPushConfig().catch(() => null)
  if (!config?.enabled || !config.publicKey) return

  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (!sub) return

  const json = sub.toJSON()
  await subscribePush({
    endpoint: json.endpoint!,
    p256dh: json.keys!.p256dh!,
    auth: json.keys!.auth!,
    userAgent: navigator.userAgent,
  })
}

export async function sendTestPushNotification(): Promise<{ devices: number; sent: number; failed: number }> {
  return sendTestPush()
}
