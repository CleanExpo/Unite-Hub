# Integration Pattern Visual Guide

## The Problem We Solved

### Before: Validation Chaos

```
Feature A         Feature B         Feature C
    ↓                 ↓                 ↓
❌ Manual check   ✓ Has check      ❌ Forgot check
❌ Wrong order    ❌ No loading    ✓ Correct
❌ Null errors    ✓ Works          ❌ Data leak
```

**Result:** Inconsistent, buggy, unreliable

### After: Enforced Pattern

```
All Features
    ↓
FeaturePageWrapper (enforces validation)
    ↓
✅ Always validated
✅ Always consistent
✅ Always type-safe
✅ Always reliable
```

**Result:** Impossible to do it wrong

---

## Complete Request Flow

```
┌──────────────────────────────────────────────────────────────┐
│                         USER ACTION                          │
│              (Selects client from dropdown)                  │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                    CLIENT CONTEXT                            │
│  ┌────────────────────────────────────────────────────┐      │
│  │ • Stores: Id<"clients"> | null                     │      │
│  │ • Syncs: localStorage ↔ React state                │      │
│  │ • Provides: useClientContext() hook                │      │
│  └────────────────────────────────────────────────────┘      │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                 FEATURE PAGE (YOUR CODE)                     │
│  ┌────────────────────────────────────────────────────┐      │
│  │ export default function MyFeaturePage() {          │      │
│  │   return (                                         │      │
│  │     <FeaturePageWrapper featureName="My Feature">  │      │
│  │       {(clientId) => <YourFeature clientId={...} />}      │
│  │     </FeaturePageWrapper>                          │      │
│  │   );                                               │      │
│  │ }                                                  │      │
│  └────────────────────────────────────────────────────┘      │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│             FEATUREPPAGEWRAPPER (GUARD)                      │
│  ┌────────────────────────────────────────────────────┐      │
│  │ const { currentClientId, isEmpty, isLoading } = ...│      │
│  │                                                    │      │
│  │ IF isEmpty:                                        │      │
│  │   └─→ Show EmptyClientState                       │      │
│  │                                                    │      │
│  │ IF isLoading:                                      │      │
│  │   └─→ Show Loading Spinner                        │      │
│  │                                                    │      │
│  │ IF error:                                          │      │
│  │   └─→ Show Error Message                          │      │
│  │                                                    │      │
│  │ ELSE:                                              │      │
│  │   └─→ Render children(currentClientId!)           │      │
│  │       Type: Id<"clients"> (guaranteed non-null)    │      │
│  └────────────────────────────────────────────────────┘      │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼ clientId is GUARANTEED
                         │
┌──────────────────────────────────────────────────────────────┐
│                 YOUR FEATURE COMPONENT                       │
│  ┌────────────────────────────────────────────────────┐      │
│  │ function YourFeature({                             │      │
│  │   clientId  // Type: Id<"clients"> ← NON-NULL     │      │
│  │ }: { clientId: Id<"clients"> }) {                  │      │
│  │                                                    │      │
│  │   // Use clientId safely - no checks needed       │      │
│  │   const data = useQuery(api.feature.list, {       │      │
│  │     clientId  // ← Always valid                   │      │
│  │   });                                              │      │
│  │                                                    │      │
│  │   return <div>Feature UI</div>;                   │      │
│  │ }                                                  │      │
│  └────────────────────────────────────────────────────┘      │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼ Makes API call (optional)
                         │
┌──────────────────────────────────────────────────────────────┐
│                      API ROUTE                               │
│  ┌────────────────────────────────────────────────────┐      │
│  │ export async function POST(req: NextRequest) {     │      │
│  │   return withClientValidation(req, async ({        │      │
│  │     clientId,  // ← Validated string              │      │
│  │     body       // ← Parsed JSON                   │      │
│  │   }) => {                                          │      │
│  │                                                    │      │
│  │     // Extraction order:                          │      │
│  │     // 1. x-client-id header (preferred)          │      │
│  │     // 2. body.clientId                           │      │
│  │     // 3. query param clientId                    │      │
│  │                                                    │      │
│  │     return NextResponse.json({ success: true });  │      │
│  │   });                                              │      │
│  │ }                                                  │      │
│  └────────────────────────────────────────────────────┘      │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼ Calls Convex
                         │
┌──────────────────────────────────────────────────────────────┐
│                  CONVEX QUERY/MUTATION                       │
│  ┌────────────────────────────────────────────────────┐      │
│  │ export const myMutation = mutation({               │      │
│  │   args: { clientId: v.id("clients"), ... },        │      │
│  │   handler: async (ctx, args) => {                  │      │
│  │                                                    │      │
│  │     // STEP 1: Validate client exists & active    │      │
│  │     await validateClientAccess(ctx, args.clientId);│      │
│  │     // ↑ Throws if:                               │      │
│  │     //   - clientId is null/undefined             │      │
│  │     //   - Client not in database                 │      │
│  │     //   - Client status is "inactive"            │      │
│  │                                                    │      │
│  │     // STEP 2: Query with client filter           │      │
│  │     const data = await ctx.db                     │      │
│  │       .query("table")                             │      │
│  │       .withIndex("by_client", (q) =>              │      │
│  │         q.eq("clientId", args.clientId)           │      │
│  │       )                                            │      │
│  │       .collect();                                 │      │
│  │                                                    │      │
│  │     return data;                                  │      │
│  │   }                                                │      │
│  │ });                                                │      │
│  └────────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────┘
```

