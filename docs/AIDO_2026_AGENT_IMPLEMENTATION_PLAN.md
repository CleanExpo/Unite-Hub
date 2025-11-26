# AIDO 2026 Agent Implementation Plan

**Multi-Agent Orchestration for Google Algorithm Shift**

**Date**: 2025-11-25
**Architecture**: Orchestrator → Specialist Pattern
**Token Budget**: Unrestricted (as per user direction)

---

## Agent Architecture Overview

Following the Unite-Hub agent system defined in [.claude/agent.md](.claude/agent.md):

```
User Request (AIDO 2026 Implementation)
    ↓
Orchestrator Agent
    ├─→ Backend Agent (Database & API work)
    ├─→ Content Agent (AI content generation with Extended Thinking)
    ├─→ Frontend Agent (Dashboard UI work)
    └─→ Docs Agent (Documentation updates)
```

---

## Phase 2: Core Pipelines Implementation

### Task Distribution by Agent

#### Backend Agent - Pipeline Infrastructure (25-30 hours)

**Responsibilities**:
1. Create API endpoints (19 endpoints)
2. Implement database access layer
3. Set up cron jobs for monitoring
4. Configure webhook handlers
5. Implement authentication and workspace isolation

**Files to Create**:

**API Endpoints**:
```
src/app/api/aido/
├── clients/
│   ├── route.ts                    # POST, GET (list)
│   └── [id]/
│       └── route.ts                # GET, PATCH, DELETE
├── topics/
│   └── route.ts                    # POST, GET
├── intent-clusters/
│   ├── generate/
│   │   └── route.ts                # POST (trigger generation)
│   └── route.ts                    # GET (list), PATCH
├── content/
│   ├── generate/
│   │   └── route.ts                # POST (trigger generation)
│   ├── route.ts                    # GET (list)
│   └── [id]/
│       └── route.ts                # GET, PATCH
├── reality-loop/
│   ├── ingest/
│   │   └── route.ts                # POST (webhook handler)
│   ├── events/
│   │   └── route.ts                # GET (list events)
│   └── process/
│       └── route.ts                # POST (manual trigger)
└── google-curve/
    ├── monitor/
    │   └── route.ts                # POST (setup monitoring)
    ├── signals/
    │   └── route.ts                # GET (list signals)
    ├── analyze/
    │   └── route.ts                # POST (trigger analysis)
    └── recommendations/
        └── route.ts                # GET (strategy recs)
```

**Database Access Layer**:
```typescript
// src/lib/aido/database/client-profiles.ts
export async function createClientProfile(data: ClientProfileInput): Promise<ClientProfile>;
export async function getClientProfiles(workspaceId: string): Promise<ClientProfile[]>;
export async function updateClientProfile(id: string, data: Partial<ClientProfile>): Promise<ClientProfile>;

// src/lib/aido/database/intent-clusters.ts
export async function createIntentCluster(data: IntentClusterInput): Promise<IntentCluster>;
export async function getIntentClusters(topicId: string): Promise<IntentCluster[]>;
export async function updateIntentCluster(id: string, data: Partial<IntentCluster>): Promise<IntentCluster>;

// src/lib/aido/database/content-assets.ts
export async function createContentAsset(data: ContentAssetInput): Promise<ContentAsset>;
export async function getContentAssets(clientId: string): Promise<ContentAsset[]>;
export async function updateContentAsset(id: string, data: Partial<ContentAsset>): Promise<ContentAsset>;

// src/lib/aido/database/reality-events.ts
export async function ingestRealityEvent(data: RealityEventInput): Promise<RealityEvent>;
export async function getRealityEvents(clientId: string, limit?: number): Promise<RealityEvent[]>;
export async function updateEventStatus(id: string, status: string): Promise<void>;

// src/lib/aido/database/serp-observations.ts
export async function recordSerpObservation(data: SerpObservationInput): Promise<SerpObservation>;
export async function getSerpHistory(keyword: string, days: number): Promise<SerpObservation[]>;

// src/lib/aido/database/change-signals.ts
export async function createChangeSignal(data: ChangeSignalInput): Promise<ChangeSignal>;
export async function getActiveSignals(clientId: string): Promise<ChangeSignal[]>;

// src/lib/aido/database/strategy-recommendations.ts
export async function createRecommendation(data: RecommendationInput): Promise<StrategyRecommendation>;
export async function getRecommendations(clientId: string, status?: string): Promise<StrategyRecommendation[]>;
```

