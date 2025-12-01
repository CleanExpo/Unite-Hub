# Synthex VCE Image & Video Generation Strategy

## Executive Summary

This document outlines the systematic process for generating and integrating 56+ images and 8 videos into the Unite-Hub project using the Synthex Visual Content Engine (VCE) v2 specification.

**Total Cost**: $14.33 (178,380 tokens)
**Timeline**: 8 weeks
**Quality Target**: 100% approval rate

---

## Generation Pipeline Overview

```
Phase 1: Concept Development (Week 1-2)
├── Generate 3 variations per asset
├── Use Gemini 2.5 Flash (cost-optimized)
├── Collect stakeholder feedback
└── Cost: $4.65

Phase 2: Refinement & Testing (Week 3-4)
├── Optimize prompts based on feedback
├── A/B test visual variations
├── Select winning directions
└── Cost: $2.79

Phase 3: Production Generation (Week 5-7)
├── Generate final hero assets (Gemini 3 Pro)
├── Generate volume assets (Gemini 2.5 Flash)
├── Process all variants (Sharp)
├── Register in database
└── Cost: $6.89

Phase 4: Video & Audio (Week 8-9)
├── Generate video content (Veo 3.1)
├── Generate audio narration (TTS)
├── Integrate with pages
└── Cost: $0.20

Post-Launch: Optimization (Ongoing)
├── Monitor engagement metrics
├── Collect user feedback
├── Refine and iterate
└── Cost: Varies
```

---

## Step 1: Immediate Actions (This Week)

### 1.1 Set Up Directory Structure

```bash
mkdir -p d:\Unite-Hub\public\assets\{concepts,generated,processed,archive}
mkdir -p d:\Unite-Hub\public\assets\concepts\{hero,industry_cards,blog_featured}
mkdir -p d:\Unite-Hub\logs\{generation,quality_assessment,cost_tracking}
mkdir -p d:\Unite-Hub\config\{generation_configs,prompt_templates,processing_configs}
```

### 1.2 Create Configuration Files

**File**: `d:\Unite-Hub\config\generation_configs\phase1_concepts.json`

```json
{
  "batch_name": "phase1_concepts",
  "model": "gemini-2.5-flash-image",
  "phase": 1,
  "total_items": 18,
  "estimated_cost_usd": 4.65,
  "items": [
    {
      "id": "industry_card_plumbing_v1",
      "content_type": "industry_card",
      "industry": "plumbing",
      "resolution": "1K",
      "prompt": "Professional plumber in action installing quality copper piping..."
    }
  ]
}
```

### 1.3 Set Up API Access

```typescript
// src/lib/synthex/gemini-client.ts
import Anthropic from "@anthropic-ai/sdk";

export const createGeminiClient = () => {
  return new Anthropic({
    apiKey: process.env.GEMINI_API_KEY,
    defaultHeaders: {
      "anthropic-beta": "prompt-caching-2024-07-31",
    },
  });
};

export async function generateImage(prompt: string, model: string = "gemini-2.5-flash-image") {
  const client = createGeminiClient();

  const response = await client.messages.create({
    model,
    max_tokens: 480,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  return response;
}
```

### 1.4 Verify Environment

```bash
# Check API keys configured
$env:GEMINI_API_KEY -ne $null

# Verify Spaces credentials
$env:DO_SPACES_KEY -ne $null
$env:DO_SPACES_SECRET -ne $null

# Check Redis connection
redis-cli ping

# Verify database connectivity
npm run check:db
```

---

## Step 2: Phase 1 - Concept Generation (Week 2-3)

### 2.1 Generate Industry Card Concepts

**Command**:
```bash
npx ts-node scripts/generate-concepts.ts \
  --batch=phase1_concepts \
  --content-type=industry_card \
  --variants=3
```

**Script Output**:
```
d:\Unite-Hub\public\assets\concepts\industry_cards\
├── plumbing\
│   ├── concept_v1_score-8.2.webp
│   ├── concept_v2_score-7.8.webp
│   └── concept_v3_score-6.5.webp
├── electrical\
│   ├── concept_v1_score-8.5.webp
│   ├── concept_v2_score-8.1.webp
│   └── concept_v3_score-7.2.webp
└── [4 more industries...]
```

### 2.2 Run Quality Assessment

```bash
npx ts-node scripts/assess-quality.ts \
  --batch=phase1_concepts \
  --export=true
```

**Quality Assessment Output**:
```json
{
  "asset_id": "industry_card_plumbing_v1",
  "quality_score": 8.2,
  "dimensions": {
    "brand_alignment": 8.5,
    "technical_quality": 8.1,
    "message_clarity": 8.3,
    "emotional_tone": 7.8,
    "audience_fit": 8.2,
    "uniqueness": 7.9
  },
  "approval_status": "auto_approved",
  "recommendations": [
    "Strong brand alignment with plumbing aesthetic",
    "Professional tool showcase effective",
    "Consider increasing emotional warmth in next iteration"
  ]
}
```

### 2.3 Collect Stakeholder Feedback

