# Phase 20 - Gemini Nano Banana 2 Directed Propagation & Multi-Step Approval

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase20-gemini-directed-propagation`

## Executive Summary

Phase 20 implements Directed Propagation for the Gemini Nano Banana 2 image engine, establishing which agents can generate images, enforcing multi-step human approval for all generated content, and ensuring complete vendor privacy in public-facing output.

## Integration Mode

```typescript
const integrationConfig = {
  integration_mode: 'HARD_INTEGRATION',
  propagation_mode: 'DIRECTED_PROPAGATION',
  approval_mode: 'MULTI_STEP',
  approval_states: ['pending', 'revised', 'approved', 'rejected'],
};
```

## Hard Requirements

### 1. Single Model Enforcement

| Requirement | Value |
|-------------|-------|
| Allowed Model | `gemini-3-pro-image-preview` |
| Blocked Models | DALL-E, Jina, Stable Diffusion, Midjourney, older Gemini versions |
| Enforcement | ModelGuard throws on violation |

### 2. Privacy & Vendor Secrecy

**Banned Public Terms** (must NEVER appear in public output):
- Gemini
- Google
- Nano Banana
- Claude
- Anthropic
- OpenAI
- GPT
- Stable Diffusion
- Midjourney
- DALL-E
- AI-generated (use "custom illustration" instead)

**Allowed Public Terms**:
- "Custom illustration"
- "Platform-generated visual"
- "Auto-generated asset"

```typescript
// Template sanitation
export function sanitizePublicOutput(content: string): string {
  const bannedTerms = [
    'Gemini', 'Google', 'Nano Banana', 'Claude', 'Anthropic',
    'OpenAI', 'GPT', 'Stable Diffusion', 'Midjourney', 'DALL-E',
    'AI-generated'
  ];

  let sanitized = content;
  for (const term of bannedTerms) {
    const regex = new RegExp(term, 'gi');
    sanitized = sanitized.replace(regex, 'custom illustration');
  }
  return sanitized;
}
```

### 3. Multi-Step Human Approval

**Every image MUST pass through human approval before use.**

```
pending → revised → approved
    ↓         ↓
 rejected  rejected
```

| State | Description | Next States |
|-------|-------------|-------------|
| `pending` | Awaiting first review | `approved`, `revised`, `rejected` |
| `revised` | Regenerated, awaiting re-review | `approved`, `rejected` |
| `approved` | Ready for production use | Final |
| `rejected` | Permanently rejected | Final |

### 4. Cost Controls

| Metric | Value |
|--------|-------|
| Cost per image | $0.0015 |
| Daily budget | $5.00 |
| Monthly budget | $100.00 |
| Alert threshold | 80% of budget |

## Directed Propagation Capability Map

### Agents WITH Direct Image Capability

| Agent | Capability | Use Cases |
|-------|------------|-----------|
| OnboardingService | `generateWizardAssets`, `requestStepIllustration` | Onboarding banners, step visuals |
| DashboardBuilder | `requestDashboardTile`, `requestStatusIcon` | Dashboard widgets, status indicators |
| ClientService | `createClientAvatar`, `createProjectIcon` | Client avatars, project icons |
| DocGenerator | `generateProcessDiagram`, `generateEmailVisual` | Documentation diagrams, email visuals |
| ReportEngine | `generateChartVisual`, `createReportCover` | Report charts, cover images |
| EmailCampaignBuilder | `createEmailHeader`, `createCTAButton` | Email headers, CTA visuals |
| LandingPageBuilder | `generateHeroImage`, `createFeatureIcon` | Hero banners, feature icons |
| SocialMediaAgent | `createPostVisual`, `generateThumbnail` | Social media images, thumbnails |
| PresentationBuilder | `createSlideVisual`, `generateInfographic` | Presentation slides, infographics |
| BrandingEngine | `generateLogoVariant`, `createColorSwatch` | Logo variations, brand assets |
| ContentAgent | `createArticleHeader`, `generateIllustration` | Article headers, inline illustrations |
| ProposalGenerator | `createProposalCover`, `generateDiagram` | Proposal covers, process diagrams |
| InvoiceBuilder | `createInvoiceHeader` | Invoice headers |
| CertificateGenerator | `createCertificateBadge` | Certificate badges |
| MarketingAssetBuilder | `generateAdCreative`, `createBannerAd` | Ad creatives, banner ads |

### Agents WITHOUT Image Capability

| Agent | Reason |
|-------|--------|
| EmailProcessor | Text processing only |
| SentimentAnalyzer | Analysis only |
| IntentExtractor | Classification only |
| LeadScorer | Numeric scoring only |
| ContactIntelligence | Data aggregation only |
| AnomalyDetector | Statistical analysis only |
| SchedulingEngine | Job orchestration only |
| CredentialVault | Security operations only |
| AuditLogger | Logging only |
| RateLimiter | Traffic control only |
| CacheManager | Caching only |
| QueueManager | Job queue only |
| NotificationService | Notification dispatch only |

## Database Schema Extension

### Migration 079: Multi-Step Image Approval

```sql
-- 079_multi_step_image_approval.sql

