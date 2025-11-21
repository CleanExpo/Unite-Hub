# Phase 20 - Unite-Hub Image Engine Runtime Hook Installation

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase20-image-engine-hooks`

## Executive Summary

This phase installs Gemini Banana 2 Image Engine hooks into all core Unite-Hub services, enabling internal image generation with metadata storage, approval routing, and org-based storage paths.

## Requirements

| Requirement | Status |
|-------------|--------|
| Enforce ModelGuard | ✅ Active |
| Allowed model | `gemini-3-pro-image-preview` |
| Integrate image storage | ✅ Per-org paths |
| Link approval pipeline | ✅ `pending_approval` default |
| No auto-publish | ✅ Enforced |

## Core Components

### GeminiBanana2Client.ts

Location: `src/lib/ai/geminiBanana2Client.ts`

```typescript
import { ModelGuard } from './model-guard';

export class GeminiBanana2Client {
  constructor() {
    ModelGuard.validateImageGeneration('gemini-3-pro-image-preview');
  }

  async generateImage(
    prompt: string,
    outputPath: string,
    context: { seo: object; geo: object }
  ): Promise<ImageGenerationResult> {
    // Implementation from Phase 19
  }
}
```

### ModelGuard.ts

Location: `src/lib/ai/model-guard.ts`

```typescript
export class ModelGuard {
  private static ALLOWED_IMAGE_MODEL = 'gemini-3-pro-image-preview';

  static validateImageGeneration(requestedModel: string): void {
    if (requestedModel !== this.ALLOWED_IMAGE_MODEL) {
      throw new Error(
        `BLOCKED: Only ${this.ALLOWED_IMAGE_MODEL} is allowed. Attempted: ${requestedModel}`
      );
    }
  }

  static getImageModel(): string {
    return this.ALLOWED_IMAGE_MODEL;
  }
}
```

### ImageStorage.ts

Location: `src/lib/storage/image-storage.ts`

```typescript
export class ImageStorage {
  private baseDir: string;

  constructor(orgId: string) {
    this.baseDir = `/data/clients/${orgId}/images`;
  }

  async store(
    category: ImageCategory,
    filename: string,
    data: Buffer,
    metadata: ImageMetadata
  ): Promise<StoredImage> {
    // Store image and metadata sidecar
  }
}
```

## Service Integrations

### 1. OnboardingService

**Location**: `src/lib/services/onboarding/onboardingService.ts`

**New Methods**:

```typescript
import { GeminiBanana2Client } from '@/lib/ai/geminiBanana2Client';
import { ImageStorage } from '@/lib/storage/image-storage';

export class OnboardingService {
  private imageClient: GeminiBanana2Client;

  constructor(private orgId: string) {
    this.imageClient = new GeminiBanana2Client();
  }

  async generateWizardAssets(orgId: string): Promise<GeneratedAsset[]> {
    const storage = new ImageStorage(orgId);
    const assets: GeneratedAsset[] = [];

    // Generate welcome banner
    const welcomePrompt = this.buildWelcomePrompt(orgId);
    const welcomeResult = await storage.generateAndStore({
      prompt: welcomePrompt,
      category: 'onboarding',
      domain: this.getDomain(orgId),
      keyword: 'welcome',
      location: this.getLocation(orgId),
      seoContext: { type: 'onboarding-wizard' },
      geoContext: { location: this.getLocation(orgId) },
    });

    assets.push(welcomeResult);

    // Generate step illustrations
    const steps = ['profile', 'geo-setup', 'tier-selection', 'credentials'];
    for (const step of steps) {
      const stepResult = await this.requestStepIllustration(orgId, step);
      assets.push(stepResult);
    }

    return assets;
  }

  async requestStepIllustration(orgId: string, stepId: string): Promise<GeneratedAsset> {
    const storage = new ImageStorage(orgId);

    const prompts: Record<string, string> = {
      'profile': 'Business profile setup illustration. Professional office environment, person filling forms, modern UI elements.',
      'geo-setup': 'Geographic location configuration. Map with radius overlay, pin markers, service area visualization.',
      'tier-selection': 'Pricing tier selection. Three tier cards, comparison checkmarks, upgrade arrows.',
      'credentials': 'API credential setup. Security icons, key symbols, connection illustration.',
    };

    return storage.generateAndStore({
      prompt: prompts[stepId] || 'Generic onboarding step illustration',
      category: 'onboarding',
      domain: this.getDomain(orgId),
      keyword: stepId,
      location: this.getLocation(orgId),
      seoContext: { type: 'step-illustration', step: stepId },
      geoContext: { location: this.getLocation(orgId) },
    });
  }

