const BASE = '/gateway'
const FOUNDER_KEY = 'clerk_founder_key'
const FOUNDER_FETCH_TIMEOUT_MS = 45_000

import { ApiClientError, parseApiError, wrapFetchError } from '@/lib/errors'

export type FounderRange = 0 | 7 | 30 | 90

export const FOUNDER_RANGES: { value: FounderRange; label: string }[] = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
  { value: 0, label: 'All time' },
]

export function getFounderKey(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(FOUNDER_KEY)
}

export function setFounderKey(key: string | null): void {
  if (typeof window === 'undefined') return
  if (key) sessionStorage.setItem(FOUNDER_KEY, key)
  else sessionStorage.removeItem(FOUNDER_KEY)
}

function withDays(path: string, days: FounderRange): string {
  return days > 0 ? `${path}?days=${days}` : path
}

function createTimeoutSignal(timeoutMs: number): {
  signal?: AbortSignal
  cleanup: () => void
  timedOut: () => boolean
} {
  if (typeof AbortController === 'undefined') {
    return { signal: undefined, cleanup: () => {}, timedOut: () => false }
  }

  const controller = new AbortController()
  let didTimeout = false
  const timer = window.setTimeout(() => {
    didTimeout = true
    controller.abort()
  }, timeoutMs)

  return {
    signal: controller.signal,
    cleanup: () => window.clearTimeout(timer),
    timedOut: () => didTimeout,
  }
}

function lockFounderConsole(): void {
  setFounderKey(null)
  if (typeof window !== 'undefined') {
    window.location.href = '/founder'
  }
}

