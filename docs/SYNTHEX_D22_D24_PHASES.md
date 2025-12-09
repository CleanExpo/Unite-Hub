# Synthex Autonomous Growth Ops - Phases D22-D24

**Version**: 1.0.0
**Last Updated**: 2025-12-07
**Status**: Production Ready

---

## Overview

Phases D22-D24 extend the Synthex D-Series with advanced AI capabilities for intelligent reasoning, contact understanding, and real-time personalization.

| Phase | Component | Purpose |
|-------|-----------|---------|
| D22 | Multi-Model AI Reasoning Engine | Orchestrates multiple AI models for complex reasoning with chain-of-thought |
| D23 | Contact Intent + Sentiment AI Engine | AI-powered analysis of contact communications for intent and sentiment |
| D24 | Adaptive Personalisation Engine | Real-time content and experience personalization based on behavior |

---

## Phase D22: Multi-Model AI Reasoning Engine

### Purpose

Orchestrates multiple AI models for complex reasoning tasks, providing chain-of-thought traces, confidence scoring, model fallback, and prompt template management with caching.

### Database Schema

**Migration**: `supabase/migrations/451_synthex_multimodel_reasoning.sql`

| Table | Purpose |
|-------|---------|
| `synthex_library_reasoning_models` | Registered AI models with configuration |
| `synthex_library_reasoning_chains` | Multi-step reasoning chain definitions |
| `synthex_library_reasoning_logs` | Execution logs with full traces |
| `synthex_library_reasoning_prompts` | Reusable prompt templates |
| `synthex_library_reasoning_cache` | Response caching with hash lookup |
| `synthex_library_reasoning_feedback` | User feedback for model improvement |

### Service Layer

**File**: `src/lib/synthex/multimodelReasoningService.ts`

#### Key Functions

```typescript
// Model Management
createModel(tenantId: string, model: CreateModelInput): Promise<ReasoningModel>
listModels(tenantId: string): Promise<ReasoningModel[]>
updateModel(modelId: string, updates: Partial<ReasoningModel>): Promise<ReasoningModel>
deleteModel(modelId: string): Promise<void>

// Chain Management
createChain(tenantId: string, chain: CreateChainInput): Promise<ReasoningChain>
listChains(tenantId: string): Promise<ReasoningChain[]>
updateChain(chainId: string, updates: Partial<ReasoningChain>): Promise<ReasoningChain>
deleteChain(chainId: string): Promise<void>

// Prompt Templates
createPrompt(tenantId: string, prompt: CreatePromptInput): Promise<ReasoningPrompt>
listPrompts(tenantId: string, category?: string): Promise<ReasoningPrompt[]>
updatePrompt(promptId: string, updates: Partial<ReasoningPrompt>): Promise<ReasoningPrompt>

// Reasoning Execution
runReasoning(tenantId: string, input: ReasoningInput): Promise<ReasoningLog>
executeChain(tenantId: string, chainId: string, input: string, variables?: Record<string, string>): Promise<ReasoningLog>
executePrompt(tenantId: string, promptId: string, variables: Record<string, string>): Promise<ReasoningLog>
executeDirect(tenantId: string, prompt: string, modelId?: string): Promise<ReasoningLog>

// Logs & Feedback
listLogs(tenantId: string, filters?: LogFilters): Promise<ReasoningLog[]>
getLog(logId: string): Promise<ReasoningLog | null>
submitFeedback(logId: string, feedback: FeedbackInput): Promise<ReasoningFeedback>
getFeedback(logId: string): Promise<ReasoningFeedback[]>

// Statistics
getReasoningStats(tenantId: string): Promise<ReasoningStats>
initializeDefaultModels(tenantId: string): Promise<void>
```

### Chain Types

| Type | Description |
|------|-------------|
| `sequential` | Steps execute in order, each using previous output |
| `parallel` | Steps execute simultaneously, results merged |
| `branching` | Conditional paths based on step outcomes |
| `iterative` | Loops until condition met or max iterations |
| `ensemble` | Multiple models vote on final answer |

