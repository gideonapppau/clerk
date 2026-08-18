'use client'

import { FounderControls, rangeContext } from '@/components/founder/FounderControls'
import { FounderPeakHoursChart } from '@/components/founder/FounderPeakHoursChart'
import {
  FounderEmptyState,
  FounderErrorBanner,
  FounderLoading,
  FounderMetricCard,
  FounderPageHeader,
  FounderSection,
  formatFounderGhs,
} from '@/components/founder/founder-ui'
import { formatReplyLatency } from '@/lib/founder-format'
import { useFounderRefresh } from '@/components/founder/useFounderRefresh'
import {
  fetchFounderLatency,
  fetchFounderPeakHours,
  fetchFounderUnitEconomics,
  type FounderPeakHours,
  type FounderRange,
  type FounderReplyLatency,
  type FounderUnitEconomics,
} from '@/lib/founder-api'
import { formatUserError } from '@/lib/errors'
import { useCallback, useState } from 'react'

export default function FounderInsightsPage() {
  const [days, setDays] = useState<FounderRange>(30)
  const [latency, setLatency] = useState<FounderReplyLatency | null>(null)
  const [peakHours, setPeakHours] = useState<FounderPeakHours | null>(null)
  const [unitEconomics, setUnitEconomics] = useState<FounderUnitEconomics | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    const peakDays = days === 0 ? 30 : days
    try {
      const [l, p, u] = await Promise.all([
        fetchFounderLatency(days),
        fetchFounderPeakHours(peakDays as FounderRange),
        fetchFounderUnitEconomics(days),
      ])
      setLatency(l)
      setPeakHours(p)
      setUnitEconomics(u)
    } catch (err) {
      setError(formatUserError(err, "Couldn't load insights."))
    }
  }, [days])

  const { autoRefresh, setAutoRefresh, lastUpdated, refreshing, refresh } = useFounderRefresh(load, [days])

  const loading = refreshing && !latency && !peakHours && !unitEconomics && !error
  const ctx = rangeContext(days)
  const hasLatency = (latency?.platform?.sampleCount ?? 0) > 0
  const hasPeakHours = (peakHours?.totalMessages ?? 0) > 0
  const hasUnitEconomics = (unitEconomics?.merchants ?? []).length > 0
  const empty = !loading && !error && !hasLatency && !hasPeakHours && !hasUnitEconomics

  return (
    <div className="space-y-6 sm:space-y-8 ui-enter max-w-5xl">
      <FounderPageHeader
        title="Insights"
        subtitle={`${ctx} · reply speed, message timing, and unit economics`}
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
      {loading && <FounderLoading label="Loading insights…" />}
      {empty && (
        <FounderEmptyState
          title="No insight data yet"
          description="Reply latency, peak hours, and unit economics appear after merchants start chatting and taking orders."
        />
      )}

      {!loading && hasLatency && latency && (
        <FounderSection title="Reply latency" description="Customer message → Clerk reply.">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4">
            <FounderMetricCard
              label="Average"
              value={formatReplyLatency(latency.platform.avgMs)}
              accent={latency.platform.avgMs <= 12000}
            />
            <FounderMetricCard label="P50" value={formatReplyLatency(latency.platform.p50Ms)} />
            <FounderMetricCard
              label="P95"
              value={formatReplyLatency(latency.platform.p95Ms)}
              accent={latency.platform.p95Ms <= 30000}
            />
            <FounderMetricCard label="P99" value={formatReplyLatency(latency.platform.p99Ms)} />
          </div>
          {(latency.merchants ?? []).length > 0 && (
            <div className="rounded-xl border border-slate-100 overflow-hidden">
              <p className="text-[12px] font-semibold text-slate-600 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                Slowest merchants (P95)
              </p>
              <ul className="divide-y divide-slate-100">
                {(latency.merchants ?? []).slice(0, 10).map((m) => (
                  <li
                    key={m.merchantId}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-4 py-3 text-[13px]"
                  >
                    <span className="font-medium text-slate-800 truncate">
                      {m.merchantName || m.merchantId.slice(0, 8)}
                    </span>
                    <span className="text-slate-500 tabular-nums shrink-0">
                      p95 {formatReplyLatency(m.p95Ms)} · {m.sampleCount} turns
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </FounderSection>
      )}

      {!loading && hasPeakHours && peakHours && (
        <FounderPeakHoursChart data={peakHours} />
      )}

      {!loading && hasUnitEconomics && unitEconomics && (
        <FounderSection title="Unit economics" description="LLM cost and hosting vs order revenue.">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4">
            <FounderMetricCard
              label="LLM cost"
              value={`$${(unitEconomics.summary?.totalLlmCostUsd ?? 0).toFixed(2)}`}
            />
            <FounderMetricCard
              label="Hosting"
              value={`$${(unitEconomics.summary?.hostingUsdMonth ?? 0).toFixed(2)}`}
            />
            <FounderMetricCard
              label="Revenue"
              value={formatFounderGhs(unitEconomics.summary?.totalOrderRevenueGhs ?? 0)}
            />
            <FounderMetricCard
              label="Est. margin"
              value={`$${(unitEconomics.summary?.estPlatformMarginUsd ?? 0).toFixed(2)}`}
              accent={(unitEconomics.summary?.estPlatformMarginUsd ?? 0) > 0}
            />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="md:hidden divide-y divide-slate-100">
              {(unitEconomics.merchants ?? []).slice(0, 12).map((m) => (
                <div key={m.merchantId} className="px-4 py-3.5">
                  <p className="font-semibold text-slate-900 font-display text-[14px]">
                    {m.merchantName || m.merchantId.slice(0, 8)}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[12px] text-slate-500 tabular-nums">
                    <span>{m.replyCount} replies</span>
                    <span>LLM ${m.llmCostUsd.toFixed(2)}</span>
                    <span>{formatFounderGhs(m.orderRevenueGhs)}</span>
                    <span className={m.estMarginUsd >= 0 ? 'text-emerald-700' : 'text-red-600'}>
                      ${m.estMarginUsd.toFixed(2)} margin
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-slate-50 text-left text-slate-500 border-b border-slate-100">
                    <th className="px-4 py-3 font-bold">Merchant</th>
                    <th className="px-4 py-3 font-bold text-right">Replies</th>
                    <th className="px-4 py-3 font-bold text-right">LLM</th>
                    <th className="px-4 py-3 font-bold text-right">Revenue</th>
                    <th className="px-4 py-3 font-bold text-right">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(unitEconomics.merchants ?? []).slice(0, 15).map((m) => (
                    <tr key={m.merchantId} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {m.merchantName || m.merchantId.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{m.replyCount}</td>
                      <td className="px-4 py-3 text-right tabular-nums">${m.llmCostUsd.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatFounderGhs(m.orderRevenueGhs)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right tabular-nums font-semibold ${
                          m.estMarginUsd >= 0 ? 'text-emerald-700' : 'text-red-600'
                        }`}
                      >
                        ${m.estMarginUsd.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </FounderSection>
      )}
    </div>
  )
}
