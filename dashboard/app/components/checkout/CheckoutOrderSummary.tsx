import type { ReactNode } from 'react'
import { formatProductName } from '@/lib/format'
import { formatGhs } from '@/lib/money'

type Props = {
  productName: string
  quantity: number
  amount: number
  footerLabel?: ReactNode
}

const cardClass =
  'bg-white rounded-2xl border border-slate-200 shadow-[0_8px_40px_rgba(15,23,42,0.07)] overflow-hidden'

export function CheckoutOrderSummary({ productName, quantity, amount, footerLabel }: Props) {
  return (
    <div className={cardClass}>
      <div className="px-4 sm:px-5 py-4 border-b border-slate-100">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-[15px] leading-snug break-words">{formatProductName(productName)}</p>
            <p className="text-sm text-slate-500 mt-0.5">Qty: {quantity}</p>
          </div>
          <p className="font-display text-lg font-extrabold text-slate-900 tabular-nums sm:shrink-0">
            {formatGhs(amount)}
          </p>
        </div>
      </div>
      <div className="px-4 sm:px-5 py-3.5 bg-slate-50 flex items-center justify-between gap-3">
        {footerLabel ?? <p className="text-sm text-slate-600">Total</p>}
        <p className="font-display text-base font-extrabold text-slate-900 tabular-nums ml-auto">
          {formatGhs(amount)}
        </p>
      </div>
    </div>
  )
}
