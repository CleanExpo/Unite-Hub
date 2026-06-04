// src/lib/command-centre/queue-persistence.ts
//
// CC-04 (concrete) — the Supabase persistence adapter that satisfies the
// `QueuePersistence` interface from queue-bridge.ts and wires queue enqueue /
// transition side-effects into the cc_tasks / cc_task_events accessors (CC-03).
//
// This module is additive and side-effect free at import: it only constructs a
// `QueuePersistence` object whose methods call the typed accessors. The Supabase
// client is created lazily inside each accessor (or injected for tests).
//
// Design notes:
//  - onEnqueue creates a cc_tasks row + a 'created' audit event.
//  - onTransition updates cc_tasks.status by external_ref and, when a row is
//    found, appends the mapped audit event. A missing/unknown external_ref is
//    handled quietly (no row → no event, no throw), matching the bridge's
//    best-effort durability contract.

import type {
  QueuePersistence,
  QueuePersistEnqueue,
  QueuePersistTransition,
} from '@/lib/command-centre/queue-bridge'
import type {
  FounderRunQueueItem,
  FounderRunQueueAction,
} from '@/lib/founder-os/types'
import {
  createTask,
  appendTaskEvent,
  updateTaskStatusByExternalRef,
  type SupabaseLike,
  type TaskStatus,
  type TaskEventType,
  type TaskRiskLevel,
} from '@/lib/command-centre/tasks'

/**
 * Map a FounderRunQueueItem status onto the durable cc_tasks TaskStatus union.
 * Falls back to 'queued' for any unrecognised value.
 */
export function mapStatus(queueStatus: FounderRunQueueItem['status']): TaskStatus {
  switch (queueStatus) {
    case 'queued':
      return 'queued'
    case 'waiting_for_approval':
      return 'awaiting_approval'
    case 'waiting_for_device':
      // No dedicated device-wait status in cc_tasks; closest is 'queued'.
      return 'queued'
    case 'in_progress':
      return 'running'
    case 'blocked':
      return 'blocked'
    case 'completed':
      return 'done'
    default:
      return 'queued'
  }
}

/**
 * Map the queue's risk level onto the cc_tasks TaskRiskLevel union. The queue
 * has a 'human_only' band with no cc_tasks equivalent; treat it as 'critical'
 * (the highest cc_tasks risk). Falls back to 'low'.
 */
export function mapRiskLevel(
  riskLevel: FounderRunQueueItem['taskPacket']['riskLevel'],
): TaskRiskLevel {
  switch (riskLevel) {
    case 'low':
      return 'low'
    case 'medium':
      return 'medium'
    case 'high':
      return 'high'
    case 'human_only':
      return 'critical'
    default:
      return 'low'
  }
}

/**
 * Map a FounderRunQueueAction onto the cc_task_events TaskEventType union.
 * Falls back to 'status_changed' for any unrecognised action.
 */
export function mapAction(action: FounderRunQueueAction): TaskEventType {
  switch (action) {
    case 'approve':
      return 'approved'
    case 'start':
      return 'started'
    case 'block':
      return 'blocked'
    case 'complete':
      return 'completed'
    default:
      return 'status_changed'
  }
}

/**
 * Build a `QueuePersistence` adapter backed by the cc_tasks accessors, scoped to
 * a single founder. Pass `client` in tests; production omits it so each accessor
 * lazily creates a founder-scoped server client.
 */
export function createSupabaseQueuePersistence(opts: {
  founderId: string
  client?: SupabaseLike
}): QueuePersistence {
  const { founderId, client } = opts

  return {
    async onEnqueue(p: QueuePersistEnqueue): Promise<void> {
      const created = await createTask(
        {
          founderId,
          externalRef: p.externalRef,
          title: p.title,
          objective: p.objective,
          status: mapStatus(p.status),
          riskLevel: mapRiskLevel(p.riskLevel),
          projectKey: p.projectKey ?? null,
          humanApprovalRequired: p.humanApprovalRequired,
          origin: 'idea',
        },
        client,
      )

      await appendTaskEvent(
        {
          founderId,
          taskId: created.id,
          type: 'created',
          payload: { externalRef: p.externalRef },
        },
        client,
      )
    },

    async onTransition(p: QueuePersistTransition): Promise<void> {
      const row = await updateTaskStatusByExternalRef(
        { founderId, externalRef: p.externalRef, status: mapStatus(p.status) },
        client,
      )

      // Missing/unknown external_ref → quietly do nothing (no event, no throw).
      if (!row) return

      await appendTaskEvent(
        {
          founderId,
          taskId: row.id,
          type: mapAction(p.action),
          actor: p.actor,
          payload: { note: p.note, evidenceLink: p.evidenceLink },
        },
        client,
      )
    },
  }
}
