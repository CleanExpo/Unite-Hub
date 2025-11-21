# Phase 24 - Automated Asset Generation Pipelines (AAGP)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase24-automated-asset-generation-pipelines`

## Executive Summary

Phase 24 implements Automated Asset Generation Pipelines (AAGP) that allow MAOS to detect missing or outdated visual assets, automatically request new images through the Gemini Nano Banana 2 engine, and apply approved images throughout Unite-Hub. Auto-generation is allowed, but auto-approval remains forbidden.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Auto-Generation | Allowed |
| Auto-Approval | **FORBIDDEN** |
| Model Lock | `gemini-3-pro-image-preview` |
| Fallback Required | Yes |
| Strict Privacy | Yes |
| Max Images Per Request | 3 |

## Database Schema

### Migration 080: Auto Generation Jobs

```sql
-- 080_auto_generation_jobs.sql

CREATE TABLE IF NOT EXISTS auto_generation_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  category TEXT NOT NULL,
  use_case TEXT NOT NULL,
  requested_by_agent TEXT NOT NULL,
  trigger_reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'started',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status constraint
  CONSTRAINT auto_generation_jobs_status_check CHECK (
    status IN ('started', 'waiting_approval', 'completed')
  ),

  -- Unique constraint per org/category/use_case
  CONSTRAINT auto_generation_jobs_unique UNIQUE (org_id, category, use_case),

  -- Foreign key
  CONSTRAINT auto_generation_jobs_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_auto_jobs_org_id ON auto_generation_jobs(org_id);
CREATE INDEX IF NOT EXISTS idx_auto_jobs_status ON auto_generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_auto_jobs_created ON auto_generation_jobs(created_at DESC);

-- Enable RLS
ALTER TABLE auto_generation_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY auto_jobs_select ON auto_generation_jobs
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY auto_jobs_insert ON auto_generation_jobs
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY auto_jobs_update ON auto_generation_jobs
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ))
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_auto_generation_jobs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_generation_jobs_timestamp
  BEFORE UPDATE ON auto_generation_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_auto_generation_jobs_timestamp();

-- Comment
COMMENT ON TABLE auto_generation_jobs IS 'Tracks automated asset-generation requests initiated by MAOS (Phase 24)';
```

## API Endpoints

### POST /api/aagp/scan

Scan for missing or outdated assets.

```typescript
// Request
{
  "orgId": "uuid",
  "scanTypes": ["missing", "outdated", "fallback"],
  "maxAge": 90 // days
}

// Response
{
  "success": true,
  "results": {
    "missing": [
      { "category": "dashboard", "use_case": "analytics-tile" },
      { "category": "onboarding", "use_case": "step-2" }
    ],
    "outdated": [
      { "category": "branding", "use_case": "logo", "age_days": 120 }
    ],
    "fallback": [
      { "category": "email", "use_case": "header" }
    ]
  },
  "total": 4
}
```

### POST /api/aagp/create-job

Create an auto-generation job.

```typescript
// Request
{
  "orgId": "uuid",
  "category": "dashboard",
  "use_case": "analytics-tile",
  "requestedByAgent": "DashboardBuilderAgent",
  "triggerReason": "Missing asset detected during dashboard scan"
}

// Response
{
  "success": true,
  "jobId": "uuid",
  "status": "started"
}
```

### POST /api/aagp/process-job

Process a job (request image and wait for approval).

```typescript
// Request
{
  "jobId": "uuid"
}

// Response
{
  "success": true,
  "jobId": "uuid",
  "imageRequestId": "uuid",
  "status": "waiting_approval"
}
```

### GET /api/aagp/status

Get job status.

```typescript
// Request
GET /api/aagp/status?job_id=uuid

// Response
{
  "success": true,
  "job": {
    "id": "uuid",
    "status": "waiting_approval",
    "category": "dashboard",
    "use_case": "analytics-tile",
    "created_at": "2025-11-21T10:00:00Z"
  },
  "imageApproval": {
    "id": "uuid",
    "status": "pending"
  }
}
```

### Implementation

