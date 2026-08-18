'use client'

import { DashPanel, DashPanelHead } from '@/components/DashPanel'
import { EmptyState } from '@/components/EmptyState'
import { BulkInventoryPaste } from '@/components/dashboard/BulkInventoryPaste'
import { bulkHasErrors, bulkReadyCount } from '@/lib/inventory-import'
import { InventoryFilters } from '@/components/dashboard/InventoryFilters'
import { ListScrollArea, ListShowMoreFooter } from '@/components/dashboard/ListControls'
import { Num } from '@/components/Num'
import { useDashboard } from '@/contexts/DashboardContext'
import { updateInventoryItem, createInventoryItem, type InventoryItem, formatUserError } from '@/lib/api'
import {
  CatalogItemFields,
  catalogItemToForm,
  parseCatalogItemForm,
  type CatalogItemFormValues,
} from '@/components/dashboard/CatalogItemFields'
import { badgeClass } from '@/lib/dashboard-ui'
import { formatProductName } from '@/lib/format'
import {
  applyInventoryFilters,
  DEFAULT_INVENTORY_FILTERS,
  filterInventoryForStockCounts,
  hasActiveInventoryFilters,
  stockFilterCounts,
} from '@/lib/inventory-filters'
import { usePagedList } from '@/lib/use-paged-list'
import { useEffect, useMemo, useState } from 'react'

const saveBtn =
  'flex-1 sm:flex-none min-h-[44px] inline-flex items-center justify-center text-[12px] font-bold bg-clerk-primary text-slate-950 px-4 py-2.5 rounded-full hover:bg-clerk-primary-dark hover:text-white transition-colors disabled:opacity-50 touch-manipulation'

const cancelBtn =
  'flex-1 sm:flex-none min-h-[44px] inline-flex items-center justify-center text-[12px] font-semibold text-slate-600 border border-slate-200 px-4 py-2.5 rounded-full hover:bg-slate-50 transition-colors disabled:opacity-50 touch-manipulation'

const defaultCatalogForm = (): CatalogItemFormValues => ({
  name: '',
  price: '',
  stock: '1',
  category: '',
  description: '',
  unit: '',
  isService: false,
  unlimitedStock: false,
})

function itemTracksStock(item: InventoryItem) {
  return !item.isService && !item.unlimitedStock
}

function stockBadge(stock: number) {
  if (stock === 0) return badgeClass('danger')
  if (stock <= 3) return badgeClass('low')
  return badgeClass('success')
}

