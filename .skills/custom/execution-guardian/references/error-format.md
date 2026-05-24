# Execution Guardian - Error Format Reference

Complete examples of the structured error format per operation type, plus the BLOCKING classification decision tree.

---

## Error Format Template

```
ERROR: {What failed or was blocked}
CAUSE: {Why the gate failed or risk is too high}
RISK:  {LOW | MEDIUM | HIGH} — {one-line risk summary}
FIX:   {Specific action to resolve the block}
BLOCKING: {YES | NO}
```

---

## Examples by Operation Type

### DATABASE_MIGRATION

```
ERROR: Migration revision abc123 lacks downgrade function
CAUSE: Alembic revision has no downgrade() — migration is irreversible
RISK:  HIGH — Schema change cannot be rolled back without manual intervention
FIX:   Add downgrade() function to abc123 revision with reverse operations
BLOCKING: YES
```

```
ERROR: Migration drops column 'contractor_notes' with existing data
CAUSE: DROP COLUMN on non-empty column causes permanent data loss
RISK:  HIGH — 2,847 rows affected; data is not recoverable
FIX:   Add data migration step to preserve values before dropping column
BLOCKING: YES
```

### AUTH_CHANGE

```
ERROR: JWT_SECRET_KEY hardcoded in source file
CAUSE: Secret detected in apps/backend/src/auth/jwt.py line 14
RISK:  HIGH — Credential exposure if committed to version control
FIX:   Move to environment variable; reference via os.getenv("JWT_SECRET_KEY")
BLOCKING: YES
```

```
ERROR: Session invalidation strategy missing for secret rotation
CAUSE: JWT_SECRET_KEY change will invalidate all existing tokens with no graceful handling
RISK:  MEDIUM — All users will be force-logged-out simultaneously
FIX:   Implement dual-key validation period or gradual session expiry
BLOCKING: YES
```

### API_CONTRACT_CHANGE

```
ERROR: Breaking change to /api/contractors response shape
CAUSE: Field 'availability' renamed to 'schedule' without frontend update
RISK:  MEDIUM — Frontend will render undefined for contractor availability
FIX:   Update Zod schema in apps/web/lib/api/ to match new field name
BLOCKING: YES
```

```
ERROR: New endpoint /api/analytics/trends missing documentation
CAUSE: Endpoint added without changelog entry or API docs update
RISK:  LOW — Functional but undocumented
FIX:   Add entry to docs/reference/ and update changelog
BLOCKING: NO
```

### DESTRUCTIVE_FILE_OP

```
ERROR: Target files contain uncommitted changes
CAUSE: git status shows 3 modified files in deletion target
RISK:  HIGH — Uncommitted work will be permanently lost
FIX:   Commit or stash changes before proceeding: git stash push -m "pre-deletion backup"
BLOCKING: YES
```

### DEPLOYMENT

```
ERROR: Test suite has 4 failures
CAUSE: uv run pytest returned exit code 1 with 4 FAILED tests
RISK:  HIGH — Deploying with known test failures risks production regression
FIX:   Resolve failing tests before deployment
BLOCKING: YES
```

```
ERROR: .env.production contains ANTHROPIC_API_KEY in build output
CAUSE: Secret leaked into deployable artifact
RISK:  HIGH — API key exposed in production build
FIX:   Remove from build output; use runtime environment injection instead
BLOCKING: YES
```

### SECURITY_CHANGE

```
ERROR: CORS policy set to allow all origins (*)
CAUSE: Access-Control-Allow-Origin: * permits any domain
RISK:  MEDIUM — Enables cross-origin requests from malicious sites
FIX:   Restrict to specific origins: ["http://localhost:3000", "https://yourdomain.com"]
BLOCKING: YES
```

### MULTI_LAYER_CHANGE

```
ERROR: Backend response model diverges from frontend Zod schema
CAUSE: UserResponse added 'role' field; Zod schema in apps/web/ does not include it
RISK:  MEDIUM — Frontend will silently drop the new field; no runtime error but data loss
FIX:   Add 'role' field to frontend Zod schema with appropriate type
BLOCKING: YES
```

### DEPENDENCY_CHANGE

```
ERROR: Package 'lodash' has known prototype pollution vulnerability
CAUSE: pnpm audit reports CVE-2021-23337 in lodash@4.17.20
RISK:  LOW — Vulnerability requires specific usage pattern not present in codebase
FIX:   Upgrade to lodash@4.17.21+ or replace with native alternatives
BLOCKING: NO
```

---

## BLOCKING Classification Decision Tree

```
Is the operation destructive or irreversible?
├── YES → BLOCKING: YES
└── NO
    ├── Does it affect auth, security, or payment?
    │   ├── YES → BLOCKING: YES
    │   └── NO
    │       ├── Does it break an existing contract (API, DB schema)?
    │       │   ├── YES → BLOCKING: YES
    │       │   └── NO
    │       │       ├── Is it documentation/advisory only?
    │       │       │   ├── YES → BLOCKING: NO
    │       │       │   └── NO → BLOCKING: YES (default to safe)
```

---

## Severity Escalation

When multiple errors are detected for a single operation:

1. Report all errors in sequence
2. Overall BLOCKING = YES if **any** individual error is BLOCKING: YES
3. Overall RISK = highest individual risk level
4. FIX section lists all required fixes in priority order
