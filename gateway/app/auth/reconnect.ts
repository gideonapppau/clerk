import { logger } from '../utils/logger'

/**
 * Exponential backoff for WhatsApp reconnects.
 * Never reconnect faster than 5s — rapid attempts from one server IP trigger lockouts.
 */
export const RECONNECT_DELAYS_MS = [5_000, 15_000, 60_000] as const
export const MIN_RECONNECT_GAP_MS = 5_000
/** Stop replaying a dead session after this many failed boots. */
export const MAX_RECONNECT_ATTEMPTS = 4

type ReconnectJob = {
  timer: ReturnType<typeof setTimeout>
}

const jobs = new Map<string, ReconnectJob>()
const attempts = new Map<string, number>()
const lastScheduledAt = new Map<string, number>()

function delayFor(attempt: number): number {
  const idx = Math.min(attempt, RECONNECT_DELAYS_MS.length - 1)
  return RECONNECT_DELAYS_MS[idx]!
}

export function isReconnectScheduled(merchantId: string): boolean {
  return jobs.has(merchantId)
}

export function getReconnectAttempt(merchantId: string): number {
  return attempts.get(merchantId) ?? 0
}

export function cancelReconnect(merchantId: string): void {
  const job = jobs.get(merchantId)
  if (job) {
    clearTimeout(job.timer)
    jobs.delete(merchantId)
  }
}

export function resetReconnectAttempts(merchantId: string): void {
  cancelReconnect(merchantId)
  attempts.delete(merchantId)
  lastScheduledAt.delete(merchantId)
}

/**
 * Queue a reconnect with exponential backoff (5s → 15s → 60s).
 * Stops after MAX_RECONNECT_ATTEMPTS so a dead session is not replayed forever.
 * Only one timer per merchant — duplicate disconnect events are coalesced.
 */
export function scheduleReconnect(
  merchantId: string,
  reason: string,
  boot: () => Promise<void>,
  onGiveUp?: () => Promise<void> | void
): void {
  if (jobs.has(merchantId)) {
    logger.debug({ merchantId, reason }, 'whatsapp reconnect already scheduled')
    return
  }

  const now = Date.now()
  const lastAt = lastScheduledAt.get(merchantId) ?? 0
  const sinceLast = now - lastAt
  const attempt = attempts.get(merchantId) ?? 0

  if (attempt >= MAX_RECONNECT_ATTEMPTS) {
    logger.warn({ merchantId, attempt, reason }, 'whatsapp reconnect give up — clearing session')
    resetReconnectAttempts(merchantId)
    void Promise.resolve(onGiveUp?.()).catch((err) => {
      logger.error({ err, merchantId }, 'whatsapp reconnect give-up handler failed')
    })
    return
  }

  let delayMs = delayFor(attempt)

  // Enforce minimum gap between any reconnect attempts for this merchant.
  if (sinceLast > 0 && sinceLast < MIN_RECONNECT_GAP_MS) {
    delayMs = Math.max(delayMs, MIN_RECONNECT_GAP_MS - sinceLast)
  }

  lastScheduledAt.set(merchantId, now)

  logger.info({ merchantId, reason, attempt, delayMs }, 'scheduling whatsapp reconnect')

  const timer = setTimeout(() => {
    jobs.delete(merchantId)
    attempts.set(merchantId, attempt + 1)
    lastScheduledAt.set(merchantId, Date.now())
    void boot().catch((err) => {
      logger.error({ err, merchantId }, 'whatsapp reconnect boot failed')
      scheduleReconnect(merchantId, 'boot_failed', boot, onGiveUp)
    })
  }, delayMs)

  jobs.set(merchantId, { timer })
}

export function cancelAllReconnects(): void {
  for (const merchantId of jobs.keys()) {
    cancelReconnect(merchantId)
  }
}
