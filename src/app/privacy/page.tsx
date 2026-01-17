/**
 * Privacy Policy Page
 * Public legal page - GDPR/CCPA compliant
 * Dark theme, design-system compliant
 */

import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Unite-Hub',
  description: 'Learn how Unite-Hub collects, uses, and protects your personal information. GDPR and CCPA compliant.',
};

export default function PrivacyPolicyPage() {
  const lastUpdated = '2026-01-17';
  const effectiveDate = '2026-01-17';

  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border-subtle bg-bg-base/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold">Unite-Hub</Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/terms" className="text-text-secondary hover:text-text-primary transition-colors">Terms</Link>
            <Link href="/security" className="text-text-secondary hover:text-text-primary transition-colors">Security</Link>
            <Link href="/login" className="px-4 py-2 bg-accent-500 text-white text-sm font-medium rounded-lg hover:bg-accent-600 transition-colors">
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-text-secondary mb-12">
            Last updated: {lastUpdated} | Effective: {effectiveDate}
          </p>

          <div className="prose prose-invert prose-lg max-w-none space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">1. Introduction</h2>
              <p className="text-text-secondary leading-relaxed">
                Unite-Hub ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our marketing automation platform and related services.
              </p>
              <p className="text-text-secondary leading-relaxed">
                By using Unite-Hub, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies, please do not use our services.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">2. Information We Collect</h2>

              <h3 className="text-xl font-medium mb-3 text-text-primary">2.1 Information You Provide</h3>
              <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                <li>Account information (name, email address, password)</li>
                <li>Business information (company name, industry, size)</li>
                <li>Contact data you import or create (customer names, emails, phone numbers)</li>
                <li>Content you create (campaigns, emails, marketing materials)</li>
                <li>Payment information (processed securely via Stripe)</li>
                <li>Communications with our support team</li>
              </ul>

              <h3 className="text-xl font-medium mb-3 text-text-primary">2.2 Information Collected Automatically</h3>
              <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                <li>Device information (browser type, operating system, device identifiers)</li>
                <li>Usage data (features accessed, actions taken, time spent)</li>
                <li>Log data (IP address, access times, pages viewed)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>

              <h3 className="text-xl font-medium mb-3 text-text-primary">2.3 Information from Third Parties</h3>
              <ul className="list-disc list-inside text-text-secondary space-y-2">
                <li>OAuth providers (Google, Microsoft) when you connect accounts</li>
                <li>Integration partners when you enable third-party connections</li>
                <li>Analytics providers to understand service usage</li>
              </ul>
            </section>

            {/* How We Use Information */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">3. How We Use Your Information</h2>
              <p className="text-text-secondary leading-relaxed mb-4">We use the information we collect to:</p>
              <ul className="list-disc list-inside text-text-secondary space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices, updates, and administrative messages</li>
                <li>Respond to your comments, questions, and support requests</li>
                <li>Monitor and analyze trends, usage, and activities</li>
                <li>Detect, investigate, and prevent fraudulent or unauthorized activities</li>
                <li>Personalize and improve your experience</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            {/* AI and Data Processing */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">4. AI and Automated Processing</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                Unite-Hub uses artificial intelligence to enhance our services. This includes:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                <li>Content generation and suggestions powered by Claude AI</li>
                <li>Email classification and intent detection</li>
                <li>Customer sentiment analysis</li>
                <li>Campaign optimization recommendations</li>
              </ul>
              <p className="text-text-secondary leading-relaxed">
                Your data may be processed by AI systems to provide these features. We do not use your data to train AI models. All AI processing is done in accordance with our data processing agreements and applicable privacy laws.
              </p>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">5. Information Sharing and Disclosure</h2>
              <p className="text-text-secondary leading-relaxed mb-4">We may share your information in the following circumstances:</p>
              <ul className="list-disc list-inside text-text-secondary space-y-2">
                <li><strong className="text-text-primary">Service Providers:</strong> Third parties that perform services on our behalf (hosting, payment processing, analytics)</li>
                <li><strong className="text-text-primary">Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                <li><strong className="text-text-primary">Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong className="text-text-primary">With Your Consent:</strong> When you explicitly authorize sharing</li>
              </ul>
              <p className="text-text-secondary leading-relaxed mt-4">
                We do not sell your personal information to third parties.
              </p>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">6. Data Retention</h2>
              <p className="text-text-secondary leading-relaxed">
                We retain your information for as long as your account is active or as needed to provide services. We will retain and use your information as necessary to comply with legal obligations, resolve disputes, and enforce our agreements. When you delete your account, we will delete or anonymize your personal data within 30 days, except where retention is required by law.
              </p>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">7. Your Rights and Choices</h2>

              <h3 className="text-xl font-medium mb-3 text-text-primary">7.1 GDPR Rights (EEA Residents)</h3>
              <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                <li>Right to access your personal data</li>
                <li>Right to rectification of inaccurate data</li>
                <li>Right to erasure ("right to be forgotten")</li>
                <li>Right to restrict processing</li>
                <li>Right to data portability</li>
                <li>Right to object to processing</li>
                <li>Right to withdraw consent</li>
              </ul>

              <h3 className="text-xl font-medium mb-3 text-text-primary">7.2 CCPA Rights (California Residents)</h3>
              <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                <li>Right to know what personal information is collected</li>
                <li>Right to know if personal information is sold or disclosed</li>
                <li>Right to opt-out of the sale of personal information</li>
                <li>Right to delete personal information</li>
                <li>Right to non-discrimination for exercising privacy rights</li>
              </ul>

              <p className="text-text-secondary leading-relaxed">
                To exercise any of these rights, contact us at <a href="mailto:privacy@unite-hub.com" className="text-accent-500 hover:text-accent-400">privacy@unite-hub.com</a> or use the Data Subject Request feature in your account settings.
              </p>
            </section>

            {/* Security */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">8. Data Security</h2>
              <p className="text-text-secondary leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal data, including encryption in transit (TLS 1.3) and at rest (AES-256), regular security assessments, access controls, and employee training. However, no method of transmission over the Internet is 100% secure. See our <Link href="/security" className="text-accent-500 hover:text-accent-400">Security Policy</Link> for more details.
              </p>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">9. Cookies and Tracking</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                <li>Keep you signed in</li>
                <li>Remember your preferences</li>
                <li>Understand how you use our services</li>
                <li>Improve our services</li>
              </ul>
              <p className="text-text-secondary leading-relaxed">
                You can control cookies through your browser settings. Disabling cookies may affect functionality.
              </p>
            </section>

            {/* International Transfers */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">10. International Data Transfers</h2>
              <p className="text-text-secondary leading-relaxed">
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place, including Standard Contractual Clauses approved by the European Commission, to protect your data in accordance with this Privacy Policy.
              </p>
            </section>

            {/* Children */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">11. Children's Privacy</h2>
              <p className="text-text-secondary leading-relaxed">
                Unite-Hub is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
              </p>
            </section>

            {/* Changes */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">12. Changes to This Policy</h2>
              <p className="text-text-secondary leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of material changes by email or through a notice on our website. Your continued use of our services after changes become effective constitutes acceptance of the revised policy.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">13. Contact Us</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                If you have questions about this Privacy Policy or our data practices, contact us:
              </p>
              <div className="bg-bg-elevated rounded-lg p-6 border border-border-subtle">
                <p className="text-text-primary font-medium mb-2">Unite-Hub Privacy Team</p>
                <p className="text-text-secondary">Email: <a href="mailto:privacy@unite-hub.com" className="text-accent-500 hover:text-accent-400">privacy@unite-hub.com</a></p>
                <p className="text-text-secondary">Data Protection Officer: <a href="mailto:dpo@unite-hub.com" className="text-accent-500 hover:text-accent-400">dpo@unite-hub.com</a></p>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-text-tertiary text-sm">&copy; {new Date().getFullYear()} Unite-Hub. All rights reserved.</p>
          <nav className="flex gap-6 text-sm">
            <Link href="/privacy" className="text-text-secondary hover:text-text-primary">Privacy</Link>
            <Link href="/terms" className="text-text-secondary hover:text-text-primary">Terms</Link>
            <Link href="/security" className="text-text-secondary hover:text-text-primary">Security</Link>
            <Link href="/contact" className="text-text-secondary hover:text-text-primary">Contact</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
