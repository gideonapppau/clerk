const IGNORED_SUFFIXES = ['@g.us', '@broadcast', '@newsletter']

export function customerJid(phone: string): string {
  if (!phone) return ''
  if (phone.includes('@')) return phone
  return `${phone.replace(/\D/g, '')}@s.whatsapp.net`
}

export function phoneFromJid(jid: string): string {
  return jid.split('@')[0].split(':')[0]
}

export function isDirectCustomerJid(jid: string): boolean {
  if (!jid) return false
  if (IGNORED_SUFFIXES.some((s) => jid.endsWith(s))) return false
  return jid.endsWith('@s.whatsapp.net') || jid.endsWith('@lid')
}
