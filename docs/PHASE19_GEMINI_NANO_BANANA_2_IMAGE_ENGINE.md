# Phase 19 - Gemini Nano Banana 2 Image Engine

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase19-gemini-nano-banana-2-image-engine`

## Executive Summary

Replace ALL image generation in Unite-Hub with Google Gemini Nano Banana 2 (`gemini-3-pro-image-preview`). This is the ONLY allowed image generation model. All other providers (DALL-E, Jina, Unsplash, older Gemini versions) must be removed.

## Hard Requirements

| # | Requirement |
|---|-------------|
| 1 | ONLY model allowed: `gemini-3-pro-image-preview` |
| 2 | Nano Banana 1, Gemini Flash, Gemini Pro Vision MUST NEVER be used |
| 3 | Remove/deprecate all existing image generation code |
| 4 | Use Python reference implementation for all generation |
| 5 | Auto-optimise prompts to reduce credit waste |
| 6 | Store all images in per-client Docker volumes with metadata |
| 7 | Human approval required before ANY public publication |
| 8 | NEVER auto-publish unapproved images |

## Model Configuration

### Allowed Model

```typescript
const ALLOWED_IMAGE_MODEL = 'gemini-3-pro-image-preview';

// Model guard - reject all other models
export function validateImageModel(model: string): void {
  if (model !== ALLOWED_IMAGE_MODEL) {
    throw new Error(`BLOCKED: Only ${ALLOWED_IMAGE_MODEL} is allowed for image generation. Attempted: ${model}`);
  }
}
```

### Blocked Models

```typescript
const BLOCKED_MODELS = [
  'gemini-nano-banana-1',
  'gemini-pro-vision',
  'gemini-flash',
  'dall-e-3',
  'dall-e-2',
  'stable-diffusion',
  'midjourney',
];
```

## Python Reference Implementation

```python
import base64
import mimetypes
import os
from google import genai
from google.genai import types

def save_binary_file(file_name, data):
    f = open(file_name, "wb")
    f.write(data)
    f.close()
    print(f"File saved to: {file_name}")

def generate():
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

    model = "gemini-3-pro-image-preview"  # Nano Banana 2

    contents = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text="""INSERT_INPUT_HERE""")],
        )
    ]

    tools = [types.Tool(googleSearch=types.GoogleSearch())]

    generate_content_config = types.GenerateContentConfig(
        response_modalities=["IMAGE", "TEXT"],
        image_config=types.ImageConfig(image_size="1K"),
        tools=tools,
    )

    file_index = 0
    for chunk in client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    ):
        if not chunk.candidates or not chunk.candidates[0].content or not chunk.candidates[0].content.parts:
            continue

        part = chunk.candidates[0].content.parts[0]

        if part.inline_data and part.inline_data.data:
            file_name = f"ENTER_FILE_NAME_{file_index}"
            file_index += 1

            data_buffer = part.inline_data.data
            extension = mimetypes.guess_extension(part.inline_data.mime_type)

            save_binary_file(f"{file_name}{extension}", data_buffer)
        else:
            print(chunk.text)

if __name__ == "__main__":
    generate()
```

## Implementation Tasks

### T1: Install and Configure Nano Banana 2

#### Dependencies

```bash
# Python
pip install google-genai

# Node.js wrapper
npm install @google/generative-ai
```

#### Environment Variables

```env
# .env.local
GEMINI_API_KEY=your_gemini_api_key_here
```

#### Type Validation

```typescript
// src/lib/env-validation.ts
export function validateGeminiKey(): void {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is required for image generation');
  }
  if (!key.startsWith('AI')) {
    throw new Error('Invalid GEMINI_API_KEY format');
  }
}
```

#### Model Guard Layer

```typescript
// src/lib/ai/model-guard.ts
export class ModelGuard {
  private static ALLOWED_IMAGE_MODEL = 'gemini-3-pro-image-preview';

  static validateImageGeneration(requestedModel: string): void {
    if (requestedModel !== this.ALLOWED_IMAGE_MODEL) {
      throw new Error(
        `Image generation blocked. Only ${this.ALLOWED_IMAGE_MODEL} is permitted. ` +
        `Attempted to use: ${requestedModel}`
      );
    }
  }

  static getImageModel(): string {
    return this.ALLOWED_IMAGE_MODEL;
  }
}
```

#### Gemini Banana 2 Client

```typescript
// src/lib/ai/geminiBanana2Client.ts
import { spawn } from 'child_process';
import { ModelGuard } from './model-guard';

interface ImageGenerationResult {
  success: boolean;
  imagePath: string;
  metadata: ImageMetadata;
  creditCost: number;
}

interface ImageMetadata {
  model: string;
  prompt: string;
  optimizedPrompt: string;
  size: string;
  generatedAt: string;
  seoContext: object;
  geoContext: object;
}

