'use client'

import { secondsAgo } from '@/components/founder/useFounderRefresh'
import { FOUNDER_RANGES, rangeLabel, type FounderRange } from '@/lib/founder-api'
import { useEffect, useState } from 'react'

type Props = {
  days: FounderRange
  onDaysChange: (days: FounderRange) => void
  autoRefresh: boolean
  onAutoRefreshChange: (on: boolean) => void
  lastUpdated: Date | null
  refreshing: boolean
  onRefresh: () => void
}

export function FounderControls({
  days,
  onDaysChange,
  autoRefresh,
  onAutoRefreshChange,
  lastUpdated,
  refreshing,
  onRefresh,
}: Props) {
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!lastUpdated) return
    const id = window.setInterval(() => setTick((t) => t + 1), 10_000)
    return () => window.clearInterval(id)
  }, [lastUpdated])

  const updated = secondsAgo(lastUpdated)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_8px_40px_rgba(15,23,42,0.04)] space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <div className="overflow-x-auto scroll-touch-x -mx-1 px-1">
          <div className="flex items-center gap-1.5 min-w-max">
            {FOUNDER_RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => onDaysChange(r.value)}
                className={`text-[12px] font-semibold px-3.5 py-2 rounded-full transition-colors min-h-[40px] touch-manipulation ${
                  days === r.value
                    ? 'bg-clerk-primary/15 text-clerk-primary-dark'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:justify-end shrink-0">
        {updated && (
          <span className="text-[11px] text-slate-400 tabular-nums w-full sm:w-auto">
            Updated {updated}
            {autoRefresh && ' · auto 60s'}
          </span>
        )}
        <label className="inline-flex items-center gap-2 text-[12px] text-slate-600 cursor-pointer select-none min-h-[40px]">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => onAutoRefreshChange(e.target.checked)}
            className="size-4 rounded border-slate-300 text-clerk-primary focus:ring-clerk-primary/30"
          />
          Auto-refresh
        </label>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-1.5 text-[12px] font-semibold text-slate-600 border border-slate-200 px-4 py-2 rounded-full hover:bg-slate-50 transition-colors disabled:opacity-50 min-h-[40px] touch-manipulation"
        >
          <span
            className={`material-symbols-outlined ${refreshing ? 'animate-spin' : ''}`}
            style={{ fontSize: 16 }}
          >
            refresh
          </span>
          Refresh
        </button>
      </div>
    </div>
  )
}

export function rangeContext(days: FounderRange): string {
  return days === 0 ? 'All time' : `Last ${rangeLabel(days).toLowerCase()}`
}