async function founderFetch<T>(
  path: string,
  init?: { method?: string; body?: unknown }
): Promise<T> {
  const key = getFounderKey()
  if (!key) {
    throw new ApiClientError('FOUNDER_KEY_REQUIRED', 401, 'Enter your founder key to continue.')
  }

  const timeout = createTimeoutSignal(FOUNDER_FETCH_TIMEOUT_MS)
  try {
    const headers: Record<string, string> = { Authorization: `Bearer ${key}` }
    if (init?.body !== undefined) headers['Content-Type'] = 'application/json'
    const res = await fetch(`${BASE}${path}`, {
      method: init?.method ?? 'GET',
      headers,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: 'no-store',
      signal: timeout.signal,
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      const wrapped = body as { error?: { code?: string } }
      if (res.status === 401) {
        lockFounderConsole()
        throw new ApiClientError('FOUNDER_UNAUTHORIZED', 401, 'Wrong founder key.')
      }
      if (res.status === 503 && wrapped.error?.code === 'NOT_CONFIGURED') {
        throw new ApiClientError('FOUNDER_NOT_CONFIGURED', 503, 'Founder API not configured on Core.')
      }
      throw parseApiError(res.status, body)
    }
    const wrapped = body as { success?: boolean; data?: T }
    if (wrapped.success === true && wrapped.data !== undefined) return wrapped.data
    return body as T
  } catch (err) {
    if (timeout.timedOut() || (err instanceof DOMException && err.name === 'TimeoutError')) {
      throw new ApiClientError(
        'GATEWAY_ERROR',
        504,
        'Metrics took too long. Services may be waking up. Try again in a moment.'
      )
    }
    throw wrapFetchError(err)
  } finally {
    timeout.cleanup()
  }
}

export type FounderDashboardData = {
  overview: FounderOverview | null
  funnel: FounderFunnel | null
  conversationFunnel: FounderConversationFunnel | null
  friction: FounderFriction | null
  latency: FounderReplyLatency | null
  dropOffs: FounderDropOffs | null
  peakHours: FounderPeakHours | null
  unitEconomics: FounderUnitEconomics | null
  timeseries: FounderTimeseries | null
  reliability: FounderReliability | null
  partialErrors: string[]
}

function settleError(err: unknown): string {
  if (err instanceof ApiClientError) return err.message
  return 'Request failed'
}

/** Loads all founder dashboard endpoints; tolerates individual failures. */
export async function fetchFounderDashboard(days: FounderRange): Promise<FounderDashboardData> {
  const reliabilityDays = days === 0 ? 7 : days
  const peakDays = days === 0 ? 30 : days
  const [
    overviewR,
    funnelR,
    conversationFunnelR,
    frictionR,
    latencyR,
    dropOffsR,
    peakHoursR,
    unitEconomicsR,
    timeseriesR,
    reliabilityR,
  ] = await Promise.allSettled([
    fetchFounderOverview(days),
    fetchFounderFunnel(days),
    fetchFounderConversationFunnel(days),
    fetchFounderFriction(days),
    fetchFounderLatency(days),
    fetchFounderDropOffs(days),
    fetchFounderPeakHours(peakDays as FounderRange),
    fetchFounderUnitEconomics(days),
    fetchFounderTimeseries(days),
    fetchFounderReliability(reliabilityDays),
  ])

  const partialErrors: string[] = []
  const pick = <T>(r: PromiseSettledResult<T>, label: string): T | null => {
    if (r.status === 'fulfilled') return r.value
    partialErrors.push(`${label}: ${settleError(r.reason)}`)
    return null
  }

  const data: FounderDashboardData = {
    overview: pick(overviewR, 'Overview'),
    funnel: pick(funnelR, 'Funnel'),
    conversationFunnel: pick(conversationFunnelR, 'Conversation funnel'),
    friction: pick(frictionR, 'Friction'),
    latency: pick(latencyR, 'Reply latency'),
    dropOffs: pick(dropOffsR, 'Drop-offs'),
    peakHours: pick(peakHoursR, 'Peak hours'),
    unitEconomics: pick(unitEconomicsR, 'Unit economics'),
    timeseries: pick(timeseriesR, 'Trend'),
    reliability: pick(reliabilityR, 'Reliability'),
    partialErrors,
  }

  if (!data.overview && !data.funnel) {
    const first = partialErrors[0] ?? "Couldn't load founder metrics."
    const err = [overviewR, funnelR].find((r) => r.status === 'rejected')?.reason
    if (err instanceof ApiClientError) throw err
    throw new ApiClientError('GATEWAY_ERROR', 502, first)
  }

  return data
}

export type FounderGatewaySessions = {
  available: boolean
  registered: number
  live: number
  connecting: number
  qr: number
  stale: number
  conflict: number
  degraded: boolean
}

export type FounderOverview = {
  merchants: number
  everLinked: number
  socketOnline: number
  connected: number
  orders: number
  paidOrders: number
  conversionPct: number
  paymentPct: number
  revenue: number
  errors7d: number
  gatewayHealthy: boolean
  gatewayLatencyMs: number
  gatewayWhatsAppHealthy: boolean
  gatewaySessions: FounderGatewaySessions
}

export type FounderFunnel = {
  signup: number
  connected: number
  inventory: number
  firstReply: number
  firstOrder: number
  paid: number
}

export type FounderFriction = {
  humanHandoffPct: number
  humanHandoffCount: number
  activeSessions: number
  ttfvHours?: number
  ttfvMerchantCount: number
  unpaidCart: {
    beforePaymentLink: number
    afterPaymentLink: number
    pendingMerchant: number
    cancelledExpired: number
  }
  quotaVelocityPerDay: number
  quotaVelocityMerchants: number
}

export type FounderReplyLatencySummary = {
  sampleCount: number
  avgMs: number
  p50Ms: number
  p95Ms: number
  p99Ms: number
}

export type FounderMerchantReplyLatency = {
  merchantId: string
  merchantName: string
  sampleCount: number
  avgMs: number
  p95Ms: number
}

export type FounderReplyLatency = {
  days: number
  platform: FounderReplyLatencySummary
  merchants: FounderMerchantReplyLatency[]
}

export type FounderDropOffOrder = {
  orderId: string
  merchantId: string
  merchantName: string
  conversationId?: string
  customerPhone: string
  productName: string
  totalAmount: number
  status: string
  createdAt: string
  updatedAt: string
}

export type FounderDropOffs = {
  count: number
  orders: FounderDropOffOrder[]
}

export type FounderReplayMessage = {
  id: string
  sender: string
  body: string
  createdAt: string
}

export type FounderConversationFunnelStage = {
  key: string
  label: string
  count: number
}

export type FounderConversationFunnel = {
  days: number
  stages: FounderConversationFunnelStage[]
}

export type FounderPeakHourBucket = {
  hour: number
  count: number
}

export type FounderPeakHours = {
  days: number
  totalMessages: number
  overnightCount: number
  overnightPct: number
  peakHour: number
  peakHourCount: number
  hours: FounderPeakHourBucket[]
}

export type FounderMerchantUnitEconomics = {
  merchantId: string
  merchantName: string
  replyCount: number
  llmCalls: number
  promptTokens: number
  completionTokens: number
  llmCostUsd: number
  orderRevenueGhs: number
  paidOrders: number
  hostingAllocUsd: number
  estMarginUsd: number
}

export type FounderUnitEconomicsSummary = {
  totalReplies: number
  totalLlmCalls: number
  totalLlmCostUsd: number
  totalOrderRevenueGhs: number
  hostingUsdMonth: number
  estPlatformMarginUsd: number
}

export type FounderUnitEconomics = {
  days: number
  ghsPerUsd: number
  summary: FounderUnitEconomicsSummary
  merchants: FounderMerchantUnitEconomics[]
}

export type FounderTimeseriesPoint = {
  date: string
  signups: number
  orders: number
  revenue: number
}

export type FounderTimeseries = {
  days: number
  points: FounderTimeseriesPoint[]
}

export type MerchantHealthRow = {
  id: string
  name: string
  email: string
  socketOnline: boolean
  whatsappLinked: boolean
  connected: boolean
  hasInventory: boolean
  hasFirstOrder: boolean
  hasSimulatedOrder: boolean
  hasPaid: boolean
  active: boolean
  createdAt: string
  connectedAt?: string
  firstOrderAt?: string
  hoursToFirstOrder?: number
  slowActivation: boolean
}

export function fetchFounderOverview(days: FounderRange = 0): Promise<FounderOverview> {
  return founderFetch<FounderOverview>(withDays('/api/v1/founder/overview', days))
}

export function fetchFounderFunnel(days: FounderRange = 0): Promise<FounderFunnel> {
  return founderFetch<FounderFunnel>(withDays('/api/v1/founder/funnel', days))
}

export function fetchFounderFriction(days: FounderRange = 0): Promise<FounderFriction> {
  return founderFetch<FounderFriction>(withDays('/api/v1/founder/friction', days))
}

export function fetchFounderLatency(days: FounderRange = 30): Promise<FounderReplyLatency> {
  return founderFetch<FounderReplyLatency>(withDays('/api/v1/founder/latency', days))
}

export function fetchFounderDropOffs(days: FounderRange = 0): Promise<FounderDropOffs> {
  return founderFetch<FounderDropOffs>(withDays('/api/v1/founder/drop-offs', days))
}

export function fetchFounderConversationReplay(
  conversationId: string
): Promise<FounderReplayMessage[]> {
  return founderFetch<{ messages: FounderReplayMessage[] }>(
    `/api/v1/founder/conversations/${conversationId}/replay`
  ).then((data) => data.messages ?? [])
}

export function fetchFounderConversationFunnel(
  days: FounderRange = 30
): Promise<FounderConversationFunnel> {
  return founderFetch<FounderConversationFunnel>(
    withDays('/api/v1/founder/conversation-funnel', days)
  )
}

export function fetchFounderPeakHours(days: FounderRange = 30): Promise<FounderPeakHours> {
  return founderFetch<FounderPeakHours>(withDays('/api/v1/founder/peak-hours', days))
}

export function fetchFounderUnitEconomics(days: FounderRange = 30): Promise<FounderUnitEconomics> {
  return founderFetch<FounderUnitEconomics>(withDays('/api/v1/founder/unit-economics', days))
}

export function fetchFounderTimeseries(days: FounderRange = 30): Promise<FounderTimeseries> {
  return founderFetch<FounderTimeseries>(withDays('/api/v1/founder/timeseries', days))
}

export function fetchMerchantHealth(days: FounderRange = 0): Promise<{ merchants: MerchantHealthRow[] }> {
  return founderFetch<{ merchants: MerchantHealthRow[] }>(withDays('/api/v1/founder/merchants', days))
}

export type FounderReliabilitySummary = {
  days: number
  totalEvents: number
  unreviewedEvents: number
  unknownIntentCount: number
  lowConfidenceCount: number
  groundingViolationCount: number
  humanEscalationCount: number
  conversationsToday: number
  healthyConversations: number
  needsAttention: number
  poorConversations: number
  escalationRatePct: number
}

export type FounderReliabilityEvent = {
  id: string
  merchantId: string
  conversationId: string
  eventType: string
  customerText: string
  classifiedIntent: string
  violationType: string
  violationDetails: string
  confidence?: number
  reviewed: boolean
  createdAt: string
}

export type FounderReliability = {
  summary: FounderReliabilitySummary
  recent: FounderReliabilityEvent[]
}

export function fetchFounderReliability(days: FounderRange = 7): Promise<FounderReliability> {
  return founderFetch<FounderReliability>(withDays('/api/v1/founder/reliability', days))
}

export type PipelineStatus = 'contacted' | 'replied' | 'demo' | 'trialing' | 'paid' | 'churned'
export type PipelinePlatform = 'instagram' | 'tiktok' | 'facebook' | 'whatsapp' | 'other'

export const PIPELINE_STATUSES: { value: PipelineStatus; label: string }[] = [
  { value: 'contacted', label: 'Contacted' },
  { value: 'replied', label: 'Replied' },
  { value: 'demo', label: 'Demo' },
  { value: 'trialing', label: 'Trialing' },
  { value: 'paid', label: 'Paid' },
  { value: 'churned', label: 'Churned' },
]

export const PIPELINE_PLATFORMS: { value: PipelinePlatform; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'other', label: 'Other' },
]

