// src/lib/ai/features/memory-store.ts
// Supabase-backed AI memory store for cross-session persistence.
// Each memory is scoped to founder_id + capability_id + key — one row per triple.
// RLS on `ai_memories` enforces strict per-founder isolation.
//
// Usage pattern:
//   await storeMemory({ founderId, capabilityId: 'advisory', memoryType: 'outcome', key, value })
//   const context = formatMemoriesForContext(await recallMemories(founderId, 'advisory'))

import { createServiceClient } from '@/lib/supabase/service'

// ── Types ────────────────────────────────────────────────────────────────────

export type MemoryType = 'fact' | 'preference' | 'outcome' | 'pattern'

export interface Memory {
  id: string
  founderId: string
  capabilityId: string
  memoryType: MemoryType
  key: string
  value: string
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface StoreMemoryInput {
  founderId: string
  capabilityId: string
  memoryType: MemoryType
  key: string
  value: string
  metadata?: Record<string, unknown>
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

/**
 * Upsert a memory. If a record with the same (founderId, capabilityId, key)
 * already exists it is overwritten — memories represent the latest known state,
 * not a log of every past value.
 *
 * Silent on error: memory failures must never break the primary capability flow.
 */
export async function storeMemory(input: StoreMemoryInput): Promise<void> {
  const supabase = createServiceClient()
  const { error } = await supabase.from('ai_memories').upsert(
    {
      founder_id:    input.founderId,
      capability_id: input.capabilityId,
      memory_type:   input.memoryType,
      key:           input.key,
      value:         input.value,
      metadata:      input.metadata ?? {},
    },
    { onConflict: 'founder_id,capability_id,key' }
  )
  if (error) {
    console.error('[memory-store] storeMemory failed:', error.message)
  }
}

/**
 * Recall all memories for a founder + capability, newest first.
 * Returns an empty array on error — the calling capability can still proceed.
 */
export async function recallMemories(
  founderId: string,
  capabilityId: string,
  limit = 20
): Promise<Memory[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('ai_memories')
    .select('*')
    .eq('founder_id', founderId)
    .eq('capability_id', capabilityId)
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[memory-store] recallMemories failed:', error.message)
    return []
  }
  return (data ?? []).map(toMemory)
}

/**
 * Recall memories of a specific type (e.g. only 'outcome' memories).
 */
export async function recallMemoriesByType(
  founderId: string,
  capabilityId: string,
  memoryType: MemoryType,
  limit = 10
): Promise<Memory[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('ai_memories')
    .select('*')
    .eq('founder_id', founderId)
    .eq('capability_id', capabilityId)
    .eq('memory_type', memoryType)
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[memory-store] recallMemoriesByType failed:', error.message)
    return []
  }
  return (data ?? []).map(toMemory)
}

/**
 * Delete a specific memory by key.
 * Silent on error — non-critical operation.
 */
export async function deleteMemory(
  founderId: string,
  capabilityId: string,
  key: string
): Promise<void> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('ai_memories')
    .delete()
    .eq('founder_id', founderId)
    .eq('capability_id', capabilityId)
    .eq('key', key)

  if (error) {
    console.error('[memory-store] deleteMemory failed:', error.message)
  }
}

// ── Formatting ───────────────────────────────────────────────────────────────

/**
 * Format retrieved memories into a structured context block for injection
 * into a system prompt or user message. Groups by memory_type for readability.
 * Returns an empty string when no memories exist (safe to conditionally append).
 */
export function formatMemoriesForContext(memories: Memory[]): string {
  if (memories.length === 0) return ''

  const grouped: Partial<Record<MemoryType, Memory[]>> = {}
  for (const m of memories) {
    grouped[m.memoryType] ??= []
    grouped[m.memoryType]!.push(m)
  }

  const sections: string[] = ['[MEMORY CONTEXT — from prior sessions]']

  const labels: Record<MemoryType, string> = {
    preference: 'Founder Preferences',
    fact:       'Known Facts',
    outcome:    'Prior Outcomes',
    pattern:    'Observed Patterns',
  }

  // Render in priority order: preferences first (most influential)
  for (const type of ['preference', 'fact', 'outcome', 'pattern'] as MemoryType[]) {
    const items = grouped[type]
    if (!items?.length) continue
    sections.push(`\n${labels[type]}:`)
    for (const m of items) {
      sections.push(`- ${m.key}: ${m.value}`)
    }
  }

  return sections.join('\n')
}

// ── Internal mapper ──────────────────────────────────────────────────────────

function toMemory(row: Record<string, unknown>): Memory {
  return {
    id:           row.id as string,
    founderId:    row.founder_id as string,
    capabilityId: row.capability_id as string,
    memoryType:   row.memory_type as MemoryType,
    key:          row.key as string,
    value:        row.value as string,
    metadata:     (row.metadata ?? {}) as Record<string, unknown>,
    createdAt:    row.created_at as string,
    updatedAt:    row.updated_at as string,
  }
}
