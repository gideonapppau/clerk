import type { Metadata } from 'next'
import { LandingJsonLd } from '@/components/seo/LandingJsonLd'
import { LandingPage } from '@/components/landing/LandingPage'
import { createPageMetadata, siteDescription, siteTagline } from '@/lib/seo'

export const metadata: Metadata = createPageMetadata({
  title: `WhatsApp sales assistant for your shop`,
  description: `${siteTagline} ${siteDescription}`,
  path: '/',
})

export default function HomePage() {
  return (
    <>
      <LandingJsonLd />
      <LandingPage />
    </>
  )
}