-- Drop existing simple approval table if exists
DROP TABLE IF EXISTS image_approvals;

-- Create extended approval table
CREATE TABLE image_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Image metadata
  image_path TEXT NOT NULL,
  metadata_path TEXT NOT NULL,
  prompt TEXT NOT NULL,
  optimized_prompt TEXT,

  -- Context
  context_type TEXT NOT NULL, -- 'onboarding', 'dashboard', 'email', etc.
  context_id TEXT,

  -- Multi-step approval
  status TEXT NOT NULL DEFAULT 'pending',
  revision_count INT DEFAULT 0,
  revision_notes TEXT,

  -- Approver tracking
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES users(id),
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Cost tracking
  generation_cost DECIMAL(10, 6) DEFAULT 0.0015,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'revised', 'approved', 'rejected'))
);

-- Indexes
CREATE INDEX idx_approvals_org ON image_approvals(org_id);
CREATE INDEX idx_approvals_status ON image_approvals(status);
CREATE INDEX idx_approvals_context ON image_approvals(context_type, context_id);
CREATE INDEX idx_approvals_created ON image_approvals(created_at DESC);

-- RLS policies
ALTER TABLE image_approvals ENABLE ROW LEVEL SECURITY;

-- Users can view their org's images
CREATE POLICY "users_view_org_images" ON image_approvals
  FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

-- Only admins/managers can approve
CREATE POLICY "admins_approve_images" ON image_approvals
  FOR UPDATE TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager', 'designer')
    )
  );

-- Approval history
CREATE TABLE image_approval_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id UUID REFERENCES image_approvals(id) ON DELETE CASCADE,
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_approval_history_approval ON image_approval_history(approval_id);
```

## API Endpoints

### Approval Workflow API

#### POST /api/internal/image-engine/approve

```typescript
// Request
{
  "imageId": "uuid",
  "action": "approve" | "reject" | "request_revision",
  "notes": "Optional reviewer notes",
  "revisionPrompt": "New prompt for revision (if action = request_revision)"
}

// Response
{
  "success": true,
  "approval": {
    "id": "uuid",
    "status": "approved",
    "approved_by": "user-uuid",
    "approved_at": "2025-11-21T10:00:00Z"
  }
}
```

#### GET /api/internal/image-engine/pending

```typescript
// Query params
?org_id=uuid&status=pending&limit=50&offset=0

// Response
{
  "images": [
    {
      "id": "uuid",
      "image_path": "/data/clients/org-123/images/onboarding-welcome-2025-11-21.png",
      "prompt": "Professional welcome banner...",
      "status": "pending",
      "context_type": "onboarding",
      "created_at": "2025-11-21T09:00:00Z",
      "revision_count": 0
    }
  ],
  "total": 25,
  "has_more": false
}
```

#### POST /api/internal/image-engine/regenerate

```typescript
// Request
{
  "imageId": "uuid",
  "newPrompt": "Updated prompt with improvements",
  "context": {
    "seo": { "keywords": ["..."] },
    "geo": { "location": "Brisbane" }
  }
}