### API Routes

**File**: `src/app/api/synthex/reasoning/route.ts`

| Method | Type | Description |
|--------|------|-------------|
| GET | `stats` | Reasoning statistics overview |
| GET | `models` | List all registered models |
| GET | `model` | Get single model details |
| GET | `chains` | List reasoning chains |
| GET | `chain` | Get single chain details |
| GET | `prompts` | List prompt templates |
| GET | `prompt` | Get single prompt |
| GET | `logs` | List execution logs |
| GET | `log` | Get single log with traces |
| GET | `feedback` | Get feedback for a log |
| POST | `run` | Execute direct reasoning |
| POST | `create_model` | Register new model |
| POST | `update_model` | Update model config |
| POST | `delete_model` | Remove model |
| POST | `create_chain` | Create reasoning chain |
| POST | `update_chain` | Update chain steps |
| POST | `delete_chain` | Remove chain |
| POST | `create_prompt` | Create prompt template |
| POST | `submit_feedback` | Submit user feedback |
| POST | `initialize_defaults` | Set up default models |

### UI Component

**File**: `src/app/(synthex)/synthex/reasoning/page.tsx`

Features:
- Stats overview (total runs, avg latency, cache hit rate, accuracy)
- Interactive reasoning test panel
- Model registry with capabilities display
- Chain editor with step visualization
- Prompt template library
- Execution log viewer with trace expansion
- Feedback collection interface

### Default Models

| Model | Provider | Purpose | Priority |
|-------|----------|---------|----------|
| claude-sonnet | Anthropic | General reasoning | 1 |
| claude-haiku | Anthropic | Fast responses | 2 |
| claude-opus | Anthropic | Complex analysis | 3 |

---

## Phase D23: Contact Intent + Sentiment AI Engine

### Purpose

Analyzes contact communications to extract intent signals, track sentiment over time, and provide recommended responses with confidence scoring.

### Database Schema

**Migration**: `supabase/migrations/452_synthex_contact_intent_sentiment.sql`

| Table | Purpose |
|-------|---------|
| `synthex_library_contact_intents` | Detected intents with confidence |
| `synthex_library_intent_patterns` | Pattern matching rules for intent detection |
| `synthex_library_sentiment_history` | Sentiment tracking over time |
| `synthex_library_intent_signals` | Real-time signals requiring attention |
| `synthex_library_intent_responses` | Suggested response templates |
| `synthex_library_intent_analytics` | Aggregated intent statistics |

### Service Layer

**File**: `src/lib/synthex/contactIntentService.ts`

#### Key Functions

```typescript
// Intent Analysis
analyzeIntent(tenantId: string, contactId: string, input: IntentAnalysisInput): Promise<ContactIntent>
getIntent(intentId: string): Promise<ContactIntent | null>
listIntents(tenantId: string, filters?: IntentFilters): Promise<ContactIntent[]>
resolveIntent(intentId: string, resolution: string, userId: string): Promise<ContactIntent>

// Signal Management
listSignals(tenantId: string, filters?: SignalFilters): Promise<IntentSignal[]>
acknowledgeSignal(signalId: string, userId: string): Promise<IntentSignal>
dismissSignal(signalId: string, reason: string, userId: string): Promise<IntentSignal>
createSignal(tenantId: string, signal: CreateSignalInput): Promise<IntentSignal>

// Pattern Management
listPatterns(tenantId: string, intentType?: string): Promise<IntentPattern[]>
createPattern(tenantId: string, pattern: CreatePatternInput): Promise<IntentPattern>
updatePattern(patternId: string, updates: Partial<IntentPattern>): Promise<IntentPattern>
deletePattern(patternId: string): Promise<void>

// Response Templates
listResponses(tenantId: string, intentType?: string): Promise<IntentResponse[]>
createResponse(tenantId: string, response: CreateResponseInput): Promise<IntentResponse>
updateResponse(responseId: string, updates: Partial<IntentResponse>): Promise<IntentResponse>
deleteResponse(responseId: string): Promise<void>

// Sentiment Tracking
getContactSentimentHistory(tenantId: string, contactId: string, limit?: number): Promise<SentimentHistory[]>
getContactSentimentSummary(tenantId: string, contactId: string): Promise<SentimentSummary>

// Statistics
getIntentStats(tenantId: string): Promise<IntentStats>
```

