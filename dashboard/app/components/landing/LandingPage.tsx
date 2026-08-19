'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import {
  LANDING_FAQ,
  SUPPORT_EMAIL,
  SUPPORT_EMAIL_HREF,
  SUPPORT_WHATSAPP_DISPLAY,
  SUPPORT_WHATSAPP_HREF,
  WHY_CLERK_PILLARS,
} from '@/lib/marketing'

const SELLER_VOICE = [
  {
    quote: 'I stopped opening WhatsApp for price questions.',
    detail: 'Clerk answers from your catalog. You step in when someone is ready to buy.',
  },
  {
    quote: 'My shop didn\u2019t close when I did.',
    detail: 'Orders come in overnight. You approve them in the morning.',
  },
  {
    quote: 'Customers stopped sending \u201cHello??\u201d',
    detail: 'They get a reply in seconds, on your number, in your voice.',
  },
  {
    quote: 'I only open WhatsApp when someone is serious.',
    detail: 'Price and stock questions are handled. Orders wait for your OK.',
  },
] as const

const HERO_SUBLINE =
  'Customers message. Clerk replies. Orders land while you sleep. You fulfil in the morning.'

const HERO_STATS = [
  { value: '9 sec', label: 'First reply in' },
  { value: '<60 sec', label: 'Setup time' },
  { value: 'Auto', label: 'Clear orders confirmed' },
] as const

const COMPARISON_ROWS = [
  { label: 'Replies while asleep', manual: '✕', clerk: '✓' },
  { label: 'Repeats prices all day', manual: '✓', clerk: '✕' },
  { label: 'Gets orders while you sleep', manual: '✕', clerk: '✓' },
  { label: 'Requires you online', manual: 'Always', clerk: 'Only when needed' },
  { label: 'Customer waits', manual: 'Often', clerk: 'Rarely' },
] as const

const MORNING_STATS = [
  { value: '11', label: 'Orders waiting' },
  { value: '2', label: 'Needed a closer look' },
  { value: '9 sec', label: 'Average reply' },
] as const

const PROBLEM_STEPS = ['You slept.', 'Customer asked.', 'No reply.', 'They bought elsewhere.'] as const
const SOLUTION_STEPS = ['Clerk replied.', 'Order waited.', 'You approved.'] as const

function SellerVoiceCard({ item }: { item: (typeof SELLER_VOICE)[number] }) {
  return (
    <article className="bg-white rounded-2xl p-6 border border-slate-200 flex flex-col gap-3">
      <h3 className="text-[1.05rem] sm:text-[1.15rem] font-bold text-slate-900 leading-snug font-display">
        &ldquo;{item.quote}&rdquo;
      </h3>
      <p className="text-[13px] text-slate-500 leading-relaxed">{item.detail}</p>
    </article>
  )
}

function ComparisonTable() {
  return (
    <div className="overflow-x-auto scroll-touch-x -mx-5 px-5 sm:mx-0 sm:px-0">
      <div className="min-w-[300px] overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-[12px] sm:text-[13px]">
          <thead>
            <tr className="border-b border-slate-100 bg-[#f5f4f0]">
              <th className="px-3 sm:px-4 py-3 font-semibold text-slate-500" scope="col" />
              <th className="px-3 sm:px-4 py-3 font-semibold text-slate-500 text-right whitespace-nowrap" scope="col">
                <span className="inline-flex items-center justify-end gap-1.5 sm:gap-2">
                  <Image src="/whatsapp.svg" alt="" width={16} height={16} className="shrink-0 sm:w-[18px] sm:h-[18px]" />
                  <span>Manual</span>
      </span>
              </th>
              <th className="px-3 sm:px-4 py-3 font-semibold text-clerk-primary-darker text-right whitespace-nowrap" scope="col">
                <span className="inline-flex items-center justify-end gap-1.5 sm:gap-2">
                  <Image src="/clerk logo.svg" alt="" width={16} height={16} className="shrink-0 sm:w-[18px] sm:h-[18px]" />
                  <span>Clerk</span>
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row) => (
              <tr key={row.label} className="border-b border-slate-100 last:border-0">
                <th className="px-3 sm:px-4 py-3 sm:py-3.5 font-medium text-slate-800 pr-2" scope="row">{row.label}</th>
                <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-right text-slate-400 tabular-nums whitespace-nowrap">{row.manual}</td>
                <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-right font-semibold text-clerk-primary-darker tabular-nums whitespace-nowrap">{row.clerk}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
  )
}

const FAQ = LANDING_FAQ

function PhoneShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative select-none">
      <div className="absolute -left-[3px] top-[80px] w-[3px] h-6 bg-slate-700 rounded-l-sm hidden sm:block" aria-hidden />
      <div className="absolute -left-[3px] top-[114px] w-[3px] h-9 bg-slate-700 rounded-l-sm hidden sm:block" aria-hidden />
      <div className="absolute -left-[3px] top-[158px] w-[3px] h-9 bg-slate-700 rounded-l-sm hidden sm:block" aria-hidden />
      <div className="absolute -right-[3px] top-[110px] w-[3px] h-12 bg-slate-700 rounded-r-sm hidden sm:block" aria-hidden />
      <div className="relative rounded-[2.8rem] border-[6px] border-slate-900 bg-slate-900 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.04)]">
        <div className="rounded-[2.3rem] overflow-hidden">{children}</div>
      </div>
    </div>
  )
}

type DemoMessage = { from: 'customer' | 'shop'; text: string; time: string }

type MerchantAlert = { title: string; body: string; action?: string }

