import { isDev } from '../config/env'

function friendlyMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)

  if (/econnrefused|enotfound|econnreset|fetch failed|socket hang up|etimedout|eai_again/i.test(msg)) {
    return "Can't reach backend services. Check that Clerk is running."
  }
  if (/timeout|timed out/i.test(msg)) {
    return 'That took too long. Try again in a moment.'
  }
  return 'Something went wrong. Try again in a moment.'
}

/** User-facing message for API error bodies — logs technical detail in dev. */
export function safeErrorMessage(err: unknown): string {
  if (isDev) console.error('[safe-error]', err)
  return friendlyMessage(err)
}
