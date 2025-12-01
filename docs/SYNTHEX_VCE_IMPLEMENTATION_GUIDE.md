# Synthex VCE v2 Implementation Guide

## Overview

This guide provides a systematic process for generating and inserting images and videos into the Unite-Hub project using the Synthex Visual Content Engine (VCE) v2 specifications.

**Key Principle**: Use cost-optimized models for development/research, then finalize with production-grade models.

---

## Phase 1: Development & Research (Cost-Optimized)

### Tier 1: Free/Ultra-Low-Cost Models (Development)

**Use Case**: Concept validation, layout testing, initial design exploration

#### 1.1 Gemini 2.5 Flash (Free Tier)
- **Cost**: $0.075/$0.30 per 1M tokens (cheapest text generation)
- **Purpose**: Content brief generation, prompt engineering, strategy
- **Workflow**:
  ```
  1. Generate content briefs from business descriptions
  2. Create detailed prompt templates
  3. Test prompt variations
  4. Iterate based on quality feedback
  ```

#### 1.2 DALL-E 2 (Budget Image)
- **Cost**: $0.016-0.020 per image (1024x1024)
- **Purpose**: Quick concept mockups, layout validation
- **Workflow**:
  ```
  1. Generate 3-5 concept variations per zone
  2. Select best direction
  3. Document successful prompt patterns
  4. Create style reference library
  ```

#### 1.3 Pexels/Unsplash (Free Stock)
- **Cost**: Free
- **Purpose**: Reference materials, placeholder assets
- **Workflow**:
  ```
  1. Download reference images by industry/service
  2. Create mood boards
  3. Extract color palettes
  4. Document visual patterns
  ```

---

## Phase 2: Quality Research & Refinement (Budget Models)

### Tier 2: Cost-Effective Production Models

#### 2.1 Gemini 2.5 Flash Image
- **Cost**: 1,290 tokens per image (≈$0.10 at standard rates)
- **Status**: Preview (production-allowed)
- **Resolution**: 1024px fixed
- **Best For**: High-volume content, rapid iteration, blog images
- **Workflow**:
  ```
  Step 1: Take validated prompts from Phase 1
  Step 2: Generate 2 variations per content piece
  Step 3: Run quality assessment (6+ dimensions)
  Step 4: Auto-approve if score ≥ 8.5
  Step 5: Collect feedback on underperforming assets
  ```

#### 2.2 ElevenLabs TTS (Budget Audio)
- **Cost**: $0.30 per 1M characters (vs $15 for premium)
- **Voices**: Multilingual, natural-sounding
- **Use Case**: Draft narration, voice testing
- **Workflow**:
  ```
  1. Generate test voiceovers for video scripts
  2. Test different voice profiles
  3. Record timing and pacing notes
  4. Select best voice per content type
  ```

---

## Phase 3: Production Generation (Premium Models)

### Tier 3: Premium Production-Grade Models (Big 4)

#### 3.1 Gemini 3 Pro Image (Primary)
- **Cost**: 1,210 tokens per image (1K/2K), 2,000 tokens (4K)
- **Status**: Preview (production-allowed) ✅
- **Key Features**:
  - 4K resolution support (4096x4096)
  - Advanced text rendering
  - Thinking mode enabled (up to 2 interim images)
  - Multi-image composition (up to 14 reference images)
  - Google Search grounding
- **Resolution Options**:
  - 1K: 1024x1024 (1,210 tokens) - Blog, social, cards
  - 2K: 2048x2048 (1,210 tokens) - Hero sections, detailed work
  - 4K: 4096x4096 (2,000 tokens) - Premium showcases, posters
- **Best For**: Hero images, high-fidelity product shots, complex compositions
- **Workflow**:
  ```
  Step 1: Use refined prompts from Phase 2
  Step 2: Select appropriate resolution based on use case
  Step 3: Generate with thinking mode for complex briefs
  Step 4: Request iterations for refinement
  Step 5: Apply industry-specific color customizations
  ```

#### 3.2 Veo 3.1 Video Generation (Primary)
- **Cost**: 600-1,800 tokens per video (duration & resolution dependent)
- **Status**: Preview (production-allowed) ✅
- **Output Specs**:
  - 720p: 4s (600 tokens), 6s (900 tokens), 8s (1,200 tokens)
  - 1080p: 8s only (1,800 tokens)
  - Frame rate: 24fps
  - Formats: MP4, WebM
