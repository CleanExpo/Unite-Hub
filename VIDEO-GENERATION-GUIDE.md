# Video Generation Guide - VEO 3.1 Fast
## Manual Generation via Google AI Studio

**Date**: December 29, 2025
**Status**: Video metadata ready, awaiting manual generation
**Cost**: $9.60 for 3 professional demo videos

---

## Why Manual Generation?

VEO 3.1 is **not available** via standard Gemini API (`generateContent`).

**Access methods**:
1. ✅ **Google AI Studio** (web interface) - Recommended
2. ⚙️ **Vertex AI** (requires GCP setup)
3. 🔧 **Replicate/fal.ai** (third-party APIs)

**We attempted**: Gemini API programmatic generation
**Result**: Model not found (404 error - expected)
**Solution**: Use Google AI Studio web interface

---

## How to Generate Videos (Step-by-Step)

### Preparation (Complete) ✅

1. ✅ Video specifications created (`video-metadata.json`)
2. ✅ Prompts optimized for VEO 3.1 Fast
3. ✅ All segments defined (hasPart for schema)
4. ✅ Logic overlays specified (mermaid, JSON)
5. ✅ VideoObject schema ready

### Generation (Manual - 30 minutes total)

#### Step 1: Open Google AI Studio

Visit: https://aistudio.google.com/models/veo-3

**Sign in** with Google account (use same account as GEMINI_API_KEY)

#### Step 2: Generate Video 1 - AI Email Agent

**Settings**:
- Model: VEO 3.1 Fast (or VEO 3 if 3.1 not available)
- Duration: 8 seconds
- Aspect Ratio: 16:9
- Resolution: 1080p
- Audio: Enable

**Prompt** (copy from below):
```
Create a professional 8-second screen recording demonstration of an AI Email Agent:

SECOND 1-2: Email notification arrives
- Modern inbox interface
- Email subject: "Interested in your marketing services"
- From: "john@example.com"
- AI processing indicator activates

SECOND 3-5: AI analysis in real-time
- Intent extracted: "Service inquiry - pricing information"
- Sentiment analyzed: "Positive (0.85 confidence)"
- Contact score updates visibly: +15 points
- Smooth animations showing AI processing

SECOND 6-8: Automatic categorization
- Lead badge changes to "Hot" (red/orange)
- Automatically added to "Pricing Follow-up" campaign
- Dashboard refreshes showing new hot lead
- Success indicator

OVERLAY REQUIREMENT:
Include a subtle mermaid diagram in bottom-right corner (20% opacity) showing:
Email → Intent Extraction → Sentiment Analysis → Score Update → Categorization

STYLE:
- Professional, clean UI
- Modern design (Next.js/React aesthetic)
- Smooth animations
- High-fidelity screen recording quality
- Technical/educational content for developers

This is a technical demonstration showing autonomous AI marketing automation.
```

**Generate**: Click "Generate" button
**Wait**: 2-5 minutes
**Download**: Save as `ai-email-agent-demo.mp4`

**Cost**: $3.20 (8s × $0.40)

---

#### Step 3: Generate Video 2 - Content Generator

**Same settings as Video 1**

**Prompt**:
```
Create a professional 8-second demonstration of AI content generation:

SECOND 1-2: Contact record displayed
- Name: "Sarah Chen"
- Company: "Acme Corp"
- Score: 75 (warm lead)
- History: 5 emails, 3 opens visible
- "Generate Content" button clicked

SECOND 3-5: Claude Opus 4 processing
- Loading animation: "Claude Opus 4 analyzing contact history..."
- Template visible with {firstName}, {company} tokens
- AI generation in progress indicator
- Professional, modern UI

SECOND 6-8: Personalized email generated
- Email preview appears:
  "Hi Sarah, based on Acme Corp's recent engagement..."
- {firstName} → Sarah (highlighted briefly)
- {company} → Acme Corp (highlighted briefly)
- CTA button visible and styled
- "Ready to send" indicator

OVERLAY REQUIREMENT:
Show JSON API request/response (25% opacity terminal window):
{
  "model": "claude-opus-4",
  "contact": {"firstName": "Sarah", "company": "Acme Corp"},
  "output": "personalized_email"
}

STYLE:
- Clean, professional interface
- Smooth transitions
- Show personalization clearly
- Technical demonstration quality

This demonstrates AI-powered personalized content generation.
```

