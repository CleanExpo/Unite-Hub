import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Unite-Hub',
  description: 'How we protect your data and respect your privacy',
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto py-16 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p className="text-lg text-muted-foreground mb-6">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
          <p>
            We collect information you provide directly to us, including:
          </p>
          <ul>
            <li>Account information (name, email, password)</li>
            <li>Workspace and organization data</li>
            <li>Contact information you upload</li>
            <li>Project and campaign data</li>
            <li>Media files you upload (transcripts and AI analysis)</li>
            <li>Usage data and analytics</li>
            <li>Communication preferences</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide and improve our services</li>
            <li>Process your transactions and manage your account</li>
            <li>Send you updates and marketing communications (with your consent)</li>
            <li>Respond to your requests and support needs</li>
            <li>Analyze usage patterns to enhance user experience</li>
            <li>Detect and prevent fraud or security issues</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">AI Processing</h2>
          <p>
            Unite-Hub uses AI technology (Claude by Anthropic) to provide intelligent features including:
          </p>
          <ul>
            <li>Email analysis and intent extraction</li>
            <li>Contact intelligence and lead scoring</li>
            <li>Content personalization and generation</li>
            <li>Media transcription and analysis</li>
          </ul>
          <p>
            Your data is processed according to our AI partners' privacy policies. We do not use your data
            to train AI models without your explicit consent.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
          <p>
            We implement industry-standard security measures including:
          </p>
          <ul>
            <li>End-to-end encryption for data in transit (TLS 1.3)</li>
            <li>Encryption at rest for sensitive data</li>
            <li>Row-level security (RLS) in our database</li>
            <li>Workspace-level data isolation</li>
            <li>Regular security audits and vulnerability assessments</li>
            <li>Secure password hashing (bcrypt)</li>
            <li>Multi-factor authentication (MFA) support</li>
            <li>Automated backup systems</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Sharing</h2>
          <p>
            We do not sell your personal information. We may share your data with:
          </p>
          <ul>
            <li><strong>Service Providers:</strong> Trusted third parties who help us operate our platform (e.g., hosting, analytics, AI processing)</li>
            <li><strong>Legal Compliance:</strong> When required by law or to protect our rights</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            <li><strong>With Your Consent:</strong> When you explicitly authorize sharing</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Correction:</strong> Update or correct inaccurate data</li>
            <li><strong>Deletion:</strong> Request deletion of your data (subject to legal retention requirements)</li>
            <li><strong>Export:</strong> Download your data in a portable format</li>
            <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
            <li><strong>Object:</strong> Object to certain data processing activities</li>
            <li><strong>Restrict:</strong> Request restriction of data processing</li>
          </ul>
          <p>
            To exercise these rights, contact us at <a href="mailto:privacy@unite-hub.com" className="text-primary hover:underline">privacy@unite-hub.com</a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Cookies and Tracking</h2>
          <p>
            We use cookies and similar technologies to:
          </p>
          <ul>
            <li>Maintain your session and authentication state</li>
            <li>Remember your preferences</li>
            <li>Analyze site usage and performance</li>
            <li>Provide personalized content</li>
          </ul>
          <p>
            You can control cookie preferences through your browser settings. Note that disabling cookies
            may impact functionality.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
          <p>
            We retain your data for as long as your account is active or as needed to provide services.
            When you delete your account, we will delete your data within 90 days, except where we must
            retain it for legal, regulatory, or security purposes.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">International Data Transfers</h2>
          <p>
            Your data may be transferred to and processed in countries outside your jurisdiction. We ensure
            appropriate safeguards are in place to protect your data in compliance with applicable data
            protection laws.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
          <p>
            Our services are not intended for individuals under 18 years of age. We do not knowingly collect
            personal information from children. If you believe we have collected information from a child,
            please contact us immediately.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you of significant changes
            via email or through our platform. Continued use of our services after changes indicates acceptance
            of the updated policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p>
            For privacy questions, concerns, or to exercise your rights, contact us at:
          </p>
          <div className="bg-muted p-6 rounded-lg mt-4">
            <p className="mb-2">
              <strong>Email:</strong> <a href="mailto:privacy@unite-hub.com" className="text-primary hover:underline">privacy@unite-hub.com</a>
            </p>
            <p className="mb-2">
              <strong>Data Protection Officer:</strong> <a href="mailto:dpo@unite-hub.com" className="text-primary hover:underline">dpo@unite-hub.com</a>
            </p>
            <p>
              <strong>Mailing Address:</strong><br />
              Unite-Hub Privacy Team<br />
              [Your Business Address]<br />
              [City, State ZIP]
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
