'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Target,
  Plus,
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Bell,
  Search,
  FileText,
  ExternalLink,
  Sparkles,
  Shield,
  Zap,
} from 'lucide-react';
import { useSynthexTenant } from '@/hooks/useSynthexTenant';

interface Competitor {
  id: string;
  domain: string;
  company_name?: string;
  competitor_type: string;
  priority: string;
  threat_level: string;
  threat_score: number;
  keyword_count: number;
  domain_authority?: number;
  monthly_traffic_estimate?: number;
  last_analyzed_at?: string;
}

interface CompetitorAlert {
  id: string;
  competitor_id?: string;
  alert_type: string;
  severity: string;
  title: string;
  description?: string;
  keyword?: string;
  status: string;
  created_at: string;
}

interface KeywordGap {
  keyword: string;
  competitor_position: number;
  tenant_position?: number;
  gap_score: number;
  opportunity_type: string;
  search_volume: number;
}

interface CompetitorSummary {
  total_competitors: number;
  high_threat_count: number;
  new_alerts_count: number;
  threat_distribution: Record<string, number>;
}

const THREAT_COLORS: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  moderate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-green-500/20 text-green-400 border-green-500/30',
  minimal: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400',
  warning: 'bg-yellow-500/20 text-yellow-400',
  info: 'bg-blue-500/20 text-blue-400',
};

