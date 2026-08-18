import type { Response } from 'express'

export function ok(res: Response, data: unknown, status = 200): void {
  res.status(status).json({ success: true, data })
}

export function fail(res: Response, status: number, code: string, message: string): void {
  res.status(status).json({
    success: false,
    error: { code, message }
  })
}
