import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { NextResponse } from 'next/server'
import { createIssue, type CreateIssueInput } from '@/lib/integrations/linear'

export const dynamic = 'force-dynamic'

type ExecFileAsync = (file: string, args: string[], options: { timeout: number; windowsHide: boolean }) => Promise<{ stdout: string; stderr?: string }>
type CreateLinearIssue = (input: CreateIssueInput) => Promise<{ id: string; url?: string }>

const defaultExecFileAsync = promisify(execFile) as ExecFileAsync
let execFileAsync: ExecFileAsync = defaultExecFileAsync
let createLinearIssue: CreateLinearIssue = createIssue

const STATUS_SYMBOLS: Record<string, string> = {
  '✓': 'done',
  '▶': 'ready',
  '●': 'running',
  '■': 'blocked',
  '○': 'todo',
  '◌': 'scheduled',
}

const TASK_ID_PATTERN = /^t_[a-z0-9]+$/i
const SAFE_TEXT_LIMIT = 2_000

interface LinearBacklink {
  identifier: string
  url?: string
}

interface HermesKanbanTask {
  id: string
  status: string
  assignee: string | null
  title: string
  linearLink?: LinearBacklink
}

type HermesActionPayload = {
  action?: string
  taskId?: string
  title?: string
  body?: string
  note?: string
  assignee?: string
  teamKey?: string
}

function parseTaskLine(line: string): HermesKanbanTask | null {
  const trimmed = line.trim()
  if (!trimmed) return null

  const symbol = trimmed[0]
  const fallbackStatus = STATUS_SYMBOLS[symbol]
  const withoutSymbol = fallbackStatus ? trimmed.slice(1).trim() : trimmed
  const match = withoutSymbol.match(/^(t_[a-z0-9]+)\s+(\S+)\s+(.+?)\s{2,}(.+)$/i)
  if (!match) return null

  const [, id, rawStatus, rawAssignee, title] = match
  const assignee = rawAssignee.trim()
  return {
    id,
    status: rawStatus || fallbackStatus || 'unknown',
    assignee: assignee === '(unassigned)' ? null : assignee,
    title: title.trim(),
  }
}

function summarise(tasks: HermesKanbanTask[]) {
  return tasks.reduce<Record<string, number>>((acc, task) => {
    acc[task.status] = (acc[task.status] ?? 0) + 1
    return acc
  }, {})
}

function safeText(value: unknown, field: string, required: true): string
function safeText(value: unknown, field: string, required?: false): string | undefined
function safeText(value: unknown, field: string, required = false) {
  if (typeof value !== 'string') {
    if (required) throw new Error(`${field} is required`)
    return undefined
  }
  const trimmed = value.trim()
  if (!trimmed) {
    if (required) throw new Error(`${field} is required`)
    return undefined
  }
  if (trimmed.length > SAFE_TEXT_LIMIT) throw new Error(`${field} is too long`)
  return trimmed
}

function safeTaskId(value: unknown) {
  const taskId = safeText(value, 'taskId', true)
  if (!TASK_ID_PATTERN.test(taskId)) throw new Error('valid taskId is required')
  return taskId
}

function buildHermesActionCommand(payload: HermesActionPayload) {
  const action = safeText(payload.action, 'action', true)

  if (action === 'create') {
    const title = safeText(payload.title, 'title', true)
    const args: string[] = ['kanban', 'create', title]
    const body = safeText(payload.body, 'body')
    const assignee = safeText(payload.assignee, 'assignee')
    if (body) args.push('--body', body)
    if (assignee) args.push('--assignee', assignee)
    args.push('--created-by', 'unite-hub', '--json')
    return args
  }

  if (action === 'complete') {
    const taskId = safeTaskId(payload.taskId)
    const args: string[] = ['kanban', 'complete', taskId]
    const note = safeText(payload.note, 'note')
    if (note) args.push('--result', note)
    return args
  }

  if (action === 'block') {
    const taskId = safeTaskId(payload.taskId)
    const args: string[] = ['kanban', 'block', taskId]
    const note = safeText(payload.note, 'note')
    if (note) args.push(note)
    return args
  }

  if (action === 'unblock') return ['kanban', 'unblock', safeTaskId(payload.taskId)]
  if (action === 'promote') return ['kanban', 'promote', safeTaskId(payload.taskId)]

  if (action === 'comment') {
    const note = safeText(payload.note, 'note', true)
    return ['kanban', 'comment', '--author', 'unite-hub', safeTaskId(payload.taskId), note]
  }

  throw new Error('unsupported action')
}

