/**
 * Agent Memory Fabric
 *
 * Implements a unified memory system across all agents with three scopes:
 * - short_term: Recent findings (expires after hours)
 * - working: Active task context (expires after task completion)
 * - long_term: Strategic insights (persistent, permanent storage)
 */

export type MemoryScope = 'short_term' | 'working' | 'long_term';

export interface AgentMemoryItem {
  id: string;
  agent: string;
  scope: MemoryScope;
  topic: string;
  payload: any;
  importance: number; // 0–1, used for prioritization
  createdAt: string;
  expiresAt?: string | null;
  tags?: string[];
}

// In-memory store for demo (would use database in production)
let inMemoryStore: AgentMemoryItem[] = [];

/**
 * Write memory item to fabric
 */
export function writeMemory(item: Omit<AgentMemoryItem, 'id' | 'createdAt'>): AgentMemoryItem {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const record: AgentMemoryItem = { id, createdAt, ...item };
  inMemoryStore.push(record);
  return record;
}

/**
 * Query memory with filters
 */
export function queryMemory(opts: {
  agent?: string;
  scope?: MemoryScope;
  topic?: string;
  minImportance?: number;
  tag?: string;
  limit?: number;
}): AgentMemoryItem[] {
  let res = inMemoryStore;

  // Filter by criteria
  if (opts.agent) res = res.filter(m => m.agent === opts.agent);
  if (opts.scope) res = res.filter(m => m.scope === opts.scope);
  if (opts.topic) res = res.filter(m => m.topic === opts.topic);
  if (opts.minImportance !== undefined) res = res.filter(m => m.importance >= opts.minImportance);
  if (opts.tag) res = res.filter(m => m.tags?.includes(opts.tag));

  // Exclude expired items
  const now = new Date();
  res = res.filter(m => !m.expiresAt || new Date(m.expiresAt) > now);

  // Sort by importance then recency
  res = res.sort((a, b) => b.importance - a.importance || b.createdAt.localeCompare(a.createdAt));

  return res.slice(0, opts.limit ?? 20);
}

/**
 * Get memory by ID
 */
export function getMemoryItem(id: string): AgentMemoryItem | null {
  return inMemoryStore.find(m => m.id === id) ?? null;
}

/**
 * Update memory importance
 */
export function updateMemoryImportance(id: string, importance: number): AgentMemoryItem | null {
  const item = inMemoryStore.find(m => m.id === id);
  if (item) {
    item.importance = Math.max(0, Math.min(1, importance));
  }
  return item ?? null;
}

/**
 * Clean up expired memory
 */
export function cleanupExpiredMemory(now = new Date()): number {
  const before = inMemoryStore.length;
  inMemoryStore = inMemoryStore.filter(m => !m.expiresAt || new Date(m.expiresAt) > now);
  return before - inMemoryStore.length;
}

/**
 * Clear all memory for an agent
 */
export function clearAgentMemory(agent: string): number {
  const before = inMemoryStore.length;
  inMemoryStore = inMemoryStore.filter(m => m.agent !== agent);
  return before - inMemoryStore.length;
}

/**
 * Get memory statistics
 */
export function getMemoryStats() {
  return {
    totalItems: inMemoryStore.length,
    byScope: {
      short_term: inMemoryStore.filter(m => m.scope === 'short_term').length,
      working: inMemoryStore.filter(m => m.scope === 'working').length,
      long_term: inMemoryStore.filter(m => m.scope === 'long_term').length,
    },
    byAgent: inMemoryStore.reduce((acc, m) => {
      acc[m.agent] = (acc[m.agent] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    avgImportance: inMemoryStore.length > 0
      ? inMemoryStore.reduce((sum, m) => sum + m.importance, 0) / inMemoryStore.length
      : 0,
  };
}