### Intent Types

| Type | Description |
|------|-------------|
| `inquiry` | General questions or information requests |
| `complaint` | Negative feedback or issues |
| `purchase` | Buying intent or interest |
| `support` | Help or assistance requests |
| `feedback` | General feedback (positive/negative) |
| `cancellation` | Intent to cancel or churn |
| `upgrade` | Interest in upgrades or more features |
| `referral` | Willingness to refer others |

### Sentiment Scale

| Value | Label | Description |
|-------|-------|-------------|
| 0.0-0.2 | Very Negative | Strong negative sentiment |
| 0.2-0.4 | Negative | Negative sentiment |
| 0.4-0.6 | Neutral | No strong sentiment |
| 0.6-0.8 | Positive | Positive sentiment |
| 0.8-1.0 | Very Positive | Strong positive sentiment |

### API Routes

**File**: `src/app/api/synthex/contacts/intent/route.ts`

| Method | Type | Description |
|--------|------|-------------|
| GET | `stats` | Intent statistics overview |
| GET | `intents` | List detected intents |
| GET | `intent` | Get single intent details |
| GET | `signals` | List active signals |
| GET | `patterns` | List detection patterns |
| GET | `responses` | List response templates |
| GET | `sentiment_history` | Contact sentiment over time |
| GET | `sentiment_summary` | Contact sentiment summary |
| POST | `analyze` | Analyze text for intent |
| POST | `resolve_intent` | Mark intent as resolved |
| POST | `acknowledge_signal` | Acknowledge a signal |
| POST | `dismiss_signal` | Dismiss a signal |
| POST | `create_pattern` | Create detection pattern |
| POST | `create_response` | Create response template |

### UI Component

**File**: `src/components/synthex/contacts/ContactIntentPanel.tsx`

Features:
- Sentiment overview with trend indicator
- Active signals list with priority badges
- Analyze text input with AI detection
- Intent history timeline
- Recommended responses
- Pattern matching visualization
- Confidence score display

### Default Patterns

| Pattern | Intent Type | Keywords | Confidence |
|---------|-------------|----------|------------|
| Pricing Inquiry | inquiry | price, cost, pricing, quote | 0.85 |
| Support Request | support | help, issue, problem, error | 0.9 |
| Purchase Intent | purchase | buy, order, purchase, subscribe | 0.85 |
| Complaint | complaint | terrible, awful, worst, unacceptable | 0.9 |
| Upgrade Interest | upgrade | upgrade, more features, premium | 0.8 |
| Cancellation Risk | cancellation | cancel, stop, unsubscribe, leave | 0.95 |

---

## Phase D24: Adaptive Personalisation Engine (Real-Time)

### Purpose

Provides real-time content and experience personalization based on behavioral profiles, event tracking, AI-generated recommendations, A/B experiments, and customer personas.

### Database Schema

**Migration**: `supabase/migrations/453_synthex_personalisation_engine.sql`

| Table | Purpose |
|-------|---------|
| `synthex_library_personalisation_profiles` | Contact behavioral profiles |
| `synthex_library_personalisation_events` | Event tracking for personalization |
| `synthex_library_personalisation_rules` | Personalization rules and conditions |
| `synthex_library_personalisation_recommendations` | AI-generated recommendations |
| `synthex_library_personalisation_experiments` | A/B testing experiments |
| `synthex_library_personalisation_personas` | Customer persona definitions |
| `synthex_library_personalisation_content` | Personalized content variants |

### Service Layer

**File**: `src/lib/synthex/personalisationService.ts`