export class GeminiBanana2Client {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY!;
    ModelGuard.validateImageGeneration('gemini-3-pro-image-preview');
  }

  async generateImage(
    prompt: string,
    outputPath: string,
    context: { seo: object; geo: object }
  ): Promise<ImageGenerationResult> {
    // Optimize prompt first
    const optimizedPrompt = await this.optimizePrompt(prompt, context);

    // Call Python runner
    const result = await this.callPythonRunner(optimizedPrompt, outputPath);

    // Generate metadata sidecar
    const metadata: ImageMetadata = {
      model: 'gemini-3-pro-image-preview',
      prompt,
      optimizedPrompt,
      size: '1K',
      generatedAt: new Date().toISOString(),
      seoContext: context.seo,
      geoContext: context.geo,
    };

    // Save metadata JSON
    await this.saveMetadata(outputPath, metadata);

    return {
      success: true,
      imagePath: result.path,
      metadata,
      creditCost: result.cost,
    };
  }

  private async optimizePrompt(
    prompt: string,
    context: { seo: object; geo: object }
  ): Promise<string> {
    // Generate 3 candidate prompts
    const candidates = this.generatePromptCandidates(prompt, context);

    // Select lowest-cost, highest-information option
    const best = this.selectBestPrompt(candidates);

    return best;
  }

  private generatePromptCandidates(
    prompt: string,
    context: { seo: object; geo: object }
  ): string[] {
    const { seo, geo } = context;

    // Rich narrative prompts
    return [
      this.buildNarrativePrompt(prompt, seo, geo, 'photorealistic'),
      this.buildNarrativePrompt(prompt, seo, geo, 'commercial'),
      this.buildNarrativePrompt(prompt, seo, geo, 'editorial'),
    ];
  }

  private buildNarrativePrompt(
    basePrompt: string,
    seo: object,
    geo: object,
    style: string
  ): string {
    // Build comprehensive prompt with all context
    return `${basePrompt}.
      Style: ${style} photography.
      Location context: ${JSON.stringify(geo)}.
      SEO context: ${JSON.stringify(seo)}.
      Camera: Professional DSLR, 85mm lens, f/2.8.
      Lighting: Natural daylight, golden hour.
      Mood: Professional, trustworthy, modern.
      Resolution: High detail, sharp focus, clean composition.`;
  }

  private selectBestPrompt(candidates: string[]): string {
    // Score by information density vs token cost
    const scored = candidates.map(c => ({
      prompt: c,
      score: this.scorePrompt(c),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored[0].prompt;
  }

  private scorePrompt(prompt: string): number {
    const tokenCost = prompt.split(' ').length;
    const informationDensity = this.calculateInformationDensity(prompt);
    return informationDensity / tokenCost;
  }

  private calculateInformationDensity(prompt: string): number {
    const keywords = ['location', 'style', 'lighting', 'camera', 'mood'];
    return keywords.filter(k => prompt.toLowerCase().includes(k)).length;
  }

  private async callPythonRunner(
    prompt: string,
    outputPath: string
  ): Promise<{ path: string; cost: number }> {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', [
        'scripts/gemini-image-generator.py',
        '--prompt', prompt,
        '--output', outputPath,
        '--model', 'gemini-3-pro-image-preview',
      ]);

      let output = '';
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve({
            path: outputPath,
            cost: 0.01, // Estimated credit cost
          });
        } else {
          reject(new Error(`Python runner failed with code ${code}`));
        }
      });
    });
  }

  private async saveMetadata(
    imagePath: string,
    metadata: ImageMetadata
  ): Promise<void> {
    const metadataPath = imagePath.replace(/\.[^.]+$/, '.json');
    const fs = await import('fs/promises');
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  }
}
```

### T2: Universal Image Engine Replacement

#### Files to Remove/Deprecate

```typescript
// These must be removed or throw errors:
// - src/lib/ai/dalle-client.ts
// - src/lib/ai/jina-image.ts
// - src/lib/ai/unsplash-client.ts
// - src/lib/ai/gemini-vision.ts (if using old models)

// Replace with deprecation notice
export function generateImageDalle() {
  throw new Error('DALL-E is deprecated. Use GeminiBanana2Client instead.');
}

export function generateImageJina() {
  throw new Error('Jina is deprecated. Use GeminiBanana2Client instead.');
}
```

#### New Image Engine

```typescript
// src/lib/ai/image-engine.ts
import { GeminiBanana2Client } from './geminiBanana2Client';
import { ModelGuard } from './model-guard';

export class ImageEngine {
  private client: GeminiBanana2Client;

  constructor() {
    this.client = new GeminiBanana2Client();
  }

