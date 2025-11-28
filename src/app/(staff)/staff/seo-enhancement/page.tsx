'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  FileText,
  Code,
  MousePointerClick,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface AuditSummary {
  id: string;
  domain: string;
  overall_score: number;
  status: string;
  created_at: string;
}

interface CTROpportunity {
  url: string;
  keyword: string;
  opportunity_level: string;
  estimated_click_gain: number;
}

export default function SEOEnhancementPage() {
  const { currentOrganization, session } = useAuth();
  const workspaceId = currentOrganization?.org_id;

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [auditUrl, setAuditUrl] = useState('');
  const [audits, setAudits] = useState<AuditSummary[]>([]);
  const [ctrOpportunities, setCtrOpportunities] = useState<CTROpportunity[]>([]);

  useEffect(() => {
    if (workspaceId) {
      fetchAudits();
      fetchCTROpportunities();
    }
  }, [workspaceId]);

  const fetchAudits = async () => {
    try {
      const response = await fetch(
        `/api/seo-enhancement/audit?workspaceId=${workspaceId}&limit=5`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );
      const data = await response.json();
      if (data.audits) {
        setAudits(data.audits);
      }
    } catch (error) {
      console.error('Failed to fetch audits:', error);
    }
  };

  const fetchCTROpportunities = async () => {
    try {
      const response = await fetch(
        `/api/seo-enhancement/ctr?workspaceId=${workspaceId}&type=benchmarks&opportunityLevel=high&limit=5`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );
      const data = await response.json();
      if (data.benchmarks) {
        setCtrOpportunities(data.benchmarks);
      }
    } catch (error) {
      console.error('Failed to fetch CTR opportunities:', error);
    }
  };

  const runAudit = async () => {
    if (!auditUrl || !workspaceId) return;

    setLoading(true);
    try {
      const response = await fetch('/api/seo-enhancement/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          workspaceId,
          url: auditUrl,
          auditType: 'full',
        }),
      });

      const data = await response.json();
      if (data.job) {
        setAuditUrl('');
        fetchAudits();
      }
    } catch (error) {
      console.error('Failed to start audit:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800">Good</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Needs Work</Badge>;
    return <Badge className="bg-red-100 text-red-800">Poor</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">SEO Enhancement Suite</h1>
          <p className="text-muted-foreground mt-1">
            Legitimate tools to improve search rankings sustainably
          </p>
        </div>
        <Button onClick={() => { fetchAudits(); fetchCTROpportunities(); }}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Search className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Technical Audits</p>
                <p className="text-2xl font-bold">{audits.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Content Analyses</p>
                <p className="text-2xl font-bold">--</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Code className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Schema Generated</p>
                <p className="text-2xl font-bold">--</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <MousePointerClick className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">CTR Opportunities</p>
                <p className="text-2xl font-bold">{ctrOpportunities.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-indigo-500" />
              <div>
                <p className="text-sm text-muted-foreground">Competitors Tracked</p>
                <p className="text-2xl font-bold">--</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Audit Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Quick SEO Audit
          </CardTitle>
          <CardDescription>
            Enter a URL to run a comprehensive technical SEO audit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="https://example.com"
              value={auditUrl}
              onChange={(e) => setAuditUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={runAudit} disabled={loading || !auditUrl}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Run Audit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="audits">Technical Audits</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="ctr">CTR Optimization</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Audits */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Audits</CardTitle>
                <CardDescription>Latest technical SEO audit results</CardDescription>
              </CardHeader>
              <CardContent>
                {audits.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No audits yet. Run your first audit above.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {audits.map((audit) => (
                      <div
                        key={audit.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {audit.status === 'completed' ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : audit.status === 'running' ? (
                            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          )}
                          <div>
                            <p className="font-medium">{audit.domain}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(audit.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {audit.status === 'completed' && audit.overall_score !== undefined && (
                            <span className={`text-2xl font-bold ${getScoreColor(audit.overall_score)}`}>
                              {audit.overall_score}
                            </span>
                          )}
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CTR Opportunities */}
            <Card>
              <CardHeader>
                <CardTitle>High CTR Opportunities</CardTitle>
                <CardDescription>Pages with potential for more clicks</CardDescription>
              </CardHeader>
              <CardContent>
                {ctrOpportunities.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No CTR opportunities found yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {ctrOpportunities.map((opp, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium truncate max-w-[200px]">{opp.keyword}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {opp.url}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-orange-100 text-orange-800">
                            +{opp.estimated_click_gain} clicks
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('audits')}>
              <CardContent className="pt-6">
                <Search className="h-12 w-12 text-blue-500 mb-4" />
                <h3 className="font-semibold text-lg mb-2">Technical SEO Audit</h3>
                <p className="text-sm text-muted-foreground">
                  Core Web Vitals, crawlability, mobile-friendliness, and security analysis
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('content')}>
              <CardContent className="pt-6">
                <FileText className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="font-semibold text-lg mb-2">Content Optimization</h3>
                <p className="text-sm text-muted-foreground">
                  Keyword analysis, readability scores, and search intent alignment
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('ctr')}>
              <CardContent className="pt-6">
                <TrendingUp className="h-12 w-12 text-orange-500 mb-4" />
                <h3 className="font-semibold text-lg mb-2">CTR Optimization</h3>
                <p className="text-sm text-muted-foreground">
                  Title/meta A/B testing, benchmark analysis, and click-through improvements
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audits">
          <Card>
            <CardHeader>
              <CardTitle>Technical SEO Audits</CardTitle>
              <CardDescription>
                Comprehensive technical analysis of your websites
              </CardDescription>
            </CardHeader>
            <CardContent>
              {audits.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No audits yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Run your first technical SEO audit to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {audits.map((audit) => (
                    <div key={audit.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`text-3xl font-bold ${getScoreColor(audit.overall_score || 0)}`}>
                            {audit.overall_score || '--'}
                          </div>
                          <div>
                            <h4 className="font-semibold">{audit.domain}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(audit.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getScoreBadge(audit.overall_score || 0)}
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Content Optimization</CardTitle>
              <CardDescription>
                Analyze and optimize your content for better rankings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Content Analysis</h3>
                <p className="text-muted-foreground mb-4">
                  Enter a URL and target keyword to analyze content optimization opportunities
                </p>
                <Button>Analyze Content</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ctr">
          <Card>
            <CardHeader>
              <CardTitle>CTR Optimization</CardTitle>
              <CardDescription>
                Improve click-through rates with title and meta description testing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ctrOpportunities.length === 0 ? (
                  <div className="text-center py-12">
                    <MousePointerClick className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No CTR Data Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Connect Google Search Console to analyze CTR opportunities
                    </p>
                  </div>
                ) : (
                  ctrOpportunities.map((opp, idx) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{opp.keyword}</h4>
                          <p className="text-sm text-muted-foreground">{opp.url}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={`${
                            opp.opportunity_level === 'high'
                              ? 'bg-red-100 text-red-800'
                              : opp.opportunity_level === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {opp.opportunity_level} opportunity
                          </Badge>
                          <p className="text-sm mt-1">
                            Est. +{opp.estimated_click_gain} clicks/month
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitors">
          <Card>
            <CardHeader>
              <CardTitle>Competitor Gap Analysis</CardTitle>
              <CardDescription>
                Find keyword, content, and backlink gaps vs competitors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Add Competitors</h3>
                <p className="text-muted-foreground mb-4">
                  Track competitors to discover keyword and content opportunities
                </p>
                <Button>Add Competitor</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
