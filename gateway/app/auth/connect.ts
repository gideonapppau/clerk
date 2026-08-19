import { makeCacheableSignalKeyStore } from '@whiskeysockets/baileys'
import type { WASocket } from '@whiskeysockets/baileys'
import { useSingleFileAuthState } from './single-file-auth-state'

import { registerConnectionHandler } from '../handlers/connection'
import { registerMessagesHandler } from '../handlers/messages'
import { registerPresenceHandler } from '../handlers/presence'
import { registerOutboundHandler } from '../handlers/outbound'
import { registerReachoutHandler } from '../handlers/reachout'
import { createWhatsAppSocket } from '../baileys/create-socket'
import { createBaileysLogger } from '../baileys/logger'
import { waitForSnapshot } from '../baileys/wait-snapshot'
import { notifyConnected, notifyReachout } from '../transport/core-client'
import type { SessionSnapshot } from '../types/whatsapp'
import { logger } from '../utils/logger'
import {
  clearSession,
  ensureSessionDir,
  hasRegisteredSession,
  listRegisteredMerchants,
  readSessionMeta,
  sessionPath
} from './session-store'
import {
  flushSession,
  registerSessionSaver,
  unregisterSessionSaver,
  wrapSaveCreds
} from './auth-persistence'
import {
  cancelReconnect,
  isReconnectScheduled,
  resetReconnectAttempts,
  scheduleReconnect
} from './reconnect'
import {
  findPhoneConflict,
  normalizeWhatsAppPhone,
  registerPhoneOwner,
  releasePhoneOwner,
  tryReservePhone
} from './phone-registry'
import { toPairingPhoneDigits } from '../utils/normalize'
import { isMerchantUUID } from '../utils/uuid'
import { clearReachoutRestriction, getReachoutRestriction } from './reachout-restriction'
import { applyReachoutRestriction } from '../handlers/reachout'

const sockets = new Map<string, WASocket>()
const snapshots = new Map<string, SessionSnapshot>()
const liveSockets = new Set<string>()
const booting = new Set<string>()
const recovering = new Set<string>()
const appStateIssues = new Map<string, number>()
/** Phone digits awaiting pairing-code entry (survives Baileys restart_required). */
const pendingPairingPhone = new Map<string, string>()
/** Merchant is disconnecting via dashboard/API — onLoggedOut must not double-teardown. */
const disconnecting = new Set<string>()

/** Background retries when core phone-claim fails but WA is already live. */
const coreClaimRetries = new Map<string, ReturnType<typeof setTimeout>>()
const coreClaimAttempts = new Map<string, number>()
const CORE_CLAIM_MAX_ATTEMPTS = 12
const CORE_CLAIM_BASE_MS = 10_000

function cancelCoreClaimRetry(merchantId: string): void {
  const timer = coreClaimRetries.get(merchantId)
  if (timer) clearTimeout(timer)
  coreClaimRetries.delete(merchantId)
  coreClaimAttempts.delete(merchantId)
}

function scheduleCoreClaimRetry(merchantId: string, phone: string): void {
  if (coreClaimRetries.has(merchantId)) return
  const attempt = coreClaimAttempts.get(merchantId) ?? 0
  if (attempt >= CORE_CLAIM_MAX_ATTEMPTS) {
    logger.error(
      { merchantId, phone, attempt },
      'core phone claim retries exhausted — fix core (apply migrations) and reconnect'
    )
    return
  }
  const delayMs = Math.min(CORE_CLAIM_BASE_MS * 2 ** attempt, 120_000)
  coreClaimAttempts.set(merchantId, attempt + 1)
  const timer = setTimeout(() => {
    coreClaimRetries.delete(merchantId)
    void (async () => {
      if (!isSessionLive(merchantId)) return
      const result = await notifyConnected(merchantId, true, phone)
      if (result === 'ok') {
        logger.info({ merchantId, phone }, 'core phone claim succeeded on retry')
        cancelCoreClaimRetry(merchantId)
        clearReachoutRestriction(merchantId)
        void notifyReachout(merchantId, { restricted: false })
        setSnapshot(merchantId, {
          status: 'connected',
          phone,
          qr: undefined,
          pairingCode: undefined,
          conflict: undefined,
          reachout: null
        })
        return
      }
      if (result === 'phone_in_use') {
        logger.warn({ merchantId, phone }, 'core phone claim retry: number in use')
        cancelCoreClaimRetry(merchantId)
        await rejectPhoneConflict(merchantId)
        return
      }
      logger.warn({ merchantId, phone, attempt: attempt + 1, result }, 'core phone claim retry failed')
      scheduleCoreClaimRetry(merchantId, phone)
    })()
  }, delayMs)
  coreClaimRetries.set(merchantId, timer)
}

