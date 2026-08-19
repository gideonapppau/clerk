'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { routes } from '@/lib/dashboard-routes'
import { badgeClass } from '@/lib/dashboard-ui'

const panelClass =
  'rounded-2xl bg-white border border-slate-200 shadow-[0_8px_40px_rgba(15,23,42,0.07)] overflow-hidden'

type AttentionItem = {
  label: string
  detail: string
  href: string
  tone: 'urgent' | 'warning' | 'neutral'
}

export function OverviewHub() {
  const {
    initialLoading,
    waConnected,
    inventory,
    pendingOrders,
    hasMomoOrPaystack,
  } = useDashboard()

  const lowStock = inventory.filter((i) => i.stock > 0 && i.stock <= 3).length
  const outOfStock = inventory.filter((i) => i.stock === 0).length

  const attention = useMemo(() => {
    const items: AttentionItem[] = []

    if (pendingOrders > 0) {
      items.push({
        label: `${pendingOrders} order${pendingOrders === 1 ? '' : 's'} to approve`,
        detail: 'Customers are waiting for confirmation',
        href: routes.orders,
        tone: 'urgent',
      })
    }

    if (!waConnected) {
      items.push({
        label: 'WhatsApp not connected',
        detail: 'Clerk cannot reply until you link your number',
        href: routes.whatsapp,
        tone: 'urgent',
      })
    }

    if (inventory.length === 0) {
      items.push({
        label: 'Catalog is empty',
        detail: 'Add products so Clerk can answer price questions',
        href: routes.inventory,
        tone: 'warning',
      })
    }

    if (outOfStock > 0) {
      items.push({
        label: `${outOfStock} product${outOfStock === 1 ? '' : 's'} out of stock`,
        detail: 'Update stock or Clerk may turn buyers away',
        href: routes.inventory,
        tone: 'warning',
      })
    } else if (lowStock > 0) {
      items.push({
        label: `${lowStock} product${lowStock === 1 ? '' : 's'} running low`,
        detail: 'Stock at 3 or fewer units',
        href: routes.inventory,
        tone: 'neutral',
      })
    }

    if (!hasMomoOrPaystack && waConnected && inventory.length > 0) {
      items.push({
        label: 'No payment method',
        detail: 'Set up Moolre or Paystack for checkout',
        href: routes.payments,
        tone: 'neutral',
      })
    }

    return items
  }, [pendingOrders, waConnected, inventory.length, outOfStock, lowStock, hasMomoOrPaystack])

  if (initialLoading || attention.length === 0) return null

  return (
    <section className="mb-6 ui-enter" aria-label="Needs attention">
      <div className={panelClass}>
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100">
          <h2 className="text-[14px] font-semibold text-slate-900 font-display">Needs attention</h2>
        </div>

        <ul className="divide-y divide-slate-100">
          {attention.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className="flex items-start justify-between gap-3 px-4 sm:px-5 py-4 min-h-[56px] hover:bg-slate-50/80 active:bg-slate-50 transition-colors group touch-manipulation"
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-slate-900 group-hover:text-clerk-primary-darker transition-colors">
                    {item.label}
                  </p>
                  <p className="text-[12px] text-slate-500 mt-0.5">{item.detail}</p>
                </div>
                <span
                  className={`shrink-0 self-center ${
                    item.tone === 'urgent'
                      ? badgeClass('danger')
                      : item.tone === 'warning'
                        ? badgeClass('low')
                        : badgeClass('neutral')
                  }`}
                >
                  {item.tone === 'urgent' ? 'Act' : 'View'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
