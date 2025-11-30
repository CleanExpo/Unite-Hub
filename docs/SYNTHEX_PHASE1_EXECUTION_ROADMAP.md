# SYNTHEX Phase 1: Execution Roadmap

**Status**: 🚀 Ready to Execute
**Budget**: $100 total | Phase 1 allocation: $4.65
**Timeline**: Week 2-3 (7-10 days for concepts, feedback, refinement)
**Model**: Gemini 2.5 Flash Image ($0.1035 per image)

---

## Phase 1 Overview

This phase generates 45 concept variations to test:
- ✅ Prompt effectiveness
- ✅ Visual direction and tone
- ✅ Industry-specific color schemes
- ✅ Professional vs illustrated vs isometric styles
- ✅ Composition and framing preferences

**Total Concepts**:
- 18 industry card variations (3 styles × 6 industries)
- 3 hero section concepts
- 24 blog featured images (4 articles × 6 industries)

**Cost Breakdown**:
- Industry cards: $1.86 (18 images × $0.1035)
- Hero section: $0.31 (3 images × $0.1035)
- Blog featured: $2.48 (24 images × $0.1035)
- **Total**: $4.65

---

## Quick Start (3 Commands)

```bash
# 1. Generate all 45 Phase 1 concepts
npm run synthex:phase1

# 2. Run automated quality assessment (6-dimensional scoring)
npm run synthex:assess-phase1

# 3. View detailed results
cat public/assets/concepts/phase1_quality_assessment.txt
```

**Estimated Time**:
- Generation: 10-15 minutes (45 API calls with rate limiting)
- Assessment: 5 minutes
- **Total**: ~20 minutes

---

## Detailed Execution Steps

### Step 1: Verify Environment

```bash
# Check GEMINI_API_KEY is set
echo $GEMINI_API_KEY

# If not set:
export GEMINI_API_KEY=your-key-here
```

### Step 2: Generate Phase 1 Concepts

```bash
npm run synthex:phase1
```

**What This Does**:
1. Loads `config/generation_configs/phase1_concepts.json`
2. Creates output directories: `public/assets/concepts/{industry-cards,hero-section,blog-featured}`
3. Generates prompts for each concept from templates
4. Calls Gemini 2.5 Flash Image API for prompt optimization
5. Saves results to `public/assets/concepts/phase1_generation_results.json`
6. Tracks costs in `logs/phase1_costs.json`

**Output Structure**:
```
public/assets/concepts/
├── phase1_generation_results.json    (45 optimized prompts + metadata)
├── industry-cards/                    (directory for card images)
├── hero-section/                      (directory for hero images)
├── blog-featured/                     (directory for blog images)
└── (image files when generated)
```

**Success Indicators**:
```
════════════════════════════════════════
PHASE 1 GENERATION COMPLETE
════════════════════════════════════════
✓ Generated: 45/45 concepts
✗ Failed: 0
📊 Total Tokens: ~12,000-15,000
💰 Phase 1 Cost: $4.65
💳 Budget Remaining: $95.35
```

### Step 3: Run Quality Assessment

```bash
npm run synthex:assess-phase1
```

**What This Does**:
1. Loads generated prompts from `phase1_generation_results.json`
2. Scores each concept on 6 dimensions (0-10):
   - **Brand Alignment** (25%): Synthex visual identity
   - **Technical Quality** (20%): Focus, exposure, composition
   - **Message Clarity** (20%): Communicates intent clearly
   - **Emotional Tone** (15%): Evokes target mood
   - **Audience Fit** (10%): Resonates with target audience
   - **Uniqueness** (10%): Original vs generic
3. Calculates weighted overall score
4. Classifies each image:
   - **Auto-Approve** (≥8.5): Production-ready
   - **Human Review** (6.0-8.5): Needs stakeholder review
   - **Reject** (<6.0): Regenerate with updated prompts
5. Generates comprehensive assessment report

**Output Files**:
- `public/assets/concepts/phase1_quality_assessment.json` (detailed scores)
- `public/assets/concepts/phase1_quality_assessment.txt` (human-readable report)

