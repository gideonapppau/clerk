import type { ReactNode } from 'react'

const panelClass =
  'rounded-2xl border border-slate-200 bg-white shadow-[0_8px_40px_rgba(15,23,42,0.07)] overflow-hidden'

type DashPanelProps = {
  id?: string
  children: ReactNode
  className?: string
  padding?: boolean
}

export function DashPanel({ id, children, className = '', padding = true }: DashPanelProps) {
  return (
    <section id={id} className={`${panelClass} ${padding ? 'p-4 sm:p-5' : ''} ${className}`.trim()}>
      {children}
    </section>
  )
}

export function DashPanelHead({
  title,
  action,
}: {
  title: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
      <div className="min-w-0 flex-1">
        <h2 className="text-slate-900 font-semibold text-sm font-display flex flex-wrap items-center gap-x-2 gap-y-1.5 leading-snug">
          {title}
        </h2>
      </div>
      {action ? <div className="shrink-0 w-full sm:w-auto">{action}</div> : null}
    </div>
  )
}

export function DashMuted({ children }: { children: ReactNode }) {
  return <p className="text-slate-500 text-sm leading-relaxed">{children}</p>
}
