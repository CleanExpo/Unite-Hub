# AIDO 2026 Implementation Roadmap

**AI Discovery Optimization for Google's 2026 Algorithm Shift**

**Date**: 2025-11-25
**Status**: Phase 1 Complete, Phase 2-5 Pending
**Estimated Total**: 60-80 hours implementation

---

## Executive Summary

The Google algorithm shift of 2026 prioritizes AI-friendly content sources over traditional SEO. AIDO (AI Discovery Optimization) positions Unite-Hub clients as **primary data sources** for AI systems (ChatGPT, Gemini, Perplexity) rather than just ranked links.

### 5 Strategic Pillars

1. **AIDO** - Make client brands primary AI data sources
2. **Algorithmic Immunity Content** - Deep evergreen content surviving algorithm changes
3. **Reality-Loop Marketing** - Convert real-world events into content automatically
4. **Conversational SEO Stacks** - Align with how AI systems answer questions
5. **Google-Curve Anticipation Engine** - Detect algorithm shifts before competitors

### Business Impact

- **Traditional SEO**: Rankings → Clicks → Conversions
- **AIDO 2026**: Direct AI Citations → Brand Authority → Conversions

Clients become the **source of truth** for AI systems, bypassing traditional SERP competition.

---

## Phase 1: Foundation ✅ COMPLETE

**Duration**: 2-3 hours
**Status**: ✅ Complete

### Database Schema (Migration 204)

Created 8 tables with multi-tenant architecture:

```sql
-- Core Tables
client_profiles     -- Client configuration and brand voice
topics              -- Content pillar topics
intent_clusters     -- AI-optimized search intent mapping
content_assets      -- Algorithmic immunity content

-- Intelligence Tables
reality_events      -- Real-world event capture
serp_observations   -- Search result tracking
change_signals      -- Algorithm shift detection
strategy_recommendations -- AI-generated action items
```

### Multi-Scoring System

**authority_score** (0.0-1.0):
- Expert depth, citations, author credentials
- Target: 0.8+ for algorithmic immunity

**evergreen_score** (0.0-1.0):
- Time-sensitivity vs lasting value
- Target: 0.7+ for long-term content

**ai_source_score** (0.0-1.0):
- Clarity, structure, factual density for AI ingestion
- Target: 0.8+ for AI citation preference

### Workspace Isolation

All tables include:
- `workspace_id` for team isolation
- `org_id` for organization boundaries
- RLS policies for secure multi-tenancy

---

## Phase 2: Core Pipelines (IN PROGRESS)

**Duration**: 40-60 hours
**Priority**: HIGH
**Status**: ⏳ Pending

### Pipeline 1: Intent Cluster Generator

**Purpose**: Map search intents to AI-friendly content clusters

**Input**:
```typescript
interface IntentClusterInput {
  clientId: string;
  workspaceId: string;
  topicId: string;
  seedKeywords: string[];
  competitorDomains?: string[];
  location?: string;
}
```

**Process**:
1. Use Perplexity Sonar to research latest search trends
2. Claude Opus 4 Extended Thinking (10000 token budget) to analyze searcher psychology:
   - Primary intent (what they want)
   - Secondary intents (related needs)
   - Searcher mindset (emotional state)
   - Pain points (problems they face)
   - Desired outcomes (success criteria)
   - Risk concerns (blockers)
   - Purchase stage (awareness → decision)
3. Generate example queries and follow-up questions
4. Calculate business impact score, difficulty score, alignment score
5. Store in `intent_clusters` table

**Output**:
```typescript
interface IntentCluster {
  id: string;
  primaryIntent: string;
  secondaryIntents: string[];
  searcherMindset: string;
  painPoints: string[];
  desiredOutcomes: string[];
  riskConcerns: string[];
  purchaseStage: 'awareness' | 'consideration' | 'decision' | 'retention';
  exampleQueries: string[];
  followUpQuestions: string[];
  localModifiers: string[];
  businessImpactScore: number; // 0.0-1.0
  difficultyScore: number;     // 0.0-1.0
  alignmentScore: number;      // 0.0-1.0
}
```