- **Key Features**:
  - Native audio integration
  - Dialogue generation (quoted speech)
  - Sound effects and ambient audio
  - Video extension (7s per extension, up to 20 extensions)
  - Reference images support (up to 3)
- **Best For**: Explainer videos, hero videos, product demos, testimonials
- **Workflow**:
  ```
  Step 1: Create video scripts with dialogue formatting
  Step 2: Generate key frame reference images
  Step 3: Generate 6s 720p version first (optimal cost/quality)
  Step 4: If approved, generate 1080p 8s extended version
  Step 5: Integrate with processed audio track
  Step 6: Add subtitles/captions via processing pipeline
  ```

#### 3.3 Gemini 2.5 Flash TTS (Audio)
- **Cost**: 15 tokens per 1,000 input characters (≈$0.001 per 1K chars)
- **Voices**: 30+ professional voices (including Australian accents)
- **Recommended Voices** (Australia-optimized):
  - **Sulafat** (Primary): Professional, trustworthy, 40-50 years old
  - **Charon** (Educational): Clear, engaging, female, 30-40 years old
  - **Achird** (Welcome): Warm, friendly, female, 25-35 years old
  - **Orus** (Authority): Deep, commanding, male, 45-55 years old
- **Best For**: Video narration, podcast scripts, voice guidance
- **Workflow**:
  ```
  Step 1: Prepare text with emphasis markers
  Step 2: Generate with selected voice
  Step 3: Process audio normalization (target: -16 LUFS)
  Step 4: Generate multiple format variants (mp3, aac, wav)
  Step 5: Create waveform visualization for UI
  ```

#### 3.4 Imagen 4 (Specialized High-Fidelity)
- **Cost**: 1,280 tokens per image (1K), 2,560 tokens (2K)
- **Status**: Stable
- **Strengths**: Photorealism, artistic styles, typography
- **Variants**:
  - Standard: 1-4 images per request
  - Ultra: 1 image per request, highest quality
  - Fast: Optimized for speed
- **Best For**: Photorealistic hero images, artistic illustrations, typography-heavy work
- **Fallback For**: When Gemini 3 Pro cannot achieve required quality
- **Workflow**:
  ```
  Step 1: Assess if photorealism is required
  Step 2: If yes and Gemini 3 Pro insufficient, use Imagen 4
  Step 3: Generate with appropriate variant (standard/ultra/fast)
  Step 4: Use for premium brand assets and high-impact visuals
  ```

---

## Systematic Asset Generation Workflow

### Step 1: Pre-Generation Planning (Day 1)

#### 1.1 Content Audit
```bash
Location: d:\Unite-Hub\config\SYNTHEX_CONTENT_AUDIT.json

Create audit document mapping:
- Landing pages
- Pillar pages (industry-specific)
- Blog post categories
- Campaign templates
- Email header graphics
- Social media templates
```

**Example Structure**:
```json
{
  "pages": {
    "landing_hero": {
      "count": 1,
      "resolution": "1920x1080 (16:9)",
      "model": "gemini-3-pro-image-preview",
      "industry": "general",
      "priority": "high",
      "estimated_tokens": 1210
    },
    "industry_cards": {
      "count": 6,
      "resolution": "1K (1:1)",
      "model": "gemini-2.5-flash-image",
      "industries": ["plumbing", "electrical", "building", "restoration", "hvac", "landscaping"],
      "priority": "high",
      "estimated_tokens": 7740
    },
    "blog_featured_images": {
      "count": 12,
      "resolution": "1200px wide (16:9)",
      "model": "gemini-2.5-flash-image",
      "priority": "medium",
      "estimated_tokens": 15480
    }
  },
  "videos": {
    "hero_video": {
      "count": 1,
      "duration": "6s",
      "resolution": "720p",
      "model": "veo-3.1-generate-preview",
      "priority": "high",
      "estimated_tokens": 900
    },
    "explainer_videos": {
      "count": 3,
      "duration": "30-60s",
      "resolution": "720p",
      "model": "veo-3.1-generate-preview",
      "priority": "medium",
      "estimated_tokens": 2700
    }
  },
  "audio": {
    "voice_narration": {
      "total_characters": 5000,
      "voices": ["Sulafat", "Charon"],
      "model": "gemini-2.5-flash-preview-tts",
      "estimated_tokens": 75
    }
  }
}
```

