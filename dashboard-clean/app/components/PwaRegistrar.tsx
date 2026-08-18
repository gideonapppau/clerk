'use client'

import { useEffect } from 'react'

const SW_URL = '/sw.js'

/**
 * Registers the push service worker on every app surface (dashboard + founder).
 * Clears older workers/caches that used to intercept navigations and break pages.
 */
export function PwaRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    void (async () => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(
          regs.map(async (reg) => {
            const scriptURL =
              reg.active?.scriptURL || reg.waiting?.scriptURL || reg.installing?.scriptURL || ''
            // Drop any worker that is not our current /sw.js (or failed to load).
            if (!scriptURL.endsWith(SW_URL)) {
              await reg.unregister()
            }
          })
        )

        if ('caches' in window) {
          const keys = await caches.keys()
          await Promise.all(
            keys
              .filter((k) => k.startsWith('clerk-dash-') && k !== 'clerk-dash-v5')
              .map((k) => caches.delete(k))
          )
        }

        const reg = await navigator.serviceWorker.register(SW_URL, { scope: '/' })
        await reg.update()
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' })
        }
      } catch {
        /* offline/install optional */
      }
    })()
  }, [])

  return null
}