**AI Service**: `src/lib/aido/intent-cluster-ai.ts`
**API Endpoint**: `POST /api/aido/intent-clusters/generate`
**Cost**: ~$0.30-0.50 per cluster (Extended Thinking)

---

### Pipeline 2: Algorithmic Immunity Content Generator

**Purpose**: Generate deep evergreen content with high AI-source scores

**Input**:
```typescript
interface ContentGenerationInput {
  clientId: string;
  workspaceId: string;
  intentClusterId: string;
  contentType: 'guide' | 'faq' | 'case_study' | 'resource' | 'tool';
  format: 'long_form' | 'pillar' | 'hub' | 'interactive';
  targetScores?: {
    authority: number;   // Default: 0.8
    evergreen: number;   // Default: 0.7
    aiSource: number;    // Default: 0.8
  };
}
```

**Process**:
1. Fetch intent cluster data
2. Use Claude Opus 4 with Extended Thinking (15000 token budget) to:
   - Research topic comprehensively
   - Structure for AI ingestion (Schema.org types: FAQPage, HowTo, Service)
   - Generate QA blocks (conversational format)
   - Include citations and expert sources
   - Optimize for clarity and factual density
3. Score generated content:
   - Authority: Expert depth, citations, credentials
   - Evergreen: Timeless value vs time-sensitivity
   - AI Source: Structure, clarity, factual density
4. Iterate if scores below target (max 2 iterations)
5. Store in `content_assets` table with `status='draft'`

**Output**:
```typescript
interface ContentAsset {
  id: string;
  title: string;
  slug: string;
  summary: string;
  bodyMarkdown: string;
  qaBlocks: Array<{
    question: string;
    answer: string;
    followUps: string[];
  }>;
  schemaTypes: string[]; // ['FAQPage', 'HowTo']
  mediaAssets: Array<{
    type: 'image' | 'video' | 'diagram';
    url: string;
    alt: string;
  }>;
  localisationTags: string[];
  authorityScore: number;
  evergreenScore: number;
  aiSourceScore: number;
  status: 'draft' | 'review' | 'published';
}
```

**AI Service**: `src/lib/aido/content-generation-ai.ts`
**API Endpoint**: `POST /api/aido/content/generate`
**Cost**: ~$0.80-1.20 per content asset (Extended Thinking + iterations)

---

### Pipeline 3: Reality-Loop Marketing Processor

**Purpose**: Convert real-world events into automated content opportunities

**Input Sources**:
```typescript
interface RealityEventSource {
  type: 'gmb_interaction' | 'customer_call' | 'service_completion' |
        'review_received' | 'quote_sent' | 'project_milestone';
  sourceSystem: 'gmb' | 'crm' | 'phone_system' | 'project_management';
  sourceId: string;
  timestamp: Date;
  location?: string;
  rawPayload: any;
}
```

**Process**:
1. Ingest event from webhook or polling
2. Store raw event in `reality_events` table
3. Use Claude Sonnet 4.5 to normalize and extract:
   - Event type classification
   - Key entities (location, people, services)
   - Content opportunity assessment
   - Urgency/impact scoring
4. If content opportunity score > 0.6:
   - Generate content brief
   - Link to relevant `content_assets`
   - Create `strategy_recommendations` entry
5. Update `processing_status` to 'processed'

**Output**:
```typescript
interface ProcessedRealityEvent {
  id: string;
  eventType: string;
  normalizedPayload: {
    eventCategory: string;
    entities: { type: string; value: string }[];
    location: string;
    contentOpportunity: {
      score: number;
      suggestedTopics: string[];
      urgency: 'low' | 'medium' | 'high';
      impact: 'low' | 'medium' | 'high';
    };
  };
  linkedContentAssetIds: string[];
  processingStatus: 'pending' | 'processed' | 'content_created';
}
```