#### 1.2 Prompt Template Preparation
```bash
Location: d:\Unite-Hub\config\SYNTHEX_PROMPT_LIBRARY.md

For each content type:
1. Create master prompt template
2. Define variable substitutions
3. Add industry-specific modifiers
4. Include quality guardrails
5. Document expected outcomes
```

---

### Step 2: Phase 1 Concept Generation (Days 2-3)

#### 2.1 Generate Concept Variations (Gemini 2.5 Flash Image)

**Process**:
```bash
# 1. Start with high-volume, low-cost generation
npx ts-node scripts/generate-concepts.ts --model=gemini-2.5-flash-image --batch=industry_cards

# 2. Configuration file
d:\Unite-Hub\config\generation-config.json
{
  "batch_name": "industry_cards_phase1",
  "model": "gemini-2.5-flash-image",
  "content_type": "industry_card",
  "count": 6,
  "industries": ["plumbing", "electrical", "building", "restoration", "hvac", "landscaping"],
  "resolution": "1K",
  "quality_threshold": 6.0,
  "auto_approve": false,
  "output_dir": "d:\\Unite-Hub\\public\\assets\\concepts",
  "log_file": "d:\\Unite-Hub\\logs\\generation_phase1.json"
}
```

**Output Structure**:
```
d:\Unite-Hub\public\assets\concepts\
├── industry_cards\
│   ├── plumbing\
│   │   ├── concept_v1.webp
│   │   ├── concept_v2.webp
│   │   └── concept_v3.webp
│   ├── electrical\
│   ├── building\
│   └── ...
├── hero_images\
│   ├── landing_v1.webp
│   ├── landing_v2.webp
│   └── landing_v3.webp
└── generation_metadata.json
```

#### 2.2 Quality Assessment (Automated)

**Script**: `scripts/assess-quality.ts`

```typescript
interface QualityAssessment {
  asset_id: string;
  content_type: string;
  dimensions: {
    brand_alignment: number;      // 0-100 (25% weight)
    technical_quality: number;     // 0-100 (20% weight)
    message_clarity: number;       // 0-100 (20% weight)
    emotional_tone: number;        // 0-100 (15% weight)
    audience_fit: number;          // 0-100 (10% weight)
    uniqueness: number;            // 0-100 (10% weight)
  };
  composite_score: number;        // 0-100 (weighted average)
  approval_status: 'auto_approved' | 'human_review' | 'rejected';
  feedback: string;
  recommendations: string[];
}
```

**Decision Logic**:
```
If composite_score >= 8.5 → Auto-Approved ✅
If 6.0 <= composite_score < 8.5 → Human Review ⏳
If composite_score < 6.0 → Rejected ❌ (Regenerate)
```

#### 2.3 Feedback Collection

**Process**:
1. Export approved concepts to shared folder
2. Send to stakeholder review
3. Collect feedback on:
   - Brand alignment
   - Industry accuracy
   - Visual clarity
   - Emotional resonance
4. Document patterns in successful variations

---

### Step 3: Phase 2 Refinement (Days 4-7)

#### 3.1 Prompt Optimization Based on Feedback

**Update Prompt Library**:
```markdown
# Plumbing Industry Card - Refined Prompt

## Successful Elements (Keep)
- Professional blue (#3b82f6) accents on tools
- Clean, modern installation focus
- Confident experienced tradesperson
- Bright natural lighting

## Issues to Fix
- Reduce text overlays (test showed lower engagement)
- Increase focus on quality materials
- Add customer satisfaction element

## Revised Prompt Template
"Professional plumber with [ACTION] showing quality [MATERIAL]. Background: modern [SETTING].
Lighting: bright natural, emphasizing clean professional work.
Colors: warm earth tones with #3b82f6 blue accent on [ELEMENT].
Composition: rule of thirds, subject left, detail work sharp.
Mood: professional, reliable, trustworthy, expert.
Avoid: cluttered workspace, poor safety practices, dated equipment."
```

#### 3.2 Generate Refined Variations (Gemini 2.5 Flash Image)

