import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Drop malformed / stale Server Action probes so they don't spam logs.
 * Clerk does not use Server Actions; all-zero IDs come from old tabs or bots
 * after a deploy.
 */
export function middleware(request: NextRequest) {
  if (request.method !== 'POST') {
    return NextResponse.next()
  }

  const action = request.headers.get('next-action')
  if (action == null) {
    return NextResponse.next()
  }

  const invalid = action.length === 0 || /^0+$/.test(action)
  if (!invalid) {
    return NextResponse.next()
  }

  return new NextResponse(JSON.stringify({ error: 'STALE_CLIENT', reload: true }), {
    status: 409,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|api/health|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
