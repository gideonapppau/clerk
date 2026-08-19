'use client'

import { DashboardAlerts } from '@/components/dashboard/DashboardAlerts'
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader'
import { CustomerQuestionsPanel } from '@/components/dashboard/CustomerQuestionsPanel'
import { WhatsAppPanel } from '@/components/dashboard/WhatsAppPanel'
import { DashboardPageShell } from '@/components/DashboardPageShell'

export default function WhatsAppPage() {
  return (
    <DashboardPageShell>
      <DashboardPageHeader title="WhatsApp" subtitle="Connect your number and test customer questions" showCta={false} />
      <DashboardAlerts />
      <div className="ui-enter grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-start pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <WhatsAppPanel />
        <CustomerQuestionsPanel />
      </div>
    </DashboardPageShell>
  )
}
