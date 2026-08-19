import type { ConversationTimelineStep } from '@/lib/api'

const GROUP_GAP_MS = 15 * 60 * 1000

export type GroupedTimelineEntry = {
  label: string
  startAt: string
  endAt: string
  count: number
}

type ParsedStep = {
  category: 'reservation' | 'inquiry' | 'other'
  groupKey: string
  outcome?: 'success' | 'failure'
  product?: string
}

function normalizeProduct(value: string): string {
  return value.trim().toLowerCase()
}

function parseTimelineStep(step: ConversationTimelineStep): ParsedStep {
  const label = step.label.trim()

  const reservedMatch = /^Reserved (.+)$/i.exec(label)
  if (reservedMatch) {
    const product = reservedMatch[1].trim()
    return {
      category: 'reservation',
      groupKey: `reservation:${normalizeProduct(product)}`,
      outcome: 'success',
      product,
    }
  }

  const orderReservedMatch = /^Order reserved[:—] (.+)$/i.exec(label)
  if (orderReservedMatch) {
    const product = orderReservedMatch[1].trim()
    return {
      category: 'reservation',
      groupKey: `reservation:${normalizeProduct(product)}`,
      outcome: 'success',
      product,
    }
  }

  if (label === 'Order declined' || label === 'Reservation expired') {
    return { category: 'reservation', groupKey: 'reservation', outcome: 'failure' }
  }

  if (label === 'Order confirmed') {
    return { category: 'reservation', groupKey: 'reservation:confirmed', outcome: 'success' }
  }

  const askedMatch = /^Asked about (.+)$/i.exec(label)
  if (askedMatch) {
    const product = askedMatch[1].trim()
    return {
      category: 'inquiry',
      groupKey: `inquiry:${normalizeProduct(product)}`,
      product,
    }
  }

  return { category: 'other', groupKey: `exact:${label}` }
}

type TimelineGroup = {
  category: ParsedStep['category']
  groupKey: string
  product?: string
  steps: ConversationTimelineStep[]
}

function withinGap(a: string, b: string): boolean {
  return Math.abs(new Date(b).getTime() - new Date(a).getTime()) <= GROUP_GAP_MS
}

function shouldMerge(current: TimelineGroup, parsed: ParsedStep, step: ConversationTimelineStep): boolean {
  const last = current.steps[current.steps.length - 1]
  if (!withinGap(last.createdAt, step.createdAt)) return false

  if (parsed.groupKey === current.groupKey) return true

  if (
    current.category === 'reservation' &&
    parsed.category === 'reservation' &&
    parsed.outcome === 'failure'
  ) {
    return true
  }

  if (
    current.category === 'reservation' &&
    parsed.category === 'reservation' &&
    current.product &&
    parsed.product &&
    normalizeProduct(current.product) === normalizeProduct(parsed.product)
  ) {
    return true
  }

  return false
}

function formatGroupLabel(group: TimelineGroup): string {
  const { steps } = group
  if (steps.length === 1) return steps[0].label

  const allSameLabel = steps.every((s) => s.label === steps[0].label)
  if (allSameLabel) {
    return `${steps[0].label} (×${steps.length})`
  }

  if (group.category === 'reservation') {
    let failures = 0
    let successes = 0
    for (const step of steps) {
      const parsed = parseTimelineStep(step)
      if (parsed.outcome === 'failure') failures++
      if (parsed.outcome === 'success') successes++
    }

    const product = group.product ?? steps.map((s) => parseTimelineStep(s).product).find(Boolean)
    const base = product ? `Bot attempted reservation for ${product}` : 'Bot attempted reservation'

    const parts: string[] = []
    if (failures > 0) parts.push(`Failed ${failures}x`)
    if (successes > 0) parts.push(`Succeeded ${successes}x`)
    return parts.length > 0 ? `${base} (${parts.join(', ')})` : base
  }

  if (group.category === 'inquiry' && group.product) {
    return `Asked about ${group.product} (×${steps.length})`
  }

  return `${steps[0].label} (+${steps.length - 1} more)`
}

export function groupConversationTimeline(steps: ConversationTimelineStep[]): GroupedTimelineEntry[] {
  if (steps.length === 0) return []

  const groups: TimelineGroup[] = []
  let current: TimelineGroup | null = null

  for (const step of steps) {
    const parsed = parseTimelineStep(step)

    if (current && shouldMerge(current, parsed, step)) {
      current.steps.push(step)
      if (parsed.product && !current.product) current.product = parsed.product
      if (current.groupKey === 'reservation' && parsed.groupKey.startsWith('reservation:')) {
        current.groupKey = parsed.groupKey
      }
    } else {
      if (current) groups.push(current)
      current = {
        category: parsed.category,
        groupKey: parsed.groupKey,
        product: parsed.product,
        steps: [step],
      }
    }
  }

  if (current) groups.push(current)

  return groups.map((group) => ({
    label: formatGroupLabel(group),
    startAt: group.steps[0].createdAt,
    endAt: group.steps[group.steps.length - 1].createdAt,
    count: group.steps.length,
  }))
}

export function formatTimelineRange(startAt: string, endAt: string): string {
  const start = new Date(startAt)
  const end = new Date(endAt)
  const timeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }

  const startTime = start.toLocaleTimeString(undefined, timeOpts)

  if (start.getTime() === end.getTime()) {
    return startTime
  }

  const endTime = end.toLocaleTimeString(undefined, timeOpts)
  if (startTime === endTime) return startTime

  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate()

  if (sameDay) {
    return `${startTime} – ${endTime}`
  }

  const dateOpts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  return `${start.toLocaleString(undefined, dateOpts)} – ${end.toLocaleString(undefined, dateOpts)}`
}
