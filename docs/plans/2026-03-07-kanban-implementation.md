# Kanban + Obsidian Integration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Embed a drag-and-drop Kanban board into Unite-Group that bidirectionally syncs tasks with an Obsidian vault via Markdown files, with AI agent access via Veritas Kanban MCP server.

**Architecture:** Native Next.js 16 Kanban module at `/kanban` in the `(unite-hub)` route group. Tasks stored in Supabase `tasks` table (migration 520) and synced to/from the user's Obsidian vault via a chokidar filesystem watcher started in `instrumentation.ts`. Veritas Kanban MCP server wired into `mcp_config.json` for AI agent tool access.

**Tech Stack:** Next.js 16 App Router, Supabase (Postgres + RLS), @dnd-kit/core + @dnd-kit/sortable, Framer Motion, gray-matter (already installed), chokidar, TypeScript strict

---

## Task 1: Install missing dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install**
```bash
cd /c/Unite-Group
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities chokidar
```

**Step 2: Verify**
```bash
node -e "require('@dnd-kit/core'); require('chokidar'); console.log('OK')"
```
Expected: `OK`

**Step 3: Commit**
```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(kanban): add @dnd-kit and chokidar deps"
```

---

## Task 2: Supabase migration 520

**Files:**
- Create: `supabase/migrations/520_kanban_tasks.sql`

**Step 1: Write migration**
```sql
-- supabase/migrations/520_kanban_tasks.sql

-- Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  description         TEXT,
  status              TEXT NOT NULL DEFAULT 'todo'
                      CHECK (status IN ('todo','in-progress','blocked','done')),
  priority            TEXT NOT NULL DEFAULT 'medium'
                      CHECK (priority IN ('low','medium','high','urgent')),
  assignee_type       TEXT NOT NULL DEFAULT 'self'
                      CHECK (assignee_type IN ('self','agent','staff','client')),
  assignee_id         UUID,
  assignee_name       TEXT,
  obsidian_path       TEXT,
  obsidian_synced_at  TIMESTAMPTZ,
  tags                TEXT[] DEFAULT '{}',
  due_date            DATE,
  position            INT NOT NULL DEFAULT 0,
  created_by          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Vault config per workspace
CREATE TABLE IF NOT EXISTS public.workspace_vault_config (
  workspace_id    UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  vault_path      TEXT NOT NULL,
  sync_enabled    BOOLEAN DEFAULT TRUE,
  last_synced_at  TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS tasks_workspace_status_idx ON public.tasks (workspace_id, status);
CREATE INDEX IF NOT EXISTS tasks_workspace_position_idx ON public.tasks (workspace_id, status, position);

-- RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_vault_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_workspace_isolation" ON public.tasks
  USING (
    workspace_id = current_setting('app.current_workspace_id', TRUE)::UUID
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "tasks_workspace_insert" ON public.tasks
  FOR INSERT WITH CHECK (
    workspace_id = current_setting('app.current_workspace_id', TRUE)::UUID
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "vault_config_isolation" ON public.workspace_vault_config
  USING (
    workspace_id = current_setting('app.current_workspace_id', TRUE)::UUID
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "vault_config_insert" ON public.workspace_vault_config
  FOR INSERT WITH CHECK (
    workspace_id = current_setting('app.current_workspace_id', TRUE)::UUID
    AND auth.uid() IS NOT NULL
  );

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
```

**Step 2: Apply via Supabase MCP or dashboard**
Run the SQL in Supabase SQL editor or via MCP execute_sql tool.

**Step 3: Verify**
```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'tasks' ORDER BY ordinal_position;
```
Expected: id, workspace_id, title, description, status, priority, assignee_type... (all 16 columns)

**Step 4: Commit**
```bash
git add supabase/migrations/520_kanban_tasks.sql
git commit -m "feat(kanban): migration 520 — tasks + workspace_vault_config tables"
```

---

## Task 3: TypeScript types

**Files:**
- Create: `src/types/kanban.ts`

**Step 1: Write**
```typescript
// src/types/kanban.ts

export type TaskStatus = 'todo' | 'in-progress' | 'blocked' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type AssigneeType = 'self' | 'agent' | 'staff' | 'client';

export interface Task {
  id: string;
  workspace_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_type: AssigneeType;
  assignee_id?: string;
  assignee_name?: string;
  obsidian_path?: string;
  obsidian_synced_at?: string;
  tags: string[];
  due_date?: string;
  position: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface KanbanColumn {
  id: TaskStatus;
  label: string;
  tasks: Task[];
}

export interface WorkspaceVaultConfig {
  workspace_id: string;
  vault_path: string;
  sync_enabled: boolean;
  last_synced_at?: string;
}

export const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'todo', label: 'TO DO' },
  { id: 'in-progress', label: 'IN PROGRESS' },
  { id: 'blocked', label: 'BLOCKED' },
  { id: 'done', label: 'DONE' },
];

export const PRIORITY_COLOURS: Record<TaskPriority, string> = {
  urgent: '#FF4444',
  high: '#FFB800',
  medium: '#00F5FF',
  low: '#666666',
};

export const ASSIGNEE_COLOURS: Record<AssigneeType, string> = {
  agent: '#00F5FF',
  staff: '#00FF88',
  client: '#FF00FF',
  self: '#FFFFFF',
};
```

