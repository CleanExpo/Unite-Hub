# Agent Reference Guide - Unite-Hub

**Purpose**: Quick reference for all 8 agents + orchestrator patterns

**Note**: For complete definitions, see `.claude/agent.md` (CANONICAL)

Last updated: 2025-12-02

---

## Quick Agent Lookup

| Agent | File | Purpose | Model | Use When |
|-------|------|---------|-------|----------|
| **Orchestrator** | `src/lib/orchestrator/orchestratorEngine.ts` | Coordinates multi-agent workflows | Sonnet 4.5 | Orchestrating multi-step tasks |
| **Email Agent** | `src/lib/agents/email-processor.ts` | Process emails, extract intent | Sonnet 4.5 | Processing incoming emails |
| **Content Agent** | `src/lib/agents/content-personalization.ts` | Generate personalized content | Opus 4.5 + Thinking | Creating marketing content |
| **Contact Intelligence** | `src/lib/agents/contact-intelligence.ts` | Lead scoring (0-100) | Sonnet 4.5 | Scoring prospects |
| **SEO Agent** | `src/lib/agents/seoLeakAgent.ts` | Technical audits, gap analysis | Sonnet 4.5 | SEO analysis |
| **AI Phill** | `src/lib/founder/ai-phill.ts` | Personal assistant, insights | Sonnet 4.5 | Daily briefings, journaling |
| **Cognitive Twin** | `src/lib/founder/cognitive-twin.ts` | Strategic memory, decisions | Opus 4.5 + Thinking | Strategic analysis |
| **Social Inbox** | `src/lib/founder/social-inbox.ts` | Unified social messaging | Haiku 4.5 | Message classification |
| **Search Suite** | `src/lib/founder/search-suite.ts` | Ranking tracking, monitoring | Sonnet 4.5 | Keyword research |
| **Boost Bump** | `src/lib/founder/boost-bump.ts` | Automation tasks | Haiku 4.5 | Browser automation |
| **Pre-Client** | `src/lib/founder/pre-client.ts` | Email → contact resolution | Sonnet 4.5 | Prospect identification |

---

## API Route Organization

All agents accessible via REST API (104 total routes):

```
/api/agents/
  ├─ orchestrator/
  │   ├─ /execute       - Run workflow
  │   ├─ /plan          - Plan execution
  │   └─ /status        - Get status
  ├─ email/
  │   ├─ /process       - Process emails
  │   └─ /sync          - Sync Gmail
  ├─ content/
  │   ├─ /generate      - Generate content
  │   ├─ /approve       - Approve drafts
  │   └─ /pending       - List pending
  ├─ contact-intelligence/
  │   ├─ /score         - Score contacts
  │   └─ /segment       - Get segments
  ├─ seo/
  │   ├─ /audit         - Run audit
  │   ├─ /content       - Optimize content
  │   └─ /competitors   - Gap analysis
  └─ founder/
      ├─ /assistant    - AI Phill chat
      ├─ /awareness    - Situational awareness
      ├─ /cognitive-map - Decision visualization
      └─ /ops/*        - Task management (10 routes)
```

---

## Execution Patterns

### Pattern 1: Single Agent Task

```typescript
const agent = new EmailProcessor(workspaceId);
const result = await agent.process({
  messageId: "msg_123",
  from: "contact@example.com",
  subject: "Inquiry about product",
  body: "..."
});

// Returns: { intent, sentiment, urgency, suggestedAction }
```

### Pattern 2: Multi-Agent Orchestration

```typescript
const orchestrator = new OrchestratorEngine(workspaceId);
const workflow = {
  steps: [
    { agent: 'email', action: 'sync' },
    { agent: 'contact-intelligence', action: 'score', dependsOn: 'email' },
    { agent: 'content', action: 'generate', dependsOn: 'contact-intelligence' }
  ]
};

const result = await orchestrator.execute(workflow);
// Returns: aggregated results from all agents
```

### Pattern 3: Parallel Execution

```typescript
const results = await Promise.all([
  emailAgent.process(emailData),
  contactIntelligence.scoreAll(contacts),
  seoAgent.audit(url)
]);

// All run in parallel, faster overall execution
```

---

## Agent Inputs & Outputs

### Email Agent