const DEMO_SCENARIOS = [
  {
    tab: 'Price check',
    label: 'Customer asks for a price',
    blurb: 'Clerk answers from your catalog instantly and pings you when someone\u2019s ready to buy.',
    sellerName: 'Kofi Gadgets',
    avatar:
      'https://images.pexels.com/photos/8476590/pexels-photo-8476590.jpeg?auto=compress&cs=tinysrgb&w=200&q=80',
    dayLabel: 'Today',
    messages: [
      { from: 'customer', text: 'Hi please how much is the iPhone 12?', time: '9:14 PM' },
      { from: 'shop', text: 'Hi! iPhone 12 (128GB) is GHS 3,500. Want me to hold one for you?', time: '9:14 PM' },
      { from: 'customer', text: 'Yes please 🙏', time: '9:15 PM' },
      { from: 'shop', text: 'Perfect. Sending MoMo details now.', time: '9:15 PM' },
    ] satisfies DemoMessage[],
    merchantAlert: {
      title: 'New order',
      body: 'iPhone 12 · GHS 3,500 from Kwame A.',
      action: 'View order',
    },
    notifyAfter: 3,
  },
  {
    tab: 'Stock check',
    label: 'Customer checks availability',
    blurb: 'Stock and price questions get answered while you\u2019re busy with something else.',
    sellerName: 'Ama Boutique',
    avatar:
      'https://images.pexels.com/photos/8655018/pexels-photo-8655018.jpeg?auto=compress&cs=tinysrgb&w=200&q=80',
    dayLabel: 'Today',
    messages: [
      { from: 'customer', text: 'Do you still have the black Air Force 1 in size 42?', time: '2:31 PM' },
      { from: 'shop', text: 'Yes, size 42 in black, GHS 620. Should I reserve a pair?', time: '2:31 PM' },
      { from: 'customer', text: "Please yes. I'll pick up tomorrow.", time: '2:32 PM' },
      { from: 'shop', text: 'Done. Come in before 7pm and ask for your order.', time: '2:32 PM' },
    ] satisfies DemoMessage[],
  },
  {
    tab: 'You approve',
    label: 'Order waits for your OK',
    blurb: 'Clerk captures the order and sends you a notification. Tap approve, customer gets confirmed.',
    sellerName: 'Nana Phones',
    avatar:
      'https://images.pexels.com/photos/3801422/pexels-photo-3801422.jpeg?auto=compress&cs=tinysrgb&w=200&q=80',
    dayLabel: 'Today',
    messages: [
      { from: 'customer', text: 'I\u2019ll take the JBL Charge 5', time: '4:20 PM' },
      {
        from: 'shop',
        text: 'JBL Charge 5\nGHS 950\n\nWant me to reserve it?',
        time: '4:20 PM',
      },
      { from: 'customer', text: 'Yes please', time: '4:21 PM' },
      { from: 'shop', text: 'Got it. One moment.', time: '4:21 PM' },
      {
        from: 'shop',
        text: 'Order confirmed ✅\n\n• JBL Charge 5 · GHS 950\nTotal: GHS 950',
        time: '4:22 PM',
      },
    ] satisfies DemoMessage[],
    merchantAlert: {
      title: 'Order waiting',
      body: 'JBL Charge 5 · GHS 950 from Yaw D.',
      action: 'Approve',
    },
    notifyAfter: 4,
  },
  {
    tab: 'After hours',
    label: 'Message at 2am, still captured',
    blurb: 'A customer messages at 2am. Clerk replies and leaves the order on your phone for morning.',
    sellerName: 'Auntie Esi',
    avatar:
      'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=200&q=80',
    dayLabel: 'Today',
    messages: [
      { from: 'customer', text: 'Hey are you open? I need fabric urgently', time: '2:07 AM' },
      { from: 'shop', text: 'We\u2019re closed but I can still take your order. What fabric and how many yards?', time: '2:07 AM' },
      { from: 'customer', text: 'Ankara, 6 yards, the red one you posted', time: '2:08 AM' },
      { from: 'shop', text: 'Got it. 6 yards red Ankara. I\u2019ll confirm first thing in the morning.', time: '2:08 AM' },
    ] satisfies DemoMessage[],
    merchantAlert: {
      title: 'Order while you slept',
      body: 'Ankara 6yds · red from Efua M.',
      action: 'View order',
    },
    notifyAfter: 3,
  },
] as const

const DEMO_END_HOLD_MS = 3800
const DEMO_SHOP_SEND_GAP_MS = 100
const DEMO_APPROVE_PAUSE_MS = 2600
const DEMO_APPROVED_FLASH_MS = 900

function typingMsFor(text: string): number {
  return Math.min(1700, Math.max(600, text.length * 22))
}

function readMsFor(msg: DemoMessage): number {
  const base = msg.from === 'shop' ? 1400 : 1100
  return Math.min(2600, base + msg.text.length * 9)
}

function incomingMsFor(msg: DemoMessage): number {
  if (msg.from !== 'customer') return 0
  return Math.min(450, 180 + msg.text.length * 7)
}

function ClerkMerchantNotification({
  title,
  body,
  action,
  approved,
}: MerchantAlert & { approved?: boolean }) {
  return (
    <div
      className={`demo-notification-in backdrop-blur-xl rounded-[1.1rem] shadow-[0_10px_40px_rgba(0,0,0,0.22)] border p-2.5 flex gap-2.5 transition-colors duration-300 ${
        approved ? 'bg-[#ecfdf5]/98 border-clerk-primary/30' : 'bg-white/95 border-white/90'
      }`}
      role="status"
      aria-live="polite"
    >
      <div
        className={`size-9 rounded-[10px] flex items-center justify-center shrink-0 ring-1 transition-colors duration-300 ${
          approved ? 'bg-clerk-primary/20 ring-clerk-primary/30' : 'bg-[#ecfdf5] ring-clerk-primary/15'
        }`}
      >
        {approved ? (
          <span className="material-symbols-outlined text-clerk-primary-darker" style={{ fontSize: 20 }}>
            check_circle
          </span>
        ) : (
          <Image src="/clerk logo.svg" alt="" width={22} height={22} className="shrink-0" />
        )}
      </div>
      <div className="min-w-0 flex-1 pt-px">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-bold text-slate-900 tracking-tight">Clerk</p>
          <p className="text-[9px] text-slate-400 font-medium tabular-nums">{approved ? 'just now' : 'now'}</p>
        </div>
        <p className="text-[11px] font-semibold text-slate-900 leading-snug mt-0.5">
          {approved ? 'Order approved' : title}
        </p>
        <p className="text-[10px] text-slate-500 leading-snug mt-0.5">{body}</p>
        {action && !approved && (
          <p className="mt-1.5 inline-flex text-[10px] font-bold text-clerk-primary-darker bg-clerk-primary/15 px-2 py-0.5 rounded-full">
            {action}
          </p>
        )}
      </div>
    </div>
  )
}

function demoStatusTime(messages: readonly DemoMessage[]): string {
  const raw = messages[0]?.time ?? '9:41'
  return raw.replace(/\s*(AM|PM)$/i, '')
}

function DemoPhoneStatusBar({ time }: { time: string }) {
  return (
    <div className="bg-[#008069] px-4 pt-2 pb-0.5 flex items-center justify-between text-[11px] text-white font-medium shrink-0 tabular-nums">
      <span>{time}</span>
      <div className="flex items-center gap-1" aria-hidden>
        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>signal_cellular_alt</span>
        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>wifi</span>
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>battery_full</span>
      </div>
    </div>
  )
}

function demoScenarioDuration(
  msgs: readonly DemoMessage[],
  notifyAfter?: number,
  withApproveFlash?: boolean,
): number {
  let total = DEMO_END_HOLD_MS
  for (const msg of msgs) {
    total += incomingMsFor(msg) + readMsFor(msg)
    if (msg.from === 'shop') total += typingMsFor(msg.text) + DEMO_SHOP_SEND_GAP_MS
  }
  if (notifyAfter != null && notifyAfter < msgs.length) {
    total += DEMO_APPROVE_PAUSE_MS
    if (withApproveFlash) total += DEMO_APPROVED_FLASH_MS
  }
  return total
}

