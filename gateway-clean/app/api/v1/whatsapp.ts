import type { Request, Response } from 'express'
import QRCode from 'qrcode'
import { connectionStatus, disconnectMerchant } from '../../auth/disconnect'
import { ensureSessionLive, getSnapshot, getSocket, isSessionLive, startConnection } from '../../auth/connect'
import { markReachoutRestricted } from '../../auth/reachout-restriction'
import { sendText } from '../../transport/sender'
import { fetchReachout, recordMerchantMessage } from '../../transport/core-client'
import type { ReachoutReason } from '../../auth/reachout-restriction'
import type { ReachoutSnapshot } from '../../types/whatsapp'
import { resolveCustomerJid, canDeliverWhatsAppTo } from '../../utils/identity'
import { ReachoutRestrictedError } from '../../utils/reachout-error'
import { fail, ok } from '../envelope'
import { verifyToken } from '../auth'
import { safeErrorMessage } from '../../utils/safe-error'
import { env } from '../../config/env'
import { toPairingPhoneDigits } from '../../utils/normalize'

function merchantId(req: Request): string | null {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return null
  return verifyToken(header.slice(7))
}

function snapshotPayload(snapshot: ReturnType<typeof getSnapshot>, qrDataUrl?: string) {
  const live = snapshot.status === 'connected' && isSessionLive(snapshot.merchantId)
  return {
    sessionId: snapshot.merchantId,
    status: live ? 'connected' : snapshot.status === 'connected' ? 'connecting' : snapshot.status,
    connected: live,
    phone: snapshot.phone ?? null,
    qr: qrDataUrl ?? null,
    pairingCode: snapshot.pairingCode ?? null,
    conflict: snapshot.conflict ?? null,
    reachout: snapshot.reachout ?? null
  }
}

async function respondSnapshot(res: Response, snapshot: ReturnType<typeof getSnapshot>): Promise<void> {
  if (snapshot.qr) {
    const qr = await QRCode.toDataURL(snapshot.qr)
    ok(res, snapshotPayload(snapshot, qr))
    return
  }
  ok(res, snapshotPayload(snapshot))
}

export async function createSession(req: Request, res: Response): Promise<void> {
  const id = merchantId(req)
  if (!id) {
    fail(res, 401, 'UNAUTHORIZED', 'Authorization Bearer token required')
    return
  }

  const rawPhone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : ''
  let phone: string | undefined
  if (rawPhone) {
    const digits = toPairingPhoneDigits(rawPhone)
    // Country code + national number (e.g. Ghana 233XXXXXXXXX = 12 digits).
    if (digits.length < 10 || digits.length > 15) {
      fail(
        res,
        400,
        'INVALID_INPUT',
        'Enter your WhatsApp number with country code (e.g. 0202966466 or 233202966466)'
      )
      return
    }
    phone = digits
  }

  try {
    const snapshot = await startConnection(id, { phone, waitMs: 20_000 })
    await respondSnapshot(res, snapshot)
  } catch (err) {
    fail(res, 500, 'INTERNAL_ERROR', safeErrorMessage(err))
  }
}

export async function sessionStatus(req: Request, res: Response): Promise<void> {
  const id = merchantId(req)
  if (!id) {
    fail(res, 401, 'UNAUTHORIZED', 'Authorization Bearer token required')
    return
  }

  ensureSessionLive(id)
  let snap = connectionStatus(id)
  // Hydrate from core DB when gateway memory lost the restriction (restart / multi-instance).
  if (!snap.reachout?.restricted) {
    const fromCore = await fetchReachout(id)
    if (fromCore?.restricted) {
      const reason = (fromCore.reason || 'ack_463') as ReachoutReason
      const endsAt = fromCore.endsAt ? Date.parse(fromCore.endsAt) : undefined
      markReachoutRestricted(id, {
        reason,
        endsAt: Number.isFinite(endsAt) ? endsAt : undefined
      })
      snap = connectionStatus(id)
      if (!snap.reachout?.message && fromCore.message) {
        snap = {
          ...snap,
          reachout: {
            ...(snap.reachout as ReachoutSnapshot),
            restricted: true,
            reason,
            message: fromCore.message,
            endsAt: fromCore.endsAt ?? snap.reachout?.endsAt ?? null,
            since: fromCore.since ?? snap.reachout?.since
          }
        }
      }
    }
  }
  await respondSnapshot(res, snap)
}