function isSocketOpen(sock: WASocket): boolean {
  const ws = (sock as { ws?: { isOpen?: boolean } }).ws
  return ws?.isOpen === true
}

/** WhatsApp phone UI expects XXXX-XXXX; Baileys may return 8 chars without a dash. */
function formatPairingCode(code: string): string {
  const compact = code.replace(/\s+/g, '').toUpperCase()
  if (/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(compact)) return compact
  const alnum = compact.replace(/[^A-Z0-9]/g, '')
  if (alnum.length === 8) return `${alnum.slice(0, 4)}-${alnum.slice(4)}`
  return compact
}

/**
 * Baileys docs: request pairing code only after connection=="connecting" or a QR event.
 * Do not call it immediately after makeWASocket.
 */
function waitForPairingWindow(sock: WASocket, timeoutMs = 20_000): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false

    const finish = () => {
      if (settled) return
      settled = true
      cleanup()
      resolve()
    }

    const fail = (err: Error) => {
      if (settled) return
      settled = true
      cleanup()
      reject(err)
    }

    const timer = setTimeout(() => {
      // Socket may already be open without another event — allow pairing attempt.
      if (isSocketOpen(sock)) finish()
      else fail(new Error('timed out waiting for pairing window'))
    }, timeoutMs)

    const onUpdate = (update: { connection?: string; qr?: string }) => {
      if (update.connection === 'connecting' || update.qr) {
        finish()
        return
      }
      if (update.connection === 'close') {
        fail(new Error('connection closed before pairing'))
      }
    }

    const cleanup = () => {
      clearTimeout(timer)
      sock.ev.off('connection.update', onUpdate)
    }

    sock.ev.on('connection.update', onUpdate)
    if (isSocketOpen(sock)) finish()
  })
}

const APP_STATE_WIPE_THRESHOLD = 5
const APP_STATE_ISSUE_WINDOW_MS = 60 * 60_000
const lastAppStateIssueAt = new Map<string, number>()
const WATCHDOG_INTERVAL_MS = 45_000

let transientRecoveryScheduled = false
let watchdogStarted = false

export type StartOptions = {
  phone?: string
  waitMs?: number
}

export function getSocket(merchantId: string): WASocket | undefined {
  return sockets.get(merchantId)
}

/** Merchant IDs with an in-memory socket (any state). */
export function listSocketMerchantIds(): string[] {
  return [...sockets.keys()]
}

/** True when Baileys socket is open (uses ws.isOpen; falls back during brief connect window). */
export function isSessionLive(merchantId: string): boolean {
  const sock = sockets.get(merchantId)
  if (!sock || getSnapshot(merchantId).status !== 'connected') return false
  const ws = (sock as { ws?: { isOpen?: boolean } }).ws
  if (ws && typeof ws.isOpen === 'boolean') return ws.isOpen
  return liveSockets.has(merchantId)
}

function markSessionLive(merchantId: string, live: boolean): void {
  if (live) liveSockets.add(merchantId)
  else liveSockets.delete(merchantId)
}

/**
 * Reconnect registered merchants whose socket died without firing connection.close
 * (common after laptop sleep or long idle periods).
 */