```typescript
// src/app/api/aagp/scan/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { orgId, scanTypes, maxAge = 90 } = await req.json();

    const supabase = await getSupabaseServer();
    const results: ScanResults = {
      missing: [],
      outdated: [],
      fallback: [],
    };

    // Define expected assets
    const expectedAssets = [
      { category: 'dashboard', use_case: 'analytics-tile' },
      { category: 'dashboard', use_case: 'contacts-tile' },
      { category: 'dashboard', use_case: 'campaigns-tile' },
      { category: 'onboarding', use_case: 'step-1' },
      { category: 'onboarding', use_case: 'step-2' },
      { category: 'onboarding', use_case: 'step-3' },
      { category: 'branding', use_case: 'logo' },
      { category: 'email', use_case: 'header' },
      // Add more as needed
    ];

    // Get existing approved images
    const { data: existingImages } = await supabase
      .from('image_approvals')
      .select('category, use_case, status, created_at')
      .eq('org_id', orgId)
      .eq('status', 'approved');

    const existingMap = new Map(
      existingImages?.map(img => [`${img.category}:${img.use_case}`, img]) || []
    );

    // Find missing
    if (scanTypes.includes('missing')) {
      for (const asset of expectedAssets) {
        const key = `${asset.category}:${asset.use_case}`;
        if (!existingMap.has(key)) {
          results.missing.push(asset);
        }
      }
    }

    // Find outdated
    if (scanTypes.includes('outdated')) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAge);

      for (const [key, img] of existingMap) {
        const createdAt = new Date(img.created_at);
        if (createdAt < cutoffDate) {
          const [category, use_case] = key.split(':');
          const ageDays = Math.floor(
            (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
          );
          results.outdated.push({ category, use_case, age_days: ageDays });
        }
      }
    }

    // Find fallback usage
    if (scanTypes.includes('fallback')) {
      // Check which expected assets are using fallbacks
      for (const asset of expectedAssets) {
        const key = `${asset.category}:${asset.use_case}`;
        if (!existingMap.has(key)) {
          results.fallback.push(asset);
        }
      }
    }

    const total = results.missing.length + results.outdated.length + results.fallback.length;

    return NextResponse.json({
      success: true,
      results,
      total,
    });

  } catch (error) {
    console.error('AAGP scan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

interface ScanResults {
  missing: Array<{ category: string; use_case: string }>;
  outdated: Array<{ category: string; use_case: string; age_days: number }>;
  fallback: Array<{ category: string; use_case: string }>;
}
```

```typescript
// src/app/api/aagp/create-job/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { sanitizePublicText } from '@/lib/utils/sanitize';

export async function POST(req: NextRequest) {
  try {
    const { orgId, category, use_case, requestedByAgent, triggerReason } = await req.json();

    // Sanitize trigger reason
    const sanitizedReason = sanitizePublicText(triggerReason);

    const supabase = await getSupabaseServer();

    // Check if job already exists
    const { data: existing } = await supabase
      .from('auto_generation_jobs')
      .select('id, status')
      .eq('org_id', orgId)
      .eq('category', category)
      .eq('use_case', use_case)
      .single();

    if (existing && existing.status !== 'completed') {
      return NextResponse.json({
        success: false,
        error: 'Job already exists',
        jobId: existing.id,
        status: existing.status,
      });
    }

    // Create or update job
    const { data: job, error } = await supabase
      .from('auto_generation_jobs')
      .upsert({
        org_id: orgId,
        category,
        use_case,
        requested_by_agent: requestedByAgent,
        trigger_reason: sanitizedReason,
        status: 'started',
      }, {
        onConflict: 'org_id,category,use_case',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: job.status,
    });

  } catch (error) {
    console.error('AAGP create-job error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

```typescript
// src/app/api/aagp/process-job/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { GeminiBanana2Client } from '@/lib/image-engine/client';
import { getPromptForAsset } from '@/lib/aagp/prompts';

