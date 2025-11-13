# Quick Start: Permanent Integration Pattern

## 30-Second Overview

This pattern makes client context errors **impossible** by enforcing validation at every layer.

```
Frontend → FeaturePageWrapper → API → Convex
   ↓            ↓                 ↓       ↓
  Hook      Guards Render    Validates  Checks DB
```

---

## 5-Minute Implementation

### Step 1: Create Your Feature Component

```tsx
// src/components/features/MyAwesomeFeature.tsx
"use client";

import { Id } from "@/convex/_generated/dataModel";

interface MyAwesomeFeatureProps {
  clientId: Id<"clients">;
}

export function MyAwesomeFeature({ clientId }: MyAwesomeFeatureProps) {
  // clientId is GUARANTEED non-null here
  return (
    <div className="p-6">
      <h1>My Awesome Feature</h1>
      <p>Working with client: {clientId}</p>
    </div>
  );
}
```

### Step 2: Wrap in Page

```tsx
// src/app/my-feature/page.tsx
import { FeaturePageWrapper } from "@/components/features";
import { MyAwesomeFeature } from "@/components/features/MyAwesomeFeature";
import { Sparkles } from "lucide-react";

export default function MyAwesomeFeaturePage() {
  return (
    <FeaturePageWrapper
      featureName="My Awesome Feature"
      description="Select a client to get started"
      icon={<Sparkles className="h-20 w-20 text-blue-500" />}
    >
      {(clientId) => <MyAwesomeFeature clientId={clientId} />}
    </FeaturePageWrapper>
  );
}
```

### Step 3: Create API Route (Optional)

```typescript
// src/app/api/my-feature/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withClientValidation } from "@/lib/apiPatterns";

export async function POST(req: NextRequest) {
  return withClientValidation(req, async ({ clientId, body }) => {
    // clientId is validated
    const result = { success: true, clientId };
    return NextResponse.json(result);
  });
}
```

### Step 4: Create Convex Query/Mutation

```typescript
// convex/myFeature.ts
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { validateClientAccess } from "./lib/withClientFilter";

export const getData = query({
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

## Import Cheatsheet

```typescript
// Frontend
import { FeaturePageWrapper, useFeatureClient } from "@/components/features";
import { Id } from "@/convex/_generated/dataModel";

// API Routes
import { withClientValidation, withErrorHandling } from "@/lib/apiPatterns";

// Convex
import { validateClientAccess, getValidatedClient } from "./lib/withClientFilter";
```

---

## Pattern Rules

### DO ✅

```tsx
// Use FeaturePageWrapper for all client features
<FeaturePageWrapper featureName="Feature">
  {(clientId) => <MyFeature clientId={clientId} />}
</FeaturePageWrapper>

// Pass clientId as props
function MyFeature({ clientId }: { clientId: Id<"clients"> }) {
  return <div>{clientId}</div>;
}

// Validate in Convex
handler: async (ctx, args) => {
  await validateClientAccess(ctx, args.clientId);
  // ... rest of logic
}
```

### DON'T ❌

```tsx
// Don't access context directly in features
function MyFeature() {
  const { currentClientId } = useClientContext(); // ❌
}

// Don't null-check in wrapped components
function MyFeature({ clientId }: { clientId: Id<"clients"> }) {
  if (!clientId) return null; // ❌ Never happens!
}

// Don't skip validation in Convex
handler: async (ctx, args) => {
  // ❌ Missing validation
  return await ctx.db.query("table").collect();
}
```

---

## Troubleshooting

### "Client ID is required" in Convex

```typescript
// ❌ Missing clientId
const data = useQuery(api.myFeature.list);

// ✅ Include clientId
const data = useQuery(api.myFeature.list, { clientId });
```

### TypeScript: "Property clientId does not exist"

```tsx
// ❌ Missing prop
function MyFeature() { ... }

// ✅ Add prop interface
function MyFeature({ clientId }: { clientId: Id<"clients"> }) { ... }
```

### Empty state shows when client selected

```tsx
// ✅ Ensure ClientProvider wraps app
// layout.tsx
<ClientProvider orgId={orgId}>
  {children}
</ClientProvider>
```

---

## Next Steps

Read the full documentation: [`docs/PERMANENT_INTEGRATION_PATTERN.md`](./PERMANENT_INTEGRATION_PATTERN.md)

Key sections:
- **Architecture** - Understand the data flow
- **Examples** - See real-world implementations
- **Migration Guide** - Update existing features
- **Best Practices** - Write better code
