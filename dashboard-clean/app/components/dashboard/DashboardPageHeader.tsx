'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useDashboard } from '@/contexts/DashboardContext'
import { displayNameFromEmail } from '@/lib/avatar'
import { routes } from '@/lib/dashboard-routes'

type Props = {
  showCta?: boolean
  title?: string
  subtitle?: string
}

export function DashboardPageHeader({ showCta = true, title, subtitle }: Props) {
  const { me, waConnected, inventory } = useDashboard()

  const ownerName = displayNameFromEmail(me?.email, me?.businessName ?? 'there')

  const headerCta = !waConnected
    ? { href: routes.whatsapp, label: 'Connect WhatsApp', wa: true }
    : inventory.length === 0
      ? { href: routes.inventory, label: 'Add products', wa: false }
      : { href: routes.whatsapp, label: 'Test Clerk', wa: false }

  return (
    <header className="pt-2 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="min-w-0">
        {title ? (
          <>
            <h1 className="text-[1.35rem] sm:text-[1.5rem] font-extrabold text-slate-900 truncate font-display leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[13px] sm:text-[14px] text-slate-500 mt-1 leading-relaxed max-w-xl">{subtitle}</p>
            )}
          </>
        ) : (
          <h1 className="text-[1.5rem] sm:text-[1.65rem] font-extrabold text-slate-900 truncate font-display leading-tight">
            {ownerName}
          </h1>
        )}
      </div>

      {showCta && (
        <Link
          href={headerCta.href}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-clerk-primary text-slate-950 text-[13px] font-bold px-6 py-3 sm:py-2.5 min-h-[48px] sm:min-h-0 rounded-full hover:bg-clerk-primary-dark hover:text-white active:scale-[0.98] transition-all shrink-0 touch-manipulation"
        >
          {headerCta.wa && (
            <Image src="/whatsapp.svg" alt="" width={15} height={15} className="brightness-0" aria-hidden />
          )}
          {headerCta.label}
          {!headerCta.wa && (
            <span className="material-symbols-outlined ms-icon-filled" style={{ fontSize: 14 }}>
              arrow_forward
            </span>
          )}
        </Link>
      )}
    </header>
  )
}
