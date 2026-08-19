import Image from 'next/image'
import { WHATSAPP_COMMUNITY_HREF, WHATSAPP_COMMUNITY_LABEL } from '@/lib/marketing'

const joinBtn =
  'inline-flex items-center justify-center gap-2 bg-clerk-primary text-slate-950 text-[13px] font-bold px-5 py-2.5 rounded-full hover:bg-clerk-primary-dark hover:text-white active:scale-[0.98] transition-all'

type Props = {
  variant?: 'sidebar' | 'onboarding'
  onContinue?: () => void
}

export function WhatsAppCommunityPrompt({ variant = 'sidebar', onContinue }: Props) {
  if (variant === 'sidebar') {
    return (
      <div className="rounded-xl border border-clerk-primary/20 bg-clerk-light/60 p-3">
        <div className="flex items-start gap-2.5">
          <Image src="/whatsapp.svg" alt="" width={18} height={18} aria-hidden className="shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-slate-800 leading-snug font-display">
              Questions or complaints?
            </p>
            <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
              Join our WhatsApp community and ask away — we&apos;re happy to help.
            </p>
            <a
              href={WHATSAPP_COMMUNITY_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-clerk-primary-darker hover:underline"
            >
              Join community
              <span className="material-symbols-outlined ms-icon-filled" style={{ fontSize: 12 }}>
                open_in_new
              </span>
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_8px_40px_rgba(15,23,42,0.07)] p-6 sm:p-8 text-center">
      <div className="inline-flex items-center justify-center size-12 rounded-2xl bg-clerk-light mb-4">
        <Image src="/whatsapp.svg" alt="" width={28} height={28} aria-hidden />
      </div>
      <p className="text-[16px] font-bold text-slate-900 font-display">{WHATSAPP_COMMUNITY_LABEL}</p>
      <p className="mt-2 text-[14px] text-slate-500 leading-relaxed max-w-sm mx-auto">
        Got questions, feedback, or something not working? Join our WhatsApp group — ask away and
        connect with other Clerk merchants.
      </p>
      <div className="mt-6 flex flex-col items-center gap-3">
        <a
          href={WHATSAPP_COMMUNITY_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className={joinBtn}
        >
          Join on WhatsApp
          <span className="material-symbols-outlined ms-icon-filled" style={{ fontSize: 14 }}>
            open_in_new
          </span>
        </a>
        {onContinue && (
          <button
            type="button"
            onClick={onContinue}
            className="text-[13px] font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Skip for now — open dashboard
          </button>
        )}
      </div>
    </div>
  )
}