**Step 2: Commit**
```bash
git add src/types/kanban.ts
git commit -m "feat(kanban): TypeScript types"
```

---

## Task 4: Obsidian sync service — parser

**Files:**
- Create: `src/server/obsidian-sync/parser.ts`
- Create: `src/server/obsidian-sync/parser.test.ts`

**Step 1: Write failing test**
```typescript
// src/server/obsidian-sync/parser.test.ts
import { describe, it, expect } from 'vitest';
import { parseTaskFile, taskToMarkdown } from './parser';

const SAMPLE_MD = `---
id: "abc-123"
title: "Fix login bug"
status: "in-progress"
priority: "high"
assignee_type: "staff"
assignee_name: "Duncan"
tags: ["auth", "urgent"]
due_date: "2026-03-14"
workspace_id: "ws-123"
created_at: "2026-03-07T10:00:00Z"
---

## Description
Fix the broken login redirect.

## Notes
Happening on Safari only.
`;

describe('parseTaskFile', () => {
  it('parses YAML frontmatter into a Task object', () => {
    const result = parseTaskFile(SAMPLE_MD, 'Tasks/in-progress/fix-login-bug.md');
    expect(result.id).toBe('abc-123');
    expect(result.title).toBe('Fix login bug');
    expect(result.status).toBe('in-progress');
    expect(result.priority).toBe('high');
    expect(result.assignee_type).toBe('staff');
    expect(result.assignee_name).toBe('Duncan');
    expect(result.tags).toEqual(['auth', 'urgent']);
    expect(result.due_date).toBe('2026-03-14');
    expect(result.obsidian_path).toBe('Tasks/in-progress/fix-login-bug.md');
  });
});

describe('taskToMarkdown', () => {
  it('serialises a Task back to markdown with YAML frontmatter', () => {
    const task = { id: 'abc-123', title: 'Fix login', status: 'todo' as const,
      priority: 'high' as const, assignee_type: 'self' as const, tags: [],
      position: 0, workspace_id: 'ws-1', created_at: '2026-03-07T10:00:00Z',
      updated_at: '2026-03-07T10:00:00Z' };
    const md = taskToMarkdown(task);
    expect(md).toContain('id: "abc-123"');
    expect(md).toContain('title: "Fix login"');
    expect(md).toContain('status: "todo"');
    expect(md).toContain('## Description');
  });
});
```

**Step 2: Run to confirm it fails**
```bash
cd /c/Unite-Group && pnpm vitest run src/server/obsidian-sync/parser.test.ts
```
Expected: FAIL — module not found

**Step 3: Write implementation**
```typescript
// src/server/obsidian-sync/parser.ts
import matter from 'gray-matter';
import { Task, TaskStatus, TaskPriority, AssigneeType } from '@/types/kanban';

export function parseTaskFile(content: string, obsidianPath: string): Partial<Task> {
  const { data, content: body } = matter(content);
  return {
    id: data.id,
    title: data.title,
    description: body.trim() || undefined,
    status: (data.status as TaskStatus) ?? 'todo',
    priority: (data.priority as TaskPriority) ?? 'medium',
    assignee_type: (data.assignee_type as AssigneeType) ?? 'self',
    assignee_id: data.assignee_id,
    assignee_name: data.assignee_name,
    tags: Array.isArray(data.tags) ? data.tags : [],
    due_date: data.due_date,
    workspace_id: data.workspace_id,
    obsidian_path: obsidianPath,
    created_at: data.created_at,
  };
}

export function taskToMarkdown(task: Partial<Task>): string {
  const frontmatter: Record<string, unknown> = {
    id: task.id,
    title: task.title,
    status: task.status ?? 'todo',
    priority: task.priority ?? 'medium',
    assignee_type: task.assignee_type ?? 'self',
    ...(task.assignee_id && { assignee_id: task.assignee_id }),
    ...(task.assignee_name && { assignee_name: task.assignee_name }),
    tags: task.tags ?? [],
    ...(task.due_date && { due_date: task.due_date }),
    workspace_id: task.workspace_id,
    created_at: task.created_at ?? new Date().toISOString(),
  };

  const body = `\n## Description\n${task.description ?? ''}\n\n## Notes\n`;
  return matter.stringify(body, frontmatter);
}
```

**Step 4: Run tests**
```bash
cd /c/Unite-Group && pnpm vitest run src/server/obsidian-sync/parser.test.ts
```
Expected: PASS (2 tests)

**Step 5: Commit**
```bash
git add src/server/obsidian-sync/parser.ts src/server/obsidian-sync/parser.test.ts
git commit -m "feat(kanban): obsidian sync parser with TDD"
```

---

## Task 5: Obsidian sync service — writer

**Files:**
- Create: `src/server/obsidian-sync/writer.ts`

```typescript
// src/server/obsidian-sync/writer.ts
import fs from 'fs/promises';
import path from 'path';
import { Task } from '@/types/kanban';
import { taskToMarkdown } from './parser';

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function writeTaskToVault(task: Task, vaultPath: string): Promise<string> {
  const statusDir = path.join(vaultPath, 'Tasks', task.status);
  await fs.mkdir(statusDir, { recursive: true });

  const filename = `${slugify(task.title)}.md`;
  const filePath = path.join(statusDir, filename);
  const obsidianPath = `Tasks/${task.status}/${filename}`;

  await fs.writeFile(filePath, taskToMarkdown(task), 'utf-8');
  return obsidianPath;
}

