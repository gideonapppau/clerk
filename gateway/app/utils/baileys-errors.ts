import { Boom } from '@hapi/boom'

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err ?? '')
}

function errorStack(err: unknown): string {
  if (err instanceof Error) return err.stack ?? ''
  if (err && typeof err === 'object' && 'data' in err) {
    const data = (err as { data?: { stack?: string } }).data
    if (data?.stack) return data.stack
  }
  return ''
}

/** Baileys timeouts during pairing/pre-key upload must not crash the gateway process. */
export function isBaileysTransientError(err: unknown): boolean {
  const msg = errorMessage(err)
  const stack = errorStack(err)
  const status =
    err instanceof Boom ? err.output?.statusCode : (err as { output?: { statusCode?: number } })?.output?.statusCode

  if (
    status === 408 ||
    status === 428 ||
    status === 429 ||
    status === 502 ||
    status === 503 ||
    msg === 'Connection Closed' ||
    msg === 'Timed Out' ||
    msg.toLowerCase().includes('timed out') ||
    msg.includes('503')
  ) {
    return true
  }

  const haystack = `${msg}\n${stack}`
  return (
    haystack.includes('sendMessageAck') ||
    haystack.includes('handleNotification') ||
    haystack.includes('uploadPreKeys') ||
    haystack.includes('uploadPreKeysToServerIfRequired') ||
    haystack.includes('waitForMessage') ||
    haystack.includes('promiseTimeout')
  )
}
