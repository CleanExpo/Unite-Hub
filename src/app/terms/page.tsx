/**
 * Terms of Service Page
 * Public legal page
 * Dark theme, design-system compliant
 */

import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Unite-Hub',
  description: 'Read the terms and conditions governing your use of Unite-Hub marketing automation platform.',
};

export default function TermsOfServicePage() {
  const lastUpdated = '2026-01-17';
  const effectiveDate = '2026-01-17';

  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border-subtle bg-bg-base/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold">Unite-Hub</Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/privacy" className="text-text-secondary hover:text-text-primary transition-colors">Privacy</Link>
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
          <p className="text-text-secondary mb-12">
            Last updated: {lastUpdated} | Effective: {effectiveDate}
          </p>

          <div className="prose prose-invert prose-lg max-w-none space-y-8">
            {/* Agreement */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">1. Agreement to Terms</h2>
              <p className="text-text-secondary leading-relaxed">
                These Terms of Service ("Terms") constitute a legally binding agreement between you ("User", "you", or "your") and Unite-Hub ("Company", "we", "us", or "our") governing your access to and use of the Unite-Hub platform, including any associated websites, applications, and services (collectively, the "Service").
              </p>
              <p className="text-text-secondary leading-relaxed mt-4">
                By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of these Terms, you may not access the Service.
              </p>
            </section>

            {/* Eligibility */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">2. Eligibility</h2>
              <p className="text-text-secondary leading-relaxed">
                You must be at least 18 years old and have the legal capacity to enter into a binding agreement to use the Service. By using the Service, you represent and warrant that you meet these eligibility requirements and that you have the authority to bind any organization on whose behalf you are using the Service.
              </p>
            </section>

            {/* Account */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">3. Account Registration and Security</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                To access certain features of the Service, you must register for an account. When registering, you agree to:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and promptly update your account information</li>
                <li>Keep your password confidential and secure</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized access</li>
              </ul>
              <p className="text-text-secondary leading-relaxed mt-4">
                We reserve the right to suspend or terminate accounts that violate these Terms or contain false information.
              </p>
            </section>

            {/* Subscription */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">4. Subscription and Payment</h2>

              <h3 className="text-xl font-medium mb-3 text-text-primary">4.1 Subscription Plans</h3>
              <p className="text-text-secondary leading-relaxed mb-4">
                Access to the Service requires a paid subscription. Plan details, features, and pricing are available on our website. We reserve the right to modify pricing with 30 days' notice.
              </p>

              <h3 className="text-xl font-medium mb-3 text-text-primary">4.2 Billing</h3>
              <p className="text-text-secondary leading-relaxed mb-4">
                Subscriptions are billed in advance on a monthly or annual basis. All payments are processed through Stripe. You authorize us to charge your payment method for all fees incurred.
              </p>

              <h3 className="text-xl font-medium mb-3 text-text-primary">4.3 Cancellation and Refunds</h3>
              <p className="text-text-secondary leading-relaxed">
                You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period. No refunds are provided for partial billing periods, except as required by law or at our sole discretion.
              </p>
            </section>

            {/* Acceptable Use */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">5. Acceptable Use Policy</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                You agree not to use the Service to:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2">
                <li>Violate any applicable laws, regulations, or third-party rights</li>
                <li>Send unsolicited commercial communications (spam)</li>
                <li>Harvest or collect email addresses without consent</li>
                <li>Distribute malware, viruses, or harmful code</li>
                <li>Attempt to gain unauthorized access to systems or data</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Impersonate any person or entity</li>
                <li>Engage in any fraudulent or deceptive practices</li>
                <li>Upload content that is illegal, offensive, or infringes intellectual property</li>
                <li>Resell or redistribute the Service without authorization</li>
              </ul>
            </section>

            {/* Content */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">6. Your Content</h2>

              <h3 className="text-xl font-medium mb-3 text-text-primary">6.1 Ownership</h3>
              <p className="text-text-secondary leading-relaxed mb-4">
                You retain ownership of all content you upload, create, or share through the Service ("Your Content"). We do not claim ownership of Your Content.
              </p>

              <h3 className="text-xl font-medium mb-3 text-text-primary">6.2 License Grant</h3>
              <p className="text-text-secondary leading-relaxed mb-4">
                By uploading Your Content, you grant us a non-exclusive, worldwide, royalty-free license to use, process, store, and display Your Content solely to provide and improve the Service. This license ends when you delete Your Content or close your account.
              </p>

              <h3 className="text-xl font-medium mb-3 text-text-primary">6.3 Responsibility</h3>
              <p className="text-text-secondary leading-relaxed">
                You are solely responsible for Your Content and ensuring you have all necessary rights and permissions. We reserve the right to remove content that violates these Terms.
              </p>
            </section>

            {/* AI Services */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">7. AI-Powered Features</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                The Service includes AI-powered features for content generation, analysis, and automation. You acknowledge that:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2">
                <li>AI-generated content is provided "as is" and may require review and editing</li>
                <li>You are responsible for reviewing and approving all AI-generated content before use</li>
                <li>AI features may have usage limits based on your subscription plan</li>
                <li>We may use aggregated, anonymized data to improve AI models, but not your specific content</li>
                <li>AI capabilities are subject to third-party provider terms (e.g., Anthropic)</li>
              </ul>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">8. Intellectual Property</h2>
              <p className="text-text-secondary leading-relaxed">
                The Service, including all software, designs, text, graphics, logos, and other materials, is owned by Unite-Hub and protected by intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of the Service without our written permission.
              </p>
            </section>

            {/* Third-Party Services */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">9. Third-Party Services</h2>
              <p className="text-text-secondary leading-relaxed">
                The Service may integrate with third-party services (email providers, social platforms, analytics tools). Your use of these integrations is subject to their respective terms and privacy policies. We are not responsible for the availability, accuracy, or practices of third-party services.
              </p>
            </section>

            {/* Disclaimers */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">10. Disclaimers</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2">
                <li>Merchantability and fitness for a particular purpose</li>
                <li>Non-infringement of third-party rights</li>
                <li>Accuracy, reliability, or completeness of content</li>
                <li>Uninterrupted or error-free operation</li>
                <li>Security of transmitted data</li>
              </ul>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">11. Limitation of Liability</h2>
              <p className="text-text-secondary leading-relaxed">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, UNITE-HUB SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
              </p>
            </section>

            {/* Indemnification */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">12. Indemnification</h2>
              <p className="text-text-secondary leading-relaxed">
                You agree to indemnify, defend, and hold harmless Unite-Hub and its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including attorneys' fees) arising from your use of the Service, Your Content, or your violation of these Terms.
              </p>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">13. Termination</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                We may suspend or terminate your access to the Service at any time for any reason, including violation of these Terms. Upon termination:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2">
                <li>Your right to use the Service immediately ceases</li>
                <li>You may request export of Your Content within 30 days</li>
                <li>We may delete Your Content after 30 days</li>
                <li>Provisions that should survive termination will remain in effect</li>
              </ul>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">14. Governing Law and Disputes</h2>
              <p className="text-text-secondary leading-relaxed">
                These Terms are governed by the laws of New South Wales, Australia, without regard to conflict of law principles. Any disputes arising from these Terms or the Service shall be resolved through binding arbitration or in the courts of New South Wales, Australia. You waive any objection to venue in these courts.
              </p>
            </section>

            {/* Changes */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">15. Changes to Terms</h2>
              <p className="text-text-secondary leading-relaxed">
                We may modify these Terms at any time. We will notify you of material changes via email or through the Service at least 30 days before they take effect. Your continued use of the Service after changes become effective constitutes acceptance of the modified Terms.
              </p>
            </section>

            {/* General */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">16. General Provisions</h2>
              <ul className="list-disc list-inside text-text-secondary space-y-2">
                <li><strong className="text-text-primary">Entire Agreement:</strong> These Terms constitute the entire agreement between you and Unite-Hub.</li>
                <li><strong className="text-text-primary">Severability:</strong> If any provision is found unenforceable, the remaining provisions remain in effect.</li>
                <li><strong className="text-text-primary">Waiver:</strong> Failure to enforce any right does not constitute a waiver of that right.</li>
                <li><strong className="text-text-primary">Assignment:</strong> You may not assign these Terms without our consent.</li>
              </ul>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">17. Contact Us</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                For questions about these Terms, contact us:
              </p>
              <div className="bg-bg-elevated rounded-lg p-6 border border-border-subtle">
                <p className="text-text-primary font-medium mb-2">Unite-Hub Legal Team</p>
                <p className="text-text-secondary">Email: <a href="mailto:legal@unite-hub.com" className="text-accent-500 hover:text-accent-400">legal@unite-hub.com</a></p>
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
