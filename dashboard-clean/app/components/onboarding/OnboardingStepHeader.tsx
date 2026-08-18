import type { ReactNode } from 'react'

type Props = {
  title: string
  description?: ReactNode
  center?: boolean
}

export function OnboardingStepHeader({ title, description, center = true }: Props) {
  return (
    <div className={center ? 'text-center mb-8' : 'mb-8'}>
      <h1 className="text-[1.5rem] sm:text-[1.65rem] font-extrabold text-slate-900 font-display tracking-tight mb-2">
        {title}
      </h1>
      {description && (
        <p className={`text-[14px] text-slate-500 leading-relaxed ${center ? 'max-w-sm mx-auto' : 'max-w-md'}`}>
          {description}
        </p>
      )}
    </div>
  )
}
