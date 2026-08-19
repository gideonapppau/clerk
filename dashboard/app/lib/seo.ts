import type { Metadata } from 'next'
import { clerkTagline } from '@/lib/brand'

export const siteName = 'Clerk'

export const siteDescription =
  'Clerk is a WhatsApp sales assistant for merchants. Answer price and stock questions, capture orders, and collect payments, even when you are busy.'

export const siteTagline = clerkTagline

export const siteKeywords = [
  'WhatsApp sales assistant',
  'WhatsApp shop',
  'WhatsApp ecommerce',
  'sell on WhatsApp',
  'Ghana ecommerce',
  'Paystack checkout',
  'order management',
  'small business automation',
  'Clerk',
] as const

export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    process.env.VERCEL_URL ??
    'http://localhost:3001'
  const withProtocol = raw.startsWith('http') ? raw : `https://${raw}`
  return withProtocol.replace(/\/$/, '')
}

type PageMetaOptions = {
  title?: string
  description?: string
  path?: string
  keywords?: string[]
  noIndex?: boolean
  ogImage?: string
}

export function createPageMetadata({
  title,
  description = siteDescription,
  path = '',
  keywords = [...siteKeywords],
  noIndex = false,
  ogImage,
}: PageMetaOptions = {}): Metadata {
  const url = `${getSiteUrl()}${path}`
  const fullTitle = title ? `${title} | ${siteName}` : `${siteName} | ${siteTagline}`
  const image = ogImage ?? `${getSiteUrl()}/opengraph-image`

  return {
    title: title ?? fullTitle,
    description,
    keywords,
    metadataBase: new URL(getSiteUrl()),
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
        },
    openGraph: {
      type: 'website',
      locale: 'en_GH',
      url,
      siteName,
      title: fullTitle,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
    },
    category: 'technology',
  }
}

export function privatePageMetadata(title: string, description?: string): Metadata {
  return createPageMetadata({ title, description, noIndex: true })
}