function DemoTabs({ primaryHref }: { primaryHref: string }) {
  const [active, setActive] = useState(0)
  const [progress, setProgress] = useState(0)
  const [visibleMessages, setVisibleMessages] = useState(0)
  const [showTyping, setShowTyping] = useState(false)
  const [showMerchantAlert, setShowMerchantAlert] = useState(false)
  const [alertApproved, setAlertApproved] = useState(false)
  const pausedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []
    let rafId = 0
    const scenario = DEMO_SCENARIOS[active]
    const msgs = scenario.messages
    const notifyAfter = 'notifyAfter' in scenario ? scenario.notifyAfter : undefined
    const merchantAlert = 'merchantAlert' in scenario ? scenario.merchantAlert : undefined
    const withApproveFlash = Boolean(merchantAlert?.action === 'Approve' && notifyAfter != null)
    const totalMs = demoScenarioDuration(msgs, notifyAfter, withApproveFlash)
    const startedAt = performance.now()

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.push(
          setTimeout(() => {
            if (!cancelled) resolve()
          }, ms),
        )
      })

    function tickProgress() {
      if (cancelled) return
      const elapsed = performance.now() - startedAt
      setProgress(Math.min(100, (elapsed / totalMs) * 100))
      if (elapsed < totalMs) {
        rafId = requestAnimationFrame(tickProgress)
      }
    }

    async function run() {
    setProgress(0)
      setVisibleMessages(0)
      setShowTyping(false)
      setShowMerchantAlert(false)
      setAlertApproved(false)
      rafId = requestAnimationFrame(tickProgress)

      for (let i = 0; i < msgs.length; i++) {
        if (cancelled) return
        const msg = msgs[i]

        const incoming = incomingMsFor(msg)
        if (incoming > 0) await wait(incoming)

        if (msg.from === 'shop') {
          setShowTyping(true)
          await wait(typingMsFor(msg.text))
          if (cancelled) return
          setShowTyping(false)
          await wait(DEMO_SHOP_SEND_GAP_MS)
        }

        setVisibleMessages(i + 1)
        await wait(readMsFor(msg))

        if (notifyAfter === i + 1 && i < msgs.length - 1) {
          if (merchantAlert) setShowMerchantAlert(true)
          await wait(DEMO_APPROVE_PAUSE_MS)
          if (withApproveFlash) {
            setAlertApproved(true)
            await wait(DEMO_APPROVED_FLASH_MS)
          }
        }
      }

      if (cancelled) return
      if (notifyAfter == null && merchantAlert) setShowMerchantAlert(true)
      await wait(DEMO_END_HOLD_MS)
      while (pausedRef.current && !cancelled) {
        await wait(200)
      }
      if (!cancelled) setActive((a) => (a + 1) % DEMO_SCENARIOS.length)
    }

    run()
    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
      timers.forEach(clearTimeout)
    }
  }, [active])

  const s = DEMO_SCENARIOS[active]

  return (
    <section id="demo" className="bg-white border-t border-slate-100 px-5 sm:px-8 py-14 sm:py-28 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 sm:mb-12 max-w-xl">
          <h2 className="text-[1.75rem] sm:text-[2.5rem] font-extrabold text-slate-900 tracking-tight font-display mb-3">
            Customer messages. Clerk handles it.{' '}
            <span className="text-clerk-primary-darker">You close.</span>
          </h2>
          <p className="text-[15px] text-slate-500 leading-relaxed">
            Sample chats. The same flow on your WhatsApp number. Average first reply: 9 seconds.
          </p>
        </div>

        <div className="flex gap-2 mb-3 overflow-x-auto scroll-touch-x flex-nowrap pb-1 -mx-5 px-5 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible snap-x snap-mandatory">
            {DEMO_SCENARIOS.map((sc, i) => (
              <button
                key={sc.tab}
              type="button"
              onClick={() => setActive(i)}
              className={`shrink-0 snap-start rounded-full px-4 py-2.5 min-h-[44px] text-[13px] font-semibold transition-colors cursor-pointer touch-manipulation ${
                active === i
                  ? 'bg-slate-900 text-white'
                  : 'bg-[#f5f4f0] text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
              }`}
            >
              {sc.tab}
              </button>
            ))}
          </div>
        <div className="h-0.5 bg-slate-100 rounded-full overflow-hidden mb-8 max-w-md">
          <div
            className="h-full bg-clerk-primary rounded-full will-change-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div
          className="relative rounded-2xl border border-slate-200 bg-[#f5f4f0] shadow-[0_8px_40px_rgba(15,23,42,0.07)] overflow-hidden p-4 sm:p-10 lg:min-h-[520px]"
          onMouseEnter={() => {
            pausedRef.current = true
          }}
          onMouseLeave={() => {
            pausedRef.current = false
          }}
          onTouchStart={() => {
            pausedRef.current = true
          }}
          onTouchEnd={() => {
            pausedRef.current = false
          }}
          onTouchCancel={() => {
            pausedRef.current = false
          }}
          onFocus={() => {
            pausedRef.current = true
          }}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) pausedRef.current = false
          }}
        >
          <div className="mb-6 sm:mb-8 lg:mb-0 lg:absolute lg:top-8 lg:left-8 max-w-sm text-left">
            <h3 className="text-[1.45rem] sm:text-[1.65rem] font-bold text-slate-900 font-display mb-2 leading-snug">
              {s.label}
            </h3>
            <p className="text-[14px] text-slate-500 leading-relaxed mb-5 transition-opacity duration-300">
              {s.blurb}
            </p>
          <Link
            href={primaryHref}
              className="inline-flex items-center gap-2 bg-clerk-primary text-slate-950 text-[13px] font-bold px-5 py-2.5 rounded-full hover:bg-clerk-primary-dark hover:text-white transition-colors cursor-pointer"
          >
              Try Clerk on my number
            <span className="material-symbols-outlined ms-icon-filled" style={{ fontSize: 14 }}>arrow_forward</span>
          </Link>
        </div>

          <div className="flex justify-center lg:justify-end lg:pt-28 scale-[0.92] sm:scale-100 origin-top">
          <PhoneShell>
              <div
                key={active}
                className="relative w-[260px] sm:w-[280px] demo-wa-ui demo-chat-wallpaper flex flex-col h-[580px] sm:h-[640px]"
              >
                {showMerchantAlert && 'merchantAlert' in s && (
                  <div
                    className="absolute inset-0 z-20 bg-black/30 demo-overlay-in pointer-events-none"
                    aria-hidden
                  />
                )}
                {showMerchantAlert && 'merchantAlert' in s && (
                  <div className="absolute top-11 left-2.5 right-2.5 z-30 pointer-events-none">
                    <ClerkMerchantNotification {...s.merchantAlert} approved={alertApproved} />
                  </div>
                )}
                <div className="bg-[#008069] shrink-0">
                  <DemoPhoneStatusBar time={demoStatusTime(s.messages)} />
                  <div className="flex items-center gap-1 px-2 pb-2 pt-0.5">
                    <span className="material-symbols-outlined text-white shrink-0" style={{ fontSize: 22 }} aria-hidden>
                      arrow_back
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.avatar}
                      alt=""
                      className="size-10 rounded-full object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0 ml-1">
                      <p className="text-[16px] font-normal text-white leading-tight truncate">{s.sellerName}</p>
                      <p className="text-[12px] text-white/80 leading-tight transition-opacity duration-300">
                        {showTyping ? 'typing…' : 'online'}
                      </p>
                    </div>
                    <div className="flex items-center gap-5 pr-1 text-white shrink-0" aria-hidden>
                      <span className="material-symbols-outlined" style={{ fontSize: 22 }}>videocam</span>
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>call</span>
                  </div>
                </div>
              </div>

                <div className="flex-1 overflow-hidden px-[6px] pt-2 pb-1 flex flex-col justify-end">
                  {visibleMessages > 0 && (
                    <div
                      className={`flex justify-center mb-2 ${visibleMessages === 1 ? 'demo-day-pill-in' : ''}`}
                    >
                      <span className="text-[12.5px] text-[#54656f] bg-white/90 demo-wa-day-pill px-3 py-[5px]">
                        {s.dayLabel}
                      </span>
                    </div>
                  )}
                  {s.messages.slice(0, visibleMessages).map((m, i) => {
                    const prev = i > 0 ? s.messages[i - 1] : null
                    const groupedWithPrev = prev?.from === m.from
                    const isLast = i === visibleMessages - 1
                    const isShop = m.from === 'shop'
                    return (
                      <div
                        key={`${active}-${i}`}
                        className={`flex ${isShop ? 'justify-end' : 'justify-start'} ${
                          groupedWithPrev ? 'mt-[2px]' : 'mt-[3px]'
                        } ${isLast ? 'demo-wa-msg-in' : ''}`}
                      >
                        <div
                          className={`max-w-[75%] px-[9px] pt-[6px] pb-[6px] demo-wa-bubble ${
                            isShop ? 'bg-[#d9fdd3]' : 'bg-white'
                          }`}
                        >
                          <p className="demo-wa-bubble-text">
                            {m.text}
                            <span className="demo-wa-bubble-meta tabular-nums">
                              {m.time}
                              {isShop && (
                                <span className="material-symbols-outlined text-[#53bdeb] ms-icon-filled" style={{ fontSize: 15 }} aria-hidden>done_all</span>
                              )}
                            </span>
                          </p>
                    </div>
                  </div>
                    )
                  })}
                  {showTyping && (
                    <div className="flex justify-end mt-[3px] demo-wa-msg-in">
                      <div className="demo-wa-bubble demo-wa-typing px-[13px] py-[12px] flex gap-[4px] items-center">
                        <span className="size-[8px] rounded-full bg-[#8696a0] demo-typing-dot" style={{ animationDelay: '0ms' }} />
                        <span className="size-[8px] rounded-full bg-[#8696a0] demo-typing-dot" style={{ animationDelay: '200ms' }} />
                        <span className="size-[8px] rounded-full bg-[#8696a0] demo-typing-dot" style={{ animationDelay: '400ms' }} />
                    </div>
                  </div>
                )}
              </div>

                <div className="bg-[#f0f2f5] px-2 py-1.5 flex items-end gap-1 shrink-0 border-t border-black/[0.04]">
                  <span className="material-symbols-outlined text-[#54656f] shrink-0 p-1" style={{ fontSize: 24 }} aria-hidden>
                    add
                  </span>
                  <div className="flex-1 bg-white rounded-[24px] px-3 py-[9px] min-h-[42px] flex items-center shadow-[0_1px_0.5px_rgba(11,20,26,0.08)]">
                    <p className="text-[15px] text-[#667781]">Message</p>
                </div>
                  <span className="material-symbols-outlined text-[#54656f] shrink-0 p-1" style={{ fontSize: 24 }} aria-hidden>
                    mood
                  </span>
                  <span className="size-[42px] rounded-full bg-[#00a884] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined ms-icon-filled text-white" style={{ fontSize: 22 }}>mic</span>
                </span>
              </div>
            </div>
          </PhoneShell>
        </div>
        </div>
      </div>
    </section>
  )
}

