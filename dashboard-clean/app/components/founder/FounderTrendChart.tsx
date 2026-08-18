'use client'

import type { FounderTimeseriesPoint } from '@/lib/founder-api'

type Props = {
  points: FounderTimeseriesPoint[]
  title?: string
  subtitle?: string
}

function shortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function FounderTrendChart({ points: pointsProp, title = 'Activity trend', subtitle }: Props) {
  const points = pointsProp ?? []
  if (points.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        No activity in this range yet.
      </div>
    )
  }

  const maxVal = Math.max(1, ...points.map((p) => Math.max(p.signups, p.orders)))
  const labelEvery = points.length <= 10 ? 1 : points.length <= 31 ? 5 : 10

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-[0_8px_40px_rgba(15,23,42,0.07)]">
      <div className="mb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-[1.15rem] font-extrabold text-slate-900 font-display">{title}</h2>
          {subtitle && <p className="text-[13px] text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-clerk-primary" />
            Signups
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-slate-300" />
            Orders
          </span>
        </div>
      </div>

      <div className="overflow-x-auto scroll-touch-x -mx-2 px-2 pb-1">
        <div
          className="flex items-end gap-0.5 sm:gap-1 min-w-full"
          style={{ minWidth: `${Math.max(points.length * 12, 260)}px`, height: 148 }}
          role="img"
          aria-label="Signups and orders per day"
        >
          {points.map((p, i) => {
            const signupH = (p.signups / maxVal) * 100
            const orderH = (p.orders / maxVal) * 100
            const showLabel = i % labelEvery === 0 || i === points.length - 1
            return (
              <div key={p.date} className="flex-1 min-w-[10px] flex flex-col items-center justify-end h-full group">
                <div className="flex items-end justify-center gap-0.5 w-full h-[118px] sm:h-[130px]">
                  <div
                    className="w-[42%] rounded-t bg-clerk-primary/85 transition-all group-hover:bg-clerk-primary"
                    style={{ height: `${Math.max(signupH, p.signups > 0 ? 4 : 0)}%` }}
                    title={`${shortDate(p.date)}: ${p.signups} signups`}
                  />
                  <div
                    className="w-[42%] rounded-t bg-slate-300 transition-all group-hover:bg-slate-400"
                    style={{ height: `${Math.max(orderH, p.orders > 0 ? 4 : 0)}%` }}
                    title={`${shortDate(p.date)}: ${p.orders} orders`}
                  />
                </div>
                {showLabel && (
                  <span className="text-[9px] text-slate-400 mt-1.5 tabular-nums whitespace-nowrap">
                    {shortDate(p.date)}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
