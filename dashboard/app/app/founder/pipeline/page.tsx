'use client'

import {
  FounderEmptyState,
  FounderErrorBanner,
  FounderLoading,
  FounderMetricCard,
  FounderPageHeader,
  FounderSection,
} from '@/components/founder/founder-ui'
import { badgeClass } from '@/lib/dashboard-ui'
import { formatUserError } from '@/lib/errors'
import {
  PIPELINE_PLATFORMS,
  PIPELINE_STATUSES,
  createPipelineLead,
  deletePipelineLead,
  fetchPipelineLeads,
  fetchPipelineSummary,
  updatePipelineLead,
  type PipelineLead,
  type PipelineLeadInput,
  type PipelinePlatform,
  type PipelineStatus,
  type PipelineSummary,
} from '@/lib/founder-api'
import { useCallback, useEffect, useMemo, useState } from 'react'

const emptyForm = (): PipelineLeadInput => ({
  shopName: '',
  contactName: '',
  platform: 'instagram',
  contactDate: new Date().toISOString().slice(0, 10),
  status: 'contacted',
  lastAction: '',
  nextAction: '',
  nextActionAt: '',
  notes: '',
})

function statusTone(status: PipelineStatus): 'pending' | 'success' | 'neutral' | 'muted' | 'danger' | 'warning' {
  switch (status) {
    case 'paid':
      return 'success'
    case 'trialing':
    case 'demo':
      return 'pending'
    case 'replied':
      return 'warning'
    case 'churned':
      return 'danger'
    default:
      return 'muted'
  }
}

function platformLabel(p: string): string {
  return PIPELINE_PLATFORMS.find((x) => x.value === p)?.label ?? p
}

function statusLabel(s: string): string {
  return PIPELINE_STATUSES.find((x) => x.value === s)?.label ?? s
}

