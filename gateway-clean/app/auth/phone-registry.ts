import { logger } from '../utils/logger'

/** Digits-only WhatsApp identity (country code + number). */
export function normalizeWhatsAppPhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

const phoneOwners = new Map<string, string>()

export function getPhoneOwner(phone: string): string | undefined {
  const key = normalizeWhatsAppPhone(phone)
  if (!key) return undefined
  return phoneOwners.get(key)
}

export function registerPhoneOwner(phone: string, merchantId: string): void {
  const key = normalizeWhatsAppPhone(phone)
  if (!key) return
  phoneOwners.set(key, merchantId)
}

export function releasePhoneOwner(merchantId: string, phone?: string): void {
  if (phone) {
    const key = normalizeWhatsAppPhone(phone)
    if (phoneOwners.get(key) === merchantId) {
      phoneOwners.delete(key)
    }
    return
  }

  for (const [key, owner] of phoneOwners.entries()) {
    if (owner === merchantId) {
      phoneOwners.delete(key)
    }
  }
}

/** Returns the other merchant already using this phone on this gateway, if any. */
export function findPhoneConflict(merchantId: string, phone: string): string | undefined {
  const key = normalizeWhatsAppPhone(phone)
  if (!key) return undefined
  const owner = phoneOwners.get(key)
  if (owner && owner !== merchantId) {
    return owner
  }
  return undefined
}

/**
 * Reserve a phone for this merchant before core confirms.
 * Prevents two accounts from claiming the same number during a connect race.
 */
export function tryReservePhone(merchantId: string, phone: string): boolean {
  const key = normalizeWhatsAppPhone(phone)
  if (!key) return true
  const owner = phoneOwners.get(key)
  if (owner && owner !== merchantId) {
    return false
  }
  phoneOwners.set(key, merchantId)
  return true
}

/** Only the registered owner may auto-reply on this WhatsApp number. */
export function canMerchantHandleInbound(merchantId: string, phone?: string | null): boolean {
  if (!phone) return true
  const owner = getPhoneOwner(phone)
  return !owner || owner === merchantId
}

export function logPhoneRegistry(): void {
  if (phoneOwners.size === 0) return
  logger.debug(
    { phones: Object.fromEntries(phoneOwners) },
    'whatsapp phone registry'
  )
}