export type PipelineLead = {
  id: string
  shopName: string
  contactName: string
  platform: PipelinePlatform
  contactDate: string
  status: PipelineStatus
  lastAction: string
  nextAction: string
  nextActionAt?: string
  notes: string
  merchantId?: string
  createdAt: string
  updatedAt: string
  overdue: boolean
}

export type PipelineSummary = {
  contacted: number
  replied: number
  demo: number
  trialing: number
  paid: number
  churned: number
  overdue: number
  total: number
}

export type PipelineLeadInput = {
  shopName: string
  contactName?: string
  platform?: PipelinePlatform
  contactDate?: string
  status?: PipelineStatus
  lastAction?: string
  nextAction?: string
  nextActionAt?: string | null
  notes?: string
  merchantId?: string | null
  clearNextActionAt?: boolean
}

export function fetchPipelineLeads(status?: PipelineStatus | ''): Promise<{ leads: PipelineLead[] }> {
  const q = status ? `?status=${status}` : ''
  return founderFetch<{ leads: PipelineLead[] }>(`/api/v1/founder/pipeline${q}`)
}

export function fetchPipelineSummary(): Promise<PipelineSummary> {
  return founderFetch<PipelineSummary>('/api/v1/founder/pipeline/summary')
}

export function createPipelineLead(input: PipelineLeadInput): Promise<PipelineLead> {
  return founderFetch<PipelineLead>('/api/v1/founder/pipeline', { method: 'POST', body: input })
}

