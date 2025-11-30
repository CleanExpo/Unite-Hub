import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Unite-Hub',
  description: 'Terms and conditions for using Unite-Hub',
};

export default function TermsPage() {
  return (
    <div className="container mx-auto py-16 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p className="text-lg text-muted-foreground mb-6">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing and using Unite-Hub ("Service"), you accept and agree to be bound by these Terms of Service
            ("Terms"). If you do not agree to these Terms, you may not use the Service.
          </p>
          <p>
            These Terms constitute a legally binding agreement between you and Unite-Hub. By creating an account or
            using our Service, you represent that you have the authority to accept these Terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Service Description</h2>
          <p>
            Unite-Hub provides AI-powered marketing automation and customer relationship management (CRM) tools,
            including but not limited to:
          </p>
          <ul>
            <li>Contact management and intelligence</li>
            <li>Email campaign automation</li>
            <li>AI-powered content generation</li>
            <li>Media file upload, transcription, and analysis</li>
            <li>Lead scoring and qualification</li>
            <li>Drip campaign workflows</li>
            <li>Integration with third-party services (Gmail, etc.)</li>
          </ul>
          <p>
            We reserve the right to modify, suspend, or discontinue any part of the Service at any time with or
            without notice.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Account Registration</h2>
          <p>
            To use the Service, you must:
          </p>
          <ul>
            <li>Be at least 18 years of age</li>
            <li>Provide accurate and complete registration information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Notify us immediately of any unauthorized access</li>
            <li>Be responsible for all activities under your account</li>
          </ul>
          <p>
            You may not share your account credentials or allow others to access your account. We reserve the right
            to suspend or terminate accounts that violate these Terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. User Responsibilities</h2>
          <p>
            You agree to:
          </p>
          <ul>
            <li>Use the Service in compliance with all applicable laws and regulations</li>
            <li>Not use the Service for illegal, harmful, or fraudulent purposes</li>
            <li>Not upload malicious code, viruses, or harmful content</li>
            <li>Not attempt to gain unauthorized access to our systems</li>
            <li>Not abuse, harass, or harm other users</li>
            <li>Not scrape, crawl, or automate access to the Service without permission</li>
            <li>Respect intellectual property rights of Unite-Hub and third parties</li>
            <li>Comply with anti-spam laws (CAN-SPAM, GDPR, CASL, etc.)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Acceptable Use Policy</h2>
          <p>
            You may NOT use the Service to:
          </p>
          <ul>
            <li>Send unsolicited bulk emails (spam)</li>
            <li>Distribute malware, phishing, or deceptive content</li>
            <li>Violate privacy rights or collect personal data without consent</li>
            <li>Engage in copyright or trademark infringement</li>
            <li>Promote illegal activities or violence</li>
            <li>Impersonate others or misrepresent your identity</li>
          </ul>
          <p>
            Violation of this policy may result in immediate account suspension or termination.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Subscription and Payment Terms</h2>
          <p>
            <strong>Billing:</strong> Subscription fees are billed in advance on a monthly or annual basis, depending
            on your chosen plan.
          </p>
          <p>
            <strong>Free Trial:</strong> We may offer a free trial period. You will not be charged until the trial
            ends unless you cancel before the trial expiration.
          </p>
          <p>
            <strong>Cancellation:</strong> You may cancel your subscription at any time. Cancellation takes effect at
            the end of the current billing period. No refunds are provided for partial months.
          </p>
          <p>
            <strong>Price Changes:</strong> We reserve the right to change pricing with 30 days' notice. Continued use
            after a price change constitutes acceptance of the new pricing.
          </p>
          <p>
            <strong>Taxes:</strong> You are responsible for any applicable sales, use, or value-added taxes.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Data Ownership and License</h2>
          <p>
            <strong>Your Data:</strong> You retain all rights, title, and ownership of content you upload to Unite-Hub,
            including contacts, campaigns, media files, and generated content.
          </p>
          <p>
            <strong>License to Us:</strong> You grant Unite-Hub a limited, non-exclusive license to use, store, and
            process your data solely to provide the Service and improve our AI models (with your consent).
          </p>
          <p>
            <strong>AI-Generated Content:</strong> Content generated by our AI tools is owned by you. However, you are
            responsible for ensuring AI-generated content complies with applicable laws and does not infringe on
            third-party rights.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Third-Party Integrations</h2>
          <p>
            Unite-Hub integrates with third-party services (e.g., Gmail, Google Drive, Stripe). Your use of these
            integrations is subject to the third party's terms of service and privacy policies. We are not responsible
            for third-party service outages or changes.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Intellectual Property</h2>
          <p>
            The Service, including its code, design, logos, and trademarks, is owned by Unite-Hub and protected by
            copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or
            reverse-engineer any part of the Service without our written permission.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Disclaimers and Limitation of Liability</h2>
          <p>
            <strong>AS IS:</strong> The Service is provided "as is" without warranties of any kind, express or implied,
            including warranties of merchantability, fitness for a particular purpose, or non-infringement.
          </p>
          <p>
            <strong>No Guarantee:</strong> We do not guarantee that the Service will be uninterrupted, error-free, or
            secure. You use the Service at your own risk.
          </p>
          <p>
            <strong>Limitation of Liability:</strong> To the maximum extent permitted by law, Unite-Hub shall not be
            liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits,
            data, or business opportunities, arising from your use of the Service.
          </p>
          <p>
            <strong>Maximum Liability:</strong> Our total liability to you for any claims arising from these Terms or
            the Service shall not exceed the amount you paid us in the 12 months prior to the claim.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless Unite-Hub, its affiliates, and employees from any claims, damages,
            losses, or expenses (including legal fees) arising from:
          </p>
          <ul>
            <li>Your violation of these Terms</li>
            <li>Your use of the Service</li>
            <li>Your violation of any third-party rights</li>
            <li>Content you upload or generate using the Service</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">12. Termination</h2>
          <p>
            We may suspend or terminate your account at any time, with or without cause, with or without notice. Upon
            termination, you will lose access to your account and data. You may export your data before termination.
          </p>
          <p>
            You may terminate your account at any time by canceling your subscription and contacting support.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">13. Dispute Resolution</h2>
          <p>
            <strong>Governing Law:</strong> These Terms are governed by the laws of New South Wales, Australia, without regard
            to conflict of law principles.
          </p>
          <p>
            <strong>Arbitration:</strong> Any disputes arising from these Terms or the Service shall be resolved through
            binding arbitration, except where prohibited by law. You waive the right to participate in class actions.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">14. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. We will notify you of material changes via email or through
            the Service. Continued use after changes constitutes acceptance of the updated Terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">15. Miscellaneous</h2>
          <p>
            <strong>Severability:</strong> If any provision of these Terms is found to be unenforceable, the remaining
            provisions will continue in full force.
          </p>
          <p>
            <strong>Assignment:</strong> You may not assign or transfer these Terms without our consent. We may assign
            these Terms at any time.
          </p>
          <p>
            <strong>Entire Agreement:</strong> These Terms, together with our Privacy Policy, constitute the entire
            agreement between you and Unite-Hub.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">16. Contact</h2>
          <p>
            Questions about these Terms? Contact us at:
          </p>
          <div className="bg-muted p-6 rounded-lg mt-4">
            <p className="mb-2">
              <strong>Email:</strong> <a href="mailto:legal@unite-hub.com" className="text-primary hover:underline">legal@unite-hub.com</a>
            </p>
            <p>
              <strong>Mailing Address:</strong><br />
              Unite-Hub Legal Team<br />
              contact@unite-group.in
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