```bash
npx ts-node scripts/generate-refined.ts \
  --model=gemini-2.5-flash-image \
  --batch=industry_cards_refined \
  --feedback-driven=true
```

#### 3.3 A/B Test Variations

**Test Plan**:
```json
{
  "test_name": "industry_card_visual_test",
  "hypothesis": "Blue accent placement increases engagement",
  "variants": {
    "a": { "accent_position": "tools", "description": "Blue on tools" },
    "b": { "accent_position": "clothing", "description": "Blue on uniform" },
    "c": { "accent_position": "background", "description": "Blue in background" }
  },
  "metrics": ["engagement_rate", "click_through_rate", "conversion_rate"],
  "duration_days": 7,
  "minimum_sample_size": 1000
}
```

---

### Step 4: Production Generation (Days 8-14)

#### 4.1 Final Asset Generation (Premium Models)

**Tier 1: Hero Assets (Gemini 3 Pro Image)**

```bash
npx ts-node scripts/generate-production.ts \
  --model=gemini-3-pro-image-preview \
  --content-type=hero_images \
  --resolution=2K \
  --thinking-mode=true \
  --batch=production_heroes
```

**Configuration**:
```json
{
  "batch_name": "production_heroes",
  "model": "gemini-3-pro-image-preview",
  "thinking_mode": {
    "enabled": true,
    "budget_tokens": 5000
  },
  "content_items": [
    {
      "id": "landing_hero",
      "brief": "Professional tradesperson team representing reliability and expertise...",
      "resolution": "2K",
      "aspect_ratio": "16:9",
      "industry": "general",
      "estimated_tokens": 1210
    }
  ]
}
```

**Tier 2: High-Volume Assets (Gemini 2.5 Flash Image)**

```bash
npx ts-node scripts/generate-production.ts \
  --model=gemini-2.5-flash-image \
  --content-type=blog_featured \
  --batch=production_blog \
  --parallel=true \
  --concurrency=5
```

**Tier 3: Specialized Assets (Imagen 4)**

```bash
# Only if Gemini 3 Pro doesn't meet photorealism requirements
npx ts-node scripts/generate-production.ts \
  --model=imagen-4.0-generate-001 \
  --content-type=photorealistic_showcases \
  --variant=ultra \
  --batch=production_photorealistic
```

#### 4.2 Asset Processing Pipeline

**Script**: `scripts/process-assets.ts`

```typescript
async function processAsset(asset: GeneratedAsset): Promise<ProcessedAsset> {
  // 1. Validation
  await validateFormat(asset);
  await validateDimensions(asset);

  // 2. Optimization (Sharp pipeline)
  const variants = await generateVariants(asset);
  // Creates: thumbnail, small, medium, large, full, retina sizes
  // Formats: webp, avif, jpeg

  // 3. Metadata Generation
  const metadata = await generateMetadata(asset);
  // alt-text, title, keywords, schema markup

  // 4. Storage
  await uploadToStorage(variants);
  // Bucket: synthex-media-prod (CDN enabled)
  // Path: /{client_id}/{asset_type}/{page_type}/{page_slug}/{filename}

  // 5. Database Registration
  await registerAsset(metadata);

  return { variants, metadata };
}
```

**Processing Steps**:
```
1. Input Validation
   ✓ Format check (PNG, JPEG, WebP)
   ✓ Dimension verification
   ✓ File size check (< 50MB)
   ✓ Color profile validation

2. Optimization
   ✓ Metadata stripping (EXIF, XMP, IPTC)
   ✓ Color profile conversion to sRGB
   ✓ Generate 6 size variants
   ✓ Convert to 3 formats (webp, avif, jpeg)
   ✓ Create blur placeholder

3. Quality Enhancement
   ✓ Contrast optimization
   ✓ Sharpening filter
   ✓ Noise reduction
   ✓ Color grading

4. Metadata Generation
   ✓ Alt text (SEO-optimized, 125 chars max)
   ✓ Title attribute (70 chars max)
   ✓ Schema markup (ImageObject)
   ✓ Open Graph tags
   ✓ Twitter Card tags

5. Storage & CDN
   ✓ Upload to Digital Ocean Spaces
   ✓ Enable CDN caching
   ✓ Set cache headers (1-year immutable)
   ✓ Configure CORS
```

---

### Step 5: Video Generation (Days 15-21)

