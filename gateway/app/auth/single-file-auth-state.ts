import { mkdir, readFile, readdir, rename, unlink, writeFile } from 'fs/promises'
import { dirname, join } from 'path'
import {
  BufferJSON,
  initAuthCreds,
  proto,
  type AuthenticationCreds,
  type AuthenticationState
} from '@whiskeysockets/baileys'
import { logger } from '../utils/logger'

type KeyStore = Record<string, unknown>

type StoredAuth = {
  creds: AuthenticationCreds
  keys: KeyStore
}

/**
 * Production auth state: one JSON file per merchant, in-memory keys, debounced writes.
 * Avoids useMultiFileAuthState's per-key file IO (not recommended for prod by Baileys).
 * Migrates existing multi-file sessions on first load.
 */
export async function useSingleFileAuthState(folder: string): Promise<{
  state: AuthenticationState
  saveCreds: () => Promise<void>
}> {
  await mkdir(folder, { recursive: true })
  const filePath = join(folder, 'session.json')

  let stored = await readStored(filePath)
  if (!stored) {
    stored = await migrateMultiFile(folder)
    if (stored) {
      await writeStored(filePath, stored)
      logger.info({ folder }, 'migrated multi-file whatsapp auth to session.json')
    }
  }

  const creds: AuthenticationCreds = stored?.creds ?? initAuthCreds()
  const keys: KeyStore = { ...(stored?.keys ?? {}) }

  let writeTimer: ReturnType<typeof setTimeout> | null = null
  let writeChain: Promise<void> = Promise.resolve()

  const persist = (): Promise<void> => {
    writeChain = writeChain
      .then(async () => {
        await writeStored(filePath, { creds, keys })
      })
      .catch((err) => {
        logger.error({ err, folder }, 'whatsapp auth persist failed')
      })
    return writeChain
  }

  const schedulePersist = () => {
    if (writeTimer) clearTimeout(writeTimer)
    writeTimer = setTimeout(() => {
      writeTimer = null
      void persist()
    }, 200)
  }

  const saveCreds = async () => {
    if (writeTimer) {
      clearTimeout(writeTimer)
      writeTimer = null
    }
    await persist()
  }

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data: { [id: string]: unknown } = {}
          for (const id of ids) {
            let value = keys[`${type}-${id}`]
            if (type === 'app-state-sync-key' && value) {
              value = proto.Message.AppStateSyncKeyData.fromObject(value as object)
            }
            data[id] = value
          }
          // Baileys SignalKeyStore typing is category-specific; values are opaque JSON blobs.
          return data as never
        },
        set: async (data) => {
          for (const category of Object.keys(data)) {
            const entries = data[category as keyof typeof data] as Record<string, unknown> | undefined
            if (!entries) continue
            for (const id of Object.keys(entries)) {
              const value = entries[id]
              const key = `${category}-${id}`
              if (value) keys[key] = value
              else delete keys[key]
            }
          }
          schedulePersist()
        }
      }
    },
    saveCreds
  }
}

async function readStored(filePath: string): Promise<StoredAuth | null> {
  try {
    const raw = await readFile(filePath, 'utf8')
    return JSON.parse(raw, BufferJSON.reviver) as StoredAuth
  } catch {
    return null
  }
}

async function writeStored(filePath: string, data: StoredAuth): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true })
  const tmp = `${filePath}.${process.pid}.tmp`
  await writeFile(tmp, JSON.stringify(data, BufferJSON.replacer), 'utf8')
  await rename(tmp, filePath)
}

async function migrateMultiFile(folder: string): Promise<StoredAuth | null> {
  try {
    const files = await readdir(folder)
    if (!files.includes('creds.json')) return null

    let creds: AuthenticationCreds | null = null
    const keys: KeyStore = {}

    for (const file of files) {
      if (!file.endsWith('.json') || file === 'session.json') continue
      try {
        const raw = await readFile(join(folder, file), 'utf8')
        const data = JSON.parse(raw, BufferJSON.reviver)
        if (file === 'creds.json') creds = data as AuthenticationCreds
        else keys[file.replace(/\.json$/, '')] = data
      } catch {
        /* skip corrupt file */
      }
    }

    if (!creds) return null

    // Drop legacy per-key files after successful migration (best-effort).
    for (const file of files) {
      if (!file.endsWith('.json') || file === 'session.json') continue
      try {
        await unlink(join(folder, file))
      } catch {
        /* ignore */
      }
    }

    return { creds, keys }
  } catch {
    return null
  }
}
