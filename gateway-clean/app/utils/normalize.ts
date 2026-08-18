export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '')
}

/**
 * Digits-only international number for Baileys requestPairingCode.
 * No +, spaces, or punctuation. Ghana local 0XXXXXXXXX → 233XXXXXXXXX.
 */
export function toPairingPhoneDigits(phone: string): string {
  let digits = phone.replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('0') && digits.length === 10) {
    digits = `233${digits.slice(1)}`
  } else if (digits.length === 9 && /^[235]/.test(digits)) {
    digits = `233${digits}`
  }
  return digits
}

export function looksLikeInventoryImport(text: string): boolean {
  if (!text.includes('-')) return false
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  return lines.length > 0 && lines.every((line) => /.+\s-\s\d+/.test(line))
}
