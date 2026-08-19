import { CheckoutCompleteClient } from '@/components/checkout/CheckoutCompleteClient'
import { CheckoutShell } from '@/components/checkout/CheckoutShell'
import type { CompleteOrder } from '@/components/checkout/CheckoutCompleteView'

export const metadata = { title: 'Payment complete | Clerk' }

type CompleteResult = {
  confirmed: boolean
  order: CompleteOrder | null
  reference: string
  provider?: 'paystack' | 'moolre' | 'other'
  error?: string
}

async function loadCheckoutComplete(
  orderId: string,
  reference: string
): Promise<CompleteResult> {
  const coreBase = (
    process.env.CORE_URL?.replace(/\/$/, '') ||
    'http://127.0.0.1:8080'
  )

  const params = new URLSearchParams({ orderId })
  if (reference) params.set('reference', reference)

  try {
    const res = await fetch(`${coreBase}/api/v1/checkout/complete?${params}`, {
      cache: 'no-store',
    })
    const body = await res.json().catch(() => ({}))
    const data = body.data ?? body

    if (!res.ok) {
      return {
        confirmed: false,
        order: null,
        reference,
        error: data?.error?.message ?? 'Could not load your order.'
      }
    }

    return {
      confirmed: Boolean(data.confirmed),
      order: data.order ?? null,
      reference: data.reference ?? reference,
      provider: data.provider,
    }
  } catch {
    return {
      confirmed: false,
      order: null,
      reference,
      error: 'Could not reach the server. Your payment may still have gone through. Check WhatsApp.'
    }
  }
}

export default async function CheckoutCompletePage({
  searchParams
}: {
  searchParams: Promise<{ orderId?: string; trxref?: string; reference?: string }>
}) {
  const { orderId, trxref, reference: refParam } = await searchParams
  const reference = trxref ?? refParam ?? orderId ?? ''

  const result = orderId
    ? await loadCheckoutComplete(orderId, reference)
    : { confirmed: false, order: null, reference, error: 'Missing order reference.' }

  const { order, confirmed, error, reference: ref, provider } = result

  return (
    <CheckoutShell>
      <CheckoutCompleteClient
        orderId={orderId ?? ''}
        reference={ref}
        initialConfirmed={confirmed}
        initialOrder={order}
        initialError={error}
        provider={provider}
      />
    </CheckoutShell>
  )
}