export async function moveTaskFile(
  oldPath: string, newStatus: string, vaultPath: string
): Promise<string> {
  const fullOldPath = path.join(vaultPath, oldPath);
  const filename = path.basename(oldPath);
  const newDir = path.join(vaultPath, 'Tasks', newStatus);
  await fs.mkdir(newDir, { recursive: true });
  const newRelPath = `Tasks/${newStatus}/${filename}`;
  await fs.rename(fullOldPath, path.join(vaultPath, newRelPath)).catch(() => {});
  return newRelPath;
}

export async function deleteTaskFile(obsidianPath: string, vaultPath: string): Promise<void> {
  await fs.unlink(path.join(vaultPath, obsidianPath)).catch(() => {});
}
```

**Commit:**
```bash
git add src/server/obsidian-sync/writer.ts
git commit -m "feat(kanban): obsidian vault writer"
```

---

## Task 6: Obsidian sync service — watcher + engine

**Files:**
- Create: `src/server/obsidian-sync/watcher.ts`
- Create: `src/server/obsidian-sync/sync-engine.ts`
- Create: `src/server/obsidian-sync/index.ts`

**Step 1: watcher.ts**
```typescript
// src/server/obsidian-sync/watcher.ts
import chokidar, { FSWatcher } from 'chokidar';
import path from 'path';

type ChangeCallback = (filePath: string, event: 'add' | 'change' | 'unlink') => void;

const watchers = new Map<string, FSWatcher>();

export function startWatcher(vaultPath: string, onChange: ChangeCallback): void {
  if (watchers.has(vaultPath)) return; // already watching

  const tasksDir = path.join(vaultPath, 'Tasks');
  const watcher = chokidar.watch(`${tasksDir}/**/*.md`, {
    persistent: true,
    ignoreInitial: false,
    awaitWriteFinish: { stabilityThreshold: 500 },
  });

  watcher
    .on('add', (p) => onChange(p, 'add'))
    .on('change', (p) => onChange(p, 'change'))
    .on('unlink', (p) => onChange(p, 'unlink'));

  watchers.set(vaultPath, watcher);
  console.log(`[ObsidianSync] Watching ${tasksDir}`);
}

export async function stopWatcher(vaultPath: string): Promise<void> {
  const w = watchers.get(vaultPath);
  if (w) { await w.close(); watchers.delete(vaultPath); }
}
```

**Step 2: sync-engine.ts**
```typescript
// src/server/obsidian-sync/sync-engine.ts
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { parseTaskFile } from './parser';
import { startWatcher } from './watcher';
import fs from 'fs/promises';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// SSE subscribers keyed by workspace_id
const subscribers = new Map<string, Set<(event: string) => void>>();

export function subscribeToEvents(workspaceId: string, cb: (event: string) => void) {
  if (!subscribers.has(workspaceId)) subscribers.set(workspaceId, new Set());
  subscribers.get(workspaceId)!.add(cb);
  return () => subscribers.get(workspaceId)?.delete(cb);
}

function broadcast(workspaceId: string, event: object) {
  subscribers.get(workspaceId)?.forEach(cb => cb(JSON.stringify(event)));
}

async function handleFileChange(
  filePath: string,
  event: 'add' | 'change' | 'unlink',
  vaultPath: string,
  workspaceId: string
) {
  const relPath = path.relative(vaultPath, filePath).replace(/\\/g, '/');

  if (event === 'unlink') {
    await supabase.from('tasks')
      .delete()
      .eq('obsidian_path', relPath)
      .eq('workspace_id', workspaceId);
    broadcast(workspaceId, { type: 'task_deleted', obsidian_path: relPath });
    return;
  }

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = parseTaskFile(content, relPath);
    if (!parsed.title) return;

    const { data } = await supabase.from('tasks')
      .upsert({ ...parsed, workspace_id: workspaceId, obsidian_synced_at: new Date().toISOString() },
               { onConflict: 'obsidian_path,workspace_id' })
      .select().single();

    broadcast(workspaceId, { type: 'task_synced', task: data });
  } catch (e) {
    console.error('[ObsidianSync] Error processing', filePath, e);
  }
}

export async function initSync(vaultPath: string, workspaceId: string) {
  startWatcher(vaultPath, (filePath, event) => {
    handleFileChange(filePath, event, vaultPath, workspaceId).catch(console.error);
  });
}
```

**Step 3: index.ts (barrel)**
```typescript
// src/server/obsidian-sync/index.ts
export { initSync, subscribeToEvents } from './sync-engine';
export { writeTaskToVault, moveTaskFile, deleteTaskFile } from './writer';
export { startWatcher, stopWatcher } from './watcher';
```

**Step 4: Hook into instrumentation.ts**
```typescript
// instrumentation.ts — add inside register():
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./src/lib/telemetry/instrumentation');
    // Start Obsidian vault watchers for all workspaces
    await import('./src/server/obsidian-sync/boot').then(m => m.bootVaultWatchers());
  }
}
```

**Step 5: Create boot.ts**
```typescript
// src/server/obsidian-sync/boot.ts
import { createClient } from '@supabase/supabase-js';
import { initSync } from './sync-engine';

