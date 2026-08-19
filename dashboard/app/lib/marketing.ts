/** Shared marketing copy — used by landing UI and structured data for SEO. */

/** Support contact (Ghana local 020… → international wa.me digits). */
export const SUPPORT_EMAIL = 'gideonad.codez@gmail.com'
export const SUPPORT_WHATSAPP_LOCAL = '0202966466'
export const SUPPORT_WHATSAPP_DISPLAY = '020 296 6466'
export const SUPPORT_WHATSAPP_HREF = 'https://wa.me/233202966466'
export const SUPPORT_EMAIL_HREF = `mailto:${SUPPORT_EMAIL}`

/** Merchant WhatsApp community — questions, feedback, and support from other sellers. */
export const WHATSAPP_COMMUNITY_HREF = 'https://chat.whatsapp.com/HGh1rJ1vA4yGzDSJIj4ASb'
export const WHATSAPP_COMMUNITY_LABEL = 'Clerk merchant community'

export const WHY_CLERK_PILLARS = [
  {
    title: 'Speaks the way your customers message',
    body: 'Pidgin, Twi, and mixed English. Clerk understands how Ghanaians actually write on WhatsApp, not just formal textbook phrasing.',
    icon: 'translate',
  },
  {
    title: 'Abandoned payment recovery',
    body: 'Customer got a payment link but didn\u2019t pay? Clerk follows up automatically, included on Growth at GHS 99, not locked behind a GHS 700 tier elsewhere.',
    icon: 'payments',
  },
  {
    title: 'One system, every platform',
    body: 'We started on WhatsApp because that\u2019s where Ghanaian sellers live today. Our core works across platforms. One system, wherever your customers are.',
    icon: 'hub',
  },
] as const

export const LANDING_FAQ = [
  {
    q: 'Is setup complicated?',
    a: 'No. Connect your WhatsApp number, add your products, then message your shop like a customer. Most sellers are live in under five minutes.',
  },
  {
    q: 'Will WhatsApp ban my number for using Clerk?',
    a: 'Fair question, and we won\u2019t pretend there\u2019s zero risk. WhatsApp\u2019s terms apply to any tool connected to your account. What Clerk does is different from the patterns that usually get numbers blocked: it never cold-messages strangers, never runs broadcast blasts, and only replies when a customer messages you first. That\u2019s the same flow you already use, just faster. Most sellers run Clerk on the shop number they already sell from, without issues. You can pause or disconnect anytime from your dashboard if you ever want to stop.',
  },
  {
    q: 'Will customers know they\u2019re talking to Clerk?',
    a: 'No. Customers message your normal WhatsApp number. Clerk replies in your shop\u2019s name. It feels like a real conversation, and you can step in at any point.',
  },
  {
    q: 'What if Clerk gets something wrong?',
    a: 'Take over instantly with one tap. Clear orders go through automatically. Unclear ones escalate to you before anything is finalised.',
  },
  {
    q: 'How do I add my products?',
    a: 'Paste a simple list like “Ankara dress – 120 – 10 in stock”, or add items one at a time. Clerk learns your catalog immediately.',
  },
  {
    q: 'Can I pause or stop Clerk anytime?',
    a: 'Yes. Pause replies, take over a conversation, or turn Clerk off completely. You stay in control.',
  },
  {
    q: 'Can I try before going live?',
    a: 'Yes. Message your shop number from WhatsApp with example questions. Clerk replies on the real thread before customers write in.',
  },
] as const
