'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Zap,
  BarChart3,
  FileText,
  Eye
} from 'lucide-react';
import Link from 'next/link';

export default function AIDOOverviewPage() {
  const { currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalAssets: 0,
    averageAuthority: 0,
    averageEvergreen: 0,
    averageAISource: 0,
    immuneContent: 0,
    immunePercentage: 0,
    activeSignals: 0,
    criticalSignals: 0,
    pendingRecommendations: 0
  });

  useEffect(() => {
    if (currentOrganization?.org_id) {
      fetchOverviewData();
    }
  }, [currentOrganization]);

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      const session = await (await import('@/lib/supabase')).supabaseBrowser.auth.getSession();
      const token = session.data.session?.access_token;

      const params = new URLSearchParams({
        workspaceId: currentOrganization!.org_id
      });

      // Fetch content stats
      const contentRes = await fetch(`/api/aido/content?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const contentData = await contentRes.json();

      // Fetch change signals
      const signalsRes = await fetch(`/api/aido/google-curve/signals?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const signalsData = await signalsRes.json();

      if (contentData.success && signalsData.success) {
        setMetrics({
          totalAssets: contentData.stats.total,
          averageAuthority: parseFloat(contentData.stats.averageScores.authority),
          averageEvergreen: parseFloat(contentData.stats.averageScores.evergreen),
          averageAISource: parseFloat(contentData.stats.averageScores.aiSource),
          immuneContent: contentData.stats.algorithmicImmunity.count,
          immunePercentage: parseFloat(contentData.stats.algorithmicImmunity.percentage),
          activeSignals: signalsData.stats.total,
          criticalSignals: signalsData.stats.bySeverity.critical || 0,
          pendingRecommendations: 0 // TODO: Fetch from recommendations API
        });
      }
    } catch (error) {
      console.error('Failed to fetch overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 0.8) {
return 'text-green-600 dark:text-green-400';
}
    if (score >= 0.6) {
return 'text-yellow-600 dark:text-yellow-400';
}
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">AIDO 2026 Overview</h1>
        <p className="text-text-secondary mt-1">
          AI Discovery Optimization - Position your brand as the source AI systems cite
        </p>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Total Content Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.totalAssets}</div>
            <Link href="/dashboard/aido/content">
              <Button variant="link" className="p-0 h-auto text-xs mt-2">
                View all →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Algorithmic Immunity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {metrics.immuneContent}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {metrics.immunePercentage.toFixed(1)}% of content
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Active Signals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {metrics.activeSignals}
            </div>
            <p className="text-xs text-red-600 mt-2">
              {metrics.criticalSignals} critical
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Pending Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {metrics.pendingRecommendations}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Strategy recommendations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Authority Score</span>
              <Badge variant="outline">Expert Depth</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-bold mb-2 ${getScoreColor(metrics.averageAuthority)}`}>
              {(metrics.averageAuthority * 100).toFixed(0)}%
            </div>
            <div className="w-full bg-bg-hover rounded-full h-2 mb-3">
              <div
                className={`h-2 rounded-full ${metrics.averageAuthority >= 0.8 ? 'bg-green-600' : metrics.averageAuthority >= 0.6 ? 'bg-yellow-600' : 'bg-red-600'}`}
                style={{ width: `${metrics.averageAuthority * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              Target: 80%+ for algorithmic immunity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Evergreen Score</span>
              <Badge variant="outline">Timeless Value</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-bold mb-2 ${getScoreColor(metrics.averageEvergreen)}`}>
              {(metrics.averageEvergreen * 100).toFixed(0)}%
            </div>
            <div className="w-full bg-bg-hover rounded-full h-2 mb-3">
              <div
                className={`h-2 rounded-full ${metrics.averageEvergreen >= 0.7 ? 'bg-green-600' : metrics.averageEvergreen >= 0.5 ? 'bg-yellow-600' : 'bg-red-600'}`}
                style={{ width: `${metrics.averageEvergreen * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              Target: 70%+ for long-term rankings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center justify-between">
              <span>AI Source Score</span>
              <Badge variant="outline">AI Citation</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-bold mb-2 ${getScoreColor(metrics.averageAISource)}`}>
              {(metrics.averageAISource * 100).toFixed(0)}%
            </div>
            <div className="w-full bg-bg-hover rounded-full h-2 mb-3">
              <div
                className={`h-2 rounded-full ${metrics.averageAISource >= 0.8 ? 'bg-green-600' : metrics.averageAISource >= 0.6 ? 'bg-yellow-600' : 'bg-red-600'}`}
                style={{ width: `${metrics.averageAISource * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              Target: 80%+ for AI citation preference
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/aido/content">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <div className="flex items-start w-full">
                  <FileText className="w-5 h-5 mr-3 mt-1" />
                  <div className="text-left">
                    <p className="font-semibold">Generate Content</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Create algorithmic immunity content with AI
                    </p>
                  </div>
                </div>
              </Button>
            </Link>

            <Link href="/dashboard/aido/intent-clusters">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <div className="flex items-start w-full">
                  <Target className="w-5 h-5 mr-3 mt-1" />
                  <div className="text-left">
                    <p className="font-semibold">Intent Clusters</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Discover questions users actually ask
                    </p>
                  </div>
                </div>
              </Button>
            </Link>

            <Link href="/dashboard/aido/google-curve">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <div className="flex items-start w-full">
                  <TrendingUp className="w-5 h-5 mr-3 mt-1" />
                  <div className="text-left">
                    <p className="font-semibold">Google Curve</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Monitor algorithm shifts and rankings
                    </p>
                  </div>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 5 Strategic Pillars */}
      <Card>
        <CardHeader>
          <CardTitle>5 Strategic Pillars</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 border border-border-subtle rounded-lg">
              <Zap className="w-6 h-6 text-blue-600 mt-1" />
              <div className="flex-1">
                <h4 className="font-semibold">AI Discovery Optimization (AIDO)</h4>
                <p className="text-sm text-text-secondary mt-1">
                  Make your brand the primary data source AI systems cite
                </p>
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    {metrics.totalAssets} content assets
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border border-border-subtle rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
              <div className="flex-1">
                <h4 className="font-semibold">Algorithmic Immunity Content</h4>
                <p className="text-sm text-text-secondary mt-1">
                  Deep evergreen content that survives algorithm changes
                </p>
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs text-green-600">
                    {metrics.immuneContent} immune ({metrics.immunePercentage.toFixed(1)}%)
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border border-border-subtle rounded-lg">
              <Clock className="w-6 h-6 text-purple-600 mt-1" />
              <div className="flex-1">
                <h4 className="font-semibold">Reality-Loop Marketing</h4>
                <p className="text-sm text-text-secondary mt-1">
                  Convert real-world events into content automatically
                </p>
                <Link href="/dashboard/aido/reality-loop">
                  <Button variant="link" className="p-0 h-auto text-xs mt-2">
                    View events →
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border border-border-subtle rounded-lg">
              <BarChart3 className="w-6 h-6 text-yellow-600 mt-1" />
              <div className="flex-1">
                <h4 className="font-semibold">Conversational SEO Stacks</h4>
                <p className="text-sm text-text-secondary mt-1">
                  Align with how AI systems answer questions
                </p>
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    {(metrics.averageAISource * 100).toFixed(0)}% AI source score
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border border-border-subtle rounded-lg">
              <TrendingUp className="w-6 h-6 text-red-600 mt-1" />
              <div className="flex-1">
                <h4 className="font-semibold">Google-Curve Anticipation Engine</h4>
                <p className="text-sm text-text-secondary mt-1">
                  Detect algorithm shifts 5-10 days before competitors
                </p>
                <div className="mt-2 flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    {metrics.activeSignals} active signals
                  </Badge>
                  {metrics.criticalSignals > 0 && (
                    <Badge variant="outline" className="text-xs text-red-600">
                      {metrics.criticalSignals} critical
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
