'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react'
import {
  cancelOrder,
  confirmOrder,
  createWhatsAppSession,
  disconnectWhatsApp,
  getConversation,
  getMe,
  listPaymentMethods,
  updateMe,
  getWhatsAppStatus,
  importInventory,
  listConversations,
  listInventory,
  listOrders,
  refreshWhatsAppSession,
  resumeConversation,
  sendCustomerMessage,
  setToken,
  takeoverConversation,
  type Conversation,
  type ConversationDetail,
  type InventoryItem,
  type MeResult,
  type Order,
  type WhatsAppSession
} from '@/lib/api'
import { ApiClientError, formatUserError } from '@/lib/errors'
import { bulkHasErrors, bulkImportRawText, bulkReadyCount, parseBulkInventory } from '@/lib/inventory-import'
import { syncPushSubscriptionIfGranted } from '@/lib/push'
import { isSetupComplete } from '@/lib/onboarding'

type DashboardContextValue = {
  me: MeResult | null
  session: WhatsAppSession | null
  inventory: InventoryItem[]
  conversations: Conversation[]
  orders: Order[]
  selectedConvId: string | null
  convDetail: ConversationDetail | null
  convLoading: boolean
  error: string
  busy: string
  busyConv: string | null
  busyOrder: string | null
  invName: string
  invPrice: string
  invStock: string
  invBulk: string
  invMode: 'single' | 'bulk'
  invSuccess: string
  invError: string
  invUploadPhase: 'idle' | 'uploading' | 'refreshing'
  initialLoading: boolean
  setupDismissed: boolean
  pendingOrders: number
  waConnected: boolean
  hasMomoOrPaystack: boolean
  setupComplete: boolean
  setInvName: (v: string) => void
  setInvPrice: (v: string) => void
  setInvStock: (v: string) => void
  setInvBulk: (v: string) => void
  setInvMode: (v: 'single' | 'bulk') => void
  setSetupDismissed: (v: boolean) => void
  loadAll: () => Promise<void>
  refreshInventory: () => Promise<void>
  patchInventoryItem: (item: InventoryItem) => void
  mergeInventoryItems: (items: InventoryItem[]) => void
  handleConnect: (phone?: string) => Promise<void>
  handleRefreshQr: () => Promise<void>
  handleDisconnect: () => Promise<void>
  openConversation: (id: string) => Promise<void>
  closeConversation: () => void
  handleResume: (id: string) => Promise<void>
  handleTakeover: (id: string) => Promise<void>
  handleAddInventory: (e: React.FormEvent) => Promise<void>
  handleConfirmOrder: (orderId: string, customerPhone: string) => Promise<void>
  handleCancelOrder: (orderId: string, customerPhone: string) => Promise<void>
  updateBusinessName: (name: string) => Promise<void>
  updateBusinessScope: (scope: string) => Promise<void>
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<MeResult | null>(null)
  const [session, setSession] = useState<WhatsAppSession | null>(null)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null)
  const [convDetail, setConvDetail] = useState<ConversationDetail | null>(null)
  const [convLoading, setConvLoading] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [busyConv, setBusyConv] = useState<string | null>(null)
  const [busyOrder, setBusyOrder] = useState<string | null>(null)
  const [invName, setInvName] = useState('')
  const [invPrice, setInvPrice] = useState('')
  const [invStock, setInvStock] = useState('1')
  const [invBulk, setInvBulk] = useState('')
  const [invMode, setInvMode] = useState<'single' | 'bulk'>('single')
  const [invSuccess, setInvSuccess] = useState('')
  const [invError, setInvError] = useState('')
  const [invUploadPhase, setInvUploadPhase] = useState<'idle' | 'uploading' | 'refreshing'>('idle')
  const [initialLoading, setInitialLoading] = useState(true)
  const [setupDismissed, setSetupDismissed] = useState(false)
  const [hasMomoOrPaystack, setHasMomoOrPaystack] = useState(false)

  const sortInventory = (items: InventoryItem[]) =>
    [...items].sort((a, b) => a.name.localeCompare(b.name))

  const updateBusinessName = useCallback(async (name: string) => {
    await updateMe({ businessName: name })
    setMe(prev => prev ? { ...prev, businessName: name } : prev)
  }, [])

  const updateBusinessScope = useCallback(async (scope: string) => {
    await updateMe({ businessScope: scope })
    setMe(prev => prev ? { ...prev, businessScope: scope } : prev)
  }, [])

  function handleAuthError(err: unknown): boolean {
    if (ApiClientError.isUnauthorized(err)) {
      setToken(null)
      window.location.href = '/login'
      return true
    }
    return false
  }

  const loadAll = useCallback(async () => {
    try {
      const [profile, inv, convs, ords, paymentCfg] = await Promise.all([
        getMe(),
        listInventory(),
        listConversations(),
        listOrders(),
        listPaymentMethods().catch((e: unknown) => {
          if (ApiClientError.isUnauthorized(e)) throw e
          return { methods: [] }
        })
      ])
      setMe(profile)
      setInventory(inv.items ?? [])
      setConversations(convs.conversations ?? [])
      setOrders(ords.orders ?? [])
      setHasMomoOrPaystack(
        (paymentCfg.methods ?? []).some(
          (m) => m.type === 'momo' || m.type === 'paystack' || m.type === 'moolre',
        ),
      )
      setError('')
      void syncPushSubscriptionIfGranted().catch(() => {
        /* optional — user can enable manually in Settings */
      })
    } catch (err) {
      if (handleAuthError(err)) return
      setError(formatUserError(err, "Couldn't load your dashboard. Refresh the page."))
    } finally {
      setInitialLoading(false)
    }
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const refreshInventory = useCallback(async () => {
    const inv = await listInventory()
    setInventory(inv.items ?? [])
  }, [])

  const patchInventoryItem = useCallback((item: InventoryItem) => {
    setInventory((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id)
      if (idx === -1) return prev
      const next = [...prev]
      next[idx] = item
      return sortInventory(next)
    })
  }, [])

  const mergeInventoryItems = useCallback((items: InventoryItem[]) => {
    if (items.length === 0) return
    setInventory((prev) => {
      const byId = new Map(prev.map((i) => [i.id, i]))
      for (const item of items) byId.set(item.id, item)
      return sortInventory(Array.from(byId.values()))
    })
  }, [])

  const pollActivity = useCallback(async () => {
    try {
      const [convs, ords] = await Promise.all([listConversations(), listOrders()])
      setConversations(convs.conversations ?? [])
      setOrders(ords.orders ?? [])
      setError('')
    } catch (err) {
      if (handleAuthError(err)) return
      setError(formatUserError(err, "Couldn't refresh your dashboard."))
    }
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const pollStatus = useCallback(async () => {
    try {
      const status = await getWhatsAppStatus()
      setSession((prev) => {
        if (status.pairingCode) return status
        if (status.qr) return status
        if (prev?.pairingCode && status.status === 'qr') {
          return { ...status, pairingCode: prev.pairingCode, phone: prev.phone }
        }
        if (prev?.qr && status.status === 'qr') {
          return { ...status, qr: prev.qr }
        }
        return status
      })
      // Prefer gateway reachout when present. Never wipe DB-backed me.reachout
      // just because gateway memory is empty (restart) — /me is the durable source.
      if (status.reachout?.restricted) {
        setMe((prev) => (prev ? { ...prev, reachout: status.reachout } : prev))
      }
    } catch (err) {
      handleAuthError(err)
    }
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!localStorage.getItem('clerk_token')) {
      window.location.href = '/login'
      return
    }
    void loadAll()
    void pollStatus()
  }, [loadAll, pollStatus])

  useEffect(() => {
    if (!session) return
    const pairing = session.status === 'qr' || session.status === 'connecting'
    const ms = pairing ? 3000 : 30_000
    const id = setInterval(() => void pollStatus(), ms)
    return () => clearInterval(id)
  }, [session?.status, session, pollStatus])

  // Poll orders + conversations every 10 seconds (inventory only on demand).
  useEffect(() => {
    if (initialLoading) return
    const id = setInterval(() => void pollActivity(), 10_000)
    return () => clearInterval(id)
  }, [initialLoading, pollActivity])

  const refreshSelectedConversation = useCallback(async () => {
    if (!selectedConvId) return
    try {
      const detail = await getConversation(selectedConvId)
      setConvDetail(detail)
      await loadAll()
    } catch (err) {
      setError(formatUserError(err, "Couldn't refresh this conversation."))
    }
  }, [selectedConvId, loadAll])

  const handleConnect = useCallback(async (phone?: string) => {
    setBusy('connect')
    setError('')
    try {
      setSession(await createWhatsAppSession(phone))
    } catch (err) {
      setError(formatUserError(err, "Couldn't start WhatsApp linking. Try again."))
    } finally {
      setBusy('')
    }
  }, [])

  const handleRefreshQr = useCallback(async () => {
    setBusy('qr')
    try {
      setSession(await refreshWhatsAppSession())
    } catch (err) {
      setError(formatUserError(err, "Couldn't refresh the QR code. Try again."))
    } finally {
      setBusy('')
    }
  }, [])

  const handleDisconnect = useCallback(async () => {
    setBusy('disconnect')
    try {
      await disconnectWhatsApp()
      setSession({
        sessionId: me?.id ?? '',
        status: 'idle',
        connected: false,
        phone: null,
        qr: null,
        pairingCode: null
      })
    } catch (err) {
      setError(formatUserError(err, "Couldn't disconnect WhatsApp. Try again."))
    } finally {
      setBusy('')
    }
  }, [me?.id])

  const openConversation = useCallback(async (conversationId: string) => {
    setSelectedConvId(conversationId)
    setConvLoading(true)
    setConvDetail(null)
    try {
      setConvDetail(await getConversation(conversationId))
    } catch (err) {
      setError(formatUserError(err, "Couldn't open this conversation."))
      setSelectedConvId(null)
    } finally {
      setConvLoading(false)
    }
  }, [])

  const closeConversation = useCallback(() => {
    setSelectedConvId(null)
    setConvDetail(null)
  }, [])

  const handleResume = useCallback(
    async (conversationId: string) => {
      setBusyConv(conversationId)
      setError('')
      try {
        await resumeConversation(conversationId)
        await loadAll()
        if (selectedConvId === conversationId) await refreshSelectedConversation()
      } catch (err) {
        setError(formatUserError(err, "Couldn't hand the chat back to Clerk."))
      } finally {
        setBusyConv(null)
      }
    },
    [loadAll, refreshSelectedConversation, selectedConvId]
  )

  const handleTakeover = useCallback(
    async (conversationId: string) => {
      setBusyConv(conversationId)
      setError('')
      try {
        await takeoverConversation(conversationId)
        await loadAll()
        if (selectedConvId === conversationId) await refreshSelectedConversation()
      } catch (err) {
        setError(formatUserError(err, "Couldn't take over this chat."))
      } finally {
        setBusyConv(null)
      }
    },
    [loadAll, refreshSelectedConversation, selectedConvId]
  )

  const handleAddInventory = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setBusy('inventory')
      setError('')
      setInvError('')
      setInvSuccess('')
      setInvUploadPhase('uploading')

      let optimisticIds: string[] = []
      try {
        let rawText: string
        let optimisticItems: InventoryItem[] = []
        if (invMode === 'bulk') {
          rawText = invBulk.trim()
          if (!rawText) throw new Error('Paste at least one product line')
          if (bulkHasErrors(rawText)) {
            const { invalid } = parseBulkInventory(rawText)
            const first = invalid[0]
            throw new Error(
              first
                ? `Line ${first.line} has invalid format. Use: Name - price or Name - price stock`
                : 'Fix invalid lines before importing'
            )
          }
          const parsed = parseBulkInventory(rawText).valid
          rawText = bulkImportRawText(parsed)
          optimisticItems = parsed.map((line, idx) => ({
            id: `temp-${Date.now()}-${idx}`,
            name: line.name,
            price: line.price,
            stock: line.stock,
          }))
        } else {
          const name = invName.trim()
          const price = parseInt(invPrice, 10)
          const stock = parseInt(invStock, 10)
          if (!name) throw new Error('Product name is required')
          if (!Number.isFinite(price) || price <= 0) throw new Error('Enter a valid price')
          if (!Number.isFinite(stock) || stock < 0) throw new Error('Enter a valid stock count')
          rawText = stock === 1 ? `${name} - ${price}` : `${name} - ${price} ${stock}`
          optimisticItems = [
            {
              id: `temp-${Date.now()}`,
              name,
              price,
              stock,
            },
          ]
        }

        optimisticIds = optimisticItems.map((item) => item.id)
        setInventory((prev) => sortInventory([...prev, ...optimisticItems]))
        const { inserted, items } = await importInventory(rawText)
        setInventory((prev) => prev.filter((item) => !optimisticIds.includes(item.id)))
        if (items?.length) {
          mergeInventoryItems(items)
        } else {
          setInvUploadPhase('refreshing')
          await refreshInventory()
        }
        setInvSuccess(`Added ${inserted} product${inserted === 1 ? '' : 's'} to your catalog`)
        setInvName('')
        setInvPrice('')
        setInvStock('1')
        setInvBulk('')
      } catch (err) {
        if (optimisticIds.length > 0) {
          setInventory((prev) => prev.filter((item) => !optimisticIds.includes(item.id)))
        }
        const msg = formatUserError(err, "Couldn't add those products.")
        setInvError(msg)
        setError(msg)
      } finally {
        setBusy('')
        setInvUploadPhase('idle')
      }
    },
    [invMode, invBulk, invName, invPrice, invStock, refreshInventory, mergeInventoryItems]
  )

  const handleConfirmOrder = useCallback(
    async (orderId: string, customerPhone: string) => {
      setBusyOrder(orderId)
      setError('')
      try {
        const result = await confirmOrder(orderId)
        if (result.notifyCustomer && result.customerMessage && result.order.customerPhone) {
          try {
            await sendCustomerMessage(result.order.customerPhone, result.customerMessage, {
              recordInCore: false,
            })
          } catch (waErr) {
            setError("Order confirmed, but we couldn't notify the customer on WhatsApp.")
          }
        }
        await loadAll()
      } catch (err) {
        setError(formatUserError(err, "Couldn't confirm this order."))
      } finally {
        setBusyOrder(null)
      }
    },
    [loadAll]
  )

  const handleCancelOrder = useCallback(
    async (orderId: string, customerPhone: string) => {
      setBusyOrder(orderId)
      setError('')
      try {
        const result = await cancelOrder(orderId)
        if (result.notifyCustomer && result.customerMessage && result.order.customerPhone) {
          try {
            await sendCustomerMessage(result.order.customerPhone, result.customerMessage, {
              recordInCore: false,
            })
          } catch (waErr) {
            setError("Order declined, but we couldn't notify the customer on WhatsApp.")
          }
        }
        await loadAll()
      } catch (err) {
        setError(formatUserError(err, "Couldn't cancel this order."))
      } finally {
        setBusyOrder(null)
      }
    },
    [loadAll]
  )

  const pendingOrders = orders.filter((o) => o.status === 'PENDING_CONFIRMATION').length
  const waConnected = session?.connected === true
  const setupComplete = isSetupComplete(waConnected, inventory.length)

  const setSetupDismissedPersist = useCallback(
    (dismissed: boolean) => {
      setSetupDismissed(dismissed)
      if (!me?.id || typeof window === 'undefined') return
      const key = `clerk_setup_banner_dismissed_${me.id}`
      try {
        if (dismissed) localStorage.setItem(key, '1')
        else localStorage.removeItem(key)
      } catch {
        /* private browsing */
      }
    },
    [me?.id]
  )

  useEffect(() => {
    if (!me?.id || typeof window === 'undefined') return
    try {
      setSetupDismissed(localStorage.getItem(`clerk_setup_banner_dismissed_${me.id}`) === '1')
    } catch {
      /* ignore */
    }
  }, [me?.id])

  const value = useMemo<DashboardContextValue>(
    () => ({
      me,
      session,
      inventory,
      conversations,
      orders,
      selectedConvId,
      convDetail,
      convLoading,
      error,
      busy,
      busyConv,
      busyOrder,
      invName,
      invPrice,
      invStock,
      invBulk,
      invMode,
      invSuccess,
      invError,
      invUploadPhase,
      initialLoading,
      setupDismissed,
      pendingOrders,
      waConnected,
      hasMomoOrPaystack,
      setupComplete,
      setInvName,
      setInvPrice,
      setInvStock,
      setInvBulk,
      setInvMode,
      setSetupDismissed: setSetupDismissedPersist,
      loadAll,
      refreshInventory,
      patchInventoryItem,
      mergeInventoryItems,
      handleConnect,
      handleRefreshQr,
      handleDisconnect,
      openConversation,
      closeConversation,
      handleResume,
      handleTakeover,
      handleAddInventory,
      handleConfirmOrder,
      handleCancelOrder,
      updateBusinessName,
      updateBusinessScope
    }),
    [
      me,
      session,
      inventory,
      conversations,
      orders,
      selectedConvId,
      convDetail,
      convLoading,
      error,
      busy,
      busyConv,
      busyOrder,
      invName,
      invPrice,
      invStock,
      invBulk,
      invMode,
      invSuccess,
      invError,
      invUploadPhase,
      initialLoading,
      setupDismissed,
      pendingOrders,
      waConnected,
      hasMomoOrPaystack,
      setupComplete,
      setSetupDismissedPersist,
      loadAll,
      refreshInventory,
      patchInventoryItem,
      mergeInventoryItems,
      handleConnect,
      handleRefreshQr,
      handleDisconnect,
      openConversation,
      closeConversation,
      handleResume,
      handleTakeover,
      handleAddInventory,
      handleConfirmOrder,
      handleCancelOrder,
      updateBusinessName,
      updateBusinessScope
    ]
  )

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}

export function useDashboard() {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider')
  return ctx
}
