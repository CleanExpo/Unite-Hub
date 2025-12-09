/**
 * Archive Query Service
 * Phase 78: Read-only query helpers for archive entries
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  ArchiveEntry,
  ArchiveFilters,
  ArchiveQueryResult,
  ArchiveOverviewStats,
  ClientArchiveEntry,
  getEventTypeDisplay,
} from './archiveTypes';

/**
 * Get client archive timeline
 */
export async function getClientArchiveTimeline(
  filters: ArchiveFilters
): Promise<ArchiveQueryResult> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('archive_entries')
    .select('*', { count: 'exact' })
    .order('event_date', { ascending: false });

  // Apply filters
  if (filters.workspaceId) {
    query = query.eq('workspace_id', filters.workspaceId);
  }

  if (filters.clientId) {
    query = query.eq('client_id', filters.clientId);
  }

  if (filters.from) {
    query = query.gte('event_date', filters.from);
  }

  if (filters.to) {
    query = query.lte('event_date', filters.to);
  }

  if (filters.types && filters.types.length > 0) {
    query = query.in('event_type', filters.types);
  }

  if (filters.sources && filters.sources.length > 0) {
    query = query.in('source_engine', filters.sources);
  }

  if (filters.categories && filters.categories.length > 0) {
    query = query.in('category', filters.categories);
  }

  if (filters.importanceMin !== undefined) {
    query = query.gte('importance_score', filters.importanceMin);
  }

  if (filters.isDemo !== undefined) {
    query = query.eq('is_demo', filters.isDemo);
  }

  // Pagination
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Archive query error:', error);
    return {
      entries: [],
      total: 0,
      hasMore: false,
      suggestedGrouping: 'daily',
    };
  }

  // Transform to client entries
  const entries: ClientArchiveEntry[] = (data || []).map(transformToClientEntry);

  // Determine suggested grouping
  const totalDays = entries.length > 0
    ? Math.ceil(
        (new Date(entries[0].event_date).getTime() -
          new Date(entries[entries.length - 1].event_date).getTime()) /
        (1000 * 60 * 60 * 24)
      )
    : 0;

  const suggestedGrouping =
    totalDays > 60 ? 'phase' : totalDays > 14 ? 'weekly' : 'daily';

  return {
    entries,
    total: count || 0,
    hasMore: (count || 0) > offset + limit,
    earliestEventDate: entries.length > 0 ? entries[entries.length - 1].event_date : undefined,
    latestEventDate: entries.length > 0 ? entries[0].event_date : undefined,
    suggestedGrouping,
  };
}

/**
 * Get founder archive overview (cross-client)
 */
export async function getFounderArchiveOverview(
  filters: ArchiveFilters
): Promise<ArchiveOverviewStats> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('archive_entries')
    .select('*');

  // Apply filters
  if (filters.from) {
    query = query.gte('event_date', filters.from);
  }

  if (filters.to) {
    query = query.lte('event_date', filters.to);
  }

  if (filters.types && filters.types.length > 0) {
    query = query.in('event_type', filters.types);
  }

  if (filters.sources && filters.sources.length > 0) {
    query = query.in('source_engine', filters.sources);
  }

  if (filters.clientId) {
    query = query.eq('client_id', filters.clientId);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error('Archive overview error:', error);
    return {
      totalEntries: 0,
      entriesByType: {} as Record<string, number>,
      entriesBySource: {} as Record<string, number>,
      entriesByClient: [],
      dateRange: { earliest: '', latest: '' },
    };
  }

  // Aggregate stats
  const entriesByType: Record<string, number> = {};
  const entriesBySource: Record<string, number> = {};
  const clientMap: Map<string, { count: number; lastActivity: string }> = new Map();

  let earliest = '';
  let latest = '';

  for (const entry of data) {
    // Count by type
    entriesByType[entry.event_type] = (entriesByType[entry.event_type] || 0) + 1;

    // Count by source
    entriesBySource[entry.source_engine] = (entriesBySource[entry.source_engine] || 0) + 1;

    // Count by client
    const clientData = clientMap.get(entry.client_id) || { count: 0, lastActivity: '' };
    clientData.count++;
    if (!clientData.lastActivity || entry.event_date > clientData.lastActivity) {
      clientData.lastActivity = entry.event_date;
    }
    clientMap.set(entry.client_id, clientData);

    // Track date range
    if (!earliest || entry.event_date < earliest) {
earliest = entry.event_date;
}
    if (!latest || entry.event_date > latest) {
latest = entry.event_date;
}
  }

  const entriesByClient = Array.from(clientMap.entries())
    .map(([clientId, data]) => ({
      clientId,
      count: data.count,
      lastActivity: data.lastActivity,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalEntries: data.length,
    entriesByType: entriesByType as Record<string, number>,
    entriesBySource: entriesBySource as Record<string, number>,
    entriesByClient,
    dateRange: { earliest, latest },
  };
}

/**
 * Get single archive entry by ID
 */
export async function getArchiveEntryById(
  id: string,
  workspaceScope?: string
): Promise<ClientArchiveEntry | null> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('archive_entries')
    .select('*')
    .eq('id', id)
    .single();

  if (workspaceScope) {
    query = query.eq('workspace_id', workspaceScope);
  }

  const { data, error } = await query;

  if (error || !data) {
    return null;
  }

  return transformToClientEntry(data);
}

/**
 * Get archive entry tags
 */
export async function getArchiveEntryTags(entryId: string): Promise<string[]> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('archive_tags')
    .select('tag')
    .eq('archive_entry_id', entryId);

  return (data || []).map(t => t.tag);
}

/**
 * Transform database entry to client entry
 */
function transformToClientEntry(entry: ArchiveEntry): ClientArchiveEntry {
  const display = getEventTypeDisplay(entry.event_type);

  // Determine context link
  let contextLink: string | undefined;
  switch (entry.event_type) {
    case 'weekly_report':
    case 'monthly_report':
    case 'ninety_day_report':
      contextLink = '/client/dashboard/reports-center';
      break;
    case 'story':
      contextLink = '/client/dashboard/stories';
      break;
    case 'touchpoint':
      contextLink = '/client/dashboard/touchpoints';
      break;
    case 'performance_event':
      contextLink = '/client/dashboard/overview';
      break;
    case 'success_event':
      contextLink = '/client/dashboard/overview';
      break;
    default:
      contextLink = undefined;
  }

  return {
    ...entry,
    displayIcon: display.icon,
    displayColor: display.color,
    shortLabel: display.label,
    contextLink,
  };
}

/**
 * Get recent entries for a client
 */
export async function getRecentClientEntries(
  clientId: string,
  workspaceId: string,
  limit: number = 10
): Promise<ClientArchiveEntry[]> {
  const result = await getClientArchiveTimeline({
    clientId,
    workspaceId,
    limit,
    isDemo: false,
  });

  return result.entries;
}

/**
 * Count entries by time period
 */
export async function countEntriesByPeriod(
  workspaceId: string,
  period: '7d' | '30d' | '90d'
): Promise<number> {
  const supabase = await getSupabaseServer();

  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const from = new Date();
  from.setDate(from.getDate() - days);

  const { count, error } = await supabase
    .from('archive_entries')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .gte('event_date', from.toISOString())
    .eq('is_demo', false);

  return error ? 0 : (count || 0);
}

export default {
  getClientArchiveTimeline,
  getFounderArchiveOverview,
  getArchiveEntryById,
  getArchiveEntryTags,
  getRecentClientEntries,
  countEntriesByPeriod,
};
