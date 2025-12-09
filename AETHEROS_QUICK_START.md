# AetherOS Omega Protocol - Quick Start Guide

**Get AetherOS Running in 2 Minutes** ⚡

---

## 🚀 Instant Setup (Mock Mode)

### Step 1: Add Environment Variable (30 seconds)

Open your `.env.local` file and add:

```env
AETHEROS_MOCK_MODE=true
```

**That's it!** AetherOS is now ready to use with mock mode.

---

### Step 2: Test the API (30 seconds)

**Option A - Using cURL:**
```bash
curl -X POST http://localhost:3000/api/aetheros/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "prompt": "professional hero image with modern tech vibes",
    "tier": "draft",
    "auto_tier": true,
    "purpose": "iteration"
  }'
```

**Option B - Using REST Client (VS Code):**
Create a file `test-aetheros.http`:
```http
POST http://localhost:3000/api/aetheros/generate
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "prompt": "professional hero image with modern tech vibes",
  "tier": "draft",
  "auto_tier": true,
  "purpose": "iteration"
}
```

---

### Step 3: See It Work (1 minute)

**What Happens:**
1. ✅ Visual Codex translates your prompt to professional specs
2. ✅ System selects optimal tier (draft/refined/production)
3. ✅ Generates placeholder image (Mock Mode)
4. ✅ Tracks cost in database
5. ✅ Updates session telemetry
6. ✅ Returns result with URLs

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "job_id": "uuid-here",
    "session_id": "uuid-here",
    "tier": "draft",
    "status": "completed",
    "output_url": "https://placehold.co/512x512/2563eb/white?text=DRAFT+Quality",
    "preview_url": "https://placehold.co/640x360/2563eb/white?text=DRAFT+Preview",
    "cost": 0.001,
    "generation_time_ms": 500,
    "quality_score": 60
  },
  "telemetry": {
    "region": "australia-southeast1",
    "energy_arbitrage_active": true,
    "remaining_budget": "$1.669"
  }
}
```

---

## 🎨 What's Working Right Now

### ✅ Fully Functional
1. **Visual Codex v2.0** - Translates generic prompts to professional specs
2. **3-Tier System** - Draft ($0.001), Refined ($0.02), Production ($0.04)
3. **Cost Tracking** - Real-time budget management
4. **Session Telemetry** - Region routing, energy arbitrage
5. **Database Logging** - All jobs tracked in Supabase
6. **API Endpoints** - POST & GET routes working

### 📊 Test Different Tiers

**Draft Tier (Fast & Cheap):**
```json
{
  "prompt": "make it shiny",
  "tier": "draft"
}
```
- Cost: $0.001
- Speed: ~500ms
- Resolution: 512x512
- Use: Rapid iteration

**Refined Tier (Balanced):**
```json
{
  "prompt": "good lighting with modern aesthetic",
  "tier": "refined"
}
```
- Cost: $0.02
- Speed: ~2000ms
- Resolution: 1024x1024
- Use: Client previews

**Production Tier (Best Quality):**
```json
{
  "prompt": "cinematic framing with golden ratio composition",
  "tier": "production"
}
```
- Cost: $0.04
- Speed: ~5000ms
- Resolution: 2048x2048
- Use: Final deliverables

---

## 🧠 Visual Codex in Action

### Generic Prompt → Professional Translation

**Input:**
```json
{
  "prompt": "make it shiny with good lighting and professional look"
}
```

**What AetherOS Understands:**
```
Material: Iridescent Bismuth crystal structure, Sub-surface scattering enabled, 
Refractive Index 2.4, Specular highlights at 0.95 intensity

Lighting: 3-Point Rembrandt setup - Key Light 4500K at 45° (100% intensity), 
Fill Light 5000K at -30° (40% intensity), Teal Rim Light 6500K at 180°

Aesthetic: Clean Corporate Minimalism - Sans-serif typography, Navy/Charcoal 
palette with gold accents, Asymmetric grid layout
```

### Try These Codex Keywords

| User Says | Codex Translates To |
|-----------|-------------------|
| "shiny" | Iridescent Bismuth crystal, metallic shader, anisotropic reflection |
| "good lighting" | 3-Point Rembrandt setup with specific angles and intensities |
| "modern" | Contemporary Flat Design 3.0, gradient mesh, 8px grid system |
| "professional" | Clean Corporate Minimalism, premium matte finish |
| "y2k style" | Chrome gradients, inflated 3D typography, cyber optimism |
| "cinematic" | 2.39:1 anamorphic, shallow DOF, teal-orange LUT |
| "bokeh" | 135mm telephoto, f/1.4 aperture, creamy bokeh circles |
| "cyberpunk" | Magenta/cyan neon sources, wet reflections, Blade Runner palette |

---

## 📋 Check Database Results

After generating, check your Supabase tables:

### `synthex_aetheros_visual_jobs`
```sql
SELECT 
  id,
  tier,
  prompt_original,
  prompt_enhanced,
  status,
  cost,
  output_url,
  created_at
