# System Supervisor - Drift Detection Rules

Spec-to-code location mapping, severity assignment, and ignore patterns for architecture drift scanning.

---

## Spec-to-Code Location Mapping

### Where Specs Live

| Spec Type | Location Pattern | Contents |
|-----------|-----------------|----------|
| Phase specifications | `docs/phases/phase-*-spec.md` | Phase deliverables, acceptance criteria |
| Feature specifications | `docs/features/*/spec.md` | Feature requirements, UI mockups, API contracts |
| API reference | `docs/reference/*.md` | Endpoint documentation, request/response shapes |
| Design system | `docs/DESIGN_SYSTEM.md` | UI component rules, colour system, typography |

### Where Code Lives

| Code Type | Location Pattern | What to Match |
|-----------|-----------------|---------------|
| Frontend pages | `apps/web/app/**/*.tsx` | Declared UI features |
| Frontend components | `apps/web/components/**/*.tsx` | Declared UI components |
| API routes | `apps/backend/src/api/**/*.py` | Declared API endpoints |
| Database models | `apps/backend/src/db/**/*.py` | Declared data models |
| Agent definitions | `apps/backend/src/agents/**/*.py` | Declared AI agents |
| Migrations | `apps/backend/alembic/versions/*.py` | Schema evolution |
| Tests | `apps/backend/tests/**/*.py`, `apps/web/**/*.test.*` | Test coverage |

### Mapping Rules

1. **Endpoint mapping**: Spec declares `POST /api/auth/login` → scan for route definition in `apps/backend/src/api/`
2. **Model mapping**: Spec declares "users table with email, password" → scan for SQLAlchemy model in `apps/backend/src/db/`
3. **Component mapping**: Spec declares "login form component" → scan for component in `apps/web/components/` or `apps/web/app/`
4. **Feature mapping**: Spec declares "contractor availability scheduling" → scan for both API route and UI component

---

## Severity Assignment Rules

### MISSING (spec exists, code does not)

| Context | Severity |
|---------|----------|
| Core feature (auth, data model, primary API) | **HIGH** |
| Supporting feature (docs, analytics, admin) | **MEDIUM** |
| Nice-to-have (tooltip, animation, edge case) | **LOW** |

### ORPHANED (code exists, no spec)

| Context | Severity |
|---------|----------|
| Route handler or API endpoint | **MEDIUM** — may be intentional, verify |
| Utility function with no callers | **MEDIUM** — likely dead code |
| Test file with no matching source | **LOW** — may be pre-emptive test |
| Configuration or script | **LOW** — often intentionally unspecified |

### DIVERGED (both exist, they disagree)

| Context | Severity |
|---------|----------|
| API response shape differs from spec | **HIGH** — contract violation |
| UI layout differs from spec mockup | **MEDIUM** — may be intentional refinement |
| Database column type differs from spec | **HIGH** — data integrity risk |
| Feature behaviour differs from spec | **HIGH** — spec must be updated or code corrected |

---

## Ignore Patterns

These files and directories are excluded from drift scanning (generated, config, or third-party):

### Always Ignore

```
node_modules/
__pycache__/
.next/
.turbo/
dist/
build/
*.lock
*.log
.env
.env.*
*.pyc
*.pyo
alembic/versions/*.py    # Auto-generated migration files (check manually)
```

### Ignore for ORPHANED Detection Only

These may exist without spec references:

```
scripts/                  # Setup and utility scripts
.claude/                  # Agent configuration
.skills/                  # Skill definitions
.beads/                   # Task tracking
docs/internal/            # Internal framework docs
apps/web/public/          # Static assets
apps/backend/src/config/  # Configuration modules
```

### Never Ignore (Always Scan)

```
apps/web/app/             # Frontend pages — must match spec
apps/web/components/      # UI components — must match design system
apps/backend/src/api/     # API routes — must match endpoint spec
apps/backend/src/db/      # Models — must match data model spec
apps/backend/src/agents/  # Agents — must match agent spec
apps/backend/src/auth/    # Auth — must match security spec
```

---

## Reconciliation Actions

When drift is detected, recommend one of these actions:

| Drift Type | Recommended Action |
|-----------|-------------------|
| MISSING (HIGH) | Create implementation task; block merge if critical path |
| MISSING (MEDIUM/LOW) | Create Beads task for backlog |
| ORPHANED (confirmed dead) | Remove code; update imports |
| ORPHANED (intentional) | Add spec entry or doc reference to formalise |
| DIVERGED (code is correct) | Update spec to match implementation |
| DIVERGED (spec is correct) | Fix implementation to match spec |
| DIVERGED (unclear) | Escalate — request user decision |
