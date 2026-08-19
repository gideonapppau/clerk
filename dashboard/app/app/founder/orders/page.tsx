'use client'

import { FounderControls, rangeContext } from '@/components/founder/FounderControls'
import { FounderUnpaidOrdersList } from '@/components/founder/FounderUnpaidOrdersList'
import {
  FounderErrorBanner,
  FounderLoading,
  FounderMetricCard,
  FounderPageHeader,
  FounderSection,
} from '@/components/founder/founder-ui'
import { useFounderRefresh } from '@/components/founder/useFounderRefresh'
import {
  fetchFounderDropOffs,
  fetchFounderFriction,
  type FounderDropOffs,
  type FounderFriction,
  type FounderRange,
} from '@/lib/founder-api'
import { formatUserError } from '@/lib/errors'
import Link from 'next/link'
import { useCallback, useState } from 'react'

export default function FounderOrdersPage() {
  const [days, setDays] = useState<FounderRange>(0)
  const [dropOffs, setDropOffs] = useState<FounderDropOffs | null>(null)
  const [friction, setFriction] = useState<FounderFriction | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const [d, f] = await Promise.all([fetchFounderDropOffs(days), fetchFounderFriction(days)])
      setDropOffs(d)
      setFriction(f)
    } catch (err) {
      setError(formatUserError(err, "Couldn't load order data."))
    }
  }, [days])

  const { autoRefresh, setAutoRefresh, lastUpdated, refreshing, refresh } = useFounderRefresh(load, [days])

  const loading = refreshing && !dropOffs && !error
  const ctx = rangeContext(days)
  const stuckCount = dropOffs?.count ?? friction?.unpaidCart.beforePaymentLink ?? 0

  return (
    <div className="space-y-6 sm:space-y-8 ui-enter max-w-5xl">
      <FounderPageHeader
        title="Unpaid orders"
        subtitle={`${ctx} · Paystack/Moolre orders confirmed without a payment link`}
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
      {loading && <FounderLoading label="Loading orders…" />}

      {!loading && friction && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <FounderMetricCard label="Before link" value={friction.unpaidCart.beforePaymentLink} accent />
          <FounderMetricCard label="After link" value={friction.unpaidCart.afterPaymentLink} />
          <FounderMetricCard label="Awaiting merchant" value={friction.unpaidCart.pendingMerchant} />
          <FounderMetricCard label="Cancelled" value={friction.unpaidCart.cancelledExpired} />
        </div>
      )}

      {!loading && dropOffs && (
        <FounderSection
          title="Needs investigation"
          description="Merchant confirmed, but no Paystack/Moolre link was stored. Manual and MoMo orders are excluded (they never get a link)."
          action={
            stuckCount > 0 ? (
              <Link
                href="/founder/funnels"
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-clerk-primary-dark hover:text-clerk-primary px-3 py-1.5 rounded-full bg-clerk-primary/10 transition-colors shrink-0 min-h-[40px] touch-manipulation"
              >
                See funnel
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  arrow_forward
                </span>
              </Link>
            ) : undefined
          }
        >
          <FounderUnpaidOrdersList orders={dropOffs.orders} totalCount={dropOffs.count} />
        </FounderSection>
      )}
    </div>
  )
}
