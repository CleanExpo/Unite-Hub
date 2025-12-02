/**
 * Founder Journal Service
 *
 * CRUD operations for ai_phill_journal_entries table.
 * Provides journaling capabilities for founders to record notes,
 * reflections, decisions, and context that AI Phill can use
 * for personalized insights.
 *
 * @module founderOS/founderJournalService
 */

import { supabaseAdmin } from '@/lib/supabase/admin';

// ============================================================================
// Types
// ============================================================================

export interface JournalEntry {
  id: string;
  owner_user_id: string;
  related_business_id: string | null;
  title: string | null;
  body_md: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateJournalEntryInput {
  title?: string;
  body: string;
  tags?: string[];
  businessId?: string;
}

export interface UpdateJournalEntryInput {
  title?: string | null;
  body?: string;
  tags?: string[];
  businessId?: string | null;
}

export interface JournalFilters {
  businessId?: string;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
  limit?: number;
  offset?: number;
}

export interface JournalServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// Service Implementation
// ============================================================================

/**
 * Create a new journal entry
 *
 * @param ownerUserId - UUID of the founder user
 * @param data - Journal entry data
 * @returns Created journal entry
 */
export async function createEntry(
  ownerUserId: string,
  data: CreateJournalEntryInput
): Promise<JournalServiceResult<JournalEntry>> {
  try {
    const supabase = supabaseAdmin;

    const { data: entry, error } = await supabase
      .from('ai_phill_journal_entries')
      .insert({
        owner_user_id: ownerUserId,
        related_business_id: data.businessId || null,
        title: data.title || null,
        body_md: data.body,
        tags: data.tags || [],
      })
      .select()
      .single();

    if (error) {
      console.error('[JournalService] Create entry error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: entry as JournalEntry,
    };
  } catch (err) {
    console.error('[JournalService] Create entry exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error creating journal entry',
    };
  }
}

/**
 * Get journal entries for a founder with optional filters
 *
 * @param ownerUserId - UUID of the founder user
 * @param filters - Optional filters for the query
 * @returns List of journal entries
 */
export async function getEntries(
  ownerUserId: string,
  filters?: JournalFilters
): Promise<JournalServiceResult<JournalEntry[]>> {
  try {
    const supabase = supabaseAdmin;

    let query = supabase
      .from('ai_phill_journal_entries')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.businessId) {
      query = query.eq('related_business_id', filters.businessId);
    }

    if (filters?.tags && filters.tags.length > 0) {
      // Use contains for tag filtering
      query = query.contains('tags', filters.tags);
    }

    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }

    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    if (filters?.searchTerm) {
      // Search in title and body
      query = query.or(`title.ilike.%${filters.searchTerm}%,body_md.ilike.%${filters.searchTerm}%`);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data: entries, error } = await query;

    if (error) {
      console.error('[JournalService] Get entries error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: (entries || []) as JournalEntry[],
    };
  } catch (err) {
    console.error('[JournalService] Get entries exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error fetching journal entries',
    };
  }
}

/**
 * Get a single journal entry by ID
 *
 * @param entryId - UUID of the journal entry
 * @returns Journal entry data
 */
export async function getEntry(entryId: string): Promise<JournalServiceResult<JournalEntry>> {
  try {
    const supabase = supabaseAdmin;

    const { data: entry, error } = await supabase
      .from('ai_phill_journal_entries')
      .select('*')
      .eq('id', entryId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: 'Journal entry not found',
        };
      }
      console.error('[JournalService] Get entry error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: entry as JournalEntry,
    };
  } catch (err) {
    console.error('[JournalService] Get entry exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error fetching journal entry',
    };
  }
}

/**
 * Update a journal entry
 *
 * @param entryId - UUID of the journal entry
 * @param data - Update data
 * @returns Updated journal entry
 */
export async function updateEntry(
  entryId: string,
  data: UpdateJournalEntryInput
): Promise<JournalServiceResult<JournalEntry>> {
  try {
    const supabase = supabaseAdmin;

    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) {
      updateData.title = data.title;
    }
    if (data.body !== undefined) {
      updateData.body_md = data.body;
    }
    if (data.tags !== undefined) {
      updateData.tags = data.tags;
    }
    if (data.businessId !== undefined) {
      updateData.related_business_id = data.businessId;
    }

    const { data: entry, error } = await supabase
      .from('ai_phill_journal_entries')
      .update(updateData)
      .eq('id', entryId)
      .select()
      .single();

    if (error) {
      console.error('[JournalService] Update entry error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: entry as JournalEntry,
    };
  } catch (err) {
    console.error('[JournalService] Update entry exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error updating journal entry',
    };
  }
}

/**
 * Delete a journal entry
 *
 * @param entryId - UUID of the journal entry
 * @returns Success/failure result
 */
