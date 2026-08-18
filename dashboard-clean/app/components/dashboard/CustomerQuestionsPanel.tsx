'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { DashPanel } from '@/components/DashPanel'
import { useDashboard } from '@/contexts/DashboardContext'
import { simulateMessage } from '@/lib/api'
import { buildCustomerQuestions, shopWhatsAppUrl } from '@/lib/customer-questions'
import { routes } from '@/lib/dashboard-routes'
import { formatUserError } from '@/lib/errors'

type ChatLine = {
  id: string
  role: 'customer' | 'clerk'
  text: string
}

const SIMULATE_LIMIT = 15

export function CustomerQuestionsPanel() {
  const { session, waConnected, inventory } = useDashboard()
  const [lines, setLines] = useState<ChatLine[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [remaining, setRemaining] = useState(SIMULATE_LIMIT)
  const scrollRef = useRef<HTMLDivElement>(null)

  const shopPhone = session?.phone?.replace(/\D/g, '') ?? ''
  const firstProduct = inventory[0]?.name
  const questions = buildCustomerQuestions(firstProduct)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [lines, busy])

  const sendTest = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || busy) return

      setBusy(true)
      setError('')
      setDraft('')

      const customerId = `c-${Date.now()}`
      setLines((prev) => [...prev, { id: customerId, role: 'customer', text: trimmed }])

      try {
        const result = await simulateMessage(trimmed)
        if (typeof result.testsRemainingThisHour === 'number') {
          setRemaining(result.testsRemainingThisHour)
        }
        if (result.reply) {
          setLines((prev) => [
            ...prev,
            { id: `r-${Date.now()}`, role: 'clerk', text: result.reply! },
          ])
        }
      } catch (err) {
        setError(formatUserError(err, "Couldn't run that test. Try again."))
        setLines((prev) => prev.filter((l) => l.id !== customerId))
        setDraft(trimmed)
      } finally {
        setBusy(false)
      }
    },
    [busy]
  )

  if (!waConnected || !shopPhone) {
    return (
      <DashPanel padding={false}>
        <div className="px-4 sm:px-5 py-5">
          <p className="text-[14px] font-semibold text-slate-900 font-display mb-1">Test Clerk</p>
          <p className="text-[13px] text-slate-500 leading-relaxed mb-4">
            Connect your shop number first, then try customer questions here on the dashboard.
          </p>
          <Link
            href={routes.whatsapp}
            className="min-h-[44px] inline-flex items-center gap-2 text-[13px] font-semibold text-clerk-primary-darker hover:underline touch-manipulation"
          >
            <Image src="/whatsapp.svg" alt="" width={14} height={14} aria-hidden />
            Connect WhatsApp
          </Link>
        </div>
      </DashPanel>
    )
  }

  return (
    <DashPanel padding={false} className="flex flex-col min-h-[min(420px,70dvh)] lg:min-h-[420px]">
      <div className="px-4 sm:px-5 py-4 border-b border-slate-100">
        <p className="text-[14px] font-semibold text-slate-900 font-display">Test Clerk</p>
        <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">
          Ask about your products like a customer would. This is a dry run: no orders, conversations,
          or trial usage are created.
        </p>
        {inventory.length === 0 && (
          <p className="text-[12px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-3">
            Add products first so Clerk can answer price and stock questions.{' '}
            <Link href={routes.inventory} className="font-semibold underline">
              Add products
            </Link>
          </p>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 min-h-[140px] max-h-[min(36dvh,280px)] sm:max-h-[280px] overflow-y-auto overscroll-contain px-4 sm:px-5 py-4 space-y-3 bg-slate-50/60"
      >
        {lines.length === 0 && !busy && (
          <p className="text-[12px] text-slate-400 text-center py-8 leading-relaxed">
            Tap a question below or type your own message to see how Clerk replies.
          </p>
        )}
        {lines.map((line) => (
          <div
            key={line.id}
            className={`flex ${line.role === 'customer' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                line.role === 'customer'
                  ? 'bg-clerk-primary text-slate-950 rounded-br-md'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md shadow-sm'
              }`}
            >
              {line.text}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-3.5 py-2.5 shadow-sm">
              <div className="flex gap-1">
                <span className="size-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:0ms]" />
                <span className="size-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:150ms]" />
                <span className="size-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="px-4 sm:px-5 text-[12px] text-red-600 bg-red-50 border-t border-red-100 py-2">
          {error}
        </p>
      )}

      <div className="px-4 sm:px-5 py-3 border-t border-slate-100 shrink-0">
        <div className="flex gap-2 overflow-x-auto overscroll-x-contain pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden mb-3">
          {questions.map((q) => (
            <button
              key={q.label}
              type="button"
              disabled={busy || remaining === 0}
              onClick={() => void sendTest(q.text)}
              className="shrink-0 inline-flex items-center gap-1.5 min-h-[40px] text-[12px] font-semibold text-slate-700 border border-slate-200 bg-white px-3.5 py-2 rounded-full hover:border-clerk-primary/40 hover:bg-clerk-light/30 transition-colors touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {q.label}
            </button>
          ))}
        </div>

        <form
          className="flex flex-col sm:flex-row gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            void sendTest(draft)
          }}
        >
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a customer question…"
            disabled={busy || remaining === 0}
            className="flex-1 min-w-0 text-[16px] sm:text-[13px] border border-slate-200 rounded-full px-4 py-3 sm:py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-clerk-primary/30 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={busy || remaining === 0 || !draft.trim()}
            className="shrink-0 min-h-[48px] sm:min-h-[44px] bg-clerk-primary text-slate-950 text-[13px] font-bold px-5 py-2.5 rounded-full hover:bg-clerk-primary-dark hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation w-full sm:w-auto"
          >
            Send
          </button>
        </form>

        <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <p className="text-[11px] text-slate-400">
            {remaining} of {SIMULATE_LIMIT} dashboard tests left this hour
          </p>
          <a
            href={shopWhatsAppUrl(shopPhone, questions[0]?.text ?? 'Hi')}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-clerk-primary-darker hover:underline"
          >
            <Image src="/whatsapp.svg" alt="" width={12} height={12} aria-hidden />
            Or try on your phone
          </a>
        </div>
      </div>
    </DashPanel>
  )
}
