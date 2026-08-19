'use client'

import { useMemo, useRef } from 'react'
import { bulkImportRawText, bulkReadyCount, parseBulkInventory } from '@/lib/inventory-import'

const inputClass =
  'w-full px-3 py-3 sm:py-2 text-[16px] sm:text-[14px] text-slate-900 bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-clerk-primary/25 focus:border-clerk-primary transition-all'

type BulkInventoryPasteProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  uploadPhase?: 'idle' | 'uploading' | 'refreshing'
  lineCount?: number
}

export function BulkInventoryPaste({
  value,
  onChange,
  disabled,
  uploadPhase = 'idle',
  lineCount,
}: BulkInventoryPasteProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const preview = useMemo(() => parseBulkInventory(value), [value])

  const busy = uploadPhase !== 'idle'
  const canSubmit = preview.valid.length > 0 && preview.invalid.length === 0 && !busy

  function onFilePick(file: File | undefined) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : ''
      onChange(text.trim())
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor="invBulk" className="block text-[11px] font-semibold text-slate-600">
          One product per line
        </label>
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => fileRef.current?.click()}
          className="text-[11px] font-semibold text-clerk-primary-darker hover:underline disabled:opacity-50"
        >
          Upload .txt
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".txt,text/plain"
          className="hidden"
          onChange={(e) => onFilePick(e.target.files?.[0])}
        />
      </div>

      <textarea
        id="invBulk"
        rows={6}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || busy}
        placeholder={'Ankara dress - 120 10\nShea butter 500g - 45 25\nRunning shoes - 280 5'}
        className={`${inputClass} font-mono text-[13px] resize-y min-h-[140px]`}
      />

      <p className="text-[11px] text-slate-400 leading-relaxed">
        Format: <code className="bg-slate-100 px-1 rounded text-[10px]">Name - price</code> or{' '}
        <code className="bg-slate-100 px-1 rounded text-[10px]">Name - price stock</code>
      </p>

      {value.trim() && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-slate-200/80 bg-white">
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {preview.valid.length} ready
            </span>
            {preview.invalid.length > 0 && (
              <span className="text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                {preview.invalid.length} need fixing
              </span>
            )}
            {uploadPhase === 'uploading' && lineCount != null && (
              <span className="text-[11px] text-slate-500 ml-auto">Uploading {lineCount} products…</span>
            )}
            {uploadPhase === 'refreshing' && (
              <span className="text-[11px] text-slate-500 ml-auto">Updating catalog…</span>
            )}
          </div>

          {preview.invalid.length > 0 ? (
            <ul className="max-h-28 overflow-y-auto divide-y divide-slate-100 text-[11px]">
              {preview.invalid.slice(0, 8).map((row) => (
                <li key={row.line} className="px-3 py-2 text-red-700">
                  Line {row.line}: <span className="font-mono text-red-800">{row.text}</span>
                </li>
              ))}
              {preview.invalid.length > 8 && (
                <li className="px-3 py-2 text-slate-500">+{preview.invalid.length - 8} more lines to fix</li>
              )}
            </ul>
          ) : preview.valid.length > 0 ? (
            <ul className="max-h-36 overflow-y-auto divide-y divide-slate-100 text-[11px]">
              {preview.valid.slice(0, 6).map((row) => (
                <li key={row.line} className="px-3 py-2 flex justify-between gap-2 text-slate-700">
                  <span className="truncate font-medium">{row.name}</span>
                  <span className="shrink-0 tabular-nums text-slate-500">
                    GHS {row.price.toLocaleString()} · {row.stock} in stock
                  </span>
                </li>
              ))}
              {preview.valid.length > 6 && (
                <li className="px-3 py-2 text-slate-500">+{preview.valid.length - 6} more products</li>
              )}
            </ul>
          ) : (
            <p className="px-3 py-2 text-[11px] text-slate-500">Paste product lines to preview.</p>
          )}
        </div>
      )}

      {uploadPhase === 'uploading' && (
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full w-2/3 bg-clerk-primary rounded-full animate-pulse" />
        </div>
      )}

      {!canSubmit && preview.valid.length > 0 && preview.invalid.length > 0 && (
        <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          Fix the highlighted lines before importing. Only valid lines would be sent:{' '}
          {bulkImportRawText(preview.valid).split('\n').length} products.
        </p>
      )}
    </div>
  )
}
