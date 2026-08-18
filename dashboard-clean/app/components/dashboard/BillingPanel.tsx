'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  cancelBillingPlan,
  formatUserError,
  getBillingStatus,
  startBillingCheckout,
  type BillingStatus,
} from '@/lib/api'
import { routes } from '@/lib/dashboard-routes'
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader'
import { DashboardPageShell } from '@/components/DashboardPageShell'
import { PlanSummaryCard } from '@/components/dashboard/PlanSummaryCard'
import { badgeClass } from '@/lib/dashboard-ui'
import { formatGhs } from '@/lib/money'

const PLANS = [
  {
    slug: 'starter' as const,
    name: 'Starter',
    price: 49,
    blurb: 'For shops getting steady customer messages.',
    features: ['1 WhatsApp number', '300+ replies / month', 'Up to 50 products', 'Order capture & approval'],
  },
  {
    slug: 'growth' as const,
    name: 'Growth',
    price: 99,
    popular: true,
    blurb: 'More volume, follow-ups, and coverage when your shop is closed.',
    features: [
      'Everything in Starter',
      'Up to 500 products',
      'Abandoned payment recovery',
      'Higher reply volume',
      'Priority support',
    ],
  },
]

function formatPeriodEnd(iso?: string): string | null {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return null
  }
}

function planDisplayName(slug?: string): string {
  if (!slug || slug === 'trial') return 'Free trial'
  return PLANS.find((p) => p.slug === slug)?.name ?? slug
}

function planAmount(slug?: string): number | undefined {
  return PLANS.find((p) => p.slug === slug)?.price
}

function statusTone(status?: string): 'success' | 'muted' | 'pending' {
  if (status === 'active') return 'success'
  if (status === 'trialing') return 'pending'
  return 'muted'
}

