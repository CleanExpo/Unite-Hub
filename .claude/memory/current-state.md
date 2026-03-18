# Current State
> Updated: 19/03/2026 AEST

## Active Task
Dependency pruning complete. Awaiting user decision on packages/veritas-kanban-mcp/ removal.

## Recent Architectural Choices
- Phase 12 (Gmail Management + AI Triage) — committed `349a6f17`
- Dependency pruning — committed `f8c0eb4f`: 30 dead prod deps removed, 12 CLI tools → devDeps, 6 orphaned type stubs removed

## In-Progress Work
**Awaiting user approval before proceeding:**

1. `packages/veritas-kanban-mcp/` — 451 MB foreign project in workspace. Needs rm -rf or workspace exclusion.
   - Options: remove entirely OR add `!packages/veritas-kanban-mcp` to pnpm-workspace.yaml

2. **Code Quality Sprint 1 (Security — mandatory before production):**
   - OAuth HMAC state on 4 callback routes
   - businessKey validation (no allowlist)
   - CSP environment-gated (unsafe-eval only in dev)
   - Body size limits on all POST routes
   - Email recipient validation before SendGrid calls
   - DOMPurify on ThreadViewer iframe
   - Slack webhook URL encrypted in vault

3. **Performance Wave 1 (quick wins, zero risk):**
   - Gmail cache key fix (missing email prefix → cross-account pollution)
   - Dynamic imports → module level (20-40ms per call)
   - CRON secret trim inconsistency (coaches/build)
   - Contacts/social posts missing result limits
   - Gate BronSidebar on bronOpen state
   - Enable Supabase pooler

4. **UX consolidation (product decisions needed):**
   - Remove Graph + Skills from nav
   - Merge Bookkeeper → Finance, Advisory + Strategy → Think Tank, Campaigns + Social → Content

## Next Steps
1. User to confirm veritas-kanban-mcp disposal
2. User to approve Security Sprint 1 implementation
3. Performance Wave 1 can proceed any time (no approval needed — all additive fixes)

## Last Updated
19/03/2026 AEST (manual)
