# Automated AI Video Production Pipeline — Recommendation & Scope of Work

> Mandate: Replicate Julian Goldie style via automated agentic pipeline
> Date: 2026-06-03
> Owner: Pi-CEO Board
> Status: Active — Phase 0 (Research → Design)

---

## 1. EXECUTIVE SUMMARY

### The Mandate
Build an agentic, end-to-end AI video production line that sources content from Obsidian, processes scripts through AI, generates avatar-led videos with graphics inserts, and publishes automatically to YouTube, Facebook, and LinkedIn via the Syntax platform.

### The Benchmark: Julian Goldie Style
| Element | Julian Goldie Signature | Replication Path |
|---------|------------------------|-----------------|
| Presenter | AI avatar (professional, approachable) | HeyGen photo avatar or digital twin |
| Background | Clean, branded, minimal | HeyGen template + custom CSS |
| Graphics | Text overlays, B-roll inserts, data viz | Image generation (DALL-E/Imagen) + ffmpeg compositing |
| Pacing | 5-10 min, structured, high information density | Script → timed segments |
| Audio | Clear, warm, authoritative TTS | ElevenLabs cloned voice |
| Thumbnails | Bold text, face, high contrast | Image gen + Canva API |

### The Verdict
**Feasible, but not trivial.** The pipeline requires 7 integrated services, 3 API gateways, 2 async job queues, and significant per-video cost ($2-8). A production-grade system needs **10-12 weeks** to build and **$500-1500/month** to operate.

---

## 2. TOOL RESEARCH FINDINGS

### 2.1 HeyGen — Avatar Video Generation

| Capability | Status | Detail |
|-----------|--------|--------|
| **API Version** | v3 (active), v2 (legacy) | `https://api.heygen.com/v2/video/generate` |
| **Authentication** | API Key | Simple header auth, no OAuth complexity |
| **Generation Models** | Photo Avatar, Digital Twin, Template-based | Photo Avatar = fastest; Digital Twin = highest fidelity |
| **Script Input** | Text or Audio | Text → TTS (HeyGen built-in or ElevenLabs import) |
| **Visual Assets** | Upload backgrounds, logos, images | Asset API available |
| **Callback/Webhook** | ✅ | `video.status` events: `processing` → `completed` → `failed` |
| **Async** | Required | Generation time: 30s-5min depending on length |
| **Output** | MP4, up to 4K | Standard HD (1080p) for social |
| **Pricing (Self-Serve)** | ~$2-3/minute of video | Enterprise: custom pricing, lower per-minute |
| **Rate Limits** | 10 req/min (self-serve) | Enterprise: negotiable |

**Key Endpoints:**
```
POST /v2/video/generate          # Create video job
GET  /v1/video_status.get        # Poll status
POST /v1/webhook                 # Register callback
GET  /v2/avatars                 # List available avatars
POST /v1/assets                  # Upload background/logo
```

**Recommendation:** Use HeyGen's **Photo Avatar** for speed (1-2 min generation) and **Digital Twin** for high-value content. Built-in TTS is acceptable but ElevenLabs integration yields better voice quality.

---

### 2.2 ElevenLabs — Text-to-Speech & Voice Cloning

| Capability | Status | Detail |
|-----------|--------|--------|
| **API Version** | v2.1 | `https://api.elevenlabs.io/v2` |
| **Authentication** | API Key | Simple header auth |
| **Voices** | 1000+ premade + custom clones | Clone from 1-5 min samples |
| **Languages** | 32+ including AU English | Critical for local market |
| **Latency** | ~800ms for first chunk | Streaming available for real-time |
| **Audio Formats** | MP3 (default), WAV, PCM | MP3 @ 128kbps for video sync |
| **SSML** | Limited | Basic prosody control |
| **Pricing** | ~$0.10/1000 characters | Starter: 10k chars/mo free; Creator: 100k/$5 |
| **Rate Limits** | 40 req/min (Starter) | 100 req/min (Creator) |

**Key Endpoints:**
```
POST /v2/text-to-speech/{voice_id}   # Generate audio
POST /v2/voice-generation            # Clone voice
GET  /v2/voices                      # List voices
```

