import type { Metadata } from 'next'
import { privatePageMetadata } from '@/lib/seo'

export const metadata: Metadata = privatePageMetadata(
  'Sign in',
  'Sign in to your Clerk dashboard to manage WhatsApp sales.'
)

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