FROM synthex_aetheros_visual_jobs
ORDER BY created_at DESC
LIMIT 5;
```

### `synthex_aetheros_sessions`
```sql
SELECT 
  id,
  total_cost,
  operations_count,
  region_routed,
  energy_savings_pct,
  session_start
FROM synthex_aetheros_sessions
ORDER BY session_start DESC
LIMIT 5;
```

---

## 🔧 Advanced Testing

### Auto-Tier Selection
Let AetherOS choose the best tier:
```json
{
  "prompt": "professional hero image",
  "auto_tier": true,
  "purpose": "iteration",  // or "preview" or "final"
  "aspect_ratio": "16:9"
}
```

### Budget-Aware Generation
System automatically checks budget:
```json
// Will fail if session budget exceeded
{
  "prompt": "expensive production render",
  "tier": "production"
}
```

### Batch Generation
Generate multiple images:
```typescript
// Use the batch API (implement if needed)
POST /api/aetheros/batch-generate
{
  "requests": [
    { "prompt": "hero image 1", "tier": "draft" },
    { "prompt": "hero image 2", "tier": "draft" },
    { "prompt": "hero image 3", "tier": "refined" }
  ]
}
```

---

## 🎯 Production Readiness

### When to Switch to Production Mode

**Current (Mock Mode):**
- ✅ Tests infrastructure
- ✅ Tests cost tracking
- ✅ Tests Visual Codex
- ✅ Returns placeholder images
- ✅ Perfect for development

**Move to Production When:**
1. You have API key for image generation model
2. You've chosen provider (Vertex AI / OpenAI / Replicate)
3. You're ready to pay for actual image generation
4. You want real images instead of placeholders

### Switch to Production

**1. Choose Your Model Provider:**

**Option A - Vertex AI (Recommended):**
```env
AETHEROS_MOCK_MODE=false
AETHEROS_MODEL_PROVIDER=vertex-ai
AETHEROS_IMAGEN_MODEL_ID=imagen-4
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
```

**Option B - OpenAI DALL-E:**
```env
AETHEROS_MOCK_MODE=false
AETHEROS_MODEL_PROVIDER=openai
AETHEROS_OPENAI_MODEL=dall-e-3
OPENAI_API_KEY=sk-proj-your-key-here
```

**Option C - Replicate:**
```env
AETHEROS_MOCK_MODE=false
AETHEROS_MODEL_PROVIDER=replicate
AETHEROS_REPLICATE_MODEL=stability-ai/sdxl
REPLICATE_API_TOKEN=r8_your-token-here
```

**2. Implement Model Integration:**

Edit `src/lib/synthex/aetheros/tieredGenerator.ts` and complete the `generateWithVertexAI` or `generateWithOpenAI` or `generateWithReplicate` functions.

---

## 📚 Documentation

- **Visual Codex Reference**: `AETHEROS_VISUAL_CODEX_V2.md`
- **Full Activation Guide**: `AETHEROS_ACTIVATION_CHECKLIST.md`
- **API Documentation**: (Generate with OpenAPI spec)

---

## 🐛 Troubleshooting

### "synthex_user_tenants does not exist"
**Fixed!** Migration 440 has been updated to use `synthex_tenants.owner_user_id` directly.

### "AETHEROS_MOCK_MODE not working"
Make sure you're reading from `.env.local`, not `.env`. Restart your dev server after adding the variable.

### "No prompt translation happening"
Check console logs - Mock Mode logs all translations:
```
[AetherOS Mock Mode] Generating draft tier image...
[AetherOS Mock Mode] Prompt: Material: Iridescent Bismuth crystal...
```

### "Cost not tracking"
Check that:
1. Session was created with `startSession()`
2. Session ID passed to `generateVisual()`
3. Database triggers are enabled

---

## ✅ Success Criteria

You'll know AetherOS is working when:

1. ✅ API returns 200 status
2. ✅ Placeholder images have correct dimensions per tier
3. ✅ Database shows new job records
4. ✅ Session cost increments correctly
5. ✅ Console shows Visual Codex translations
6. ✅ Response includes telemetry data

---

## 🚀 Next Steps

1. **Test Mock Mode** (5 minutes)
2. **Review Database Changes** (5 minutes)
3. **Read Visual Codex v2.0** (10 minutes)
4. **Plan Model Integration** (decision)
5. **Build Frontend UI** (optional)

---

**Status**: ✅ Ready to test with Mock Mode  
**Documentation**: Complete  
**Training**: Visual Codex v2.0 with 50 entries  
**Database**: Migration 440 applied  

**You can start using AetherOS right now by setting `AETHEROS_MOCK_MODE=true`!**