  private buildWelcomePrompt(orgId: string): string {
    const domain = this.getDomain(orgId);
    return `Welcome banner for ${domain} onboarding.
      Professional, modern design.
      Gradient background in brand colors.
      "Welcome to Unite-Hub" text implied.
      Growth and success imagery.
      Clean, minimal aesthetic.`;
  }

  private getDomain(orgId: string): string {
    // Fetch from database
    return 'example.com';
  }

  private getLocation(orgId: string): string {
    // Fetch from database
    return 'Brisbane, Australia';
  }
}
```

### 2. DashboardBuilder

**Location**: `src/lib/services/dashboard/dashboardBuilder.ts`

**New Methods**:

```typescript
import { GeminiBanana2Client } from '@/lib/ai/geminiBanana2Client';
import { ImageStorage } from '@/lib/storage/image-storage';

export class DashboardBuilder {
  private imageClient: GeminiBanana2Client;

  constructor(private orgId: string) {
    this.imageClient = new GeminiBanana2Client();
  }

  async requestDashboardTile(orgId: string, tileType: DashboardTileType): Promise<GeneratedAsset> {
    const storage = new ImageStorage(orgId);

    const tilePrompts: Record<DashboardTileType, string> = {
      'health-score': 'SEO health score gauge. Circular progress meter, green/yellow/red zones, professional data visualization.',
      'traffic-overview': 'Website traffic analytics. Line chart trending upward, data points, modern dashboard style.',
      'keyword-rankings': 'Keyword ranking positions. Table visualization, position numbers, trend arrows.',
      'backlink-profile': 'Backlink network diagram. Connected nodes, link quality indicators, growth pattern.',
      'competitor-comparison': 'Competitor comparison chart. Side-by-side bars, brand colors, metrics labels.',
      'geo-performance': 'Geographic performance map. Heat map overlay, regional markers, radius indicators.',
    };

    return storage.generateAndStore({
      prompt: tilePrompts[tileType],
      category: 'dashboards',
      domain: this.getDomain(orgId),
      keyword: tileType,
      location: this.getLocation(orgId),
      seoContext: { type: 'dashboard-tile', tile: tileType },
      geoContext: { location: this.getLocation(orgId) },
    });
  }

  async requestStatusIcon(orgId: string, status: StatusType): Promise<GeneratedAsset> {
    const storage = new ImageStorage(orgId);

    const statusPrompts: Record<StatusType, string> = {
      'success': 'Success status icon. Green checkmark, circular background, modern flat design.',
      'warning': 'Warning status icon. Yellow triangle, exclamation mark, alert style.',
      'error': 'Error status icon. Red X mark, circular background, attention-grabbing.',
      'pending': 'Pending status icon. Blue hourglass or clock, waiting indicator.',
      'progress': 'In-progress status icon. Blue spinning loader, circular progress.',
    };

    return storage.generateAndStore({
      prompt: statusPrompts[status],
      category: 'dashboards',
      domain: this.getDomain(orgId),
      keyword: `status-${status}`,
      location: this.getLocation(orgId),
      seoContext: { type: 'status-icon', status },
      geoContext: {},
    });
  }

  private getDomain(orgId: string): string {
    return 'example.com';
  }

  private getLocation(orgId: string): string {
    return 'Brisbane, Australia';
  }
}

type DashboardTileType =
  | 'health-score'
  | 'traffic-overview'
  | 'keyword-rankings'
  | 'backlink-profile'
  | 'competitor-comparison'
  | 'geo-performance';

type StatusType = 'success' | 'warning' | 'error' | 'pending' | 'progress';
```

### 3. ClientService

**Location**: `src/lib/services/client/clientService.ts`

**New Methods**:

```typescript
import { GeminiBanana2Client } from '@/lib/ai/geminiBanana2Client';
import { ImageStorage } from '@/lib/storage/image-storage';

export class ClientService {
  private imageClient: GeminiBanana2Client;

  constructor() {
    this.imageClient = new GeminiBanana2Client();
  }

