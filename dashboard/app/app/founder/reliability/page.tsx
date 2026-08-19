'use client'

import { FounderControls, rangeContext } from '@/components/founder/FounderControls'
import {
  FounderEmptyState,
  FounderErrorBanner,
  FounderLoading,
  FounderMetricCard,
  FounderPageHeader,
  FounderPartialWarning,
  FounderSection,
  ReliabilityEventRow,
} from '@/components/founder/founder-ui'
import { useFounderRefresh } from '@/components/founder/useFounderRefresh'
import { fetchFounderReliability, type FounderRange, type FounderReliability } from '@/lib/founder-api'
import { formatUserError } from '@/lib/errors'
import { useCallback, useState } from 'react'

export default function FounderReliabilityPage() {
  const [days, setDays] = useState<FounderRange>(7)
  const [data, setData] = useState<FounderReliability | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const reliability = await fetchFounderReliability(days)
      setData(reliability)
    } catch (err) {
      setError(formatUserError(err, "Couldn't load reliability bucket."))
    }
  }, [days])

  const { autoRefresh, setAutoRefresh, lastUpdated, refreshing, refresh } = useFounderRefresh(load, [days])

  const loading = refreshing && !data && !error
  const summary = data?.summary
  const recent = data?.recent ?? []
  const unreviewed = recent.filter((e) => !e.reviewed)

  return (
    <div className="space-y-6 sm:space-y-8 ui-enter max-w-5xl">
      <FounderPageHeader
        title="Reliability bucket"
        subtitle={`${rangeContext(days)} · classifier misses, grounding issues, and human escalations`}
        backHref="/founder"
        backLabel="Platform overview"
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

      {error && <FounderErrorBanner message={error} onRetry={() => void refresh()} />}

      {loading && <FounderLoading label="Loading reliability data…" />}

      {!loading && !error && summary && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <FounderMetricCard
              label="Unreviewed"
              value={summary.unreviewedEvents}
              sub={`${summary.totalEvents} total events`}
              accent={summary.unreviewedEvents === 0}
            />
            <FounderMetricCard label="Human escalations" value={summary.humanEscalationCount ?? 0} />
            <FounderMetricCard label="Unknown intents" value={summary.unknownIntentCount} />
            <FounderMetricCard label="Low confidence" value={summary.lowConfidenceCount} />
            <FounderMetricCard label="Grounding violations" value={summary.groundingViolationCount} />
          </div>

          <FounderSection
            title="Conversation health"
            description="Score derived from reliability events in the selected window. Poor conversations were auto-escalated."
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <FounderMetricCard
                label="Healthy"
                value={summary.healthyConversations}
                sub="Score 80–100"
                accent
              />
              <FounderMetricCard
                label="Needs attention"
                value={summary.needsAttention}
                sub="Score 50–79"
              />
              <FounderMetricCard
                label="Poor"
                value={summary.poorConversations}
                sub="Score under 50"
              />
            </div>
          </FounderSection>

          <FounderSection
            title="Recent captures"
            description="Review weekly. Each pattern that appears 3+ times becomes a new guard."
            action={
              unreviewed.length > 0 ? (
                <span className="text-[12px] font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full">
                  {unreviewed.length} unreviewed
                </span>
              ) : undefined
            }
          >
            {recent.length === 0 ? (
              <FounderEmptyState
                title="No reliability events yet"
                description="Events appear when Clerk escalates or cannot answer safely: human handoffs, unknown intents, low confidence, or grounding violations. If escalations happen on WhatsApp but this stays empty, run migration 019 on Core Postgres."
              />
            ) : (
              <div className="rounded-xl border border-slate-100 overflow-hidden -mx-1 sm:mx-0">
                <ul className="divide-y divide-slate-100 max-h-[32rem] overflow-y-auto">
                  {recent.map((ev) => (
                    <ReliabilityEventRow key={ev.id} ev={ev} />
                  ))}
                </ul>
              </div>
            )}
          </FounderSection>

          <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-[12px] text-slate-600 leading-relaxed">
            <p className="font-semibold text-slate-800 font-display mb-1">Weekly review habit</p>
            <p>
              Check this bucket every Monday. For each recurring customer phrase, add a deterministic guard in{' '}
              <code className="text-[11px] bg-white px-1 py-0.5 rounded border border-slate-200">guards.go</code>{' '}
              so Go resolves it without calling the LLM.
            </p>
          </div>
        </>
      )}

      {!loading && !error && !summary && (
        <FounderPartialWarning
          messages={[
            'Reliability data unavailable. Run migration 019_reliability_events.sql on Core Postgres if this is a fresh deploy.',
          ]}
        />
      )}
    </div>
  )
}
