'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Eye,
  Plus,
  RefreshCw,
  Loader2,
  Target,
  BarChart3,
  Zap
} from 'lucide-react';

interface ChangeSignal {
  id: string;
  signalType: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  description: string;
  detectedAt: string;
  affectedKeywords: string[];
  status: 'active' | 'investigating' | 'resolved';
  recommendationId?: string;
}

interface SerpObservation {
  id: string;
  keyword: string;
  position?: number;
  aiAnswerPresent: boolean;
  featuresPresent: string[];
  timestamp: string;
}

interface SignalStats {
  total: number;
  bySeverity: {
    minor: number;
    moderate: number;
    major: number;
    critical: number;
  };
  byType: Record<string, number>;
  activeSignals: number;
  resolved24h: number;
}

export default function GoogleCurvePage() {
  const { currentOrganization } = useAuth();
  const [signals, setSignals] = useState<ChangeSignal[]>([]);
  const [observations, setObservations] = useState<SerpObservation[]>([]);
  const [stats, setStats] = useState<SignalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [monitoring, setMonitoring] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [keywords, setKeywords] = useState('');

  useEffect(() => {
    if (currentOrganization?.org_id) {
      fetchData();
    }
  }, [currentOrganization]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const session = await (await import('@/lib/supabase')).supabaseBrowser.auth.getSession();
      const token = session.data.session?.access_token;

      const params = new URLSearchParams({
        workspaceId: currentOrganization!.org_id
      });

      const response = await fetch(`/api/aido/google-curve/signals?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        setSignals(data.signals);
        setObservations(data.recentObservations || []);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartMonitoring = async () => {
    if (!keywords) {
      alert('Please enter keywords to monitor');
      return;
    }

    setMonitoring(true);
    try {
      const session = await (await import('@/lib/supabase')).supabaseBrowser.auth.getSession();
      const token = session.data.session?.access_token;

      const params = new URLSearchParams({
        workspaceId: currentOrganization!.org_id
      });

      const response = await fetch(`/api/aido/google-curve/monitor?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          keywords: keywords.split(',').map(k => k.trim())
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`Monitoring started for ${data.observations.length} keywords. Updates every 6 hours.`);
        setDialogOpen(false);
        setKeywords('');
        fetchData();
      } else {
        alert(data.error || 'Failed to start monitoring');
      }
    } catch (error) {
      console.error('Failed to start monitoring:', error);
      alert('Failed to start monitoring');
    } finally {
      setMonitoring(false);
    }
  };

  const handleAnalyzeTrends = async () => {
    setAnalyzing(true);
    try {
      const session = await (await import('@/lib/supabase')).supabaseBrowser.auth.getSession();
      const token = session.data.session?.access_token;

      const params = new URLSearchParams({
        workspaceId: currentOrganization!.org_id
      });

      // Get top keyword from observations
      const topKeyword = observations.length > 0 ? observations[0].keyword : null;
      if (!topKeyword) {
        alert('No SERP observations available for analysis');
        setAnalyzing(false);
        return;
      }

      const response = await fetch(`/api/aido/google-curve/analyze?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          keyword: topKeyword,
          days: 30
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`Analysis complete! Generated ${data.signals.length} signals and ${data.recommendations.length} recommendations. Cost: ~$2.00`);
        fetchData();
      } else {
        alert(data.error || 'Failed to analyze trends');
      }
    } catch (error) {
      console.error('Failed to analyze trends:', error);
      alert('Failed to analyze trends');
    } finally {
      setAnalyzing(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, { color: string; icon: any }> = {
      minor: { color: 'bg-gray-500', icon: Eye },
      moderate: { color: 'bg-yellow-500', icon: AlertTriangle },
      major: { color: 'bg-orange-500', icon: TrendingDown },
      critical: { color: 'bg-red-500', icon: AlertTriangle }
    };

    const variant = variants[severity] || variants.minor;
    const Icon = variant.icon;

    return (
      <Badge className={`${variant.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: any }> = {
      active: { color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', icon: AlertTriangle },
      investigating: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', icon: Eye },
      resolved: { color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', icon: CheckCircle }
    };

    const variant = variants[status] || variants.active;
    const Icon = variant.icon;

    return (
      <Badge className={variant.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getSignalTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      ranking_shift: 'Ranking Shift',
      serp_feature_change: 'SERP Feature Change',
      ai_answer_update: 'AI Answer Update',
      competitor_movement: 'Competitor Movement',
      algorithm_update: 'Algorithm Update'
    };
    return labels[type] || type;
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 168) return `${Math.floor(diffHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Google-Curve Anticipation Engine</h1>
          <p className="text-text-secondary mt-1">
            Detect algorithm shifts 5-10 days before competitors
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleAnalyzeTrends}
            disabled={analyzing || observations.length === 0}
            variant="outline"
          >
            {analyzing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Analyze Trends (~$2.00)
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Keywords
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start Monitoring Keywords</DialogTitle>
                <DialogDescription>
                  SERP positions checked every 6 hours. Updates run automatically via cron job.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                  <Input
                    id="keywords"
                    placeholder="stainless steel balustrades, glass railings, modern handrails"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Monitoring includes:</strong> SERP position, AI Overview presence, featured snippets,
                    local pack, people also ask, and competitor tracking.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={monitoring}>
                  Cancel
                </Button>
                <Button onClick={handleStartMonitoring} disabled={monitoring}>
                  {monitoring && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {monitoring ? 'Starting...' : 'Start Monitoring'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Active Signals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.activeSignals}</div>
              <p className="text-xs text-gray-500 mt-2">
                {stats.total} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-red-600" />
                Critical
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {stats.bySeverity.critical}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <TrendingDown className="w-4 h-4 mr-2 text-orange-600" />
                Major
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {stats.bySeverity.major}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Eye className="w-4 h-4 mr-2 text-yellow-600" />
                Moderate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {stats.bySeverity.moderate}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                Resolved (24h)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {stats.resolved24h}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Observations Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>SERP Position History</CardTitle>
        </CardHeader>
        <CardContent>
          {observations.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-2">No SERP observations yet</p>
              <p className="text-sm text-gray-400 mb-4">
                Add keywords to start monitoring SERP positions
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-text-secondary mb-4">
                Monitoring {observations.length} keywords with position tracking every 6 hours
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {observations.slice(0, 6).map((obs) => (
                  <Card key={obs.id} className="bg-bg-raised">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold truncate">{obs.keyword}</p>
                        {obs.position && (
                          <Badge variant="outline" className="text-xs">
                            #{obs.position}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {obs.aiAnswerPresent && (
                          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 text-xs">
                            AI Answer
                          </Badge>
                        )}
                        {obs.featuresPresent.length > 0 && (
                          <span>+{obs.featuresPresent.length} features</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatTimestamp(obs.timestamp)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Signals */}
      <Card>
        <CardHeader>
          <CardTitle>Change Signals ({signals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <Loader2 className="w-8 h-8 mx-auto animate-spin mb-4" />
              Loading signals...
            </div>
          ) : signals.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-2">No change signals detected</p>
              <p className="text-sm text-gray-400 mb-4">
                Start monitoring keywords to detect algorithm shifts early
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {signals.map((signal) => (
                <Card key={signal.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getSeverityBadge(signal.severity)}
                            {getStatusBadge(signal.status)}
                            <Badge variant="outline" className="text-xs">
                              {getSignalTypeLabel(signal.signalType)}
                            </Badge>
                          </div>
                          <h3 className="text-lg font-semibold mb-2">{signal.description}</h3>
                          <p className="text-sm text-gray-500">
                            Detected {formatTimestamp(signal.detectedAt)}
                          </p>
                        </div>
                      </div>

                      {/* Affected Keywords */}
                      {signal.affectedKeywords && signal.affectedKeywords.length > 0 && (
                        <div className="bg-bg-raised p-3 rounded-lg">
                          <p className="text-xs font-semibold text-text-secondary mb-2">
                            Affected Keywords ({signal.affectedKeywords.length}):
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {signal.affectedKeywords.slice(0, 5).map((keyword, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                            {signal.affectedKeywords.length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{signal.affectedKeywords.length - 5} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      {signal.recommendationId && (
                        <div className="pt-2 border-t border-border-subtle">
                          <Button variant="link" className="p-0 h-auto text-xs">
                            <Zap className="w-3 h-3 mr-1" />
                            View Strategy Recommendations →
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