#### 5.1 Video Script Development

**Script Location**: `d:\Unite-Hub\docs\VIDEO_SCRIPTS\`

**Structure**:
```markdown
# Hero Video Script (6 seconds)

## Scene 1: Hook (0-1s)
Visual: Professional tradesperson arriving at job site with confidence
Audio: Upbeat, energetic music (first 1-2 seconds)
Text Overlay: [BRAND NAME]

## Scene 2: Value (1-4s)
Visual: Quick montage of quality work - measuring, installing, inspecting
Audio: Professional narration (Sulafat voice)
Script: "We deliver exceptional service with reliability you can trust."

## Scene 3: Trust (4-6s)
Visual: Satisfied customer reaction, handshake, quality finish reveal
Audio: Upbeat conclusion to music
Text Overlay: "Your [SERVICE] Experts"

## Scene 4: CTA (6s)
Visual: Contact information overlay
Audio: Subtle call-to-action prompt
Text: "Call Now • Book Online • Get Quote"
```

#### 5.2 Generate Key Frame Images

Before video generation, create reference images:

```bash
npx ts-node scripts/generate-video-frames.ts \
  --model=gemini-3-pro-image-preview \
  --videos=hero,explainer \
  --frame-count=3 \
  --resolution=1K
```

#### 5.3 Generate Audio Tracks

```bash
npx ts-node scripts/generate-audio.ts \
  --model=gemini-2.5-flash-preview-tts \
  --scripts=video_scripts \
  --voices=[Sulafat,Charon] \
  --normalize=true
```

**Audio Processing**:
```
Input: TTS-generated narration
  ↓
Normalization: Target -16 LUFS
  ↓
Noise Reduction: Threshold -30dB
  ↓
Format Conversion: MP3, AAC, OGG, WAV
  ↓
Waveform Generation: JSON visualization
  ↓
Output: Multiple formats for compatibility
```

#### 5.4 Generate Videos (Veo 3.1)

```bash
npx ts-node scripts/generate-videos.ts \
  --model=veo-3.1-generate-preview \
  --scripts=video_scripts \
  --key-frames=generated_frames \
  --audio=generated_audio \
  --resolution=720p \
  --duration=6s
```

**Video Generation Process**:
```
1. Create Detailed Video Prompt
   - Opening hook description
   - Scene transitions
   - Lighting and mood
   - Audio sync points
   - Brand elements

2. Generate Base Video (720p, 6s)
   - Cost: 900 tokens
   - Format: MP4
   - Frame rate: 24fps

3. Process Video
   - Download from Veo
   - Audio normalization (-14 LUFS)
   - Transcode variants:
     ✓ MP4 720p (2500k bitrate)
     ✓ MP4 1080p (5000k bitrate)
     ✓ WebM 720p (VP9 codec)
   - HLS packaging (adaptive streaming)
   - Thumbnail extraction (5 frames)
   - Poster generation (first frame)

4. Optional: Extend Video
   - If approved, generate 1080p 8s version
   - Cost: 1800 tokens additional
   - Use video extension (7s per extension)
   - Maximum 20 extensions possible

5. Upload to Storage
   - Primary bucket: synthex-media-prod
   - Path structure:
     /{client_id}/video/{content_type}/{slug}/
       ├── 720p.mp4
       ├── 1080p.mp4
       ├── 720p.webm
       ├── hls/master.m3u8
       ├── thumbs/thumb_1.webp
       └── poster.webp
