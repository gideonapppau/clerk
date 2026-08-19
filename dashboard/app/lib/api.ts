const BASE = '/gateway'

import {
  ApiClientError,
  formatUserError,
  parseApiError,
  wrapFetchError,
} from '@/lib/errors'

export type ApiError = { code: string; message: string }

export { ApiClientError, formatUserError }

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('clerk_token')
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem('clerk_token', token)
  else localStorage.removeItem('clerk_token')
}

async function parseResponse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw parseApiError(res.status, body)
  }
  const wrapped = body as { success?: boolean; data?: T; error?: ApiError }
  if (wrapped.success === false && wrapped.error) {
    throw parseApiError(res.status, body)
  }
  if (wrapped.success === true && wrapped.data !== undefined) return wrapped.data
  return body as T
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
  auth = true
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  }
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  try {
    const res = await fetch(`${BASE}${path}`, { ...options, headers })
    return parseResponse<T>(res)
  } catch (err) {
    throw wrapFetchError(err)
  }
}

export type LoginResult = { token: string }
export type RegisterResult = { merchantId: string; token: string }
export type ReachoutAlert = {
  restricted: boolean
  reason?: string
  message: string
  endsAt?: string | null
  since?: string
}

export type MeResult = {
  id: string
  businessName: string
  businessScope?: string
  email?: string
  plan: string
  reachout?: ReachoutAlert | null
}

export type BillingUsage = {
  effectivePlan: string
  repliesUsed: number
  repliesLimit: number
  repliesPeriod: string
  repliesRemaining: number
  productsUsed: number
  productsLimit: number
  canSendReplies: boolean
  canAddProducts: boolean
}

export type BillingStatus = {
  planSlug: string
  status: string
  currentPeriodEnd?: string
  paystackConfigured: boolean
  usage?: BillingUsage
}

export type BillingCheckoutResult = {
  authorizationUrl: string
  reference: string
  plan: string
  amountGhs: number
}

export type WhatsAppSession = {
  sessionId: string
  status: string
  connected: boolean
  phone: string | null
  qr: string | null
  pairingCode: string | null
  conflict?: 'PHONE_IN_USE' | null
  reachout?: {
    restricted: boolean
    reason?: 'ack_463' | 'reachout_timelock' | 'companion_restricted'
    message: string
    endsAt?: string | null
    since?: string
  } | null
}

export type InventoryItem = {
  id: string
  name: string
  price: number
  stock: number
  category?: string
  description?: string
  isService?: boolean
  unit?: string
  unlimitedStock?: boolean
}

export type InventoryItemInput = {
  name: string
  price: number
  stock?: number
  category?: string
  description?: string
  isService?: boolean
  unit?: string
  unlimitedStock?: boolean
}

export type InventoryItemPatch = {
  name?: string
  price?: number
  stock?: number
  category?: string
  description?: string
  isService?: boolean
  unit?: string
  unlimitedStock?: boolean
}

export type Conversation = {
  id: string
  customer: string
  customerDisplay?: string
  customerName?: string
  customerContact?: string
  customerPhoneDisplay?: string
  customerChatUrl?: string
  customerChatDeepLink?: string
  customerPrivacyHidden?: boolean
  mode: string
  status?: string
  lastMessage: string
}

export type ConversationMessage = {
  id: string
  role: 'customer' | 'assistant' | 'merchant'
  text: string
  createdAt: string
}

export type ConversationTimelineStep = {
  kind: 'intent' | 'event'
  label: string
  createdAt: string
}

export type ConversationDetail = {
  conversation: {
    id: string
    customer: string
    customerDisplay?: string
    customerName?: string
    customerContact?: string
    customerPhoneDisplay?: string
    customerChatUrl?: string
    customerChatDeepLink?: string
    customerPrivacyHidden?: boolean
    mode: string
    status: string
    state: string
    current: string
    summary: string
    context: Record<string, unknown>
    updatedAt: string
  }
  messages: ConversationMessage[]
  intent_history: {
    id: string
    intent: string
    label: string
    customerText: string
    createdAt: string
  }[]
  timeline: ConversationTimelineStep[]
  order: {
    id: string
    customerPhone: string
    productName: string
    quantity: number
    subtotal: number
    status: string
    createdAt: string
  } | null
}

export async function login(email: string, password: string): Promise<LoginResult> {
  return api<LoginResult>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }, false)
}

export async function register(
  businessName: string,
  email: string,
  password: string
): Promise<RegisterResult> {
  return api<RegisterResult>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({ businessName, email, password })
  }, false)
}