const SELL_WHILE_WORDS = ['busy.', 'asleep.', 'at church.', 'delivering.', 'offline.'] as const

const HERO_HEADLINE_CLASS =
  'text-[1.85rem] sm:text-[2.85rem] lg:text-[3.25rem] font-extrabold leading-[1.08] tracking-tight font-display text-balance'

function HeroSquiggle() {
  return (
    <svg
      className="absolute left-0 right-0 -bottom-px h-[5px] w-full overflow-visible pointer-events-none"
      viewBox="0 0 100 6"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <path
        d="M1 4.2 C12 1.8, 22 5.1, 34 2.6 C46 0.8, 56 4.8, 68 2.2 C78 0.5, 88 4.2, 99 3.2"
                    stroke="#25d366"
        strokeWidth="1.75"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
  )
}

function HeroHeadline() {
  const [wordIndex, setWordIndex] = useState(0)
  const [wordTick, setWordTick] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      setWordIndex((i) => (i + 1) % SELL_WHILE_WORDS.length)
      setWordTick((n) => n + 1)
    }, 5500)
    return () => clearInterval(t)
  }, [])

  const word = SELL_WHILE_WORDS[wordIndex]

  return (
    <div>
      <h1 className={`m-0 text-slate-900 ${HERO_HEADLINE_CLASS}`} aria-live="polite">
        <span className="block">Sell while you&rsquo;re</span>
        <span className="block mt-1 min-h-[1.15em]">
          <span
            key={wordTick}
            className="relative inline-block w-fit max-w-full text-clerk-primary pb-1 hero-word"
          >
            {word}
            <HeroSquiggle />
          </span>
        </span>
      </h1>
      <p className="mt-3 text-[15px] sm:text-[16px] text-slate-600 leading-relaxed max-w-[440px]">
        {HERO_SUBLINE}
      </p>
    </div>
  )
}

