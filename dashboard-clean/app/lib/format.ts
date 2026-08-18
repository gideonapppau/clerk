/** Title-case product names for display (inventory is often pasted lowercase). */
export function formatProductName(name: string): string {
  const trimmed = name?.trim()
  if (!trimmed) return name ?? ''

  return trimmed
    .split(/\s+/)
    .map((word) => {
      if (!word) return word
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}
