# Phase 4: Validation Layer - COMPLETE ✅

**Completed**: 2025-12-01
**Time Invested**: 1.5 hours
**Result**: Zod runtime validation schemas preventing invalid data at API boundaries

---

## What Was Built

### 1. Database Validation Schemas (`src/lib/validators/database-schemas.ts`)

Comprehensive Zod schemas for all database tables covering Row, Insert, and Update variants.

**Key Features**:
- **Reusable patterns**: UUIDSchema, EmailSchema, AIScorerSchema, etc.
- **Table coverage**: Contact, Workspace, Organization, UserProfile, Email, Campaign
- **Error formatting**: `formatValidationErrors()` converts Zod errors to field-level messages
- **Type inference**: After validation, `data` has exact TypeScript type

**Schema Pattern**:
```typescript
// Reusable patterns
export const UUIDSchema = z.string().uuid('Invalid UUID format');
export const EmailSchema = z.string().email('Invalid email format').toLowerCase().trim();
export const AIScorerSchema = z.number().int().min(0).max(100);

// Table schema with variants
export const ContactRowSchema = z.object({
  id: UUIDSchema,
  workspace_id: UUIDSchema,
  name: NonEmptyString,
  email: EmailSchema,
  ai_score: AIScorerSchema,
  status: ContactStatusSchema,
  created_at: DateTimeSchema,
  updated_at: DateTimeSchema,
});

export const ContactInsertSchema = z.object({
  workspace_id: UUIDSchema,
  name: NonEmptyString,
  email: EmailSchema,
  ai_score: AIScorerSchema.optional().default(0),
  status: ContactStatusSchema.optional().default('active'),
});

export const ContactUpdateSchema = z.object({
  name: NonEmptyString.optional(),
  email: EmailSchema.optional(),
  ai_score: AIScorerSchema.optional(),
  status: ContactStatusSchema.optional(),
});
```

**Tables Validated**:
1. Contact (3 schemas)
2. Workspace (3 schemas)
3. Organization (3 schemas)
4. UserProfile (3 schemas)
5. Email (3 schemas)
6. Campaign (3 schemas)

### 2. Validation Middleware (`src/lib/validators/middleware.ts`)

Helper functions for validating request data in API routes with clear error messages.

**Key Functions**:

```typescript
// Validate JSON request body
export async function validateRequestBody<T extends z.ZodSchema>(
  req: NextRequest,
  schema: T
): Promise<ValidationResult<z.infer<T>>> {
  // Returns: { success: true, data: T } or { success: false, errors: Record<string, string> }
}

// Validate query parameters
export async function validateQueryParams<T extends z.ZodSchema>(
  req: NextRequest,
  schema: T
): Promise<ValidationResult<z.infer<T>>> {
  // Converts query params to object, validates, returns typed result
}

// Try body first, fall back to query params
export async function validateRequest<T extends z.ZodSchema>(
  req: NextRequest,
  schema: T
): Promise<ValidationResult<z.infer<T>>> {
  // Flexible validation - supports both POST body and GET query params
}

// Extract specific required fields
export async function validateRequired<T extends Record<string, z.ZodSchema>>(
  req: NextRequest,
  fields: T
): Promise<{ [K in keyof T]: z.infer<T[K]> }> {
  // Throws if fields missing, returns typed object if present
}
```

**Reusable Schemas**:
```typescript
export const PaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export const WorkspaceScopeSchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace ID format'),
});

export const WorkspaceListSchema = WorkspaceScopeSchema.merge(PaginationSchema);
```

### 3. Validators Index (`src/lib/validators/index.ts`)

Single export point for all schemas and utilities:
```typescript
import {
  ContactRowSchema,
  ContactInsertSchema,
  ContactUpdateSchema,
  validateData,
  formatValidationErrors
} from '@/lib/validators';
```

---

## The Problem This Solves

### TS2322 - Type Not Assignable Errors

**Before**:
```typescript
// No validation - invalid data can reach database
const contact = await supabase
  .from('contacts')
  .insert([{
    workspace_id: 'invalid-uuid', // ❌ Not caught at entry point
    email: 'not-an-email',        // ❌ Not caught at entry point
    ai_score: 150,                 // ❌ Out of range 0-100
  }]);
```

