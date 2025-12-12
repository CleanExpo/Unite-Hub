'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface DetectorConfig {
  id: string;
  name: string;
  description: string;
  metric_key: string;
  method: 'zscore' | 'ewma' | 'iqr';
  threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  window_size: number;
  baseline_lookback: number;
  min_count: number;
}

interface AnomalyEvent {
  id: string;
  detector_id: string;
  observed_at: string;
  observed_value: number;
  expected_value: number | null;
  score: number;
  severity: 'info' | 'warn' | 'high' | 'critical';
  status: 'open' | 'acknowledged' | 'resolved';
  summary: string;
  created_at: string;
}

const SUPPORTED_METRICS = [
  { value: 'alerts_total', label: 'Alerts Count' },
  { value: 'incidents_total', label: 'Incidents Count' },
  { value: 'correlation_clusters', label: 'Correlation Clusters' },
  { value: 'notif_fail_rate', label: 'Notification Failure %' },
  { value: 'risk_p95', label: 'Risk P95' },
  { value: 'insights_activity_24h', label: 'Insights Activity (24h)' },
];

const BASELINE_METHODS = [
  { value: 'zscore', label: 'Z-Score (Std Dev Bands)' },
  { value: 'ewma', label: 'EWMA (Trending)' },
  { value: 'iqr', label: 'IQR (Outlier Detection)' },
];

