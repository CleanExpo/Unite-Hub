# Visual Generation Strategy: Google AI Integration
## Project: Anthropic UI/UX Phase - Extractable Logic for Ranking

**Date**: December 29, 2025
**Branch**: Anthropic-UI-UX
**Goal**: Transform visual assets into semantic data points for Google ranking

---

## Strategy Overview

### Core Insight
Google's latest models (VEO2 Pro, Nano Banana 2 Pro, Gemini) prioritize **"Extractable Logic"**. Visual assets must contain machine-readable semantic data to rank in:
- Google Search (video key moments)
- Google Local (GEO images with location data)
- AI Overviews (Gemini/AIO parsing)

### Missing Elements Identified
1. ❌ Videos show UI but not the underlying logic flow
2. ❌ Images lack GEO contentLocation schema
3. ❌ No VideoObject hasPart (key moments) for AI parsing
4. ❌ No visual architecture diagrams (SVG for AI readability)
5. ❌ No "before/after" comparison visuals (information gain)

---

## Implementation Plan

### Phase 1: Google AI Setup
**Services to integrate**:
- ✅ Gemini API (GEMINI_API_KEY available)
- ✅ Google AI (GOOGLE_AI_API_KEY available)
- 🔍 VEO2 Pro (via Google AI Studio)
- 🔍 Nano Banana 2 Pro (via Google AI Studio)

**Files to create**:
- `src/lib/google-ai/veo-client.ts` - VEO2 Pro video generation
- `src/lib/google-ai/nano-banana-client.ts` - Nano Banana 2 Pro image generation
- `src/lib/google-ai/gemini-client.ts` - Gemini for logic overlay generation

---

### Phase 2: Video Generation (VEO2 Pro)

#### Asset 1: AI Email Agent Demo (10 seconds)
**Content**:
- 0-3s: Email arrives, AI extracts intent
- 4-7s: AI analyzes sentiment, updates contact score
- 8-10s: Categorization complete, lead assigned

**Logic Overlay** (critical for ranking):
- Mermaid diagram in corner showing:
  ```
  Email → Intent Extraction → Sentiment Analysis → Score Update
  ```
- JSON output visible (20% opacity overlay)

**Schema**:
```json
{
  "@type": "VideoObject",
  "name": "Unite-Hub AI Email Agent: Autonomous Lead Processing",
  "hasPart": [
    {"@type": "Clip", "startOffset": 0, "endOffset": 3, "name": "Intent Extraction"},
    {"@type": "Clip", "startOffset": 4, "endOffset": 7, "name": "Sentiment Analysis"},
    {"@type": "Clip", "startOffset": 8, "endOffset": 10, "name": "Lead Categorization"}
  ],
  "transcript": "Full text transcript with keywords"
}
```

#### Asset 2: Content Generation Demo (10 seconds)
**Content**:
- Personalized email generation with Claude Opus
- Shows: Contact data → Template → AI generation → Preview

**Logic Overlay**:
- API request/response visible
- Prompt engineering visible

---

### Phase 3: Image Generation (Nano Banana 2 Pro)

#### Asset 1: Architecture Visualization (SVG)
**Content**: Unite-Hub 3-layer architecture
```
┌─────────────────────────────────────┐
│ Next.js App Router (Client UI)     │
├─────────────────────────────────────┤
│ AI Agent Layer (43 Agents)         │
│ ✓ Project Vend Phase 2 Enhanced    │
├─────────────────────────────────────┤
│ Supabase PostgreSQL + RLS          │
└─────────────────────────────────────┘
```

**Ranking tactic**: High-contrast, SVG-compatible, text-extractable

#### Asset 2: Client vs Agency Control Comparison
**Split-screen**:
- **Left** (Past - Agency Control):
  - High bills ($$$)
  - Slow response (weeks)
  - Black box (no visibility)
  - Red/warning colors

- **Right** (Now - Client Control):
  - Transparent costs ($0.05/email)
  - Instant (real-time)
  - Full code access (GitHub)
  - Green/success colors

**Schema**: ImageObject with contentLocation for Logan/Brisbane GEO

#### Asset 3-7: Step-by-Step Icons (5 icons)
**Match HowTo schema steps**:
1. Connect Gmail (icon: envelope + link)
2. AI analyzes emails (icon: brain + magnifying glass)
3. Categorize leads (icon: folders + stars)
4. Generate responses (icon: sparkles + document)
5. Track performance (icon: chart + checkmark)

**Format**: SVG, high-density, AI-parseable

---

### Phase 4: Schema Implementation

#### VideoObject with hasPart
**File**: `src/lib/schema/video-schema.ts`

