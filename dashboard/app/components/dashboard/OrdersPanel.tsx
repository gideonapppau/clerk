'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { DashPanel, DashPanelHead } from '@/components/DashPanel'
import { EmptyState } from '@/components/EmptyState'
import { ListScrollArea, ListSearchInput, ListShowMoreFooter } from '@/components/dashboard/ListControls'
import { Num } from '@/components/Num'
import { useDashboard } from '@/contexts/DashboardContext'
import { routes } from '@/lib/dashboard-routes'
import { badgeClass } from '@/lib/dashboard-ui'
import { formatProductName } from '@/lib/format'
import { CustomerIdentity } from '@/components/CustomerIdentity'
import type { Order } from '@/lib/api'
import { usePagedList } from '@/lib/use-paged-list'

function orderCustomerProps(o: Order) {
  return {
    customerName: o.customerName,
    customerContact: o.customerContact,
    customerPhoneDisplay: o.customerPhoneDisplay,
    customerChatUrl: o.customerChatUrl,
    customerChatDeepLink: o.customerChatDeepLink,
    customerPrivacyHidden: o.customerPrivacyHidden,
    raw: o.customerPhone,
  }
}

const thClass =
  'text-left text-[12px] font-semibold text-slate-500 px-4 sm:px-5 py-2.5'

const refreshBtn =
  'w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center text-[12px] font-semibold text-slate-600 border border-slate-200 bg-white px-4 py-2 rounded-full hover:border-slate-300 transition-colors touch-manipulation'

const actionPrimary =
  'flex-1 min-h-[44px] inline-flex items-center justify-center text-[12px] font-bold bg-clerk-primary text-slate-950 px-3 py-2.5 rounded-full hover:bg-clerk-primary-dark hover:text-white transition-colors disabled:opacity-50 touch-manipulation'

const actionSecondary =
  'flex-1 min-h-[44px] inline-flex items-center justify-center text-[12px] font-semibold text-slate-600 border border-slate-200 px-3 py-2.5 rounded-full hover:bg-slate-50 transition-colors disabled:opacity-50 touch-manipulation'

type MobileFilter = 'all' | 'pending' | 'done'

function formatStatus(status: string): string {
  switch (status) {
    case 'PENDING_CONFIRMATION':
      return 'Awaiting you'
    case 'CONFIRMED':
      return 'Confirmed'
    case 'CANCELLED':
      return 'Declined'
    default:
      return status.replace(/_/g, ' ').toLowerCase()
  }
}

function statusTone(status: string): 'pending' | 'success' | 'danger' | 'muted' {
  if (status === 'PENDING_CONFIRMATION') return 'pending'
  if (status === 'CONFIRMED') return 'success'
  if (status === 'CANCELLED') return 'danger'
  return 'muted'
}

function formatWhen(iso?: string): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const now = Date.now()
  const diff = now - d.getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function sortOrders(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => {
    const aPending = a.status === 'PENDING_CONFIRMATION' ? 1 : 0
    const bPending = b.status === 'PENDING_CONFIRMATION' ? 1 : 0
    if (aPending !== bPending) return bPending - aPending
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return tb - ta
  })
}

