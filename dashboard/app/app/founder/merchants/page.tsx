'use client'

import { FounderControls, rangeContext } from '@/components/founder/FounderControls'
import {
  FounderErrorBanner,
  FounderLoading,
  FounderMetricCard,
  FounderPageHeader,
} from '@/components/founder/founder-ui'
import { useFounderRefresh } from '@/components/founder/useFounderRefresh'
import { badgeClass } from '@/lib/dashboard-ui'
import { fetchMerchantHealth, type FounderRange, type MerchantHealthRow } from '@/lib/founder-api'
import { formatUserError } from '@/lib/errors'
import { useCallback, useState } from 'react'

function LinkBadge({ linked, online }: { linked: boolean; online: boolean }) {
  if (!linked) {
    return <span className={badgeClass('muted')}>Never linked</span>
  }
  if (online) {
    return <span className={badgeClass('success')}>Linked · online</span>
  }
  return <span className={badgeClass('warning')}>Linked · offline</span>
}

function OrderBadge({ m }: { m: MerchantHealthRow }) {
  if (m.hasFirstOrder) {
    return <span className={badgeClass('success')}>Live order</span>
  }
  if (m.hasSimulatedOrder) {
    return <span className={badgeClass('warning')}>Simulated only</span>
  }
  return <span className={badgeClass('muted')}>No order</span>
}

function formatHours(h?: number): string {
  if (h === undefined || h === null) return '—'
  if (h < 1) return `${Math.round(h * 60)}m`
  if (h < 48) return `${h.toFixed(1)}h`
  return `${Math.round(h / 24)}d`
}

function timeToFirstOrderLabel(m: MerchantHealthRow): string {
  if (m.hasFirstOrder && m.hoursToFirstOrder != null) {
    return formatHours(m.hoursToFirstOrder)
  }
  if (m.hasSimulatedOrder) {
    return 'Simulated'
  }
  if (!m.whatsappLinked) {
    return 'Link WhatsApp first'
  }
  if (m.slowActivation) {
    return 'No order >48h'
  }
  return '—'
}

function MerchantMobileRow({ m }: { m: MerchantHealthRow }) {
  return (
    <div className={`px-4 py-4 ${m.slowActivation ? 'bg-red-50/50' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 font-display text-[14px] leading-snug">
            {m.name || 'Unnamed'}
          </p>
          <p className="text-[12px] text-slate-500 mt-0.5 truncate">{m.email || m.id.slice(0, 8)}</p>
        </div>
        {m.slowActivation && (
          <span className={badgeClass('danger')}>Needs attention</span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        <LinkBadge linked={m.whatsappLinked} online={m.socketOnline} />
        <span className={badgeClass(m.hasInventory ? 'success' : 'muted')}>
          {m.hasInventory ? 'Inventory' : 'No inventory'}
        </span>
        <OrderBadge m={m} />
        <span className={badgeClass(m.active ? 'success' : 'muted')}>{m.active ? 'Active' : 'Quiet'}</span>
      </div>

      <p className="text-[12px] text-slate-500 mt-2.5 tabular-nums">
        Link → 1st order:{' '}
        <span
          className={
            m.slowActivation
              ? 'text-red-600 font-semibold'
              : 'text-slate-700 font-medium'
          }
        >
          {timeToFirstOrderLabel(m)}
        </span>
      </p>
    </div>
  )
}

export default function FounderMerchantsPage() {
  const [days, setDays] = useState<FounderRange>(30)
  const [merchants, setMerchants] = useState<MerchantHealthRow[]>([])
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const data = await fetchMerchantHealth(days)
      setMerchants(data.merchants ?? [])
    } catch (err) {
      setError(formatUserError(err, "Couldn't load merchant list."))
    }
  }, [days])

  const { autoRefresh, setAutoRefresh, lastUpdated, refreshing, refresh } = useFounderRefresh(load, [days])

  const slowCount = merchants.filter((m) => m.slowActivation).length
  const linkedCount = merchants.filter((m) => m.whatsappLinked).length
  const onlineCount = merchants.filter((m) => m.socketOnline).length
  const activatedCount = merchants.filter((m) => m.hasFirstOrder).length
  const simulatedCount = merchants.filter((m) => m.hasSimulatedOrder).length
  const loading = refreshing && merchants.length === 0 && !error

  const subtitle =
    `${rangeContext(days)} · live orders mean orders created after WhatsApp was linked` +
    (slowCount > 0 ? ` · ${slowCount} need attention` : '')

  return (
    <div className="space-y-6 sm:space-y-8 ui-enter max-w-5xl">
      <FounderPageHeader
        title="Merchant health"
        subtitle={subtitle}
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

      {loading && <FounderLoading label="Loading merchants…" />}

      {!loading && !error && merchants.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          {[
            { label: 'In range', value: merchants.length },
            { label: 'Ever linked', value: linkedCount },
            { label: 'Socket online', value: onlineCount },
            { label: 'Merchants with live orders', value: activatedCount },
          ].map((s) => (
            <FounderMetricCard key={s.label} label={s.label} value={s.value} />
          ))}
        </div>
      )}

      {!loading && !error && simulatedCount > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
          <span className="font-semibold">{simulatedCount}</span> merchant{simulatedCount === 1 ? '' : 's'} have
          simulated orders created before WhatsApp was linked.
        </div>
      )}

      {!loading && !error && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_8px_40px_rgba(15,23,42,0.07)] overflow-hidden">
          <div className="md:hidden divide-y divide-slate-100">
            {merchants.length === 0 ? (
              <p className="text-center text-slate-500 py-12 text-sm px-4">No merchants in this range</p>
            ) : (
              merchants.map((m) => <MerchantMobileRow key={m.id} m={m} />)
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[12px] font-semibold text-slate-500">
                  <th className="px-4 py-3.5 font-bold">Merchant</th>
                  <th className="px-4 py-3.5 font-bold">WhatsApp</th>
                  <th className="px-4 py-3.5 font-bold">Inventory</th>
                  <th className="px-4 py-3.5 font-bold">Orders</th>
                  <th className="px-4 py-3.5 font-bold">Active</th>
                  <th className="px-4 py-3.5 font-bold">Link → 1st order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {merchants.map((m) => (
                  <tr
                    key={m.id}
                    className={
                      m.slowActivation
                        ? 'bg-red-50/50'
                        : 'hover:bg-slate-50/80 transition-colors'
                    }
                  >
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-900 font-display">{m.name || 'Unnamed'}</p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                        {m.email || m.id.slice(0, 8)}
                      </p>
                      {m.hasSimulatedOrder && (
                        <p className="text-[10px] text-amber-700 font-medium mt-1">Has pre-link simulated orders</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <LinkBadge linked={m.whatsappLinked} online={m.socketOnline} />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={badgeClass(m.hasInventory ? 'success' : 'muted')}>
                        {m.hasInventory ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <OrderBadge m={m} />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={badgeClass(m.active ? 'success' : 'muted')}>
                        {m.active ? 'Active' : 'Quiet'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 tabular-nums text-[13px]">
                      <span
                        className={
                          m.slowActivation
                            ? 'text-red-600 font-semibold'
                            : 'text-slate-700'
                        }
                      >
                        {timeToFirstOrderLabel(m)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {merchants.length === 0 && (
              <p className="text-center text-slate-500 py-12 text-sm">No merchants in this range</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
