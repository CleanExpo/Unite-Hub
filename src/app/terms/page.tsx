import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | Unite-Hub',
  description: 'Terms and conditions for using Unite-Hub',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Terms of Service
          </h1>
          <p className="text-lg text-slate-600">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg prose-slate max-w-none">
          <section className="mb-10 bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-semibold mb-4 text-slate-900">Acceptance of Terms</h2>
            <p className="text-slate-700">
              By accessing and using Unite-Hub, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="mb-10 bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-semibold mb-4 text-slate-900">Use of Service</h2>
            <p className="text-slate-700 mb-4">
              You agree to use Unite-Hub only for lawful purposes and in accordance with these Terms. You agree not to:
            </p>
            <ul className="space-y-2 text-slate-700">
              <li>Use the service in any way that violates applicable laws or regulations</li>
              <li>Engage in any conduct that restricts or inhibits anyone's use of the service</li>
              <li>Attempt to gain unauthorized access to any part of the service</li>
              <li>Use the service to transmit spam or unsolicited messages</li>
              <li>Interfere with or disrupt the service or servers</li>
            </ul>
          </section>

          <section className="mb-10 bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-semibold mb-4 text-slate-900">Account Responsibilities</h2>
            <p className="text-slate-700 mb-4">
              You are responsible for:
            </p>
            <ul className="space-y-2 text-slate-700">
              <li>Maintaining the security of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Ensuring the accuracy of information you provide</li>
              <li>Compliance with CAN-SPAM, GDPR, and other applicable regulations</li>
              <li>Obtaining consent before sending marketing communications</li>
            </ul>
          </section>

          <section className="mb-10 bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-semibold mb-4 text-slate-900">Subscription and Payment</h2>
            <p className="text-slate-700 mb-4">
              Subscription terms:
            </p>
            <ul className="space-y-2 text-slate-700">
              <li>Subscriptions are billed in advance on a monthly or annual basis</li>
              <li>You can cancel your subscription at any time</li>
              <li>Refunds are provided within 14 days of initial purchase</li>
              <li>We reserve the right to modify pricing with 30 days notice</li>
              <li>Payment processing is handled securely through Stripe</li>
            </ul>
          </section>

          <section className="mb-10 bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-semibold mb-4 text-slate-900">Intellectual Property</h2>
            <p className="text-slate-700">
              The service and its original content, features, and functionality are owned by Unite-Hub and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
          </section>

          <section className="mb-10 bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-semibold mb-4 text-slate-900">Limitation of Liability</h2>
            <p className="text-slate-700">
              Unite-Hub shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
            </p>
          </section>

          <section className="mb-10 bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-semibold mb-4 text-slate-900">Termination</h2>
            <p className="text-slate-700">
              We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users of the service, us, or third parties, or for any other reason.
            </p>
          </section>

          <section className="mb-10 bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-semibold mb-4 text-slate-900">Changes to Terms</h2>
            <p className="text-slate-700">
              We reserve the right to modify or replace these Terms at any time. We will provide notice of any material changes by posting the new Terms on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-10 bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-semibold mb-4 text-slate-900">Contact Us</h2>
            <p className="text-slate-700 mb-4">
              If you have questions about these Terms, please contact us:
            </p>
            <div className="text-slate-700">
              <p className="mb-2">
                <strong>Email:</strong> legal@unite-hub.com
              </p>
              <p className="mb-2">
                <strong>Address:</strong> [Your Business Address]
              </p>
            </div>
          </section>
        </div>

        {/* Back Button */}
        <div className="text-center mt-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