**Input**:
```json
{
  "messageId": "msg_123",
  "from": "user@example.com",
  "subject": "Help with order",
  "body": "My order hasn't arrived yet...",
  "timestamp": "2025-12-02T15:00:00Z",
  "workspaceId": "org_abc"
}
```

**Output**:
```json
{
  "intent": "support",
  "sentiment": 35,
  "urgency": 4,
  "suggestedAction": "Escalate to support team",
  "summary": "Customer frustrated, order delayed 5 days",
  "keyPhrases": ["delayed", "urgent", "help"]
}
```

### Content Agent

**Input**:
```json
{
  "contactId": "contact_123",
  "contactName": "Sarah Chen",
  "contactProfile": {
    "jobTitle": "VP Sales",
    "company": "TechCorp",
    "industry": "SaaS",
    "interests": ["automation", "crm"],
    "emailHistory": [...]
  },
  "contentType": "followup",
  "workspaceId": "org_abc"
}
```

**Output**:
```json
{
  "subject": "Sarah, automating your team's top task",
  "content": "Hi Sarah,\n\nQuick question: what's your...",
  "personalizationScore": 87,
  "sentiment": 72,
  "callToAction": "Reply with your biggest time sink"
}
```

### Contact Intelligence

**Input**:
```json
{
  "contactId": "contact_123",
  "engagementMetrics": {...},
  "interactionHistory": [...],
  "workspaceId": "org_abc"
}
```

**Output**:
```json
{
  "aiScore": 78,
  "segment": "hot",
  "scoreBreakdown": {
    "engagement": 85,
    "sentiment": 72,
    "intent": 80,
    "statusProgression": 65,
    "recency": 90
  },
  "nextAction": "Schedule sales call"
}
```

---

## Model Selection Quick Guide

| Scenario | Use Model | Why |
|----------|-----------|-----|
| Email processing | **Sonnet 4.5** | Fast, accurate for classification |
| Create marketing content | **Opus 4.5** + Thinking (5000-10000) | Complex personalization justifies cost |
| Lead scoring | **Sonnet 4.5** | Deterministic, no thinking needed |
| Quick task (classification) | **Haiku 4.5** | Cost-effective for simple ops |
| Strategic analysis | **Opus 4.5** + Thinking (10000) | Deep reasoning required |
| Real-time response | **Sonnet 4.5** | Balance of speed and quality |

**Cost Note**: Thinking tokens = $7.50/MTok (27x regular). Only use for genuinely complex tasks.

---

## Common Workflows

### Workflow: Email → Score → Content

```
1. Email Agent processes new email
   ↓
2. Contact Intelligence scores sender
   ↓
3. Content Agent generates personalized response
   ↓
4. Output: Ready-to-send email draft
```

**Time**: ~8 seconds | **Cost**: ~$0.02 per email

**Run**:
```bash
npm run workflow
```

### Workflow: SEO Analysis

```
1. SEO Agent runs technical audit (Core Web Vitals, mobile, SSL, etc)
   ↓
2. Content analysis (keyword density, readability, structure)
   ↓
3. Competitor gap analysis (keywords, content, backlinks)
   ↓
4. Output: Full report with recommendations
```

**Time**: ~15 seconds | **Cost**: ~$0.05

**Run**:
```bash
npm run seo:comprehensive "your topic"
```

### Workflow: Full Orchestration

```
1. Sync emails from Gmail
2. Score all contacts
3. Generate content for hot leads (score > 75)
4. Create campaign
5. Schedule send
6. Return: Campaign ready to launch
```

**Time**: ~45 seconds | **Cost**: ~$0.50

**Run**:
```bash
npm run orchestrator
```

---

## Debugging Agent Issues

### Agent returning null/empty output

**Check**:
1. Is `workspaceId` being passed?
2. Are database queries filtered by `workspace_id`?
3. Does the agent have required environment variables?

**Debug**:
```bash
# Enable verbose logging
DEBUG=* npm run email-agent

# Check agent logs
grep -i "error" logs/agent-*.log
```

### Agent taking too long

**Check**:
1. Is Anthropic API slow? (Check Anthropic status page)
2. Are database queries slow? (Check query logs in Supabase)
3. Is model overloaded? (Try different model or time of day)