**Recommendation:** Clone a professional Australian male voice as the brand standard. Use ElevenLabs for all narration — export audio, upload to HeyGen as the script source for tighter sync control.

---

### 2.3 NotebookLM (Google) — Content Structuring

| Capability | Status | Detail |
|-----------|--------|--------|
| **Function** | AI note-taking, summarization, Q&A | Source: PDFs, Docs, URLs, text |
| **Output** | Markdown, structured outlines, scripts | Export-ready for pipeline ingestion |
| **API** | Via Gemini API | `gemini-2.0-flash` or `gemini-1.5-pro` |
| **Integration** | Can ingest Obsidian vault via export | Or direct API call with source text |
| **Cost** | Free tier: generous | Paid: ~$0.15/1M tokens (Flash) |
| **Script Generation** | Excellent | "Convert this article into a 5-minute video script with intro, 3 sections, CTA" |

**Recommendation:** Use Gemini API directly (not NotebookLM UI) for automation. Pass Obsidian vault content through Gemini to generate structured scripts with timestamps and visual cues.

---

### 2.4 Image Generation — Visual Assets

| Tool | API | Cost | Quality | Speed | Best For |
|------|-----|------|---------|-------|----------|
| **DALL-E 3** (OpenAI) | `images.generate` | $0.04/image | High | 5-10s | Thumbnails, scene backgrounds |
| **Imagen 3** (Google) | Vertex AI | $0.03/image | Very High | 5-15s | Photorealistic inserts |
| **Midjourney** | No official API | $10-60/mo | Highest | 1-2min | Premium content (manual) |
| **Stable Diffusion XL** | Self-hosted/API | ~$0.01/image | Good | 2-5s | Bulk generation, custom models |

**Recommendation:** Use **Imagen 3** for photorealistic B-roll and **DALL-E 3** for graphics/overlays. Both have reliable APIs. Midjourney for hero content only (manual process).

---

### 2.5 Syntax — Publishing & Distribution Hub

| Capability | Status | Detail |
|-----------|--------|--------|
| **YouTube** | API configured | OAuth2, upload endpoint active |
| **Facebook** | API configured | Graph API, page posting |
| **LinkedIn** | API configured | Marketing API, organic posts |
| **Scheduling** | ✅ | Time-based publish queue |
| **Analytics** | ✅ | Per-post performance tracking |
| **Webhooks** | Needs verification | Inbound webhook for "video ready" triggers |

**Critical Gap:** Syntax currently has **no inbound webhook endpoint** for receiving "video generation complete" events from HeyGen. This is a **blocking dependency** for full automation.

---

### 2.6 Publishing APIs — Quotas & Limits

| Platform | Upload Endpoint | Daily Quota | Rate Limit | Format | Max Size |
|----------|----------------|-------------|------------|--------|----------|
| **YouTube** | `POST /youtube/v3/videos` | 1-2 uploads/day (1600 units) | Quota-based | MP4, H.264 | 128GB |
| **Facebook** | `POST /{page-id}/videos` | ~200 calls/hour | 200/hour | MP4 | 15GB |
| **LinkedIn** | 2-step: register + PUT | 1000 req/day | 20/sec | MP4, H.264 | 5GB, 30min |

**Recommendation:** Queue uploads with exponential backoff. YouTube is the most constrained — plan 1-2 videos/day max per channel. Facebook and LinkedIn can handle higher volume.

---

## 3. PROPOSED SYSTEM ARCHITECTURE

### 3.1 Pipeline Stages

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   OBSIDIAN      │────▶│  VAULT SCANNER  │────▶│  GEMINI SCRIPT  │
│  (Source Notes) │     │  (Daily Cron)   │     │   GENERATOR     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  SYNTAX PUBLISH │◀────│  UPLOAD QUEUE   │◀────│  VIDEO COMPOSER │
│ (YT/FB/LI Post) │     │  (YouTube Quota)│     │  (HeyGen + FFMPEG)
└─────────────────┘     └─────────────────┘     └─────────────────┘
         ▲                                               │
         │                                               │
         │     ┌─────────────────┐     ┌─────────────────┐
         └─────│  WEBHOOK HANDLER│◀────│  ELEVENLABS TTS │
               │  (HeyGen Done)  │     │  (Voice + Audio)│
               └─────────────────┘     └─────────────────┘
                          │
                          ▼
               ┌─────────────────┐
               │  IMAGE GEN      │
               │  (Thumbnails +  │
               │   B-roll Assets)│
               └─────────────────┘
