import fs from 'fs'
import { env } from '../config/env'
import { reconcileDuplicatePhones, startConnection, startSessionWatchdog } from './connect'
import { verifySessionStorage } from './auth-persistence'
import { notifyGatewayStartup } from '../transport/core-client'
import { logger } from '../utils/logger'
import { isMerchantUUID } from '../utils/uuid'
import { hasRegisteredSession, listRegisteredMerchants, readSessionMeta } from './session-store'
import { tryReservePhone } from './phone-registry'

/** Stagger cold starts so we don't open many sockets at once on restart. */
const RESTORE_STAGGER_MS = 5_000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function restoreAllSessions(): Promise<void> {
  verifySessionStorage()
  await notifyGatewayStartup()

  if (!fs.existsSync(env.sessionDir)) {
    logger.info({ sessionDir: env.sessionDir }, 'no whatsapp session directory — skipping restore')
    startSessionWatchdog()
    return
  }

  const allDirs = fs
    .readdirSync(env.sessionDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && isMerchantUUID(d.name))
    .map((d) => d.name)

  const merchants = listRegisteredMerchants()

  logger.info(
    { sessionDir: env.sessionDir, dirs: allDirs.length, registered: merchants.length },
    'restoring whatsapp sessions from disk'
  )

  for (let i = 0; i < merchants.length; i++) {
    const merchantId = merchants[i]!
    const meta = readSessionMeta(merchantId)
    if (meta?.phone) {
      tryReservePhone(merchantId, meta.phone)
    }

    try {
      if (i > 0) {
        await sleep(RESTORE_STAGGER_MS)
      }
      await startConnection(merchantId)
      logger.info({ merchantId, phone: meta?.phone }, 'restored whatsapp session')
    } catch (err) {
      logger.error({ err, merchantId }, 'failed to restore whatsapp session')
    }
  }

  await reconcileDuplicatePhones()
  startSessionWatchdog()
}
