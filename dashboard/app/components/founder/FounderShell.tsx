'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { setFounderKey } from '@/lib/founder-api'

const NAV: Array<{ href: string; icon: string; label: string; exact?: boolean; mobile?: boolean }> = [
  { href: '/founder', icon: 'grid_view', label: 'Overview', exact: true, mobile: true },
  { href: '/founder/pipeline', icon: 'handshake', label: 'Pipeline', mobile: true },
  { href: '/founder/health', icon: 'monitor_heart', label: 'Health', mobile: true },
  { href: '/founder/outreach', icon: 'campaign', label: 'Outreach', mobile: false },
  { href: '/founder/scorecard', icon: 'edit_note', label: 'Scorecard', mobile: false },
  { href: '/founder/merchants', icon: 'storefront', label: 'Merchants', mobile: false },
  { href: '/founder/orders', icon: 'shopping_cart', label: 'Orders', mobile: false },
  { href: '/founder/funnels', icon: 'filter_list', label: 'Funnels', mobile: false },
  { href: '/founder/insights', icon: 'speed', label: 'Insights', mobile: false },
  { href: '/founder/reliability', icon: 'shield', label: 'Reliability', mobile: false },
]

const PAGE_TITLES: Record<string, string> = {
  '/founder': 'Overview',
  '/founder/pipeline': 'Pipeline',
  '/founder/health': 'Health',
  '/founder/outreach': 'Outreach',
  '/founder/scorecard': 'Scorecard',
  '/founder/merchants': 'Merchants',
  '/founder/orders': 'Orders',
  '/founder/funnels': 'Funnels',
  '/founder/insights': 'Insights',
  '/founder/reliability': 'Reliability',
}

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function FounderShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pageTitle = PAGE_TITLES[pathname] ?? 'Founder'
  const mobileNav = NAV.filter((item) => item.mobile === true)

  function lock() {
    setFounderKey(null)
    window.location.href = '/founder'
  }

  function navLink(item: (typeof NAV)[number], onNavigate?: () => void) {
    const active = isActive(pathname, item.href, item.exact)
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl min-h-[44px] transition-colors font-display ${
          active
            ? 'bg-clerk-light text-clerk-primary-dark font-semibold'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <span className="material-symbols-outlined text-xl" aria-hidden="true">
          {item.icon}
        </span>
        <span className="text-sm">{item.label}</span>
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
          <Link href="/founder" className="flex items-center gap-2.5 min-w-0" aria-label="Founder home">
            <Image src="/clerk logo.svg" alt="" width={28} height={28} style={{ height: 28, width: 'auto' }} />
            <div className="min-w-0">
              <span className="font-display font-bold text-[15px] text-slate-900 tracking-tight block leading-tight">
                Clerk · Founder
              </span>
            </div>
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

        <nav className="flex-1 p-4 space-y-1 font-display" aria-label="Founder">
          {NAV.map((item) => navLink(item, () => setSidebarOpen(false)))}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-2">
          <Link
            href="/"
            className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors min-h-[40px]"
          >
            <span className="material-symbols-outlined text-xl" aria-hidden="true">
              home
            </span>
            Marketing site
          </Link>
          <button
            type="button"
            onClick={lock}
            className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-500 hover:bg-slate-50 hover:text-red-500 transition-colors min-h-[40px] border-0 bg-transparent"
          >
            <span className="material-symbols-outlined text-xl" aria-hidden="true">
              lock
            </span>
            Lock console
          </button>
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
        <header className="sticky top-0 z-30 bg-[#f5f4f0]/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 pt-safe pb-3.5">
          <div className="flex items-center justify-between gap-3 pt-3.5 lg:pt-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-10 h-10 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 min-h-[44px] min-w-[44px] shrink-0 border-0 bg-transparent p-0"
              aria-label="Open sidebar"
            >
              <span className="material-symbols-outlined text-xl">menu</span>
            </button>

            <h1 className="flex-1 text-center text-[15px] font-extrabold text-slate-900 truncate lg:hidden font-display px-1">
              {pageTitle}
            </h1>

            <nav className="hidden lg:flex items-center gap-1 font-display" aria-label="Founder">
              {NAV.map(({ href, label, exact }) => {
                const active = isActive(pathname, href, exact)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
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

            <button
              type="button"
              onClick={lock}
              className="inline-flex lg:inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-full hover:bg-white/80 transition-colors border-0 bg-transparent min-h-[44px] min-w-[44px] lg:min-w-0 justify-center shrink-0"
              aria-label="Lock console"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                lock
              </span>
              <span className="hidden sm:inline">Lock</span>
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-[max(5rem,env(safe-area-inset-bottom))] lg:pb-6 min-w-0">
          {children}
        </main>

        <nav
          className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 pt-2 pb-[max(0.625rem,env(safe-area-inset-bottom))] lg:hidden z-50"
          aria-label="Founder primary"
        >
          <div className="flex items-center justify-around max-w-xs mx-auto font-display">
            {mobileNav.map(({ href, label, icon, exact }) => {
              const active = isActive(pathname, href, exact)
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex flex-col items-center gap-0.5 min-w-[72px] py-1.5 rounded-xl transition-colors ${
                    active ? 'text-clerk-primary-dark' : 'text-slate-400'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[22px] ${active ? 'ms-icon-filled' : ''}`}
                    aria-hidden
                  >
                    {icon}
                  </span>
                  <span className="text-[10px] font-semibold">{label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}
