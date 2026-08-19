import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { privatePageMetadata } from '@/lib/seo'

export const metadata: Metadata = privatePageMetadata(
  'Get started',
  'Connect WhatsApp, add inventory, and go live with Clerk.'
)

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f4f0] flex flex-col">
      <header className="px-5 sm:px-8 h-14 flex items-center justify-between shrink-0 border-b border-slate-200/80">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/clerk logo.svg"
            alt=""
            width={28}
            height={28}
            style={{ height: 28, width: 'auto' }}
          />
          <span className="font-display font-bold text-[15px] text-slate-900 tracking-tight">Clerk</span>
        </Link>
        <Link
          href="/"
          className="text-[12px] font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          Back to home
        </Link>
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  )
}