#### Key Functions

```typescript
// Profile Management
getProfile(tenantId: string, contactId: string): Promise<PersonalisationProfile | null>
updateProfile(tenantId: string, contactId: string, updates: ProfileUpdates): Promise<PersonalisationProfile>
computeProfile(tenantId: string, contactId: string): Promise<PersonalisationProfile>
calculateProfileCompleteness(profile: PersonalisationProfile): number

// Event Tracking
trackEvent(tenantId: string, event: TrackEventInput): Promise<PersonalisationEvent>
listEvents(tenantId: string, filters?: EventFilters): Promise<PersonalisationEvent[]>

// Recommendations
generateRecommendations(tenantId: string, contactId: string, types?: RecommendationType[]): Promise<PersonalisationRecommendation[]>
listRecommendations(tenantId: string, filters?: RecommendationFilters): Promise<PersonalisationRecommendation[]>
updateRecommendationStatus(recommendationId: string, status: RecommendationStatus): Promise<PersonalisationRecommendation>

// Rules
createRule(tenantId: string, rule: CreateRuleInput): Promise<PersonalisationRule>
listRules(tenantId: string, ruleType?: RuleType): Promise<PersonalisationRule[]>
updateRule(ruleId: string, updates: Partial<PersonalisationRule>): Promise<PersonalisationRule>
deleteRule(ruleId: string): Promise<void>
evaluateRules(tenantId: string, profile: PersonalisationProfile): Promise<MatchedRule[]>

// Experiments
createExperiment(tenantId: string, experiment: CreateExperimentInput): Promise<PersonalisationExperiment>
listExperiments(tenantId: string, status?: ExperimentStatus): Promise<PersonalisationExperiment[]>
updateExperimentStatus(experimentId: string, status: ExperimentStatus): Promise<PersonalisationExperiment>
assignVariant(experimentId: string, contactId: string): Promise<ExperimentVariant>
recordConversion(experimentId: string, contactId: string, value?: number): Promise<void>

// Personas
createPersona(tenantId: string, persona: CreatePersonaInput): Promise<PersonalisationPersona>
listPersonas(tenantId: string): Promise<PersonalisationPersona[]>
updatePersona(personaId: string, updates: Partial<PersonalisationPersona>): Promise<PersonalisationPersona>
matchContactToPersonas(tenantId: string, contactId: string): Promise<PersonaMatch[]>

// Statistics
getPersonalisationStats(tenantId: string): Promise<PersonalisationStats>
```

### Event Types

| Type | Description |
|------|-------------|
| `page_view` | Page visit tracking |
| `click` | Element/link clicks |
| `form_submit` | Form submissions |
| `purchase` | Purchase completions |
| `signup` | Account signups |
| `login` | Account logins |
| `search` | Search queries |
| `video_view` | Video watching |
| `download` | File downloads |
| `share` | Social sharing |
| `email_open` | Email opens |
| `email_click` | Email link clicks |
| `custom` | Custom events |

### Rule Types

| Type | Description |
|------|-------------|
| `content` | Content variant selection |
| `layout` | Page layout changes |
| `offer` | Special offer display |
| `navigation` | Navigation customization |
| `messaging` | Message tone/style |
| `timing` | Optimal timing rules |
| `channel` | Channel preference routing |

### Recommendation Types

| Type | Description |
|------|-------------|
| `content` | Content to show |
| `product` | Products to recommend |
| `action` | Actions to suggest |
| `timing` | Best times to engage |
| `channel` | Preferred channels |
| `offer` | Special offers |

### API Routes

**File**: `src/app/api/synthex/personalisation/route.ts`