function InventoryItemRow({
  item,
  onSaved,
  onPatch,
  onError,
}: {
  item: InventoryItem
  onSaved: (item: InventoryItem) => void
  onPatch: (item: InventoryItem) => void
  onError: (msg: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<CatalogItemFormValues>(() => catalogItemToForm(item))

  useEffect(() => {
    if (!editing) setForm(catalogItemToForm(item))
  }, [item, editing])

  function reset() {
    setForm(catalogItemToForm(item))
    setEditing(false)
  }

  async function save() {
    let parsed
    try {
      parsed = parseCatalogItemForm(form)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Invalid item details')
      return
    }

    const patch: Parameters<typeof updateInventoryItem>[1] = {}
    if (parsed.name !== item.name) patch.name = parsed.name
    if (parsed.price !== item.price) patch.price = parsed.price
    if (parsed.stock !== item.stock) patch.stock = parsed.stock
    if (parsed.category !== (item.category ?? '')) patch.category = parsed.category
    if (parsed.description !== (item.description ?? '')) patch.description = parsed.description
    if (parsed.unit !== (item.unit ?? '')) patch.unit = parsed.unit
    if (parsed.isService !== !!item.isService) patch.isService = parsed.isService
    if (parsed.unlimitedStock !== !!item.unlimitedStock) patch.unlimitedStock = parsed.unlimitedStock

    if (Object.keys(patch).length === 0) {
      setEditing(false)
      return
    }

    setSaving(true)
    const optimistic: InventoryItem = { ...item, ...parsed }
    onPatch(optimistic)
    try {
      const updated = await updateInventoryItem(item.id, patch)
      onSaved(updated)
      setEditing(false)
    } catch (err) {
      onPatch(item)
      onError(formatUserError(err, "Couldn't update this item."))
    } finally {
      setSaving(false)
    }
  }

  async function bumpStock(delta: number) {
    if (!itemTracksStock(item)) return
    const next = Math.max(0, item.stock + delta)
    if (next === item.stock) return
    setSaving(true)
    onPatch({ ...item, stock: next })
    try {
      const updated = await updateInventoryItem(item.id, { stock: next })
      onSaved(updated)
    } catch (err) {
      onPatch(item)
      onError(formatUserError(err, "Couldn't update stock."))
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <li className="px-4 sm:px-5 py-4">
        <CatalogItemFields values={form} onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))} compact />
        <div className="flex gap-2 mt-3">
          <button type="button" onClick={() => void save()} disabled={saving} className={saveBtn}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" onClick={reset} disabled={saving} className={cancelBtn}>
            Cancel
          </button>
        </div>
      </li>
    )
  }

  const tracksStock = itemTracksStock(item)

  return (
    <li className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 hover:bg-slate-50/80 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 font-display truncate text-[14px]">{formatProductName(item.name)}</p>
        <p className="text-[12px] text-slate-500 mt-0.5 tabular-nums">
          GHS <Num>{item.price.toLocaleString()}</Num>
          {item.category ? <span className="text-slate-400"> · {item.category}</span> : null}
        </p>
        {item.isService ? (
          <p className="text-[11px] text-clerk-primary-darker mt-0.5">Service{item.unit ? ` · ${item.unit}` : ''}</p>
        ) : item.unlimitedStock ? (
          <p className="text-[11px] text-slate-500 mt-0.5">Unlimited{item.unit ? ` · ${item.unit}` : ''}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {tracksStock ? (
          <div className="flex items-center rounded-full border border-slate-200 bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => void bumpStock(-1)}
              disabled={saving || item.stock === 0}
              className="size-8 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors"
              aria-label="Decrease stock"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                remove
              </span>
            </button>
            <span className={`min-w-[2.5rem] text-center text-[12px] font-bold tabular-nums ${stockBadge(item.stock)}`}>
              <Num>{item.stock}</Num>
            </span>
            <button
              type="button"
              onClick={() => void bumpStock(1)}
              disabled={saving}
              className="size-8 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors"
              aria-label="Increase stock"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                add
              </span>
            </button>
          </div>
        ) : (
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${badgeClass('success')}`}>
            {item.isService ? 'Service' : 'Open'}
          </span>
        )}

        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-[12px] font-semibold text-slate-500 border border-slate-200 bg-white px-3 py-1.5 min-h-[36px] rounded-full hover:border-slate-300 hover:text-slate-800 transition-colors touch-manipulation shrink-0"
        >
          Edit
        </button>
      </div>
    </li>
  )
}

export function InventoryPanel() {
  const {
    inventory,
    invMode,
    invBulk,
    invSuccess,
    invError,
    invUploadPhase,
    busy,
    setInvMode,
    setInvBulk,
    handleAddInventory,
    patchInventoryItem,
    mergeInventoryItems,
  } = useDashboard()

  const [editError, setEditError] = useState('')
  const [filters, setFilters] = useState(DEFAULT_INVENTORY_FILTERS)
  const [catalogForm, setCatalogForm] = useState(defaultCatalogForm)
  const [addingSingle, setAddingSingle] = useState(false)
  const [singleSuccess, setSingleSuccess] = useState('')

  async function handleSingleAdd(e: React.FormEvent) {
    e.preventDefault()
    setEditError('')
    setSingleSuccess('')
    setAddingSingle(true)
    try {
      const parsed = parseCatalogItemForm(catalogForm)
      const created = await createInventoryItem(parsed)
      mergeInventoryItems([created])
      setCatalogForm(defaultCatalogForm())
      setSingleSuccess('Added to catalog')
    } catch (err) {
      setEditError(formatUserError(err, "Couldn't add this item."))
    } finally {
      setAddingSingle(false)
    }
  }

  const filtered = useMemo(() => applyInventoryFilters(inventory, filters), [inventory, filters])
  const stockCountItems = useMemo(
    () => filterInventoryForStockCounts(inventory, filters),
    [inventory, filters.search, filters.price],
  )

  const filterKey = `${filters.search}|${filters.stock}|${filters.sort}|${filters.price}`
  const { visible, hasMore, total, showing, loadMore } = usePagedList(filtered, 30, filterKey)

  const { low: lowStock, out: outOfStock } = stockFilterCounts(inventory)
  const filtering = hasActiveInventoryFilters(filters)

  return (
    <div className="ui-enter grid lg:grid-cols-[minmax(0,340px)_1fr] gap-5 lg:gap-6 items-start">
      <DashPanel className="lg:sticky lg:top-24">
        <DashPanelHead
          title={inventory.length === 0 ? 'Build your catalog' : 'Add more'}
        />

        <div className="flex p-1 bg-slate-100 rounded-full mb-4">
          {(['single', 'bulk'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setInvMode(m)}
              className={`flex-1 text-[12px] font-semibold py-2 rounded-full transition-all ${
                invMode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {m === 'single' ? 'One item' : 'Bulk paste'}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => void (invMode === 'single' ? handleSingleAdd(e) : handleAddInventory(e))}
          className="space-y-3"
        >
          {invMode === 'single' ? (
            <CatalogItemFields
              values={catalogForm}
              onChange={(patch) => setCatalogForm((prev) => ({ ...prev, ...patch }))}
            />
          ) : (
            <BulkInventoryPaste
              value={invBulk}
              onChange={setInvBulk}
              disabled={busy === 'inventory'}
              uploadPhase={invUploadPhase}
              lineCount={bulkReadyCount(invBulk)}
            />
          )}

          <button
            type="submit"
            disabled={
              (invMode === 'single' ? addingSingle : busy === 'inventory') ||
              (invMode === 'bulk' && (bulkReadyCount(invBulk) === 0 || bulkHasErrors(invBulk)))
            }
            className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 bg-clerk-primary text-slate-950 text-[13px] font-bold px-5 py-3 sm:py-2.5 rounded-full hover:bg-clerk-primary-dark hover:text-white transition-colors disabled:opacity-50 touch-manipulation"
          >
            {invMode === 'single'
              ? addingSingle
                ? 'Adding…'
                : 'Add to catalog'
              : busy === 'inventory'
              ? invUploadPhase === 'refreshing'
                ? 'Updating catalog…'
                : invUploadPhase === 'uploading' && invMode === 'bulk'
                  ? `Adding ${bulkReadyCount(invBulk)} products…`
                  : 'Adding…'
              : invMode === 'bulk' && bulkReadyCount(invBulk) > 0
                ? `Add ${bulkReadyCount(invBulk)} to catalog`
                : 'Add to catalog'}
          </button>
          {(invMode === 'single' ? singleSuccess : invSuccess) && (
            <p className="text-[12px] font-semibold text-clerk-primary-darker text-center">
              {invMode === 'single' ? singleSuccess : invSuccess}
            </p>
          )}
          {(invMode === 'bulk' ? invError : editError) && (
            <p
              className="text-[12px] text-red-800 bg-red-50 border border-red-200/60 rounded-xl px-3 py-2.5 text-center leading-snug"
              role="alert"
            >
              {invMode === 'bulk' ? invError : editError}
            </p>
          )}
        </form>
      </DashPanel>

      <DashPanel padding={false} className="flex flex-col min-h-0">
        <div className="shrink-0 p-4 sm:p-5 border-b border-slate-100">
          <DashPanelHead
            title={
              <>
                <Num>{inventory.length}</Num> product{inventory.length === 1 ? '' : 's'}
              </>
            }
          />
          {(lowStock > 0 || outOfStock > 0) && !filtering && (
            <div className="flex flex-wrap gap-2 mb-4">
              {outOfStock > 0 && <span className={badgeClass('danger')}>{outOfStock} out of stock</span>}
              {lowStock > 0 && <span className={badgeClass('low')}>{lowStock} low stock</span>}
            </div>
          )}
          {editError && (
            <p className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-3">
              {editError}
            </p>
          )}
          {inventory.length > 0 && (
            <InventoryFilters
              stockCountItems={stockCountItems}
              filters={filters}
              onChange={setFilters}
              resultCount={filtered.length}
            />
          )}
        </div>

        {inventory.length === 0 ? (
          <div className="p-4 sm:p-5">
            <EmptyState
              title="Your catalog is empty"
              description="Add products on the left so Clerk can answer price and stock questions on WhatsApp."
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <p className="text-slate-500 text-sm">
              {filtering
                ? 'No products match your search or filters.'
                : 'No products match your filters.'}
            </p>
            <button
              type="button"
              onClick={() => setFilters(DEFAULT_INVENTORY_FILTERS)}
              className="text-[12px] font-semibold text-slate-600 border border-slate-200 bg-white px-4 py-2 rounded-full hover:bg-slate-50 transition-colors touch-manipulation"
            >
              Clear search & filters
            </button>
          </div>
        ) : (
          <>
            <ListScrollArea>
              <ul className="divide-y divide-slate-100">
                {visible.map((item) => (
                  <InventoryItemRow
                    key={item.id}
                    item={item}
                    onPatch={patchInventoryItem}
                    onSaved={patchInventoryItem}
                    onError={setEditError}
                  />
                ))}
              </ul>
            </ListScrollArea>
            <ListShowMoreFooter showing={showing} total={total} hasMore={hasMore} onLoadMore={loadMore} />
          </>
        )}
      </DashPanel>
    </div>
  )
}
