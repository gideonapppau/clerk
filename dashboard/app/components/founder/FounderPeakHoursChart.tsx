'use client'

import type { FounderPeakHours } from '@/lib/founder-api'

type Props = {
  data: FounderPeakHours
}

function formatHour(h: number): string {
  if (h === 0) return '12am'
  if (h < 12) return `${h}am`
  if (h === 12) return '12pm'
  return `${h - 12}pm`
}

export function FounderPeakHoursChart({ data }: Props) {
  const hours = data.hours ?? []
  const maxVal = Math.max(1, ...hours.map((b) => b.count))

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-[0_8px_40px_rgba(15,23,42,0.07)]">
      <div className="mb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-[1.15rem] font-extrabold text-slate-900 font-display">Peak message hours</h2>
          <p className="text-[13px] text-slate-500 mt-1">
            Customer messages · last {data.days} days · UTC
          </p>
        </div>
        <div className="text-[12px] text-slate-600">
          <span className="font-semibold text-slate-900 tabular-nums">{data.overnightPct}%</span>
          {' '}overnight (10pm–6am) · peak {formatHour(data.peakHour)}
        </div>
      </div>

      <div className="overflow-x-auto scroll-touch-x -mx-2 px-2 pb-1">
        <div
          className="flex items-end gap-1 min-w-full"
          style={{ minWidth: 480, height: 140 }}
          role="img"
          aria-label="Customer messages by hour of day"
        >
          {hours.map((b) => {
            const h = (b.count / maxVal) * 100
            const overnight = b.hour >= 22 || b.hour < 6
            return (
              <div key={b.hour} className="flex-1 min-w-[14px] flex flex-col items-center justify-end h-full">
                <div
                  className={`w-full rounded-t-md transition-all ${
                    overnight ? 'bg-indigo-400/80' : 'bg-clerk-primary/70'
                  }`}
                  style={{ height: `${Math.max(h, b.count > 0 ? 6 : 0)}%` }}
                  title={`${formatHour(b.hour)}: ${b.count} messages`}
                />
                {b.hour % 3 === 0 && (
                  <span className="text-[9px] text-slate-400 mt-1 tabular-nums">{formatHour(b.hour)}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
