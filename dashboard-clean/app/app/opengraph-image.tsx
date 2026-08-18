import { ImageResponse } from 'next/og'
import { ClerkLogoMark } from '@/components/seo/ClerkLogoMark'
import { siteTagline } from '@/lib/seo'

export const alt = `Clerk: ${siteTagline}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: 'linear-gradient(135deg, #ecfdf5 0%, #f8fafc 45%, #ffffff 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 112,
              height: 112,
              borderRadius: 28,
              background: '#ffffff',
              boxShadow: '0 12px 40px rgba(15, 23, 42, 0.08)',
            }}
          >
            <ClerkLogoMark size={80} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{
                fontSize: 72,
                fontWeight: 800,
                letterSpacing: '-0.04em',
                color: '#0f172a',
              }}
            >
              Clerk
            </div>
            <div style={{ fontSize: 30, fontWeight: 600, color: '#128C7E' }}>{siteTagline}</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 760 }}>
          <div
            style={{
              fontSize: 36,
              fontWeight: 600,
              lineHeight: 1.35,
              color: '#334155',
            }}
          >
            WhatsApp sales assistant for merchants
          </div>
          <div style={{ fontSize: 22, color: '#64748b' }}>
            Answer questions, capture orders, and get paid, even when you&apos;re busy.
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