  async generate(options: ImageGenerationOptions): Promise<ImageResult> {
    // Enforce model guard
    ModelGuard.validateImageGeneration('gemini-3-pro-image-preview');

    return this.client.generateImage(
      options.prompt,
      options.outputPath,
      { seo: options.seoContext, geo: options.geoContext }
    );
  }
}

// Export singleton
export const imageEngine = new ImageEngine();
```

### T3: Docker Per-Client Image Storage

#### Folder Structure

```
/data/clients/{orgId}/
├── images/
│   ├── report-covers/
│   │   ├── domain__keyword__location__usecase__date.png
│   │   └── domain__keyword__location__usecase__date.json
│   ├── dashboard-panels/
│   ├── geo-maps/
│   ├── social/
│   ├── logos/
│   └── thumbnails/
├── audits/
├── snapshots/
├── reports/
└── history/
```

#### Semantic Filename Generator

```typescript
// src/lib/storage/image-filename.ts
export function generateSemanticFilename(options: {
  domain: string;
  keyword: string;
  location: string;
  useCase: string;
  date?: Date;
}): string {
  const { domain, keyword, location, useCase, date = new Date() } = options;

  const sanitize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '-');

  const parts = [
    sanitize(domain),
    sanitize(keyword),
    sanitize(location),
    sanitize(useCase),
    date.toISOString().split('T')[0],
  ];

  return parts.join('__') + '.png';
}

// Example: disasterrecovery-com-au__water-damage__brisbane__report-cover__2025-11-21.png
```

#### Storage Manager

```typescript
// src/lib/storage/image-storage.ts
import { GeminiBanana2Client } from '../ai/geminiBanana2Client';
import { generateSemanticFilename } from './image-filename';
import fs from 'fs/promises';
import path from 'path';

export class ImageStorage {
  private baseDir: string;
  private client: GeminiBanana2Client;

  constructor(orgId: string) {
    this.baseDir = `/data/clients/${orgId}/images`;
    this.client = new GeminiBanana2Client();
  }

  async generateAndStore(options: {
    prompt: string;
    category: 'report-covers' | 'dashboard-panels' | 'geo-maps' | 'social' | 'logos' | 'thumbnails';
    domain: string;
    keyword: string;
    location: string;
    seoContext: object;
    geoContext: object;
  }): Promise<StoredImage> {
    // Generate semantic filename
    const filename = generateSemanticFilename({
      domain: options.domain,
      keyword: options.keyword,
      location: options.location,
      useCase: options.category,
    });

    const outputDir = path.join(this.baseDir, options.category);
    await fs.mkdir(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, filename);

    // Generate image with Nano Banana 2
    const result = await this.client.generateImage(
      options.prompt,
      outputPath,
      { seo: options.seoContext, geo: options.geoContext }
    );

    return {
      path: outputPath,
      filename,
      category: options.category,
      metadata: result.metadata,
      status: 'pending_approval', // Always starts pending
    };
  }
}
```

### T4: Strict Approval Workflow

#### Database Schema

```sql
-- Image approval tracking
CREATE TABLE IF NOT EXISTS image_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  metadata JSONB NOT NULL,
  status TEXT DEFAULT 'pending_approval', -- pending_approval, approved, rejected
  estimated_cost DECIMAL(10, 4),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policy - users can only see their org's images
ALTER TABLE image_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_org_images" ON image_approvals
  FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

