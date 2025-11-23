/**
 * Archive Timeline Builder
 * Phase 78: Helpers to group and shape entries for UI display
 */

import {
  ClientArchiveEntry,
  TimelineGroup,
  PhaseTimelineGroup,
  ClientNarrativeSummary,
  ArchiveEventType,
} from './archiveTypes';

/**
 * Build daily timeline from entries
 */
export function buildDailyTimeline(entries: ClientArchiveEntry[]): TimelineGroup[] {
  const groups: Map<string, ClientArchiveEntry[]> = new Map();

  for (const entry of entries) {
    const date = new Date(entry.event_date).toISOString().split('T')[0];
    const existing = groups.get(date) || [];
    existing.push(entry);
    groups.set(date, existing);
  }

  return Array.from(groups.entries())
    .map(([date, items]) => ({
      date,
      label: formatDateLabel(date),
      items: items.sort((a, b) =>
        new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
      ),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Build weekly timeline from entries
 */
export function buildWeeklyTimeline(entries: ClientArchiveEntry[]): TimelineGroup[] {
  const groups: Map<string, ClientArchiveEntry[]> = new Map();

  for (const entry of entries) {
    const date = new Date(entry.event_date);
    const weekStart = getWeekStart(date);
    const weekKey = weekStart.toISOString().split('T')[0];
    const existing = groups.get(weekKey) || [];
    existing.push(entry);
    groups.set(weekKey, existing);
  }

  return Array.from(groups.entries())
    .map(([weekKey, items]) => {
      const weekStart = new Date(weekKey);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      return {
        date: weekKey,
        label: `${formatShortDate(weekStart)} - ${formatShortDate(weekEnd)}`,
        items: items.sort((a, b) =>
          new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
        ),
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Build phase timeline from entries (90-day journey phases)
 */
export function buildPhaseTimeline(
  entries: ClientArchiveEntry[],
  journeyStartDate?: string
): PhaseTimelineGroup[] {
  if (entries.length === 0) return [];

  // Use earliest entry or provided start date
  const startDate = journeyStartDate
    ? new Date(journeyStartDate)
    : new Date(entries[entries.length - 1].event_date);

  // Define phases (each phase is ~2 weeks for 90-day journey)
  const phases: PhaseTimelineGroup[] = [
    { phaseNumber: 1, phaseName: 'Foundation', dateRange: '', items: [] },
    { phaseNumber: 2, phaseName: 'Foundation', dateRange: '', items: [] },
    { phaseNumber: 3, phaseName: 'Build', dateRange: '', items: [] },
    { phaseNumber: 4, phaseName: 'Build', dateRange: '', items: [] },
    { phaseNumber: 5, phaseName: 'Launch', dateRange: '', items: [] },
    { phaseNumber: 6, phaseName: 'Launch', dateRange: '', items: [] },
    { phaseNumber: 7, phaseName: 'Optimize', dateRange: '', items: [] },
  ];

  // Calculate phase boundaries
  const phaseDuration = 90 / phases.length; // ~12-13 days per phase

  phases.forEach((phase, index) => {
    const phaseStart = new Date(startDate);
    phaseStart.setDate(phaseStart.getDate() + index * phaseDuration);
    const phaseEnd = new Date(phaseStart);
    phaseEnd.setDate(phaseEnd.getDate() + phaseDuration - 1);

    phase.dateRange = `${formatShortDate(phaseStart)} - ${formatShortDate(phaseEnd)}`;
  });

  // Assign entries to phases
  for (const entry of entries) {
    const entryDate = new Date(entry.event_date);
    const daysSinceStart = Math.floor(
      (entryDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const phaseIndex = Math.min(
      Math.floor(daysSinceStart / phaseDuration),
      phases.length - 1
    );

    if (phaseIndex >= 0 && phaseIndex < phases.length) {
      phases[phaseIndex].items.push(entry);
    }
  }

  // Sort items within each phase
  phases.forEach(phase => {
    phase.items.sort((a, b) =>
      new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
    );
  });

  // Filter out empty phases
  return phases.filter(phase => phase.items.length > 0);
}

/**
 * Build client narrative summary from entries
 */
export function buildClientNarrativeSummary(
  entries: ClientArchiveEntry[],
  clientId: string
): ClientNarrativeSummary {
  if (entries.length === 0) {
    return {
      clientId,
      firstEventDate: '',
      latestEventDate: '',
      totalEvents: 0,
      eventTypeCounts: {},
      keyHighlights: [],
      recentActivity: [],
    };
  }

  // Sort by date
  const sorted = [...entries].sort((a, b) =>
    new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  );

  const firstEventDate = sorted[0].event_date;
  const latestEventDate = sorted[sorted.length - 1].event_date;

  // Count by type
  const eventTypeCounts: Partial<Record<ArchiveEventType, number>> = {};
  for (const entry of entries) {
    eventTypeCounts[entry.event_type] = (eventTypeCounts[entry.event_type] || 0) + 1;
  }

  // Extract key highlights (high importance entries)
  const keyHighlights = entries
    .filter(e => e.importance_score >= 70)
    .slice(0, 5)
    .map(e => e.summary);

  // Recent activity (last 5)
  const recentActivity = sorted.slice(-5).reverse();

  return {
    clientId,
    firstEventDate,
    latestEventDate,
    totalEvents: entries.length,
    eventTypeCounts,
    keyHighlights,
    recentActivity,
  };
}

/**
 * Group entries by source engine
 */
export function groupBySource(
  entries: ClientArchiveEntry[]
): Record<string, ClientArchiveEntry[]> {
  const groups: Record<string, ClientArchiveEntry[]> = {};

  for (const entry of entries) {
    if (!groups[entry.source_engine]) {
      groups[entry.source_engine] = [];
    }
    groups[entry.source_engine].push(entry);
  }

  return groups;
}

/**
 * Group entries by category
 */
export function groupByCategory(
  entries: ClientArchiveEntry[]
): Record<string, ClientArchiveEntry[]> {
  const groups: Record<string, ClientArchiveEntry[]> = {};

  for (const entry of entries) {
    if (!groups[entry.category]) {
      groups[entry.category] = [];
    }
    groups[entry.category].push(entry);
  }

  return groups;
}

/**
 * Get timeline statistics
 */
export function getTimelineStats(entries: ClientArchiveEntry[]): {
  totalEntries: number;
  dateSpan: number;
  avgEntriesPerDay: number;
  highImportanceCount: number;
  mostActiveDay: string;
} {
  if (entries.length === 0) {
    return {
      totalEntries: 0,
      dateSpan: 0,
      avgEntriesPerDay: 0,
      highImportanceCount: 0,
      mostActiveDay: '',
    };
  }

  const dates = entries.map(e => new Date(e.event_date));
  const earliest = Math.min(...dates.map(d => d.getTime()));
  const latest = Math.max(...dates.map(d => d.getTime()));
  const dateSpan = Math.ceil((latest - earliest) / (1000 * 60 * 60 * 24)) || 1;

  // Count by day
  const dayCounts: Record<string, number> = {};
  for (const entry of entries) {
    const day = new Date(entry.event_date).toISOString().split('T')[0];
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  }

  const mostActiveDay = Object.entries(dayCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || '';

  return {
    totalEntries: entries.length,
    dateSpan,
    avgEntriesPerDay: entries.length / dateSpan,
    highImportanceCount: entries.filter(e => e.importance_score >= 70).length,
    mostActiveDay,
  };
}

// Helper functions

function formatDateLabel(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
  });
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default {
  buildDailyTimeline,
  buildWeeklyTimeline,
  buildPhaseTimeline,
  buildClientNarrativeSummary,
  groupBySource,
  groupByCategory,
  getTimelineStats,
};
