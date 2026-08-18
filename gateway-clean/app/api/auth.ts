import crypto from 'node:crypto'
import { env } from '../config/env'

type Payload = {
  merchantId: string
  exp: number
}

function b64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url')
}

function timingSafeEqual(a: string, b: string): boolean {
  // Pad to equal length before comparing — timingSafeEqual requires same-length buffers.
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return crypto.timingSafeEqual(aBuf, bBuf)
}

function parse(token: string): Payload | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null

  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString()) as Payload
    const sig = crypto.createHmac('sha256', env.jwtSecret).update(`${parts[0]}.${parts[1]}`).digest('base64url')
    if (!timingSafeEqual(sig, parts[2])) return null
    if (payload.exp * 1000 < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export function verifyToken(token: string): string | null {
  const payload = parse(token)
  return payload?.merchantId ?? null
}
