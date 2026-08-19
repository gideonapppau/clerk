import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque } from 'next/font/google'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import { clerkPrimary } from '@/lib/brand'
import { PwaRegistrar } from '@/components/PwaRegistrar'
import {
  createPageMetadata,
  getSiteUrl,
  siteDescription,
  siteName,
  siteTagline,
} from '@/lib/seo'
import './globals.css'

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
})

export const metadata: Metadata = {
  ...createPageMetadata({
    description: siteDescription,
    path: '/',
  }),
  applicationName: siteName,
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  formatDetection: { email: false, address: false, telephone: false },
  appleWebApp: {
    capable: true,
    title: siteName,
    statusBarStyle: 'default',
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/apple-icon', sizes: '180x180', type: 'image/png' }],
    shortcut: '/icon.svg',
  },
  manifest: '/manifest.webmanifest',
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${siteName} | ${siteTagline}`,
    template: `%s | ${siteName}`,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: clerkPrimary },
    { media: '(prefers-color-scheme: dark)', color: '#075E54' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-GH"
      className={`${GeistSans.variable} ${GeistMono.variable} ${bricolage.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body
        className={`${GeistSans.className} bg-slate-50 text-slate-900 antialiased`}
        suppressHydrationWarning
      >
        <PwaRegistrar />
        {children}
      </body>
    </html>
  )
}
