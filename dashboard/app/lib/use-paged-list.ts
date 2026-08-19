import { useEffect, useMemo, useState } from 'react'

export const LIST_PAGE_SIZE = 30

/** Slice a list for display; resets when `resetKey` or length changes. */
export function usePagedList<T>(items: T[], pageSize = LIST_PAGE_SIZE, resetKey = '') {
  const [limit, setLimit] = useState(pageSize)

  useEffect(() => {
    setLimit(pageSize)
  }, [items.length, resetKey, pageSize])

  const visible = useMemo(() => items.slice(0, limit), [items, limit])
  const hasMore = items.length > limit

  return {
    visible,
    hasMore,
    total: items.length,
    showing: visible.length,
    loadMore: () => setLimit((n) => Math.min(n + pageSize, items.length)),
    ensureIndexVisible: (index: number) => {
      if (index < 0) return
      setLimit((n) => Math.max(n, index + 1))
    },
  }
}
