# Prevention-First Architecture Roadmap
**Created**: 2025-12-01
**Strategy**: Build from ocean floor up (not patch the iceberg)
**Goal**: Establish conventions that prevent errors from existing

---

## The Iceberg: Where Errors Come From

### **Ocean Floor** (Foundation - Build This First)
These MUST exist before any code runs:

1. ✅ **tsconfig.json settings** - Currently broken (strict:false hiding problems)
2. ❌ **ESLint rules for YOUR patterns** - Non-existent (no linting)
3. ❌ **Pre-commit enforcement** - Non-existent (bad code gets committed)
4. ❌ **File structure conventions** - Loose (no clear patterns)
5. ❌ **API contract definitions** - Non-existent (any-typing)
6. ❌ **Type generation pipeline** - Non-existent (manual types = drift)

### **Deep** (Architectural Patterns - Build On Foundation)
These enable maintainability:

1. ❌ **No established conventions** - Inconsistent code styles
2. ❌ **No templates/blueprints** - Copy-paste-modify approach
3. ❌ **Schema-type drift** - Database changes break code
4. ❌ **Missing validation layer** - No validation before DB calls
5. ❌ **No transaction patterns** - Partial writes possible
6. ❌ **No error boundary strategy** - Errors propagate unhandled
7. ❌ **No state patterns** - UI handles loading/error/empty inconsistently

### **Mid-Depth** (Code Quality - Emerges Naturally)
These improve when foundation is solid:

1. ⚠️ **Circular dependencies** - From poor structure
2. ⚠️ **Tight coupling** - From missing service layer
3. ⚠️ **God components** - From mixing concerns
4. ⚠️ **Business logic in UI** - From no service layer
5. ⚠️ **No separation of concerns** - From unclear boundaries
6. ⚠️ **Missing service layer** - From no API contracts
7. ⚠️ **Direct DB calls from components** - From no validation layer

### **Just Below Surface** (Code Issues - Symptoms)
These are easy to find but hard to prevent:

1. ⚠️ **Inconsistent patterns** - Various async styles
2. ⚠️ **Mixed async styles** - Promise chains vs async/await
3. ⚠️ **Inconsistent error handling** - Some try/catch, some .catch()
4. ⚠️ **Naming drift** - camelCase, snake_case mixing
5. ⚠️ **Implicit any types** - `as any` scattered around
6. ⚠️ **Missing null checks** - Accessing properties without guards

### **Above Water** (What Breaks Builds)
These are just consequences:

1. ❌ **TypeScript errors** - 2,624 errors from broken foundation
2. ❌ **Missing types** - No generated types for database
3. ❌ **Prop mismatches** - From missing validation
4. ❌ **Dead code** - From refactors without cleanup
5. ❌ **Lint errors** - From no ESLint enforcement

---

## Prevention-First Fix Strategy

### **PHASE 0: Foundation (Ocean Floor)** - 4-6 Hours
*Must complete before any other work*

#### **0.1: Fix tsconfig.json** (30 minutes)
```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```
**Why**: Strict mode catches errors at compile time, not at 3am in production.

---

#### **0.2: Establish ESLint Rules** (1 hour)
```javascript
// .eslintrc.js
module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    // Type safety
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-implicit-any': 'error',
    '@typescript-eslint/explicit-function-return-types': 'error',

    // Patterns
    'no-console': ['warn', { allow: ['error', 'warn'] }],
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': 'error',

    // Async
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-misused-promises': 'error',

    // Naming
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'variable',
        format: ['camelCase', 'UPPER_CASE']
      },
      {
        selector: 'typeLike',
        format: ['PascalCase']
      }
    ]
  }
}
```
**Why**: Prevents inconsistent patterns before they start.

---

#### **0.3: Pre-Commit Enforcement** (1 hour)
```bash
#!/bin/sh
# .husky/pre-commit

echo "🔍 Linting..."
npx lint-staged

echo "🔧 Type checking..."
npm run types:check

echo "✅ Pre-commit checks passed"
```

```json
// package.json
{
  "lint-staged": {
    "**/*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```
**Why**: Bad code never reaches main branch.

---

