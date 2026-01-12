'use client';

/**
 * Pre-Client Detail Page
 *
 * Detailed view of a pre-system client with threads, timeline, and insights.
 * Part of the Client Historical Email Identity Engine.
 */

import { useState, useEffect, useCallback, use } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft,
  Mail,
  Building2,
  Calendar,
  MessageSquare,
  TrendingUp,
  RefreshCw,
  Play,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Clock,
  Target,
  HelpCircle,
  Handshake,
  AlertTriangle,
  Loader2,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

interface PreClient {
  id: string;
  name: string;
  email: string;
  company?: string;
  notes?: string;
  status: string;
  totalThreads: number;
  totalMessages: number;
  firstContactDate?: string;
  lastContactDate?: string;
  relationshipSummary?: string;
  sentimentScore?: number;
  engagementLevel: string;
}

interface Thread {
  id: string;
  threadId: string;
  subject: string;
  messageCount: number;
  firstMessageAt: string;
  lastMessageAt: string;
  primaryTheme: string;
  themes: string[];
  sentiment: string;
  importance: string;
  hasUnresolvedItems: boolean;
  requiresFollowup: boolean;
}

interface TimelineEvent {
  id: string;
  eventType: string;
  eventDate: string;
  summary: string;
  significance: string;
}

interface Insight {
  id: string;
  category: string;
  title: string;
  priority: string;
  status: string;
  dueDate?: string;
  confidenceScore: number;
}

interface RelationshipSummary {
  currentPhase: string;
  relationshipDurationDays: number;
  totalEvents: number;
  milestoneCount: number;
  issuesCount: number;
}

