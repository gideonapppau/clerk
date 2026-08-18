import Image from 'next/image'

export function CheckoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-[#f5f4f0] flex flex-col overflow-x-hidden">
      <header className="px-5 pt-safe shrink-0">
        <div className="flex justify-center py-4 sm:py-5">
          <div className="flex items-center gap-2.5">
            <Image
              src="/clerk logo.svg"
              alt=""
              width={28}
              height={28}
              className="shrink-0"
              style={{ height: 28, width: 'auto' }}
            />
            <span className="font-display font-bold text-[15px] text-slate-900 tracking-tight">
              Clerk
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start sm:justify-center px-4 sm:px-5 pb-6 sm:pb-14 pb-safe">
        <div className="w-full max-w-sm py-2 sm:py-0">{children}</div>
      </main>
    </div>
  )
}
