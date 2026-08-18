'use client'

import { useEffect, useState } from 'react'
import {
  disconnectMoolre,
  disconnectPayment,
  getMoolreConfig,
  getPaymentConfig,
  listPaymentMethods,
  provisionMoolreWallet,
  removeMomoMethod,
  saveMoolreConfig,
  savePaymentConfig,
  saveMomoMethod,
  setDefaultPaymentMethod,
  type PaymentMethod,
  type PaymentMethodType,
  formatUserError,
} from '@/lib/api'
import { badgeClass } from '@/lib/dashboard-ui'

const NETWORKS = ['mtn', 'vodafone', 'airteltigo'] as const

const payInputClass =
  'w-full px-3.5 py-3 sm:py-2.5 text-[16px] sm:text-[14px] text-slate-900 bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-clerk-primary/25 focus:border-clerk-primary transition-all'

const payKeyInputClass =
  'w-full px-3.5 py-3 sm:py-2.5 text-[16px] sm:text-[13px] font-mono text-slate-900 bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-clerk-primary/25 focus:border-clerk-primary transition-all'

const primaryBtn =
  'min-h-[44px] inline-flex items-center justify-center bg-clerk-primary text-slate-950 text-[13px] font-bold px-5 py-2.5 rounded-full hover:bg-clerk-primary-dark hover:text-white transition-colors disabled:opacity-50 touch-manipulation'

const ghostBtn =
  'min-h-[44px] inline-flex items-center justify-center text-[12px] font-semibold text-slate-600 border border-slate-200 bg-white px-4 py-2.5 rounded-full hover:bg-slate-50 transition-colors disabled:opacity-50 touch-manipulation'

const linkBtn =
  'min-h-[44px] inline-flex items-center justify-center text-[12px] font-semibold text-clerk-primary-dark hover:underline touch-manipulation px-1'

const dangerLink =
  'min-h-[44px] inline-flex items-center justify-center text-[12px] font-semibold text-red-500 hover:text-red-600 transition-colors disabled:opacity-50 touch-manipulation px-1'

type RailId = PaymentMethodType

type RailConfig = {
  id: RailId
  title: string
  subtitle: string
  recommended?: boolean
  isReady: boolean
  setupHint?: string
}

function networkLabel(n: string) {
  if (n === 'airteltigo') return 'AirtelTigo'
  return n.charAt(0).toUpperCase() + n.slice(1)
}

