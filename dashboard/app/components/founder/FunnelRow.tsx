'use client'

export function FunnelRow({
  label,
  count,
  total,
  prevCount,
}: {
  label: string
  count: number
  total: number
  prevCount: number
}) {
  const pctOfTotal = total > 0 ? Math.round((count / total) * 100) : 0
  const barPct = total > 0 ? Math.max((count / total) * 100, count > 0 ? 4 : 0) : 0
  const dropFromPrev =
    prevCount > 0 ? Math.round(((prevCount - count) / prevCount) * 100) : null

  return (
    <div className="flex flex-col gap-2 py-3.5 border-b border-slate-100 last:border-0 sm:flex-row sm:items-center sm:gap-4">
      <div className="sm:w-32 shrink-0">
        <p className="text-[12px] font-semibold text-slate-800 font-display">{label}</p>
        {dropFromPrev !== null && dropFromPrev > 0 && (
          <p className="text-[10px] text-slate-400 mt-0.5">−{dropFromPrev}% from prev</p>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-clerk-primary transition-all duration-500"
            style={{ width: `${barPct}%` }}
          />
        </div>
      </div>
      <div className="flex items-baseline gap-2 sm:w-24 sm:justify-end shrink-0">
        <p className="text-lg font-extrabold text-slate-900 tabular-nums font-display">{count}</p>
        <p className="text-[11px] text-slate-400 tabular-nums">{pctOfTotal}%</p>
      </div>
    </div>
  )
}
