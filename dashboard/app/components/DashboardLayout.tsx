'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { PendingOrderBadge } from '@/components/dashboard/PendingOrderBanner'
import { PushNotificationBanner } from '@/components/dashboard/PushNotificationBanner'
import { UserAvatar } from '@/components/dashboard/UserAvatar'
import { WhatsAppCommunityPrompt } from '@/components/dashboard/WhatsAppCommunityPrompt'
import { useDashboard } from '@/contexts/DashboardContext'
import { displayNameFromEmail } from '@/lib/avatar'
import { routes } from '@/lib/dashboard-routes'
import { setToken } from '@/lib/api'

const SIDEBAR_NAV: Array<{ href: string; icon: string; label: string; exact?: boolean; wa?: boolean }> = [
  { href: routes.overview,       icon: 'grid_view',    label: 'Overview',       exact: true },
  { href: routes.whatsapp,       icon: 'whatsapp',     label: 'WhatsApp',       wa: true },
  { href: routes.inventory,      icon: 'inventory_2',  label: 'Inventory' },
  { href: routes.conversations,  icon: 'chat_bubble',  label: 'Conversations' },
  { href: routes.orders,         icon: 'receipt_long', label: 'Orders' },
  { href: routes.payments,       icon: 'payments',     label: 'Payments' },
  { href: routes.billing,        icon: 'credit_card',  label: 'Plan' },
  { href: routes.settings,       icon: 'settings',     label: 'Settings' },
]

const PAGE_TITLES: Record<string, string> = {
  [routes.overview]:       'Overview',
  [routes.whatsapp]:       'WhatsApp',
  [routes.inventory]:      'Inventory',
  [routes.conversations]:  'Conversations',
  [routes.orders]:         'Orders',
  [routes.payments]:       'Payments',
  [routes.billing]:        'Plan',
  [routes.settings]:       'Settings',
}

function getPageTitle(pathname: string): string {
  return PAGE_TITLES[pathname] ?? 'Dashboard'
}

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

