const OPAQUE_ID_RE = /^[a-f0-9]{32}$/i
const TEST_LABEL_RE = /^Test customer$|^WhatsApp ····\d{4}$/

function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, '')
}

function isGhanaMobile(digits: string): boolean {
  if (digits.startsWith('233') && digits.length === 12) {
    const local = digits.slice(3)
    return local.length === 9 && /^[235]\d{8}$/.test(local)
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return /^0[235]\d{8}$/.test(digits)
  }
  return false
}

function looksLikeWhatsAppInternalId(digits: string): boolean {
  if (!digits || isGhanaMobile(digits)) return false
  if (['233501234567', '0501234567', '501234567'].includes(digits)) return false
  return digits.length >= 11
}

/** Prefer gateway-resolved label; fall back to local formatting. */
export function customerLabel(raw: string, display?: string): string {
  if (display?.trim()) return display.trim()
  return formatCustomerPhone(raw)
}

/** Format customer phone for display in dashboard (Ghana-local friendly). */
export function formatCustomerPhone(phone: string): string {
  if (!phone || phone === 'Unknown customer') return phone || 'Unknown'
  if (TEST_LABEL_RE.test(phone) || phone.startsWith('WhatsApp ')) return phone
  if (OPAQUE_ID_RE.test(phone)) return 'Unknown customer'

  const digits = digitsOnly(phone)
  if (looksLikeWhatsAppInternalId(digits)) {
    const tail = digits.slice(-4)
    return tail.length >= 4 ? `WhatsApp ····${tail}` : 'WhatsApp customer'
  }
  if (['233501234567', '0501234567', '501234567'].includes(digits)) return 'Test customer'

  if (digits.startsWith('233') && digits.length >= 12) {
    return `0${digits.slice(3)}`
  }
  if (digits.length >= 9 && digits.length <= 10 && !digits.startsWith('0')) {
    return `0${digits}`
  }
  return phone
}

/**
 * Digits-only international number for Baileys pairing codes.
 * Ghana local 0XXXXXXXXX → 233XXXXXXXXX. Returns null if too short/long.
 */
export function pairingPhoneDigits(phone: string): string | null {
  let digits = digitsOnly(phone)
  if (!digits) return null
  if (digits.startsWith('0') && digits.length === 10) {
    digits = `233${digits.slice(1)}`
  } else if (digits.length === 9 && /^[235]/.test(digits)) {
    digits = `233${digits}`
  }
  if (digits.length < 10 || digits.length > 15) return null
  return digits
}

/** Build wa.me link digits (international, no +). Only for real mobile numbers. */
export function whatsAppDigits(phone: string): string | null {
  const formatted = formatCustomerPhone(phone)
  if (formatted.startsWith('WhatsApp') || formatted === 'Test customer' || formatted === 'Unknown customer') {
    return null
  }
  const digits = digitsOnly(formatted)
  if (!isGhanaMobile(digits) && !(digits.startsWith('0') && digits.length === 10)) return null
  if (digits.length < 9) return null
  if (digits.startsWith('233')) return digits
  if (digits.startsWith('0')) return `233${digits.slice(1)}`
  return `233${digits}`
}

export function whatsAppChatUrl(phone: string): string | null {
  const digits = whatsAppDigits(phone)
  return digits ? `https://wa.me/${digits}` : null
}

export function phoneDigitsFromChatUrl(url: string): string | null {
  const match = url.match(/wa\.me\/(\d+)/i)
  return match?.[1] ?? null
}

export function whatsAppDeepLink(phoneDigits: string): string {
  return `whatsapp://send?phone=${phoneDigits}`
}

function phoneFromDeepLink(link: string): string | null {
  const match = link.match(/phone=(\d+)/i)
  return match?.[1] ?? null
}

/** Prefer gateway-resolved deep link; fall back to wa.me digits. Never link privacy/internal ids. */
export function resolveWhatsAppChatHref(fields: {
  customerChatDeepLink?: string
  customerChatUrl?: string
  customerPrivacyHidden?: boolean
}): string | null {
  if (fields.customerPrivacyHidden) return null

  const deepLink = fields.customerChatDeepLink?.trim()
  if (deepLink) {
    const phone = phoneFromDeepLink(deepLink)
    if (phone && looksLikeWhatsAppInternalId(phone)) return null
    return deepLink
  }

  const digits = fields.customerChatUrl ? phoneDigitsFromChatUrl(fields.customerChatUrl) : null
  if (!digits || looksLikeWhatsAppInternalId(digits)) return null
  return whatsAppDeepLink(digits)
}
