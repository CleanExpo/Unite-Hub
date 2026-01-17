/**
 * Security Policy Page
 * Public security information page
 * Dark theme, design-system compliant
 */

import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security | Unite-Hub',
  description: 'Learn about Unite-Hub security practices, data protection, and compliance certifications.',
};

export default function SecurityPage() {
  const lastUpdated = '2026-01-17';

  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border-subtle bg-bg-base/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold">Unite-Hub</Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/privacy" className="text-text-secondary hover:text-text-primary transition-colors">Privacy</Link>
            <Link href="/terms" className="text-text-secondary hover:text-text-primary transition-colors">Terms</Link>
            <Link href="/login" className="px-4 py-2 bg-accent-500 text-white text-sm font-medium rounded-lg hover:bg-accent-600 transition-colors">
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Security</h1>
          <p className="text-text-secondary mb-12">
            Last updated: {lastUpdated}
          </p>

          {/* Security Overview */}
          <div className="bg-bg-elevated rounded-xl p-8 border border-border-subtle mb-12">
            <h2 className="text-2xl font-semibold mb-4">Our Commitment to Security</h2>
            <p className="text-text-secondary leading-relaxed">
              Unite-Hub is built with security at its core. We employ industry-leading practices to protect your data, maintain compliance, and ensure the integrity of our platform. Your trust is our priority.
            </p>
          </div>

          <div className="prose prose-invert prose-lg max-w-none space-y-8">
            {/* Infrastructure Security */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">1. Infrastructure Security</h2>

              <h3 className="text-xl font-medium mb-3 text-text-primary">1.1 Cloud Infrastructure</h3>
              <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                <li>Hosted on enterprise-grade cloud infrastructure with SOC 2 Type II certification</li>
                <li>Geographic redundancy with automatic failover</li>
                <li>99.9% uptime SLA with real-time monitoring</li>
                <li>DDoS protection and Web Application Firewall (WAF)</li>
                <li>Regular vulnerability scanning and penetration testing</li>
              </ul>

              <h3 className="text-xl font-medium mb-3 text-text-primary">1.2 Network Security</h3>
              <ul className="list-disc list-inside text-text-secondary space-y-2">
                <li>All traffic encrypted with TLS 1.3</li>
                <li>Private network isolation between services</li>
                <li>IP whitelisting and rate limiting</li>
                <li>Intrusion detection and prevention systems (IDS/IPS)</li>
                <li>Regular security audits by third-party firms</li>
              </ul>
            </section>

            {/* Data Protection */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">2. Data Protection</h2>

              <h3 className="text-xl font-medium mb-3 text-text-primary">2.1 Encryption</h3>
              <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                <li><strong className="text-text-primary">In Transit:</strong> TLS 1.3 encryption for all data transmission</li>
                <li><strong className="text-text-primary">At Rest:</strong> AES-256 encryption for stored data</li>
                <li><strong className="text-text-primary">Database:</strong> Encrypted PostgreSQL with row-level security</li>
                <li><strong className="text-text-primary">Backups:</strong> Encrypted automated backups with point-in-time recovery</li>
              </ul>

              <h3 className="text-xl font-medium mb-3 text-text-primary">2.2 Multi-Tenant Isolation</h3>
              <p className="text-text-secondary leading-relaxed mb-4">
                Unite-Hub implements strict multi-tenant isolation to ensure your data is completely separated from other customers:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2">
                <li>Row-Level Security (RLS) policies on all database tables</li>
                <li>Workspace-based access control with no cross-tenant data access</li>
                <li>Isolated storage buckets per tenant</li>
                <li>Tenant-specific encryption keys</li>
                <li>Regular isolation testing and audits</li>
              </ul>
            </section>

            {/* Access Control */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">3. Access Control</h2>

              <h3 className="text-xl font-medium mb-3 text-text-primary">3.1 Authentication</h3>
              <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                <li>Secure password hashing with bcrypt (cost factor 12)</li>
                <li>Multi-factor authentication (MFA) support</li>
                <li>OAuth 2.0 integration with Google and Microsoft</li>
                <li>Session management with secure, HTTP-only cookies</li>
                <li>Automatic session expiration and re-authentication</li>
              </ul>

              <h3 className="text-xl font-medium mb-3 text-text-primary">3.2 Authorization</h3>
              <ul className="list-disc list-inside text-text-secondary space-y-2">
                <li>Role-based access control (RBAC) with granular permissions</li>
                <li>Workspace-level permission boundaries</li>
                <li>API key authentication with scope limitations</li>
                <li>Audit logging of all access attempts</li>
                <li>Principle of least privilege enforcement</li>
              </ul>
            </section>

            {/* AI Security */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">4. AI Security</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                Unite-Hub uses AI responsibly with security measures in place:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2">
                <li>AI processing through Anthropic Claude API with enterprise security</li>
                <li>No customer data used for AI model training</li>
                <li>Prompt injection protection and input sanitization</li>
                <li>Rate limiting on AI operations</li>
                <li>Budget controls and usage monitoring</li>
                <li>Data Processing Agreements (DPA) with AI providers</li>
              </ul>
            </section>

            {/* Application Security */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">5. Application Security</h2>

              <h3 className="text-xl font-medium mb-3 text-text-primary">5.1 Secure Development</h3>
              <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                <li>Secure Software Development Lifecycle (SSDLC)</li>
                <li>Code review requirements for all changes</li>
                <li>Automated security scanning in CI/CD pipeline</li>
                <li>Dependency vulnerability monitoring</li>
                <li>Regular security training for developers</li>
              </ul>

              <h3 className="text-xl font-medium mb-3 text-text-primary">5.2 Vulnerability Management</h3>
              <ul className="list-disc list-inside text-text-secondary space-y-2">
                <li>OWASP Top 10 protection measures</li>
                <li>Input validation and output encoding</li>
                <li>SQL injection and XSS prevention</li>
                <li>CSRF token protection</li>
                <li>Content Security Policy (CSP) headers</li>
              </ul>
            </section>

            {/* Compliance */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">6. Compliance</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                Unite-Hub maintains compliance with major privacy and security regulations:
              </p>

              <div className="grid md:grid-cols-2 gap-6 mb-4">
                <div className="bg-bg-elevated rounded-lg p-6 border border-border-subtle">
                  <h4 className="font-semibold text-text-primary mb-2">GDPR</h4>
                  <p className="text-text-secondary text-sm">
                    Full compliance with EU General Data Protection Regulation including data subject rights, consent management, and data processing agreements.
                  </p>
                </div>
                <div className="bg-bg-elevated rounded-lg p-6 border border-border-subtle">
                  <h4 className="font-semibold text-text-primary mb-2">CCPA</h4>
                  <p className="text-text-secondary text-sm">
                    California Consumer Privacy Act compliance with data disclosure, deletion rights, and opt-out mechanisms.
                  </p>
                </div>
                <div className="bg-bg-elevated rounded-lg p-6 border border-border-subtle">
                  <h4 className="font-semibold text-text-primary mb-2">SOC 2 Type II</h4>
                  <p className="text-text-secondary text-sm">
                    Annual SOC 2 audits covering security, availability, processing integrity, confidentiality, and privacy.
                  </p>
                </div>
                <div className="bg-bg-elevated rounded-lg p-6 border border-border-subtle">
                  <h4 className="font-semibold text-text-primary mb-2">ISO 27001</h4>
                  <p className="text-text-secondary text-sm">
                    Information security management system aligned with ISO 27001 framework and best practices.
                  </p>
                </div>
              </div>
            </section>

            {/* Incident Response */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">7. Incident Response</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                We maintain a comprehensive incident response program:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2">
                <li>24/7 security monitoring and alerting</li>
                <li>Documented incident response procedures</li>
                <li>Incident classification and escalation protocols</li>
                <li>Customer notification within 72 hours of confirmed breach</li>
                <li>Post-incident analysis and remediation</li>
                <li>Regular incident response drills</li>
              </ul>
            </section>

            {/* Business Continuity */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">8. Business Continuity</h2>
              <ul className="list-disc list-inside text-text-secondary space-y-2">
                <li>Automated daily backups with 30-day retention</li>
                <li>Point-in-time recovery capability</li>
                <li>Geographic redundancy across multiple regions</li>
                <li>Disaster recovery plan with 4-hour RTO</li>
                <li>Regular backup restoration testing</li>
                <li>Business continuity documentation and testing</li>
              </ul>
            </section>

            {/* Employee Security */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">9. Employee Security</h2>
              <ul className="list-disc list-inside text-text-secondary space-y-2">
                <li>Background checks for all employees</li>
                <li>Security awareness training (quarterly)</li>
                <li>Principle of least privilege access</li>
                <li>Secure workstation requirements</li>
                <li>Confidentiality agreements</li>
                <li>Access revocation upon termination</li>
              </ul>
            </section>

            {/* Responsible Disclosure */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">10. Responsible Disclosure</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                We welcome security researchers to report vulnerabilities responsibly:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                <li>Report vulnerabilities to <a href="mailto:security@unite-hub.com" className="text-accent-500 hover:text-accent-400">security@unite-hub.com</a></li>
                <li>Include detailed steps to reproduce the issue</li>
                <li>Allow reasonable time for remediation before disclosure</li>
                <li>Do not access or modify other users' data</li>
              </ul>
              <p className="text-text-secondary leading-relaxed">
                We commit to acknowledging reports within 48 hours and providing regular updates on remediation progress.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">11. Security Contact</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                For security questions or to report a concern:
              </p>
              <div className="bg-bg-elevated rounded-lg p-6 border border-border-subtle">
                <p className="text-text-primary font-medium mb-2">Unite-Hub Security Team</p>
                <p className="text-text-secondary">Email: <a href="mailto:security@unite-hub.com" className="text-accent-500 hover:text-accent-400">security@unite-hub.com</a></p>
                <p className="text-text-secondary">PGP Key: Available upon request</p>
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
