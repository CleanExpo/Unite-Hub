# API Validation Quick Reference

**Quick lookup for common validation patterns**

## Import Statements

```typescript
// Middleware functions
import {
  validateBody,
  validateQuery,
  validateParams,
  validateWorkspaceId,
  combineSchemas,
  makeOptional,
  addWorkspaceId,
} from '@/lib/validation/middleware';

// Common schemas
import {
  // Utilities
  UUIDSchema,
  EmailSchema,
  PhoneSchema,
  URLSchema,
  PaginationSchema,
  DateRangeSchema,
  WorkspaceScopedSchema,
  IdParamSchema,

  // Contacts
  CreateContactSchema,
  UpdateContactSchema,
  BulkCreateContactsSchema,
  ContactFilterSchema,

  // Campaigns
  CreateCampaignSchema,
  UpdateCampaignSchema,
  CreateDripCampaignSchema,
  EmailTemplateSchema,

  // Email
  SendEmailSchema,
  GmailSendEmailSchema,
  EmailWebhookSchema,

  // Auth
  LoginSchema,
  RegisterSchema,
  ResetPasswordSchema,
  ChangePasswordSchema,
  ApiKeySchema,

  // AI Agents
  GenerateContentSchema,
  EnhancedGenerateContentSchema,
  ContactIntelligenceRequestSchema,
  AgentActionSchema,

  // Analytics
  AnalyticsQuerySchema,
  GenerateReportSchema,

  // Webhooks
  CreateWebhookSchema,
  TestWebhookSchema,

  // Bulk
  BulkOperationSchema,
} from '@/lib/validation/schemas';
```

---

## Common Patterns

### POST with Body Validation

```typescript
export async function POST(req: NextRequest) {
  const validation = await validateBody(req, CreateContactSchema);
  if (!validation.success) return validation.response;

  const data = validation.data;
  // ... proceed
}
```

### GET with Query Validation

```typescript
export async function GET(req: NextRequest) {
  const validation = validateQuery(req, ContactFilterSchema);
  if (!validation.success) return validation.response;

  const { page, limit, workspaceId } = validation.data;
  // ... proceed
}
```

### Dynamic Route with Params

```typescript
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const validation = await validateParams(params, IdParamSchema);
  if (!validation.success) return validation.response;

  const { id } = validation.data;
  // ... proceed
}
```

### Workspace-Scoped Operation

```typescript
export async function POST(req: NextRequest) {
  const validation = await validateWorkspaceId(req);
  if (!validation.success) return validation.response;

  const workspaceId = validation.data;
  // ... proceed
}
```

---

## Schema Cheat Sheet

| Use Case | Schema | Required Fields |
|----------|--------|-----------------|
| Create contact | `CreateContactSchema` | `workspaceId`, `name`, `email` |
| Update contact | `UpdateContactSchema` | All optional (partial) |
| List contacts | `ContactFilterSchema` | `workspaceId` |
| Create campaign | `CreateCampaignSchema` | `workspaceId`, `name`, `subject`, `content` |
| Send email | `SendEmailSchema` | `workspaceId`, `contactId`, `to`, `subject`, `body` |
| Login | `LoginSchema` | `email`, `password` |
| Register | `RegisterSchema` | `email`, `password`, `name` |
| Generate content | `GenerateContentSchema` | `workspaceId`, `type`, `tone` |
| Analytics query | `AnalyticsQuerySchema` | `workspaceId`, `metric`, `dateRange`, `groupBy` |
| Create webhook | `CreateWebhookSchema` | `workspaceId`, `url`, `events` |
| Bulk operation | `BulkOperationSchema` | `workspaceId`, `ids`, `action` |

---

## Error Response Format

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

**Status:** `400 Bad Request`

---

## Query Parameter Coercion

```typescript
const QuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  active: z.coerce.boolean().default(true),
  score: z.coerce.number().min(0).max(100).optional(),
});
```

**URL:** `?page=2&limit=50&active=true&score=75`

**Parsed:** `{ page: 2, limit: 50, active: true, score: 75 }`

---

## Custom Schema Examples

### Simple Schema

