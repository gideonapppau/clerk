'use client'

import { Suspense } from 'react'
import BillingCompleteInner from './BillingCompleteInner'

export default function BillingCompletePage() {
  return (
    <Suspense fallback={<div className="p-6 text-[13px] text-slate-500">Confirming payment…</div>}>
      <BillingCompleteInner />
    </Suspense>
  )
}
