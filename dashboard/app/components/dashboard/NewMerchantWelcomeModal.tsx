'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Num } from '@/components/Num'
import { useDashboard } from '@/contexts/DashboardContext'
import { routes } from '@/lib/dashboard-routes'
import { badgeClass } from '@/lib/dashboard-ui'

type SetupStep = {
  id: string
  label: string
  href: string
  done: boolean
}

type Props = Record<string, never>

function storageKey(merchantId: string | undefined, suffix: string) {
  return `clerk_setup_modal_${suffix}_${merchantId ?? 'unknown'}`
}

function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function writeFlag(key: string) {
  try {
    localStorage.setItem(key, '1')
  } catch {
    /* private browsing */
  }
}

function clearFlag(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

export function NewMerchantWelcomeModal(_props: Props = {}) {
  const pathname = usePathname()
  const {
    initialLoading,
    setupComplete,
    waConnected,
    inventory,
    conversations,
    hasMomoOrPaystack,
    pendingOrders,
    me,
  } = useDashboard()

  const [open, setOpen] = useState(false)
  const prevWaConnected = useRef<boolean | null>(null)

  const dismissedKey = storageKey(me?.id, 'dismissed')
  const autoShownKey = storageKey(me?.id, 'autoshown')

  const dismissModal = () => {
    setOpen(false)
    writeFlag(dismissedKey)
  }

  const steps: SetupStep[] = useMemo(
    () => [
      { id: 'wa', label: 'Connect WhatsApp', href: routes.whatsapp, done: waConnected },
      { id: 'products', label: 'Add your products', href: routes.inventory, done: inventory.length > 0 },
      {
        id: 'try',
        label: 'Try a customer question',
        href: routes.whatsapp,
        done: conversations.length > 0,
      },
      { id: 'payments', label: 'Set up payments', href: routes.payments, done: hasMomoOrPaystack },
    ],
    [waConnected, inventory.length, conversations.length, hasMomoOrPaystack]
  )

  const doneCount = steps.filter((s) => s.done).length
  const nextStep = steps.find((s) => !s.done)

  const quickLinks = useMemo(
    () => [
      {
        label: waConnected ? 'Try on WhatsApp' : 'Connect WhatsApp',
        href: routes.whatsapp,
        icon: 'chat' as const,
        wa: true,
      },
      {
        label: inventory.length > 0 ? 'Products' : 'Add products',
        href: routes.inventory,
        icon: 'inventory_2' as const,
      },
      {
        label: 'Payments',
        href: routes.payments,
        icon: 'payments' as const,
      },
      {
        label: 'Orders',
        href: routes.orders,
        icon: 'receipt_long' as const,
      },
    ],
    [waConnected, inventory.length]
  )

  useEffect(() => {
    if (pathname !== routes.overview) return

    if (initialLoading || setupComplete) {
      setOpen(false)
      if (setupComplete) {
        clearFlag(dismissedKey)
        clearFlag(autoShownKey)
      }
      return
    }

    const wasConnected = prevWaConnected.current
    prevWaConnected.current = waConnected

    // WhatsApp disconnected — show checklist again once
    if (wasConnected === true && !waConnected) {
      clearFlag(dismissedKey)
      clearFlag(autoShownKey)
      setOpen(true)
      writeFlag(autoShownKey)
      return
    }

    // Auto-open at most once until dismissed or WhatsApp drops
    if (!readFlag(dismissedKey) && !readFlag(autoShownKey)) {
      setOpen(true)
      writeFlag(autoShownKey)
    }
  }, [pathname, initialLoading, setupComplete, waConnected, dismissedKey, autoShownKey])

  if (!open || setupComplete || initialLoading) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px] border-0 cursor-default"
        aria-label="Close setup guide"
        onClick={dismissModal}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="setup-welcome-title"
        className="relative w-full sm:max-w-md max-h-[min(92vh,640px)] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white border border-slate-200 shadow-[0_24px_80px_rgba(15,23,42,0.2)] ui-enter pb-[env(safe-area-inset-bottom)]"
      >
        <div className="sm:hidden flex justify-center pt-2.5 pb-1" aria-hidden>
          <div className="w-9 h-1 rounded-full bg-slate-200" />
        </div>

        <div className="px-5 sm:px-6 pt-4 sm:pt-6 pb-6">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div>
              <h2 id="setup-welcome-title" className="text-[1.25rem] font-extrabold text-slate-900 font-display tracking-tight">
                {me?.businessName ? `Welcome, ${me.businessName}` : 'Welcome'}. Get your shop live
              </h2>
              <p className="text-[13px] text-slate-500 mt-1">
                <Num>{doneCount}</Num> of <Num>{steps.length}</Num> steps done
              </p>
            </div>
            <button
              type="button"
              onClick={dismissModal}
              className="size-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors border-0 bg-transparent shrink-0"
              aria-label="Close"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                close
              </span>
            </button>
          </div>

          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mb-5">
            <div
              className="h-full rounded-full bg-clerk-primary transition-all duration-500"
              style={{ width: `${(doneCount / steps.length) * 100}%` }}
            />
          </div>

          <ol className="space-y-2 mb-6" aria-label="Setup checklist">
            {steps.map((step) => (
              <li key={step.id}>
                <Link
                  href={step.href}
                  onClick={dismissModal}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3 transition-colors ${
                    step.done
                      ? 'border-slate-100 bg-slate-50/80'
                      : 'border-slate-200 bg-white hover:border-clerk-primary/30 hover:bg-clerk-light/20'
                  }`}
                >
                  <span
                    className={`text-[13px] font-semibold ${
                      step.done ? 'text-slate-500 line-through' : 'text-slate-900'
                    }`}
                  >
                    {step.label}
                  </span>
                  <span className={step.done ? badgeClass('success') : badgeClass('muted')}>
                    {step.done ? 'Done' : 'Todo'}
                  </span>
                </Link>
              </li>
            ))}
          </ol>

          <div className="grid grid-cols-2 gap-2 mb-5">
            {quickLinks.map((link) => (
              <Link
                key={link.href + link.label}
                href={link.href}
                onClick={dismissModal}
                className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 hover:border-clerk-primary/30 hover:bg-clerk-light/30 transition-all"
              >
                {link.wa ? (
                  <Image src="/whatsapp.svg" alt="" width={16} height={16} className="shrink-0" />
                ) : (
                  <span className="material-symbols-outlined text-slate-500" style={{ fontSize: 18 }}>
                    {link.icon}
                  </span>
                )}
                <span className="text-[12px] font-bold text-slate-900 font-display">{link.label}</span>
              </Link>
            ))}
          </div>

          {nextStep ? (
            <Link
              href={nextStep.href}
              onClick={dismissModal}
              className="w-full inline-flex items-center justify-center gap-2 bg-clerk-primary text-slate-950 text-[13px] font-bold px-5 py-3 rounded-full hover:bg-clerk-primary-dark hover:text-white transition-colors"
            >
              Continue: {nextStep.label}
              <span className="material-symbols-outlined ms-icon-filled" style={{ fontSize: 14 }}>
                arrow_forward
              </span>
            </Link>
          ) : (
            <p className="text-center text-[13px] text-clerk-primary-darker font-semibold">
              Almost there. Message your shop on WhatsApp like a customer
            </p>
          )}

          {pendingOrders > 0 && (
            <p className="mt-3 text-center text-[12px] text-slate-500">
              You also have <Num>{pendingOrders}</Num> pending order{pendingOrders === 1 ? '' : 's'} waiting
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
