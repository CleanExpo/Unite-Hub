import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Unite-Hub',
  description: 'How we protect your data and respect your privacy under Australian Privacy Principles',
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto py-16 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p className="text-lg text-muted-foreground mb-6">
          Last updated: {new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">About This Policy</h2>
          <p>
            Unite-Hub Pty Ltd (ABN TBA) ("we", "us", "our") is committed to protecting your privacy in accordance with the{' '}
            <strong>Australian Privacy Principles (APPs)</strong> under the Privacy Act 1988 (Cth). This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information.
          </p>
          <p className="mt-4">
            By using Unite-Hub, you consent to the collection and use of your information as described in this policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
          <p>
            We collect information you provide directly to us, including:
          </p>
          <ul>
            <li><strong>Account Information:</strong> Name, email address, password (encrypted)</li>
            <li><strong>Organization Data:</strong> Business name, ABN/ACN, industry, team size</li>
            <li><strong>Contact Information:</strong> Customer contact details you upload to our CRM system</li>
            <li><strong>Campaign Data:</strong> Email campaigns, drip sequences, marketing content</li>
            <li><strong>Media Files:</strong> Audio/video files you upload (stored encrypted at rest)</li>
            <li><strong>Usage Data:</strong> Platform interactions, feature usage, page views</li>
            <li><strong>Technical Data:</strong> IP address, browser type, device information, cookies</li>
            <li><strong>Payment Information:</strong> Processed securely via Stripe (we do not store card details)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li><strong>Provide Services:</strong> Deliver CRM, marketing automation, and AI-powered features</li>
            <li><strong>Process Transactions:</strong> Handle billing, subscription management, and invoicing</li>
            <li><strong>Communication:</strong> Send service updates, feature announcements, and support responses</li>
            <li><strong>Marketing:</strong> Send promotional emails (with your consent, opt-out available)</li>
            <li><strong>Product Improvement:</strong> Analyze usage patterns to enhance features and user experience</li>
            <li><strong>AI Processing:</strong> Power intelligent features like lead scoring, content generation, and email analysis</li>
            <li><strong>Security:</strong> Detect and prevent fraud, abuse, or security incidents</li>
            <li><strong>Legal Compliance:</strong> Meet regulatory requirements and respond to lawful requests</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">AI Processing and Third-Party Services</h2>
          <p>
            Unite-Hub uses AI technology to provide intelligent features. We partner with the following services:
          </p>
          <ul>
            <li><strong>Anthropic Claude API:</strong> Email analysis, content generation, lead scoring, sentiment analysis</li>
            <li><strong>OpenAI Whisper:</strong> Audio transcription for uploaded media files</li>
            <li><strong>Google Cloud Services:</strong> Gmail integration, authentication (OAuth 2.0)</li>
            <li><strong>Supabase:</strong> Database hosting, authentication, file storage (data stored in Sydney, Australia)</li>
            <li><strong>Stripe:</strong> Payment processing (PCI DSS compliant)</li>
          </ul>
          <p className="mt-4">
            <strong>Important:</strong> We do NOT use your data to train AI models. All AI processing is ephemeral - your data is processed for your request and then discarded by the AI provider. We have Data Processing Agreements (DPAs) in place with all AI providers.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Storage and Location</h2>
          <p>
            Your data is primarily stored in Australia (Supabase Sydney region) to comply with Australian data sovereignty requirements. Some services may process data internationally:
          </p>
          <ul>
            <li><strong>Supabase (Primary Database):</strong> Sydney, Australia (AWS ap-southeast-2)</li>
            <li><strong>Anthropic Claude API:</strong> United States (ephemeral processing only)</li>
            <li><strong>Stripe:</strong> United States and Ireland (payment processing)</li>
          </ul>
          <p className="mt-4">
            We ensure all international transfers comply with APP 8 (Cross-Border Disclosure) and have appropriate safeguards in place.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
          <p>
            We implement comprehensive security measures to protect your data:
          </p>
          <ul>
            <li><strong>Encryption in Transit:</strong> TLS 1.3 for all data transmission</li>
            <li><strong>Encryption at Rest:</strong> AES-256 encryption for stored data</li>
            <li><strong>Database Security:</strong> Row-Level Security (RLS) policies, workspace isolation</li>
            <li><strong>Authentication:</strong> Secure password hashing (bcrypt), OAuth 2.0, optional MFA</li>
            <li><strong>Access Controls:</strong> Role-based access control (RBAC), least privilege principle</li>
            <li><strong>Infrastructure:</strong> SOC 2 Type II certified hosting providers (Supabase, AWS)</li>
            <li><strong>Monitoring:</strong> Automated security scanning, audit logging, intrusion detection</li>
            <li><strong>Backups:</strong> Daily encrypted backups with 30-day retention</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Sharing and Disclosure</h2>
          <p>
            We do NOT sell your personal information. We may share your data in the following circumstances:
          </p>
          <ul>
            <li><strong>Service Providers:</strong> Trusted third parties who help us operate our platform (hosting, analytics, AI processing) under strict confidentiality agreements</li>
            <li><strong>Legal Compliance:</strong> When required by Australian law or to respond to valid legal requests (court orders, subpoenas)</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets (users will be notified)</li>
            <li><strong>Consent:</strong> When you explicitly authorize sharing (e.g., integrations, exports)</li>
            <li><strong>Protection of Rights:</strong> To enforce our Terms of Service or protect our legal rights</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Your Rights Under Australian Privacy Law</h2>
          <p>Under the Australian Privacy Principles, you have the right to:</p>
          <ul>
            <li><strong>Access (APP 12):</strong> Request a copy of your personal information we hold</li>
            <li><strong>Correction (APP 13):</strong> Request correction of inaccurate or outdated data</li>
            <li><strong>Deletion:</strong> Request deletion of your data (subject to legal retention requirements)</li>
            <li><strong>Export:</strong> Download your data in a portable format (JSON/CSV)</li>
            <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications at any time</li>
            <li><strong>Object:</strong> Object to certain data processing activities</li>
            <li><strong>Restrict:</strong> Request temporary restriction of data processing</li>
            <li><strong>Complain:</strong> Lodge a complaint with the Office of the Australian Information Commissioner (OAIC)</li>
          </ul>
          <p className="mt-4">
            To exercise these rights, submit a <Link href="/subject-access-request" className="text-primary hover:underline">Subject Access Request</Link> or contact us at{' '}
            <a href="mailto:privacy@unite-hub.com.au" className="text-primary hover:underline">privacy@unite-hub.com.au</a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Cookies and Tracking Technologies</h2>
          <p>
            We use cookies and similar technologies to enhance your experience:
          </p>
          <ul>
            <li><strong>Necessary Cookies:</strong> Authentication, session management, security (cannot be disabled)</li>
            <li><strong>Analytics Cookies:</strong> Google Analytics for usage analysis (requires consent)</li>
            <li><strong>Marketing Cookies:</strong> Ad retargeting, conversion tracking (requires consent)</li>
            <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
          </ul>
          <p className="mt-4">
            You can manage cookie preferences through our cookie consent banner or your browser settings. Note that disabling necessary cookies may impact core functionality.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
          <p>
            We retain your data for as long as your account is active or as needed to provide services:
          </p>
          <ul>
            <li><strong>Active Accounts:</strong> Data retained while account is active</li>
            <li><strong>Deleted Accounts:</strong> Most data deleted within 90 days of account deletion</li>
            <li><strong>Legal Retention:</strong> Some data retained for 7 years to comply with Australian tax and business record requirements</li>
            <li><strong>Audit Logs:</strong> Security and access logs retained for 12 months</li>
            <li><strong>Backups:</strong> Backup data deleted within 30 days of account deletion</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Marketing Communications</h2>
          <p>
            We may send you marketing emails about new features, promotions, or industry insights. You can opt-out at any time by:
          </p>
          <ul>
            <li>Clicking "Unsubscribe" in any marketing email</li>
            <li>Adjusting preferences in your account settings</li>
            <li>Contacting us at <a href="mailto:privacy@unite-hub.com.au" className="text-primary hover:underline">privacy@unite-hub.com.au</a></li>
          </ul>
          <p className="mt-4">
            Note: You will still receive transactional emails (receipts, password resets, service updates) even if you opt-out of marketing.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
          <p>
            Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately at{' '}
            <a href="mailto:privacy@unite-hub.com.au" className="text-primary hover:underline">privacy@unite-hub.com.au</a> and we will delete it promptly.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time to reflect changes in our practices or legal requirements. We will notify you of significant changes via:
          </p>
          <ul>
            <li>Email notification to your registered email address</li>
            <li>Prominent notice on our platform dashboard</li>
            <li>Updated "Last updated" date at the top of this policy</li>
          </ul>
          <p className="mt-4">
            Continued use of our services after changes indicates acceptance of the updated policy. If you do not agree with changes, you may close your account.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Complaints and Disputes</h2>
          <p>
            If you have a complaint about our handling of your personal information:
          </p>
          <ol>
            <li><strong>Contact Us:</strong> Email <a href="mailto:privacy@unite-hub.com.au" className="text-primary hover:underline">privacy@unite-hub.com.au</a> with details of your complaint</li>
            <li><strong>Investigation:</strong> We will investigate and respond within 30 days</li>
            <li><strong>OAIC:</strong> If unsatisfied with our response, you may lodge a complaint with the Office of the Australian Information Commissioner at <a href="https://www.oaic.gov.au" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">www.oaic.gov.au</a></li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
          <p>
            For privacy questions, concerns, or to exercise your rights:
          </p>
          <div className="bg-muted p-6 rounded-lg mt-4">
            <p className="mb-2">
              <strong>Privacy Officer:</strong> Unite-Hub Privacy Team
            </p>
            <p className="mb-2">
              <strong>Email:</strong> <a href="mailto:privacy@unite-hub.com.au" className="text-primary hover:underline">privacy@unite-hub.com.au</a>
            </p>
            <p className="mb-2">
              <strong>Data Protection Officer:</strong> <a href="mailto:dpo@unite-hub.com.au" className="text-primary hover:underline">dpo@unite-hub.com.au</a>
            </p>
            <p className="mb-2">
              <strong>Subject Access Requests:</strong> <Link href="/subject-access-request" className="text-primary hover:underline">Submit SAR Online</Link>
            </p>
            <p className="mb-2">
              <strong>Business Address:</strong><br />
              Unite-Hub Pty Ltd<br />
              Level 1, 123 Business Street<br />
              Brisbane QLD 4000<br />
              Australia
            </p>
            <p className="mb-2">
              <strong>ABN:</strong> [To Be Assigned]
            </p>
            <p>
              <strong>Response Time:</strong> We aim to respond to privacy inquiries within 5 business days, and complete Subject Access Requests within 30 days.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Regulatory Information</h2>
          <p>
            Unite-Hub complies with:
          </p>
          <ul>
            <li><strong>Privacy Act 1988 (Cth)</strong> - Australian Privacy Principles (APPs)</li>
            <li><strong>Spam Act 2003</strong> - Email marketing regulations</li>
            <li><strong>Australian Consumer Law</strong> - Consumer data protection</li>
            <li><strong>Notifiable Data Breaches (NDB) scheme</strong> - Breach notification requirements</li>
          </ul>
          <p className="mt-4">
            In the event of a data breach that may cause serious harm, we will notify affected individuals and the OAIC as required by law.
          </p>
        </section>
      </div>
    </div>
  );
}
