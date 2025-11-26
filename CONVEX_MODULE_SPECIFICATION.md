# CONVEX Marketing Intelligence Module - Complete Specification v1.0.1

**Status**: 📋 Ready for Development
**Version**: 1.0.1
**Target Installation**: Post-Phase 1 (Blue Ocean deployment)
**Estimated Duration**: 4-6 weeks

---

## Module Overview

The CONVEX Marketing Intelligence Module integrates the complete CONVEX strategic marketing methodology into Unite-Hub's multi-agent AI system. It enables:

- **Autonomous strategy generation** using CONVEX frameworks
- **High-conversion funnel design** with micro-commitment sequencing
- **SEO domination** through semantic clustering and topical authority
- **Offer architecture** for value maximization
- **Competitor intelligence** with disruption detection
- **Market shift prediction** with auto-pivot recommendations

**Core Value**: Transform marketing from tactical (email campaigns, ads) to strategic (market positioning, funnel architecture, offer optimization).

---

## Module Architecture

### File Structure
```
modules/convex/
├── README.md (300 lines)
├── strategy_library.json (400-500 lines)
├── reasoning_patterns.json (250-300 lines)
├── execution_templates/
│   ├── convex_landing_page_template.md (150 lines)
│   ├── convex_seo_plan_template.md (150 lines)
│   ├── convex_paid_ads_template.md (150 lines)
│   └── convex_offer_architecture_template.md (150 lines)
├── agent_patches/
│   ├── orchestrator_patch.json
│   ├── marketing_agent_patch.json
│   ├── seo_agent_patch.json
│   ├── prediction_agent_patch.json
│   └── visual_agent_patch.json
└── ui/
    ├── ConvexStrategyDashboard.tsx
    ├── ConvexSEOScoringOverlay.tsx
    └── ConvexExecutionPanel.tsx
```

---

## Core CONVEX Frameworks

### 1. Brand Positioning Framework
**Purpose**: Define uncontested market categories and ownership language

**Components**:
- **Category Domination Model**: Choose between creating new categories vs. dominating existing ones
- **Value Ladder Matrix**: Structure offerings from entry-level to premium
- **Message Compression**: Simplify complex positioning into memorable statements
- **Offer-Audience Fit**: Precision match between offer and target psychology
- **Retention Flywheel**: Build sustainable customer lifetime value

**Output**: Brand positioning statement with competitive advantage, narrative framework, visual direction

### 2. Funnel Design Framework
**Purpose**: Create high-conversion customer acquisition funnels

**Components**:
- **Awareness Activation**: Attention-grabbing headline and hook
- **Micro-Commitment Sequencing**: Small asks before big asks
- **Conversion Tension Points**: Identify and resolve purchase hesitation
- **Social Weight Anchoring**: Leverage social proof and authority
- **Emotional Trigger Mapping**: Connect features to emotional outcomes
- **Frictionless CTA Structure**: Make action irresistible

**Output**: Complete funnel blueprint with copywriting cues, design direction, offer structure

### 3. SEO Pattern Library
**Purpose**: Dominate search rankings through systematic optimization

**Components**:
- **Semantic Cluster Mapping**: Group keywords by search intent and meaning
- **Topical Authority Building**: Establish expertise across related topics
- **Search Intent Mapping**: Understand what searchers actually want
- **SERP Gap Exploitation**: Find unmet opportunities in search results
- **Geo-Signal Consolidation**: Dominate local search rankings
- **Power Content Creation**: Build authoritative, conversion-focused content

**Output**: 12-month SEO roadmap with keyword clusters, content calendar, ranking predictions

### 4. Competitor Model
**Purpose**: Understand competitive landscape and disruption signals

**Components**:
- **Feature-to-Outcome Mapping**: How competitors translate features to benefits
- **Weakness Opportunity Matrix**: Where competitors fall short
- **Disruption Early-Warning**: Signals that competitor positioning is vulnerable
- **Counterplay Architecture**: Moves to neutralize competitor advantages

**Output**: Competitive intelligence report with positioning gaps, disruption risks, counter-strategies

### 5. Offer Architecture
**Purpose**: Design compelling offers that maximize perceived value

**Components**:
- **Offer Strength Scoring**: 10-point test for offer viability
- **Feature → Outcome Translation**: Connect product features to customer outcomes
- **Risk Reversal Structures**: Remove customer purchase risk
- **Value Expansion Model**: Increase perceived value without increasing cost

**Output**: Offer blueprint with pricing strategy, guarantee structure, value stacking

---

## CONVEX Reasoning Patterns