**AI Service**: `src/lib/aido/reality-event-processor.ts`
**API Endpoint**: `POST /api/aido/reality-loop/ingest`
**Cost**: ~$0.05-0.10 per event (Sonnet 4.5)

---

### Pipeline 4: Conversational SEO Optimizer

**Purpose**: Optimize content for AI-style conversational answers

**Input**:
```typescript
interface ConversationalOptimizationInput {
  contentAssetId: string;
  targetAIPlatforms: ('chatgpt' | 'gemini' | 'perplexity' | 'claude')[];
  optimizeFor: 'citation_rate' | 'answer_inclusion' | 'brand_mention';
}
```

**Process**:
1. Fetch existing content asset
2. Analyze current structure with Claude Sonnet 4.5:
   - Identify conversational gaps
   - Check for natural language query alignment
   - Assess QA block quality
   - Verify Schema.org markup
3. Generate optimization recommendations:
   - Additional QA pairs
   - Follow-up question chains
   - Clarification statements
   - Related topic links
4. Score conversational readiness (0.0-1.0)
5. Update content asset if score improved

**Output**:
```typescript
interface ConversationalOptimization {
  originalScore: number;
  optimizedScore: number;
  recommendations: Array<{
    type: 'add_qa' | 'expand_answer' | 'add_followup' | 'improve_clarity';
    priority: number;
    suggestion: string;
    expectedImpact: number;
  }>;
  updatedQaBlocks: Array<{
    question: string;
    answer: string;
    followUps: string[];
  }>;
}
```

**AI Service**: `src/lib/aido/conversational-seo-ai.ts`
**API Endpoint**: `POST /api/aido/conversational-seo/optimize`
**Cost**: ~$0.15-0.25 per optimization (Sonnet 4.5)

---

### Pipeline 5: Google-Curve Anticipation Engine

**Purpose**: Detect algorithm shifts before competitors

**Input**:
```typescript
interface CurveMonitoringConfig {
  clientId: string;
  workspaceId: string;
  monitoredKeywords: string[];
  competitorDomains: string[];
  checkFrequency: 'daily' | 'weekly';
}
```

**Process**:
1. **SERP Observation Collection** (automated cron):
   - Query Google Search API for monitored keywords
   - Track SERP features (AI Overviews, featured snippets, knowledge panels)
   - Record source domains used in AI answers
   - Store in `serp_observations` table

2. **Change Detection** (Claude Haiku 4.5):
   - Compare current SERP with historical data (7-day, 30-day windows)
   - Identify anomalies:
     - New SERP features appearing
     - Shift in source domain preferences
     - Changes in AI answer format
     - Ranking volatility spikes

3. **Signal Classification** (Claude Sonnet 4.5):
   - Classify change signals by severity:
     - `minor`: Individual keyword fluctuation
     - `moderate`: Multiple keywords affected
     - `major`: Broad algorithm update detected
     - `critical`: Core ranking factor change

4. **Strategy Recommendation** (Claude Opus 4 Extended Thinking):
   - Analyze signal patterns
   - Generate action items with priority
   - Estimate impact on client content
   - Create `strategy_recommendations` entries

**Output**:
```typescript
interface ChangeSignal {
  id: string;
  signalType: 'serp_feature_change' | 'ranking_shift' |
              'ai_answer_format_change' | 'source_preference_shift';
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  description: string;
  rawEvidence: {
    affectedKeywords: string[];
    beforeAfterComparison: any;
    detectedAt: Date;
  };
  status: 'active' | 'monitoring' | 'resolved';
}

interface StrategyRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actions: Array<{
    step: number;
    description: string;
    assignedTo?: string;
    estimatedHours: number;
  }>;
  estimatedImpact: 'low' | 'medium' | 'high';
  dueDate?: Date;
  status: 'pending' | 'in_progress' | 'completed';
}
```

**AI Services**:
- `src/lib/aido/serp-change-detector.ts` (Haiku 4.5)
- `src/lib/aido/google-curve-analyzer.ts` (Opus 4 Extended Thinking)

