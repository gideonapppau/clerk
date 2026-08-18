'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect } from 'react'
import { AuthForm } from '@/components/auth/AuthForm'
import { resolvePostAuthDestination } from '@/lib/onboarding'

const FEATURES = [
  { title: 'Reply while you\'re away', body: 'Clerk answers price and stock questions on WhatsApp.' },
  { title: 'Capture real orders', body: 'Turn chats into confirmed sales, not just enquiries.' },
  { title: 'See everything in one place', body: 'Orders, conversations, and payments in your dashboard.' },
] as const

export default function LoginPage() {
  useEffect(() => {
    if (!localStorage.getItem('clerk_token')) return
    void resolvePostAuthDestination().then((dest) => {
      window.location.href = dest
    })
  }, [])

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row overflow-x-hidden">
      {/* Brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between w-[min(44vw,520px)] shrink-0 bg-slate-900 px-12 py-12 overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-clerk-primary-darker opacity-90"
          aria-hidden
        />
        <div
          className="absolute -bottom-24 -right-16 size-72 rounded-full bg-clerk-primary/10 blur-3xl"
          aria-hidden
        />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Image
              src="/clerk logo.svg"
              alt=""
              width={32}
              height={32}
              style={{ height: 32, width: 'auto' }}
            />
            <span className="font-display font-bold text-[17px] text-white tracking-tight">Clerk</span>
          </Link>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center py-12">
          <h1 className="text-[2.1rem] font-extrabold text-white leading-[1.12] tracking-tight font-display mb-4">
            Reply, capture orders,
            <br />
            close more sales.
          </h1>
          <p className="text-[14px] text-slate-400 leading-relaxed max-w-sm mb-10">
            Your WhatsApp shop assistant. Set up in minutes, live the same day.
          </p>

          <ul className="space-y-4 max-w-sm">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-3">
                <span className="mt-1.5 size-1.5 rounded-full bg-clerk-primary shrink-0" />
                <div>
                  <p className="text-[13px] font-semibold text-slate-200">{f.title}</p>
                  <p className="text-[12px] text-slate-500 leading-relaxed mt-0.5">{f.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <blockquote className="relative z-10 border-l-2 border-clerk-primary/50 pl-4 max-w-sm">
          <p className="text-[13px] text-slate-300 leading-relaxed mb-3">
            &ldquo;I was at church and still came back to two confirmed orders waiting for me.&rdquo;
          </p>
          <footer className="flex items-center gap-2.5">
            <div className="size-7 rounded-full bg-slate-700 overflow-hidden shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.pexels.com/photos/8476590/pexels-photo-8476590.jpeg?auto=compress&cs=tinysrgb&w=60&q=80"
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-300">Kofi Asante</p>
              <p className="text-[10px] text-slate-500">Kofi Electronics</p>
            </div>
          </footer>
        </blockquote>

        <p className="relative z-10 text-[11px] text-slate-600 mt-8">
          &copy; {new Date().getFullYear()} Clerk
        </p>
      </div>

      {/* Form panel */}
      <div className="flex-1 bg-[#f5f4f0] flex flex-col min-h-[100dvh] min-w-0">
        <header className="px-5 sm:px-8 min-h-14 pt-safe flex items-center justify-between shrink-0 gap-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 min-h-[44px] lg:invisible touch-manipulation shrink-0"
          >
            <Image
              src="/clerk logo.svg"
              alt=""
              width={28}
              height={28}
              style={{ height: 28, width: 'auto' }}
            />
            <span className="font-display font-bold text-[15px] text-slate-900 tracking-tight">Clerk</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center min-h-[44px] px-2 text-[13px] font-medium text-slate-500 hover:text-slate-800 transition-colors touch-manipulation shrink-0"
          >
            Back to home
          </Link>
        </header>

        <main className="flex-1 flex flex-col items-center justify-start sm:justify-center px-5 sm:px-8 pt-4 sm:pt-0 pb-[max(2rem,env(safe-area-inset-bottom))] sm:pb-16">
          <div className="w-full max-w-sm ui-enter">
            <AuthForm />

            <p className="text-center text-[12px] sm:text-[11px] text-slate-400 mt-5 leading-relaxed px-1">
              For business WhatsApp accounts. Your messages stay between you and your customers.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
