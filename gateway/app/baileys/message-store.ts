import type { proto, WAMessageKey } from '@whiskeysockets/baileys'
import type { WASocket } from '@whiskeysockets/baileys'

const MAX_ENTRIES = 5_000
const TTL_MS = 60 * 60 * 1000

type Entry = { msg: proto.IWebMessageInfo; at: number }

function messageKeyId(key: WAMessageKey): string | null {
  if (!key.id || !key.remoteJid) return null
  return `${key.remoteJid}:${key.id}:${key.fromMe ? '1' : '0'}`
}

export type MessageStore = {
  remember: (msg: proto.IWebMessageInfo) => void
  getMessage: (key: WAMessageKey) => Promise<proto.IWebMessageInfo | undefined>
}

export function createMessageStore(): MessageStore {
  const store = new Map<string, Entry>()

  function prune(): void {
    const now = Date.now()
    for (const [id, entry] of store) {
      if (now - entry.at > TTL_MS) store.delete(id)
    }
    while (store.size > MAX_ENTRIES) {
      const oldest = store.keys().next().value
      if (oldest) store.delete(oldest)
    }
  }

  return {
    remember(msg) {
      const id = msg.key ? messageKeyId(msg.key) : null
      if (!id) return
      store.set(id, { msg, at: Date.now() })
      prune()
    },

    async getMessage(key) {
      const id = messageKeyId(key)
      if (!id) return undefined
      const entry = store.get(id)
      if (!entry || Date.now() - entry.at > TTL_MS) {
        store.delete(id)
        return undefined
      }
      return entry.msg
    }
  }
}

/** Baileys: persist upserted messages so getMessage can serve retries and poll votes. */
export function registerMessageStoreHandler(sock: WASocket, store: MessageStore): void {
  sock.ev.on('messages.upsert', ({ messages }) => {
    for (const msg of messages) {
      store.remember(msg)
    }
  })
}
