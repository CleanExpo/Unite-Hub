'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Loader2,
  Users,
  Plus,
  Trash2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Globe,
} from 'lucide-react';

interface CompetitorTrackerProps {
  workspaceId: string;
  clientDomain: string;
  accessToken: string;
  onCompetitorAdded?: (competitor: Competitor) => void;
  onAnalysisComplete?: (analysis: GapAnalysis) => void;
}

interface Competitor {
  id: string;
  domain: string;
  name?: string;
  addedAt: string;
}

interface GapAnalysis {
  keywordGap?: KeywordGapItem[];
  contentGap?: ContentGapItem[];
  backlinkGap?: BacklinkGapItem[];
}

interface KeywordGapItem {
  keyword: string;
  competitorPosition: number;
  clientPosition: number | null;
  searchVolume: number;
  difficulty: number;
  opportunity: 'high' | 'medium' | 'low';
}

interface ContentGapItem {
  topic: string;
  competitorUrls: string[];
  searchIntent: string;
  estimatedTraffic: number;
  priority: 'high' | 'medium' | 'low';
}

interface BacklinkGapItem {
  domain: string;
  competitorBacklinks: number;
  clientBacklinks: number;
  domainAuthority: number;
  opportunity: boolean;
}

export function CompetitorTracker({
  workspaceId,
  clientDomain,
  accessToken,
  onCompetitorAdded,
  onAnalysisComplete,
}: CompetitorTrackerProps) {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysis | null>(null);

  useEffect(() => {
    fetchCompetitors();
  }, [workspaceId, clientDomain]);

  const fetchCompetitors = async () => {
    try {
      const response = await fetch(
        `/api/seo-enhancement/competitors?workspaceId=${workspaceId}&clientDomain=${clientDomain}&type=competitors`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const data = await response.json();
      if (data.competitors) {
        setCompetitors(data.competitors);
      }
    } catch (err) {
      console.error('Failed to fetch competitors:', err);
    }
  };

  const addCompetitor = async () => {
    if (!newDomain) {
return;
}

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/seo-enhancement/competitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          workspaceId,
          clientDomain,
          action: 'addCompetitor',
          competitorDomain: newDomain,
          competitorName: newName || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add competitor');
      }

      const competitor: Competitor = {
        id: data.competitor?.id,
        domain: newDomain,
        name: newName || undefined,
        addedAt: new Date().toISOString(),
      };

      setCompetitors([...competitors, competitor]);
      onCompetitorAdded?.(competitor);
      setNewDomain('');
      setNewName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const runGapAnalysis = async (type: 'keywords' | 'content' | 'backlinks' | 'all') => {
    if (competitors.length === 0) {
      setError('Add at least one competitor first');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const actionMap = {
        keywords: 'analyzeKeywords',
        content: 'analyzeContent',
        backlinks: 'analyzeBacklinks',
        all: 'analyzeAll',
      };

      const response = await fetch('/api/seo-enhancement/competitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          workspaceId,
          clientDomain,
          action: actionMap[type],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to run analysis');
      }

      const analysis: GapAnalysis = {
        keywordGap: data.keywordGap?.gap_keywords || data.analysis?.gap_keywords,
        contentGap: data.contentGap?.gap_topics || data.analysis?.gap_topics,
        backlinkGap: data.backlinkGap?.gap_domains || data.analysis?.gap_domains,
      };

      setGapAnalysis(analysis);
      onAnalysisComplete?.(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setAnalyzing(false);
    }
  };

  const getOpportunityBadge = (level: string) => {
    switch (level) {
      case 'high':
        return <Badge className="bg-green-100 text-green-800">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Low</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Competitor Tracker
        </CardTitle>
        <CardDescription>
          Track competitors and discover keyword, content, and backlink opportunities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Competitor */}
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium">Add Competitor</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="competitorDomain">Domain</Label>
              <Input
                id="competitorDomain"
                placeholder="competitor.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="competitorName">Name (Optional)</Label>
              <Input
                id="competitorName"
                placeholder="Competitor Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={addCompetitor}
                disabled={loading || !newDomain}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add
              </Button>
            </div>
          </div>
        </div>

        {/* Competitor List */}
        {competitors.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Tracked Competitors ({competitors.length})</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => runGapAnalysis('all')}
                disabled={analyzing}
              >
                {analyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                Run Full Analysis
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {competitors.map((competitor) => (
                <div
                  key={competitor.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{competitor.name || competitor.domain}</p>
                      <p className="text-xs text-muted-foreground">{competitor.domain}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analysis Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            onClick={() => runGapAnalysis('keywords')}
            disabled={analyzing || competitors.length === 0}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Keyword Gap
          </Button>
          <Button
            variant="outline"
            onClick={() => runGapAnalysis('content')}
            disabled={analyzing || competitors.length === 0}
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Content Gap
          </Button>
          <Button
            variant="outline"
            onClick={() => runGapAnalysis('backlinks')}
            disabled={analyzing || competitors.length === 0}
          >
            <TrendingDown className="h-4 w-4 mr-2" />
            Backlink Gap
          </Button>
        </div>

        {error && (
          <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        {/* Gap Analysis Results */}
        {gapAnalysis && (
          <div className="space-y-6 mt-4">
            {/* Keyword Gap */}
            {gapAnalysis.keywordGap && gapAnalysis.keywordGap.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Keyword Opportunities ({gapAnalysis.keywordGap.length})
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {gapAnalysis.keywordGap.slice(0, 10).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{item.keyword}</p>
                        <p className="text-xs text-muted-foreground">
                          Vol: {item.searchVolume.toLocaleString()} | Diff: {item.difficulty}%
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          {item.clientPosition ? (
                            <span className="text-sm">#{item.clientPosition}</span>
                          ) : (
                            <Badge variant="outline">Not Ranking</Badge>
                          )}
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-green-600">
                            Competitor #{item.competitorPosition}
                          </span>
                        </div>
                        {getOpportunityBadge(item.opportunity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Content Gap */}
            {gapAnalysis.contentGap && gapAnalysis.contentGap.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Content Opportunities ({gapAnalysis.contentGap.length})</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {gapAnalysis.contentGap.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{item.topic}</p>
                        {getOpportunityBadge(item.priority)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Intent: {item.searchIntent} | Est. Traffic: {item.estimatedTraffic.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Backlink Gap */}
            {gapAnalysis.backlinkGap && gapAnalysis.backlinkGap.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Backlink Opportunities ({gapAnalysis.backlinkGap.length})</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {gapAnalysis.backlinkGap.slice(0, 10).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{item.domain}</p>
                        <p className="text-xs text-muted-foreground">
                          DA: {item.domainAuthority}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-4 text-sm">
                          <span>You: {item.clientBacklinks}</span>
                          <span className="text-green-600">
                            Competitors: {item.competitorBacklinks}
                          </span>
                        </div>
                        {item.opportunity && (
                          <Badge className="bg-blue-100 text-blue-800 mt-1">Opportunity</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