export async function bootVaultWatchers() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data } = await supabase
    .from('workspace_vault_config')
    .select('workspace_id, vault_path')
    .eq('sync_enabled', true);

  for (const config of data ?? []) {
    await initSync(config.vault_path, config.workspace_id);
  }
  console.log(`[ObsidianSync] Booted ${data?.length ?? 0} vault watcher(s)`);
}
```

**Commit:**
```bash
git add src/server/obsidian-sync/
git commit -m "feat(kanban): obsidian sync watcher + engine + boot"
```

---

## Task 7: API routes

**Files:**
- Create: `src/app/api/kanban/tasks/route.ts`
- Create: `src/app/api/kanban/tasks/[id]/route.ts`
- Create: `src/app/api/kanban/events/route.ts`
- Create: `src/app/api/kanban/sync/route.ts`

**Step 1: tasks/route.ts (GET + POST)**
```typescript
// src/app/api/kanban/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { writeTaskToVault } from '@/server/obsidian-sync';
import { Task } from '@/types/kanban';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get('workspace_id');
  const status = searchParams.get('status');
  const assigneeType = searchParams.get('assignee_type');

  let query = supabase.from('tasks').select('*').eq('workspace_id', workspaceId!).order('position');
  if (status) query = query.eq('status', status);
  if (assigneeType && assigneeType !== 'all') query = query.eq('assignee_type', assigneeType);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();

  const { data: task, error } = await supabase
    .from('tasks').insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sync to vault if configured
  const { data: vaultConfig } = await supabase
    .from('workspace_vault_config')
    .select('vault_path, sync_enabled')
    .eq('workspace_id', body.workspace_id).single();

  if (vaultConfig?.sync_enabled) {
    const obsidianPath = await writeTaskToVault(task as Task, vaultConfig.vault_path);
    await supabase.from('tasks').update({ obsidian_path: obsidianPath, obsidian_synced_at: new Date().toISOString() })
      .eq('id', task.id);
    task.obsidian_path = obsidianPath;
  }

  return NextResponse.json(task, { status: 201 });
}
```

**Step 2: tasks/[id]/route.ts (PATCH + DELETE)**
```typescript
// src/app/api/kanban/tasks/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { moveTaskFile, deleteTaskFile, writeTaskToVault } from '@/server/obsidian-sync';
import { Task } from '@/types/kanban';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const body = await req.json();

  const { data: existing } = await supabase.from('tasks').select('*').eq('id', id).single();
  const { data: task, error } = await supabase.from('tasks').update(body).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If status changed, move file in vault
  const { data: vaultConfig } = await supabase
    .from('workspace_vault_config').select('vault_path, sync_enabled')
    .eq('workspace_id', task.workspace_id).single();

  if (vaultConfig?.sync_enabled && existing?.obsidian_path) {
    if (body.status && body.status !== existing.status) {
      const newPath = await moveTaskFile(existing.obsidian_path, body.status, vaultConfig.vault_path);
      await supabase.from('tasks').update({ obsidian_path: newPath }).eq('id', id);
      task.obsidian_path = newPath;
    } else if (body.title || body.description) {
      await writeTaskToVault(task as Task, vaultConfig.vault_path);
    }
  }

  return NextResponse.json(task);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: task } = await supabase.from('tasks').select('*').eq('id', id).single();
  await supabase.from('tasks').delete().eq('id', id);

  if (task?.obsidian_path) {
    const { data: vaultConfig } = await supabase
      .from('workspace_vault_config').select('vault_path').eq('workspace_id', task.workspace_id).single();
    if (vaultConfig) await deleteTaskFile(task.obsidian_path, vaultConfig.vault_path);
  }

  return new NextResponse(null, { status: 204 });
}
```

**Step 3: events/route.ts (SSE)**
```typescript
// src/app/api/kanban/events/route.ts
import { NextRequest } from 'next/server';
import { subscribeToEvents } from '@/server/obsidian-sync';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const workspaceId = new URL(req.url).searchParams.get('workspace_id') ?? '';

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      const send = (data: string) => controller.enqueue(enc.encode(`data: ${data}\n\n`));

      send(JSON.stringify({ type: 'connected' }));

      const unsubscribe = subscribeToEvents(workspaceId, send);

      req.signal.addEventListener('abort', () => {
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

**Step 4: sync/route.ts (manual sync trigger)**
```typescript
// src/app/api/kanban/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { initSync } from '@/server/obsidian-sync';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { workspace_id } = await req.json();

  const { data: config } = await supabase
    .from('workspace_vault_config').select('*').eq('workspace_id', workspace_id).single();
  if (!config) return NextResponse.json({ error: 'No vault configured' }, { status: 404 });

  await initSync(config.vault_path, workspace_id);
  await supabase.from('workspace_vault_config')
    .update({ last_synced_at: new Date().toISOString() }).eq('workspace_id', workspace_id);

  return NextResponse.json({ ok: true, vault_path: config.vault_path });
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const workspaceId = new URL(req.url).searchParams.get('workspace_id');
  const { data } = await supabase
    .from('workspace_vault_config').select('*').eq('workspace_id', workspaceId!).single();
  return NextResponse.json(data ?? { sync_enabled: false });
}
```

**Commit:**
```bash
git add src/app/api/kanban/
git commit -m "feat(kanban): API routes — tasks CRUD + SSE events + sync"
```

---

## Task 8: Kanban UI components

**Files:**
- Create: `src/components/kanban/TaskCard.tsx`
- Create: `src/components/kanban/KanbanColumn.tsx`
- Create: `src/components/kanban/KanbanBoard.tsx`
- Create: `src/components/kanban/TaskModal.tsx`
- Create: `src/components/kanban/NewTaskForm.tsx`
- Create: `src/components/kanban/AssigneeFilter.tsx`
- Create: `src/components/kanban/SyncStatusBadge.tsx`
- Create: `src/components/kanban/index.ts`

**Step 1: TaskCard.tsx**
```tsx
// src/components/kanban/TaskCard.tsx
'use client';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Task, PRIORITY_COLOURS, ASSIGNEE_COLOURS } from '@/types/kanban';

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => onClick(task)}
      className="cursor-pointer rounded-sm border border-white/10 bg-white/5 p-3 hover:border-white/20 hover:bg-white/8 transition-colors"
      style={{ ...style, borderLeft: `2px solid ${PRIORITY_COLOURS[task.priority]}` }}
    >
      <p className="text-sm font-medium text-white leading-snug mb-2">{task.title}</p>
      <div className="flex items-center justify-between">
        <span
          className="text-xs px-1.5 py-0.5 rounded-sm font-mono"
          style={{ color: PRIORITY_COLOURS[task.priority], background: `${PRIORITY_COLOURS[task.priority]}20` }}
        >
          {task.priority.toUpperCase()}
        </span>
        {task.assignee_name && (
          <span
            className="text-xs font-medium px-1.5 py-0.5 rounded-sm"
            style={{ color: ASSIGNEE_COLOURS[task.assignee_type], borderColor: ASSIGNEE_COLOURS[task.assignee_type], border: '1px solid' }}
          >
            {task.assignee_type === 'agent' ? '🤖' : task.assignee_type === 'client' ? '🏢' : '👤'} {task.assignee_name}
          </span>
        )}
      </div>
      {task.due_date && (
        <p className="text-xs text-white/40 mt-1.5 font-mono">
          Due {new Date(task.due_date).toLocaleDateString('en-AU')}
        </p>
      )}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {task.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs text-cyan-400/60 font-mono">#{tag}</span>
          ))}
        </div>
      )}
    </motion.div>
  );
}
```

**Step 2: KanbanColumn.tsx**
```tsx
// src/components/kanban/KanbanColumn.tsx
'use client';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AnimatePresence } from 'framer-motion';
import { Task, TaskStatus } from '@/types/kanban';
import { TaskCard } from './TaskCard';

const COLUMN_ACCENT: Record<TaskStatus, string> = {
  'todo': '#666',
  'in-progress': '#00F5FF',
  'blocked': '#FF4444',
  'done': '#00FF88',
};

interface KanbanColumnProps {
  id: TaskStatus;
  label: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
}

export function KanbanColumn({ id, label, tasks, onTaskClick, onAddTask }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col min-h-[200px] w-full rounded-sm border border-white/10 bg-white/3 transition-colors"
      style={{ borderTopColor: COLUMN_ACCENT[id], borderTopWidth: 2, background: isOver ? 'rgba(255,255,255,0.06)' : undefined }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <span className="text-xs font-mono tracking-widest" style={{ color: COLUMN_ACCENT[id] }}>{label}</span>
        <span className="text-xs font-mono text-white/40 bg-white/10 px-1.5 py-0.5 rounded-sm">{tasks.length}</span>
      </div>

      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 p-2 flex-1">
          <AnimatePresence>
            {tasks.map(task => (
              <TaskCard key={task.id} task={task} onClick={onTaskClick} />
            ))}
          </AnimatePresence>
        </div>
      </SortableContext>

      <button
        onClick={() => onAddTask(id)}
        className="m-2 py-1.5 text-xs text-white/30 hover:text-cyan-400 border border-dashed border-white/10 hover:border-cyan-400/40 rounded-sm transition-colors font-mono"
      >
        + Add task
      </button>
    </div>
  );
}
```

**Step 3: KanbanBoard.tsx (DnD container)**
```tsx
// src/components/kanban/KanbanBoard.tsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { DndContext, DragEndEvent, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Task, TaskStatus, COLUMNS, AssigneeType } from '@/types/kanban';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';
import { AssigneeFilter } from './AssigneeFilter';
import { SyncStatusBadge } from './SyncStatusBadge';

interface KanbanBoardProps {
  workspaceId: string;
}

export function KanbanBoard({ workspaceId }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeType | 'all'>('all');
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const fetchTasks = useCallback(async () => {
    const params = new URLSearchParams({ workspace_id: workspaceId });
    if (assigneeFilter !== 'all') params.set('assignee_type', assigneeFilter);
    const res = await fetch(`/api/kanban/tasks?${params}`);
    const data = await res.json();
    setTasks(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [workspaceId, assigneeFilter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // SSE real-time updates
  useEffect(() => {
    const es = new EventSource(`/api/kanban/events?workspace_id=${workspaceId}`);
    es.onmessage = (e) => {
      const event = JSON.parse(e.data);
      if (event.type === 'task_synced') {
        setTasks(prev => {
          const idx = prev.findIndex(t => t.id === event.task.id);
          return idx >= 0 ? prev.map((t, i) => i === idx ? event.task : t) : [...prev, event.task];
        });
      } else if (event.type === 'task_deleted') {
        setTasks(prev => prev.filter(t => t.obsidian_path !== event.obsidian_path));
      }
    };
    return () => es.close();
  }, [workspaceId]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const draggedTask = tasks.find(t => t.id === active.id);
    if (!draggedTask) return;

    const newStatus = COLUMNS.find(c => c.id === over.id)?.id ?? draggedTask.status;

    setTasks(prev => prev.map(t => t.id === draggedTask.id ? { ...t, status: newStatus } : t));

    await fetch(`/api/kanban/tasks/${draggedTask.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
  }

  const tasksByStatus = (status: TaskStatus) => tasks.filter(t => t.status === status).sort((a, b) => a.position - b.position);

  if (loading) return <div className="text-white/40 font-mono text-sm p-8">Loading tasks...</div>;

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <AssigneeFilter value={assigneeFilter} onChange={setAssigneeFilter} />
        <SyncStatusBadge workspaceId={workspaceId} />
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}
        onDragStart={({ active }) => setActiveTask(tasks.find(t => t.id === active.id) ?? null)}>
        <div className="grid grid-cols-4 gap-3 flex-1">
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              label={col.label}
              tasks={tasksByStatus(col.id)}
              onTaskClick={setSelectedTask}
              onAddTask={setNewTaskStatus}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} onClick={() => {}} />}
        </DragOverlay>
      </DndContext>

      {(selectedTask || newTaskStatus) && (
        <TaskModal
          task={selectedTask}
          defaultStatus={newTaskStatus ?? undefined}
          workspaceId={workspaceId}
          onClose={() => { setSelectedTask(null); setNewTaskStatus(null); }}
          onSaved={fetchTasks}
        />
      )}
    </div>
  );
}
```

**Step 4: TaskModal.tsx**
```tsx
// src/components/kanban/TaskModal.tsx
'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Task, TaskStatus, TaskPriority, AssigneeType } from '@/types/kanban';

