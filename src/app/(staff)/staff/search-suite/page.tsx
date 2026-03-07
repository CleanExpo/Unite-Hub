'use client';

/**
 * Search Suite Page
 *
 * Unified search performance monitoring with GSC, Bing, and keyword tracking.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Search,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  Plus,
  Download,
  Upload,
  Bell,
  CheckCircle,
  Target,
  Globe,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';

type SearchEngine = 'google' | 'bing' | 'both';
type KeywordStatus = 'tracking' | 'paused' | 'archived';
type AlertSeverity = 'critical' | 'warning' | 'info';

interface TrackedKeyword {
  id: string;
  keyword: string;
  searchEngine: SearchEngine;
  currentRank: number | null;
  previousRank: number | null;
  change: number;
  searchVolume: number;
  difficulty: number;
  url: string | null;
  status: KeywordStatus;
  lastChecked: string;
}

interface Alert {
  id: string;
  type: 'ranking_drop' | 'ranking_gain' | 'volatility' | 'deindex';
  severity: AlertSeverity;
  keyword: string;
  message: string;
  createdAt: string;
  acknowledged: boolean;
}

interface KeywordStats {
  totalTracking: number;
  avgPosition: number;
  top10Count: number;
  top3Count: number;
  improvingCount: number;
  decliningCount: number;
}

interface VolatilitySummary {
  overallVolatility: 'low' | 'medium' | 'high';
  activeAlerts: number;
  affectedKeywords: number;
}

export default function SearchSuitePage() {
  const { currentOrganization, session } = useAuth();
  const workspaceId = currentOrganization?.org_id;

  const [keywords, setKeywords] = useState<TrackedKeyword[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<KeywordStats | null>(null);
  const [volatility, setVolatility] = useState<VolatilitySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [activeTab, setActiveTab] = useState('keywords');
  const [newKeyword, setNewKeyword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchKeywords = useCallback(async () => {
    if (!workspaceId || !session?.access_token) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/search-suite/keywords?projectId=${workspaceId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await response.json();
      if (data.data) setKeywords(data.data);
    } catch (error) {
      console.error('Failed to fetch keywords:', error);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, session?.access_token]);

  const fetchStats = useCallback(async () => {
    if (!workspaceId || !session?.access_token) return;
    try {
      const response = await fetch(`/api/search-suite/keywords?projectId=${workspaceId}&type=stats`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await response.json();
      if (data.stats) setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, [workspaceId, session?.access_token]);

  const fetchAlerts = useCallback(async () => {
    if (!workspaceId || !session?.access_token) return;
    try {
      const response = await fetch(`/api/search-suite/alerts?projectId=${workspaceId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await response.json();
      if (data.data) setAlerts(data.data);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  }, [workspaceId, session?.access_token]);

  const fetchVolatility = useCallback(async () => {
    if (!workspaceId || !session?.access_token) return;
    try {
      const response = await fetch(`/api/search-suite/alerts?projectId=${workspaceId}&type=summary`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await response.json();
      if (data.summary) setVolatility(data.summary);
    } catch (error) {
      console.error('Failed to fetch volatility:', error);
    }
  }, [workspaceId, session?.access_token]);

  useEffect(() => {
    fetchKeywords();
    fetchStats();
    fetchAlerts();
    fetchVolatility();
  }, [fetchKeywords, fetchStats, fetchAlerts, fetchVolatility]);

  const handleAddKeyword = async () => {
    if (!newKeyword.trim() || !workspaceId || !session?.access_token) return;
    try {
      const response = await fetch('/api/search-suite/keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'add',
          projectId: workspaceId,
          workspaceId,
          keywords: [{ keyword: newKeyword.trim(), searchEngine: 'both' as SearchEngine }],
        }),
      });
      if (response.ok) {
        setNewKeyword('');
        fetchKeywords();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to add keyword:', error);
    }
  };

  const handleCheckVolatility = async () => {
    if (!workspaceId || !session?.access_token) return;
    setIsChecking(true);
    try {
      await fetch('/api/search-suite/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'checkVolatility', projectId: workspaceId, workspaceId }),
      });
      await fetchAlerts();
      await fetchVolatility();
    } catch (error) {
      console.error('Failed to check volatility:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    if (!session?.access_token) return;
    try {
      await fetch('/api/search-suite/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'acknowledge', alertId }),
      });
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a)));
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const getRankChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="h-4 w-4" style={{ color: '#00FF88' }} />;
    if (change < 0) return <ArrowDown className="h-4 w-4" style={{ color: '#FF4444' }} />;
    return <Minus className="h-4 w-4 text-white/30" />;
  };

  const getVolatilityStyle = (level: string) => {
    switch (level) {
      case 'high': return 'border-[#FF4444]/30 text-[#FF4444]';
      case 'medium': return 'border-[#FFB800]/30 text-[#FFB800]';
      case 'low': return 'border-[#00FF88]/30 text-[#00FF88]';
      default: return 'border-white/10 text-white/40';
    }
  };

  const getSeverityStyle = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical': return 'border-[#FF4444]/30 text-[#FF4444]';
      case 'warning': return 'border-[#FFB800]/30 text-[#FFB800]';
      case 'info': return 'border-[#00F5FF]/30 text-[#00F5FF]';
      default: return 'border-white/10 text-white/40';
    }
  };

  const filteredKeywords = keywords.filter((k) => {
    if (!searchQuery) return true;
    return k.keyword.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged).length;

  const tabs = [
    { id: 'keywords', label: 'Keywords' },
    { id: 'alerts', label: `Alerts${unacknowledgedAlerts > 0 ? ` (${unacknowledgedAlerts})` : ''}` },
    { id: 'movers', label: 'Top Movers' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white font-mono">Search Suite</h1>
            <p className="text-white/40 font-mono text-sm mt-1">
              Track keyword rankings across Google and Bing with volatility alerts
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCheckVolatility}
              disabled={isChecking}
              className="bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-3 py-1.5 flex items-center gap-2 hover:bg-white/[0.06] disabled:opacity-50"
            >
              <Bell className={`h-4 w-4 ${isChecking ? 'animate-pulse' : ''}`} />
              Check Volatility
            </button>
            <button
              onClick={fetchKeywords}
              disabled={isLoading}
              className="bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-3 py-1.5 flex items-center gap-2 hover:bg-white/[0.06] disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[
            { label: 'Tracking', value: stats?.totalTracking || keywords.length, icon: <Target className="h-6 w-6" style={{ color: '#00F5FF' }} /> },
            { label: 'Avg. Position', value: stats?.avgPosition?.toFixed(1) || '-', icon: <BarChart3 className="h-6 w-6" style={{ color: '#FF00FF' }} /> },
            { label: 'Top 3', value: stats?.top3Count || 0, icon: <TrendingUp className="h-6 w-6" style={{ color: '#00FF88' }} /> },
            { label: 'Top 10', value: stats?.top10Count || 0, icon: <Globe className="h-6 w-6" style={{ color: '#00F5FF' }} /> },
            { label: 'Improving', value: stats?.improvingCount || 0, icon: <ArrowUp className="h-6 w-6" style={{ color: '#00FF88' }} />, valueColor: '#00FF88' },
            { label: 'Declining', value: stats?.decliningCount || 0, icon: <ArrowDown className="h-6 w-6" style={{ color: '#FF4444' }} />, valueColor: '#FF4444' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/40 font-mono">{stat.label}</p>
                  <p
                    className="text-2xl font-bold font-mono mt-1"
                    style={{ color: stat.valueColor || 'white' }}
                  >
                    {stat.value}
                  </p>
                </div>
                {stat.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Volatility Banner */}
        {volatility && volatility.overallVolatility !== 'low' && (
          <div className="bg-[#FFB800]/5 border border-[#FFB800]/30 rounded-sm p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6" style={{ color: '#FFB800' }} />
                <div>
                  <p className="font-mono font-medium text-white text-sm">
                    {volatility.overallVolatility === 'high' ? 'High' : 'Moderate'} SERP Volatility Detected
                  </p>
                  <p className="text-xs text-white/40 font-mono">
                    {volatility.affectedKeywords} keywords affected · {volatility.activeAlerts} active alerts
                  </p>
                </div>
              </div>
              <span className={`text-xs font-mono px-2 py-0.5 rounded-sm border ${getVolatilityStyle(volatility.overallVolatility)}`}>
                {volatility.overallVolatility} volatility
              </span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div>
          <div className="flex border-b border-white/[0.06] mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`font-mono text-sm px-4 py-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#00F5FF] text-[#00F5FF]'
                    : 'border-transparent text-white/40 hover:text-white/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Keywords Tab */}
          {activeTab === 'keywords' && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
              <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                <div>
                  <h2 className="font-mono text-white font-bold">Tracked Keywords</h2>
                  <p className="text-xs text-white/40 font-mono mt-0.5">Monitor your keyword rankings across search engines</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <input
                      placeholder="Search keywords..."
                      className="bg-white/[0.04] border border-white/[0.06] rounded-sm pl-9 pr-3 py-1.5 text-sm font-mono text-white placeholder-white/30 focus:outline-none focus:border-[#00F5FF]/40 w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button className="bg-white/[0.04] border border-white/[0.06] text-white/60 rounded-sm p-1.5 hover:bg-white/[0.08]">
                    <Upload className="h-4 w-4" />
                  </button>
                  <button className="bg-white/[0.04] border border-white/[0.06] text-white/60 rounded-sm p-1.5 hover:bg-white/[0.08]">
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                {/* Add Keyword */}
                <div className="flex gap-2 mb-4">
                  <input
                    placeholder="Add a keyword to track..."
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                    className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-sm px-3 py-2 text-sm font-mono text-white placeholder-white/30 focus:outline-none focus:border-[#00F5FF]/40"
                  />
                  <button
                    onClick={handleAddKeyword}
                    disabled={!newKeyword.trim()}
                    className="bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 flex items-center gap-2 hover:bg-[#00F5FF]/90 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </button>
                </div>

                {/* Keywords Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        {['Keyword', 'Engine', 'Position', 'Change', 'Volume', 'Difficulty', 'URL', 'Last Check'].map((h, i) => (
                          <th key={h} className={`py-3 px-4 font-mono text-xs text-white/40 font-normal ${i === 0 ? 'text-left' : i === 4 ? 'text-right' : 'text-center'}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredKeywords.map((kw) => (
                        <tr key={kw.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                          <td className="py-3 px-4">
                            <p className="font-mono font-medium text-white text-sm">{kw.keyword}</p>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-xs font-mono px-2 py-0.5 rounded-sm border border-white/10 text-white/40">
                              {kw.searchEngine}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {kw.currentRank ? (
                              <span
                                className="font-bold font-mono text-sm"
                                style={{
                                  color: kw.currentRank <= 3
                                    ? '#00FF88'
                                    : kw.currentRank <= 10
                                    ? '#00F5FF'
                                    : 'rgba(255,255,255,0.4)',
                                }}
                              >
                                #{kw.currentRank}
                              </span>
                            ) : (
                              <span className="text-white/30 font-mono text-sm">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {getRankChangeIcon(kw.change)}
                              {kw.change !== 0 && (
                                <span className="font-mono text-sm" style={{ color: kw.change > 0 ? '#00FF88' : '#FF4444' }}>
                                  {Math.abs(kw.change)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-sm text-white/60">{kw.searchVolume?.toLocaleString() || '-'}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${kw.difficulty}%`, backgroundColor: '#00F5FF' }}
                                />
                              </div>
                              <span className="text-xs font-mono text-white/60">{kw.difficulty}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {kw.url ? (
                              <span className="text-xs font-mono text-white/30 truncate max-w-48 block">{kw.url}</span>
                            ) : (
                              <span className="text-white/20 font-mono text-sm">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center text-xs font-mono text-white/30">
                            {kw.lastChecked ? new Date(kw.lastChecked).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      ))}
                      {filteredKeywords.length === 0 && (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-white/30 font-mono text-sm">
                            {keywords.length === 0
                              ? 'No keywords tracked yet. Add your first keyword above.'
                              : 'No keywords match your search.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
              <div className="p-4 border-b border-white/[0.06]">
                <h2 className="font-mono text-white font-bold">Volatility Alerts</h2>
                <p className="text-xs text-white/40 font-mono mt-0.5">Notifications about significant ranking changes and SERP volatility</p>
              </div>
              <div className="p-4 space-y-4">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 border border-white/[0.06] rounded-sm ${alert.acknowledged ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <AlertTriangle
                          className="h-5 w-5 mt-0.5"
                          style={{
                            color: alert.severity === 'critical' ? '#FF4444'
                              : alert.severity === 'warning' ? '#FFB800'
                              : '#00F5FF',
                          }}
                        />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-mono px-2 py-0.5 rounded-sm border ${getSeverityStyle(alert.severity)}`}>
                              {alert.severity}
                            </span>
                            <span className="text-xs font-mono px-2 py-0.5 rounded-sm border border-white/10 text-white/40">
                              {alert.type.replace('_', ' ')}
                            </span>
                            {alert.acknowledged && (
                              <span className="text-xs font-mono px-2 py-0.5 rounded-sm border border-[#00FF88]/30 text-[#00FF88] flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Acknowledged
                              </span>
                            )}
                          </div>
                          <p className="font-mono font-medium text-white text-sm">{alert.keyword}</p>
                          <p className="text-sm text-white/40 font-mono">{alert.message}</p>
                          <p className="text-xs text-white/20 font-mono mt-1">
                            {new Date(alert.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {!alert.acknowledged && (
                        <button
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                          className="bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-xs rounded-sm px-3 py-1.5 flex items-center gap-1 hover:bg-white/[0.06]"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {alerts.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4" style={{ color: '#00FF88' }} />
                    <p className="text-lg font-mono font-medium text-white">No alerts</p>
                    <p className="text-white/40 font-mono text-sm">
                      Your rankings are stable. We'll alert you when significant changes occur.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Movers Tab */}
          {activeTab === 'movers' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
                <div className="p-4 border-b border-white/[0.06]">
                  <h2 className="font-mono text-white font-bold flex items-center gap-2">
                    <ArrowUp className="h-5 w-5" style={{ color: '#00FF88' }} />
                    Top Gainers
                  </h2>
                  <p className="text-xs text-white/40 font-mono mt-0.5">Keywords with the biggest ranking improvements</p>
                </div>
                <div className="p-4 space-y-3">
                  {keywords
                    .filter((k) => k.change > 0)
                    .sort((a, b) => b.change - a.change)
                    .slice(0, 10)
                    .map((kw) => (
                      <div key={kw.id} className="flex items-center justify-between p-2 border border-white/[0.06] rounded-sm">
                        <div>
                          <p className="font-mono font-medium text-white text-sm">{kw.keyword}</p>
                          <p className="text-xs text-white/40 font-mono">
                            #{kw.previousRank} → #{kw.currentRank}
                          </p>
                        </div>
                        <span className="text-xs font-mono px-2 py-0.5 rounded-sm border border-[#00FF88]/30 text-[#00FF88]">
                          +{kw.change}
                        </span>
                      </div>
                    ))}
                  {keywords.filter((k) => k.change > 0).length === 0 && (
                    <p className="text-center text-white/30 font-mono text-sm py-4">No improving keywords</p>
                  )}
                </div>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
                <div className="p-4 border-b border-white/[0.06]">
                  <h2 className="font-mono text-white font-bold flex items-center gap-2">
                    <ArrowDown className="h-5 w-5" style={{ color: '#FF4444' }} />
                    Top Losers
                  </h2>
                  <p className="text-xs text-white/40 font-mono mt-0.5">Keywords with the biggest ranking drops</p>
                </div>
                <div className="p-4 space-y-3">
                  {keywords
                    .filter((k) => k.change < 0)
                    .sort((a, b) => a.change - b.change)
                    .slice(0, 10)
                    .map((kw) => (
                      <div key={kw.id} className="flex items-center justify-between p-2 border border-white/[0.06] rounded-sm">
                        <div>
                          <p className="font-mono font-medium text-white text-sm">{kw.keyword}</p>
                          <p className="text-xs text-white/40 font-mono">
                            #{kw.previousRank} → #{kw.currentRank}
                          </p>
                        </div>
                        <span className="text-xs font-mono px-2 py-0.5 rounded-sm border border-[#FF4444]/30 text-[#FF4444]">
                          {kw.change}
                        </span>
                      </div>
                    ))}
                  {keywords.filter((k) => k.change < 0).length === 0 && (
                    <p className="text-center text-white/30 font-mono text-sm py-4">No declining keywords</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
