/** Client-side bulk import parser — mirrors core/inventory/importer.go */

export type ParsedInventoryLine = {
  line: number
  name: string
  price: number
  stock: number
}

export type InvalidInventoryLine = {
  line: number
  text: string
}

const LINE_PATTERN = /^(.+?)\s*-\s*(\d+)(?:\s+(\d+))?\s*$/

export function parseBulkInventory(text: string): {
  valid: ParsedInventoryLine[]
  invalid: InvalidInventoryLine[]
} {
  const valid: ParsedInventoryLine[] = []
  const invalid: InvalidInventoryLine[] = []
  const rows = text.split('\n')

  rows.forEach((raw, index) => {
    const line = raw.trim()
    if (!line) return
    const lineNum = index + 1
    const m = line.match(LINE_PATTERN)
    if (!m) {
      invalid.push({ line: lineNum, text: line })
      return
    }
    const price = parseInt(m[2], 10)
    const stock = m[3] ? parseInt(m[3], 10) : 1
    valid.push({
      line: lineNum,
      name: m[1].trim(),
      price,
      stock: Number.isFinite(stock) ? stock : 1,
    })
  })

  return { valid, invalid }
}

export function bulkImportRawText(valid: ParsedInventoryLine[]): string {
  return valid.map((v) => (v.stock === 1 ? `${v.name} - ${v.price}` : `${v.name} - ${v.price} ${v.stock}`)).join('\n')
}

export function bulkReadyCount(text: string): number {
  return parseBulkInventory(text).valid.length
}

export function bulkHasErrors(text: string): boolean {
  return parseBulkInventory(text).invalid.length > 0
}
