import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon, ShieldCheck, Map, Bug } from 'lucide-react';
import Link from 'next/link';

// Dynamically import the audit dashboard to avoid SSR issues
const SiteAuditDashboard = dynamic(
  () => import('@/components/admin/SiteAuditDashboard'),
  { 
    ssr: false,
    loading: () => (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    )
  }
);

export const metadata: Metadata = {
  title: 'Site Health - Admin',
  description: 'Monitor and manage site health, audit issues, and sitemap',
};

// Mock audit function for development
// In production, this would be replaced with actual file scanning
async function runSiteAudit() {
  // Simulate audit delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Return mock data for now
  return {
    timestamp: new Date(),
    totalIssues: 12,
    criticalIssues: 2,
    warningIssues: 7,
    infoIssues: 3,
    issues: [
      {
        type: 'empty-button' as const,
        severity: 'critical' as const,
        file: 'src/components/dashboard/ActivityFeed.tsx',
        line: 45,
        message: 'Empty onClick handler detected',
        context: 'onClick={() => {}}'
      },
      {
        type: 'placeholder' as const,
        severity: 'warning' as const,
        file: 'src/components/landing/FeatureShowcase.tsx',
        line: 23,
        message: 'Placeholder text detected',
        context: '// TODO: Add real feature descriptions'
      },
      {
        type: 'coming-soon' as const,
        severity: 'warning' as const,
        file: 'src/app/services/ai-infrastructure/page.tsx',
        line: 89,
        message: 'Coming soon feature detected',
        context: '<Badge>Coming Soon</Badge>'
      }
    ],
    summary: {
      placeholders: 4,
      deadLinks: 1,
      missingImages: 0,
      emptyButtons: 2,
      todoComments: 3,
      comingSoon: 2
    }
  };
}

export default function SiteHealthPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-4">Site Health Management</h1>
          <p className="text-muted-foreground text-lg">
            Monitor site health, manage placeholders, and maintain your sitemap
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <ShieldCheck className="h-8 w-8 text-green-600 mr-4" />
              <div>
                <CardTitle className="text-lg">Site Status</CardTitle>
                <CardDescription>Overall health monitoring</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Run comprehensive audits to detect placeholders, broken links, and other issues.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Map className="h-8 w-8 text-blue-600 mr-4" />
              <div>
                <CardTitle className="text-lg">Sitemap</CardTitle>
                <CardDescription>Auto-generated site structure</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href="/sitemap" className="text-sm text-blue-600 hover:underline block">
                  View Visual Sitemap →
                </Link>
                <Link href="/api/sitemap" className="text-sm text-blue-600 hover:underline block">
                  Download XML Sitemap →
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Bug className="h-8 w-8 text-orange-600 mr-4" />
              <div>
                <CardTitle className="text-lg">Issue Tracking</CardTitle>
                <CardDescription>Placeholder management</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Track and resolve placeholders, TODOs, and coming soon features.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Feature Flags Alert */}
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Feature Flags Active</AlertTitle>
          <AlertDescription>
            Some features are currently disabled using feature flags. Enable them in{' '}
            <code className="text-sm bg-muted px-1 py-0.5 rounded">src/lib/utils/site-audit.ts</code>
          </AlertDescription>
        </Alert>

        {/* Site Audit Dashboard */}
        <SiteAuditDashboard onRunAudit={runSiteAudit} />

        {/* Maintenance Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Best Practices</CardTitle>
            <CardDescription>
              Keep your site healthy with these recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 list-disc list-inside text-sm">
              <li>Run site audits weekly to catch new issues early</li>
              <li>Review and update the sitemap after major content changes</li>
              <li>Use feature flags to hide incomplete features from users</li>
              <li>Replace placeholder content before launching new features</li>
              <li>Submit your sitemap to Google Search Console for better SEO</li>
              <li>Set up automated monitoring to alert on critical issues</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