**Compression Rules** (Always apply first pass):
1. Simplify first, expand only if needed
2. Bias toward high-conversion action over complexity
3. Focus on outcome, not product description
4. Remove friction, amplify clarity
5. Anchor recommendations in measurable value

**High-Conversion Logic**:
- Start with the customer's desired outcome
- Work backward to identify objections
- Design messaging to address objections
- Test, measure, iterate on messaging
- Never copy competitor messaging directly

**Safety Rules**:
- All claims must be factual and verifiable
- Competitive comparisons must be non-defamatory
- Avoid fabricating social proof or testimonials
- Present limitations alongside benefits
- Disclose any material conflicts of interest

---

## Integration Points

### With Blue Ocean Strategy Engine (Phase 1)
- Blue Ocean positioning feeds into CONVEX brand positioning matrix
- New category names become SEO focus keywords
- Defensibility scoring enhanced by CONVEX offer analysis
- 4-phase roadmaps coordinated with CONVEX execution templates

### With Orchestrator Agent
- CONVEX-first reasoning applied to all marketing requests
- Strategy generation automatically uses CONVEX frameworks
- All outputs scored against CONVEX standards before delivery
- Sub-agents routed with CONVEX framework awareness

### With Marketing Intelligence Agent
- Keyword clustering uses CONVEX emotional/functional/transactional mapping
- Audience segmentation by CONVEX buyer psychology
- Copy generation follows CONVEX compression principles
- Funnel design uses micro-commitment sequencing

### With SEO Agent
- SEO analysis uses CONVEX semantic clustering
- Scoring applies CONVEX technical/topical/authority matrix
- Content recommendations follow CONVEX power content principles
- Keyword strategy rooted in CONVEX search intent mapping

### With Market Shift Prediction Agent
- Market velocity signals detected using CONVEX disruption model
- Competitor analysis uses CONVEX weakness opportunity matrix
- Pivot recommendations follow CONVEX counterplay architecture
- Early warnings trigger 2+ weeks before market shift

### With Campaign Builder
- New "Generate with CONVEX" option in UI
- Template selection from CONVEX execution_templates
- Funnel design uses CONVEX micro-commitment sequences
- Offer architecture automatically applied
- Conversion optimization suggestions from CONVEX patterns

### With SEO Dashboard
- CONVEX scoring overlay on all analysis
- Keyword gap analysis using CONVEX semantic clusters
- Content opportunity finder using CONVEX topical authority
- Authority building roadmap from CONVEX patterns
- Competitive benchmarking using CONVEX weakness matrix

---

## Database Schema (Migration 240)

### Table 1: convex_frameworks
```sql
CREATE TABLE convex_frameworks (
  id UUID PRIMARY KEY,
  workspace_id UUID (RLS),
  framework_type TEXT (brand, funnel, seo, competitor, offer),
  framework_name TEXT,
  description TEXT,
  rules JSONB,
  reasoning_patterns JSONB[],
  components TEXT[],
  created_at TIMESTAMP
);
```

### Table 2: convex_reasoning_patterns
```sql
CREATE TABLE convex_reasoning_patterns (
  id UUID PRIMARY KEY,
  workspace_id UUID (RLS),
  pattern_category TEXT (compression, conversion, safety),
  pattern_name TEXT,
  description TEXT,
  rules TEXT[],
  examples JSONB[],
  created_at TIMESTAMP
);
```

### Table 3: convex_execution_templates
```sql
CREATE TABLE convex_execution_templates (
  id UUID PRIMARY KEY,
  workspace_id UUID (RLS),
  template_type TEXT (landing_page, seo_plan, paid_ads, offer),
  template_name TEXT,
  framework_id UUID,
  template_content JSONB,
  variables JSONB,
  example_output JSONB,
  created_at TIMESTAMP
);
```

### Table 4: convex_strategy_scores
```sql
CREATE TABLE convex_strategy_scores (
  id UUID PRIMARY KEY,
  workspace_id UUID (RLS),
  strategy_id UUID,
  framework_id UUID,
  convex_score NUMERIC (0-100),
  compliance_status TEXT (pass, needs_revision, fail),
  scoring_details JSONB,
  timestamp TIMESTAMP
);
```

### Table 5: convex_market_analysis
```sql
CREATE TABLE convex_market_analysis (
  id UUID PRIMARY KEY,
  workspace_id UUID (RLS),
  competitor_id UUID,
  analysis_type TEXT (positioning, disruption, weakness),
  analysis_data JSONB,
  signals JSONB[],
  recommendations JSONB[],
  created_at TIMESTAMP
);
```

**All tables include**:
- RLS policies for workspace isolation
- Indexes on key columns
- Audit triggers
- Data validation constraints

---

