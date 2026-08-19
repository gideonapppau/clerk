'use client'

import { useDashboard } from '@/contexts/DashboardContext'
import { useEffect, useState } from 'react'

export function DashboardAlerts() {
  const { error } = useDashboard()
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setDismissed(false)
  }, [error])

  if (!error || dismissed) return null

  return (
    <div
      className="ui-enter mb-4 flex items-start gap-2.5 rounded-xl border border-red-200/60 bg-red-50 px-3.5 py-3"
      role="alert"
    >
      <p className="flex-1 min-w-0 text-[13px] text-red-900 leading-snug">{error}</p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="shrink-0 text-[12px] font-semibold text-red-800/70 hover:text-red-900 transition-colors border-0 bg-transparent p-2 -m-2 min-h-[44px] min-w-[44px] touch-manipulation"
      >
        Dismiss
      </button>
    </div>
  )
}
