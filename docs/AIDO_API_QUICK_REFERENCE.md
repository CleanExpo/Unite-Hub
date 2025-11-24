# AIDO API - Quick Reference

**Fast lookup for developers implementing remaining endpoints**

---

## Database Functions Import Map

```typescript
// Client Profiles
import {
  createClientProfile,
  getClientProfiles,
  getClientProfile,
  updateClientProfile,
  deleteClientProfile,
  getClientProfileByDomain,
  searchClientProfilesByNiche,
} from '@/lib/aido/database/client-profiles';

// Topics
import {
  createTopic,
  getTopics,
  getTopicsByPillar,
  getTopic,
  updateTopic,
  deleteTopic,
  getTopicBySlug,
  getActiveTopics,
} from '@/lib/aido/database/topics';

// Intent Clusters
import {
  createIntentCluster,
  getIntentClusters,
  getIntentClustersByTopic,
  getIntentCluster,
  updateIntentCluster,
  deleteIntentCluster,
  getHighPriorityIntentClusters,
  getIntentClustersByPurchaseStage,
} from '@/lib/aido/database/intent-clusters';

// Content Assets
import {
  createContentAsset,
  getContentAssets,
  getContentAsset,
  updateContentAsset,
  publishContentAsset,
  deleteContentAsset,
  getHighQualityContentAssets,
  getContentAssetBySlug,
} from '@/lib/aido/database/content-assets';

// Reality Events
import {
  createRealityEvent,
  getRealityEvents,
  getRealityEvent,
  updateRealityEventStatus,
  deleteRealityEvent,
  getPendingRealityEvents,
  getRealityEventsByTimeRange,
} from '@/lib/aido/database/reality-events';

// SERP Observations
import {
  createSerpObservation,
  getSerpObservations,
  getSerpObservation,
  deleteSerpObservation,
  getSerpObservationsWithAIAnswers,
  getSerpObservationsByKeyword,
  getSerpObservationsByTimeRange,
  getDomainPresenceInAIAnswers,
} from '@/lib/aido/database/serp-observations';

// Change Signals
import {
  createChangeSignal,
  getChangeSignals,
  getChangeSignal,
  updateChangeSignalStatus,
  deleteChangeSignal,
  getActiveChangeSignals,
  getCriticalChangeSignals,
  getChangeSignalsByTimeRange,
} from '@/lib/aido/database/change-signals';

// Strategy Recommendations
import {
  createStrategyRecommendation,
  getStrategyRecommendations,
  getStrategyRecommendation,
  updateStrategyRecommendation,
  updateStrategyRecommendationStatus,
  deleteStrategyRecommendation,
  getPendingStrategyRecommendations,
  getHighPriorityStrategyRecommendations,
  getStrategyRecommendationsByUser,
} from '@/lib/aido/database/strategy-recommendations';
```

---

## API Endpoint Checklist

For each new endpoint, include:

```typescript
// 1. Imports
import { NextRequest, NextResponse } from 'next/server';
import { checkTierRateLimit } from '@/lib/rate-limit-tiers';
import { successResponse, errorResponse, validationError } from '@/lib/api-helpers';
import { /* database functions */ } from '@/lib/aido/database/[module]';

// 2. Auth
const authHeader = req.headers.get('authorization');
const token = authHeader?.replace('Bearer ', '');
if (!token) return errorResponse('Unauthorized', 401);

const { supabaseBrowser } = await import('@/lib/supabase');
const { data, error } = await supabaseBrowser.auth.getUser(token);
if (error || !data.user) return errorResponse('Unauthorized', 401);

// 3. Rate Limit ('api' or 'ai')
const rateLimitResult = await checkTierRateLimit(req, data.user.id, 'api');
if (!rateLimitResult.allowed) return rateLimitResult.response;

// 4. Workspace
const workspaceId = req.nextUrl.searchParams.get('workspaceId');
if (!workspaceId) return validationError({ workspaceId: 'workspaceId parameter is required' });

// 5. Validation (POST/PATCH)
const requiredErrors = {
  ...(!field && { field: 'field is required' }),
};
if (Object.keys(requiredErrors).length > 0) return validationError(requiredErrors);

// 6. Database Call
const result = await databaseFunction(workspaceId, ...);

// 7. Response
return successResponse({ result }, undefined, 'Success message', 200);
```

---

## HTTP Method Patterns