---

## Type Safety Journey

```
┌─────────────────────────────────────────────────────────┐
│ CONTEXT LAYER                                           │
│ Type: Id<"clients"> | null                              │
│                                                         │
│ • User might not have selected client                   │
│ • TypeScript: Must check for null                       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ HOOK LAYER (useFeatureClient)                           │
│ Type: Id<"clients"> | null                              │
│                                                         │
│ Returns:                                                │
│ • currentClientId: Id<"clients"> | null                 │
│ • isEmpty: boolean                                      │
│ • validateClientExists: () => boolean                   │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ WRAPPER LAYER (FeaturePageWrapper)                      │
│ Type: Id<"clients"> | null  →  Id<"clients">            │
│                                                         │
│ MAGIC HAPPENS HERE:                                     │
│ • Checks if isEmpty                                     │
│ • Returns early if null                                 │
│ • Only renders children if non-null                     │
│ • TypeScript knows: "After this point, never null"      │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼ TYPE NARROWED
                   │
┌─────────────────────────────────────────────────────────┐
│ FEATURE LAYER                                           │
│ Type: Id<"clients"> ← GUARANTEED NON-NULL               │
│                                                         │
│ interface Props {                                       │
│   clientId: Id<"clients">  // ← Required, non-optional  │
│ }                                                       │
│                                                         │
│ function Feature({ clientId }: Props) {                 │
│   // clientId is ALWAYS valid here                      │
│   // No null checks needed                              │
│   // TypeScript enforces correctness                    │
│ }                                                       │
└─────────────────────────────────────────────────────────┘
```

---

## Error Handling Flow

```
                    User Action
                         │
                         ▼
            ┌────────────────────────┐
            │ No client selected?    │
            └────────────────────────┘
                    │        │
              YES   │        │ NO
                    │        │
                    ▼        ▼
            ┌────────┐  ┌────────┐
            │ EMPTY  │  │ CHECK  │
            │ STATE  │  │ LOADING│
            └────────┘  └────────┘
                             │
                        YES  │  NO
                             │
                        ┌────▼────┐
                        │ LOADING │
                        │ SPINNER │
                        └─────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ Client loaded? │
                    └────────────────┘
                             │
                        YES  │  NO (error)
                             │
                             ▼               ▼
                    ┌────────────┐   ┌──────────┐
                    │   RENDER   │   │  ERROR   │
                    │  FEATURE   │   │  STATE   │
                    └────────────┘   └──────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ API Call?      │
                    └────────────────┘
                             │
                        YES  │  NO
                             │
                             ▼
                    ┌────────────────┐
                    │ withClient     │
                    │ Validation     │
                    └────────────────┘
                             │
                    Valid?   │  Invalid?
                             │
                             ▼               ▼
                    ┌────────────┐   ┌──────────┐
                    │  PROCEED   │   │ 400 BAD  │
                    │            │   │ REQUEST  │
                    └────────────┘   └──────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ Convex Call    │
                    └────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ validateClient │
                    │ Access         │
                    └────────────────┘
                             │
                    Valid?   │  Invalid?
                             │
                             ▼               ▼
                    ┌────────────┐   ┌──────────┐
                    │  SUCCESS   │   │  CONVEX  │
                    │            │   │  ERROR   │
                    └────────────┘   └──────────┘
```

