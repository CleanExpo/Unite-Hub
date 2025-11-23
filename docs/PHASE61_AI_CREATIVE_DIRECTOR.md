# Phase 61: AI Creative Director

**Generated**: 2025-11-23
**Status**: ✅ Complete
**Purpose**: Brand consistency and creative quality oversight

---

## Executive Summary

Phase 61 establishes the **AI Creative Director** - a system for maintaining brand consistency, visual cohesion, and creative quality across all client deliverables while respecting truth-layer and ethical guidelines.

### Core Principles

1. **No Fake Brand Assets** - All colors, fonts, styles from approved signatures
2. **No Unscoped Creative Styles** - Every asset tied to a brand signature
3. **Always Explain Creative Rationale** - Every decision documented
4. **Founder Override for Major Brand Shifts** - Significant changes need approval

---

## Brand Elements

The Creative Director manages 7 brand element categories:

| Element | Description |
|---------|-------------|
| Primary Palette | Main brand colors (2-3 colors) |
| Secondary Palette | Supporting colors (2-4 colors) |
| Typography Scale | Heading, body, mono fonts + sizes |
| Tone of Voice | Communication style + characteristics |
| Iconography Style | Icon format, stroke width, corners |
| Grid & Spacing | Base unit, columns, breakpoints |
| Motion Style | Animation type, duration, easing |

---

## Visual Sources

Integrated creative generation sources:

| Source | Use Case |
|--------|----------|
| Nano Banana 2 | Custom illustrations |
| DALL-E 3 | Photorealistic images |
| Gemini VEO 3 | Video generation |
| ElevenLabs | Voice synthesis |

---

## Quality Checks

Every asset validated against 7 checks:

| Check | Pass Criteria |
|-------|---------------|
| Brand Consistency | Colors from approved palette |
| Web Accessibility | WCAG AA compliance |
| Color Contrast | 4.5:1 minimum ratio |
| Readability | Flesch score ≥ 60 |
| Tone Accuracy | Matches brand voice |
| Persona Fit | Appropriate for audience |
| Truth Layer Compliance | No forbidden claims |

---

## Quality Scoring

### Score Breakdown

Weighted scoring system:
- **Visual assets**: Consistency (30%), Accessibility (25%), Balance (20%), Readability (15%), Truth layer (10%)
- **Copy assets**: Readability (30%), Tone (25%), Truth layer (25%), Accessibility (20%)
- **UX elements**: Accessibility (50%), Performance (30%), Consistency (20%)

### Grade Scale

| Grade | Score Range | Description |
|-------|-------------|-------------|
| A | 90-100 | Excellent, showcase worthy |
| B | 80-89 | Good, meets standards |
| C | 70-79 | Acceptable, minor issues |
| D | 60-69 | Below standard, needs work |
| F | 0-59 | Failing, requires revision |

---

## Industry Defaults

Pre-configured settings for common industries:

### Restoration
- **Tone**: Professional and reassuring
- **Characteristics**: empathetic, knowledgeable, prompt, trustworthy
- **Motion**: Subtle

### Trades
- **Tone**: Direct and reliable
- **Characteristics**: straightforward, skilled, honest, dependable
- **Motion**: Minimal

### Consulting
- **Tone**: Authoritative yet approachable
- **Characteristics**: insightful, strategic, collaborative, results-focused
- **Motion**: Subtle

### Local Services
- **Tone**: Friendly and local
- **Characteristics**: neighborly, accessible, trusted, community-focused
- **Motion**: Dynamic

---

## API Endpoints

### GET /api/creative/insights

Get creative insights and brand signatures:

```
?type=briefing              - Daily creative briefing
?type=client&client_id=uuid - Client insights
?type=signature&client_id=uuid - Brand signature
```

### POST /api/creative/insights

Save brand signature:

```json
{
  "client_id": "uuid",
  "signature": {
    "name": "Brand Name",
    "primary_colors": ["#2563eb"],
    "tone_of_voice": "Professional"
  }
}
```

### POST /api/creative/quality

Score creative asset:

```json
{
  "client_id": "uuid",
  "asset_type": "visual | copy | ux",
  "asset_data": { /* metrics */ }
}
```

---

## UI Components

### CreativeQualityBadge

Displays quality grade with score:
- Color-coded by grade (A=green, B=blue, C=yellow, D=orange, F=red)
- Icon indicator (check, alert, x)
- Optional score display

### CreativeSignatureCard

Shows brand signature overview:
- Color swatches
- Typography info
- Tone summary
- Motion style badge

---

## Founder Dashboard

Located at `/founder/dashboard/creative-director`

### Tabs

