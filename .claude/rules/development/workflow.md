# Development Workflow Rules

## Project Commands

```bash
# Development
pnpm dev                          # Start dev server

# Database (Docker)
pnpm run docker:up                # Start PostgreSQL + Redis
pnpm run docker:down              # Stop services
pnpm run docker:reset             # Reset database (destructive)

# Testing
pnpm vitest run                   # Unit tests (Vitest)

# Quality Checks
pnpm run type-check               # TypeScript strict check
pnpm run lint                     # ESLint
.\scripts\health-check.ps1        # Comprehensive system health check
```

## Conventions

### Naming
- React: `PascalCase.tsx`
- Utils: `kebab-case.ts`
- Skills: `SCREAMING-KEBAB.md`

### Commits
```bash
# Format: <type>(<scope>): <description>
feat(web): add dark mode toggle
fix(backend): resolve agent timeout
docs(skills): update orchestrator guide
```

### Branching
- `main` - Production ready
- `feature/<name>` - New features
- `fix/<name>` - Bug fixes

## Pre-PR Checklist

```bash
pnpm turbo run type-check lint test && echo "Ready for PR"
```

## Architecture Layers

```
Frontend: Components → Hooks → API Routes → Services
Database: Tables → Functions → Triggers
```

**Rule**: No cross-layer imports. Each layer only imports from the layer directly below.
