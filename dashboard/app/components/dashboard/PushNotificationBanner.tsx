'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  dismissPushBanner,
  getNotificationPermission,
  pushNotificationsComplete,
  pushSupported,
  PUSH_BANNER_DISMISS_KEY,
} from '@/lib/push'
import { routes } from '@/lib/dashboard-routes'

export function PushNotificationBanner() {
  const [show, setShow] = useState(false)
  const pathname = usePathname()

  const refresh = useCallback(async () => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem(PUSH_BANNER_DISMISS_KEY)) {
      setShow(false)
      return
    }
    if (!pushSupported()) {
      setShow(false)
      return
    }
    if (await pushNotificationsComplete()) {
      dismissPushBanner()
      setShow(false)
      return
    }
    const permission = await getNotificationPermission()
    setShow(permission === 'default' || permission === 'granted')
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh, pathname])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    window.addEventListener('focus', onVisible)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('focus', onVisible)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh])

  if (!show) return null

  function dismiss() {
    dismissPushBanner()
    setShow(false)
  }

  return (
    <div className="ui-enter mb-4 flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-clerk-primary/20 bg-clerk-light/50 px-4 py-3">
      <p className="flex-1 text-[13px] text-slate-800 leading-snug">
        Turn on notifications to hear when customers need you or place orders.
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href={routes.settings}
          className="min-h-[40px] inline-flex items-center text-[12px] font-bold bg-clerk-primary text-slate-950 px-4 py-2 rounded-full hover:bg-clerk-primary-dark hover:text-white transition-colors touch-manipulation"
        >
          Enable
        </Link>
        <button
          type="button"
          onClick={dismiss}
          className="min-h-[40px] text-[12px] font-semibold text-slate-500 px-3 py-2 touch-manipulation"
        >
          Not now
        </button>
      </div>
    </div>
  )
}