export function ensureSessionLive(merchantId: string): void {
  if (!hasRegisteredSession(merchantId)) return
  if (booting.has(merchantId) || recovering.has(merchantId) || isReconnectScheduled(merchantId)) {
    return
  }

  const snap = getSnapshot(merchantId)
  if (snap.status === 'qr' || snap.pairingCode || snap.status === 'connecting') return
  if (isSessionLive(merchantId)) return

  logger.warn({ merchantId, status: snap.status, live: isSessionLive(merchantId) }, 'stale whatsapp socket — healing')
  hydrateSnapshotFromDisk(merchantId)
  setSnapshot(merchantId, {
    status: 'connecting',
    qr: undefined,
    pairingCode: undefined,
    phone: snap.phone
  })
  queueReconnect(merchantId, 'health_check')
}

export function getSnapshot(merchantId: string): SessionSnapshot {
  return snapshots.get(merchantId) ?? { merchantId, status: 'idle' }
}

function setSnapshot(merchantId: string, patch: Partial<SessionSnapshot>): SessionSnapshot {
  const prev = getSnapshot(merchantId)
  const next = { ...prev, ...patch, merchantId }
  if (!('reachout' in patch)) {
    next.reachout = getReachoutRestriction(merchantId)
  }
  snapshots.set(merchantId, next)
  return next
}

type TeardownOptions = {
  releasePhone?: boolean
  /** Skip creds flush — use before clearSession (logout / dead session). */
  skipPersist?: boolean
}

async function destroySocket(merchantId: string, opts: TeardownOptions = {}): Promise<void> {
  const sock = sockets.get(merchantId)
  if (!sock) return

  markSessionLive(merchantId, false)
  if (!opts.skipPersist) {
    await flushSession(merchantId)
  }
  unregisterSessionSaver(merchantId)

  if (opts.releasePhone !== false) {
    releasePhoneOwner(merchantId, getSnapshot(merchantId).phone)
  }

  try {
    sock.end(undefined)
  } catch {
    // socket may already be closed
  }

  sockets.delete(merchantId)
}

function hydrateSnapshotFromDisk(merchantId: string): void {
  const meta = readSessionMeta(merchantId)
  if (!meta?.registered) return

  const snap = getSnapshot(merchantId)
  if (snap.phone || snap.status === 'connected') return

  setSnapshot(merchantId, {
    status: snap.status === 'idle' ? 'connecting' : snap.status,
    phone: meta.phone ?? snap.phone
  })

  if (meta.phone) {
    tryReservePhone(merchantId, meta.phone)
  }
}

function markSocketOffline(merchantId: string): void {
  void notifyConnected(merchantId, false).then((result) => {
    if (result !== 'ok') {
      logger.warn({ merchantId, result }, 'failed to mark socket offline in database')
    }
  })
}

async function abandonDeadSession(merchantId: string, reason: string): Promise<void> {
  logger.warn({ merchantId, reason }, 'abandoning dead whatsapp session')
  resetReconnectAttempts(merchantId)
  pendingPairingPhone.delete(merchantId)
  const phone = getSnapshot(merchantId).phone
  await destroySocket(merchantId, { skipPersist: true })
  releasePhoneOwner(merchantId, phone)
  clearSession(merchantId)
  setSnapshot(merchantId, {
    status: 'idle',
    qr: undefined,
    pairingCode: undefined,
    phone: undefined
  })
  await notifyConnected(merchantId, false, undefined, true)
}

function queueReconnect(merchantId: string, reason: string): void {
  const snap = getSnapshot(merchantId)
  const wasOnline = snap.status === 'connected' || isSessionLive(merchantId)
  const pairingPhone = pendingPairingPhone.get(merchantId)
  const keepPairing = Boolean(pairingPhone && snap.pairingCode)

  setSnapshot(merchantId, {
    status: 'connecting',
    qr: undefined,
    pairingCode: keepPairing ? snap.pairingCode : undefined,
    phone: keepPairing ? snap.phone : snap.phone
  })

  // Keep merchants.connected in Postgres aligned with real socket state.
  if (wasOnline || hasRegisteredSession(merchantId)) {
    markSocketOffline(merchantId)
  }

  scheduleReconnect(
    merchantId,
    reason,
    async () => {
      await destroySocket(merchantId, { releasePhone: false })
      // Re-request pairing code after Baileys restart_required during link-with-phone.
      await bootConnection(merchantId, pairingPhone)
    },
    () => abandonDeadSession(merchantId, `give_up_${reason}`)
  )
}