```typescript
import { z } from 'zod';

const MySchema = z.object({
  name: z.string().min(1, 'Name required').max(100),
  email: z.string().email('Invalid email'),
  age: z.number().int().min(18).max(120),
});

type MyType = z.infer<typeof MySchema>;
```

### Schema with Optional Fields

```typescript
const MySchema = z.object({
  required: z.string(),
  optional: z.string().optional(),
  withDefault: z.number().default(42),
  nullable: z.string().nullable(),
});
```

### Enum Schema

```typescript
const StatusSchema = z.enum(['active', 'inactive', 'pending']);
const RoleSchema = z.enum(['admin', 'user', 'guest']).default('user');
```

### Array Schema

```typescript
const TagsSchema = z.array(z.string()).min(1).max(10);
const IdsSchema = z.array(z.string().uuid()).nonempty();
```

### Nested Schema

```typescript
const AddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  zip: z.string().regex(/^\d{5}$/),
});

const UserSchema = z.object({
  name: z.string(),
  address: AddressSchema,
});
```

---

## Utility Functions

### Combine Schemas

```typescript
const FullSchema = combineSchemas(
  WorkspaceScopedSchema,
  PaginationSchema,
  z.object({ search: z.string().optional() })
);
```

### Make All Fields Optional

```typescript
const UpdateSchema = makeOptional(CreateSchema);
// All fields are now optional
```

### Add Workspace ID

```typescript
const WorkspaceScopedSchema = addWorkspaceId(BaseSchema);
// Adds workspace_id: string (UUID) as required field
```

---

## Testing Validation

```typescript
import { describe, it, expect } from 'vitest';
import { CreateContactSchema } from '@/lib/validation/schemas';

describe('CreateContactSchema', () => {
  it('validates correct data', () => {
    const result = CreateContactSchema.safeParse({
      workspaceId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'John Doe',
      email: 'john@example.com',
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = CreateContactSchema.safeParse({
      workspaceId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'John Doe',
      email: 'invalid-email',
    });

    expect(result.success).toBe(false);
  });
});
```

---

## Common Validation Rules

| Rule | Zod Code | Example |
|------|----------|---------|
| Required string | `z.string().min(1)` | `"hello"` ✅, `""` ❌ |
| Email | `z.string().email()` | `"user@example.com"` ✅ |
| UUID | `z.string().uuid()` | `"550e8400-e29b-41d4-a716-446655440000"` ✅ |
| URL | `z.string().url()` | `"https://example.com"` ✅ |
| Phone | Custom regex | `"+1-555-123-4567"` ✅ |
| Min/max length | `z.string().min(2).max(100)` | `"ab"` ✅, `"a"` ❌ |
| Positive integer | `z.number().int().positive()` | `1` ✅, `0` ❌ |
| Integer range | `z.number().int().min(0).max(100)` | `50` ✅, `101` ❌ |
| Enum | `z.enum(['a', 'b', 'c'])` | `"a"` ✅, `"d"` ❌ |
| Array | `z.array(z.string())` | `["a", "b"]` ✅ |
| Array size | `z.array(z.string()).min(1).max(10)` | `["a"]` ✅, `[]` ❌ |
| Object | `z.object({ key: z.string() })` | `{ key: "value" }` ✅ |
| Optional | `z.string().optional()` | `"hello"` or `undefined` ✅ |
| Nullable | `z.string().nullable()` | `"hello"` or `null` ✅ |
| Default | `z.number().default(42)` | If missing → `42` |
| Datetime | `z.string().datetime()` | `"2024-12-03T10:30:00Z"` ✅ |
| Custom regex | `z.string().regex(/pattern/)` | Matches pattern ✅ |

---

## Password Validation Pattern

```typescript
const PasswordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');
```

---

## Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid JSON in request body" | Malformed JSON | Check client request JSON syntax |
| "Must be a valid UUID" | Invalid UUID format | Use proper UUID (36 chars with hyphens) |
| "Missing workspace_id" | No workspace_id in request | Add `?workspace_id=...` or in body |
| "Expected number, received string" | Wrong type in query | Use `z.coerce.number()` for query params |
| Type error in TypeScript | Schema type mismatch | Use `z.infer<typeof Schema>` for types |

---

**See full documentation:** [API_VALIDATION.md](./API_VALIDATION.md)
