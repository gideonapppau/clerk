import type { ReactNode } from 'react'
import { formatGhs } from '@/lib/money'
import { badgeClass } from '@/lib/dashboard-ui'

type Props = {
  planName: string
  statusLabel: string
  statusTone: 'success' | 'muted' | 'pending'
  amount?: number
  detail?: ReactNode
}

const cardClass =
  'bg-white rounded-2xl border border-slate-200 shadow-[0_8px_40px_rgba(15,23,42,0.07)] overflow-hidden'

export function PlanSummaryCard({ planName, statusLabel, statusTone, amount, detail }: Props) {
  return (
    <div className={cardClass}>
      <div className="px-4 sm:px-5 py-4 border-b border-slate-100">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-[15px] leading-snug capitalize font-display break-words">
              {planName}
            </p>
            {detail ? (
              <div className="text-[13px] text-slate-500 mt-0.5 leading-relaxed break-words">{detail}</div>
            ) : null}
          </div>
          {amount != null && amount > 0 && (
            <p className="font-display text-lg font-extrabold text-slate-900 tabular-nums shrink-0">
              {formatGhs(amount)}
              <span className="text-[13px] font-medium text-slate-500">/mo</span>
            </p>
          )}
        </div>
      </div>
      <div className="px-4 sm:px-5 py-3.5 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600">Subscription</p>
        <span className={`${badgeClass(statusTone)} capitalize ml-auto`}>{statusLabel}</span>
      </div>
    </div>
  )
}
