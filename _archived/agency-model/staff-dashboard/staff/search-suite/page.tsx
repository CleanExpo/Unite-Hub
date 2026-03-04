'use client';

/**
 * Search Suite Page
 *
 * Unified search performance monitoring with GSC, Bing, and keyword tracking.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
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
      if (data.data) {
        setKeywords(data.data);
      }
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
      if (data.stats) {
        setStats(data.stats);
      }
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
      if (data.data) {
        setAlerts(data.data);
      }
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
      if (data.summary) {
        setVolatility(data.summary);
      }
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
        body: JSON.stringify({
          action: 'checkVolatility',
          projectId: workspaceId,
          workspaceId,
        }),
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
        body: JSON.stringify({
          action: 'acknowledge',
          alertId,
        }),
      });

      setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a)));
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const getRankChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <ArrowDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getVolatilityColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredKeywords = keywords.filter((k) => {
    if (!searchQuery) return true;
    return k.keyword.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Search Suite</h1>
          <p className="text-muted-foreground">
            Track keyword rankings across Google and Bing with volatility alerts
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCheckVolatility} disabled={isChecking}>
            <Bell className={`h-4 w-4 mr-2 ${isChecking ? 'animate-pulse' : ''}`} />
            Check Volatility
          </Button>
          <Button variant="outline" onClick={fetchKeywords} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tracking</p>
                <p className="text-2xl font-bold">{stats?.totalTracking || keywords.length}</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Position</p>
                <p className="text-2xl font-bold">{stats?.avgPosition?.toFixed(1) || '-'}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Top 3</p>
                <p className="text-2xl font-bold">{stats?.top3Count || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Top 10</p>
                <p className="text-2xl font-bold">{stats?.top10Count || 0}</p>
              </div>
              <Globe className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Improving</p>
                <p className="text-2xl font-bold text-green-600">{stats?.improvingCount || 0}</p>
              </div>
              <ArrowUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Declining</p>
                <p className="text-2xl font-bold text-red-600">{stats?.decliningCount || 0}</p>
              </div>
              <ArrowDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Volatility Banner */}
      {volatility && volatility.overallVolatility !== 'low' && (
        <Card className="mb-6 border-yellow-300 bg-yellow-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
                <div>
                  <p className="font-medium">
                    {volatility.overallVolatility === 'high' ? 'High' : 'Moderate'} SERP Volatility Detected
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {volatility.affectedKeywords} keywords affected • {volatility.activeAlerts} active alerts
                  </p>
                </div>
              </div>
              <Badge className={getVolatilityColor(volatility.overallVolatility)}>
                {volatility.overallVolatility} volatility
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts
            {unacknowledgedAlerts > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unacknowledgedAlerts}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="movers">Top Movers</TabsTrigger>
        </TabsList>

        <TabsContent value="keywords">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tracked Keywords</CardTitle>
                  <CardDescription>Monitor your keyword rankings across search engines</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search keywords..."
                      className="pl-9 w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Upload className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Add Keyword */}
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Add a keyword to track..."
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                />
                <Button onClick={handleAddKeyword} disabled={!newKeyword.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>

              {/* Keywords Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Keyword</th>
                      <th className="text-center py-3 px-4">Engine</th>
                      <th className="text-center py-3 px-4">Position</th>
                      <th className="text-center py-3 px-4">Change</th>
                      <th className="text-right py-3 px-4">Volume</th>
                      <th className="text-center py-3 px-4">Difficulty</th>
                      <th className="text-left py-3 px-4">URL</th>
                      <th className="text-center py-3 px-4">Last Check</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredKeywords.map((kw) => (
                      <tr key={kw.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <p className="font-medium">{kw.keyword}</p>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="outline">{kw.searchEngine}</Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {kw.currentRank ? (
                            <span
                              className={`font-bold ${
                                kw.currentRank <= 3
                                  ? 'text-green-600'
                                  : kw.currentRank <= 10
                                  ? 'text-blue-600'
                                  : 'text-gray-600'
                              }`}
                            >
                              #{kw.currentRank}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {getRankChangeIcon(kw.change)}
                            {kw.change !== 0 && (
                              <span className={kw.change > 0 ? 'text-green-600' : 'text-red-600'}>
                                {Math.abs(kw.change)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">{kw.searchVolume?.toLocaleString() || '-'}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Progress value={kw.difficulty} className="w-16 h-2" />
                            <span className="text-sm">{kw.difficulty}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {kw.url ? (
                            <span className="text-sm text-muted-foreground truncate max-w-48 block">{kw.url}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center text-sm text-muted-foreground">
                          {kw.lastChecked ? new Date(kw.lastChecked).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))}
                    {filteredKeywords.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-muted-foreground">
                          {keywords.length === 0
                            ? 'No keywords tracked yet. Add your first keyword above.'
                            : 'No keywords match your search.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Volatility Alerts</CardTitle>
              <CardDescription>Notifications about significant ranking changes and SERP volatility</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 border rounded-lg ${alert.acknowledged ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <AlertTriangle
                          className={`h-5 w-5 ${
                            alert.severity === 'critical'
                              ? 'text-red-600'
                              : alert.severity === 'warning'
                              ? 'text-yellow-600'
                              : 'text-blue-600'
                          }`}
                        />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                            <Badge variant="outline">{alert.type.replace('_', ' ')}</Badge>
                            {alert.acknowledged && (
                              <Badge variant="secondary">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Acknowledged
                              </Badge>
                            )}
                          </div>
                          <p className="font-medium">{alert.keyword}</p>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(alert.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {!alert.acknowledged && (
                        <Button variant="ghost" size="sm" onClick={() => handleAcknowledgeAlert(alert.id)}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {alerts.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                    <p className="text-lg font-medium">No alerts</p>
                    <p className="text-muted-foreground">
                      Your rankings are stable. We'll alert you when significant changes occur.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movers">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUp className="h-5 w-5 text-green-600" />
                  Top Gainers
                </CardTitle>
                <CardDescription>Keywords with the biggest ranking improvements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {keywords
                    .filter((k) => k.change > 0)
                    .sort((a, b) => b.change - a.change)
                    .slice(0, 10)
                    .map((kw) => (
                      <div key={kw.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">{kw.keyword}</p>
                          <p className="text-sm text-muted-foreground">
                            #{kw.previousRank} → #{kw.currentRank}
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">+{kw.change}</Badge>
                      </div>
                    ))}
                  {keywords.filter((k) => k.change > 0).length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No improving keywords</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowDown className="h-5 w-5 text-red-600" />
                  Top Losers
                </CardTitle>
                <CardDescription>Keywords with the biggest ranking drops</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {keywords
                    .filter((k) => k.change < 0)
                    .sort((a, b) => a.change - b.change)
                    .slice(0, 10)
                    .map((kw) => (
                      <div key={kw.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">{kw.keyword}</p>
                          <p className="text-sm text-muted-foreground">
                            #{kw.previousRank} → #{kw.currentRank}
                          </p>
                        </div>
                        <Badge className="bg-red-100 text-red-800">{kw.change}</Badge>
                      </div>
                    ))}
                  {keywords.filter((k) => k.change < 0).length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No declining keywords</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
