'use client'

import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { routes } from '@/lib/dashboard-routes'
import { badgeClass } from '@/lib/dashboard-ui'
import { setToken, formatUserError } from '@/lib/api'
import { DashPanel } from '@/components/DashPanel'
import { PushNotificationsSetting } from '@/components/dashboard/PushNotificationsSetting'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 py-4 border-b border-slate-100 last:border-0">
      <span className="text-[12px] sm:text-[13px] font-semibold sm:font-normal text-slate-600 sm:text-slate-500 shrink-0">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-2.5 min-w-0 sm:justify-end w-full sm:w-auto">{children}</div>
    </div>
  )
}

function Section({ children }: { children: ReactNode }) {
  return (
    <DashPanel padding={false}>
      <div className="px-4 sm:px-5 py-1">{children}</div>
    </DashPanel>
  )
}

export function SettingsPanel() {
  const { me, session, waConnected, updateBusinessName, updateBusinessScope } = useDashboard()
  const plan = me?.plan ?? 'starter'

  const [editing, setEditing] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [nameError, setNameError] = useState('')
  const [scopeEditing, setScopeEditing] = useState(false)
  const [scopeValue, setScopeValue] = useState('')
  const [scopeSaving, setScopeSaving] = useState(false)
  const [scopeError, setScopeError] = useState('')

  function startEdit() {
    setNameValue(me?.businessName ?? '')
    setNameError('')
    setEditing(true)
  }

  async function saveEdit() {
    const trimmed = nameValue.trim()
    if (!trimmed) {
      setNameError('Name cannot be empty')
      return
    }
    setSaving(true)
    try {
      await updateBusinessName(trimmed)
      setEditing(false)
    } catch (err) {
      setNameError(formatUserError(err, 'Failed to save. Try again.'))
    } finally {
      setSaving(false)
    }
  }

  function startScopeEdit() {
    setScopeValue(me?.businessScope ?? '')
    setScopeError('')
    setScopeEditing(true)
  }

  async function saveScopeEdit() {
    const trimmed = scopeValue.trim()
    setScopeSaving(true)
    try {
      await updateBusinessScope(trimmed)
      setScopeEditing(false)
    } catch (err) {
      setScopeError(formatUserError(err, 'Failed to save. Try again.'))
    } finally {
      setScopeSaving(false)
    }
  }

  function signOut() {
    setToken(null)
    window.location.href = '/login'
  }

  return (
    <div className="space-y-3 ui-enter max-w-lg pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <Section>
        <Row label="Business name">
          {editing ? (
            <div className="flex flex-col items-stretch sm:items-end gap-1.5 w-full sm:w-auto">
              <input
                autoFocus
                value={nameValue}
                onChange={(e) => {
                  setNameValue(e.target.value)
                  setNameError('')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void saveEdit()
                  if (e.key === 'Escape') setEditing(false)
                }}
                className="w-full sm:w-44 px-3 py-3 sm:py-2 text-[16px] sm:text-[13px] text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clerk-primary/25 focus:border-clerk-primary transition-all"
              />
              {nameError && <p className="text-[11px] text-red-500">{nameError}</p>}
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => void saveEdit()}
                  disabled={saving}
                  className="min-h-[44px] text-[12px] font-bold bg-clerk-primary text-slate-950 px-4 py-2.5 rounded-full hover:bg-clerk-primary-dark hover:text-white transition-colors disabled:opacity-50 touch-manipulation"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="min-h-[44px] text-[12px] font-semibold text-slate-500 border border-slate-200 px-4 py-2.5 rounded-full hover:bg-slate-50 transition-colors touch-manipulation"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <span className="text-[13px] font-semibold text-slate-900 truncate">{me?.businessName ?? '—'}</span>
              <button
                type="button"
                onClick={startEdit}
                className="min-h-[44px] inline-flex items-center text-[12px] font-semibold text-clerk-primary-darker hover:underline shrink-0 touch-manipulation px-1"
              >
                Edit
              </button>
            </>
          )}
        </Row>
        <Row label="Store scope">
          {scopeEditing ? (
            <div className="flex flex-col items-stretch sm:items-end gap-1.5 w-full sm:w-auto">
              <input
                autoFocus
                value={scopeValue}
                onChange={(e) => {
                  setScopeValue(e.target.value)
                  setScopeError('')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void saveScopeEdit()
                  if (e.key === 'Escape') setScopeEditing(false)
                }}
                placeholder="e.g. perfumes, fashion, electronics"
                className="w-full sm:w-72 px-3 py-3 sm:py-2 text-[16px] sm:text-[13px] text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clerk-primary/25 focus:border-clerk-primary transition-all"
              />
              <p className="text-[11px] text-slate-500 sm:max-w-72">
                Describe what this store sells so Clerk can reject off-topic requests more accurately.
              </p>
              {scopeError && <p className="text-[11px] text-red-500">{scopeError}</p>}
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => void saveScopeEdit()}
                  disabled={scopeSaving}
                  className="min-h-[44px] text-[12px] font-bold bg-clerk-primary text-slate-950 px-4 py-2.5 rounded-full hover:bg-clerk-primary-dark hover:text-white transition-colors disabled:opacity-50 touch-manipulation"
                >
                  {scopeSaving ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setScopeEditing(false)}
                  className="min-h-[44px] text-[12px] font-semibold text-slate-500 border border-slate-200 px-4 py-2.5 rounded-full hover:bg-slate-50 transition-colors touch-manipulation"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex min-w-0 flex-col">
                <span className="text-[13px] font-semibold text-slate-900 truncate">
                  {me?.businessScope?.trim() ? me.businessScope : 'Not set'}
                </span>
                {!me?.businessScope?.trim() ? (
                  <span className="text-[11px] text-amber-600">Add this so Clerk understands what your store sells.</span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={startScopeEdit}
                className="min-h-[44px] inline-flex items-center text-[12px] font-semibold text-clerk-primary-darker hover:underline shrink-0 touch-manipulation px-1"
              >
                {me?.businessScope?.trim() ? 'Edit' : 'Set scope'}
              </button>
            </>
          )}
        </Row>
        <Row label="Plan">
          <span
            className={`${badgeClass(plan === 'starter' || plan === 'trial' || !plan ? 'muted' : 'success')} capitalize px-2.5 py-1`}
          >
            {plan}
          </span>
          <Link
            href={routes.billing}
            className="min-h-[44px] inline-flex items-center text-[12px] font-semibold text-clerk-primary-darker hover:underline shrink-0 touch-manipulation px-1"
          >
            Manage plan
          </Link>
        </Row>
      </Section>

      <Section>
        <Row label="Notifications">
          <PushNotificationsSetting />
        </Row>
      </Section>

      <Section>
        <Row label="Status">
          <span className={`size-1.5 rounded-full shrink-0 ${waConnected ? 'bg-clerk-primary' : 'bg-slate-300'}`} />
          <span className="text-[13px] text-slate-700 tabular-nums">
            {waConnected && session?.phone ? `+${session.phone}` : 'Not connected'}
          </span>
          <Link
            href={routes.whatsapp}
            className="min-h-[44px] inline-flex items-center gap-1.5 text-[12px] font-semibold text-clerk-primary-darker hover:underline shrink-0 touch-manipulation px-1"
          >
            <Image src="/whatsapp.svg" alt="" width={14} height={14} aria-hidden />
            {waConnected ? 'Manage' : 'Connect'}
          </Link>
        </Row>
      </Section>

      <Section>
        <div className="py-4">
          <button
            type="button"
            onClick={signOut}
            className="w-full min-h-[48px] inline-flex items-center justify-center text-[13px] font-semibold text-red-600 border border-red-200 bg-red-50/80 px-4 py-3 rounded-xl hover:bg-red-50 transition-colors touch-manipulation"
          >
            Sign out
          </button>
        </div>
      </Section>
    </div>
  )
}