| Method | Type | Description |
|--------|------|-------------|
| GET | `stats` | Personalisation statistics |
| GET | `profile` | Get contact profile |
| GET | `events` | List tracked events |
| GET | `recommendations` | List recommendations |
| GET | `rules` | List personalization rules |
| GET | `experiments` | List A/B experiments |
| GET | `personas` | List customer personas |
| POST | `track_event` | Track new event |
| POST | `compute_profile` | Recompute profile |
| POST | `update_profile` | Update profile data |
| POST | `generate_recommendations` | Generate AI recommendations |
| POST | `update_recommendation_status` | Update recommendation status |
| POST | `create_rule` | Create personalization rule |
| POST | `create_experiment` | Create A/B experiment |
| POST | `update_experiment_status` | Start/pause/stop experiment |
| POST | `create_persona` | Create customer persona |

### UI Component

**File**: `src/app/(synthex)/synthex/personalisation/page.tsx`

Features:
- Stats overview (profiles, events, active rules, experiments)
- Rules management with priority ordering
- A/B experiment dashboard with start/pause controls
- Persona library with matching rules
- Recommendations list with filtering
- Real-time event stream view
- Profile completeness indicators

### Profile Vector Fields

| Field | Type | Description |
|-------|------|-------------|
| `engagement_score` | number | 0-1 engagement level |
| `recency_score` | number | 0-1 recent activity |
| `frequency_score` | number | 0-1 visit frequency |
| `monetary_score` | number | 0-1 spending level |
| `loyalty_score` | number | 0-1 loyalty indicator |
| `content_affinity` | object | Topic preferences |
| `channel_preferences` | string[] | Preferred channels |
| `time_preferences` | object | Active time patterns |
| `device_preferences` | string[] | Device types used |
| `interaction_style` | string | Passive/active/engaged |

---

## Integration Patterns

### Cross-Phase Data Flow

```
Contact Interaction
    │
    ▼
D23: Intent + Sentiment Analysis
    │ ──────► Intent signals trigger D24 profile updates
    │ ──────► Sentiment informs D22 reasoning context
    ▼
D22: Multi-Model Reasoning
    │ ──────► Complex analysis feeds D23 pattern refinement
    │ ──────► Reasoning chains inform D24 recommendations
    ▼
D24: Adaptive Personalisation
    │ ──────► Profile vectors used in D23 sentiment context
    │ ──────► Experiment results refine D22 model selection
    ▼
Personalized Experience
```

### AI Model Usage

All phases use `claude-sonnet-4-5-20250514` with lazy Anthropic client and 60-second circuit breaker:

```typescript
// Pattern used across all services
let anthropicClient: Anthropic | null = null;
let clientInitTime = 0;
const CLIENT_TTL_MS = 60000;

function getAnthropicClient(): Anthropic | null {
  if (anthropicClient && Date.now() - clientInitTime < CLIENT_TTL_MS) {
    return anthropicClient;
  }
  if (!process.env.ANTHROPIC_API_KEY) return null;
  anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  clientInitTime = Date.now();
  return anthropicClient;
}
```

### RLS Policies

All tables use tenant isolation with the pattern:

