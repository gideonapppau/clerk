import type { ReactNode } from 'react'

type EmptyStateProps = {
  icon?: string
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center py-8 px-4 sm:py-10">
      <p className="text-[13px] font-semibold text-slate-800 font-display">{title}</p>
      <p className="text-[13px] text-slate-500 mt-1 max-w-xs leading-relaxed">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto -mx-1 px-1 mt-2">{children}</div>
}

export function StatSkeleton() {
  return <div className="rounded-2xl bg-white border border-slate-200 animate-pulse min-h-[108px]" />
}
