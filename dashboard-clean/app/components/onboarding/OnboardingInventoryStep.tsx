'use client'

import { Num } from '@/components/Num'
import {
  CatalogItemFields,
  parseCatalogItemForm,
  type CatalogItemFormValues,
} from '@/components/dashboard/CatalogItemFields'
import { OnboardingStoreScopeCard } from '@/components/onboarding/OnboardingStoreScopeCard'
import { createInventoryItem, importInventory, type InventoryItem, formatUserError } from '@/lib/api'
import { formatProductName } from '@/lib/format'
import { badgeClass } from '@/lib/dashboard-ui'
import { useEffect, useState } from 'react'

const cardClass =
  'bg-white rounded-2xl border border-slate-200 shadow-[0_8px_40px_rgba(15,23,42,0.07)]'

const defaultForm = (): CatalogItemFormValues => ({
  name: '',
  price: '',
  stock: '1',
  category: '',
  description: '',
  unit: '',
  isService: false,
  unlimitedStock: false,
})

type Props = {
  products: InventoryItem[]
  businessScope?: string
  onScopeSaved: (scope: string) => void
  onProductsUpdated: () => Promise<void>
  onError: (msg: string) => void
}

export function OnboardingInventoryStep({
  products,
  businessScope,
  onScopeSaved,
  onProductsUpdated,
  onError,
}: Props) {
  const [mode, setMode] = useState<'single' | 'bulk'>('single')
  const [form, setForm] = useState(defaultForm)
  const [bulk, setBulk] = useState('')
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState('')
  const [localProducts, setLocalProducts] = useState(products)

  useEffect(() => {
    setLocalProducts(products)
  }, [products])

  function sortProducts(items: InventoryItem[]) {
    return [...items].sort((a, b) => a.name.localeCompare(b.name))
  }

  async function handleAdd() {
    setBusy(true)
    setSuccess('')
    onError('')

    let optimisticIds: string[] = []
    try {
      if (mode === 'bulk') {
        const rawText = bulk.trim()
        if (!rawText) throw new Error('Paste at least one product line')
        const { inserted, items } = await importInventory(rawText)
        if (items?.length) setLocalProducts((prev) => sortProducts([...prev, ...items]))
        setSuccess(`Added ${inserted} item${inserted === 1 ? '' : 's'}`)
        setBulk('')
      } else {
        const parsed = parseCatalogItemForm(form)
        const tempId = `temp-${Date.now()}`
        optimisticIds = [tempId]
        setLocalProducts((prev) =>
          sortProducts([
            ...prev,
            {
              id: tempId,
              name: parsed.name,
              price: parsed.price,
              stock: parsed.stock,
              category: parsed.category,
              description: parsed.description,
              isService: parsed.isService,
              unit: parsed.unit,
              unlimitedStock: parsed.unlimitedStock,
            },
          ])
        )
        const created = await createInventoryItem(parsed)
        setLocalProducts((prev) =>
          sortProducts([...prev.filter((item) => item.id !== tempId), created])
        )
        setSuccess('Added to catalog')
        setForm(defaultForm())
      }
      void onProductsUpdated()
    } catch (err) {
      if (optimisticIds.length > 0) {
        setLocalProducts((prev) => prev.filter((item) => !optimisticIds.includes(item.id)))
      }
      onError(formatUserError(err, "Couldn't add those items."))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className={`${cardClass} p-5 sm:p-6`}>
        <OnboardingStoreScopeCard
          businessScope={businessScope}
          onSaved={onScopeSaved}
          onError={onError}
        />

        <div className="flex p-1 bg-slate-100 rounded-full mb-4 max-w-xs">
          {(['single', 'bulk'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 text-[12px] font-semibold py-2 rounded-full transition-all ${
                mode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {m === 'single' ? 'One item' : 'Bulk paste'}
            </button>
          ))}
        </div>

        {mode === 'single' ? (
          <CatalogItemFields values={form} onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))} />
        ) : (
          <div>
            <label htmlFor="ob-inv-bulk" className="block text-[11px] font-semibold text-slate-600 mb-1">
              One item per line
            </label>
            <textarea
              id="ob-inv-bulk"
              rows={5}
              value={bulk}
              onChange={(e) => setBulk(e.target.value)}
              placeholder={'Ankara dress - 120 10\nShea butter 500g - 45 25\nRunning shoes - 280 5'}
              className="w-full px-3.5 py-3 sm:py-2.5 text-[16px] sm:text-[14px] text-slate-900 bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-clerk-primary/25 focus:border-clerk-primary transition-all font-mono text-[13px] resize-none"
            />
            <p className="mt-2 text-[11px] text-slate-400">
              <code className="bg-slate-100 px-1 rounded text-[10px]">Name - price</code> or{' '}
              <code className="bg-slate-100 px-1 rounded text-[10px]">Name - price stock</code>
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => void handleAdd()}
          disabled={busy}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-clerk-primary text-slate-950 text-[13px] font-bold px-5 py-2.5 rounded-full hover:bg-clerk-primary-dark hover:text-white transition-colors disabled:opacity-50"
        >
          {busy ? 'Adding…' : 'Add to catalog'}
        </button>
        {success && <p className="mt-3 text-[12px] font-semibold text-clerk-primary-darker text-center">{success}</p>}
      </div>

      {localProducts.length > 0 && (
        <div className={`${cardClass} overflow-hidden`}>
          <div className="px-5 py-3 border-b border-slate-100">
            <p className="text-[13px] font-semibold text-slate-800">
              Your catalog · <Num>{localProducts.length}</Num>
            </p>
          </div>
          <ul className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
            {localProducts.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <span className="text-[13px] font-semibold text-slate-800 truncate">{formatProductName(item.name)}</span>
                <div className="flex items-center gap-2 shrink-0 text-[12px] text-slate-500 tabular-nums">
                  <span>GHS {item.price.toLocaleString()}</span>
                  {item.isService || item.unlimitedStock ? (
                    <span className={badgeClass('success')}>{item.isService ? 'Service' : 'Open'}</span>
                  ) : (
                    <span className={badgeClass(item.stock === 0 ? 'danger' : 'success')}>
                      <Num>{item.stock}</Num>
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