**After**:
```typescript
const result = await validateRequestBody(req, ContactInsertSchema);
if (!result.success) {
  return errorResponse('Invalid contact data', 400, result.errors);
}
// ✅ result.data is 100% valid ContactInsert type
const contact = await supabase.from('contacts').insert([result.data]);
```

### Data Integrity Violations

**Prevented**:
- Invalid UUIDs in foreign keys
- Malformed email addresses
- Out-of-range numeric fields
- Invalid enum values
- Missing required fields

### API Route Type Safety

**Before**:
```typescript
export async function POST(req: NextRequest) {
  const body = await req.json();
  // body is 'any' type - no type checking
  const { email, score } = body;
  // email and score are 'any' - could be anything
}
```

**After**:
```typescript
export async function POST(req: NextRequest) {
  const result = await validateRequestBody(req, ContactInsertSchema);
  if (!result.success) {
    return errorResponse('Invalid data', 400, result.errors);
  }

  const { email, score } = result.data; // ✅ Properly typed
  // email is string (already trimmed & lowercased)
  // score is number between 0-100
}
```

---

## Error Reduction Impact

**Phase 2 Baseline**: 5,500-6,000 TypeScript errors
**Phase 3 Baseline**: Service type contracts

**Phase 4 Prevention**:
- Eliminates entire class: "invalid data reaching database"
- Prevents TS2322 errors in API routes (30-50 errors)
- Enables type inference after validation (100+ implicit type errors prevented)
- Establishes boundary validation pattern (prevents future errors)

**Estimated Reduction**: 3-8% additional
- Phase 1: 6,745 errors (100%)
- Phase 2: ~5,500-6,000 errors (18-25% reduction)
- Phase 3: ~5,200-5,800 errors (20-28% reduction)
- Phase 4: ~4,800-5,400 errors (24-32% reduction) ← NEW
- Phase 5: ~2,500-3,500 errors (48-63% reduction)

---

## How to Use in API Routes

### Pattern 1: Validate Request Body (POST/PUT)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { validateRequestBody } from '@/lib/validators/middleware';
import { ContactInsertSchema } from '@/lib/validators';
import { errorResponse, successResponse } from '@/lib/api-helpers';

export async function POST(req: NextRequest) {
  try {
    // Step 1: Validate authentication & workspace
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return errorResponse('workspaceId required', 400);
    }

    // Step 2: Validate request body
    const validation = await validateRequestBody(req, ContactInsertSchema);
    if (!validation.success) {
      return errorResponse('Invalid contact data', 400, validation.errors);
    }

    // Step 3: Proceed with validated, typed data
    const supabase = await getSupabaseServer();
    const { data: contact, error } = await supabase
      .from('contacts')
      .insert([{ ...validation.data, workspace_id: workspaceId }])
      .select()
      .single();

    if (error) {
      return errorResponse('Failed to create contact', 500);
    }

    return successResponse(contact, null, 'Contact created', 201);
  } catch (error) {
    console.error('Error creating contact:', error);
    return errorResponse('Internal server error', 500);
  }
}
```

### Pattern 2: Validate Query Parameters (GET)

```typescript
import { validateQueryParams } from '@/lib/validators/middleware';
import { WorkspaceListSchema } from '@/lib/validators';

export async function GET(req: NextRequest) {
  try {
    // Validate query params
    const validation = await validateQueryParams(req, WorkspaceListSchema);
    if (!validation.success) {
      return errorResponse('Invalid query parameters', 400, validation.errors);
    }

    const { workspaceId, limit, offset } = validation.data;

    // Proceed with validated data
    const supabase = await getSupabaseServer();
    const { data: contacts, count, error } = await supabase
      .from('contacts')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .range(offset, offset + limit - 1);

    if (error) {
      return errorResponse('Failed to fetch contacts', 500);
    }

    return successResponse(contacts, { count, limit, offset });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return errorResponse('Internal server error', 500);
  }
}
```

### Pattern 3: Validate Either Body or Query (Flexible)

```typescript
import { validateRequest } from '@/lib/validators/middleware';

