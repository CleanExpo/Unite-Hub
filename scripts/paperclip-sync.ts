/**
 * scripts/paperclip-sync.ts
 *
 * Bulk sync all existing Paperclip tasks into Unite-Group via the webhook endpoint.
 *
 * WHY LOCAL: Paperclip runs on a local-network-only spare laptop. Vercel cannot
 * reach it directly. This script runs on the same LAN machine and pushes each
 * task to Unite-Group's public webhook, which handles AI processing → Linear.
 *
 * SAFE TO RE-RUN: The webhook dedup table (webhook_events) catches duplicates
 * via PostgreSQL unique_violation (23505) — already-synced tasks are skipped.
 *
 * Usage:
 *   npx tsx scripts/paperclip-sync.ts
 *
 * Env vars (from .env.local):
 *   PAPERCLIP_API_URL     — Paperclip base URL, e.g. http://192.168.2.37:3100
 *   PAPERCLIP_API_KEY     — API key for both calling Paperclip AND the webhook
 *   NEXT_PUBLIC_APP_URL   — Unite-Group public URL (defaults to production URL)
 */
import { config } from 'dotenv'
// Load .env.local first (Next.js convention), then .env as fallback
config({ path: '.env.local' })
config()

const PAPERCLIP_URL = process.env.PAPERCLIP_API_URL?.trim()
const PAPERCLIP_KEY = process.env.PAPERCLIP_API_KEY?.trim()
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.trim() ?? 'https://unite-group.in'
const WEBHOOK_URL = `${APP_URL}/api/webhooks/paperclip`

// ─── Types ───────────────────────────────────────────────────────────────────

interface PaperclipTask {
  id: string
  /** Paperclip may use camelCase or snake_case — we handle both */
  businessKey?: string
  business_key?: string
  type?: string
  title?: string
  description: string
  priority?: number
  status?: string
}

type SyncResult = 'processed' | 'duplicate' | 'error'

// ─── API calls ───────────────────────────────────────────────────────────────

async function fetchPaperclipTasks(): Promise<PaperclipTask[]> {
  const response = await fetch(`${PAPERCLIP_URL}/api/tasks`, {
    headers: {
      'x-api-key': PAPERCLIP_KEY!,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(
      `Paperclip /api/tasks failed: ${response.status} ${response.statusText}`
    )
  }

  const data: unknown = await response.json()

  // Handle both { tasks: [...] } envelope and bare array responses
  if (Array.isArray(data)) return data as PaperclipTask[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    const inner = obj['tasks'] ?? obj['data'] ?? obj['items']
    if (Array.isArray(inner)) return inner as PaperclipTask[]
  }

  throw new Error(`Unexpected Paperclip response shape: ${JSON.stringify(data).slice(0, 200)}`)
}

async function pushTask(task: PaperclipTask): Promise<SyncResult> {
  const pkg = {
    id: task.id,
    // Normalise field name; fall back to synthex if Paperclip omits business
    businessKey: task.businessKey ?? task.business_key ?? 'synthex',
    type: task.type ?? 'feature',
    title: task.title,           // Optional — omit to trigger AI title generation
    description: task.description,
    priority: task.priority,
  }

  let response: Response
  try {
    response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': PAPERCLIP_KEY!,
      },
      body: JSON.stringify(pkg),
    })
  } catch (err) {
    console.error(`    Network error pushing task ${task.id}:`, err)
    return 'error'
  }

  const body = await response.json().catch(() => ({})) as Record<string, unknown>

  if (!response.ok) {
    console.error(`    Webhook error ${response.status} for task ${task.id}:`, body)
    return 'error'
  }

  return body['status'] === 'duplicate' ? 'duplicate' : 'processed'
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // Pre-flight checks
  if (!PAPERCLIP_URL) {
    console.error('❌  PAPERCLIP_API_URL is not set in .env.local')
    process.exit(1)
  }
  if (!PAPERCLIP_KEY) {
    console.error('❌  PAPERCLIP_API_KEY is not set in .env.local')
    process.exit(1)
  }

  console.log(`\n📋  Paperclip Sync`)
  console.log(`   Paperclip : ${PAPERCLIP_URL}`)
  console.log(`   Webhook   : ${WEBHOOK_URL}\n`)

  // Fetch all tasks from Paperclip
  let tasks: PaperclipTask[]
  try {
    tasks = await fetchPaperclipTasks()
  } catch (err) {
    console.error('❌  Failed to fetch tasks from Paperclip:', err)
    process.exit(1)
  }

  if (tasks.length === 0) {
    console.log('✅  No tasks found in Paperclip — nothing to sync.')
    return
  }

  console.log(`Found ${tasks.length} task${tasks.length === 1 ? '' : 's'}. Syncing...\n`)

  let processed = 0
  let duplicates = 0
  let errors = 0

  for (const task of tasks) {
    const label = task.title ?? task.description.slice(0, 60)
    const result = await pushTask(task)

    if (result === 'processed') {
      processed++
      console.log(`  ✅  ${task.id}  ${label}`)
    } else if (result === 'duplicate') {
      duplicates++
      console.log(`  ⏭   ${task.id}  (already synced — skipped)`)
    } else {
      errors++
      console.error(`  ❌  ${task.id}  FAILED — check logs above`)
    }
  }

  // Summary
  console.log(`\n${'─'.repeat(50)}`)
  console.log(`Sync complete:`)
  if (processed > 0) console.log(`  ✅  ${processed} newly synced → Linear`)
  if (duplicates > 0) console.log(`  ⏭   ${duplicates} skipped (already in system)`)
  if (errors > 0) console.log(`  ❌  ${errors} failed`)
  console.log(`${'─'.repeat(50)}\n`)

  if (errors > 0) process.exit(1)
}

main().catch((err: unknown) => {
  console.error('Unhandled error:', err)
  process.exit(1)
})
