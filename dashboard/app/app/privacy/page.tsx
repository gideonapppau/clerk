import type { Metadata } from 'next'
import { LegalPageShell, LegalSection } from '@/components/legal/LegalPageShell'
import { SUPPORT_EMAIL, SUPPORT_EMAIL_HREF } from '@/lib/marketing'
import { createPageMetadata } from '@/lib/seo'

export const metadata: Metadata = createPageMetadata({
  title: 'Privacy Policy',
  description: 'How Clerk collects, uses, and protects your data.',
  path: '/privacy',
})

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Privacy Policy" updated="11 June 2026">
      <LegalSection title="Who we are">
        <p>
          Clerk (&ldquo;we&rdquo;, &ldquo;us&rdquo;) provides a WhatsApp sales assistant for merchants.
          This policy explains what information we collect when you use Clerk and how we use it.
        </p>
      </LegalSection>

      <LegalSection title="Information we collect">
        <p>
          <strong className="text-slate-800">Account data:</strong> business name, email, and credentials
          you provide when you sign up.
        </p>
        <p>
          <strong className="text-slate-800">WhatsApp data:</strong> messages, customer phone numbers,
          and conversation metadata processed so Clerk can reply on your behalf and show your inbox in the dashboard.
        </p>
        <p>
          <strong className="text-slate-800">Commerce data:</strong> products, prices, stock, orders,
          and payment configuration you add to Clerk.
        </p>
        <p>
          <strong className="text-slate-800">Usage data:</strong> logs, device/browser type, and
          diagnostics needed to operate and improve the service.
        </p>
      </LegalSection>

      <LegalSection title="How we use information">
        <p>We use your information to:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Operate Clerk and respond to customer messages on your WhatsApp number</li>
          <li>Capture orders and show them in your dashboard</li>
          <li>Process payments you configure (via third-party providers such as Paystack)</li>
          <li>Provide support and send service-related notices</li>
          <li>Improve reliability, security, and product quality</li>
        </ul>
        <p>We do not sell your personal data or your customers&rsquo; data to advertisers.</p>
      </LegalSection>

      <LegalSection title="Sharing">
        <p>
          We share data only with subprocessors needed to run Clerk (for example hosting, database,
          messaging infrastructure, and payment processors) under contracts that require appropriate
          safeguards. We may disclose information if required by law or to protect rights, safety, and security.
        </p>
      </LegalSection>

      <LegalSection title="Retention">
        <p>
          We keep account and conversation data while your account is active and for a reasonable period
          afterward for backups, disputes, and legal compliance. You may request deletion by contacting us.
        </p>
      </LegalSection>

      <LegalSection title="Security">
        <p>
          We use industry-standard measures including encryption in transit, access controls, and monitoring.
          No method of transmission or storage is completely secure; please use a strong password and
          protect your dashboard access.
        </p>
      </LegalSection>

      <LegalSection title="Your rights">
        <p>
          Depending on where you live, you may have rights to access, correct, delete, or export your data,
          or to object to certain processing. Contact us at{' '}
          <a href={SUPPORT_EMAIL_HREF} className="text-clerk-primary-dark font-semibold hover:underline">
            {SUPPORT_EMAIL}
          </a>{' '}
          and we will respond within a reasonable time.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          We may update this policy from time to time. We will post the revised version on this page and
          update the &ldquo;Last updated&rdquo; date above.
        </p>
      </LegalSection>
    </LegalPageShell>
  )
}