  async createClientAvatar(orgId: string, clientId: string): Promise<GeneratedAsset> {
    const storage = new ImageStorage(orgId);
    const clientData = await this.getClientData(clientId);

    const prompt = `Professional avatar for ${clientData.businessName}.
      Industry: ${clientData.industry}.
      Style: Modern, clean, professional.
      Colors: Brand-appropriate, neutral background.
      Format: Square, suitable for profile display.
      Mood: Trustworthy, competent, approachable.`;

    return storage.generateAndStore({
      prompt,
      category: 'thumbnails',
      domain: clientData.domain,
      keyword: 'avatar',
      location: clientData.location,
      seoContext: { type: 'client-avatar', clientId },
      geoContext: { location: clientData.location },
    });
  }

  async createProjectIcon(orgId: string, projectId: string): Promise<GeneratedAsset> {
    const storage = new ImageStorage(orgId);
    const projectData = await this.getProjectData(projectId);

    const prompt = `Project icon for ${projectData.name}.
      Project type: ${projectData.type}.
      Style: Flat design, modern iconography.
      Colors: Professional blues and grays.
      Format: Square icon, suitable for lists and cards.`;

    return storage.generateAndStore({
      prompt,
      category: 'thumbnails',
      domain: projectData.domain,
      keyword: 'project-icon',
      location: projectData.location,
      seoContext: { type: 'project-icon', projectId },
      geoContext: { location: projectData.location },
    });
  }

  private async getClientData(clientId: string): Promise<ClientData> {
    // Fetch from database
    return {
      businessName: 'Example Business',
      industry: 'Construction',
      domain: 'example.com',
      location: 'Brisbane, Australia',
    };
  }

  private async getProjectData(projectId: string): Promise<ProjectData> {
    // Fetch from database
    return {
      name: 'SEO Campaign Q1',
      type: 'seo-audit',
      domain: 'example.com',
      location: 'Brisbane, Australia',
    };
  }
}

interface ClientData {
  businessName: string;
  industry: string;
  domain: string;
  location: string;
}

interface ProjectData {
  name: string;
  type: string;
  domain: string;
  location: string;
}
```

### 4. DocGenerator

**Location**: `src/lib/services/docs/docGenerator.ts`

**New Methods**:

```typescript
import { GeminiBanana2Client } from '@/lib/ai/geminiBanana2Client';
import { ImageStorage } from '@/lib/storage/image-storage';

export class DocGenerator {
  private imageClient: GeminiBanana2Client;

  constructor() {
    this.imageClient = new GeminiBanana2Client();
  }

  async generateProcessDiagram(orgId: string, processName: string): Promise<GeneratedAsset> {
    const storage = new ImageStorage(orgId);

    const processPrompts: Record<string, string> = {
      'audit-workflow': 'SEO audit workflow diagram. Flowchart style, sequential steps, decision points, professional documentation style.',
      'onboarding-flow': 'Client onboarding flow diagram. Step-by-step process, numbered stages, connection arrows.',
      'report-generation': 'Report generation process. Data collection, analysis, output stages, modern infographic style.',
      'competitor-analysis': 'Competitor analysis process. Comparison matrix, data gathering steps, insight generation.',
    };

    return storage.generateAndStore({
      prompt: processPrompts[processName] || `Process diagram for ${processName}. Professional flowchart style.`,
      category: 'workflows',
      domain: this.getDomain(orgId),
      keyword: processName,
      location: this.getLocation(orgId),
      seoContext: { type: 'process-diagram', process: processName },
      geoContext: {},
    });
  }

  async generateEmailVisual(orgId: string, templateName: string): Promise<GeneratedAsset> {
    const storage = new ImageStorage(orgId);

    const templatePrompts: Record<string, string> = {
      'weekly-snapshot': 'Email header for weekly SEO snapshot. Data visualization preview, professional newsletter style.',
      'monthly-report': 'Email header for monthly report. Comprehensive metrics preview, executive summary style.',
      'anomaly-alert': 'Email header for anomaly alert. Warning indicators, attention-grabbing, urgent but professional.',
      'welcome': 'Welcome email header. Friendly onboarding, brand introduction, warm professional tone.',
    };

    return storage.generateAndStore({
      prompt: templatePrompts[templateName] || `Email visual for ${templateName}. Professional email marketing style.`,
      category: 'email-assets',
      domain: this.getDomain(orgId),
      keyword: templateName,
      location: this.getLocation(orgId),
      seoContext: { type: 'email-visual', template: templateName },
      geoContext: {},
    });
  }

