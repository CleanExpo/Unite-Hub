# Google AI Tools - Latest (December 2025)
## VEO 3.1, Gemini 2.5 Flash Image, and Video Generation

**Updated**: December 29, 2025
**Purpose**: Production-ready visual asset generation for Unite-Hub

---

## Latest Models Available (December 2025)

### 1. VEO 3.1 (Video Generation) - LATEST ✅

**What's New** (Released October 2025, latest docs Dec 22, 2025):
- **State-of-the-art**: Best video generation model from Google
- **Native Audio**: Generates synchronized sound effects and conversations
- **Quality**: 8-second 720p or 1080p videos with stunning realism
- **Advanced Features**:
  - Video extension (extend previously generated videos)
  - Frame-specific generation (specify first/last frames)
  - Image-based direction (up to 3 reference images)
  - Cinematic styles understanding

**Pricing** (December 2025):
- **VEO 3**: $0.75/second (with audio)
- **VEO 3 Fast**: $0.40/second (with audio)
- **VEO 3.1**: Premium tier (latest features)

**Previous Models**:
- VEO 2: $0.35/second (still available, no audio)
- VEO 3.0: $0.75/second
- VEO 3.1 Fast: $0.40/second (best value)

### 2. Gemini 2.5 Flash Image (Nano Banana) - LATEST ✅

**What It Is**:
- **Official Name**: Gemini 2.5 Flash Image
- **Marketing Name**: Nano Banana
- **Model ID**: `gemini-2.5-flash-image`

**What's New** (Last updated Dec 18, 2025):
- Balance of price and performance
- Speed and cost-effectiveness of Gemini 2.5 Flash
- Optimized for image understanding AND generation
- Best for: Quick iterations, multiple variations

**Pricing**:
- **Cost**: $30.00 per 1M output tokens
- **Per Image**: ~1290 tokens = $0.039 per image
- **Very affordable** for high-volume generation

### 3. Gemini 3 Pro Image Preview (Nano Banana Pro) - PREMIUM

**What It Is**:
- **Model ID**: `gemini-3-pro-image-preview`
- **Best For**: Professional asset production
- **Specialty**: Advanced text rendering (sharp, legible text in images)
- **Features**: Multi-step editing, character consistency (up to 5 characters)

**Pricing**:
- **1080p/2K**: $0.139 per image
- **4K**: $0.24 per image
- **Higher quality**, slower, costlier than Gemini 2.5 Flash Image

---

## How to Use (December 2025)

### Access Methods

1. **Gemini API** (Recommended for production)
   - Direct API access
   - Node.js, Python, Go, cURL support
   - Pay-per-use pricing

2. **Google AI Studio** (Best for testing)
   - Web interface: https://aistudio.google.com
   - Test prompts visually
   - Generate code snippets
   - Free tier available

3. **Vertex AI** (Enterprise)
   - GCP integration
   - Advanced features
   - Enterprise support

### Quick Start: VEO 3.1 Video Generation

**Official GitHub Example**:
https://github.com/google-gemini/veo-3-nano-banana-gemini-api-quickstart

**Basic Code** (from official docs):

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Generate video with VEO 3.1
const model = genAI.getGenerativeModel({ model: 'veo-3.1-generate-preview' });

const result = await model.generateContent({
  contents: [{
    parts: [{
      text: 'A professional screen recording showing an AI analyzing an email and categorizing a lead'
    }]
  }],
  generationConfig: {
    duration: 8, // 5-8 seconds supported
    aspectRatio: '16:9', // or '9:16', '1:1'
    resolution: '1080p' // or '720p'
  }
});

// Result contains video data
const videoData = result.response.videoData;
```

### Quick Start: Gemini 2.5 Flash Image

**Official Documentation**:
https://ai.google.dev/gemini-api/docs/image-generation

**Basic Code**:

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Generate image with Gemini 2.5 Flash Image
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });

const result = await model.generateContent({
  contents: [{
    parts: [{
      text: 'A professional diagram showing a 3-layer software architecture'
    }]
  }]
});

// Get base64 image data
const imageData = result.response.candidates[0].content.parts[0].inlineData;
// imageData.data is base64 encoded image
// imageData.mimeType is 'image/png' or 'image/jpeg'
```

---

## Recommended Approach for Unite-Hub

### For Images (Use Gemini 2.5 Flash Image)

**Why**:
- Very affordable ($0.039/image)
- Fast generation
- Good quality for web assets
- Already works with our Gemini API key

**Use Cases**:
- Marketing visuals
- Feature screenshots
- Social media images
- Quick iterations

