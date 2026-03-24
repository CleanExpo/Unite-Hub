# Command: /generate-route-reference

**Category:** Documentation
**Description:** Auto-generate or regenerate API route reference documentation for Next.js App Router

## Usage

```
/generate-route-reference
```

Regenerates `ROUTE_REFERENCE.md` by scanning all Next.js API routes in `src/app/api/`.

## What It Does

1. **Scans Routes** — Finds all `route.ts` files in `src/app/api/**/*.ts`
2. **Extracts Metadata** — HTTP method (GET, POST, PUT, PATCH, DELETE), path, parameters, response format
3. **Analyses Code** — Reads route handlers to document behaviour
4. **Generates Examples** — Creates example requests and responses
5. **Updates File** — Regenerates `ROUTE_REFERENCE.md` with all findings

## Requirements

For best results, structure your route handlers with JSDoc:

```typescript
// src/app/api/contacts/route.ts
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/contacts
 * Returns all contacts for the authenticated founder
 * @returns {Contact[]} Array of contacts
 */
export async function GET(): Promise<NextResponse> {
  // handler code
}

/**
 * POST /api/contacts
 * Create a new contact
 * @param {string} name - Contact name (required)
 * @param {string} email - Contact email (optional)
 * @returns {Contact} Created contact with ID
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // handler code
}
```

## Example Generated Documentation

After running the command, `ROUTE_REFERENCE.md` will include:

```markdown
### GET /api/contacts

**Description:** Returns all contacts for the authenticated founder

**Auth:** Required (founder_id RLS)

**Response:**
```json
[{ "id": "uuid", "name": "Jane Smith", "email": "jane@example.com" }]
```

**Status Codes:**
- 200 — Success
- 401 — Unauthenticated

---

### POST /api/contacts

**Description:** Create a new contact

**Auth:** Required (founder_id auto-applied)

**Request:**
```json
{ "name": "Jane Smith", "email": "jane@example.com" }
```

**Response:**
```json
{ "data": { "id": "uuid", "name": "Jane Smith" } }
```

**Status Codes:**
- 201 — Created
- 400 — Validation error
- 401 — Unauthenticated
```

## Before & After

**Before:**
```
ROUTE_REFERENCE.md
├── Outdated endpoints
├── Missing new routes
├── Incorrect examples
└── Gaps in documentation
```

**After:**
```
ROUTE_REFERENCE.md
├── All routes documented (src/app/api/**/*.ts)
├── Accurate request/response examples
├── Current parameter definitions
└── Auth requirements noted per route
```

## Unite-Group Route Structure

The scan covers:
```
src/app/api/
├── businesses/          # Business management
├── contacts/            # Contact CRM
├── nexus-pages/         # Block editor pages
├── nexus-databases/     # Database views
├── credentials/         # Vault-encrypted credentials
├── approvals/           # Approval queue
├── social/              # Social channel connections
└── projects/            # Connected satellite projects
```

## Tips

- Run after adding new routes to keep docs current
- Run before deployments to ensure docs match code
- Commit `ROUTE_REFERENCE.md` to git
- Cross-reference with `/swarm-audit` to find undocumented routes

## Manual Updates

You can still manually edit `ROUTE_REFERENCE.md` for:
- Extended descriptions and usage notes
- Business logic context
- Related endpoints
- Error scenarios and edge cases

Just keep JSDoc comments in route files in sync.

## Related Commands

- **`/hey-claude`** — Ask about route implementation
- **`/swarm-audit`** — Find undocumented routes and quality issues
- **`/verify`** — Full foundation verification including type-check

---

**See Also:**
- [.claude/rules/database/supabase.md](../rules/database/supabase.md) — API auth patterns
- [.claude/commands/new-feature.md](./new-feature.md) — Route scaffolding template