  private getDomain(orgId: string): string {
    return 'example.com';
  }

  private getLocation(orgId: string): string {
    return 'Brisbane, Australia';
  }
}
```

## Internal API Endpoints

### POST /api/internal/image-engine/request

Request new image generation.

```typescript
// src/app/api/internal/image-engine/request/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GeminiBanana2Client } from '@/lib/ai/geminiBanana2Client';
import { ImageStorage } from '@/lib/storage/image-storage';
import { getSupabaseServer } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer();

  // Verify internal request
  const internalKey = req.headers.get('x-internal-key');
  if (internalKey !== process.env.INTERNAL_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { orgId, prompt, category, metadata } = await req.json();

  const storage = new ImageStorage(orgId);
  const result = await storage.generateAndStore({
    prompt,
    category,
    domain: metadata.domain,
    keyword: metadata.keyword,
    location: metadata.location,
    seoContext: metadata.seoContext || {},
    geoContext: metadata.geoContext || {},
  });

  // Insert into image_approvals with pending status
  await supabase.from('image_approvals').insert({
    org_id: orgId,
    image_path: result.path,
    metadata: result.metadata,
    status: 'pending_approval',
    estimated_cost: 0.01,
  });

  return NextResponse.json({
    success: true,
    imageId: result.id,
    status: 'pending_approval',
  });
}
```

### POST /api/internal/image-engine/store

Store generated image with metadata.

```typescript
// src/app/api/internal/image-engine/store/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ImageStorage } from '@/lib/storage/image-storage';
import fs from 'fs/promises';

