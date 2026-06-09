# PROGRESS — Command Centre slice: Queue visibility & approvals

Branch: `pidev/auto-nexus-cc-queue-board` (off `main`). Never commit to main.
Goal: make the decomposed task queue **visible and approvable** (closes the loop after idea→board→decompose).
Schema already in prod: `cc_tasks`, `cc_task_events`, `cc_approvals` — no migration needed.

## Tasks (CC-10 + CC-11 + CC-17)
- [ ] **Lib** — `tasks.ts`: add `getTaskById`, `updateTaskStatus` (by id); extend `SupabaseLike` for `.eq().eq().single()`
- [ ] **Lib** — `approvals.ts`: `recordApproval`, `listApprovalsForTask`, `applyApprovalToTask` (decision→new status); `CC_APPROVALS_TABLE`
- [ ] **Tests** — approvals.test.ts (decision mapping, insert shape, RLS scoping) + tasks.test.ts (getTaskById, updateTaskStatus)
- [ ] **API CC-10** — `GET /api/command-centre/queue` (list, status filter) ; `GET|PATCH /api/command-centre/queue/[id]`
- [ ] **API CC-11** — `POST /api/command-centre/tasks/[id]/approve` { decision, note } → cc_approvals + task status + event
- [ ] **UI CC-17** — `QueueBoard.tsx`: tasks grouped by status, approve/reject/defer buttons wired; mount on command-centre page
- [ ] **Verify** — `pnpm type-check`; `vitest run src/lib/command-centre`; route + render sanity
- [ ] **Ship** — commit per layer; push; open PR for review (do NOT merge)

## Decision mapping (approval → task status)
- approve → `queued` · reject → `failed` · defer → `blocked` · edit → stays `proposed` (note recorded)
- Always: insert cc_approvals row + append `approved` task event (audit).

## Notes
- Auth pattern: `getUser()` → 401; founder-scoped via RLS (`founder_id = user.id`).
- Keep accessors testable with the `SupabaseLike` mock (no network at import).
