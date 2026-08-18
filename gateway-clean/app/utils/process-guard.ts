import { handleBaileysTransientError } from '../auth/connect'
import { logger } from './logger'
import { isBaileysTransientError } from './baileys-errors'

let installed = false

export function installProcessGuards(): void {
  if (installed) return
  installed = true

  process.on('unhandledRejection', (reason) => {
    if (isBaileysTransientError(reason)) {
      logger.warn({ err: reason }, 'baileys transient error (unhandled rejection)')
      handleBaileysTransientError(reason)
      return
    }
    logger.error({ err: reason }, 'unhandled promise rejection')
  })

  process.on('uncaughtException', (err) => {
    if (isBaileysTransientError(err)) {
      logger.warn({ err }, 'baileys transient error (uncaught exception)')
      handleBaileysTransientError(err)
      return
    }
    logger.fatal({ err }, 'uncaught exception — exiting')
    process.exit(1)
  })
}