**Model**: `gemini-2.5-flash-image`

### For High-Quality Images (Use Gemini 3 Pro Image)

**Why**:
- Best text rendering
- Professional quality
- Character consistency

**Use Cases**:
- Hero images with text overlays
- Branded assets
- Print materials

**Model**: `gemini-3-pro-image-preview`
**Cost**: $0.139-$0.24 per image

### For Videos (Use VEO 3.1 Fast)

**Why**:
- Latest model (December 2025)
- Native audio generation
- Best value: $0.40/second
- 1080p quality

**Use Cases**:
- Agent demo videos
- Feature demonstrations
- Tutorial content

**Model**: `veo-3.1-fast-generate-preview`
**Cost**: $0.40/second = $3.20 per 8-second video

---

## Implementation Plan for Unite-Hub

### Phase 1: Update Image Service (Immediate)

**Current**: Using Gemini 2.0 Flash (via SVG generation)
**Update to**: Gemini 2.5 Flash Image (native image generation)

**Benefits**:
- Raster images (PNG/JPEG) for photos
- SVG via code generation (current approach)
- Much cheaper than before
- Better quality

### Phase 2: Add Video Generation (When Ready)

**Current**: Metadata only
**Update to**: VEO 3.1 Fast for actual video generation

**Cost**: 3 videos × 8 seconds × $0.40 = **$9.60 total**

**Videos to Generate**:
1. AI Email Agent demo (8s) - $3.20
2. Content Generator demo (8s) - $3.20
3. Campaign Orchestrator demo (8s) - $3.20

### Phase 3: Add Logic Overlays

**Method 1**: Generate overlay separately, composite in post
**Method 2**: Include overlay in prompt (mermaid diagram, JSON, code)
**Method 3**: Use reference images for consistent branding

---

## Official Resources (December 2025)

### Documentation
- **Gemini API Docs**: [ai.google.dev/gemini-api/docs](https://ai.google.dev/gemini-api/docs)
- **VEO 3.1 Guide**: [Build with Veo 3 - Google Developers Blog](https://developers.googleblog.com/en/veo-3-now-available-gemini-api/)
- **Image Generation**: [Gemini Image Generation Docs](https://ai.google.dev/gemini-api/docs/image-generation)
- **Video Generation**: [Generate videos with Veo 3.1](https://ai.google.dev/gemini-api/docs/video)

### Code Examples
- **VEO 3 Quickstart**: [GitHub - google-gemini/veo-3-nano-banana-gemini-api-quickstart](https://github.com/google-gemini/veo-3-nano-banana-gemini-api-quickstart)
- **Colab Notebook**: VEO Quickstart Colab (linked in docs)
- **NextJS App**: VEO 3 starter app in Google AI Studio

### Tools
- **Google AI Studio**: [aistudio.google.com](https://aistudio.google.com/models/veo-3)
- **Test VEO 3**: Interactive model page
- **Gemini API Console**: API key management and quotas

---

## Current Status for Unite-Hub

### What We Have ✅
- 9 SVG images (generated via Gemini 2.0 Flash)
- 3 video metadata specs (VEO 2 pricing)
- Complete JSON-LD schema
- Services ready for upgrade

### What to Update 🔄
1. Update image service to use `gemini-2.5-flash-image`
2. Update video service to use `veo-3.1-fast-generate-preview`
3. Add actual video generation (currently metadata only)
4. Update pricing in documentation

### Estimated Costs
- **Images**: Already generated (free via Gemini 2.0 Flash)
- **Videos** (if/when generated): $9.60 for 3×8s videos
- **Total**: <$10 for complete visual asset library

---

## Next Steps

1. ✅ Research complete (this document)
2. Update services to latest models
3. Test image generation with Gemini 2.5 Flash Image
4. Generate actual videos with VEO 3.1 Fast (optional)
5. Deploy updated services

---

**Sources**:
- [Introducing Veo 3.1 - Google Developers Blog](https://developers.googleblog.com/introducing-veo-3-1-and-new-creative-capabilities-in-the-gemini-api/)
- [Veo 3 Now Available in Gemini API](https://developers.googleblog.com/en/veo-3-now-available-gemini-api/)
- [Gemini 2.5 Flash Image Guide](https://developers.googleblog.com/introducing-gemini-2-5-flash-image/)
- [Image Generation Documentation](https://ai.google.dev/gemini-api/docs/image-generation)
- [Video Generation Documentation](https://ai.google.dev/gemini-api/docs/video)
- [VEO 3 Quickstart GitHub](https://github.com/google-gemini/veo-3-nano-banana-gemini-api-quickstart)