## API Endpoints

### Strategy Generation
```
POST   /api/convex/generate-strategy
       Request: {businessName, industry, targetAudience, currentChallenges, competitors, desiredOutcome}
       Response: {strategyId, strategy, convexScore, templates}

POST   /api/convex/score-strategy
       Request: {strategyId, framework}
       Response: {score (0-100), compliance, details}

POST   /api/convex/apply-framework
       Request: {briefData, framework}
       Response: {output, recommendations}
```

### Campaign Generation
```
POST   /api/convex/campaigns/generate
       Request: {industry, audience, goal, budget, timeline}
       Response: {campaignId, campaign, funnel, offer, copyElements}

POST   /api/convex/funnels/design
       Request: {audience, objective, conversionGoal}
       Response: {funnelId, steps, messaging, tensionPoints}

POST   /api/convex/offers/architect
       Request: {product, audience, pricePoint, value}
       Response: {offerId, offer, riskReversal, valueStack}
```

### SEO Analysis
```
POST   /api/convex/seo/analyze-gap
       Request: {yourDomain, competitors, keywords}
       Response: {gaps, opportunities, clusters}

POST   /api/convex/seo/optimize-content
       Request: {content, keyword, searcher}
       Response: {optimized, suggestions, score}

GET    /api/convex/seo/scoring
       Request: {contentId}
       Response: {technicalScore, topicalScore, authorityScore}
```

### Reference
```
GET    /api/convex/frameworks
       Response: [{framework...}, ...]

GET    /api/convex/templates
       Response: [{template...}, ...]

GET    /api/convex/patterns
       Response: [{pattern...}, ...]
```

**Performance Targets**:
- Strategy generation: <2 seconds
- Scoring: <200ms
- API response: <500ms total

---

## UI Components

### 1. ConvexStrategyDashboard.tsx
**Purpose**: Main CONVEX strategy generation and management interface
**Features**:
- Framework selector dropdown
- Strategy brief input form
- Real-time CONVEX scoring display
- Template library browser
- Execution roadmap builder
- Results visualization
- Export capabilities
**Performance**: <1s page load, <2s strategy generation

### 2. ConvexSEOScoringOverlay.tsx
**Purpose**: Overlay showing CONVEX SEO scoring
**Features**:
- Technical SEO score display
- Topical authority score display
- Semantic clustering visualization
- Content optimization suggestions
- Competitor benchmarking
- Ranking predictions
**Performance**: <200ms scoring, <500ms display

### 3. ConvexExecutionPanel.tsx
**Purpose**: Template selection and execution roadmap
**Features**:
- Template category selector
- Template browser with previews
- Variable input fields
- Implementation timeline
- Task checklist generator
- Progress tracking
**Performance**: <1s load, <100ms interactions

---

## Agent Patches

### Orchestrator Patch
**Modifications**:
- Add CONVEX strategy layer as default reasoning engine
- Register all 5 CONVEX frameworks
- Add brand positioning matrix
- Add funnel logic router
- Add SEO engine reference
- Add market shift detector
- Add offer architecture module
- Implement CONVEX compliance scoring

**Behavior**:
- ALL marketing requests default to CONVEX-first analysis
- Strategy generation automatically uses relevant frameworks
- Outputs scored against CONVEX standards
- Sub-agents routed with framework awareness

### Marketing Intelligence Agent Patch
**Enhancements**:
- Add CONVEX keyword clustering (emotional, functional, transactional)
- Add audience segmentation by CONVEX buyer psychology
- Add micro-commitment sequence generation
- Add copy generation with CONVEX compression rules
- Add high-conversion testing framework
- Add funnel element recommendations

### SEO Agent Patch
**Enhancements**:
- Add CONVEX semantic cluster mapping
- Add topical authority scoring matrix
- Add technical + topical + authority scoring (3-pillar)
- Add search intent mapping
- Add SERP gap identification
- Add power content recommendations
- Add geo-signal consolidation

### Market Shift Prediction Agent Patch
**Enhancements**:
- Add CONVEX market velocity signal detection
- Add competitor disruption modeling
- Add early warning system
- Add pivot recommendation generation
- Add weakness opportunity detection
- Add counterplay architecture

### Visual Intelligence Agent Patch
**Enhancements**:
- Map visual elements to CONVEX brand psychology anchors
- Use CONVEX color psychology principles
- Apply CONVEX design language (bold, clean, directional)
- Generate CONVEX-aligned brand asset recommendations

---

## Execution Templates

