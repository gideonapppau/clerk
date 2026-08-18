'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import { Num } from '@/components/Num'
import { useDashboard } from '@/contexts/DashboardContext'
import { routes } from '@/lib/dashboard-routes'
import { badgeClass } from '@/lib/dashboard-ui'
import { formatProductName } from '@/lib/format'
import type { Order } from '@/lib/api'

const chipClass =
  'inline-flex flex-wrap items-center gap-x-2.5 gap-y-1 px-4 py-2.5 rounded-2xl sm:rounded-full bg-white border border-clerk-primary/20 hover:border-clerk-primary/35 transition-colors w-full sm:w-auto max-w-full min-w-0 touch-manipulation'

function orderSummary(order: Order): string {
  const item = order.items?.[0]
  if (!item) return 'Order'
  return formatProductName(item.product)
}

function ordersHref(order: Order, pendingCount: number): string {
  if (pendingCount === 1) return `${routes.orders}?order=${order.id}`
  return routes.orders
}

function formatAmt(n: number): string {
  return n.toLocaleString('en-GB', { maximumFractionDigits: 0 })
}

/** Small chip — same weight as “Test a message” / “Add products”. */
export function PendingOrderChip() {
  const pathname = usePathname()
  const { orders, initialLoading } = useDashboard()

  const pending = useMemo(
    () =>
      orders
        .filter((o) => o.status === 'PENDING_CONFIRMATION')
        .sort((a, b) => {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return tb - ta
        }),
    [orders]
  )

  if (initialLoading || pending.length === 0 || pathname === routes.orders) return null

  const order = pending[0]
  const more = pending.length - 1
  const href = ordersHref(order, pending.length)

  return (
    <Link href={href} className={chipClass} aria-live="polite">
      {pending.length > 1 && (
        <span className={badgeClass('pending')}>
          <Num>{pending.length}</Num>
        </span>
      )}
      <span className="truncate text-[13px] font-extrabold text-slate-900 font-display tracking-tight">
        {orderSummary(order)}
      </span>
      <span className="text-slate-300 shrink-0" aria-hidden>
        ·
      </span>
      <span className="text-[13px] font-bold text-slate-900 tabular-nums font-display shrink-0">
        GHS <Num>{formatAmt(order.subtotal)}</Num>
      </span>
      {more > 0 && (
        <span className="text-[11px] font-semibold text-slate-500 shrink-0">
          +<Num>{more}</Num>
        </span>
      )}
    </Link>
  )
}

export function PendingOrderBadge({ className = '' }: { className?: string }) {
  const { pendingOrders, initialLoading } = useDashboard()
  if (initialLoading || pendingOrders === 0) return null

  return (
    <span className={`${badgeClass('pending')} tabular-nums ${className}`}>
      {pendingOrders > 9 ? '9+' : <Num>{pendingOrders}</Num>}
    </span>
  )
}
