// src/lib/command-centre/realtime.ts
//
// CC-25 — Real-time layer. Thin wrapper over Supabase Realtime (postgres_changes)
// so the Command Deck reflects queue/session changes live — including changes made
// by crons and overnight sessions, not just the current tab.
//
// RLS authorises every event: a founder only receives changes to their own rows
// (the cc_* tables all have founder-scoped RLS). The subscribe helper is decoupled
// from the concrete Supabase client via a minimal structural interface so it can be
// unit-tested without a live socket.

export const CC_REALTIME_CHANNEL = 'cc:queue'

/** Tables whose changes should refresh the board. */
export const CC_REALTIME_TABLES = ['cc_tasks', 'cc_execution_sessions'] as const
export type RealtimeTable = (typeof CC_REALTIME_TABLES)[number]

/** A postgres_changes binding for one table (all events, public schema). */
export function changeBinding(table: string) {
  return { event: '*' as const, schema: 'public' as const, table }
}

// Minimal structural shape of the Supabase client surface we use — keeps this
// module testable and free of the heavy generated client types.
export interface RealtimeChannelLike {
  on(type: 'postgres_changes', config: ReturnType<typeof changeBinding>, cb: (payload: unknown) => void): RealtimeChannelLike
  subscribe(cb?: (status: string) => void): RealtimeChannelLike
}
export interface RealtimeClientLike {
  channel(name: string): RealtimeChannelLike
  removeChannel(channel: RealtimeChannelLike): void
}

/**
 * Subscribe to live changes on the command-centre queue tables. `onChange` fires
 * (with the table name) on any insert/update/delete the founder can see; callers
 * typically debounce a refetch. Returns an unsubscribe function.
 */
export function subscribeToQueue(
  client: RealtimeClientLike,
  onChange: (table: RealtimeTable) => void,
  onStatus?: (status: string) => void,
): () => void {
  const channel = client.channel(CC_REALTIME_CHANNEL)
  for (const table of CC_REALTIME_TABLES) {
    channel.on('postgres_changes', changeBinding(table), () => onChange(table))
  }
  channel.subscribe((status) => onStatus?.(status))
  return () => client.removeChannel(channel)
}
