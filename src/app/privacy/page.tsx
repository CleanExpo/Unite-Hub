import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Unite-Hub',
  description: 'How we protect your data and respect your privacy',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-lg text-slate-600">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg prose-slate max-w-none">
          <section className="mb-10 bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-semibold mb-4 text-slate-900">Information We Collect</h2>
            <p className="text-slate-700 mb-4">
              We collect information you provide directly to us, including:
            </p>
            <ul className="space-y-2 text-slate-700">
              <li>Account information (name, email, password)</li>
              <li>Workspace and organization data</li>
              <li>Contact information you upload</li>
              <li>Project and campaign data</li>
              <li>Media files you upload</li>
              <li>Usage data and analytics</li>
            </ul>
          </section>

          <section className="mb-10 bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-semibold mb-4 text-slate-900">How We Use Your Information</h2>
            <ul className="space-y-2 text-slate-700">
              <li>Provide and improve our services</li>
              <li>Process your transactions</li>
              <li>Send you updates and marketing communications</li>
              <li>Respond to your requests and support needs</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-10 bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-semibold mb-4 text-slate-900">Data Security</h2>
            <p className="text-slate-700 mb-4">
              We implement industry-standard security measures including:
            </p>
            <ul className="space-y-2 text-slate-700">
              <li>End-to-end encryption for sensitive data</li>
              <li>Row-level security in our database</li>
              <li>Regular security audits</li>
              <li>Secure authentication with OAuth 2.0</li>
              <li>HTTPS encryption for all data in transit</li>
            </ul>
          </section>

          <section className="mb-10 bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-semibold mb-4 text-slate-900">Your Rights</h2>
            <p className="text-slate-700 mb-4">You have the right to:</p>
            <ul className="space-y-2 text-slate-700">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data</li>
              <li>Opt-out of marketing communications</li>
            </ul>
          </section>

          <section className="mb-10 bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-semibold mb-4 text-slate-900">Cookies and Tracking</h2>
            <p className="text-slate-700 mb-4">
              We use cookies and similar tracking technologies to:
            </p>
            <ul className="space-y-2 text-slate-700">
              <li>Maintain your session and authentication</li>
              <li>Analyze site usage and improve performance</li>
              <li>Personalize your experience</li>
              <li>Track email campaign engagement</li>
            </ul>
          </section>

          <section className="mb-10 bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-semibold mb-4 text-slate-900">Contact Us</h2>
            <p className="text-slate-700 mb-4">
              For privacy questions or to exercise your rights, contact us at:
            </p>
            <div className="text-slate-700">
              <p className="mb-2">
                <strong>Email:</strong> privacy@unite-hub.com
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