**API Endpoints**:
- `POST /api/aido/google-curve/monitor` (setup monitoring)
- `GET /api/aido/google-curve/signals` (get active signals)
- `POST /api/aido/google-curve/analyze` (trigger analysis)

**Cron Job**: `src/lib/cron/aido-curve-monitor.ts`
**Cost**: ~$2-5 per day per client (monitoring + analysis)

---

## Phase 3: AI Services (20-25 hours)

**Priority**: HIGH
**Dependencies**: Phase 2 pipeline designs

### Services to Create

1. **`src/lib/aido/intent-cluster-ai.ts`** (8-10 hours)
   - Perplexity Sonar integration for trend research
   - Claude Opus 4 Extended Thinking for intent analysis
   - Multi-scoring system (business impact, difficulty, alignment)
   - Caching strategy for common intents

2. **`src/lib/aido/content-generation-ai.ts`** (10-12 hours)
   - Claude Opus 4 Extended Thinking with iterative refinement
   - Multi-scoring system (authority, evergreen, AI-source)
   - Schema.org markup generation
   - QA block optimization
   - Citation and source validation

3. **`src/lib/aido/reality-event-processor.ts`** (3-4 hours)
   - Claude Sonnet 4.5 for event normalization
   - Content opportunity scoring
   - Entity extraction and linking

4. **`src/lib/aido/conversational-seo-ai.ts`** (4-5 hours)
   - Claude Sonnet 4.5 for structure analysis
   - QA pair generation
   - Follow-up question chains
   - Platform-specific optimization (ChatGPT vs Gemini)

5. **`src/lib/aido/serp-change-detector.ts`** (3-4 hours)
   - Claude Haiku 4.5 for anomaly detection
   - Historical comparison logic
   - Signal classification

6. **`src/lib/aido/google-curve-analyzer.ts`** (5-6 hours)
   - Claude Opus 4 Extended Thinking for strategy
   - Pattern recognition across signals
   - Impact estimation
   - Action item generation

### Shared Utilities

**`src/lib/aido/scoring.ts`**:
```typescript
export function calculateAuthorityScore(content: ContentAsset): number {
  // Expert depth, citations, credentials
}

export function calculateEvergreenScore(content: ContentAsset): number {
  // Time-sensitivity analysis
}

export function calculateAISourceScore(content: ContentAsset): number {
  // Clarity, structure, factual density
}

export function calculateCompositeScore(
  authority: number,
  evergreen: number,
  aiSource: number
): number {
  // Weighted composite: authority 40%, evergreen 30%, aiSource 30%
  return (authority * 0.4) + (evergreen * 0.3) + (aiSource * 0.3);
}
```

**`src/lib/aido/schema-generator.ts`**:
```typescript
export function generateFAQPageSchema(qaBlocks: QABlock[]): SchemaOrgFAQPage;
export function generateHowToSchema(steps: Step[]): SchemaOrgHowTo;
export function generateServiceSchema(service: ServiceInfo): SchemaOrgService;
```

---

## Phase 4: API Endpoints (15-20 hours)

**Priority**: MEDIUM
**Dependencies**: Phase 3 AI services

### Client Management (5 endpoints)

```typescript
POST   /api/aido/clients              // Create client profile
GET    /api/aido/clients              // List clients for workspace
GET    /api/aido/clients/:id          // Get client details
PATCH  /api/aido/clients/:id          // Update client profile
DELETE /api/aido/clients/:id          // Delete client (cascade)
```

### Topic & Intent Management (4 endpoints)

```typescript
POST   /api/aido/topics               // Create topic
POST   /api/aido/intent-clusters/generate  // Generate intent clusters
GET    /api/aido/intent-clusters      // List clusters (filtered by topic)
PATCH  /api/aido/intent-clusters/:id  // Update cluster
```

### Content Generation (4 endpoints)

```typescript
POST   /api/aido/content/generate     // Generate content asset
GET    /api/aido/content              // List content assets
GET    /api/aido/content/:id          // Get content details
PATCH  /api/aido/content/:id          // Update content (status, scores)
```