**Cron Jobs** (Vercel cron):
```json
// vercel.json (update)
{
  "crons": [
    {
      "path": "/api/agents/continuous-intelligence",
      "schedule": "*/30 * * * *"
    },
    {
      "path": "/api/aido/google-curve/monitor",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

**Orchestrator Instructions for Backend Agent**:
```markdown
Backend Agent, implement AIDO API infrastructure:

1. Create 19 API endpoints in src/app/api/aido/ following workspace isolation pattern
2. Implement 7 database access modules in src/lib/aido/database/
3. Add cron job configuration to vercel.json for google-curve monitoring
4. Ensure ALL queries filter by workspace_id
5. Use getSupabaseServer() for server-side database access
6. Implement RFC 7807 error responses for all endpoints
7. Add rate limiting using tier-based system (src/lib/rate-limit-tiers.ts)

Testing Requirements:
- Unit tests for database access functions
- Integration tests for API endpoints with workspace isolation verification
- Authentication tests for all protected routes

Estimated Time: 25-30 hours
Priority: HIGH (blocks Content Agent work)
```

---

#### Content Agent - AI Pipeline Services (30-35 hours)

**Responsibilities**:
1. Implement 6 AI services with Extended Thinking
2. Create scoring utilities (authority, evergreen, AI-source)
3. Implement Schema.org generators
4. Set up prompt caching strategies
5. Integrate Perplexity Sonar for SEO research

**Files to Create**:

**AI Services**:
```
src/lib/aido/
├── intent-cluster-ai.ts         # Opus 4 Extended Thinking (10000 tokens)
├── content-generation-ai.ts     # Opus 4 Extended Thinking (15000 tokens)
├── reality-event-processor.ts   # Sonnet 4.5
├── conversational-seo-ai.ts     # Sonnet 4.5
├── serp-change-detector.ts      # Haiku 4.5
├── google-curve-analyzer.ts     # Opus 4 Extended Thinking (10000 tokens)
├── scoring.ts                   # Scoring utilities
└── schema-generator.ts          # Schema.org helpers
```

**Intent Cluster AI** (Extended Thinking):
```typescript
// src/lib/aido/intent-cluster-ai.ts
import Anthropic from '@anthropic-ai/sdk';
import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter';
import { PerplexitySonar } from '@/lib/ai/perplexity-sonar';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    'anthropic-beta': 'prompt-caching-2024-07-31,thinking-2025-11-15',
  },
});