function ProblemSolutionSection() {
  return (
    <section className="bg-slate-900 text-white border-t border-slate-800 px-5 sm:px-8 py-14 sm:py-20">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 md:gap-16">
        <div>
          <ul className="space-y-3">
            {PROBLEM_STEPS.map((step, i) => (
              <li
                key={step}
                className={`text-[1.1rem] sm:text-[1.25rem] font-semibold leading-snug font-display ${
                  i === PROBLEM_STEPS.length - 1 ? 'text-red-300' : 'text-slate-300'
                }`}
              >
                {step}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <ul className="space-y-3">
            {SOLUTION_STEPS.map((step, i) => (
              <li
                key={step}
                className={`text-[1.1rem] sm:text-[1.25rem] font-semibold leading-snug font-display ${
                  i === SOLUTION_STEPS.length - 1 ? 'text-clerk-primary' : 'text-white'
                }`}
              >
                {step}
              </li>
            ))}
          </ul>
    </div>
      </div>
    </section>
  )
}

function MerchantMirrorDemo({ primaryHref }: { primaryHref: string }) {
  const [showReply, setShowReply] = useState(false)

  useEffect(() => {
    setShowReply(false)
    const t = setTimeout(() => setShowReply(true), 1200)
    return () => clearTimeout(t)
  }, [])

  return (
    <section className="bg-white border-t border-slate-100 px-5 sm:px-8 py-14 sm:py-20" id="how" aria-labelledby="how-heading">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10 max-w-xl">
          <h2 id="how-heading" className="text-[1.75rem] sm:text-[2.5rem] font-extrabold text-slate-900 tracking-tight font-display mb-3">
            Live in under 60 seconds.
          </h2>
          <p className="text-[15px] text-slate-500">
            Paste your stock. Message your own number. See Clerk reply before you pay anything.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
          <div className="rounded-2xl border border-slate-200 bg-[#f5f4f0] p-5 sm:p-6">
            <pre className="text-[13px] sm:text-[14px] text-slate-800 font-mono leading-relaxed whitespace-pre-wrap">
              {`iPhone 12 - 3500`}
            </pre>
          </div>

          <div className="rounded-2xl border border-slate-200 demo-chat-wallpaper p-5 sm:p-6 flex flex-col gap-[3px] min-h-[200px] demo-wa-ui">
            <div className="flex justify-start">
              <div className="max-w-[85%] bg-white demo-wa-bubble px-[9px] py-[6px]">
                <p className="demo-wa-bubble-text">
                  Need iPhone 12
                  <span className="demo-wa-bubble-meta">9:41 AM</span>
                </p>
              </div>
            </div>
            {showReply && (
              <div className="flex justify-end mt-[3px] demo-wa-msg-in">
                <div className="max-w-[85%] bg-[#d9fdd3] demo-wa-bubble px-[9px] py-[6px]">
                  <p className="demo-wa-bubble-text">
                    Available. Want me to package this?
                    <span className="demo-wa-bubble-meta">
                      9:41 AM
                      <span className="material-symbols-outlined text-[#53bdeb] ms-icon-filled" style={{ fontSize: 15 }} aria-hidden>done_all</span>
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-200 border border-slate-200 rounded-2xl overflow-hidden mt-8">
          {[
            { step: '01', title: 'Connect WhatsApp' },
            { step: '02', title: 'Add products' },
            { step: '03', title: 'Test yourself' },
            { step: '04', title: 'Go live' },
          ].map((s) => (
            <div key={s.title} className="bg-white px-3 sm:px-4 py-3.5 sm:py-4 flex flex-col gap-1.5">
              <span className="text-[10px] font-extrabold text-clerk-primary-dark">{s.step}</span>
              <p className="text-[13px] font-semibold text-slate-900 font-display">{s.title}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-4">
          <Link
            href={primaryHref}
            className="inline-flex items-center gap-2 bg-clerk-primary text-slate-950 text-[13px] font-bold px-6 py-3 rounded-full hover:bg-clerk-primary-dark hover:text-white transition-colors"
          >
            Connect my WhatsApp
            <span className="material-symbols-outlined ms-icon-filled" style={{ fontSize: 14 }}>arrow_forward</span>
          </Link>
          <p className="text-[12px] text-slate-500">Your number, your catalog, your voice.</p>
        </div>
      </div>
    </section>
  )
}

function WhyClerkSection() {
  return (
    <section className="bg-white border-t border-slate-100 py-14 sm:py-28 px-5 sm:px-8" id="why-clerk">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10 sm:mb-12 max-w-xl">
          <h2 className="text-[1.75rem] sm:text-[2.5rem] font-extrabold text-slate-900 tracking-tight font-display mb-3">
            Built for Ghana. Built to grow beyond it.
          </h2>
          <p className="text-[15px] text-slate-500 leading-relaxed">
            Not a generic chatbot. Built for how Ghanaian sellers and customers actually talk, sell, and pay.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-slate-200 border border-slate-200 rounded-2xl overflow-hidden">
          {WHY_CLERK_PILLARS.map((pillar) => (
            <article key={pillar.title} className="bg-white p-6 sm:p-7 flex flex-col gap-3">
              <span
                className="size-10 shrink-0 rounded-xl bg-clerk-light flex items-center justify-center text-clerk-primary-darker"
                aria-hidden
              >
                <span
                  className="material-symbols-outlined ms-icon-filled block size-5 text-[20px] leading-none overflow-hidden"
                  style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 20" }}
                >
                  {pillar.icon}
                </span>
              </span>
              <h3 className="text-[1.05rem] font-bold text-slate-900 leading-snug font-display">{pillar.title}</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed flex-1">{pillar.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        type="button"
        className="w-full flex items-start justify-between py-4 sm:py-5 text-left gap-4 sm:gap-6 group min-h-[52px] touch-manipulation"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span className="text-[14px] font-semibold text-slate-900 leading-snug group-hover:text-clerk-primary-dark transition-colors">{q}</span>
        <span className={`shrink-0 size-6 rounded-lg flex items-center justify-center transition-colors mt-0.5 ${
          open ? 'bg-clerk-light text-clerk-primary-dark' : 'bg-slate-100 text-slate-500 group-hover:bg-clerk-light group-hover:text-clerk-primary-dark'
        }`}>
          <span className="material-symbols-outlined ms-icon-filled" style={{ fontSize: 15 }}>{open ? 'remove' : 'add'}</span>
        </span>
      </button>
      <div
        className="overflow-hidden transition-all duration-200 ease-in-out"
        style={{ maxHeight: open ? '28rem' : '0px', opacity: open ? 1 : 0 }}
      >
        <p className="text-[13px] text-slate-500 leading-relaxed pb-5 pr-12">{a}</p>
      </div>
    </div>
  )
}

export function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    setSignedIn(!!localStorage.getItem('clerk_token'))
  }, [])

  const primaryHref = signedIn ? '/dashboard' : '/login?mode=signup'
  const primaryCta = signedIn ? 'Open dashboard' : 'Connect my WhatsApp'
  const planHref = (plan: 'starter' | 'growth') =>
    signedIn ? `/dashboard/billing?plan=${plan}` : `/login?mode=signup&plan=${plan}`

  return (
    <div className="bg-white text-slate-900 overflow-x-hidden font-sans pb-safe">

      {/* ── Nav + proof bar ── */}
      <div className="sticky top-0 z-50 pt-safe">
      <nav className="bg-white/95 backdrop-blur-md border-b border-slate-100" aria-label="Main">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-14 sm:h-[60px] flex items-center justify-between gap-2 sm:gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image
              src="/clerk logo.svg"
              alt=""
              width={28}
              height={28}
              style={{ height: 28, width: 'auto' }}
              priority
            />
            <span className="font-display font-bold text-[15px] text-slate-900 tracking-tight">Clerk</span>
          </Link>

          {/* Center links */}
          <div className="hidden lg:flex items-center gap-7 text-[13px] font-medium text-slate-600">
            <a href="#how" className="hover:text-slate-900 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a>
          </div>

          {/* Right CTAs */}
          <div className="flex items-center gap-2">
            {!signedIn && (
              <Link href="/login" className="hidden sm:inline-flex text-[13px] font-medium text-slate-600 hover:text-slate-900 px-3 py-2 transition-colors">
                Log in
              </Link>
            )}
            <Link
              href={primaryHref}
              className="inline-flex items-center gap-1.5 bg-clerk-primary text-slate-950 text-[12px] sm:text-[13px] font-bold px-3 sm:px-4 py-2 min-h-[44px] rounded-full hover:bg-clerk-primary-dark hover:text-white transition-colors whitespace-nowrap touch-manipulation"
            >
              {primaryCta}
            </Link>
            <button
              type="button"
              className="lg:hidden size-11 min-h-[44px] min-w-[44px] rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 touch-manipulation"
              onClick={() => setMobileOpen(o => !o)}
              aria-expanded={mobileOpen}
              aria-label="Toggle menu"
            >
              <span className="material-symbols-outlined text-lg">{mobileOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white px-5 py-3 pb-4 space-y-0.5 text-[14px] font-medium text-slate-700">
            {[['#demo','Watch demo'],['#how','How it works'],['#pricing','Pricing'],['#faq','FAQ']].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="flex items-center min-h-[44px] py-2 hover:text-slate-900 touch-manipulation"
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </a>
            ))}
            {!signedIn && (
              <Link
                href="/login"
                className="flex items-center min-h-[44px] py-2 text-slate-500 hover:text-slate-900 touch-manipulation"
                onClick={() => setMobileOpen(false)}
              >
                Log in
              </Link>
            )}
          </div>
        )}
      </nav>
      <div className="border-b border-slate-100/80 px-5 py-1.5 text-center text-[10px] sm:text-[11px] text-slate-400">
        <span className="inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5">
          <span className="opacity-60" aria-hidden>⚡</span>
          <span>
            Last 24h: <span className="text-slate-500">214</span> customer messages answered
          </span>
          <span className="text-slate-300/80 hidden sm:inline" aria-hidden>·</span>
          <span>
            <span className="text-slate-500">61</span> orders captured
          </span>
        </span>
      </div>
      </div>

      {/* ── Hero ── */}
      <section className="relative min-h-0 sm:min-h-[520px] lg:min-h-[580px] flex items-center overflow-hidden bg-white">

        {/* Desktop — right half image (hidden on mobile so copy stays clean) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero.4470a26823ec6b27.jpg"
          alt=""
          aria-hidden
          className="absolute top-0 right-0 h-full w-1/2 object-cover object-center pointer-events-none hidden md:block"
        />
        <div className="absolute top-0 right-0 h-full w-1/2 bg-gradient-to-r from-white via-white/30 to-transparent pointer-events-none hidden md:block" aria-hidden />

        {/* ── Floating card: orders confirmed ── */}
        <div className="absolute hidden lg:flex bottom-12 right-[38%] z-20 ui-enter ui-enter-delay-1 flex-col gap-2 bg-white rounded-2xl p-4 shadow-[0_12px_48px_rgba(0,0,0,0.14)] border border-slate-100 w-[172px]">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-clerk-primary inline-block animate-pulse" />
            <p className="text-[10px] font-bold text-clerk-primary-dark">Orders while away</p>
          </div>
          <p className="text-[22px] font-extrabold text-slate-900 leading-none tracking-tight">3</p>
          <p className="text-[11px] text-slate-500 leading-snug">confirmed while you were busy</p>
          <p className="text-[10px] font-semibold text-clerk-primary-darker pt-2 border-t border-slate-100">
            Ready to fulfil
          </p>
        </div>

        {/* ── Floating card: new order ── */}
        <div className="absolute hidden lg:flex top-16 right-8 z-20 ui-enter ui-enter-delay-2 flex-col gap-2 bg-white rounded-2xl p-4 shadow-[0_12px_48px_rgba(0,0,0,0.14)] border border-slate-100 w-[162px]">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-bold text-slate-400">New order</p>
            <span className="size-1.5 rounded-full bg-clerk-primary inline-block animate-pulse" />
          </div>
          <p className="text-[20px] font-extrabold text-slate-900 leading-none tracking-tight">GHS 3,500</p>
          <p className="text-[11px] text-slate-500">iPhone 12 · Kofi A.</p>
          <div className="flex gap-1.5 mt-1">
            <span className="flex-1 text-center text-[10px] font-bold bg-clerk-primary text-white rounded-lg py-1.5">Confirm</span>
            <span className="flex-1 text-center text-[10px] font-semibold border border-slate-200 text-slate-400 rounded-lg py-1.5">Skip</span>
          </div>
        </div>

        {/* Copy — left side */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-8 py-12 sm:py-24">
          <div className="max-w-[520px]">
            <div className="ui-enter flex items-center gap-3 mb-7">
              <div className="flex -space-x-3">
                {[
                  { url: 'https://images.pexels.com/photos/3801422/pexels-photo-3801422.jpeg?auto=compress&cs=tinysrgb&w=200&q=80', pos: 'center top' },
                  { url: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=200&q=80', pos: 'center 20%' },
                  { url: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=200&q=80', pos: 'center top' },
                ].map((p, i) => (
                  <div
                    key={i}
                    className="h-9 w-[60px] rounded-full overflow-hidden shrink-0 shadow-md border-2 border-white"
                    style={{
                      backgroundImage: `url(${p.url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: p.pos,
                      zIndex: 3 - i,
                    }}
                  />
                ))}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] font-semibold text-slate-800 leading-tight">WhatsApp sellers</span>
                <span className="text-[11px] text-slate-400 leading-tight">across Ghana</span>
              </div>
            </div>

            <div className="ui-enter ui-enter-delay-1 mb-8">
              <HeroHeadline />
            </div>

            <div className="ui-enter ui-enter-delay-2 grid grid-cols-3 gap-2 sm:gap-3 mb-8 max-w-md">
              {HERO_STATS.map((stat) => (
                <div key={stat.label} className="rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm px-2.5 sm:px-3 py-2.5 sm:py-3">
                  <p className="text-[1.05rem] sm:text-[1.25rem] font-extrabold text-slate-900 tabular-nums leading-none font-display">{stat.value}</p>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 leading-snug mt-1.5">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="ui-enter ui-enter-delay-2 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-5">
              <Link
                href={primaryHref}
                className="inline-flex items-center justify-center gap-2 bg-clerk-primary text-slate-950 text-[14px] font-bold px-7 py-3.5 min-h-[48px] rounded-full hover:bg-clerk-primary-dark hover:text-white transition-all shadow-md touch-manipulation"
              >
                {primaryCta}
                <span className="material-symbols-outlined ms-icon-filled" style={{ fontSize: 16 }}>arrow_forward</span>
              </Link>
              <a
                href="#demo"
                className="inline-flex items-center justify-center sm:justify-start text-[14px] font-medium text-slate-500 hover:text-slate-900 transition-colors py-3.5 px-2 min-h-[48px] text-center sm:text-left touch-manipulation"
              >
                Watch demo →
              </a>
            </div>

            <p className="ui-enter ui-enter-delay-2 text-[12px] text-slate-500">
              No card · Your number · Live in under 60 seconds
            </p>
          </div>
        </div>

      </section>

      <ProblemSolutionSection />

      {/* ── Product demo ── */}
      <DemoTabs primaryHref={primaryHref} />

      {/* ── How it works + 60-second loop ── */}
      <MerchantMirrorDemo primaryHref={primaryHref} />

      <WhyClerkSection />

      {/* ── Proof ── */}
      <section className="bg-[#f5f4f0] border-t border-slate-100 py-14 sm:py-28 px-5 sm:px-8" id="proof">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 sm:mb-12 max-w-xl">
            <h2 className="text-[1.75rem] sm:text-[2.5rem] font-extrabold text-slate-900 tracking-tight font-display mb-3">
              Less stress. More sales. Your evenings back.
            </h2>
            <p className="text-[15px] text-slate-500">
              You&rsquo;re not buying AI or automation. You&rsquo;re buying time, and fewer lost customer messages.
            </p>
              </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
            <ComparisonTable />
            <div className="flex gap-3 overflow-x-auto scroll-touch-x snap-x snap-mandatory pb-1 -mx-5 px-5 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible">
              {SELLER_VOICE.map((item) => (
                <div key={item.quote} className="snap-start shrink-0 w-[min(85vw,300px)] sm:w-auto">
                  <SellerVoiceCard item={item} />
        </div>
              ))}
          </div>
        </div>

          <p className="text-[13px] text-slate-500 text-center max-w-lg mx-auto">
            Clerk does not replace you. It handles the routine. You step in when something needs a human.
          </p>
        </div>
      </section>

      {/* ── Dashboard screenshot ── */}
      <section className="bg-[#f5f4f0] border-t border-slate-100 px-5 sm:px-8 pt-14 sm:pt-28 pb-0 overflow-hidden" id="features">
        <div className="max-w-5xl mx-auto">

          {/* Top: text + feature row */}
          <div className="mb-12">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
              <div>
                <h2 className="text-[1.75rem] sm:text-[2.5rem] font-extrabold text-slate-900 leading-[1.1] tracking-tight font-display mb-4">
                  11 orders captured. 2 needed your OK.
                </h2>
                <p className="text-[15px] text-slate-500 leading-relaxed max-w-md">
                  Every conversation and every order, one dashboard while you were away.
                </p>
              </div>
              <Link
                href={primaryHref}
                className="shrink-0 inline-flex items-center justify-center gap-2 bg-slate-900 text-white text-[13px] font-semibold px-6 py-3 rounded-full hover:bg-slate-700 transition-colors w-full sm:w-auto"
              >
                Open dashboard
                <span className="material-symbols-outlined ms-icon-filled" style={{ fontSize: 14 }}>arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* Screenshot — sits flush at the bottom, overflows down */}
          <div className="relative rounded-t-2xl overflow-hidden shadow-[0_-4px_40px_rgba(0,0,0,0.10)] border border-b-0 border-slate-200 bg-white">
            <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-50 border-b border-slate-100">
              <span className="size-2.5 rounded-full bg-red-400/70" />
              <span className="size-2.5 rounded-full bg-amber-400/70" />
              <span className="size-2.5 rounded-full bg-green-400/70" />
              <div className="flex-1 mx-2 sm:mx-3 h-5 bg-white rounded-md border border-slate-200 flex items-center px-2 sm:px-2.5 min-w-0">
                <span className="text-[9px] text-slate-400 font-medium tracking-wide truncate">app.useclerk.com/dashboard</span>
              </div>
            </div>
            {/* Plain img — marketing screenshot updates often; avoids Next image optimizer cache */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/dashboard-mockup.png"
              alt="Clerk dashboard: conversations, orders and sales in one place"
              width={1280}
              height={800}
              className="w-full h-auto block"
              decoding="async"
            />
          </div>

        </div>
      </section>

      {/* ── Morning aspiration ── */}
      <section className="bg-white border-t border-slate-100 py-14 sm:py-20 px-5 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 sm:mb-10">
            <h2 className="text-[1.75rem] sm:text-[2.5rem] font-extrabold text-slate-900 tracking-tight font-display mb-2">
              What your morning could look like
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-slate-200 border border-slate-200 rounded-2xl overflow-hidden">
            {MORNING_STATS.map((stat) => (
              <div key={stat.label} className="bg-white px-4 sm:px-5 py-5 sm:py-6 flex flex-col gap-1">
                <p className="text-[1.75rem] sm:text-[2rem] font-extrabold text-slate-900 tabular-nums font-display leading-none">
                  {stat.value}
                </p>
                <p className="text-[11px] sm:text-[12px] text-slate-500 leading-snug">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="bg-[#f5f4f0] border-t border-slate-100 py-14 sm:py-28 px-5 sm:px-8" id="pricing">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-[1.75rem] sm:text-[2.5rem] font-extrabold text-slate-900 tracking-tight font-display mb-3">
              Start free. Upgrade when Clerk proves itself.
            </h2>
            <p className="text-[15px] text-slate-500 max-w-md mb-2">
              Every account starts with 50 replies. Upgrade only when you start seeing value.
            </p>
            <p className="text-[14px] font-semibold text-slate-800 max-w-md">
              One captured order usually pays for the month.
            </p>
          </div>

          {/* Free trial — total cap, not monthly */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-5">
            <div>
              <p className="text-[15px] font-semibold text-slate-900 font-display">50 replies total, not per month</p>
              <p className="text-[13px] text-slate-500 mt-1 max-w-lg">
                Connect your number, add products, and see Clerk handle live customer messages before you pay.
              </p>
            </div>
            <Link
              href={primaryHref}
              className="shrink-0 inline-flex items-center justify-center border border-slate-200 text-slate-700 text-[13px] font-semibold px-5 py-2.5 rounded-full hover:bg-slate-50 transition-colors"
            >
              Connect my WhatsApp
            </Link>
          </div>

          {/* Cards — same gap-px grid used across the page */}
          <div className="grid lg:grid-cols-3 gap-px bg-slate-200 border border-slate-200 rounded-2xl overflow-hidden">

            {/* Starter */}
            <div className="bg-white p-6 sm:p-8 flex flex-col">
              <p className="text-[14px] font-semibold text-slate-900 font-display mb-5">Starter</p>
              <div className="flex items-baseline gap-1 mb-1">
                <p className="text-[2rem] sm:text-[2.4rem] font-extrabold text-slate-900 leading-none tracking-tight">GHS 49</p>
                <span className="text-[13px] text-slate-500">/mo</span>
              </div>
              <p className="text-[12px] text-slate-400 mb-8">For shops getting steady customer messages.</p>
              <ul className="space-y-2.5 flex-1 mb-8">
                {[
                  '1 WhatsApp number',
                  '300+ replies / month',
                  'Up to 50 products',
                  'Order capture & approval',
                  'Dashboard access',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2 text-[13px] text-slate-600">
                    <span className="mt-1.5 size-1.5 rounded-full bg-clerk-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={planHref('starter')}
                className="w-full inline-flex items-center justify-center border border-slate-200 text-slate-700 text-[13px] font-semibold px-5 py-2.5 rounded-full hover:bg-slate-50 transition-colors"
              >
                Start Starter
              </Link>
            </div>

            {/* Growth — accent tile */}
            <div className="bg-clerk-light p-6 sm:p-8 flex flex-col relative">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
                <p className="text-[14px] font-semibold text-clerk-primary-dark font-display">Growth</p>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-clerk-primary text-white px-2.5 py-1 rounded-full leading-none whitespace-nowrap">Most popular</span>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <p className="text-[2rem] sm:text-[2.4rem] font-extrabold text-slate-900 leading-none tracking-tight">GHS 99</p>
                <span className="text-[13px] text-slate-500">/mo</span>
              </div>
              <p className="text-[12px] text-slate-500 mb-8">More volume, follow-ups so buyers don&rsquo;t go cold, and coverage when your shop is closed.</p>
              <ul className="space-y-2.5 flex-1 mb-8">
                {[
                  'Everything in Starter',
                  'Up to 500 products',
                  'Follows up so buyers don\u2019t go cold',
                  'Abandoned payment recovery',
                  'Available when your shop is closed',
                  'Higher reply volume',
                  'Priority support',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2 text-[13px] text-slate-700">
                    <span className="mt-1.5 size-1.5 rounded-full bg-clerk-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={planHref('growth')}
                className="w-full inline-flex items-center justify-center gap-1.5 bg-clerk-primary text-slate-950 text-[13px] font-bold px-5 py-2.5 rounded-full hover:bg-clerk-primary-dark hover:text-white transition-colors"
              >
                Start Growth
                <span className="material-symbols-outlined ms-icon-filled" style={{ fontSize: 14 }}>arrow_forward</span>
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-white p-6 sm:p-8 flex flex-col">
              <p className="text-[14px] font-semibold text-slate-900 font-display mb-5">Enterprise</p>
              <p className="text-[2rem] sm:text-[2.4rem] font-extrabold text-slate-900 leading-none tracking-tight mb-1">Contact sales</p>
              <p className="text-[12px] text-slate-400 mb-8">Custom setup for larger operations.</p>
              <ul className="space-y-2.5 flex-1 mb-8">
                {[
                  'Multiple WhatsApp numbers',
                  'Multiple staff accounts',
                  'Advanced analytics',
                  'Built around how your business works',
                  'Dedicated support & SLA',
                  'Custom onboarding',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2 text-[13px] text-slate-600">
                    <span className="mt-1.5 size-1.5 rounded-full bg-clerk-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href={`${SUPPORT_EMAIL_HREF}?subject=Clerk%20Enterprise`}
                className="w-full inline-flex items-center justify-center border border-slate-200 text-slate-700 text-[13px] font-semibold px-5 py-2.5 rounded-full hover:bg-slate-50 transition-colors"
              >
                Contact sales
              </a>
            </div>

          </div>

          <p className="text-[12px] text-slate-400 mt-6">
            Every account starts with 50 free replies, total not monthly. No card required. Cancel paid plans anytime.
          </p>

        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-[#f5f4f0] border-t border-slate-100 py-14 sm:py-28 px-5 sm:px-8" id="faq">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="mb-12">
            <h2 className="text-[1.75rem] sm:text-[2.5rem] font-extrabold text-slate-900 tracking-tight font-display mb-3">
              Common questions, honest answers.
            </h2>
            <p className="text-[15px] text-slate-500 max-w-sm">Everything sellers ask before going live.</p>
          </div>

          <div className="grid lg:grid-cols-[1fr_280px] gap-12 lg:gap-16 items-start">

            {/* Accordion */}
            <div className="border-t border-slate-100 order-2 lg:order-1">
              {FAQ.map(item => <FaqItem key={item.q} {...item} />)}
            </div>

            {/* Contact card — shows above accordion on mobile */}
            <div className="order-1 lg:order-2 lg:sticky lg:top-24">
              <div className="bg-[#f5f4f0] rounded-2xl border border-slate-200 p-5 sm:p-7 flex flex-col gap-4">
                <div>
                  <h3 className="text-[15px] font-bold text-slate-900 font-display mb-1">Still have questions?</h3>
                  <p className="text-[13px] text-slate-500 leading-relaxed">
                    Drop us a message. We reply the same day, usually within the hour.
                  </p>
                </div>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 bg-slate-900 text-white text-[13px] font-semibold px-5 py-2.5 rounded-full hover:bg-slate-700 transition-colors w-fit"
                >
                  Send us a message
                  <span className="material-symbols-outlined ms-icon-filled" style={{ fontSize: 14 }}>arrow_forward</span>
                </Link>
                <p className="text-[11px] text-slate-400">Mon – Sat &middot; 8am – 9pm GMT</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-slate-900 py-14 sm:py-24 px-5 sm:px-8 border-t border-slate-800">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-[1.45rem] sm:text-[2.4rem] font-extrabold text-white leading-[1.2] sm:leading-[1.15] tracking-tight font-display mb-2 text-balance">
            Someone will get that WhatsApp message.
          </h2>
          <p className="text-[1.45rem] sm:text-[2.4rem] font-extrabold text-clerk-primary leading-[1.2] sm:leading-[1.15] tracking-tight font-display mb-8 text-balance">
            It should be your shop.
          </p>
          <Link
            href={primaryHref}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 bg-clerk-primary text-slate-950 text-[14px] font-bold px-7 py-3.5 min-h-[48px] rounded-full hover:bg-clerk-primary-dark hover:text-white transition-colors touch-manipulation"
          >
            {primaryCta}
            <span className="material-symbols-outlined ms-icon-filled" style={{ fontSize: 17 }}>arrow_forward</span>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 pt-10 sm:pt-12 pb-8 px-5 sm:px-8 pb-safe">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-8 pb-10 border-b border-slate-800">

            {/* Brand */}
            <div className="col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-3">
                <Image src="/clerk logo.svg" alt="" width={24} height={24} style={{ height: 24, width: 'auto' }} />
                <span className="font-display font-bold text-white text-[15px]">Clerk</span>
              </div>
              <p className="text-[13px] text-slate-500 leading-relaxed max-w-[260px] mb-5">
                First reply in 9 seconds. Your shop doesn&rsquo;t stop when you do.
              </p>
              <div className="flex gap-2">
                <a
                  href={SUPPORT_WHATSAPP_HREF}
                  target="_blank"
                  rel="noreferrer"
                  className="size-8 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors"
                  aria-label="WhatsApp support"
                >
                  <Image src="/whatsapp.svg" alt="WhatsApp" width={15} height={15} />
                </a>
                <a
                  href={SUPPORT_EMAIL_HREF}
                  className="size-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 hover:text-clerk-primary hover:bg-slate-700 transition-colors"
                  aria-label="Email us"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>mail</span>
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-[13px] font-semibold text-slate-400 mb-4">Product</h3>
              <ul className="space-y-3 text-[13px]">
                <li><a href="#how" className="hover:text-white transition-colors">How it works</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-[13px] font-semibold text-slate-400 mb-4">Support</h3>
              <ul className="space-y-3 text-[13px]">
                <li><a href={SUPPORT_EMAIL_HREF} className="hover:text-white transition-colors">{SUPPORT_EMAIL}</a></li>
                <li>
                  <a href={SUPPORT_WHATSAPP_HREF} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                    WhatsApp: {SUPPORT_WHATSAPP_DISPLAY}
                  </a>
                </li>
                <li className="text-slate-600 text-[12px]">Mon – Sat · 8am – 9pm GMT</li>
              </ul>
            </div>

            {/* Account + Legal */}
            <div>
              <h3 className="text-[13px] font-semibold text-slate-400 mb-4">Account</h3>
              <ul className="space-y-3 text-[13px] mb-6">
                <li><Link href="/login" className="hover:text-white transition-colors">Log in</Link></li>
                <li><Link href="/login?mode=signup" className="text-clerk-primary hover:text-clerk-primary-dark transition-colors font-semibold">Sign up free</Link></li>
              </ul>
              <h3 className="text-[13px] font-semibold text-slate-400 mb-4">Legal</h3>
              <ul className="space-y-3 text-[13px]">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>

          </div>

          {/* Bottom bar */}
          <div className="pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[12px] text-slate-600">
            <p>&copy; {new Date().getFullYear()} Clerk. All rights reserved.</p>
            <p>A product of{' '}
              <a href="https://appau.me" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors">
                Corsafrica
              </a>.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
