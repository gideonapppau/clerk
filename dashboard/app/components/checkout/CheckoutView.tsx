'use client'

import { useState } from 'react'
import { parseApiError, formatUserError } from '@/lib/errors'
import type { CheckoutOrder } from '@/app/checkout/page'
import { CheckoutOrderSummary } from '@/components/checkout/CheckoutOrderSummary'
import { formatGhs } from '@/lib/money'

type Props = {
  order: CheckoutOrder
  token: string
}

type Phase = 'review' | 'email' | 'redirecting' | 'error'

const inputClass =
  'w-full px-3.5 py-3 text-[16px] sm:text-[14px] text-slate-900 bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-clerk-primary/25 focus:border-clerk-primary transition-all'

const primaryBtn =
  'w-full min-h-[48px] inline-flex items-center justify-center gap-2 bg-clerk-primary text-slate-950 text-[14px] font-bold py-3.5 sm:py-3 rounded-full hover:bg-clerk-primary-dark hover:text-white active:scale-[0.98] transition-all touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'

export function CheckoutView({ order, token }: Props) {
  const [phase, setPhase] = useState<Phase>('review')
  const [email, setEmail] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const isExpired = order.status !== 'PENDING_CONFIRMATION'

  async function handlePay(customerEmail: string) {
    setPhase('redirecting')
    try {
      const res = await fetch('/core/api/v1/checkout/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, customerEmail }),
      })
      const json = await res.json().catch(() => ({}))
      const data = json.data ?? json

      if (res.ok && data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else if (res.status === 503) {
        setErrorMsg('The seller has not connected a payment method yet. Please contact them on WhatsApp.')
        setPhase('error')
      } else if (res.status === 401) {
        setErrorMsg('This payment link has expired. Please request a new one.')
        setPhase('error')
      } else {
        setErrorMsg(parseApiError(res.status, json).message)
        setPhase('error')
      }
    } catch (err) {
      setErrorMsg(formatUserError(err, 'Network error. Please check your connection and try again.'))
      setPhase('error')
    }
  }

  function handlePayClick() {
    if (email.trim()) {
      void handlePay(email.trim())
    } else {
      setPhase('email')
    }
  }

  const showStickyPay = !isExpired && phase !== 'email'

  return (
    <div className={`ui-enter flex flex-col gap-4 sm:gap-5 ${showStickyPay ? 'pb-24 sm:pb-0' : ''}`}>
      <div className="text-center px-1">
        <h1 className="text-[1.35rem] sm:text-[1.5rem] font-extrabold text-slate-900 font-display tracking-tight mb-2">
          Complete your order
        </h1>
        <p className="text-[14px] text-slate-500 leading-relaxed max-w-[300px] mx-auto">
          Review the details below, then pay securely.
        </p>
      </div>

      <CheckoutOrderSummary
        productName={order.product}
        quantity={order.quantity}
        amount={order.subtotal}
      />

      {isExpired && (
        <p className="text-[13px] text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 leading-relaxed">
          This reservation has expired. Contact the seller on WhatsApp to place a new order.
        </p>
      )}

      {phase === 'email' && !isExpired && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_8px_40px_rgba(15,23,42,0.07)] px-4 sm:px-5 py-4 flex flex-col gap-3">
          <p className="text-[13px] font-semibold text-slate-800">Email for your receipt</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && email.trim() && void handlePay(email.trim())}
            placeholder="you@example.com"
            className={inputClass}
            autoFocus
          />
          <button
            type="button"
            onClick={() => void handlePay(email.trim() || 'customer@checkout.clerk')}
            className={primaryBtn}
          >
            Continue to payment
            <span className="material-symbols-outlined ms-icon-filled" style={{ fontSize: 14 }}>
              arrow_forward
            </span>
          </button>
        </div>
      )}

      {phase === 'error' && (
        <p className="text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 leading-relaxed">
          {errorMsg}
        </p>
      )}

      {!isExpired && phase !== 'email' && (
        <div className="fixed bottom-0 inset-x-0 z-10 border-t border-slate-200/80 bg-[#f5f4f0]/95 backdrop-blur-sm px-4 pt-3 pb-safe sm:static sm:border-0 sm:bg-transparent sm:backdrop-blur-none sm:p-0">
          <button
            type="button"
            onClick={handlePayClick}
            disabled={phase === 'redirecting'}
            className={primaryBtn}
          >
            {phase === 'redirecting' ? (
              <>
                <span className="size-4 rounded-full border-2 border-slate-950/30 border-t-slate-950 animate-spin" />
                Redirecting to payment…
              </>
            ) : (
              <>
                Pay {formatGhs(order.subtotal)}
                <span className="material-symbols-outlined ms-icon-filled" style={{ fontSize: 14 }}>
                  arrow_forward
                </span>
              </>
            )}
          </button>
          <p className="sm:hidden text-center text-[11px] text-slate-400 leading-relaxed mt-2.5 pb-1">
            Secured by Paystack
          </p>
        </div>
      )}

      <p className="hidden sm:block text-center text-[11px] text-slate-400 leading-relaxed">
        Secured by Paystack · Your card is not stored by Clerk
      </p>
    </div>
  )
}
