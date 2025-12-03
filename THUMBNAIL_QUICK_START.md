# VEO Thumbnail Generation - Quick Start Guide

**⚡ Get professional YouTube thumbnails in 3 minutes**

---

## Prerequisites Checklist

- [ ] Node.js 22+ installed
- [ ] Gemini API key obtained
- [ ] Canvas dependency installed: `npm install canvas`

---

## Step 1: Set API Key

```bash
export GEMINI_API_KEY="your-api-key-here"
```

**Windows PowerShell**:
```powershell
$env:GEMINI_API_KEY="your-api-key-here"
```

---

## Step 2: Generate Thumbnails

**Option A: Full Pipeline (Recommended)**
```bash
npm run generate:thumbnails:full
```
⏱️ Time: ~3 minutes | 💰 Cost: $0.06-0.12

**Option B: Step-by-Step**
```bash
# Step 1: Generate base images (no text)
npm run generate:thumbnails

# Step 2: Add text overlays
npm run generate:thumbnails:overlay
```

---

## Step 3: Review Output

**Location**: `public/images/thumbnails/`

**Files Created**:
```
✓ video-scattered-leads.jpg       (final, with text)
✓ video-5-minute-rule.jpg         (final, with text)
✓ video-lead-scoring.jpg          (final, with text)
✓ video-realtime-data.jpg         (final, with text)
✓ video-approval-bottleneck.jpg   (final, with text)
✓ video-setup-tax.jpg             (final, with text)
```

**Quick Visual Check**:
1. Open `public/images/thumbnails/` in file browser
2. Preview each `.jpg` file
3. Verify text is readable
4. Confirm emotion matches video topic

---

## Step 4: Upload to YouTube

**For Each Video**:
1. Open YouTube Studio
2. Go to Videos → Select video
3. Click "Edit"
4. Under "Thumbnail" → "Upload thumbnail"
5. Select corresponding `.jpg` file
6. Click "Save"

---

## Thumbnail Specifications

| Video File | YouTube Video Title |
|------------|---------------------|
| `video-scattered-leads.jpg` | Your Best Leads Are Hiding in 5 Different Places |
| `video-5-minute-rule.jpg` | The 5-Minute Conversion Rule Nobody Talks About |
| `video-lead-scoring.jpg` | Why Your Salesperson Is Wasting 40+ Hours on Cold Leads |
| `video-realtime-data.jpg` | The 48-Hour Information Problem |
| `video-approval-bottleneck.jpg` | Why Approval Processes Kill Your Best Ideas |
| `video-setup-tax.jpg` | The Setup Tax That's Killing Your Growth |

---

## Quality Checklist

Before uploading, verify:

- [ ] Text is readable at small size (test at 120x90 preview)
- [ ] Colors have high contrast (white/gold/red on dark background)
- [ ] Person's face is visible and emotion is clear
- [ ] No text clipping or overlap
- [ ] File size <200KB (YouTube optimal)
- [ ] Resolution is 1280x720
- [ ] Synthex branding visible in bottom-right

---

## Troubleshooting

### ❌ "GEMINI_API_KEY environment variable not set"
```bash
export GEMINI_API_KEY="your-key"
```

### ❌ "Canvas module not found"
```bash
npm install canvas
```

### ❌ "Base image not found"
Run Phase 1 first:
```bash
npm run generate:thumbnails
```

### ❌ File size >200KB
Edit `scripts/add-thumbnail-text-overlays.mjs`:
- Change `quality: 0.95` to `quality: 0.85`

---

## Success Metrics

**Industry Baseline**: 2-5% CTR
**Our Target**: 8-12% CTR (160-240% improvement)

**Track in YouTube Analytics**:
1. YouTube Studio → Analytics
2. Engagement tab
3. Click-through rate (CTR)
4. Monitor for 7 days
5. Compare to baseline

---

## Need Help?

**Full Documentation**: `docs/VEO_THUMBNAIL_GENERATION.md`
**Detailed Report**: `THUMBNAIL_GENERATION_REPORT.md`
**Video Scripts**: `docs/AUTHENTIC_VEO_PROMPTS_PHASE3.md`

---

**That's it! You're ready to launch Phase 3.** 🚀