```

---

## Cost Optimization Strategy

### Budget Allocation Model

```json
{
  "total_monthly_budget": 5000,
  "allocation": {
    "phase_1_concept": {
      "budget": 500,
      "model": "gemini-2.5-flash-image",
      "monthly_percentage": 10,
      "purpose": "Research and iteration"
    },
    "phase_2_refinement": {
      "budget": 1000,
      "model": "gemini-2.5-flash-image",
      "monthly_percentage": 20,
      "purpose": "A/B testing, feedback refinement"
    },
    "phase_3_production_heroes": {
      "budget": 1500,
      "model": "gemini-3-pro-image-preview",
      "monthly_percentage": 30,
      "purpose": "High-impact hero images and premium assets"
    },
    "phase_3_production_volume": {
      "budget": 1200,
      "model": "gemini-2.5-flash-image",
      "monthly_percentage": 24,
      "purpose": "Blog, social media, high-volume content"
    },
    "phase_3_production_video": {
      "budget": 600,
      "model": "veo-3.1-generate-preview",
      "monthly_percentage": 12,
      "purpose": "Hero video, explainer videos"
    },
    "contingency": {
      "budget": 200,
      "monthly_percentage": 4,
      "purpose": "Imagen 4 specialization, regenerations"
    }
  },
  "cost_tracking": {
    "enable_detailed_logs": true,
    "alert_threshold": "80% of budget",
    "cost_per_asset_reports": true
  }
}
```

### Token Cost Breakdown

```
=== PHASE 1: CONCEPT GENERATION ===
Gemini 2.5 Flash Image
├─ Industry Cards (6 industries × 3 variations): 23,220 tokens = $1.86
├─ Hero Concepts (3 variations): 3,870 tokens = $0.31
└─ Blog Featured (12 × 2 variations): 30,960 tokens = $2.48
PHASE 1 TOTAL: 58,050 tokens ≈ $4.65

=== PHASE 2: REFINEMENT ===
Gemini 2.5 Flash Image (refined variations)
├─ Industry Cards (2nd round): 15,480 tokens = $1.24
├─ Hero Concepts (2nd round): 3,870 tokens = $0.31
└─ Blog Featured (2nd round): 15,480 tokens = $1.24
PHASE 2 TOTAL: 34,830 tokens ≈ $2.79

=== PHASE 3: PRODUCTION GENERATION ===
Gemini 3 Pro Image
├─ Landing Hero (2K): 1,210 tokens = $0.10
├─ Industry Cards (6 × 2K): 7,260 tokens = $0.58
└─ Premium Showcases (3 × 4K): 6,000 tokens = $0.48

Gemini 2.5 Flash Image (volume)
├─ Blog Featured Images (12): 15,480 tokens = $1.24
├─ Social Media Graphics (30): 38,700 tokens = $3.10
└─ Email Headers (10): 12,900 tokens = $1.03

Veo 3.1 Video
├─ Hero Video (6s, 720p): 900 tokens = $0.07
├─ Explainer Videos (3 × 30s): 2,700 tokens = $0.21
└─ Testimonial Videos (5 × 15s): 3,750 tokens = $0.29

PHASE 3 TOTAL: 85,500 tokens ≈ $6.89

=== TOTAL COST FOR COMPLETE SUITE ===
178,380 tokens ≈ $14.33 (all within budget)
```

---

## Database Schema for Asset Management

### Asset Registration Table

```sql
CREATE TABLE synthex_generated_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  asset_type TEXT NOT NULL, -- 'image', 'video', 'audio'
  content_type TEXT NOT NULL, -- 'hero', 'blog_featured', 'industry_card', etc.
  industry VARCHAR(50),

  -- Generation Details
  model_used TEXT NOT NULL, -- gemini-3-pro-image-preview, veo-3.1, etc.
  prompt_template TEXT,
  prompt_variables JSONB,
  generation_duration_ms INTEGER,
  tokens_consumed INTEGER,
  cost_usd DECIMAL(10, 4),

  -- Quality Metrics
  quality_score NUMERIC(3, 1), -- 0-100
  quality_dimensions JSONB, -- Detailed scoring
  approval_status TEXT, -- auto_approved, human_review, rejected
  human_approval_by UUID,
  human_approval_at TIMESTAMP,

  -- Asset Storage
  filename_slug VARCHAR(255) UNIQUE,
  cdn_url TEXT,
  storage_bucket TEXT,
  storage_path TEXT,
  file_size_bytes INTEGER,

  -- Metadata
  alt_text TEXT,
  title_attribute TEXT,
  seo_keywords TEXT[],
  schema_markup JSONB,

  -- Processing Status
  processing_status TEXT, -- pending, processing, complete, failed
  variants JSONB, -- References to generated sizes/formats

  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,

  FOREIGN KEY (workspace_id) REFERENCES organizations(id),
  FOREIGN KEY (created_by) REFERENCES auth.users(id),
  INDEX idx_workspace_type (workspace_id, asset_type),
  INDEX idx_approval_status (approval_status),
  INDEX idx_quality_score (quality_score DESC)
);