### GET (List)
```typescript
export async function GET(req: NextRequest) {
  // Auth → Rate Limit → Workspace → Optional Filters → Database → Response
  const items = await getItems(workspaceId, filters);
  return successResponse({ items }, { count: items.length, total: items.length });
}
```

### GET (Single)
```typescript
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Auth → Rate Limit → Workspace → Database → Response or 404
  const item = await getItem(id, workspaceId);
  return successResponse({ item });
}
```

### POST (Create)
```typescript
export async function POST(req: NextRequest) {
  // Auth → Rate Limit → Workspace → Parse Body → Validate → Database → Response 201
  const body = await req.json();
  const item = await createItem({ workspaceId, ...body });
  return successResponse({ item }, undefined, 'Created successfully', 201);
}
```

### PATCH (Update)
```typescript
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Auth → Rate Limit → Workspace → Parse Body → Build Updates → Database → Response
  const body = await req.json();
  const updates: any = {};
  if (field !== undefined) updates.field = field;
  const item = await updateItem(id, workspaceId, updates);
  return successResponse({ item }, undefined, 'Updated successfully');
}
```

### DELETE
```typescript
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Auth → Rate Limit → Workspace → Database → Response 200
  await deleteItem(id, workspaceId);
  return successResponse(undefined, undefined, 'Deleted successfully', 200);
}
```

---

## Common Validations

```typescript
// Required fields
const requiredErrors = {
  ...(!name && { name: 'name is required' }),
  ...(!email && { email: 'email is required' }),
};

// Email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  return validationError({ email: 'Invalid email format' });
}

// URL format
const urlRegex = /^https?:\/\/.+/;
if (url && !urlRegex.test(url)) {
  return validationError({ url: 'Invalid URL format' });
}

// Array non-empty
if (Array.isArray(items) && items.length === 0) {
  return validationError({ items: 'At least one item is required' });
}

// Number range
if (score < 0 || score > 1) {
  return validationError({ score: 'Score must be between 0 and 1' });
}
```

---

## Error Handling Patterns

```typescript
try {
  // Operation
} catch (error) {
  console.error('[AIDO] Error:', error);
  if (error instanceof Error) {
    // Not found
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      return errorResponse(error.message, 404);
    }
    // Conflict (duplicate)
    if (error.message.includes('already exists')) {
      return errorResponse(error.message, 409);
    }
    // Other errors
    return errorResponse(error.message, 500);
  }
  return errorResponse('Internal server error', 500);
}
```

---

## AI Endpoint Pattern

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  // ... auth, rate limit ('ai'), workspace ...

  // Call Claude
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929', // or opus for Extended Thinking
    max_tokens: 4096,
    messages: [{ role: 'user', content: `Your prompt here...` }]
  });

  // Parse response
  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
  const parsed = JSON.parse(responseText); // or custom parsing

  // Save to database
  const result = await createSomething({ workspaceId, ...parsed });

  return successResponse({ result });
}
```

---

## Response Formats

```typescript
// Success with data
successResponse({ item }, undefined, 'Operation successful', 200)
// → { success: true, data: { item }, message: "Operation successful" }

// Success with list + metadata
successResponse({ items }, { count: items.length, total: items.length })
// → { success: true, data: { items }, meta: { count, total } }

// Success with no data
successResponse(undefined, undefined, 'Deleted successfully', 200)
// → { success: true, message: "Deleted successfully" }

// Created
successResponse({ item }, undefined, 'Created successfully', 201)
// → { success: true, data: { item }, message: "Created successfully" }

// Validation error
validationError({ field: 'error message' })
// → { success: false, error: "Validation failed", details: { field: "error message" } }

// Not found
errorResponse('Item not found', 404)
// → { success: false, error: "Item not found" }

// Unauthorized
errorResponse('Unauthorized', 401)
// → { success: false, error: "Unauthorized" }

// Server error
errorResponse('Internal server error', 500)
// → { success: false, error: "Internal server error" }
```

---

## Query Parameter Patterns

```typescript
// Required parameter
const workspaceId = req.nextUrl.searchParams.get('workspaceId');
if (!workspaceId) return validationError({ workspaceId: 'workspaceId parameter is required' });

// Optional parameter
const clientId = req.nextUrl.searchParams.get('clientId'); // null if not provided

// Multiple optional filters
const filters: any = {};
const clientId = req.nextUrl.searchParams.get('clientId');
if (clientId) filters.clientId = clientId;
const status = req.nextUrl.searchParams.get('status');
if (status) filters.status = status;

