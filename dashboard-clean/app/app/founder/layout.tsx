import type { Metadata } from 'next'
import { FounderGate } from '@/components/founder/FounderGate'
import { FounderShell } from '@/components/founder/FounderShell'
import { privatePageMetadata } from '@/lib/seo'

export const metadata: Metadata = privatePageMetadata('Founder', 'Internal founder metrics for Clerk.')

export default function FounderLayout({ children }: { children: React.ReactNode }) {
  return (
    <FounderGate>
      <FounderShell>{children}</FounderShell>
    </FounderGate>
  )
}