export default function CompetitorIntelligencePage() {
  const { tenantId, isLoading: tenantLoading } = useSynthexTenant();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [alerts, setAlerts] = useState<CompetitorAlert[]>([]);
  const [keywordGaps, setKeywordGaps] = useState<KeywordGap[]>([]);
  const [summary, setSummary] = useState<CompetitorSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [newDomain, setNewDomain] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newType, setNewType] = useState('direct');
  const [adding, setAdding] = useState(false);
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const [competitorsRes, summaryRes, alertsRes, gapsRes] = await Promise.all([
        fetch(`/api/synthex/competitors?tenantId=${tenantId}`),
        fetch(`/api/synthex/competitors?tenantId=${tenantId}&action=summary`),
        fetch(`/api/synthex/competitors/alerts?tenantId=${tenantId}&status=new&limit=10`),
        fetch(`/api/synthex/competitors/serp?tenantId=${tenantId}&action=gaps`),
      ]);

      if (competitorsRes.ok) {
        const data = await competitorsRes.json();
        setCompetitors(data.competitors || []);
      }

      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data.summary || null);
      }

      if (alertsRes.ok) {
        const data = await alertsRes.json();
        setAlerts(data.alerts || []);
      }

      if (gapsRes.ok) {
        const data = await gapsRes.json();
        setKeywordGaps(data.gaps || []);
      }
    } catch (error) {
      console.error('Error fetching competitor data:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddCompetitor = async () => {
    if (!tenantId || !newDomain.trim()) return;
    setAdding(true);
    try {
      const res = await fetch('/api/synthex/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          domain: newDomain.trim(),
          company_name: newCompanyName.trim() || undefined,
          competitor_type: newType,
        }),
      });

      if (res.ok) {
        setNewDomain('');
        setNewCompanyName('');
        fetchData();
      }
    } catch (error) {
      console.error('Error adding competitor:', error);
    } finally {
      setAdding(false);
    }
  };

  const handleGenerateReport = async (competitorId: string) => {
    if (!tenantId) return;
    setGeneratingReport(competitorId);
    try {
      const res = await fetch('/api/synthex/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          action: 'generate_report',
          competitor_id: competitorId,
        }),
      });

      if (res.ok) {
        fetchData(); // Refresh to update threat scores
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGeneratingReport(null);
    }
  };

  if (tenantLoading || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-accent-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Target className="h-7 w-7 text-accent-500" />
            Competitor Intelligence
          </h1>
          <p className="text-text-secondary mt-1">
            AI-powered competitive analysis, SERP tracking, and market radar
          </p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-bg-card border-border-default">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Target className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Competitors</p>
                <p className="text-2xl font-bold text-text-primary">
                  {summary?.total_competitors || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-bg-card border-border-default">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">High Threat</p>
                <p className="text-2xl font-bold text-text-primary">
                  {summary?.high_threat_count || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-bg-card border-border-default">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Bell className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">New Alerts</p>
                <p className="text-2xl font-bold text-text-primary">
                  {summary?.new_alerts_count || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-bg-card border-border-default">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Zap className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Opportunities</p>
                <p className="text-2xl font-bold text-text-primary">
                  {keywordGaps.filter((g) => g.opportunity_type === 'new').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="competitors" className="space-y-4">
        <TabsList className="bg-bg-surface">
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts
            {alerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {alerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="opportunities">Keyword Gaps</TabsTrigger>
          <TabsTrigger value="add">Add Competitor</TabsTrigger>
        </TabsList>

        <TabsContent value="competitors" className="space-y-4">
          {competitors.length === 0 ? (
            <Card className="bg-bg-card border-border-default">
              <CardContent className="py-12 text-center">
                <Target className="h-12 w-12 mx-auto text-text-secondary mb-4" />
                <p className="text-text-secondary mb-4">
                  No competitors tracked yet. Add your first competitor to start monitoring.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {competitors.map((competitor) => (
                <Card key={competitor.id} className="bg-bg-card border-border-default">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-bg-surface flex items-center justify-center">
                          <Shield className="h-6 w-6 text-text-secondary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-text-primary">
                              {competitor.company_name || competitor.domain}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {competitor.competitor_type}
                            </Badge>
                          </div>
                          <p className="text-sm text-text-secondary flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            {competitor.domain}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-xs text-text-secondary">Keywords</p>
                          <p className="font-medium text-text-primary">{competitor.keyword_count}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-text-secondary">DA</p>
                          <p className="font-medium text-text-primary">
                            {competitor.domain_authority || '-'}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-text-secondary">Threat</p>
                          <Badge className={THREAT_COLORS[competitor.threat_level]}>
                            {competitor.threat_score}%
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateReport(competitor.id)}
                          disabled={generatingReport === competitor.id}
                        >
                          {generatingReport === competitor.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-1" />
                              Analyze
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card className="bg-bg-card border-border-default">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-accent-500" />
                Recent Alerts
              </CardTitle>
              <CardDescription>
                Automated notifications about competitor movements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 mx-auto text-text-secondary mb-4" />
                  <p className="text-text-secondary">No new alerts</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-bg-surface"
                    >
                      <div className={`p-2 rounded-lg ${SEVERITY_COLORS[alert.severity]}`}>
                        {alert.alert_type.includes('spike') ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : alert.alert_type.includes('drop') ? (
                          <TrendingDown className="h-4 w-4" />
                        ) : (
                          <AlertTriangle className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-text-primary">{alert.title}</p>
                        {alert.description && (
                          <p className="text-sm text-text-secondary">{alert.description}</p>
                        )}
                        <p className="text-xs text-text-secondary mt-1">
                          {new Date(alert.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline">{alert.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          <Card className="bg-bg-card border-border-default">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-accent-500" />
                Keyword Gap Analysis
              </CardTitle>
              <CardDescription>
                Keywords your competitors rank for that you could target
              </CardDescription>
            </CardHeader>
            <CardContent>
              {keywordGaps.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 mx-auto text-text-secondary mb-4" />
                  <p className="text-text-secondary">
                    No keyword gaps found. Add competitors and run analysis.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {keywordGaps.slice(0, 10).map((gap, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-bg-surface"
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className={
                            gap.opportunity_type === 'new'
                              ? 'bg-green-500/20 text-green-400'
                              : gap.opportunity_type === 'improve'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }
                        >
                          {gap.opportunity_type}
                        </Badge>
                        <span className="font-medium text-text-primary">{gap.keyword}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-text-secondary">Competitor</p>
                          <p className="text-sm font-medium text-text-primary">
                            #{gap.competitor_position}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-text-secondary">You</p>
                          <p className="text-sm font-medium text-text-primary">
                            {gap.tenant_position ? `#${gap.tenant_position}` : '-'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-text-secondary">Volume</p>
                          <p className="text-sm font-medium text-text-primary">
                            {gap.search_volume.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-text-secondary">Gap Score</p>
                          <Badge variant="outline">{gap.gap_score.toFixed(0)}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add" className="space-y-4">
          <Card className="bg-bg-card border-border-default">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-accent-500" />
                Add Competitor
              </CardTitle>
              <CardDescription>
                Start monitoring a new competitor&apos;s SEO performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-text-secondary mb-2 block">Domain *</label>
                  <Input
                    placeholder="competitor.com"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    className="bg-bg-surface border-border-default"
                  />
                </div>
                <div>
                  <label className="text-sm text-text-secondary mb-2 block">Company Name</label>
                  <Input
                    placeholder="Competitor Inc."
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    className="bg-bg-surface border-border-default"
                  />
                </div>
                <div>
                  <label className="text-sm text-text-secondary mb-2 block">Type</label>
                  <Select value={newType} onValueChange={setNewType}>
                    <SelectTrigger className="bg-bg-surface border-border-default">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct">Direct Competitor</SelectItem>
                      <SelectItem value="indirect">Indirect Competitor</SelectItem>
                      <SelectItem value="aspirational">Aspirational</SelectItem>
                      <SelectItem value="emerging">Emerging</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={handleAddCompetitor}
                disabled={adding || !newDomain.trim()}
                className="w-full md:w-auto"
              >
                {adding ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add Competitor
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