export default function PreClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const workspaceId = searchParams.get('workspaceId') || '';

  const [preClient, setPreClient] = useState<PreClient | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [summary, setSummary] = useState<RelationshipSummary | null>(null);
  const [narrative, setNarrative] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [converting, setConverting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [connectedApps, setConnectedApps] = useState<Array<{ id: string; provider: string }>>([]);
  const [selectedApp, setSelectedApp] = useState<string>('');

  const fetchPreClient = useCallback(async () => {
    if (!workspaceId || !id) {
return;
}

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
return;
}

      const response = await fetch(
        `/api/pre-clients/${id}?workspaceId=${workspaceId}`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );

      const data = await response.json();
      if (data.success) {
        setPreClient(data.preClient);
      }
    } catch (error) {
      console.error('Failed to fetch pre-client:', error);
    }
  }, [workspaceId, id]);

  const fetchThreads = useCallback(async () => {
    if (!workspaceId || !id) {
return;
}

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
return;
}

      const response = await fetch(
        `/api/pre-clients/${id}/threads?workspaceId=${workspaceId}&limit=20`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );

      const data = await response.json();
      if (data.success) {
        setThreads(data.threads);
      }
    } catch (error) {
      console.error('Failed to fetch threads:', error);
    }
  }, [workspaceId, id]);

  const fetchTimeline = useCallback(async () => {
    if (!workspaceId || !id) {
return;
}

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
return;
}

      const response = await fetch(
        `/api/pre-clients/${id}/timeline?workspaceId=${workspaceId}&limit=20`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );

      const data = await response.json();
      if (data.success) {
        setTimeline(data.events);
      }
    } catch (error) {
      console.error('Failed to fetch timeline:', error);
    }
  }, [workspaceId, id]);

  const fetchInsights = useCallback(async () => {
    if (!workspaceId || !id) {
return;
}

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
return;
}

      const response = await fetch(
        `/api/pre-clients/${id}/insights?workspaceId=${workspaceId}&statuses=pending,in_progress&limit=20`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );

      const data = await response.json();
      if (data.success) {
        setInsights(data.insights);
      }
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    }
  }, [workspaceId, id]);

  const fetchSummary = useCallback(async () => {
    if (!workspaceId || !id) {
return;
}

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
return;
}

      const response = await fetch(`/api/pre-clients/${id}/timeline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          workspaceId,
          action: 'summary',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  }, [workspaceId, id]);

  const fetchNarrative = useCallback(async () => {
    if (!workspaceId || !id) {
return;
}

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
return;
}

      const response = await fetch(`/api/pre-clients/${id}/timeline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          workspaceId,
          action: 'narrative',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setNarrative(data.narrative);
      }
    } catch (error) {
      console.error('Failed to fetch narrative:', error);
    }
  }, [workspaceId, id]);

  const fetchConnectedApps = useCallback(async () => {
    if (!workspaceId) {
return;
}

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
return;
}

      const { data, error } = await supabase
        .from('connected_apps')
        .select('id, provider')
        .eq('workspace_id', workspaceId)
        .in('provider', ['gmail', 'outlook']);

      if (!error && data) {
        setConnectedApps(data);
        if (data.length > 0) {
          setSelectedApp(data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch connected apps:', error);
    }
  }, [workspaceId]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchPreClient(),
        fetchConnectedApps(),
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchPreClient, fetchConnectedApps]);

  useEffect(() => {
    if (preClient && preClient.status === 'analyzed') {
      fetchThreads();
      fetchTimeline();
      fetchInsights();
      fetchSummary();
    }
  }, [preClient, fetchThreads, fetchTimeline, fetchInsights, fetchSummary]);

  const handleStartIngestion = async () => {
    if (!workspaceId || !selectedApp || !id) {
return;
}

    try {
      setIngesting(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
return;
}

      const response = await fetch(`/api/pre-clients/${id}/ingest-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          workspaceId,
          connectedAppId: selectedApp,
          fullPipeline: true,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Refresh data after a delay
        setTimeout(() => {
          fetchPreClient();
        }, 5000);
      }
    } catch (error) {
      console.error('Failed to start ingestion:', error);
    } finally {
      setIngesting(false);
    }
  };

  const handleConvert = async () => {
    if (!workspaceId || !id) {
return;
}

    try {
      setConverting(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
return;
}

      const response = await fetch(`/api/pre-clients/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          workspaceId,
          action: 'convert',
        }),
      });

      const data = await response.json();
      if (data.success) {
        router.push(`/dashboard/contacts/${data.contactId}?workspaceId=${workspaceId}`);
      }
    } catch (error) {
      console.error('Failed to convert:', error);
    } finally {
      setConverting(false);
    }
  };

  const getInsightIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      task: <CheckCircle2 className="h-4 w-4 text-info-500" />,
      opportunity: <Target className="h-4 w-4 text-success-500" />,
      question: <HelpCircle className="h-4 w-4 text-warning-500" />,
      commitment: <Handshake className="h-4 w-4 text-purple-500" />,
      risk: <AlertTriangle className="h-4 w-4 text-error-500" />,
    };
    return icons[category] || <AlertCircle className="h-4 w-4 text-text-muted" />;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) {
return '-';
}
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!preClient) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Pre-Client Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The requested pre-client could not be found.
            </p>
            <Link href={`/founder/pre-clients?workspaceId=${workspaceId}`}>
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Pre-Clients
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/founder/pre-clients?workspaceId=${workspaceId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{preClient.name}</h1>
          <div className="flex items-center gap-4 text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              {preClient.email}
            </span>
            {preClient.company && (
              <span className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {preClient.company}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {preClient.status === 'discovered' && connectedApps.length > 0 && (
            <div className="flex gap-2">
              <Select value={selectedApp} onValueChange={setSelectedApp}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select email account" />
                </SelectTrigger>
                <SelectContent>
                  {connectedApps.map((app) => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.provider.charAt(0).toUpperCase() + app.provider.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleStartIngestion} disabled={ingesting}>
                {ingesting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Start Ingestion
              </Button>
            </div>
          )}
          {preClient.status === 'analyzed' && (
            <Button onClick={handleConvert} disabled={converting}>
              {converting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Convert to Contact
            </Button>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              className={
                preClient.status === 'analyzed'
                  ? 'bg-success-100 text-success-800'
                  : 'bg-info-100 text-info-800'
              }
            >
              {preClient.status}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge
              className={
                preClient.engagementLevel === 'hot' || preClient.engagementLevel === 'active'
                  ? 'bg-accent-100 text-accent-800'
                  : preClient.engagementLevel === 'warm'
                  ? 'bg-warning-100 text-warning-800'
                  : 'bg-info-100 text-info-800'
              }
            >
              {preClient.engagementLevel}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{preClient.totalMessages}</div>
            <p className="text-xs text-muted-foreground">
              across {preClient.totalThreads} threads
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Contact</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {formatDate(preClient.lastContactDate)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      {preClient.status === 'analyzed' ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="threads">Threads</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Relationship Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Relationship Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {preClient.relationshipSummary || narrative ? (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {preClient.relationshipSummary || narrative}
                    </p>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <Button variant="outline" size="sm" onClick={fetchNarrative}>
                        Generate Summary
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Relationship Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {summary ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Current Phase</span>
                        <Badge variant="outline">{summary.currentPhase}</Badge>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration</span>
                        <span className="font-medium">{summary.relationshipDurationDays} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Events</span>
                        <span className="font-medium">{summary.totalEvents}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Milestones</span>
                        <span className="font-medium">{summary.milestoneCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Issues</span>
                        <span className="font-medium">{summary.issuesCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sentiment Score</span>
                        <span className="font-medium">
                          {preClient.sentimentScore !== undefined
                            ? `${Math.round(preClient.sentimentScore * 100)}%`
                            : '-'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      Loading metrics...
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Active Insights Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Active Insights</CardTitle>
                <CardDescription>
                  Tasks, opportunities, and items requiring attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                {insights.length > 0 ? (
                  <div className="space-y-3">
                    {insights.slice(0, 5).map((insight) => (
                      <div
                        key={insight.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                      >
                        {getInsightIcon(insight.category)}
                        <div className="flex-1">
                          <p className="font-medium">{insight.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {insight.category} - {insight.priority} priority
                          </p>
                        </div>
                        <Badge variant="outline">{insight.status}</Badge>
                      </div>
                    ))}
                    {insights.length > 5 && (
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => setActiveTab('insights')}
                      >
                        View all {insights.length} insights
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No active insights found
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="threads">
            <Card>
              <CardHeader>
                <CardTitle>Email Threads</CardTitle>
                <CardDescription>
                  Conversation threads organized by theme and importance
                </CardDescription>
              </CardHeader>
              <CardContent>
                {threads.length > 0 ? (
                  <div className="space-y-3">
                    {threads.map((thread) => (
                      <div
                        key={thread.id}
                        className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{thread.subject || 'No Subject'}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {thread.primaryTheme}
                              </Badge>
                              <Badge
                                className={
                                  thread.importance === 'critical'
                                    ? 'bg-error-100 text-error-800'
                                    : thread.importance === 'high'
                                    ? 'bg-accent-100 text-accent-800'
                                    : 'bg-bg-subtle text-text-secondary'
                                }
                              >
                                {thread.importance}
                              </Badge>
                              {thread.requiresFollowup && (
                                <Badge className="bg-warning-100 text-warning-800">
                                  Needs Follow-up
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            <p>{thread.messageCount} messages</p>
                            <p>{formatDate(thread.lastMessageAt)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No threads found
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle>Relationship Timeline</CardTitle>
                <CardDescription>
                  Key events and milestones in the client relationship
                </CardDescription>
              </CardHeader>
              <CardContent>
                {timeline.length > 0 ? (
                  <div className="relative pl-6 border-l-2 border-muted space-y-6">
                    {timeline.map((event) => (
                      <div key={event.id} className="relative">
                        <div
                          className={`absolute -left-[25px] w-4 h-4 rounded-full ${
                            event.significance === 'critical'
                              ? 'bg-error-500'
                              : event.significance === 'major'
                              ? 'bg-accent-500'
                              : event.significance === 'moderate'
                              ? 'bg-info-500'
                              : 'bg-text-muted'
                          }`}
                        />
                        <div className="ml-4">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{event.eventType}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(event.eventDate)}
                            </span>
                          </div>
                          <p className="mt-1 font-medium">{event.summary}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No timeline events found
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights">
            <Card>
              <CardHeader>
                <CardTitle>All Insights</CardTitle>
                <CardDescription>
                  Tasks, opportunities, questions, and risks detected from communications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {insights.length > 0 ? (
                  <div className="space-y-3">
                    {insights.map((insight) => (
                      <div
                        key={insight.id}
                        className="flex items-start gap-3 p-4 rounded-lg border"
                      >
                        {getInsightIcon(insight.category)}
                        <div className="flex-1">
                          <p className="font-medium">{insight.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{insight.category}</Badge>
                            <Badge
                              className={
                                insight.priority === 'urgent'
                                  ? 'bg-error-100 text-error-800'
                                  : insight.priority === 'high'
                                  ? 'bg-accent-100 text-accent-800'
                                  : 'bg-bg-subtle text-text-secondary'
                              }
                            >
                              {insight.priority}
                            </Badge>
                            {insight.dueDate && (
                              <span className="text-xs text-muted-foreground">
                                Due: {formatDate(insight.dueDate)}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline">{insight.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No insights found
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {preClient.status === 'ingesting'
                ? 'Ingestion in Progress'
                : 'Ready for Ingestion'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {preClient.status === 'ingesting'
                ? 'Historical emails are being processed. This may take a few minutes.'
                : 'Start the ingestion process to analyze historical communications with this client.'}
            </p>
            {preClient.status === 'ingesting' && (
              <Button variant="outline" onClick={fetchPreClient}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Check Status
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
