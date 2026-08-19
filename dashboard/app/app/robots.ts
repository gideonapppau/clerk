import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl()

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/privacy', '/terms'],
        disallow: [
          '/dashboard',
          '/dashboard/',
          '/login',
          '/onboarding',
          '/onboarding/',
          '/checkout',
          '/checkout/',
          '/founder',
          '/founder/',
          '/gateway',
          '/core',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