CREATE TABLE synthex_asset_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL,
  version_number INTEGER,
  variant_type TEXT, -- thumbnail, small, medium, large, full, retina
  file_format TEXT, -- webp, avif, jpeg, png
  file_size_bytes INTEGER,
  dimensions_w INTEGER,
  dimensions_h INTEGER,
  cdn_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (asset_id) REFERENCES synthex_generated_assets(id) ON DELETE CASCADE,
  INDEX idx_asset_versions (asset_id, variant_type)
);
```

---

## Implementation Scripts

### Script 1: `scripts/generate-concepts.ts`

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { generateImagePrompt } from "@/lib/synthex/prompt-generator";
import { assessQuality } from "@/lib/synthex/quality-assessor";

interface GenerationConfig {
  batch_name: string;
  model: string;
  content_type: string;
  items: GenerationItem[];
}

async function generateConcepts(config: GenerationConfig) {
  const client = new Anthropic({
    apiKey: process.env.GEMINI_API_KEY,
    defaultHeaders: {
      "anthropic-beta": "prompt-caching-2024-07-31",
    },
  });

  const results = [];

  for (const item of config.items) {
    // Generate prompt from template
    const prompt = generateImagePrompt(item);

    // Call Gemini API
    const response = await client.messages.create({
      model: "gemini-2.5-flash-image",
      max_tokens: 480,
      messages: [{ role: "user", content: prompt }],
    });

    // Extract image URL
    const imageUrl = extractImageUrl(response);

    // Download and save
    const localPath = await downloadImage(imageUrl, config.batch_name, item.id);

    // Assess quality
    const quality = await assessQuality(localPath, item.content_type);

    results.push({
      item_id: item.id,
      local_path: localPath,
      quality_score: quality.composite_score,
      approval_status: quality.approval_status,
      timestamp: new Date(),
    });

    console.log(
      `✓ Generated ${item.id} - Quality: ${quality.composite_score}/100`
    );
  }

  // Save batch results
  await saveBatchResults(config.batch_name, results);
}
```

### Script 2: `scripts/generate-production.ts`

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { uploadToStorage } from "@/lib/synthex/storage";
import { registerAsset } from "@/lib/synthex/db";

interface ProductionConfig {
  batch_name: string;
  model: string;
  thinking_mode?: boolean;
  items: ProductionItem[];
}

