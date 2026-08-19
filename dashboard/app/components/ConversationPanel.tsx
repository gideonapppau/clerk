'use client'

import { CustomerIdentity } from '@/components/CustomerIdentity'
import { Num } from '@/components/Num'
import type { ConversationDetail } from '@/lib/api'
import { badgeClass } from '@/lib/dashboard-ui'
import { formatProductName } from '@/lib/format'
import { formatTimelineRange, groupConversationTimeline } from '@/lib/timeline-grouping'

type Props = {
  detail: ConversationDetail | null
  loading: boolean
  busy: boolean
  onClose: () => void
  onTakeover: () => void
  onResume: () => void
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function clerkResumeLabel(context: Record<string, unknown>): string | null {
  const raw = context.merchant_cooloff_until
  if (typeof raw !== 'string' || !raw) return null
  const until = new Date(raw)
  if (Number.isNaN(until.getTime())) return null
  const mins = Math.round((until.getTime() - Date.now()) / 60_000)
  if (mins <= 0) return 'Clerk resumes on next customer message'
  if (mins < 60) return `Clerk resumes in ~${mins}m`
  const hrs = Math.round(mins / 60)
  return `Clerk resumes in ~${hrs}h`
}

function statusBadgeClass(status: string) {
  const s = status.toUpperCase()
  if (s.includes('PENDING') || s.includes('WAITING')) {
    return badgeClass('pending')
  }
  if (s.includes('CONFIRM') || s.includes('PAID') || s.includes('COMPLETE')) {
    return badgeClass('success')
  }
  if (s.includes('CANCEL')) {
    return badgeClass('danger')
  }
  return badgeClass('muted')
}

export function ConversationPanel({ detail, loading, busy, onClose, onTakeover, onResume }: Props) {
  if (!detail && !loading) return null

  const conv = detail?.conversation
  const isHuman = conv?.mode === 'HUMAN'
  const groupedTimeline = detail ? groupConversationTimeline(detail.timeline) : []

  return (
    <div
      className="conversation-sheet fixed inset-x-0 bottom-0 z-[60] lg:static lg:z-auto lg:mt-6 flex flex-col overflow-hidden rounded-t-2xl lg:rounded-2xl border border-slate-200 bg-white shadow-[0_-12px_48px_-8px_rgba(15,23,42,0.18)] lg:shadow-[0_8px_40px_rgba(15,23,42,0.07)] max-h-[min(88dvh,720px)] lg:max-h-none pb-[env(safe-area-inset-bottom)]"
      role="dialog"
      aria-modal="true"
      aria-label="Conversation detail"
    >
      {/* Mobile sheet handle */}
      <div className="lg:hidden shrink-0 flex justify-center pt-2.5 pb-1" aria-hidden>
        <div className="w-9 h-1 rounded-full bg-slate-200" />
      </div>

      {/* Header */}
      <div className="shrink-0 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between px-4 sm:px-5 pt-2 lg:pt-4 pb-3 border-b border-slate-100">
        <div className="min-w-0 flex-1">
          {conv ? (
            <CustomerIdentity
              customerName={conv.customerName}
              customerContact={conv.customerContact}
              customerPhoneDisplay={conv.customerPhoneDisplay}
              customerChatUrl={conv.customerChatUrl}
              customerChatDeepLink={conv.customerChatDeepLink}
              customerPrivacyHidden={conv.customerPrivacyHidden}
              raw={conv.customer}
              whatsappLink
            />
          ) : (
            <h2 className="text-[15px] font-extrabold text-slate-900 font-display">Loading…</h2>
          )}
          {conv && (
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span
                className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                  isHuman ? 'bg-clerk-light text-clerk-primary-darker' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {isHuman ? 'You' : 'Clerk'}
              </span>
              {isHuman && conv.status === 'MERCHANT_ENGAGED' && clerkResumeLabel(conv.context) && (
                <span className="text-[11px] text-slate-400">{clerkResumeLabel(conv.context)}</span>
              )}
              {conv.summary && (
                <span className="text-[12px] text-slate-500 line-clamp-2 min-w-0">{conv.summary}</span>
              )}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2 w-full lg:w-auto">
          {conv &&
            (isHuman ? (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={onResume}
                  className="flex-1 lg:flex-none min-h-[44px] inline-flex items-center justify-center text-[12px] font-bold bg-clerk-primary text-slate-950 px-4 py-2 rounded-full hover:bg-clerk-primary-dark hover:text-white transition-colors disabled:opacity-50 touch-manipulation"
                >
                  {busy ? '…' : 'Hand to Clerk'}
                </button>
                {(conv.customerChatDeepLink || conv.customerChatUrl) && (
                  <a
                    href={conv.customerChatDeepLink || conv.customerChatUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 lg:flex-none min-h-[44px] inline-flex items-center justify-center text-[12px] font-semibold text-slate-600 border border-slate-200 px-4 py-2 rounded-full hover:bg-slate-50 transition-colors touch-manipulation"
                  >
                    Open on WhatsApp
                  </a>
                )}
              </>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={onTakeover}
                className="flex-1 lg:flex-none min-h-[44px] inline-flex items-center justify-center text-[12px] font-semibold text-slate-600 border border-slate-200 px-4 py-2 rounded-full hover:bg-slate-50 transition-colors disabled:opacity-50 touch-manipulation"
              >
                {busy ? '…' : 'Take over'}
              </button>
            ))}
          <button
            type="button"
            onClick={onClose}
            className="size-11 lg:size-9 shrink-0 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors touch-manipulation"
            aria-label="Close"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              close
            </span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 py-4">
        {loading && (
          <div className="space-y-3 animate-pulse">
            <div className="h-14 bg-slate-50 rounded-xl" />
            <div className="h-32 bg-[#e5ddd5]/60 rounded-xl" />
          </div>
        )}

        {detail && conv && (
          <div className="space-y-5">
            {/* State + order */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] text-slate-500">State</span>
                <span className="text-[12px] font-semibold text-slate-800 capitalize">
                  {conv.current.replace(/_/g, ' ').toLowerCase()}
                </span>
              </div>
              {detail.order && (
                <div className="flex items-start justify-between gap-3 pt-2.5 border-t border-slate-200">
                  <span className="text-[12px] text-slate-500 shrink-0">
                    Order
                  </span>
                  <div className="text-right min-w-0">
                    <p className="text-[12px] font-semibold text-slate-800">
                      {formatProductName(detail.order.productName)} · GHS{' '}
                      <Num>{detail.order.subtotal.toLocaleString()}</Num>
                    </p>
                    <span
                      className={`inline-flex mt-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${statusBadgeClass(detail.order.status)}`}
                    >
                      {detail.order.status.replace(/_/g, ' ').toLowerCase()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Timeline */}
            {groupedTimeline.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <ul className="space-y-2">
                  {groupedTimeline.map((entry) => (
                    <li
                      key={`${entry.startAt}-${entry.endAt}-${entry.label}`}
                      className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3 text-[12px]"
                    >
                      <span className="text-slate-700 leading-snug min-w-0">{entry.label}</span>
                      <span className="text-slate-400 shrink-0 tabular-nums sm:text-right sm:whitespace-nowrap">
                        {formatTimelineRange(entry.startAt, entry.endAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Messages — WhatsApp-style thread */}
            <div>
              {detail.messages.length === 0 ? (
                <p className="text-[13px] text-slate-500 text-center py-8 rounded-xl border border-dashed border-slate-200">
                  No messages yet.
                </p>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-[#e5ddd5] p-3 sm:p-4 space-y-3 min-h-[120px]">
                  {detail.messages.map((m) => {
                    const isCustomer = m.role === 'customer'
                    const isMerchant = m.role === 'merchant'
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
                              {isMerchant ? 'You' : 'Clerk'}
                            </p>
                          )}
                          <p className="whitespace-pre-wrap break-words">{m.text}</p>
                          <p
                            className={`text-[9px] mt-1 text-right ${
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
        )}
      </div>
    </div>
  )
}