type DashboardLayoutProps = {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { me, session } = useDashboard()
  const reachout =
    session?.reachout?.restricted ? session.reachout : me?.reachout?.restricted ? me.reachout : null

  function signOut() {
    setToken(null)
    window.location.href = '/login'
  }

  const pageTitle = getPageTitle(pathname)
  const mainNav = SIDEBAR_NAV.slice(0, 3)
  const toolsNav = SIDEBAR_NAV.slice(3, 8)
  const avatarSeed = me?.id ?? me?.email ?? 'clerk'
  const ownerName = displayNameFromEmail(me?.email, 'Account')
  function navLink(item: (typeof SIDEBAR_NAV)[number], onNavigate?: () => void) {
    const active = isActive(pathname, item.href, item.exact)
    return (
      <Link
        key={item.label}
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl min-h-[44px] transition-colors font-display ${
          active
            ? 'bg-clerk-light text-clerk-primary-dark font-semibold'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        {item.wa ? (
          <Image src="/whatsapp.svg" alt="" width={18} height={18} aria-hidden className="shrink-0" />
        ) : (
          <span className="material-symbols-outlined text-xl" aria-hidden="true">{item.icon}</span>
        )}
        <span className="text-sm flex-1">{item.label}</span>
        {item.href === routes.orders && <PendingOrderBadge />}
      </Link>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-[#f5f4f0] flex overflow-x-hidden">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 max-w-[min(16rem,85vw)] bg-white border-r border-slate-200/90 flex flex-col pt-safe transition-transform duration-200 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex items-center justify-between p-4 lg:px-6 lg:py-5 border-b border-slate-100">
          <Link href={routes.overview} className="flex items-center gap-2.5" aria-label="Clerk home">
            <Image src="/clerk logo.svg" alt="" width={28} height={28} style={{ height: 28, width: 'auto' }} />
            <span className="font-display font-bold text-[15px] text-slate-900 tracking-tight">Clerk</span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-10 h-10 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 min-h-[44px] min-w-[44px] border-0 bg-transparent p-0"
            aria-label="Close sidebar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          <nav className="flex-1 p-4 space-y-3 font-display" aria-label="Sidebar">
            <div>
              {mainNav.map((item) => navLink(item, () => setSidebarOpen(false)))}
            </div>
            <div className="pt-2">
              {toolsNav.map((item) => navLink(item, () => setSidebarOpen(false)))}
            </div>
          </nav>

          <div className="p-4 border-t border-slate-100 space-y-3">
            <WhatsAppCommunityPrompt />
            <div className="flex items-center gap-3 px-1">
              <UserAvatar seed={avatarSeed} size={36} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-slate-800 truncate font-heading leading-tight">
                  {ownerName}
                </p>
                <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide bg-clerk-light text-clerk-primary-dark">
                  {me?.plan ?? 'starter'}
                </span>
              </div>
              <Link href={routes.settings} className="text-slate-300 hover:text-slate-500 transition-colors" aria-label="Settings">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>settings</span>
              </Link>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-500 hover:bg-slate-50 hover:text-red-500 transition-colors min-h-[40px] border-0 bg-transparent"
            >
              <span className="material-symbols-outlined text-xl" aria-hidden="true">logout</span>
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <header className="sticky top-0 z-30 bg-[#f5f4f0]/95 backdrop-blur-md border-b border-slate-200/80 pt-safe">
          <div className="flex items-center justify-between gap-3 min-h-[3.5rem] h-14 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg text-slate-600 hover:bg-slate-100 shrink-0 border-0 bg-transparent p-0"
              aria-label="Open sidebar"
            >
              <span className="material-symbols-outlined text-xl">menu</span>
            </button>

            <h1 className="flex-1 text-center text-[15px] font-extrabold text-slate-900 truncate lg:hidden font-display px-1 leading-none">
              {pageTitle}
            </h1>

            <nav className="hidden lg:flex items-center gap-1 h-full font-display" aria-label="Main">
              {[
                { href: routes.overview,      label: 'Overview',      exact: true },
                { href: routes.conversations,  label: 'Conversations' },
                { href: routes.inventory,      label: 'Inventory' },
                { href: routes.orders,         label: 'Orders' },
                { href: routes.payments,       label: 'Payments' },
              ].map(({ href, label, exact }) => {
                const active = isActive(pathname, href, exact)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`inline-flex items-center h-9 px-3 rounded-full text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-clerk-primary/10 text-clerk-primary-dark'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {label}
                  </Link>
                )
              })}
            </nav>

            <div className="hidden lg:block flex-1 min-w-0" />

            <div className="flex items-center gap-2.5 shrink-0 lg:ml-auto">
              <span className="hidden sm:block text-[13px] font-semibold text-slate-700 truncate max-w-[160px] font-heading leading-none">
                {me?.businessName ?? 'Your shop'}
              </span>
              <Link
                href={routes.settings}
                aria-label="Account settings"
                className="flex items-center justify-center rounded-full hover:ring-2 hover:ring-clerk-primary/20 transition-shadow"
              >
                <UserAvatar seed={avatarSeed} size={36} />
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-safe min-w-0">
          <PushNotificationBanner />
          {reachout?.restricted && (
            <div
              role="alert"
              className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-900 leading-relaxed"
            >
              <p className="font-semibold font-display">WhatsApp protected — automated replies paused</p>
              <p className="mt-1">{reachout.message}</p>
              {reachout.endsAt && (
                <p className="mt-2 text-rose-800/80">
                  Clerk will resume after{' '}
                  {new Date(reachout.endsAt).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                  .
                </p>
              )}
              <Link
                href={routes.whatsapp}
                className="inline-block mt-2 text-[12px] font-bold text-rose-950 underline underline-offset-2"
              >
                Open WhatsApp settings
              </Link>
            </div>
          )}
          {children}
        </main>

        <footer className="lg:hidden shrink-0 px-4 sm:px-6 pb-safe border-t border-slate-200/80 bg-[#f5f4f0]">
          <div className="py-4">
            <WhatsAppCommunityPrompt />
          </div>
        </footer>

      </div>
    </div>
  )
}
