import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Security | Unite-Hub',
  description: 'How we keep your data safe and secure',
};

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Security
          </h1>
          <p className="text-lg text-slate-600">
            Your data security is our top priority
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg prose-slate max-w-none">
          <section className="mb-10 bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-semibold mb-4 text-slate-900">Infrastructure Security</h2>
            <p className="text-slate-700 mb-4">
              Our infrastructure is built on industry-leading cloud providers:
            </p>
            <ul className="space-y-2 text-slate-700">
              <li><strong>Hosting:</strong> Vercel with automatic DDoS protection</li>
              <li><strong>Database:</strong> Supabase (PostgreSQL) with SOC 2 Type II compliance</li>
              <li><strong>Storage:</strong> Encrypted object storage with signed URLs</li>
              <li><strong>CDN:</strong> Global edge network for fast, secure content delivery</li>
            </ul>
          </section>

          <section className="mb-10 bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-semibold mb-4 text-slate-900">Data Encryption</h2>
            <p className="text-slate-700 mb-4">
              All data is encrypted both in transit and at rest:
            </p>
            <ul className="space-y-2 text-slate-700">
              <li><strong>In Transit:</strong> TLS 1.3 encryption for all connections</li>
              <li><strong>At Rest:</strong> AES-256 encryption for stored data</li>
              <li><strong>API Keys:</strong> Securely stored and never exposed to clients</li>
              <li><strong>Passwords:</strong> Hashed using bcrypt with strong salt</li>
            </ul>
          </section>

          <section className="mb-10 bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-semibold mb-4 text-slate-900">Access Control</h2>
            <p className="text-slate-700 mb-4">
              We implement strict access controls:
            </p>
            <ul className="space-y-2 text-slate-700">
              <li><strong>Authentication:</strong> OAuth 2.0 with Google Sign-In</li>
              <li><strong>Authorization:</strong> Role-based access control (RBAC)</li>
              <li><strong>Row-Level Security:</strong> Database-level isolation between workspaces</li>
              <li><strong>Session Management:</strong> Secure session tokens with automatic expiry</li>
              <li><strong>Rate Limiting:</strong> API rate limits to prevent abuse</li>
            </ul>
          </section>

          <section className="mb-10 bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-semibold mb-4 text-slate-900">Security Monitoring</h2>
            <p className="text-slate-700 mb-4">
              Continuous monitoring and threat detection:
            </p>
            <ul className="space-y-2 text-slate-700">
              <li>24/7 automated security monitoring</li>
              <li>Real-time intrusion detection</li>
              <li>Audit logging of all sensitive operations</li>
              <li>Regular vulnerability scanning</li>
              <li>Automated security updates</li>
            </ul>
          </section>

          <section className="mb-10 bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-semibold mb-4 text-slate-900">Compliance</h2>
            <p className="text-slate-700 mb-4">
              We comply with major data protection regulations:
            </p>
            <ul className="space-y-2 text-slate-700">
              <li><strong>GDPR:</strong> General Data Protection Regulation (EU)</li>
              <li><strong>CAN-SPAM:</strong> Email marketing compliance</li>
              <li><strong>CCPA:</strong> California Consumer Privacy Act</li>
              <li><strong>SOC 2:</strong> Infrastructure provider certification</li>
            </ul>
          </section>

          <section className="mb-10 bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-semibold mb-4 text-slate-900">Data Backup & Recovery</h2>
            <p className="text-slate-700 mb-4">
              Your data is protected with:
            </p>
            <ul className="space-y-2 text-slate-700">
              <li>Automated daily backups with point-in-time recovery</li>
              <li>Multi-region backup redundancy</li>
              <li>99.9% uptime SLA</li>
              <li>Disaster recovery procedures</li>
              <li>Data export capability</li>
            </ul>
          </section>

          <section className="mb-10 bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-semibold mb-4 text-slate-900">Responsible Disclosure</h2>
            <p className="text-slate-700 mb-4">
              If you discover a security vulnerability, please report it to:
            </p>
            <div className="text-slate-700">
              <p className="mb-2">
                <strong>Email:</strong> security@unite-hub.com
              </p>
              <p className="text-sm text-slate-600">
                We take all security reports seriously and will respond within 48 hours.
              </p>
            </div>
          </section>

          <section className="mb-10 bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-semibold mb-4 text-slate-900">Security Best Practices for Users</h2>
            <p className="text-slate-700 mb-4">
              Help keep your account secure by:
            </p>
            <ul className="space-y-2 text-slate-700">
              <li>Using a strong, unique password</li>
              <li>Enabling two-factor authentication (2FA) when available</li>
              <li>Never sharing your credentials</li>
              <li>Regularly reviewing account activity</li>
              <li>Keeping your devices and browsers updated</li>
            </ul>
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