1. **Overview** - Top performers and attention needed
2. **Brand Signatures** - All client signatures
3. **Quality Scores** - Breakdown by category
4. **Actions** - Daily creative action items

### Quick Stats

- Average quality score
- Average consistency score
- Assets generated (7 days)
- Clients needing attention

---

## Files Created (Phase 61)

### Services

1. `src/lib/creative/creativeDirectorEngine.ts` - Main director engine
2. `src/lib/creative/creativeRulesEngine.ts` - Brand rules and validation
3. `src/lib/creative/creativeQualityScorer.ts` - Asset quality scoring

### API Routes

4. `src/app/api/creative/insights/route.ts` - Insights endpoint
5. `src/app/api/creative/quality/route.ts` - Quality scoring endpoint

### UI Components

6. `src/ui/components/CreativeQualityBadge.tsx` - Quality grade display
7. `src/ui/components/CreativeSignatureCard.tsx` - Signature overview

### Pages

8. `src/app/founder/dashboard/creative-director/page.tsx` - Founder dashboard

### Documentation

9. `docs/PHASE61_AI_CREATIVE_DIRECTOR.md` - This document

---

## Integration Points

### With Phase 60 (AI Director)

- Creative insights feed into overall client health
- Quality scores contribute to risk detection
- Brand consistency issues trigger alerts

### With Visual Orchestration

- Brand signatures inform image generation prompts
- Color palettes enforce consistency
- Typography rules applied to text overlays

### With Production Engine

- Quality scoring on all generated assets
- Automated approval based on scores
- Feedback loop for prompt improvement

---

## Validation Examples

### Color Contrast Check

```typescript
const validator = new CreativeRulesEngine();
const result = validator.validateColorContrast('#2563eb', '#ffffff');
// { ratio: 4.5, wcag_aa: true, wcag_aaa: false }
```

### Tone Validation

```typescript
const result = validator.validateTone(
  'We guarantee instant results!',
  toneRules
);
// { score: 60, issues: ['Contains "guaranteed"', 'Contains "instant"'] }
```

### Typography Check

```typescript
const result = validator.validateTypography(16, 400, 1.5, typographyRules);
// { valid: true, issues: [] }
```

---

## Constraints

### Creative Constraints

```typescript
const CREATIVE_CONSTRAINTS = {
  no_fake_brand_assets: true,
  no_unscoped_creative_styles: true,
  always_explain_creative_rationale: true,
  founder_override_for_major_brand_shifts: true,
};
```

### Forbidden in Tone

- "guaranteed" + any outcome
- "instant" + any result
- "overnight" + success
- "dominate" / "crush" / "explode"

---

## Usage Examples

### Get Creative Briefing

```typescript
const response = await fetch('/api/creative/insights?type=briefing');
const { data: briefing } = await response.json();

console.log('Avg quality:', briefing.avg_quality_score);
console.log('Top performers:', briefing.top_performers);
```

### Score a Visual Asset

```typescript
const response = await fetch('/api/creative/quality', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    client_id: 'uuid',
    asset_type: 'visual',
    asset_data: {
      colors_used: ['#2563eb', '#ffffff'],
      contrast_ratios: [4.5],
      has_text_overlay: true,
      image_quality: 85,
      composition_score: 75,
    },
  }),
});

const { data } = await response.json();
console.log('Grade:', data.score.grade);
console.log('Recommendations:', data.score.recommendations);
```

---

## Recommended Workflows

### New Client Setup

1. Create brand signature from industry defaults
2. Customize colors, typography, tone
3. Generate sample assets for approval
4. Set quality thresholds

### Daily Review

1. Check creative briefing
2. Review attention-needed clients
3. Approve/reject pending assets
4. Update signatures if needed

### Quality Improvement

1. Review low-scoring assets
2. Check failed quality checks
3. Adjust prompts or guidelines
4. Re-score after changes

---

## Future Enhancements

### Phase 62+ Potential

1. **Style Guide Generation** - Auto-generate PDF brand guides
2. **Visual Pattern Recognition** - Learn from approved assets
3. **Video Quality Scoring** - Extend to VEO3 output
4. **A/B Creative Testing** - Compare style variations
5. **Client Self-Service** - Allow clients to tweak signatures

---

## Conclusion

Phase 61 delivers a comprehensive AI Creative Director that maintains brand consistency and creative quality across all deliverables. The system enforces brand signatures, validates accessibility, and ensures truth-layer compliance while providing actionable insights.

**Remember**: Every creative decision has a rationale. No fake brand assets. Major brand shifts need founder approval.

---

*AI Creative Director documentation generated by Phase 61*
