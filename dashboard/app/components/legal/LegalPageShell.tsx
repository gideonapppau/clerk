import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  SUPPORT_EMAIL,
  SUPPORT_EMAIL_HREF,
  SUPPORT_WHATSAPP_DISPLAY,
  SUPPORT_WHATSAPP_HREF,
} from '@/lib/marketing'

type Props = {
  title: string
  updated: string
  children: ReactNode
}

export function LegalPageShell({ title, updated, children }: Props) {
  return (
    <div className="min-h-screen bg-[#f5f4f0] flex flex-col">
      <header className="sticky top-0 z-10 bg-[#f5f4f0]/90 backdrop-blur-md border-b border-slate-200 pt-[env(safe-area-inset-top)]">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image src="/clerk logo.svg" alt="" width={24} height={24} style={{ height: 24, width: 'auto' }} />
            <span className="font-display font-bold text-[15px] text-slate-900 tracking-tight">Clerk</span>
          </Link>
          <Link
            href="/login"
            className="text-[13px] font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Log in
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-5 sm:px-8 py-10 sm:py-14 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <h1 className="text-[1.75rem] sm:text-[2rem] font-extrabold text-slate-900 tracking-tight font-display mb-2">
          {title}
        </h1>
        <p className="text-[13px] text-slate-500 mb-10">Last updated {updated}</p>

        <article className="rounded-2xl border border-slate-200 bg-white shadow-[0_8px_40px_rgba(15,23,42,0.07)] p-6 sm:p-8 space-y-6 text-[14px] text-slate-600 leading-relaxed">
          {children}
        </article>

        <p className="text-[13px] text-slate-500 mt-8 text-center">
          Questions?{' '}
          <a href={SUPPORT_EMAIL_HREF} className="text-clerk-primary-dark font-semibold hover:underline">
            {SUPPORT_EMAIL}
          </a>
          {' · '}
          <a
            href={SUPPORT_WHATSAPP_HREF}
            target="_blank"
            rel="noreferrer"
            className="text-clerk-primary-dark font-semibold hover:underline"
          >
            WhatsApp {SUPPORT_WHATSAPP_DISPLAY}
          </a>
        </p>
      </main>

      <footer className="border-t border-slate-200 py-6 px-5 sm:px-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[12px] text-slate-500">
          <Link href="/" className="hover:text-slate-800 transition-colors">Home</Link>
          <Link href="/privacy" className="hover:text-slate-800 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-slate-800 transition-colors">Terms</Link>
        </div>
      </footer>
    </div>
  )
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-[15px] font-bold text-slate-900 font-display mb-2">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}
