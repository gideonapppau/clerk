'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ConversationPanel } from '@/components/ConversationPanel'
import { DashPanel, DashPanelHead } from '@/components/DashPanel'
import { EmptyState } from '@/components/EmptyState'
import { ListScrollArea, ListSearchInput, ListShowMoreFooter } from '@/components/dashboard/ListControls'
import { Num } from '@/components/Num'
import { useDashboard } from '@/contexts/DashboardContext'
import { routes } from '@/lib/dashboard-routes'
import { CustomerIdentity } from '@/components/CustomerIdentity'
import { badgeClass } from '@/lib/dashboard-ui'
import type { Conversation } from '@/lib/api'
import { usePagedList } from '@/lib/use-paged-list'

const thClass =
  'text-left text-[12px] font-semibold text-slate-500 px-4 sm:px-5 py-2.5'

const refreshBtn =
  'w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center text-[12px] font-semibold text-slate-600 border border-slate-200 bg-white px-4 py-2 rounded-full hover:border-slate-300 transition-colors touch-manipulation'

function matchesConversationSearch(c: Conversation, q: string): boolean {
  const haystack = [c.customerName, c.customerContact, c.customerPhoneDisplay, c.customer, c.lastMessage]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(q)
}

export function ConversationsList() {
  const {
    conversations,
    selectedConvId,
    convDetail,
    convLoading,
    busyConv,
    loadAll,
    openConversation,
    closeConversation,
    handleResume,
    handleTakeover
  } = useDashboard()

  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return conversations
    return conversations.filter((c) => matchesConversationSearch(c, q))
  }, [conversations, search])

  const { visible, hasMore, total, showing, loadMore } = usePagedList(filtered, 30, search)

  useEffect(() => {
    if (!selectedConvId && !convLoading) return
    const mq = window.matchMedia('(max-width: 1023px)')
    if (!mq.matches) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [selectedConvId, convLoading])

  return (
    <>
      <DashPanel className="ui-enter" padding={false}>
        <div className="p-4 sm:p-5 border-b border-slate-100">
          <DashPanelHead
            title={
              <>
                Conversations · <Num>{conversations.length}</Num>
              </>
            }
            action={
              <button type="button" className={refreshBtn} onClick={() => void loadAll()}>
                Refresh
              </button>
            }
          />
          {conversations.length > 4 && (
            <ListSearchInput
              id="conversations-search"
              value={search}
              onChange={setSearch}
              placeholder="Search customer or message…"
            />
          )}
        </div>

        {conversations.length === 0 ? (
          <div className="p-4 sm:p-5">
            <EmptyState
              title="No conversations yet"
              description="When customers message your shop on WhatsApp, they show up here."
              action={
                <Link href={routes.whatsapp} className="text-sm font-semibold text-clerk-primary-darker hover:underline">
                  Try on WhatsApp
                </Link>
              }
            />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-[13px] text-slate-500 py-10 px-4">
            No conversations match &ldquo;{search.trim()}&rdquo;
          </p>
        ) : (
          <>
          <ListScrollArea className="lg:hidden divide-y divide-slate-100 border-t border-slate-100">
            {visible.map((c) => (
              <div
                key={c.id}
                className={`px-4 sm:px-5 py-4 ${
                  selectedConvId === c.id ? 'bg-clerk-light/50' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => void openConversation(c.id)}
                  className="w-full text-left touch-manipulation"
                >
                  <CustomerIdentity
                    customerName={c.customerName}
                    customerContact={c.customerContact}
                    customerPhoneDisplay={c.customerPhoneDisplay}
                    customerChatUrl={c.customerChatUrl}
                    customerChatDeepLink={c.customerChatDeepLink}
                    customerPrivacyHidden={c.customerPrivacyHidden}
                    raw={c.customer}
                    compact
                    whatsappLink
                    className="min-w-0"
                  />
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span
                      className={`inline-flex text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                        c.mode === 'HUMAN' ? 'bg-clerk-light text-clerk-primary-darker' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {c.mode === 'HUMAN' ? 'You' : 'Clerk'}
                    </span>
                    {c.status === 'WAITING_MERCHANT' ? (
                      <span className={badgeClass('pending')}>Needs you</span>
                    ) : (
                      <span className="text-[11px] text-slate-400 capitalize">
                        {(c.status ?? 'ACTIVE').replace(/_/g, ' ').toLowerCase()}
                      </span>
                    )}
                  </div>
                  {c.lastMessage && (
                    <p className="text-[12px] text-slate-500 line-clamp-2 leading-relaxed mt-2">{c.lastMessage}</p>
                  )}
                </button>
                <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                  {c.mode === 'HUMAN' ? (
                    <button
                      type="button"
                      disabled={busyConv === c.id}
                      onClick={() => void handleResume(c.id)}
                      className="flex-1 min-h-[44px] text-[12px] font-bold bg-clerk-primary text-slate-950 px-3 py-2.5 rounded-full hover:bg-clerk-primary-dark hover:text-white transition-colors disabled:opacity-50 touch-manipulation"
                    >
                      {busyConv === c.id ? '…' : 'Hand to Clerk'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busyConv === c.id}
                      onClick={() => void handleTakeover(c.id)}
                      className="flex-1 min-h-[44px] text-[12px] font-semibold text-slate-600 border border-slate-200 px-3 py-2.5 rounded-full hover:bg-slate-50 transition-colors disabled:opacity-50 touch-manipulation"
                    >
                      {busyConv === c.id ? '…' : 'Take over'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </ListScrollArea>
          <div className="lg:hidden">
            <ListShowMoreFooter showing={showing} total={total} hasMore={hasMore} onLoadMore={loadMore} />
          </div>

          <div className="hidden lg:block border-t border-slate-100">
            <ListScrollArea className="-mb-0">
              <table className="w-full text-[13px]">
                <thead className="sticky top-0 z-10 bg-white">
                  <tr className="border-b border-slate-100 shadow-[0_1px_0_0_rgb(241,245,249)]">
                  <th className={thClass}>Customer</th>
                  <th className={`${thClass} px-3`}>Mode</th>
                  <th className={`${thClass} px-3`}>Status</th>
                  <th className={`${thClass} px-3 hidden sm:table-cell`}>Last message</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {visible.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => void openConversation(c.id)}
                    className={`cursor-pointer transition-colors ${
                      selectedConvId === c.id ? 'bg-clerk-light/50' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="px-4 sm:px-5 py-3">
                      <CustomerIdentity
                        customerName={c.customerName}
                        customerContact={c.customerContact}
                        customerPhoneDisplay={c.customerPhoneDisplay}
                        customerChatUrl={c.customerChatUrl}
                        customerChatDeepLink={c.customerChatDeepLink}
                        customerPrivacyHidden={c.customerPrivacyHidden}
                        raw={c.customer}
                        compact
                        whatsappLink
                      />
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                          c.mode === 'HUMAN' ? 'bg-clerk-light text-clerk-primary-darker' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {c.mode === 'HUMAN' ? 'You' : 'Clerk'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {c.status === 'WAITING_MERCHANT' ? (
                        <span className={badgeClass('pending')}>Needs you</span>
                      ) : (
                        <span className="text-[12px] text-slate-500 capitalize">
                          {(c.status ?? 'ACTIVE').replace(/_/g, ' ').toLowerCase()}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-slate-500 truncate max-w-[180px] hidden sm:table-cell">
                      {c.lastMessage}
                    </td>
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      {c.mode === 'HUMAN' ? (
                        <button
                          type="button"
                          disabled={busyConv === c.id}
                          onClick={() => void handleResume(c.id)}
                          className="text-[12px] font-bold bg-clerk-primary text-slate-950 px-3 py-1.5 rounded-full hover:bg-clerk-primary-dark hover:text-white transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                          {busyConv === c.id ? '…' : 'Hand to bot'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busyConv === c.id}
                          onClick={() => void handleTakeover(c.id)}
                          className="text-[12px] font-semibold text-slate-600 border border-slate-200 px-3 py-1.5 rounded-full hover:bg-slate-50 transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                          {busyConv === c.id ? '…' : 'Take over'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </ListScrollArea>
            <ListShowMoreFooter showing={showing} total={total} hasMore={hasMore} onLoadMore={loadMore} />
          </div>
          </>
        )}
      </DashPanel>

      {(selectedConvId || convLoading) && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[55] bg-slate-900/45 backdrop-blur-[2px] lg:hidden border-0 p-0 cursor-default"
            aria-label="Close conversation"
            onClick={closeConversation}
          />
          <ConversationPanel
            detail={convDetail}
            loading={convLoading}
            busy={busyConv === selectedConvId}
            onClose={closeConversation}
            onTakeover={() => selectedConvId && void handleTakeover(selectedConvId)}
            onResume={() => selectedConvId && void handleResume(selectedConvId)}
          />
        </>
      )}
    </>
  )
}
