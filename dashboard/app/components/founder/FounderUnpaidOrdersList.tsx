'use client'

import { useMemo, useState } from 'react'
import type { FounderDropOffOrder } from '@/lib/founder-api'
import { formatFounderGhs } from '@/components/founder/founder-ui'
import { formatFounderRelative } from '@/lib/founder-format'
import { badgeClass } from '@/lib/dashboard-ui'
import { FounderConversationReplay } from '@/components/founder/FounderConversationReplay'

type Props = {
  orders: FounderDropOffOrder[]
  totalCount: number
}

function OrderMobileRow({
  order,
  onOpen,
}: {
  order: FounderDropOffOrder
  onOpen: () => void
}) {
  const canOpen = Boolean(order.conversationId)

  return (
    <button
      type="button"
      onClick={canOpen ? onOpen : undefined}
      disabled={!canOpen}
      className={`w-full text-left px-4 py-4 transition-colors touch-manipulation ${
        canOpen ? 'hover:bg-slate-50/80 active:bg-slate-50' : 'opacity-60 cursor-not-allowed'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 font-display text-[14px] leading-snug">
            {order.productName}
          </p>
          <p className="text-[12px] text-slate-500 mt-0.5 truncate">{order.merchantName}</p>
        </div>
        <p className="text-[13px] font-bold text-slate-900 tabular-nums shrink-0">
          {formatFounderGhs(order.totalAmount)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
        <span className={badgeClass('pending')}>{order.status.replace(/_/g, ' ')}</span>
        <span className="text-[11px] text-slate-400 tabular-nums">{formatFounderRelative(order.updatedAt)}</span>
        {canOpen && (
          <span className="text-[11px] font-semibold text-clerk-primary-dark ml-auto inline-flex items-center gap-0.5">
            View chat
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              chevron_right
            </span>
          </span>
        )}
      </div>
    </button>
  )
}

export function FounderUnpaidOrdersList({ orders, totalCount }: Props) {
  const [activeOrder, setActiveOrder] = useState<FounderDropOffOrder | null>(null)

  const replayable = useMemo(() => orders.filter((o) => o.conversationId), [orders])

  if (totalCount === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center">
        <span className="material-symbols-outlined text-slate-300 text-4xl mb-3 block">check_circle</span>
        <p className="text-[14px] font-semibold text-slate-700 font-display">No stuck orders</p>
        <p className="text-[13px] text-slate-500 mt-1">
          No Paystack/Moolre orders stuck without a payment link.
        </p>
      </div>
    )
  }

  return (
    <>
      {totalCount > orders.length && (
        <p className="text-[12px] text-slate-500 mb-3">
          Showing {orders.length} most recent of {totalCount}
        </p>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_8px_40px_rgba(15,23,42,0.07)] overflow-hidden">
        <div className="md:hidden divide-y divide-slate-100">
          {orders.map((o) => (
            <OrderMobileRow key={o.orderId} order={o} onOpen={() => setActiveOrder(o)} />
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-[12px] font-semibold text-slate-500">
                <th className="px-4 py-3.5 font-bold">Product</th>
                <th className="px-4 py-3.5 font-bold">Merchant</th>
                <th className="px-4 py-3.5 font-bold">Amount</th>
                <th className="px-4 py-3.5 font-bold">Status</th>
                <th className="px-4 py-3.5 font-bold">Updated</th>
                <th className="px-4 py-3.5 font-bold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((o) => (
                <tr key={o.orderId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5 font-semibold text-slate-900 font-display">{o.productName}</td>
                  <td className="px-4 py-3.5 text-slate-600">{o.merchantName}</td>
                  <td className="px-4 py-3.5 tabular-nums font-medium">{formatFounderGhs(o.totalAmount)}</td>
                  <td className="px-4 py-3.5">
                    <span className={badgeClass('pending')}>{o.status.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 tabular-nums text-[13px]">
                    {formatFounderRelative(o.updatedAt)}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {o.conversationId ? (
                      <button
                        type="button"
                        onClick={() => setActiveOrder(o)}
                        className="text-[12px] font-semibold text-clerk-primary-dark hover:text-clerk-primary px-3 py-1.5 rounded-full bg-clerk-primary/10 transition-colors min-h-[36px] touch-manipulation"
                      >
                        View chat
                      </button>
                    ) : (
                      <span className="text-[12px] text-slate-400">No thread</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {activeOrder && replayable.length > 0 && (
        <FounderConversationReplay
          order={activeOrder}
          orders={replayable}
          onClose={() => setActiveOrder(null)}
          onSelectOrder={setActiveOrder}
        />
      )}
    </>
  )
}
