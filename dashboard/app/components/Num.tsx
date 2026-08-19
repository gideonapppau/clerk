import type { ReactNode } from 'react'

type NumProps = {
  children: ReactNode
  className?: string
}

export function Num({ children, className }: NumProps) {
  return <span className={className ? `num ${className}` : 'num'}>{children}</span>
}
