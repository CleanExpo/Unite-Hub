# Development Workflow Rules

## Project Commands

```bash
# Development
pnpm dev                          # Start dev server (Next.js)
pnpm dev --filter=web             # Frontend only (if monorepo)

# Database (Supabase)
supabase start                    # Start local Supabase stack
supabase db push                  # Apply pending migrations
supabase db reset                 # Reset database (destructive — local only)
supabase gen types typescript --local > src/types/database.ts  # Regenerate types

# Testing
pnpm vitest run                   # Unit tests (Vitest)
pnpm vitest run --coverage        # With coverage report

# Quality Checks
pnpm run type-check               # TypeScript strict check
pnpm run lint                     # ESLint (flat config)
pnpm turbo run type-check lint    # Combined via Turbo
.\scripts\health-check.ps1        # Comprehensive system health check
```

## Conventions

### Naming
- React: `PascalCase.tsx`
- Utils: `kebab-case.ts`
- Skills: `SCREAMING-KEBAB.md`

### Commits
```bash
# Format: <type>(<scope>): <description> [LINEAR-ISSUE]
feat(kanban): add column collapse [UG-45]
fix(auth): resolve session refresh race condition [UG-67]
docs(skills): update orchestrator guide
```

### Branching
- `main` — Production ready
- `feature/<name>` — New features
- `fix/<name>` — Bug fixes

## Verification Gates Per Commit Tier

| Tier | When | Gates required |
|------|------|---------------|
| **Copy/doc** | Text-only changes | Lint only |
| **Component** | UI changes, new hooks | Lint + type-check |
| **Feature** | New route or service | Lint + type-check + unit tests |
| **Schema** | Migration or RLS change | All above + `supabase db reset` + type generation |
| **Deploy** | Pre-merge to `main` | All above + full build + Phill approval |

## Pre-PR Checklist

```bash
pnpm turbo run type-check lint test && pnpm build && echo "Ready for PR"
```

## Architecture Layers

```
Frontend: Components → Hooks → API Routes → Services
Database: Tables → Functions → Triggers
```

**Rule**: No cross-layer imports. Each layer only imports from the layer directly below.