export function PaymentsPanel() {
  const [loading, setLoading] = useState(true)
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [paystackConnected, setPaystackConnected] = useState(false)
  const [moolreConnected, setMoolreConnected] = useState(false)
  const [moolreAccount, setMoolreAccount] = useState('')
  const [moolreSandbox, setMoolreSandbox] = useState(false)
  const [error, setError] = useState('')
  const [defaultBusy, setDefaultBusy] = useState<RailId | null>(null)

  const [momoOpen, setMomoOpen] = useState(false)
  const [momoProvider, setMomoProvider] = useState('mtn')
  const [momoNumber, setMomoNumber] = useState('')
  const [momoBusy, setMomoBusy] = useState(false)
  const [momoError, setMomoError] = useState('')

  const [paystackOpen, setPaystackOpen] = useState(false)
  const [secretKey, setSecretKey] = useState('')
  const [publicKey, setPublicKey] = useState('')
  const [paystackBusy, setPaystackBusy] = useState(false)
  const [paystackError, setPaystackError] = useState('')

  const [moolreOpen, setMoolreOpen] = useState(false)
  const [moolreMode, setMoolreMode] = useState<'provision' | 'link'>('provision')
  const [moolreSettlement, setMoolreSettlement] = useState('')
  const [moolreBusy, setMoolreBusy] = useState(false)
  const [moolreError, setMoolreError] = useState('')

  const momo = methods.find((m) => m.type === 'momo')
  const defaultMethod = methods.find((m) => m.isDefault)

  async function reload() {
    try {
      const [res, paystackCfg, moolreCfg] = await Promise.all([
        listPaymentMethods(),
        getPaymentConfig().catch(() => ({ connected: false })),
        getMoolreConfig().catch(() => ({ connected: false, accountNumber: '', sandbox: false })),
      ])
      setMethods(res.methods ?? [])
      setPaystackConnected(paystackCfg.connected)
      setMoolreConnected(moolreCfg.connected)
      setMoolreSandbox(Boolean(moolreCfg.sandbox))
      if (moolreCfg.accountNumber) setMoolreAccount(moolreCfg.accountNumber)
      setError('')
    } catch (err) {
      setError(formatUserError(err, "Couldn't load payment settings."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  const rails: RailConfig[] = [
    {
      id: 'moolre',
      title: 'Moolre',
      subtitle: moolreConnected
        ? `Wallet ${moolreAccount} · daily settlement to your MoMo`
        : 'MoMo + card · payments land in your wallet',
      recommended: true,
      isReady: moolreConnected,
      setupHint: 'Create or link a wallet below',
    },
    {
      id: 'paystack',
      title: 'Paystack',
      subtitle: paystackConnected ? 'Connected · card and bank payments' : 'Connect your Paystack account',
      isReady: paystackConnected,
      setupHint: 'Add your Paystack keys below',
    },
    {
      id: 'momo',
      title: 'Mobile Money',
      subtitle: momo ? `${networkLabel(momo.provider)} · ${momo.number}` : 'Customer pays to your MoMo number',
      isReady: !!momo,
      setupHint: 'Add your MoMo number below',
    },
    {
      id: 'manual',
      title: 'Manual',
      subtitle: 'You arrange payment with the customer',
      isReady: true,
    },
  ]

  async function handleSetDefault(type: RailId) {
    if (type === 'moolre' && !moolreConnected) return
    if (type === 'paystack' && !paystackConnected) return
    if (type === 'momo' && !momo) return
    if (defaultMethod?.type === type) return

    setDefaultBusy(type)
    setError('')
    try {
      await setDefaultPaymentMethod(type)
      await reload()
    } catch (err) {
      setError(formatUserError(err, "Couldn't update your default payment method."))
    } finally {
      setDefaultBusy(null)
    }
  }

  async function handleSaveMomo() {
    if (!momoNumber.trim()) {
      setMomoError('Enter your MoMo number')
      return
    }
    setMomoBusy(true)
    setMomoError('')
    try {
      await saveMomoMethod(momoProvider, momoNumber.trim())
      setMomoOpen(false)
      setMomoNumber('')
      await reload()
    } catch (err) {
      setMomoError(formatUserError(err, "Couldn't save your MoMo number."))
    } finally {
      setMomoBusy(false)
    }
  }

  async function handleRemoveMomo() {
    setMomoBusy(true)
    try {
      await removeMomoMethod()
      await reload()
    } catch (err) {
      setMomoError(formatUserError(err, "Couldn't remove MoMo."))
    } finally {
      setMomoBusy(false)
    }
  }

  async function handleSavePaystack() {
    if (!secretKey.trim() || !publicKey.trim()) {
      setPaystackError('Both keys are required')
      return
    }
    setPaystackBusy(true)
    setPaystackError('')
    try {
      await savePaymentConfig(secretKey.trim(), publicKey.trim())
      setSecretKey('')
      setPublicKey('')
      setPaystackOpen(false)
      await reload()
    } catch (err) {
      setPaystackError(formatUserError(err, "Couldn't save Paystack keys."))
    } finally {
      setPaystackBusy(false)
    }
  }

  async function handleDisconnectPaystack() {
    setPaystackBusy(true)
    try {
      await disconnectPayment()
      await reload()
    } catch (err) {
      setPaystackError(formatUserError(err, "Couldn't disconnect Paystack."))
    } finally {
      setPaystackBusy(false)
    }
  }

  async function handleProvisionMoolre() {
    if (!moolreSettlement.trim()) {
      setMoolreError('Enter the MoMo number for daily settlement')
      return
    }
    setMoolreBusy(true)
    setMoolreError('')
    try {
      const res = await provisionMoolreWallet(moolreSettlement.trim())
      if (res.accountNumber) setMoolreAccount(res.accountNumber)
      setMoolreOpen(false)
      setMoolreSettlement('')
      await reload()
    } catch (err) {
      setMoolreError(formatUserError(err, "Couldn't create your Moolre wallet."))
    } finally {
      setMoolreBusy(false)
    }
  }

  async function handleSaveMoolre() {
    if (!moolreAccount.trim()) {
      setMoolreError('Enter your Moolre account number')
      return
    }
    setMoolreBusy(true)
    setMoolreError('')
    try {
      await saveMoolreConfig(moolreAccount.trim())
      setMoolreOpen(false)
      await reload()
    } catch (err) {
      setMoolreError(formatUserError(err, "Couldn't save Moolre account."))
    } finally {
      setMoolreBusy(false)
    }
  }

  async function handleDisconnectMoolre() {
    setMoolreBusy(true)
    try {
      await disconnectMoolre()
      await reload()
    } catch (err) {
      setMoolreError(formatUserError(err, "Couldn't disconnect Moolre."))
    } finally {
      setMoolreBusy(false)
    }
  }

  function toggleMomo() {
    setMomoOpen((o) => !o)
    setMomoError('')
    if (momo) {
      setMomoProvider(momo.provider || 'mtn')
      setMomoNumber(momo.number)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl space-y-3 mt-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse h-[88px]" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-4 ui-enter pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {error && (
        <p className="text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
      )}

      <div className="bg-clerk-light/60 border border-clerk-primary/15 rounded-2xl px-4 sm:px-5 py-4">
        <p className="text-[13px] font-semibold text-slate-900 font-display">Clerk never holds your money</p>
        <p className="text-[12px] text-slate-600 mt-1 leading-relaxed">
          Customer payments go to your Moolre wallet, Paystack account, or MoMo number. Clerk sends the link and tracks
          the order.
        </p>
      </div>

      <div>
        <p className="text-[14px] font-semibold text-slate-900 font-display mb-3">Checkout method</p>
        <p className="text-[12px] text-slate-500 mb-3 leading-relaxed">
          Choose how customers pay when they order on WhatsApp. Set up a method below, then tap it to use at checkout.
        </p>

        <div className="space-y-3">
          {rails.map((rail) => {
            const isDefault = defaultMethod?.type === rail.id
            const canSelect = rail.isReady
            const busy = defaultBusy === rail.id

            return (
              <div
                key={rail.id}
                className={`bg-white rounded-2xl border shadow-[0_8px_40px_rgba(15,23,42,0.07)] overflow-hidden transition-colors ${
                  isDefault ? 'border-clerk-primary/40 ring-1 ring-clerk-primary/15' : 'border-slate-200'
                }`}
              >
                <div className="px-4 sm:px-5 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                    <label
                      className={`flex items-start gap-3 min-w-0 flex-1 ${canSelect ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      <input
                        type="radio"
                        name="checkout-method"
                        checked={isDefault}
                        disabled={!canSelect || busy}
                        onChange={() => void handleSetDefault(rail.id)}
                        className="mt-1 size-4 shrink-0 accent-clerk-primary disabled:opacity-40"
                        aria-label={`Use ${rail.title} at checkout`}
                      />
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-[14px] font-semibold text-slate-900 font-display">{rail.title}</span>
                          {rail.recommended && (
                            <span className="text-[10px] font-bold uppercase tracking-wide text-clerk-primary-darker bg-clerk-light px-2 py-0.5 rounded-full">
                              Recommended
                            </span>
                          )}
                          {isDefault && <span className={badgeClass('success')}>Active</span>}
                        </span>
                        <span className="block text-[12px] text-slate-500 mt-0.5 leading-relaxed">{rail.subtitle}</span>
                        {!rail.isReady && rail.setupHint && (
                          <span className="block text-[11px] text-amber-700 mt-1">{rail.setupHint}</span>
                        )}
                      </span>
                    </label>

                    <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end sm:pt-0.5 pl-7 sm:pl-0">
                      {rail.id === 'moolre' && (
                        <button type="button" onClick={() => { setMoolreOpen((o) => !o); setMoolreError('') }} className={linkBtn}>
                          {moolreOpen ? 'Cancel' : moolreConnected ? 'Manage' : 'Set up'}
                        </button>
                      )}
                      {rail.id === 'paystack' && (
                        <button
                          type="button"
                          onClick={() => { setPaystackOpen((o) => !o); setPaystackError('') }}
                          className={linkBtn}
                        >
                          {paystackOpen ? 'Cancel' : paystackConnected ? 'Update keys' : 'Connect'}
                        </button>
                      )}
                      {rail.id === 'momo' && (
                        <button type="button" onClick={toggleMomo} className={linkBtn}>
                          {momoOpen ? 'Cancel' : momo ? 'Edit' : 'Set up'}
                        </button>
                      )}
                      {canSelect && !isDefault && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleSetDefault(rail.id)}
                          className={ghostBtn}
                        >
                          {busy ? 'Updating…' : 'Use at checkout'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {rail.id === 'momo' && momoOpen && (
                  <div className="border-t border-slate-100 px-4 sm:px-5 pb-5 pt-4 space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      {NETWORKS.map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setMomoProvider(n)}
                          className={`min-h-[44px] rounded-xl border text-[12px] font-semibold capitalize transition-all touch-manipulation ${
                            momoProvider === n
                              ? 'border-clerk-primary bg-clerk-light text-clerk-primary-darker'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {networkLabel(n)}
                        </button>
                      ))}
                    </div>
                    <input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={momoNumber}
                      onChange={(e) => setMomoNumber(e.target.value)}
                      placeholder="055 000 0000"
                      className={payInputClass}
                    />
                    {momoError && <p className="text-[12px] text-red-500">{momoError}</p>}
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                      <button type="button" onClick={() => void handleSaveMomo()} disabled={momoBusy} className={`${primaryBtn} w-full sm:w-auto`}>
                        {momoBusy ? 'Saving…' : 'Save MoMo'}
                      </button>
                      {momo && (
                        <button type="button" onClick={() => void handleRemoveMomo()} disabled={momoBusy} className={dangerLink}>
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {rail.id === 'paystack' && paystackOpen && (
                  <div className="border-t border-slate-100 px-4 sm:px-5 pb-5 pt-4 space-y-4">
                    <form
                      autoComplete="off"
                      onSubmit={(e) => {
                        e.preventDefault()
                        void handleSavePaystack()
                      }}
                      className="space-y-3"
                    >
                      <div>
                        <label htmlFor="paystack-public" className="block text-[12px] font-semibold text-slate-600 mb-1.5">
                          Public key
                        </label>
                        <input
                          id="paystack-public"
                          type="password"
                          name="paystack-public-key"
                          autoComplete="new-password"
                          value={publicKey}
                          onChange={(e) => setPublicKey(e.target.value)}
                          placeholder="pk_live_…"
                          className={payKeyInputClass}
                        />
                      </div>
                      <div>
                        <label htmlFor="paystack-secret" className="block text-[12px] font-semibold text-slate-600 mb-1.5">
                          Secret key
                        </label>
                        <input
                          id="paystack-secret"
                          type="password"
                          name="paystack-secret-key"
                          autoComplete="new-password"
                          value={secretKey}
                          onChange={(e) => setSecretKey(e.target.value)}
                          placeholder="sk_live_…"
                          className={payKeyInputClass}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Your keys from Paystack → Settings. Separate from Clerk Plan billing keys in <code className="text-[10px] bg-slate-100 px-1 rounded">.env</code>.
                      </p>
                      {paystackError && <p className="text-[12px] text-red-500">{paystackError}</p>}
                      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                        <button type="submit" disabled={paystackBusy} className={`${primaryBtn} w-full sm:w-auto`}>
                          {paystackBusy ? 'Saving…' : 'Save keys'}
                        </button>
                        {paystackConnected && (
                          <button
                            type="button"
                            onClick={() => void handleDisconnectPaystack()}
                            disabled={paystackBusy}
                            className={dangerLink}
                          >
                            Disconnect
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                )}

                {rail.id === 'moolre' && moolreOpen && (
                  <div className="border-t border-slate-100 px-4 sm:px-5 pb-5 pt-4 space-y-4">
                    {moolreSandbox && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-[12px] text-amber-900 leading-relaxed">
                        <p className="font-semibold mb-1">Sandbox mode</p>
                        <p>
                          Clerk is using the Moolre sandbox API. Use <strong>Create wallet</strong> with a username that
                          has Collections/wallet access, not SMS/VAS-only keys. Linking a live dashboard account number
                          will not work in sandbox.
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setMoolreMode('provision')}
                        className={`min-h-[44px] rounded-xl border text-[12px] font-semibold transition-all touch-manipulation ${
                          moolreMode === 'provision'
                            ? 'border-clerk-primary bg-clerk-light text-clerk-primary-darker'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        Create wallet
                      </button>
                      <button
                        type="button"
                        onClick={() => setMoolreMode('link')}
                        className={`min-h-[44px] rounded-xl border text-[12px] font-semibold transition-all touch-manipulation ${
                          moolreMode === 'link'
                            ? 'border-clerk-primary bg-clerk-light text-clerk-primary-darker'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        Link existing
                      </button>
                    </div>

                    {moolreMode === 'provision' ? (
                      <>
                        <div>
                          <label htmlFor="moolre-settlement" className="block text-[12px] font-semibold text-slate-600 mb-1.5">
                            Settlement MoMo number
                          </label>
                          <input
                            id="moolre-settlement"
                            type="tel"
                            inputMode="tel"
                            value={moolreSettlement}
                            onChange={(e) => setMoolreSettlement(e.target.value)}
                            placeholder="055 000 0000"
                            className={payInputClass}
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Clerk creates a Moolre sub-wallet. Customer payments land there; Moolre sweeps to this number
                          daily.
                        </p>
                        {moolreError && <p className="text-[12px] text-red-500">{moolreError}</p>}
                        <button
                          type="button"
                          onClick={() => void handleProvisionMoolre()}
                          disabled={moolreBusy}
                          className={`${primaryBtn} w-full sm:w-auto`}
                        >
                          {moolreBusy ? 'Creating…' : 'Create Moolre wallet'}
                        </button>
                      </>
                    ) : (
                      <>
                        <div>
                          <label htmlFor="moolre-account" className="block text-[12px] font-semibold text-slate-600 mb-1.5">
                            Moolre account number
                          </label>
                          <input
                            id="moolre-account"
                            type="text"
                            value={moolreAccount}
                            onChange={(e) => setMoolreAccount(e.target.value)}
                            placeholder="Your Moolre account number"
                            className={payInputClass}
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          For merchants who already have a Moolre business wallet.
                        </p>
                        {moolreError && <p className="text-[12px] text-red-500">{moolreError}</p>}
                        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                          <button
                            type="button"
                            onClick={() => void handleSaveMoolre()}
                            disabled={moolreBusy}
                            className={`${primaryBtn} w-full sm:w-auto`}
                          >
                            {moolreBusy ? 'Saving…' : 'Link account'}
                          </button>
                          {moolreConnected && (
                            <button
                              type="button"
                              onClick={() => void handleDisconnectMoolre()}
                              disabled={moolreBusy}
                              className={dangerLink}
                            >
                              Disconnect
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