export async function generateIntentCluster(input: IntentClusterInput): Promise<IntentCluster> {
  // Step 1: Research with Perplexity Sonar
  const sonar = new PerplexitySonar(process.env.PERPLEXITY_API_KEY);
  const trendResearch = await sonar.search(
    `Latest search trends for ${input.seedKeywords.join(', ')} in ${input.location || 'general market'}`,
    { domains: ['searchengineland.com', 'moz.com', 'searchenginejournal.com'] }
  );

  // Step 2: Deep intent analysis with Extended Thinking
  const systemPrompt = `You are an expert search intent psychologist specializing in AI Discovery Optimization (AIDO).

Your task: Analyze search intents for content that AI systems (ChatGPT, Gemini, Perplexity) will cite as authoritative sources.

Research Context:
${trendResearch.answer}

Citations:
${trendResearch.citations.map((c: any) => `- ${c.title}: ${c.url}`).join('\n')}`;

  const result = await callAnthropicWithRetry(async () => {
    return await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 4096,
      thinking: {
        type: 'enabled',
        budget_tokens: 10000,
      },
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `Analyze search intent for: ${input.seedKeywords.join(', ')}

Topic: ${input.topicName}
Industry: ${input.industry}
Location: ${input.location || 'General'}
Competitor Domains: ${input.competitorDomains?.join(', ') || 'None provided'}

Generate a comprehensive intent cluster including:
1. Primary intent (single clear statement)
2. Secondary intents (array of 3-5 related needs)
3. Searcher mindset (emotional/mental state)
4. Pain points (array of 5-7 specific problems)
5. Desired outcomes (array of 3-5 success criteria)
6. Risk concerns (array of 3-5 blockers)
7. Purchase stage (awareness/consideration/decision/retention)
8. Example queries (array of 10-15 natural language queries)
9. Follow-up questions (array of 8-10 questions users ask after initial query)
10. Local modifiers (array of location-specific terms if applicable)

CRITICAL: Structure for AI ingestion. Use clear, factual statements optimized for AI citation.

Scoring:
- Business impact score (0.0-1.0): Revenue potential for this intent
- Difficulty score (0.0-1.0): Content creation effort required
- Alignment score (0.0-1.0): Match with brand expertise

Return as structured JSON.`,
        },
      ],
    });
  });

  const message = result.data;

  // Extract thinking content
  const thinkingBlock = message.content.find((block: any) => block.type === 'thinking');
  const textBlock = message.content.find((block: any) => block.type === 'text');

  // Parse JSON response
  const intentCluster = JSON.parse(textBlock.text);

  return {
    ...intentCluster,
    clientId: input.clientId,
    workspaceId: input.workspaceId,
    topicId: input.topicId,
    lastRefreshedAt: new Date(),
    createdAt: new Date(),
  };
}
```

**Content Generation AI** (Extended Thinking with Iterative Refinement):
```typescript
// src/lib/aido/content-generation-ai.ts
import Anthropic from '@anthropic-ai/sdk';
import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter';
import {
  calculateAuthorityScore,
  calculateEvergreenScore,
  calculateAISourceScore,
} from './scoring';
import {
  generateFAQPageSchema,
  generateHowToSchema,
  generateServiceSchema,
} from './schema-generator';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    'anthropic-beta': 'prompt-caching-2024-07-31,thinking-2025-11-15',
  },
});

