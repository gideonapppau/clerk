'use client'

import { DashboardAlerts } from '@/components/dashboard/DashboardAlerts'
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader'
import { ConversationsList } from '@/components/dashboard/ConversationsList'
import { DashboardPageShell } from '@/components/DashboardPageShell'

export default function ConversationsPage() {
  return (
    <DashboardPageShell>
      <DashboardPageHeader
        title="Conversations"
        subtitle="Customer chats and handoffs"
        showCta={false}
      />
      <DashboardAlerts />
      <ConversationsList />
    </DashboardPageShell>
  )
}
