import { CheckoutOrderSummary } from '@/components/checkout/CheckoutOrderSummary'

export type CompleteOrder = {
  id: string
  productName: string
  quantity: number
  unitPrice: number
  totalAmount: number
  status: string
}

type Props = {
  confirmed: boolean
  order: CompleteOrder | null
  reference: string
  error?: string
  provider?: 'paystack' | 'moolre' | 'other'
}

export function CheckoutCompleteView({ confirmed, order, reference, error, provider }: Props) {
  const isExpired = order?.status === 'EXPIRED' && !confirmed
  const hasError = Boolean(error) && !confirmed
  const isPending = !confirmed && !hasError && !isExpired

  const title = confirmed
    ? 'Payment received'
    : isExpired
      ? 'Payment link expired'
      : hasError
        ? 'Could not verify payment'
        : 'Processing payment'
  const subtitle = confirmed
    ? 'Your order is confirmed.'
    : isExpired
      ? 'This order was not paid in time. If you already paid, contact the seller with your reference below.'
      : hasError
        ? error
        : 'This usually takes a few seconds.'

  return (
    <div className="ui-enter flex flex-col gap-4 sm:gap-5">
      <div className="text-center px-1">
        {!confirmed && (
          <div className="mb-5 flex justify-center">
            {isPending ? (
              <span className="size-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
            ) : (
              <span
                className={`text-[12px] font-bold uppercase tracking-wide rounded-full px-3 py-1 border ${
                  isExpired
                    ? 'text-slate-600 bg-slate-100 border-slate-200'
                    : 'text-red-600 bg-red-50 border-red-100'
                }`}
              >
                {isExpired ? 'Expired' : 'Error'}
              </span>
            )}
          </div>
        )}

        <h1 className="text-[1.35rem] sm:text-[1.5rem] font-extrabold text-slate-900 font-display tracking-tight mb-2">{title}</h1>
        <p className="text-[14px] text-slate-500 leading-relaxed max-w-[300px] mx-auto">{subtitle}</p>
      </div>

      {order && (
        <CheckoutOrderSummary
          productName={order.productName}
          quantity={order.quantity}
          amount={order.totalAmount}
          footerLabel={
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                confirmed
                  ? 'bg-clerk-light text-clerk-primary-darker'
                  : isPending
                    ? 'bg-amber-100 text-amber-800'
                    : isExpired
                      ? 'bg-slate-200 text-slate-600'
                      : 'bg-slate-200 text-slate-600'
              }`}
            >
              {confirmed ? 'Paid' : isPending ? 'Pending' : isExpired ? 'Expired' : order.status.replace(/_/g, ' ')}
            </span>
          }
        />
      )}

      {confirmed && (
        <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4">
          <span className="size-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/whatsapp.svg" alt="" className="size-5" />
          </span>
          <div className="text-left min-w-0">
            <p className="text-[13px] font-semibold text-slate-900 mb-0.5">Back to WhatsApp</p>
            <p className="text-[13px] text-slate-500 leading-relaxed">
              You can close this tab and continue there.
            </p>
          </div>
        </div>
      )}

      {isPending && (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-center">
          <p className="text-[13px] text-slate-500 leading-relaxed">
            If this page doesn&apos;t update, your payment may still have gone through. Check WhatsApp or
            contact the seller.
          </p>
        </div>
      )}

      {reference && (
        <p className="text-center text-[11px] text-slate-400 font-mono break-all px-2">Ref: {reference}</p>
      )}

      <p className="text-center text-[11px] text-slate-400">
        {provider === 'moolre'
          ? 'Secured by Moolre'
          : provider === 'paystack'
            ? 'Secured by Paystack'
            : 'Secure payment'}
      </p>
    </div>
  )
}
