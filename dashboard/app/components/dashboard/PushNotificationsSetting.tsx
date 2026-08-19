'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  disablePushNotifications,
  dismissPushBanner,
  enablePushNotifications,
  getNotificationPermission,
  isIOSDevice,
  pushSupported,
  sendTestPushNotification,
} from '@/lib/push'
import { formatUserError, getPushStatus } from '@/lib/api'

export function PushNotificationsSetting() {
  const [supported, setSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const [serverConfigured, setServerConfigured] = useState<boolean | null>(null)
  const [serverSubscribed, setServerSubscribed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [testResult, setTestResult] = useState('')
  const [ios] = useState(() => isIOSDevice())

  const refresh = useCallback(async () => {
    setSupported(pushSupported())
    setPermission(await getNotificationPermission())
    try {
      const status = await getPushStatus()
      setServerConfigured(status.configured)
      setServerSubscribed(status.subscribed)
    } catch {
      setServerConfigured(false)
      setServerSubscribed(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function handleEnable() {
    setBusy(true)
    setError('')
    try {
      await enablePushNotifications()
      dismissPushBanner()
      await refresh()
    } catch (err) {
      setError(formatUserError(err, "Couldn't enable notifications."))
    } finally {
      setBusy(false)
    }
  }

  async function handleDisable() {
    setBusy(true)
    setError('')
    try {
      await disablePushNotifications()
      await refresh()
    } catch (err) {
      setError(formatUserError(err, "Couldn't disable notifications."))
    } finally {
      setBusy(false)
    }
  }

  async function handleTest() {
    setBusy(true)
    setError('')
    setTestResult('')
    try {
      const result = await sendTestPushNotification()
      if (result.devices === 0) {
        setTestResult('No device registered on the server. Tap Enable on this device first.')
      } else if (result.sent === 0) {
        setTestResult(
          'Server could not reach your device (VAPID mismatch?). Turn notifications off, then Enable again on this device.'
        )
      } else {
        setTestResult('Test sent — check this device for a notification.')
      }
    } catch (err) {
      setError(formatUserError(err, "Couldn't send test notification."))
    } finally {
      setBusy(false)
    }
  }

  if (!supported) {
    return (
      <p className="text-[12px] text-slate-500 leading-relaxed">
        Install Clerk on your home screen (Add to Home Screen) and use Chrome or Edge for push
        notifications.
      </p>
    )
  }

  if (serverConfigured === false) {
    return (
      <p className="text-[12px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 leading-relaxed">
        Push alerts are not set up on the server yet. Web and SMS escalation alerts will not work
        until VAPID keys are configured on Core.
      </p>
    )
  }

  const enabled = permission === 'granted' && serverSubscribed
  const needsBrowserPermission = permission !== 'granted'
  const needsServerSync = permission === 'granted' && !serverSubscribed

  return (
    <div className="space-y-2">
      <p className="text-[12px] text-slate-500 leading-relaxed">
        Get alerted when a customer needs you or places an order, even when the dashboard is closed.
      </p>
      {ios && (
        <p className="text-[12px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 leading-relaxed">
          On iPhone: add Clerk to your Home Screen (Share → Add to Home Screen), open it from the
          icon, then enable notifications here. Safari tabs alone often do not receive alerts.
        </p>
      )}
      {permission === 'denied' && (
        <p className="text-[12px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          Notifications are blocked in your browser. Allow them in site settings for
          clerkcommerce.com, then tap Enable again.
        </p>
      )}
      {needsServerSync && (
        <p className="text-[12px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          Your browser allows alerts but this device is not registered yet. Tap Enable to finish
          setup.
        </p>
      )}
      {testResult && <p className="text-[12px] text-slate-600">{testResult}</p>}
      {error && <p className="text-[12px] text-red-500">{error}</p>}
      {enabled ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-clerk-primary-dark bg-clerk-light px-2.5 py-1 rounded-full">
            On
          </span>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleTest()}
            className="min-h-[44px] text-[12px] font-semibold text-slate-600 border border-slate-200 px-4 py-2 rounded-full hover:bg-slate-50 transition-colors disabled:opacity-50 touch-manipulation"
          >
            {busy ? '…' : 'Send test'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleDisable()}
            className="min-h-[44px] text-[12px] font-semibold text-slate-600 border border-slate-200 px-4 py-2 rounded-full hover:bg-slate-50 transition-colors disabled:opacity-50 touch-manipulation"
          >
            {busy ? '…' : 'Turn off'}
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy || permission === 'denied'}
          onClick={() => void handleEnable()}
          className="min-h-[44px] text-[12px] font-bold bg-clerk-primary text-slate-950 px-5 py-2.5 rounded-full hover:bg-clerk-primary-dark hover:text-white transition-colors disabled:opacity-50 touch-manipulation"
        >
          {busy ? 'Enabling…' : needsBrowserPermission ? 'Enable notifications' : 'Finish setup'}
        </button>
      )}
    </div>
  )
}