---

## Component Hierarchy

```
App
│
├── Layout
│   ├── ClientProvider ← Provides context
│   │   │
│   │   └── Pages
│   │       │
│   │       ├── Public Pages
│   │       │   └── No wrapper needed
│   │       │
│   │       └── Feature Pages
│   │           │
│   │           └── FeaturePageWrapper ← Guards render
│   │               │
│   │               ├── Props
│   │               │   ├── featureName: string
│   │               │   ├── description?: string
│   │               │   ├── icon?: ReactNode
│   │               │   └── children: (clientId) => ReactNode
│   │               │
│   │               ├── Internal Flow
│   │               │   ├── useFeatureClient()
│   │               │   │   └── Returns state
│   │               │   │
│   │               │   ├── Check isEmpty
│   │               │   │   └── Show EmptyClientState
│   │               │   │
│   │               │   ├── Check isLoading
│   │               │   │   └── Show Loading Spinner
│   │               │   │
│   │               │   ├── Check error
│   │               │   │   └── Show Error Message
│   │               │   │
│   │               │   └── Render children(clientId!)
│   │               │
│   │               └── Output
│   │                   └── Your Feature Component
│   │                       │
│   │                       ├── Receives: clientId (non-null)
│   │                       ├── Props: { clientId: Id<"clients"> }
│   │                       └── Logic: Use clientId safely
│   │
│   └── API Routes
│       └── withClientValidation ← Validates requests
│
└── Convex Functions
    └── validateClientAccess ← Validates database
```

---

## Data Flow Diagram

```
┌─────────────┐
│   Browser   │
│   Storage   │
│ (clientId)  │
└──────┬──────┘
       │
       │ Loads on mount
       ▼
┌─────────────┐
│   React     │
│   Context   │
│  (current)  │
└──────┬──────┘
       │
       │ Provides
       ▼
┌─────────────┐
│    Hook     │
│  (feature   │
│   client)   │
└──────┬──────┘
       │
       │ Validates
       ▼
┌─────────────┐
│   Wrapper   │
│  (guards    │
│   render)   │
└──────┬──────┘
       │
       │ Guarantees
       ▼
┌─────────────┐
│  Feature    │
│ Component   │
│  (uses ID)  │
└──────┬──────┘
       │
       │ Sends to
       ├──────────────┬──────────────┐
       │              │              │
       ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐
│  Convex  │   │   API    │   │  Local   │
│  Query   │   │  Route   │   │  Logic   │
└──────────┘   └──────────┘   └──────────┘
       │              │              │
       │ Validates    │ Validates    │
       ▼              ▼              │
┌──────────┐   ┌──────────┐         │
│ Database │   │ Database │         │
│  Access  │   │  Access  │         │
└──────────┘   └──────────┘         │
       │              │              │
       └──────────────┴──────────────┘
                      │
                      ▼
               ┌──────────┐
               │  Result  │
               │    to    │
               │   User   │
               └──────────┘
```

---

## Validation Layers

```
Layer 1: FRONTEND GUARD
┌─────────────────────────────────────┐
│ FeaturePageWrapper                  │
│ • Checks: clientId exists           │
│ • Action: Show empty state          │
│ • Type: Id<"clients"> | null → ...  │
└─────────────────────────────────────┘
               ↓ PASS
Layer 2: API VALIDATION (optional)
┌─────────────────────────────────────┐
│ withClientValidation                │
│ • Checks: ID in header/body/query   │
│ • Action: Return 400 error          │
│ • Type: string (non-empty)          │
└─────────────────────────────────────┘
               ↓ PASS
Layer 3: DATABASE VALIDATION
┌─────────────────────────────────────┐
│ validateClientAccess                │
│ • Checks: Client in DB & active     │
│ • Action: Throw ConvexError         │
│ • Type: Id<"clients"> → verified    │
└─────────────────────────────────────┘
               ↓ PASS
         ✅ ALL CLEAR
    Execute business logic
```