function matchesOrderSearch(o: Order, q: string): boolean {
  const item = o.items?.[0]?.product ?? ''
  const haystack = [
    o.customerName,
    o.customerContact,
    o.customerPhoneDisplay,
    o.customerPhone,
    item,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(q)
}

function filterTab(active: boolean) {
  return `shrink-0 min-h-[44px] inline-flex items-center pb-2.5 text-[13px] font-semibold border-b-2 transition-colors touch-manipulation whitespace-nowrap ${
    active ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500'
  }`
}

export function OrdersPanel() {
  const searchParams = useSearchParams()
  const highlightId = searchParams.get('order')
  const { orders, pendingOrders, inventory, busyOrder, loadAll, handleConfirmOrder, handleCancelOrder } =
    useDashboard()

  const [mobileFilter, setMobileFilter] = useState<MobileFilter>(
    highlightId ? 'all' : pendingOrders > 0 ? 'pending' : 'all',
  )
  const [search, setSearch] = useState('')

  const sorted = useMemo(() => sortOrders(orders), [orders])

  const searchedOrders = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return sorted
    return sorted.filter((o) => matchesOrderSearch(o, q))
  }, [sorted, search])

  const mobileOrders = useMemo(() => {
    if (mobileFilter === 'pending') {
      return searchedOrders.filter((o) => o.status === 'PENDING_CONFIRMATION')
    }
    if (mobileFilter === 'done') {
      return searchedOrders.filter((o) => o.status !== 'PENDING_CONFIRMATION')
    }
    return searchedOrders
  }, [searchedOrders, mobileFilter])

  const {
    visible: visibleMobileOrders,
    hasMore: mobileHasMore,
    total: mobileTotal,
    showing: mobileShowing,
    loadMore: loadMoreMobile,
    ensureIndexVisible: ensureMobileVisible,
  } = usePagedList(mobileOrders, 30, `${search}:${mobileFilter}`)

  const {
    visible: visibleDesktopOrders,
    hasMore: desktopHasMore,
    total: desktopTotal,
    showing: desktopShowing,
    loadMore: loadMoreDesktop,
    ensureIndexVisible: ensureDesktopVisible,
  } = usePagedList(searchedOrders, 30, search)

  useEffect(() => {
    if (!highlightId) return
    const mobileIdx = mobileOrders.findIndex((o) => o.id === highlightId)
    const desktopIdx = searchedOrders.findIndex((o) => o.id === highlightId)
    ensureMobileVisible(mobileIdx)
    ensureDesktopVisible(desktopIdx)
  }, [highlightId, mobileOrders, searchedOrders, ensureMobileVisible, ensureDesktopVisible])

  useEffect(() => {
    if (!highlightId) return
    const row = document.getElementById(`order-row-${highlightId}`)
    row?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [highlightId, orders, mobileShowing, desktopShowing])

  const doneCount = orders.length - pendingOrders

  return (
    <DashPanel className="ui-enter ui-enter-delay-1" padding={false}>
      <div className="p-4 sm:p-5 border-b border-slate-100">
        <DashPanelHead
          title={
            <>
              Orders · <Num>{orders.length}</Num>
              {pendingOrders > 0 && (
                <span className={`ml-2 align-middle ${badgeClass('pending')}`}>
                  <Num>{pendingOrders}</Num> pending
                </span>
              )}
            </>
          }
          action={
            <button type="button" className={refreshBtn} onClick={() => void loadAll()}>
              Refresh
            </button>
          }
        />

        {orders.length > 4 && (
          <div className="mt-4">
            <ListSearchInput
              id="orders-search"
              value={search}
              onChange={setSearch}
              placeholder="Search customer or product…"
            />
          </div>
        )}

        {orders.length > 0 && (
          <div className="lg:hidden -mx-4 sm:-mx-5 px-4 sm:px-5 mt-4 border-b border-slate-100 overflow-x-auto scroll-touch-x">
            <div className="flex gap-5 min-w-max pb-px">
              <button type="button" className={filterTab(mobileFilter === 'all')} onClick={() => setMobileFilter('all')}>
                All (<Num>{orders.length}</Num>)
              </button>
              <button
                type="button"
                className={filterTab(mobileFilter === 'pending')}
                onClick={() => setMobileFilter('pending')}
              >
                Pending (<Num>{pendingOrders}</Num>)
              </button>
              <button
                type="button"
                className={filterTab(mobileFilter === 'done')}
                onClick={() => setMobileFilter('done')}
              >
                Done (<Num>{doneCount}</Num>)
              </button>
            </div>
          </div>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="p-4 sm:p-5">
          <EmptyState
            title="No orders yet"
            description="Orders appear here when a customer confirms a purchase on WhatsApp."
            action={
              inventory.length === 0 ? (
                <Link href={routes.inventory} className="text-sm font-semibold text-clerk-primary-darker hover:underline">
                  Add products first
                </Link>
              ) : (
                <Link href={routes.whatsapp} className="text-sm font-semibold text-clerk-primary-darker hover:underline">
                  Try on WhatsApp
                </Link>
              )
            }
          />
        </div>
      ) : (
        <>
          <ListScrollArea className="lg:hidden divide-y divide-slate-100 border-t border-slate-100">
            {mobileOrders.length === 0 ? (
              <p className="text-center text-[13px] text-slate-500 py-10 px-4">
                {search.trim()
                  ? `No orders match "${search.trim()}".`
                  : mobileFilter === 'pending'
                    ? 'No pending orders.'
                    : 'No completed orders yet.'}
              </p>
            ) : (
              visibleMobileOrders.map((o) => {
                const item = o.items?.[0]
                const pending = o.status === 'PENDING_CONFIRMATION'
                const when = formatWhen(o.createdAt)
                return (
                  <div
                    key={o.id}
                    id={`order-row-${o.id}`}
                    className={`px-4 sm:px-5 py-4 scroll-mt-24 ${
                      pending ? 'bg-clerk-light/30' : ''
                    } ${highlightId === o.id ? 'bg-clerk-light/50 ring-2 ring-inset ring-clerk-primary/40' : ''}`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold text-slate-900 leading-snug">
                          {item ? (
                            <>
                              {formatProductName(item.product)} × <Num>{item.qty}</Num>
                            </>
                          ) : (
                            'Order'
                          )}
                        </p>
                        <CustomerIdentity {...orderCustomerProps(o)} compact />
                        {when ? (
                          <p className="text-[11px] text-slate-400 mt-1">{when}</p>
                        ) : null}
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:block sm:text-right sm:shrink-0">
                        <p className="text-[15px] font-bold text-slate-900 tabular-nums">
                          GHS <Num>{o.subtotal.toLocaleString()}</Num>
                        </p>
                        {pending ? (
                          <span className={badgeClass('pending')}>{formatStatus(o.status)}</span>
                        ) : (
                          <span className={`sm:mt-1.5 inline-block ${badgeClass(statusTone(o.status))}`}>
                            {formatStatus(o.status)}
                          </span>
                        )}
                      </div>
                    </div>
                    {pending && (
                      <div className="flex gap-2 mt-3">
                        <button
                          type="button"
                          disabled={busyOrder === o.id}
                          onClick={() => void handleConfirmOrder(o.id, o.customerPhone)}
                          className={actionPrimary}
                        >
                          {busyOrder === o.id ? '…' : 'Confirm'}
                        </button>
                        <button
                          type="button"
                          disabled={busyOrder === o.id}
                          onClick={() => void handleCancelOrder(o.id, o.customerPhone)}
                          className={actionSecondary}
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </ListScrollArea>
          <div className="lg:hidden">
            <ListShowMoreFooter
              showing={mobileShowing}
              total={mobileTotal}
              hasMore={mobileHasMore}
              onLoadMore={loadMoreMobile}
            />
          </div>

          <div className="hidden lg:block border-t border-slate-100">
            <ListScrollArea>
              <table className="w-full text-[13px]">
                <thead className="sticky top-0 z-10 bg-white">
                  <tr className="border-b border-slate-100 shadow-[0_1px_0_0_rgb(241,245,249)]">
                  <th className={thClass}>Customer</th>
                  <th className={`${thClass} px-3`}>Item</th>
                  <th className={`${thClass} px-3`}>Amount</th>
                  <th className={`${thClass} px-3`}>Status</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {searchedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-[13px] text-slate-500">
                      {search.trim() ? `No orders match "${search.trim()}".` : 'No orders yet.'}
                    </td>
                  </tr>
                ) : (
                  visibleDesktopOrders.map((o) => {
                  const item = o.items?.[0]
                  const pending = o.status === 'PENDING_CONFIRMATION'
                  return (
                    <tr
                      key={o.id}
                      id={`order-row-${o.id}`}
                      className={`${pending ? 'bg-clerk-light/40' : ''} ${
                        highlightId === o.id ? 'ring-2 ring-inset ring-clerk-primary/50' : ''
                      } hover:bg-slate-50/80 transition-colors`}
                    >
                      <td className="px-4 sm:px-5 py-3">
                        <CustomerIdentity {...orderCustomerProps(o)} compact />
                        {formatWhen(o.createdAt) && (
                          <p className="text-[11px] text-slate-400 mt-0.5">{formatWhen(o.createdAt)}</p>
                        )}
                      </td>
                      <td className="px-3 py-3 text-slate-600 max-w-[200px]">
                        {item ? (
                          <span className="line-clamp-2">
                            {formatProductName(item.product)} × <Num>{item.qty}</Num>
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-3 py-3 text-slate-800 font-semibold tabular-nums whitespace-nowrap">
                        GHS <Num>{o.subtotal.toLocaleString()}</Num>
                      </td>
                      <td className="px-3 py-3">
                        <span className={badgeClass(statusTone(o.status))}>{formatStatus(o.status)}</span>
                      </td>
                      <td className="px-3 py-3">
                        {pending && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={busyOrder === o.id}
                              onClick={() => void handleConfirmOrder(o.id, o.customerPhone)}
                              className="text-[12px] font-bold bg-clerk-primary text-slate-950 px-3 py-1.5 rounded-full hover:bg-clerk-primary-dark hover:text-white transition-colors disabled:opacity-50 whitespace-nowrap"
                            >
                              {busyOrder === o.id ? '…' : 'Confirm'}
                            </button>
                            <button
                              type="button"
                              disabled={busyOrder === o.id}
                              onClick={() => void handleCancelOrder(o.id, o.customerPhone)}
                              className="text-[12px] font-semibold text-slate-600 border border-slate-200 px-3 py-1.5 rounded-full hover:bg-slate-50 transition-colors disabled:opacity-50 whitespace-nowrap"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                  })
                )}
              </tbody>
            </table>
            </ListScrollArea>
            <ListShowMoreFooter
              showing={desktopShowing}
              total={desktopTotal}
              hasMore={desktopHasMore}
              onLoadMore={loadMoreDesktop}
            />
          </div>
        </>
      )}
    </DashPanel>
  )
}
