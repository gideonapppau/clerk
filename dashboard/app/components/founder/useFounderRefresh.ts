'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { FounderRange } from '@/lib/founder-api'

const AUTO_REFRESH_MS = 60_000

export function useFounderRefresh(load: () => Promise<void>, deps: unknown[] = []) {
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const loadRef = useRef(load)

  loadRef.current = load

  const refresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await loadRef.current()
      setLastUpdated(new Date())
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    if (!autoRefresh) return

    const tick = () => {
      if (document.visibilityState === 'visible') void refresh()
    }

    const id = window.setInterval(tick, AUTO_REFRESH_MS)
    return () => window.clearInterval(id)
  }, [autoRefresh, refresh, ...deps])

  return { autoRefresh, setAutoRefresh, lastUpdated, refreshing, refresh }
}

export function secondsAgo(date: Date | null): string | null {
  if (!date) return null
  const sec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (sec < 5) return 'just now'
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  return `${min}m ago`
}
