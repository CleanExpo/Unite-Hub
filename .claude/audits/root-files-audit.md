# Root Files Audit — 08/03/2026

## Executive Summary

The project root contains **529 markdown files**, of which approximately **5 are genuine documentation** and **524 are AI-generated session artefacts** — completion reports, deployment checklists, migration instructions, and session summaries that were committed directly to the repository root over 1,112+ commits. This represents the single most visible sign of uncontrolled AI-driven development: each session produced one or more `.md` files that were never cleaned up. Three files are malformed paths (Windows absolute paths committed as filenames: `d:Unite-Hub*.md`), indicating at least one session ran with incorrect working directory context. The root also contains a stray `agent.md` file that belongs in `.claude/agents/`. There are zero loose SQL files in the project root.

---

## Scale Statistics

| Metric | Count |
|--------|-------|
| Total markdown files in project root (`maxdepth 1`) | 529 |
| Genuine documentation (keep) | 5 |
| AI-generated session artefacts (archive) | ~519 |
| Malformed path filenames (Windows absolute paths) | 3 |
| Misplaced non-documentation files | 2 |
| Loose SQL files in project root | 0 |

---

## Genuine Documentation (Keep)

These files serve a legitimate, ongoing documentation purpose:

| File | Purpose |
|------|---------|
| `README.md` | Project introduction — genuine |
| `CHANGELOG.md` | Version history — genuine |
| `CLAUDE.md` | AI assistant configuration — legitimate project config |
| `ARCHITECTURE.md` | High-level architecture reference |
| `SPEC.md` | Product specification |

All other root markdown files are AI session artefacts and should be archived.

---

## Misplaced / Malformed Files

| File | Issue | Action |
|------|-------|--------|
| `agent.md` | Belongs in `.claude/agents/` — stray agent definition | Move to correct location |
| `d:Unite-HubAGENT_DEPLOYMENT_GUIDE.md` | Windows absolute path committed as filename | Delete — content is duplicate/stale |
| `d:Unite-HubRUN_MIGRATION_043.md` | Windows absolute path committed as filename | Delete — content is duplicate/stale |
| `d:Unite-HubSYSTEM_COMPLETE.md` | Windows absolute path committed as filename | Delete — content is duplicate/stale |
| `d:Unite-HubdocsDEPLOYMENT_STRATEGY.md` | Windows absolute path committed as filename | Delete — content is duplicate/stale |
| `d:Unite-HubdocsSAFE_MIGRATIONS.md` | Windows absolute path committed as filename | Delete — content is duplicate/stale |

---

## AI Artefact Categories (Archive Candidates)

### Category 1: Session Completion Reports (~120 files)
Pattern: `*_COMPLETE.md`, `*_COMPLETE_*.md`, `*_COMPLETE_SUMMARY.md`

Examples:
- `AIDO_2026_IMPLEMENTATION_COMPLETE.md`
- `AIDO_2026_SYSTEM_COMPLETE.md`
- `AIDO_API_COMPLETE.md`
- `AUTONOMOUS_EXECUTION_COMPLETE.md`
- `BUILD_COMPLETE.md`
- `DEPLOYMENT_COMPLETE.md`
- `FRONTEND_COMPLETE.md`
- `IMPLEMENTATION_COMPLETE.md`
- `PHASE1_IMPLEMENTATION_COMPLETE.md` (and PHASE2, PHASE3, PHASE4…)

### Category 2: Deployment Checklists (~45 files)
Pattern: `*_CHECKLIST.md`, `*_DEPLOYMENT_*.md`, `*_READY*.md`

Examples:
- `DEPLOYMENT_CHECKLIST_SESSION_3.md`
- `MASTER_DEPLOYMENT_CHECKLIST.md`
- `PRODUCTION_DEPLOYMENT_CHECKLIST.md`
- `READY_FOR_PRODUCTION.md`
- `READY_TO_DEPLOY.md`

### Category 3: Migration Instructions (~35 files)
Pattern: `RUN_MIGRATION_*.md`, `APPLY_MIGRATION_*.md`, `EXECUTE_MIGRATION*.md`

Examples:
- `RUN_MIGRATION_037.md` through `RUN_MIGRATION_043.md`
- `APPLY_MIGRATION_028_NOW.md`
- `EXECUTE_MIGRATIONS_NOW.md`
- `EXECUTE_NOW.md`

### Category 4: Phase Session Summaries (~40 files)
Pattern: `PHASE*_SESSION_SUMMARY.md`, `PHASE*_COMPLETE.md`, `PHASE_*_COMPLETION_SUMMARY.md`

Examples:
- `PHASE1_COMPLETE.md` through `PHASE7_WEEK18_COMPLETE.md`
- `PHASE_8_COMPLETION_SUMMARY.md` through `PHASE_13_COMPLETION_SUMMARY.md`
- `PHASE2_SESSION_SUMMARY.md`, `PHASE3_SESSION_SUMMARY.md`

