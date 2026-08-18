'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { formatUserError, verifyBillingPayment } from '@/lib/api'
import { PlanCompleteView } from '@/components/dashboard/PlanCompleteView'
import { DashboardPageShell } from '@/components/DashboardPageShell'
import { routes } from '@/lib/dashboard-routes'

const PLAN_PRICES: Record<string, number> = { starter: 49, growth: 99 }

function planLabel(slug: string): string {
  if (slug === 'growth') return 'Growth'
  if (slug === 'starter') return 'Starter'
  return slug.charAt(0).toUpperCase() + slug.slice(1)
}

export default function BillingCompleteInner() {
  const searchParams = useSearchParams()
  const reference = searchParams.get('reference') ?? searchParams.get('trxref') ?? ''

  const [confirmed, setConfirmed] = useState(false)
  const [planSlug, setPlanSlug] = useState('')
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    if (!reference) {
      setError('Missing payment reference.')
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const result = await verifyBillingPayment(reference)
        if (cancelled) return
        setPlanSlug(result.planSlug)
        setConfirmed(true)
        window.setTimeout(() => {
          window.location.href = routes.billing
        }, 2800)
      } catch (err) {
        if (!cancelled) {
          setError(formatUserError(err, 'Payment could not be confirmed.'))
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [reference])

  return (
    <DashboardPageShell>
      <div className="py-6 sm:py-12 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <PlanCompleteView
          confirmed={confirmed}
          planName={planSlug ? planLabel(planSlug) : 'Clerk plan'}
          amount={PLAN_PRICES[planSlug]}
          reference={reference}
          error={error}
        />
      </div>
    </DashboardPageShell>
  )
}