export async function getMe(): Promise<MeResult> {
  return api<MeResult>('/api/v1/me')
}

export async function updateMe(patch: { businessName?: string; businessScope?: string }): Promise<{ businessName?: string; businessScope?: string }> {
  return api<{ businessName?: string; businessScope?: string }>('/api/v1/me', {
    method: 'PATCH',
    body: JSON.stringify(patch)
  })
}

export async function createWhatsAppSession(phone?: string): Promise<WhatsAppSession> {
  return api<WhatsAppSession>('/api/v1/whatsapp/session', {
    method: 'POST',
    body: JSON.stringify(phone ? { phone } : {})
  })
}

export async function refreshWhatsAppSession(): Promise<WhatsAppSession> {
  return api<WhatsAppSession>('/api/v1/whatsapp/session')
}

export async function getWhatsAppStatus(): Promise<WhatsAppSession> {
  return api<WhatsAppSession>('/api/v1/whatsapp/status')
}

export async function disconnectWhatsApp(): Promise<void> {
  await api('/api/v1/whatsapp/session', { method: 'DELETE' })
}

export async function listInventory(): Promise<{ items: InventoryItem[] }> {
  return api<{ items: InventoryItem[] }>('/api/v1/inventory')
}

export async function createInventoryItem(input: InventoryItemInput): Promise<InventoryItem> {
  return api<InventoryItem>('/api/v1/inventory', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function importInventory(rawText: string): Promise<{ inserted: number; items: InventoryItem[] }> {
  return api<{ inserted: number; items: InventoryItem[] }>('/api/v1/inventory/import', {
    method: 'POST',
    body: JSON.stringify({ rawText })
  })
}

export async function updateInventoryItem(
  id: string,
  patch: InventoryItemPatch
): Promise<InventoryItem> {
  return api<InventoryItem>(`/api/v1/inventory/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch)
  })
}

export type Order = {
  id: string
  customerPhone: string
  customerPhoneDisplay?: string
  customerName?: string
  customerContact?: string
  customerChatUrl?: string
  customerChatDeepLink?: string
  customerPrivacyHidden?: boolean
  status: string
  subtotal: number
  createdAt?: string
  conversationId?: string
  items?: { product: string; qty: number; price: number }[]
}

export async function listOrders(): Promise<{ orders: Order[] }> {
  return api<{ orders: Order[] }>('/api/v1/orders')
}

export async function confirmOrder(orderId: string): Promise<{
  order: { id: string; status: string; customerPhone: string }
  customerMessage: string
  notifyCustomer?: boolean
}> {
  return api(`/api/v1/orders/${orderId}/confirm`, { method: 'POST' })
}

export async function cancelOrder(orderId: string): Promise<{
  order: { id: string; status: string; customerPhone?: string }
  customerMessage: string
  notifyCustomer?: boolean
}> {
  return api(`/api/v1/orders/${orderId}/cancel`, { method: 'POST' })
}

export async function sendCustomerMessage(
  customerPhone: string,
  text: string,
  options?: { recordInCore?: boolean }
): Promise<void> {
  await api('/api/v1/whatsapp/send', {
    method: 'POST',
    body: JSON.stringify({
      customerPhone,
      text,
      recordInCore: options?.recordInCore ?? true,
    }),
  })
}

export async function listConversations(): Promise<{ conversations: Conversation[] }> {
  return api<{ conversations: Conversation[] }>('/api/v1/conversations')
}

export async function getConversation(conversationId: string): Promise<ConversationDetail> {
  return api<ConversationDetail>(`/api/v1/conversations/${conversationId}`)
}

export async function resumeConversation(conversationId: string): Promise<{ mode: string }> {
  return api<{ mode: string }>(`/api/v1/conversations/${conversationId}/resume`, {
    method: 'POST'
  })
}

export async function takeoverConversation(conversationId: string): Promise<{ mode: string }> {
  return api<{ mode: string }>(`/api/v1/conversations/${conversationId}/takeover`, {
    method: 'POST'
  })
}

export type PaymentMethodType = 'manual' | 'momo' | 'paystack' | 'moolre'

export type PaymentMethod = {
  type: PaymentMethodType
  provider: string
  number: string
  isDefault: boolean
}

export type PaymentMethodsResult = { methods: PaymentMethod[] }
export type PaymentConfig = { connected: boolean }

export async function listPaymentMethods(): Promise<PaymentMethodsResult> {
  return api<PaymentMethodsResult>('/api/v1/payments/methods')
}

export async function saveMomoMethod(provider: string, number: string): Promise<{ saved: boolean }> {
  return api('/api/v1/payments/methods/momo', {
    method: 'POST',
    body: JSON.stringify({ provider, number })
  })
}

export async function removeMomoMethod(): Promise<{ removed: boolean }> {
  return api('/api/v1/payments/methods/momo', { method: 'DELETE' })
}

export async function setDefaultPaymentMethod(type: PaymentMethodType): Promise<{ default: string }> {
  return api('/api/v1/payments/methods/default', {
    method: 'POST',
    body: JSON.stringify({ type })
  })
}

export async function getPaymentConfig(): Promise<PaymentConfig> {
  return api<PaymentConfig>('/api/v1/payments/config')
}

export async function savePaymentConfig(secretKey: string, publicKey: string): Promise<PaymentConfig> {
  return api<PaymentConfig>('/api/v1/payments/config', {
    method: 'POST',
    body: JSON.stringify({ secretKey, publicKey })
  })
}

export async function disconnectPayment(): Promise<PaymentConfig> {
  return api<PaymentConfig>('/api/v1/payments/config', { method: 'DELETE' })
}

export type MoolreConfig = { connected: boolean; accountNumber?: string; sandbox?: boolean }

export async function getMoolreConfig(): Promise<MoolreConfig> {
  return api<MoolreConfig>('/api/v1/payments/moolre')
}

export async function saveMoolreConfig(accountNumber: string): Promise<MoolreConfig> {
  return api<MoolreConfig>('/api/v1/payments/moolre', {
    method: 'POST',
    body: JSON.stringify({ accountNumber }),
  })
}

export async function provisionMoolreWallet(settlementPhone: string): Promise<MoolreConfig> {
  return api<MoolreConfig>('/api/v1/payments/moolre/provision', {
    method: 'POST',
    body: JSON.stringify({ settlementPhone }),
  })
}

export async function disconnectMoolre(): Promise<MoolreConfig> {
  return api<MoolreConfig>('/api/v1/payments/moolre', { method: 'DELETE' })
}

export async function getBillingStatus(): Promise<BillingStatus> {
  return api<BillingStatus>('/api/v1/billing/status')
}

export async function startBillingCheckout(plan: 'starter' | 'growth'): Promise<BillingCheckoutResult> {
  return api<BillingCheckoutResult>('/api/v1/billing/checkout', {
    method: 'POST',
    body: JSON.stringify({ plan })
  })
}

export async function verifyBillingPayment(reference: string): Promise<BillingStatus> {
  return api<BillingStatus>('/api/v1/billing/verify', {
    method: 'POST',
    body: JSON.stringify({ reference })
  })
}

export async function cancelBillingPlan(): Promise<BillingStatus> {
  return api<BillingStatus>('/api/v1/billing/cancel', { method: 'POST' })
}

export async function markOrderPaid(orderId: string): Promise<{ paid: boolean }> {
  return api(`/api/v1/orders/${orderId}/paid`, { method: 'PATCH' })
}

export type SimulateResult = {
  reply?: string
  intent?: string
  route?: string
  conversationId?: string
  escalate?: boolean
  escalateReason?: string
  testsRemainingThisHour?: number
  customerPhone?: string
}

export async function simulateMessage(text: string): Promise<SimulateResult> {
  return api<SimulateResult>('/api/v1/simulate', {
    method: 'POST',
    body: JSON.stringify({ text })
  })
}

export type PushConfig = { enabled: boolean; publicKey?: string }
export type PushStatus = { configured: boolean; subscribed: boolean }

export async function getPushConfig(): Promise<PushConfig> {
  return api<PushConfig>('/api/v1/push/config')
}

export async function getPushStatus(): Promise<PushStatus> {
  return api<PushStatus>('/api/v1/push/status')
}

export async function subscribePush(body: {
  endpoint: string
  p256dh: string
  auth: string
  userAgent?: string
}): Promise<{ subscribed: boolean }> {
  return api('/api/v1/push/subscribe', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function unsubscribePush(endpoint: string): Promise<{ subscribed: boolean }> {
  return api('/api/v1/push/subscribe', {
    method: 'DELETE',
    body: JSON.stringify({ endpoint }),
  })
}

export type PushTestResult = { devices: number; sent: number; failed: number }

export async function sendTestPush(): Promise<PushTestResult> {
  return api('/api/v1/push/test', { method: 'POST' })
}