### Reality Loop (3 endpoints)

```typescript
POST   /api/aido/reality-loop/ingest  // Ingest reality event
GET    /api/aido/reality-loop/events  // List events
POST   /api/aido/reality-loop/process // Manually trigger processing
```

### Google Curve (3 endpoints)

```typescript
POST   /api/aido/google-curve/monitor     // Setup monitoring
GET    /api/aido/google-curve/signals     // Get change signals
POST   /api/aido/google-curve/analyze     // Trigger analysis
GET    /api/aido/google-curve/recommendations // Get strategy recs
```

### Authentication Pattern

All endpoints follow workspace isolation:

```typescript
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { supabaseBrowser } = await import("@/lib/supabase");
  const { data, error } = await supabaseBrowser.auth.getUser(token);

  if (error || !data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) {
    return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
  }

  // Endpoint logic with workspace filtering
}
```

---

## Phase 5: Dashboard UI (15-20 hours)

**Priority**: MEDIUM
**Dependencies**: Phase 4 API endpoints

### Dashboard 1: AIDO Overview

**Route**: `/dashboard/aido/overview`

**Components**:
- Client selector dropdown
- Key metrics cards:
  - Total content assets
  - Average authority score
  - Average evergreen score
  - Average AI-source score
  - Active intent clusters
  - Reality events processed this week
- Recent change signals timeline
- Active strategy recommendations list
- Content performance chart (scores over time)

**Files**:
- `src/app/dashboard/aido/overview/page.tsx`
- `src/components/aido/AIDOMetricsCards.tsx`
- `src/components/aido/ChangeSignalsTimeline.tsx`
- `src/components/aido/StrategyRecommendationsList.tsx`

---

### Dashboard 2: Intent Clusters Manager

**Route**: `/dashboard/aido/intent-clusters`

**Components**:
- Topic filter tabs
- Intent cluster cards with scores:
  - Primary intent
  - Searcher mindset
  - Pain points (badges)
  - Business impact / difficulty / alignment scores
  - Example queries preview
- Generate new cluster button (modal)
- Cluster detail view (click to expand)

**Files**:
- `src/app/dashboard/aido/intent-clusters/page.tsx`
- `src/components/aido/IntentClusterCard.tsx`
- `src/components/aido/GenerateClusterModal.tsx`

---

### Dashboard 3: Content Assets Manager

**Route**: `/dashboard/aido/content`

**Components**:
- Content asset table:
  - Title, type, format
  - Authority / evergreen / AI-source scores (progress bars)
  - Status badge (draft/review/published)
  - Actions (edit, optimize, publish)
- Generate content button (modal)
- Content editor (markdown with live preview)
- QA blocks editor (drag-and-drop reorder)
- Score improvement suggestions panel

**Files**:
- `src/app/dashboard/aido/content/page.tsx`
- `src/components/aido/ContentAssetsTable.tsx`
- `src/components/aido/ContentEditor.tsx`
- `src/components/aido/QABlocksEditor.tsx`
- `src/components/aido/ScoreImprovementPanel.tsx`

---

### Dashboard 4: Reality Loop Console

**Route**: `/dashboard/aido/reality-loop`

**Components**:
- Event source status indicators (GMB, CRM, phone system)
- Recent events feed (real-time updates)
- Event detail cards:
  - Event type, timestamp, location
  - Content opportunity score
  - Linked content assets
  - Processing status
- Manual event ingestion form
- Webhook configuration panel

**Files**:
- `src/app/dashboard/aido/reality-loop/page.tsx`
- `src/components/aido/RealityEventsFeed.tsx`
- `src/components/aido/EventDetailCard.tsx`
- `src/components/aido/WebhookConfigPanel.tsx`

---

### Dashboard 5: Google Curve Panel

**Route**: `/dashboard/aido/google-curve`

