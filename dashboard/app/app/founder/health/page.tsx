'use client'

import {
  FounderEmptyState,
  FounderErrorBanner,
  FounderLoading,
  FounderMetricCard,
  FounderPageHeader,
  FounderSection,
  formatFounderGhs,
} from '@/components/founder/founder-ui'
import { badgeClass } from '@/lib/dashboard-ui'
import { formatUserError } from '@/lib/errors'
import {
  fetchOnboardingHealth,
  fetchRevenueForecast,
  type AtRiskMerchant,
  type OnboardingHealth,
  type RevenueForecast,
} from '@/lib/founder-api'
import { useCallback, useEffect, useState } from 'react'

export default function FounderHealthPage() {
  const [health, setHealth] = useState<OnboardingHealth | null>(null)
  const [forecast, setForecast] = useState<RevenueForecast | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setError('')
    try {
      const [h, f] = await Promise.all([fetchOnboardingHealth(), fetchRevenueForecast()])
      setHealth(h)
      setForecast(f)
    } catch (err) {
      setError(formatUserError(err, "Couldn't load health data."))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) return <FounderLoading label="Loading health…" />

  return (
    <div className="space-y-6 sm:space-y-8 ui-enter max-w-5xl">
      <FounderPageHeader
        title="Merchant health"
        subtitle="Stuck onboarding and churn risk — each row is a job for today"
        backHref="/founder"
        backLabel="Platform overview"
      />

      {error && <FounderErrorBanner message={error} onRetry={() => void load()} />}

      {forecast && (
        <FounderSection title="Revenue forecast" description="Simple model from paid merchants and signup velocity (ARPU GHS 99).">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <FounderMetricCard label="Current MRR" value={formatFounderGhs(forecast.currentMrrGhs)} accent />
            <FounderMetricCard label="In 30 days" value={formatFounderGhs(forecast.projectedMrr30dGhs)} />
            <FounderMetricCard label="If close 5 this week" value={formatFounderGhs(forecast.ifClose5ThisWeekMrrGhs)} accent />
            <FounderMetricCard
              label="To break-even"
              value={forecast.merchantsToBreakEven === 0 ? 'There' : `${forecast.merchantsToBreakEven} merchants`}
              sub={`Floor GHS ${forecast.breakEvenMrrGhs}`}
            />
          </div>
          <p className="mt-3 text-[12px] text-slate-500">
            Paying: {forecast.payingMerchants} · Signups 30d: {forecast.signupsLast30d} · Close rate:{' '}
            {forecast.closeRatePct.toFixed(0)}% · Churned 30d: {forecast.churnedLast30d}
          </p>
        </FounderSection>
      )}

      {health && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
            <FounderMetricCard label="No WhatsApp" value={health.counts.noWhatsApp} />
            <FounderMetricCard label="No inventory" value={health.counts.noInventory} />
            <FounderMetricCard label="No first reply" value={health.counts.noFirstReply} />
            <FounderMetricCard label="No order" value={health.counts.noOrder} />
            <FounderMetricCard label="At risk" value={health.counts.atRisk} accent />
          </div>

          <FounderSection
            title="Stuck onboarding"
            description="Signed up in the last 90 days and stalled before a healthy live shop."
          >
            {(health.stuck ?? []).length === 0 ? (
              <FounderEmptyState title="No stuck signups" description="Everyone who signed up recently is past the early gates." />
            ) : (
              <JobList
                rows={(health.stuck ?? []).map((m) => ({
                  id: m.id,
                  title: m.name || m.email || m.id.slice(0, 8),
                  sub: m.email,
                  badge: m.stageLabel,
                  meta: `${m.daysStuck}d · ${m.suggestedAction}`,
                  danger: m.stage === 'no_first_reply',
                }))}
              />
            )}
          </FounderSection>

          <FounderSection
            title="Churn early warning"
            description="WhatsApp linked but no customer messages in 7+ days."
          >
            {(health.atRisk ?? []).length === 0 ? (
              <FounderEmptyState title="No at-risk merchants" description="Active shops are messaging." />
            ) : (
              <JobList
                rows={(health.atRisk ?? []).map((m: AtRiskMerchant) => ({
                  id: m.id,
                  title: m.name || m.email || m.id.slice(0, 8),
                  sub: m.email,
                  badge: `${m.daysInactive}d inactive`,
                  meta: m.suggestedAction,
                  danger: true,
                }))}
              />
            )}
          </FounderSection>
        </>
      )}
    </div>
  )
}

function JobList({
  rows,
}: {
  rows: { id: string; title: string; sub?: string; badge: string; meta: string; danger?: boolean }[]
}) {
  return (
    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden">
      {rows.map((r) => (
        <li key={r.id} className="px-4 py-3.5 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-slate-900 font-display text-[14px]">{r.title}</p>
              <span className={badgeClass(r.danger ? 'warning' : 'muted')}>{r.badge}</span>
            </div>
            {r.sub && <p className="text-[12px] text-slate-500 mt-0.5 truncate">{r.sub}</p>}
            <p className="text-[12px] text-slate-600 mt-1">{r.meta}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