#### **0.4: Type Generation Pipeline** (1.5 hours)
```bash
#!/bin/bash
# scripts/setup-types.sh

# 1. Generate Supabase types
npx supabase gen types typescript \
  --project-id $SUPABASE_PROJECT_ID > src/types/database.generated.ts

# 2. Validate types exist for all tables
TABLES=$(npx supabase db pull --dry-run | grep "table" | wc -l)
TYPES=$(grep -c "Tables\['[^']*'\]" src/types/database.generated.ts)

if [ "$TABLES" != "$TYPES" ]; then
  echo "❌ Type count mismatch! Database has $TABLES tables but types has $TYPES"
  exit 1
fi

echo "✅ Types validated: $TABLES tables"
```

**Add to package.json**:
```json
{
  "scripts": {
    "types:generate": "bash scripts/setup-types.sh",
    "types:check": "npm run types:generate && tsc --noEmit"
  }
}
```
**Why**: Types stay in sync with database automatically.

---

#### **0.5: File Structure Conventions** (1 hour)
```
src/
├── app/                 # Next.js routes
│   ├── api/            # API routes ONLY
│   │   └── [route]/
│   │       ├── route.ts         # Endpoint handler (max 50 lines)
│   │       └── service.ts       # Business logic extracted here
│   └── [feature]/      # UI routes
│       └── page.tsx
├── lib/                # Shared logic
│   ├── services/       # Business logic ONLY
│   │   ├── types.ts    # Type definitions for service
│   │   ├── database.ts # Database queries
│   │   └── index.ts    # Exports
│   ├── validators/     # Zod schemas
│   │   ├── contact.ts
│   │   └── index.ts
│   ├── types/          # Type definitions
│   │   ├── database.generated.ts  # Auto-generated from Supabase
│   │   └── custom.ts              # Custom types
│   ├── utils/          # Utilities
│   └── hooks/          # React hooks
├── components/         # React components ONLY
│   ├── ui/            # shadcn/ui
│   └── features/      # Feature-specific components
└── config/            # Configuration
    ├── index.ts       # Single export file
    └── constants.ts   # Constants only
```

**Rules**:
- ✅ API routes under `src/app/api/`
- ✅ Business logic under `src/lib/services/`
- ✅ React components under `src/components/`
- ❌ NO database calls in components
- ❌ NO business logic in routes
- ❌ NO mixing concerns

**Why**: Everyone knows where things live, reducing confusion.

---

### **PHASE 1: Automated Type Generation** (1-2 Hours)
*Fixes 86% of TypeScript errors immediately*

```bash
# Run once to generate complete types
npm run types:generate

# Validate types were created
echo "Generated types for:"
grep "interface Tables" src/types/database.generated.ts | head -20
```

**Expected result**:
- Before: 2,624 errors
- After: ~200-300 errors (down 92%)

**Metrics**:
```bash
# Before
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l
# Output: 3920 (includes tests)

# After Phase 1
npx tsc --noEmit --skipLibCheck 2>&1 | grep "error TS" | grep -v "\.test\." | wc -l
# Expected: <300 errors in production code
```

---

### **PHASE 2: Enable Strict Mode File-by-File** (2-4 Hours)
*Prevents future errors*

```typescript
// STEP 1: Fix src/types/ directory first
// tsconfig.json
{
  "compilerOptions": {
    "strict": false  // Still false globally
  },
  "include": ["src/types/**/*"],
  "extends": "./tsconfig.strict.json"  // Override for this dir
}

// tsconfig.strict.json
{
  "compilerOptions": {
    "strict": true
  }
}
```

**Progression**:
1. ✅ `src/types/` - Enable strict
2. ✅ `src/lib/validators/` - Enable strict
3. ✅ `src/lib/services/` - Enable strict
4. ⏳ `src/app/api/` - Enable strict (in progress)
5. ⏳ `src/lib/hooks/` - Enable strict
6. ⏳ `src/components/` - Enable strict

**Why this order**: Types → Validation → Services → Routes → Components

---

### **PHASE 3: API Contract Enforcement** (2 Hours)
*Prevents service layer chaos*

