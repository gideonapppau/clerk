'use client'

import { useEffect, useState } from 'react'
import {
  CheckoutCompleteView,
  type CompleteOrder,
} from '@/components/checkout/CheckoutCompleteView'

type Props = {
  orderId: string
  reference: string
  initialConfirmed: boolean
  initialOrder: CompleteOrder | null
  initialError?: string
  provider?: 'paystack' | 'moolre' | 'other'
}

type PollResult = {
  confirmed: boolean
  order: CompleteOrder | null
  reference: string
  error?: string
  provider?: string
}

async function pollComplete(orderId: string, reference: string, provider?: string): Promise<PollResult> {
  const params = new URLSearchParams({ orderId })
  // Paystack: poll DB only. Moolre / unknown: allow server-side status check.
  if (provider === 'paystack') {
    params.set('verify', '0')
  }
  if (reference) params.set('reference', reference)

  const res = await fetch(`/core/api/v1/checkout/complete?${params}`, { cache: 'no-store' })
  const body = await res.json().catch(() => ({}))
  const data = body.data ?? body

  if (!res.ok) {
    return {
      confirmed: false,
      order: null,
      reference,
      error: data?.error?.message ?? 'Could not load your order.',
    }
  }

  return {
    confirmed: Boolean(data.confirmed),
    order: data.order ?? null,
    reference: data.reference ?? reference,
    provider: data.provider,
  }
}

export function CheckoutCompleteClient({
  orderId,
  reference,
  initialConfirmed,
  initialOrder,
  initialError,
  provider: initialProvider,
}: Props) {
  const [confirmed, setConfirmed] = useState(initialConfirmed)
  const [order, setOrder] = useState(initialOrder)
  const [error, setError] = useState(initialError)
  const [ref, setRef] = useState(reference)
  const [provider, setProvider] = useState(initialProvider)
  const retriableError =
    error != null &&
    (error.includes('Could not reach') || error.includes('Could not load'))

  useEffect(() => {
    if (confirmed || !orderId) return
    if (error && !retriableError) return

    let attempts = 0
    const maxAttempts = 15
    let id: number | undefined

    const stop = () => {
      if (id !== undefined) window.clearInterval(id)
    }

    const tick = () => {
      attempts++
      void pollComplete(orderId, ref, provider).then((result) => {
        if (result.error && attempts >= maxAttempts) {
          setError(result.error)
          stop()
          return
        }
        if (result.order) {
          setOrder(result.order)
          setError(undefined)
        }
        if (result.reference) setRef(result.reference)
        if (result.provider === 'paystack' || result.provider === 'moolre') {
          setProvider(result.provider)
        }
        if (result.confirmed) {
          setConfirmed(true)
          stop()
        } else if (result.order?.status === 'EXPIRED' && attempts >= 3) {
          stop()
        } else if (attempts >= maxAttempts) {
          stop()
        }
      })
    }

    tick()
    id = window.setInterval(tick, 2000)

    return stop
  }, [confirmed, error, retriableError, orderId, ref, provider])

  return (
    <CheckoutCompleteView
      confirmed={confirmed}
      order={order}
      reference={ref}
      error={error}
      provider={provider}
    />
  )
}
