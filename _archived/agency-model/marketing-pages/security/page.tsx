import { Metadata } from 'next';
import { Shield, Lock, Eye, AlertTriangle, CheckCircle, Database, Key, Bell, FileCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Security | Unite-Hub',
  description: 'How we keep your data secure',
};

export default function SecurityPage() {
  return (
    <div className="container mx-auto py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Shield className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold mb-4">Security at Unite-Hub</h1>
          <p className="text-xl text-muted-foreground">
            Your data security is our top priority
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader>
              <Lock className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Encryption</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>All data encrypted in transit (TLS 1.3)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Encryption at rest for sensitive data</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Secure password hashing (bcrypt)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>End-to-end encrypted file storage</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Eye className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Access Control</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Row-level security (RLS) in database</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Workspace-level data isolation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Role-based permissions (RBAC)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Multi-factor authentication (MFA)</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Database className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Data Protection</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Automated daily backups</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Point-in-time recovery</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Geo-redundant storage</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>99.9% uptime SLA</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Bell className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>24/7 security monitoring</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Automated threat detection</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Audit logging of all actions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Real-time security alerts</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Key className="h-6 w-6" />
            Security Measures
          </h2>

          <h3 className="text-xl font-semibold mb-2 mt-6">Infrastructure Security</h3>
          <ul>
            <li>Hosted on secure cloud infrastructure (Vercel + Supabase)</li>
            <li>Isolated network environments for production and development</li>
            <li>Automated security patches and updates</li>
            <li>DDoS protection and rate limiting</li>
            <li>Web Application Firewall (WAF)</li>
            <li>Content Security Policy (CSP) headers</li>
            <li>Regular vulnerability scanning</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2 mt-6">Authentication & Authorization</h3>
          <ul>
            <li>Secure session management with NextAuth.js</li>
            <li>OAuth 2.0 integration (Google, Microsoft)</li>
            <li>Multi-factor authentication (MFA) support</li>
            <li>Automatic session expiry (configurable)</li>
            <li>Password strength requirements</li>
            <li>Account lockout after failed login attempts</li>
            <li>Single Sign-On (SSO) available for enterprise plans</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2 mt-6">Application Security</h3>
          <ul>
            <li>Input validation and sanitization</li>
            <li>Protection against SQL injection, XSS, and CSRF</li>
            <li>Secure API endpoints with authentication</li>
            <li>Rate limiting to prevent abuse</li>
            <li>File upload validation and scanning</li>
            <li>Secure handling of AI-processed data</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2 mt-6">Data Privacy</h3>
          <ul>
            <li>Row-level security (RLS) policies in database</li>
            <li>Workspace isolation - users can only access their organization's data</li>
            <li>Granular permission controls</li>
            <li>Data anonymization for analytics</li>
            <li>Right to access, export, and delete data</li>
            <li>GDPR and CCPA compliant</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2 mt-6">Compliance & Certifications</h3>
          <ul>
            <li><strong>GDPR:</strong> General Data Protection Regulation compliant</li>
            <li><strong>CCPA:</strong> California Consumer Privacy Act compliant</li>
            <li><strong>SOC 2 Type II:</strong> In progress (expected Q2 2025)</li>
            <li><strong>ISO 27001:</strong> Information security management (planned)</li>
            <li><strong>PCI DSS:</strong> Payment card data security (via Stripe)</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2 mt-6">Incident Response</h3>
          <ul>
            <li>24/7 security team monitoring</li>
            <li>Documented incident response plan</li>
            <li>Automated alerting for security events</li>
            <li>Regular security drills and tabletop exercises</li>
            <li>Transparent communication during incidents</li>
            <li>Post-incident reviews and improvements</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2 mt-6">Third-Party Security</h3>
          <p>
            We carefully vet all third-party services used in our platform:
          </p>
          <ul>
            <li><strong>Supabase:</strong> SOC 2 Type II certified, ISO 27001 compliant</li>
            <li><strong>Vercel:</strong> SOC 2 Type II certified, GDPR compliant</li>
            <li><strong>Anthropic (Claude AI):</strong> Enterprise-grade security, data privacy guarantees</li>
            <li><strong>Stripe:</strong> PCI DSS Level 1 certified</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2 mt-6">Security Testing</h3>
          <ul>
            <li>Regular penetration testing by independent security firms</li>
            <li>Automated vulnerability scanning in CI/CD pipeline</li>
            <li>Code security reviews</li>
            <li>Dependency vulnerability monitoring</li>
            <li>Bug bounty program (coming soon)</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2 mt-6 flex items-center gap-2">
            <FileCheck className="h-6 w-6" />
            Security Best Practices for Users
          </h3>
          <p>
            Help us keep your account secure by following these best practices:
          </p>
          <ul>
            <li>Enable multi-factor authentication (MFA)</li>
            <li>Use a strong, unique password</li>
            <li>Never share your account credentials</li>
            <li>Log out when using shared devices</li>
            <li>Review account activity regularly</li>
            <li>Report suspicious activity immediately</li>
            <li>Keep your email account secure (password recovery)</li>
          </ul>

          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-6 mt-8">
            <div className="flex gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Report a Security Issue</h3>
                <p className="text-amber-800 dark:text-amber-200">
                  If you discover a security vulnerability, please report it responsibly to:{' '}
                  <a href="mailto:security@unite-hub.com" className="font-semibold underline">
                    security@unite-hub.com
                  </a>
                </p>
                <p className="text-amber-800 dark:text-amber-200 mt-2 text-sm">
                  We take all security reports seriously and will respond within 24 hours. Please do not
                  publicly disclose vulnerabilities until we have addressed them.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mt-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Security Updates</h3>
            <p className="text-blue-800 dark:text-blue-200">
              We publish security updates and advisories on our status page. Subscribe to receive notifications
              about security incidents, maintenance windows, and system updates.
            </p>
            <a
              href="https://status.unite-hub.com"
              className="inline-block mt-3 text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Visit Status Page →
            </a>
          </div>
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>
            Last security audit: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
          <p className="mt-2">
            Questions about our security practices?{' '}
            <a href="mailto:security@unite-hub.com" className="text-primary hover:underline">
              Contact our security team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
