import fs from 'fs'
import path from 'path'
import { env } from '../config/env'
import { isMerchantUUID } from '../utils/uuid'

export type SessionMeta = {
  registered: boolean
  phone?: string
}

export function sessionPath(merchantId: string): string {
  if (!isMerchantUUID(merchantId)) {
    throw new Error('invalid merchantId')
  }
  return path.join(env.sessionDir, merchantId)
}

export function ensureSessionDir(): void {
  fs.mkdirSync(env.sessionDir, { recursive: true })
}

export function hasSession(merchantId: string): boolean {
  return fs.existsSync(sessionPath(merchantId))
}

export function readSessionMeta(merchantId: string): SessionMeta | null {
  const dir = sessionPath(merchantId)
  // Prefer single-file auth (session.json); fall back to legacy multi-file creds.json.
  const candidates = [path.join(dir, 'session.json'), path.join(dir, 'creds.json')]

  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as {
        creds?: { registered?: boolean; me?: { id?: string } }
        registered?: boolean
        me?: { id?: string }
      }
      const creds = parsed.creds ?? parsed
      const registered = creds.registered === true || !!creds.me?.id
      const phone = creds.me?.id ? creds.me.id.split(':')[0]?.split('@')[0] : undefined
      return { registered, phone }
    } catch {
      /* try next */
    }
  }

  return null
}

export function hasRegisteredSession(merchantId: string): boolean {
  return readSessionMeta(merchantId)?.registered === true
}

export function listRegisteredMerchants(): string[] {
  if (!fs.existsSync(env.sessionDir)) {
    return []
  }

  return fs
    .readdirSync(env.sessionDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && isMerchantUUID(d.name))
    .map((d) => d.name)
    .filter((merchantId) => hasRegisteredSession(merchantId))
}

export function clearSession(merchantId: string): void {
  const dir = sessionPath(merchantId)
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}
