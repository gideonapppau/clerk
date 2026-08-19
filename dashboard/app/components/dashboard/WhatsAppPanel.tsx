'use client'

import Image from 'next/image'
import { useState } from 'react'
import { DashPanel } from '@/components/DashPanel'
import { useDashboard } from '@/contexts/DashboardContext'
import { badgeClass } from '@/lib/dashboard-ui'
import { pairingPhoneDigits } from '@/lib/phone'

export function WhatsAppPanel() {
  const { me, session, busy, handleConnect, handleRefreshQr, handleDisconnect } = useDashboard()
  const [mode, setMode] = useState<'qr' | 'code'>('qr')
  const [phoneInput, setPhoneInput] = useState('')
  const [phoneError, setPhoneError] = useState('')

  const isConnected = session?.connected
  const isPairing = Boolean(session?.pairingCode)
  const isConnecting =
    session?.status === 'connecting' || session?.status === 'qr' || isPairing

  async function connectWithQr() {
    setPhoneError('')
    setMode('qr')
    await handleConnect()
  }

  async function connectWithCode() {
    const digits = pairingPhoneDigits(phoneInput)
    if (!digits) {
      setPhoneError('Enter your WhatsApp number (e.g. 0202966466)')
      return
    }
    setPhoneError('')
    setMode('code')
    await handleConnect(digits)
  }

  return (
    <DashPanel padding={false}>
      <div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[14px] font-semibold text-slate-900 font-display">WhatsApp</p>
          <p className="text-[12px] text-slate-500 mt-0.5">
            {isConnected && session?.phone
              ? `+${session.phone}`
              : isPairing
                ? 'Enter the code on your phone…'
                : session?.qr
                  ? 'Waiting for scan…'
                  : isConnecting
                    ? 'Starting…'
                    : 'Not connected yet'}
          </p>
        </div>
        <span
          className={`shrink-0 px-2.5 py-1 ${
            isConnected
              ? badgeClass('success')
              : isConnecting
                ? badgeClass('neutral')
                : badgeClass('muted')
          }`}
        >
          {isConnected ? 'Live' : isConnecting ? 'Connecting' : 'Idle'}
        </span>
      </div>

      {session?.qr && !session.pairingCode && (
        <div className="px-4 sm:px-5 pb-5 pt-4 flex flex-col items-center gap-3 border-b border-slate-100">
          <div className="rounded-2xl overflow-hidden border border-slate-100 p-3 sm:p-4 bg-slate-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={session.qr}
              alt="WhatsApp QR code"
              className="w-[min(72vw,13rem)] h-[min(72vw,13rem)] sm:w-48 sm:h-48 block"
            />
          </div>
          <p className="text-[12px] sm:text-[13px] text-slate-500 text-center max-w-xs leading-relaxed px-2">
            On your phone: WhatsApp → Linked devices → Link a device → scan this code
          </p>
        </div>
      )}

      {session?.pairingCode && (
        <div className="px-4 sm:px-5 py-5 border-b border-slate-100 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-3">
            Pairing code
          </p>
          <p className="text-2xl sm:text-3xl font-bold tracking-[0.25em] text-slate-900 font-mono">
            {session.pairingCode}
          </p>
          <p className="mt-4 text-[12px] sm:text-[13px] text-slate-500 max-w-sm mx-auto leading-relaxed">
            On your phone: WhatsApp → Linked devices → Link a device →{' '}
            <span className="font-semibold text-slate-700">Link with phone number instead</span> →
            enter this code
          </p>
          {session.phone && (
            <p className="mt-2 text-[12px] text-slate-400 tabular-nums">For +{session.phone}</p>
          )}
        </div>
      )}

      {!isConnected && !session?.qr && !session?.pairingCode && (
        <div className="px-4 sm:px-5 py-4 border-b border-slate-100 space-y-3">
          <div className="flex p-1 bg-slate-100 rounded-full max-w-xs">
            {(['qr', 'code'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m)
                  setPhoneError('')
                }}
                className={`flex-1 text-[12px] font-semibold py-2 rounded-full transition-all ${
                  mode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {m === 'qr' ? 'Scan QR' : 'Phone code'}
              </button>
            ))}
          </div>

          {mode === 'code' && (
            <div>
              <label htmlFor="wa-pair-phone" className="block text-[11px] font-semibold text-slate-600 mb-1">
                WhatsApp number
              </label>
              <input
                id="wa-pair-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phoneInput}
                onChange={(e) => {
                  setPhoneInput(e.target.value)
                  setPhoneError('')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void connectWithCode()
                }}
                placeholder="0202966466"
                className="w-full px-3 py-3 sm:py-2.5 text-[16px] sm:text-[14px] text-slate-900 bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-clerk-primary/25 focus:border-clerk-primary"
              />
              <p className="mt-1.5 text-[11px] text-slate-400">
                Use the number on the phone you will open WhatsApp on. Ghana numbers work as 0… or 233…
              </p>
              {phoneError && <p className="mt-1.5 text-[12px] text-red-600">{phoneError}</p>}
            </div>
          )}
        </div>
      )}

      {session?.conflict === 'PHONE_IN_USE' && (
        <div className="mx-4 sm:mx-5 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] sm:text-[13px] text-amber-900 leading-relaxed">
          This WhatsApp number is already linked to another Clerk account. Disconnect it from the other
          account first, then connect here.
        </div>
      )}

      {(session?.reachout?.restricted || me?.reachout?.restricted) && (
        <div className="mx-4 sm:mx-5 mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] sm:text-[13px] text-rose-900 leading-relaxed">
          <p className="font-semibold">WhatsApp restricted automated replies</p>
          <p className="mt-1">
            {(session?.reachout?.restricted ? session.reachout.message : me?.reachout?.message) ??
              'WhatsApp temporarily limited automated replies on this number.'}
          </p>
          {(session?.reachout?.endsAt || me?.reachout?.endsAt) && (
            <p className="mt-2 text-rose-800/80">
              Clerk will retry after{' '}
              {new Date(
                (session?.reachout?.endsAt || me?.reachout?.endsAt) as string
              ).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short'
              })}
              .
            </p>
          )}
        </div>
      )}

      <div className="px-4 sm:px-5 py-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        {!isConnected && (
          <button
            type="button"
            onClick={() => void (mode === 'code' && !session?.pairingCode ? connectWithCode() : connectWithQr())}
            disabled={busy === 'connect'}
            className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 bg-clerk-primary text-slate-950 text-[13px] font-bold px-5 py-3 rounded-full hover:bg-clerk-primary-dark hover:text-white transition-colors disabled:opacity-50 touch-manipulation"
          >
            {busy === 'connect' ? (
              'Starting…'
            ) : (
              <>
                <Image src="/whatsapp.svg" alt="" width={13} height={13} className="brightness-0" aria-hidden />
                {session?.pairingCode
                  ? 'New code'
                  : session?.qr
                    ? 'New QR'
                    : mode === 'code'
                      ? 'Get pairing code'
                      : 'Connect'}
              </>
            )}
          </button>
        )}
        {session?.qr && !session.pairingCode && (
          <button
            type="button"
            onClick={() => void handleRefreshQr()}
            disabled={busy === 'qr'}
            className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center text-[13px] font-semibold text-slate-600 border border-slate-200 bg-white px-4 rounded-full hover:bg-slate-50 transition-colors disabled:opacity-50 touch-manipulation"
          >
            Refresh QR
          </button>
        )}
        {(isConnected || session?.qr || session?.pairingCode) && (
          <button
            type="button"
            onClick={() => void handleDisconnect()}
            disabled={busy === 'disconnect'}
            className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center text-[13px] font-semibold text-red-600 border border-red-100 bg-red-50/50 px-4 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50 touch-manipulation"
          >
            Disconnect
          </button>
        )}
      </div>
    </DashPanel>
  )
}
