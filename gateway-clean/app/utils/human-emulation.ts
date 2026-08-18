/** Per-character typing speed — ~33 chars/sec. */
export const MS_PER_CHAR = 30

export const READING_DELAY_MIN_MS = 1000
export const READING_DELAY_MAX_MS = 2000

/** Typing duration from message length. */
export function typingDelayMs(text: string): number {
  return text.length * MS_PER_CHAR
}

/** Random pause simulating time spent reading the inbound message. */
export function readingDelayMs(): number {
  const span = READING_DELAY_MAX_MS - READING_DELAY_MIN_MS
  return READING_DELAY_MIN_MS + Math.floor(Math.random() * (span + 1))
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Refresh composing presence during long typing pauses (WhatsApp clears after ~5s). */
export async function waitWithTyping(
  tick: () => Promise<void>,
  totalMs: number
): Promise<void> {
  const refreshEvery = 4000
  let remaining = totalMs
  await tick()
  while (remaining > 0) {
    const chunk = Math.min(remaining, refreshEvery)
    await sleep(chunk)
    remaining -= chunk
    if (remaining > 0) {
      await tick()
    }
  }
}