function buildLinearIssueInput(payload: HermesActionPayload): CreateIssueInput {
  const taskId = safeTaskId(payload.taskId)
  const title = safeText(payload.title, 'title', true)
  const body = safeText(payload.body, 'body') ?? 'No additional Hermes task context supplied.'
  const teamKey = safeText(payload.teamKey, 'teamKey') ?? 'UNI'
  return {
    teamKey,
    title: `[Hermes ${taskId}] ${title}`,
    description: `Hermes Task: ${taskId}\nSource: Unite-Hub dual-board controls\n\n${body}`,
    priority: 3,
  }
}

function parseLinearBacklink(comments: unknown): LinearBacklink | undefined {
  if (!Array.isArray(comments)) return undefined

  for (const comment of comments) {
    if (!comment || typeof comment !== 'object') continue
    const body = 'body' in comment && typeof comment.body === 'string' ? comment.body : undefined
    if (!body) continue

    const match = body.match(/Linear link:\s*([A-Z]+-\d+)(?:\s+(https?:\/\/\S+))?/)
    if (match) return { identifier: match[1], ...(match[2] ? { url: match[2] } : {}) }
  }

  return undefined
}

async function hydrateLinearBacklinks(tasks: HermesKanbanTask[]) {
  const hydrateableTaskIds = new Set(tasks
    .filter((task) => task.status !== 'done')
    .slice(0, 25)
    .map((task) => task.id))

  return Promise.all(tasks.map(async (task) => {
    if (!hydrateableTaskIds.has(task.id)) return task

    try {
      const { stdout } = await execFileAsync('hermes', ['kanban', 'show', '--json', task.id], { timeout: 15_000, windowsHide: true })
      const detail = JSON.parse(stdout) as { comments?: unknown }
      const linearLink = parseLinearBacklink(detail.comments)
      return linearLink ? { ...task, linearLink } : task
    } catch {
      return task
    }
  }))
}

async function readHermesBoard() {
  const [{ stdout: boardsStdout }, { stdout: listStdout }] = await Promise.all([
    execFileAsync('hermes', ['kanban', 'boards', 'list'], { timeout: 15_000, windowsHide: true }),
    execFileAsync('hermes', ['kanban', 'list'], { timeout: 15_000, windowsHide: true }),
  ])

  const tasks = await hydrateLinearBacklinks(listStdout
    .split(/\r?\n/)
    .map(parseTaskLine)
    .filter((task): task is HermesKanbanTask => Boolean(task)))

  return {
    source: 'hermes-kanban',
    configured: true,
    board: boardsStdout.includes('Current board:') ? boardsStdout.match(/Current board:\s*(\S+)/)?.[1] ?? 'default' : 'default',
    summary: summarise(tasks),
    tasks,
    lastSyncedAt: new Date().toISOString(),
  }
}

export async function GET() {
  try {
    return NextResponse.json(await readHermesBoard())
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Hermes Kanban error'
    return NextResponse.json(
      { source: 'hermes-kanban', configured: false, error: message, summary: {}, tasks: [], lastSyncedAt: new Date().toISOString() },
      { status: 502 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as HermesActionPayload
    const action = safeText(payload.action, 'action', true)

    if (action === 'linkLinear') {
      const taskId = safeTaskId(payload.taskId)
      const issue = await createLinearIssue(buildLinearIssueInput(payload))
      const backlink = `Linear link: ${issue.id}${issue.url ? ` ${issue.url}` : ''}`
      const args = ['kanban', 'comment', '--author', 'unite-hub', taskId, backlink]
      const { stdout, stderr } = await execFileAsync('hermes', args, { timeout: 20_000, windowsHide: true })
      return NextResponse.json({
        source: 'hermes-kanban',
        action,
        linkedIssue: { identifier: issue.id, url: issue.url },
        receipt: { command: ['hermes', ...args], stdout: stdout.trim(), stderr: stderr?.trim() ?? '' },
        board: await readHermesBoard(),
      })
    }

    const args = buildHermesActionCommand(payload)
    const { stdout, stderr } = await execFileAsync('hermes', args, { timeout: 20_000, windowsHide: true })
    return NextResponse.json({
      source: 'hermes-kanban',
      action,
      receipt: { command: ['hermes', ...args], stdout: stdout.trim(), stderr: stderr?.trim() ?? '' },
      board: await readHermesBoard(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Hermes Kanban action error'
    return NextResponse.json({ source: 'hermes-kanban', configured: false, error: message }, { status: 400 })
  }
}

function setExecFileForTest(mock: ExecFileAsync) {
  execFileAsync = mock
}

function setCreateIssueForTest(mock: CreateLinearIssue) {
  createLinearIssue = mock
}

export const __test__ = { parseTaskLine, summarise, buildHermesActionCommand, buildLinearIssueInput, parseLinearBacklink, setExecFileForTest, setCreateIssueForTest }
