'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScoreGauge } from './ScoreGauge';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Gauge,
  Shield,
  Smartphone,
  Link,
  Search,
  Zap,
  Clock,
  Eye,
  MousePointer,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuditResultsCardProps {
  audit: AuditResult;
  detailed?: boolean;
}

interface AuditResult {
  id: string;
  domain: string;
  overall_score: number;
  status: string;
  created_at: string;
  results?: {
    performance?: PerformanceMetrics;
    accessibility?: number;
    seo?: number;
    bestPractices?: number;
    mobile?: MobileMetrics;
    security?: SecurityMetrics;
    crawlability?: CrawlabilityMetrics;
  };
  recommendations?: Recommendation[];
}

interface PerformanceMetrics {
  score: number;
  lcp: number;
  fid: number;
  cls: number;
  fcp: number;
  ttfb: number;
}

interface MobileMetrics {
  isMobileFriendly: boolean;
  viewportConfigured: boolean;
  textReadable: boolean;
  tapTargetsOk: boolean;
}

interface SecurityMetrics {
  hasHttps: boolean;
  hasMixedContent: boolean;
  securityHeaders: string[];
}

interface CrawlabilityMetrics {
  hasRobotsTxt: boolean;
  hasSitemap: boolean;
  canonicalOk: boolean;
  noIndexPages: number;
}

interface Recommendation {
  category: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
}

const CORE_WEB_VITALS = {
  lcp: { name: 'LCP', good: 2500, poor: 4000, unit: 'ms', description: 'Largest Contentful Paint' },
  fid: { name: 'FID', good: 100, poor: 300, unit: 'ms', description: 'First Input Delay' },
  cls: { name: 'CLS', good: 0.1, poor: 0.25, unit: '', description: 'Cumulative Layout Shift' },
  fcp: { name: 'FCP', good: 1800, poor: 3000, unit: 'ms', description: 'First Contentful Paint' },
  ttfb: { name: 'TTFB', good: 800, poor: 1800, unit: 'ms', description: 'Time to First Byte' },
};

export function AuditResultsCard({ audit, detailed = false }: AuditResultsCardProps) {
  const getMetricStatus = (
    metric: keyof typeof CORE_WEB_VITALS,
    value: number
  ): 'good' | 'warning' | 'poor' => {
    const thresholds = CORE_WEB_VITALS[metric];
    if (value <= thresholds.good) {
return 'good';
}
    if (value <= thresholds.poor) {
return 'warning';
}
    return 'poor';
  };

  const getStatusColor = (status: 'good' | 'warning' | 'poor') => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'poor':
        return 'text-red-600 bg-red-100';
    }
  };

  const getStatusIcon = (status: 'good' | 'warning' | 'poor') => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'poor':
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800">High Priority</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Low</Badge>;
    }
  };

  if (!detailed) {
    // Compact view
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <ScoreGauge score={audit.overall_score} size="sm" />
            <div className="flex-1">
              <h4 className="font-semibold">{audit.domain}</h4>
              <p className="text-sm text-muted-foreground">
                Audited {new Date(audit.created_at).toLocaleDateString()}
              </p>
              <div className="flex gap-2 mt-2">
                {audit.results?.performance && (
                  <Badge variant="outline" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    {audit.results.performance.score}%
                  </Badge>
                )}
                {audit.results?.seo !== undefined && (
                  <Badge variant="outline" className="text-xs">
                    <Search className="h-3 w-3 mr-1" />
                    {audit.results.seo}%
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Detailed view
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{audit.domain}</CardTitle>
            <CardDescription>
              Full SEO audit • {new Date(audit.created_at).toLocaleString()}
            </CardDescription>
          </div>
          <ScoreGauge score={audit.overall_score} size="md" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category Scores */}
        {audit.results && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {audit.results.performance && (
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Performance</span>
                </div>
                <p className="text-2xl font-bold">{audit.results.performance.score}%</p>
              </div>
            )}
            {audit.results.accessibility !== undefined && (
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Accessibility</span>
                </div>
                <p className="text-2xl font-bold">{audit.results.accessibility}%</p>
              </div>
            )}
            {audit.results.seo !== undefined && (
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Search className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">SEO</span>
                </div>
                <p className="text-2xl font-bold">{audit.results.seo}%</p>
              </div>
            )}
            {audit.results.bestPractices !== undefined && (
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Best Practices</span>
                </div>
                <p className="text-2xl font-bold">{audit.results.bestPractices}%</p>
              </div>
            )}
          </div>
        )}

        {/* Core Web Vitals */}
        {audit.results?.performance && (
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Gauge className="h-4 w-4" />
              Core Web Vitals
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['lcp', 'fid', 'cls'] as const).map((metric) => {
                const value = audit.results?.performance?.[metric];
                if (value === undefined) {
return null;
}

                const config = CORE_WEB_VITALS[metric];
                const status = getMetricStatus(metric, value);

                return (
                  <div key={metric} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{config.name}</span>
                      {getStatusIcon(status)}
                    </div>
                    <p className="text-2xl font-bold">
                      {metric === 'cls' ? value.toFixed(2) : `${value}${config.unit}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {config.description}
                    </p>
                    <div className="mt-2">
                      <Badge className={cn('text-xs', getStatusColor(status))}>
                        {status === 'good' ? 'Good' : status === 'warning' ? 'Needs Improvement' : 'Poor'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Mobile Friendliness */}
        {audit.results?.mobile && (
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Mobile Friendliness
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                {audit.results.mobile.isMobileFriendly ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="text-sm">Mobile Friendly</span>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                {audit.results.mobile.viewportConfigured ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="text-sm">Viewport OK</span>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                {audit.results.mobile.textReadable ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="text-sm">Text Readable</span>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                {audit.results.mobile.tapTargetsOk ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="text-sm">Tap Targets OK</span>
              </div>
            </div>
          </div>
        )}

        {/* Security */}
        {audit.results?.security && (
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </h4>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                {audit.results.security.hasHttps ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="text-sm">HTTPS</span>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                {!audit.results.security.hasMixedContent ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="text-sm">No Mixed Content</span>
              </div>
              {audit.results.security.securityHeaders.map((header) => (
                <Badge key={header} variant="outline" className="text-xs">
                  {header}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Crawlability */}
        {audit.results?.crawlability && (
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Link className="h-4 w-4" />
              Crawlability
            </h4>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                {audit.results.crawlability.hasRobotsTxt ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                )}
                <span className="text-sm">robots.txt</span>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                {audit.results.crawlability.hasSitemap ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                )}
                <span className="text-sm">Sitemap</span>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                {audit.results.crawlability.canonicalOk ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="text-sm">Canonical Tags</span>
              </div>
              {audit.results.crawlability.noIndexPages > 0 && (
                <Badge variant="outline" className="text-xs">
                  {audit.results.crawlability.noIndexPages} noindex pages
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {audit.recommendations && audit.recommendations.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Recommendations</h4>
            <div className="space-y-3">
              {audit.recommendations.map((rec, idx) => (
                <div key={idx} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{rec.title}</span>
                    {getPriorityBadge(rec.priority)}
                  </div>
                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                  <p className="text-xs text-blue-600 mt-2">Impact: {rec.impact}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