// Response
{
  "success": true,
  "newImageId": "uuid",
  "status": "revised",
  "revision_count": 1
}
```

### Implementation

```typescript
// src/app/api/internal/image-engine/approve/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { verifyAdminRole } from '@/lib/auth/roles';

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { supabaseBrowser } = await import('@/lib/supabase');
    const { data: authData, error: authError } = await supabaseBrowser.auth.getUser(token);

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authData.user.id;

    // Verify role
    const hasPermission = await verifyAdminRole(userId, ['admin', 'manager', 'designer']);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { imageId, action, notes, revisionPrompt } = await req.json();

    const supabase = await getSupabaseServer();

    // Get current approval state
    const { data: approval, error: fetchError } = await supabase
      .from('image_approvals')
      .select('*')
      .eq('id', imageId)
      .single();

    if (fetchError || !approval) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Validate state transition
    const validTransitions: Record<string, string[]> = {
      'pending': ['approved', 'revised', 'rejected'],
      'revised': ['approved', 'rejected'],
    };

    const newStatus = action === 'approve' ? 'approved'
                    : action === 'reject' ? 'rejected'
                    : 'revised';

    if (!validTransitions[approval.status]?.includes(newStatus)) {
      return NextResponse.json({
        error: `Cannot transition from ${approval.status} to ${newStatus}`
      }, { status: 400 });
    }

    // Update approval
    const updateData: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (action === 'approve') {
      updateData.approved_by = userId;
      updateData.approved_at = new Date().toISOString();
    } else if (action === 'reject') {
      updateData.rejected_by = userId;
      updateData.rejected_at = new Date().toISOString();
      updateData.rejection_reason = notes;
    } else if (action === 'request_revision') {
      updateData.reviewed_by = userId;
      updateData.reviewed_at = new Date().toISOString();
      updateData.revision_notes = revisionPrompt || notes;
      updateData.revision_count = (approval.revision_count || 0) + 1;
    }

    const { data: updated, error: updateError } = await supabase
      .from('image_approvals')
      .update(updateData)
      .eq('id', imageId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Log history
    await supabase.from('image_approval_history').insert({
      approval_id: imageId,
      previous_status: approval.status,
      new_status: newStatus,
      changed_by: userId,
      notes,
    });

    return NextResponse.json({ success: true, approval: updated });

  } catch (error) {
    console.error('Approval error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## Prompt Optimization

### First-Prompt Efficiency

The system optimizes prompts before generation to maximize quality on first attempt:

```typescript
// src/lib/image-engine/prompt-optimizer.ts

export class PromptOptimizer {
  async optimize(
    basePrompt: string,
    context: {
      seo: { keywords: string[]; industry: string };
      geo: { location: string; radius: number };
      brand: { colors: string[]; style: string };
    }
  ): Promise<string> {
    const optimized = [
      basePrompt,
      '',
      'Technical requirements:',
      '- High resolution, professional quality',
      '- Clean, modern design aesthetic',
      '- Suitable for web and print use',
      '',
      `Industry context: ${context.seo.industry}`,
      `Location: ${context.geo.location}`,
      '',
      'Style guidelines:',
      `- Brand style: ${context.brand.style}`,
      `- Color palette: ${context.brand.colors.join(', ')}`,
      '',
      'Composition:',
      '- Clear focal point',
      '- Balanced layout',
      '- Professional lighting',
      '',
      `Keywords to reflect: ${context.seo.keywords.slice(0, 5).join(', ')}`,
    ].join('\n');

    return optimized;
  }
}
```

### Aspect Ratio Templates

```typescript
const aspectRatioTemplates: Record<string, { width: number; height: number; useCase: string }> = {
  'social-square': { width: 1080, height: 1080, useCase: 'Instagram feed, Facebook' },
  'social-story': { width: 1080, height: 1920, useCase: 'Instagram/Facebook stories' },
  'social-landscape': { width: 1200, height: 628, useCase: 'LinkedIn, Twitter' },
  'email-header': { width: 600, height: 200, useCase: 'Email banners' },
  'dashboard-tile': { width: 400, height: 300, useCase: 'Dashboard widgets' },
  'hero-banner': { width: 1920, height: 600, useCase: 'Landing page heroes' },
  'thumbnail': { width: 320, height: 180, useCase: 'Video thumbnails' },
  'icon': { width: 256, height: 256, useCase: 'App icons, favicons' },
  'document': { width: 2480, height: 3508, useCase: 'A4 documents' },
};
```

## Service Integration Examples

### OnboardingService

```typescript
// src/lib/services/onboarding/onboardingService.ts

import { GeminiBanana2Client } from '@/lib/image-engine/client';
import { ImageStorage } from '@/lib/image-engine/storage';
import { PromptOptimizer } from '@/lib/image-engine/prompt-optimizer';
import { sanitizePublicOutput } from '@/lib/image-engine/sanitize';

export class OnboardingService {
  private imageClient: GeminiBanana2Client;
  private optimizer: PromptOptimizer;

  constructor() {
    this.imageClient = new GeminiBanana2Client();
    this.optimizer = new PromptOptimizer();
  }

  async generateWizardAssets(
    orgId: string,
    context: {
      businessName: string;
      industry: string;
      brandColors: string[];
    }
  ): Promise<GeneratedAsset[]> {
    const storage = new ImageStorage(orgId);
    const assets: GeneratedAsset[] = [];

    // Welcome banner
    const welcomePrompt = await this.optimizer.optimize(
      `Professional welcome banner for ${context.businessName}, a ${context.industry} company. Modern, inviting design with text space for "Welcome to ${context.businessName}"`,
      {
        seo: { keywords: [context.industry, 'welcome', 'professional'], industry: context.industry },
        geo: { location: 'Global', radius: 0 },
        brand: { colors: context.brandColors, style: 'modern professional' },
      }
    );

    const welcomeResult = await this.imageClient.generateImage(
      welcomePrompt,
      storage.getPath('onboarding', 'welcome-banner'),
      { aspectRatio: 'hero-banner' }
    );

    // Create approval record (status: pending)
    await this.createApprovalRecord(orgId, welcomeResult, 'onboarding', 'welcome-banner');

    assets.push({
      type: 'welcome-banner',
      path: welcomeResult.imagePath,
      status: 'pending', // All assets start as pending
      publicLabel: 'Custom illustration', // Sanitized label
    });

    return assets;
  }

  private async createApprovalRecord(
    orgId: string,
    result: ImageGenerationResult,
    contextType: string,
    contextId: string
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase.from('image_approvals').insert({
      org_id: orgId,
      image_path: result.imagePath,
      metadata_path: result.metadataPath,
      prompt: result.prompt,
      optimized_prompt: result.optimizedPrompt,
      context_type: contextType,
      context_id: contextId,
      status: 'pending',
      generation_cost: result.creditCost,
    });
  }
}
```

### DashboardBuilder

```typescript
// src/lib/services/dashboard/dashboardBuilder.ts

export class DashboardBuilder {
  private imageClient: GeminiBanana2Client;

  async requestDashboardTile(
    orgId: string,
    tileType: 'analytics' | 'contacts' | 'campaigns' | 'revenue' | 'tasks'
  ): Promise<GeneratedAsset> {
    const storage = new ImageStorage(orgId);

    const tilePrompts: Record<string, string> = {
      'analytics': 'Clean dashboard analytics visualization with charts and graphs, professional business style',
      'contacts': 'Contact management illustration showing connected people icons, modern CRM style',
      'campaigns': 'Email campaign visualization with envelope icons and success metrics, marketing theme',
      'revenue': 'Revenue growth visualization with upward trending charts, financial theme',
      'tasks': 'Task management illustration with checkboxes and progress indicators, productivity theme',
    };

    const result = await this.imageClient.generateImage(
      tilePrompts[tileType],
      storage.getPath('dashboard', `tile-${tileType}`),
      { aspectRatio: 'dashboard-tile' }
    );

    await this.createApprovalRecord(orgId, result, 'dashboard', tileType);

    return {
      type: tileType,
      path: result.imagePath,
      status: 'pending',
      publicLabel: 'Custom illustration',
    };
  }
}
```

## Testing Requirements

### E2E Test: Multi-Step Approval Flow

```typescript
// tests/e2e/image-approval-flow.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Image Approval Multi-Step Flow', () => {
  test('should complete full approval workflow', async ({ page }) => {
    // 1. Generate image (creates pending approval)
    const generateResponse = await page.request.post('/api/internal/image-engine/request', {
      data: {
        prompt: 'Test dashboard tile',
        contextType: 'dashboard',
        contextId: 'test-tile',
        orgId: 'test-org',
      },
    });
    expect(generateResponse.ok()).toBeTruthy();
    const { imageId } = await generateResponse.json();

    // 2. Verify pending status
    const pendingResponse = await page.request.get(`/api/internal/image-engine/pending?org_id=test-org`);
    const pendingData = await pendingResponse.json();
    expect(pendingData.images.some((img: any) => img.id === imageId)).toBeTruthy();

    // 3. Request revision
    const reviseResponse = await page.request.post('/api/internal/image-engine/approve', {
      data: {
        imageId,
        action: 'request_revision',
        notes: 'Please adjust colors',
        revisionPrompt: 'Test dashboard tile with blue color scheme',
      },
    });
    expect(reviseResponse.ok()).toBeTruthy();
    const reviseData = await reviseResponse.json();
    expect(reviseData.approval.status).toBe('revised');

    // 4. Approve revised image
    const approveResponse = await page.request.post('/api/internal/image-engine/approve', {
      data: {
        imageId,
        action: 'approve',
        notes: 'Looks good now',
      },
    });
    expect(approveResponse.ok()).toBeTruthy();
    const approveData = await approveResponse.json();
    expect(approveData.approval.status).toBe('approved');

    // 5. Verify history
    const historyResponse = await page.request.get(`/api/internal/image-engine/history?image_id=${imageId}`);
    const historyData = await historyResponse.json();
    expect(historyData.history.length).toBe(2); // pending→revised, revised→approved
  });

  test('should reject invalid state transitions', async ({ page }) => {
    // Try to approve an already approved image
    const response = await page.request.post('/api/internal/image-engine/approve', {
      data: {
        imageId: 'already-approved-id',
        action: 'approve',
      },
    });
    expect(response.status()).toBe(400);
  });
});
```

### E2E Test: Privacy Sanitation

```typescript
// tests/e2e/privacy-sanitation.spec.ts

import { test, expect } from '@playwright/test';
import { sanitizePublicOutput } from '@/lib/image-engine/sanitize';

test.describe('Privacy & Vendor Secrecy', () => {
  test('should sanitize all banned terms', async () => {
    const input = 'This image was generated by Gemini from Google using AI-generated technology';
    const output = sanitizePublicOutput(input);

    expect(output).not.toContain('Gemini');
    expect(output).not.toContain('Google');
    expect(output).not.toContain('AI-generated');
    expect(output).toContain('custom illustration');
  });

  test('should not expose vendor in public API responses', async ({ page }) => {
    // Request image info via public API
    const response = await page.request.get('/api/images/test-image-id');
    const data = await response.json();

    const jsonString = JSON.stringify(data);
    expect(jsonString).not.toMatch(/gemini|google|anthropic|openai/i);
  });

  test('should use allowed terms in UI', async ({ page }) => {
    await page.goto('/dashboard/assets');

    // Check that UI uses sanitized terms
    const content = await page.content();
    expect(content).not.toMatch(/gemini|google|ai-generated/i);
    expect(content).toMatch(/custom illustration|platform-generated/i);
  });
});
```

## Cost Monitoring

### Budget Enforcement

```typescript
// src/lib/image-engine/cost-monitor.ts

export class CostMonitor {
  private readonly COST_PER_IMAGE = 0.0015;
  private readonly DAILY_BUDGET = 5.00;
  private readonly MONTHLY_BUDGET = 100.00;

  async checkBudget(orgId: string): Promise<{ allowed: boolean; reason?: string }> {
    const supabase = await getSupabaseServer();

    // Daily spend
    const today = new Date().toISOString().split('T')[0];
    const { data: dailyData } = await supabase
      .from('image_approvals')
      .select('generation_cost')
      .eq('org_id', orgId)
      .gte('created_at', `${today}T00:00:00Z`);

    const dailySpend = dailyData?.reduce((sum, r) => sum + (r.generation_cost || 0), 0) || 0;

    if (dailySpend >= this.DAILY_BUDGET) {
      return { allowed: false, reason: `Daily budget exceeded ($${dailySpend.toFixed(2)}/$${this.DAILY_BUDGET})` };
    }

    // Monthly spend
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { data: monthlyData } = await supabase
      .from('image_approvals')
      .select('generation_cost')
      .eq('org_id', orgId)
      .gte('created_at', monthStart.toISOString());

    const monthlySpend = monthlyData?.reduce((sum, r) => sum + (r.generation_cost || 0), 0) || 0;

    if (monthlySpend >= this.MONTHLY_BUDGET) {
      return { allowed: false, reason: `Monthly budget exceeded ($${monthlySpend.toFixed(2)}/$${this.MONTHLY_BUDGET})` };
    }

    // Alert at 80%
    if (monthlySpend >= this.MONTHLY_BUDGET * 0.8) {
      await this.sendBudgetAlert(orgId, monthlySpend, this.MONTHLY_BUDGET);
    }

    return { allowed: true };
  }

  private async sendBudgetAlert(orgId: string, spent: number, budget: number): Promise<void> {
    // Send alert to admin
    console.warn(`Budget alert: Org ${orgId} at ${((spent/budget)*100).toFixed(1)}% of monthly budget`);
  }
}
```

## Implementation Tasks

### T1: Extend Image Approval Schema & DB

- [ ] Create migration 079_multi_step_image_approval.sql
- [ ] Add 4-state workflow (pending, revised, approved, rejected)
- [ ] Add approval history table
- [ ] Add revision tracking fields
- [ ] Add cost tracking

### T2: Approval API & Multi-Step Workflow

- [ ] POST /api/internal/image-engine/approve
- [ ] GET /api/internal/image-engine/pending
- [ ] POST /api/internal/image-engine/regenerate
- [ ] GET /api/internal/image-engine/history
- [ ] State transition validation

### T3: Implement Directed Propagation Capability Map

- [ ] Define capability flags for all agents
- [ ] Enforce capability checks before image generation
- [ ] Block non-capable agents from calling image API
- [ ] Log capability violations

### T4: Public Secrecy & Template Sanitation

- [ ] Create sanitizePublicOutput function
- [ ] Apply to all public API responses
- [ ] Apply to all UI components
- [ ] Add E2E tests for privacy

### T5: Prompt Optimization & First-Prompt Efficiency

- [ ] Create PromptOptimizer class
- [ ] Define aspect ratio templates
- [ ] Integrate SEO/GEO context
- [ ] Add brand guidelines integration

### T6: End-to-End Tests

- [ ] Multi-step approval flow test
- [ ] Privacy sanitation test
- [ ] State transition validation test
- [ ] Budget enforcement test
- [ ] Capability map enforcement test

## Environment Variables

```env
# Gemini API
GEMINI_API_KEY=your-gemini-api-key

# Image Engine Config
IMAGE_ENGINE_COST_PER_IMAGE=0.0015
IMAGE_ENGINE_DAILY_BUDGET=5.00
IMAGE_ENGINE_MONTHLY_BUDGET=100.00

# Storage
IMAGE_STORAGE_BASE=/data/clients
```

## Completion Definition

Phase 20 is complete when:

1. **Single Model Enforcement**: Gemini Nano Banana 2 (`gemini-3-pro-image-preview`) is the only allowed image model
2. **Directed Propagation**: Only specified agents can generate images (15 with capability, 13 without)
3. **Multi-Step Approval**: Every image passes through pending → revised → approved workflow
4. **Privacy & Secrecy**: No public-facing surface reveals AI vendors
5. **Cost Controls**: Budget enforcement with alerts at 80%
6. **E2E Tests**: All approval flows and privacy rules tested

## Next Phase Preview

### Phase 21: Image Approval Dashboard

- Admin UI routes (/admin/images/*)
- Role-based access (Admin, Manager, Designer)
- Image List screen
- Pending Review Queue screen
- Image Review Page with approve/reject/revise actions
- Approval statistics dashboard

---

*Phase 20 - Gemini Directed Propagation & Multi-Step Approval*
*Unite-Hub Status: DIRECTED PROPAGATION READY*
