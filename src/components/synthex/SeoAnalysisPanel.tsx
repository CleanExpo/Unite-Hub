'use client';

/**
 * SEO Analysis Panel
 *
 * Manage SEO intelligence analysis for Synthex tenants
 * - Keyword research
 * - Competitor analysis
 * - SEO audits
 * - Content optimization recommendations
 * - Keyword gap analysis
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Search,
  TrendingUp,
  AlertCircle,
  Loader2,
  Target,
  BarChart3,
  Zap,
  CheckCircle,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface SeoAnalysis {
  id: string;
  domain: string;
  analysisType: string;
  result: {
    score?: number;
    keywordData?: Array<{ keyword: string; searchVolume: number }>;
    competitorAnalysis?: Array<{ domain: string; authority: number }>;
    recommendations: string[];
    estimatedPotential: {
      trafficGrowth: number;
      keywordOpportunities: number;
      backLinkPotential: number;
    };
  };
  created_at: string;
}

interface AnalysisForm {
  domain: string;
  keyword: string;
  competitors: string;
  analysisType: 'keyword_research' | 'competitor_analysis' | 'audit' | 'optimization' | 'comprehensive';
}

// ============================================================================
// COMPONENT
// ============================================================================

interface SeoAnalysisPanelProps {
  tenantId: string;
  planCode: string;
}

export default function SeoAnalysisPanel({ tenantId, planCode }: SeoAnalysisPanelProps) {
  // State
  const [analyses, setAnalyses] = useState<SeoAnalysis[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<SeoAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<AnalysisForm>({
    domain: '',
    keyword: '',
    competitors: '',
    analysisType: 'comprehensive',
  });

  // Fetch analyses on mount
  useEffect(() => {
    fetchAnalyses();
  }, [tenantId]);

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/synthex/seo/analyses?tenantId=${tenantId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) {
        console.error('Failed to fetch analyses');
        return;
      }

      const { analyses: analysesData } = await response.json();
      setAnalyses(analysesData || []);
    } catch (err) {
      console.error('Error fetching analyses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    try {
      if (!formData.domain) {
        setError('Please enter a domain');
        return;
      }

      setAnalyzing(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const competitors = formData.competitors
        .split(',')
        .map((c) => c.trim())
        .filter((c) => c);

      const response = await fetch('/api/synthex/seo/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          tenantId,
          domain: formData.domain,
          keyword: formData.keyword || undefined,
          competitors,
          analysisType: formData.analysisType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze SEO');
      }

      const { analysis } = await response.json();

      // Add to list
      const newAnalysis: SeoAnalysis = {
        id: `analysis-${Date.now()}`,
        domain: analysis.domain,
        analysisType: analysis.analysisType,
        result: analysis,
        created_at: analysis.timestamp,
      };

      setAnalyses([newAnalysis, ...analyses]);
      setCurrentAnalysis(newAnalysis);

      // Reset form
      setFormData({
        domain: '',
        keyword: '',
        competitors: '',
        analysisType: 'comprehensive',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getGrowthColor = (value: number) => {
    if (value > 100) return 'text-green-600';
    if (value > 50) return 'text-yellow-600';
    return 'text-blue-600';
  };

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="analyze" className="space-y-4">
        <TabsList className="bg-slate-200 w-full">
          <TabsTrigger value="analyze" className="flex-1 gap-2">
            <Search size={16} />
            New Analysis
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 gap-2">
            <BarChart3 size={16} />
            History ({analyses.length})
          </TabsTrigger>
        </TabsList>

        {/* New Analysis Tab */}
        <TabsContent value="analyze" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SEO Intelligence Analysis</CardTitle>
              <CardDescription>
                Analyze domain rankings, keywords, competitors, and optimization opportunities
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Domain Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Domain</label>
                <input
                  type="text"
                  placeholder="example.com"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Keyword Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Primary Keyword (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., digital marketing services"
                  value={formData.keyword}
                  onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Competitors Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Competitor Domains (comma-separated, optional)
                </label>
                <textarea
                  placeholder="competitor1.com, competitor2.com, competitor3.com"
                  value={formData.competitors}
                  onChange={(e) => setFormData({ ...formData, competitors: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Analysis Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Analysis Type</label>
                <select
                  value={formData.analysisType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      analysisType: e.target.value as AnalysisForm['analysisType'],
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="comprehensive">Comprehensive (All analyses)</option>
                  <option value="keyword_research">Keyword Research</option>
                  <option value="competitor_analysis">Competitor Analysis</option>
                  <option value="audit">SEO Audit</option>
                  <option value="optimization">Content Optimization</option>
                </select>
              </div>

              {/* Analyze Button */}
              <Button
                onClick={handleAnalyze}
                disabled={analyzing || !formData.domain}
                className="w-full gap-2"
              >
                {analyzing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Start Analysis
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : analyses.length > 0 ? (
            <div className="space-y-3">
              {analyses.map((analysis) => (
                <Card
                  key={analysis.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setCurrentAnalysis(analysis)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900">{analysis.domain}</div>
                        <div className="text-sm text-slate-600 mt-1">
                          {analysis.analysisType.replace(/_/g, ' ')} •{' '}
                          {new Date(analysis.created_at).toLocaleDateString()}
                        </div>

                        {/* Key Metrics */}
                        <div className="mt-3 grid grid-cols-3 gap-3">
                          {analysis.result.score !== undefined && (
                            <div>
                              <div className="text-xs text-slate-600">SEO Score</div>
                              <div
                                className={`text-lg font-bold ${getScoreBadgeColor(
                                  analysis.result.score
                                )}`}
                              >
                                {analysis.result.score}
                              </div>
                            </div>
                          )}

                          <div>
                            <div className="text-xs text-slate-600">Traffic Growth</div>
                            <div
                              className={`text-lg font-bold ${getGrowthColor(
                                analysis.result.estimatedPotential.trafficGrowth
                              )}`}
                            >
                              +{analysis.result.estimatedPotential.trafficGrowth}%
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-slate-600">Opportunities</div>
                            <div className="text-lg font-bold text-blue-600">
                              {Math.round(
                                analysis.result.estimatedPotential.keywordOpportunities / 100
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Recommendations Preview */}
                        {analysis.result.recommendations.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="text-xs font-semibold text-slate-600 mb-2">
                              Top Recommendations:
                            </div>
                            <ul className="space-y-1">
                              {analysis.result.recommendations.slice(0, 2).map((rec, idx) => (
                                <li key={idx} className="text-sm text-slate-700 flex gap-2">
                                  <CheckCircle size={14} className="text-green-600 flex-shrink-0 mt-0.5" />
                                  {rec}
                                </li>
                              ))}
                            </ul>
                            {analysis.result.recommendations.length > 2 && (
                              <div className="text-xs text-slate-600 mt-2">
                                +{analysis.result.recommendations.length - 2} more recommendations
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <Badge
                        className={`ml-4 flex-shrink-0 ${getScoreBadgeColor(
                          analysis.result.score || 50
                        )}`}
                      >
                        {analysis.result.score ? 'Analyzed' : 'Complete'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Target size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No analyses yet</h3>
                <p className="text-slate-600">Start analyzing your domain to get SEO insights</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Current Analysis Details */}
      {currentAnalysis && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-blue-900">{currentAnalysis.domain}</CardTitle>
                <CardDescription className="text-blue-700">
                  {currentAnalysis.analysisType.replace(/_/g, ' ')} • Last updated{' '}
                  {new Date(currentAnalysis.created_at).toLocaleDateString()}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentAnalysis(null)}
              >
                ✕
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Score Card */}
            {currentAnalysis.result.score !== undefined && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="text-sm text-slate-600 font-medium">SEO Health Score</div>
                      <div className="text-4xl font-bold text-slate-900 mt-2">
                        {currentAnalysis.result.score}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">out of 100</div>
                    </div>
                    <Progress
                      value={currentAnalysis.result.score}
                      className="flex-1 h-3"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Growth Potential */}
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <TrendingUp size={24} className="mx-auto text-green-600 mb-2" />
                    <div className="text-sm text-slate-600">Traffic Growth</div>
                    <div className="text-2xl font-bold text-slate-900 mt-1">
                      +{currentAnalysis.result.estimatedPotential.trafficGrowth}%
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Search size={24} className="mx-auto text-blue-600 mb-2" />
                    <div className="text-sm text-slate-600">Opportunities</div>
                    <div className="text-2xl font-bold text-slate-900 mt-1">
                      {Math.round(
                        currentAnalysis.result.estimatedPotential.keywordOpportunities / 100
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <BarChart3 size={24} className="mx-auto text-purple-600 mb-2" />
                    <div className="text-sm text-slate-600">Backlink Potential</div>
                    <div className="text-2xl font-bold text-slate-900 mt-1">
                      {Math.round(
                        currentAnalysis.result.estimatedPotential.backLinkPotential / 100
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recommendations */}
            {currentAnalysis.result.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {currentAnalysis.result.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex gap-3 text-sm">
                        <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