### 1. Landing Page Template
**Structure**:
- Hero section with compelling hook
- Trust-building social proof
- Problem acknowledgment
- Solution positioning
- Feature-to-outcome translation
- Objection handling
- Risk reversal guarantee
- Clear CTA with urgency
**Output**: Wireframe + copywriting cues + design direction

### 2. SEO Plan Template
**Structure**:
- Current state analysis
- Keyword cluster mapping
- Topical authority roadmap
- Technical SEO checklist
- Content calendar (12-month)
- Link building strategy
- Monitoring dashboard setup
- 90-day projections
**Output**: Complete SEO roadmap ready for implementation

### 3. Paid Ads Template
**Structure**:
- Audience definition using CONVEX buyer psychology
- Ad copy variations (3+ tested approaches)
- Visual direction
- Landing page URL strategy
- Bid strategy recommendations
- Testing framework (A/B, multivariate)
- Scaling recommendations
- Budget allocation
**Output**: Ad creative brief + landing page specs

### 4. Offer Architecture Template
**Structure**:
- Core offer definition
- Price point justification
- Risk reversal structure
- Value stacking (perceived vs. actual)
- Objection handling (pricing, results, experience)
- Guarantee strength
- Bonus structure
- Success metrics
**Output**: Complete offer blueprint

---

## Implementation Sequence

1. Create `/modules/convex` directory
2. Write all library files (strategy_library.json, reasoning_patterns.json)
3. Write execution templates (4 files)
4. Write agent patches (5 JSON files)
5. Write UI components (3 React components)
6. Write API endpoint files (7 route files)
7. Create database migration 240
8. Register strategy library in backend
9. Patch Orchestrator Agent
10. Patch sub-agents (Marketing, SEO, Prediction, Visual)
11. Add UI components to founder panel and client workspace
12. Rebuild caches and reinitialize systems
13. Enable module globally for all tenants
14. Run full test suite
15. Deploy to staging
16. User acceptance testing
17. Production deployment

---

## Success Criteria

### Delivery
- [  ] All 15+ files created
- [  ] All 5 database tables created
- [  ] All 7 API endpoints functional
- [  ] All 3 UI components integrated
- [  ] All 5 agent patches applied
- [  ] Database migration 240 applied
- [  ] Documentation complete (2,000+ lines)

### Quality
- [  ] 100% TypeScript strict mode
- [  ] >80% test coverage
- [  ] <2 second strategy generation
- [  ] <200ms scoring
- [  ] Zero security issues
- [  ] All outputs pass Truth Layer validation

### Adoption
- [  ] 60%+ users using CONVEX features within 2 weeks
- [  ] Positive feedback on strategy quality
- [  ] Improved campaign conversion rates
- [  ] Better SEO rankings
- [  ] Faster strategy development time

---

## Safety & Truth Layer Integration

**All CONVEX outputs must**:
- Pass Truth Layer factual validation
- Avoid fabricated claims or social proof
- Maintain competitive integrity (no defamation)
- Disclose material limitations
- Include transparency notes for human review
- Be grounded in CONVEX proven principles

**Audit Process**:
- Automatic compliance scoring before output
- Human review flag for claims >10% benefit
- Competitive comparison validation
- Testimonial source verification
- Regular audit of output quality

---

## Cost & Resource Implications

### Development
- Backend: ~120 hours
- Frontend: ~80 hours
- QA: ~40 hours
- Documentation: ~30 hours
- **Total**: ~270 hours (6-7 weeks, 1 FTE)

### Infrastructure
- Supabase (minimal, included)
- Claude API (primary cost, new)
- Redis optional (~$20/month)

### Team
- 1 Senior Backend Engineer
- 1 Frontend Engineer
- 1 QA Engineer
- 1 Technical Writer

---

## Timeline & Milestones

| Week | Milestone | Deliverables |
|------|-----------|--------------|
| 1-2 | Core Infrastructure | Libraries, Templates, Migration |
| 2-3 | Agent Enhancement | 5 Agent Patches |
| 3-4 | Frontend | 3 UI Components |
| 4-5 | APIs | 7 Endpoints |
| 5-6 | Testing & Docs | Tests, Documentation, Staging |
| 6+ | Production | Deploy, Monitor, Iterate |

---

## Next Steps

1. **Now**: Approve Phase 2 specification
2. **Week 1**: Deploy Blue Ocean and stabilize (1-2 weeks)
3. **Week 2-3**: Begin Phase 2 CONVEX core infrastructure
4. **Weeks 4-6**: Continue Phase 2 implementation
5. **Week 6+**: Staging and production deployment

---

**Status**: 📋 Ready for Development
**Version**: 1.0.1
**Quality**: Production-Grade Specification

🌊 **Phase 2: Transform marketing from tactical to strategic.** 🌊
