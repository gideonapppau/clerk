import { NextRequest, NextResponse } from 'next/server'

const GATEWAY = process.env.GATEWAY_URL ?? 'http://localhost:3000'

async function handler(req: NextRequest): Promise<NextResponse> {
  const url = req.nextUrl.pathname.replace(/^\/gateway/, '') + (req.nextUrl.search ?? '')
  const target = `${GATEWAY}${url}`

  const headers: Record<string, string> = {}
  req.headers.forEach((v, k) => {
    const key = k.toLowerCase()
    if (key === 'host' || key === 'connection') return
    headers[k] = v
  })

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
      signal: AbortSignal.timeout(60_000),
      // @ts-expect-error Node.js fetch supports duplex
      duplex: 'half',
    })

    const body = await upstream.arrayBuffer()
    const resHeaders = new Headers()
    upstream.headers.forEach((v, k) => {
      if (k.toLowerCase() !== 'transfer-encoding') resHeaders.set(k, v)
    })

    return new NextResponse(body, { status: upstream.status, headers: resHeaders })
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'GATEWAY_ERROR',
          message: "Can't reach Clerk services. Make sure the gateway is running.",
        },
      },
      { status: 502 }
    )
  }
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