```typescript
export function generateVideoObjectSchema(video: {
  name: string;
  url: string;
  thumbnail: string;
  segments: Array<{start: number; end: number; name: string}>;
  transcript: string;
}) {
  return {
    "@type": "VideoObject",
    "name": video.name,
    "contentUrl": video.url,
    "thumbnailUrl": video.thumbnail,
    "uploadDate": new Date().toISOString(),
    "hasPart": video.segments.map(seg => ({
      "@type": "Clip",
      "startOffset": seg.start,
      "endOffset": seg.end,
      "name": seg.name,
      "url": `${video.url}#t=${seg.start},${seg.end}`
    })),
    "transcript": video.transcript,
    "publisher": {
      "@type": "Organization",
      "name": "Unite-Group",
      "url": "https://www.unite-group.in"
    }
  };
}
```

#### ImageObject with contentLocation
**File**: `src/lib/schema/image-schema.ts`

```typescript
export function generateImageObjectSchema(image: {
  name: string;
  url: string;
  caption: string;
  locations: string[]; // ["Logan, QLD", "Brisbane, QLD"]
}) {
  return {
    "@type": "ImageObject",
    "contentUrl": image.url,
    "caption": image.caption,
    "contentLocation": image.locations.map(loc => ({
      "@type": "Place",
      "name": loc,
      "address": {
        "@type": "PostalAddress",
        "addressRegion": "QLD",
        "addressCountry": "AU"
      }
    })),
    "associatedMedia": {
      "@type": "SoftwareSourceCode",
      "codeRepository": "https://github.com/CleanExpo/Unite-Hub",
      "programmingLanguage": "TypeScript"
    }
  };
}
```

---

### Phase 5: GitHub Social Proof Visual

#### Image Requirements
**Content**: Visual bridge between GitHub repo and live site

**Elements**:
- GitHub logo + "CleanExpo/Unite-Hub" repo name
- Arrow/connection visual
- Live site screenshot (unite-group.in)
- Code snippets visible
- "Open Source" + "Production Ready" badges

**Schema**: SoftwareSourceCode linked to ImageObject

---

## Technical Implementation

### Services to Build

1. **VEO2 Pro Video Service**
   - File: `src/lib/google-ai/veo-service.ts`
   - Functions:
     - `generateDemoVideo(prompt, duration, overlayType)`
     - `addLogicOverlay(videoUrl, diagramType)`
     - `generateKeyMoments(videoUrl)`

2. **Nano Banana Image Service**
   - File: `src/lib/google-ai/nano-banana-service.ts`
   - Functions:
     - `generateArchitectureDiagram(config)`
     - `generateComparisonVisual(before, after)`
     - `generateStepIcon(step, index)`

3. **Schema Generator**
   - File: `src/lib/schema/visual-schema-generator.ts`
   - Functions:
     - `createVideoSchema(metadata)`
     - `createImageSchema(metadata)`
     - `injectSchemaToPage(schema)`

---

## API Keys Available

From `.env.local`:
- ✅ `GEMINI_API_KEY` - Gemini models
- ✅ `GOOGLE_AI_API_KEY` - Google AI Studio access
- ✅ Google OAuth (for Drive/APIs)

**Access to**:
- Gemini 2.0 Flash (latest)
- VEO 2 Pro (video generation)
- Nano Banana 2 Pro (image generation)
- Imagen 3 (additional image generation)

---

## Deliverables Checklist

### Videos (VEO2 Pro)
- [ ] AI Email Agent demo (10s, with logic overlay)
- [ ] Content Generator demo (10s, with API overlay)
- [ ] Drip Campaign automation (10s, with flow diagram)

### Images (Nano Banana 2 Pro)
- [ ] Unite-Hub architecture diagram (SVG-compatible)
- [ ] Client vs Agency comparison (split-screen)
- [ ] 5 step-by-step icons (HowTo schema matching)
- [ ] GitHub → Website social proof visual

### Schema
- [ ] VideoObject with hasPart for all videos
- [ ] ImageObject with contentLocation for GEO
- [ ] SoftwareSourceCode linking to GitHub
- [ ] JSON-LD transcripts for video accessibility

### Integration
- [ ] Embed videos on landing pages
- [ ] Add images to service pages
- [ ] Inject schema via Next.js metadata
- [ ] Test AI parsing with Google Search Console

---

## Success Metrics

**After implementation**:
- ✅ Videos appear in Google "Key Moments"
- ✅ Images rank for local searches (Logan, Brisbane)
- ✅ AI Overviews include Unite-Hub visuals
- ✅ Rich snippets show video previews
- ✅ Architecture visible to AI parsers

---

## Next Steps

1. Create Google AI client services
2. Generate first demo video (Email Agent)
3. Add VideoObject schema
4. Test in Google Search Console
5. Iterate based on parsing results

**Goal**: Make visuals a ranking tool, not just decoration.

---

*Based on Google's Extractable Logic requirements*
*Part of Anthropic UI/UX optimization phase*