// Pass to database function
const items = await getItems(workspaceId, filters);
```

---

## Directory Structure Template

```bash
# For resource "things"

# List and Create
src/app/api/aido/things/route.ts
  - GET /api/aido/things?workspaceId=xxx (list)
  - POST /api/aido/things?workspaceId=xxx (create)

# Single Resource Operations
src/app/api/aido/things/[id]/route.ts
  - GET /api/aido/things/[id]?workspaceId=xxx (get)
  - PATCH /api/aido/things/[id]?workspaceId=xxx (update)
  - DELETE /api/aido/things/[id]?workspaceId=xxx (delete)

# Special Operations
src/app/api/aido/things/generate/route.ts
  - POST /api/aido/things/generate?workspaceId=xxx (AI generation)
```

---

## Testing Snippets

```typescript
// Test workspace isolation
describe('Workspace Isolation', () => {
  it('should only return items from specified workspace', async () => {
    await create({ workspaceId: 'w1', name: 'Item 1' });
    await create({ workspaceId: 'w2', name: 'Item 2' });

    const w1Items = await getItems('w1');
    expect(w1Items).toHaveLength(1);
    expect(w1Items[0].name).toBe('Item 1');
  });
});

// Test authentication
describe('Authentication', () => {
  it('should reject requests without token', async () => {
    const res = await fetch('/api/aido/things?workspaceId=test');
    expect(res.status).toBe(401);
  });
});

// Test rate limiting
describe('Rate Limiting', () => {
  it('should enforce limits', async () => {
    // Make 15 requests (free tier limit: 10/min)
    const responses = await Promise.all(
      Array(15).fill(null).map(() =>
        fetch('/api/aido/things?workspaceId=test', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      )
    );

    const statuses = responses.map(r => r.status);
    expect(statuses.filter(s => s === 429).length).toBeGreaterThan(0);
  });
});
```

---

## Common Pitfalls to Avoid

❌ **Forgetting workspaceId filter**:
```typescript
// BAD
const items = await supabase.from('table').select('*');

// GOOD
const items = await supabase.from('table').select('*').eq('workspace_id', workspaceId);
```

❌ **Not handling missing params**:
```typescript
// BAD
const { id } = params;

// GOOD
const { id } = await params; // Next.js 16+ requires await
```

❌ **Wrong rate limit type**:
```typescript
// BAD - AI endpoint with 'api' limit
const rateLimitResult = await checkTierRateLimit(req, userId, 'api');

// GOOD - AI endpoint with 'ai' limit
const rateLimitResult = await checkTierRateLimit(req, userId, 'ai');
```

❌ **Not validating required fields**:
```typescript
// BAD - Assumes field exists
const item = await create({ workspaceId, name: body.name });

// GOOD - Validates first
if (!body.name) return validationError({ name: 'name is required' });
```

❌ **Leaking error details**:
```typescript
// BAD - Exposes internal error
return errorResponse(error.stack, 500);

// GOOD - Generic message for 500s
return errorResponse('Internal server error', 500);
```

---

## Time Estimates by Endpoint

| Endpoint | Complexity | Time Estimate |
|----------|------------|---------------|
| Simple GET list | Low | 20-30 min |
| Simple POST create | Low | 30-45 min |
| Simple GET by ID | Low | 15-20 min |
| Simple PATCH update | Low | 30-45 min |
| Simple DELETE | Low | 15-20 min |
| AI generation | High | 2-3 hours |
| AI analysis | High | 2-3 hours |
| Cron endpoint | Medium | 1-2 hours |

---

## Remaining Endpoints Priority

**Priority 1** (Content Agent needs these):
1. POST /api/aido/topics
2. GET /api/aido/topics
3. POST /api/aido/intent-clusters/generate (AI)
4. GET /api/aido/intent-clusters
5. POST /api/aido/content/generate (AI)
6. GET /api/aido/content
7. GET /api/aido/content/[id]
8. PATCH /api/aido/content/[id]

**Priority 2** (Nice to have):
9. PATCH /api/aido/intent-clusters/[id]
10. POST /api/aido/reality-loop/ingest
11. GET /api/aido/reality-loop/events
12. POST /api/aido/reality-loop/process (AI)

**Priority 3** (Future):
13. POST /api/aido/google-curve/monitor (cron)
14. GET /api/aido/google-curve/signals
15. POST /api/aido/google-curve/analyze (AI)

---

**Quick Reference v1.0** - 2025-11-25
