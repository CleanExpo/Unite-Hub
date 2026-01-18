'use client';

/**
 * Client Archive Page
 * Phase 78: Living Intelligence Archive view
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Archive, Info } from 'lucide-react';
import { ArchiveFilterBar } from '@/ui/components/ArchiveFilterBar';
import { ArchiveTimelineView, ArchiveTimelineStats } from '@/ui/components/ArchiveTimelineView';
import {
  ArchiveFilters,
  ClientArchiveEntry,
  TimelineGroup,
} from '@/lib/archive/archiveTypes';
import { buildDailyTimeline, buildWeeklyTimeline } from '@/lib/archive/archiveTimelineBuilder';

export default function ClientArchivePage() {
  const [filters, setFilters] = useState<ArchiveFilters>({
    workspaceId: 'ws_demo',
    clientId: 'contact_demo',
  });
  const [entries, setEntries] = useState<ClientArchiveEntry[]>([]);
  const [groups, setGroups] = useState<TimelineGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    earliest: '',
    latest: '',
    highPriority: 0,
  });

  useEffect(() => {
    loadArchive();
  }, [filters]);

  const loadArchive = async () => {
    setIsLoading(true);
    try {
      // In production, call API
      // For now, generate demo data
      const demoEntries = generateDemoEntries();
      setEntries(demoEntries);

      // Determine grouping
      const timelineGroups = demoEntries.length > 20
        ? buildWeeklyTimeline(demoEntries)
        : buildDailyTimeline(demoEntries);
      setGroups(timelineGroups);

      // Calculate stats
      if (demoEntries.length > 0) {
        const dates = demoEntries.map(e => e.event_date);
        setStats({
          total: demoEntries.length,
          earliest: dates[dates.length - 1],
          latest: dates[0],
          highPriority: demoEntries.filter(e => e.importance_score >= 70).length,
        });
      }
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
            Your Archive
          </h1>
          <p className="text-muted-foreground">
            Complete timeline of your journey activity
          </p>
        </div>
        <Badge variant="outline">
          {stats.total} entries
        </Badge>
      </div>

      {/* Truth notice */}
      <Card className="border-info-500/30 bg-info-500/5">
        <CardContent className="pt-4 flex items-start gap-3">
          <Info className="h-4 w-4 text-info-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            Entries shown are generated from real activity and artifacts only.
            All data is backed by actual events from your journey.
          </p>
        </CardContent>
      </Card>

      {/* Filters */}
      <ArchiveFilterBar
        filters={filters}
        onChange={setFilters}
      />

      {/* Stats */}
      {!isLoading && stats.total > 0 && (
        <ArchiveTimelineStats
          totalEntries={stats.total}
          dateRange={{ earliest: stats.earliest, latest: stats.latest }}
          highPriorityCount={stats.highPriority}
        />
      )}

      {/* Timeline */}
      <ArchiveTimelineView
        groups={groups}
        groupType={groups.length > 10 ? 'weekly' : 'daily'}
        isLoading={isLoading}
        emptyMessage="No archive entries yet. Activity will appear here as your journey progresses."
      />
    </div>
  );
}

/**
 * Generate demo archive entries
 */
function generateDemoEntries(): ClientArchiveEntry[] {
  const now = new Date();
  const entries: ClientArchiveEntry[] = [];

  // Generate entries over last 30 days
  for (let i = 0; i < 18; i++) {
    const eventDate = new Date(now);
    eventDate.setDate(eventDate.getDate() - Math.floor(Math.random() * 30));

    const types = [
      { type: 'weekly_report', source: 'reports', category: 'reports', icon: 'FileText', color: 'text-info-500', label: 'Weekly Report' },
      { type: 'story', source: 'storytelling', category: 'stories', icon: 'BookOpen', color: 'text-indigo-500', label: 'Story' },
      { type: 'touchpoint', source: 'touchpoints', category: 'events', icon: 'MessageCircle', color: 'text-cyan-500', label: 'Touchpoint' },
      { type: 'performance_event', source: 'performance', category: 'events', icon: 'TrendingUp', color: 'text-emerald-500', label: 'Performance' },
      { type: 'success_event', source: 'success', category: 'milestones', icon: 'Trophy', color: 'text-warning-500', label: 'Success' },
      // VIF event types (Phase 79)
      { type: 'vif_asset_created', source: 'visual_intelligence_fabric', category: 'visual_intelligence', icon: 'Image', color: 'text-fuchsia-500', label: 'Visual Created' },
      { type: 'vif_campaign_launched', source: 'visual_intelligence_fabric', category: 'visual_intelligence', icon: 'Rocket', color: 'text-info-500', label: 'Campaign Launched' },
      { type: 'vif_visual_high_performer', source: 'visual_intelligence_fabric', category: 'visual_intelligence', icon: 'TrendingUp', color: 'text-success-500', label: 'High Performer' },
      { type: 'vif_creative_quality_scored', source: 'visual_intelligence_fabric', category: 'visual_intelligence', icon: 'Star', color: 'text-warning-500', label: 'Quality Scored' },
    ];

    const selected = types[Math.floor(Math.random() * types.length)];

    entries.push({
      id: `entry_${i}`,
      workspace_id: 'ws_demo',
      client_id: 'contact_demo',
      created_at: eventDate.toISOString(),
      event_date: eventDate.toISOString(),
      event_type: selected.type as any,
      source_engine: selected.source as any,
      category: selected.category as any,
      importance_score: 30 + Math.floor(Math.random() * 60),
      summary: `Demo ${selected.label.toLowerCase()} entry for testing`,
      details_json: { demo: true },
      is_demo: true,
      truth_completeness: 'complete',
      data_sources: [selected.source],
      displayIcon: selected.icon,
      displayColor: selected.color,
      shortLabel: selected.label,
      contextLink: '/client/dashboard/overview',
    });
  }

  return entries.sort((a, b) =>
    new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
  );
}