```

### 3.2 Data Flow (Per Video)

| Step | Service | Input | Output | Duration |
|------|---------|-------|--------|----------|
| 1. Select | Cron | Vault metadata | Topic + sources | <1s |
| 2. Script | Gemini API | Source content | Structured script + visual cues | 5-15s |
| 3. Audio | ElevenLabs | Script text | MP3 narration | 10-30s |
| 4. Images | Imagen 3/DALL-E | Visual cues | PNG assets | 15-30s |
| 5. Video | HeyGen | Avatar + audio + bg | MP4 draft | 1-3min |
| 6. Compose | FFMPEG (local) | MP4 + images + subs | Final MP4 | 10-30s |
| 7. Thumbnail | DALL-E 3 | Script summary | PNG thumbnail | 5-10s |
| 8. Queue | Syntax | Video + metadata | Scheduled post | <1s |
| 9. Publish | YT/FB/LI APIs | Scheduled post | Live video | Per platform |

**Total per video: 3-5 minutes API time + 1-2 min processing**

### 3.3 Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Orchestrator** | Hermes Cron + Node.js API | Existing infrastructure, async job handling |
| **Script Gen** | Gemini 2.0 Flash | Fast, cheap, structured output (JSON mode) |
| **TTS** | ElevenLabs API v2.1 | Best voice quality, AU English support |
| **Avatar Video** | HeyGen API v3 | Market leader, reliable webhooks |
| **Image Gen** | Imagen 3 + DALL-E 3 | Quality + reliability |
| **Video Compose** | FFMPEG (Node.js bindings) | Add overlays, stitch B-roll, burn subtitles |
| **Thumbnail** | DALL-E 3 + Sharp (Node.js) | Text overlay, resize, optimize |
| **Publishing** | Syntax internal API | Already connected to YT/FB/LI |
| **State Store** | Supabase `knowledge_notes` + new `video_jobs` table | Existing infrastructure |
| **Queue** | BullMQ (Redis) | Retry, backoff, job tracking |

---

## 4. SWOT ANALYSIS

### Strengths
1. **Tools are proven** — HeyGen, ElevenLabs, Imagen are production-grade with real customers
2. **Syntax is pre-connected** — YT/FB/LI APIs already authenticated
3. **Content source exists** — Obsidian vault has 10+ notes ready for script conversion
4. **Agentic infrastructure ready** — Hermes cron, skills, and pipeline patterns exist

### Weaknesses
1. **No HeyGen → Syntax webhook** — Gap in the chain. Requires building an inbound handler
2. **YouTube quota brutally low** — 1-2 uploads/day. Limits scale without multiple channels
3. **Cost per video is real** — $2-8 per video at self-serve pricing. 30 videos/month = $60-240
4. **Voice cloning needs sample** — Need Phill or approved presenter to record 5-min sample
5. **No Australian English voice in HeyGen** — Must use ElevenLabs import

### Opportunities
1. **First-mover in restoration** — No competitors doing AI video at this quality level
2. **Multi-entity scale** — One pipeline serves RA, DR, NRPG, CCW, CARSI with entity-specific avatars
3. **Repurposing engine** — One script → short-form (60s TikTok), long-form (10min YT), audio podcast
4. **SEO boost** — Video content dramatically improves search ranking for restoration keywords
5. **Lead generation** — YouTube + LinkedIn video = highest-converting content format for B2B

### Threats
1. **API breakage** — HeyGen/ElevenLabs could change pricing or deprecate endpoints
2. **Platform policy changes** — YouTube/FB could restrict AI-generated content labeling
3. **Quality variance** — Automated scripts risk generic, low-value content without human QA
4. **Cost creep** — At scale (100+ videos/month), costs hit $800-1500/mo
5. **Avatar fatigue** — Audience may detect/reject AI presenters over time
6. **Dependency on single supplier** — HeyGen monopoly in avatar video space

---

## 5. SCOPE OF WORK

### Phase 1: Foundation (Week 1-2) — $0 dev cost
- [ ] Set up HeyGen account + API key (self-serve plan)
- [ ] Set up ElevenLabs account + API key (Creator plan)
- [ ] Record 5-minute voice sample for cloning (Phill or approved presenter)
- [ ] Create 1 test avatar in HeyGen (Photo Avatar)
- [ ] Generate 1 end-to-end test video manually (Obsidian note → script → audio → video → upload)
- [ ] Validate visual quality against Julian Goldie benchmark

### Phase 2: Pipeline Build (Week 3-6) — ~40 hours dev
- [ ] Build `video_jobs` table in Supabase (job state machine: pending → scripting → audio → images → video → composing → publishing → done)
- [ ] Build Script Generator service (Gemini API → structured script with timestamps)
- [ ] Build Audio Generator service (ElevenLabs → MP3)
- [ ] Build Image Generator service (Imagen 3/DALL-E → thumbnails + B-roll)
- [ ] Build Video Generator service (HeyGen API → MP4 with webhook callback)
- [ ] Build Webhook Handler (receive HeyGen completion → trigger compose step)
- [ ] Build Video Composer (FFMPEG → add B-roll, subtitles, logo overlay)
- [ ] Build Publishing Queue (Syntax API → schedule to YT/FB/LI)

### Phase 3: Automation & Scale (Week 7-8) — ~20 hours dev
- [ ] Build daily cron: scan vault → identify video-worthy notes → create jobs
- [ ] Build QA gate: human approval before publishing (Syntax draft queue)
- [ ] Build multi-entity routing: RA jobs → RA avatar, DR jobs → DR avatar
- [ ] Build analytics pipeline: track views per video per platform
- [ ] Build cost tracking: per-video cost breakdown

### Phase 4: Polish (Week 9-10) — ~15 hours dev
- [ ] Custom HeyGen templates per entity (branded backgrounds)
- [ ] A/B test thumbnails (2 variants per video)
- [ ] Add captions/burned subtitles (Whisper API for accuracy)
- [ ] Build "Ask Hermes" integration: founder can request video on any topic

### Phase 5: Production (Week 11-12) — Ongoing
- [ ] Run at full cadence (2 videos/day across all entities)
- [ ] Monitor costs, iterate on prompts, retire underperforming formats
- [ ] Evaluate enterprise HeyGen pricing for volume discounts

---

## 6. COST MODEL

### Per-Video Cost (Self-Serve Pricing)

| Component | Cost | Unit |
|-----------|------|------|
| HeyGen Photo Avatar | $2.00 | Per minute |
| ElevenLabs TTS | $0.50 | Per 5-min script (~5000 chars) |
| Imagen 3 Images | $0.15 | Per 5 images (B-roll + thumbnail) |
| Gemini API | $0.01 | Per script generation |
| FFMPEG Processing | $0.00 | Local compute |
| **Total per 5-min video** | **~$2.65** | — |

### Monthly Cost Scenarios

| Videos/Month | Cost/Month | Notes |
|-------------|-----------|-------|
| 10 (pilot) | $26.50 | Test phase, 1 entity |
| 30 (1/day) | $79.50 | Single entity, daily publishing |
| 60 (2/day, multi-entity) | $159 | RA + DR + CCW |
| 120 (4/day, full scale) | $318 | All entities, repurposed formats |

### Fixed Costs

| Item | Monthly |
|------|---------|
| HeyGen Self-Serve Plan | $29-89 |
| ElevenLabs Creator Plan | $5-22 |
| OpenAI API (DALL-E) | $10-20 |
| Google Cloud (Imagen) | $5-15 |
| **Total Fixed** | **~$50-145/mo** |

**Recommendation:** Start with **$100/month budget** for the pilot (10 videos). Scale to $200/month for full operation.

---

## 7. RISK REGISTER

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| HeyGen API changes/breakage | Medium | High | Abstract behind internal adapter; monitor changelog |
| YouTube quota exhaustion | High | Medium | Queue with backoff; apply for quota increase; use multiple channels |
| AI content policy changes | Medium | High | Label AI-generated content; maintain human QA gate |
| Cost overruns | Medium | Medium | Hard cost ceiling per month; auto-pause if exceeded |
| Low video quality/engagement | Medium | High | weekly content review; A/B test thumbnails; iterate prompts |
| Voice cloning approval issues | Low | High | Legal review; explicit consent documentation |
| Avatar fatigue from audience | Medium | Medium | Rotate avatars; mix in real presenter videos quarterly |
| FFMPEG compositing failures | Low | Medium | Validation step; fallback to raw HeyGen output |

---

## 8. DECISION REQUIRED

| Decision | Options | Recommendation |
|----------|---------|----------------|
| **Budget approval** | $100/mo pilot / $200/mo full | Approve $100/mo for 4-week pilot |
| **Presenter voice** | Phill clone / Generic pro / Hire voice actor | Clone Phill's voice for authenticity |
| **Avatar style** | Photo Avatar / Digital Twin / Real actor | Photo Avatar for speed; Digital Twin for hero content |
| **QA gate** | Fully auto / Draft approval / Full review | Draft approval: auto-generate, founder approves before publish |
| **First entity** | RA / DR / CCW / CARSI | Start with **RestoreAssist** — most content-ready |
| **Publishing cadence** | Daily / 3x weekly / Weekly | 3x weekly (Mon/Wed/Fri) for pilot |
| **Video length** | 60s shorts / 5-min explainers / 10-min deep dives | 5-min explainers for pilot; add shorts in Phase 4 |

---

## 9. NEXT STEPS

| Step | Owner | Due |
|------|-------|-----|
| Approve $100/mo pilot budget | Founder (Phill) | 2026-06-05 |
| Record 5-min voice sample for cloning | Phill | 2026-06-07 |
| Create HeyGen + ElevenLabs accounts | Pi-DEV-OPS | 2026-06-05 |
| Build `video_jobs` table migration | Pi-DEV | 2026-06-09 |
| Produce 1 manual test video end-to-end | Pi-DEV-OPS | 2026-06-12 |
| Build Phase 1 pipeline (script → audio → video) | Pi-DEV | 2026-06-19 |
| First automated video (draft, pending approval) | System | 2026-06-26 |

---

## 10. APPENDICES

### A. API Reference Cheat Sheet
```bash
# HeyGen — Generate Video
curl -X POST https://api.heygen.com/v2/video/generate \
  -H "X-Api-Key: $HEYGEN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "video_inputs": [{
      "character": { "type": "avatar", "avatar_id": "AVATAR_ID" },
      "voice": { "type": "audio", "audio_url": "ELEVENLABS_MP3_URL" },
      "background": { "type": "color", "value": "#1a1a1a" }
    }],
    "dimension": { "width": 1920, "height": 1080 }
  }'

