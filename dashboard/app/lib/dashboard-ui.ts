/** Shared dashboard status badges and alert surfaces */

export const badgeBase =
  'inline-flex text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full'

const badgeTones = {
  pending: 'bg-clerk-light text-clerk-primary-darker',
  success: 'bg-clerk-light text-clerk-primary-darker',
  neutral: 'bg-slate-100 text-slate-600',
  muted: 'bg-slate-100 text-slate-500',
  danger: 'bg-red-50 text-red-600',
  warning: 'bg-amber-50 text-amber-700',
  low: 'bg-slate-100 text-slate-700',
} as const

export type BadgeTone = keyof typeof badgeTones

export function badgeClass(tone: BadgeTone): string {
  return `${badgeBase} ${badgeTones[tone]}`
}

export const alertCard =
  'rounded-2xl border border-slate-200 bg-white shadow-[0_8px_40px_rgba(15,23,42,0.07)]'
