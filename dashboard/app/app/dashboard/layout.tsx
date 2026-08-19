import type { Metadata } from 'next'
import { DashboardLayout } from '@/components/DashboardLayout'
import { DashboardProvider } from '@/contexts/DashboardContext'
import { privatePageMetadata } from '@/lib/seo'

export const metadata: Metadata = privatePageMetadata(
  'Dashboard',
  'Manage orders, conversations, inventory, and payments for your WhatsApp shop.'
)

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </DashboardProvider>
  )
}