# ElevenLabs — Generate Speech
curl -X POST https://api.elevenlabs.io/v2/text-to-speech/VOICE_ID \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Welcome to RestoreAssist...",
    "model_id": "eleven_multilingual_v2",
    "voice_settings": { "stability": 0.5, "similarity_boost": 0.75 }
  }' \
  --output narration.mp3

# Gemini — Generate Script
curl -X POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=$GEMINI_API_KEY \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Convert this article into a 5-minute video script with intro, 3 sections, call-to-action. Include visual cues for each section. Format as JSON with timestamps."
      }]
    }],
    "generationConfig": { "response_mime_type": "application/json" }
  }'
```

### B. Glossary
| Term | Definition |
|------|-----------|
| **Photo Avatar** | HeyGen feature: animate a still photo to speak |
| **Digital Twin** | HeyGen feature: full 3D avatar from video sample |
| **Hyperframes** | HeyGen: AI-generated scene backgrounds |
| **TTS** | Text-to-Speech |
| **B-roll** | Supplementary footage/images inserted over narration |
| **Burned Subtitles** | Subtitles embedded in video (not toggleable) |
| **FFMPEG** | Open-source video processing toolkit |

---

*Document Version: 1.0.0*
*Classification: Internal — Pi-CEO Board*
*Next Review: 2026-06-10*
