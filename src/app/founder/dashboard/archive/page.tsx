'use client';

/**
 * Founder Archive Page
 * Phase 78: Multi-client archive console
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Archive,
  Users,
  TrendingUp,
  FileText,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ArchiveFilterBar } from '@/ui/components/ArchiveFilterBar';
import { ArchiveTimelineView, ArchiveTimelineStats } from '@/ui/components/ArchiveTimelineView';
import {
  ArchiveFilters,
  ClientArchiveEntry,
  TimelineGroup,
  ArchiveOverviewStats,
} from '@/lib/archive/archiveTypes';
import { buildDailyTimeline } from '@/lib/archive/archiveTimelineBuilder';

interface ClientItem {
  id: string;
  name: string;
}

export default function FounderArchivePage() {
  const router = useRouter();
  const [view, setView] = useState<'timeline' | 'overview'>('timeline');
  const [filters, setFilters] = useState<ArchiveFilters>({});
  const [entries, setEntries] = useState<ClientArchiveEntry[]>([]);
  const [groups, setGroups] = useState<TimelineGroup[]>([]);
  const [overview, setOverview] = useState<ArchiveOverviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [clients] = useState<ClientItem[]>([
    { id: 'client_1', name: 'Alpha Construction' },
    { id: 'client_2', name: 'Beta Balustrades' },
    { id: 'client_3', name: 'Gamma Glass' },
  ]);

  useEffect(() => {
    loadArchive();
  }, [filters]);

  const loadArchive = async () => {
    setIsLoading(true);
    try {
      // Generate demo data for all clients
      const allEntries = generateFounderDemoEntries(clients);

      // Apply client filter if set
      const filtered = filters.clientId
        ? allEntries.filter(e => e.client_id === filters.clientId)
        : allEntries;

      setEntries(filtered);
      setGroups(buildDailyTimeline(filtered));

      // Build overview stats
      const overviewStats = buildOverviewStats(allEntries, clients);
      setOverview(overviewStats);
    } catch (error) {
      console.error('Failed to load archive:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Archive className="h-6 w-6" />
            Archive Console
          </h1>
          <p className="text-muted-foreground">
            Cross-client intelligence archive
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/founder/dashboard/reports-center')}
          >
            <FileText className="h-4 w-4 mr-2" />
            Reports
          </Button>
        </div>
      </div>

      {/* View toggle and filters */}
      <Tabs value={view} onValueChange={(v) => setView(v as 'timeline' | 'overview')}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          <ArchiveFilterBar
            filters={filters}
            onChange={setFilters}
            showClientFilter={true}
            clients={clients}
          />
        </div>

        {/* Timeline view */}
        <TabsContent value="timeline" className="mt-6 space-y-4">
          {!isLoading && entries.length > 0 && (
            <ArchiveTimelineStats
              totalEntries={entries.length}
              dateRange={{
                earliest: entries[entries.length - 1]?.event_date || '',
                latest: entries[0]?.event_date || '',
              }}
              highPriorityCount={entries.filter(e => e.importance_score >= 70).length}
            />
          )}

          <ArchiveTimelineView
            groups={groups}
            groupType="daily"
            showClient={!filters.clientId}
            isLoading={isLoading}
            emptyMessage="No archive entries found for the selected filters."
          />
        </TabsContent>

        {/* Overview view */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {overview && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Archive className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-2xl font-bold">{overview.totalEntries}</p>
                        <p className="text-xs text-muted-foreground">Total Entries</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Users className="h-8 w-8 text-info-500" />
                      <div>
                        <p className="text-2xl font-bold">
                          {overview.entriesByClient.length}
                        </p>
                        <p className="text-xs text-muted-foreground">Active Clients</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-purple-500" />
                      <div>
                        <p className="text-2xl font-bold">
                          {(overview.entriesByType['weekly_report'] || 0) +
                            (overview.entriesByType['monthly_report'] || 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">Reports</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-8 w-8 text-accent-500" />
                      <div>
                        <p className="text-2xl font-bold">
                          {overview.entriesByType['director_alert'] || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Alerts</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Client breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Client Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {overview.entriesByClient.map((client) => {
                      const clientData = clients.find(c => c.id === client.clientId);
                      return (
                        <div
                          key={client.clientId}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-sm">
                              {clientData?.name || client.clientId}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Last activity:{' '}
                              {new Date(client.lastActivity).toLocaleDateString('en-AU')}
                            </p>
                          </div>
                          <Badge variant="outline">{client.count} entries</Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Event type breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Event Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(overview.entriesByType).map(([type, count]) => (
                      <div key={type} className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-lg font-bold">{count}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {type.replace(/_/g, ' ')}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Truth notice */}
      <Card className="border-info-500/30 bg-info-500/5">
        <CardContent className="pt-4 flex items-start gap-3">
          <Info className="h-4 w-4 text-info-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            All archive entries are tied to real events and artifacts. Entries may be
            filtered but never fabricated.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Generate demo entries for founder view
 */
function generateFounderDemoEntries(clients: ClientItem[]): ClientArchiveEntry[] {
  const now = new Date();
  const entries: ClientArchiveEntry[] = [];

  const types = [
    { type: 'weekly_report', source: 'reports', category: 'reports', icon: 'FileText', color: 'text-info-500', label: 'Weekly Report' },
    { type: 'monthly_report', source: 'reports', category: 'reports', icon: 'FileText', color: 'text-purple-500', label: 'Monthly Report' },
    { type: 'story', source: 'storytelling', category: 'stories', icon: 'BookOpen', color: 'text-indigo-500', label: 'Story' },
    { type: 'touchpoint', source: 'touchpoints', category: 'events', icon: 'MessageCircle', color: 'text-info-500', label: 'Touchpoint' },
    { type: 'performance_event', source: 'performance', category: 'events', icon: 'TrendingUp', color: 'text-success-500', label: 'Performance' },
    { type: 'success_event', source: 'success', category: 'milestones', icon: 'Trophy', color: 'text-warning-500', label: 'Success' },
    { type: 'director_alert', source: 'director', category: 'alerts', icon: 'AlertTriangle', color: 'text-error-500', label: 'Director Alert' },
    // VIF event types (Phase 79)
    { type: 'vif_asset_created', source: 'visual_intelligence_fabric', category: 'visual_intelligence', icon: 'Image', color: 'text-fuchsia-500', label: 'Visual Created' },
    { type: 'vif_campaign_launched', source: 'visual_intelligence_fabric', category: 'visual_intelligence', icon: 'Rocket', color: 'text-info-500', label: 'Campaign Launched' },
    { type: 'vif_ab_visual_test_concluded', source: 'visual_intelligence_fabric', category: 'visual_intelligence', icon: 'Trophy', color: 'text-success-500', label: 'A/B Test Winner' },
  ];

  clients.forEach((client, clientIndex) => {
    const entryCount = 5 + Math.floor(Math.random() * 10);

    for (let i = 0; i < entryCount; i++) {
      const eventDate = new Date(now);
      eventDate.setDate(eventDate.getDate() - Math.floor(Math.random() * 30));

      const selected = types[Math.floor(Math.random() * types.length)];

      entries.push({
        id: `entry_${client.id}_${i}`,
        workspace_id: `ws_${client.id}`,
        client_id: client.id,
        created_at: eventDate.toISOString(),
        event_date: eventDate.toISOString(),
        event_type: selected.type as any,
        source_engine: selected.source as any,
        category: selected.category as any,
        importance_score: 30 + Math.floor(Math.random() * 60),
        summary: `${client.name}: Demo ${selected.label.toLowerCase()}`,
        details_json: { demo: true },
        is_demo: true,
        truth_completeness: 'complete',
        data_sources: [selected.source],
        displayIcon: selected.icon,
        displayColor: selected.color,
        shortLabel: selected.label,
      });
    }
  });

  return entries.sort((a, b) =>
    new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
  );
}

/**
 * Build overview statistics
 */
function buildOverviewStats(
  entries: ClientArchiveEntry[],
  clients: ClientItem[]
): ArchiveOverviewStats {
  const entriesByType: Record<string, number> = {};
  const entriesBySource: Record<string, number> = {};
  const clientMap = new Map<string, { count: number; lastActivity: string }>();

  let earliest = '';
  let latest = '';

  for (const entry of entries) {
    entriesByType[entry.event_type] = (entriesByType[entry.event_type] || 0) + 1;
    entriesBySource[entry.source_engine] = (entriesBySource[entry.source_engine] || 0) + 1;

    const clientData = clientMap.get(entry.client_id) || { count: 0, lastActivity: '' };
    clientData.count++;
    if (!clientData.lastActivity || entry.event_date > clientData.lastActivity) {
      clientData.lastActivity = entry.event_date;
    }
    clientMap.set(entry.client_id, clientData);

    if (!earliest || entry.event_date < earliest) {
earliest = entry.event_date;
}
    if (!latest || entry.event_date > latest) {
latest = entry.event_date;
}
  }

  return {
    totalEntries: entries.length,
    entriesByType: entriesByType as Record<any, number>,
    entriesBySource: entriesBySource as Record<any, number>,
    entriesByClient: Array.from(clientMap.entries())
      .map(([clientId, data]) => ({
        clientId,
        clientName: clients.find(c => c.id === clientId)?.name,
        count: data.count,
        lastActivity: data.lastActivity,
      }))
      .sort((a, b) => b.count - a.count),
    dateRange: { earliest, latest },
  };
}