```typescript
// src/lib/services/types.ts - SINGLE SOURCE OF TRUTH FOR ALL TYPES

import { Database } from '@/types/database.generated';

// Generate contract interfaces from database types
export type ContactRow = Database['public']['Tables']['contacts']['Row'];
export type ContactInsert = Database['public']['Tables']['contacts']['Insert'];
export type ContactUpdate = Database['public']['Tables']['contacts']['Update'];

// Define service interface
export interface IContactService {
  getContact(id: string): Promise<ContactRow | null>;
  listContacts(workspaceId: string): Promise<ContactRow[]>;
  createContact(data: ContactInsert): Promise<ContactRow>;
  updateContact(id: string, data: ContactUpdate): Promise<ContactRow>;
  deleteContact(id: string): Promise<void>;
}

// Implement with types
export class ContactService implements IContactService {
  async getContact(id: string): Promise<ContactRow | null> {
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single();
    return data;
  }
  // ... rest of implementation
}
```

**Rule**: Every service MUST:
- Extend an Interface
- Return typed contracts (not `any`)
- Export both Interface and Implementation

---

### **PHASE 4: Validation Layer** (1.5 Hours)
*Prevents bad data from reaching database*

```typescript
// src/lib/validators/contact.ts

import { z } from 'zod';
import { Database } from '@/types/database.generated';

type ContactInsert = Database['public']['Tables']['contacts']['Insert'];

export const ContactInsertSchema = z.object({
  workspace_id: z.string().uuid('Invalid workspace ID'),
  email: z.string().email('Invalid email'),
  name: z.string().min(1, 'Name required'),
  phone: z.string().optional(),
  // ... all required fields from DB
}) satisfies z.ZodType<ContactInsert>;

export type ValidatedContact = z.infer<typeof ContactInsertSchema>;

// Usage in API route
export async function POST(req: Request) {
  const body = await req.json();
  const validated = ContactInsertSchema.parse(body);  // Throws if invalid

  const contact = await contactService.createContact(validated);
  return NextResponse.json(contact);
}
```

**Rule**: All external input MUST be validated before use.

---

### **PHASE 5: Error Boundaries & State Patterns** (2 Hours)
*Prevents cascading failures*

```typescript
// src/lib/utils/error-handler.ts

export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export async function tryAsync<T>(
  fn: () => Promise<T>
): Promise<Result<T>> {
  try {
    return { ok: true, value: await fn() };
  } catch (error) {
    return { ok: false, error: error as Error };
  }
}

// Usage in service
export async function getContact(id: string): Promise<Result<ContactRow>> {
  return tryAsync(async () => {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Contact not found');

    return data;
  });
}

// Usage in API route
export async function GET(req: Request) {
  const result = await contactService.getContact(id);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(result.value);
}
```

**Rule**: All operations return explicit Result types.

---

## Implementation Timeline

### **Week 1: Foundation (CRITICAL PATH)**
- **Day 1**: Phase 0.1-0.2 (tsconfig + ESLint) - 1.5 hours
- **Day 1**: Phase 0.3-0.5 (Pre-commit + Types + Structure) - 2.5 hours
- **Day 2**: Phase 1 (Type Generation) - 1-2 hours
- **Day 3-4**: Phase 2 (Strict Mode src/types/ → src/lib/) - 2-3 hours
- **Day 5**: Phase 3 (API Contracts) - 2 hours

**Total Week 1: ~10-12 hours**

### **Week 2: Architecture**
- **Day 1-2**: Phase 4 (Validation Layer) - 1.5 hours
- **Day 3-4**: Phase 5 (Error Boundaries) - 2 hours
- **Day 5**: Testing & Documentation - 2 hours

**Total Week 2: ~5.5 hours**

### **Total Effort: 15-17 hours over 2 weeks**

---

## Success Metrics

### **After Phase 0 (Foundation)**
- ✅ ESLint runs and catches issues
- ✅ Pre-commit hook blocks bad code
- ✅ File structure is clear and follows conventions
- ✅ Types are generated from schema

### **After Phase 1 (Type Generation)**
- ✅ TypeScript errors drop from 2,624 → <300
- ✅ No "type 'never'" errors from missing tables
- ✅ Database schema changes auto-update types

### **After Phase 2 (Strict Mode)**
- ✅ `src/types/` has 0 errors with strict:true
- ✅ `src/lib/` has 0 errors with strict:true
- ✅ Type safety prevents runtime crashes

### **After Phase 3 (API Contracts)**
- ✅ All services implement typed interfaces
- ✅ Return types are explicit (no any)
- ✅ API contracts are discoverable

### **After Phase 4 (Validation)**
- ✅ All external input is validated with Zod
- ✅ Invalid data is rejected at boundary
- ✅ Database receives only valid data