export async function refreshSession(req: Request, res: Response): Promise<void> {
  const id = merchantId(req)
  if (!id) {
    fail(res, 401, 'UNAUTHORIZED', 'Authorization Bearer token required')
    return
  }

  const snapshot = getSnapshot(id)
  ensureSessionLive(id)
  if (snapshot.status === 'idle' || snapshot.status === 'disconnected') {
    fail(res, 409, 'NO_SESSION', 'No active session — POST /whatsapp/session first')
    return
  }

  await respondSnapshot(res, snapshot)
}

export async function deleteSession(req: Request, res: Response): Promise<void> {
  const id = merchantId(req)
  if (!id) {
    fail(res, 401, 'UNAUTHORIZED', 'Authorization Bearer token required')
    return
  }

  await disconnectMerchant(id)
  ok(res, {})
}

export async function sendCustomerMessage(req: Request, res: Response): Promise<void> {
  const id = merchantId(req)
  if (!id) {
    fail(res, 401, 'UNAUTHORIZED', 'Authorization Bearer token required')
    return
  }

  const rawCustomerId = typeof req.body?.customerPhone === 'string' ? req.body.customerPhone : ''
  const text = typeof req.body?.text === 'string' ? req.body.text : ''
  const recordInCore = req.body?.recordInCore !== false
  if (!rawCustomerId || !text.trim()) {
    fail(res, 400, 'INVALID_INPUT', 'customerPhone and text required')
    return
  }
  if (rawCustomerId === 'unknown') {
    fail(res, 400, 'INVALID_INPUT', 'Cannot message an unknown customer')
    return
  }

  if (!canDeliverWhatsAppTo(id, rawCustomerId)) {
    fail(res, 400, 'INVALID_INPUT', 'This customer cannot be messaged on WhatsApp from the dashboard')
    return
  }

  const sock = getSocket(id)
  if (!sock) {
    fail(res, 409, 'NO_SESSION', 'WhatsApp not connected')
    return
  }

  const resolvedJid = resolveCustomerJid(id, rawCustomerId)
  if (!resolvedJid) {
    fail(res, 409, 'IDENTITY_NOT_FOUND', 'Customer could not be resolved — try messaging them on WhatsApp first')
    return
  }
  try {
    await sendText(sock, resolvedJid, text.trim(), { merchantId: id })
    if (recordInCore) {
      await recordMerchantMessage(id, rawCustomerId, text.trim())
    }
    ok(res, { sent: true })
  } catch (err) {
    if (err instanceof ReachoutRestrictedError) {
      fail(res, 423, 'WHATSAPP_REACHOUT_RESTRICTED', err.message)
      return
    }
    fail(res, 500, 'INTERNAL_ERROR', safeErrorMessage(err))
  }
}

// sendPaymentConfirmation sends a payment confirmation to a customer.
// Called by the Go core when Paystack webhook confirms payment.
// Protected by X-Webhook-Secret header.
export async function sendPaymentConfirmation(req: Request, res: Response): Promise<void> {
  const webhookSecret = req.headers['x-webhook-secret']
  if (webhookSecret !== env.webhookSecret) {
    fail(res, 401, 'UNAUTHORIZED', 'Invalid webhook secret')
    return
  }

  const merchantId = typeof req.body?.merchantId === 'string' ? req.body.merchantId : ''
  const customerId = typeof req.body?.customerId === 'string' ? req.body.customerId : ''
  const customMessage = typeof req.body?.message === 'string' ? req.body.message.trim() : ''

  if (!merchantId || !customerId) {
    fail(res, 400, 'INVALID_INPUT', 'merchantId and customerId required')
    return
  }

  const sock = getSocket(merchantId)
  if (!sock) {
    fail(res, 409, 'NO_SESSION', 'WhatsApp not connected')
    return
  }

  const resolvedJid = resolveCustomerJid(merchantId, customerId)
  if (!resolvedJid) {
    fail(res, 409, 'IDENTITY_NOT_FOUND', 'Customer JID could not be resolved')
    return
  }

  const message = customMessage || 'Payment received ✅. Your order is confirmed.'

  try {
    await sendText(sock, resolvedJid, message, { merchantId })
    ok(res, { sent: true })
  } catch (err) {
    if (err instanceof ReachoutRestrictedError) {
      fail(res, 423, 'WHATSAPP_REACHOUT_RESTRICTED', err.message)
      return
    }
    fail(res, 500, 'INTERNAL_ERROR', safeErrorMessage(err))
  }
}
