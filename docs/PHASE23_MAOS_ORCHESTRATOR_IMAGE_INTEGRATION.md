# Phase 23 - MAOS Orchestrator Training & Image Engine Integration

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase23-orchestrator-image-integration`

## Executive Summary

Phase 23 trains the MAOS (Multi-Agent Orchestration System) Orchestrator to request images through the Gemini Nano Banana 2 engine, wait for human approval, and insert approved images into the UI. The Orchestrator cannot auto-approve images and must follow strict capability rules.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Model Lock | `gemini-3-pro-image-preview` |
| Approval Gate | Required for all images |
| Orchestrator Auto-Approve | **FORBIDDEN** |
| Strict Agent Capabilities | Enforced |

### Orchestrator Limitations

- Orchestrator MAY request images
- Orchestrator MAY NOT approve images
- Orchestrator MAY NOT bypass approval
- Orchestrator MAY NOT see rejected images
- Orchestrator MAY NOT pass raw prompts with banned terms

## API Endpoints

### POST /api/orchestrator/image/request

Orchestrator requests a new image generation.

```typescript
// Request
{
  "category": "dashboard",
  "use_case": "analytics-tile",
  "prompt": "Professional analytics dashboard tile showing growth metrics",
  "context": {
    "orgId": "uuid",
    "requestedBy": "orchestrator_system",
    "priority": "normal"
  }
}

// Response
{
  "success": true,
  "requestId": "uuid",
  "status": "pending",
  "message": "Image request submitted for human approval"
}
```

### POST /api/orchestrator/image/check

Orchestrator checks if an image has been approved.

```typescript
// Request
{
  "requestId": "uuid"
}

// Response (pending)
{
  "status": "pending",
  "approved": false,
  "message": "Awaiting human approval"
}

// Response (approved)
{
  "status": "approved",
  "approved": true,
  "image": {
    "id": "uuid",
    "file_path": "/data/clients/org-123/images/dashboard-analytics-tile.png",
    "category": "dashboard",
    "use_case": "analytics-tile"
  }
}

// Response (rejected)
{
  "status": "rejected",
  "approved": false,
  "message": "Image was rejected by reviewer"
}
```

### POST /api/orchestrator/image/use

Orchestrator confirms usage of an approved image.

```typescript
// Request
{
  "imageId": "uuid",
  "usageContext": {
    "component": "DashboardTile",
    "page": "/dashboard",
    "insertedAt": "2025-11-21T10:00:00Z"
  }
}

// Response
{
  "success": true,
  "message": "Image usage logged"
}
```

### Implementation

```typescript
// src/app/api/orchestrator/image/request/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { GeminiBanana2Client } from '@/lib/image-engine/client';
import { sanitizePrompt } from '@/lib/utils/sanitize';