async function rejectPhoneConflict(merchantId: string): Promise<void> {
  logger.warn({ merchantId }, 'whatsapp number already linked to another clerk account')
  cancelReconnect(merchantId)
  await stopConnection(merchantId, true)
  clearSession(merchantId)
  setSnapshot(merchantId, {
    status: 'disconnected',
    qr: undefined,
    pairingCode: undefined,
    phone: undefined,
    conflict: 'PHONE_IN_USE'
  })
  await notifyConnected(merchantId, false, undefined, true)
}

async function acceptPhoneConnection(merchantId: string, connectedPhone?: string): Promise<boolean> {
  resetReconnectAttempts(merchantId)
  appStateIssues.delete(merchantId)
  lastAppStateIssueAt.delete(merchantId)

  if (!connectedPhone) {
    const result = await notifyConnected(merchantId, true)
    if (result !== 'ok') {
      logger.error({ merchantId, result }, 'failed to confirm whatsapp connection with core')
      return false
    }
    setSnapshot(merchantId, {
      status: 'connected',
      phone: connectedPhone,
      qr: undefined,
      pairingCode: undefined,
      conflict: undefined,
      reachout: null
    })
    markSessionLive(merchantId, true)
    return true
  }

  const conflictMerchant = findPhoneConflict(merchantId, connectedPhone)
  if (conflictMerchant) {
    await rejectPhoneConflict(merchantId)
    return false
  }

  if (!tryReservePhone(merchantId, connectedPhone)) {
    await rejectPhoneConflict(merchantId)
    return false
  }

  const result = await notifyConnected(merchantId, true, connectedPhone)
  if (result === 'phone_in_use') {
    releasePhoneOwner(merchantId, connectedPhone)
    await rejectPhoneConflict(merchantId)
    return false
  }

  if (result !== 'ok') {
    // WhatsApp is already live. Tearing down and reconnecting only spam-loops
    // when core is misconfigured (e.g. missing migration). Keep the session and
    // retry the DB claim in the background.
    logger.error(
      { merchantId, phone: connectedPhone, result },
      'failed to claim whatsapp phone with core — keeping live session and retrying claim'
    )
    registerPhoneOwner(connectedPhone, merchantId)
    markSessionLive(merchantId, true)
    setSnapshot(merchantId, {
      status: 'connected',
      phone: connectedPhone,
      qr: undefined,
      pairingCode: undefined,
      conflict: undefined
    })
    scheduleCoreClaimRetry(merchantId, connectedPhone)
    return true
  }

  registerPhoneOwner(connectedPhone, merchantId)
  markSessionLive(merchantId, true)
  clearReachoutRestriction(merchantId)
  void notifyReachout(merchantId, { restricted: false })
  cancelCoreClaimRetry(merchantId)
  setSnapshot(merchantId, {
    status: 'connected',
    phone: connectedPhone,
    qr: undefined,
    pairingCode: undefined,
    conflict: undefined,
    reachout: null
  })
  return true
}

export async function stopConnection(merchantId: string, logout = true): Promise<void> {
  cancelReconnect(merchantId)
  cancelCoreClaimRetry(merchantId)
  disconnecting.add(merchantId)
  try {
    const sock = sockets.get(merchantId)
    if (sock) {
      try {
        if (logout) {
          await sock.logout()
        } else {
          sock.end(undefined)
        }
      } catch {
        // ignore
      }
    }
    await destroySocket(merchantId, { skipPersist: true })
  } finally {
    disconnecting.delete(merchantId)
  }
}

