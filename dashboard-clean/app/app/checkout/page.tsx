import { Suspense } from 'react'
import { CheckoutFallback, CheckoutLoading } from '@/components/checkout/CheckoutFallback'
import { CheckoutShell } from '@/components/checkout/CheckoutShell'
import { CheckoutView } from '@/components/checkout/CheckoutView'

export const metadata = { title: 'Complete your order | Clerk' }

export default function CheckoutPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>
}) {
  return (
    <Suspense fallback={<CheckoutShell><CheckoutLoading /></CheckoutShell>}>
      <CheckoutPageInner searchParams={searchParams} />
    </Suspense>
  )
}

async function CheckoutPageInner({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) {
    return (
      <CheckoutShell>
        <CheckoutFallback
          title="Link unavailable"
          message="No checkout token found. This link may be invalid."
        />
      </CheckoutShell>
    )
  }

  const coreBase =
    process.env.CORE_URL ??
    (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8080')

  let order: CheckoutOrder | null = null
  let errorMessage: string | null = null

  try {
    const res = await fetch(
      `${coreBase}/api/v1/checkout/verify?token=${encodeURIComponent(token)}`,
      { cache: 'no-store' }
    )
    if (res.status === 401) {
      errorMessage = 'This link has expired or is invalid. Please request a new one.'
    } else if (res.status === 404) {
      errorMessage = 'Order not found.'
    } else if (!res.ok) {
      errorMessage = 'Something went wrong. Please try again.'
    } else {
      const json = await res.json()
      const data = json.data ?? json
      order = {
        id: data.order.id,
        product: data.order.product,
        quantity: data.order.quantity,
        subtotal: data.order.subtotal,
        status: data.order.status,
        merchantId: data.merchantId,
      }
    }
  } catch {
    errorMessage = 'Could not reach the server. Please check your connection.'
  }

  return (
    <CheckoutShell>
      {errorMessage ? (
        <CheckoutFallback title="Link unavailable" message={errorMessage} />
      ) : order ? (
        <CheckoutView order={order} token={token} />
      ) : null}
    </CheckoutShell>
  )
}

export type CheckoutOrder = {
  id: string
  product: string
  quantity: number
  subtotal: number
  status: string
  merchantId: string
}
