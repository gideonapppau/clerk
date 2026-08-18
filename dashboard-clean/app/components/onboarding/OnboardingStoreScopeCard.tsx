'use client'

import {
  catalogFieldInputClass,
  catalogFieldLabelClass,
} from '@/components/dashboard/CatalogItemFields'
import { updateMe } from '@/lib/api'
import { badgeClass } from '@/lib/dashboard-ui'
import { formatUserError } from '@/lib/errors'
import { useEffect, useState } from 'react'

type Props = {
  businessScope?: string
  onSaved: (scope: string) => void
  onError: (msg: string) => void
}

export function OnboardingStoreScopeCard({ businessScope, onSaved, onError }: Props) {
  const [scope, setScope] = useState(businessScope ?? '')
  const [saving, setSaving] = useState(false)
  const [savedScope, setSavedScope] = useState(businessScope?.trim() ?? '')

  useEffect(() => {
    if (businessScope?.trim()) {
      setSavedScope(businessScope.trim())
      setScope(businessScope.trim())
    }
  }, [businessScope])

  async function save() {
    const trimmed = scope.trim()
    if (!trimmed) {
      onError('Describe what your store sells')
      return
    }
    if (trimmed === savedScope) return

    setSaving(true)
    onError('')
    try {
      await updateMe({ businessScope: trimmed })
      setSavedScope(trimmed)
      onSaved(trimmed)
    } catch (err) {
      onError(formatUserError(err, "Couldn't save store scope."))
    } finally {
      setSaving(false)
    }
  }

  if (savedScope) {
    return (
      <div className="mb-5 pb-5 border-b border-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={catalogFieldLabelClass}>What you sell</p>
            <p className="text-[14px] font-semibold text-slate-900 truncate">{savedScope}</p>
          </div>
          <span className={badgeClass('success')}>Saved</span>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-5 pb-5 border-b border-slate-100">
      <label htmlFor="ob-store-scope" className={catalogFieldLabelClass}>
        What you sell
      </label>
      <input
        id="ob-store-scope"
        value={scope}
        onChange={(e) => setScope(e.target.value)}
        onBlur={() => {
          if (scope.trim()) void save()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            void save()
          }
        }}
        placeholder="e.g. perfumes, fashion, electronics"
        className={catalogFieldInputClass}
      />
      <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
        One line on your catalog. Helps Clerk reject off-topic questions.
      </p>
      <button
        type="button"
        onClick={() => void save()}
        disabled={saving || !scope.trim()}
        className="mt-3 w-full inline-flex items-center justify-center bg-clerk-primary text-slate-950 text-[13px] font-bold px-5 py-2.5 rounded-full hover:bg-clerk-primary-dark hover:text-white transition-colors disabled:opacity-40"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}