**Sample Report Output**:
```
SYNTHEX PHASE1 - QUALITY ASSESSMENT REPORT
═══════════════════════════════════════════════════════════════

Assessment Date: 2025-11-30T14:35:22.123Z

SUMMARY METRICS
───────────────
Total Assessed: 45
Auto-Approved:  38 (84.4%)
Human Review:   6 (13.3%)
Rejected:       1 (2.2%)

OVERALL SCORE: 8.2/10

DIMENSION SCORES
────────────────
Brand Alignment:    8.4/10 (25% weight)
Technical Quality:  8.1/10 (20% weight)
Message Clarity:    8.3/10 (20% weight)
Emotional Tone:     8.0/10 (15% weight)
Audience Fit:       7.9/10 (10% weight)
Uniqueness:         8.2/10 (10% weight)

RECOMMENDATIONS
───────────────
✓ Excellent results - proceed to Phase 2
✓ 38 images approved for production
⚠ 6 images require stakeholder review
✗ 1 image recommended for regeneration
```

### Step 4: Collect Stakeholder Feedback

**Stakeholder Feedback Form** (for 6-7 key stakeholders):

For each image category, ask:
1. **Visual Direction**: Which style resonates most? (photorealistic, illustrated, isometric)
2. **Mood**: Does the image convey professionalism and expertise?
3. **Color Effectiveness**: Do the industry colors work? (plumb: blue, elec: orange, etc.)
4. **Composition**: Is the subject and composition clear?
5. **Overall**: Would you use this on your marketing materials? (Yes/Maybe/No)

**Template Response Template**:
```
INDUSTRY CARDS - PLUMBING

Card Style 1 (Photorealistic):
  Visual: ⭐⭐⭐⭐⭐ Professional plumber with tools
  Mood: ✓ Conveys expertise
  Color: ✓ Blue works well
  Composition: ✓ Subject clear
  Overall: YES - Use in production

Card Style 2 (Illustrated):
  Visual: ⭐⭐⭐⭐☆ Friendly but maybe too casual
  Mood: ⚠ Good for friendly tone
  Color: ✓ Blue consistent
  Composition: ✓ Clear
  Overall: MAYBE - Consider for social media only

Card Style 3 (Isometric):
  Visual: ⭐⭐⭐☆☆ Technical but complex
  Mood: ⚠ More technical than aspirational
  Color: ✓ Blue present
  Composition: ✓ Clear
  Overall: NO - Not aligned with brand
```

### Step 5: Analyze Feedback & Update Prompts

**Feedback Analysis Template**:

```json
{
  "industry_cards": {
    "winning_style": "photorealistic",
    "reasoning": "7/8 stakeholders prefer professional photorealistic tone",
    "color_feedback": "Blue works but could be more saturated",
    "suggested_updates": [
      "Emphasize professional expertise more",
      "Increase saturation on industry colors",
      "Focus on confidence and mastery"
    ]
  },
  "hero_section": {
    "winning_concept": "hero_001 (Unified Excellence)",
    "reasoning": "Digital connection threads resonated across all stakeholders",
    "suggested_updates": [
      "Increase contrast on connection elements",
      "Make orange accent more prominent",
      "Consider adding subtle technology elements"
    ]
  },
  "blog_featured": {
    "winning_approach": "photorealistic with clear subject",
    "reasoning": "Stakeholders prefer clear, focused imagery over abstract",
    "suggested_updates": [
      "Reduce background complexity",
      "Increase subject focus and clarity",
      "Ensure problem/solution story is clear"
    ]
  }
}
```

---

## Phase 1 Outputs

### Generated Files

1. **Configuration**:
   - `config/generation_configs/phase1_concepts.json` (45 concept specs)

2. **Scripts**:
   - `scripts/synthex-phase1-generator.mjs` (generation engine)
   - `scripts/synthex-quality-assessor.mjs` (assessment engine)

3. **Results**:
   - `public/assets/concepts/phase1_generation_results.json` (45 optimized prompts)
   - `public/assets/concepts/phase1_quality_assessment.json` (quality scores)
   - `public/assets/concepts/phase1_quality_assessment.txt` (assessment report)
   - `logs/phase1_costs.json` (cost tracking)

4. **Asset Directories** (created by generator):
   - `public/assets/concepts/industry-cards/`
   - `public/assets/concepts/hero-section/`
   - `public/assets/concepts/blog-featured/`

### Cost Tracking

Real-time cost logging in `logs/phase1_costs.json`:

```json
{
  "timestamp": "2025-11-30T14:30:00.000Z",
  "phase": "phase1",
  "total_tokens": 12500,
  "total_cost": 4.65,
  "cost_per_image": 0.1033,
  "images_generated": 45,
  "budget_remaining": 95.35
}
```

---

## Troubleshooting

### API Key Issues

**Error**: `GEMINI_API_KEY environment variable not set`

```bash
# Set API key
export GEMINI_API_KEY=your-actual-key

# Verify
echo $GEMINI_API_KEY

# Then run
npm run synthex:phase1
```

