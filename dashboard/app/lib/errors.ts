/** User-facing API and network errors — never show raw fetch/500 text to merchants. */

export class ApiClientError extends Error {
  code: string
  status: number

  constructor(code: string, status: number, message: string) {
    super(message)
    this.name = 'ApiClientError'
    this.code = code
    this.status = status
  }

  static isUnauthorized(err: unknown): boolean {
    if (err instanceof ApiClientError) {
      return err.code === 'UNAUTHORIZED' || err.status === 401
    }
    if (err instanceof Error) {
      const m = err.message.toLowerCase()
      return m.includes('401') || m.includes('unauthorized') || m.includes('session expired')
    }
    return false
  }
}

const CODE_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'Wrong email or password. Try again.',
  EMAIL_EXISTS: 'That email is already registered. Sign in instead.',
  UNAUTHORIZED: 'Your session expired. Please sign in again.',
  NOT_FOUND: "We couldn't find that. It may have been removed.",
  INVALID_STATE: "That action isn't available for this order anymore.",
  PHONE_IN_USE: 'This WhatsApp number is linked to another Clerk account.',
  NO_SESSION: "WhatsApp isn't connected. Link it from the WhatsApp page first.",
  IDENTITY_NOT_FOUND:
    "Can't message this customer yet. Open their chat on WhatsApp first, then try again.",
  GATEWAY_ERROR: "Couldn't reach Clerk. Wait a moment and try again.",
  INTERNAL_ERROR: 'Something went wrong on our end. Try again in a moment.',
  INVALID_INPUT: 'Check what you entered and try again.',
  NETWORK: "Can't reach Clerk. Check your internet connection.",
  FOUNDER_KEY_REQUIRED: 'Enter your founder key to continue.',
  FOUNDER_UNAUTHORIZED: 'Wrong founder key. Lock the console and enter the key from Core (FOUNDER_API_KEY).',
  FOUNDER_NOT_CONFIGURED:
    'Founder API is not set up on Core. Add FOUNDER_API_KEY on Fly and redeploy.',
  BILLING_NOT_CONFIGURED:
    'Plan upgrades are not set up on this server. Add CLERK_PAYSTACK_SECRET_KEY to .env and restart core.',
  MOOLRE_NOT_CONFIGURED:
    'Moolre is not set up on this server yet. Use Paystack or Manual for now, or contact support.',
  MOOLRE_AUTH_FAILED:
    "Moolre rejected the server's API credentials. Contact support. Clerk's Moolre keys need to be updated on production.",
  PROVISION_FAILED: "Couldn't create your Moolre wallet. Check the settlement number and try again.",
  OUT_OF_STOCK: 'That product is out of stock.',
  SIMULATE_LIMIT: 'Dashboard test limit reached. Try again in an hour or message your shop on WhatsApp.',
  PLAN_LIMIT_PRODUCTS:
    'Your catalog is full for this plan. Remove products or upgrade under Plan in the dashboard.',
  PLAN_LIMIT_REPLIES:
    'Your monthly reply limit is used up. Upgrade under Plan in the dashboard or wait until next month.',
  PUSH_NOT_CONFIGURED:
    'Push alerts are not set up on the server yet. Contact support or check Core VAPID configuration.',
}

const STATUS_MESSAGES: Record<number, string> = {
  401: 'Your session expired. Please sign in again.',
  402: 'Plan limit reached. Open Plan in the dashboard to upgrade or remove items.',
  403: "You don't have permission to do that.",
  404: "We couldn't find what you were looking for.",
  409: 'That conflicted with something else. Refresh the page and try again.',
  429: 'Too many attempts. Wait a moment and try again.',
  502: 'Clerk is temporarily unavailable. Try again shortly.',
  503: 'Clerk is temporarily unavailable. Try again shortly.',
}

function isTechnicalMessage(msg: string): boolean {
  if (msg.includes('MOOLRE_USERNAME') || msg.includes('api.moolre.com') || msg.includes('sandbox.moolre.com')) {
    return false
  }
  return (
    msg.length > 160 ||
    /^(Error:|TypeError:|SyntaxError:)/.test(msg) ||
    /request failed \(\d+\)/i.test(msg) ||
    /axioserror|econnrefused|enotfound|eai_again|networkerror/i.test(msg) ||
    msg.includes('An internal error occurred')
  )
}

function messageForCode(code: string, serverMessage?: string): string | undefined {
  if (serverMessage && !isTechnicalMessage(serverMessage)) return serverMessage
  if (CODE_MESSAGES[code]) return CODE_MESSAGES[code]
  return undefined
}

export function parseApiError(status: number, body: unknown): ApiClientError {
  const wrapped = body as {
    success?: boolean
    error?: { code?: string; message?: string }
    message?: string
  }

  const code = wrapped.error?.code ?? `HTTP_${status}`
  const serverMsg = wrapped.error?.message ?? wrapped.message

  const fromCode = messageForCode(code, serverMsg)
  if (fromCode) return new ApiClientError(code, status, fromCode)

  if (STATUS_MESSAGES[status] && (!serverMsg || isTechnicalMessage(serverMsg))) {
    return new ApiClientError(code, status, STATUS_MESSAGES[status]!)
  }

  if (serverMsg && !isTechnicalMessage(serverMsg)) {
    return new ApiClientError(code, status, serverMsg)
  }

  return new ApiClientError(code, status, 'Something went wrong. Please try again.')
}

export function formatUserError(
  err: unknown,
  fallback = 'Something went wrong. Please try again.'
): string {
  if (err instanceof ApiClientError) return err.message

  if (err instanceof Error) {
    const msg = err.message

    if (/failed to fetch|networkerror|network request failed|load failed/i.test(msg)) {
      return CODE_MESSAGES.NETWORK
    }
    if (/econnrefused|enotfound|eai_again|socket hang up/i.test(msg)) {
      return "Clerk isn't running or can't be reached. Start the app and try again."
    }
    if (msg.startsWith('Unauthorized') || msg.includes('401')) {
      return CODE_MESSAGES.UNAUTHORIZED
    }
    if (!isTechnicalMessage(msg)) return msg
  }

  return fallback
}

export function wrapFetchError(err: unknown): ApiClientError {
  if (err instanceof ApiClientError) return err
  return new ApiClientError('NETWORK', 0, formatUserError(err, CODE_MESSAGES.NETWORK))
}
