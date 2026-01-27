'use client';

/**
 * Synthex Market Radar Page
 *
 * Competitor monitoring dashboard:
 * - Watch list of competitor domains
 * - Latest snapshot metrics
 * - Alert feed for significant changes
 * - Add/remove competitors
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Radar,
  Plus,
  Globe,
  TrendingUp,
  TrendingDown,
  Bell,
  BellOff,
  Eye,
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  Search,
} from 'lucide-react';

interface Watch {
  id: string;
  domain: string;
  display_name: string;
  industry: string | null;
  status: string;
  last_checked_at: string | null;
  monitor_seo: boolean;
  monitor_content: boolean;
  created_at: string;
}

interface Alert {
  id: string;
  watch_id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string | null;
  is_read: boolean;
  created_at: string;
  synthex_market_radar_watches?: { domain: string; display_name: string };
}

interface Snapshot {
  id: string;
  watch_id: string;
  domain: string;
  authority_score: number | null;
  organic_keywords: number | null;
  estimated_traffic: number | null;
  backlinks: number | null;
  created_at: string;
}

export default function MarketRadarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get('tenantId');

  const [watches, setWatches] = useState<Watch[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [snapshots, setSnapshots] = useState<Record<string, Snapshot>>({});
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [addError, setAddError] = useState('');

  const fetchData = useCallback(async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const headers = { Authorization: `Bearer ${session.access_token}` };

      const [watchRes, alertRes] = await Promise.all([
        fetch(`/api/synthex/market-radar/watches?tenantId=${tenantId}`, { headers }),
        fetch(`/api/synthex/market-radar/alerts?tenantId=${tenantId}&limit=20`, { headers }),
      ]);

      if (watchRes.ok) {
        const { watches: w } = await watchRes.json();
        setWatches(w || []);
      }
      if (alertRes.ok) {
        const { alerts: a } = await alertRes.json();
        setAlerts(a || []);
      }
    } catch (err) {
      console.error('Market radar fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId) {
      router.push('/synthex/onboarding');
      return;
    }
    fetchData();
  }, [tenantId, fetchData, router]);

  const handleAddWatch = async () => {
    if (!newDomain.trim() || !tenantId) return;
    setAddError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/synthex/market-radar/watches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          tenantId,
          domain: newDomain.trim(),
          displayName: newDisplayName.trim() || undefined,
        }),
      });

      if (res.status === 409) {
        setAddError('This domain is already being watched');
        return;
      }
      if (!res.ok) {
        const err = await res.json();
        setAddError(err.error || 'Failed to add competitor');
        return;
      }

      setNewDomain('');
      setNewDisplayName('');
      setShowAddForm(false);
      fetchData();
    } catch {
      setAddError('Network error');
    }
  };

  const handleAnalyze = async (watchId: string) => {
    if (!tenantId) return;
    setAnalyzing(watchId);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/synthex/market-radar/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ tenantId, watchId }),
      });

      if (res.ok) {
        const result = await res.json();
        setSnapshots(prev => ({
          ...prev,
          [watchId]: result.snapshot,
        }));
        fetchData();
      }
    } catch (err) {
      console.error('Analyze error:', err);
    } finally {
      setAnalyzing(null);
    }
  };

  const handleMarkAllRead = async () => {
    if (!tenantId) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch('/api/synthex/market-radar/alerts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ tenantId, markAllRead: true }),
      });
      fetchData();
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  };

  const severityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      default: return <Info className="h-4 w-4 text-blue-400" />;
    }
  };

  const severityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-500/20 text-red-300 border-red-500/30',
      warning: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      info: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    };
    return colors[severity] || colors.info;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const unreadAlerts = alerts.filter(a => !a.is_read);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <Radar className="h-6 w-6 text-emerald-400" />
            Market Radar
          </h1>
          <p className="text-gray-400 mt-1">
            Monitor competitors, track changes, stay ahead
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Competitor
        </Button>
      </div>

      {/* Add Competitor Form */}
      {showAddForm && (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="competitor.com"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="Display name (optional)"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddWatch} className="bg-emerald-600 hover:bg-emerald-700">
                  <Search className="h-4 w-4 mr-1" /> Watch
                </Button>
                <Button variant="ghost" onClick={() => { setShowAddForm(false); setAddError(''); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {addError && (
              <p className="text-red-400 text-sm mt-2">{addError}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6 text-center">
            <Eye className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-100">{watches.length}</p>
            <p className="text-xs text-gray-500">Competitors Tracked</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6 text-center">
            <Bell className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-100">{unreadAlerts.length}</p>
            <p className="text-xs text-gray-500">Unread Alerts</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6 text-center">
            <TrendingUp className="h-6 w-6 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-100">{alerts.filter(a => a.alert_type === 'traffic_spike').length}</p>
            <p className="text-xs text-gray-500">Traffic Changes</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6 text-center">
            <Globe className="h-6 w-6 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-100">{alerts.filter(a => a.alert_type === 'ranking_change').length}</p>
            <p className="text-xs text-gray-500">Ranking Changes</p>
          </CardContent>
        </Card>
      </div>

      {/* Competitor Watch List */}
      <div>
        <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
          <Eye className="h-5 w-5 text-emerald-400" />
          Watch List
        </h2>

        {watches.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-8 pb-8 text-center">
              <Radar className="h-10 w-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-2">No competitors being tracked</p>
              <p className="text-sm text-gray-500">
                Add a competitor domain to start monitoring their online presence
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {watches.map(watch => {
              const snap = snapshots[watch.id];
              return (
                <Card key={watch.id} className="bg-gray-900 border-gray-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-gray-100 text-base flex items-center gap-2">
                          <Globe className="h-4 w-4 text-emerald-400" />
                          {watch.display_name || watch.domain}
                        </CardTitle>
                        <CardDescription className="text-gray-500 text-xs mt-1">
                          {watch.domain}
                        </CardDescription>
                      </div>
                      <Badge
                        variant="outline"
                        className={watch.status === 'active'
                          ? 'text-emerald-300 border-emerald-500/30'
                          : 'text-gray-500 border-gray-700'
                        }
                      >
                        {watch.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {snap ? (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-500 text-xs">Authority</p>
                          <p className="text-gray-200 font-medium">{snap.authority_score ?? '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Traffic</p>
                          <p className="text-gray-200 font-medium">
                            {snap.estimated_traffic ? snap.estimated_traffic.toLocaleString() : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Keywords</p>
                          <p className="text-gray-200 font-medium">
                            {snap.organic_keywords ? snap.organic_keywords.toLocaleString() : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Backlinks</p>
                          <p className="text-gray-200 font-medium">
                            {snap.backlinks ? snap.backlinks.toLocaleString() : '-'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No analysis run yet</p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                      <span className="text-xs text-gray-500">
                        {watch.last_checked_at
                          ? `Checked ${new Date(watch.last_checked_at).toLocaleDateString()}`
                          : 'Never checked'
                        }
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAnalyze(watch.id)}
                        disabled={analyzing === watch.id}
                        className="text-emerald-400 hover:text-emerald-300"
                      >
                        {analyzing === watch.id ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <RefreshCw className="h-3 w-3 mr-1" />
                        )}
                        Analyze
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Alerts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
            <Bell className="h-5 w-5 text-yellow-400" />
            Recent Alerts
            {unreadAlerts.length > 0 && (
              <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 ml-2">
                {unreadAlerts.length} new
              </Badge>
            )}
          </h2>
          {unreadAlerts.length > 0 && (
            <Button size="sm" variant="ghost" onClick={handleMarkAllRead} className="text-gray-400">
              <BellOff className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {alerts.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-8 pb-8 text-center">
              <CheckCircle2 className="h-10 w-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No alerts yet</p>
              <p className="text-sm text-gray-500">
                Alerts appear when significant changes are detected in competitor metrics
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {alerts.slice(0, 10).map(alert => (
              <Card
                key={alert.id}
                className={`bg-gray-900 border-gray-800 ${!alert.is_read ? 'border-l-2 border-l-yellow-500' : ''}`}
              >
                <CardContent className="py-3 flex items-start gap-3">
                  {severityIcon(alert.severity)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-200 truncate">{alert.title}</p>
                      <Badge variant="outline" className={`text-xs ${severityBadge(alert.severity)}`}>
                        {alert.severity}
                      </Badge>
                    </div>
                    {alert.description && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{alert.description}</p>
                    )}
                    <p className="text-xs text-gray-600 mt-1">
                      {alert.synthex_market_radar_watches?.display_name || 'Unknown'} &middot;{' '}
                      {new Date(alert.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