### Rate Limiting

**Error**: `429 Too Many Requests`

- The script includes 500ms delays between requests
- If you still hit limits, increase delay in generator (line ~180)
- Or split execution: run batch 1, wait 5 min, then batch 2, etc.

### Output Directory Issues

**Error**: `ENOENT: no such file or directory, open 'public/assets/concepts/...'`

```bash
# Create directories manually
mkdir -p public/assets/concepts/{industry-cards,hero-section,blog-featured}
mkdir -p logs

# Then retry
npm run synthex:phase1
```

### Assessment Not Running

**Error**: `Could not load results for phase1`

- Run generator first: `npm run synthex:phase1`
- Wait 2-3 seconds for file to write
- Check file exists: `ls public/assets/concepts/phase1_generation_results.json`

---

## Next Steps (After Phase 1)

### Phase 2: Refinement (Week 4-5)

Once stakeholder feedback is collected:

```bash
# 1. Update prompts based on feedback
# Edit: config/generation_configs/phase2_refinement.json

# 2. Generate refined variations
npm run synthex:phase2

# 3. A/B test winning variations
npm run synthex:assess-phase2

# 4. Finalize direction
```

### Phase 3: Production Generation (Week 6-8)

Using winning prompts from Phases 1-2:

```bash
# Generate full-quality images with Gemini 3 Pro
npm run synthex:phase3

# Process compression (AVIF/WebP/JPEG with 6 sizes)
npm run synthex:compress

# Upload to CDN
npm run synthex:deploy-assets
```

### Phase 4: Video & Audio (Week 9)

Generate video content and narration:

```bash
# Generate hero video (6s, 720p, Veo 3.1)
npm run synthex:video-hero

# Generate explainer videos (3 × 45s)
npm run synthex:video-explainers

# Generate narration audio (TTS)
npm run synthex:audio-narration
```

### Phase 5: Integration & Launch (Week 10)

Deploy all assets and optimize:

```bash
# Update page references to new assets
npm run synthex:integrate

# Performance testing
npm run synthex:perf-test

# SEO optimization (schema, alt-text, etc.)
npm run synthex:seo-optimize

# Final QA
npm run synthex:final-qa
```

---

## Key Metrics & Success Criteria

### Phase 1 Success Criteria
- ✅ 100% generation success rate (45/45 images)
- ✅ Average quality score ≥ 7.5
- ✅ Auto-approve rate ≥ 75% (≥8.5 score)
- ✅ Stakeholder feedback confirms direction

### Budget Health
- Phase 1 allocation: $4.65 / $100 = 4.65%
- Remaining for phases 2-5: $95.35 (95.35%)

### Timeline Health
- Phase 1: 7-10 days
- Phases 2-5: 25-30 days
- **Total**: 35-40 days (5-6 weeks)

---

## Command Reference

```bash
# Generate Phase 1
npm run synthex:phase1

# Assess Phase 1 quality
npm run synthex:assess-phase1

# View assessment report
cat public/assets/concepts/phase1_quality_assessment.txt

# View cost tracking
cat logs/phase1_costs.json

# Future phases (placeholder)
npm run synthex:phase2        # Coming: Phase 2 refinement
npm run synthex:phase3        # Coming: Phase 3 production
npm run synthex:compress      # Coming: Image compression
npm run synthex:video-hero    # Coming: Hero video
npm run synthex:deploy-assets # Coming: CDN upload
```

---

## Files Reference

| File | Purpose | Size |
|------|---------|------|
| `config/generation_configs/phase1_concepts.json` | 45 concept specifications | 15 KB |
| `scripts/synthex-phase1-generator.mjs` | Generation engine | 12 KB |
| `scripts/synthex-quality-assessor.mjs` | Assessment engine | 11 KB |
| `package.json` | NPM commands (updated) | 1 KB |
| `docs/SYNTHEX_PHASE1_EXECUTION_ROADMAP.md` | This document | 8 KB |

---

## Support & Questions

If you encounter issues:

1. **Check logs**: `cat logs/phase1_costs.json` (cost tracking)
2. **Check results**: `cat public/assets/concepts/phase1_generation_results.json` (all generated prompts)
3. **Check assessment**: `cat public/assets/concepts/phase1_quality_assessment.json` (scores)
4. **Review documentation**: `docs/SYNTHEX_VCE_IMPLEMENTATION_GUIDE.md` (complete guide)

---

**Last Updated**: 2025-11-30
**Status**: 🚀 Ready for Phase 1 Execution
**Budget**: $4.65 allocated, $95.35 remaining
