'use client';

/**
 * Archive Timeline View
 * Phase 78: Render grouped archive entries
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Info } from 'lucide-react';
import { ArchiveEntryCard } from './ArchiveEntryCard';
import {
  ClientArchiveEntry,
  TimelineGroup,
  PhaseTimelineGroup,
} from '@/lib/archive/archiveTypes';

interface ArchiveTimelineViewProps {
  groups: TimelineGroup[] | PhaseTimelineGroup[];
  groupType: 'daily' | 'weekly' | 'phase';
  showClient?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function ArchiveTimelineView({
  groups,
  groupType,
  showClient = false,
  isLoading = false,
  emptyMessage = 'No archive entries found',
  className = '',
}: ArchiveTimelineViewProps) {
  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <Info className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  if (groupType === 'phase') {
    return (
      <div className={`space-y-6 ${className}`}>
        {(groups as PhaseTimelineGroup[]).map((group) => (
          <PhaseGroupSection
            key={group.phaseNumber}
            group={group}
            showClient={showClient}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {(groups as TimelineGroup[]).map((group) => (
        <DateGroupSection
          key={group.date}
          group={group}
          showClient={showClient}
        />
      ))}
    </div>
  );
}

/**
 * Date-based group section
 */
function DateGroupSection({
  group,
  showClient,
}: {
  group: TimelineGroup;
  showClient: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-medium text-sm">{group.label}</h3>
        <Badge variant="outline" className="text-[10px]">
          {group.items.length}
        </Badge>
      </div>
      <div className="space-y-3 pl-6 border-l-2 border-muted">
        {group.items.map((entry) => (
          <ArchiveEntryCard
            key={entry.id}
            entry={entry}
            showClient={showClient}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Phase-based group section
 */
function PhaseGroupSection({
  group,
  showClient,
}: {
  group: PhaseTimelineGroup;
  showClient: boolean;
}) {
  const phaseColors: Record<string, string> = {
    Foundation: 'bg-blue-500',
    Build: 'bg-purple-500',
    Launch: 'bg-green-500',
    Optimize: 'bg-orange-500',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                phaseColors[group.phaseName] || 'bg-muted'
              }`}
            />
            <CardTitle className="text-sm">
              Phase {group.phaseNumber}: {group.phaseName}
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {group.items.length} entries
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{group.dateRange}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {group.items.map((entry) => (
          <ArchiveEntryCard
            key={entry.id}
            entry={entry}
            showClient={showClient}
          />
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Compact timeline list
 */
export function ArchiveCompactList({
  entries,
  showClient = false,
  maxItems = 10,
  className = '',
}: {
  entries: ClientArchiveEntry[];
  showClient?: boolean;
  maxItems?: number;
  className?: string;
}) {
  const displayEntries = entries.slice(0, maxItems);

  if (displayEntries.length === 0) {
    return (
      <p className={`text-sm text-muted-foreground ${className}`}>
        No entries found
      </p>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {displayEntries.map((entry) => (
        <ArchiveEntryCard
          key={entry.id}
          entry={entry}
          showClient={showClient}
        />
      ))}
      {entries.length > maxItems && (
        <p className="text-xs text-muted-foreground text-center pt-2">
          +{entries.length - maxItems} more entries
        </p>
      )}
    </div>
  );
}

/**
 * Timeline statistics summary
 */
export function ArchiveTimelineStats({
  totalEntries,
  dateRange,
  highPriorityCount,
  className = '',
}: {
  totalEntries: number;
  dateRange: { earliest: string; latest: string };
  highPriorityCount: number;
  className?: string;
}) {
  const formatDate = (dateString: string) => {
    if (!dateString) {
return 'N/A';
}
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className={`flex items-center gap-4 text-xs text-muted-foreground ${className}`}>
      <span>{totalEntries} entries</span>
      <span>•</span>
      <span>
        {formatDate(dateRange.earliest)} - {formatDate(dateRange.latest)}
      </span>
      {highPriorityCount > 0 && (
        <>
          <span>•</span>
          <span className="text-orange-500">
            {highPriorityCount} high priority
          </span>
        </>
      )}
    </div>
  );
}

export default ArchiveTimelineView;
