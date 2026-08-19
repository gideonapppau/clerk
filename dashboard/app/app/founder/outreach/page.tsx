'use client'

import {
  FounderEmptyState,
  FounderErrorBanner,
  FounderLoading,
  FounderMetricCard,
  FounderPageHeader,
  FounderSection,
} from '@/components/founder/founder-ui'
import { formatUserError } from '@/lib/errors'
import {
  PIPELINE_PLATFORMS,
  createOutreach,
  deleteOutreach,
  fetchOutreach,
  fetchOutreachStats,
  type OutreachRow,
  type OutreachStats,
} from '@/lib/founder-api'
import { useCallback, useEffect, useState } from 'react'

const RESPONSES = [
  { value: 'none', label: 'No reply' },
  { value: 'replied', label: 'Replied' },
  { value: 'demo', label: 'Demo' },
  { value: 'trialing', label: 'Trialing' },
  { value: 'paid', label: 'Paid' },
  { value: 'rejected', label: 'Rejected' },
]

export default function FounderOutreachPage() {
  const [rows, setRows] = useState<OutreachRow[]>([])
  const [stats, setStats] = useState<OutreachStats | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({
    logDate: new Date().toISOString().slice(0, 10),
    platform: 'instagram',
    shopName: '',
    messageVersion: 'A',
    response: 'none',
    outcome: '',
    notes: '',
  })

  const load = useCallback(async () => {
    setError('')
    try {
      const [list, s] = await Promise.all([fetchOutreach(), fetchOutreachStats()])
      setRows(list.rows ?? [])
      setStats(s)
    } catch (err) {
      setError(formatUserError(err, "Couldn't load outreach log."))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function addRow() {
    if (!form.shopName.trim()) {
      setError('Shop name required')
      return
    }
    setBusy(true)
    setError('')
    try {
      await createOutreach(form)
      setForm((f) => ({ ...f, shopName: '', outcome: '', notes: '' }))
      await load()
    } catch (err) {
      setError(formatUserError(err, "Couldn't add row."))
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    setBusy(true)
    try {
      await deleteOutreach(id)
      await load()
    } catch (err) {
      setError(formatUserError(err, "Couldn't delete."))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <FounderLoading label="Loading outreach…" />

  return (
    <div className="space-y-6 sm:space-y-8 ui-enter max-w-5xl">
      <FounderPageHeader
        title="Cold outreach log"
        subtitle="One row per DM. Reply rate and message versions become real numbers."
        backHref="/founder"
        backLabel="Platform overview"
      />

      {error && <FounderErrorBanner message={error} onRetry={() => void load()} />}

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <FounderMetricCard label="DMs logged" value={stats.total} />
          <FounderMetricCard label="Replied" value={stats.replied} accent />
          <FounderMetricCard label="Reply rate" value={`${stats.replyPct.toFixed(0)}%`} />
          <FounderMetricCard label="Paid" value={stats.paid} />
        </div>
      )}

      {stats && (stats.byVersion ?? []).length > 0 && (
        <FounderSection title="A/B by message version" description="Which opener gets replies.">
          <div className="grid sm:grid-cols-3 gap-2">
            {(stats.byVersion ?? []).map((v) => (
              <div key={v.version} className="rounded-xl border border-slate-100 bg-white px-4 py-3">
                <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wide">Version {v.version}</p>
                <p className="text-[1.35rem] font-extrabold text-slate-900 font-display tabular-nums mt-1">
                  {v.replyPct.toFixed(0)}%
                </p>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  {v.replied}/{v.total} replied
                </p>
              </div>
            ))}
          </div>
        </FounderSection>
      )}

      <FounderSection title="Log a DM">
        <div className="grid sm:grid-cols-3 gap-3">
          <input
            type="date"
            value={form.logDate}
            onChange={(e) => setForm((f) => ({ ...f, logDate: e.target.value }))}
            className={inputClass}
          />
          <select
            value={form.platform}
            onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
            className={inputClass}
          >
            {PIPELINE_PLATFORMS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <input
            value={form.shopName}
            onChange={(e) => setForm((f) => ({ ...f, shopName: e.target.value }))}
            placeholder="Shop name"
            className={inputClass}
          />
          <input
            value={form.messageVersion}
            onChange={(e) => setForm((f) => ({ ...f, messageVersion: e.target.value }))}
            placeholder="Message version (A / B)"
            className={inputClass}
          />
          <select
            value={form.response}
            onChange={(e) => setForm((f) => ({ ...f, response: e.target.value }))}
            className={inputClass}
          >
            {RESPONSES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <input
            value={form.outcome}
            onChange={(e) => setForm((f) => ({ ...f, outcome: e.target.value }))}
            placeholder="Outcome notes"
            className={inputClass}
          />
        </div>
        <button
          type="button"
          onClick={() => void addRow()}
          disabled={busy}
          className="mt-3 text-[13px] font-bold bg-clerk-primary text-slate-950 px-5 py-2.5 rounded-full hover:bg-clerk-primary-dark hover:text-white disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Add row'}
        </button>
      </FounderSection>

      <FounderSection title="Log">
        {rows.length === 0 ? (
          <FounderEmptyState title="No DMs logged" description="Log every cold message. After 50 rows you know your real rates." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-[12px] text-left">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2.5 font-bold">Date</th>
                  <th className="px-3 py-2.5 font-bold">Platform</th>
                  <th className="px-3 py-2.5 font-bold">Shop</th>
                  <th className="px-3 py-2.5 font-bold">Version</th>
                  <th className="px-3 py-2.5 font-bold">Response</th>
                  <th className="px-3 py-2.5 font-bold" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="bg-white">
                    <td className="px-3 py-2.5 tabular-nums">{r.logDate}</td>
                    <td className="px-3 py-2.5 capitalize">{r.platform}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-900">{r.shopName}</td>
                    <td className="px-3 py-2.5">{r.messageVersion || '—'}</td>
                    <td className="px-3 py-2.5 capitalize">{r.response}</td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => void remove(r.id)}
                        className="text-red-600 font-semibold hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </FounderSection>
    </div>
  )
}

const inputClass =
  'w-full px-3 py-2.5 text-[14px] text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clerk-primary/25 focus:border-clerk-primary'
