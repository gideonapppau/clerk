import makeWASocket, {
  fetchLatestBaileysVersion,
  isJidBroadcast,
  isJidGroup,
  isJidNewsletter,
  isJidStatusBroadcast,
  type AuthenticationState,
  type WASocket
} from '@whiskeysockets/baileys'
import type { Logger } from 'pino'
import { createBaileysLogger } from './logger'
import type { ReachoutSignal } from '../auth/reachout-restriction'

type AuthState = {
  auth: AuthenticationState
  saveCreds: () => Promise<void>
  logger?: Logger
  onAppStateCorruption?: () => void
  onReachoutSignal?: (signal: ReachoutSignal) => void
  /** Pairing-code link: no query timeout while the user types the code on their phone. */
  pairing?: boolean
}

/**
 * Browser identity sent to WhatsApp during link (QR / pairing code).
 *
 * Do NOT use Mac OS / Safari-style agents in Docker/Fly (e.g. Browsers.macOS(...)).
 * Pairing code generation often fails or never prompts the phone when the host is Linux
 * but the agent claims Mac OS. Ubuntu + Chrome 20.0.04 is known-good on Linux containers.
 */
const DESKTOP_BROWSER = ['Ubuntu', 'Chrome', '20.0.04'] as [string, string, string]

function shouldIgnoreJid(jid: string): boolean {
  return (
    isJidStatusBroadcast(jid) ||
    !!isJidBroadcast(jid) ||
    !!isJidGroup(jid) ||
    !!isJidNewsletter(jid)
  )
}

export async function createWhatsAppSocket(auth: AuthState): Promise<WASocket> {
  const { version } = await fetchLatestBaileysVersion()
  const baileysLogger =
    auth.logger ??
    createBaileysLogger({
      onAppStateCorruption: auth.onAppStateCorruption,
      onReachoutSignal: auth.onReachoutSignal
    })

  return makeWASocket({
    version,
    auth: auth.auth,
    printQRInTerminal: false,
    browser: DESKTOP_BROWSER,
    logger: baileysLogger,
    markOnlineOnConnect: false,
    syncFullHistory: false,
    fireInitQueries: false,
    connectTimeoutMs: 60_000,
    // Pairing: leave queries open while the merchant types the code on their phone.
    defaultQueryTimeoutMs: auth.pairing ? undefined : 90_000,
    keepAliveIntervalMs: 25_000,
    retryRequestDelayMs: 250,
    // Requires link-preview-js (direct dependency). Uploads full preview images to WA.
    generateHighQualityLinkPreview: true,
    shouldIgnoreJid,
    getMessage: async () => undefined
  })
}
