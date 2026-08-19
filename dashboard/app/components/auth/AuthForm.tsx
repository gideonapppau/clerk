'use client'

import { useEffect, useState } from 'react'
import { login, register, setToken, formatUserError } from '@/lib/api'
import { resolvePostAuthDestination } from '@/lib/onboarding'

type Mode = 'login' | 'signup'

type AuthFormProps = {
  initialMode?: Mode
}

export function AuthForm({ initialMode = 'login' }: AuthFormProps) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('mode') === 'signup') setMode('signup')
  }, [])

  function switchMode(next: Mode) {
    setMode(next)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const { token } = await login(email, password)
        setToken(token)
      } else {
        const { token } = await register(businessName, email, password)
        setToken(token)
      }
      if (mode === 'signup') {
        localStorage.removeItem('clerk_onboarding_done')
        window.location.href = '/onboarding?new=1'
      } else {
        window.location.href = await resolvePostAuthDestination()
      }
    } catch (err) {
      setError(formatUserError(err, "Couldn't sign you in. Try again."))
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full px-3.5 py-3 sm:py-2.5 text-[16px] sm:text-[14px] text-slate-900 bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-clerk-primary/25 focus:border-clerk-primary transition-all'

  return (
    <div className="w-full min-w-0">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_8px_40px_rgba(15,23,42,0.07)] p-5 sm:p-7">
        {/* Mode toggle */}
        <div className="flex p-1 bg-slate-100 rounded-full mb-6 font-display" role="tablist" aria-label="Account mode">
          {(['login', 'signup'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchMode(m)}
              className={`flex-1 min-h-[44px] text-[13px] font-bold py-2.5 rounded-full transition-all touch-manipulation ${
                mode === m
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {m === 'login' ? 'Sign in' : 'Sign up'}
            </button>
          ))}
        </div>

        <h1 className="text-[1.2rem] sm:text-[1.25rem] font-extrabold text-slate-900 tracking-tight font-display mb-1">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="text-[13px] text-slate-500 mb-6 leading-relaxed">
          {mode === 'login'
            ? 'Open your dashboard and see what happened while you were away.'
            : 'Set up your shop in under five minutes.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label htmlFor="businessName" className="block text-[12px] font-semibold text-slate-600 mb-1.5">
                Business name
              </label>
              <input
                id="businessName"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                autoComplete="organization"
                placeholder="Kofi's Electronics"
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-[12px] font-semibold text-slate-600 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@shop.com"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-[12px] font-semibold text-slate-600 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                enterKeyHint="go"
                placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
                className={`${inputClass} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-1 top-1/2 -translate-y-1/2 size-11 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors touch-manipulation rounded-lg"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {error && (
            <p className="text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5 leading-snug">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 bg-clerk-primary text-slate-950 text-[14px] sm:text-[13px] font-bold py-3 rounded-full hover:bg-clerk-primary-dark hover:text-white active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 touch-manipulation"
          >
            {loading ? (
              <>
                <span className="size-4 rounded-full border-2 border-slate-950/30 border-t-slate-950 animate-spin" />
                {mode === 'login' ? 'Signing in…' : 'Creating account…'}
              </>
            ) : (
              <>
                {mode === 'login' ? 'Sign in' : 'Create account'}
                <span className="material-symbols-outlined ms-icon-filled" style={{ fontSize: 14 }}>
                  arrow_forward
                </span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