async function recoverConnectingMerchants(): Promise<void> {
  const targets = new Set<string>()

  for (const merchantId of sockets.keys()) {
    const snap = getSnapshot(merchantId)
    if (snap.status === 'connecting' || snap.status === 'qr' || snap.pairingCode) {
      targets.add(merchantId)
    }
  }

  for (const [merchantId, snap] of snapshots.entries()) {
    if (snap.status === 'connecting' || snap.status === 'qr' || snap.pairingCode) {
      targets.add(merchantId)
    }
  }

  for (const merchantId of targets) {
    if (booting.has(merchantId) || recovering.has(merchantId) || isReconnectScheduled(merchantId)) {
      continue
    }
    logger.info({ merchantId }, 'reconnecting after baileys transient error')
    queueReconnect(merchantId, 'transient_error')
  }
}

/** Called from process guards when Baileys throws an unhandled timeout during pairing. */
export function handleBaileysTransientError(_err: unknown): void {
  if (transientRecoveryScheduled) return
  transientRecoveryScheduled = true
  setTimeout(() => {
    transientRecoveryScheduled = false
    void recoverConnectingMerchants()
  }, 5_000)
}

async function handleAppStateIssue(merchantId: string): Promise<void> {
  const now = Date.now()
  const last = lastAppStateIssueAt.get(merchantId) ?? 0
  if (now - last > APP_STATE_ISSUE_WINDOW_MS) {
    appStateIssues.set(merchantId, 0)
  }
  lastAppStateIssueAt.set(merchantId, now)

  const count = (appStateIssues.get(merchantId) ?? 0) + 1
  appStateIssues.set(merchantId, count)

  if (count >= APP_STATE_WIPE_THRESHOLD) {
    await recoverCorruptedSession(merchantId)
    return
  }

  logger.warn({ merchantId, count }, 'whatsapp app state sync issue — reconnecting with saved session')
  queueReconnect(merchantId, 'app_state')
}

async function recoverCorruptedSession(merchantId: string): Promise<void> {
  if (recovering.has(merchantId) || booting.has(merchantId)) return

  recovering.add(merchantId)
  try {
    logger.error({ merchantId }, 'whatsapp session unrecoverable — clearing for fresh pairing')
    cancelReconnect(merchantId)
    const phone = getSnapshot(merchantId).phone
    await destroySocket(merchantId, { skipPersist: true })
    releasePhoneOwner(merchantId, phone)
    clearSession(merchantId)
    appStateIssues.delete(merchantId)
    setSnapshot(merchantId, {
      status: 'connecting',
      qr: undefined,
      pairingCode: undefined,
      phone: undefined,
      conflict: undefined
    })
    await notifyConnected(merchantId, false, undefined, true)
    queueReconnect(merchantId, 'session_wipe')
  } finally {
    recovering.delete(merchantId)
  }
}

