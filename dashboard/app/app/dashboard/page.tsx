'use client'

import { OverviewPageContent } from '@/components/dashboard/OverviewPageContent'
import { DashboardPageShell } from '@/components/DashboardPageShell'

export default function OverviewPage() {
  return (
    <DashboardPageShell>
      <OverviewPageContent />
    </DashboardPageShell>
  )
}
