import express from 'express'
import { assertLinkPreviewReady } from './baileys/link-preview'
import { collectSessionHealth } from './auth/session-health'
import { connectionStatus, disconnectMerchant } from './auth/disconnect'
import { getSnapshot, startConnection } from './auth/connect'
import { restoreAllSessions } from './auth/restore'
import { flushAllSessions } from './auth/auth-persistence'
import { cancelAllReconnects } from './auth/reconnect'
import { forwardMessage } from './transport/core-client'
import { clerkEnv, env, isDev, validateStartup } from './config/env'
import { logger } from './utils/logger'
import { installProcessGuards } from './utils/process-guard'
import { looksLikeInventoryImport } from './utils/normalize'
import { safeErrorMessage } from './utils/safe-error'
import { isMerchantUUID } from './utils/uuid'
import { customerJid } from './baileys/jid'
import { registerIdentity } from './utils/identity'
import { proxyToCore } from './api/proxy'
import { createSession, deleteSession, refreshSession, sendCustomerMessage, sendPaymentConfirmation, sessionStatus } from './api/v1/whatsapp'
import QRCode from 'qrcode'

validateStartup()
installProcessGuards()
void assertLinkPreviewReady().catch((err) => {
  logger.warn({ err }, 'link-preview-js unavailable — outbound URLs will send without previews')
})

const app = express()
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Core founder metrics — Baileys session truth (not just process liveness).
app.get('/health/sessions', (req, res) => {
  const secret = req.headers['x-webhook-secret']
  if (secret !== env.webhookSecret) {
    res.status(401).json({ error: 'unauthorized' })
    return
  }
  res.json(collectSessionHealth())
})

// --- /api/v1 contract surface (frontend entry point) ---

const v1 = express.Router()

v1.post('/whatsapp/session', createSession)
v1.get('/whatsapp/session', refreshSession)
v1.get('/whatsapp/status', sessionStatus)
v1.delete('/whatsapp/session', deleteSession)
v1.post('/whatsapp/send', sendCustomerMessage)
v1.post('/whatsapp/payment-confirmation', sendPaymentConfirmation)

// All other /api/v1 routes proxy to Go Core
v1.use((req, res) => {
  void proxyToCore(req, res)
})

app.use('/api/v1', v1)

// --- Legacy gateway routes (development only) ---

function registerLegacyRoutes(): void {
  app.post('/connect', async (req, res) => {
    const { merchantId } = req.body
    if (!merchantId || !isMerchantUUID(String(merchantId))) {
      return res.status(400).json({ error: 'valid merchantId UUID required' })
    }

    try {
      const snapshot = await startConnection(merchantId, { waitMs: 20_000 })
      const qrDataUrl = snapshot.qr ? await QRCode.toDataURL(snapshot.qr) : undefined
      res.json({ ok: true, ...snapshot, qrDataUrl })
    } catch (err) {
      logger.error({ err }, 'connect failed')
      res.status(500).json({ ok: false, error: safeErrorMessage(err) })
    }
  })

  app.get('/status', (req, res) => {
    const merchantId = String(req.query.merchantId ?? '')
    if (!merchantId || !isMerchantUUID(merchantId)) {
      return res.status(400).json({ error: 'valid merchantId UUID required' })
    }
    res.json(connectionStatus(merchantId))
  })

  app.post('/disconnect', async (req, res) => {
    const { merchantId } = req.body
    if (!merchantId || !isMerchantUUID(String(merchantId))) {
      return res.status(400).json({ error: 'valid merchantId UUID required' })
    }
    const snapshot = await disconnectMerchant(merchantId)
    res.json({ ok: true, ...snapshot })
  })

  app.post('/incoming', async (req, res) => {
    const { merchantId, text, customerPhone } = req.body
    if (!merchantId || !text || !isMerchantUUID(String(merchantId))) {
      return res.status(400).json({ error: 'merchantId (UUID) and text required' })
    }

    try {
      const phoneRaw = String(customerPhone ?? '').replace(/\D/g, '')
      const customerId =
        phoneRaw && phoneRaw !== 'unknown'
          ? registerIdentity(merchantId, phoneRaw, customerJid(phoneRaw))
          : 'unknown'

      const response = await forwardMessage({
        merchantId,
        customerPhone: customerId,
        text,
        messageKind: 'dashboard_simulate'
      })

      if (response.route === 'dispatch') {
        logger.info(
          { merchantId, customerPhone, conversationId: response.conversationId },
          'simulated message routed to merchant dispatch'
        )
      }

      res.json({ ok: true, ...response })
    } catch (err) {
      logger.error({ err }, 'incoming forward failed')
      res.status(500).json({ error: safeErrorMessage(err) })
    }
  })

  app.get('/snapshot', (req, res) => {
    const merchantId = String(req.query.merchantId ?? '')
    if (!merchantId || !isMerchantUUID(merchantId)) {
      return res.status(400).json({ error: 'valid merchantId UUID required' })
    }
    res.json(getSnapshot(merchantId))
  })

  logger.info('legacy gateway routes enabled (development only)')
}

if (isDev) {
  registerLegacyRoutes()
}

let shuttingDown = false

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return
  shuttingDown = true

  logger.info({ signal }, 'gateway shutting down — flushing auth state to disk')
  cancelAllReconnects()
  await flushAllSessions()
  process.exit(0)
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))

restoreAllSessions().finally(() => {
  app.listen(env.port, env.host, () => {
    logger.info({ host: env.host, port: env.port, coreUrl: env.coreUrl, sessionDir: env.sessionDir, clerkEnv }, 'gateway listening')
  })
})
