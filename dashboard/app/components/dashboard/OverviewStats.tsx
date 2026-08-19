'use client'

import Link from 'next/link'
import { StatSkeleton } from '@/components/EmptyState'
import { Num } from '@/components/Num'
import { useDashboard } from '@/contexts/DashboardContext'
import { routes } from '@/lib/dashboard-routes'

const statCard =
  'group rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 min-h-[100px] sm:min-h-[108px] flex flex-col justify-between hover:border-clerk-primary/35 hover:shadow-[0_8px_30px_rgba(15,23,42,0.06)] active:scale-[0.98] transition-all touch-manipulation'

export function OverviewStats() {
  const { initialLoading, session, waConnected, orders, pendingOrders, conversations, inventory } =
    useDashboard()

  return (
    <section className="ui-enter ui-enter-delay-1 mb-6 sm:mb-8" aria-label="Overview stats">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {initialLoading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <Link href={routes.whatsapp} className={statCard}>
              <div>
                <p
                  className={`font-extrabold text-lg sm:text-xl capitalize font-display leading-tight ${
                    waConnected ? 'text-clerk-primary-darker' : 'text-slate-900'
                  }`}
                >
                  {waConnected ? 'Connected' : 'Not linked'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 tabular-nums">
                  {waConnected && session?.phone ? `+${session.phone}` : 'Tap to connect'}
                </p>
              </div>
            </Link>

            <Link href={routes.orders} className={statCard}>
              <div>
                <p className="font-extrabold text-lg sm:text-xl tabular-nums font-display text-slate-900">
                  <Num>{orders.length}</Num>
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {pendingOrders > 0 ? (
                    <>
                      <Num>{pendingOrders}</Num> pending
                    </>
                  ) : (
                    'All clear'
                  )}
                </p>
              </div>
            </Link>

            <Link href={routes.conversations} className={statCard}>
              <div>
                <p className="font-extrabold text-lg sm:text-xl tabular-nums font-display text-slate-900">
                  <Num>{conversations.length}</Num>
                </p>
                <p className="text-[11px] text-slate-400 mt-1">Active conversations</p>
              </div>
            </Link>

            <Link href={routes.inventory} className={statCard}>
              <div>
                <p className="font-extrabold text-lg sm:text-xl tabular-nums font-display text-slate-900">
                  <Num>{inventory.length}</Num>
                </p>
                <p className="text-[11px] text-slate-400 mt-1">In inventory</p>
              </div>
            </Link>
          </>
        )}
      </div>
    </section>
  )
}
