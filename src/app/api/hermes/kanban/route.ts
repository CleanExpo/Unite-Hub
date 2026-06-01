import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const execFileAsync = promisify(execFile)

const STATUS_SYMBOLS: Record<string, string> = {
  '✓': 'done',
  '▶': 'ready',
  '●': 'running',
  '■': 'blocked',
  '○': 'todo',
  '◌': 'scheduled',
}

interface HermesKanbanTask {
  id: string
  status: string
  assignee: string | null
  title: string
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

export async function GET() {
  try {
    const [{ stdout: boardsStdout }, { stdout: listStdout }] = await Promise.all([
      execFileAsync('hermes', ['kanban', 'boards', 'list'], { timeout: 15_000, windowsHide: true }),
      execFileAsync('hermes', ['kanban', 'list'], { timeout: 15_000, windowsHide: true }),
    ])

    const tasks = listStdout
      .split(/\r?\n/)
      .map(parseTaskLine)
      .filter((task): task is HermesKanbanTask => Boolean(task))

    return NextResponse.json({
      source: 'hermes-kanban',
      configured: true,
      board: boardsStdout.includes('Current board:') ? boardsStdout.match(/Current board:\s*(\S+)/)?.[1] ?? 'default' : 'default',
      summary: summarise(tasks),
      tasks,
      lastSyncedAt: new Date().toISOString(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Hermes Kanban error'
    return NextResponse.json(
      {
        source: 'hermes-kanban',
        configured: false,
        error: message,
        summary: {},
        tasks: [],
        lastSyncedAt: new Date().toISOString(),
      },
      { status: 502 },
    )
  }
}

export const __test__ = { parseTaskLine, summarise }