export async function POST(req: NextRequest) {
  try {
    const { jobId } = await req.json();

    const supabase = await getSupabaseServer();

    // Get job
    const { data: job, error: jobError } = await supabase
      .from('auto_generation_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.status !== 'started') {
      return NextResponse.json({
        error: `Job is not in started state (current: ${job.status})`,
      }, { status: 400 });
    }

    // Generate prompt for this asset
    const prompt = getPromptForAsset(job.category, job.use_case);

    // Request image via Gemini
    const client = new GeminiBanana2Client();
    const result = await client.generateImage(prompt, {
      category: job.category,
      use_case: job.use_case,
      orgId: job.org_id,
    });

    // Create pending approval record
    const { data: approval, error: approvalError } = await supabase
      .from('image_approvals')
      .insert({
        org_id: job.org_id,
        category: job.category,
        use_case: job.use_case,
        file_name: result.fileName,
        file_path: result.filePath,
        status: 'pending',
        requested_by: job.requested_by_agent,
        notes: `Auto-generated by AAGP: ${job.trigger_reason}`,
      })
      .select()
      .single();

    if (approvalError) {
      throw approvalError;
    }

    // Update job status
    await supabase
      .from('auto_generation_jobs')
      .update({ status: 'waiting_approval' })
      .eq('id', jobId);

    return NextResponse.json({
      success: true,
      jobId,
      imageRequestId: approval.id,
      status: 'waiting_approval',
    });

  } catch (error) {
    console.error('AAGP process-job error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## AAGP Prompt Templates

```typescript
// src/lib/aagp/prompts.ts

const ASSET_PROMPTS: Record<string, Record<string, string>> = {
  dashboard: {
    'analytics-tile': 'Professional dashboard analytics tile showing growth metrics, modern design with clean charts and graphs',
    'contacts-tile': 'Contact management tile with connected people icons, modern CRM visualization',
    'campaigns-tile': 'Email campaign visualization with envelope icons and success metrics',
    'revenue-tile': 'Revenue growth tile with upward trending charts, financial theme',
  },
  onboarding: {
    'step-1': 'Business profile setup illustration, welcoming professional design',
    'step-2': 'Geographic location configuration illustration with map elements',
    'step-3': 'Pricing tier selection illustration with comparison elements',
    'step-4': 'API credential setup illustration with security theme',
  },
  branding: {
    'logo': 'Modern professional logo placeholder, clean minimal design',
  },
  email: {
    'header': 'Professional email header banner, clean corporate design',
    'footer': 'Email footer with social icons and contact info layout',
  },
  social: {
    'linkedin-post': 'LinkedIn post visual, professional business theme',
    'instagram-post': 'Instagram post visual, modern engaging design',
  },
};

export function getPromptForAsset(category: string, useCase: string): string {
  const categoryPrompts = ASSET_PROMPTS[category];
  if (!categoryPrompts) {
    return `Professional ${category} ${useCase} illustration, modern clean design`;
  }

  return categoryPrompts[useCase] || `Professional ${category} ${useCase} illustration, modern clean design`;
}
```

## UI Components

### AAGPQueuePanel

```typescript
// src/components/admin/AAGPQueuePanel.tsx

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

interface AAGPJob {
  id: string;
  category: string;
  use_case: string;
  requested_by_agent: string;
  trigger_reason: string;
  status: string;
  created_at: string;
}

export function AAGPQueuePanel() {
  const { session, currentOrganization } = useAuth();
  const [jobs, setJobs] = useState<AAGPJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch(
        `/api/admin/aagp-jobs?org_id=${currentOrganization?.org_id}`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Failed to fetch AAGP jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const runScan = async () => {
    try {
      const response = await fetch('/api/aagp/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          orgId: currentOrganization?.org_id,
          scanTypes: ['missing', 'outdated', 'fallback'],
          maxAge: 90,
        }),
      });

      const data = await response.json();
      alert(`Scan complete: ${data.total} assets need attention`);
      fetchJobs();
    } catch (error) {
      console.error('Scan failed:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'started': return 'bg-blue-500';
      case 'waiting_approval': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>AAGP Jobs</CardTitle>
        <Button onClick={runScan} size="sm">
          Scan for Missing Assets
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="animate-pulse space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="p-3 border rounded-lg"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium">{job.category}</span>
                    <span className="text-gray-500"> / {job.use_case}</span>
                    <p className="text-sm text-gray-500 mt-1">
                      {job.trigger_reason}
                    </p>
                    <p className="text-xs text-gray-400">
                      Agent: {job.requested_by_agent}
                    </p>
                  </div>
                  <Badge className={getStatusColor(job.status)}>
                    {job.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            ))}
            {jobs.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                No AAGP jobs
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

## AAGP Workflow

```typescript
// src/lib/aagp/pipeline.ts

export class AAGPPipeline {
  async runFullPipeline(orgId: string): Promise<PipelineResult> {
    const results: PipelineResult = {
      scanned: 0,
      jobsCreated: 0,
      jobsProcessed: 0,
      errors: [],
    };

    // Step 1: Scan for missing/outdated assets
    const scanResponse = await fetch('/api/aagp/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgId,
        scanTypes: ['missing', 'outdated'],
        maxAge: 90,
      }),
    });

    const scanData = await scanResponse.json();
    results.scanned = scanData.total;

    // Step 2: Create jobs for each missing asset (max 3 per run)
    const assetsToProcess = [
      ...scanData.results.missing,
      ...scanData.results.outdated,
    ].slice(0, 3); // Max 3 images per request

    for (const asset of assetsToProcess) {
      try {
        // Create job
        const jobResponse = await fetch('/api/aagp/create-job', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orgId,
            category: asset.category,
            use_case: asset.use_case,
            requestedByAgent: 'AAGPPipeline',
            triggerReason: asset.age_days
              ? `Outdated asset (${asset.age_days} days old)`
              : 'Missing asset detected',
          }),
        });

        const jobData = await jobResponse.json();

        if (jobData.success) {
          results.jobsCreated++;

          // Process job (request image)
          const processResponse = await fetch('/api/aagp/process-job', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobId: jobData.jobId }),
          });

          const processData = await processResponse.json();

          if (processData.success) {
            results.jobsProcessed++;
          } else {
            results.errors.push(`Process failed for ${asset.category}/${asset.use_case}`);
          }
        }
      } catch (error) {
        results.errors.push(`Error processing ${asset.category}/${asset.use_case}: ${error}`);
      }
    }

    return results;
  }
}