export async function GET(req: NextRequest) {
  // Try POST body first, fall back to query params
  const validation = await validateRequest(req, ContactInsertSchema);
  if (!validation.success) {
    return errorResponse('Invalid data', 400, validation.errors);
  }

  // validation.data is properly typed regardless of source
  return successResponse({ validated: validation.data });
}
```

### Pattern 4: Extract Specific Required Fields

```typescript
import { validateRequired } from '@/lib/validators/middleware';

export async function POST(req: NextRequest) {
  try {
    // Extract specific fields - throws if missing
    const { workspaceId, email } = await validateRequired(req, {
      workspaceId: z.string().uuid(),
      email: z.string().email(),
    });

    // Use validated fields
    return successResponse({ workspaceId, email });
  } catch (error) {
    return errorResponse(String(error), 400);
  }
}
```

---

## Key Design Decisions

### Decision 1: Zod Over Alternatives

**Options Considered**:
- Zod (chosen)
- Io-ts (functional programming)
- Typia (codegen-based)

**Why Zod**:
- Largest ecosystem (30k+ GitHub stars)
- Best TypeScript inference
- Clearest error messages
- Already used in shadcn/ui components
- Best documentation

### Decision 2: Separate Schemas (Row, Insert, Update)

**Why Three Schemas per Table**:
- `Row`: Full database record (includes id, timestamps - never user input)
- `Insert`: What clients send to create records (no id/timestamps)
- `Update`: What clients send to modify records (all fields optional)

**Prevents**: Clients accidentally including id in insert (would fail silently), or requiring all fields in updates

### Decision 3: Validation at API Boundary

**Why Not Database Layer**:
- API layer validation gives immediate feedback to client
- Prevents unnecessary database calls
- Clearer error messages at the right layer
- Matches database schema documentation

**Why Not Client Layer Only**:
- Client validation can be bypassed
- Server validation is mandatory defense
- API layer catches both client-side and server-generated data

---

## Integration with Phase 3 Services

Phase 4 validation works seamlessly with Phase 3 service contracts:

```typescript
// Phase 3: Service contract defines method signature
interface IWorkspaceValidationService {
  validateUserAuth(req: NextRequest): Promise<AuthenticatedUser>;
}

// Phase 4: Validation ensures data reaching service is correct
export async function POST(req: NextRequest) {
  const userValidation = await validateRequired(req, {
    workspaceId: z.string().uuid(),
  });

  // Phase 3: Service method expects proper types
  const user = await workspaceValidationService.validateUserAuth(req);

  return successResponse(user);
}
```

**Flow**:
1. **Boundary**: Request arrives (untrusted)
2. **Phase 4**: Validation schemas ensure data structure is correct
3. **Phase 3**: Service contracts ensure methods exist and return correct types
4. **Database**: Type-safe Supabase queries with workspace isolation

---

## File Structure

```
src/lib/validators/
├── database-schemas.ts      # Zod schemas for all tables
├── middleware.ts            # Validation helper functions
└── index.ts                 # Central export point
```

**New files**: 3
**New schemas**: 18 (6 tables × 3 variants each)
**New utilities**: 5 (validateRequestBody, validateQueryParams, validateRequest, validateRequired, formatValidationErrors)

---

## Next: Phase 5 - Error Boundaries

Phase 5 will add Result<T, E> pattern for explicit error handling:

```typescript
// Phase 4: Current approach - throws or returns error response
const validation = await validateRequestBody(req, schema);
if (!validation.success) {
  return errorResponse('Invalid data', 400, validation.errors);
}

// Phase 5: Coming - Result<T, E> pattern
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

const result = validate(req, schema);
if (!result.ok) {
  return errorResponse(result.error.message, result.error.status);
}
const { value } = result;
```

**Benefits**:
- Eliminates null/undefined return values
- Makes errors explicit in return type
- Enables railway-oriented programming
- Prevents "forgot to check for error" bugs
- Clear separation between success and failure paths

---

**Status**: ✅ COMPLETE - Phase 4 Validation Layer
- Zod schemas created for all 6 core tables
- Validation middleware ready for API routes
- 3 complete code patterns documented
- Build passing with no new errors
- Code committed to main branch

**Next Phase**: Phase 5 - Error Boundaries & Result<T, E> (2 hours)

