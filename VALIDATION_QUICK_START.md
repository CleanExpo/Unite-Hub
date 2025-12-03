# Validation System - 5-Minute Quick Start

Get started with Unite-Hub's validation system in 5 minutes.

## Step 1: Import (30 seconds)

```typescript
import { validateBody, validateQuery } from '@/lib/validation/middleware';
import { CreateContactSchema } from '@/lib/validation/schemas';
```

## Step 2: Validate (1 minute)

### POST/PUT/PATCH (Body Validation)

```typescript
export async function POST(req: NextRequest) {
  const validation = await validateBody(req, CreateContactSchema);

  if (!validation.success) {
    return validation.response; // Returns 400 with error details
  }

  const { name, email, workspaceId } = validation.data; // Type-safe!
  // ... your business logic
}
```

### GET (Query Validation)

```typescript
export async function GET(req: NextRequest) {
  const validation = validateQuery(req, ContactFilterSchema);

  if (!validation.success) {
    return validation.response;
  }

  const { page, limit, status, workspaceId } = validation.data;
  // ... your business logic
}
```

## Step 3: Run (30 seconds)

That's it! Your API is now protected with:
- ✅ Type-safe validation
- ✅ Workspace isolation
- ✅ Consistent error handling
- ✅ SQL injection prevention

## Common Schemas

| What You Need | Import This |
|---------------|-------------|
| Create contact | `CreateContactSchema` |
| Update contact | `UpdateContactSchema` |
| List contacts | `ContactFilterSchema` |
| Create campaign | `CreateCampaignSchema` |
| Send email | `SendEmailSchema` |
| Login | `LoginSchema` |
| Register | `RegisterSchema` |
| Pagination | `PaginationSchema` |

## Error Response

When validation fails, your API automatically returns:

```json
{
  "error": "Request body validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "email",
      "message": "Must be a valid email address"
    }
  ],
  "timestamp": "2024-12-03T10:30:00.000Z"
}
```

Status: `400 Bad Request`

## Query Parameter Tip

Query params are strings. Use `z.coerce.*` for automatic conversion:

```typescript
import { z } from 'zod';

const MyQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().max(100).default(20),
});

// "?page=2&limit=50" → { page: 2, limit: 50 }
```

## Custom Schema

Need a custom schema? Easy:

```typescript
import { z } from 'zod';

const MySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  age: z.number().int().min(18).max(120),
});

type MyType = z.infer<typeof MySchema>; // Get TypeScript type
```

## Workspace Isolation

Always include `workspace_id` to prevent data leaks:

```typescript
const MySchema = z.object({
  workspace_id: z.string().uuid(), // Required!
  // ... other fields
});
```

Or use the helper:

```typescript
import { addWorkspaceId } from '@/lib/validation/middleware';

const WorkspaceScopedSchema = addWorkspaceId(BaseSchema);
```

## Need More Help?

- **Quick Lookup:** `docs/API_VALIDATION_QUICK_REFERENCE.md`
- **Complete Guide:** `docs/API_VALIDATION.md`
- **Working Examples:** `examples/api-validation-example.ts`
- **File Index:** `docs/VALIDATION_SYSTEM_INDEX.md`

## Most Common Pattern

```typescript
import { NextRequest } from 'next/server';
import { validateBody, validateQuery } from '@/lib/validation/middleware';
import { CreateContactSchema, ContactFilterSchema } from '@/lib/validation/schemas';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const validation = validateQuery(req, ContactFilterSchema);
  if (!validation.success) return validation.response;

  const { workspaceId, page, limit } = validation.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('workspace_id', workspaceId) // ✅ Workspace isolation
    .range((page - 1) * limit, page * limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const validation = await validateBody(req, CreateContactSchema);
  if (!validation.success) return validation.response;

  const { workspaceId, name, email } = validation.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('contacts')
    .insert({ workspace_id: workspaceId, name, email })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
```

That's it! You're now using production-grade validation.

---

**Time to implement:** ~5 minutes per route
**Security benefit:** Massive
**Performance cost:** ~1-5ms per request (negligible)

**Ready to start?** See `docs/API_VALIDATION.md` for the complete guide.
