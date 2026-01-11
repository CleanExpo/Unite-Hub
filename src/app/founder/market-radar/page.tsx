/**
 * Market Radar Dashboard
 *
 * Phase: D45 - Market Radar (Signals, Competitors, and Pivot Engine)
 *
 * Features:
 * - Market signals monitoring
 * - Competitor tracking and analysis
 * - AI-generated recommendations
 * - Trend scanning
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Radar,
  Plus,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Eye,
  Building2,
  Lightbulb,
  Sparkles,
  RefreshCw,
  X,
  ChevronRight,
  Target,
  Zap,
  Shield,
  Search,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { PageContainer, Section } from '@/ui/layout/AppGrid';

// Types
interface Signal {
  id: string;
  signal_type: string;
  title: string;
  summary?: string;
  strength: number;
  confidence: number;
  direction: string;
  impact_score?: number;
  urgency_score?: number;
  acknowledged: boolean;
  created_at: string;
}

interface Competitor {
  id: string;
  name: string;
  website_url?: string;
  positioning?: string;
  threat_level: number;
  watch_priority: string;
  strengths: unknown[];
  weaknesses: unknown[];
  created_at: string;
}

interface Recommendation {
  id: string;
  category: string;
  priority: string;
  status: string;
  title: string;
  recommendation: string;
  expected_impact?: string;
  estimated_effort?: string;
  time_horizon?: string;
  created_at: string;
}

interface MarketSummary {
  total_signals: number;
  unacknowledged_signals: number;
  high_impact_signals: number;
  total_competitors: number;
  high_threat_competitors: number;
  open_recommendations: number;
  critical_recommendations: number;
  recent_signals: Signal[];
  top_competitors: Competitor[];
  priority_recommendations: Recommendation[];
}

interface CompetitorAnalysis {
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  competitive_advantages: string[];
  attack_vectors: string[];
  defense_strategies: string[];
  threat_assessment: string;
}

export default function MarketRadarPage() {
  const [summary, setSummary] = useState<MarketSummary | null>(null);
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);
  const [competitorAnalysis, setCompetitorAnalysis] = useState<CompetitorAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Modals
  const [showAddCompetitor, setShowAddCompetitor] = useState(false);
  const [showAddSignal, setShowAddSignal] = useState(false);
  const [showScanTrends, setShowScanTrends] = useState(false);

  // Form state
  const [newCompetitor, setNewCompetitor] = useState({
    name: '',
    website_url: '',
    positioning: '',
    threat_level: 50,
    watch_priority: 'medium',
  });
  const [newSignal, setNewSignal] = useState({
    title: '',
    summary: '',
    signal_type: 'trend',
    strength: 50,
    direction: 'neutral',
  });
  const [scanParams, setScanParams] = useState({
    industry: '',
    keywords: '',
  });

  const tenantId = 'demo-tenant-id';

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/synthex/market-radar?tenantId=${tenantId}`);
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleAddCompetitor = async () => {
    try {
      const res = await fetch('/api/synthex/market-radar/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          name: newCompetitor.name,
          website_url: newCompetitor.website_url,
          positioning: newCompetitor.positioning,
          threat_level: newCompetitor.threat_level,
          watch_priority: newCompetitor.watch_priority,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddCompetitor(false);
        setNewCompetitor({
          name: '',
          website_url: '',
          positioning: '',
          threat_level: 50,
          watch_priority: 'medium',
        });
        await fetchSummary();
      }
    } catch (error) {
      console.error('Error adding competitor:', error);
    }
  };

  const handleAddSignal = async () => {
    try {
      const res = await fetch('/api/synthex/market-radar/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          title: newSignal.title,
          summary: newSignal.summary,
          signal_type: newSignal.signal_type,
          strength: newSignal.strength,
          direction: newSignal.direction,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddSignal(false);
        setNewSignal({
          title: '',
          summary: '',
          signal_type: 'trend',
          strength: 50,
          direction: 'neutral',
        });
        await fetchSummary();
      }
    } catch (error) {
      console.error('Error adding signal:', error);
    }
  };

  const handleScanTrends = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/synthex/market-radar/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          action: 'scan',
          industry: scanParams.industry,
          keywords: scanParams.keywords.split(',').map(k => k.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowScanTrends(false);
        setScanParams({ industry: '', keywords: '' });
        await fetchSummary();
      }
    } catch (error) {
      console.error('Error scanning trends:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const handleAnalyzeCompetitor = async (competitor: Competitor) => {
    setSelectedCompetitor(competitor);
    setIsAnalyzing(true);
    setCompetitorAnalysis(null);
    try {
      const res = await fetch(`/api/synthex/market-radar/competitors/${competitor.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze' }),
      });
      const data = await res.json();
      if (data.success) {
        setCompetitorAnalysis(data.analysis);
      }
    } catch (error) {
      console.error('Error analyzing competitor:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateRecommendations = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/synthex/market-radar/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          action: 'generate',
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchSummary();
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcknowledgeSignal = async (signalId: string) => {
    try {
      await fetch('/api/synthex/market-radar/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          action: 'acknowledge',
          signalId,
        }),
      });
      await fetchSummary();
    } catch (error) {
      console.error('Error acknowledging signal:', error);
    }
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'bullish': return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'bearish': return <TrendingDown className="w-4 h-4 text-red-400" />;
      case 'volatile': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default: return <Target className="w-4 h-4 text-slate-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500/20 text-red-400';
      case 'high': return 'bg-orange-500/20 text-orange-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'low': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getThreatColor = (level: number) => {
    if (level >= 80) return 'text-red-400';
    if (level >= 60) return 'text-orange-400';
    if (level >= 40) return 'text-yellow-400';
    return 'text-emerald-400';
  };

  return (
    <PageContainer>
      <Section>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Radar className="w-8 h-8 text-cyan-400" />
              Market Radar
            </h1>
            <p className="text-slate-400 mt-1">
              Monitor market signals, track competitors, and discover opportunities
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowScanTrends(true)}
              className="bg-slate-700 hover:bg-slate-600"
            >
              <Search className="w-4 h-4 mr-2" />
              Scan Trends
            </Button>
            <Button
              onClick={handleGenerateRecommendations}
              disabled={isGenerating}
              className="bg-cyan-600 hover:bg-cyan-500"
            >
              <Sparkles className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-pulse' : ''}`} />
              Generate Insights
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className="bg-slate-800/50 border-slate-700 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Active Signals</span>
                  <Zap className="w-5 h-5 text-yellow-400" />
                </div>
                <p className="text-2xl font-bold text-white mt-2">
                  {summary?.total_signals || 0}
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  {summary?.unacknowledged_signals || 0} unacknowledged
                </p>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">High Impact</span>
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <p className="text-2xl font-bold text-white mt-2">
                  {summary?.high_impact_signals || 0}
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  Signals requiring attention
                </p>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Competitors</span>
                  <Building2 className="w-5 h-5 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-white mt-2">
                  {summary?.total_competitors || 0}
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  {summary?.high_threat_competitors || 0} high threat
                </p>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Recommendations</span>
                  <Lightbulb className="w-5 h-5 text-cyan-400" />
                </div>
                <p className="text-2xl font-bold text-white mt-2">
                  {summary?.open_recommendations || 0}
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  {summary?.critical_recommendations || 0} critical
                </p>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Market Signals */}
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    Market Signals
                  </h2>
                  <Button
                    size="sm"
                    onClick={() => setShowAddSignal(true)}
                    className="bg-slate-700 hover:bg-slate-600"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {summary?.recent_signals && summary.recent_signals.length > 0 ? (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {summary.recent_signals.map((signal) => (
                      <div
                        key={signal.id}
                        className={`p-3 rounded-lg border ${
                          signal.acknowledged
                            ? 'bg-slate-700/30 border-slate-700'
                            : 'bg-slate-700/50 border-yellow-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white text-sm truncate flex-1">
                            {signal.title}
                          </span>
                          {getDirectionIcon(signal.direction)}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">
                            {signal.signal_type} • Strength: {signal.strength}
                          </span>
                          {!signal.acknowledged && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleAcknowledgeSignal(signal.id)}
                              className="h-6 px-2 text-xs"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Ack
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No signals yet</p>
                    <Button
                      size="sm"
                      onClick={() => setShowScanTrends(true)}
                      className="mt-3 bg-cyan-600 hover:bg-cyan-500"
                    >
                      Scan for Trends
                    </Button>
                  </div>
                )}
              </Card>

              {/* Competitors */}
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-400" />
                    Competitors
                  </h2>
                  <Button
                    size="sm"
                    onClick={() => setShowAddCompetitor(true)}
                    className="bg-slate-700 hover:bg-slate-600"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {summary?.top_competitors && summary.top_competitors.length > 0 ? (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {summary.top_competitors.map((competitor) => (
                      <div
                        key={competitor.id}
                        onClick={() => handleAnalyzeCompetitor(competitor)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedCompetitor?.id === competitor.id
                            ? 'bg-blue-500/20 border-blue-500'
                            : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white">{competitor.name}</span>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className={`font-medium ${getThreatColor(competitor.threat_level)}`}>
                            Threat: {competitor.threat_level}%
                          </span>
                          <span className={`px-2 py-0.5 rounded ${getPriorityColor(competitor.watch_priority)}`}>
                            {competitor.watch_priority}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No competitors tracked</p>
                    <Button
                      size="sm"
                      onClick={() => setShowAddCompetitor(true)}
                      className="mt-3 bg-blue-600 hover:bg-blue-500"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Competitor
                    </Button>
                  </div>
                )}
              </Card>

              {/* Competitor Analysis / Recommendations */}
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                {selectedCompetitor ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-white">
                        {selectedCompetitor.name}
                      </h2>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedCompetitor(null);
                          setCompetitorAnalysis(null);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    {isAnalyzing ? (
                      <div className="flex items-center justify-center py-10">
                        <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
                      </div>
                    ) : competitorAnalysis ? (
                      <div className="space-y-4 max-h-[400px] overflow-y-auto">
                        {/* SWOT */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <div className="text-emerald-400 text-xs font-medium mb-1">Strengths</div>
                            <ul className="text-xs text-slate-300 space-y-0.5">
                              {competitorAnalysis.swot.strengths.slice(0, 3).map((s, i) => (
                                <li key={i} className="truncate">• {s}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="p-2 bg-red-500/10 rounded-lg">
                            <div className="text-red-400 text-xs font-medium mb-1">Weaknesses</div>
                            <ul className="text-xs text-slate-300 space-y-0.5">
                              {competitorAnalysis.swot.weaknesses.slice(0, 3).map((w, i) => (
                                <li key={i} className="truncate">• {w}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Attack Vectors */}
                        <div>
                          <div className="flex items-center gap-2 text-cyan-400 text-sm font-medium mb-2">
                            <Target className="w-4 h-4" />
                            How to Compete
                          </div>
                          <ul className="text-xs text-slate-300 space-y-1">
                            {competitorAnalysis.attack_vectors.slice(0, 3).map((v, i) => (
                              <li key={i}>• {v}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Defense */}
                        <div>
                          <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium mb-2">
                            <Shield className="w-4 h-4" />
                            Defense Strategies
                          </div>
                          <ul className="text-xs text-slate-300 space-y-1">
                            {competitorAnalysis.defense_strategies.slice(0, 3).map((d, i) => (
                              <li key={i}>• {d}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Assessment */}
                        <div className="p-3 bg-slate-700/50 rounded-lg">
                          <div className="text-slate-400 text-xs font-medium mb-1">Assessment</div>
                          <p className="text-sm text-slate-300">
                            {competitorAnalysis.threat_assessment}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-10 text-slate-400">
                        <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Click Analyze to get AI insights</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
                      <Lightbulb className="w-5 h-5 text-cyan-400" />
                      Recommendations
                    </h2>
                    {summary?.priority_recommendations && summary.priority_recommendations.length > 0 ? (
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {summary.priority_recommendations.map((rec) => (
                          <div
                            key={rec.id}
                            className="p-3 bg-slate-700/50 rounded-lg border border-slate-600"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-0.5 rounded text-xs ${getPriorityColor(rec.priority)}`}>
                                {rec.priority}
                              </span>
                              <span className="text-slate-400 text-xs">{rec.category}</span>
                            </div>
                            <p className="text-white text-sm font-medium mb-1">{rec.title}</p>
                            <p className="text-slate-400 text-xs line-clamp-2">{rec.recommendation}</p>
                            {rec.time_horizon && (
                              <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                                <Clock className="w-3 h-3" />
                                {rec.time_horizon.replace('_', ' ')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No recommendations yet</p>
                        <Button
                          size="sm"
                          onClick={handleGenerateRecommendations}
                          disabled={isGenerating}
                          className="mt-3 bg-cyan-600 hover:bg-cyan-500"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Insights
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </Card>
            </div>
          </>
        )}

        {/* Add Competitor Modal */}
        {showAddCompetitor && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="bg-slate-800 border-slate-700 p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Add Competitor</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowAddCompetitor(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Company Name</label>
                  <Input
                    value={newCompetitor.name}
                    onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })}
                    placeholder="e.g., Acme Corp"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Website</label>
                  <Input
                    value={newCompetitor.website_url}
                    onChange={(e) => setNewCompetitor({ ...newCompetitor, website_url: e.target.value })}
                    placeholder="https://example.com"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Positioning</label>
                  <Input
                    value={newCompetitor.positioning}
                    onChange={(e) => setNewCompetitor({ ...newCompetitor, positioning: e.target.value })}
                    placeholder="How they position themselves"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-slate-400 block mb-1">Threat Level</label>
                    <Input
                      type="number"
                      value={newCompetitor.threat_level}
                      onChange={(e) => setNewCompetitor({ ...newCompetitor, threat_level: parseInt(e.target.value) || 50 })}
                      min={0}
                      max={100}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 block mb-1">Priority</label>
                    <select
                      value={newCompetitor.watch_priority}
                      onChange={(e) => setNewCompetitor({ ...newCompetitor, watch_priority: e.target.value })}
                      className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                    >
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>
                <Button
                  onClick={handleAddCompetitor}
                  disabled={!newCompetitor.name}
                  className="w-full bg-blue-600 hover:bg-blue-500"
                >
                  Add Competitor
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Add Signal Modal */}
        {showAddSignal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="bg-slate-800 border-slate-700 p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Add Signal</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowAddSignal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Title</label>
                  <Input
                    value={newSignal.title}
                    onChange={(e) => setNewSignal({ ...newSignal, title: e.target.value })}
                    placeholder="Signal title"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Summary</label>
                  <textarea
                    value={newSignal.summary}
                    onChange={(e) => setNewSignal({ ...newSignal, summary: e.target.value })}
                    placeholder="Brief description"
                    className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white min-h-[80px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-slate-400 block mb-1">Type</label>
                    <select
                      value={newSignal.signal_type}
                      onChange={(e) => setNewSignal({ ...newSignal, signal_type: e.target.value })}
                      className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                    >
                      <option value="trend">Trend</option>
                      <option value="opportunity">Opportunity</option>
                      <option value="threat">Threat</option>
                      <option value="technology">Technology</option>
                      <option value="market_shift">Market Shift</option>
                      <option value="competitor">Competitor</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 block mb-1">Direction</label>
                    <select
                      value={newSignal.direction}
                      onChange={(e) => setNewSignal({ ...newSignal, direction: e.target.value })}
                      className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                    >
                      <option value="bullish">Bullish</option>
                      <option value="bearish">Bearish</option>
                      <option value="neutral">Neutral</option>
                      <option value="volatile">Volatile</option>
                    </select>
                  </div>
                </div>
                <Button
                  onClick={handleAddSignal}
                  disabled={!newSignal.title}
                  className="w-full bg-yellow-600 hover:bg-yellow-500"
                >
                  Add Signal
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Scan Trends Modal */}
        {showScanTrends && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="bg-slate-800 border-slate-700 p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Scan Market Trends</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowScanTrends(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Industry</label>
                  <Input
                    value={scanParams.industry}
                    onChange={(e) => setScanParams({ ...scanParams, industry: e.target.value })}
                    placeholder="e.g., SaaS, E-commerce, Healthcare"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Keywords (comma-separated)</label>
                  <Input
                    value={scanParams.keywords}
                    onChange={(e) => setScanParams({ ...scanParams, keywords: e.target.value })}
                    placeholder="e.g., AI, automation, pricing"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <Button
                  onClick={handleScanTrends}
                  disabled={!scanParams.industry || isScanning}
                  className="w-full bg-cyan-600 hover:bg-cyan-500"
                >
                  {isScanning ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Scan for Trends
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </Section>
    </PageContainer>
  );
}
