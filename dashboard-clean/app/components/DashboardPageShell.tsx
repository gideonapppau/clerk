import type { ReactNode } from 'react'

type DashboardPageShellProps = {
  children: ReactNode
  className?: string
}

/** Dashboard page content width wrapper. */
export function DashboardPageShell({ children, className = '' }: DashboardPageShellProps) {
  const classes = `min-h-[50vh] max-w-5xl mx-auto px-0 sm:px-2 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-10 overflow-x-hidden ${className}`.trim()
  return <div className={classes}>{children}</div>
}