**Optimize**:
```typescript
// Switch to faster model for non-critical tasks
const model = isUrgent ? 'opus-4-5' : 'sonnet-4-5';

// Add timeout
const result = await agentTask.timeout(5000);
```

### Agent making errors consistently

**Check**:
1. Is input schema correct?
2. Are there recent code changes?
3. Is the model version correct?

**Fix**:
```typescript
// Add explicit validation
if (!input.workspaceId) throw new Error('workspaceId required');

// Add structured error handling
try {
  return await agent.execute(input);
} catch (error) {
  logger.error('Agent failed', { error, input });
  return { success: false, error: error.message };
}
```

---

## Performance Targets & Status

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Email processing | <2s | <1s | ✅ |
| Content generation | <5s | 3-4s | ✅ |
| Lead scoring | <1s | <500ms | ✅ |
| Orchestrator response | <10s | 8-9s | ✅ |
| Availability | 99.5% | 99.7% | ✅ |
| Accuracy (lead scoring) | >85% | 87% | ✅ |
| Accuracy (content) | >80% | 84% | ✅ |

---

## Testing Agents

### Unit Test Example

```typescript
import { EmailProcessor } from '@/lib/agents/email-processor';

describe('EmailProcessor', () => {
  it('should classify support emails as "support" intent', async () => {
    const agent = new EmailProcessor('org_test');
    const result = await agent.process({
      from: 'user@example.com',
      subject: 'Help with order',
      body: 'My order hasnt arrived',
    });

    expect(result.intent).toBe('support');
    expect(result.urgency).toBeGreaterThan(2);
  });
});
```

**Run**:
```bash
npm run test:unit -- email-processor
```

### Integration Test Example

```typescript
describe('Orchestrator', () => {
  it('should execute multi-agent workflow end-to-end', async () => {
    const orchestrator = new OrchestratorEngine('org_test');
    const result = await orchestrator.execute(workflowDefinition);

    expect(result.status).toBe('complete');
    expect(result.email).toBeDefined();
    expect(result.content).toBeDefined();
    expect(result.score).toBeGreaterThan(0);
  });
});
```

**Run**:
```bash
npm run test:integration -- orchestrator
```

---

## Related Files & Documentation

**Agent Code**:
- Orchestrator: `src/lib/orchestrator/orchestratorEngine.ts`
- Email: `src/lib/agents/email-processor.ts`
- Content: `src/lib/agents/content-personalization.ts`
- Contact Intelligence: `src/lib/agents/contact-intelligence.ts`
- SEO: `src/lib/agents/seoLeakAgent.ts`
- Founder OS agents: `src/lib/founder/` directory (8 agents)

**Documentation**:
- Canonical definitions: `.claude/agent.md`
- Context optimization: `.claude/context-manifest.md` + `.claude/ADVANCED_TOOL_USE_STRATEGY.md`
- Development guide: `CLAUDE.md`
- Database schema: `.claude/SCHEMA_REFERENCE.md`
- Production readiness: `PRODUCTION_GRADE_ASSESSMENT.md`

**API Routes**:
- `src/app/api/agents/` (104 total routes)
- `src/app/api/founder/` (23 routes for Founder OS)

---

## Quick Commands

```bash
# Run individual agents
npm run email-agent
npm run content-agent
npm run orchestrator

# Run full workflow
npm run workflow

# Run tests
npm test
npm run test:integration
npm run test:e2e

# System health check
npm run audit-system
npm run integrity:check

# Generate content
npm run generate-content

# Score contacts
npm run analyze-contacts
```

---

## Next Steps

**Immediate**:
- Use this reference for agent selection
- Follow patterns in related files for consistency
- Check `.claude/context-manifest.md` for doc routing

**Short-term**:
- Implement Tool Use Examples from `.claude/ADVANCED_TOOL_USE_STRATEGY.md`
- Add Programmatic Tool Calling for multi-step workflows
- Improve error handling with structured logging

**Medium-term** (Q1 2026):
- Migrate to Tool Search Tool for automated discovery
- Implement advanced monitoring and alerts
- Add custom agent marketplace (Phase 6+)

---

**Status**: All agents operational, Phase 5 complete ✅

**Questions?** Check `.claude/agent.md` for complete definitions or `CLAUDE.md` for patterns.
