import type { Metadata } from 'next'
import { LegalPageShell, LegalSection } from '@/components/legal/LegalPageShell'
import { SUPPORT_EMAIL, SUPPORT_EMAIL_HREF } from '@/lib/marketing'
import { createPageMetadata } from '@/lib/seo'

export const metadata: Metadata = createPageMetadata({
  title: 'Terms of Service',
  description: 'Terms governing your use of Clerk.',
  path: '/terms',
})

export default function TermsPage() {
  return (
    <LegalPageShell title="Terms of Service" updated="11 June 2026">
      <LegalSection title="Agreement">
        <p>
          By creating a Clerk account or using the service, you agree to these Terms. If you are using
          Clerk on behalf of a business, you represent that you have authority to bind that business.
        </p>
      </LegalSection>

      <LegalSection title="The service">
        <p>
          Clerk helps merchants manage WhatsApp conversations, product catalogues, and orders. Features
          and limits depend on your plan. We may change, suspend, or discontinue features with reasonable
          notice where practicable.
        </p>
      </LegalSection>

      <LegalSection title="Your responsibilities">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>You own your WhatsApp number and are responsible for complying with WhatsApp&rsquo;s terms and applicable law.</li>
          <li>You provide accurate product, pricing, and business information.</li>
          <li>You review orders and messages before fulfilling sales, especially when Clerk escalates to you.</li>
          <li>You do not use Clerk for spam, fraud, harassment, or illegal goods or services.</li>
          <li>You keep your login credentials secure.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Plans and payment">
        <p>
          Paid plans are billed monthly in Ghana cedis (GHS) unless otherwise agreed. Fees are non-refundable
          except where required by law or stated in writing. Free-tier and trial limits (such as reply caps)
          apply as shown on our pricing page. Failure to pay may result in suspension.
        </p>
      </LegalSection>

      <LegalSection title="Customer messages">
        <p>
          Clerk may automatically reply to your customers based on your catalogue and settings. You remain
          responsible for what is sold, promised, and delivered to customers. Clerk is a tool, not a party
          to your sales contracts.
        </p>
      </LegalSection>

      <LegalSection title="Intellectual property">
        <p>
          Clerk and its branding, software, and documentation are owned by us or our licensors. You retain
          ownership of your business content. You grant us a limited licence to host and process your content
          solely to provide the service.
        </p>
      </LegalSection>

      <LegalSection title="Disclaimer">
        <p>
          Clerk is provided &ldquo;as is&rdquo; to the fullest extent permitted by law. We do not guarantee
          uninterrupted service, error-free replies, or specific business outcomes. We are not liable for
          lost profits, indirect damages, or issues arising from third-party services (including WhatsApp
          or payment providers).
        </p>
      </LegalSection>

      <LegalSection title="Limitation of liability">
        <p>
          Our total liability for any claim relating to the service is limited to the fees you paid us in the
          twelve months before the claim, or GHS 500, whichever is greater, except where liability cannot
          be limited by law.
        </p>
      </LegalSection>

      <LegalSection title="Termination">
        <p>
          You may cancel at any time. We may suspend or terminate accounts that violate these Terms or
          pose risk to the service or other users. On termination, your right to use Clerk ends; we may
          delete data after a retention period.
        </p>
      </LegalSection>

      <LegalSection title="Governing law">
        <p>
          These Terms are governed by the laws of Ghana, without regard to conflict-of-law principles.
          Disputes will be handled in the courts of Ghana unless we agree otherwise in writing.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about these Terms:{' '}
          <a href={SUPPORT_EMAIL_HREF} className="text-clerk-primary-dark font-semibold hover:underline">
            {SUPPORT_EMAIL}
          </a>
        </p>
      </LegalSection>
    </LegalPageShell>
  )
}