export async function generateAlgorithmicImmuneContent(
  input: ContentGenerationInput
): Promise<ContentAsset> {
  const maxIterations = 2;
  let currentIteration = 0;
  let bestContent: ContentAsset | null = null;
  let bestCompositeScore = 0;

  const targetScores = input.targetScores || {
    authority: 0.8,
    evergreen: 0.7,
    aiSource: 0.8,
  };

  // Fetch intent cluster data
  const intentCluster = await getIntentCluster(input.intentClusterId);

  const systemPrompt = `You are an expert content strategist specializing in Algorithmic Immunity Content for AIDO (AI Discovery Optimization).

Your mission: Create deep evergreen content that AI systems (ChatGPT, Gemini, Perplexity) will cite as authoritative sources, surviving algorithm changes.

Target Scores:
- Authority Score: ${targetScores.authority} (expert depth, citations, credentials)
- Evergreen Score: ${targetScores.evergreen} (timeless value vs time-sensitivity)
- AI Source Score: ${targetScores.aiSource} (clarity, structure, factual density)

Intent Cluster Context:
- Primary Intent: ${intentCluster.primaryIntent}
- Searcher Mindset: ${intentCluster.searcherMindset}
- Pain Points: ${intentCluster.painPoints.join(', ')}
- Desired Outcomes: ${intentCluster.desiredOutcomes.join(', ')}
- Risk Concerns: ${intentCluster.riskConcerns.join(', ')}
- Purchase Stage: ${intentCluster.purchaseStage}`;

  while (currentIteration < maxIterations) {
    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create({
        model: 'claude-opus-4-5-20251101',
        max_tokens: 8192,
        thinking: {
          type: 'enabled',
          budget_tokens: 15000,
        },
        system: [
          {
            type: 'text',
            text: systemPrompt,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: `Generate ${input.contentType} content in ${input.format} format.

Client Context:
- Brand: ${input.clientContext.name}
- Niche: ${input.clientContext.niches.join(', ')}
- Brand Tone: ${input.clientContext.brandTone}
- Expertise Tags: ${input.clientContext.expertiseTags.join(', ')}
- Value Props: ${input.clientContext.valueProps.join(', ')}

Content Requirements:
1. Title (SEO + AI-friendly, 50-70 chars)
2. Slug (URL-friendly)
3. Summary (150-200 chars, high factual density)
4. Body (Markdown, 2000-5000 words)
   - Deep expert analysis
   - Citations to authoritative sources
   - Clear structure with H2/H3 headings
   - Factual statements optimized for AI ingestion
   - Timeless principles + current examples
5. QA Blocks (10-15 conversational Q&A pairs)
   - Natural language questions
   - Direct, factual answers (100-200 words each)
   - Follow-up questions (2-3 per answer)
6. Schema Types (select from: FAQPage, HowTo, Service, LocalBusiness, Article)
7. Media Assets (describe 3-5 images/diagrams needed)
8. Localisation Tags (if location-specific)

${currentIteration > 0 ? `
ITERATION ${currentIteration + 1}: Previous scores did not meet targets.
Previous Scores:
- Authority: ${bestContent?.authorityScore.toFixed(2)}
- Evergreen: ${bestContent?.evergreenScore.toFixed(2)}
- AI Source: ${bestContent?.aiSourceScore.toFixed(2)}

IMPROVE:
- ${bestContent!.authorityScore < targetScores.authority ? 'Add more expert depth, citations, credentials' : ''}
- ${bestContent!.evergreenScore < targetScores.evergreen ? 'Focus on timeless principles, reduce time-sensitive content' : ''}
- ${bestContent!.aiSourceScore < targetScores.aiSource ? 'Improve clarity, structure, factual density' : ''}
` : ''}

Return as structured JSON with all fields.`,
          },
        ],
      });
    });

    const message = result.data;
    const textBlock = message.content.find((block: any) => block.type === 'text');
    const generatedContent = JSON.parse(textBlock.text);

    // Calculate scores
    const authorityScore = calculateAuthorityScore(generatedContent);
    const evergreenScore = calculateEvergreenScore(generatedContent);
    const aiSourceScore = calculateAISourceScore(generatedContent);
    const compositeScore = (authorityScore * 0.4) + (evergreenScore * 0.3) + (aiSourceScore * 0.3);

    const contentAsset: ContentAsset = {
      ...generatedContent,
      clientId: input.clientId,
      workspaceId: input.workspaceId,
      topicId: input.topicId,
      intentClusterId: input.intentClusterId,
      authorityScore,
      evergreenScore,
      aiSourceScore,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Check if scores meet targets
    if (
      authorityScore >= targetScores.authority &&
      evergreenScore >= targetScores.evergreen &&
      aiSourceScore >= targetScores.aiSource
    ) {
      return contentAsset;
    }

    // Track best iteration
    if (compositeScore > bestCompositeScore) {
      bestContent = contentAsset;
      bestCompositeScore = compositeScore;
    }

    currentIteration++;
  }

  // Return best attempt after max iterations
  return bestContent!;
}
```

**Scoring Utilities**:
```typescript
// src/lib/aido/scoring.ts
export function calculateAuthorityScore(content: ContentAsset): number {
  let score = 0.5; // Base score

  // Expert depth: word count analysis
  const wordCount = content.bodyMarkdown.split(/\s+/).length;
  if (wordCount >= 3000) score += 0.15;
  else if (wordCount >= 2000) score += 0.10;
  else if (wordCount >= 1000) score += 0.05;

  // Citations: count markdown links to authoritative domains
  const citationRegex = /\[.*?\]\((https?:\/\/[^\)]+)\)/g;
  const citations = content.bodyMarkdown.match(citationRegex) || [];
  const authoritativeDomains = ['edu', 'gov', 'org'];
  const authorityLinks = citations.filter(link =>
    authoritativeDomains.some(domain => link.includes(`.${domain}`))
  );
  if (authorityLinks.length >= 10) score += 0.20;
  else if (authorityLinks.length >= 5) score += 0.15;
  else if (authorityLinks.length >= 3) score += 0.10;

  // Credentials: check for author expertise mentions
  const expertiseKeywords = ['certified', 'expert', 'specialist', 'years of experience', 'licensed'];
  const hasCredentials = expertiseKeywords.some(keyword =>
    content.bodyMarkdown.toLowerCase().includes(keyword)
  );
  if (hasCredentials) score += 0.10;

  // QA depth
  if (content.qaBlocks.length >= 15) score += 0.10;
  else if (content.qaBlocks.length >= 10) score += 0.05;

  return Math.min(score, 1.0);
}

