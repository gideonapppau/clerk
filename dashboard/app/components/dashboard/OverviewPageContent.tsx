'use client'

import { useMemo } from 'react'
import { DashboardAlerts } from '@/components/dashboard/DashboardAlerts'
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader'
import { OverviewBody } from '@/components/dashboard/OverviewBody'
import { OverviewHub } from '@/components/dashboard/OverviewHub'
import { OverviewStats } from '@/components/dashboard/OverviewStats'
import { SetupBanner } from '@/components/SetupBanner'
import { useDashboard } from '@/contexts/DashboardContext'
import { routes } from '@/lib/dashboard-routes'

export function OverviewPageContent() {
  const {
    initialLoading,
    setupComplete,
    setupDismissed,
    setSetupDismissed,
    waConnected,
    inventory,
  } = useDashboard()

  const setupSteps = useMemo(
    () => [
      { label: 'Connect WhatsApp', href: routes.whatsapp, done: waConnected },
      { label: 'Add your products', href: routes.inventory, done: inventory.length > 0 },
    ],
    [waConnected, inventory.length]
  )

  return (
    <>
      <DashboardPageHeader showCta={!initialLoading} />
      <DashboardAlerts />
      {!initialLoading && !setupComplete && !setupDismissed && (
        <SetupBanner steps={setupSteps} onDismiss={() => setSetupDismissed(true)} />
      )}
      <OverviewHub />
      {!initialLoading && (
        <>
          <OverviewStats />
          <OverviewBody />
        </>
      )}
    </>
  )
}
