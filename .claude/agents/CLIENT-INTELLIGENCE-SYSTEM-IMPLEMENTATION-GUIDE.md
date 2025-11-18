# CLIENT INTELLIGENCE SYSTEM - IMPLEMENTATION GUIDE

**System Version**: 1.0.0
**Last Updated**: 2025-11-18
**Status**: Ready for Implementation
**Estimated Timeline**: 8-12 weeks

---

## 📋 TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: Database Setup (Week 1)](#phase-1-database-setup)
4. [Phase 2: Tier 1 - Input Processing (Weeks 2-3)](#phase-2-tier-1-input-processing)
5. [Phase 3: Tier 2 - Knowledge Structuring (Week 4)](#phase-3-tier-2-knowledge-structuring)
6. [Phase 4: Tier 3 - Questionnaires & Strategy (Weeks 5-6)](#phase-4-tier-3-questionnaires--strategy)
7. [Phase 5: Tier 4 - Autonomous Execution (Weeks 7-9)](#phase-5-tier-4-autonomous-execution)
8. [Phase 6: Tier 5 - Continuous Learning (Week 10)](#phase-6-tier-5-continuous-learning)
9. [Phase 7: Testing & Optimization (Weeks 11-12)](#phase-7-testing--optimization)
10. [Production Deployment Checklist](#production-deployment-checklist)
11. [Cost Analysis](#cost-analysis)
12. [Troubleshooting](#troubleshooting)

---

## 1. SYSTEM OVERVIEW

### What This System Does

The Client Intelligence System transforms **4 months of Duncan's email history** and **client call recordings** into:

1. **Structured Intelligence**: Ideas, goals, pain points, requirements extracted via Claude AI
2. **Visual Mindmaps**: Interactive knowledge graphs showing relationships
3. **Gap Analysis**: Identifies missing critical information (budget, timeline, etc.)
4. **Smart Questionnaires**: Generates contextual questions referencing specific client mentions
5. **Marketing Strategies**: Comprehensive 90-day plans with personas, content pillars, KPIs
6. **Content Generation**: Blog posts, emails, social media posts, case studies
7. **Content Calendars**: 90-day schedules optimized for Australian audiences
8. **Continuous Updates**: Real-time monitoring and incremental intelligence updates

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   TIER 5: Continuous Learning                │
│              Continuous Intelligence Update Agent            │
│         (Monitors new emails/media every 5 minutes)          │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────────────────────────────────────┐
│              TIER 4: Autonomous Execution                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Task         │  │ AI Content   │  │ Content      │      │
│  │ Orchestrator │  │ Generator    │  │ Calendar     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────────────────────────────────────┐
│           TIER 3: Questionnaires & Strategy                  │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Questionnaire    │  │ Marketing        │                │
│  │ Generator        │  │ Strategy Gen     │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────────────────────────────────────┐
│            TIER 2: Knowledge Structuring                     │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Mindmap Auto     │  │ Knowledge Gap    │                │
│  │ Generation       │  │ Analysis         │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────────────────────────────────────┐
│              TIER 1: Input Processing                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Email        │  │ Media        │  │ AI           │      │
│  │ Integration  │  │ Transcription│  │ Intelligence │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │
                    ┌─────────┴─────────┐
                    │                   │
            Gmail/Outlook API    Call Recordings
```

---

## 2. PREREQUISITES

### Required Services & API Keys

- [x] **Supabase Account**: Database hosting
- [x] **Anthropic API Key**: Claude AI ($50 initial credit recommended)
- [x] **OpenAI API Key**: Whisper transcription ($10 initial credit)
- [x] **Google Cloud Project**: Gmail API access
- [x] **Microsoft Azure** (optional): Outlook API access
- [x] **AssemblyAI API Key** (optional): Backup transcription service

### Development Environment

- [x] **Node.js**: v18+ (Next.js 16 requirement)
- [x] **npm/pnpm**: Package manager
- [x] **Git**: Version control
- [x] **VS Code**: Recommended IDE
- [x] **Supabase CLI** (optional): Local development

### Domain Knowledge Required

- [x] **TypeScript**: Intermediate level
- [x] **Next.js 16**: App Router, API Routes, Server Components
- [x] **PostgreSQL**: Basic SQL, JSONB queries
- [x] **Claude API**: Message creation, Extended Thinking
- [x] **OAuth 2.0**: Gmail/Outlook authentication flows

---

## 3. PHASE 1: DATABASE SETUP (Week 1)

### Day 1: Run Core Migration

**File**: `supabase/migrations/039_autonomous_intelligence_system_v3.sql`

**Steps**:
1. Open Supabase Dashboard → SQL Editor
2. Copy entire migration file
3. Execute SQL
4. Verify output: "✨ SUCCESS: Autonomous Intelligence System ready!"

**Expected Result**: 7 new tables created
- `email_intelligence`
- `dynamic_questionnaires`
- `questionnaire_responses`
- `autonomous_tasks`
- `marketing_strategies`
- `knowledge_graph_nodes`
- `knowledge_graph_edges`

**Verification Query**:
```sql
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'email_intelligence',
  'dynamic_questionnaires',
  'questionnaire_responses',
  'autonomous_tasks',
  'marketing_strategies',
  'knowledge_graph_nodes',
  'knowledge_graph_edges'
);
-- Expected: 7
```

---

### Day 2: Add Missing Columns

**File**: Create `supabase/migrations/040_add_intelligence_tracking.sql`

```sql
-- Add intelligence_analyzed tracking to client_emails
ALTER TABLE client_emails
ADD COLUMN IF NOT EXISTS intelligence_analyzed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS analyzed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_client_emails_intelligence_analyzed
ON client_emails(intelligence_analyzed);

-- Add intelligence_analyzed tracking to media_files
ALTER TABLE media_files
ADD COLUMN IF NOT EXISTS intelligence_analyzed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS analyzed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_media_files_intelligence_analyzed
ON media_files(intelligence_analyzed);

-- Verify
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 040 Complete!';
  RAISE NOTICE 'Added intelligence_analyzed columns to client_emails and media_files';
END $$;
```

**Execute**: Run in Supabase SQL Editor

---

### Day 3: Update Existing Tables

**File**: Create `supabase/migrations/041_extend_generated_content.sql`

```sql
-- Extend generated_content.content_type to include new types
ALTER TABLE generated_content DROP CONSTRAINT IF EXISTS generated_content_content_type_check;

ALTER TABLE generated_content
ADD CONSTRAINT generated_content_content_type_check
CHECK (content_type IN (
  'followup', 'proposal', 'case_study',
  'blog_post', 'email', 'social_post', 'other'
));

-- Add new columns to marketing_strategies
ALTER TABLE marketing_strategies
ADD COLUMN IF NOT EXISTS full_strategy JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS brand_positioning JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS budget_allocation JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS kpis JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS risks JSONB DEFAULT '[]';

-- Verify
SELECT
  'generated_content' as table_name,
  COUNT(*) as constraint_count
FROM pg_constraint
WHERE conname = 'generated_content_content_type_check'
UNION ALL
SELECT
  'marketing_strategies' as table_name,
  COUNT(*) as columns_added
FROM information_schema.columns
WHERE table_name = 'marketing_strategies'
AND column_name IN ('full_strategy', 'brand_positioning', 'budget_allocation', 'kpis', 'risks');
```

**Execute**: Run in Supabase SQL Editor

---

### Day 4: Set Up RLS Policies

**Verify RLS is enabled**:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'email_intelligence',
  'dynamic_questionnaires',
  'autonomous_tasks',
  'marketing_strategies'
);
-- All should show rowsecurity = true
```

**Test RLS isolation**:
```sql
-- As a test user
SET ROLE authenticated;
SET request.jwt.claims.sub TO 'test-user-uuid';

-- This should return 0 rows (no workspace access)
SELECT COUNT(*) FROM email_intelligence;

-- Reset
RESET ROLE;
```

---

### Day 5: Database Performance Optimization

**Add Missing Indexes** (if not in migration 039):

```sql
-- High-frequency query indexes
CREATE INDEX IF NOT EXISTS idx_email_intel_contact_analyzed
ON email_intelligence(contact_id, analyzed_at DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_workspace_status_priority
ON autonomous_tasks(workspace_id, status, priority DESC);

CREATE INDEX IF NOT EXISTS idx_calendar_posts_scheduled
ON calendar_posts(workspace_id, scheduled_date, status);

-- JSONB indexes for intelligent querying
CREATE INDEX IF NOT EXISTS idx_email_intel_ideas
ON email_intelligence USING GIN (ideas);

CREATE INDEX IF NOT EXISTS idx_email_intel_goals
ON email_intelligence USING GIN (business_goals);

-- Verify index count
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename LIKE '%intelligence%'
OR tablename LIKE '%questionnaire%'
OR tablename LIKE '%task%'
ORDER BY tablename, indexname;
```

---

## 4. PHASE 2: TIER 1 - INPUT PROCESSING (Weeks 2-3)

### Week 2: Email Integration Agent

**Agent Spec**: `EMAIL-INTEGRATION-AGENT.md`

**Day 1-2: Gmail OAuth Setup**

1. **Create Google Cloud Project**:
   - Go to https://console.cloud.google.com
   - Create project: "Unite-Hub-Email-Integration"
   - Enable Gmail API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `http://localhost:3008/api/integrations/gmail/callback`

2. **Environment Variables** (`.env.local`):
   ```env
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_CALLBACK_URL=http://localhost:3008/api/integrations/gmail/callback
   ```

3. **Create API Route**: `src/app/api/integrations/gmail/connect/route.ts`
   ```typescript
   import { NextRequest, NextResponse } from 'next/server';
   import { google } from 'googleapis';

   export async function GET(req: NextRequest) {
     const oauth2Client = new google.auth.OAuth2(
       process.env.GOOGLE_CLIENT_ID,
       process.env.GOOGLE_CLIENT_SECRET,
       process.env.GOOGLE_CALLBACK_URL
     );

     const authUrl = oauth2Client.generateAuthUrl({
       access_type: 'offline',
       scope: [
         'https://www.googleapis.com/auth/gmail.readonly',
         'https://www.googleapis.com/auth/gmail.metadata',
       ],
     });

     return NextResponse.redirect(authUrl);
   }
   ```

4. **Create Callback Route**: `src/app/api/integrations/gmail/callback/route.ts`
   ```typescript
   // See EMAIL-INTEGRATION-AGENT.md for complete implementation
   ```

**Day 3-4: Email Fetching**

1. **Create Email Fetch Function**: `src/lib/agents/email-integration.ts`
   ```typescript
   import { gmail_v1 } from 'googleapis';

   export async function fetchAllEmails(
     integrationId: string,
     workspaceId: string
   ): Promise<FetchEmailsResult> {
     // See EMAIL-INTEGRATION-AGENT.md for complete implementation
     // Key points:
     // - Use gmail.users.messages.list() with pageToken for pagination
     // - Store provider_message_id to prevent duplicates
     // - Download attachments to Supabase Storage
     // - Extract sender email and link to contacts table
   }
   ```

2. **Create API Endpoint**: `src/app/api/integrations/gmail/fetch/route.ts`

**Day 5: Testing**

```bash
# Test OAuth flow
curl http://localhost:3008/api/integrations/gmail/connect

# Test email fetching
curl -X POST http://localhost:3008/api/integrations/gmail/fetch \
  -H "Content-Type: application/json" \
  -d '{"integration_id": "uuid", "workspace_id": "uuid"}'
```

---

### Week 3: Media Transcription Agent + AI Intelligence Extraction Agent

**Agent Specs**:
- `MEDIA-TRANSCRIPTION-AGENT.md`
- `AI-INTELLIGENCE-EXTRACTION-AGENT.md`

**Day 1-2: Media Transcription Setup**

1. **Get OpenAI API Key**: https://platform.openai.com/api-keys

2. **Environment Variable**:
   ```env
   OPENAI_API_KEY=sk-your-key-here
   ```

3. **Install Dependencies**:
   ```bash
   npm install openai@4.x
   npm install assemblyai@4.x  # Optional: backup service
   ```

4. **Create Transcription Function**: `src/lib/agents/media-transcription.ts`
   ```typescript
   import OpenAI from 'openai';

   export async function transcribeVideo(
     mediaId: string,
     workspaceId: string
   ): Promise<TranscribeResult> {
     const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

     // Download file from Supabase Storage
     const fileBuffer = await downloadMediaFile(mediaId);

     // Transcribe using Whisper
     const transcription = await openai.audio.transcriptions.create({
       file: fileBuffer,
       model: 'whisper-1',
       language: 'en',
       response_format: 'verbose_json',
       timestamp_granularities: ['segment'],
     });

     // Store transcript in media_files.transcript
     await supabase
       .from('media_files')
       .update({
         transcript: {
           segments: transcription.segments,
           full_text: transcription.text,
           language: transcription.language,
           provider: 'whisper',
         },
         status: 'completed',
       })
       .eq('id', mediaId);

     return { success: true, transcript: transcription };
   }
   ```

5. **Create API Endpoint**: `src/app/api/agents/transcribe/route.ts`

**Day 3-4: AI Intelligence Extraction**

1. **Create Extraction Function**: `src/lib/agents/ai-intelligence.ts`
   ```typescript
   import Anthropic from '@anthropic-ai/sdk';

   export async function analyzeEmailContent(
     emailId: string,
     contactId: string,
     workspaceId: string
   ): Promise<AnalyzeResult> {
     const anthropic = new Anthropic({
       apiKey: process.env.ANTHROPIC_API_KEY,
     });

     // Fetch email
     const { data: email } = await supabase
       .from('client_emails')
       .select('subject, body_text')
       .eq('id', emailId)
       .single();

     // Build Claude prompt
     const prompt = `Analyze this email from a potential client...

     EMAIL SUBJECT: ${email.subject}
     EMAIL BODY: ${email.body_text}

     EXTRACT:
     1. BUSINESS IDEAS - What products/services are mentioned?
     2. BUSINESS GOALS - What outcomes does the client want?
     3. PAIN POINTS - What problems are expressed?
     4. REQUIREMENTS - What specific needs/features?
     5. SENTIMENT - Overall emotional tone
     6. DECISION READINESS - How ready to move forward? (1-10)

     Return as JSON matching EmailIntelligence interface.`;

     const message = await anthropic.messages.create({
       model: 'claude-3-5-sonnet-20241022',
       max_tokens: 4096,
       temperature: 0.3,
       messages: [{ role: 'user', content: prompt }],
     });

     const intelligence = JSON.parse(message.content[0].text);

     // Store in email_intelligence table
     await supabase.from('email_intelligence').insert({
       email_id: emailId,
       contact_id: contactId,
       workspace_id: workspaceId,
       ideas: intelligence.ideas,
       business_goals: intelligence.business_goals,
       pain_points: intelligence.pain_points,
       requirements: intelligence.requirements,
       sentiment: intelligence.sentiment,
       decision_readiness: intelligence.decision_readiness,
       ai_model: 'claude-3-5-sonnet-20241022',
       confidence_score: 0.85,
     });

     return { success: true, intelligence };
   }
   ```

2. **Create API Endpoint**: `src/app/api/intelligence/analyze/route.ts`

**Day 5: Integration Testing**

```bash
# Upload test video
curl -X POST http://localhost:3008/api/media/upload \
  -F "file=@test-call.mp4" \
  -F "contact_id=uuid" \
  -F "workspace_id=uuid"

# Transcribe
curl -X POST http://localhost:3008/api/agents/transcribe \
  -H "Content-Type: application/json" \
  -d '{"media_id": "uuid", "workspace_id": "uuid"}'

# Analyze
curl -X POST http://localhost:3008/api/intelligence/analyze \
  -H "Content-Type: application/json" \
  -d '{"media_id": "uuid", "contact_id": "uuid", "workspace_id": "uuid"}'
```

---

## 5. PHASE 3: TIER 2 - KNOWLEDGE STRUCTURING (Week 4)

### Week 4: Mindmap Generation + Gap Analysis

**Agent Specs**:
- `MINDMAP-AUTO-GENERATION-AGENT.md`
- `KNOWLEDGE-GAP-ANALYSIS-AGENT.md`

**Day 1-3: Mindmap Auto-Generation**

1. **Create Mindmap Function**: `src/lib/agents/mindmap-generator.ts`
   ```typescript
   export async function generateFromIntelligence(
     contactId: string,
     workspaceId: string
   ): Promise<GenerateMindmapResult> {
     // 1. Fetch all intelligence for contact
     const { data: intelligence } = await supabase
       .from('email_intelligence')
       .select('*')
       .eq('contact_id', contactId);

     // 2. Create center node (project root)
     const centerNode = await createCenterNode(contactId, workspaceId);

     // 3. Create 6 main branches
     const branches = [
       { label: 'Ideas', color: '#FFC107', icon: 'lightbulb', angle: 0 },
       { label: 'Goals', color: '#4CAF50', icon: 'target', angle: 60 },
       { label: 'Pain Points', color: '#F44336', icon: 'alert-triangle', angle: 120 },
       { label: 'Requirements', color: '#9C27B0', icon: 'list', angle: 180 },
       { label: 'Questions', color: '#2196F3', icon: 'help-circle', angle: 240 },
       { label: 'Knowledge Gaps', color: '#FF5722', icon: 'info', angle: 300 },
     ];

     const branchNodes = [];
     for (const branch of branches) {
       const node = await createBranch(centerNode.id, branch);
       branchNodes.push(node);
     }

     // 4. Add leaf nodes from intelligence
     for (const intel of intelligence) {
       // Add ideas
       for (const idea of intel.ideas) {
         await createLeafNode(
           branchNodes.find(b => b.label === 'Ideas').id,
           'idea',
           idea.text,
           idea.priority
         );
       }
       // ... similar for goals, pain_points, requirements
     }

     // 5. Calculate radial layout positions
     await calculateRadialLayout(centerNode);

     return { success: true, mindmap_id: centerNode.mindmap_id };
   }
   ```

2. **Create API Endpoint**: `src/app/api/mindmap/generate/route.ts`

**Day 4-5: Gap Analysis**

1. **Create Gap Analysis Function**: `src/lib/agents/gap-analysis.ts`
   ```typescript
   export async function analyzeGaps(
     contactId: string,
     workspaceId: string
   ): Promise<AnalyzeGapsResult> {
     // 1. Fetch intelligence
     const { data: intelligence } = await supabase
       .from('email_intelligence')
       .select('*')
       .eq('contact_id', contactId);

     // 2. Check required categories
     const requiredInfo = {
       budget: { keywords: ['budget', '$', 'cost'], importance: 'critical' },
       timeline: { keywords: ['timeline', 'deadline', 'Q1'], importance: 'critical' },
       target_audience: { keywords: ['audience', 'demographic'], importance: 'high' },
       success_metrics: { keywords: ['metric', 'KPI'], importance: 'high' },
     };

     const gaps = [];
     for (const [category, config] of Object.entries(requiredInfo)) {
       const hasInfo = intelligence.some(intel =>
         config.keywords.some(keyword =>
           JSON.stringify(intel).toLowerCase().includes(keyword)
         )
       );

       if (!hasInfo) {
         gaps.push({
           category,
           text: `${category.replace('_', ' ')} not discussed`,
           importance: config.importance,
           reasoning: `No mention of ${category} found`,
           suggested_questions: generateQuestions(category),
         });
       }
     }

     return { success: true, gaps, gap_summary: calculateSummary(gaps) };
   }
   ```

2. **Create API Endpoint**: `src/app/api/gaps/analyze/route.ts`

**Testing**:
```bash
# Generate mindmap
curl -X POST http://localhost:3008/api/mindmap/generate \
  -H "Content-Type: application/json" \
  -d '{"contact_id": "uuid", "workspace_id": "uuid"}'

# Analyze gaps
curl -X GET "http://localhost:3008/api/gaps/analyze/uuid?workspace_id=uuid"
```

---

## 6. PHASE 4: TIER 3 - QUESTIONNAIRES & STRATEGY (Weeks 5-6)

### Week 5: Dynamic Questionnaire Generator

**Agent Spec**: `DYNAMIC-QUESTIONNAIRE-GENERATOR-AGENT.md`

**Implementation**: See agent spec for complete details

**Key Steps**:
1. Create `src/lib/agents/questionnaire-generator.ts`
2. Implement `generateQuestionnaire()` function using Claude API
3. Create API endpoint: `POST /api/questionnaires/generate`
4. Test with Duncan's gaps

---

### Week 6: Marketing Strategy Generator

**Agent Spec**: `MARKETING-STRATEGY-GENERATOR-AGENT.md`

**Implementation**: See agent spec for complete details

**Key Steps**:
1. Create `src/lib/agents/strategy-generator.ts`
2. Implement `generateStrategy()` with Extended Thinking
3. Create API endpoint: `POST /api/strategies/generate`
4. Test strategy generation for Duncan

---

## 7. PHASE 5: TIER 4 - AUTONOMOUS EXECUTION (Weeks 7-9)

### Week 7-8: Task Orchestrator + Content Generator

**Agent Specs**:
- `AUTONOMOUS-TASK-ORCHESTRATOR-AGENT.md`
- `AI-CONTENT-GENERATION-AGENT.md`

**See agent specs for implementation details**

---

### Week 9: Content Calendar

**Agent Spec**: `CONTENT-CALENDAR-AGENT.md`

**See agent spec for implementation details**

---

## 8. PHASE 6: TIER 5 - CONTINUOUS LEARNING (Week 10)

**Agent Spec**: `CONTINUOUS-INTELLIGENCE-UPDATE-AGENT.md`

**Key Implementation**:

1. **Create Cron Job** (Vercel Cron or external service):
   ```typescript
   // src/app/api/cron/monitor-intelligence/route.ts
   export async function GET(req: NextRequest) {
     // Run every 5 minutes
     const result = await monitorNewContent({ lookback_minutes: 5 });
     return NextResponse.json(result);
   }
   ```

2. **Configure Vercel Cron** (`vercel.json`):
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/monitor-intelligence",
         "schedule": "*/5 * * * *"
       }
     ]
   }
   ```

---

## 9. PHASE 7: TESTING & OPTIMIZATION (Weeks 11-12)

### Week 11: Duncan's Use Case Testing

**Test Scenario**: Process Duncan's 4 months of emails + 10 call recordings

**Steps**:
1. Connect Duncan's Gmail account
2. Fetch 4 months of emails (~120 emails)
3. Upload 10 call recordings
4. Transcribe all calls
5. Analyze all emails + transcripts
6. Generate mindmap
7. Analyze gaps
8. Generate questionnaire
9. Generate marketing strategy
10. Generate content (12 blog posts)
11. Generate 90-day calendar

**Expected Results**:
- 120 emails analyzed: ~$2.40 cost
- 10 calls transcribed: ~$1.80 cost
- 1 strategy generated: ~$0.25 cost
- 12 blog posts: ~$2.40 cost
- 90 social posts: ~$0.90 cost
- **Total Cost**: ~$8
- **Total Time**: ~2 hours automated processing

---

### Week 12: Performance Optimization

**Optimization Tasks**:
1. Add database indexes for slow queries
2. Implement caching for frequently accessed data
3. Optimize Claude prompts (reduce token usage)
4. Add batch processing for bulk operations
5. Set up monitoring (Sentry, Datadog)

---

## 10. PRODUCTION DEPLOYMENT CHECKLIST

### Pre-Deployment

- [ ] All database migrations executed
- [ ] All environment variables configured in production
- [ ] API keys secured (use environment secrets)
- [ ] RLS policies tested
- [ ] Error monitoring configured (Sentry)
- [ ] Rate limiting implemented
- [ ] Backup strategy in place

### Deployment

- [ ] Deploy to Vercel/production environment
- [ ] Run smoke tests on production database
- [ ] Test critical user flows
- [ ] Monitor error logs for 24 hours
- [ ] Set up alerts for failures

### Post-Deployment

- [ ] Monitor API costs (Anthropic, OpenAI)
- [ ] Track performance metrics
- [ ] Gather user feedback
- [ ] Plan next iteration enhancements

---

## 11. COST ANALYSIS

### Development Costs (One-Time)

- **Developer Time**: 8-12 weeks @ $80-150/hour = $25,600 - $72,000
- **Third-Party Services**: $100-500 (API credits for testing)
- **Total Development**: ~$26,000 - $72,500

### Operating Costs (Monthly)

**For 100 Active Clients**:

| Service | Usage | Cost/Month |
|---------|-------|------------|
| Anthropic Claude | 1000 emails analyzed | $30 |
| | 50 strategies generated | $12.50 |
| | 500 blog posts | $150 |
| | **Total** | **$192.50** |
| OpenAI Whisper | 500 hours transcription | $180 |
| Supabase | 10GB database | $25 |
| Vercel | Pro plan | $20 |
| **Total Monthly** | | **$417.50** |

**Cost per Client**: $4.18/month

---

## 12. TROUBLESHOOTING

### Common Issues

#### 1. Gmail OAuth Fails
**Error**: "redirect_uri_mismatch"
**Fix**: Ensure redirect URI in Google Cloud Console exactly matches environment variable

#### 2. Transcription Times Out
**Error**: "Request timeout"
**Fix**: Implement chunking for videos > 1 hour, process in 30-minute segments

#### 3. Claude API Rate Limits
**Error**: "429 Too Many Requests"
**Fix**: Implement exponential backoff retry logic (see `AUTONOMOUS-TASK-ORCHESTRATOR-AGENT.md`)

#### 4. RLS Policy Blocks Access
**Error**: "Permission denied"
**Fix**: Verify user is member of workspace in `user_organizations` table

#### 5. Mindmap Generation Slow
**Error**: Takes > 30 seconds
**Fix**: Reduce number of nodes, batch insert operations

---

## NEXT STEPS

1. **Start with Phase 1** (Database Setup) - Week 1
2. **Build Tier 1 agents** (Email, Transcription, Intelligence) - Weeks 2-3
3. **Continue through phases sequentially**
4. **Test with Duncan's data** - Week 11
5. **Deploy to production** - Week 12

---

**Questions?** Refer to individual agent specifications for detailed implementation guidance.

**END OF IMPLEMENTATION GUIDE**
