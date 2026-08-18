import type { Metadata } from 'next'
import { privatePageMetadata } from '@/lib/seo'

export const metadata: Metadata = privatePageMetadata(
  'Checkout',
  'Complete your order payment securely with Paystack.'
)

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children
}