async function bootConnection(merchantId: string, phone?: string): Promise<void> {
  if (booting.has(merchantId)) return
  booting.add(merchantId)

  try {
    hydrateSnapshotFromDisk(merchantId)
    await destroySocket(merchantId, { releasePhone: false })

    const sessionDir = sessionPath(merchantId)
    const { state, saveCreds: saveCredsRaw } = await useSingleFileAuthState(sessionDir)
    const saveCreds = wrapSaveCreds(merchantId, saveCredsRaw)
    registerSessionSaver(merchantId, saveCreds)

    const baileysLogger = createBaileysLogger({
      onAppStateCorruption: () => {
        void handleAppStateIssue(merchantId)
      },
      onReachoutSignal: (signal) => {
        applyReachoutRestriction(merchantId, signal, setSnapshot)
      }
    })

    const wantsPairing = Boolean(phone && !state.creds.registered)
    const sock = await createWhatsAppSocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, baileysLogger)
      },
      saveCreds,
      logger: baileysLogger,
      pairing: wantsPairing,
      onAppStateCorruption: () => {
        void handleAppStateIssue(merchantId)
      },
      onReachoutSignal: (signal) => {
        applyReachoutRestriction(merchantId, signal, setSnapshot)
      }
    })
    sockets.set(merchantId, sock)

    sock.ev.on('creds.update', saveCreds)

    registerConnectionHandler(sock, merchantId, {
      isRegistered: sock.authState.creds.registered === true,

      onQR: (qr) => {
        // Prefer pairing code when active — Baileys may still emit QR events.
        if (getSnapshot(merchantId).pairingCode) return
        setSnapshot(merchantId, { status: 'qr', qr, pairingCode: undefined })
      },

      onConnected: async (connectedPhone) => {
        pendingPairingPhone.delete(merchantId)
        logger.info({ merchantId, phone: connectedPhone }, 'whatsapp connected — claiming phone')
        await acceptPhoneConnection(merchantId, connectedPhone)
      },

      onRestartRequired: async () => {
        logger.info({ merchantId }, 'whatsapp pairing step — reconnecting')
        queueReconnect(merchantId, 'restart_required')
      },

      onQrExpired: async () => {
        // Pairing code is still valid — do not reboot or the code will change.
        if (pendingPairingPhone.has(merchantId) && getSnapshot(merchantId).pairingCode) {
          logger.info({ merchantId }, 'ignoring qr expiry while pairing code is active')
          return
        }
        logger.info({ merchantId }, 'whatsapp qr expired — generating fresh qr')
        queueReconnect(merchantId, 'qr_expired')
      },

      onReconnectNeeded: (statusCode) => {
        markSessionLive(merchantId, false)
        // During pairing, only restart_required should reboot (handled above).
        // Other drops while waiting for the user to type the code must not mint a new code.
        if (pendingPairingPhone.has(merchantId) && getSnapshot(merchantId).pairingCode) {
          logger.info({ merchantId, statusCode }, 'socket dropped during pairing — will reconnect with same code')
        } else {
          logger.info({ merchantId, statusCode }, 'whatsapp reconnecting with saved session')
        }
        queueReconnect(merchantId, `disconnect_${statusCode ?? 'unknown'}`)
      },

      onLoggedOut: async (reason) => {
        if (disconnecting.has(merchantId)) {
          logger.debug({ merchantId, reason }, 'logout teardown already handled by stopConnection')
          return
        }
        markSessionLive(merchantId, false)
        logger.warn({ merchantId, reason }, 'whatsapp logged out — session cleared')
        resetReconnectAttempts(merchantId)
        pendingPairingPhone.delete(merchantId)
        const phone = getSnapshot(merchantId).phone
        await destroySocket(merchantId, { skipPersist: true })
        releasePhoneOwner(merchantId, phone)
        clearSession(merchantId)
        setSnapshot(merchantId, { status: 'idle', qr: undefined, pairingCode: undefined, phone: undefined })
        await notifyConnected(merchantId, false, undefined, true)
      }
    })

    registerMessagesHandler(sock, merchantId)
    registerPresenceHandler(sock, merchantId)
    registerOutboundHandler(sock, merchantId)
    registerReachoutHandler(sock, merchantId, setSnapshot)

    // Pairing-code login (Baileys): only when not registered; wait for connecting/QR first.
    if (phone && !sock.authState.creds.registered) {
      const digits = toPairingPhoneDigits(phone)
      if (digits.length < 10) {
        pendingPairingPhone.delete(merchantId)
        throw new Error('Enter a valid WhatsApp number with country code')
      }
      pendingPairingPhone.set(merchantId, digits)

      // Reuse an already-issued code across restart_required / brief drops so it does not rotate.
      const credsPairing = (sock.authState.creds as { pairingCode?: string }).pairingCode
      const existingCode = credsPairing || getSnapshot(merchantId).pairingCode
      if (existingCode) {
        const pairingCode = formatPairingCode(existingCode)
        setSnapshot(merchantId, { status: 'qr', pairingCode, qr: undefined, phone: digits })
        logger.info({ merchantId, phone: digits }, 'reusing existing pairing code')
      } else {
        try {
          // Wait for connection=="connecting" or QR (same window as working community examples).
          await waitForPairingWindow(sock)
          // Brief settle — interactive CLIs get this delay while the user types the number.
          await new Promise((r) => setTimeout(r, 800))
          // E.164 without +: 233202966466 (not +233… / 020…).
          const code = await sock.requestPairingCode(digits)
          const pairingCode = formatPairingCode(code)
          setSnapshot(merchantId, { status: 'qr', pairingCode, qr: undefined, phone: digits })
          logger.info({ merchantId, phone: digits }, 'pairing code generated')
        } catch (err) {
          pendingPairingPhone.delete(merchantId)
          logger.error({ err, merchantId, phone: digits }, 'pairing code failed')
          await destroySocket(merchantId, { skipPersist: true })
          clearSession(merchantId)
          setSnapshot(merchantId, {
            status: 'idle',
            qr: undefined,
            pairingCode: undefined,
            phone: undefined
          })
          throw new Error('Could not generate pairing code. Check the number and try again.')
        }
      }
    }
  } finally {
    booting.delete(merchantId)
  }
}

