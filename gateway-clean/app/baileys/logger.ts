import type { Logger } from 'pino'
import { logger as root } from '../utils/logger'
import {
  parseReachoutTimelockPayload,
  type ReachoutSignal
} from '../auth/reachout-restriction'

const CORRUPTION_WINDOW_MS = 120_000
const CORRUPTION_THRESHOLD = 4

function isAppStateKeyError(obj: Record<string, unknown>): boolean {
  const msg = String(obj.msg ?? '')
  const err = String(obj.error ?? '')
  return msg === 'failed to sync state from version' && err.includes('failed to find key')
}

function logMessage(obj: Record<string, unknown>, logMsg?: string): string {
  return String(obj.msg ?? logMsg ?? '')
}

function isAck463(obj: Record<string, unknown>, logMsg?: string): boolean {
  // Baileys calls logger.warn({ attrs }, 'received error in ack') — msg is the 2nd arg, not on obj.
  if (logMessage(obj, logMsg) !== 'received error in ack') return false
  const attrs = obj.attrs as { error?: string | number } | undefined
  return attrs?.error != null && String(attrs.error) === '463'
}

type CorruptionTracker = {
  failures: number
  windowStart: number
  triggered: boolean
}

type BaileysLoggerHooks = {
  onAppStateCorruption?: () => void
  onReachoutSignal?: (signal: ReachoutSignal) => void
}

/**
 * Baileys logs app-state sync failures at info level. After repeated key-miss errors
 * the on-disk session is usually corrupt — caller should clear auth files and re-pair.
 */
export function createBaileysLogger(
  hooks: BaileysLoggerHooks = {},
  tracker: CorruptionTracker = { failures: 0, windowStart: 0, triggered: false }
): Logger {
  const base = root.child({ module: 'baileys' })

  function noteCorruption(obj: Record<string, unknown>) {
    if (!isAppStateKeyError(obj) || tracker.triggered) return

    const now = Date.now()
    if (now - tracker.windowStart > CORRUPTION_WINDOW_MS) {
      tracker.windowStart = now
      tracker.failures = 0
    }
    tracker.failures += 1

    if (tracker.failures >= CORRUPTION_THRESHOLD) {
      tracker.triggered = true
      hooks.onAppStateCorruption?.()
    }
  }

  function noteReachout(obj: Record<string, unknown>, logMsg?: string) {
    if (!hooks.onReachoutSignal) return
    if (isAck463(obj, logMsg)) {
      hooks.onReachoutSignal({ reason: 'ack_463' })
      return
    }
    const msg = logMessage(obj, logMsg)
    if (msg === 'Invalid mex newsletter notification') {
      const signal = parseReachoutTimelockPayload(obj)
      if (signal) hooks.onReachoutSignal(signal)
    }
  }

  function wrap(level: 'trace' | 'debug' | 'info' | 'warn' | 'error') {
    const log = base[level].bind(base) as (...args: unknown[]) => void
    return (obj: unknown, msg?: string, ...rest: unknown[]) => {
      if (obj && typeof obj === 'object') {
        const record = obj as Record<string, unknown>
        noteCorruption(record)
        noteReachout(record, msg)
      }
      if (typeof obj === 'string') log(obj, msg, ...rest)
      else if (msg !== undefined) log(obj, msg, ...rest)
      else log(obj)
    }
  }

  const wrapped = {
    trace: wrap('trace'),
    debug: wrap('debug'),
    info: wrap('info'),
    warn: wrap('warn'),
    error: wrap('error'),
    fatal: wrap('error'),
    silent: () => undefined,
    level: base.level,
    child(bindings: Record<string, unknown>) {
      const childBase = base.child(bindings)
      const childWrap = (level: 'trace' | 'debug' | 'info' | 'warn' | 'error') => {
        const log = childBase[level].bind(childBase) as (...args: unknown[]) => void
        return (obj: unknown, msg?: string, ...rest: unknown[]) => {
          if (obj && typeof obj === 'object') {
            const record = obj as Record<string, unknown>
            noteCorruption(record)
            noteReachout(record, msg)
          }
          if (typeof obj === 'string') log(obj, msg, ...rest)
          else if (msg !== undefined) log(obj, msg, ...rest)
          else log(obj)
        }
      }
      return {
        trace: childWrap('trace'),
        debug: childWrap('debug'),
        info: childWrap('info'),
        warn: childWrap('warn'),
        error: childWrap('error'),
        fatal: childWrap('error'),
        silent: () => undefined,
        level: childBase.level,
        child: (b: Record<string, unknown>) =>
          createBaileysLogger(hooks, tracker).child({ ...bindings, ...b })
      } as unknown as Logger
    }
  }

  return wrapped as unknown as Logger
}
