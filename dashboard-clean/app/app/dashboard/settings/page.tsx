'use client'

import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader'
import { SettingsPanel } from '@/components/dashboard/SettingsPanel'
import { DashboardPageShell } from '@/components/DashboardPageShell'

export default function SettingsPage() {
  return (
    <DashboardPageShell>
      <DashboardPageHeader title="Settings" subtitle="Your shop and preferences" showCta={false} />
      <SettingsPanel />
    </DashboardPageShell>
  )
}
