import type { WASocket } from '@whiskeysockets/baileys'
import { DisconnectReason } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import { logger } from '../utils/logger'

type ConnectionCallbacks = {
  /** True once creds.registered — avoids treating idle timeouts as "QR expired". */
  isRegistered: boolean
  onQR: (qr: string) => void
  onConnected: (phone?: string) => void
  onRestartRequired: () => void
  onQrExpired: () => void
  /** Any non-logout disconnect — reconnect with saved creds (Baileys official pattern). */
  onReconnectNeeded: (statusCode?: number) => void
  onLoggedOut: (reason?: string) => void
}

type StreamNode = {
  tag?: string
  attrs?: Record<string, string>
  content?: unknown[]
}

function disconnectStatus(err: Boom | undefined): number | undefined {
  return err?.output?.statusCode
}

function conflictTypeFromNode(node: unknown): string | undefined {
  if (!node || typeof node !== 'object') return undefined
  const n = node as StreamNode
  if (n.tag === 'conflict' && n.attrs?.type) {
    return n.attrs.type
  }
  if (Array.isArray(n.content)) {
    for (const child of n.content) {
      const nested = conflictTypeFromNode(child)
      if (nested) return nested
    }
  }
  return undefined
}

/** Reads conflict type from Baileys stream:error payload (e.g. device_removed). */
export function streamConflictType(err: Boom | undefined): string | undefined {
  if (!err) return undefined
  const msg = (err.message ?? '').toLowerCase()
  if (msg.includes('device_removed') || msg.includes('device removed')) {
    return 'device_removed'
  }
  const data = err.data as Record<string, unknown> | undefined
  if (!data) return undefined
  return (
    conflictTypeFromNode(data.node) ??
    conflictTypeFromNode(data.fullErrorNode) ??
    conflictTypeFromNode(data)
  )
}

export function isDeviceRemovedConflict(err: Boom | undefined): boolean {
  return streamConflictType(err) === 'device_removed'
}

function isRestartRequired(err: Boom | undefined): boolean {
  const code = disconnectStatus(err)
  if (code === DisconnectReason.restartRequired) return true
  const msg = err?.message ?? ''
  return msg.toLowerCase().includes('restart required')
}

function isQrExpired(err: Boom | undefined, isRegistered: boolean): boolean {
  // After sleep / network idle, Baileys often emits timedOut — not a QR scan timeout.
  if (isRegistered) return false
  const code = disconnectStatus(err)
  if (code === DisconnectReason.timedOut) return true
  const msg = err?.message ?? ''
  return msg.toLowerCase().includes('qr refs attempts ended')
}

/**
 * Creds are dead — must clear session, never reconnect with the same files.
 *
 * "Stream Errored (conflict)" / connectionReplaced means another WhatsApp Web
 * or linked device took the socket. Creds are still valid — reconnect, do not wipe.
 * Baileys sometimes reports conflict as status 401 (same as loggedOut), so the
 * message must be checked before treating 401 as fatal.
 *
 * conflict type device_removed means the merchant unlinked this device on their
 * phone — creds are invalid; reconnecting will always fail with Connection Failure.
 */
function isFatalAuthFailure(err: Boom | undefined): boolean {
  if (isDeviceRemovedConflict(err)) {
    return true
  }

  const msg = (err?.message ?? '').toLowerCase()
  if (
    msg.includes('conflict') ||
    msg.includes('replaced') ||
    msg.includes('connection replaced')
  ) {
    return false
  }

  const code = disconnectStatus(err)
  if (code === DisconnectReason.connectionReplaced) {
    return false
  }
  if (
    code === DisconnectReason.loggedOut ||
    code === DisconnectReason.badSession ||
    code === DisconnectReason.forbidden ||
    code === DisconnectReason.multideviceMismatch
  ) {
    return true
  }
  return (
    msg.includes('connection failure') ||
    msg.includes('logged out') ||
    msg.includes('not-authorized') ||
    msg.includes('unauthorized')
  )
}

function isSessionTaken(err: Boom | undefined): boolean {
  if (isDeviceRemovedConflict(err)) {
    return false
  }
  const msg = (err?.message ?? '').toLowerCase()
  return (
    msg.includes('conflict') ||
    msg.includes('replaced') ||
    disconnectStatus(err) === DisconnectReason.connectionReplaced
  )
}

export function registerConnectionHandler(
  sock: WASocket,
  merchantId: string,
  callbacks: ConnectionCallbacks
): void {
  let qrLogged = false

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr, isNewLogin } = update

    if (qr) {
      if (!qrLogged) {
        logger.info({ merchantId }, 'whatsapp qr ready')
        qrLogged = true
      } else {
        logger.debug({ merchantId }, 'whatsapp qr rotated')
      }
      callbacks.onQR(qr)
    }

    if (connection === 'open') {
      qrLogged = false
      const phone = sock.user?.id ? sock.user.id.split(':')[0].split('@')[0] : undefined
      logger.info({ merchantId, phone, isNewLogin }, 'whatsapp connected')
      callbacks.onConnected(phone)
    }

    if (connection === 'close') {
      const err = lastDisconnect?.error as Boom | undefined
      const status = disconnectStatus(err)
      const conflictType = streamConflictType(err)

      if (isRestartRequired(err)) {
        logger.info({ merchantId, status }, 'whatsapp restart required (normal during pairing)')
        callbacks.onRestartRequired()
        return
      }

      if (isQrExpired(err, callbacks.isRegistered)) {
        logger.info({ merchantId }, 'whatsapp qr timed out (normal — not scanned in time)')
        callbacks.onQrExpired()
        return
      }

      const fatal = isFatalAuthFailure(err)
      const sessionTaken = isSessionTaken(err)

      logger.warn(
        { merchantId, status, fatal, sessionTaken, conflictType, message: err?.message },
        'whatsapp disconnected'
      )

      if (fatal) {
        const reason = isDeviceRemovedConflict(err) ? 'device_removed' : 'auth_failure'
        if (reason === 'device_removed') {
          logger.warn(
            { merchantId },
            'whatsapp linked device removed on phone — clearing session (re-pair required)'
          )
        }
        callbacks.onLoggedOut(reason)
        return
      }

      if (sessionTaken) {
        logger.info(
          { merchantId },
          'whatsapp session taken by another client — keeping creds and reconnecting'
        )
      }

      // Transient network / idle / conflict — keep creds and reconnect.
      callbacks.onReconnectNeeded(status)
    }
  })
}
