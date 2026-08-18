'use client'

import { DashboardAlerts } from '@/components/dashboard/DashboardAlerts'
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader'
import { InventoryPanel } from '@/components/dashboard/InventoryPanel'
import { DashboardPageShell } from '@/components/DashboardPageShell'

export default function InventoryPage() {
  return (
    <DashboardPageShell>
      <DashboardPageHeader title="Inventory" subtitle="Items Clerk can sell on WhatsApp" showCta={false} />
      <DashboardAlerts />
      <InventoryPanel />
    </DashboardPageShell>
  )
}