export function calculateEvergreenScore(content: ContentAsset): number {
  let score = 0.5; // Base score

  // Time-sensitivity analysis: check for date-specific language
  const timeSensitivePatterns = [
    /\b(2024|2025|2026|this year|last year|next year)\b/gi,
    /\b(current|recent|latest|new|upcoming)\b/gi,
    /\b(today|yesterday|tomorrow|now)\b/gi,
  ];

  let timeSensitiveMatches = 0;
  timeSensitivePatterns.forEach(pattern => {
    const matches = content.bodyMarkdown.match(pattern);
    if (matches) timeSensitiveMatches += matches.length;
  });

  const wordCount = content.bodyMarkdown.split(/\s+/).length;
  const timeSensitiveRatio = timeSensitiveMatches / wordCount;

  if (timeSensitiveRatio < 0.01) score += 0.30; // Highly evergreen
  else if (timeSensitiveRatio < 0.03) score += 0.20;
  else if (timeSensitiveRatio < 0.05) score += 0.10;
  else score -= 0.10; // Too time-sensitive

  // Principle-based language
  const principleKeywords = ['fundamentals', 'principles', 'always', 'core concepts', 'timeless'];
  const principleCount = principleKeywords.filter(keyword =>
    content.bodyMarkdown.toLowerCase().includes(keyword)
  ).length;
  score += principleCount * 0.05;

  return Math.max(0, Math.min(score, 1.0));
}

