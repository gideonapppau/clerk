'use client'

export const catalogFieldInputClass =
  'w-full px-3 py-3 sm:py-2 text-[16px] sm:text-[14px] text-slate-900 bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-clerk-primary/25 focus:border-clerk-primary transition-all'

export const catalogFieldLabelClass = 'block text-[11px] font-semibold text-slate-600 mb-1'

const inputClass = catalogFieldInputClass

export type CatalogItemFormValues = {
  name: string
  price: string
  stock: string
  category: string
  description: string
  unit: string
  isService: boolean
  unlimitedStock: boolean
}

type Props = {
  values: CatalogItemFormValues
  onChange: (patch: Partial<CatalogItemFormValues>) => void
  nameId?: string
  priceId?: string
  stockId?: string
  compact?: boolean
}

export function CatalogItemFields({
  values,
  onChange,
  nameId = 'invName',
  priceId = 'invPrice',
  stockId = 'invStock',
  compact = false,
}: Props) {
  const trackStock = true
  const labelClass = catalogFieldLabelClass

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor={nameId} className={labelClass}>
          Item name
        </label>
        <input
          id={nameId}
          value={values.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Ankara dress, shea butter 500g, running shoes"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={priceId} className={labelClass}>
            Price (GHS)
          </label>
          <input
            id={priceId}
            type="number"
            min={1}
            value={values.price}
            onChange={(e) => onChange({ price: e.target.value })}
            placeholder="350"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={stockId} className={labelClass}>
            Stock
          </label>
          <input
            id={stockId}
            type="number"
            min={0}
            value={values.stock}
            onChange={(e) => onChange({ stock: e.target.value })}
            disabled={!trackStock}
            placeholder={trackStock ? '10' : '—'}
            className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-400`}
            aria-label="Stock count"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Category (optional)</label>
        <input
          value={values.category}
          onChange={(e) => onChange({ category: e.target.value })}
          placeholder="Perfumes, dresses, fabrics"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Description (optional)</label>
        <input
          value={values.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Helps Clerk match words like fragrance, scent, size M"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Unit (optional)</label>
        <input
          value={values.unit}
          onChange={(e) => onChange({ unit: e.target.value })}
          placeholder="per bottle, per kg, per pair"
          className={inputClass}
        />
      </div>
    </div>
  )
}

export function catalogItemToForm(item: {
  name: string
  price: number
  stock: number
  category?: string
  description?: string
  unit?: string
  isService?: boolean
  unlimitedStock?: boolean
}): CatalogItemFormValues {
  return {
    name: item.name,
    price: String(item.price),
    stock: String(item.stock),
    category: item.category ?? '',
    description: item.description ?? '',
    unit: item.unit ?? '',
    isService: item.isService ?? false,
    unlimitedStock: item.unlimitedStock ?? false,
  }
}

export function parseCatalogItemForm(values: CatalogItemFormValues) {
  const name = values.name.trim()
  const price = parseInt(values.price, 10)
  const stock = parseInt(values.stock, 10)
  if (!name) throw new Error('Item name is required')
  if (!Number.isFinite(price) || price <= 0) throw new Error('Enter a valid price')
  const unlimited = false
  if (!unlimited && (!Number.isFinite(stock) || stock < 0)) {
    throw new Error('Enter a valid stock count')
  }
  return {
    name,
    price,
    stock: unlimited ? 0 : stock,
    category: values.category.trim(),
    description: values.description.trim(),
    unit: values.unit.trim(),
    isService: false,
    unlimitedStock: false,
  }
}
