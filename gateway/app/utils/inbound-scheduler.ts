import type { proto } from '@whiskeysockets/baileys'
import { logger } from './logger'

/** Wait after the last inbound text before calling Core. */
export const INBOUND_QUIET_MS = 2_500

/** Extra wait after customer stops typing (composing → paused). */
export const TYPING_SETTLE_MS = 1_500

/** Never hold a batched reply longer than this — WhatsApp often omits "paused". */
export const TYPING_MAX_HOLD_MS = 12_000

const PROCESSED_TTL_MS = 10 * 60 * 1000
const PROCESSED_MAX = 5_000

export type InboundBatch = {
  merchantId: string
  jid: string
  customerId: string
  text: string
  messageKind: 'customer_message' | 'inventory_import'
  inboundKeys: proto.IMessageKey[]
}

type FlushHandler = (batch: InboundBatch) => Promise<void>

type Bucket = {
  merchantId: string
  texts: string[]
  inboundKeys: proto.IMessageKey[]
  customerId: string
  jid: string
  messageKind: 'customer_message' | 'inventory_import'
  timer: ReturnType<typeof setTimeout> | null
  onFlush: FlushHandler
}

function bucketKey(merchantId: string, jid: string): string {
  return `${merchantId}:${jid}`
}

function messageDedupKey(merchantId: string, key: proto.IMessageKey): string | null {
  if (!key.id || !key.remoteJid) return null
  return `${merchantId}:${key.remoteJid}:${key.id}`
}

export class InboundScheduler {
  private buckets = new Map<string, Bucket>()
  private typing = new Set<string>()
  private processed = new Map<string, number>()

  isDuplicate(merchantId: string, key: proto.IMessageKey): boolean {
    const id = messageDedupKey(merchantId, key)
    if (!id) return false
    this.pruneProcessed()
    return this.processed.has(id)
  }

  markProcessed(merchantId: string, keys: proto.IMessageKey[]): void {
    const now = Date.now()
    for (const key of keys) {
      const id = messageDedupKey(merchantId, key)
      if (id) this.processed.set(id, now)
    }
    this.pruneProcessed()
  }

  setTyping(merchantId: string, jid: string, composing: boolean): void {
    const key = bucketKey(merchantId, jid)
    if (composing) {
      this.typing.add(key)
      const bucket = this.buckets.get(key)
      if (bucket?.timer) {
        clearTimeout(bucket.timer)
        bucket.timer = null
      }
      return
    }
    this.typing.delete(key)
    this.armTimer(key, TYPING_SETTLE_MS)
  }

  enqueue(
    merchantId: string,
    item: Omit<InboundBatch, 'merchantId' | 'text'> & { text: string },
    onFlush: FlushHandler
  ): void {
    const key = bucketKey(merchantId, item.jid)
    let bucket = this.buckets.get(key)
    if (!bucket) {
      bucket = {
        merchantId,
        texts: [],
        inboundKeys: [],
        customerId: item.customerId,
        jid: item.jid,
        messageKind: item.messageKind,
        timer: null,
        onFlush
      }
      this.buckets.set(key, bucket)
    }

    bucket.texts.push(item.text.trim())
    bucket.inboundKeys.push(...item.inboundKeys)
    bucket.customerId = item.customerId
    bucket.merchantId = merchantId
    bucket.onFlush = onFlush
    if (item.messageKind === 'inventory_import') {
      bucket.messageKind = 'inventory_import'
    }

    if (this.typing.has(key)) {
      if (bucket.timer) {
        clearTimeout(bucket.timer)
        bucket.timer = null
      }
      this.armSafetyFlush(key)
      return
    }

    this.armTimer(key, INBOUND_QUIET_MS)
  }

  /** Flush even when composing never ends — common Baileys/WhatsApp quirk. */
  private armSafetyFlush(key: string): void {
    const bucket = this.buckets.get(key)
    if (!bucket) return
    if (bucket.timer) clearTimeout(bucket.timer)
    bucket.timer = setTimeout(() => {
      this.typing.delete(key)
      void this.flush(key)
    }, TYPING_MAX_HOLD_MS)
  }

  private armTimer(key: string, delayMs: number): void {
    const bucket = this.buckets.get(key)
    if (!bucket || this.typing.has(key)) return
    if (bucket.timer) clearTimeout(bucket.timer)
    bucket.timer = setTimeout(() => {
      void this.flush(key)
    }, delayMs)
  }

  private async flush(key: string): Promise<void> {
    if (this.typing.has(key)) return

    const bucket = this.buckets.get(key)
    if (!bucket || bucket.texts.length === 0) return

    this.buckets.delete(key)
    if (bucket.timer) {
      clearTimeout(bucket.timer)
      bucket.timer = null
    }

    const text = bucket.texts.filter(Boolean).join('\n')
    if (!text) return

    logger.info(
      { merchantId: bucket.merchantId, customerId: bucket.customerId, chars: text.length },
      'flushing inbound batch to core'
    )

    await bucket.onFlush({
      merchantId: bucket.merchantId,
      jid: bucket.jid,
      customerId: bucket.customerId,
      text,
      messageKind: bucket.messageKind,
      inboundKeys: bucket.inboundKeys
    })
  }

  private pruneProcessed(): void {
    const now = Date.now()
    for (const [id, at] of this.processed) {
      if (now - at > PROCESSED_TTL_MS) this.processed.delete(id)
    }
    while (this.processed.size > PROCESSED_MAX) {
      const oldest = this.processed.keys().next().value
      if (oldest) this.processed.delete(oldest)
    }
  }
}

export const inboundScheduler = new InboundScheduler()
