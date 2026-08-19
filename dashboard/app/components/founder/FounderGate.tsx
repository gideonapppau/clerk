'use client'

import Image from 'next/image'
import Link from 'next/link'
import { setFounderKey, getFounderKey } from '@/lib/founder-api'
import { useEffect, useState } from 'react'

export function FounderGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [key, setKey] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (getFounderKey()) setReady(true)
  }, [])

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    if (!key.trim()) {
      setError('Enter the founder API key')
      return
    }
    setFounderKey(key.trim())
    setReady(true)
  }

  if (ready) return <>{children}</>

  const inputClass =
    'w-full px-3.5 py-3 sm:py-2.5 text-[16px] sm:text-[14px] text-slate-900 bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-clerk-primary/25 focus:border-clerk-primary transition-all'

  return (
    <div className="min-h-[100dvh] bg-[#f5f4f0] flex flex-col items-center justify-center p-4 sm:p-6 pb-safe">
      <Link href="/" className="flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity">
        <Image src="/clerk logo.svg" alt="" width={32} height={32} />
        <span className="font-display font-bold text-lg text-slate-900">Clerk</span>
      </Link>

      <form
        onSubmit={handleUnlock}
        className="w-full max-w-[400px] bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-[0_8px_40px_rgba(15,23,42,0.07)] space-y-5"
      >
        <div>
          <h1 className="text-[1.5rem] font-extrabold text-slate-900 font-display tracking-tight">
            Founder console
          </h1>
          <p className="text-[14px] text-slate-500 mt-2 leading-relaxed">
            Enter your <code className="text-[13px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">FOUNDER_API_KEY</code>{' '}
            from Core env to view platform metrics.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="founder-key" className="text-[12px] font-semibold text-slate-700">
            API key
          </label>
          <input
            id="founder-key"
            type="password"
            value={key}
            onChange={(e) => {
              setKey(e.target.value)
              setError('')
            }}
            placeholder="Founder API key"
            className={inputClass}
            autoFocus
          />
          {error && <p className="text-[12px] text-red-600">{error}</p>}
        </div>

        <button
          type="submit"
          className="w-full min-h-[48px] py-3 rounded-full bg-clerk-primary text-slate-950 text-[14px] font-bold hover:bg-clerk-primary-dark hover:text-white transition-colors touch-manipulation"
        >
          Unlock console
        </button>

        <p className="text-[11px] text-slate-400 text-center">
          Production uses the key from <code className="text-slate-500">FOUNDER_API_KEY</code> on Fly Core, not{' '}
          <code className="text-slate-500">clerk-founder-dev</code>.
        </p>
      </form>
    </div>
  )
}