-- Only admins can approve
CREATE POLICY "admins_approve_images" ON image_approvals
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Index for quick status lookups
CREATE INDEX IF NOT EXISTS idx_image_approvals_status ON image_approvals(org_id, status);
```

#### Approval API

```typescript
// src/app/api/admin/images/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer();

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user?.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { imageId, action, reason } = await req.json();

  if (action === 'approve') {
    await supabase
      .from('image_approvals')
      .update({
        status: 'approved',
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', imageId);
  } else if (action === 'reject') {
    await supabase
      .from('image_approvals')
      .update({
        status: 'rejected',
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: reason,
      })
      .eq('id', imageId);
  }

  return NextResponse.json({ success: true });
}
```

#### Public Image Guard

```typescript
// src/lib/storage/public-image-guard.ts
export async function getPublicImage(imageId: string): Promise<string | null> {
  const supabase = await getSupabaseServer();

  const { data: image } = await supabase
    .from('image_approvals')
    .select('image_path, status')
    .eq('id', imageId)
    .single();

  // CRITICAL: Only return approved images
  if (!image || image.status !== 'approved') {
    return null; // Block unapproved images
  }

  return image.image_path;
}
```

### T5: Report, Dashboard & Social Integration

#### Aspect Ratio Rules

```typescript
// src/lib/ai/image-config.ts
export const IMAGE_ASPECT_RATIOS = {
  'report-covers': { width: 1920, height: 1080, ratio: '16:9' },
  'dashboard-panels': { width: 800, height: 600, ratio: '4:3' },
  'social': { width: 1080, height: 1920, ratio: '9:16' },
  'logos': { width: 512, height: 512, ratio: '1:1' },
  'thumbnails': { width: 400, height: 300, ratio: '4:3' },
  'geo-maps': { width: 1200, height: 800, ratio: '3:2' },
};

export function getImageConfig(category: keyof typeof IMAGE_ASPECT_RATIOS) {
  return IMAGE_ASPECT_RATIOS[category];
}
```

#### Report Integration

```typescript
// src/lib/reports/report-image-generator.ts
import { ImageStorage } from '../storage/image-storage';
import { getImageConfig } from '../ai/image-config';

export async function generateReportCoverImage(
  orgId: string,
  reportContext: {
    domain: string;
    keyword: string;
    location: string;
    reportType: string;
  }
): Promise<string> {
  const storage = new ImageStorage(orgId);
  const config = getImageConfig('report-covers');

  const prompt = buildReportCoverPrompt(reportContext, config);

  const result = await storage.generateAndStore({
    prompt,
    category: 'report-covers',
    domain: reportContext.domain,
    keyword: reportContext.keyword,
    location: reportContext.location,
    seoContext: { reportType: reportContext.reportType },
    geoContext: { location: reportContext.location },
  });

  // Return path (will be blocked until approved)
  return result.path;
}

function buildReportCoverPrompt(
  context: { domain: string; keyword: string; location: string; reportType: string },
  config: { width: number; height: number }
): string {
  return `Professional SEO audit report cover for ${context.domain}.
    Business type: ${context.keyword}.
    Location: ${context.location}.
    Report type: ${context.reportType}.
    Style: Clean, corporate, modern design.
    Colors: Professional blues and whites.
    Elements: Abstract data visualization, growth charts, professional imagery.
    Resolution: ${config.width}x${config.height}.
    Mood: Trustworthy, data-driven, successful.
    Photography style: Commercial editorial, clean backgrounds.`;
}
```

## Prompt Optimization Rules

### Requirements

1. NEVER send short or vague prompts
2. Always generate 3+ draft prompts internally
3. Select lowest-cost, highest-information option
4. Use GoogleSearch tool for context verification

### Rich Narrative Prompt Template

```typescript
const NARRATIVE_TEMPLATE = `
{BASE_PROMPT}

LOCATION CONTEXT:
- City/Region: {LOCATION}
- Local characteristics: {LOCAL_STYLE}
- Environmental factors: {ENVIRONMENT}

VISUAL STYLE:
- Camera: {CAMERA_TYPE} with {LENS}mm lens
- Aperture: f/{APERTURE}
- Lighting: {LIGHTING_TYPE}
- Color palette: {COLORS}

MOOD & TONE:
- Emotional tone: {EMOTIONAL_TONE}
- Brand alignment: {BRAND_VOICE}
- Professionalism level: {PROFESSIONALISM}

OUTPUT REQUIREMENTS:
- Resolution: {RESOLUTION}
- Aspect ratio: {ASPECT_RATIO}
- Format: High-quality PNG
`;
```

## Success Criteria

| Criterion | Validation |
|-----------|------------|
| Every image uses `gemini-3-pro-image-preview` | Model guard enforced |
| No Nano Banana 1 or older models | Code review + runtime checks |
| Prompt optimization | 3+ candidates generated |
| Metadata sidecar for all images | JSON file alongside each PNG |
| Per-client Docker storage | `/data/clients/{orgId}/images/` |
| Approval workflow enforced | Status check before public serving |
| Reports use Gemini images ONLY | No external image sources |

## Environment Variables

```env
# Required for Nano Banana 2
GEMINI_API_KEY=AI...

# Existing variables (verify present)
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/images/generate` | POST | Generate new image (returns pending) |
| `/api/admin/images` | GET | List pending images |
| `/api/admin/images/approve` | POST | Approve/reject image |
| `/api/images/[id]` | GET | Get approved image only |

## Migration Notes

### Code to Remove

- All DALL-E integration code
- All Jina AI image code
- All Unsplash API code
- Old Gemini Vision code
- Any hardcoded image URLs

### Code to Add

- `src/lib/ai/geminiBanana2Client.ts`
- `src/lib/ai/model-guard.ts`
- `src/lib/storage/image-storage.ts`
- `src/lib/storage/image-filename.ts`
- `scripts/gemini-image-generator.py`
- Migration: `079_image_approvals.sql`

---

*Phase 19 - Gemini Nano Banana 2 Image Engine Complete*
*ONLY `gemini-3-pro-image-preview` is allowed for image generation*
