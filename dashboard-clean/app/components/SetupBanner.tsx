'use client'

import Link from 'next/link'

type Step = {
  done: boolean
  label: string
  href: string
}

type SetupBannerProps = {
  steps: Step[]
  onDismiss?: () => void
}

export function SetupBanner({ steps, onDismiss }: SetupBannerProps) {
  const doneCount = steps.filter((s) => s.done).length
  if (doneCount === steps.length) return null

  const next = steps.find((s) => !s.done)

  return (
    <div className="ui-enter mb-5 rounded-2xl border border-clerk-primary/20 bg-gradient-to-br from-clerk-light/80 to-white px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 font-display">Get your shop ready</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {doneCount} of {steps.length} steps done
          </p>
          <ol className="mt-3 space-y-2">
            {steps.map((step) => (
              <li key={step.label} className="flex items-center justify-between gap-3 text-sm">
                <Link
                  href={step.href}
                  className={`min-h-[44px] inline-flex items-center py-1 ${
                    step.done ? 'text-slate-400 line-through' : 'text-slate-700 hover:text-clerk-primary-darker font-medium'
                  } touch-manipulation`}
                >
                  {step.label}
                </Link>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide shrink-0 ${
                    step.done ? 'text-clerk-primary-darker' : 'text-slate-400'
                  }`}
                >
                  {step.done ? 'Done' : 'Todo'}
                </span>
              </li>
            ))}
          </ol>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 min-h-[44px] px-2 text-[12px] font-medium text-slate-400 hover:text-slate-600 border-0 bg-transparent touch-manipulation"
            aria-label="Dismiss setup guide"
          >
            Dismiss
          </button>
        )}
      </div>
      {next && (
        <Link
          href={next.href}
          className="mt-4 w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[48px] bg-clerk-primary text-slate-950 text-[12px] font-bold px-5 py-3 rounded-full hover:bg-clerk-primary-dark hover:text-white transition-colors touch-manipulation"
        >
          Continue: {next.label}
          <span className="material-symbols-outlined ms-icon-filled" style={{ fontSize: 13 }}>
            arrow_forward
          </span>
        </Link>
      )}
    </div>
  )
}
