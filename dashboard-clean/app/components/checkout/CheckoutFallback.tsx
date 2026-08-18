type Props = {
  title: string
  message: string
}

export function CheckoutFallback({ title, message }: Props) {
  return (
    <div className="ui-enter bg-white rounded-2xl border border-slate-200 shadow-[0_8px_40px_rgba(15,23,42,0.07)] p-6 sm:p-8 text-center">
      <h1 className="text-[1.25rem] font-extrabold text-slate-900 font-display tracking-tight mb-2">{title}</h1>
      <p className="text-[14px] text-slate-500 leading-relaxed">{message}</p>
    </div>
  )
}

export function CheckoutLoading() {
  return (
    <div className="ui-enter bg-white rounded-2xl border border-slate-200 shadow-[0_8px_40px_rgba(15,23,42,0.07)] p-6 sm:p-8 flex flex-col items-center gap-4 text-center">
      <div className="size-10 rounded-2xl bg-clerk-light flex items-center justify-center">
        <div className="size-5 rounded-full border-2 border-clerk-primary border-t-transparent animate-spin" />
      </div>
      <p className="text-[14px] text-slate-500">Loading your order…</p>
    </div>
  )
}
