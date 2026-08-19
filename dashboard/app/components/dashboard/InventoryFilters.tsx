'use client'

import { Num } from '@/components/Num'
import {
  countActiveInventoryFilters,
  DEFAULT_INVENTORY_FILTERS,
  hasActiveInventoryFilters,
  type InventoryFilterState,
  type PriceFilter,
  type SortOption,
  type StockFilter,
  stockFilterCounts,
} from '@/lib/inventory-filters'
import { ListSearchInput } from '@/components/dashboard/ListControls'
import { useEffect, useRef, useState } from 'react'

type Props = {
  /** Catalog subset after search + price filters — drives stock chip counts. */
  stockCountItems: { stock: number }[]
  filters: InventoryFilterState
  onChange: (next: InventoryFilterState) => void
  resultCount: number
}

const STOCK_OPTIONS: { id: StockFilter; label: string; key: keyof ReturnType<typeof stockFilterCounts> }[] = [
  { id: 'all', label: 'All', key: 'all' },
  { id: 'in-stock', label: 'In stock', key: 'inStock' },
  { id: 'low', label: 'Low', key: 'low' },
  { id: 'out', label: 'Out', key: 'out' },
]

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'name-asc', label: 'Name A–Z' },
  { id: 'price-asc', label: 'Price · low first' },
  { id: 'price-desc', label: 'Price · high first' },
  { id: 'stock-asc', label: 'Stock · restock first' },
  { id: 'stock-desc', label: 'Stock · most first' },
]

const PRICE_OPTIONS: { id: PriceFilter; label: string }[] = [
  { id: 'any', label: 'Any price' },
  { id: 'under-100', label: 'Under GHS 100' },
  { id: '100-500', label: 'GHS 100–500' },
  { id: '500-2000', label: 'GHS 500–2k' },
  { id: '2000-plus', label: 'GHS 2k+' },
]

function chipClass(active: boolean) {
  return `shrink-0 min-h-[32px] inline-flex items-center gap-1 text-[12px] font-semibold px-3 py-1.5 rounded-full border transition-colors touch-manipulation whitespace-nowrap ${
    active
      ? 'bg-clerk-light text-clerk-primary-darker border-clerk-primary/25'
      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-800'
  }`
}

function countClass(active: boolean) {
  return active ? 'text-clerk-primary-darker/70 tabular-nums' : 'text-slate-400 tabular-nums'
}

export function InventoryFilters({ stockCountItems, filters, onChange, resultCount }: Props) {
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)
  const counts = stockFilterCounts(stockCountItems)
  const activeExtras = countActiveInventoryFilters(filters)
  const filtering = hasActiveInventoryFilters(filters)

  useEffect(() => {
    if (!moreOpen) return
    function onPointerDown(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [moreOpen])

  function patch(partial: Partial<InventoryFilterState>) {
    onChange({ ...filters, ...partial })
  }

  function reset() {
    onChange(DEFAULT_INVENTORY_FILTERS)
    setMoreOpen(false)
  }

  return (
    <div className="space-y-3">
      <ListSearchInput
        id="inventory-search"
        value={filters.search}
        onChange={(search) => patch({ search })}
        placeholder="Search name, price, or stock…"
      />
      {filtering && (
        <p className="text-[11px] text-slate-500 tabular-nums">
          <Num>{resultCount}</Num> product{resultCount === 1 ? '' : 's'} match
          {filters.search.trim() ? (
            <>
              {' '}
              for &ldquo;{filters.search.trim()}&rdquo;
            </>
          ) : null}
        </p>
      )}

      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center gap-1.5 w-max pr-1">
            {STOCK_OPTIONS.map(({ id, label, key }) => {
              const count = counts[key]
              const active = filters.stock === id
              if (id !== 'all' && count === 0) return null
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => patch({ stock: id })}
                  className={chipClass(active)}
                  aria-pressed={active}
                >
                  {label}
                  <span className={countClass(active)}>
                    <Num>{count}</Num>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="relative shrink-0" ref={moreRef}>
          <button
            type="button"
            onClick={() => setMoreOpen((o) => !o)}
            className={`min-h-[32px] inline-flex items-center gap-1 text-[12px] font-semibold px-3 py-1.5 rounded-full border transition-colors touch-manipulation ${
              moreOpen || activeExtras > 0
                ? 'bg-slate-100 text-slate-900 border-slate-300'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
            }`}
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden>
              tune
            </span>
            {activeExtras > 0 ? (
              <span className="size-4 rounded-full bg-slate-900 text-white text-[10px] font-bold inline-flex items-center justify-center tabular-nums">
                {activeExtras}
              </span>
            ) : null}
          </button>

          {moreOpen && (
            <div
              role="dialog"
              aria-label="Filter and sort products"
              className="absolute right-0 top-[calc(100%+6px)] z-20 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white shadow-[0_16px_48px_rgba(15,23,42,0.12)] p-4 space-y-4"
            >
              <div>
                <p className="text-[11px] font-semibold text-slate-500 mb-2">Sort by</p>
                <div className="space-y-1">
                  {SORT_OPTIONS.map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => patch({ sort: id })}
                      className={`w-full text-left text-[13px] px-3 py-2 rounded-xl transition-colors ${
                        filters.sort === id
                          ? 'bg-clerk-light text-clerk-primary-darker font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-slate-500 mb-2">Price range</p>
                <div className="flex flex-wrap gap-1.5">
                  {PRICE_OPTIONS.map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => patch({ price: id })}
                      className={chipClass(filters.price === id)}
                      aria-pressed={filters.price === id}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                <p className="text-[11px] text-slate-400 tabular-nums">
                  <Num>{resultCount}</Num> match{resultCount === 1 ? '' : 'es'}
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="text-[12px] font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
