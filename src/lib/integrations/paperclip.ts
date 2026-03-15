// src/lib/integrations/paperclip.ts
// Unite-Group → Paperclip outbound client

export function isPaperclipConfigured(): boolean {
  return !!(process.env.PAPERCLIP_API_URL && process.env.PAPERCLIP_API_KEY)
}

interface PaperclipAck {
  taskId: string
  status: 'accepted' | 'rejected' | 'completed'
  linearIssueId?: string
  linearIssueUrl?: string
  notes?: string
}

/**
 * Acknowledge a received work package back to Paperclip.
 * Called after successfully creating the Linear issue.
 */
export async function acknowledgeTask(ack: PaperclipAck): Promise<void> {
  if (!isPaperclipConfigured()) {
    console.warn('[Paperclip] Not configured — skipping acknowledgement')
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

interface PaperclipDeliverable {
  taskId: string
  type: 'pr_url' | 'linear_issue' | 'document' | 'code_snippet'
  payload: Record<string, unknown>
}

/**
 * Push a completed deliverable back to Paperclip.
 */
export async function sendDeliverable(
  deliverable: PaperclipDeliverable
): Promise<void> {
  if (!isPaperclipConfigured()) return

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
    throw new Error(`Paperclip send deliverable failed: ${response.status}`)
  }
}