**Components**:
- Monitoring status (active keywords, last check)
- Change signals severity chart
- Signal detail cards:
  - Signal type, severity badge
  - Affected keywords
  - Before/after comparison
  - Detection timestamp
- Strategy recommendations panel:
  - Priority badges (urgent/high/medium/low)
  - Action items with checkboxes
  - Estimated impact
  - Due dates
- SERP observation history (line chart)

**Files**:
- `src/app/dashboard/aido/google-curve/page.tsx`
- `src/components/aido/ChangeSignalsSeverityChart.tsx`
- `src/components/aido/SignalDetailCard.tsx`
- `src/components/aido/StrategyRecommendationsPanel.tsx`
- `src/components/aido/SERPObservationChart.tsx`

---

## Cost Analysis

### Per-Client Monthly Costs

**Pipeline Costs**:
- Intent cluster generation: $0.40 × 10 clusters = **$4.00**
- Content generation: $1.00 × 20 assets = **$20.00**
- Reality-loop processing: $0.08 × 50 events = **$4.00**
- Conversational SEO optimization: $0.20 × 20 assets = **$4.00**
- Google-curve monitoring: $3.00 × 30 days = **$90.00**

**Total Monthly Cost per Client**: **$122.00**

**With 50 Clients**: **$6,100/month** in AI costs

### Revenue Model

**Pricing Tiers**:
- **AIDO Starter**: $299/month (10 content assets, basic monitoring)
- **AIDO Professional**: $599/month (50 content assets, full monitoring)
- **AIDO Enterprise**: $1,499/month (unlimited, priority analysis)

**Profit Margin** (Professional tier):
- Revenue: $599
- AI Cost: $122
- Gross Margin: **79.6%**

---

## Success Metrics

### Content Performance

**Target Scores**:
- Authority score: **0.8+** (80% of content)
- Evergreen score: **0.7+** (70% of content)
- AI-source score: **0.8+** (80% of content)

**AI Citation Rate**:
- Baseline: Client mentioned in 5% of relevant AI answers
- Target: Client mentioned in **40%** of relevant AI answers

### Algorithm Anticipation

**Detection Speed**:
- Industry average: 7-14 days to detect algorithm shift
- Target: **1-3 days** with Google-curve engine

**Competitive Advantage**:
- Respond to shifts **5-10 days** before competitors

### Reality-Loop Efficiency

**Event-to-Content Conversion**:
- Target: **60%** of high-value events generate content opportunities
- Average time: **24 hours** from event to published content

---

## Implementation Decision Point

### Option A: MVP Implementation (20-30 hours)

**Include**:
- ✅ Phase 1: Database schema (complete)
- ✅ Pipeline 1: Intent cluster generator
- ✅ Pipeline 2: Content generation (basic)
- ✅ Dashboard 1: AIDO overview
- ✅ Dashboard 3: Content assets manager (basic)

**Exclude**:
- ❌ Reality-loop pipeline (manual event entry only)
- ❌ Conversational SEO optimizer (include in content generation)
- ❌ Google-curve anticipation (manual monitoring)
- ❌ Advanced dashboards

**Timeline**: 3-4 weeks
**Cost**: $0-$1,000 in AI development costs

---

### Option B: Full Implementation (60-80 hours)

**Include**:
- ✅ All 5 pipelines fully automated
- ✅ All 5 dashboards with real-time updates
- ✅ Automated monitoring and alerts
- ✅ Webhook integrations
- ✅ Complete analytics

**Timeline**: 8-10 weeks
**Cost**: $2,000-$4,000 in AI development costs

---

## Next Steps

**User Decision Required**:
1. Choose implementation approach (MVP vs Full)
2. Confirm budget for AI development costs
3. Review and approve pipeline designs
4. Prioritize dashboard features

**Ready to Proceed**:
- Migration 204 ready to apply
- Foundation architecture complete
- AI service patterns established
- API endpoint patterns defined

---

**Document Status**: Complete
**Last Updated**: 2025-11-25
**Author**: AI Infrastructure Team
**Approval Required**: Product Owner
