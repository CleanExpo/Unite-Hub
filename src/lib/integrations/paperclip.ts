// src/lib/integrations/paperclip.ts
// Unite-Group → Paperclip outbound client
// Used to acknowledge received work packages and push deliverables back to Paperclip

export function isPaperclipConfigured(): boolean {
  return !!(process.env.PAPERCLIP_API_URL && process.env.PAPERCLIP_API_KEY)
}

export interface PaperclipAck {
  taskId: string
  status: 'accepted' | 'rejected' | 'completed'
  linearIssueId?: string
  linearIssueUrl?: string
  notes?: string
}

/**
 * Acknowledge a received work package back to Paperclip.
 * Call after successfully creating the Linear issue.
 * Silently no-ops if Paperclip is not configured.
 */
export async function acknowledgeTask(ack: PaperclipAck): Promise<void> {
  if (!isPaperclipConfigured()) {
    console.warn('[Paperclip] Not configured — skipping acknowledgement for task:', ack.taskId)
    return
  }

  const response = await fetch(
    `${process.env.PAPERCLIP_API_URL!.trim()}/api/tasks/${ack.taskId}/acknowledge`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.PAPERCLIP_API_KEY!.trim(),
      },
      body: JSON.stringify(ack),
    }
  )

  if (!response.ok) {
    throw new Error(
      `Paperclip acknowledge failed: ${response.status} ${response.statusText}`
    )
  }
}

export interface PaperclipDeliverable {
  taskId: string
  type: 'pr_url' | 'linear_issue' | 'document' | 'code_snippet'
  payload: Record<string, unknown>
}

/**
 * Push a completed deliverable back to Paperclip.
 * Silently no-ops if Paperclip is not configured.
 */
export async function sendDeliverable(deliverable: PaperclipDeliverable): Promise<void> {
  if (!isPaperclipConfigured()) {
    console.warn('[Paperclip] Not configured — skipping deliverable for task:', deliverable.taskId)
    return
  }

  const response = await fetch(
    `${process.env.PAPERCLIP_API_URL!.trim()}/api/deliverables`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.PAPERCLIP_API_KEY!.trim(),
      },
      body: JSON.stringify(deliverable),
    }
  )

  if (!response.ok) {
    throw new Error(
      `Paperclip sendDeliverable failed: ${response.status} ${response.statusText}`
    )
  }
}
