# Development Workflow Rules

**Status**: ⏳ To be migrated from CLAUDE.md
**Last Updated**: 2026-01-15

---

## Project Commands

```bash
# Development
npm install              # Install dependencies
npm run dev              # Start dev server (http://localhost:3008)
npm run build            # Production build
npm run start            # Production server

# Testing
npm test                 # Run all Vitest tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests
npm run test:e2e         # Playwright end-to-end tests
npm run test:coverage    # Generate coverage report

# Database
npm run check:db         # Verify schema

# AI Agents
npm run email-agent      # Process emails
npm run content-agent    # Generate content
npm run orchestrator     # Coordinate workflows
npm run workflow         # Full pipeline
npm run audit-system     # System health check
npm run analyze-contacts # Contact scoring
npm run generate-content # Content generation

# SEO & Marketing Intelligence
npm run seo:research "topic"        # Latest SEO trends
npm run seo:eeat                    # E-E-A-T guidelines
npm run seo:comprehensive "topic"   # Full SEO report

# Docker
npm run docker:start     # Start core services
npm run docker:stop      # Stop all services
npm run docker:logs      # View logs
npm run docker:rebuild   # Clean rebuild

# Quality & Monitoring
npm run quality:assess   # Run quality assessment
npm run quality:report   # Generate quality report
npm run test:monitoring  # Test monitoring system
```

## Conventions

### Naming
- React: `PascalCase.tsx`
- Utils: `kebab-case.ts`
- Python: `snake_case.py`
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
# Single command - all checks
npm test && npm run build
```

## Port Configuration

Default: **3008** (not 3000)

Change in `package.json`: `"dev": "next dev -p 3008"`

---

**To be migrated from**: CLAUDE.md lines 40-139, 317-334
