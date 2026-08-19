'use client'

import {
  FounderErrorBanner,
  FounderLoading,
  FounderPageHeader,
  FounderSection,
} from '@/components/founder/founder-ui'
import { formatUserError } from '@/lib/errors'
import {
  fetchContentWeek,
  fetchScorecards,
  upsertContentWeek,
  upsertScorecard,
  type ContentWeek,
  type FounderScorecard,
} from '@/lib/founder-api'
import { useCallback, useEffect, useState } from 'react'

function mondayOfWeek(d = new Date()): string {
  const day = d.getUTCDay() || 7
  const mon = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - (day - 1)))
  return mon.toISOString().slice(0, 10)
}

export default function FounderScorecardPage() {
  const [list, setList] = useState<FounderScorecard[]>([])
  const [content, setContent] = useState<ContentWeek>({
    weekStart: mondayOfWeek(),
    monProblem: false,
    wedProof: false,
    friFounder: false,
    notes: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({
    weekStart: mondayOfWeek(),
    coldDms: 0,
    demos: 0,
    newPaid: 0,
    mrrGhs: 0,
    avoided: '',
    sittingOn: '',
  })

  const load = useCallback(async () => {
    setError('')
    try {
      const week = mondayOfWeek()
      const [data, weekContent] = await Promise.all([fetchScorecards(), fetchContentWeek(week)])
      const cards = data.scorecards ?? []
      setList(cards)
      setContent({
        weekStart: weekContent.weekStart || week,
        monProblem: !!weekContent.monProblem,
        wedProof: !!weekContent.wedProof,
        friFounder: !!weekContent.friFounder,
        notes: weekContent.notes ?? '',
        id: weekContent.id,
      })
      const current = cards.find((c) => c.weekStart === week)
      if (current) {
        setForm({
          weekStart: current.weekStart,
          coldDms: current.coldDms,
          demos: current.demos,
          newPaid: current.newPaid,
          mrrGhs: current.mrrGhs,
          avoided: current.avoided,
          sittingOn: current.sittingOn,
        })
      }
    } catch (err) {
      setError(formatUserError(err, "Couldn't load scorecards."))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function save() {
    setBusy(true)
    setError('')
    try {
      await upsertScorecard(form)
      await load()
    } catch (err) {
      setError(formatUserError(err, "Couldn't save scorecard."))
    } finally {
      setBusy(false)
    }
  }

  async function togglePost(key: 'monProblem' | 'wedProof' | 'friFounder') {
    const next = { ...content, [key]: !content[key] }
    setContent(next)
    try {
      const saved = await upsertContentWeek({
        weekStart: next.weekStart,
        monProblem: next.monProblem,
        wedProof: next.wedProof,
        friFounder: next.friFounder,
        notes: next.notes,
      })
      setContent({
        weekStart: saved.weekStart,
        monProblem: saved.monProblem,
        wedProof: saved.wedProof,
        friFounder: saved.friFounder,
        notes: saved.notes ?? '',
        id: saved.id,
      })
    } catch (err) {
      setContent(content)
      setError(formatUserError(err, "Couldn't update content calendar."))
    }
  }

  if (loading) return <FounderLoading label="Loading scorecard…" />

  return (
    <div className="space-y-6 sm:space-y-8 ui-enter max-w-2xl">
      <FounderPageHeader
        title="Weekly scorecard"
        subtitle="Five minutes every Friday. Forces honesty."
        backHref="/founder"
        backLabel="Platform overview"
      />

      {error && <FounderErrorBanner message={error} onRetry={() => void load()} />}

      <FounderSection
        title="Content calendar"
        description="Three posts per week. Check each morning — removes the decision tax."
      >
        <ul className="space-y-2">
          {(
            [
              { key: 'monProblem' as const, label: 'Monday: Problem post' },
              { key: 'wedProof' as const, label: 'Wednesday: Proof post' },
              { key: 'friFounder' as const, label: 'Friday: Founder post' },
            ] as const
          ).map((row) => (
            <li key={row.key}>
              <button
                type="button"
                onClick={() => void togglePost(row.key)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-left"
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border text-[12px] ${
                    content[row.key]
                      ? 'bg-clerk-primary border-clerk-primary text-slate-950'
                      : 'border-slate-300 text-transparent'
                  }`}
                  aria-hidden
                >
                  ✓
                </span>
                <span
                  className={`text-[13px] font-semibold ${
                    content[row.key] ? 'text-slate-400 line-through' : 'text-slate-800'
                  }`}
                >
                  {row.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </FounderSection>

      <FounderSection title={`Week of ${form.weekStart}`}>
        <div className="space-y-4">
          <NumField
            label="Cold DMs sent"
            target="Target: 20"
            value={form.coldDms}
            onChange={(n) => setForm((f) => ({ ...f, coldDms: n }))}
          />
          <NumField
            label="Demos done"
            target="Target: 3"
            value={form.demos}
            onChange={(n) => setForm((f) => ({ ...f, demos: n }))}
          />
          <NumField
            label="New paying merchants"
            target="Target: 1"
            value={form.newPaid}
            onChange={(n) => setForm((f) => ({ ...f, newPaid: n }))}
          />
          <NumField
            label="MRR (GHS)"
            value={form.mrrGhs}
            onChange={(n) => setForm((f) => ({ ...f, mrrGhs: n }))}
          />
          <label className="block">
            <span className="block text-[13px] font-semibold text-slate-800 mb-1">
              Biggest thing I avoided this week
            </span>
            <textarea
              value={form.avoided}
              onChange={(e) => setForm((f) => ({ ...f, avoided: e.target.value }))}
              className={inputClass}
              rows={2}
              placeholder="Be honest."
            />
          </label>
          <label className="block">
            <span className="block text-[13px] font-semibold text-slate-800 mb-1">
              One decision I&apos;m still sitting on
            </span>
            <textarea
              value={form.sittingOn}
              onChange={(e) => setForm((f) => ({ ...f, sittingOn: e.target.value }))}
              className={inputClass}
              rows={2}
              placeholder="Name it."
            />
          </label>
          <button
            type="button"
            onClick={() => void save()}
            disabled={busy}
            className="text-[13px] font-bold bg-clerk-primary text-slate-950 px-5 py-2.5 rounded-full hover:bg-clerk-primary-dark hover:text-white disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Save this week'}
          </button>
        </div>
      </FounderSection>

      {list.length > 0 && (
        <FounderSection title="Past weeks">
          <ul className="divide-y divide-slate-100">
            {list.map((s) => (
              <li key={s.id} className="py-3 text-[13px]">
                <p className="font-semibold text-slate-900 font-display">{s.weekStart}</p>
                <p className="text-slate-500 mt-0.5">
                  DMs {s.coldDms} · Demos {s.demos} · Paid {s.newPaid} · MRR GHS {s.mrrGhs}
                </p>
                {s.avoided && <p className="text-slate-600 mt-1">Avoided: {s.avoided}</p>}
                {s.sittingOn && <p className="text-slate-600">Sitting on: {s.sittingOn}</p>}
              </li>
            ))}
          </ul>
        </FounderSection>
      )}
    </div>
  )
}

const inputClass =
  'w-full px-3 py-2.5 text-[14px] text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clerk-primary/25 focus:border-clerk-primary'

function NumField({
  label,
  target,
  value,
  onChange,
}: {
  label: string
  target?: string
  value: number
  onChange: (n: number) => void
}) {
  return (
    <label className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <span>
        <span className="block text-[13px] font-semibold text-slate-800">{label}</span>
        {target && <span className="text-[11px] text-slate-400">{target}</span>}
      </span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
        className={`${inputClass} sm:w-28 tabular-nums`}
      />
    </label>
  )
}
