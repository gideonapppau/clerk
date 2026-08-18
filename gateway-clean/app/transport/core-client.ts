import axios from 'axios'
import { env } from '../config/env'
import type { CoreMessagePayload, CoreMessageResponse } from '../types/whatsapp'
import { logger } from '../utils/logger'

// Core may run Groq classify (up to ~12s) plus DB/inventory on the webhook path.
const client = axios.create({
  baseURL: env.coreUrl,
  timeout: 45_000,
  headers: {
    'X-Webhook-Secret': env.webhookSecret
  }
})

type Envelope<T> = { success: boolean; data: T }

function unwrap<T>(payload: T | Envelope<T>): T {
  const wrapped = payload as Envelope<T>
  if (wrapped && typeof wrapped === 'object' && 'success' in wrapped && wrapped.data) {
    return wrapped.data
  }
  return payload as T
}

export async function forwardMessage(payload: CoreMessagePayload): Promise<CoreMessageResponse> {
  const { data } = await client.post<CoreMessageResponse | Envelope<CoreMessageResponse>>(
    '/webhooks/whatsapp/message',
    {
      sessionId: payload.merchantId,
      from: payload.customerPhone,
      text: payload.text,
      messageKind: payload.messageKind
    }
  )
  return unwrap(data)
}

export async function recordMerchantMessage(
  merchantId: string,
  customerPhone: string,
  text: string
): Promise<void> {
  await client.post('/webhooks/whatsapp/merchant-message', {
    sessionId: merchantId,
    to: customerPhone,
    text
  })
}

export type NotifyConnectedResult = 'ok' | 'phone_in_use' | 'error'

export async function notifyConnected(
  merchantId: string,
  connected: boolean,
  phone?: string,
  release = false
): Promise<NotifyConnectedResult> {
  try {
    await client.post('/webhooks/whatsapp/status', {
      sessionId: merchantId,
      connected,
      phone: phone ?? '',
      release
    })
    return 'ok'
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 409) {
      return 'phone_in_use'
    }
    logger.warn({ err, merchantId }, 'failed to notify core of connection status')
    return 'error'
  }
}

export type CoreReachout = {
  restricted: boolean
  reason?: string
  message: string
  endsAt?: string | null
  since?: string
}

/** Persist Meta reachout / throttle state and alert the merchant dashboard. */
export async function notifyReachout(
  merchantId: string,
  reachout: {
    restricted: boolean
    reason?: string
    message?: string
    endsAt?: string | null
    since?: string
  } | null
): Promise<void> {
  try {
    await client.post('/webhooks/whatsapp/reachout', {
      sessionId: merchantId,
      restricted: reachout?.restricted === true,
      reason: reachout?.reason ?? '',
      message: reachout?.message ?? '',
      endsAt: reachout?.endsAt ?? '',
      since: reachout?.since ?? ''
    })
  } catch (err) {
    logger.warn({ err, merchantId }, 'failed to notify core of reachout restriction')
  }
}

/** Load durable reachout state from core (survives gateway restart). */
export async function fetchReachout(merchantId: string): Promise<CoreReachout | null> {
  try {
    const { data } = await client.post<CoreReachout | Envelope<CoreReachout> | { reachout: CoreReachout | null }>(
      '/webhooks/whatsapp/reachout/get',
      { sessionId: merchantId }
    )
    const unwrapped = unwrap(data) as CoreReachout | { reachout: CoreReachout | null }
    if (unwrapped && typeof unwrapped === 'object' && 'reachout' in unwrapped) {
      return unwrapped.reachout ?? null
    }
    if (unwrapped && typeof unwrapped === 'object' && 'restricted' in unwrapped) {
      return (unwrapped as CoreReachout).restricted ? (unwrapped as CoreReachout) : null
    }
    return null
  } catch (err) {
    logger.debug({ err, merchantId }, 'failed to fetch reachout from core')
    return null
  }
}

/** Gateway cold start — no sockets are live until restore completes. */
export async function notifyGatewayStartup(): Promise<void> {
  try {
    await client.post('/webhooks/whatsapp/startup', {})
    logger.info('cleared stale socket-online flags in database')
  } catch (err) {
    logger.warn({ err }, 'failed to sync socket flags on gateway startup')
  }
}

export type CheckoutResolution = {
  token: string
  rail: 'manual' | 'momo' | 'paystack' | 'moolre'
  // momo
  network?: string
  momoNumber?: string
  reference?: string
  // paystack
  checkoutUrl?: string
}

export async function resolveCheckout(
  merchantId: string,
  orderId: string,
  conversationId: string,
  customerId: string
): Promise<CheckoutResolution> {
  const { data } = await client.post<CheckoutResolution | Envelope<CheckoutResolution>>(
    '/api/v1/checkout/resolve',
    { merchantId, orderId, conversationId, customerId }
  )
  return unwrap(data)
}

export async function coreHealth(): Promise<boolean> {
  try {
    const { data } = await client.get<{ status: string }>('/health')
    return data.status === 'ok'
  } catch {
    return false
  }
}
