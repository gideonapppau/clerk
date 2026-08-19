import Link from 'next/link'
import { PlanSummaryCard } from '@/components/dashboard/PlanSummaryCard'
import { routes } from '@/lib/dashboard-routes'

type Props = {
  confirmed: boolean
  planName: string
  amount?: number
  reference: string
  error?: string
}

export function PlanCompleteView({ confirmed, planName, amount, reference, error }: Props) {
  const hasError = Boolean(error) && !confirmed
  const isPending = !confirmed && !hasError

  const title = confirmed
    ? 'Payment received'
    : hasError
      ? 'Could not verify payment'
      : 'Processing payment'
  const subtitle = confirmed
    ? 'Your plan is active. You’re all set.'
    : hasError
      ? error
      : 'This usually takes a few seconds.'

  return (
    <div className="ui-enter flex flex-col gap-4 sm:gap-5 w-full max-w-sm mx-auto px-1 sm:px-0">
      <div className="text-center">
        {!confirmed && (
          <div className="mb-5 flex justify-center">
            {isPending ? (
              <span className="size-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
            ) : (
              <span className="text-[12px] font-bold uppercase tracking-wide text-red-600 bg-red-50 border border-red-100 rounded-full px-3 py-1">
                Error
              </span>
            )}
          </div>
        )}

        <h1 className="text-[1.35rem] sm:text-[1.5rem] font-extrabold text-slate-900 font-display tracking-tight mb-2">
          {title}
        </h1>
        <p className="text-[14px] text-slate-500 leading-relaxed max-w-[320px] mx-auto break-words px-1">
          {subtitle}
        </p>
      </div>

      {(confirmed || isPending) && planName && (
        <PlanSummaryCard
          planName={planName}
          statusLabel={confirmed ? 'Active' : 'Confirming'}
          statusTone={confirmed ? 'success' : 'pending'}
          amount={amount}
        />
      )}

      {confirmed && (
        <Link
          href={routes.overview}
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 min-h-[56px] hover:border-clerk-primary/30 hover:bg-clerk-light/20 active:bg-slate-50 transition-colors touch-manipulation"
        >
          <span className="size-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-clerk-primary-darker" style={{ fontSize: 20 }}>
              grid_view
            </span>
          </span>
          <div className="text-left min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-slate-900 mb-0.5">Back to dashboard</p>
            <p className="text-[13px] text-slate-500 leading-relaxed">Pick up where you left off.</p>
          </div>
          <span className="material-symbols-outlined text-slate-300 shrink-0" style={{ fontSize: 18 }}>
            chevron_right
          </span>
        </Link>
      )}

      {isPending && (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-center">
          <p className="text-[13px] text-slate-500 leading-relaxed">
            If this page doesn&apos;t update, your payment may still have gone through. Check your email or
            contact support.
          </p>
        </div>
      )}

      {hasError && (
        <Link
          href={routes.billing}
          className="w-full min-h-[48px] inline-flex items-center justify-center bg-clerk-primary text-slate-950 text-[13px] font-bold px-5 py-3 rounded-full hover:bg-clerk-primary-dark hover:text-white transition-colors touch-manipulation"
        >
          Back to plan
        </Link>
      )}

      {reference && (
        <p className="text-center text-[11px] text-slate-400 font-mono break-all px-2">Ref: {reference}</p>
      )}

      <p className="text-center text-[11px] text-slate-400">Secured by Paystack</p>
    </div>
  )
}
