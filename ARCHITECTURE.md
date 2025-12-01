# Unite-Hub Architecture Documentation

**Version**: 2.0.0
**Last Updated**: 2025-12-01
**Status**: Production-Ready

---

## Table of Contents

1. [Directory Structure](#directory-structure)
2. [Architectural Rules](#architectural-rules)
3. [Type Safety Rules](#type-safety-rules)
4. [Code Quality Rules](#code-quality-rules)
5. [Type Generation Pipeline](#type-generation-pipeline)
6. [Pattern Examples](#pattern-examples)

---

## Directory Structure

```
Unite-Hub/
│
├── .claude/                          # Claude AI agent configuration
│   ├── agent.md                      # Agent definitions (CANONICAL)
│   ├── claude.md                     # System overview
│   ├── CLAUDE.md                     # Project instructions
│   ├── config.json                   # Agent config
│   ├── mcp.json                      # MCP server config
│   ├── settings.local.json           # Local settings
│   ├── RLS_WORKFLOW.md              # RLS migration process
│   ├── SCHEMA_REFERENCE.md          # Database schema reference
│   ├── skills/                       # Agent skills
│   │   ├── orchestrator/
│   │   ├── email-agent/
│   │   ├── content-agent/
│   │   ├── frontend/
│   │   ├── backend/
│   │   └── docs/
│   └── workflows/                    # Reusable workflows
│
├── .husky/                           # Git hooks
│   ├── pre-commit                    # Lint before commit
│   └── post-merge                    # Type generation after pull
│
├── scripts/                          # Automation scripts
│   ├── generate-types.sh             # Type generation from Supabase
│   ├── run-orchestrator.mjs          # Orchestrator CLI
│   ├── run-email-agent.mjs           # Email agent CLI
│   ├── run-content-agent.mjs         # Content agent CLI
│   ├── analyze-contacts.mjs          # Contact scoring
│   ├── generate-content.mjs          # Content generation
│   ├── test-*.mjs                    # Test utilities
│   ├── synthex-*.mjs                 # Synthex generators
│   ├── seo-intelligence.mjs          # SEO research CLI
│   └── rls-diagnostics.sql           # RLS pre-flight check
│
├── src/                              # Next.js application
│   │
│   ├── app/                          # App Router (Next.js 16)
│   │   ├── (auth)/                   # Auth group routes
│   │   │   ├── login/
│   │   │   └── signup/
│   │   │
│   │   ├── dashboard/                # Dashboard routes (protected)
│   │   │   ├── overview/             # Main dashboard
│   │   │   ├── contacts/             # Contact management
│   │   │   ├── campaigns/            # Campaign management
│   │   │   ├── analytics/            # Analytics & insights
│   │   │   ├── settings/             # Settings pages
│   │   │   └── [21+ other pages]/
│   │   │
│   │   ├── api/                      # API routes (104 endpoints)
│   │   │   ├── agents/               # AI agent endpoints
│   │   │   │   ├── contact-intelligence/
│   │   │   │   ├── content-generation/
│   │   │   │   ├── email-processor/
│   │   │   │   └── orchestrator/
│   │   │   ├── auth/                 # Authentication endpoints
│   │   │   │   ├── callback/
│   │   │   │   ├── initialize-user/
│   │   │   │   └── session/
│   │   │   ├── campaigns/            # Campaign CRUD
│   │   │   ├── contacts/             # Contact CRUD
│   │   │   ├── integrations/         # Third-party integrations
│   │   │   │   ├── gmail/
│   │   │   │   ├── stripe/
│   │   │   │   └── sendgrid/
│   │   │   ├── seo-enhancement/      # SEO tools
│   │   │   ├── founder/              # Founder OS
│   │   │   └── health/               # Health checks
│   │   │
│   │   ├── auth/                     # Auth callbacks
│   │   │   ├── callback/
│   │   │   └── implicit-callback/
│   │   │
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Landing page
│   │   └── globals.css               # Global styles
│   │
│   ├── components/                   # React components
│   │   ├── ui/                       # shadcn/ui primitives
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── [50+ components]
│   │   │
│   │   ├── client/                   # Client-specific components
│   │   │   ├── ClientAnalytics.tsx
│   │   │   ├── ClientCampaigns.tsx
│   │   │   └── ClientDashboard.tsx
│   │   │
│   │   ├── dashboard/                # Dashboard components
│   │   │   ├── HotLeadsPanel.tsx
│   │   │   ├── CampaignBuilder.tsx
│   │   │   └── ContactList.tsx
│   │   │
│   │   └── [domain-specific]/        # Feature components
│   │       ├── EmailComposer.tsx
│   │       ├── DripBuilder.tsx
│   │       └── ContentReview.tsx
│   │
│   ├── lib/                          # Core utilities
│   │   │
│   │   ├── agents/                   # AI agent logic
│   │   │   ├── contact-intelligence.ts
│   │   │   ├── content-personalization.ts
│   │   │   ├── email-processor.ts
│   │   │   └── orchestrator.ts
│   │   │
│   │   ├── ai/                       # AI integrations
│   │   │   ├── openrouter-intelligence.ts
│   │   │   ├── perplexity-sonar.ts
│   │   │   └── anthropic-client.ts
│   │   │
│   │   ├── auth/                     # Authentication
│   │   │   ├── auth-config.ts
│   │   │   └── session-helpers.ts
│   │   │
│   │   ├── cache/                    # Caching layer
│   │   │   └── redis-client.ts
│   │   │
│   │   ├── email/                    # Email service
│   │   │   └── email-service.ts
│   │   │
│   │   ├── queue/                    # Job queues
│   │   │   └── bull-queue.ts
│   │   │
│   │   ├── supabase/                 # Supabase clients
│   │   │   ├── client.ts             # Browser client
│   │   │   ├── server.ts             # Server client
│   │   │   └── middleware.ts         # Middleware client
│   │   │
│   │   ├── websocket/                # WebSocket server
│   │   │   └── websocket-server.ts
│   │   │
│   │   ├── monitoring/               # Observability
│   │   │   ├── alert-metrics.ts
│   │   │   └── logger.ts
│   │   │
│   │   ├── seoEnhancement/           # SEO services
│   │   │   ├── seoAuditService.ts
│   │   │   ├── contentOptimizationService.ts
│   │   │   ├── richResultsService.ts
│   │   │   ├── ctrOptimizationService.ts
│   │   │   └── competitorGapService.ts
│   │   │
│   │   ├── founderOps/               # Founder OS
│   │   │   ├── businessVault.ts
│   │   │   ├── signalAggregator.ts
│   │   │   ├── snapshotGenerator.ts
│   │   │   └── approvalWorkflow.ts
│   │   │
│   │   ├── db.ts                     # Database wrapper
│   │   └── utils.ts                  # Shared utilities
│   │
│   ├── contexts/                     # React contexts
│   │   ├── AuthContext.tsx           # Auth state
│   │   ├── WorkspaceContext.tsx      # Workspace state
│   │   └── ThemeContext.tsx          # Theme state
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── useAuth.ts                # Auth hook
│   │   ├── useWorkspace.ts           # Workspace hook
│   │   ├── useAlertWebSocket.ts      # WebSocket hook
│   │   └── useSupabase.ts            # Supabase hook
│   │
│   ├── types/                        # TypeScript types
│   │   ├── database.generated.ts     # AUTO-GENERATED (Supabase)
│   │   ├── database.ts               # Manual type extensions
│   │   ├── branded.ts                # Branded types (WorkspaceId, etc.)
│   │   ├── result.ts                 # Result<T, E> type
│   │   ├── media.ts                  # Media types
│   │   └── reports.ts                # Report types
│   │
│   ├── middleware.ts                 # Next.js middleware
│   └── env.d.ts                      # Environment types
│
├── public/                           # Static assets
│   ├── images/
│   ├── fonts/
│   └── icons/
│
├── supabase/                         # Supabase migrations
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_add_rls_policies.sql
│   │   ├── 023_rls_helper_functions.sql
│   │   ├── 024_rls_test_one_table.sql
│   │   ├── 025_rls_apply_all_tables.sql
│   │   └── [300+ migrations]
│   └── config.toml                   # Supabase config
│
├── tests/                            # Test suite
│   ├── unit/                         # Unit tests
│   ├── integration/                  # Integration tests
│   ├── components/                   # Component tests
│   └── e2e/                          # Playwright E2E tests
│
├── docs/                             # Documentation
│   ├── API_REFERENCE.md
│   ├── DEPLOYMENT.md
│   ├── ANTHROPIC_PRODUCTION_PATTERNS.md
│   ├── MULTI_PLATFORM_MARKETING_INTELLIGENCE.md
│   ├── SEO_ENHANCEMENT_SUITE.md
│   ├── RLS_MIGRATION_POSTMORTEM.md
│   ├── PHASE_*.md                    # Phase reports
│   └── guides/
│
├── .env.local                        # Environment variables (gitignored)
├── .env.example                      # Example environment file
├── .gitignore                        # Git ignore rules
├── next.config.ts                    # Next.js config
├── tailwind.config.ts                # Tailwind config
├── tsconfig.json                     # TypeScript config
├── vitest.config.ts                  # Vitest config
├── playwright.config.ts              # Playwright config
├── package.json                      # Dependencies
├── README.md                         # Project README
├── CLAUDE.md                         # Claude instructions
└── ARCHITECTURE.md                   # This file
```

---

## Architectural Rules

### DO ✅

1. **Use Supabase Clients Correctly**
   ```typescript
   // Browser client (client components)
   import { createClient } from "@/lib/supabase/client";
   const supabase = createClient();

   // Server client (server components, API routes)
   import { createClient } from "@/lib/supabase/server";
   const supabase = await createClient();

   // Middleware client (middleware.ts only)
   import { createMiddlewareClient } from "@/lib/supabase/middleware";
   const { supabase, response } = createMiddlewareClient(request);
   ```

2. **Always Filter by Workspace**
   ```typescript
   // ✅ CORRECT - Workspace isolation
   const { data } = await supabase
     .from("contacts")
     .select("*")
     .eq("workspace_id", workspaceId);

   // ❌ WRONG - Exposes all workspaces
   const { data } = await supabase
     .from("contacts")
     .select("*");
   ```

3. **Use Branded Types for IDs**
   ```typescript
   import { WorkspaceId, ContactId, CampaignId } from "@/types/branded";

   // ✅ CORRECT - Type-safe IDs
   function getContact(contactId: ContactId, workspaceId: WorkspaceId) {
     // Type errors if you mix up IDs
   }

   // ❌ WRONG - Unsafe strings
   function getContact(contactId: string, workspaceId: string) {
     // Easy to accidentally swap parameters
   }
   ```

4. **Use Result Type for Error Handling**
   ```typescript
   import { Result, ok, err } from "@/types/result";

   // ✅ CORRECT - Explicit error handling
   async function processEmail(emailId: string): Promise<Result<Contact, Error>> {
     try {
       const contact = await extractContact(emailId);
       return ok(contact);
     } catch (error) {
       return err(error);
     }
   }

   // Usage
   const result = await processEmail(emailId);
   if (result.ok) {
     console.log(result.value); // Contact
   } else {
     console.error(result.error); // Error
   }
   ```

5. **Keep Components Small and Focused**
   ```typescript
   // ✅ CORRECT - Single responsibility
   function ContactCard({ contact }: { contact: Contact }) {
     return <div>{contact.name}</div>;
   }

   function ContactActions({ contact }: { contact: Contact }) {
     return <div>{/* action buttons */}</div>;
   }

   // ❌ WRONG - Too many responsibilities
   function ContactCardWithActionsAndFormAndAnalytics() {
     // 500 lines of mixed concerns
   }
   ```

6. **Use Server Components by Default**
   ```typescript
   // ✅ CORRECT - Server component (default)
   export default async function ContactsPage() {
     const supabase = await createClient();
     const { data } = await supabase.from("contacts").select("*");
     return <ContactList contacts={data} />;
   }

   // Only add "use client" when needed
   "use client";
   export function InteractiveButton() {
     const [count, setCount] = useState(0);
     return <button onClick={() => setCount(count + 1)}>{count}</button>;
   }
   ```

7. **Structure API Routes Consistently**
   ```typescript
   // ✅ CORRECT - Consistent structure
   export async function POST(req: NextRequest) {
     // 1. Authentication
     const supabase = await createClient();
     const { data: { user }, error } = await supabase.auth.getUser();
     if (error || !user) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
     }

     // 2. Parse request
     const body = await req.json();
     const { workspaceId, ...data } = body;

     // 3. Validate
     if (!workspaceId) {
       return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
     }

     // 4. Business logic
     const result = await processData(data, workspaceId);

     // 5. Return response
     return NextResponse.json({ success: true, data: result });
   }
   ```

8. **Check SCHEMA_REFERENCE.md Before Writing SQL**
   ```bash
   # ✅ CORRECT - Always verify schema first
   cat .claude/SCHEMA_REFERENCE.md
   # Then write migration

   # ❌ WRONG - Assume table structure
   # Write migration without checking schema
   ```

9. **Follow RLS Migration Workflow**
   ```bash
   # ✅ CORRECT - 3-step process
   # Step 1: Run diagnostics
   psql -f scripts/rls-diagnostics.sql

   # Step 2: Create helper functions (migration 023)
   # Step 3: Test on one table (migration 024)
   # Step 4: Apply to all tables (migration 025)

   # ❌ WRONG - Skip diagnostics
   # Create RLS policies without helper functions
   ```

---

### DON'T ❌

1. **DON'T Mix Supabase Client Types**
   ```typescript
   // ❌ WRONG - Using browser client in API route
   import { createClient } from "@/lib/supabase/client";
   export async function POST(req: NextRequest) {
     const supabase = createClient(); // Will fail auth
   }

   // ✅ CORRECT
   import { createClient } from "@/lib/supabase/server";
   export async function POST(req: NextRequest) {
     const supabase = await createClient();
   }
   ```

2. **DON'T Skip Workspace Filtering**
   ```typescript
   // ❌ WRONG - Data leak across workspaces
   const contacts = await supabase.from("contacts").select("*");

   // ✅ CORRECT
   const contacts = await supabase
     .from("contacts")
     .select("*")
     .eq("workspace_id", workspaceId);
   ```

3. **DON'T Use `any` Type**
   ```typescript
   // ❌ WRONG - Loses type safety
   function process(data: any) {
     return data.something; // No autocomplete, no errors
   }

   // ✅ CORRECT
   function process(data: Contact) {
     return data.email; // Autocomplete, type checking
   }
   ```

4. **DON'T Put Business Logic in Components**
   ```typescript
   // ❌ WRONG - Logic in component
   function ContactCard({ contact }) {
     const score = calculateComplexScore(contact); // Business logic
     return <div>{score}</div>;
   }

   // ✅ CORRECT - Logic in service/lib
   import { calculateContactScore } from "@/lib/scoring";

   function ContactCard({ contact }) {
     return <div>{contact.ai_score}</div>; // Already calculated
   }
   ```

5. **DON'T Manually Edit Generated Types**
   ```typescript
   // ❌ WRONG - Editing database.generated.ts
   // src/types/database.generated.ts
   export interface Contact {
     id: string;
     custom_field: string; // WILL BE OVERWRITTEN
   }

   // ✅ CORRECT - Extend in database.ts
   // src/types/database.ts
   import { Database } from "./database.generated";

   export type Contact = Database['public']['Tables']['contacts']['Row'] & {
     custom_field?: string; // Safe extension
   };
   ```

6. **DON'T Store Secrets in Code**
   ```typescript
   // ❌ WRONG - Hardcoded secrets
   const API_KEY = "sk-ant-1234567890";

   // ✅ CORRECT - Environment variables
   const API_KEY = process.env.ANTHROPIC_API_KEY;
   ```

7. **DON'T Create RLS Policies Without Helper Functions**
   ```sql
   -- ❌ WRONG - Direct policy creation
   CREATE POLICY "Users can read own workspace contacts"
     ON contacts FOR SELECT
     USING (workspace_id = current_user_workspace_id());
   -- ERROR: function does not exist

   -- ✅ CORRECT - Create helper functions first
   -- See migration 023_rls_helper_functions.sql
   ```

---

## Type Safety Rules

### 1. Generated Types Are Source of Truth

```typescript
// ✅ CORRECT - Use generated types as base
import { Database } from "@/types/database.generated";

export type Contact = Database['public']['Tables']['contacts']['Row'];
export type ContactInsert = Database['public']['Tables']['contacts']['Insert'];
export type ContactUpdate = Database['public']['Tables']['contacts']['Update'];
```

### 2. Extend Generated Types Safely

```typescript
// ✅ CORRECT - Create extended types in database.ts
import { Database } from "./database.generated";

// Base type from generated
type ContactRow = Database['public']['Tables']['contacts']['Row'];

// Extended type with computed fields
export interface Contact extends ContactRow {
  full_name: string; // Computed field
  is_hot_lead: boolean; // Computed field
}
```

### 3. Use Branded Types for Domain IDs

```typescript
// src/types/branded.ts

// Branded type pattern
declare const __brand: unique symbol;
type Brand<T, K> = T & { [__brand]: K };

export type WorkspaceId = Brand<string, "WorkspaceId">;
export type ContactId = Brand<string, "ContactId">;
export type CampaignId = Brand<string, "CampaignId">;

// Constructor functions
export const WorkspaceId = (id: string): WorkspaceId => id as WorkspaceId;
export const ContactId = (id: string): ContactId => id as ContactId;
export const CampaignId = (id: string): CampaignId => id as CampaignId;
```

### 4. Use Result Type for Fallible Operations

```typescript
// src/types/result.ts

export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
```

---

## Code Quality Rules

### 1. Single Responsibility Principle

Each function/component does ONE thing well.

### 2. Dependency Injection

Inject dependencies instead of importing directly.

### 3. Immutable Data Patterns

Use spread operators, never mutate.

### 4. Error Handling Patterns

Always handle errors explicitly with Result type.

### 5. Consistent Naming Conventions

Clear, descriptive names for everything.

---

## Type Generation Pipeline

### Workflow

```
Database Schema (Supabase)
    ↓
Migration Applied (SQL Editor)
    ↓
Type Generation (npm run types:generate)
    ↓
src/types/database.generated.ts (AUTO-GENERATED)
    ↓
src/types/database.ts (MANUAL EXTENSIONS)
    ↓
Application Code (TYPE-SAFE)
```

### Commands

```bash
# Generate types from Supabase schema
npm run types:generate

# Generate types + validate TypeScript
npm run types:check

# Auto-runs after git pull (via .husky/post-merge hook)
git pull  # Types regenerate automatically if migrations changed
```

### Rules

1. **NEVER edit `database.generated.ts` manually** - it will be overwritten
2. **DO extend types in `database.ts`** - this is safe
3. **RUN `npm run types:generate` after migrations** - keep types in sync
4. **COMMIT `database.generated.ts`** - team needs consistent types

---

## Pattern Examples

### Authentication Pattern (PKCE Flow)

See CLAUDE.md for complete authentication flow.

### Workspace Isolation Pattern

See CLAUDE.md for workspace filtering examples.

### AI Agent Pattern

See CLAUDE.md for agent dependency injection patterns.

### API Route Pattern

See CLAUDE.md for complete API route structure.

---

## Migration Checklist

### Adding New Database Table

1. ✅ Check `.claude/SCHEMA_REFERENCE.md` for existing tables
2. ✅ Create migration SQL file in `supabase/migrations/`
3. ✅ Apply migration in Supabase SQL Editor
4. ✅ Run `npm run types:generate` to update types
5. ✅ Create type aliases in `src/types/database.ts`
6. ✅ Add RLS policies (use 3-step workflow)
7. ✅ Test with sample queries
8. ✅ Commit `database.generated.ts` changes

### Adding RLS Policies

1. ✅ Run `scripts/rls-diagnostics.sql` first
2. ✅ Verify helper functions exist (migration 023)
3. ✅ Test on ONE table first (migration 024)
4. ✅ Apply to all tables (migration 025)
5. ✅ Never skip diagnostics

### Adding New API Route

See CLAUDE.md for complete API route checklist.

---

## Troubleshooting

### Types Out of Sync

**Solution**: `npm run types:generate`

### Workspace Isolation Broken

**Solution**: Add `.eq("workspace_id", workspaceId)` to all queries

### RLS Policies Failing

**Solution**: Run `scripts/rls-diagnostics.sql` and verify helper functions exist

### Authentication Failing

**Solution**: Check if using correct Supabase client (`server` vs `client`)

---

## Version History

| Version | Date       | Changes |
|---------|------------|---------|
| 2.0.0   | 2025-12-01 | Complete rewrite aligned with current system architecture |
| 1.0.0   | 2025-01-13 | Initial architecture design (outdated) |

---

**Maintained by**: Unite-Hub Development Team
**Questions**: See CLAUDE.md or README.md
