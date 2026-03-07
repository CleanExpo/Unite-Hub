# Design: Kanban + Obsidian Integration for Unite-Group

**Date:** 07/03/2026
**Status:** Approved — proceeding to implementation
**Approach:** A — Native Unite-Group Kanban Module

---

## Overview

Embed a Kanban task board into Unite-Group's UI that:
- Stores tasks as Markdown files in the user's Obsidian vault (source of truth)
- Mirrors tasks to Supabase for querying, AI agent access, and real-time UI
- Supports assignment to self, AI agents, staff, and clients
- Integrates Veritas Kanban's MCP server for AI agent tool access (26 tools)

---

## Architecture

```
Unite-Group UI (/kanban)
    │
    ▼
Supabase tasks table (migration 520)
    │  ↑↓ bidirectional sync
    ▼
src/server/obsidian-sync/ (chokidar watcher)
    │  ↑↓
    ▼
Obsidian Vault/Tasks/**/*.md (source of truth)
    │
    ▼
mcp_config.json → packages/veritas-kanban-mcp/ (26 AI tools)
```

---

## Database Schema (Migration 520)

### `tasks` table
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| workspace_id | uuid FK | → workspaces(id), RLS isolated |
| title | text | required |
| description | text | editable in Obsidian or UI |
| status | text | todo / in-progress / blocked / done |
| priority | text | low / medium / high / urgent |
| assignee_type | text | self / agent / staff / client |
| assignee_id | uuid | user_id / agent_id / contact_id |
| assignee_name | text | denormalised for display |
| obsidian_path | text | relative path in vault |
| obsidian_synced_at | timestamptz | last sync timestamp |
| tags | text[] | array of tag strings |
| due_date | date | optional deadline |
| position | int | column sort order |
| created_by | uuid FK | → auth.users(id) |
| created_at / updated_at | timestamptz | auto-managed |

### `workspace_vault_config` table
| Column | Type | Notes |
|---|---|---|
| workspace_id | uuid PK FK | → workspaces(id) |
| vault_path | text | absolute local path to Obsidian vault |
| sync_enabled | boolean | toggle sync |
| last_synced_at | timestamptz | last full sync |

**RLS:** `workspace_id = current_setting('app.current_workspace_id')::uuid AND auth.uid() IS NOT NULL`

---

## Obsidian Sync Service

**Location:** `src/server/obsidian-sync/`

**Files:**
- `watcher.ts` — chokidar watching vault/Tasks/** for .md changes
- `parser.ts` — gray-matter YAML frontmatter parser
- `writer.ts` — writes .md files back to vault on UI changes
- `sync-engine.ts` — orchestrates both directions

**Markdown format:**
```markdown
---
id: "uuid"
title: "Task title"
status: "todo"
priority: "medium"
assignee_type: "staff"
assignee_name: "Duncan"
tags: ["auth"]
due_date: "2026-03-14"
workspace_id: "uuid"
created_at: "2026-03-07T10:00:00Z"
---

## Description
...

## Notes
...
```

**Vault folder structure:**
```
Obsidian Vault/Tasks/
├── todo/
├── in-progress/
├── blocked/
└── done/
```

**Initialisation:** `instrumentation.ts` starts watcher on server boot.

---

## API Routes

```
src/app/api/kanban/
├── tasks/
│   ├── route.ts           GET (list) + POST (create)
│   └── [id]/route.ts      GET + PATCH (update/move) + DELETE
├── events/route.ts        SSE stream for real-time board updates
└── sync/route.ts          POST (manual sync trigger) + GET (status)
```

---

## Kanban UI

**Route:** `src/app/(unite-hub)/kanban/page.tsx`

**Components:** `src/components/kanban/`
- `KanbanBoard.tsx` — @dnd-kit/core DnD container
- `KanbanColumn.tsx` — droppable column
- `TaskCard.tsx` — draggable card
- `TaskModal.tsx` — Framer Motion slide-in detail drawer
- `NewTaskForm.tsx` — quick-add inline form
- `AssigneeFilter.tsx` — pill filters
- `SyncStatusBadge.tsx` — sync indicator

**Design:**
- Background: `#050505` (OLED Black)
- Primary accent: `#00F5FF` (Cyan)
- Urgent: `#FF4444` | High: `#FFB800` | Medium: `#00F5FF` | Low: `#666`
- Corners: `rounded-sm` only
- Animation: Framer Motion only

---

## MCP Server Integration

**Location:** `packages/veritas-kanban-mcp/` (git clone of BradGroux/veritas-kanban)

**`mcp_config.json` entry:**
```json
"veritas-kanban": {
  "command": "node",
  "args": ["packages/veritas-kanban-mcp/dist/mcp-server.js"],
  "env": {
    "TASKS_DIR": "<vault_path>/Tasks",
    "API_URL": "http://localhost:3000/api/kanban"
  }
}
```

---

## Dependencies

```json
"@dnd-kit/core": "^6",
"@dnd-kit/sortable": "^8",
"gray-matter": "^4",
"chokidar": "^4"
```

---

## File Map

| What | Where |
|---|---|
| Migration | `supabase/migrations/520_kanban_tasks.sql` |
| Sync service | `src/server/obsidian-sync/` |
| API routes | `src/app/api/kanban/` |
| Page | `src/app/(unite-hub)/kanban/page.tsx` |
| Components | `src/components/kanban/` |
| MCP server | `packages/veritas-kanban-mcp/` |
| Sidebar link | `src/components/layout/SidebarNavigation.tsx` |
| Vault settings | `src/app/(unite-hub)/kanban/settings/page.tsx` |