export function updatePipelineLead(id: string, input: Partial<PipelineLeadInput>): Promise<PipelineLead> {
  return founderFetch<PipelineLead>(`/api/v1/founder/pipeline/${id}`, { method: 'PATCH', body: input })
}

export function deletePipelineLead(id: string): Promise<{ deleted: boolean }> {
  return founderFetch<{ deleted: boolean }>(`/api/v1/founder/pipeline/${id}`, { method: 'DELETE' })
}

export type StuckMerchant = {
  id: string
  name: string
  email: string
  stage: string
  stageLabel: string
  suggestedAction: string
  signedUpAt: string
  lastActiveAt?: string
  daysStuck: number
}

export type AtRiskMerchant = {
  id: string
  name: string
  email: string
  lastActiveAt?: string
  daysInactive: number
  suggestedAction: string
}

export type OnboardingHealth = {
  stuck: StuckMerchant[]
  atRisk: AtRiskMerchant[]
  counts: {
    noWhatsApp: number
    noInventory: number
    noFirstReply: number
    noOrder: number
    atRisk: number
  }
}

export type RevenueForecast = {
  currentMrrGhs: number
  payingMerchants: number
  trialMerchants: number
  signupsLast30d: number
  paidLast30d: number
  churnedLast30d: number
  monthlySignupVelocity: number
  closeRatePct: number
  projectedMrr30dGhs: number
  projectedMrr90dGhs: number
  ifClose5ThisWeekMrrGhs: number
  merchantsToBreakEven: number
  assumedArpuGhs: number
  breakEvenMrrGhs: number
}

