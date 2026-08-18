'use client'

import Link from 'next/link'
import { useDashboard } from '@/contexts/DashboardContext'
import { routes } from '@/lib/dashboard-routes'
import { badgeClass } from '@/lib/dashboard-ui'
import { CustomerIdentity } from '@/components/CustomerIdentity'
import { formatProductName } from '@/lib/format'

const MODE_DOT: Record<string, string> = {
  BOT: 'bg-clerk-primary',
  HUMAN: 'bg-clerk-primary-dark',
}

const panelClass = 'bg-white rounded-2xl border border-slate-200 shadow-[0_8px_40px_rgba(15,23,42,0.07)] overflow-hidden'

function fmtAmt(n: number) {
  return n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function OverviewBody() {
  const { conversations, orders, initialLoading } = useDashboard()

  const liveConvs = conversations.filter((c) => c.status !== 'closed').slice(0, 6)
  const recentOrders = orders.slice(0, 6)

  return (
    <div className="space-y-4 ui-enter ui-enter-delay-1 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className={panelClass} aria-label="Active conversations">
          <div className="px-4 py-3.5 flex items-center justify-between border-b border-slate-100">
            <div>
              <h2 className="text-[13px] font-semibold text-slate-900 font-display">Conversations</h2>
            </div>
            <Link
              href={routes.conversations}
              className="min-h-[44px] inline-flex items-center text-[11px] sm:text-[12px] font-semibold text-clerk-primary-darker hover:underline touch-manipulation px-1 -mr-1"
            >
              View all
            </Link>
          </div>

          {initialLoading ? (
            <div className="divide-y divide-slate-50">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                  <div className="size-8 rounded-full bg-slate-100 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 bg-slate-100 rounded-full w-24" />
                    <div className="h-2 bg-slate-100 rounded-full w-36" />
                  </div>
                </div>
              ))}
            </div>
          ) : liveConvs.length === 0 ? (
            <div className="py-10 px-4 text-center">
              <p className="text-[13px] text-slate-500">No active conversations yet</p>
              <p className="text-[12px] text-slate-400 mt-1">They&apos;ll show up here when customers message you</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {liveConvs.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 px-4 py-3.5 min-h-[52px] hover:bg-slate-50/80 transition-colors touch-manipulation"
                >
                  <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-[11px] font-bold text-slate-500 select-none">
                    {(c.customerName ?? c.customerContact ?? c.customer ?? '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <CustomerIdentity
                      customerName={c.customerName}
                      customerContact={c.customerContact}
                      customerPhoneDisplay={c.customerPhoneDisplay}
                      customerChatUrl={c.customerChatUrl}
                      customerChatDeepLink={c.customerChatDeepLink}
                      customerPrivacyHidden={c.customerPrivacyHidden}
                      raw={c.customer}
                      compact
                    />
                    <p className="text-[11px] text-slate-400 truncate mt-1">{c.lastMessage || '—'}</p>
                  </div>
                  {MODE_DOT[c.mode] && (
                    <div className={`size-1.5 rounded-full shrink-0 ${MODE_DOT[c.mode]}`} title={c.mode} />
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={panelClass} aria-label="Recent orders">
          <div className="px-4 py-3.5 flex items-center justify-between border-b border-slate-100">
            <div>
              <h2 className="text-[13px] font-semibold text-slate-900 font-display">Recent orders</h2>
            </div>
            <Link
              href={routes.orders}
              className="min-h-[44px] inline-flex items-center text-[11px] sm:text-[12px] font-semibold text-clerk-primary-darker hover:underline touch-manipulation px-1 -mr-1"
            >
              View all
            </Link>
          </div>

          {initialLoading ? (
            <div className="divide-y divide-slate-50">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 bg-slate-100 rounded-full w-32" />
                    <div className="h-2 bg-slate-100 rounded-full w-20" />
                  </div>
                  <div className="h-5 w-14 bg-slate-100 rounded-full" />
                </div>
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="py-10 px-4 text-center">
              <p className="text-[13px] text-slate-500">No orders yet</p>
              <p className="text-[12px] text-slate-400 mt-1">Orders from WhatsApp will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentOrders.map((o) => {
                const product = o.items?.[0]?.product ?? '—'
                const qty = o.items?.[0]?.qty
                const pending = o.status === 'PENDING_CONFIRMATION'
                const confirmed = o.status === 'CONFIRMED'
                return (
                  <Link
                    key={o.id}
                    href={`${routes.orders}?order=${o.id}`}
                    className={`flex items-start sm:items-center gap-3 px-4 py-4 min-h-[56px] hover:bg-slate-50/80 active:bg-slate-50 transition-colors touch-manipulation ${
                      pending ? 'bg-clerk-light/25' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-slate-900 leading-snug break-words">{formatProductName(product)}</p>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap items-baseline gap-x-1">
                        <CustomerIdentity
                          customerName={o.customerName}
                          customerContact={o.customerContact}
                          customerPhoneDisplay={o.customerPhoneDisplay}
                          customerChatUrl={o.customerChatUrl}
                          customerChatDeepLink={o.customerChatDeepLink}
                          customerPrivacyHidden={o.customerPrivacyHidden}
                          raw={o.customerPhone}
                          compact
                        />
                        {qty ? <span>· ×{qty}</span> : null}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {o.subtotal > 0 && (
                        <span className="text-[13px] font-bold tabular-nums text-slate-900">
                          GHS {fmtAmt(o.subtotal)}
                        </span>
                      )}
                      <span
                        className={
                          pending
                            ? badgeClass('pending')
                            : confirmed
                              ? badgeClass('success')
                              : o.status === 'CANCELLED'
                                ? badgeClass('danger')
                                : badgeClass('muted')
                        }
                      >
                        {pending ? 'Awaiting you' : confirmed ? 'Confirmed' : o.status.replace(/_/g, ' ').toLowerCase()}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
