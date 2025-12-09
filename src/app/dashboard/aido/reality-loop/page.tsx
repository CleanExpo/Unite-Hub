'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Zap,
  RefreshCw,
  Copy,
  CheckCircle,
  Clock,
  AlertCircle,
  MapPin,
  ExternalLink,
  Loader2,
  Activity,
  Calendar
} from 'lucide-react';

interface RealityEvent {
  id: string;
  eventType: string;
  sourceSystem: string;
  sourceId: string;
  timestamp: string;
  location?: string;
  rawPayload: any;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  contentGenerated: boolean;
  linkedContentId?: string;
  aiInsights?: string;
  createdAt: string;
}

interface EventStats {
  total: number;
  byType: Record<string, number>;
  byStatus: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
  contentGenerationRate: number;
  last24Hours: number;
}

export default function RealityLoopPage() {
  const { currentOrganization } = useAuth();
  const [events, setEvents] = useState<RealityEvent[]>([]);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (currentOrganization?.org_id) {
      fetchEvents();
      generateWebhookUrl();
    }
  }, [currentOrganization]);

  const generateWebhookUrl = () => {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/api/aido/reality-loop/ingest?workspaceId=${currentOrganization?.org_id}`;
    setWebhookUrl(url);
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const session = await (await import('@/lib/supabase')).supabaseBrowser.auth.getSession();
      const token = session.data.session?.access_token;

      const params = new URLSearchParams({
        workspaceId: currentOrganization!.org_id
      });

      const response = await fetch(`/api/aido/reality-loop/events?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        setEvents(data.events);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPending = async () => {
    setProcessing(true);
    try {
      const session = await (await import('@/lib/supabase')).supabaseBrowser.auth.getSession();
      const token = session.data.session?.access_token;

      const params = new URLSearchParams({
        workspaceId: currentOrganization!.org_id
      });

      const response = await fetch(`/api/aido/reality-loop/process?${params}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        alert(`Processed ${data.processed} events successfully`);
        fetchEvents();
      } else {
        alert(data.error || 'Failed to process events');
      }
    } catch (error) {
      console.error('Failed to process events:', error);
      alert('Failed to process events');
    } finally {
      setProcessing(false);
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getEventTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      gmb_interaction: 'GMB Interaction',
      customer_call: 'Customer Call',
      service_completion: 'Service Completion',
      review_received: 'Review Received',
      quote_sent: 'Quote Sent',
      project_milestone: 'Project Milestone'
    };
    return labels[type] || type;
  };

  const getEventTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      gmb_interaction: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      customer_call: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      service_completion: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      review_received: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      quote_sent: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      project_milestone: 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: any }> = {
      pending: { color: 'bg-gray-500', icon: Clock },
      processing: { color: 'bg-yellow-500', icon: Loader2 },
      completed: { color: 'bg-green-500', icon: CheckCircle },
      failed: { color: 'bg-red-500', icon: AlertCircle }
    };

    const variant = variants[status] || variants.pending;
    const Icon = variant.icon;

    return (
      <Badge className={`${variant.color} text-white`}>
        <Icon className={`w-3 h-3 mr-1 ${status === 'processing' ? 'animate-spin' : ''}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) {
return 'Just now';
}
    if (diffMins < 60) {
return `${diffMins}m ago`;
}
    if (diffMins < 1440) {
return `${Math.floor(diffMins / 60)}h ago`;
}
    return date.toLocaleDateString();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reality-Loop Console</h1>
          <p className="text-text-secondary mt-1">
            Convert real-world events into content opportunities automatically
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchEvents} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleProcessPending}
            disabled={processing || !stats || stats.byStatus.pending === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Process Pending ({stats?.byStatus.pending || 0})
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Activity className="w-4 h-4 mr-2" />
                Total Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
              <p className="text-xs text-gray-500 mt-2">
                {stats.last24Hours} in last 24h
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {stats.byStatus.completed}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {stats.byStatus.pending}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Loader2 className="w-4 h-4 mr-2" />
                Processing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {stats.byStatus.processing}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Zap className="w-4 h-4 mr-2" />
                Content Gen Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {stats.contentGenerationRate.toFixed(0)}%
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Events → Content
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Webhook Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="webhookUrl">Webhook Endpoint URL</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="webhookUrl"
                value={webhookUrl}
                readOnly
                className="flex-1 font-mono text-sm"
              />
              <Button variant="outline" onClick={copyWebhookUrl}>
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Configure this URL in your GMB, CRM, or phone system to send events automatically
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-2">
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
              Supported Event Types:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-blue-700 dark:text-blue-300">
              <div>• GMB Interaction</div>
              <div>• Customer Call</div>
              <div>• Service Completion</div>
              <div>• Review Received</div>
              <div>• Quote Sent</div>
              <div>• Project Milestone</div>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              POST events as JSON with: eventType, sourceSystem, sourceId, timestamp, rawPayload
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Event Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Event Feed ({events.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <Loader2 className="w-8 h-8 mx-auto animate-spin mb-4" />
              Loading events...
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-2">No events yet</p>
              <p className="text-sm text-gray-400 mb-4">
                Configure your webhook to start ingesting real-world events
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <Card key={event.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        {/* Header */}
                        <div className="flex items-center gap-3">
                          <Badge className={getEventTypeColor(event.eventType)}>
                            {getEventTypeLabel(event.eventType)}
                          </Badge>
                          {getStatusBadge(event.processingStatus)}
                          {event.contentGenerated && (
                            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                              <Zap className="w-3 h-3 mr-1" />
                              Content Generated
                            </Badge>
                          )}
                        </div>

                        {/* Metadata */}
                        <div className="flex gap-4 text-sm text-text-secondary">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatTimestamp(event.timestamp)}
                          </div>
                          <div className="flex items-center gap-1">
                            <ExternalLink className="w-4 h-4" />
                            {event.sourceSystem}
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {event.location}
                            </div>
                          )}
                        </div>

                        {/* AI Insights */}
                        {event.aiInsights && (
                          <div className="bg-bg-raised p-3 rounded-lg">
                            <p className="text-xs font-semibold text-text-secondary mb-1">
                              AI Insights:
                            </p>
                            <p className="text-sm text-text-secondary">
                              {event.aiInsights}
                            </p>
                          </div>
                        )}

                        {/* Raw Payload Preview */}
                        {event.rawPayload && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                              View raw payload
                            </summary>
                            <pre className="mt-2 bg-bg-hover p-2 rounded overflow-x-auto">
                              {JSON.stringify(event.rawPayload, null, 2)}
                            </pre>
                          </details>
                        )}

                        {/* Actions */}
                        {event.linkedContentId && (
                          <div className="pt-2 border-t border-border-subtle">
                            <Button variant="link" className="p-0 h-auto text-xs">
                              View Generated Content →
                            </Button>
                          </div>
                        )}
                      </div>
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