const SEVERITY_COLORS = {
  info: 'bg-blue-100 text-blue-800',
  warn: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export default function AnomaliesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId');
  const { toast } = useToast();

  const [tab, setTab] = useState('detectors');
  const [detectors, setDetectors] = useState<DetectorConfig[]>([]);
  const [events, setEvents] = useState<AnomalyEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AnomalyEvent | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);

  // Create detector form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    metric_key: '',
    method: 'zscore' as const,
    threshold: 3.0,
    window_size: 24,
    baseline_lookback: 168,
    min_count: 0,
  });

  // Event filters state
  const [eventFilters, setEventFilters] = useState({
    status: '',
    severity: '',
    detectorId: '',
  });

  // Fetch detectors
  const fetchDetectors = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/guardian/ai/anomalies/detectors?workspaceId=${workspaceId}`);
      const data = await res.json();
      setDetectors(data.data || []);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch detectors', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [workspaceId, toast]);

  // Fetch events
  const fetchEvents = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        workspaceId,
        ...(eventFilters.status && { status: eventFilters.status }),
        ...(eventFilters.severity && { severity: eventFilters.severity }),
        ...(eventFilters.detectorId && { detectorId: eventFilters.detectorId }),
      });

      const res = await fetch(`/api/guardian/ai/anomalies/events?${params}`);
      const data = await res.json();
      setEvents(data.data.events || []);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch events', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [workspaceId, eventFilters, toast]);

  useEffect(() => {
    if (tab === 'detectors') {
      fetchDetectors();
    } else {
      fetchEvents();
    }
  }, [tab, fetchDetectors, fetchEvents]);

  // Create detector
  const handleCreateDetector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;

    try {
      const res = await fetch(`/api/guardian/ai/anomalies/detectors?workspaceId=${workspaceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to create detector');

      toast({ title: 'Success', description: 'Detector created' });
      setShowCreateForm(false);
      setFormData({
        name: '',
        description: '',
        metric_key: '',
        method: 'zscore',
        threshold: 3.0,
        window_size: 24,
        baseline_lookback: 168,
        min_count: 0,
      });
      await fetchDetectors();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create detector', variant: 'destructive' });
    }
  };

  // Run detection
  const handleRunDetection = async () => {
    if (!workspaceId) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/guardian/ai/anomalies/run?workspaceId=${workspaceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) throw new Error('Failed to run detection');

      const data = await res.json();
      toast({
        title: 'Success',
        description: `Detection run complete. Found ${data.data.anomalies_detected} anomalies.`,
      });
      await fetchEvents();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to run detection', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Rebuild baseline
  const handleRebuildBaseline = async (detectorId: string) => {
    if (!workspaceId) return;

    try {
      const res = await fetch(
        `/api/guardian/ai/anomalies/detectors/${detectorId}/rebuild-baseline?workspaceId=${workspaceId}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' } }
      );

      if (!res.ok) throw new Error('Failed to rebuild baseline');

      toast({ title: 'Success', description: 'Baseline rebuilt' });
      await fetchDetectors();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to rebuild baseline', variant: 'destructive' });
    }
  };

  // Get explanation
  const handleGetExplanation = async (eventId: string) => {
    if (!workspaceId) return;
    setLoading(true);

    try {
      const res = await fetch(
        `/api/guardian/ai/anomalies/events/${eventId}/explain?workspaceId=${workspaceId}`
      );

      if (!res.ok) throw new Error('Failed to get explanation');

      const data = await res.json();
      setExplanation(data.data.explanation.explanation);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to get explanation',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Update event status
  const handleUpdateEventStatus = async (eventId: string, newStatus: string) => {
    if (!workspaceId) return;

    try {
      const res = await fetch(
        `/api/guardian/ai/anomalies/events/${eventId}?workspaceId=${workspaceId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!res.ok) throw new Error('Failed to update event');

      toast({ title: 'Success', description: 'Event updated' });
      await fetchEvents();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update event', variant: 'destructive' });
    }
  };

  if (!workspaceId) {
    return <div className="p-6">Workspace ID required</div>;
  }

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Anomaly Detection</h1>
          <p className="text-text-secondary">
            Monitor aggregate metrics for anomalies using statistical baselines
          </p>
        </div>

        <div className="flex gap-4 mb-6">
          <Button onClick={handleRunDetection} disabled={loading}>
            {loading ? 'Running...' : 'Run Detection Now'}
          </Button>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="detectors">Detectors</TabsTrigger>
            <TabsTrigger value="events">Anomaly Events</TabsTrigger>
          </TabsList>

          {/* Detectors Tab */}
          <TabsContent value="detectors" className="space-y-6">
            {!showCreateForm ? (
              <Button onClick={() => setShowCreateForm(true)}>Create Detector</Button>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>New Detector</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateDetector} className="space-y-4">
                    <Input
                      placeholder="Detector name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                    <Input
                      placeholder="Description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />

                    <Select value={formData.metric_key} onValueChange={(val) => setFormData({ ...formData, metric_key: val })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select metric" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_METRICS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={formData.method} onValueChange={(val: any) => setFormData({ ...formData, method: val })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select baseline method" />
                      </SelectTrigger>
                      <SelectContent>
                        {BASELINE_METHODS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      type="number"
                      placeholder="Threshold"
                      value={formData.threshold}
                      onChange={(e) => setFormData({ ...formData, threshold: parseFloat(e.target.value) })}
                      step="0.1"
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="number"
                        placeholder="Window size"
                        value={formData.window_size}
                        onChange={(e) => setFormData({ ...formData, window_size: parseInt(e.target.value) })}
                      />
                      <Input
                        type="number"
                        placeholder="Baseline lookback (hours)"
                        value={formData.baseline_lookback}
                        onChange={(e) => setFormData({ ...formData, baseline_lookback: parseInt(e.target.value) })}
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button type="submit">Create</Button>
                      <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {detectors.length === 0 ? (
                <p className="text-text-secondary">No detectors configured</p>
              ) : (
                detectors.map((detector) => (
                  <Card key={detector.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{detector.name}</CardTitle>
                          <CardDescription>{detector.description}</CardDescription>
                        </div>
                        <Badge variant={detector.is_active ? 'default' : 'secondary'}>
                          {detector.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-text-secondary">Metric:</span> {detector.metric_key}
                        </div>
                        <div>
                          <span className="text-text-secondary">Method:</span> {detector.method.toUpperCase()}
                        </div>
                        <div>
                          <span className="text-text-secondary">Threshold:</span> {detector.threshold}
                        </div>
                        <div>
                          <span className="text-text-secondary">Window:</span> {detector.window_size} hours
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRebuildBaseline(detector.id)}
                          disabled={loading}
                        >
                          Rebuild Baseline
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Select
                    value={eventFilters.status}
                    onValueChange={(val) => setEventFilters({ ...eventFilters, status: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="acknowledged">Acknowledged</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={eventFilters.severity}
                    onValueChange={(val) => setEventFilters({ ...eventFilters, severity: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warn">Warning</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={eventFilters.detectorId}
                    onValueChange={(val) => setEventFilters({ ...eventFilters, detectorId: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by detector" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      {detectors.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {events.length === 0 ? (
                <p className="text-text-secondary">No anomaly events</p>
              ) : (
                events.map((event) => (
                  <Card key={event.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex gap-2 items-center">
                            <CardTitle>Anomaly Detected</CardTitle>
                            <Badge className={SEVERITY_COLORS[event.severity]}>
                              {event.severity.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">{event.status}</Badge>
                          </div>
                          <CardDescription>{event.summary}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-text-secondary">Observed:</span> {event.observed_value}
                        </div>
                        <div>
                          <span className="text-text-secondary">Expected:</span>{' '}
                          {event.expected_value ? event.expected_value.toFixed(2) : 'N/A'}
                        </div>
                        <div>
                          <span className="text-text-secondary">Score:</span> {event.score.toFixed(2)}
                        </div>
                        <div>
                          <span className="text-text-secondary">Time:</span>{' '}
                          {new Date(event.observed_at).toLocaleString()}
                        </div>
                      </div>

                      {selectedEvent?.id === event.id && explanation && (
                        <div className="mt-4 p-4 bg-bg-card rounded border border-border">
                          <p className="text-sm text-text-secondary mb-2">AI Explanation:</p>
                          <p className="text-text-primary">{explanation}</p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-4 flex-wrap">
                        {event.status === 'open' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateEventStatus(event.id, 'acknowledged')}
                            >
                              Acknowledge
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateEventStatus(event.id, 'resolved')}
                            >
                              Resolve
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedEvent(event);
                            handleGetExplanation(event.id);
                          }}
                          disabled={loading}
                        >
                          {selectedEvent?.id === event.id && loading ? 'Loading...' : 'Explain'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
