import { ONBOARDING_STEPS, type OnboardingStepId } from '@/lib/onboarding'

type Props = {
  current: OnboardingStepId
}

export function OnboardingProgress({ current }: Props) {
  return (
    <nav aria-label="Onboarding progress" className="w-full">
      <ol className="flex items-start">
        {ONBOARDING_STEPS.map((step, idx) => {
          const done = step.id < current
          const active = step.id === current
          const isLast = idx === ONBOARDING_STEPS.length - 1

          return (
            <li key={step.id} className="flex-1 flex flex-col items-center min-w-0 relative">
              {!isLast && (
                <div
                  className="absolute left-[calc(50%+14px)] right-[calc(-50%+14px)] top-4 h-px -translate-y-1/2"
                  aria-hidden
                >
                  <div className={`h-full transition-colors ${done ? 'bg-clerk-primary' : 'bg-slate-200'}`} />
                </div>
              )}

              <span
                className={`relative z-10 flex size-8 items-center justify-center rounded-full text-[11px] font-bold shrink-0 transition-all ${
                  done
                    ? 'bg-clerk-primary text-white'
                    : active
                      ? 'bg-white ring-2 ring-clerk-primary text-clerk-primary-darker shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-400'
                }`}
                aria-current={active ? 'step' : undefined}
              >
                {step.id}
              </span>

              <span
                className={`mt-2 text-[10px] sm:text-[11px] font-semibold text-center leading-tight px-0.5 ${
                  active ? 'text-slate-900' : done ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