async function generateProduction(config: ProductionConfig) {
  const client = new Anthropic({
    apiKey: process.env.GEMINI_API_KEY,
    defaultHeaders: {
      "anthropic-beta": "prompt-caching-2024-07-31",
    },
  });

  for (const item of config.items) {
    // Create detailed prompt
    const prompt = createDetailedPrompt(item);

    const messages: any[] = [{ role: "user", content: prompt }];

    const requestConfig: any = {
      model: config.model,
      max_tokens: 480,
      messages,
    };

    // Add thinking mode if enabled
    if (config.thinking_mode) {
      requestConfig.thinking = {
        type: "enabled",
        budget_tokens: 5000,
      };
    }

    // Generate
    const response = await client.messages.create(requestConfig);
    const imageUrl = extractImageUrl(response);

    // Download
    const imagePath = await downloadImage(
      imageUrl,
      config.batch_name,
      item.id
    );

    // Process variants
    const variants = await processVariants(imagePath, item.resolution);

    // Upload to storage
    const cdnUrls = await uploadToStorage(variants, {
      bucket: "synthex-media-prod",
      path: `/${item.id}/${item.content_type}/`,
    });

    // Generate metadata
    const metadata = generateMetadata(item, cdnUrls);

    // Register in database
    await registerAsset({
      workspace_id: item.workspace_id,
      asset_type: "image",
      content_type: item.content_type,
      model_used: config.model,
      cdn_url: cdnUrls.primary,
      ...metadata,
    });

    console.log(`✓ Generated and stored ${item.id}`);
  }
}
```

---

## Implementation Timeline

### Week 1: Setup & Preparation
- [ ] Create content audit document
- [ ] Set up asset storage structure
- [ ] Configure API keys (Gemini, ElevenLabs)
- [ ] Create prompt library templates
- [ ] Set up database schema

### Week 2-3: Phase 1 Concepts
- [ ] Generate concept variations (Gemini 2.5 Flash)
- [ ] Run quality assessments
- [ ] Collect stakeholder feedback
- [ ] Document successful patterns

### Week 4-5: Phase 2 Refinement
- [ ] Optimize prompts based on feedback
- [ ] Generate refined variations
- [ ] Run A/B tests
- [ ] Finalize design direction

### Week 6-8: Phase 3 Production
- [ ] Generate hero assets (Gemini 3 Pro)
- [ ] Generate volume assets (Gemini 2.5 Flash)
- [ ] Process all variants (Sharp pipeline)
- [ ] Register in database
- [ ] Implement in UI pages

### Week 9-10: Video & Audio
- [ ] Develop video scripts
- [ ] Generate key frame images
- [ ] Generate audio tracks (TTS)
- [ ] Generate videos (Veo 3.1)
- [ ] Integrate with pages

### Week 11: Final Integration & QA
- [ ] Implement responsive image delivery
- [ ] Test CDN delivery
- [ ] Verify SEO metadata
- [ ] Performance testing
- [ ] Final QA

---

## Success Metrics

### Quality Metrics
- [ ] Average quality score ≥ 8.0
- [ ] Auto-approval rate ≥ 75%
- [ ] Manual review time ≤ 2 hours per asset
- [ ] Revision required rate ≤ 10%

### Performance Metrics
- [ ] Image load time ≤ 500ms (p95)
- [ ] Video startup time ≤ 2s
- [ ] CDN hit rate ≥ 95%
- [ ] Mobile performance score ≥ 90

### Cost Metrics
- [ ] Total cost ≤ $5,000/month
- [ ] Cost per asset ≤ $2.00
- [ ] ROI on content investment ≥ 3x

### Business Metrics
- [ ] Engagement increase ≥ 25%
- [ ] Conversion rate increase ≥ 15%
- [ ] Time on page increase ≥ 30%
- [ ] Share rate increase ≥ 20%

---

## Troubleshooting & Fallback Strategies

### Issue: Generated image doesn't match brand guidelines

**Diagnosis**:
1. Check if prompt included all brand specifications
2. Verify color codes in prompt
3. Assess if model selection was appropriate

**Resolution**:
```
Primary: Refine prompt and regenerate with Gemini 3 Pro
Secondary: Use Imagen 4 for specialized requirements
Fallback: Use curated stock images + design refinement
```

### Issue: Video generation timing exceeds expectations

**Diagnosis**:
1. Check script length (max 1024 tokens)
2. Verify reference image count (max 3)
3. Check Veo API queue status

**Resolution**:
```
If script too long: Break into shorter scenes
If too many references: Use 1-2 key frames max
If API congested: Queue for off-peak generation (2-4 AM UTC)
```

### Issue: Audio quality insufficient for production

**Diagnosis**:
1. Check voice selection for content type
2. Verify text has proper punctuation/emphasis
3. Test normalized levels

**Resolution**:
```
Primary: Try different voice profile
Secondary: Use professional human narration
Fallback: Use instrumental background with subtitles
```

---

## Best Practices

1. **Always test before full production**
   - Generate 1-2 samples first
   - Get stakeholder approval
   - Then scale to full batch

2. **Monitor costs in real-time**
   - Log every generation
   - Alert at 80% budget threshold
   - Review weekly cost analysis

3. **Version all assets**
   - Keep original generated image
   - Store processing variants
   - Maintain approval chain

4. **Document learnings**
   - What prompts worked best
   - Which industries need more iterations
   - Cost per content type insights

5. **Implement feedback loops**
   - Track engagement metrics
   - Collect quality feedback
   - Continuously refine prompts

---

## Quick Reference Commands

```bash
# Generate concepts
npx ts-node scripts/generate-concepts.ts --batch=industry_cards

# Assess quality batch
npx ts-node scripts/assess-quality.ts --batch=industry_cards

# Generate production
npx ts-node scripts/generate-production.ts --model=gemini-3-pro-image-preview

# Process variants
npx ts-node scripts/process-assets.ts --source=generated_images

# Generate video
npx ts-node scripts/generate-videos.ts --scripts=video_scripts

# View cost summary
npx ts-node scripts/cost-report.ts --period=monthly

# Monitor queue status
npx ts-node scripts/queue-monitor.ts --model=veo-3.1-generate-preview
```

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-30
**Status**: Ready for Implementation
