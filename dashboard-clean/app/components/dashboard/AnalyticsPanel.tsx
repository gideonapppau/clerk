'use client'

import { useDashboard } from '@/contexts/DashboardContext'
import { formatProductName } from '@/lib/format'

export function AnalyticsPanel() {
  const { conversations, orders } = useDashboard()

  // Top product by order count
  const productCounts: Record<string, number> = {}
  for (const o of orders) {
    const name = o.items?.[0]?.product
    if (name) productCounts[name] = (productCounts[name] ?? 0) + 1
  }
  const topProduct = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  const confirmed = orders.filter(o => o.status === 'confirmed').length

  const stats = [
    { label: 'Conversations', value: String(conversations.length), icon: 'chat_bubble',  color: 'bg-clerk-light text-clerk-primary-dark' },
    { label: 'Orders',        value: String(orders.length),         icon: 'receipt_long', color: 'bg-slate-100 text-slate-600' },
    { label: 'Confirmed',     value: String(confirmed),             icon: 'check_circle', color: 'bg-clerk-light text-clerk-primary-darker' },
    ...(topProduct
      ? [{ label: 'Top product', value: formatProductName(topProduct), icon: 'star', color: 'bg-slate-100 text-slate-600' }]
      : []),
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 ui-enter">
      {stats.map(({ label, value, icon, color }) => (
        <div key={label} className="bg-white rounded-2xl border border-slate-200 shadow-[0_8px_40px_rgba(15,23,42,0.07)] p-4">
          <div className={`size-7 rounded-lg flex items-center justify-center mb-3 ${color}`}>
            <span className="material-symbols-outlined ms-icon-filled" style={{ fontSize: 14 }}>{icon}</span>
          </div>
          <p className="text-[11px] font-medium text-slate-500 mb-0.5">{label}</p>
          <p className="text-xl font-extrabold text-slate-900 font-display tabular-nums truncate">{value}</p>
        </div>
      ))}
    </div>
  )
}
