# Permanent Integration Pattern

## Table of Contents
- [Overview](#overview)
- [Why These Patterns](#why-these-patterns)
- [Architecture](#architecture)
- [Core Components](#core-components)
- [Usage Guide](#usage-guide)
- [Examples](#examples)
- [Migration Guide](#migration-guide)
- [Common Mistakes](#common-mistakes)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

The **Permanent Integration Pattern** is a bulletproof, type-safe architecture that ensures every feature in Unite-Hub handles client context correctly. It eliminates an entire class of bugs by making it **impossible** to render features without proper client validation.

### What Problem Does This Solve?

Before this pattern:
- Features had inconsistent client validation
- Easy to forget null checks on `clientId`
- Different error handling across features
- No standard pattern for empty states
- TypeScript couldn't prevent null reference errors
- Data leakage between clients was possible

After this pattern:
- **Guaranteed non-null clientId** in feature components
- **Consistent UX** across all features
- **Type-safe** from frontend to backend
- **Impossible to forget** validation (enforced by architecture)
- **Zero boilerplate** in feature code

---

## Why These Patterns

### 1. Type Safety at Every Layer

```
┌─────────────────────────────────────────────────────┐
│ Frontend (React Component)                          │
│ ✓ useFeatureClient hook validates client exists    │
│ ✓ FeaturePageWrapper ensures non-null clientId     │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ API Layer (Next.js Route)                           │
│ ✓ withClientValidation extracts & validates ID     │
│ ✓ Type-safe ApiContext passed to handlers          │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ Backend (Convex)                                    │
│ ✓ validateClientAccess checks DB                   │
│ ✓ getValidatedClient returns verified document     │
└─────────────────────────────────────────────────────┘
```

### 2. Single Responsibility

Each component has ONE job:
- **useFeatureClient**: Provide client state
- **FeaturePageWrapper**: Guard rendering
- **withClientValidation**: Validate API requests
- **validateClientAccess**: Verify database access

### 3. Fail Fast, Fail Loud

Errors are caught at the earliest possible point:
1. Hook detects missing client → Show empty state
2. API receives invalid ID → Return 400 error
3. Convex query gets bad ID → Throw ConvexError

### 4. Developer Experience

Minimal code to write features:
```tsx
// Old way - 15+ lines of boilerplate
export default function MyFeature() {
  const { currentClientId } = useClientContext();

  if (!currentClientId) {
    return <EmptyState />;
  }

  // ... more checks, loading states, error handling

  return <div>Feature content</div>;
}

// New way - 5 lines, guaranteed safety
export default function MyFeature() {
  return (
    <FeaturePageWrapper featureName="My Feature">
      {(clientId) => <MyFeatureContent clientId={clientId} />}
    </FeaturePageWrapper>
  );
}
```

---

## Architecture

### Data Flow

```
User Selects Client
      ↓
ClientContext (localStorage + Convex)
      ↓
useFeatureClient Hook
      ↓
FeaturePageWrapper Component
      ↓
Feature Component (with guaranteed clientId)
      ↓
API Call (with clientId validation)
      ↓
Convex Query/Mutation (with DB validation)
```

### Type Flow

```typescript
// Frontend
Id<"clients"> | null  →  Id<"clients">  (via FeaturePageWrapper)

// API Layer
NextRequest  →  ApiContext { clientId: string }

// Convex Layer
string  →  Id<"clients">  →  Doc<"clients">
```

---

## Core Components

### 1. useFeatureClient Hook

**File:** `src/hooks/useFeatureClient.ts`

**Purpose:** Provides standardized access to client state

**Returns:**
```typescript
{
  currentClientId: Id<"clients"> | null;
  isLoading: boolean;
  error: string | null;
  isEmpty: boolean;
  validateClientExists: () => boolean;
  handleMissingClient: () => void;
}
```

**When to Use:**
- Every feature page that needs client context
- Forms that submit client-dependent data
- Components that need to check if client is selected

**When NOT to Use:**
- Public pages (landing, login, etc.)
- System-level pages (admin settings)
- Components that don't care about clients

---

### 2. FeaturePageWrapper Component

**File:** `src/components/features/FeaturePageWrapper.tsx`

**Purpose:** Guards feature rendering until client is valid

**Props:**
```typescript
{
  featureName: string;           // Required
  description?: string;          // Optional
  icon?: React.ReactNode;        // Optional
  children: (clientId: Id<"clients">) => ReactNode;
}
```

**Rendering Flow:**
1. `isEmpty` → Show `EmptyClientState`
2. `isLoading` → Show loading spinner
3. `error` → Show error message
4. Valid client → Render `children(clientId)`

---

### 3. withClientValidation Wrapper

**File:** `src/lib/apiPatterns.ts`

**Purpose:** Validates client ID in API routes

**Signature:**
```typescript
withClientValidation(
  req: NextRequest,
  handler: (ctx: ApiContext) => Promise<NextResponse>
): Promise<NextResponse>
```

**Client ID Resolution Order:**
1. `x-client-id` header (preferred)
2. Request body `clientId` field
3. URL query parameter `clientId`

---

### 4. Convex Validation Helpers

**File:** `convex/lib/withClientFilter.ts`

**Functions:**

#### `validateClientAccess`
```typescript
// Validates client exists and is active
await validateClientAccess(ctx, clientId);
```

#### `ensureClientId`
```typescript
// Type narrows from optional to required
const clientId = ensureClientId(args.clientId);
```

#### `getValidatedClient`
```typescript
// Returns validated client document
const client = await getValidatedClient(ctx, clientId);
console.log(client.businessName);
```

---

## Usage Guide

### Creating a New Feature

#### Step 1: Create Feature Component

```tsx
// src/components/features/MyFeature.tsx
"use client";

import { Id } from "@/convex/_generated/dataModel";

interface MyFeatureProps {
  clientId: Id<"clients">;
}

export function MyFeature({ clientId }: MyFeatureProps) {
  // Your feature logic here
  // clientId is GUARANTEED to be non-null

  return (
    <div>
      <h1>My Feature</h1>
      <p>Client: {clientId}</p>
    </div>
  );
}
```

#### Step 2: Create Page with Wrapper

```tsx
// src/app/my-feature/page.tsx
import { FeaturePageWrapper } from "@/components/features/FeaturePageWrapper";
import { MyFeature } from "@/components/features/MyFeature";
import { Sparkles } from "lucide-react";

export default function MyFeaturePage() {
  return (
    <FeaturePageWrapper
      featureName="My Feature"
      description="Select a client to use this amazing feature"
      icon={<Sparkles className="h-20 w-20 text-purple-500" />}
    >
      {(clientId) => <MyFeature clientId={clientId} />}
    </FeaturePageWrapper>
  );
}
```

#### Step 3: Create API Route (if needed)

```typescript
// src/app/api/my-feature/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withClientValidation } from "@/lib/apiPatterns";

export async function POST(req: NextRequest) {
  return withClientValidation(req, async ({ clientId, body }) => {
    // clientId is validated and guaranteed non-empty

    const result = await processMyFeature(clientId, body);

    return NextResponse.json({
      success: true,
      data: result
    });
  });
}
```

#### Step 4: Create Convex Query/Mutation

```typescript
// convex/myFeature.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { validateClientAccess } from "./lib/withClientFilter";

export const create = mutation({
  args: {
    clientId: v.id("clients"),
    data: v.object({ /* ... */ })
  },
  handler: async (ctx, args) => {
    // Validate client first
    await validateClientAccess(ctx, args.clientId);

    // Proceed with mutation
    const id = await ctx.db.insert("myTable", {
      clientId: args.clientId,
      ...args.data,
      createdAt: Date.now()
    });

    return id;
  }
});

export const list = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    await validateClientAccess(ctx, args.clientId);

    return await ctx.db
      .query("myTable")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();
  }
});
```

---

## Examples

### Example 1: Simple Feature Page

```tsx
import { FeaturePageWrapper } from "@/components/features/FeaturePageWrapper";

export default function SimpleFeaturePage() {
  return (
    <FeaturePageWrapper featureName="Simple Feature">
      {(clientId) => (
        <div className="p-6">
          <h1>Hello from {clientId}</h1>
          <p>This feature has automatic client validation!</p>
        </div>
      )}
    </FeaturePageWrapper>
  );
}
```

### Example 2: Feature with Form

```tsx
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FeaturePageWrapper } from "@/components/features/FeaturePageWrapper";
import { Id } from "@/convex/_generated/dataModel";

function MyForm({ clientId }: { clientId: Id<"clients"> }) {
  const [name, setName] = useState("");
  const createItem = useMutation(api.myFeature.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await createItem({
      clientId,
      data: { name }
    });

    setName("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Item name"
      />
      <button type="submit">Create</button>
    </form>
  );
}

export default function MyFormPage() {
  return (
    <FeaturePageWrapper featureName="My Form">
      {(clientId) => <MyForm clientId={clientId} />}
    </FeaturePageWrapper>
  );
}
```

### Example 3: Feature with API Call

```tsx
"use client";

import { useState } from "react";
import { FeaturePageWrapper } from "@/components/features/FeaturePageWrapper";
import { Id } from "@/convex/_generated/dataModel";

function DataFetcher({ clientId }: { clientId: Id<"clients"> }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);

    const response = await fetch("/api/my-feature", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": clientId, // Preferred method
      },
      body: JSON.stringify({ action: "fetch" })
    });

    const result = await response.json();
    setData(result.data);
    setLoading(false);
  };

  return (
    <div>
      <button onClick={fetchData} disabled={loading}>
        {loading ? "Loading..." : "Fetch Data"}
      </button>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}

export default function DataFetcherPage() {
  return (
    <FeaturePageWrapper featureName="Data Fetcher">
      {(clientId) => <DataFetcher clientId={clientId} />}
    </FeaturePageWrapper>
  );
}
```

### Example 4: Complex Feature with Multiple Components

```tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FeaturePageWrapper } from "@/components/features/FeaturePageWrapper";
import { Id } from "@/convex/_generated/dataModel";

// Child component
function FeatureStats({ clientId }: { clientId: Id<"clients"> }) {
  const stats = useQuery(api.myFeature.getStats, { clientId });

  return (
    <div className="grid grid-cols-3 gap-4">
      <div>Total: {stats?.total}</div>
      <div>Active: {stats?.active}</div>
      <div>Pending: {stats?.pending}</div>
    </div>
  );
}

// Child component
function FeatureList({ clientId }: { clientId: Id<"clients"> }) {
  const items = useQuery(api.myFeature.list, { clientId });

  return (
    <ul>
      {items?.map(item => (
        <li key={item._id}>{item.name}</li>
      ))}
    </ul>
  );
}

// Main feature component
function ComplexFeature({ clientId }: { clientId: Id<"clients"> }) {
  return (
    <div className="space-y-6">
      <h1>Complex Feature</h1>
      <FeatureStats clientId={clientId} />
      <FeatureList clientId={clientId} />
    </div>
  );
}

// Page
export default function ComplexFeaturePage() {
  return (
    <FeaturePageWrapper featureName="Complex Feature">
      {(clientId) => <ComplexFeature clientId={clientId} />}
    </FeaturePageWrapper>
  );
}
```

---

## Migration Guide

### Migrating Existing Features

#### Before (Old Pattern)

```tsx
"use client";

import { useClientContext } from "@/contexts/ClientContext";
import EmptyClientState from "@/components/client/EmptyClientState";

export default function OldFeature() {
  const { currentClientId } = useClientContext();

  if (!currentClientId) {
    return <EmptyClientState featureName="old feature" />;
  }

  return (
    <div>
      <h1>Feature Content</h1>
      {/* Uses currentClientId everywhere */}
    </div>
  );
}
```

#### After (New Pattern)

```tsx
import { FeaturePageWrapper } from "@/components/features/FeaturePageWrapper";

function OldFeatureContent({ clientId }: { clientId: Id<"clients"> }) {
  return (
    <div>
      <h1>Feature Content</h1>
      {/* Uses clientId prop - guaranteed non-null */}
    </div>
  );
}

export default function OldFeature() {
  return (
    <FeaturePageWrapper featureName="Old Feature">
      {(clientId) => <OldFeatureContent clientId={clientId} />}
    </FeaturePageWrapper>
  );
}
```

#### Migration Steps

1. **Identify the feature component**
   - Find the component that uses `useClientContext()`
   - Note where `currentClientId` is used

2. **Extract feature logic**
   - Move the main feature UI into a separate component
   - Add `clientId` prop to this component
   - Remove `useClientContext()` hook

3. **Wrap page with FeaturePageWrapper**
   - Replace old empty state checks
   - Pass extracted component to wrapper
   - Use render prop pattern

4. **Update child components**
   - Pass `clientId` as props instead of using context
   - Remove any null checks (clientId is guaranteed)

5. **Test**
   - Verify empty state shows when no client selected
   - Verify feature renders correctly with client
   - Check TypeScript errors are resolved

---

## Common Mistakes

### Mistake 1: Not Using the Wrapper

```tsx
// ❌ BAD - No wrapper
export default function MyFeature() {
  const { currentClientId } = useClientContext();
  // currentClientId might be null!

  return <div>{currentClientId}</div>;
}

// ✅ GOOD - With wrapper
export default function MyFeature() {
  return (
    <FeaturePageWrapper featureName="My Feature">
      {(clientId) => <div>{clientId}</div>}
    </FeaturePageWrapper>
  );
}
```

### Mistake 2: Using Context Inside Wrapped Component

```tsx
// ❌ BAD - Redundant context usage
function MyFeature({ clientId }: { clientId: Id<"clients"> }) {
  const { currentClientId } = useClientContext(); // Unnecessary!

  return <div>{currentClientId}</div>;
}

// ✅ GOOD - Use the prop
function MyFeature({ clientId }: { clientId: Id<"clients"> }) {
  return <div>{clientId}</div>;
}
```

### Mistake 3: Null Checking in Wrapped Components

```tsx
// ❌ BAD - Unnecessary null check
function MyFeature({ clientId }: { clientId: Id<"clients"> }) {
  if (!clientId) return null; // Never happens!

  return <div>{clientId}</div>;
}

// ✅ GOOD - Trust the wrapper
function MyFeature({ clientId }: { clientId: Id<"clients"> }) {
  // clientId is ALWAYS defined here
  return <div>{clientId}</div>;
}
```

### Mistake 4: Not Validating in Convex

```typescript
// ❌ BAD - No validation
export const myMutation = mutation({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    // Assumes client exists
    return await ctx.db.insert("table", {
      clientId: args.clientId
    });
  }
});

// ✅ GOOD - Always validate
export const myMutation = mutation({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    await validateClientAccess(ctx, args.clientId);

    return await ctx.db.insert("table", {
      clientId: args.clientId
    });
  }
});
```

### Mistake 5: Wrong API Error Handling

```typescript
// ❌ BAD - Manual clientId extraction
export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.clientId) {
    return NextResponse.json({ error: "Missing clientId" });
  }
  // ... rest of handler
}

// ✅ GOOD - Use withClientValidation
export async function POST(req: NextRequest) {
  return withClientValidation(req, async ({ clientId, body }) => {
    // clientId is validated automatically
    // ... handler logic
  });
}
```

---

## Best Practices

### 1. Always Use FeaturePageWrapper for Client Features

Every feature that depends on a client MUST use the wrapper:

```tsx
// ✅ Client-dependent features
<FeaturePageWrapper featureName="Content Calendar">
<FeaturePageWrapper featureName="Email Campaigns">
<FeaturePageWrapper featureName="Social Posts">

// ❌ Public pages (no wrapper needed)
LoginPage
LandingPage
DocumentationPage
```

### 2. Keep Feature Components Pure

Feature components should:
- Accept `clientId` as a prop
- Not use `useClientContext()` directly
- Not perform client validation (wrapper does this)

```tsx
// ✅ GOOD - Pure component
function MyFeature({ clientId }: { clientId: Id<"clients"> }) {
  const data = useQuery(api.myFeature.get, { clientId });
  return <div>{data}</div>;
}

// ❌ BAD - Impure component
function MyFeature() {
  const { currentClientId } = useClientContext();
  if (!currentClientId) return null;
  const data = useQuery(api.myFeature.get, { clientId: currentClientId });
  return <div>{data}</div>;
}
```

### 3. Pass ClientId Explicitly Through Props

Don't rely on context in nested components:

```tsx
// ✅ GOOD - Explicit props
function ParentFeature({ clientId }: { clientId: Id<"clients"> }) {
  return <ChildComponent clientId={clientId} />;
}

function ChildComponent({ clientId }: { clientId: Id<"clients"> }) {
  return <div>{clientId}</div>;
}

// ❌ BAD - Context dependency
function ChildComponent() {
  const { currentClientId } = useClientContext();
  return <div>{currentClientId}</div>;
}
```

### 4. Validate Early in Convex

Always validate at the start of your handler:

```typescript
export const myQuery = query({
  args: { clientId: v.id("clients"), /* ... */ },
  handler: async (ctx, args) => {
    // FIRST THING: Validate client
    await validateClientAccess(ctx, args.clientId);

    // THEN: Proceed with logic
    const data = await ctx.db.query("table")...
    return data;
  }
});
```

### 5. Use Descriptive Feature Names

Make it obvious what the feature does:

```tsx
// ✅ GOOD
<FeaturePageWrapper featureName="Email Campaign Creator">
<FeaturePageWrapper featureName="30-Day Content Calendar">
<FeaturePageWrapper featureName="Brand Voice Analyzer">

// ❌ BAD (too generic)
<FeaturePageWrapper featureName="Feature">
<FeaturePageWrapper featureName="Page">
<FeaturePageWrapper featureName="Tool">
```

### 6. Provide Helpful Descriptions

Custom descriptions guide users:

```tsx
<FeaturePageWrapper
  featureName="AI Image Generator"
  description="Select a client to generate AI-powered images for their brand"
  icon={<Sparkles className="h-20 w-20 text-purple-500" />}
>
```

### 7. Handle Loading States in Features

The wrapper handles initial loading, but features should handle their own data loading:

```tsx
function MyFeature({ clientId }: { clientId: Id<"clients"> }) {
  const data = useQuery(api.myFeature.get, { clientId });

  // ✅ GOOD - Handle data loading
  if (data === undefined) {
    return <div>Loading data...</div>;
  }

  return <div>{data.content}</div>;
}
```

---

## Troubleshooting

### Issue: "Client ID is required" error in Convex

**Cause:** Not passing clientId to query/mutation

**Solution:**
```typescript
// ❌ Missing clientId
const data = useQuery(api.myFeature.list);

// ✅ Include clientId
const data = useQuery(api.myFeature.list, { clientId });
```

---

### Issue: Empty state shows even when client selected

**Cause:** Context provider missing or not wrapping app

**Solution:** Verify `ClientProvider` wraps your app:
```tsx
// layout.tsx
<ClientProvider orgId={orgId}>
  {children}
</ClientProvider>
```

---

### Issue: TypeScript error "Property 'clientId' does not exist"

**Cause:** Feature component not receiving clientId prop

**Solution:**
```tsx
// ❌ Missing prop type
function MyFeature() {
  return <div>...</div>;
}

// ✅ Add prop interface
interface MyFeatureProps {
  clientId: Id<"clients">;
}

function MyFeature({ clientId }: MyFeatureProps) {
  return <div>...</div>;
}
```

---

### Issue: "Cannot read property of undefined" in API route

**Cause:** Not using `withClientValidation` wrapper

**Solution:**
```typescript
// ❌ Manual handling
export async function POST(req: NextRequest) {
  const body = await req.json();
  // body.clientId might be undefined
}

// ✅ Use wrapper
export async function POST(req: NextRequest) {
  return withClientValidation(req, async ({ clientId, body }) => {
    // clientId is guaranteed
  });
}
```

---

### Issue: Feature renders but data from wrong client

**Cause:** Not filtering by clientId in Convex query

**Solution:**
```typescript
// ❌ No filter
const items = await ctx.db.query("items").collect();

// ✅ Filter by client
const items = await ctx.db
  .query("items")
  .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
  .collect();
```

---

## Summary

### Quick Reference

**Frontend Pattern:**
```tsx
<FeaturePageWrapper featureName="Feature">
  {(clientId) => <FeatureComponent clientId={clientId} />}
</FeaturePageWrapper>
```

**API Pattern:**
```typescript
export async function POST(req: NextRequest) {
  return withClientValidation(req, async ({ clientId, body }) => {
    // ...
  });
}
```

**Convex Pattern:**
```typescript
export const myMutation = mutation({
  args: { clientId: v.id("clients"), /* ... */ },
  handler: async (ctx, args) => {
    await validateClientAccess(ctx, args.clientId);
    // ...
  }
});
```

### Key Principles

1. **Use FeaturePageWrapper** for all client-dependent pages
2. **Pass clientId as props** through component tree
3. **Validate in Convex** at start of every handler
4. **Use withClientValidation** in all API routes
5. **Trust the type system** - if clientId is non-null in TypeScript, it's safe to use

---

## Need Help?

If you encounter issues not covered here:

1. Check TypeScript errors first
2. Verify ClientProvider is set up correctly
3. Ensure Convex schema includes clientId fields
4. Review examples in this document
5. Check existing features for reference patterns

**Remember:** If you're writing client validation code manually, you're doing it wrong. Use the patterns!
