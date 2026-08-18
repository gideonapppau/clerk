import type { Request, Response } from 'express'
import axios from 'axios'
import { verifyToken } from '../api/auth'
import { env } from '../config/env'
import { fail } from './envelope'
import { safeErrorMessage } from '../utils/safe-error'
import { resolveCustomerProfile } from '../utils/identity'

function merchantIdFromAuth(req: Request): string | null {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return null
  return verifyToken(header.slice(7))
}

function applyCustomerProfile(merchantId: string, record: Record<string, unknown>, idField: string): void {
  const raw = record[idField]
  if (typeof raw !== 'string' || !raw) return

  const profile = resolveCustomerProfile(merchantId, raw)
  if (profile.name) record.customerName = profile.name
  record.customerContact = profile.contact
  if (profile.phone) record.customerPhoneDisplay = profile.phone
  else record.customerPhoneDisplay = profile.contact
  if (profile.chatUrl) record.customerChatUrl = profile.chatUrl
  if (profile.chatDeepLink) record.customerChatDeepLink = profile.chatDeepLink
  if (profile.isPrivacyId) record.customerPrivacyHidden = true
}

function enrichCustomerPhones(merchantId: string, body: unknown): unknown {
  if (!body || typeof body !== 'object') return body

  const enrichOrder = (o: Record<string, unknown>) => {
    applyCustomerProfile(merchantId, o, 'customerPhone')
  }

  const enrichConv = (c: Record<string, unknown>) => {
    applyCustomerProfile(merchantId, c, 'customer')
    if (typeof c.customerPhone === 'string') {
      applyCustomerProfile(merchantId, c, 'customerPhone')
    }
  }

  const wrapped = body as { success?: boolean; data?: Record<string, unknown> }
  if (wrapped.success && wrapped.data) {
    if (Array.isArray(wrapped.data.orders)) {
      wrapped.data.orders.forEach((o) => enrichOrder(o as Record<string, unknown>))
    }
    if (Array.isArray(wrapped.data.conversations)) {
      wrapped.data.conversations.forEach((c) => enrichConv(c as Record<string, unknown>))
    }
    return wrapped
  }

  const raw = body as {
    orders?: unknown[]
    conversations?: unknown[]
    conversation?: Record<string, unknown>
    order?: Record<string, unknown>
  }

  if (Array.isArray(raw.orders)) {
    raw.orders.forEach((o) => enrichOrder(o as Record<string, unknown>))
  }
  if (Array.isArray(raw.conversations)) {
    raw.conversations.forEach((c) => enrichConv(c as Record<string, unknown>))
  }
  if (raw.conversation) enrichConv(raw.conversation)
  if (raw.order) enrichOrder(raw.order)

  return raw
}

function shouldEnrichCustomerPhones(path: string): boolean {
  return path.includes('/orders') || path.includes('/conversations')
}

export async function proxyToCore(req: Request, res: Response): Promise<void> {
  const url = `${env.coreUrl}${req.originalUrl}`

  try {
    const { data, status } = await axios({
      method: req.method,
      url,
      data: req.body,
      headers: {
        authorization: req.headers.authorization ?? '',
        'content-type': req.headers['content-type'] ?? 'application/json'
      },
      timeout: 55_000,
      validateStatus: () => true
    })

    let out = data
    if (req.method === 'GET' && status === 200) {
      const merchantId = merchantIdFromAuth(req)
      const path = req.originalUrl.split('?')[0] ?? ''
      if (merchantId && shouldEnrichCustomerPhones(path)) {
        out = enrichCustomerPhones(merchantId, data)
      }
    }

    res.status(status).json(out)
  } catch (err) {
    fail(res, 502, 'GATEWAY_ERROR', safeErrorMessage(err))
  }
}