### **After Phase 5 (Error Boundaries)**
- ✅ All operations return Result<T, E>
- ✅ Errors are handled explicitly
- ✅ No unhandled promise rejections

### **30-Day Goal**
- ✅ 0 TypeScript errors in production code
- ✅ Strict mode enabled globally
- ✅ New code follows patterns automatically
- ✅ Type safety prevents 90% of bugs before they happen

---

## Prevention In Action: Examples

### **BEFORE: Reactive (Current State)**
```typescript
// Components call database directly
export function ContactList() {
  const [contacts, setContacts] = useState<any>([]);  // any!

  useEffect(() => {
    supabase
      .from('contacts')
      .select('*')
      .then(res => {
        if (res.data) {
          setContacts(res.data);  // No validation
        }
      })
      .catch(err => console.log(err));  // Silent failure
  }, []);

  return (
    <ul>
      {contacts.map((c: any) => (  // any!
        <li key={c.id}>{c.name}</li>  // No null check
      ))}
    </ul>
  );
}

// Result: Runtime crashes when database schema changes
```

### **AFTER: Preventative (Foundation-Driven)**
```typescript
// 1. Service layer with typed contract
// src/lib/services/contact.ts
export class ContactService implements IContactService {
  async listContacts(workspaceId: string): Promise<ContactRow[]> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (error) throw error;
    return data ?? [];
  }
}

// 2. Hook wraps service with React patterns
// src/lib/hooks/useContacts.ts
export function useContacts(workspaceId: string) {
  const [state, setState] = useState<{
    data: ContactRow[] | null;
    loading: boolean;
    error: Error | null;
  }>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await contactService.listContacts(workspaceId);
        setState({ data, loading: false, error: null });
      } catch (error) {
        setState({ data: null, loading: false, error: error as Error });
      }
    };

    load();
  }, [workspaceId]);

  return state;
}

// 3. Component uses hook (no database knowledge)
export function ContactList({ workspaceId }: { workspaceId: string }) {
  const { data: contacts, loading, error } = useContacts(workspaceId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!contacts || contacts.length === 0) return <div>No contacts</div>;

  return (
    <ul>
      {contacts.map((contact) => (
        <li key={contact.id}>{contact.name}</li>
      ))}
    </ul>
  );
}

// Result: Type safe, error handled, separation of concerns, testable
```

**What changed**:
- ✅ No `any` types - Types from schema
- ✅ No direct DB calls - Service layer handles it
- ✅ Proper error handling - Caught and displayed
- ✅ State management - Explicit loading/error states
- ✅ Reusable - Hook can be used anywhere
- ✅ Testable - Service interface is mockable

---

## Commitment Required

This roadmap works **IF AND ONLY IF**:

1. ✅ **Strict adherence to structure** - No exceptions to conventions
2. ✅ **Pre-commit enforcement** - No bypassing linting
3. ✅ **Type generation runs before dev** - `npm run types:generate` before starting
4. ✅ **Code reviews check patterns** - Not just functionality
5. ✅ **Documentation updated** - When patterns change

---

## Why This Prevents The Iceberg

| Iceberg Level | Prevention Mechanism |
|--------------|----------------------|
| **Ocean Floor** | ESLint rules, tsconfig, pre-commit hooks |
| **Deep** | File structure conventions, API contracts |
| **Mid-Depth** | Service layer, validation layer |
| **Just Below** | Patterns enforced by types, linting |
| **Above Water** | TypeScript errors become impossible |

**The key insight**: Fix the foundation, and the iceberg stops growing.

---

## Next Immediate Action

**Run Phase 0 TODAY** (1-2 hour investment):

```bash
# 1. Fix tsconfig.json (set strict: true for types/)
# 2. Install ESLint and configure rules
# 3. Set up husky pre-commit hook
# 4. Create file structure documentation
# 5. Set up type generation script

npm run types:generate
npm run types:check  # Should pass with 0 errors in types/
```

**Then Tuesday**: Begin Phase 1-2 (Type generation + Strict mode)

**Then Thursday**: Phase 3-5 (Contracts + Validation + Error handling)

**By end of Week 2**: Foundation solid. New code follows patterns automatically.

---

**This is not a quick fix. This is architecture stability.** The initial 15-17 hour investment saves hundreds of hours in debugging, crashes, and refactors down the road.

The choice is: Invest 15 hours now, or lose 150 hours to bugs later.
