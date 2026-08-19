'use client'

import Image from 'next/image'
import { Num } from '@/components/Num'
import { resolveWhatsAppChatHref } from '@/lib/phone'

export type CustomerIdentityFields = {
  customerName?: string
  customerContact?: string
  customerPhoneDisplay?: string
  customerChatUrl?: string
  customerChatDeepLink?: string
  customerPrivacyHidden?: boolean
  /** Raw id for fallback label */
  raw?: string
}

type Props = CustomerIdentityFields & {
  compact?: boolean
  /** Subtle inline WhatsApp link (icon + tappable number). Use in conversation detail only. */
  whatsappLink?: boolean
  className?: string
}

export function CustomerIdentity({
  customerName,
  customerContact,
  customerPhoneDisplay,
  customerChatUrl,
  customerChatDeepLink,
  customerPrivacyHidden,
  raw,
  compact = false,
  whatsappLink = false,
  className = '',
}: Props) {
  const contact = customerPhoneDisplay ?? customerContact ?? raw ?? 'Unknown'
  const name = customerName?.trim()
  const waHref = resolveWhatsAppChatHref({ customerChatDeepLink, customerChatUrl, customerPrivacyHidden })
  const canOpenChat = Boolean(waHref)
  const waTitle = name ? `Open chat with ${name} in WhatsApp` : 'Open chat in WhatsApp'

  const contactClass = `text-slate-500 tabular-nums break-all ${compact ? 'text-[11px]' : 'text-[12px]'}`
  const linkClass = `${contactClass} hover:text-[#128C7E] transition-colors`

  const contactNode =
    whatsappLink && canOpenChat && waHref ? (
      <a
        href={waHref}
        title={waTitle}
        onClick={(e) => e.stopPropagation()}
        className={linkClass}
      >
        <Num>{contact}</Num>
      </a>
    ) : (
      <span className={contactClass}>
        <Num>{contact}</Num>
      </span>
    )

  return (
    <div className={className}>
      {name ? (
        <>
          <p className={`font-semibold text-slate-900 leading-snug ${compact ? 'text-[13px]' : 'text-[14px]'}`}>
            {name}
          </p>
          <div className={`flex items-center gap-1 min-w-0 ${compact ? 'mt-0.5' : 'mt-0.5'}`}>
            {contactNode}
            {whatsappLink && canOpenChat && waHref && (
              <a
                href={waHref}
                title={waTitle}
                aria-label={waTitle}
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 p-0.5 rounded opacity-50 hover:opacity-100 transition-opacity"
              >
                <Image src="/whatsapp.svg" alt="" width={11} height={11} />
              </a>
            )}
          </div>
        </>
      ) : (
        <div className="flex items-center gap-1 min-w-0">
          {whatsappLink && canOpenChat && waHref ? (
            <a
              href={waHref}
              title={waTitle}
              onClick={(e) => e.stopPropagation()}
              className={`font-medium text-slate-800 hover:text-[#128C7E] tabular-nums break-all transition-colors ${compact ? 'text-[13px]' : 'text-[14px]'}`}
            >
              <Num>{contact}</Num>
            </a>
          ) : (
            <p className={`font-medium text-slate-800 tabular-nums break-all ${compact ? 'text-[13px]' : 'text-[14px]'}`}>
              <Num>{contact}</Num>
            </p>
          )}
          {whatsappLink && canOpenChat && waHref && (
            <a
              href={waHref}
              title={waTitle}
              aria-label={waTitle}
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 p-0.5 rounded opacity-50 hover:opacity-100 transition-opacity"
            >
              <Image src="/whatsapp.svg" alt="" width={11} height={11} />
            </a>
          )}
        </div>
      )}
    </div>
  )
}
