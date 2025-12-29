# New Landing Page Design - SEO/GEO Optimized
## Google's Extractable Logic Requirements

**Goal**: Complete redesign optimized for Google ranking with visual assets
**Focus**: Text-heavy, semantic, AI-parseable, video-first
**Target**: Logan, Brisbane, Queensland local businesses

---

## Design Strategy (Google's Extractable Logic)

### Core Principles
1. **Text-Heavy**: Every visual has accompanying text for AI parsing
2. **Semantic HTML**: Proper headings, lists, structured data
3. **Video-First**: VEO content above the fold
4. **Data Points**: Numbers, metrics, comparisons everywhere
5. **GEO Signals**: Location mentions, local schema, area served

---

## New Page Structure

### Hero Section (Above Fold)
**Visual**: VEO 3.1 video demo (AI Email Agent)
**Text**:
- H1: "AI Marketing Automation for Logan & Brisbane Businesses"
- Subhead: "43 AI Agents. $0.05/email. 100% Transparent."
- CTA: "See Live Demo" (plays video)

**Schema**: VideoObject with hasPart (key moments), contentLocation (Logan/Brisbane)

---

### Section 1: Visual Comparison (Extractable Logic)
**Visual**: client-vs-agency-comparison.svg (full width)
**Text**:
- H2: "Stop Paying $5,000/Month for What AI Does for $0.05"
- Data table:
  ```
  Traditional Agency | Unite-Hub AI
  $5,000/month      | $0.05/email
  2-3 weeks         | Real-time
  Black box         | Open source
  ```

**Schema**: ImageObject with offers comparison

---

### Section 2: How It Works (Video Walkthrough)
**Visual**: 3 VEO videos side-by-side
1. Email Agent (8s with mermaid overlay)
2. Content Generator (8s with JSON overlay)
3. Orchestrator (8s with workflow overlay)

**Text**:
- H2: "Watch AI Handle Your Marketing"
- Each video has:
  - Title
  - 4 key moments listed
  - Transcript (for SEO)

**Schema**: VideoObject array with hasPart for each

---

### Section 3: Architecture (Trust Building)
**Visual**: unite-hub-architecture.svg (large, centered)
**Text**:
- H2: "Enterprise Technology, Small Business Pricing"
- Technical description:
  - "Next.js 16 App Router for speed"
  - "43 AI Agents (Project Vend Phase 2 enhanced)"
  - "Supabase PostgreSQL with multi-tenant RLS"
  - "Open source: github.com/CleanExpo/Unite-Hub"

**Schema**: SoftwareApplication with architecture description

---

### Section 4: Step-by-Step (HowTo Schema)
**Visual**: 5 step icons (large, prominent)
**Text**: Each step has:
- Icon (SVG)
- Step name
- Detailed instructions (200+ words each for SEO)
- Time estimate
- Screenshot/visual

**Schema**: HowTo with image for each step

---

### Section 5: Project Vend Phase 2 (Authority)
**Visual**: project-vend-phase2-overview.svg
**Text**:
- H2: "Built on Anthropic's Research"
- Detailed explanation:
  - "Implements 5 critical lessons from Project Vend"
  - List all 8 systems with descriptions
  - "136 tests passing, 8 database tables, real-time monitoring"
  - Link to /agents dashboard

**Schema**: Article about the technology

---

### Section 6: GitHub Social Proof
**Visual**: github-social-proof.svg
**Text**:
- H2: "100% Transparent Development"
- "Every line of code visible on GitHub"
- "14,000+ lines of TypeScript"
- "Production-tested with 136 automated tests"
- Link to GitHub repo

**Schema**: SoftwareSourceCode

---

### Section 7: Local SEO (Queensland Focus)
**Visual**: Map graphic or location pins
**Text**:
- H2: "Serving Logan, Brisbane & Southeast Queensland"
- "Local businesses: Trades, salons, restaurants, services"
- "Queensland-specific features: NDIS, Fair Work compliance"
- "Australian pricing in AUD, GST included"

**Schema**: LocalBusiness with areaServed (Logan, Brisbane, QLD)

---

## SEO Optimization Checklist

### On-Page SEO
- [ ] H1: Location keywords (Logan, Brisbane)
- [ ] H2-H6: Semantic hierarchy
- [ ] Alt text: Descriptive for all images
- [ ] Meta description: Under 160 chars with location
- [ ] Title tag: "AI Marketing Automation Logan Brisbane | Unite-Hub"

### Schema Markup (JSON-LD)
- [ ] Organization (with Logan address)
- [ ] LocalBusiness (areaServed: Logan, Brisbane, QLD)
- [ ] VideoObject (3 videos with hasPart)
- [ ] ImageObject (9 images with contentLocation)
- [ ] HowTo (5 steps with images)
- [ ] SoftwareApplication (features, pricing)
- [ ] FAQPage (20+ questions)

### GEO Signals
- [ ] contentLocation on all images (Logan, Brisbane)
- [ ] Address in footer (Logan, QLD)
- [ ] Phone number (Australian format)
- [ ] areaServed schema (Queensland suburbs)
- [ ] Embed Google Map (Logan office)

### Extractable Logic (Google AI Parsing)
- [ ] All images have <text> elements (SVG)
- [ ] Videos have transcripts in JSON-LD
- [ ] Data tables for comparisons
- [ ] Numbered lists for features
- [ ] Semantic HTML5 (article, section, aside)

---

## Visual Asset Integration (All 12)

### Images (9 SVG)
1. ✅ unite-hub-architecture.svg - Architecture section
2. ✅ client-vs-agency-comparison.svg - Hero or comparison section
3. ✅ github-social-proof.svg - Trust section
4. ✅ project-vend-phase2-overview.svg - Technology section
5-9. ✅ Step icons - How It Works section

### Videos (3 specs, need generation)
1. AI Email Agent demo - Hero autoplay
2. Content Generator demo - Features section
3. Orchestrator demo - Features section

---

## Implementation Plan

### Phase 1: Create New Landing Page Component
File: `src/app/(marketing)/seo-landing/page.tsx`

**Benefits**:
- Test new design without breaking existing
- A/B test old vs new
- Easy rollback if needed

### Phase 2: Add All Schema Markup
File: `src/lib/schema/seo-landing-schema.ts`

**Include**:
- All 12 visual assets
- Location data (Logan, Brisbane)
- Business info
- Pricing
- FAQs

### Phase 3: Deploy & Test
- Google Search Console verification
- PageSpeed Insights check
- Mobile-friendly test
- Rich results test

---

## Next Steps

1. Create new SEO-optimized landing page
2. Integrate all 12 visual assets
3. Add comprehensive schema markup
4. Add GEO targeting (Logan, Brisbane)
5. Deploy and verify in Search Console

**Goal**: Make visuals AND text work together for Google ranking

Should I proceed with creating the new SEO-optimized landing page?