```sql
CREATE POLICY "tenant_isolation" ON table_name
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

---

## API Usage Examples

### D22: Execute Reasoning Chain

```typescript
// POST /api/synthex/reasoning
const response = await fetch('/api/synthex/reasoning', {
  method: 'POST',
  body: JSON.stringify({
    tenantId: 'tenant-uuid',
    action: 'run',
    chain_id: 'chain-uuid',
    input: 'Analyze this customer feedback and suggest improvements',
    variables: {
      customer_segment: 'enterprise',
      product: 'premium'
    },
    context: {
      previous_interactions: 5,
      sentiment_trend: 'positive'
    }
  })
});
```

### D23: Analyze Contact Intent

```typescript
// POST /api/synthex/contacts/intent
const response = await fetch('/api/synthex/contacts/intent', {
  method: 'POST',
  body: JSON.stringify({
    tenantId: 'tenant-uuid',
    action: 'analyze',
    contact_id: 'contact-uuid',
    content: 'I am interested in upgrading to your premium plan. What features are included?',
    content_type: 'email',
    source: 'support_ticket'
  })
});
```

### D24: Track Personalisation Event

```typescript
// POST /api/synthex/personalisation
const response = await fetch('/api/synthex/personalisation', {
  method: 'POST',
  body: JSON.stringify({
    tenantId: 'tenant-uuid',
    action: 'track_event',
    contact_id: 'contact-uuid',
    event_type: 'page_view',
    page_url: '/pricing',
    referrer_url: '/features',
    session_id: 'session-uuid',
    device_type: 'desktop',
    payload: {
      time_on_page: 45,
      scroll_depth: 80
    }
  })
});
```

### D24: Create A/B Experiment

```typescript
// POST /api/synthex/personalisation
const response = await fetch('/api/synthex/personalisation', {
  method: 'POST',
  body: JSON.stringify({
    tenantId: 'tenant-uuid',
    action: 'create_experiment',
    experiment_name: 'CTA Button Color Test',
    hypothesis: 'Green buttons will have 15% higher CTR than blue',
    variants: [
      { id: 'control', name: 'Blue Button', weight: 50, config: { color: 'blue' } },
      { id: 'variant_a', name: 'Green Button', weight: 50, config: { color: 'green' } }
    ],
    control_variant_id: 'control',
    primary_goal: 'click_through_rate',
    secondary_goals: ['conversion_rate'],
    traffic_allocation: 100
  })
});
```

---

## Performance Considerations

### Database Indexes

All tables include indexes for:
- `tenant_id` (required for RLS)
- `created_at` (for time-based queries)
- Foreign keys (for joins)
- Status/type fields (for filtering)
- Hash fields for cache lookup (D22)
- Contact ID for profile queries (D23, D24)

### Caching Strategy

- Reasoning cache with hash-based lookup (D22)
- Intent patterns cached for 30 minutes (D23)
- Profile data cached for 5 minutes (D24)
- Persona matching rules cached for 1 hour (D24)
- Experiment assignments cached per session (D24)

### Batch Operations

For bulk updates:
- Use chain execution for related reasoning tasks (D22)
- Batch intent analysis for email imports (D23)
- Process events in batches for profile computation (D24)
- Run experiments with traffic allocation controls (D24)

---

## Monitoring & Alerts

### D22 Metrics
- Total reasoning runs
- Average latency by model
- Cache hit rate
- Feedback scores by chain
- Error rate by model

### D23 Metrics
- Intent detection accuracy
- Signal resolution time
- Sentiment trend shifts
- Pattern match rate
- Response template usage

### D24 Metrics
- Profile completeness distribution
- Event volume by type
- Experiment statistical significance
- Recommendation acceptance rate
- Persona match accuracy

---

## Future Enhancements

### Planned for D25+
- Federated learning for cross-tenant insights
- Real-time streaming personalization
- Advanced experiment winner detection
- Persona clustering with ML
- Intent prediction before contact
- Multi-language sentiment analysis
- Custom model fine-tuning

---

## File Reference

| Phase | Type | Path |
|-------|------|------|
| D22 | Migration | `supabase/migrations/451_synthex_multimodel_reasoning.sql` |
| D22 | Service | `src/lib/synthex/multimodelReasoningService.ts` |
| D22 | API | `src/app/api/synthex/reasoning/route.ts` |
| D22 | Page | `src/app/(synthex)/synthex/reasoning/page.tsx` |
| D23 | Migration | `supabase/migrations/452_synthex_contact_intent_sentiment.sql` |
| D23 | Service | `src/lib/synthex/contactIntentService.ts` |
| D23 | API | `src/app/api/synthex/contacts/intent/route.ts` |
| D23 | Component | `src/components/synthex/contacts/ContactIntentPanel.tsx` |
| D24 | Migration | `supabase/migrations/453_synthex_personalisation_engine.sql` |
| D24 | Service | `src/lib/synthex/personalisationService.ts` |
| D24 | API | `src/app/api/synthex/personalisation/route.ts` |
| D24 | Page | `src/app/(synthex)/synthex/personalisation/page.tsx` |

---

**Status**: All phases complete and production-ready
