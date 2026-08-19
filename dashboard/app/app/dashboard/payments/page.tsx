'use client'

import { DashboardAlerts } from '@/components/dashboard/DashboardAlerts'
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader'
import { PaymentsPanel } from '@/components/dashboard/PaymentsPanel'
import { DashboardPageShell } from '@/components/DashboardPageShell'

export default function PaymentsPage() {
  return (
    <DashboardPageShell>
      <DashboardPageHeader
        title="Payments"
        subtitle="How customers pay you. Money goes directly to your account."
        showCta={false}
      />
      <DashboardAlerts />
      <PaymentsPanel />
    </DashboardPageShell>
  )
}