**Process**:
1. Export concepts to shared folder: `\\synthex-server\feedback\phase1_concepts\`
2. Send stakeholder review request
3. Collect feedback on:
   - Brand alignment
   - Industry accuracy
   - Visual clarity
   - Emotional resonance
4. Document in: `d:\Unite-Hub\config\feedback_phase1.json`

**Feedback Template**:
```json
{
  "reviewer": "stakeholder_name",
  "date": "2025-12-07",
  "feedback_items": [
    {
      "asset_id": "industry_card_plumbing_v1",
      "rating": 8,
      "strengths": ["Professional appearance", "Clear tool showcase"],
      "improvements": ["Increase warmth/approachability"],
      "recommendation": "Use as base direction"
    }
  ]
}
```

---

## Step 3: Phase 2 - Prompt Refinement (Week 4-5)

### 3.1 Analyze Feedback Patterns

**Script**: `scripts/analyze-feedback.ts`

```typescript
interface FeedbackAnalysis {
  asset_id: string;
  approval_rate: number;
  common_strengths: string[];
  common_improvements: string[];
  recommended_prompt_changes: string[];
  direction_consensus: 'continue' | 'refine' | 'restart';
}

// Output:
// - Industry card plumbing: 85% approval → Continue with minor refinements
// - Hero image landing: 72% approval → Restart with different approach
// - Blog featured electrical: 90% approval → Proceed to production
```

### 3.2 Update Prompt Library

**File**: `d:\Unite-Hub\config\prompt_templates\refined_plumbing_card.md`

```markdown
# Plumbing Industry Card - Refined v2

## Analysis of Phase 1 Feedback
- Concept v1 (8.2 score) selected as winning direction
- Positive: Professional appearance, tool clarity
- Feedback: Increase approachability, soften severity

## Revised Prompt Template
Professional plumber [AGE: 35-45] performing [ACTION] on copper pipe installation.
Background: clean modern home bathroom/kitchen.
Lighting: bright natural window light, warm undertones, emphasizing craftsmanship.
Mood: professional, trustworthy, skilled, slightly approachable.
Colors: warm neutrals with #3b82f6 blue accent on [TOOL/SURFACE].
Composition: rule of thirds, subject left frame, detail work sharp focus.
Avoid: cluttered space, poor safety, dated aesthetics, overly stern expression.

## Expected Result
Similar to concept_v1 but with:
- Slightly warmer expression
- Increased human connection element
- Maintained professional quality perception
```

### 3.3 Generate Refined Variations

```bash
npx ts-node scripts/generate-refined.ts \
  --batch=phase2_refinement \
  --feedback-driven=true \
  --use-updated-prompts=true
```

### 3.4 A/B Test Results

**Setup**:
```json
{
  "test_name": "industry_card_warmth_adjustment",
  "variants": {
    "control": "phase1_v1_strict_professional",
    "variant_a": "phase2_slight_warmth_increase",
    "variant_b": "phase2_increased_approachability"
  },
  "metrics": ["engagement_rate", "time_on_page", "conversion_rate"],
  "test_duration_days": 7
}
```

---

## Step 4: Phase 3 - Production Generation (Week 6-8)

### 4.1 Generate Hero Assets (Gemini 3 Pro)

```bash
npx ts-node scripts/generate-production.ts \
  --model=gemini-3-pro-image-preview \
  --batch=phase3_hero_premium \
  --thinking-mode=enabled \
  --thinking-budget=5000
```

**Configuration**:
```json
{
  "batch_name": "phase3_hero_premium",
  "model": "gemini-3-pro-image-preview",
  "items": [
    {
      "id": "landing_hero_primary",
      "resolution": "2K",
      "thinking_mode": true,
      "estimated_tokens": 1210,
      "priority": "P0-critical"
    },
    {
      "id": "industry_card_plumbing_final",
      "resolution": "2K",
      "thinking_mode": false,
      "estimated_tokens": 1210
    }
  ]
}
```

### 4.2 Generate Volume Assets (Gemini 2.5 Flash)

```bash
npx ts-node scripts/generate-production.ts \
  --model=gemini-2.5-flash-image \
  --batch=phase3_volume \
  --parallel=true \
  --concurrency=5
```

### 4.3 Process All Assets

```bash
npx ts-node scripts/process-assets.ts \
  --source-dir=d:\Unite-Hub\public\assets\generated \
  --output-dir=d:\Unite-Hub\public\assets\processed \
  --generate-variants=true \
  --generate-metadata=true
```

**Processing Output**:
```
d:\Unite-Hub\public\assets\processed\
├── landing_hero_primary\
│   ├── 150-150.webp (thumbnail)
│   ├── 400-400.webp (small)
│   ├── 800-800.webp (medium)
│   ├── 1200-1200.webp (large)
│   ├── 1920-1920.webp (full)
│   ├── 2560-2560.webp (retina)
│   ├── [same for .avif and .jpeg]
│   └── metadata.json
```

### 4.4 Register in Database

```typescript
// Register each asset in synthex_generated_assets table
await registerAsset({
  workspace_id: 'default-workspace',
  asset_type: 'image',
  content_type: 'hero',
  model_used: 'gemini-3-pro-image-preview',
  cdn_url: 'https://media.synthex.com.au/...',
  quality_score: 8.8,
  approval_status: 'auto_approved',
  filename_slug: 'landing-hero-primary-a1b2c3d4',
  alt_text: 'Professional tradesperson team demonstrating reliability and expertise',
  // ... other fields
});
```

---

## Step 5: Phase 4 - Video & Audio (Week 9-10)

### 5.1 Generate Video Scripts

**File**: `d:\Unite-Hub\docs\VIDEO_SCRIPTS\hero_video_6s.md`

```markdown
# Hero Video Script (6 seconds)

