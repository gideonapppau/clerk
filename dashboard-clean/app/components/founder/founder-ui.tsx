'use client'

import Link from 'next/link'
import { badgeClass, type BadgeTone } from '@/lib/dashboard-ui'
import type { FounderReliabilityEvent } from '@/lib/founder-api'

export const founderStatCard =
  'rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 min-h-[108px] flex flex-col justify-between shadow-[0_8px_40px_rgba(15,23,42,0.04)]'

export const founderSectionCard =
  'rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-[0_8px_40px_rgba(15,23,42,0.07)]'

export function FounderMetricCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
}) {
  return (
    <div className={founderStatCard}>
      <p className="text-[12px] font-medium text-slate-500">{label}</p>
      <div>
        <p
          className={`font-extrabold text-base sm:text-xl tabular-nums font-display leading-tight break-words ${
            accent ? 'text-clerk-primary-darker' : 'text-slate-900'
          }`}
        >
          {value}
        </p>
        {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

export function FounderSection({
  title,
  description,
  action,
  children,
  id,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  id?: string
}) {
  return (
    <section className={founderSectionCard} aria-labelledby={id}>
      <div className="mb-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 id={id} className="text-[1.15rem] font-extrabold text-slate-900 font-display">
            {title}
          </h2>
          {description && <p className="text-[13px] text-slate-500 mt-1">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export function FounderHubCard({
  href,
  icon,
  title,
  description,
  metric,
  badge,
}: {
  href: string
  icon: string
  title: string
  description: string
  metric?: string | number
  badge?: number
}) {
  return (
    <Link
      href={href}
      className={`${founderStatCard} group hover:border-slate-300 hover:shadow-[0_12px_48px_rgba(15,23,42,0.08)] transition-all min-h-[120px] touch-manipulation`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="material-symbols-outlined text-clerk-primary-dark text-[22px]" aria-hidden>
          {icon}
        </span>
        {badge != null && badge > 0 && (
          <span className="text-[11px] font-bold tabular-nums bg-clerk-primary/15 text-clerk-primary-dark px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <div>
        {metric != null && (
          <p className="text-xl font-extrabold text-slate-900 tabular-nums font-display leading-tight mb-1">
            {metric}
          </p>
        )}
        <p className="text-[13px] font-semibold text-slate-900 font-display group-hover:text-clerk-primary-dark transition-colors">
          {title}
        </p>
        <p className="text-[11px] text-slate-500 mt-1 leading-snug">{description}</p>
      </div>
    </Link>
  )
}

export function FounderPageHeader({
  title,
  subtitle,
  backHref,
  backLabel,
  actionHref,
  actionLabel,
  action,
}: {
  title: string
  subtitle: string
  backHref?: string
  backLabel?: string
  actionHref?: string
  actionLabel?: string
  action?: React.ReactNode
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {backHref && backLabel && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-500 hover:text-slate-800 mb-2 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              arrow_back
            </span>
            {backLabel}
          </Link>
        )}
        <h1 className="text-[1.5rem] sm:text-[1.65rem] font-extrabold text-slate-900 font-display tracking-tight">
          {title}
        </h1>
        <p className="text-[13px] text-slate-500 mt-1">{subtitle}</p>
      </div>
      {action}
      {!action && actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold text-slate-600 border border-slate-200 bg-white px-4 py-3 sm:py-2.5 rounded-full hover:bg-slate-50 transition-colors shrink-0 min-h-[44px] touch-manipulation"
        >
          {actionLabel}
          <span className="material-symbols-outlined ms-icon-filled" style={{ fontSize: 14 }}>
            arrow_forward
          </span>
        </Link>
      )}
    </header>
  )
}

export function FounderErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <p className="text-[13px] text-red-700">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-[12px] font-bold text-slate-950 bg-white border border-red-200 px-4 py-2 rounded-full hover:bg-red-100 transition-colors shrink-0 min-h-[40px]"
        >
          Retry
        </button>
      )}
    </div>
  )
}

export function FounderPartialWarning({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
      <p className="font-semibold font-display mb-1">Some sections didn&apos;t load</p>
      <ul className="list-disc list-inside space-y-0.5 text-[12px] opacity-90">
        {messages.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>
    </div>
  )
}

export function FounderLoading({ label = 'Loading metrics…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="size-8 rounded-full border-2 border-clerk-primary border-t-transparent animate-spin" />
      <p className="text-[13px] text-slate-500">{label}</p>
    </div>
  )
}

export function FounderEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center">
      <span className="material-symbols-outlined text-slate-300 text-4xl mb-3 block">inbox</span>
      <p className="text-[14px] font-semibold text-slate-700 font-display">{title}</p>
      <p className="text-[13px] text-slate-500 mt-1 max-w-sm mx-auto">{description}</p>
    </div>
  )
}

export function formatFounderGhs(n: number): string {
  return `GHS ${n.toLocaleString('en-GH')}`
}

export function reliabilityEventLabel(type: string): string {
  switch (type) {
    case 'unknown_intent':
      return 'Unknown intent'
    case 'low_confidence':
      return 'Low confidence'
    case 'grounding_violation':
      return 'Grounding violation'
    case 'customer_frustration':
    case 'frustrated_customer':
      return 'Customer escalation'
    case 'human_request':
    case 'requested_human':
      return 'Human requested'
    case 'price_negotiation':
      return 'Price negotiation'
    case 'reachout_throttle':
      return 'WhatsApp throttle'
    default:
      return type.replace(/_/g, ' ')
  }
}

export function reliabilityEventTone(type: string): BadgeTone {
  switch (type) {
    case 'grounding_violation':
      return 'danger'
    case 'reachout_throttle':
      return 'warning'
    case 'customer_frustration':
    case 'frustrated_customer':
    case 'human_request':
    case 'requested_human':
    case 'price_negotiation':
      return 'warning'
    case 'low_confidence':
      return 'warning'
    default:
      return 'neutral'
  }
}

export function ReliabilityEventRow({ ev }: { ev: FounderReliabilityEvent }) {
  const when = new Date(ev.createdAt)
  const timeLabel = Number.isNaN(when.getTime())
    ? ''
    : when.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <li className="px-4 py-3.5 hover:bg-slate-50/80 transition-colors">
      <div className="flex flex-wrap items-center gap-2 mb-1.5">
        <span className={badgeClass(reliabilityEventTone(ev.eventType))}>
          {reliabilityEventLabel(ev.eventType)}
        </span>
        {ev.classifiedIntent && (
          <span className="text-[11px] font-medium text-slate-500">{ev.classifiedIntent}</span>
        )}
        {ev.confidence != null && (
          <span className="text-[11px] text-slate-400 tabular-nums">
            {(ev.confidence * 100).toFixed(0)}% confidence
          </span>
        )}
        {timeLabel && (
          <span className="text-[11px] text-slate-400 ml-auto tabular-nums">{timeLabel}</span>
        )}
      </div>
      <p className="text-[13px] text-slate-800 font-medium leading-snug">&ldquo;{ev.customerText}&rdquo;</p>
      {ev.violationDetails && (
        <p className="text-[12px] text-slate-500 mt-1 leading-snug">{ev.violationDetails}</p>
      )}
      <p className="text-[10px] text-slate-400 mt-1.5 font-mono truncate">
        {ev.merchantId.slice(0, 8)} · {ev.conversationId.slice(0, 8)}
      </p>
    </li>
  )
}