export function BillingPanel() {
  const searchParams = useSearchParams()
  const preselect = searchParams.get('plan')

  const [status, setStatus] = useState<BillingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyPlan, setBusyPlan] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const reload = useCallback(async () => {
    try {
      const st = await getBillingStatus()
      setStatus(st)
      setError('')
    } catch (err) {
      setError(formatUserError(err, "Couldn't load your plan."))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    if (!preselect || loading || busyPlan) return
    const plan = preselect.toLowerCase()
    if ((plan === 'starter' || plan === 'growth') && status?.status !== 'active') {
      void handleCheckout(plan)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- auto-checkout once when ?plan= is present
  }, [preselect, loading, status?.status])

  async function handleCheckout(plan: 'starter' | 'growth') {
    setBusyPlan(plan)
    setError('')
    try {
      const res = await startBillingCheckout(plan)
      window.location.href = res.authorizationUrl
    } catch (err) {
      setError(formatUserError(err, "Couldn't start checkout. Try again."))
      setBusyPlan(null)
    }
  }

  async function handleCancel() {
    if (!confirm('Cancel your plan? You keep access until the end of the current billing period.')) return
    setCancelling(true)
    setError('')
    try {
      const st = await cancelBillingPlan()
      setStatus(st)
    } catch (err) {
      setError(formatUserError(err, "Couldn't cancel your plan."))
    } finally {
      setCancelling(false)
    }
  }

  function usageLine(u: BillingStatus['usage']): string | null {
    if (!u) return null
    if (u.repliesPeriod === 'unlimited') {
      return `${u.productsUsed}${u.productsLimit ? ` / ${u.productsLimit}` : ''} products`
    }
    const replyLabel =
      u.repliesPeriod === 'trial_total'
        ? `${u.repliesUsed} / ${u.repliesLimit} trial replies`
        : `${u.repliesUsed} / ${u.repliesLimit} replies this month`
    const prodLabel = u.productsLimit ? `${u.productsUsed} / ${u.productsLimit} products` : null
    return prodLabel ? `${replyLabel} · ${prodLabel}` : replyLabel
  }

  const isActive = status?.status === 'active'
  const onTrial = status?.planSlug === 'trial' || status?.status === 'trialing'
  const renews = formatPeriodEnd(status?.currentPeriodEnd)
  const currentName = planDisplayName(status?.planSlug)
  const currentPrice = planAmount(status?.planSlug)

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        title="Plan"
        subtitle="Your Clerk subscription. Customer checkout is on Payments."
        showCta={false}
      />

      {error && (
        <p className="ui-enter text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5 leading-snug">
          {error}
        </p>
      )}

      {loading ? (
        <div className="ui-enter space-y-4">
          <div className="h-28 rounded-2xl bg-white border border-slate-200 animate-pulse" />
          <div className="h-24 rounded-2xl bg-white border border-slate-200 animate-pulse" />
          <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-4">
            <div className="h-72 rounded-2xl bg-white border border-slate-200 animate-pulse" />
            <div className="h-72 rounded-2xl bg-white border border-slate-200 animate-pulse" />
          </div>
        </div>
      ) : (
        <div className="space-y-5 ui-enter">
          <PlanSummaryCard
            planName={currentName}
            statusLabel={status?.status ?? 'trialing'}
            statusTone={statusTone(status?.status)}
            amount={isActive ? currentPrice : undefined}
            detail={
              <>
                {renews && <p>Renews {renews}</p>}
                {onTrial && !isActive && (
                  <p>50 free WhatsApp replies to start. Only real customer messages count.</p>
                )}
                {usageLine(status?.usage) && (
                  <p className="tabular-nums">{usageLine(status?.usage)}</p>
                )}
                {!status?.usage?.canSendReplies && status?.usage && (
                  <p className="text-amber-800">Clerk auto-replies are paused. Upgrade or reply manually in WhatsApp.</p>
                )}
                {!onTrial && !isActive && !renews && (
                  <p>Choose a plan below to keep Clerk running after trial.</p>
                )}
              </>
            }
          />

          {isActive && status?.status !== 'cancelled' && (
            <button
              type="button"
              onClick={() => void handleCancel()}
              disabled={cancelling}
              className="text-[12px] font-semibold text-slate-500 hover:text-red-600 transition-colors disabled:opacity-50"
            >
              {cancelling ? 'Cancelling…' : 'Cancel plan'}
            </button>
          )}

          {status?.status === 'cancelled' && renews && (
            <p className="text-[13px] text-slate-500">Cancelled. Access continues until {renews}.</p>
          )}

          <Link
            href={routes.payments}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 min-h-[56px] hover:border-clerk-primary/30 hover:bg-clerk-light/10 active:bg-slate-50 transition-colors touch-manipulation shadow-[0_8px_40px_rgba(15,23,42,0.04)]"
          >
            <span className="size-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-clerk-primary-darker" style={{ fontSize: 20 }}>
                payments
              </span>
            </span>
            <div className="text-left min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-slate-900 mb-0.5">Customer payments</p>
              <p className="text-[13px] text-slate-500 leading-relaxed">
                MoMo and Paystack for orders from WhatsApp. Separate from your Clerk subscription.
              </p>
            </div>
            <span className="material-symbols-outlined text-slate-300 shrink-0 self-center" style={{ fontSize: 18 }}>
              chevron_right
            </span>
          </Link>

          {!status?.paystackConfigured && (
            <p className="text-[13px] text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 leading-relaxed">
              Plan checkout needs a valid Clerk Paystack secret on Core (
              <span className="font-mono text-[12px]">CLERK_PAYSTACK_SECRET_KEY</span> starting with{' '}
              <span className="font-mono text-[12px]">sk_test_</span> or{' '}
              <span className="font-mono text-[12px]">sk_live_</span>). Set it in Fly secrets for production, then
              redeploy Core.
            </p>
          )}

          <section aria-label="Available plans">
            <h2 className="text-[14px] font-semibold text-slate-900 font-display mb-3">Upgrade</h2>
            <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-px md:bg-slate-200 md:border md:border-slate-200 md:rounded-2xl md:overflow-hidden md:shadow-[0_8px_40px_rgba(15,23,42,0.07)]">
              {PLANS.map((plan) => {
                const isCurrent = status?.planSlug === plan.slug && isActive
                return (
                  <div
                    key={plan.slug}
                    className={`p-5 sm:p-6 flex flex-col rounded-2xl border border-slate-200 shadow-[0_8px_40px_rgba(15,23,42,0.04)] md:rounded-none md:border-0 md:shadow-none ${
                      plan.popular ? 'bg-clerk-light md:bg-clerk-light' : 'bg-white'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mb-4">
                      <p className="text-[14px] font-semibold text-slate-900 font-display">{plan.name}</p>
                      {plan.popular && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-clerk-primary text-white px-2.5 py-1 rounded-full leading-none whitespace-nowrap">
                          Most popular
                        </span>
                      )}
                      {isCurrent && (
                        <span className={`${badgeClass('success')} capitalize ml-auto md:ml-0`}>Current</span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1 mb-1">
                      <p className="text-[1.75rem] sm:text-[2rem] font-extrabold text-slate-900 leading-none tracking-tight font-display">
                        {formatGhs(plan.price)}
                      </p>
                      <span className="text-[13px] text-slate-500">/mo</span>
                    </div>
                    <p className="text-[12px] text-slate-500 mb-5 leading-relaxed">{plan.blurb}</p>
                    <ul className="space-y-2.5 flex-1 mb-6">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-[13px] text-slate-600">
                          <span className="mt-1.5 size-1.5 rounded-full bg-clerk-primary shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      disabled={loading || isCurrent || busyPlan !== null || !status?.paystackConfigured}
                      onClick={() => void handleCheckout(plan.slug)}
                      className={`w-full min-h-[48px] rounded-full text-[13px] font-bold transition-colors disabled:opacity-50 touch-manipulation ${
                        plan.popular
                          ? 'bg-clerk-primary text-slate-950 hover:bg-clerk-primary-dark hover:text-white'
                          : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {isCurrent
                        ? 'Current plan'
                        : busyPlan === plan.slug
                          ? 'Redirecting…'
                          : `Upgrade to ${plan.name}`}
                    </button>
                  </div>
                )
              })}
            </div>
          </section>

          <p className="text-center text-[11px] text-slate-400 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            Subscription payments secured by Paystack
          </p>
        </div>
      )}
    </DashboardPageShell>
  )
}