## Production Notes
- Duration: 6 seconds (optimal cost/quality)
- Resolution: 720p (upgrade to 1080p post-approval if needed)
- Model: Veo 3.1 (native audio integration)
- Estimated Tokens: 900
- Cost: $0.07

## Timeline
0:00-0:01 HOOK
Visual: Professional tradesperson arriving at job with confidence
Audio: Upbeat energetic music build-up
Text: [BRAND] - Brand reveal with logo

0:01-0:04 VALUE
Visual: Quick montage - measuring, installing, checking quality
Audio: Professional narration (Sulafat voice: "We deliver exceptional service...")
Details: Clean work, quality materials visible

0:04-0:06 TRUST
Visual: Customer satisfaction moment, handshake or approval gesture
Audio: Music resolution, confident conclusion
Takeaway: Reliability message reinforced

0:06 CTA
Visual: Contact info overlay, service categories
Text: "Call Now • Book Online • Get Quote"
```

### 5.2 Generate Audio

```bash
npx ts-node scripts/generate-audio.ts \
  --model=gemini-2.5-flash-preview-tts \
  --voice=Sulafat \
  --script=hero_video_narration \
  --normalize=true
```

### 5.3 Generate Videos

```bash
npx ts-node scripts/generate-videos.ts \
  --model=veo-3.1-generate-preview \
  --batch=hero_and_explainer \
  --duration=6s,45s \
  --resolution=720p \
  --with-audio=true
```

---

## Cost Tracking & Monitoring

### Weekly Cost Report

```json
{
  "week": 1,
  "phase": "Phase 1 Concepts",
  "budget_allocated": 500,
  "actual_spent": 125.35,
  "items_generated": 18,
  "cost_per_item": 6.96,
  "efficiency": "High - well under budget",
  "next_week_forecast": 400
}
```

### Budget Alert System

```bash
# Alert if spending exceeds 80% of allocated budget
if ($spending > $allocated * 0.8) {
  Send-AlertEmail -subject "Synthex Budget Alert" -message "Approaching budget limit"
}
```

---

## Integration with Unite-Hub Pages

### 1. Landing Page (`src/app/page.tsx`)

```typescript
import { ResponsiveImage } from '@/components/ResponsiveImage';
import { AssetLibrary } from '@/lib/synthex/asset-library';

export default function LandingPage() {
  const heroImage = AssetLibrary.getAsset('landing_hero_primary');
  const heroVideo = AssetLibrary.getAsset('hero_video_main');

  return (
    <section className="hero-section">
      {/* Responsive image with CDN URLs */}
      <ResponsiveImage
        asset={heroImage}
        alt={heroImage.alt_text}
        priority="high"
      />

      {/* Video with adaptive streaming */}
      <video controls className="hero-video">
        <source src={heroVideo.urls.hls} type="application/x-mpegURL" />
        <source src={heroVideo.urls.mp4_720p} type="video/mp4" />
        Fallback: Your browser doesn't support video
      </video>
    </section>
  );
}
```

### 2. Industry Service Pages

```typescript
// src/app/dashboard/services/[industry]/page.tsx
export default function ServicePage({ params }: { params: { industry: string } }) {
  const industryCard = AssetLibrary.getByIndustry(params.industry);
  const blog = AssetLibrary.getBlogAssets(params.industry);
  const testimonials = AssetLibrary.getTestimonialVideos(params.industry);

  return (
    <>
      <HeroSection image={industryCard.hero} />
      <ServiceOverview />
      <BlogSection images={blog.featured} />
      <TestimonialCarousel videos={testimonials} />
    </>
  );
}
```

---

## Success Criteria

- [ ] All 56 images generated and processed
- [ ] All 8 videos generated and encoded
- [ ] 100% approval rate (no manual regenerations needed)
- [ ] Average quality score ≥ 8.0
- [ ] CDN delivery <500ms (p95)
- [ ] Total cost ≤ $15
- [ ] 0 security vulnerabilities in asset serving
- [ ] SEO metadata 100% compliant
- [ ] Mobile performance score ≥ 90

---

## Quick Start Command

```bash
# Complete Phase 1-3 pipeline
npm run synthex:full-generation

# Individual phases
npm run synthex:phase1
npm run synthex:phase2
npm run synthex:phase3

# Utilities
npm run synthex:cost-report
npm run synthex:quality-check
npm run synthex:migrate-to-storage
```

---

**Generated**: 2025-11-30
**Status**: Ready for Implementation
**Last Updated**: Ready to Begin
