/**
 * Persistent Memory Manager (Workforce Engine)
 *
 * Three-scope memory system for agent workforce:
 * - workspace: shared across all agents in a workspace
 * - agent: per-agent, persists across sessions
 * - session: ephemeral, expires with TTL or session end
 *
 * Storage: reuses the existing `ai_memory` Supabase table via MemoryStore,
 * namespaced with `memory_type = 'workforce_memory'`. No new migrations needed.
 *
 * @module lib/agents/workforce/memory
 */

import type {
  WorkforceMemoryEntry,
  MemoryScope,
  ScopeIdentifier,
} from './types';

// ============================================================================
// Memory Manager
// ============================================================================

export class WorkforceMemoryManager {
  /**
   * Store a value in workforce memory.
   * Delegates to existing MemoryStore for Supabase persistence.
   */
  async set(
    entry: Omit<WorkforceMemoryEntry, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const { MemoryStore } = await import('@/lib/memory/memoryStore');
    const store = new MemoryStore();

    const now = new Date().toISOString();
    const expiresAt =
      entry.ttlMs && entry.scope === 'session'
        ? new Date(Date.now() + entry.ttlMs).toISOString()
        : undefined;

    // Build keywords for efficient retrieval
    const keywords = [
      `wf:${entry.scope}`,
      `wf:key:${entry.key}`,
    ];
    if (entry.agentId) keywords.push(`wf:agent:${entry.agentId}`);
    if (entry.sessionId) keywords.push(`wf:session:${entry.sessionId}`);

    const result = await store.store({
      workspaceId: entry.workspaceId,
      agent: entry.agentId || 'workforce',
      memoryType: 'pattern', // Closest existing MemoryType for workforce data
      content: {
        _type: 'workforce_memory',
        scope: entry.scope,
        key: entry.key,
        value: entry.value,
        agentId: entry.agentId,
        sessionId: entry.sessionId,
        importance: entry.importance,
        expiresAt,
        createdAt: now,
        updatedAt: now,
      },
      importance: entry.importance,
      confidence: 90,
      keywords,
      source: 'workforce-engine',
      metadata: {
        workforceScope: entry.scope,
        workforceKey: entry.key,
      },
    });

    return result.memoryId;
  }

  /**
   * Retrieve a memory entry by scope + key.
   */
  async get(
    scope: MemoryScope,
    key: string,
    scopeId: ScopeIdentifier
  ): Promise<WorkforceMemoryEntry | null> {
    const { getSupabaseServer } = await import('@/lib/supabase');
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('ai_memory')
      .select('*')
      .eq('workspace_id', scopeId.workspaceId)
      .contains('keywords', [`wf:${scope}`, `wf:key:${key}`])
      .order('created_at', { ascending: false })
      .limit(1);

    if (scope === 'agent' && scopeId.agentId) {
      query = query.contains('keywords', [`wf:agent:${scopeId.agentId}`]);
    }
    if (scope === 'session' && scopeId.sessionId) {
      query = query.contains('keywords', [`wf:session:${scopeId.sessionId}`]);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) return null;

    const row = data[0];
    const content = row.content as Record<string, any>;

    // Check expiry
    if (content.expiresAt && new Date(content.expiresAt) < new Date()) {
      // Expired — clean up and return null
      await supabase.from('ai_memory').delete().eq('id', row.id);
      return null;
    }

    return this.rowToEntry(row);
  }

  /**
   * List entries for a scope with optional filters.
   */
  async list(
    scope: MemoryScope,
    scopeId: ScopeIdentifier,
    options?: {
      prefix?: string;
      limit?: number;
      minImportance?: number;
    }
  ): Promise<WorkforceMemoryEntry[]> {
    const { getSupabaseServer } = await import('@/lib/supabase');
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('ai_memory')
      .select('*')
      .eq('workspace_id', scopeId.workspaceId)
      .contains('keywords', [`wf:${scope}`])
      .order('importance', { ascending: false })
      .limit(options?.limit || 50);

    if (scope === 'agent' && scopeId.agentId) {
      query = query.contains('keywords', [`wf:agent:${scopeId.agentId}`]);
    }
    if (scope === 'session' && scopeId.sessionId) {
      query = query.contains('keywords', [`wf:session:${scopeId.sessionId}`]);
    }
    if (options?.minImportance) {
      query = query.gte('importance', options.minImportance);
    }

    const { data, error } = await query;

    if (error || !data) return [];

    const entries = data
      .map((row: any) => this.rowToEntry(row))
      .filter((entry: WorkforceMemoryEntry | null): entry is WorkforceMemoryEntry => {
        if (!entry) return false;
        // Filter by prefix
        if (options?.prefix && !entry.key.startsWith(options.prefix)) return false;
        // Filter expired
        if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) return false;
        return true;
      });

