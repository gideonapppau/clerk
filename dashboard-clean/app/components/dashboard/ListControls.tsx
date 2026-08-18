import type { ReactNode } from 'react'
import { Num } from '@/components/Num'

const searchInputClass =
  'w-full pl-10 pr-3.5 py-3 sm:py-2.5 text-[16px] sm:text-[14px] text-slate-900 bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-clerk-primary/25 focus:border-clerk-primary transition-all'

type ScrollProps = {
  children: ReactNode
  className?: string
}

/** Keeps long lists inside the panel instead of stretching the page. */
export function ListScrollArea({ children, className = '' }: ScrollProps) {
  return (
    <div
      className={`max-h-[min(58vh,520px)] sm:max-h-[min(62vh,600px)] overflow-y-auto overscroll-contain ${className}`.trim()}
    >
      {children}
    </div>
  )
}

type SearchProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  id?: string
}

export function ListSearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  id = 'list-search',
}: SearchProps) {
  return (
    <div className="relative">
      <span
        className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        style={{ fontSize: 18 }}
        aria-hidden
      >
        search
      </span>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className={searchInputClass}
      />
    </div>
  )
}

type FooterProps = {
  showing: number
  total: number
  hasMore: boolean
  onLoadMore: () => void
}

export function ListShowMoreFooter({ showing, total, hasMore, onLoadMore }: FooterProps) {
  if (total === 0) return null

  return (
    <div className="px-4 sm:px-5 py-3 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-2.5">
      <p className="text-[12px] text-slate-500 tabular-nums">
        Showing <Num>{showing}</Num> of <Num>{total}</Num>
      </p>
      {hasMore ? (
        <button
          type="button"
          onClick={onLoadMore}
          className="w-full sm:w-auto min-h-[40px] inline-flex items-center justify-center text-[12px] font-semibold text-slate-700 border border-slate-200 bg-white px-4 py-2 rounded-full hover:bg-slate-50 transition-colors touch-manipulation"
        >
          Show more
        </button>
      ) : null}
    </div>
  )
}