export async function startConnection(
  merchantId: string,
  opts: StartOptions = {}
): Promise<SessionSnapshot> {
  if (!isMerchantUUID(merchantId)) {
    throw new Error('invalid merchantId')
  }

  ensureSessionDir()
  hydrateSnapshotFromDisk(merchantId)

  const snap = getSnapshot(merchantId)
  const live = snap.status === 'connected' && isSessionLive(merchantId)
  const wantsPairing = Boolean(opts.phone?.trim())

  if (wantsPairing) {
    // Pairing requires a fresh unregistered session and an open socket.
    if (live && snap.pairingCode) return snap
    if (snap.pairingCode && sockets.has(merchantId) && pendingPairingPhone.has(merchantId)) {
      return snap
    }
    cancelReconnect(merchantId)
    await destroySocket(merchantId, { skipPersist: true })
    clearSession(merchantId)
    pendingPairingPhone.delete(merchantId)
    setSnapshot(merchantId, {
      status: 'connecting',
      qr: undefined,
      pairingCode: undefined,
      phone: undefined
    })
    await bootConnection(merchantId, opts.phone?.trim())
    if (opts.waitMs && opts.waitMs > 0) {
      return waitForSnapshot(merchantId, getSnapshot, opts.waitMs)
    }
    return getSnapshot(merchantId)
  }

  if (sockets.has(merchantId)) {
    if (live) return snap
    if (snap.qr && !snap.pairingCode) return snap
    await destroySocket(merchantId)
  }

  if (snap.status === 'connected' && !live) {
    ensureSessionLive(merchantId)
  }

  if (snap.status !== 'connecting') {
    setSnapshot(merchantId, { status: 'connecting', qr: undefined, pairingCode: undefined })
  }

  cancelReconnect(merchantId)
  pendingPairingPhone.delete(merchantId)
  await bootConnection(merchantId)

  if (opts.waitMs && opts.waitMs > 0) {
    return waitForSnapshot(merchantId, getSnapshot, opts.waitMs)
  }

  return getSnapshot(merchantId)
}

/** Disconnect duplicate live sessions that share the same WhatsApp number. */
export async function reconcileDuplicatePhones(): Promise<void> {
  const seen = new Map<string, string>()

  for (const merchantId of sockets.keys()) {
    const snap = getSnapshot(merchantId)
    if (snap.status !== 'connected' || !snap.phone) continue

    const key = normalizeWhatsAppPhone(snap.phone)
    if (!key) continue

    const kept = seen.get(key)
    if (kept) {
      logger.warn({ merchantId, phone: key, kept }, 'duplicate whatsapp session — disconnecting extra account')
      await rejectPhoneConflict(merchantId)
      continue
    }

    seen.set(key, merchantId)
    tryReservePhone(merchantId, snap.phone)
  }
}

/** Periodically reconnect registered sessions that dropped overnight. */
export function startSessionWatchdog(): void {
  if (watchdogStarted) return
  watchdogStarted = true

  setInterval(() => {
    void runSessionWatchdog()
  }, WATCHDOG_INTERVAL_MS)

  logger.info({ intervalMs: WATCHDOG_INTERVAL_MS }, 'whatsapp session watchdog started')
}

async function runSessionWatchdog(): Promise<void> {
  for (const merchantId of listRegisteredMerchants()) {
    ensureSessionLive(merchantId)
  }
}
