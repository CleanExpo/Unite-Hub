# Project Phases

## Overview

This directory contains specification documents for major project phases (Phase 0-9 style) that involve architectural changes, system refactors, or major enhancements.

Each phase spec is tracked in `PROGRESS.md` and follows the 10-section format defined in `.claude/templates/spec-project-phase.md`.

---

## Phase Structure

### Naming Convention

- `phase-X-spec.md` where X is the phase number (0-9)
- One spec file per major phase

### Content

Each phase spec includes:

1. **Vision**: Problem, beneficiaries, success criteria, why now
2. **Users**: Personas, user stories, pain points
3. **Technical**: Architecture, integrations, dependencies, constraints
4. **Design**: Components, aesthetic, Australian context, accessibility
5. **Business**: Priority, scope, metrics, risks
6. **Implementation**: Build order, verification criteria
7. **Related Documentation**: Links to CLAUDE.md, skills, agents
8. **Progress Tracking**: Links to PROGRESS.md tracking
9. **Assumptions & Constraints**: Technical and timeline constraints
10. **Sign-Off**: Approval status from stakeholders

---

## Index of Phases

### Completed Phases

- **Phase 0: Foundation Setup** ✅
  - Location: `phase-0-spec.md` (historical reference)
  - Status: Complete
  - Delivered: Core infrastructure, database schema, authentication

- **Phase 1: Core Architecture** ✅
  - Location: `phase-1-spec.md` (historical reference)
  - Status: Complete
  - Delivered: Next.js + FastAPI integration, monorepo setup

- **Phase 2: Authentication System** ✅
  - Location: `phase-2-spec.md` (historical reference)
  - Status: Complete
  - Delivered: JWT auth, user management, session handling

### Current/Upcoming Phases

See `PROGRESS.md` for:

- Phase 3 and beyond
- Current status and progress
- Link to each phase spec

---

## Creating a New Phase Spec

### Step 1: Add to PROGRESS.md

In `PROGRESS.md`, create a new Phase section:

```markdown
## Phase X: [Phase Name]

**Spec**: [phase-X-spec.md](docs/phases/phase-X-spec.md)
**Status**: Not Started | In Progress | Completed
**Progress**: [░░░░░░░░░░] 0%
```

### Step 2: Create Spec File

**Option A: Use Template (Fast)**

```bash
cp .claude/templates/spec-project-phase.md docs/phases/phase-X-spec.md
nano docs/phases/phase-X-spec.md  # Edit to complete
```

**Option B: Use Spec Builder Interview (Comprehensive)**

```
User: "Start Phase X: [Name]"
System: Offers interview mode
Result: Auto-generated phase-X-spec.md with full details
```

### Step 3: Validate Completeness

- [ ] All 10 sections have meaningful content
- [ ] Vision clearly states problem and success criteria
- [ ] Users includes multiple personas and user stories
- [ ] Technical describes architecture and dependencies
- [ ] Design includes Australian context and accessibility
- [ ] Business defines priority and risks
- [ ] Implementation lists specific build steps
- [ ] ≥80% completeness score
- [ ] Australian context (en-AU, DD/MM/YYYY, AUD, Privacy Act)
- [ ] Design system compliance (design tokens, NO Lucide icons)

### Step 4: Link in PROGRESS.md

Update PROGRESS.md to reference the spec:

```markdown
## Phase X: [Name]

**Spec**: [phase-X-spec.md](../phases/phase-X-spec.md)
**Status**: In Progress
**Progress**: [████░░░░░░] 40%

### Phase Objectives

[Summarized from spec Vision section]

### Verification Criteria

[From spec Implementation section]
```

### Step 5: Start Implementation

Once spec is complete (≥80%):

```
User: "Begin Phase X implementation"
System: Loads phase spec as context
Result: Guided by spec throughout execution
```

---

## Phase Governance

### Who Approves Phases?

- **Product Manager**: Business alignment
- **Tech Lead**: Technical feasibility
- **Design Lead**: Design system compliance
- **Architecture Lead**: Architectural impact

All must sign off before phase begins.

### Phase Review Cadence

| Stage            | Frequency            | Who                  |
| ---------------- | -------------------- | -------------------- |
| Spec Creation    | As needed            | Product + Tech leads |
| Spec Validation  | Before phase start   | Architecture review  |
| Progress Updates | Weekly               | Team lead            |
| Phase Completion | After final PR merge | All stakeholders     |

---

## Phase Completion Criteria

A phase is considered **complete** when:

1. **All Implementation Tasks Done**
   - All features specified in "Build Order" delivered
   - All integration points functional
   - All data migrations complete

2. **Verification Criteria Met** (from spec Implementation section)
   - All tests pass (unit, integration, E2E)
   - Lighthouse score >90
   - WCAG 2.1 AA compliance verified
   - Australian context validated
   - Design system compliance verified
   - Security scan passed
   - Performance budgets met

3. **Stakeholder Sign-Off**
   - Code review completed
   - Design review completed
   - Product acceptance
   - PM/Tech lead approval

4. **Documentation**
   - PROGRESS.md updated with status "Complete"
   - Spec archived for historical reference
   - Handoff documentation written

---

## Archive & Historical Reference

### Completed Phase Archive

Completed phases are kept for historical reference:

```
docs/
├── phases/
│   ├── phase-0-spec.md    (historical)
│   ├── phase-1-spec.md    (historical)
│   ├── phase-2-spec.md    (historical)
│   ├── phase-3-spec.md    (current)
│   └── phase-4-spec.md    (in-progress)
└── archive/
    └── phases/
        ├── 2026-01/phase-0-spec.md.archive
        ├── 2026-01/phase-1-spec.md.archive
        └── 2026-01/phase-2-spec.md.archive
```

All phase specs (completed or not) remain in `docs/phases/` for easy reference in PROGRESS.md and historical tracking.

---

## Related Documentation

- **PROGRESS.md**: Project phase tracking and status
- **CLAUDE.md**: Project architecture and quick start
- **Templates**: `.claude/templates/spec-project-phase.md` - Phase spec template
- **Spec System**: `docs/SPEC_GENERATION.md` - Full spec generation guide
- **Design Tokens**: `.claude/data/design-tokens.json` - Design system

---

## Questions & Support

- **How do I create a phase spec?** See "Creating a New Phase Spec" above
- **What template should I use?** Use `.claude/templates/spec-project-phase.md`
- **Who do I contact for approval?** See "Who Approves Phases?" above
- **How do I know when a phase is complete?** See "Phase Completion Criteria" above

For detailed spec system documentation, see: `docs/SPEC_GENERATION.md`

---

**Directory Version**: 1.0.0
**Last Updated**: [DD/MM/YYYY]
**Maintainer**: Architecture Team
