'use client'

import { OnboardingInventoryStep } from '@/components/onboarding/OnboardingInventoryStep'
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress'
import { OnboardingStepHeader } from '@/components/onboarding/OnboardingStepHeader'
import { WhatsAppCommunityPrompt } from '@/components/dashboard/WhatsAppCommunityPrompt'
import {
  createWhatsAppSession,
  getMe,
  getWhatsAppStatus,
  listInventory,
  setToken,
  type InventoryItem,
  type MeResult,
  type WhatsAppSession,
  formatUserError,
} from '@/lib/api'
import { ApiClientError } from '@/lib/errors'
import {
  isOnboardingMarkedDone,
  markOnboardingDone,
  suggestOnboardingStep,
  type OnboardingStepId,
} from '@/lib/onboarding'
import { routes } from '@/lib/dashboard-routes'
import { pairingPhoneDigits } from '@/lib/phone'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

const primaryBtn =
  'inline-flex items-center justify-center gap-2 bg-clerk-primary text-slate-950 text-[13px] font-bold px-7 py-3 rounded-full hover:bg-clerk-primary-dark hover:text-white active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100'

const cardClass =
  'bg-white rounded-2xl border border-slate-200 shadow-[0_8px_40px_rgba(15,23,42,0.07)]'

export default function OnboardingPage() {
  const [step, setStep] = useState<OnboardingStepId>(1)
  const [me, setMe] = useState<MeResult | null>(null)
  const [session, setSession] = useState<WhatsAppSession | null>(null)
  const [products, setProducts] = useState<InventoryItem[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [loading, setLoading] = useState(true)
  const [connectStarted, setConnectStarted] = useState(false)
  const [linkMode, setLinkMode] = useState<'qr' | 'code'>('qr')
  const [pairPhone, setPairPhone] = useState('')

  const waConnected = session?.connected === true
  const productCount = products.length

  const pollStatus = useCallback(async () => {
    try {
      const status = await getWhatsAppStatus()
      setSession((prev) => {
        if (status.pairingCode) return status
        if (status.qr) return status
        if (prev?.pairingCode && status.status === 'qr') {
          return { ...status, pairingCode: prev.pairingCode, phone: prev.phone }
        }
        if (prev?.qr && status.status === 'qr') return { ...status, qr: prev.qr }
        return status
      })
    } catch {
      // no session yet
    }
  }, [])

  const refreshProducts = useCallback(async () => {
    const inv = await listInventory()
    setProducts(inv.items ?? [])
  }, [])

  const startWhatsAppConnect = useCallback(async (phone?: string) => {
    if (!phone && connectStarted && (session?.qr || session?.pairingCode)) return
    setBusy('connect')
    setError('')
    setConnectStarted(true)
    try {
      setSession(await createWhatsAppSession(phone))
    } catch (err) {
      setError(formatUserError(err, "Couldn't start WhatsApp linking. Try again."))
      setConnectStarted(false)
    } finally {
      setBusy('')
    }
  }, [connectStarted, session?.qr, session?.pairingCode])

  useEffect(() => {
    if (!localStorage.getItem('clerk_token')) {
      window.location.href = '/login?mode=signup'
      return
    }

    async function init() {
      try {
        const isNew = new URLSearchParams(window.location.search).get('new') === '1'

        if (!isNew && isOnboardingMarkedDone()) {
          window.location.href = '/dashboard'
          return
        }

        const [profile, inv] = await Promise.all([getMe(), listInventory()])
        setMe(profile)
        setProducts(inv.items ?? [])

        let sess: WhatsAppSession | null = null
        try {
          sess = await getWhatsAppStatus()
          setSession(sess)
        } catch {
          // not linked yet
        }

        const connected = sess?.connected === true
        const count = inv.items?.length ?? 0
        setStep(isNew ? 1 : suggestOnboardingStep(connected, count))
      } catch (err) {
        if (ApiClientError.isUnauthorized(err)) {
          setToken(null)
          window.location.href = '/login'
          return
        }
        setError(formatUserError(err, "Couldn't load onboarding. Refresh the page."))
      } finally {
        setLoading(false)
      }
    }

    void init()
  }, [])

  useEffect(() => {
    if (session?.status !== 'qr' && session?.status !== 'connecting') return
    const id = setInterval(() => void pollStatus(), 3000)
    return () => clearInterval(id)
  }, [session?.status, pollStatus])

  function openDashboard() {
    markOnboardingDone()
    window.location.href = '/dashboard'
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="ui-enter bg-white rounded-2xl border border-slate-200 shadow-[0_8px_40px_rgba(15,23,42,0.07)] px-8 py-10 flex flex-col items-center gap-4">
          <div className="size-10 rounded-2xl bg-clerk-light flex items-center justify-center">
            <div className="size-5 rounded-full border-2 border-clerk-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-[14px] text-slate-500">Loading your setup…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col px-5 sm:px-8 py-8 sm:py-12">
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col ui-enter">
        <OnboardingProgress current={step} />

        <div className="mt-8 sm:mt-10 flex-1">
          {error && (
            <p className="mb-6 text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          {step === 1 && (
            <div>
              <OnboardingStepHeader
                title="You're in"
                description={
                  me?.businessName ? (
                    <>
                      <span className="font-semibold text-slate-800">{me.businessName}</span> is ready.
                      Three quick steps and Clerk handles your WhatsApp sales.
                    </>
                  ) : (
                    'Connect WhatsApp, add products, go live — then join our merchant community.'
                  )
                }
              />
              <ul className="mb-8 space-y-2 text-[13px] text-slate-600 max-w-sm mx-auto">
                {[
                  'Connect your WhatsApp number',
                  'Add what you sell',
                  'Open your dashboard',
                  'Join our merchant community',
                ].map(
                  (line) => (
                    <li key={line} className="flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-clerk-primary shrink-0" />
                      {line}
                    </li>
                  )
                )}
              </ul>
              <div className="flex justify-center">
                <button type="button" className={primaryBtn} onClick={() => setStep(2)}>
                  Start setup
                  <span className="material-symbols-outlined ms-icon-filled" style={{ fontSize: 14 }}>
                    arrow_forward
                  </span>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <OnboardingStepHeader
                title="Connect WhatsApp"
                description={
                  session?.pairingCode && linkMode === 'code'
                    ? 'Enter the code on your phone under Linked devices → Link with phone number.'
                    : session?.qr && linkMode === 'qr'
                      ? 'On your phone: WhatsApp → Linked devices → Link a device → scan the code.'
                      : 'Choose how you want to link: scan a QR code, or enter a pairing code on your phone.'
                }
              />

              {!waConnected && (
                <div className="flex p-1 bg-slate-100 rounded-full max-w-xs mx-auto mb-4">
                  {(['qr', 'code'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setLinkMode(m)
                        setConnectStarted(false)
                        setError('')
                      }}
                      className={`flex-1 text-[12px] font-semibold py-2 rounded-full transition-all ${
                        linkMode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      {m === 'qr' ? 'Scan QR' : 'Phone code'}
                    </button>
                  ))}
                </div>
              )}

              <div className={`${cardClass} p-6 sm:p-8`}>
                {waConnected ? (
                  <div className="text-center py-2">
                    <span className="inline-flex rounded-full bg-clerk-light px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-clerk-primary-darker mb-4">
                      Connected
                    </span>
                    <p className="text-[16px] font-bold text-slate-900 font-display">WhatsApp linked</p>
                    {session?.phone && (
                      <p className="text-[14px] text-slate-500 mt-1 tabular-nums">+{session.phone}</p>
                    )}
                  </div>
                ) : linkMode === 'code' ? (
                  session?.pairingCode ? (
                    <div className="text-center py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-3">
                        Pairing code
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold tracking-[0.25em] text-slate-900 font-mono">
                        {session.pairingCode}
                      </p>
                      <p className="mt-4 text-[13px] text-slate-500 leading-relaxed max-w-sm mx-auto">
                        WhatsApp → Linked devices → Link a device →{' '}
                        <span className="font-semibold text-slate-700">Link with phone number instead</span>
                      </p>
                      <button
                        type="button"
                        className="mt-5 text-[12px] font-semibold text-clerk-primary-darker hover:underline"
                        disabled={busy === 'connect'}
                        onClick={() => {
                          const digits = pairingPhoneDigits(pairPhone) || session.phone || undefined
                          if (!digits) {
                            setSession((prev) =>
                              prev ? { ...prev, pairingCode: null, qr: null, status: 'idle' } : prev
                            )
                            return
                          }
                          void startWhatsAppConnect(digits)
                        }}
                      >
                        {busy === 'connect' ? 'Getting code…' : 'Get a new code'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <label htmlFor="ob-pair-phone" className="block text-[11px] font-semibold text-slate-600">
                        WhatsApp number on your phone
                      </label>
                      <input
                        id="ob-pair-phone"
                        type="tel"
                        inputMode="tel"
                        value={pairPhone}
                        onChange={(e) => setPairPhone(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const digits = pairingPhoneDigits(pairPhone)
                            if (!digits) {
                              setError('Enter your WhatsApp number (e.g. 0202966466)')
                              return
                            }
                            void startWhatsAppConnect(digits)
                          }
                        }}
                        placeholder="0202966466"
                        className="w-full px-3 py-3 text-[16px] sm:text-[14px] text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clerk-primary/25 focus:border-clerk-primary"
                      />
                      <p className="text-[11px] text-slate-400">
                        Use the number on the phone you will open WhatsApp on.
                      </p>
                      <button
                        type="button"
                        className={`${primaryBtn} w-full`}
                        disabled={busy === 'connect'}
                        onClick={() => {
                          const digits = pairingPhoneDigits(pairPhone)
                          if (!digits) {
                            setError('Enter your WhatsApp number (e.g. 0202966466)')
                            return
                          }
                          void startWhatsAppConnect(digits)
                        }}
                      >
                        {busy === 'connect' ? 'Getting code…' : 'Get pairing code'}
                      </button>
                    </div>
                  )
                ) : session?.qr ? (
                  <div className="flex flex-col items-center">
                    <div className="rounded-2xl overflow-hidden border border-slate-100 p-3 bg-slate-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={session.qr} alt="WhatsApp QR code" className="w-48 h-48 sm:w-56 sm:h-56 block" />
                    </div>
                    <p className="mt-5 text-[13px] font-semibold text-slate-700">Waiting for scan…</p>
                    <p className="mt-1 text-[12px] text-slate-400">QR refreshes every ~20 seconds</p>
                    <button
                      type="button"
                      className="mt-4 text-[12px] font-semibold text-clerk-primary-darker hover:underline"
                      disabled={busy === 'connect'}
                      onClick={() => void startWhatsAppConnect()}
                    >
                      {busy === 'connect' ? 'Refreshing…' : 'Refresh QR'}
                    </button>
                  </div>
                ) : busy === 'connect' ? (
                  <div className="text-center py-10">
                    <div className="size-9 mx-auto border-2 border-clerk-primary/30 border-t-clerk-primary rounded-full animate-spin mb-4" />
                    <p className="text-[14px] text-slate-500">Generating QR code…</p>
                  </div>
                ) : (
                  <div className="text-center py-6 space-y-4">
                    <p className="text-[14px] text-slate-500 leading-relaxed max-w-sm mx-auto">
                      Scan a QR code with WhatsApp on your phone to link Clerk.
                    </p>
                    <button
                      type="button"
                      className={primaryBtn}
                      onClick={() => void startWhatsAppConnect()}
                    >
                      Show QR code
                    </button>
                  </div>
                )}
              </div>

              {waConnected && (
                <div className="mt-8 flex justify-center">
                  <button type="button" className={primaryBtn} onClick={() => setStep(3)}>
                    Continue
                    <span className="material-symbols-outlined ms-icon-filled" style={{ fontSize: 14 }}>
                      arrow_forward
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <OnboardingStepHeader
                title="Add your catalog"
                description="Clerk uses this to answer questions and take orders. Add products, services, or both."
              />

              <OnboardingInventoryStep
                products={products}
                businessScope={me?.businessScope}
                onScopeSaved={(scope) => setMe((prev) => (prev ? { ...prev, businessScope: scope } : prev))}
                onProductsUpdated={refreshProducts}
                onError={setError}
              />

              <div className="mt-8 flex flex-col items-center gap-2">
                <button
                  type="button"
                  className={primaryBtn}
                  onClick={() => setStep(4)}
                  disabled={productCount === 0}
                >
                  Continue
                  <span className="material-symbols-outlined ms-icon-filled" style={{ fontSize: 14 }}>
                    arrow_forward
                  </span>
                </button>
                {productCount === 0 && (
                  <p className="text-[12px] text-slate-400">Add at least one product to continue</p>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <OnboardingStepHeader
                title="You're live"
                description="Clerk is connected and ready. Real customers get replies on WhatsApp."
              />

              <div className={`${cardClass} p-6 mb-8 divide-y divide-slate-100`}>
                {[
                  { label: 'WhatsApp connected', done: waConnected },
                  { label: `Products in catalog (${productCount})`, done: productCount > 0 },
                  { label: 'Clerk is active', done: true, live: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <span
                      className={`text-[14px] font-semibold ${
                        item.live ? 'text-clerk-primary-darker' : 'text-slate-800'
                      }`}
                    >
                      {item.label}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wide shrink-0 ${
                        item.live ? 'text-clerk-primary' : item.done ? 'text-clerk-primary-darker' : 'text-slate-400'
                      }`}
                    >
                      {item.live ? 'Live' : item.done ? 'Done' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-[13px] text-slate-500 text-center mb-6 leading-relaxed">
                Add MoMo or Paystack anytime from{' '}
                <Link href={routes.payments} className="text-clerk-primary-darker font-semibold hover:underline">
                  Payments
                </Link>{' '}
                so customers can pay at checkout.
              </p>

              <div className="flex flex-col items-center">
                <button type="button" className={primaryBtn} onClick={() => setStep(5)}>
                  Continue
                  <span className="material-symbols-outlined ms-icon-filled" style={{ fontSize: 14 }}>
                    arrow_forward
                  </span>
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <OnboardingStepHeader
                title="Join the community"
                description="You're all set. One last thing — our WhatsApp group is where merchants ask questions, share feedback, and get help."
              />

              <WhatsAppCommunityPrompt variant="onboarding" onContinue={openDashboard} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
