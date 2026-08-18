'use client'

import { FounderControls, rangeContext } from '@/components/founder/FounderControls'
import { FunnelRow } from '@/components/founder/FunnelRow'
import {
  FounderErrorBanner,
  FounderLoading,
  FounderPageHeader,
  FounderSection,
} from '@/components/founder/founder-ui'
import { useFounderRefresh } from '@/components/founder/useFounderRefresh'
import {
  fetchFounderConversationFunnel,
  fetchFounderFunnel,
  type FounderConversationFunnel,
  type FounderFunnel,
  type FounderRange,
} from '@/lib/founder-api'
import { formatUserError } from '@/lib/errors'
import { useCallback, useState } from 'react'

export default function FounderFunnelsPage() {
  const [days, setDays] = useState<FounderRange>(30)
  const [funnel, setFunnel] = useState<FounderFunnel | null>(null)
  const [conversationFunnel, setConversationFunnel] = useState<FounderConversationFunnel | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const [f, c] = await Promise.all([
        fetchFounderFunnel(days),
        fetchFounderConversationFunnel(days),
      ])
      setFunnel(f)
      setConversationFunnel(c)
    } catch (err) {
      setError(formatUserError(err, "Couldn't load funnel data."))
    }
  }, [days])

  const { autoRefresh, setAutoRefresh, lastUpdated, refreshing, refresh } = useFounderRefresh(load, [days])

  const loading = refreshing && !funnel && !error
  const ctx = rangeContext(days)

  const cohortSteps = funnel
    ? [
        { label: 'Signup', count: funnel.signup },
        { label: 'WhatsApp linked', count: funnel.connected },
        { label: 'Inventory', count: funnel.inventory },
        { label: 'First reply', count: funnel.firstReply },
        { label: 'First order', count: funnel.firstOrder },
        { label: 'Paid', count: funnel.paid },
      ]
    : []

  return (
    <div className="space-y-6 sm:space-y-8 ui-enter max-w-5xl">
      <FounderPageHeader
        title="Funnels"
        subtitle={`${ctx} · merchant cohort and customer conversation journeys`}
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
      {loading && <FounderLoading label="Loading funnels…" />}

      {!loading && conversationFunnel && (conversationFunnel.stages ?? []).length > 0 && (
        <FounderSection
          title="Conversation funnel"
          description="Per WhatsApp thread. Where customers drop before paying."
        >
          {(conversationFunnel.stages ?? []).map((step, i) => (
            <FunnelRow
              key={step.key}
              label={step.label}
              count={step.count}
              total={conversationFunnel.stages[0]?.count || 1}
              prevCount={i === 0 ? step.count : conversationFunnel.stages[i - 1].count}
            />
          ))}
        </FounderSection>
      )}

      {!loading && funnel && (
        <FounderSection
          title={days === 0 ? 'Merchant cohort' : 'Signup cohort'}
          description="Merchants who signed up in this window and how far they got."
        >
          {cohortSteps.map((step, i) => (
            <FunnelRow
              key={step.label}
              label={step.label}
              count={step.count}
              total={funnel.signup || 1}
              prevCount={i === 0 ? step.count : cohortSteps[i - 1].count}
            />
          ))}
        </FounderSection>
      )}
    </div>
  )
}
