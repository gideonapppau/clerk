import { createHash } from 'crypto'
import fs from 'fs'
import path from 'path'
import { customerJid, phoneFromJid } from '../baileys/jid'
import { getSnapshot } from '../auth/connect'
import { env } from '../config/env'

const OPAQUE_ID_RE = /^[a-f0-9]{32}$/i

/** Known dashboard simulator numbers — label clearly in merchant UI. */
const TEST_PHONE_DIGITS = new Set(['233501234567', '0501234567', '501234567'])

type IdentityEntry = { jid: string; displayName?: string }

// customerUUID derives a stable, opaque identity for a (merchant, phone) pair.
export function customerUUID(merchantId: string, rawPhone: string): string {
  return createHash('sha256')
    .update(`${merchantId}:${rawPhone}`)
    .digest('hex')
    .slice(0, 32)
}

const store = new Map<string, Map<string, IdentityEntry>>()

const IDENTITY_FILE = path.join(env.sessionDir, '_identities.json')

function normalizeEntry(value: string | IdentityEntry): IdentityEntry {
  if (typeof value === 'string') return { jid: value }
  return value
}

function loadFromDisk(): void {
  try {
    if (!fs.existsSync(IDENTITY_FILE)) return
    const raw = JSON.parse(fs.readFileSync(IDENTITY_FILE, 'utf8')) as Record<
      string,
      Record<string, string | IdentityEntry>
    >
    for (const [merchantId, entries] of Object.entries(raw)) {
      const map = new Map<string, IdentityEntry>()
      for (const [id, value] of Object.entries(entries)) {
        map.set(id, normalizeEntry(value))
      }
      store.set(merchantId, map)
    }
  } catch {
    // corrupt file — start fresh
  }
}

function saveToDisk(): void {
  try {
    fs.mkdirSync(path.dirname(IDENTITY_FILE), { recursive: true })
    const out: Record<string, Record<string, IdentityEntry>> = {}
    for (const [merchantId, map] of store.entries()) {
      out[merchantId] = Object.fromEntries(map)
    }
    fs.writeFileSync(IDENTITY_FILE, JSON.stringify(out), 'utf8')
  } catch {
    // best-effort
  }
}

loadFromDisk()

function resolveEntry(merchantId: string, customerId: string): IdentityEntry | undefined {
  return store.get(merchantId)?.get(customerId)
}

function lookupEntry(merchantId: string, idOrRaw: string): IdentityEntry | undefined {
  if (!idOrRaw) return undefined
  if (isOpaqueCustomerId(idOrRaw)) return resolveEntry(merchantId, idOrRaw)
  const digits = idOrRaw.replace(/\D/g, '')
  if (!digits) return undefined
  return resolveEntry(merchantId, customerUUID(merchantId, digits))
}

export function registerIdentity(
  merchantId: string,
  rawPhone: string,
  jid: string,
  displayName?: string
): string {
  const id = customerUUID(merchantId, rawPhone)
  let byMerchant = store.get(merchantId)
  if (!byMerchant) {
    byMerchant = new Map()
    store.set(merchantId, byMerchant)
  }

  const prev = byMerchant.get(id)
  const entry: IdentityEntry = {
    jid,
    displayName: displayName?.trim() || prev?.displayName
  }
  const changed = !prev || prev.jid !== entry.jid || prev.displayName !== entry.displayName
  if (changed) {
    byMerchant.set(id, entry)
    saveToDisk()
  }
  return id
}

export function resolveJid(merchantId: string, customerId: string): string | undefined {
  return resolveEntry(merchantId, customerId)?.jid
}

/** @deprecated use resolveJid */
export function resolvePhone(merchantId: string, customerId: string): string | undefined {
  const jid = resolveJid(merchantId, customerId)
  return jid ? phoneFromJid(jid) : undefined
}

export function isOpaqueCustomerId(value: string): boolean {
  return OPAQUE_ID_RE.test(value)
}

function merchantPhoneDigits(merchantId: string): string {
  return getSnapshot(merchantId).phone?.replace(/\D/g, '') ?? ''
}

