'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchFounderConversationReplay,
  type FounderDropOffOrder,
  type FounderReplayMessage,
} from '@/lib/founder-api'
import { formatFounderGhs } from '@/components/founder/founder-ui'
import { formatFounderRelative } from '@/lib/founder-format'
import { badgeClass } from '@/lib/dashboard-ui'

function formatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

type Props = {
  order: FounderDropOffOrder
  orders: FounderDropOffOrder[]
  onClose: () => void
  onSelectOrder: (order: FounderDropOffOrder) => void
}

export function FounderConversationReplay({ order, orders, onClose, onSelectOrder }: Props) {
  const [messages, setMessages] = useState<FounderReplayMessage[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const closeRef = useRef<HTMLButtonElement>(null)

  const currentIndex = orders.findIndex((o) => o.orderId === order.orderId)
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex >= 0 && currentIndex < orders.length - 1

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    setMessages(null)
    if (!order.conversationId) {
      setError('No WhatsApp thread linked to this order.')
      setLoading(false)
      return
    }
    try {
      setMessages(await fetchFounderConversationReplay(order.conversationId))
    } catch {
      setError("Couldn't load messages.")
    } finally {
      setLoading(false)
    }
  }, [order.conversationId, order.orderId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    closeRef.current?.focus()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col justify-end lg:justify-center lg:items-center lg:p-6 bg-slate-900/40"
      role="presentation"
    >
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />

      <div
        className="conversation-sheet relative w-full lg:max-w-lg max-h-[min(92dvh,720px)] lg:max-h-[min(85dvh,680px)] flex flex-col overflow-hidden rounded-t-2xl lg:rounded-2xl border border-slate-200 bg-white shadow-[0_-12px_48px_-8px_rgba(15,23,42,0.18)] lg:shadow-[0_8px_40px_rgba(15,23,42,0.12)] pb-[env(safe-area-inset-bottom)]"
        role="dialog"
        aria-modal="true"
        aria-label="Conversation replay"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lg:hidden shrink-0 flex justify-center pt-2.5 pb-1" aria-hidden>
          <div className="w-9 h-1 rounded-full bg-slate-200" />
        </div>

        <div className="shrink-0 px-4 sm:px-5 pt-2 lg:pt-4 pb-3 border-b border-slate-100 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-slate-900 font-display leading-snug truncate">
              {order.productName}
            </p>
            <p className="text-[12px] text-slate-500 mt-0.5 truncate">{order.merchantName}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-[13px] font-semibold text-slate-800 tabular-nums">
                {formatFounderGhs(order.totalAmount)}
              </span>
              <span className={badgeClass('pending')}>{order.status.replace(/_/g, ' ')}</span>
              <span className="text-[11px] text-slate-400">{formatFounderRelative(order.updatedAt)}</span>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="size-11 lg:size-9 shrink-0 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors touch-manipulation"
            aria-label="Close"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              close
            </span>
          </button>
        </div>

        {orders.length > 1 && (
          <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-2 border-b border-slate-100 bg-slate-50/80">
            <button
              type="button"
              disabled={!hasPrev}
              onClick={() => hasPrev && onSelectOrder(orders[currentIndex - 1])}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-600 disabled:opacity-30 min-h-[40px] px-2 touch-manipulation"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                chevron_left
              </span>
              Prev
            </button>
            <span className="text-[11px] text-slate-500 tabular-nums">
              {currentIndex + 1} of {orders.length}
            </span>
            <button
              type="button"
              disabled={!hasNext}
              onClick={() => hasNext && onSelectOrder(orders[currentIndex + 1])}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-600 disabled:opacity-30 min-h-[40px] px-2 touch-manipulation"
            >
              Next
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                chevron_right
              </span>
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 py-4 min-h-0">
          {loading && (
            <div className="space-y-3 animate-pulse">
              <div className="h-12 w-[70%] bg-slate-100 rounded-2xl" />
              <div className="h-16 w-[75%] ml-auto bg-slate-100 rounded-2xl" />
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center">
              <p className="text-[13px] text-slate-600 mb-3">{error}</p>
              <button
                type="button"
                onClick={() => void load()}
                className="text-[12px] font-bold text-slate-950 border border-slate-200 bg-white px-4 py-2 rounded-full hover:bg-slate-50 min-h-[40px] touch-manipulation"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && messages?.length === 0 && (
            <p className="text-[13px] text-slate-500 text-center py-12">No messages in this thread.</p>
          )}

          {!loading && !error && messages && messages.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-[#e5ddd5] p-3 sm:p-4 space-y-3">
              {messages.map((m) => {
                const isCustomer = m.sender === 'customer'
                const isMerchant = m.sender === 'merchant'
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                        isCustomer
                          ? 'bg-white text-slate-800 rounded-tl-sm border border-white/80'
                          : isMerchant
                            ? 'bg-clerk-primary-dark text-white rounded-tr-sm'
                            : 'bg-[#dcf8c6] text-slate-900 rounded-tr-sm'
                      }`}
                    >
                      {!isCustomer && (
                        <p
                          className={`text-[9px] font-bold uppercase tracking-wide mb-0.5 ${
                            isMerchant ? 'text-white/80' : 'text-clerk-primary-dark'
                          }`}
                        >
                          {isMerchant ? 'Merchant' : 'Clerk'}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p
                        className={`text-[9px] mt-1 text-right tabular-nums ${
                          isMerchant ? 'text-white/70' : 'text-slate-400'
                        }`}
                      >
                        {formatTime(m.createdAt)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
