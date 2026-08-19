import type { ReachoutSnapshot } from '../types/whatsapp'

export type ReachoutReason = 'ack_463' | 'reachout_timelock' | 'companion_restricted'

export type ReachoutSignal = {
  reason: ReachoutReason
  endsAt?: number
  detail?: string
}

type ReachoutState = {
  reason: ReachoutReason
  since: number
  endsAt?: number
  lastSignalAt: number
  ack463Count: number
}

const states = new Map<string, ReachoutState>()

/** Default pause after 463 when Meta does not publish an expiry. */
const DEFAULT_PAUSE_MS = 6 * 60 * 60 * 1000

const MESSAGES: Record<ReachoutReason, string> = {
  ack_463:
    'WhatsApp is temporarily blocking automated replies from this number. Customers may not see Clerk messages. Reply from your phone or wait for the restriction to lift.',
  reachout_timelock:
    'WhatsApp has limited outreach from this number for a while. Clerk will pause automated replies until the timelock clears.',
  companion_restricted:
    'WhatsApp restricted linked devices on this number. Reconnect from the dashboard and avoid heavy test traffic until it clears.'
}

export function merchantReachoutMessage(reason: ReachoutReason): string {
  return MESSAGES[reason]
}

export function markReachoutRestricted(merchantId: string, signal: ReachoutSignal): ReachoutSnapshot {
  const now = Date.now()
  const prev = states.get(merchantId)
  const endsAt =
    signal.endsAt && signal.endsAt > now
      ? signal.endsAt
      : now + DEFAULT_PAUSE_MS

  const next: ReachoutState = {
    reason: signal.reason,
    since: prev?.since ?? now,
    endsAt,
    lastSignalAt: now,
    ack463Count: signal.reason === 'ack_463' ? (prev?.ack463Count ?? 0) + 1 : prev?.ack463Count ?? 0
  }
  states.set(merchantId, next)
  return toSnapshot(merchantId, next)
}

export function clearReachoutRestriction(merchantId: string): void {
  states.delete(merchantId)
}

export function getReachoutRestriction(merchantId: string): ReachoutSnapshot | null {
  const state = states.get(merchantId)
  if (!state) return null
  if (state.endsAt && Date.now() >= state.endsAt) {
    states.delete(merchantId)
    return null
  }
  return toSnapshot(merchantId, state)
}

export function isReachoutRestricted(merchantId: string): boolean {
  return getReachoutRestriction(merchantId)?.restricted === true
}

export function canSendOutbound(merchantId: string): { ok: true } | { ok: false; message: string } {
  const snap = getReachoutRestriction(merchantId)
  if (!snap?.restricted) return { ok: true }
  return { ok: false, message: snap.message }
}

function toSnapshot(merchantId: string, state: ReachoutState): ReachoutSnapshot {
  const endsAt = state.endsAt ? new Date(state.endsAt).toISOString() : null
  return {
    restricted: true,
    reason: state.reason,
    message: MESSAGES[state.reason],
    endsAt,
    since: new Date(state.since).toISOString()
  }
}

/** Parse Meta reachout timelock payloads from Baileys notification logs. */
export function parseReachoutTimelockPayload(raw: unknown): ReachoutSignal | null {
  const text = extractNotificationText(raw)
  if (!text) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return null
  }

  const data = (parsed as { data?: Record<string, unknown> })?.data
  if (!data || typeof data !== 'object') return null

  for (const value of Object.values(data)) {
    if (!value || typeof value !== 'object') continue
    const block = value as Record<string, unknown>
    const enforcement = String(block.enforcement_type ?? '')
    const active = block.is_active === true
    if (!active) continue
    if (!enforcement.includes('RESTRICT') && !enforcement.includes('COMPANION')) continue

    let endsAt: number | undefined
    const rawEnd = block.time_enforcement_ends
    if (typeof rawEnd === 'string' || typeof rawEnd === 'number') {
      const n = Number(rawEnd)
      if (Number.isFinite(n) && n > 0) {
        endsAt = n < 1_000_000_000_000 ? n * 1000 : n
      }
    }

    return {
      reason: enforcement.includes('COMPANION') ? 'companion_restricted' : 'reachout_timelock',
      endsAt,
      detail: enforcement
    }
  }

  return null
}

function extractNotificationText(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') return null
  const node = (raw as { node?: unknown }).node
  if (!node || typeof node !== 'object') return null
  const content = (node as { content?: unknown[] }).content
  if (!Array.isArray(content)) return null

  for (const item of content) {
    if (!item || typeof item !== 'object') continue
    const inner = (item as { content?: { type?: string; data?: number[] } }).content
    if (inner?.type === 'Buffer' && Array.isArray(inner.data)) {
      try {
        return Buffer.from(inner.data).toString('utf8')
      } catch {
        continue
      }
    }
  }
  return null
}