interface TaskModalProps {
  task: Task | null;
  defaultStatus?: TaskStatus;
  workspaceId: string;
  onClose: () => void;
  onSaved: () => void;
}

export function TaskModal({ task, defaultStatus, workspaceId, onClose, onSaved }: TaskModalProps) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? defaultStatus ?? 'todo');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium');
  const [assigneeType, setAssigneeType] = useState<AssigneeType>(task?.assignee_type ?? 'self');
  const [assigneeName, setAssigneeName] = useState(task?.assignee_name ?? '');
  const [dueDate, setDueDate] = useState(task?.due_date ?? '');
  const [tags, setTags] = useState(task?.tags.join(', ') ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    const body = {
      title, description, status, priority,
      assignee_type: assigneeType,
      assignee_name: assigneeName || undefined,
      due_date: dueDate || undefined,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      workspace_id: workspaceId,
    };
    const url = task ? `/api/kanban/tasks/${task.id}` : '/api/kanban/tasks';
    await fetch(url, { method: task ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setSaving(false);
    onSaved();
    onClose();
  }

  async function handleDelete() {
    if (!task) return;
    await fetch(`/api/kanban/tasks/${task.id}`, { method: 'DELETE' });
    onSaved();
    onClose();
  }

  const fieldClass = "w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400/60 font-mono";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/60" onClick={onClose}>
        <motion.div
          initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="h-full w-full max-w-md bg-[#0a0a0a] border-l border-white/10 p-6 overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-mono tracking-widest text-white/60">{task ? 'EDIT TASK' : 'NEW TASK'}</h2>
            <button onClick={onClose}><X size={16} className="text-white/40 hover:text-white" /></button>
          </div>

          <div className="flex flex-col gap-4">
            <input className={fieldClass} placeholder="Task title" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
            <textarea className={`${fieldClass} h-24 resize-none`} placeholder="Description (syncs to Obsidian)" value={description} onChange={e => setDescription(e.target.value)} />

            <div className="grid grid-cols-2 gap-3">
              <select className={fieldClass} value={status} onChange={e => setStatus(e.target.value as TaskStatus)}>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="done">Done</option>
              </select>
              <select className={fieldClass} value={priority} onChange={e => setPriority(e.target.value as TaskPriority)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select className={fieldClass} value={assigneeType} onChange={e => setAssigneeType(e.target.value as AssigneeType)}>
                <option value="self">✦ You</option>
                <option value="agent">🤖 Agent</option>
                <option value="staff">👤 Staff</option>
                <option value="client">🏢 Client</option>
              </select>
              <input className={fieldClass} placeholder="Assignee name" value={assigneeName} onChange={e => setAssigneeName(e.target.value)} />
            </div>

            <input type="date" className={fieldClass} value={dueDate} onChange={e => setDueDate(e.target.value)} />
            <input className={fieldClass} placeholder="Tags (comma separated)" value={tags} onChange={e => setTags(e.target.value)} />
          </div>

          <div className="flex gap-2 mt-6">
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2 text-sm font-mono bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-400 border border-cyan-400/30 rounded-sm transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : task ? 'Update' : 'Create Task'}
            </button>
            {task && (
              <button onClick={handleDelete} className="px-3 py-2 text-sm font-mono text-red-400/60 hover:text-red-400 border border-white/10 hover:border-red-400/30 rounded-sm transition-colors">
                Delete
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
```

**Step 5: AssigneeFilter.tsx + SyncStatusBadge.tsx**
```tsx
// src/components/kanban/AssigneeFilter.tsx
'use client';
import { AssigneeType } from '@/types/kanban';

const FILTERS: { value: AssigneeType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'self', label: '✦ You' },
  { value: 'agent', label: '🤖 Agents' },
  { value: 'staff', label: '👤 Staff' },
  { value: 'client', label: '🏢 Clients' },
];

export function AssigneeFilter({ value, onChange }: { value: string; onChange: (v: AssigneeType | 'all') => void }) {
  return (
    <div className="flex gap-1">
      {FILTERS.map(f => (
        <button key={f.value} onClick={() => onChange(f.value)}
          className={`px-3 py-1 text-xs font-mono rounded-sm border transition-colors ${value === f.value ? 'border-cyan-400/60 text-cyan-400 bg-cyan-400/10' : 'border-white/10 text-white/40 hover:text-white/60 hover:border-white/20'}`}>
          {f.label}
        </button>
      ))}
    </div>
  );
}
```

```tsx
// src/components/kanban/SyncStatusBadge.tsx
'use client';
import { useState, useEffect } from 'react';

export function SyncStatusBadge({ workspaceId }: { workspaceId: string }) {
  const [status, setStatus] = useState<{ vault_path?: string; last_synced_at?: string; sync_enabled?: boolean } | null>(null);

  useEffect(() => {
    fetch(`/api/kanban/sync?workspace_id=${workspaceId}`)
      .then(r => r.json()).then(setStatus).catch(() => {});
  }, [workspaceId]);

  if (!status?.vault_path) return (
    <span className="text-xs font-mono text-white/20">No vault configured</span>
  );

  return (
    <span className="text-xs font-mono text-white/40">
      {status.sync_enabled ? '⚡' : '○'} {status.last_synced_at
        ? `Synced ${new Date(status.last_synced_at).toLocaleTimeString('en-AU')}`
        : 'Not synced'}
    </span>
  );
}
```

**Step 6: index.ts barrel**
```typescript
// src/components/kanban/index.ts
export { KanbanBoard } from './KanbanBoard';
export { KanbanColumn } from './KanbanColumn';
export { TaskCard } from './TaskCard';
export { TaskModal } from './TaskModal';
export { AssigneeFilter } from './AssigneeFilter';
export { SyncStatusBadge } from './SyncStatusBadge';
```

**Commit:**
```bash
git add src/components/kanban/
git commit -m "feat(kanban): UI components — board, columns, cards, modal, filters"
```

---

## Task 9: Kanban page + settings page

**Files:**
- Create: `src/app/(unite-hub)/kanban/page.tsx`
- Create: `src/app/(unite-hub)/kanban/settings/page.tsx`

**Step 1: Kanban page**
```tsx
// src/app/(unite-hub)/kanban/page.tsx
import { redirect } from 'next/navigation';
import { getStaffSession } from '@/lib/auth/supabase';
import { KanbanBoard } from '@/components/kanban';

export const metadata = { title: 'Kanban — Unite-Group' };

export default async function KanbanPage() {
  const session = await getStaffSession();
  if (!session) redirect('/login');

  const workspaceId = session.user.user_metadata?.workspace_id ?? session.user.id;

  return (
    <div className="flex flex-col h-full min-h-screen bg-[#050505] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-mono tracking-widest text-white">◈ KANBAN</h1>
          <p className="text-xs text-white/30 font-mono mt-0.5">Tasks · Obsidian Sync · AI Agent Orchestration</p>
        </div>
        <div className="flex gap-2">
          <a href="/kanban/settings"
            className="px-3 py-1.5 text-xs font-mono text-white/40 border border-white/10 rounded-sm hover:text-white/60 hover:border-white/20 transition-colors">
            ⚙ Vault Settings
          </a>
        </div>
      </div>
      <KanbanBoard workspaceId={workspaceId} />
    </div>
  );
}
```

**Step 2: Settings page**
```tsx
// src/app/(unite-hub)/kanban/settings/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function KanbanSettingsPage() {
  const [vaultPath, setVaultPath] = useState('');
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Load from API — workspaceId from session cookie handled server-side
    fetch('/api/kanban/sync?workspace_id=current')
      .then(r => r.json())
      .then(d => { if (d?.vault_path) { setVaultPath(d.vault_path); setSyncEnabled(d.sync_enabled); } })
      .catch(() => {});
  }, []);

  async function handleSave() {
    setSaving(true);
    await fetch('/api/kanban/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vault_path: vaultPath, sync_enabled: syncEnabled }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const fieldClass = "w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400/60 font-mono";

  return (
    <div className="min-h-screen bg-[#050505] p-6 max-w-lg">
      <button onClick={() => router.back()} className="text-xs font-mono text-white/30 hover:text-white/60 mb-6 block">← Back to Kanban</button>
      <h1 className="text-lg font-mono tracking-widest text-white mb-1">⚙ VAULT SETTINGS</h1>
      <p className="text-xs text-white/30 font-mono mb-6">Point to your Obsidian vault to enable bidirectional task sync.</p>

      <div className="flex flex-col gap-4 p-4 border border-white/10 rounded-sm">
        <div>
          <label className="text-xs font-mono text-white/40 block mb-1.5">OBSIDIAN VAULT PATH</label>
          <input className={fieldClass} placeholder="e.g. C:/Users/Phill/ObsidianVault" value={vaultPath} onChange={e => setVaultPath(e.target.value)} />
          <p className="text-xs text-white/20 font-mono mt-1">Absolute path to your vault. Tasks will sync to/from Tasks/ subfolder.</p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-mono text-white/60">Enable sync</span>
          <button onClick={() => setSyncEnabled(!syncEnabled)}
            className={`w-10 h-5 rounded-sm border transition-colors ${syncEnabled ? 'bg-cyan-400/20 border-cyan-400/40' : 'bg-white/5 border-white/10'}`}>
            <span className={`block w-4 h-4 rounded-sm transition-transform ${syncEnabled ? 'translate-x-5 bg-cyan-400' : 'translate-x-0.5 bg-white/20'}`} />
          </button>
        </div>

        <button onClick={handleSave} disabled={saving || !vaultPath}
          className="py-2 text-sm font-mono bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-400 border border-cyan-400/30 rounded-sm transition-colors disabled:opacity-50">
          {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save & Start Sync'}
        </button>
      </div>
    </div>
  );
}
```

**Commit:**
```bash
git add src/app/\(unite-hub\)/kanban/
git commit -m "feat(kanban): kanban page + vault settings page"
```

---

## Task 10: Update sidebar navigation

**Files:**
- Modify: `src/app/(unite-hub)/layout.tsx`

**Step 1: Update the Projects nav item to point to /kanban**

Find:
```typescript
{
  label: 'Projects',
  href: '/dashboard/projects',
  icon: FolderKanban,
},
```

Replace with:
```typescript
{
  label: 'Kanban',
  href: '/kanban',
  icon: FolderKanban,
},
```

**Commit:**
```bash
git add src/app/\(unite-hub\)/layout.tsx
git commit -m "feat(kanban): add Kanban to unite-hub sidebar nav"
```

---

## Task 11: Clone Veritas Kanban MCP server

**Files:**
- Create: `packages/veritas-kanban-mcp/` (git subtree or sparse clone)
- Modify: `mcp_config.json`

**Step 1: Sparse clone just the MCP server**
```bash
cd /c/Unite-Group
git clone --depth=1 --filter=blob:none --sparse https://github.com/BradGroux/veritas-kanban.git packages/veritas-kanban-mcp
cd packages/veritas-kanban-mcp
git sparse-checkout set src/mcp package.json tsconfig.json
cd /c/Unite-Group
```

**Step 2: Install MCP deps and build**
```bash
cd packages/veritas-kanban-mcp && pnpm install && pnpm build 2>/dev/null || npm install && npm run build
```

**Step 3: Add to mcp_config.json**
Open `mcp_config.json` and add:
```json
"veritas-kanban": {
  "command": "node",
  "args": ["packages/veritas-kanban-mcp/dist/mcp-server.js"],
  "env": {
    "TASKS_DIR": "C:/Your/ObsidianVault/Tasks",
    "API_URL": "http://localhost:3000/api/kanban"
  }
}
```
Note: User configures `TASKS_DIR` to match their vault path in settings.

**Step 4: Commit**
```bash
git add packages/veritas-kanban-mcp/ mcp_config.json
git commit -m "feat(kanban): veritas-kanban MCP server integration"
```

---

## Task 12: TypeScript check + build verification

```bash
cd /c/Unite-Group
pnpm tsc --noEmit 2>&1 | head -40
```
Fix any type errors — common ones: missing `await params` in Next.js 15 route handlers (already used above), `createClient` return type.

```bash
pnpm build 2>&1 | tail -20
```
Expected: Build succeeds.

**Commit any fixes:**
```bash
git add -A && git commit -m "fix(kanban): TypeScript and build fixes"
```

---

## Task 13: Integration smoke test

**Step 1: Start dev server**
```bash
pnpm dev
```

**Step 2: Navigate to `/kanban`**
- Should see 4 columns
- Should see "No vault configured" in sync badge

**Step 3: Go to `/kanban/settings`**
- Enter your Obsidian vault path
- Click Save — should show "✓ Saved"

**Step 4: Create a test task**
- Click "+ Add task" in To Do column
- Fill title, assign to self, priority high
- Click Create Task
- Task card should appear in To Do column
- `.md` file should appear in `<vault>/Tasks/todo/` in Obsidian

**Step 5: Drag task to In Progress**
- Drag the card to In Progress column
- Card should move
- File should move from `Tasks/todo/` to `Tasks/in-progress/` in vault

**Step 6: Edit in Obsidian**
- Open the `.md` file in Obsidian
- Change a tag or the description
- Save in Obsidian
- Board should update within 1-2 seconds via SSE

**Step 7: Final commit**
```bash
git add -A && git commit -m "feat(kanban): complete kanban + obsidian integration

- Drag-and-drop Kanban board (4 columns, Scientific Luxury design)
- Bidirectional Obsidian vault sync via chokidar + gray-matter
- Supabase tasks table with workspace isolation + RLS (migration 520)
- SSE real-time board updates from vault changes
- Task assignment: self / agent / staff / client
- Veritas Kanban MCP server (26 AI tools)
- Vault settings page at /kanban/settings

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```