**Download**: Save as `content-generator-demo.mp4`
**Cost**: $3.20

---

#### Step 4: Generate Video 3 - Orchestrator

**Same settings as Video 1**

**Prompt**:
```
Create a professional 8-second demo of automated campaign orchestration:

SECOND 1-2: Campaign dashboard view
- Multi-step campaign visible
- 5 steps with time delays shown
- Trigger condition: "Contact score > 60"
- Clean workflow visualization

SECOND 3-5: Automation in action
- Contact "Sarah Chen" (score: 75) enters campaign
- Trigger fires automatically
- Step 1 executes: "Welcome email" sent
- Wait condition shown: "2 days delay"
- Step 2 queued

SECOND 6-8: Conditional branching
- Email engagement tracked: "Opened = True"
- Conditional logic evaluates
- Orchestrator routes to "Engaged" path automatically
- Next step in sequence activated
- Workflow continues autonomously

OVERLAY REQUIREMENT:
Mermaid diagram overlay (20% opacity) showing:
Trigger → Step 1 → Wait → Condition → Branch A/B

STYLE:
- Professional workflow UI
- Clear automation indicators
- Smooth state transitions
- Technical demonstration quality

This shows autonomous campaign management and conditional routing.
```

**Download**: Save as `orchestrator-demo.mp4`
**Cost**: $3.20

---

### Step 5: Add Videos to Project

Once downloaded, place in:
```
D:\Unite-Hub\public\videos\
├── ai-email-agent-demo.mp4
├── content-generator-demo.mp4
└── orchestrator-demo.mp4
```

Then commit:
```bash
git add public/videos/*.mp4
git commit -m "feat(video): Add VEO 3.1 generated demo videos

Generated via Google AI Studio:
- AI Email Agent demo (8s, $3.20)
- Content Generator demo (8s, $3.20)
- Orchestrator demo (8s, $3.20)

Total: $9.60 spent on professional video generation
All videos include logic overlays for Google ranking"

git push origin main
```

---

## Alternative: Vertex AI Setup (Advanced)

If you want programmatic generation:

### 1. Set up Google Cloud Project
```bash
gcloud init
gcloud auth application-default login
```

### 2. Enable Vertex AI API
```bash
gcloud services enable aiplatform.googleapis.com
```

### 3. Update code to use Vertex AI client
Use `@google-cloud/aiplatform` instead of `@google/generative-ai`

### 4. Call VEO via Vertex AI
```typescript
import {PredictionServiceClient} from '@google-cloud/aiplatform';

const client = new PredictionServiceClient();
// Use Vertex AI Video generation API
```

**Cost**: Same ($0.40/second), but requires GCP setup

---

## Current Status

### What We Have ✅
- ✅ 3 complete video specifications (prompts, segments, schema)
- ✅ All metadata in `video-metadata.json`
- ✅ VideoObject schema with hasPart (key moments)
- ✅ Cost estimates ($9.60 total)
- ✅ Production-ready services

### What's Needed
- ⏳ Manual generation via Google AI Studio
- ⏳ 3 video files (.mp4 format)
- ⏳ ~30 minutes total time

### After Generation
- Add videos to `/public/videos/`
- Update schema with actual video URLs
- Deploy to production
- Videos will rank in Google with key moments

---

## Why This Approach?

**Google's Strategy**: VEO is premium, high-cost service
- Not exposed via free-tier Gemini API
- Requires Google AI Studio (web) or Vertex AI (enterprise)
- Prevents accidental high-cost usage

**Our Benefit**:
- Full control over generation
- Visual preview before paying
- Can iterate on prompts
- Same quality, same cost

---

## Quick Links

**Google AI Studio**: https://aistudio.google.com/models/veo-3
**Our Prompts**: `D:\Unite-Hub\public\generated-assets\video-metadata.json`
**Output Folder**: `D:\Unite-Hub\public\videos\`

**Total Investment**: $9.60 for 3 professional demo videos with logic overlays

---

**Video infrastructure complete. Manual generation pending (optional).** ✅
