export type ConnectionStatus = 'idle' | 'connecting' | 'qr' | 'connected' | 'disconnected'

export type SessionConflict = 'PHONE_IN_USE'

export type ReachoutSnapshot = {
  restricted: boolean
  reason?: 'ack_463' | 'reachout_timelock' | 'companion_restricted'
  message: string
  endsAt?: string | null
  since?: string
}

export type SessionSnapshot = {
  merchantId: string
  status: ConnectionStatus
  qr?: string
  pairingCode?: string
  phone?: string
  conflict?: SessionConflict
  reachout?: ReachoutSnapshot | null
}

export type InboundMessage = {
  merchantId: string
  customerPhone: string
  text: string
  messageId?: string
}

export type CoreMessagePayload = {
  merchantId: string
  customerPhone: string
  text: string
  messageKind: 'customer_message' | 'inventory_import' | 'dashboard_simulate'
}

export type DispatchBriefing = {
  customer: string
  status: string
  intent?: string
  product?: string
  reason?: string
  summary?: string
  suggested_next_step?: string
  orderId?: string
  subtotal?: number
}

export type OrderSummary = {
  id: string
  customerPhone: string
  productName: string
  quantity: number
  subtotal: number
  status: string
}

export type EventSummary = {
  id: string
  type: string
  data?: Record<string, unknown>
}

export type CoreMessageResponse = {
  route: 'bot' | 'dispatch' | 'system'
  reply?: string
  intent?: string
  conversationId?: string
  owner?: string
  status?: string
  briefing?: DispatchBriefing
  escalate?: boolean
  escalateReason?: string
  order?: OrderSummary
  event?: EventSummary
  resendPaymentLink?: boolean
}
