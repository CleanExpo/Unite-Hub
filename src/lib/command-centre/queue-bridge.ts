// src/lib/command-centre/queue-bridge.ts
//
// CC-04 — durable bridge between the in-memory RunQueueStore and the cc_tasks /
// cc_task_events tables (CC-03).
//
// This is an OPTIONAL, additive wrapper. It does NOT modify run-queue.ts or the
// default in-memory `founderRunQueueStore` — it composes `createRunQueueStore`
// and forwards a side-effect (persistence) on enqueue/transition. If persistence
// throws, the in-memory result is still returned and the queue keeps working
// (durability is best-effort here; the source of truth for live state remains the
// in-memory store, exactly as before).
//
// No DB calls are made at import time. The persistence implementation is injected
// by the caller, so this module has zero hard dependency on Supabase.

import {
  createRunQueueStore,
  type RunQueueStore,
  type EnqueueRunQueueInput,
  type TransitionRunQueueInput,
} from '@/lib/founder-os/run-queue'
import type {
  FounderRunQueueItem,
  FounderRunQueueAction,
} from '@/lib/founder-os/types'

/**
 * The payload mirrored to durable storage when a queue item is enqueued.
 * Shapes the cc_tasks row a persistence adapter would upsert.
 */
export interface QueuePersistEnqueue {
  /** Stable external key — the RunQueueStore id (e.g. 'run_task-1'). */
  externalRef: string
  title: string
  objective: string
  status: FounderRunQueueItem['status']
  riskLevel: FounderRunQueueItem['taskPacket']['riskLevel']
  projectKey: FounderRunQueueItem['taskPacket']['portfolioTarget']
  humanApprovalRequired: boolean
  item: FounderRunQueueItem
}

/**
 * The payload mirrored to durable storage when a queue item transitions.
 * Shapes the cc_task_events append + the cc_tasks status update.
 */
export interface QueuePersistTransition {
  externalRef: string
  action: FounderRunQueueAction
  actor: string
  status: FounderRunQueueItem['status']
  note?: string
  evidenceLink?: string
  item: FounderRunQueueItem
}

/**
 * Durability adapter. Implementations mirror queue state to cc_tasks /
 * cc_task_events. Both methods are awaited but their failure never breaks the
 * in-memory queue (see `onPersistError`).
 */
export interface QueuePersistence {
  onEnqueue(payload: QueuePersistEnqueue): Promise<void> | void
  onTransition(payload: QueuePersistTransition): Promise<void> | void
}

export interface PersistentRunQueueOptions {
  /** Seed the wrapped in-memory store with existing items (recovery). */
  initialItems?: FounderRunQueueItem[]
  /**
   * Called if a persistence method throws/rejects. Defaults to console.error.
   * The in-memory operation still succeeds regardless.
   */
  onPersistError?: (stage: 'enqueue' | 'transition', error: unknown) => void
}

/**
 * Wrap a fresh in-memory RunQueueStore so every enqueue/transition is mirrored
 * to the injected persistence. Returns the SAME RunQueueStore interface, so it
 * is a drop-in for any code that expects a RunQueueStore — the in-memory state
 * machine semantics are identical (read paths are pass-through).
 */
export function createPersistentRunQueueStore(
  persistence: QueuePersistence,
  options: PersistentRunQueueOptions = {},
): RunQueueStore {
  const inner = createRunQueueStore(options.initialItems ?? [])
  const onError =
    options.onPersistError ??
    ((stage: 'enqueue' | 'transition', error: unknown) => {
      // Best-effort durability — never throw from the side-effect.
      console.error(`[queue-bridge] persistence ${stage} failed:`, error)
    })

  async function safePersist(
    stage: 'enqueue' | 'transition',
    run: () => Promise<void> | void,
  ): Promise<void> {
    try {
      await run()
    } catch (error) {
      onError(stage, error)
    }
  }

  return {
    enqueue(input: EnqueueRunQueueInput): FounderRunQueueItem {
      const item = inner.enqueue(input)
      void safePersist('enqueue', () =>
        persistence.onEnqueue({
          externalRef: item.id,
          title: item.taskPacket.objective || item.taskPacket.originalMessage,
          objective: item.taskPacket.objective,
          status: item.status,
          riskLevel: item.taskPacket.riskLevel,
          projectKey: item.taskPacket.portfolioTarget,
          humanApprovalRequired: Boolean(item.taskPacket.requiresHumanApproval),
          item,
        }),
      )
      return item
    },
    transition(input: TransitionRunQueueInput): FounderRunQueueItem {
      const item = inner.transition(input)
      void safePersist('transition', () =>
        persistence.onTransition({
          externalRef: item.id,
          action: input.action,
          actor: input.actor,
          status: item.status,
          note: input.note,
          evidenceLink: input.evidenceLink,
          item,
        }),
      )
      return item
    },
    // Read paths are pure pass-through — no behavioural change.
    get: inner.get,
    list: inner.list,
    summary: inner.summary,
    clear: inner.clear,
  }
}