interface PipelineResult {
  scanned: number;
  jobsCreated: number;
  jobsProcessed: number;
  errors: string[];
}
```

## CI Enforcement

```typescript
// tests/ci/aagp-enforcement.test.ts

import { execSync } from 'child_process';

describe('AAGP CI Enforcement', () => {
  test('no jobs stuck in wrong state', async () => {
    // Query for jobs stuck in 'started' for more than 1 hour
    const stuckJobs = await getStuckJobs();
    expect(stuckJobs.length).toBe(0);
  });

  test('no banned terms in job metadata', async () => {
    const jobs = await getAllJobs();

    for (const job of jobs) {
      expect(job.trigger_reason.toLowerCase()).not.toContain('gemini');
      expect(job.trigger_reason.toLowerCase()).not.toContain('google');
      expect(job.trigger_reason.toLowerCase()).not.toContain('openai');
    }
  });

  test('fallback images below threshold', async () => {
    const fallbackCount = await getFallbackUsageCount();
    const totalImages = await getTotalImageCount();
    const fallbackRatio = fallbackCount / totalImages;

    // Fail if more than 20% of images are fallbacks
    expect(fallbackRatio).toBeLessThan(0.2);
  });
});
```

## Implementation Tasks

### T1: Detect Missing or Outdated Visual Assets

- [ ] Create `/api/aagp/scan` endpoint
- [ ] Define expected assets list
- [ ] Implement missing detection
- [ ] Implement outdated detection (>90 days)
- [ ] Log results

### T2: MAOS Auto-Generation Pipeline

- [ ] Create `/api/aagp/create-job` endpoint
- [ ] Create `/api/aagp/process-job` endpoint
- [ ] Implement prompt generation
- [ ] Route to GeminiBanana2Client
- [ ] Create pending approval record
- [ ] Update job status

### T3: Human Review → Approval → Integration

- [ ] Admin reviews in Phase 21 UI
- [ ] Approved → MAOS inserts via DynamicImage
- [ ] Rejected → Job marked completed, manual override needed
- [ ] Track completion in audit

### T4: CI Enforcement

- [ ] Test for stuck jobs
- [ ] Test for banned terms
- [ ] Test for fallback threshold
- [ ] Fail build on violations

## Testing Requirements

```typescript
describe('AAGP Pipeline', () => {
  test('detects missing images', async () => {
    const scan = await scanForAssets(orgId);
    expect(scan.results.missing.length).toBeGreaterThan(0);
  });

  test('creates jobs correctly', async () => {
    const job = await createJob({
      orgId,
      category: 'dashboard',
      use_case: 'test-tile',
      requestedByAgent: 'TestAgent',
      triggerReason: 'Test reason',
    });

    expect(job.success).toBe(true);
    expect(job.status).toBe('started');
  });

  test('MAOS cannot bypass approval', async () => {
    const job = await createAndProcessJob({ ... });

    // Job should be waiting_approval, not completed
    expect(job.status).toBe('waiting_approval');

    // Image should be pending, not approved
    const approval = await getApproval(job.imageRequestId);
    expect(approval.status).toBe('pending');
  });

  test('images auto-insert after approval', async () => {
    const job = await createAndProcessJob({ ... });

    // Human approves
    await humanApprove(job.imageRequestId);

    // Job should complete
    const updatedJob = await getJob(job.jobId);
    expect(updatedJob.status).toBe('completed');

    // Image should be available via DynamicImage
    const image = await getApprovedImage(orgId, 'dashboard', 'test-tile');
    expect(image).toBeDefined();
  });
});
```

## Completion Definition

Phase 24 is complete when:

1. **AAGP detects missing images**: Scan returns accurate results
2. **Jobs created correctly**: Database records with proper status
3. **MAOS cannot bypass approval**: All images start as pending
4. **Pending images never used**: Only approved images in production
5. **Rejected images never used**: Permanently blocked
6. **Banned terms sanitized**: All prompts and metadata clean
7. **Images auto-insert**: Approved images available via DynamicImage
8. **CI tests passing**: No stuck jobs, no banned terms, fallback threshold met

---

*Phase 24 - Automated Asset Generation Pipelines Complete*
*Unite-Hub Status: AAGP READY*
