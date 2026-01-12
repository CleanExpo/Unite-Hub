# Roadmap: Unite-Hub

## Overview

Transform Unite-Hub into a fully design-token-compliant application by migrating all hardcoded Tailwind colors to semantic design tokens. This ensures brand consistency, theme flexibility, and maintainability.

## Domain Expertise

- ~/.claude/skills/design-token-validator.md
- ~/.claude/skills/accessibility-audit.md

## Milestones

- 🚧 **v1.1 Design Token Migration** - Phases 1-6 (in progress)

## Phases

- [x] **Phase 1: Audit & Prioritize** - Analyze violations, create migration priority list
- [x] **Phase 2: UI Components** - Fix 25 → 2 violations (92% reduction)
- [x] **Phase 3: Dashboard Pages** - Migrate dashboard and overview pages (COMPLETE)
- [x] **Phase 4: CRM Pages** - Migrate landing, auth, billing, showcase pages (COMPLETE)
- [ ] **Phase 5: Product Pages** - Migrate Console, Client, Guardian, Founder (~3,553 violations)
- [ ] **Phase 6: Validation & Cleanup** - Final audit, remove legacy CSS, update thresholds

## Phase Details

### 🚧 v1.1 Design Token Migration (In Progress)

**Milestone Goal:** Reduce design token violations from 426 total to <50, achieving 90%+ compliance.

#### Phase 1: Audit & Prioritize

**Goal**: Analyze all violations, categorize by file type, create prioritized migration list
**Depends on**: Premium Upgrade complete
**Research**: Unlikely (internal patterns established)
**Plans**: TBD

Plans:
- [ ] 01-01: Audit violations, categorize, create migration priority list

#### Phase 2: UI Components

**Goal**: Fix all 25 UI component violations, achieve 0 violations in src/components/ui/
**Depends on**: Phase 1
**Research**: Unlikely (token mapping documented)
**Plans**: TBD

Plans:
- [x] 02-01: High-violation components (5 files)
- [x] 02-02: Medium-violation components (10 files)
- [x] 02-03: Low-violation components (10 files)
Result: 25 → 2 violations (only intentional purple brand colors remain)

#### Phase 3: Dashboard Pages

**Goal**: Migrate dashboard/, overview, analytics pages to design tokens
**Depends on**: Phase 2
**Research**: Unlikely (patterns from Phase 2)
**Plans**: TBD

Plans:
- [x] 03-01: Core dashboard (page.tsx, layout.tsx, overview/, analytics/, modern/)
- [x] 03-02: Dashboard tools (ai-tools/, intelligence/, insights/, monitoring/) - 184 violations
- [x] 03-03: Dashboard utilities (settings/, profile/, approvals/, reports/) - Already compliant

#### Phase 4: CRM Pages

**Goal**: Migrate high-impact app pages (landing, auth, billing, demos)
**Depends on**: Phase 3
**Research**: Unlikely (established patterns)
**Plans**: 3 plans

Plans:
- [x] 04-01: Skipped (merged into 04-04)
- [x] 04-02: Showcase pages (visual-experience-engine) - 6 violations
- [x] 04-03: Dynamic routes (founder/*, dashboard/*, regions/*) - ~240 violations
- [x] 04-04: Landing page & auth completion - ~91 violations
Result: ~337 violations fixed across landing, auth, billing, showcase pages

#### Phase 5: Product Pages

**Goal**: Migrate all product pages (Console, Client, Guardian, Founder)
**Depends on**: Phase 4
**Research**: Unlikely (established patterns)
**Violations Discovered**: 3,553 across 267 files

Breakdown by product:
- Console: 273 violations (14 files)
- Client: 131 violations (20 files)
- Guardian: 705 violations (46 files)
- Founder: 2,444 violations (187 files)

Plans:
- [ ] 05-01: Console pages (14 files, 273 violations)
- [ ] 05-02: Client dashboard (20 files, 131 violations)
- [ ] 05-03: Guardian admin & core (46 files, 705 violations)
- [ ] 05-04: Founder core & dashboard (~60 files, ~800 violations)
- [ ] 05-05: Founder tools & agents (~60 files, ~800 violations)
- [ ] 05-06: Founder analytics & rest (~67 files, ~844 violations)

#### Phase 6: Validation & Cleanup

**Goal**: Final audit, update test thresholds to strict (0 violations), remove legacy CSS
**Depends on**: Phase 5
**Research**: Unlikely (validation only)
**Plans**: TBD

Plans:
- [ ] 06-01: TBD

## Progress

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1. Audit & Prioritize | v1.1 | 1/1 | Complete | 2026-01-12 |
| 2. UI Components | v1.1 | 3/3 | Complete | 2026-01-12 |
| 3. Dashboard Pages | v1.1 | 3/3 | Complete | 2026-01-12 |
| 4. CRM Pages | v1.1 | 4/4 | Complete | 2026-01-13 |
| 5. Product Pages | v1.1 | 0/6 | In Progress | - |
| 6. Validation & Cleanup | v1.1 | 0/1 | Not started | - |

## Violation Summary

| Area | Files | Violations | Status |
|------|-------|------------|--------|
| UI Components | 48 | 25 → 2 | Complete |
| Dashboard | ~30 | ~200 | Complete |
| CRM/Landing | ~15 | ~337 | Complete |
| Console | 14 | 273 | Plan 05-01 |
| Client | 20 | 131 | Plan 05-02 |
| Guardian | 46 | 705 | Plan 05-03 |
| Founder | 187 | 2,444 | Plans 05-04 to 05-06 |