---

## Import Map

```
Frontend Components
├── import { FeaturePageWrapper } from "@/components/features"
├── import { useFeatureClient } from "@/hooks/useFeatureClient"
└── import { Id } from "@/convex/_generated/dataModel"

API Routes
├── import { withClientValidation } from "@/lib/apiPatterns"
├── import { withErrorHandling } from "@/lib/apiPatterns"
└── import { NextRequest, NextResponse } from "next/server"

Convex Functions
├── import { validateClientAccess } from "./lib/withClientFilter"
├── import { getValidatedClient } from "./lib/withClientFilter"
├── import { ensureClientId } from "./lib/withClientFilter"
└── import { v } from "convex/values"
```

---

## State Machine

```
         START
           │
           ▼
    ┌─────────────┐
    │  MOUNTING   │ ← Initial render
    └─────────────┘
           │
           ▼
    Check client selected?
           │
    ┌──────┴──────┐
    │             │
   NO            YES
    │             │
    ▼             ▼
┌────────┐   ┌─────────┐
│ EMPTY  │   │ LOADING │ ← Fetching client data
└────────┘   └─────────┘
                   │
            ┌──────┴──────┐
           OK            ERROR
            │               │
            ▼               ▼
       ┌────────┐      ┌───────┐
       │ READY  │      │ ERROR │
       └────────┘      └───────┘
            │
            ▼
       Render feature
            │
     User interacts
            │
      ┌─────┴─────┐
      │           │
  Success      Error
      │           │
      ▼           ▼
  ┌────────┐  ┌───────┐
  │ UPDATE │  │ SHOW  │
  │ STATE  │  │ ERROR │
  └────────┘  └───────┘
      │
      └──→ Stay in READY state
```

---

## Decision Tree

```
                     START
                       │
                       ▼
            Building new feature?
                   │   │
              YES  │   │  NO
                   │   │
                   ▼   └──→ (Use existing pattern)
              Need client ID?
                   │   │
              YES  │   │  NO
                   │   │
                   ▼   └──→ (Public page, no wrapper)
         ┌────────────────────┐
         │ Use FeatureWrapper │
         └────────────────────┘
                   │
                   ▼
           Need API endpoint?
                   │   │
              YES  │   │  NO
                   │   │
                   ▼   └──→ (Direct Convex only)
    ┌──────────────────────────┐
    │ Use withClientValidation │
    └──────────────────────────┘
                   │
                   ▼
          Need database access?
                   │   │
              YES  │   │  NO
                   │   │
                   ▼   └──→ (API only)
    ┌──────────────────────────┐
    │ Use validateClientAccess │
    └──────────────────────────┘
                   │
                   ▼
                 DONE
          Feature is bulletproof
```

---

## Quick Visual Reference

### ✅ DO THIS

```tsx
<FeaturePageWrapper featureName="My Feature">
  {(clientId) => <MyFeature clientId={clientId} />}
</FeaturePageWrapper>

function MyFeature({ clientId }: { clientId: Id<"clients"> }) {
  // Use clientId - guaranteed valid
}
```

### ❌ NOT THIS

```tsx
function MyFeature() {
  const { currentClientId } = useClientContext();

  if (!currentClientId) return null;

  // Boilerplate + TypeScript doesn't know it's non-null
}
```

---

## The Pattern in One Picture

```
         CLIENT CONTEXT
               ↓
         useFeatureClient
               ↓
      FeaturePageWrapper
         VALIDATES
               ↓
    ┌──────────┴──────────┐
    │                     │
FEATURE              CONVEX
    │                     │
    └─────────┬───────────┘
              │
         BULLETPROOF
```

**That's it. That's the entire pattern.**

Every layer validates. Every type is safe. Every feature is consistent.

**Client context errors are now architecturally impossible.**