### Category 5: Security / RBAC Artefacts (~30 files)
Examples:
- `RBAC_COMPLETION_CERTIFICATE.md`
- `RBAC_COMPLETION_SUMMARY.md`
- `CRITICAL_SECURITY_FIXES_COMPLETE.md`
- `PARALLEL_SECURITY_MISSION_COMPLETE.md`
- `SECURITY_MISSION_COMPLETE.md`

### Category 6: Integration Setup Guides (~50 files)
Pattern: `*_SETUP.md`, `*_SETUP_GUIDE.md`, `*_QUICKSTART.md`, `*_INTEGRATION_*.md`

Examples:
- `GMAIL_SETUP.md`, `GMAIL_QUICKSTART.md`, `GMAIL_SMTP_FINAL_RESOLUTION.md`
- `GOOGLE_OAUTH_SETUP.md`, `GOOGLE_OAUTH_CHECKLIST.md`
- `SENDGRID_SETUP_GUIDE.md`, `SENDGRID_DNS_SETUP.md`
- `STRIPE_SETUP.md`, `STRIPE_SETUP_GUIDE.md`
- `DIGITALOCEAN_SETUP_GUIDE.md`, `DOCKER_SETUP_COMPLETE.md`

### Category 7: Status Updates / Progress Reports (~60 files)
Pattern: `*_STATUS*.md`, `*_PROGRESS*.md`, `*_SUMMARY.md`, `CURRENT_STATUS_*.md`

Examples:
- `CURRENT_STATUS_2025-01-18.md`
- `CURRENT_STATUS_2025-11-25.md`
- `SESSION_SUMMARY_2025-11-15.md`
- `COMMIT_SUMMARY_2025-11-25.md`
- `SYSTEM_UPDATE_2025-11-18.md`

### Category 8: Audit / Verification Artefacts (~20 files)
Examples:
- `AUDIT-INDEX.md`
- `AUDIT-SUMMARY.md`
- `COMPREHENSIVE_AUDIT_REPORT.md`
- `COMPLETE_SYSTEM_AUDIT.md`
- `PLATFORM_AUDIT_EXECUTIVE_SUMMARY.md`

---

## Findings

### CRITICAL (blocks Phase 2)

| Finding | Files | Recommendation |
|---------|-------|----------------|
| 524 AI artefact markdown files in repo root pollute `git log`, `git blame`, and PR diffs | Root `*.md` | Archive to `.archive/ai-session-docs/` and remove from git tracking |
| 5 malformed Windows path filenames committed to repo | `d:Unite-Hub*.md` | Delete immediately — these cannot be opened on any OS |
| `agent.md` loose in repo root | `agent.md` | Move to `.claude/agents/` or delete if duplicate |

### HIGH (address in Phase 2)

| Finding | Files | Recommendation |
|---------|-------|----------------|
| No `.gitignore` rule prevents `*_COMPLETE.md`, `*_SUMMARY.md` accumulation | `.gitignore` | Add patterns to prevent future AI artefact commits |
| `AUDIT-INDEX.md` and `AUDIT-SUMMARY.md` in root — superseded by `.claude/audits/` | Root | Delete; use `.claude/audits/` as canonical audit location |

### MEDIUM (address in Phase 3–4)

| Finding | Files | Recommendation |
|---------|-------|----------------|
| Duplicate setup guides for same service (e.g. 4× Gmail files, 3× Stripe files) | Various | Consolidate to single `docs/integrations/` directory |
| `CHANGELOG.md` exists but may not reflect actual releases | `CHANGELOG.md` | Verify against git tags and `RELEASE_v1.0.0.md`, `RELEASE_v1.1.0.md` |

---

## Statistics

- Total files audited: **529**
- Keep: **5** (README, CHANGELOG, CLAUDE.md, ARCHITECTURE.md, SPEC.md)
- Archive (remove from git, store in `.archive/`): **~519**
- Delete immediately (malformed paths + stray agent.md): **6**

---

## Recommended Actions (Priority Order)

1. Create `.archive/ai-session-docs/` directory (outside git tracking via `.gitignore`)
2. Run `git rm` on all root `*.md` files except the 5 genuine docs listed above
3. Delete the 5 malformed `d:Unite-Hub*.md` filenames immediately
4. Move `agent.md` to its correct location or delete if duplicate
5. Add to `.gitignore`:
   ```
   # AI session artefacts — never commit these to root
   /*_COMPLETE.md
   /*_SUMMARY.md
   /*_CHECKLIST.md
   /*_PROGRESS.md
   /RUN_MIGRATION_*.md
   /APPLY_MIGRATION_*.md
   /EXECUTE_*.md
   /PHASE*.md
   ```
6. Establish `docs/` as the only permitted location for operational documentation going forward
