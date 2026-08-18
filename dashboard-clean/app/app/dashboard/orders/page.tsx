'use client'

import { Suspense } from 'react'
import { DashboardAlerts } from '@/components/dashboard/DashboardAlerts'
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader'
import { OrdersPanel } from '@/components/dashboard/OrdersPanel'
import { DashboardPageShell } from '@/components/DashboardPageShell'

export default function OrdersPage() {
  return (
    <DashboardPageShell>
      <DashboardPageHeader title="Orders" subtitle="Confirm or decline customer purchases" showCta={false} />
      <DashboardAlerts />
      <Suspense fallback={null}>
        <OrdersPanel />
      </Suspense>
    </DashboardPageShell>
  )
}
