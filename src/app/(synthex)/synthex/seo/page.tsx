'use client';

/**
 * Synthex SEO Reports
 *
 * SEO analysis and reporting:
 * - Run SEO audits via Claude Sonnet
 * - View SEO score with breakdown
 * - See issues and recommendations
 * - Browse audit history
 *
 * IMPLEMENTED[PHASE_B2]: SEO analysis API integration
 * IMPLEMENTED[PHASE_B2]: On-demand audit trigger
 * TODO[PHASE_B4]: Add scheduled audit configuration
 *
 * Backlog: SYNTHEX-004
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Search,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  RefreshCw,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface SeoIssue {
  category: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  impact?: string;
}

interface SeoRecommendation {
  action: string;
  impact: 'high' | 'medium' | 'low';
  priority: number;
  effort?: string;
}

interface SeoReport {
  id: string;
  tenant_id: string;
  brand_id: string | null;
  user_id: string | null;
  created_at: string;
  target_url: string;
  keywords: string[] | null;
  competitors: string[] | null;
  score: number | null;
  issues: SeoIssue[] | null;
  recommendations: SeoRecommendation[] | null;
  meta: {
    summary?: string;
    duration_ms?: number;
    [key: string]: unknown;
  } | null;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'text-red-400 bg-red-500/10 border-red-500/20';
    case 'warning':
      return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    case 'info':
      return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    default:
      return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
  }
}

function getImpactColor(impact: string): string {
  switch (impact) {
    case 'high':
      return 'text-green-400';
    case 'medium':
      return 'text-amber-400';
    case 'low':
      return 'text-gray-400';
    default:
      return 'text-gray-400';
  }
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-amber-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================================================
// Component
// ============================================================================

export default function SynthexSeoPage() {
  // Form state
  const [targetUrl, setTargetUrl] = useState('');
  const [keywords, setKeywords] = useState('');
  const [competitors, setCompetitors] = useState('');
  const [tenantId, setTenantId] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentReport, setCurrentReport] = useState<SeoReport | null>(null);
  const [reports, setReports] = useState<SeoReport[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  // Load tenant ID from URL or localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTenantId = params.get('tenantId');
    if (urlTenantId) {
      setTenantId(urlTenantId);
    } else {
      // Try localStorage fallback
      const savedTenantId = localStorage.getItem('synthex_tenant_id');
      if (savedTenantId) {
        setTenantId(savedTenantId);
      }
    }
  }, []);

  // Load history when tenantId changes
  const loadHistory = useCallback(async () => {
    if (!tenantId) return;

    setIsLoadingHistory(true);
    try {
      const res = await fetch(`/api/synthex/seo/reports?tenantId=${tenantId}&limit=20`);
      const data = await res.json();

      if (!res.ok) {
        console.error('Failed to load history:', data.error);
        return;
      }

      setReports(data.reports || []);
      if (data.reports?.length > 0 && !currentReport) {
        setCurrentReport(data.reports[0]);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [tenantId, currentReport]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Run SEO analysis
  const handleRunAnalysis = async () => {
    if (!tenantId) {
      setError('Please enter a Tenant ID');
      return;
    }
    if (!targetUrl) {
      setError('Please enter a URL to analyze');
      return;
    }

    // Validate URL
    try {
      new URL(targetUrl);
    } catch {
      setError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const keywordsArray = keywords
        .split(',')
        .map((k) => k.trim())
        .filter((k) => k.length > 0);
      const competitorsArray = competitors
        .split(',')
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      const res = await fetch('/api/synthex/seo/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          targetUrl,
          keywords: keywordsArray,
          competitors: competitorsArray,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to run SEO analysis');
      }

      setCurrentReport(data.report);
      setReports((prev) => [data.report, ...prev]);

      // Save tenantId for future use
      localStorage.setItem('synthex_tenant_id', tenantId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Count issues by severity
  const issuesByCategory = currentReport?.issues?.reduce(
    (acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  ) || {};

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">SEO Reports</h1>
          <p className="text-gray-400 mt-2">
            AI-powered SEO analysis for your website
          </p>
        </div>
      </div>

      {/* Analysis Form */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-100 flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-400" />
            Run SEO Analysis
          </CardTitle>
          <CardDescription className="text-gray-400">
            Analyze your website with Claude AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Tenant ID *</Label>
              <Input
                placeholder="Your tenant UUID"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="bg-gray-800 border-gray-700 text-gray-100"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Target URL *</Label>
              <Input
                placeholder="https://yourwebsite.com"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="bg-gray-800 border-gray-700 text-gray-100"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Keywords (comma-separated)</Label>
              <Input
                placeholder="seo, marketing, local business"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="bg-gray-800 border-gray-700 text-gray-100"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Competitors (comma-separated)</Label>
              <Input
                placeholder="competitor1.com, competitor2.com"
                value={competitors}
                onChange={(e) => setCompetitors(e.target.value)}
                className="bg-gray-800 border-gray-700 text-gray-100"
              />
            </div>
          </div>

          {error && (
            <Alert className="bg-red-900/20 border-red-800">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleRunAnalysis}
            disabled={isLoading || !tenantId || !targetUrl}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Run SEO Audit
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Current Report Score */}
      {currentReport && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-800/50 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-gray-100">Overall SEO Score</CardTitle>
              <CardDescription className="text-gray-400">
                {formatDate(currentReport.created_at)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <div className={`text-6xl font-bold ${getScoreColor(currentReport.score || 0)}`}>
                  {currentReport.score?.toFixed(0) || '--'}
                </div>
                <p className="text-gray-400 mt-2">out of 100</p>
                <a
                  href={currentReport.target_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-400 hover:underline mt-2"
                >
                  {new URL(currentReport.target_url).hostname}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-gray-100">Score Breakdown</CardTitle>
              <CardDescription className="text-gray-400">
                Issues found by category
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                  <p className="text-3xl font-bold text-red-400">{issuesByCategory.critical || 0}</p>
                  <p className="text-sm text-gray-400">Critical</p>
                </div>
                <div className="text-center p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <p className="text-3xl font-bold text-amber-400">{issuesByCategory.warning || 0}</p>
                  <p className="text-sm text-gray-400">Warnings</p>
                </div>
                <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="text-3xl font-bold text-blue-400">{issuesByCategory.info || 0}</p>
                  <p className="text-sm text-gray-400">Info</p>
                </div>
              </div>
              {currentReport.meta?.summary && (
                <p className="text-gray-300 text-sm bg-gray-800/50 p-3 rounded-lg">
                  {currentReport.meta.summary}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="issues" className="space-y-6">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="issues" className="data-[state=active]:bg-gray-700">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Issues ({currentReport?.issues?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="data-[state=active]:bg-gray-700">
            <CheckCircle className="h-4 w-4 mr-2" />
            Recommendations ({currentReport?.recommendations?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-gray-700">
            <Clock className="h-4 w-4 mr-2" />
            History ({reports.length})
          </TabsTrigger>
        </TabsList>

        {/* Issues Tab */}
        <TabsContent value="issues" className="space-y-4">
          {currentReport?.issues && currentReport.issues.length > 0 ? (
            currentReport.issues.map((issue, idx) => (
              <Card key={idx} className={`border ${getSeverityColor(issue.severity)}`}>
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <Badge
                      variant="outline"
                      className={getSeverityColor(issue.severity)}
                    >
                      {issue.severity}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-gray-100 font-medium">{issue.description}</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Category: {issue.category}
                        {issue.impact && ` • ${issue.impact}`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="py-16 text-center">
                <AlertTriangle className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500">No issues found</p>
                <p className="text-sm text-gray-600 mt-2">Run an audit to check for SEO issues</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          {currentReport?.recommendations && currentReport.recommendations.length > 0 ? (
            currentReport.recommendations
              .sort((a, b) => a.priority - b.priority)
              .map((rec, idx) => (
                <Card key={idx} className="bg-gray-900 border-gray-800">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 text-gray-300 font-bold text-sm">
                        {rec.priority}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-100">{rec.action}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className={`text-sm ${getImpactColor(rec.impact)}`}>
                            {rec.impact} impact
                          </span>
                          {rec.effort && (
                            <span className="text-sm text-gray-500">
                              • {rec.effort} effort
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          ) : (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="py-16 text-center">
                <Search className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500">No recommendations yet</p>
                <p className="text-sm text-gray-600 mt-2">
                  Run an SEO audit to get personalized recommendations
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          {isLoadingHistory ? (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="py-16 text-center">
                <Loader2 className="h-8 w-8 text-gray-500 mx-auto mb-4 animate-spin" />
                <p className="text-gray-500">Loading history...</p>
              </CardContent>
            </Card>
          ) : reports.length > 0 ? (
            reports.map((report) => (
              <Card
                key={report.id}
                className={`bg-gray-900 border-gray-800 cursor-pointer transition-colors ${
                  currentReport?.id === report.id ? 'border-blue-500/50' : 'hover:border-gray-700'
                }`}
                onClick={() => setCurrentReport(report)}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`text-2xl font-bold ${getScoreColor(report.score || 0)}`}>
                        {report.score?.toFixed(0) || '--'}
                      </div>
                      <div>
                        <p className="text-gray-100 font-medium">
                          {new URL(report.target_url).hostname}
                        </p>
                        <p className="text-sm text-gray-500">{formatDate(report.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-gray-700 text-gray-400">
                        {report.issues?.length || 0} issues
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedReportId(expandedReportId === report.id ? null : report.id);
                        }}
                      >
                        {expandedReportId === report.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {expandedReportId === report.id && (
                    <div className="mt-4 pt-4 border-t border-gray-800">
                      <p className="text-sm text-gray-400 mb-2">
                        Keywords: {report.keywords?.join(', ') || 'None'}
                      </p>
                      {report.meta?.summary && (
                        <p className="text-sm text-gray-300">{report.meta.summary}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="py-16 text-center">
                <Clock className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500">No audit history</p>
                <p className="text-sm text-gray-600 mt-2">
                  Run your first SEO audit to start tracking history
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