    return entries;
  }

  /**
   * Update an existing entry's value.
   */
  async update(id: string, value: Record<string, unknown>): Promise<void> {
    const { getSupabaseServer } = await import('@/lib/supabase');
    const supabase = await getSupabaseServer();

    // Read current content
    const { data: existing } = await supabase
      .from('ai_memory')
      .select('content')
      .eq('id', id)
      .single();

    if (!existing) throw new Error(`Memory entry not found: ${id}`);

    const content = existing.content as Record<string, any>;
    content.value = value;
    content.updatedAt = new Date().toISOString();

    await supabase
      .from('ai_memory')
      .update({ content })
      .eq('id', id);
  }

  /**
   * Delete a memory entry.
   */
  async delete(id: string): Promise<void> {
    const { getSupabaseServer } = await import('@/lib/supabase');
    const supabase = await getSupabaseServer();

    await supabase.from('ai_memory').delete().eq('id', id);
  }

  /**
   * Delete expired session memories.
   */
  async cleanupExpired(): Promise<number> {
    const { getSupabaseServer } = await import('@/lib/supabase');
    const supabase = await getSupabaseServer();

    // Find expired entries
    const { data, error } = await supabase
      .from('ai_memory')
      .select('id, content')
      .contains('keywords', ['wf:session']);

    if (error || !data) return 0;

    const now = new Date();
    const expiredIds: string[] = [];

    for (const row of data) {
      const content = row.content as Record<string, any>;
      if (content.expiresAt && new Date(content.expiresAt) < now) {
        expiredIds.push(row.id);
      }
    }

    if (expiredIds.length > 0) {
      await supabase.from('ai_memory').delete().in('id', expiredIds);
    }

    return expiredIds.length;
  }

  /**
   * Get memory summary for an agent, formatted for prompt context injection.
   * Returns the most important memories within the token budget.
   */
  async getAgentContext(
    agentId: string,
    workspaceId: string,
    options?: {
      maxTokens?: number;
      minImportance?: number;
    }
  ): Promise<Record<string, unknown>> {
    const maxTokens = options?.maxTokens || 2000;
    const minImportance = options?.minImportance || 30;

    // Fetch agent-scoped memories
    const agentMemories = await this.list('agent', { workspaceId, agentId }, {
      minImportance,
      limit: 20,
    });

    // Fetch workspace-scoped memories
    const workspaceMemories = await this.list('workspace', { workspaceId }, {
      minImportance: Math.max(minImportance, 50), // Higher threshold for shared
      limit: 10,
    });

    // Combine and sort by importance
    const all = [...agentMemories, ...workspaceMemories]
      .sort((a, b) => b.importance - a.importance);

    // Build context within token budget
    const context: Record<string, unknown> = {};
    let tokensUsed = 0;

    for (const entry of all) {
      const entryStr = JSON.stringify(entry.value);
      const entryTokens = Math.ceil(entryStr.length / 4);

      if (tokensUsed + entryTokens > maxTokens) break;

      context[entry.key] = entry.value;
      tokensUsed += entryTokens;
    }

    return context;
  }

  /**
   * Convert a Supabase row to a WorkforceMemoryEntry.
   */
  private rowToEntry(row: any): WorkforceMemoryEntry | null {
    const content = row.content as Record<string, any>;

    // Only process workforce memory entries
    if (content._type !== 'workforce_memory') return null;

    return {
      id: row.id,
      scope: content.scope as MemoryScope,
      workspaceId: row.workspace_id,
      agentId: content.agentId,
      sessionId: content.sessionId,
      key: content.key,
      value: content.value || {},
      importance: row.importance || content.importance || 50,
      createdAt: content.createdAt || row.created_at,
      updatedAt: content.updatedAt || row.updated_at || row.created_at,
      expiresAt: content.expiresAt,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const memoryManager = new WorkforceMemoryManager();
