# Founder Intelligence OS - Complete System Overview

**Status**: Production-Ready
**Last Updated**: 2025-11-28
**Version**: 1.0.0

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Core Components](#core-components)
4. [Data Flow](#data-flow)
5. [HUMAN_GOVERNED Mode](#human_governed-mode)
6. [API Endpoints Summary](#api-endpoints-summary)
7. [Database Tables](#database-tables)
8. [Configuration](#configuration)
9. [Implementation Guide](#implementation-guide)

---

## Executive Summary

The **Founder Intelligence OS** is a comprehensive system designed to provide founders and business leaders with actionable intelligence, decision support, and operational oversight. It combines AI-powered analysis with human governance, ensuring that critical business decisions remain under founder control while automating routine insights and monitoring tasks.

### Key Features

- **AI Phill Assistant**: Conversational AI advisor providing personalized business insights
- **Cognitive Twin**: 13-domain health scoring and decision scenario modeling
- **Founder Ops Hub**: Task queue and approval workflow management
- **SEO Leak Engine**: Technical SEO audits and competitive intelligence
- **Multi-Channel Integration**: Social media, ads, and keyword tracking
- **Signal Inference**: Real-time business signal aggregation from 12+ sources
- **Journal Service**: Founder note-taking and context recording
- **Risk/Opportunity Detection**: Automated anomaly and opportunity identification
- **Business Registry**: Multi-business management and vault storage

---

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FOUNDER INTELLIGENCE OS                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    PRESENTATION LAYER                               │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  • Flight Deck Dashboard     • AI Phill Chat Interface              │    │
│  │  • Ops Hub Task Manager      • Cognitive Twin Digests               │    │
│  │  • Journal Editor            • Risk/Opportunity Timeline            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      ↓                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    APPLICATION LAYER                                │    │
│  ├──────────────────┬──────────────────┬──────────────────────────────┤    │
│  │                  │                  │                              │    │
│  │ AI PHILL         │ COGNITIVE TWIN   │ FOUNDER OPS                  │    │
│  │ ┌──────────────┐ │ ┌──────────────┐ │ ┌────────────────────────┐ │    │
│  │ │ • Advisor    │ │ │ • 13 Domains │ │ │ • Task Queue           │ │    │
│  │ │ • Briefing   │ │ │ • Health     │ │ │ • Approval Workflow    │ │    │
│  │ │ • Insights   │ │ │ • Digests    │ │ │ • Brand Workload       │ │    │
│  │ │ • Memory     │ │ │ • Scenarios  │ │ │ • Scheduling           │ │    │
│  │ └──────────────┘ │ └──────────────┘ │ └────────────────────────┘ │    │
│  │                  │                  │                              │    │
│  │ SEO LEAK ENGINE  │ MULTI-CHANNEL    │ SIGNAL INFERENCE             │    │
│  │ ┌──────────────┐ │ ┌──────────────┐ │ ┌────────────────────────┐ │    │
│  │ │ • Audits     │ │ │ • Social     │ │ │ • 12+ Signal Families  │ │    │
│  │ │ • Q*/P*/T*   │ │ │ • Ads        │ │ │ • Aggregation          │ │    │
│  │ │ • NavBoost   │ │ │ • Keywords   │ │ │ • Time-Series          │ │    │
│  │ │ • E-E-A-T    │ │ │ • Boost Jobs │ │ │ • Pattern Detection    │ │    │
│  │ └──────────────┘ │ └──────────────┘ │ └────────────────────────┘ │    │
│  └──────────────────┴──────────────────┴──────────────────────────────┘    │
│                                      ↓                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    SERVICE LAYER                                    │    │
│  ├──────────────────┬──────────────────┬──────────────────────────────┤    │
│  │ Journal Service  │ Business Vault   │ Business Registry             │    │
│  │ Risk/Opp Service │ Snapshot Service │ Umbrella Synopsis             │    │
│  │ Truth Adapter    │ Alert Service    │ Preference Service            │    │
│  └──────────────────┴──────────────────┴──────────────────────────────┘    │
│                                      ↓                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                  GOVERNANCE LAYER                                   │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │ • HUMAN_GOVERNED Mode           • Risk Engine                       │    │
│  │ • Founder Control Config        • Approval Engine                   │    │
│  │ • Event Log & Audit Trail       • Brand Safety Validation           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      ↓                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                  DATA LAYER                                         │    │
│  ├──────────────────┬──────────────────┬──────────────────────────────┤    │
│  │ Supabase         │ PostgreSQL       │ Redis Cache                   │    │
│  │ • Core Tables    │ • Full-Text      │ • Session State               │    │
│  │ • RLS Policies   │ • Relationships  │ • Signal Cache                │    │
│  │ • Auth           │ • Audit Logs     │ • Brief. Cache                │    │
│  └──────────────────┴──────────────────┴──────────────────────────────┘    │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Interaction Pattern

```
Founder Actions
    ↓
Flight Deck UI / Chat Interface
    ↓
Application Layer
    ├─→ AI Phill (conversation, insights, recommendations)
    ├─→ Cognitive Twin (domain analysis, health scoring)
    ├─→ Founder Ops (task queue, approvals)
    ├─→ SEO Leak Engine (technical audits)
    └─→ Multi-Channel (marketing integration)
    ↓
Service Layer (validation, business logic)
    ├─→ Risk Assessment
    ├─→ Brand Safety Checks
    └─→ Data Enrichment
    ↓
Governance Layer
    ├─→ Approval Decision (HUMAN_GOVERNED)
    ├─→ Audit Logging
    └─→ Action Execution
    ↓
Data Layer (Supabase PostgreSQL)
    ├─→ Persist Results
    ├─→ Update Signal Cache
    └─→ Archive Events
    ↓
Business Impact
```

---

## Core Components

### 1. AI Phill Assistant

**Location**: `src/lib/founderOS/aiPhillAdvisorService.ts`

**Purpose**: Conversational AI advisor that understands business context and provides personalized recommendations.

**Capabilities**:
- Multi-turn conversations with founder
- Context-aware recommendations based on journal entries
- Signal interpretation and explanation
- Decision support and scenario analysis
- Integration with Cognitive Twin for domain-specific insights

**Governance**:
- HUMAN_GOVERNED mode for sensitive recommendations
- Founder approval required for automated actions
- Full audit trail of all recommendations

**Key Methods**:
```typescript
export interface AiPhillInsight {
  id: string;
  owner_user_id: string;
  priority: InsightPriority;
  category: InsightCategory;
  title: string;
  description_md: string;
  actionable: boolean;
  confidence_score: number;
  sources: string[];
  requires_approval: boolean;
  status: InsightStatus;
}

// Generate insight from context
async function generateInsight(
  userId: string,
  context: InsightGenerationContext
): Promise<AiPhillInsight>

// Get recent insights
async function getInsights(userId: string, filters?: InsightFilters): Promise<AiPhillInsight[]>

// Update insight status
async function updateInsightStatus(insightId: string, status: InsightStatus): Promise<void>
```

---

### 2. Cognitive Twin

**Location**: `src/lib/founderOS/cognitiveTwinService.ts`

**Purpose**: Multi-domain health scoring and decision simulation engine.

**13 Cognitive Domains**:
1. **Marketing** - Campaign performance, lead quality, brand perception
2. **Sales** - Pipeline health, conversion rates, deal velocity
3. **Delivery** - Project delivery, client satisfaction, quality
4. **Product** - Feature adoption, bug trends, roadmap alignment
5. **Clients** - Retention, growth, expansion opportunities
6. **Engineering** - Technical debt, velocity, reliability
7. **Finance** - Cash flow, profitability, burn rate
8. **Founder** - Time allocation, health, decision-making capacity
9. **Operations** - Process efficiency, bottlenecks, automation gaps
10. **Team** - Hiring, retention, productivity, morale
11. **Legal** - Compliance, contracts, liability exposure
12. **Partnerships** - Strategic alignment, value exchange, growth potential
13. **Compliance** - Regulatory adherence, risk management

**Health Scoring**:
- 0-20: Critical (immediate action required)
- 21-40: Poor (address in next sprint)
- 41-60: Fair (monitor and improve)
- 61-80: Good (maintain)
- 81-100: Excellent (leverage for competitive advantage)

**Key Methods**:
```typescript
// Get health score for domain
async function scoreDomain(
  userId: string,
  businessId: string,
  domain: CognitiveDomain,
  context?: BusinessContext
): Promise<CognitiveTwinScore>

// Generate digest for period
async function generateDigest(
  userId: string,
  businessId: string,
  type: DigestType,
  options?: DigestOptions
): Promise<CognitiveTwinDigest>

// Simulate decision scenarios
async function simulateDecision(
  userId: string,
  businessId: string,
  decision: DecisionType,
  options: DecisionOption[]
): Promise<DecisionScenario[]>
```

---

### 3. Founder Ops Hub

**Location**: `src/lib/founderOps/`

**Purpose**: Operational task queue and approval workflow management.

**Core Functions**:
- Task queue management with priority and deadline tracking
- Approval workflow for sensitive operations
- Brand workload distribution
- Schedule management and calendar integration

**Task States**:
- `pending` - Ready to execute
- `in_progress` - Currently being worked
- `pending_review` - Awaiting approval
- `approved` - Founder approved
- `rejected` - Founder rejected
- `completed` - Successfully executed
- `failed` - Execution failed
- `archived` - Removed from active list

**Brand Workload System**:
```typescript
interface BrandWorkload {
  brand_id: string;
  owner_user_id: string;
  calendar_date: string;

  // Workload metrics
  total_tasks: number;
  pending_tasks: number;
  in_progress_tasks: number;
  pending_approvals: number;
  completed_today: number;

  // Capacity management
  capacity_percentage: number;
  overload_detected: boolean;
  recommended_pause: boolean;
}
```

**Key Methods**:
```typescript
// Get overview metrics
async function getOverviewMetrics(workspaceId: string): Promise<OverviewMetrics>

// Queue task for processing
async function queueTask(
  workspaceId: string,
  task: FounderOpsTask
): Promise<QueuedTask>

// Get daily queue
async function getDailyQueue(
  workspaceId: string,
  date: string
): Promise<QueueTask[]>

// Pause/Resume queue
async function pauseQueue(workspaceId: string, reason: string): Promise<void>
async function resumeQueue(workspaceId: string): Promise<void>
```

---

### 4. SEO Leak Engine

**Location**: `src/lib/seoLeakEngine/` (To be implemented)

**Purpose**: Technical SEO auditing and competitive intelligence analysis.

**Q*, P*, T* Scores Explained**:
- **Q\* Score**: Query Intelligence - How well content ranks for target queries
- **P\* Score**: Page Quality - Technical performance, Core Web Vitals, mobile optimization
- **T\* Score**: Trust & Authority - E-E-A-T signals, backlinks, domain authority

**NavBoost Analysis**:
- Click-through data from Google Search
- CTR benchmarks
- Position changes over time
- Traffic loss/gain indicators

**E-E-A-T Scoring**:
- **Expertise**: Author credentials, experience
- **Authoritativeness**: Brand reputation, mentions
- **Trustworthiness**: Security, accuracy, transparency
- **T (Topic)**: Content depth, comprehensiveness

**Gap Analysis Methodology**:
```typescript
interface CompetitorGapAnalysis {
  your_domain: string;
  competitors: string[];

  // Keyword gaps
  keyword_gaps: KeywordGap[]; // Keywords competitors rank for, you don't

  // Content gaps
  content_gaps: ContentGap[]; // Topics competitors cover, you don't

  // Backlink gaps
  backlink_gaps: BacklinkGap[]; // Referring domains to competitors

  // Opportunity scoring
  opportunities: GapOpportunity[]; // Prioritized list of gaps to address
}
```

**Audit Workflow**:
1. Submit audit request (full, technical, content, or backlinks)
2. Background job validates URL
3. Fetch audit data from DataForSEO
4. Parse and score results
5. Identify issues and opportunities
6. Generate audit report
7. Store in database for historical tracking

---

### 5. Multi-Channel Integration

**Location**: `src/app/api/multi-channel/`

**Supported Channels**:
- **Social Media**: YouTube, LinkedIn, Facebook, Instagram, TikTok, X, Reddit, Pinterest
- **Ads**: Google Ads, Meta Ads, LinkedIn Ads
- **Keywords**: Keyword rankings, search volume, competitor keywords

**Social Inbox Features**:
- Centralized view of messages across platforms
- Sentiment analysis per message
- Auto-categorization (inquiry, support, feedback)
- Response templates and automation

**Ads Account Connection**:
- OAuth integration with ad platforms
- Campaign performance aggregation
- Budget tracking across platforms
- ROI calculation per channel

**Keyword Tracking**:
- Monitor keyword rankings
- Compare with competitor benchmarks
- Track search volume changes
- SERP feature tracking

**Boost Jobs**:
- Automated content promotion across channels
- Approval workflow (HUMAN_GOVERNED mode)
- Performance tracking post-boost
- A/B test scheduling

---

### 6. Signal Inference Engine

**Location**: `src/lib/founderOS/founderSignalInferenceService.ts`

**12+ Signal Families**:
1. **Revenue Signals** - MRR, ARR, growth rate
2. **Customer Signals** - Churn, NPS, retention
3. **Engagement Signals** - MAU, DAU, session time
4. **Quality Signals** - Bug rate, tech debt, test coverage
5. **Team Signals** - Headcount, turnover, productivity
6. **Market Signals** - Competitor activity, trends
7. **Product Signals** - Feature adoption, usage patterns
8. **Financial Signals** - Burn rate, runway, profitability
9. **Operational Signals** - Process efficiency, cycle time
10. **Risk Signals** - Compliance, security, vendor health
11. **Partnership Signals** - Integration health, growth
12. **Founder Signals** - Decision-making pace, focus time

**Aggregation Process**:
```typescript
interface BusinessSignal {
  id: string;
  founder_business_id: string;
  signal_family: SignalFamily;
  metric_name: string;
  metric_value: number;
  previous_value: number | null;

  // Trend and anomaly detection
  trend: 'up' | 'down' | 'stable';
  velocity: number; // Rate of change
  anomaly_detected: boolean;
  anomaly_severity: 'low' | 'medium' | 'high';

  // Confidence and sourcing
  confidence_score: number; // 0-100
  data_sources: string[];
  recorded_at: string;
  valid_until: string; // TTL for signals
}

// Record new signal
async function recordSignal(input: RecordSignalInput): Promise<BusinessSignal>

// Get aggregated signals
async function getSignals(
  businessId: string,
  familyFilter?: SignalFamily[]
): Promise<AggregationResult>

// Detect anomalies
async function detectAnomalies(businessId: string): Promise<AnomalyAlert[]>
```

---

### 7. Journal Service

**Location**: `src/lib/founderOS/founderJournalService.ts`

**Purpose**: Founder note-taking with AI context embedding.

**Features**:
- Markdown-based entry format
- Tagging system for organization
- Related business linking
- Full-text search across entries
- AI context extraction (decisions, promises, opportunities)

**Best Practices**:
1. Date entries for timeline analysis
2. Use consistent tags for filtering
3. Reference business when relevant
4. Record decisions and their rationale
5. Note external factors (market, competition)
6. Capture lessons learned

**Key Methods**:
```typescript
// Create new entry
async function createEntry(
  ownerUserId: string,
  data: CreateJournalEntryInput
): Promise<JournalEntry>

// Query with filters
async function getEntries(
  ownerUserId: string,
  filters: JournalFilters
): Promise<JournalEntry[]>

// Extract AI-readable context
async function getEntriesForContext(
  ownerUserId: string,
  businessId?: string,
  limit?: number
): Promise<JournalEntry[]>
```

---

### 8. Risk & Opportunity Detection

**Location**: `src/lib/founderOS/founderRiskOpportunityService.ts`

**Risk Levels**:
- **Critical** (0-20): Immediate execution required, existential threat
- **High** (21-40): Should address in current sprint
- **Medium** (41-60): Plan for next planning cycle
- **Low** (61-80): Monitor and optimize

**Opportunity Impact Levels**:
- **High**: 50%+ revenue impact, strategic importance
- **Medium**: 10-50% revenue impact, tactical importance
- **Low**: <10% revenue impact, incremental improvement

**Detection Sources**:
- Signal anomalies (statistical outliers)
- Cognitive Twin domain changes
- Competitor activity
- Market trend changes
- Manual founder journal entries

**Key Methods**:
```typescript
// Analyze for risks
async function analyzeRisks(
  businessId: string,
  context?: BusinessContext
): Promise<RiskAnalysisResult>

// Identify opportunities
async function identifyOpportunities(
  businessId: string,
  domains?: CognitiveDomain[]
): Promise<OpportunityAnalysisResult>

// Calculate health score
async function calculateHealthScore(businessId: string): Promise<BusinessHealthScore>
```

---

### 9. Business Registry

**Location**: `src/lib/founderOS/founderBusinessRegistryService.ts`

**Purpose**: Multi-business management and metadata storage.

**Business Entity**:
```typescript
export interface FounderBusiness {
  id: string;
  owner_user_id: string;
  name: string;
  description: string | null;
  website: string | null;
  industry: string | null;
  status: BusinessStatus; // active, inactive, archived

  // Configuration
  timezone: string;
  currency: string;
  founding_date: string | null;

  // Metadata
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
```

**Key Methods**:
```typescript
// Create business
async function createBusiness(
  ownerUserId: string,
  data: CreateBusinessInput
): Promise<FounderBusiness>

// List user's businesses
async function listBusinesses(ownerUserId: string): Promise<FounderBusiness[]>

// Get specific business
async function getBusiness(businessId: string): Promise<FounderBusiness>

// Update business
async function updateBusiness(
  businessId: string,
  data: UpdateBusinessInput
): Promise<FounderBusiness>

// Archive business
async function archiveBusiness(businessId: string): Promise<void>
```

---

### 10. Business Vault

**Location**: `src/lib/founderOS/founderBusinessVaultService.ts`

**Purpose**: Encrypted storage for sensitive business credentials and secrets.

**Secret Types**:
- `api_key` - Third-party API keys
- `oauth_token` - OAuth credentials
- `database_connection` - Database credentials
- `financial_account` - Bank/accounting service access
- `private_key` - Cryptographic keys
- `config` - Sensitive configuration values

**Security**:
- Encryption at rest (Supabase encryption)
- Access control per secret
- Audit logging of access
- Rotation tracking

**Key Methods**:
```typescript
// Add secret
async function addSecret(
  businessId: string,
  data: AddSecretInput
): Promise<VaultSecret>

// Get secret (with audit logging)
async function getSecret(secretId: string): Promise<string>

// List secret metadata (not values)
async function listSecrets(businessId: string): Promise<SecretMetadata[]>

// Rotate secret
async function rotateSecret(secretId: string): Promise<void>
```

---

## Data Flow

### User Journey: AI Phill Insight Generation

```
1. Founder opens Flight Deck Dashboard
   ↓
2. AI Phill Assistant loads recent context
   - Recent journal entries (last 7 days)
   - Latest business signals
   - Open risks and opportunities
   - Cognitive Twin health scores
   ↓
3. AI Phill generates insights based on:
   - Signal anomalies (statistical detection)
   - Founder journal context
   - Competitor activity
   - Industry trends
   ↓
4. Risk Assessment Layer evaluates each insight:
   - Does it require approval? (HUMAN_GOVERNED config)
   - What's the confidence level?
   - What brand safety concerns exist?
   ↓
5. Approval Decision:
   - Low risk (auto-approve) → Display immediately
   - Medium risk (content review) → Display with review tag
   - High/Critical risk → Require founder approval
   ↓
6. Founder Reviews Insight:
   - Accept: Insight actioned, founder provided context
   - Reject: Insight dismissed, feedback logged
   - Modify: Founder changes parameters, regenerate
   ↓
7. Action Execution:
   - Log to audit trail
   - Update AI Phill memory
   - Queue related tasks if needed
   - Update related signals
   ↓
8. Feedback Loop:
   - Monitor outcome of recommended action
   - Update AI Phill confidence scores
   - Refine future recommendations
```

### Data Flow: Cognitive Twin Domain Scoring

```
1. Scheduled job triggered (hourly/daily)
   ↓
2. For each business and domain:
   - Collect relevant signals
   - Fetch journal entries for context
   - Get recent alerts and opportunities
   ↓
3. AI Phill analyzes domain state:
   - Interpret signal trends
   - Compare to historical baselines
   - Identify key drivers of momentum
   ↓
4. Generate domain score:
   - Overall health (0-100)
   - Momentum (trend + velocity)
   - Identified risks (3-5 per domain)
   - Identified opportunities (2-3 per domain)
   ↓
5. Create digest (if scheduled):
   - Summarize all 13 domains
   - Highlight changes from last digest
   - Recommend 3-5 action items
   ↓
6. Founder receives digest:
   - Email notification (if configured)
   - Appear in Flight Deck dashboard
   - Can drill down to domain details
   ↓
7. Founder can:
   - Acknowledge insights
   - Request decision simulation
   - Schedule action items to task queue
   - Update journal with response
```

### Data Flow: Task Approval Workflow

```
1. System identifies task that requires approval:
   - Public claim
   - Brand position change
   - High-risk automation
   - External communication
   - Financial estimate
   ↓
2. Task queued to Founder Ops:
   - status: pending_review
   - assigned_to: founder
   - deadline: auto-calculated
   - risk_level: assessed
   - details: full context provided
   ↓
3. Founder notified:
   - Push notification
   - Email (if enabled)
   - Appears in task queue
   ↓
4. Founder reviews task:
   - Brand safety checks passed?
   - Risk level acceptable?
   - Does it align with strategy?
   ↓
5. Founder decision:
   - Approve: status → approved, execute immediately
   - Reject: status → rejected, provide feedback
   - Modify: adjust parameters, re-assess risk
   ↓
6. Post-decision:
   - Log decision to audit trail
   - Execute approved action
   - Send confirmation
   - Monitor outcome
   ↓
7. Feedback loop:
   - Was outcome as expected?
   - Update risk scoring for similar tasks
   - Improve recommendation engine
```

---

## HUMAN_GOVERNED Mode

### Definition

HUMAN_GOVERNED mode is a governance framework that ensures **founder approval is required for sensitive actions** while allowing routine operations to execute automatically. It's a middle ground between fully autonomous AI and requiring human approval for everything.

### Configuration

**Location**: `src/lib/founder/founderControlConfig.ts`

```typescript
export const founderControlConfig = {
  // Feature flags
  enableTruthLayer: true,              // Verify claims before publishing
  enableRiskScoring: true,              // Assess risk of each action
  enableBrandSafetyValidation: true,    // Check brand alignment
  enableAgentApproval: true,            // Require founder approval
  enableExecutionLogging: true,         // Audit all actions

  // Actions requiring manual override
  manualOverrideRequiredFor: [
    'public_claims',           // Any public statement (financial, health, legal)
    'brand_position_changes',  // Changes to mission, promise, positioning
    'high_risk_automation',    // Automation affecting brand perception
    'external_communications', // Communications sent outside company
    'financial_estimates',     // Revenue, savings, or outcome predictions
  ],

  // Risk thresholds
  riskThresholds: {
    low: 0,
    medium: 20,
    high: 40,
    critical: 70,
  },

  // Auto-approval rules by risk level
  autoApprovalRules: {
    low: true,                    // Auto-approve
    medium: 'content_review',     // Require content review only
    high: false,                  // Require founder approval
    critical: false,              // Always require founder approval
  },

  // Audit logging configuration
  auditConfig: {
    enableAll: true,
    logEventTypes: [
      'agent_action',
      'approval_decision',
      'risk_assessment',
      'override_decision',
      'brand_change',
      'campaign_launch',
      'system_health_check',
    ],
    retentionDays: 365,
  },

  // Brand safety constraints
  brandSafety: {
    enforceMissionConsistency: true,    // Check against mission statement
    enforceRiskFlags: true,              // Check against founder risk flags
    enforceAudienceAlignment: true,      // Check audience is appropriate
    enforceToneConsistency: true,        // Check tone matches brand
  },
};
```

### Approval Workflow

```
Action Triggered
    ↓
Risk Assessment
    ├─→ Low Risk (0-20)
    │   └─→ Auto-approve, execute immediately
    │
    ├─→ Medium Risk (20-40)
    │   ├─→ Require content review only
    │   └─→ Execute if content review passes
    │
    └─→ High/Critical Risk (40+)
        ├─→ Queue to Founder Ops
        ├─→ Notify founder
        ├─→ Wait for approval
        └─→ Execute or reject based on decision

Post-Execution
    ├─→ Log to audit trail
    ├─→ Monitor outcome
    ├─→ Update risk scores
    └─→ Refine recommendations
```

### Brand Safety Validation

Before any public-facing action, system validates:

1. **Mission Consistency**: Does action align with stated mission?
2. **Risk Flags**: Does founder have risk concerns in this area?
3. **Audience Alignment**: Is audience appropriate for action?
4. **Tone Consistency**: Does tone match brand voice?

**Validation Result**:
```typescript
interface BrandSafetyValidation {
  passed: boolean;
  mission_consistent: boolean;
  risk_flags_clear: boolean;
  audience_aligned: boolean;
  tone_consistent: boolean;
  concerns: string[];
  requires_override: boolean;
}
```

### Audit Trail

Every action in HUMAN_GOVERNED mode is logged:

```typescript
interface FounderEventLog {
  id: string;
  owner_user_id: string;
  event_type: AuditEventType;
  action: string;
  risk_level: RiskLevel;
  approval_status: 'auto_approved' | 'approved' | 'rejected' | 'overridden';

  // Context
  context: Record<string, unknown>;
  details: string;

  // Traceability
  created_at: string;
  approved_by: string | null;
  approval_timestamp: string | null;
  execution_timestamp: string | null;

  // Outcome
  execution_status: 'pending' | 'executed' | 'failed' | 'cancelled';
  outcome_notes: string | null;
}
```

---

## API Endpoints Summary

### AI Phill Assistant Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/founder/assistant` | GET | Get all assistant data (briefing, memory, emails, etc.) |
| `/api/founder/assistant?action=briefing` | GET | Get latest briefing |
| `/api/founder/assistant?action=memory` | GET | Get memory nodes |
| `/api/founder/assistant?action=search&query=X` | GET | Search assistant memory |
| `/api/founder/assistant?action=emails` | GET | Get email summary and urgent emails |
| `/api/founder/assistant?action=staff` | GET | Get team overview |
| `/api/founder/assistant?action=financials` | GET | Get financial summary |

### Founder Ops Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/founder/ops/overview` | GET | Task queue metrics |
| `/api/founder/ops/queue/daily` | GET | Daily queue for date |
| `/api/founder/ops/queue/weekly` | GET | Weekly queue view |
| `/api/founder/ops/queue/pause` | POST | Pause queue processing |
| `/api/founder/ops/queue/resume` | POST | Resume queue processing |
| `/api/founder/ops/tasks` | GET, POST | List and create tasks |
| `/api/founder/ops/tasks/[id]` | GET, PUT, DELETE | Task CRUD operations |
| `/api/founder/ops/brand-workload` | GET | Brand capacity metrics |

### Cognitive Twin Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/founder/memory/snapshot` | GET, POST | Business snapshots |
| `/api/founder/memory/momentum` | GET | Momentum indicators |
| `/api/founder/memory/opportunities` | GET | Identified opportunities |
| `/api/founder/memory/risks` | GET | Identified risks |
| `/api/founder/memory/patterns` | GET | Pattern detection |
| `/api/founder/memory/weekly-digest` | GET | Weekly digest |
| `/api/founder/memory/decision-scenarios` | GET, POST | Decision simulation |
| `/api/founder/memory/forecast` | GET | Predictive forecasts |

### SEO Leak Engine Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/seo-leak/audit` | GET, POST | SEO audits |
| `/api/seo-leak/signals` | GET, POST | Leak signal profiles |
| `/api/seo-leak/gap-analysis` | GET | Competitor gap analysis |
| `/api/seo-leak/eeat` | GET | E-E-A-T scoring |

### Multi-Channel Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/multi-channel/social-inbox` | GET | Social media messages |
| `/api/multi-channel/ads` | GET | Ad account data |
| `/api/multi-channel/keywords` | GET | Keyword rankings |
| `/api/multi-channel/boost-jobs` | GET, POST | Content boost scheduling |

---

## Database Tables

### Core Founder OS Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `founder_businesses` | Business registry | id, owner_user_id, name, status |
| `ai_phill_journal_entries` | Founder journal | id, owner_user_id, body_md, tags |
| `cognitive_twin_scores` | Domain health | domain, health_score, risks, opportunities |
| `founder_signals` | Signal records | signal_family, metric_value, trend, anomaly_detected |
| `founder_risks` | Risk tracking | risk_severity, status, mitigation |
| `founder_opportunities` | Opportunity tracking | impact, effort, status |
| `founder_ops_tasks` | Task queue | status, deadline, priority, risk_level |
| `founder_ops_queue` | Daily queue | queue_date, status |
| `founder_event_log` | Audit trail | event_type, action, approval_status |
| `founder_insights` | AI Phill insights | priority, category, requires_approval |

### Signal & Intelligence Tables

| Table | Purpose |
|-------|---------|
| `business_signals` | Time-series signal data |
| `signal_aggregations` | Pre-computed aggregates |
| `anomaly_alerts` | Detected anomalies |
| `founder_snapshots` | Business state snapshots |
| `founder_briefings` | Generated briefings |

### Integration Tables

| Table | Purpose |
|-------|---------|
| `seo_leak_audit_jobs` | SEO audit queue |
| `seo_leak_signals` | Signal profiles |
| `multi_channel_accounts` | Connected platforms |
| `keyword_rankings` | Keyword tracking |

---

## Configuration

### Environment Variables

```env
# Founder OS Configuration
FOUNDER_OS_ENABLED=true
FOUNDER_OS_GOVERNANCE_MODE=HUMAN_GOVERNED
FOUNDER_OS_DEFAULT_REGION=AU
FOUNDER_OS_MAX_BUSINESSES=50
FOUNDER_OS_SNAPSHOT_RETENTION_DAYS=90
FOUNDER_OS_SIGNAL_AGGREGATION_INTERVAL_HOURS=6
FOUNDER_OS_CROSS_BUSINESS_INSIGHTS_ENABLED=true
FOUNDER_OS_EMERGENCY_PROTOCOLS_ENABLED=true
FOUNDER_OS_MAX_CONCURRENT_JOBS=20

# AI Configuration
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL_ID=claude-opus-4-5-20251101

# Integrations (SEO Leak Engine)
DATAFORSEO_API_KEY=your-key
SEMRUSH_API_KEY=your-key

# Multi-Channel
GOOGLE_ADS_API_KEY=your-key
META_ADS_API_KEY=your-key
LINKEDIN_API_KEY=your-key
```

### Runtime Configuration Validation

```typescript
// Validate configuration at startup
import { validateFounderOSConfig, getFounderOSConfig } from '@/config/founderOS.config';

const { valid, errors } = validateFounderOSConfig();
if (!valid) {
  console.error('Configuration errors:', errors);
  process.exit(1);
}

// Get configuration values
const mode = getFounderOSConfig('FOUNDER_OS_GOVERNANCE_MODE');
const region = getFounderOSConfig('FOUNDER_OS_DEFAULT_REGION');
```

---

## Implementation Guide

### 1. Setup Founder Business

```typescript
import { createBusiness } from '@/lib/founderOS/founderBusinessRegistryService';

const business = await createBusiness(userId, {
  name: 'Acme Corp',
  description: 'Leading provider of widgets',
  website: 'https://acme.com',
  industry: 'Manufacturing',
  timezone: 'Australia/Sydney',
  currency: 'AUD',
});
```

### 2. Record First Journal Entry

```typescript
import { createEntry } from '@/lib/founderOS/founderJournalService';

const entry = await createEntry(userId, {
  title: 'Q4 Planning Session',
  body: '# Q4 Planning\n\nDecided to focus on...',
  tags: ['planning', 'strategy', 'q4'],
  businessId: business.id,
});
```

### 3. Record Initial Signals

```typescript
import { recordSignal } from '@/lib/founderOS/founderSignalInferenceService';

await recordSignal({
  founder_business_id: business.id,
  signal_family: 'revenue_signals',
  metric_name: 'Monthly Recurring Revenue',
  metric_value: 50000,
  previous_value: 45000,
  confidence_score: 95,
  data_sources: ['Stripe export'],
});
```

### 4. Generate First Digest

```typescript
import { generateDigest } from '@/lib/founderOS/cognitiveTwinService';

const digest = await generateDigest(userId, business.id, 'weekly', {
  include_opportunities: true,
  include_risks: true,
  include_recommendations: true,
});
```

### 5. Queue First Task

```typescript
import { queueTask } from '@/lib/founderOps/founderOpsEngine';

const task = await queueTask(workspaceId, {
  title: 'Review Q4 Budget',
  description: 'Review and approve quarterly budget allocation',
  priority: 'high',
  deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  requires_approval: true,
  brand_workload: 'marketing',
});
```

### 6. Enable AI Phill Insights

```typescript
import { generateInsight } from '@/lib/founderOS/aiPhillAdvisorService';

const insight = await generateInsight(userId, {
  context_type: 'signal_anomaly',
  signal_family: 'revenue_signals',
  business_id: business.id,
  recent_entries: true,
  include_recommendations: true,
});
```

---

## Monitoring & Maintenance

### Health Checks

```typescript
import { validateFounderOSConfig } from '@/config/founderOS.config';
import { healthCheck } from '@/lib/founderOS/healthCheckService';

// On startup
const configValid = validateFounderOSConfig();

// Periodic health monitoring
const health = await healthCheck({
  checkDatabase: true,
  checkCache: true,
  checkWorkers: true,
  checkExternalAPIs: true,
});

if (!health.healthy) {
  console.error('Founder OS health check failed:', health.issues);
}
```

### Performance Metrics

```typescript
import { getMetrics } from '@/lib/founderOS/metricsService';

const metrics = await getMetrics({
  period: 'last_24h',
  include_operations: true,
  include_errors: true,
  include_latencies: true,
});

// Check key metrics
console.log('API Response Time (p95):', metrics.api_latency.p95);
console.log('Task Processing Rate:', metrics.tasks_processed_per_hour);
console.log('Error Rate:', metrics.error_rate_percentage);
```

---

## Troubleshooting

### Common Issues

**Issue**: AI Phill not generating insights
- Check founder has journal entries
- Verify business has recorded signals
- Ensure ANTHROPIC_API_KEY is configured
- Check Anthropic API quota

**Issue**: Tasks stuck in pending_review
- Check founder has unread task notifications
- Verify workspaceId is correct
- Check deadline hasn't been missed

**Issue**: Signal anomalies not detected
- Verify at least 2 data points recorded
- Check signal_family is valid
- Ensure timestamps are recent

**Issue**: Cognitive Twin scores not updating
- Verify scheduled job is running
- Check all domains have signals
- Ensure journal entries exist for context

---

## Next Steps

1. **Deploy**: Use environment variables to configure Founder OS
2. **Monitor**: Set up alerts for health check failures
3. **Iterate**: Gather founder feedback and refine governance rules
4. **Expand**: Add more signal sources and integrations
5. **Optimize**: Tune AI models based on decision outcomes

---

**Status**: Production-Ready
**Last Updated**: 2025-11-28
**Next Review**: 2025-12-28