function isMerchantSelfTest(merchantId: string, idOrPhone: string): boolean {
  const merch = merchantPhoneDigits(merchantId)
  if (!merch) return false

  const entry = lookupEntry(merchantId, idOrPhone)
  if (entry?.jid) {
    const cust = phoneFromJid(entry.jid).replace(/\D/g, '')
    return cust !== '' && cust === merch
  }

  const digits = idOrPhone.replace(/\D/g, '')
  return digits !== '' && digits === merch
}

function dashboardTestProfile(digits: string): CustomerProfile {
  const phone = formatLocalPhone(digits)
  return {
    name: 'You',
    contact: `Dashboard test · ${phone}`,
    phone,
    isPrivacyId: false,
  }
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

function isWhatsAppInternalId(digits: string): boolean {
  if (!digits) return false
  if (isGhanaMobile(digits)) return false
  if (TEST_PHONE_DIGITS.has(digits)) return false
  // WhatsApp @lid and other non-E.164 identifiers are often 11–15 digits.
  return digits.length >= 11
}

export type CustomerProfile = {
  name?: string
  contact: string
  phone?: string
  chatUrl?: string
  /** Opens the native app directly to this customer's chat thread. */
  chatDeepLink?: string
  isPrivacyId: boolean
}

function whatsAppDeepLinkFromJid(jid: string): string | undefined {
  if (!jid || jid.endsWith('@lid')) return undefined

  const digits = phoneFromJid(jid).replace(/\D/g, '')
  if (!digits || isWhatsAppInternalId(digits)) return undefined

  if (digits.startsWith('233')) return `whatsapp://send?phone=${digits}`
  if (digits.startsWith('0') && digits.length === 10) return `whatsapp://send?phone=233${digits.slice(1)}`
  if (isGhanaMobile(digits)) {
    const intl = digits.startsWith('233') ? digits : `233${digits.replace(/^0/, '')}`
    return `whatsapp://send?phone=${intl}`
  }

  // Real @s.whatsapp.net numbers outside Ghana (10–15 digits, not internal ids).
  if (digits.length >= 10 && digits.length <= 15) return `whatsapp://send?phone=${digits}`

  return undefined
}

function waMeUrl(digits: string): string | undefined {
  if (!isGhanaMobile(digits)) return undefined
  if (digits.startsWith('233')) return `https://wa.me/${digits}`
  if (digits.startsWith('0')) return `https://wa.me/233${digits.slice(1)}`
  return `https://wa.me/233${digits}`
}

function buildProfileFromEntry(entry: IdentityEntry): CustomerProfile {
  const digits = phoneFromJid(entry.jid).replace(/\D/g, '')
  const name = entry.displayName?.trim() || undefined
  const isLid = entry.jid.endsWith('@lid') || isWhatsAppInternalId(digits)
  const chatDeepLink = whatsAppDeepLinkFromJid(entry.jid)

  if (TEST_PHONE_DIGITS.has(digits)) {
    const phone = formatLocalPhone(digits)
    const intl = digits.startsWith('233') ? digits : `233${digits.replace(/^0/, '')}`
    return {
      name: name && name !== phone ? name : undefined,
      contact: phone,
      phone,
      chatUrl: `https://wa.me/${intl}`,
      chatDeepLink: chatDeepLink ?? `whatsapp://send?phone=${intl}`,
      isPrivacyId: false,
    }
  }

  if (!isLid && isGhanaMobile(digits)) {
    const phone = formatLocalPhone(digits)
    const nameLooksLikePhone = name && name.replace(/\D/g, '').endsWith(digits.slice(-9))
    return {
      name: name && !nameLooksLikePhone ? name : undefined,
      contact: phone,
      phone,
      chatUrl: waMeUrl(digits),
      chatDeepLink,
      isPrivacyId: false,
    }
  }

  const tail = digits.slice(-4)
  const privacyLabel = tail.length >= 4 ? `WhatsApp ····${tail}` : 'WhatsApp contact'
  return {
    name,
    contact: privacyLabel,
    isPrivacyId: true,
  }
}

function buildProfileFromDigits(digits: string): CustomerProfile {
  if (TEST_PHONE_DIGITS.has(digits)) {
    const phone = formatLocalPhone(digits)
    const intl = digits.startsWith('233') ? digits : `233${digits.replace(/^0/, '')}`
    return { contact: 'Test customer', phone, chatUrl: `https://wa.me/${intl}`, chatDeepLink: `whatsapp://send?phone=${intl}`, isPrivacyId: false }
  }
  if (isGhanaMobile(digits)) {
    const phone = formatLocalPhone(digits)
    const intl = digits.startsWith('233') ? digits : `233${digits.replace(/^0/, '')}`
    return {
      contact: phone,
      phone,
      chatUrl: waMeUrl(digits),
      chatDeepLink: `whatsapp://send?phone=${intl}`,
      isPrivacyId: false,
    }
  }
  if (isWhatsAppInternalId(digits)) {
    const tail = digits.slice(-4)
    return {
      contact: tail.length >= 4 ? `WhatsApp ····${tail}` : 'WhatsApp contact',
      isPrivacyId: true,
    }
  }
  const phone = formatLocalPhone(digits)
  const intl = digits.startsWith('233') ? digits : `233${digits.replace(/^0/, '')}`
  return { contact: phone, phone, chatUrl: waMeUrl(digits), chatDeepLink: `whatsapp://send?phone=${intl}`, isPrivacyId: false }
}

/** Whether the merchant dashboard may send a WhatsApp message to this customer id. */
export function canDeliverWhatsAppTo(merchantId: string, idOrPhone: string): boolean {
  if (!idOrPhone || idOrPhone === 'unknown') return false
  if (isMerchantSelfTest(merchantId, idOrPhone)) return false
  const digits = idOrPhone.replace(/\D/g, '')
  if (digits && TEST_PHONE_DIGITS.has(digits)) return false
  return true
}

/** Structured customer identity for merchant dashboard (name + contact + chat link). */
export function resolveCustomerProfile(merchantId: string, idOrPhone: string): CustomerProfile {
  if (!idOrPhone || idOrPhone === 'unknown') {
    return { contact: 'Unknown customer', isPrivacyId: false }
  }

  if (isMerchantSelfTest(merchantId, idOrPhone)) {
    const digits = idOrPhone.replace(/\D/g, '') || merchantPhoneDigits(merchantId)
    return dashboardTestProfile(digits)
  }

  const entry = lookupEntry(merchantId, idOrPhone)
  if (entry) return buildProfileFromEntry(entry)

  const digits = idOrPhone.replace(/\D/g, '')
  if (!digits) return { contact: 'Unknown customer', isPrivacyId: false }
  if (TEST_PHONE_DIGITS.has(digits)) {
    return dashboardTestProfile(digits)
  }
  return buildProfileFromDigits(digits)
}

/** Map stored customer id or phone to a human-readable label for merchants. */
export function resolveDisplayPhone(merchantId: string, idOrPhone: string): string {
  const profile = resolveCustomerProfile(merchantId, idOrPhone)
  if (profile.name && profile.phone) return `${profile.name} · ${profile.phone}`
  if (profile.name) return profile.name
  return profile.contact
}

/** Resolve WhatsApp JID from opaque customer id or raw phone digits. */
export function resolveCustomerJid(merchantId: string, idOrPhone: string): string | undefined {
  const entry = lookupEntry(merchantId, idOrPhone)
  if (entry?.jid) return entry.jid

  if (isOpaqueCustomerId(idOrPhone)) return undefined

  const digits = idOrPhone.replace(/\D/g, '')
  if (!digits) return undefined
  return customerJid(digits)
}

function formatLocalPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('233') && digits.length >= 12) {
    return `0${digits.slice(3)}`
  }
  if (digits.length >= 9 && digits.length <= 10 && !digits.startsWith('0')) {
    return `0${digits}`
  }
  return phone
}
