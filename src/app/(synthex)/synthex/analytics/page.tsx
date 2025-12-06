/**
 * Synthex Analytics
 *
 * Performance metrics and analytics:
 * - Channel performance charts
 * - Campaign ROI metrics
 * - Content engagement stats
 * - AI-powered insights panel
 * - Delivery stats and monitoring
 * - Attribution & engagement scoring
 * - Real-time channel analytics (B8)
 *
 * IMPLEMENTED[PHASE_B5]: Insights panel with AI recommendations
 * IMPLEMENTED[PHASE_B6]: Delivery stats panel
 * IMPLEMENTED[PHASE_B7]: Attribution, engagement scores, advanced analytics
 * IMPLEMENTED[PHASE_B8]: Real-time channel analytics, Recharts dashboards
 * IMPLEMENTED[PHASE_B9]: Predictive Intelligence, Send-Time Optimization
 *
 * Backlog: SYNTHEX-006
 */

'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Dynamic imports for Recharts components (client-side only)
const ChannelLineChart = dynamic(
  () => import('@/components/synthex/charts/ChannelLineChart'),
  { ssr: false }
);
const ChannelBarChart = dynamic(
  () => import('@/components/synthex/charts/ChannelBarChart'),
  { ssr: false }
);
const ChannelPieChart = dynamic(
  () => import('@/components/synthex/charts/ChannelPieChart'),
  { ssr: false }
);
const SendTimeHeatmap = dynamic(
  () => import('@/components/synthex/charts/SendTimeHeatmap'),
  { ssr: false }
);
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  MousePointer,
  Calendar,
  Download,
  RefreshCw,
  Mail,
  Share2,
  Search,
  Sparkles,
  Lightbulb,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  XCircle,
  Loader2,
  Zap,
  Send,
  Inbox,
  MailCheck,
  MailX,
  Play,
  Target,
  Activity,
  DollarSign,
  Flame,
  Snowflake,
  ThermometerSun,
  Crown,
  LineChart,
  PieChart,
  Brain,
  Clock,
  Gauge,
} from 'lucide-react';

interface Insight {
  id?: string;
  type: 'opportunity' | 'warning' | 'pattern' | 'recommendation' | 'trend';
  category: 'seo' | 'content' | 'campaign' | 'engagement' | 'conversion' | 'general';
  title: string;
  description: string;
  priority: number;
  confidence: number;
  actionItems?: string[];
  status?: 'new' | 'viewed' | 'actioned' | 'dismissed';
}

interface DeliveryStats {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalFailed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
}

interface RecentDelivery {
  id: string;
  channel: string;
  recipient: string;
  status: string;
  attempted_at: string;
  delivered_at: string | null;
  error_message: string | null;
}

interface CombinedAnalytics {
  deliveries: {
    total: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    failed: number;
    byChannel: Record<string, number>;
  };
  attribution: {
    total: number;
    byEventType: Record<string, number>;
    byChannel: Record<string, number>;
    totalRevenue: number;
  };
  engagement: {
    cold: number;
    warming: number;
    warm: number;
    hot: number;
    champion: number;
    total: number;
  };
  campaigns: {
    active: number;
    completed: number;
    scheduled: number;
    total: number;
  };
}

interface EngagedContact {
  email: string;
  overall_score: number;
  tier: string;
  total_events: number;
  total_revenue: number;
  last_event_at: string;
}

interface ChannelData {
  events: number;
  revenue: number;
  conversions: number;
  engagementScore: number;
}

// Real-time analytics interfaces (Phase B8)
interface LineChartData {
  date: string;
  email: number;
  sms: number;
  social: number;
  push: number;
  web: number;
}

interface BarChartData {
  channel: string;
  total: number;
  sends: number;
  opens: number;
  clicks: number;
  conversions: number;
}

// Predictive analytics interface (Phase B9)
interface SendTimePrediction {
  bestHour: number;
  bestDay: string;
  bestTimezone: string;
  confidence: number;
  reasoning: string;
  dataPointsAnalyzed: number;
  alternatives?: Array<{ hour: number; day: string; confidence: number }>;
}