export async function deleteEntry(entryId: string): Promise<JournalServiceResult<void>> {
  try {
    const supabase = supabaseAdmin;

    const { error } = await supabase.from('ai_phill_journal_entries').delete().eq('id', entryId);

    if (error) {
      console.error('[JournalService] Delete entry error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (err) {
    console.error('[JournalService] Delete entry exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error deleting journal entry',
    };
  }
}

/**
 * Add tags to a journal entry
 *
 * @param entryId - UUID of the journal entry
 * @param tags - Tags to add
 * @returns Updated journal entry
 */
export async function addTags(
  entryId: string,
  tags: string[]
): Promise<JournalServiceResult<JournalEntry>> {
  try {
    // First get the existing entry
    const existingResult = await getEntry(entryId);
    if (!existingResult.success || !existingResult.data) {
      return {
        success: false,
        error: existingResult.error || 'Entry not found',
      };
    }

    // Merge tags and remove duplicates
    const existingTags = existingResult.data.tags || [];
    const newTags = [...new Set([...existingTags, ...tags])];

    return updateEntry(entryId, { tags: newTags });
  } catch (err) {
    console.error('[JournalService] Add tags exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error adding tags',
    };
  }
}

/**
 * Remove tags from a journal entry
 *
 * @param entryId - UUID of the journal entry
 * @param tags - Tags to remove
 * @returns Updated journal entry
 */
export async function removeTags(
  entryId: string,
  tags: string[]
): Promise<JournalServiceResult<JournalEntry>> {
  try {
    // First get the existing entry
    const existingResult = await getEntry(entryId);
    if (!existingResult.success || !existingResult.data) {
      return {
        success: false,
        error: existingResult.error || 'Entry not found',
      };
    }

    // Remove specified tags
    const existingTags = existingResult.data.tags || [];
    const newTags = existingTags.filter((t) => !tags.includes(t));

    return updateEntry(entryId, { tags: newTags });
  } catch (err) {
    console.error('[JournalService] Remove tags exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error removing tags',
    };
  }
}

/**
 * Get all unique tags used by a founder
 *
 * @param ownerUserId - UUID of the founder user
 * @returns List of unique tags
 */
export async function getAllTags(ownerUserId: string): Promise<JournalServiceResult<string[]>> {
  try {
    const supabase = supabaseAdmin;

    const { data: entries, error } = await supabase
      .from('ai_phill_journal_entries')
      .select('tags')
      .eq('owner_user_id', ownerUserId);

    if (error) {
      console.error('[JournalService] Get all tags error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    // Flatten and deduplicate tags
    const allTags = (entries || []).flatMap((e) => e.tags || []);
    const uniqueTags = [...new Set(allTags)].sort();

    return {
      success: true,
      data: uniqueTags,
    };
  } catch (err) {
    console.error('[JournalService] Get all tags exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error fetching tags',
    };
  }
}

/**
 * Count journal entries for a founder
 *
 * @param ownerUserId - UUID of the founder user
 * @param businessId - Optional filter by business
 * @returns Count of entries
 */
export async function countEntries(
  ownerUserId: string,
  businessId?: string
): Promise<JournalServiceResult<number>> {
  try {
    const supabase = supabaseAdmin;

    let query = supabase
      .from('ai_phill_journal_entries')
      .select('id', { count: 'exact', head: true })
      .eq('owner_user_id', ownerUserId);

    if (businessId) {
      query = query.eq('related_business_id', businessId);
    }

    const { count, error } = await query;

    if (error) {
      console.error('[JournalService] Count entries error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: count || 0,
    };
  } catch (err) {
    console.error('[JournalService] Count entries exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error counting entries',
    };
  }
}

/**
 * Get recent entries for AI context
 *
 * @param ownerUserId - UUID of the founder user
 * @param limit - Number of entries to return
 * @returns Recent journal entries
 */
export async function getRecentEntriesForContext(
  ownerUserId: string,
  limit = 10
): Promise<JournalServiceResult<string[]>> {
  try {
    const entriesResult = await getEntries(ownerUserId, { limit });

    if (!entriesResult.success || !entriesResult.data) {
      return {
        success: false,
        error: entriesResult.error || 'Failed to fetch entries',
      };
    }

    // Format entries for AI context
    const formattedEntries = entriesResult.data.map((e) => {
      const header = e.title ? `## ${e.title}\n` : '';
      const date = `*${new Date(e.created_at).toLocaleDateString()}*\n`;
      const tags = e.tags.length > 0 ? `Tags: ${e.tags.join(', ')}\n` : '';
      return `${header}${date}${tags}\n${e.body_md}`;
    });

    return {
      success: true,
      data: formattedEntries,
    };
  } catch (err) {
    console.error('[JournalService] Get recent entries for context exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error fetching entries for context',
    };
  }
}

/**
 * Search journal entries by content
 *
 * @param ownerUserId - UUID of the founder user
 * @param searchTerm - Search term
 * @param limit - Maximum results
 * @returns Matching journal entries
 */
export async function searchEntries(
  ownerUserId: string,
  searchTerm: string,
  limit = 20
): Promise<JournalServiceResult<JournalEntry[]>> {
  return getEntries(ownerUserId, { searchTerm, limit });
}

/**
 * Get entries by date range
 *
 * @param ownerUserId - UUID of the founder user
 * @param dateFrom - Start date (ISO string)
 * @param dateTo - End date (ISO string)
 * @returns Journal entries in date range
 */
export async function getEntriesByDateRange(
  ownerUserId: string,
  dateFrom: string,
  dateTo: string
): Promise<JournalServiceResult<JournalEntry[]>> {
  return getEntries(ownerUserId, { dateFrom, dateTo });
}

/**
 * Get entries by tag
 *
 * @param ownerUserId - UUID of the founder user
 * @param tag - Tag to filter by
 * @param limit - Maximum results
 * @returns Journal entries with the specified tag
 */
export async function getEntriesByTag(
  ownerUserId: string,
  tag: string,
  limit = 50
): Promise<JournalServiceResult<JournalEntry[]>> {
  return getEntries(ownerUserId, { tags: [tag], limit });
}

/**
 * Get entries for a specific business
 *
 * @param ownerUserId - UUID of the founder user
 * @param businessId - UUID of the business
 * @param limit - Maximum results
 * @returns Journal entries for the business
 */
export async function getEntriesByBusiness(
  ownerUserId: string,
  businessId: string,
  limit = 50
): Promise<JournalServiceResult<JournalEntry[]>> {
  return getEntries(ownerUserId, { businessId, limit });
}