export function calculateAISourceScore(content: ContentAsset): number {
  let score = 0.5; // Base score

  // Clarity: check for clear structure
  const h2Headings = (content.bodyMarkdown.match(/^## /gm) || []).length;
  const h3Headings = (content.bodyMarkdown.match(/^### /gm) || []).length;
  if (h2Headings >= 5 && h3Headings >= 10) score += 0.15;
  else if (h2Headings >= 3 && h3Headings >= 5) score += 0.10;

  // Factual density: count factual statements (sentences with numbers, stats, specific data)
  const factualPatterns = [
    /\b\d+%\b/g,           // Percentages
    /\b\d+\s*(km|m|kg|g|hours|minutes|days)\b/gi,  // Measurements
    /\b\d{4}\b/g,          // Years
    /\$([\d,]+)/g,         // Currency
  ];
  let factualStatements = 0;
  factualPatterns.forEach(pattern => {
    const matches = content.bodyMarkdown.match(pattern);
    if (matches) factualStatements += matches.length;
  });
  if (factualStatements >= 20) score += 0.20;
  else if (factualStatements >= 10) score += 0.15;
  else if (factualStatements >= 5) score += 0.10;

  // QA optimization for AI ingestion
  if (content.qaBlocks.length >= 10) {
    const avgAnswerLength = content.qaBlocks.reduce((sum, qa) =>
      sum + qa.answer.split(/\s+/).length, 0
    ) / content.qaBlocks.length;
    if (avgAnswerLength >= 100 && avgAnswerLength <= 200) score += 0.15;
  }

  // Schema.org types
  if (content.schemaTypes.includes('FAQPage')) score += 0.05;
  if (content.schemaTypes.includes('HowTo')) score += 0.05;

  return Math.min(score, 1.0);
}
```

**Orchestrator Instructions for Content Agent**:
```markdown
Content Agent, implement AIDO AI pipeline services:

1. Create 6 AI services in src/lib/aido/:
   - intent-cluster-ai.ts (Opus 4 Extended Thinking, 10000 token budget)
   - content-generation-ai.ts (Opus 4 Extended Thinking, 15000 token budget, iterative)
   - reality-event-processor.ts (Sonnet 4.5)
   - conversational-seo-ai.ts (Sonnet 4.5)
   - serp-change-detector.ts (Haiku 4.5)
   - google-curve-analyzer.ts (Opus 4 Extended Thinking, 10000 token budget)

2. Implement scoring utilities in src/lib/aido/scoring.ts:
   - calculateAuthorityScore() (expert depth, citations, credentials)
   - calculateEvergreenScore() (timeless value analysis)
   - calculateAISourceScore() (clarity, structure, factual density)

3. Create Schema.org generators in src/lib/aido/schema-generator.ts:
   - generateFAQPageSchema()
   - generateHowToSchema()
   - generateServiceSchema()

4. Integrate Perplexity Sonar for SEO research in intent clustering

5. Use prompt caching for system prompts (ephemeral cache_control)

6. Implement retry logic for all Anthropic calls (callAnthropicWithRetry)

7. Include Extended Thinking analysis in service logs for debugging

Testing Requirements:
- Unit tests for scoring functions (verify score ranges 0.0-1.0)
- Integration tests for AI services (with mock Anthropic responses)
- Cost tracking for Extended Thinking token usage

Estimated Time: 30-35 hours
Priority: HIGH (depends on Backend Agent database layer)
Dependencies: Backend Agent must complete database access layer first
```

---

#### Frontend Agent - Dashboard UI (15-20 hours)

**Responsibilities**:
1. Create 5 dashboard routes
2. Implement 20+ React components
3. Set up real-time data fetching
4. Implement charts and visualizations
5. Create forms for content generation

**Files to Create**:

**Dashboard Routes**:
```
src/app/dashboard/aido/
├── overview/
│   └── page.tsx
├── intent-clusters/
│   └── page.tsx
├── content/
│   └── page.tsx
├── reality-loop/
│   └── page.tsx
└── google-curve/
    └── page.tsx
```

**React Components**:
```
src/components/aido/
├── AIDOMetricsCards.tsx
├── ChangeSignalsTimeline.tsx
├── StrategyRecommendationsList.tsx
├── IntentClusterCard.tsx
├── GenerateClusterModal.tsx
├── ContentAssetsTable.tsx
├── ContentEditor.tsx
├── QABlocksEditor.tsx
├── ScoreImprovementPanel.tsx
├── RealityEventsFeed.tsx
├── EventDetailCard.tsx
├── WebhookConfigPanel.tsx
├── ChangeSignalsSeverityChart.tsx
├── SignalDetailCard.tsx
├── StrategyRecommendationsPanel.tsx
└── SERPObservationChart.tsx
```

**Orchestrator Instructions for Frontend Agent**:
```markdown
Frontend Agent, implement AIDO dashboard UI:

1. Create 5 dashboard routes in src/app/dashboard/aido/:
   - overview (metrics, signals, recommendations)
   - intent-clusters (cluster management, generation)
   - content (assets table, editor, scoring)
   - reality-loop (event feed, webhook config)
   - google-curve (signals chart, SERP history)

2. Create 15+ React components in src/components/aido/ using shadcn/ui:
   - Follow existing dashboard patterns from dashboard/contacts
   - Use Tailwind CSS for styling
   - Implement dark theme compatibility
   - Use Lucide React icons

3. Implement real-time data fetching:
   - Use React Query for caching
   - Poll for updates every 30 seconds on active dashboards
   - Show loading states (skeletons from shadcn/ui)

4. Charts and visualizations:
   - Use Recharts library (already installed)
   - Score progress bars (0.0-1.0 scale)
   - Timeline charts for signals
   - SERP observation line charts

5. Forms:
   - Generate cluster modal (topic, keywords, location)
   - Generate content modal (intent cluster, type, format)
   - Webhook configuration form

6. Authentication:
   - Use AuthContext for user/org data
   - Pass workspace_id to all API calls
   - Handle unauthorized states

Testing Requirements:
- Component tests with React Testing Library
- E2E tests for critical user flows (generate content, view signals)

Estimated Time: 15-20 hours
Priority: MEDIUM (can start after Backend Agent completes API endpoints)
Dependencies: Backend Agent API endpoints must be complete
```

---

#### Docs Agent - Documentation (3-4 hours)

**Responsibilities**:
1. Update CLAUDE.md with AIDO system overview
2. Create API documentation for new endpoints
3. Update README.md with AIDO features
4. Create user guides for dashboards

**Orchestrator Instructions for Docs Agent**:
```markdown
Docs Agent, document AIDO 2026 system:

1. Update CLAUDE.md:
   - Add AIDO System Overview section
   - Document 5 strategic pillars
   - Add multi-scoring system explanation
   - Include usage examples for each pipeline

2. Create docs/AIDO_API_DOCUMENTATION.md:
   - Document all 19 API endpoints
   - Include request/response examples
   - Authentication requirements
   - Rate limiting information

3. Update README.md:
   - Add AIDO features section
   - Include quick start guide
   - Add cost estimates per client

4. Create docs/AIDO_USER_GUIDE.md:
   - Dashboard navigation
   - How to generate intent clusters
   - Content generation workflow
   - Reality-loop setup
   - Google-curve monitoring

Estimated Time: 3-4 hours
Priority: LOW (can be done anytime)
```

---

## Implementation Timeline

### Week 1-2: Backend Infrastructure (Backend Agent)
- ✅ Day 1-2: Apply migration 204, verify schema
- ✅ Day 3-5: Create database access layer (7 modules)
- ✅ Day 6-10: Implement API endpoints (19 endpoints)
- ✅ Day 11-12: Set up cron jobs, webhook handlers
- ✅ Day 13-14: Testing and workspace isolation verification

**Deliverable**: All API endpoints operational, database layer complete

---

### Week 3-4: AI Services (Content Agent)
- ✅ Day 15-17: Intent cluster AI with Extended Thinking
- ✅ Day 18-22: Content generation AI with iterative refinement
- ✅ Day 23-24: Reality event processor, conversational SEO optimizer
- ✅ Day 25-26: SERP change detector, Google-curve analyzer
- ✅ Day 27-28: Scoring utilities, Schema.org generators
- ✅ Day 29-30: Testing, cost optimization

**Deliverable**: All 6 AI services operational, scoring systems validated

---

### Week 5-6: Dashboard UI (Frontend Agent) + Docs (Docs Agent)
- ✅ Day 31-32: AIDO overview dashboard
- ✅ Day 33-34: Intent clusters manager
- ✅ Day 35-37: Content assets manager with editor
- ✅ Day 38-39: Reality-loop console
- ✅ Day 40-41: Google-curve panel
- ✅ Day 42: Testing, responsive design
- ⏸️ Day 43-44: Documentation (parallel with UI work)

**Deliverable**: Complete AIDO dashboard suite, comprehensive documentation

---

## Testing Strategy

### Unit Tests
```typescript
// tests/aido/scoring.test.ts
describe('calculateAuthorityScore', () => {
  it('should return high score for content with 10+ authoritative citations', () => {
    const content = {
      bodyMarkdown: '...',
      qaBlocks: [...],
    };
    expect(calculateAuthorityScore(content)).toBeGreaterThan(0.8);
  });
});
```

### Integration Tests
```typescript
// tests/integration/aido-pipeline.test.ts
describe('Intent Cluster Generation Pipeline', () => {
  it('should generate intent cluster with scores above 0.5', async () => {
    const cluster = await generateIntentCluster({
      clientId: '...',
      workspaceId: '...',
      seedKeywords: ['stainless steel balustrades'],
    });
    expect(cluster.businessImpactScore).toBeGreaterThan(0.5);
  });
});
```

### E2E Tests
```typescript
// tests/e2e/aido-content-generation.spec.ts
test('Generate content flow', async ({ page }) => {
  await page.goto('/dashboard/aido/content');
  await page.click('text=Generate Content');
  await page.selectOption('select[name="intentCluster"]', '...');
  await page.click('button:has-text("Generate")');
  await expect(page.locator('text=Authority Score')).toBeVisible();
});
```

---

## Cost Tracking

### AI Cost Per Pipeline Run

**Intent Cluster Generation**:
- Perplexity Sonar research: $0.01
- Claude Opus 4 Extended Thinking (10000 tokens): $0.30-0.40
- **Total**: ~$0.40 per cluster

**Content Generation**:
- Claude Opus 4 Extended Thinking (15000 tokens × 2 iterations): $0.80-1.20
- **Total**: ~$1.00 per content asset

**Reality Event Processing**:
- Claude Sonnet 4.5 (1000 tokens): $0.05
- **Total**: ~$0.05 per event

**Conversational SEO Optimization**:
- Claude Sonnet 4.5 (2000 tokens): $0.10
- **Total**: ~$0.10 per optimization

**Google-Curve Monitoring** (per day per client):
- SERP observations: $0.50
- Claude Haiku 4.5 change detection: $0.50
- Claude Opus 4 strategy analysis: $2.00
- **Total**: ~$3.00 per day per client

### Monthly Cost per Client
- 10 intent clusters: $4.00
- 20 content assets: $20.00
- 50 reality events: $2.50
- 20 SEO optimizations: $2.00
- 30 days monitoring: $90.00
- **Total**: **$118.50/month per client**

### Budget Alerts
```typescript
// src/lib/aido/cost-tracking.ts
export async function checkMonthlyBudget(clientId: string): Promise<void> {
  const currentMonth = new Date();
  const costs = await getMonthlyAICosts(clientId, currentMonth);

  if (costs.total >= 100) {
    await sendBudgetAlert(clientId, costs);
  }
}
```

---

## Completion Checklist

### Phase 2: Core Pipelines ✅
- [ ] Backend: 19 API endpoints created
- [ ] Backend: 7 database modules implemented
- [ ] Backend: Cron jobs configured
- [ ] Backend: Workspace isolation verified
- [ ] Content: Intent cluster AI operational
- [ ] Content: Content generation AI operational
- [ ] Content: Reality event processor operational
- [ ] Content: Conversational SEO optimizer operational
- [ ] Content: SERP change detector operational
- [ ] Content: Google-curve analyzer operational
- [ ] Content: Scoring utilities tested
- [ ] Content: Schema.org generators created

### Phase 3: Dashboard UI ✅
- [ ] Frontend: Overview dashboard complete
- [ ] Frontend: Intent clusters manager complete
- [ ] Frontend: Content assets manager complete
- [ ] Frontend: Reality-loop console complete
- [ ] Frontend: Google-curve panel complete
- [ ] Frontend: Real-time updates working
- [ ] Frontend: Charts rendering correctly
- [ ] Frontend: Forms validated

### Phase 4: Documentation ✅
- [ ] Docs: CLAUDE.md updated
- [ ] Docs: API documentation complete
- [ ] Docs: User guide created
- [ ] Docs: README.md updated

### Phase 5: Testing ✅
- [ ] Unit tests passing (>80% coverage)
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Cost tracking verified

---

## Ready to Execute

**Migration 204**: ✅ Ready to apply
**Agent Skills**: ✅ Defined in this document
**Token Budget**: ✅ Unrestricted (as per user direction)
**Architecture**: ✅ Orchestrator → Specialist pattern

**Awaiting**: User approval to begin implementation

**Estimated Total Time**: 60-80 hours across 4 agents

---

**Document Status**: Complete
**Last Updated**: 2025-11-25
**Author**: Orchestrator Agent
**Next Action**: Apply migration 204, spawn Backend Agent for API infrastructure