export type FounderScorecard = {
  id: string
  weekStart: string
  coldDms: number
  demos: number
  newPaid: number
  mrrGhs: number
  avoided: string
  sittingOn: string
  createdAt: string
  updatedAt: string
}

export type OutreachRow = {
  id: string
  logDate: string
  platform: string
  shopName: string
  messageVersion: string
  response: string
  outcome: string
  notes: string
  createdAt: string
}

export type OutreachVersionStat = {
  version: string
  total: number
  replied: number
  replyPct: number
}

export type OutreachStats = {
  total: number
  replied: number
  replyPct: number
  demos: number
  paid: number
  byVersion: OutreachVersionStat[]
}

export function fetchOnboardingHealth(): Promise<OnboardingHealth> {
  return founderFetch<OnboardingHealth>('/api/v1/founder/onboarding-health')
}

export function fetchRevenueForecast(): Promise<RevenueForecast> {
  return founderFetch<RevenueForecast>('/api/v1/founder/forecast')
}

export function fetchScorecards(): Promise<{ scorecards: FounderScorecard[] }> {
  return founderFetch<{ scorecards: FounderScorecard[] }>('/api/v1/founder/scorecards')
}

export function upsertScorecard(input: {
  weekStart?: string
  coldDms: number
  demos: number
  newPaid: number
  mrrGhs: number
  avoided: string
  sittingOn: string
}): Promise<FounderScorecard> {
  return founderFetch<FounderScorecard>('/api/v1/founder/scorecards', { method: 'POST', body: input })
}

export function fetchOutreach(): Promise<{ rows: OutreachRow[] }> {
  return founderFetch<{ rows: OutreachRow[] }>('/api/v1/founder/outreach')
}

export function fetchOutreachStats(): Promise<OutreachStats> {
  return founderFetch<OutreachStats>('/api/v1/founder/outreach/stats')
}

export function createOutreach(input: {
  logDate?: string
  platform: string
  shopName: string
  messageVersion?: string
  response?: string
  outcome?: string
  notes?: string
}): Promise<OutreachRow> {
  return founderFetch<OutreachRow>('/api/v1/founder/outreach', { method: 'POST', body: input })
}

export function deleteOutreach(id: string): Promise<{ deleted: boolean }> {
  return founderFetch<{ deleted: boolean }>(`/api/v1/founder/outreach/${id}`, { method: 'DELETE' })
}

export type ContentWeek = {
  id?: string
  weekStart: string
  monProblem: boolean
  wedProof: boolean
  friFounder: boolean
  notes: string
  createdAt?: string
  updatedAt?: string
}

export function fetchContentWeek(weekStart?: string): Promise<ContentWeek> {
  const q = weekStart ? `?weekStart=${encodeURIComponent(weekStart)}` : ''
  return founderFetch<ContentWeek>(`/api/v1/founder/content${q}`)
}

export function upsertContentWeek(input: {
  weekStart?: string
  monProblem: boolean
  wedProof: boolean
  friFounder: boolean
  notes?: string
}): Promise<ContentWeek> {
  return founderFetch<ContentWeek>('/api/v1/founder/content', { method: 'POST', body: input })
}

export function rangeLabel(days: FounderRange): string {
  return FOUNDER_RANGES.find((r) => r.value === days)?.label ?? 'All time'
}