const insightIcons: Record<string, React.ReactNode> = {
  opportunity: <Zap className="h-4 w-4 text-green-400" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-400" />,
  pattern: <BarChart3 className="h-4 w-4 text-blue-400" />,
  recommendation: <Lightbulb className="h-4 w-4 text-purple-400" />,
  trend: <TrendingUp className="h-4 w-4 text-cyan-400" />,
};

const categoryColors: Record<string, string> = {
  seo: 'bg-blue-500/20 text-blue-400',
  content: 'bg-purple-500/20 text-purple-400',
  campaign: 'bg-green-500/20 text-green-400',
  engagement: 'bg-amber-500/20 text-amber-400',
  conversion: 'bg-pink-500/20 text-pink-400',
  general: 'bg-gray-500/20 text-gray-400',
};

export default function SynthexAnalyticsPage() {
  const [tenantId, setTenantId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [generating, setGenerating] = useState(false);

  // Delivery state
  const [deliveryStats, setDeliveryStats] = useState<DeliveryStats | null>(null);
  const [recentDeliveries, setRecentDeliveries] = useState<RecentDelivery[]>([]);
  const [loadingDelivery, setLoadingDelivery] = useState(false);
  const [processingDelivery, setProcessingDelivery] = useState(false);

  // Advanced analytics state (Phase B7)
  const [combinedAnalytics, setCombinedAnalytics] = useState<CombinedAnalytics | null>(null);
  const [topEngaged, setTopEngaged] = useState<EngagedContact[]>([]);
  const [channelComparison, setChannelComparison] = useState<Record<string, ChannelData>>({});
  const [loadingAdvanced, setLoadingAdvanced] = useState(false);

  // Real-time analytics state (Phase B8)
  const [lineChartData, setLineChartData] = useState<LineChartData[]>([]);
  const [barChartData, setBarChartData] = useState<BarChartData[]>([]);
  const [loadingRealTime, setLoadingRealTime] = useState(false);

  // Predictive analytics state (Phase B9)
  const [sendTimePrediction, setSendTimePrediction] = useState<SendTimePrediction | null>(null);
  const [heatmapData, setHeatmapData] = useState<number[][]>([]);
  const [loadingPredictive, setLoadingPredictive] = useState(false);
  const [generatingPrediction, setGeneratingPrediction] = useState(false);

  // Load existing insights
  const loadInsights = async () => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/synthex/insights?tenantId=${tenantId}&includeCounts=true`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load insights');
      }

      setInsights(data.insights || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  // Generate new insights
  const generateInsights = async () => {
    if (!tenantId) return;

    setGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/synthex/insights/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate insights');
      }

      // Add new insights to the list
      setInsights((prev) => [...(data.insights || []), ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate insights');
    } finally {
      setGenerating(false);
    }
  };

  // Dismiss an insight
  const dismissInsight = async (insightId: string) => {
    try {
      await fetch('/api/synthex/insights', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insightId, status: 'dismissed' }),
      });

      setInsights((prev) => prev.filter((i) => i.id !== insightId));
    } catch (err) {
      console.error('Failed to dismiss insight:', err);
    }
  };

  // Mark insight as actioned
  const markActioned = async (insightId: string) => {
    try {
      await fetch('/api/synthex/insights', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insightId, status: 'actioned' }),
      });

      setInsights((prev) =>
        prev.map((i) => (i.id === insightId ? { ...i, status: 'actioned' } : i))
      );
    } catch (err) {
      console.error('Failed to update insight:', err);
    }
  };

  // Load delivery stats
  const loadDeliveryStats = async () => {
    if (!tenantId) return;

    setLoadingDelivery(true);
    try {
      const res = await fetch(`/api/synthex/delivery/run?tenantId=${tenantId}&days=30`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load delivery stats');
      }

      setDeliveryStats(data.stats);
      setRecentDeliveries(data.recentDeliveries || []);
    } catch (err) {
      console.error('Failed to load delivery stats:', err);
    } finally {
      setLoadingDelivery(false);
    }
  };

  // Process due deliveries
  const processDeliveries = async () => {
    if (!tenantId) return;

    setProcessingDelivery(true);
    setError(null);

    try {
      const res = await fetch('/api/synthex/delivery/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, limit: 50 }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process deliveries');
      }

      // Reload stats after processing
      await loadDeliveryStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process deliveries');
    } finally {
      setProcessingDelivery(false);
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return 'bg-green-500/20 text-green-400';
      case 'opened':
      case 'clicked':
        return 'bg-blue-500/20 text-blue-400';
      case 'pending':
      case 'sending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'failed':
      case 'bounced':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  // Load advanced analytics (Phase B7)
  const loadAdvancedAnalytics = async () => {
    if (!tenantId) return;

    setLoadingAdvanced(true);
    try {
      const res = await fetch(`/api/synthex/analytics/summary?tenantId=${tenantId}&days=30`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load analytics');
      }

      setCombinedAnalytics(data.analytics);
      setTopEngaged(data.topEngaged || []);
      setChannelComparison(data.channelComparison || {});
    } catch (err) {
      console.error('Failed to load advanced analytics:', err);
    } finally {
      setLoadingAdvanced(false);
    }
  };

  // Load real-time channel analytics (Phase B8)
  const loadRealTimeData = async () => {
    if (!tenantId) return;

    setLoadingRealTime(true);
    try {
      const res = await fetch(`/api/synthex/analytics/channels/summary?tenantId=${tenantId}&days=30`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load real-time data');
      }

      setLineChartData(data.lineChartData || []);
      setBarChartData(data.barChartData || []);
    } catch (err) {
      console.error('Failed to load real-time analytics:', err);
    } finally {
      setLoadingRealTime(false);
    }
  };

  // Load send-time prediction (Phase B9)
  const loadPrediction = async () => {
    if (!tenantId) return;

    setLoadingPredictive(true);
    try {
      const res = await fetch(`/api/synthex/predict/send-time?tenantId=${tenantId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load prediction');
      }

      setSendTimePrediction(data.prediction);
      setHeatmapData(data.heatmapData || []);
    } catch (err) {
      console.error('Failed to load prediction:', err);
    } finally {
      setLoadingPredictive(false);
    }
  };

  // Generate new send-time prediction (Phase B9)
  const generatePrediction = async () => {
    if (!tenantId) return;

    setGeneratingPrediction(true);
    try {
      const res = await fetch('/api/synthex/predict/send-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, days: 90 }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate prediction');
      }

      setSendTimePrediction(data.prediction);
      setHeatmapData(data.heatmapData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate prediction');
    } finally {
      setGeneratingPrediction(false);
    }
  };

  // Format hour for display
  const formatHour = (hour: number): string => {
    if (hour === 0) return '12:00 AM';
    if (hour === 12) return '12:00 PM';
    if (hour < 12) return `${hour}:00 AM`;
    return `${hour - 12}:00 PM`;
  };

  // Format day for display
  const formatDay = (day: string): string => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Get tier icon and color
  const getTierStyle = (tier: string) => {
    switch (tier) {
      case 'champion':
        return { icon: <Crown className="h-4 w-4" />, color: 'text-yellow-400 bg-yellow-500/20' };
      case 'hot':
        return { icon: <Flame className="h-4 w-4" />, color: 'text-red-400 bg-red-500/20' };
      case 'warm':
        return { icon: <ThermometerSun className="h-4 w-4" />, color: 'text-orange-400 bg-orange-500/20' };
      case 'warming':
        return { icon: <Activity className="h-4 w-4" />, color: 'text-amber-400 bg-amber-500/20' };
      default:
        return { icon: <Snowflake className="h-4 w-4" />, color: 'text-blue-400 bg-blue-500/20' };
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Analytics</h1>
          <p className="text-gray-400 mt-2">
            Track your marketing performance and get AI-powered insights
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-gray-700" disabled>
            <Calendar className="h-4 w-4 mr-2" />
            Last 30 Days
          </Button>
          <Button variant="outline" className="border-gray-700" disabled>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Tenant ID Input */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm text-gray-400 mb-2 block">Tenant ID</label>
              <Input
                placeholder="Enter your tenant ID..."
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="bg-gray-800 border-gray-700 text-gray-100"
              />
            </div>
            <Button
              onClick={loadInsights}
              disabled={!tenantId || loading}
              variant="outline"
              className="border-gray-700"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Load Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Reach</p>
                <p className="text-2xl font-bold text-gray-100">0</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
              <TrendingUp className="h-4 w-4" />
              <span>--% vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Impressions</p>
                <p className="text-2xl font-bold text-gray-100">0</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Eye className="h-6 w-6 text-purple-400" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
              <TrendingUp className="h-4 w-4" />
              <span>--% vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Engagements</p>
                <p className="text-2xl font-bold text-gray-100">0</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <MousePointer className="h-6 w-6 text-green-400" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
              <TrendingUp className="h-4 w-4" />
              <span>--% vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Conversions</p>
                <p className="text-2xl font-bold text-gray-100">0</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-amber-400" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
              <TrendingUp className="h-4 w-4" />
              <span>--% vs last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Panel */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-gray-100">AI Insights</CardTitle>
                <CardDescription className="text-gray-400">
                  Actionable recommendations powered by AI analysis
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={generateInsights}
              disabled={!tenantId || generating}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Insights
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <div className="py-12 text-center">
              <Lightbulb className="h-12 w-12 text-gray-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">
                No Insights Yet
              </h3>
              <p className="text-gray-500 max-w-md mx-auto mb-4">
                {tenantId
                  ? 'Click "Generate Insights" to analyze your data and get AI-powered recommendations.'
                  : 'Enter your tenant ID and load data to generate insights.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div
                  key={insight.id || index}
                  className={`p-4 rounded-lg border transition-colors ${
                    insight.status === 'actioned'
                      ? 'bg-green-900/10 border-green-800'
                      : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-0.5">{insightIcons[insight.type]}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-100">{insight.title}</h4>
                          <Badge className={categoryColors[insight.category]}>
                            {insight.category}
                          </Badge>
                          {insight.priority <= 2 && (
                            <Badge className="bg-red-500/20 text-red-400">High Priority</Badge>
                          )}
                          {insight.status === 'actioned' && (
                            <Badge className="bg-green-500/20 text-green-400">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Done
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{insight.description}</p>
                        {insight.actionItems && insight.actionItems.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Action items:</p>
                            <ul className="space-y-1">
                              {insight.actionItems.map((item, i) => (
                                <li key={i} className="text-sm text-gray-400 flex items-center gap-2">
                                  <ArrowRight className="h-3 w-3 text-purple-400" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          <span>Confidence: {Math.round((insight.confidence || 0.8) * 100)}%</span>
                        </div>
                      </div>
                    </div>
                    {insight.id && insight.status !== 'actioned' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markActioned(insight.id!)}
                          className="border-green-600 text-green-400 hover:bg-green-950"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Done
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => dismissInsight(insight.id!)}
                          className="text-gray-400 hover:text-gray-200"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-gray-700">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="delivery" className="data-[state=active]:bg-gray-700" onClick={loadDeliveryStats}>
            <Send className="h-4 w-4 mr-2" />
            Delivery
          </TabsTrigger>
          <TabsTrigger value="attribution" className="data-[state=active]:bg-gray-700" onClick={loadAdvancedAnalytics}>
            <Target className="h-4 w-4 mr-2" />
            Attribution
          </TabsTrigger>
          <TabsTrigger value="realtime" className="data-[state=active]:bg-gray-700" onClick={loadRealTimeData}>
            <LineChart className="h-4 w-4 mr-2" />
            Real-Time
          </TabsTrigger>
          <TabsTrigger value="predictive" className="data-[state=active]:bg-gray-700" onClick={loadPrediction}>
            <Brain className="h-4 w-4 mr-2" />
            Predictive
          </TabsTrigger>
          <TabsTrigger value="email" className="data-[state=active]:bg-gray-700">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </TabsTrigger>
          <TabsTrigger value="social" className="data-[state=active]:bg-gray-700">
            <Share2 className="h-4 w-4 mr-2" />
            Social
          </TabsTrigger>
          <TabsTrigger value="seo" className="data-[state=active]:bg-gray-700">
            <Search className="h-4 w-4 mr-2" />
            SEO
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-100">Performance Overview</CardTitle>
              <CardDescription className="text-gray-400">
                Your marketing performance at a glance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-16 w-16 text-gray-700 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-300 mb-2">
                    Charts Coming Soon
                  </h3>
                  <p className="text-gray-500 max-w-md">
                    Performance charts will be available in Phase B7.
                    Use AI Insights above for actionable recommendations.
                  </p>
                  <Badge variant="secondary" className="mt-4">Phase B7</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-gray-100">Top Performing Content</CardTitle>
              </CardHeader>
              <CardContent className="py-8 text-center">
                <TrendingUp className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500">No content data yet</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-gray-100">Channel Distribution</CardTitle>
              </CardHeader>
              <CardContent className="py-8 text-center">
                <Share2 className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500">No channel data yet</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="delivery" className="space-y-6">
          {/* Delivery Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Sent</p>
                    <p className="text-2xl font-bold text-gray-100">
                      {deliveryStats?.totalSent || 0}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Send className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Delivered</p>
                    <p className="text-2xl font-bold text-gray-100">
                      {deliveryStats?.totalDelivered || 0}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <MailCheck className="h-6 w-6 text-green-400" />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2 text-sm text-green-400">
                  <span>{deliveryStats?.deliveryRate?.toFixed(1) || 0}% delivery rate</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Opened</p>
                    <p className="text-2xl font-bold text-gray-100">
                      {deliveryStats?.totalOpened || 0}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Inbox className="h-6 w-6 text-purple-400" />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2 text-sm text-purple-400">
                  <span>{deliveryStats?.openRate?.toFixed(1) || 0}% open rate</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Failed</p>
                    <p className="text-2xl font-bold text-gray-100">
                      {(deliveryStats?.totalFailed || 0) + (deliveryStats?.totalBounced || 0)}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                    <MailX className="h-6 w-6 text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Delivery Actions */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-gray-100">Delivery Engine</CardTitle>
                  <CardDescription className="text-gray-400">
                    Process scheduled deliveries and monitor status
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={loadDeliveryStats}
                    disabled={!tenantId || loadingDelivery}
                    variant="outline"
                    className="border-gray-700"
                  >
                    {loadingDelivery ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Refresh
                  </Button>
                  <Button
                    onClick={processDeliveries}
                    disabled={!tenantId || processingDelivery}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processingDelivery ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Process Queue
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {recentDeliveries.length === 0 ? (
                <div className="py-12 text-center">
                  <Send className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-300 mb-2">
                    No Recent Deliveries
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    {tenantId
                      ? 'Schedule a campaign to start sending deliveries.'
                      : 'Enter your tenant ID to view delivery history.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">Recent Deliveries</h4>
                  {recentDeliveries.map((delivery) => (
                    <div
                      key={delivery.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-800 border border-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        {delivery.channel === 'email' ? (
                          <Mail className="h-4 w-4 text-blue-400" />
                        ) : delivery.channel === 'sms' ? (
                          <Send className="h-4 w-4 text-green-400" />
                        ) : (
                          <Share2 className="h-4 w-4 text-purple-400" />
                        )}
                        <div>
                          <p className="text-sm text-gray-200">{delivery.recipient}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(delivery.attempted_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {delivery.error_message && (
                          <span className="text-xs text-red-400 max-w-[200px] truncate">
                            {delivery.error_message}
                          </span>
                        )}
                        <Badge className={getStatusColor(delivery.status)}>
                          {delivery.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attribution" className="space-y-6">
          {/* Engagement Tier Summary */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Champions</p>
                    <p className="text-2xl font-bold text-yellow-400">
                      {combinedAnalytics?.engagement.champion || 0}
                    </p>
                  </div>
                  <Crown className="h-6 w-6 text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Hot</p>
                    <p className="text-2xl font-bold text-red-400">
                      {combinedAnalytics?.engagement.hot || 0}
                    </p>
                  </div>
                  <Flame className="h-6 w-6 text-red-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Warm</p>
                    <p className="text-2xl font-bold text-orange-400">
                      {combinedAnalytics?.engagement.warm || 0}
                    </p>
                  </div>
                  <ThermometerSun className="h-6 w-6 text-orange-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Warming</p>
                    <p className="text-2xl font-bold text-amber-400">
                      {combinedAnalytics?.engagement.warming || 0}
                    </p>
                  </div>
                  <Activity className="h-6 w-6 text-amber-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Cold</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {combinedAnalytics?.engagement.cold || 0}
                    </p>
                  </div>
                  <Snowflake className="h-6 w-6 text-blue-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Engaged Contacts */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-gray-100">Top Engaged Contacts</CardTitle>
                    <CardDescription className="text-gray-400">
                      Highest engagement scores
                    </CardDescription>
                  </div>
                  <Button
                    onClick={loadAdvancedAnalytics}
                    disabled={!tenantId || loadingAdvanced}
                    variant="outline"
                    size="sm"
                    className="border-gray-700"
                  >
                    {loadingAdvanced ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {topEngaged.length === 0 ? (
                  <div className="py-8 text-center">
                    <Users className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {tenantId ? 'No engagement data yet' : 'Enter tenant ID to load data'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topEngaged.slice(0, 5).map((contact, index) => {
                      const tierStyle = getTierStyle(contact.tier);
                      return (
                        <div
                          key={contact.email || index}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-800 border border-gray-700"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${tierStyle.color}`}>
                              {tierStyle.icon}
                            </div>
                            <div>
                              <p className="text-sm text-gray-200">{contact.email}</p>
                              <p className="text-xs text-gray-500">
                                {contact.total_events} events • ${contact.total_revenue?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-100">
                              {contact.overall_score?.toFixed(0)}
                            </p>
                            <p className="text-xs text-gray-500">score</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Channel Comparison */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-gray-100">Channel Performance</CardTitle>
                <CardDescription className="text-gray-400">
                  Engagement by channel
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(channelComparison).length === 0 ? (
                  <div className="py-8 text-center">
                    <Share2 className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {tenantId ? 'No channel data yet' : 'Enter tenant ID to load data'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(channelComparison).map(([channel, data]) => (
                      <div key={channel} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {channel === 'email' && <Mail className="h-4 w-4 text-blue-400" />}
                            {channel === 'sms' && <Send className="h-4 w-4 text-green-400" />}
                            {channel === 'social' && <Share2 className="h-4 w-4 text-purple-400" />}
                            {channel === 'web' && <MousePointer className="h-4 w-4 text-cyan-400" />}
                            <span className="text-sm font-medium text-gray-200 capitalize">{channel}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-400">{data.events} events</span>
                            <span className="text-green-400">${data.revenue?.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                            style={{
                              width: `${Math.min(100, (data.engagementScore / 100) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Attribution Summary */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-100">Attribution Summary</CardTitle>
              <CardDescription className="text-gray-400">
                Total events and revenue by type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-gray-800 text-center">
                  <p className="text-2xl font-bold text-gray-100">
                    {combinedAnalytics?.attribution.byEventType?.click || 0}
                  </p>
                  <p className="text-sm text-gray-400">Clicks</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-800 text-center">
                  <p className="text-2xl font-bold text-gray-100">
                    {combinedAnalytics?.attribution.byEventType?.conversion || 0}
                  </p>
                  <p className="text-sm text-gray-400">Conversions</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-800 text-center">
                  <p className="text-2xl font-bold text-gray-100">
                    {combinedAnalytics?.attribution.total || 0}
                  </p>
                  <p className="text-sm text-gray-400">Total Events</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-800 text-center">
                  <p className="text-2xl font-bold text-green-400">
                    ${(combinedAnalytics?.attribution.totalRevenue || 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-400">Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-6">
          {/* Real-Time Analytics Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-100">Real-Time Channel Analytics</h2>
              <p className="text-sm text-gray-400">Live channel performance and trends</p>
            </div>
            <Button
              onClick={loadRealTimeData}
              disabled={!tenantId || loadingRealTime}
              variant="outline"
              className="border-gray-700"
            >
              {loadingRealTime ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Line Chart - Daily Trends */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <LineChart className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-gray-100">Daily Activity Trends</CardTitle>
                    <CardDescription className="text-gray-400">
                      Channel activity over the last 30 days
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {lineChartData.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="text-center">
                      <LineChart className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {tenantId ? 'No data available yet' : 'Enter tenant ID to load data'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <ChannelLineChart data={lineChartData} height={300} />
                )}
              </CardContent>
            </Card>

            {/* Bar Chart - Channel Totals */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-gray-100">Channel Comparison</CardTitle>
                    <CardDescription className="text-gray-400">
                      Total events by channel
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {barChartData.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {tenantId ? 'No data available yet' : 'Enter tenant ID to load data'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <ChannelBarChart data={barChartData} height={300} />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pie Chart - Distribution */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <PieChart className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-gray-100">Channel Distribution</CardTitle>
                  <CardDescription className="text-gray-400">
                    Event distribution across channels
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  {barChartData.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <div className="text-center">
                        <PieChart className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                        <p className="text-gray-500">
                          {tenantId ? 'No data available yet' : 'Enter tenant ID to load data'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <ChannelPieChart
                      data={barChartData.map((d) => ({ channel: d.channel, total: d.total }))}
                      height={300}
                    />
                  )}
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-200">Channel Breakdown</h4>
                  {barChartData.length === 0 ? (
                    <p className="text-gray-500">No data available</p>
                  ) : (
                    <div className="space-y-3">
                      {barChartData.map((channel) => (
                        <div
                          key={channel.channel}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-800 border border-gray-700"
                        >
                          <div className="flex items-center gap-3">
                            {channel.channel === 'Email' && <Mail className="h-4 w-4 text-blue-400" />}
                            {channel.channel === 'Sms' && <Send className="h-4 w-4 text-green-400" />}
                            {channel.channel === 'Social' && <Share2 className="h-4 w-4 text-purple-400" />}
                            {channel.channel === 'Push' && <Zap className="h-4 w-4 text-yellow-400" />}
                            {channel.channel === 'Web' && <MousePointer className="h-4 w-4 text-cyan-400" />}
                            <span className="text-sm font-medium text-gray-200">{channel.channel}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-100">{channel.total.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">events</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-400">Total Sends</p>
                <p className="text-2xl font-bold text-gray-100">
                  {barChartData.reduce((sum, c) => sum + c.sends, 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-400">Total Opens</p>
                <p className="text-2xl font-bold text-gray-100">
                  {barChartData.reduce((sum, c) => sum + c.opens, 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-400">Total Clicks</p>
                <p className="text-2xl font-bold text-gray-100">
                  {barChartData.reduce((sum, c) => sum + c.clicks, 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-400">Conversions</p>
                <p className="text-2xl font-bold text-green-400">
                  {barChartData.reduce((sum, c) => sum + c.conversions, 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictive" className="space-y-6">
          {/* Predictive Analytics Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-100">Predictive Intelligence</h2>
              <p className="text-sm text-gray-400">AI-powered send time optimization</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={loadPrediction}
                disabled={!tenantId || loadingPredictive}
                variant="outline"
                className="border-gray-700"
              >
                {loadingPredictive ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
              <Button
                onClick={generatePrediction}
                disabled={!tenantId || generatingPrediction}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {generatingPrediction ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Generate Prediction
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Best Time Card */}
          {sendTimePrediction ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 border-purple-700">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-purple-500/30 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <CardTitle className="text-gray-100">Best Send Time</CardTitle>
                      <CardDescription className="text-gray-400">
                        AI-recommended optimal time
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <p className="text-4xl font-bold text-white">
                      {formatHour(sendTimePrediction.bestHour)}
                    </p>
                    <p className="text-lg text-purple-300 mt-1">
                      {formatDay(sendTimePrediction.bestDay)}
                    </p>
                    <Badge className="mt-3 bg-purple-500/30 text-purple-300">
                      {sendTimePrediction.bestTimezone}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Gauge className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-gray-100">Confidence Score</CardTitle>
                      <CardDescription className="text-gray-400">
                        Model prediction accuracy
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <p className={`text-4xl font-bold ${getConfidenceColor(sendTimePrediction.confidence)}`}>
                      {Math.round(sendTimePrediction.confidence * 100)}%
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Based on {sendTimePrediction.dataPointsAnalyzed.toLocaleString()} data points
                    </p>
                    <div className="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                        style={{ width: `${sendTimePrediction.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-gray-100">Alternative Times</CardTitle>
                  <CardDescription className="text-gray-400">
                    Other high-performing slots
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sendTimePrediction.alternatives && sendTimePrediction.alternatives.length > 0 ? (
                    <div className="space-y-3">
                      {sendTimePrediction.alternatives.slice(0, 3).map((alt, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-800 border border-gray-700"
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-200">
                              {formatDay(alt.day)} {formatHour(alt.hour)}
                            </span>
                          </div>
                          <Badge className={alt.confidence >= 0.7 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                            {Math.round(alt.confidence * 100)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-gray-500">
                      No alternatives available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="py-16 text-center">
                <Brain className="h-16 w-16 text-gray-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">
                  No Prediction Available
                </h3>
                <p className="text-gray-500 max-w-md mx-auto mb-4">
                  {tenantId
                    ? 'Click "Generate Prediction" to analyze your engagement data and find the optimal send time.'
                    : 'Enter your tenant ID to generate predictions.'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Send Time Heatmap */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-gray-100">Engagement Heatmap</CardTitle>
                  <CardDescription className="text-gray-400">
                    Engagement patterns by day and hour
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {heatmapData.length > 0 ? (
                <SendTimeHeatmap
                  data={heatmapData}
                  bestHour={sendTimePrediction?.bestHour}
                  bestDay={sendTimePrediction ? ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].indexOf(sendTimePrediction.bestDay) : undefined}
                  height={320}
                />
              ) : (
                <div className="h-[320px] flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {tenantId ? 'Generate a prediction to see the heatmap' : 'Enter tenant ID to load data'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Reasoning */}
          {sendTimePrediction?.reasoning && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-gray-100">AI Analysis</CardTitle>
                    <CardDescription className="text-gray-400">
                      Reasoning behind the prediction
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 leading-relaxed">
                  {sendTimePrediction.reasoning}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="email">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-100">Email Analytics</CardTitle>
              <CardDescription className="text-gray-400">
                Email campaign performance
              </CardDescription>
            </CardHeader>
            <CardContent className="py-16 text-center">
              <Mail className="h-12 w-12 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500">Email-specific metrics available in Real-Time tab</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-100">Social Analytics</CardTitle>
              <CardDescription className="text-gray-400">
                Social media performance
              </CardDescription>
            </CardHeader>
            <CardContent className="py-16 text-center">
              <Share2 className="h-12 w-12 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500">Social-specific metrics available in Real-Time tab</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-100">SEO Analytics</CardTitle>
              <CardDescription className="text-gray-400">
                Search engine performance
              </CardDescription>
            </CardHeader>
            <CardContent className="py-16 text-center">
              <Search className="h-12 w-12 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500">SEO metrics coming in Phase B6</p>
              <Badge variant="secondary" className="mt-4">Phase B6</Badge>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
