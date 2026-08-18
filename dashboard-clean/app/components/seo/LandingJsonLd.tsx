import { LANDING_FAQ } from '@/lib/marketing'
import { getSiteUrl, siteDescription, siteName, siteTagline } from '@/lib/seo'

export function LandingJsonLd() {
  const url = getSiteUrl()

  const graph = [
    {
      '@type': 'WebSite',
      '@id': `${url}/#website`,
      url,
      name: siteName,
      description: siteDescription,
      inLanguage: 'en-GH',
    },
    {
      '@type': 'Organization',
      '@id': `${url}/#organization`,
      name: siteName,
      url,
      description: siteDescription,
      slogan: siteTagline,
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${url}/#software`,
      name: siteName,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: siteDescription,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'GHS',
        description: 'Start free. Connect WhatsApp and test from your dashboard.',
      },
      featureList: [
        'WhatsApp auto-replies for price and stock',
        'Order capture with merchant confirmation',
        'Paystack payment collection',
        'Merchant dashboard for conversations and inventory',
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': `${url}/#faq`,
      mainEntity: LANDING_FAQ.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    },
  ]

  const payload = {
    '@context': 'https://schema.org',
    '@graph': graph,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  )
}