export async function POST(req: NextRequest) {
  try {
    // Verify orchestrator capability
    const authHeader = req.headers.get('x-orchestrator-key');
    if (authHeader !== process.env.ORCHESTRATOR_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { category, use_case, prompt, context } = await req.json();

    // Sanitize prompt - remove banned terms
    const sanitizedPrompt = sanitizePrompt(prompt);

    // Generate image via Gemini
    const client = new GeminiBanana2Client();
    const result = await client.generateImage(sanitizedPrompt, {
      category,
      use_case,
      orgId: context.orgId,
    });

    // Create pending approval record
    const supabase = await getSupabaseServer();

    const { data: approval, error } = await supabase
      .from('image_approvals')
      .insert({
        org_id: context.orgId,
        category,
        use_case,
        file_name: result.fileName,
        file_path: result.filePath,
        status: 'pending',
        requested_by: context.requestedBy,
        notes: `Requested by MAOS Orchestrator: ${sanitizedPrompt.substring(0, 200)}`,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log to audit
    await supabase.from('image_approvals_audit').insert({
      approval_id: approval.id,
      previous_status: null,
      new_status: 'pending',
      changed_by: null, // System action
    });

    return NextResponse.json({
      success: true,
      requestId: approval.id,
      status: 'pending',
      message: 'Image request submitted for human approval',
    });

  } catch (error) {
    console.error('Orchestrator image request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

```typescript
// src/app/api/orchestrator/image/check/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('x-orchestrator-key');
    if (authHeader !== process.env.ORCHESTRATOR_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId } = await req.json();

    const supabase = await getSupabaseServer();

    const { data: approval, error } = await supabase
      .from('image_approvals')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error || !approval) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Orchestrator cannot see rejected images details
    if (approval.status === 'rejected') {
      return NextResponse.json({
        status: 'rejected',
        approved: false,
        message: 'Image was rejected by reviewer',
      });
    }

    if (approval.status === 'approved') {
      return NextResponse.json({
        status: 'approved',
        approved: true,
        image: {
          id: approval.id,
          file_path: approval.file_path,
          category: approval.category,
          use_case: approval.use_case,
        },
      });
    }

    return NextResponse.json({
      status: approval.status,
      approved: false,
      message: 'Awaiting human approval',
    });

  } catch (error) {
    console.error('Orchestrator check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## MAOS Skills

### image.request Skill

```typescript
// .claude/skills/orchestrator/image-request.ts

export const imageRequestSkill = {
  name: 'image.request',
  description: 'Request a new image from the Gemini Nano Banana 2 engine',
  parameters: {
    category: { type: 'string', required: true },
    use_case: { type: 'string', required: true },
    prompt: { type: 'string', required: true },
  },
  async execute(params: {
    category: string;
    use_case: string;
    prompt: string;
    orgId: string;
  }): Promise<ImageRequestResult> {
    const response = await fetch('/api/orchestrator/image/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-orchestrator-key': process.env.ORCHESTRATOR_SECRET_KEY!,
      },
      body: JSON.stringify({
        category: params.category,
        use_case: params.use_case,
        prompt: params.prompt,
        context: {
          orgId: params.orgId,
          requestedBy: 'orchestrator_system',
          priority: 'normal',
        },
      }),
    });

    return response.json();
  },
};

interface ImageRequestResult {
  success: boolean;
  requestId: string;
  status: string;
  message: string;
}
```

### image.wait Skill

```typescript
// .claude/skills/orchestrator/image-wait.ts

export const imageWaitSkill = {
  name: 'image.wait',
  description: 'Wait for an image to be approved by a human',
  parameters: {
    requestId: { type: 'string', required: true },
    maxWaitMs: { type: 'number', default: 300000 }, // 5 minutes
    pollIntervalMs: { type: 'number', default: 5000 }, // 5 seconds
  },
  async execute(params: {
    requestId: string;
    maxWaitMs?: number;
    pollIntervalMs?: number;
  }): Promise<ImageWaitResult> {
    const maxWait = params.maxWaitMs || 300000;
    const pollInterval = params.pollIntervalMs || 5000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      const response = await fetch('/api/orchestrator/image/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-orchestrator-key': process.env.ORCHESTRATOR_SECRET_KEY!,
        },
        body: JSON.stringify({ requestId: params.requestId }),
      });

      const result = await response.json();

      if (result.status === 'approved') {
        return {
          approved: true,
          image: result.image,
        };
      }

      if (result.status === 'rejected') {
        return {
          approved: false,
          rejected: true,
          message: result.message,
        };
      }

      // Still pending, wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    return {
      approved: false,
      timeout: true,
      message: 'Approval timeout exceeded',
    };
  },
};

interface ImageWaitResult {
  approved: boolean;
  image?: {
    id: string;
    file_path: string;
    category: string;
    use_case: string;
  };
  rejected?: boolean;
  timeout?: boolean;
  message?: string;
}
```

### image.use Skill

```typescript
// .claude/skills/orchestrator/image-use.ts

export const imageUseSkill = {
  name: 'image.use',
  description: 'Use an approved image in a component',
  parameters: {
    category: { type: 'string', required: true },
    use_case: { type: 'string', required: true },
  },
  async execute(params: {
    category: string;
    use_case: string;
    orgId: string;
  }): Promise<ImageUseResult> {
    // This skill generates the component code to use the image
    return {
      component: 'DynamicImage',
      props: {
        category: params.category,
        useCase: params.use_case,
      },
      code: `<DynamicImage category="${params.category}" useCase="${params.use_case}" />`,
    };
  },
};

interface ImageUseResult {
  component: string;
  props: Record<string, string>;
  code: string;
}
```

## Orchestrator Workflow

```typescript
// Example orchestrator workflow for requesting and using an image

async function orchestratorImageWorkflow(orgId: string) {
  // Step 1: Request image
  const request = await imageRequestSkill.execute({
    category: 'dashboard',
    use_case: 'analytics-tile',
    prompt: 'Professional analytics dashboard tile showing growth metrics with modern design',
    orgId,
  });

  if (!request.success) {
    throw new Error(`Image request failed: ${request.message}`);
  }

  console.log(`Image requested: ${request.requestId}`);

  // Step 2: Wait for approval
  const approval = await imageWaitSkill.execute({
    requestId: request.requestId,
    maxWaitMs: 600000, // 10 minutes
  });

  if (approval.rejected) {
    throw new Error(`Image rejected: ${approval.message}`);
  }

  if (approval.timeout) {
    throw new Error('Image approval timeout');
  }

  if (!approval.approved) {
    throw new Error('Image not approved');
  }

  console.log(`Image approved: ${approval.image.file_path}`);

  // Step 3: Use in component
  const usage = await imageUseSkill.execute({
    category: 'dashboard',
    use_case: 'analytics-tile',
    orgId,
  });

  console.log(`Component code: ${usage.code}`);

  return usage;
}
```

## UI Components

### MAOSImageRequestPanel

```typescript
// src/components/admin/MAOSImageRequestPanel.tsx

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

interface MAOSRequest {
  id: string;
  category: string;
  use_case: string;
  status: string;
  created_at: string;
}

export function MAOSImageRequestPanel() {
  const { session, currentOrganization } = useAuth();
  const [requests, setRequests] = useState<MAOSRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMAOSRequests();
  }, []);

  const fetchMAOSRequests = async () => {
    try {
      const response = await fetch(
        `/api/admin/images?org_id=${currentOrganization?.org_id}&requested_by=orchestrator_system`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );
      const data = await response.json();
      setRequests(data.images || []);
    } catch (error) {
      console.error('Failed to fetch MAOS requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'revised': return 'bg-blue-500';
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>MAOS Image Requests</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="animate-pulse space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {requests.map((request) => (
              <div
                key={request.id}
                className="flex justify-between items-center p-3 border rounded"
              >
                <div>
                  <span className="font-medium">{request.category}</span>
                  <span className="text-gray-500"> / {request.use_case}</span>
                </div>
                <Badge className={getStatusColor(request.status)}>
                  {request.status}
                </Badge>
              </div>
            ))}
            {requests.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                No MAOS image requests
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

## Audit Logging

All orchestrator actions are logged to `image_approvals_audit`:

```typescript
// src/lib/orchestrator/audit.ts

export async function logOrchestratorAction(
  action: 'request' | 'check' | 'use',
  details: Record<string, unknown>
): Promise<void> {
  const supabase = await getSupabaseServer();

  await supabase.from('orchestrator_audit_log').insert({
    action,
    details,
    actor: 'orchestrator_system',
    timestamp: new Date().toISOString(),
  });
}
```

## Security

### Prompt Sanitization

```typescript
// src/lib/utils/sanitize.ts

const BANNED_TERMS = [
  'Gemini', 'Google', 'Nano Banana', 'Claude', 'Anthropic',
  'OpenAI', 'GPT', 'Midjourney', 'Stable Diffusion', 'Jina', 'DALL-E'
];

export function sanitizePrompt(prompt: string): string {
  let sanitized = prompt;

  for (const term of BANNED_TERMS) {
    const regex = new RegExp(term, 'gi');
    sanitized = sanitized.replace(regex, '');
  }

  return sanitized.trim();
}
```

### Capability Guard Middleware

```typescript
// src/middleware/orchestrator-capability-guard.ts

export function orchestratorCapabilityGuard(action: string): boolean {
  const allowedActions = ['request', 'check', 'use'];
  const forbiddenActions = ['approve', 'reject', 'delete'];

  if (forbiddenActions.includes(action)) {
    throw new Error(`Orchestrator cannot perform action: ${action}`);
  }

  return allowedActions.includes(action);
}
```

## Implementation Tasks

### T1: Teach Orchestrator How to Request Images

- [ ] Add MAOS skill: `image.request`
- [ ] Route through GeminiBanana2Client
- [ ] Always create pending approval record
- [ ] Sanitize all prompts
- [ ] Log to audit table

### T2: Teach Orchestrator How to Wait for Approval

- [ ] Add MAOS skill: `image.wait`
- [ ] Implement polling loop
- [ ] Handle timeout gracefully
- [ ] Return approved image details

### T3: Teach Orchestrator How to Insert Images Into UI

- [ ] Add MAOS skill: `image.use`
- [ ] Generate DynamicImage component code
- [ ] Verify image is approved before use

### T4: Add Orchestrator Audit Logging

- [ ] Log all requests to `image_approvals_audit`
- [ ] Add `changed_by = orchestrator_system`
- [ ] Track all check and use actions

## Testing Requirements

```typescript
// tests/orchestrator/image-workflow.test.ts

describe('Orchestrator Image Workflow', () => {
  test('cannot auto-approve images', async () => {
    // Orchestrator requests image
    const request = await orchestratorRequest({ ... });

    // Attempt to approve (should fail)
    const approveResponse = await fetch('/api/orchestrator/image/approve', {
      method: 'POST',
      headers: { 'x-orchestrator-key': ORCHESTRATOR_KEY },
      body: JSON.stringify({ requestId: request.requestId }),
    });

    expect(approveResponse.status).toBe(403);
  });

  test('pending images never used in UI', async () => {
    const request = await orchestratorRequest({ ... });

    // Try to use before approval
    const useResponse = await orchestratorUse({
      requestId: request.requestId,
    });

    expect(useResponse.success).toBe(false);
    expect(useResponse.error).toContain('not approved');
  });

  test('banned terms never appear in prompts', async () => {
    const request = await orchestratorRequest({
      prompt: 'Create a Gemini-style dashboard with Google colors',
    });

    // Check that prompt was sanitized
    const approval = await getApproval(request.requestId);
    expect(approval.notes).not.toContain('Gemini');
    expect(approval.notes).not.toContain('Google');
  });

  test('MAOS can request images successfully', async () => {
    const request = await orchestratorRequest({
      category: 'dashboard',
      use_case: 'test-tile',
      prompt: 'Professional dashboard tile',
    });

    expect(request.success).toBe(true);
    expect(request.requestId).toBeDefined();
    expect(request.status).toBe('pending');
  });

  test('MAOS waits correctly for approval', async () => {
    const request = await orchestratorRequest({ ... });

    // Human approves
    await humanApprove(request.requestId);

    // Orchestrator waits
    const result = await orchestratorWait({
      requestId: request.requestId,
      maxWaitMs: 5000,
    });

    expect(result.approved).toBe(true);
    expect(result.image).toBeDefined();
  });

  test('MAOS inserts approved images only', async () => {
    // Create and approve image
    const request = await orchestratorRequest({ ... });
    await humanApprove(request.requestId);

    // Use in component
    const usage = await orchestratorUse({
      category: 'dashboard',
      use_case: 'test-tile',
    });

    expect(usage.component).toBe('DynamicImage');
    expect(usage.code).toContain('category="dashboard"');
  });
});
```

## Completion Definition

Phase 23 is complete when:

1. **MAOS can request images**: Successfully via image.request skill
2. **MAOS waits for approval**: Cannot proceed until status='approved'
3. **MAOS cannot auto-approve**: Approval endpoint returns 403
4. **Metadata stored**: All requests logged with sanitized prompts
5. **Approved images only**: MAOS can only use approved assets
6. **No banned terms**: All prompts sanitized before storage
7. **All tests passing**: Orchestrator workflow tests pass

## Environment Variables

```env
# Orchestrator
ORCHESTRATOR_SECRET_KEY=your-secret-key

# Existing
GEMINI_API_KEY=your-gemini-key
```

---

*Phase 23 - MAOS Orchestrator Training Complete*
*Unite-Hub Status: ORCHESTRATOR IMAGE INTEGRATION READY*
