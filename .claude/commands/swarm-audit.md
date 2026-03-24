# Command: /swarm-audit

**Category:** System Intelligence
**Description:** Run automated audit of codebase architecture, patterns, and quality

## Usage

```
/swarm-audit
```

Or audit a specific area:

```
/swarm-audit routes
/swarm-audit middleware
/swarm-audit services
/swarm-audit components
```

## What It Does

This command performs a multi-dimensional analysis:

1. **Architecture Audit**
   - Validates separation of concerns (components → hooks → services → repositories)
   - Checks for layer violations (components importing from `src/server/`)
   - Maps dependencies and layers

2. **Pattern Detection**
   - Identifies inconsistent patterns
   - Detects code duplication
   - Flags anti-patterns (missing error boundaries, unhandled promises)

3. **Quality Checks**
   - Tests for error handling completeness
   - Validates logging coverage
   - Checks middleware ordering in Next.js middleware.ts

4. **Documentation Gaps**
   - Identifies undocumented API routes (missing JSDoc or OpenAPI annotations)
   - Flags configuration that's not explained
   - Checks VAULT-INDEX.md for uncovered files

5. **Security Scan**
   - Checks for missing auth guards on protected routes
   - Validates input sanitisation (Zod schemas on POST/PUT/PATCH)
   - Scans for secrets in code (`.env` value leakage)
   - Verifies RLS is enabled on all Supabase tables

## Example Output

```
SWARM AUDIT REPORT
==================

Architecture: HEALTHY
- 12/12 routes follow service/repository pattern
- 8/8 services have proper separation
- 0 circular dependencies detected

Patterns: WARNINGS FOUND
- 3 routes missing try/catch + handleApiError
- 2 components importing directly from src/server/
- 1 service lacks Zod input validation

Documentation: GAPS FOUND
- 5 routes not documented
- 12 functions missing JSDoc
- 2 config vars undocumented

Security: PASSED
- All protected routes use Supabase auth
- Input validation on all user inputs
- No secrets found in code
- RLS enabled: 9/9 tables ✓

Recommendations:
1. Add handleApiError to src/app/api/contacts/route.ts
2. Document new /api/export endpoint
3. Add JSDoc to src/server/services/contacts.service.ts
```

## Output

Results are saved to:
```
.pi/ceo-agents/artifacts/swarm-audit-[DATE].json
```

And summarised in the console.

## Using Results

1. **Fix Issues** — Address high-priority recommendations
2. **Create Issues** — Log findings as Linear issues
3. **Plan Refactoring** — Use architecture findings for sprints
4. **Update Docs** — Fill gaps found by the audit

## Related Commands

- **`/hey-claude`** — Ask Claude to explain audit findings
- **`/ceo-begin`** — Deliberate on major architectural changes before committing
- **`/generate-route-reference`** — Fix documentation gaps found by the audit
- **`/audit`** — Full architecture audit (more detailed than swarm-audit)

## Tips

- Run before major refactoring sessions
- Run before each release to catch issues
- Run quarterly to detect drift
- Cross-reference results with `/audit` for comprehensive coverage

---

**See Also:**
- [.claude/commands/audit.md](./audit.md) — Full architecture audit
- [.claude/rules/database/supabase.md](../rules/database/supabase.md) — RLS requirements
