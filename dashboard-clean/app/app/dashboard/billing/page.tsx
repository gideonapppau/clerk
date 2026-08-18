'use client'

import { Suspense } from 'react'
import { BillingPanel } from '@/components/dashboard/BillingPanel'

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="p-6 text-[13px] text-slate-500">Loading plan…</div>}>
      <BillingPanel />
    </Suspense>
  )
}
