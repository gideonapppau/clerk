'use client'

import { FounderControls, rangeContext } from '@/components/founder/FounderControls'
import { FounderTrendChart } from '@/components/founder/FounderTrendChart'
import {
  FounderErrorBanner,
  FounderHubCard,
  FounderLoading,
  FounderMetricCard,
  FounderPageHeader,
  FounderPartialWarning,
  FounderSection,
  ReliabilityEventRow,
  formatFounderGhs,
} from '@/components/founder/founder-ui'
import { formatReplyLatency } from '@/lib/founder-format'
import { useFounderRefresh } from '@/components/founder/useFounderRefresh'
import {
  fetchFounderFriction,
  fetchFounderLatency,
  fetchFounderOverview,
  fetchFounderReliability,
  fetchFounderTimeseries,
  type FounderFriction,
  type FounderOverview,
  type FounderRange,
  type FounderReliability,
  type FounderReplyLatency,
  type FounderTimeseries,
} from '@/lib/founder-api'
import { formatUserError } from '@/lib/errors'
import Link from 'next/link'
import { useCallback, useState } from 'react'

export default function FounderPage() {
  const [days, setDays] = useState<FounderRange>(30)
  const [overview, setOverview] = useState<FounderOverview | null>(null)
  const [friction, setFriction] = useState<FounderFriction | null>(null)
  const [latency, setLatency] = useState<FounderReplyLatency | null>(null)
  const [timeseries, setTimeseries] = useState<FounderTimeseries | null>(null)
  const [reliability, setReliability] = useState<FounderReliability | null>(null)
  const [partialErrors, setPartialErrors] = useState<string[]>([])
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const reliabilityDays = days === 0 ? 7 : days
      const results = await Promise.allSettled([
        fetchFounderOverview(days),
        fetchFounderFriction(days),
        fetchFounderLatency(days),
        fetchFounderTimeseries(days),
        fetchFounderReliability(reliabilityDays),
      ])

      const errors: string[] = []
      const pick = <T,>(r: PromiseSettledResult<T>, label: string): T | null => {
        if (r.status === 'fulfilled') return r.value
        errors.push(`${label}: ${r.reason instanceof Error ? r.reason.message : 'Failed'}`)
        return null
      }

      const o = pick(results[0], 'Overview')
      const f = pick(results[1], 'Friction')
      const l = pick(results[2], 'Latency')
      const t = pick(results[3], 'Trend')
      const r = pick(results[4], 'Reliability')

      if (o) setOverview(o)
      if (f) setFriction(f)
      if (l) setLatency(l)
      if (t) setTimeseries(t)
      setReliability(r)
      setPartialErrors(errors)

      if (!o && results[0].status === 'rejected') {
        throw results[0].reason
      }
    } catch (err) {
      setError(formatUserError(err, "Couldn't load overview."))
    }
  }, [days])

  const { autoRefresh, setAutoRefresh, lastUpdated, refreshing, refresh } = useFounderRefresh(load, [days])

  const loading = refreshing && !overview

  if (loading) {
    return <FounderLoading />
  }

  if (error && !overview) {
    return (
      <div className="max-w-5xl">
        <FounderErrorBanner message={error} onRetry={() => void refresh()} />
      </div>
    )
  }

  if (!overview) return null

  const ctx = rangeContext(days)
  const stuckBeforeLink = friction?.unpaidCart.beforePaymentLink ?? 0
  const latencySummary =
    latency && (latency.platform?.sampleCount ?? 0) > 0
      ? formatReplyLatency(latency.platform.avgMs)
      : undefined

  const gs = overview.gatewaySessions
  const gatewayValue = !overview.gatewayHealthy
    ? 'Down'
    : gs?.available
      ? gs.degraded
        ? 'Degraded'
        : 'Healthy'
      : 'Process only'
  const gatewaySub = !overview.gatewayHealthy
    ? 'Gateway unreachable'
    : gs?.available
      ? `${gs.live} live · ${gs.stale} stale · ${gs.connecting} reconnecting · ${overview.gatewayLatencyMs}ms`
      : `${overview.gatewayLatencyMs}ms probe (deploy gateway for session metrics)`

  return (
    <div className="space-y-6 sm:space-y-8 ui-enter max-w-5xl">
      <FounderPageHeader
        title="Platform overview"
        subtitle={`${ctx} · key numbers at a glance`}
        actionHref="/founder/merchants"
        actionLabel="Merchant health"
      />

      <FounderControls
        days={days}
        onDaysChange={setDays}
        autoRefresh={autoRefresh}
        onAutoRefreshChange={setAutoRefresh}
        lastUpdated={lastUpdated}
        refreshing={refreshing}
        onRefresh={() => void refresh()}
      />

      {partialErrors.length > 0 && <FounderPartialWarning messages={partialErrors} />}

      <section aria-label="Key metrics">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          <FounderMetricCard
            label={days === 0 ? 'Merchants' : 'New merchants'}
            value={overview.merchants}
          />
          <FounderMetricCard
            label="WhatsApp linked"
            value={overview.everLinked ?? overview.connected}
            sub={`${overview.socketOnline ?? 0} online now`}
            accent
          />
          <FounderMetricCard label="Orders" value={overview.orders} sub={`${overview.paidOrders} paid`} />
          <FounderMetricCard
            label="Revenue"
            value={formatFounderGhs(overview.revenue)}
            sub={`${overview.paymentPct}% paid`}
          />
        </div>
      </section>

      <section aria-label="Health signals">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
          <FounderMetricCard
            label="Activation"
            value={`${overview.conversionPct}%`}
            sub="Merchants with ≥1 order"
            accent={overview.conversionPct >= 30}
          />
          <FounderMetricCard
            label="WhatsApp gateway"
            value={gatewayValue}
            sub={gatewaySub}
            accent={overview.gatewayWhatsAppHealthy}
          />
          <FounderMetricCard
            label="Expired / cancelled"
            value={overview.errors7d}
            sub={days === 0 ? 'Last 7 days' : 'In range'}
          />
        </div>
      </section>

      {timeseries && (
        <FounderTrendChart
          points={timeseries.points ?? []}
          subtitle={`Daily signups and orders · ${timeseries.days}-day window`}
        />
      )}

      <section aria-label="Explore">
        <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-3 font-display">
          Explore
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
          <FounderHubCard
            href="/founder/pipeline"
            icon="handshake"
            title="Pipeline"
            description="Cold outreach to paid — status, next action, overdue follow-ups."
          />
          <FounderHubCard
            href="/founder/health"
            icon="monitor_heart"
            title="Merchant health"
            description="Stuck onboarding, churn risk, revenue forecast."
          />
          <FounderHubCard
            href="/founder/outreach"
            icon="campaign"
            title="Cold outreach"
            description="Log every DM. Reply rate and message versions."
          />
          <FounderHubCard
            href="/founder/scorecard"
            icon="edit_note"
            title="Weekly scorecard"
            description="Content calendar (Mon/Wed/Fri) plus Friday honesty."
          />
          <FounderHubCard
            href="/founder/orders"
            icon="shopping_cart"
            title="Unpaid orders"
            description="Paystack/Moolre orders confirmed without a payment link."
            metric={stuckBeforeLink > 0 ? stuckBeforeLink : undefined}
            badge={stuckBeforeLink}
          />
          <FounderHubCard
            href="/founder/funnels"
            icon="filter_list"
            title="Funnels"
            description="Merchant cohort and conversation drop-off."
          />
          <FounderHubCard
            href="/founder/insights"
            icon="speed"
            title="Insights"
            description="Reply latency, peak hours, unit economics."
            metric={latencySummary}
          />
          <FounderHubCard
            href="/founder/reliability"
            icon="shield"
            title="Reliability"
            description="Unknown intents and grounding violations."
            badge={reliability?.summary.unreviewedEvents}
          />
        </div>
      </section>

      {reliability && (reliability.recent ?? []).length > 0 && (
        <FounderSection
          title="Recent reliability events"
          action={
            <Link
              href="/founder/reliability"
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-clerk-primary-dark hover:text-clerk-primary px-3 py-1.5 rounded-full bg-clerk-primary/10 transition-colors shrink-0 min-h-[40px] touch-manipulation"
            >
              View all
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                arrow_forward
              </span>
            </Link>
          }
        >
          <div className="rounded-xl border border-slate-100 overflow-hidden">
            <ul className="divide-y divide-slate-100">
              {(reliability.recent ?? []).slice(0, 3).map((ev) => (
                <ReliabilityEventRow key={ev.id} ev={ev} />
              ))}
            </ul>
          </div>
        </FounderSection>
      )}
    </div>
  )
}