export default function FounderPipelinePage() {
  const [leads, setLeads] = useState<PipelineLead[]>([])
  const [summary, setSummary] = useState<PipelineSummary | null>(null)
  const [filter, setFilter] = useState<PipelineStatus | ''>('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<PipelineLead | null>(null)
  const [form, setForm] = useState<PipelineLeadInput>(emptyForm)

  const load = useCallback(async () => {
    setError('')
    try {
      const [list, sum] = await Promise.all([
        fetchPipelineLeads(filter || undefined),
        fetchPipelineSummary(),
      ])
      setLeads(list.leads ?? [])
      setSummary(sum)
    } catch (err) {
      setError(formatUserError(err, "Couldn't load pipeline."))
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    setLoading(true)
    void load()
  }, [load])

  const overdueCount = useMemo(() => leads.filter((l) => l.overdue).length, [leads])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm())
    setShowForm(true)
  }

  function openEdit(lead: PipelineLead) {
    setEditing(lead)
    setForm({
      shopName: lead.shopName,
      contactName: lead.contactName,
      platform: lead.platform,
      contactDate: lead.contactDate,
      status: lead.status,
      lastAction: lead.lastAction,
      nextAction: lead.nextAction,
      nextActionAt: lead.nextActionAt ?? '',
      notes: lead.notes,
    })
    setShowForm(true)
  }

  async function saveForm() {
    if (!form.shopName?.trim()) {
      setError('Shop name is required')
      return
    }
    setBusy('save')
    setError('')
    try {
      const payload: PipelineLeadInput = {
        ...form,
        nextActionAt: form.nextActionAt?.trim() ? form.nextActionAt : null,
        clearNextActionAt: editing ? !form.nextActionAt?.trim() : undefined,
      }
      if (editing) {
        await updatePipelineLead(editing.id, payload)
      } else {
        await createPipelineLead(payload)
      }
      setShowForm(false)
      setEditing(null)
      await load()
    } catch (err) {
      setError(formatUserError(err, "Couldn't save lead."))
    } finally {
      setBusy('')
    }
  }

  async function removeLead(id: string) {
    if (!window.confirm('Remove this lead from the pipeline?')) return
    setBusy(id)
    setError('')
    try {
      await deletePipelineLead(id)
      await load()
    } catch (err) {
      setError(formatUserError(err, "Couldn't delete lead."))
    } finally {
      setBusy('')
    }
  }

  async function advanceStatus(lead: PipelineLead) {
    const order: PipelineStatus[] = ['contacted', 'replied', 'demo', 'trialing', 'paid']
    const idx = order.indexOf(lead.status)
    if (idx < 0 || idx >= order.length - 1) return
    const next = order[idx + 1]!
    setBusy(lead.id)
    try {
      await updatePipelineLead(lead.id, {
        status: next,
        lastAction: `Moved to ${statusLabel(next)}`,
      })
      await load()
    } catch (err) {
      setError(formatUserError(err, "Couldn't update status."))
    } finally {
      setBusy('')
    }
  }

  if (loading) return <FounderLoading label="Loading pipeline…" />

  return (
    <div className="space-y-6 sm:space-y-8 ui-enter max-w-5xl">
      <FounderPageHeader
        title="Pipeline"
        subtitle="Every shop you contacted — status, next action, no follow-ups lost"
        action={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 text-[13px] font-bold bg-clerk-primary text-slate-950 px-4 py-2.5 rounded-full hover:bg-clerk-primary-dark hover:text-white transition-colors min-h-[40px]"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              add
            </span>
            Add lead
          </button>
        }
      />

      {error && <FounderErrorBanner message={error} onRetry={() => void load()} />}

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
          <FounderMetricCard label="Total" value={summary.total} />
          <FounderMetricCard label="Contacted" value={summary.contacted} />
          <FounderMetricCard label="Replied" value={summary.replied} />
          <FounderMetricCard label="Demo" value={summary.demo} />
          <FounderMetricCard label="Trialing" value={summary.trialing} accent />
          <FounderMetricCard label="Paid" value={summary.paid} accent />
          <FounderMetricCard label="Overdue" value={summary.overdue} />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <FilterChip active={filter === ''} onClick={() => setFilter('')} label="All" />
        {PIPELINE_STATUSES.map((s) => (
          <FilterChip
            key={s.value}
            active={filter === s.value}
            onClick={() => setFilter(s.value)}
            label={s.label}
          />
        ))}
      </div>

      {showForm && (
        <FounderSection title={editing ? 'Edit lead' : 'New lead'}>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Shop name *">
              <input
                value={form.shopName ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, shopName: e.target.value }))}
                className={inputClass}
                placeholder="Larry's Gadgets"
              />
            </Field>
            <Field label="Contact name">
              <input
                value={form.contactName ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                className={inputClass}
                placeholder="Larry"
              />
            </Field>
            <Field label="Platform">
              <select
                value={form.platform ?? 'instagram'}
                onChange={(e) =>
                  setForm((f) => ({ ...f, platform: e.target.value as PipelinePlatform }))
                }
                className={inputClass}
              >
                {PIPELINE_PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                value={form.status ?? 'contacted'}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as PipelineStatus }))}
                className={inputClass}
              >
                {PIPELINE_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Contact date">
              <input
                type="date"
                value={form.contactDate ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, contactDate: e.target.value }))}
                className={inputClass}
              />
            </Field>
            <Field label="Next action date">
              <input
                type="date"
                value={form.nextActionAt ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, nextActionAt: e.target.value }))}
                className={inputClass}
              />
            </Field>
            <Field label="Last action">
              <input
                value={form.lastAction ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, lastAction: e.target.value }))}
                className={inputClass}
                placeholder="Opener DM sent"
              />
            </Field>
            <Field label="Next action">
              <input
                value={form.nextAction ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, nextAction: e.target.value }))}
                className={inputClass}
                placeholder="Follow up if no reply"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Notes">
                <textarea
                  value={form.notes ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className={`${inputClass} min-h-[72px] resize-y`}
                  placeholder="Said let me think about it…"
                />
              </Field>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              type="button"
              onClick={() => void saveForm()}
              disabled={busy === 'save'}
              className="text-[13px] font-bold bg-clerk-primary text-slate-950 px-5 py-2.5 rounded-full hover:bg-clerk-primary-dark hover:text-white disabled:opacity-50"
            >
              {busy === 'save' ? 'Saving…' : editing ? 'Save changes' : 'Add to pipeline'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setEditing(null)
              }}
              className="text-[13px] font-semibold text-slate-600 border border-slate-200 px-5 py-2.5 rounded-full hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </FounderSection>
      )}

      <FounderSection
        title="Leads"
        description={
          overdueCount > 0
            ? `${overdueCount} overdue follow-up${overdueCount === 1 ? '' : 's'} — do these first`
            : 'Sorted by overdue, then next action date'
        }
      >
        {leads.length === 0 ? (
          <FounderEmptyState
            title="No leads yet"
            description="Add every shop you DM. Status and next-action dates keep follow-ups from slipping."
          />
        ) : (
          <div className="space-y-2">
            {leads.map((lead) => (
              <article
                key={lead.id}
                className={`rounded-xl border px-4 py-3.5 ${
                  lead.overdue
                    ? 'border-amber-200 bg-amber-50/60'
                    : 'border-slate-100 bg-white'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900 font-display text-[15px]">
                        {lead.shopName}
                      </h3>
                      <span className={badgeClass(statusTone(lead.status))}>
                        {statusLabel(lead.status)}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500">
                        {platformLabel(lead.platform)}
                      </span>
                      {lead.overdue && (
                        <span className={badgeClass('warning')}>Overdue</span>
                      )}
                    </div>
                    {lead.contactName && (
                      <p className="text-[12px] text-slate-500 mt-0.5">{lead.contactName}</p>
                    )}
                    <div className="mt-2 grid sm:grid-cols-2 gap-1 text-[12px] text-slate-600">
                      <p>
                        <span className="text-slate-400">Contacted </span>
                        {lead.contactDate}
                      </p>
                      {lead.lastAction && (
                        <p>
                          <span className="text-slate-400">Last </span>
                          {lead.lastAction}
                        </p>
                      )}
                      {(lead.nextAction || lead.nextActionAt) && (
                        <p className={lead.overdue ? 'text-amber-800 font-medium' : ''}>
                          <span className="text-slate-400">Next </span>
                          {lead.nextAction || 'Follow up'}
                          {lead.nextActionAt ? ` · ${lead.nextActionAt}` : ''}
                        </p>
                      )}
                    </div>
                    {lead.notes && (
                      <p className="mt-2 text-[12px] text-slate-500 leading-relaxed">{lead.notes}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {lead.status !== 'paid' && lead.status !== 'churned' && (
                      <button
                        type="button"
                        onClick={() => void advanceStatus(lead)}
                        disabled={busy === lead.id}
                        className="text-[12px] font-semibold text-clerk-primary-darker bg-clerk-light px-3 py-1.5 rounded-full hover:bg-clerk-primary/20 disabled:opacity-50"
                      >
                        Advance
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openEdit(lead)}
                      className="text-[12px] font-semibold text-slate-600 border border-slate-200 px-3 py-1.5 rounded-full hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeLead(lead.id)}
                      disabled={busy === lead.id}
                      className="text-[12px] font-semibold text-red-600 px-3 py-1.5 rounded-full hover:bg-red-50 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </FounderSection>
    </div>
  )
}

const inputClass =
  'w-full px-3 py-2.5 text-[14px] text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clerk-primary/25 focus:border-clerk-primary'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold text-slate-600 mb-1">{label}</span>
      {children}
    </label>
  )
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-[12px] font-semibold px-3 py-1.5 rounded-full transition-colors ${
        active
          ? 'bg-slate-900 text-white'
          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  )
}
