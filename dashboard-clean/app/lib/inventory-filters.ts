import type { InventoryItem } from '@/lib/api'
import { formatProductName } from '@/lib/format'

export type StockFilter = 'all' | 'in-stock' | 'low' | 'out'
export type SortOption = 'name-asc' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc'
export type PriceFilter = 'any' | 'under-100' | '100-500' | '500-2000' | '2000-plus'

export type InventoryFilterState = {
  search: string
  stock: StockFilter
  sort: SortOption
  price: PriceFilter
}

export const DEFAULT_INVENTORY_FILTERS: InventoryFilterState = {
  search: '',
  stock: 'all',
  sort: 'name-asc',
  price: 'any',
}

const LOW_STOCK_MAX = 3

export function isLowStock(stock: number): boolean {
  return stock > 0 && stock <= LOW_STOCK_MAX
}

export function stockFilterCounts(items: Array<{ stock: number }>) {
  let inStock = 0
  let low = 0
  let out = 0
  for (const item of items) {
    if (item.stock === 0) out++
    else {
      inStock++
      if (isLowStock(item.stock)) low++
    }
  }
  return { all: items.length, inStock, low, out }
}

export function matchesPrice(item: InventoryItem, price: PriceFilter): boolean {
  switch (price) {
    case 'any':
      return true
    case 'under-100':
      return item.price < 100
    case '100-500':
      return item.price >= 100 && item.price <= 500
    case '500-2000':
      return item.price > 500 && item.price <= 2000
    case '2000-plus':
      return item.price > 2000
  }
}

export function matchesStock(item: InventoryItem, stock: StockFilter): boolean {
  switch (stock) {
    case 'all':
      return true
    case 'in-stock':
      return item.stock > 0
    case 'low':
      return isLowStock(item.stock)
    case 'out':
      return item.stock === 0
  }
}

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function inventorySearchHaystack(item: InventoryItem): string {
  const rawName = item.name ?? ''
  const name = normalizeSearchText(rawName)
  const displayName = normalizeSearchText(formatProductName(rawName))
  const price = String(item.price ?? 0)
  const priceGrouped = (item.price ?? 0).toLocaleString('en-GH')
  const stock = String(item.stock ?? 0)
  return `${name} ${displayName} ${price} ${priceGrouped} ${stock}`
}

export function matchesInventorySearch(item: InventoryItem, rawQuery: string): boolean {
  const q = normalizeSearchText(rawQuery)
  if (!q) return true

  const haystack = inventorySearchHaystack(item)
  if (haystack.includes(q)) return true

  // "ghs 3,500" or partial digit matches
  const queryDigits = q.replace(/[^\d]/g, '')
  if (queryDigits) {
    const haystackDigits = haystack.replace(/[^\d]/g, '')
    if (haystackDigits.includes(queryDigits)) return true
  }

  return false
}

/** Items matching search + price (used for stock chip counts while searching). */
export function filterInventoryForStockCounts(
  items: InventoryItem[],
  filters: Pick<InventoryFilterState, 'search' | 'price'>,
): InventoryItem[] {
  return items.filter(
    (item) => matchesPrice(item, filters.price) && matchesInventorySearch(item, filters.search),
  )
}

function compareItems(a: InventoryItem, b: InventoryItem, sort: SortOption): number {
  switch (sort) {
    case 'name-asc':
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    case 'price-asc':
      return a.price - b.price || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    case 'price-desc':
      return b.price - a.price || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    case 'stock-asc':
      return a.stock - b.stock || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    case 'stock-desc':
      return b.stock - a.stock || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  }
}

export function applyInventoryFilters(items: InventoryItem[], filters: InventoryFilterState): InventoryItem[] {
  const filtered = items.filter(
    (item) =>
      matchesStock(item, filters.stock) &&
      matchesPrice(item, filters.price) &&
      matchesInventorySearch(item, filters.search),
  )
  return filtered.sort((a, b) => compareItems(a, b, filters.sort))
}

export function countActiveInventoryFilters(filters: InventoryFilterState): number {
  let n = 0
  if (filters.stock !== 'all') n++
  if (filters.price !== 'any') n++
  if (filters.sort !== 'name-asc') n++
  return n
}

export function hasActiveInventoryFilters(filters: InventoryFilterState): boolean {
  return countActiveInventoryFilters(filters) > 0 || filters.search.trim() !== ''
}
