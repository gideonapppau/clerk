import { ImageResponse } from 'next/og'
import { ClerkLogoMark } from '@/components/seo/ClerkLogoMark'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon512() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          borderRadius: 96,
        }}
      >
        <ClerkLogoMark size={380} />
      </div>
    ),
    { ...size }
  )
}