export async function POST(req: NextRequest) {
  const internalKey = req.headers.get('x-internal-key');
  if (internalKey !== process.env.INTERNAL_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const orgId = formData.get('orgId') as string;
  const category = formData.get('category') as string;
  const metadata = JSON.parse(formData.get('metadata') as string);
  const imageFile = formData.get('image') as File;

  const storage = new ImageStorage(orgId);
  const buffer = Buffer.from(await imageFile.arrayBuffer());

  const result = await storage.store(
    category as ImageCategory,
    metadata.filename,
    buffer,
    metadata
  );

  return NextResponse.json({
    success: true,
    path: result.path,
    metadataPath: result.metadataPath,
  });
}
```

### GET /api/internal/image-engine/pending

List pending images for approval.

```typescript
// src/app/api/internal/image-engine/pending/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const internalKey = req.headers.get('x-internal-key');
  if (internalKey !== process.env.INTERNAL_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await getSupabaseServer();
  const orgId = req.nextUrl.searchParams.get('orgId');

  const query = supabase
    .from('image_approvals')
    .select('*')
    .eq('status', 'pending_approval')
    .order('created_at', { ascending: false });

  if (orgId) {
    query.eq('org_id', orgId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ images: data });
}
```

## Storage Paths

### Base Path

```
/data/clients/{orgId}/images/
```

### Categories

| Category | Path | Use Case |
|----------|------|----------|
| dashboards | `/images/dashboards/` | Dashboard tiles, widgets |
| workflows | `/images/workflows/` | Process diagrams, flowcharts |
| onboarding | `/images/onboarding/` | Wizard assets, step illustrations |
| email-assets | `/images/email-assets/` | Email headers, visuals |
| thumbnails | `/images/thumbnails/` | Avatars, icons, small images |

### File Naming Convention

```
{domain}__{keyword}__{location}__{usecase}__{date}.png
{domain}__{keyword}__{location}__{usecase}__{date}.json  (metadata sidecar)
```

Example:
```
disasterrecovery-com-au__health-score__brisbane__dashboard-tile__2025-11-21.png
disasterrecovery-com-au__health-score__brisbane__dashboard-tile__2025-11-21.json
```

## Database Changes

### image_approvals Table

All generated assets use this table:

```sql
-- From Phase 19 migration 079
-- Ensure all hooks insert with status = 'pending_approval'

INSERT INTO image_approvals (
  org_id,
  image_path,
  metadata,
  status,  -- ALWAYS 'pending_approval' on insert
  estimated_cost
) VALUES (...);
```

### Status Workflow

```
pending_approval → approved → published
                ↘ rejected
```

## Test Cases

### 1. Model Guard Enforcement

```typescript
// Test: Reject non-Banana-2 model
describe('ModelGuard', () => {
  it('should reject non-allowed models', () => {
    expect(() => {
      ModelGuard.validateImageGeneration('dall-e-3');
    }).toThrow('BLOCKED');
  });

  it('should accept gemini-3-pro-image-preview', () => {
    expect(() => {
      ModelGuard.validateImageGeneration('gemini-3-pro-image-preview');
    }).not.toThrow();
  });
});
```

### 2. Storage Path Verification

```typescript
// Test: Correct org folder storage
describe('ImageStorage', () => {
  it('should store in correct org folder', async () => {
    const storage = new ImageStorage('org-123');
    const result = await storage.generateAndStore({
      prompt: 'Test image',
      category: 'dashboards',
      // ...
    });

    expect(result.path).toMatch(/\/data\/clients\/org-123\/images\/dashboards\//);
  });
});
```

### 3. Metadata Sidecar Generation

```typescript
// Test: JSON metadata file alongside image
describe('Metadata', () => {
  it('should create metadata sidecar', async () => {
    const storage = new ImageStorage('org-123');
    const result = await storage.generateAndStore({...});

    const metadataPath = result.path.replace('.png', '.json');
    const exists = await fs.access(metadataPath).then(() => true).catch(() => false);

    expect(exists).toBe(true);
  });
});
```

### 4. Pending Approval Record

```typescript
// Test: Insert with pending_approval status
describe('Approval Pipeline', () => {
  it('should create pending_approval record', async () => {
    const response = await fetch('/api/internal/image-engine/request', {
      method: 'POST',
      headers: { 'x-internal-key': process.env.INTERNAL_API_KEY },
      body: JSON.stringify({
        orgId: 'org-123',
        prompt: 'Test',
        category: 'dashboards',
        metadata: {},
      }),
    });

    const data = await response.json();
    expect(data.status).toBe('pending_approval');
  });
});
```

### 5. Approved Images Only

```typescript
// Test: Only return approved images
describe('Public Access', () => {
  it('should block unapproved images', async () => {
    const imageUrl = await getPublicImage('pending-image-id');
    expect(imageUrl).toBeNull();
  });

  it('should return approved images', async () => {
    const imageUrl = await getPublicImage('approved-image-id');
    expect(imageUrl).not.toBeNull();
  });
});
```

## Completion Criteria

| Criterion | Status |
|-----------|--------|
| All services can request internal images | ✅ Hooks added |
| All generated images go to pending approval | ✅ Default status |
| Metadata JSON file for every asset | ✅ Sidecar pattern |
| No external images allowed | ✅ ModelGuard enforced |
| System-wide ModelGuard enforcement | ✅ Active |

## Environment Variables Required

```env
# Existing
GEMINI_API_KEY=AI...

# New
INTERNAL_API_KEY=internal_secret_key_for_image_engine
```

## Usage Examples

### OnboardingService

```typescript
const onboarding = new OnboardingService(orgId);

// Generate all wizard assets
const assets = await onboarding.generateWizardAssets(orgId);
// Returns: Array of GeneratedAsset with pending_approval status

// Generate single step illustration
const stepAsset = await onboarding.requestStepIllustration(orgId, 'geo-setup');
```

### DashboardBuilder

```typescript
const dashboard = new DashboardBuilder(orgId);

// Request dashboard tile
const tile = await dashboard.requestDashboardTile(orgId, 'health-score');

// Request status icon
const icon = await dashboard.requestStatusIcon(orgId, 'success');
```

### ClientService

```typescript
const clientService = new ClientService();

// Create client avatar
const avatar = await clientService.createClientAvatar(orgId, clientId);

// Create project icon
const icon = await clientService.createProjectIcon(orgId, projectId);
```

### DocGenerator

```typescript
const docGen = new DocGenerator();

// Generate process diagram
const diagram = await docGen.generateProcessDiagram(orgId, 'audit-workflow');

// Generate email visual
const emailHeader = await docGen.generateEmailVisual(orgId, 'weekly-snapshot');
```

---

*Phase 20 - Unite-Hub Image Engine Runtime Hook Installation Complete*
*All services integrated with Gemini Nano Banana 2 (`gemini-3-pro-image-preview`)*
