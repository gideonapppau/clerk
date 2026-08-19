import fs from 'fs'
import path from 'path'
import { env } from '../config/env'
import { logger } from '../utils/logger'
import { ensureSessionDir, sessionPath } from './session-store'

const savers = new Map<string, () => Promise<void>>()

export function registerSessionSaver(merchantId: string, saveCreds: () => Promise<void>): void {
  savers.set(merchantId, saveCreds)
}

export function unregisterSessionSaver(merchantId: string): void {
  savers.delete(merchantId)
}

/** Retry creds write once — lost keys force a new QR scan. */
export function wrapSaveCreds(merchantId: string, saveCreds: () => Promise<void>): () => Promise<void> {
  return async () => {
    try {
      await saveCreds()
    } catch (err) {
      logger.error({ err, merchantId }, 'whatsapp creds save failed — retrying once')
      await new Promise((resolve) => setTimeout(resolve, 500))
      await saveCreds()
    }
  }
}

export async function flushSession(merchantId: string): Promise<void> {
  const save = savers.get(merchantId)
  if (!save) return
  try {
    await save()
    logger.debug({ merchantId }, 'flushed whatsapp auth state')
  } catch (err) {
    logger.error({ err, merchantId }, 'failed to flush whatsapp auth state')
  }
}

export async function flushAllSessions(): Promise<void> {
  await Promise.allSettled([...savers.keys()].map((merchantId) => flushSession(merchantId)))
}

export function verifySessionStorage(): void {
  ensureSessionDir()

  const testFile = path.join(env.sessionDir, '.write-test')
  try {
    fs.writeFileSync(testFile, `${Date.now()}`, { encoding: 'utf8', flag: 'w' })
    fs.unlinkSync(testFile)
  } catch (err) {
    throw new Error(`SESSION_DIR not writable: ${env.sessionDir} — ${err}`)
  }

  logger.info({ sessionDir: env.sessionDir }, 'whatsapp session storage verified')
}

export function sessionFileCount(merchantId: string): number {
  const dir = sessionPath(merchantId)
  if (!fs.existsSync(dir)) return 0
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json')).length
}
