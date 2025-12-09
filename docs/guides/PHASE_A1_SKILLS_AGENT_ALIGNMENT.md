# Unite-Hub Agent Skills & SDK Alignment

**Phase**: A1 - Discovery & Gap Analysis
**Generated**: 2025-12-06
**Focus**: Connecting business workflows to agent/skill architecture

---

## 1. Existing Agents & Scripts

### 1.1 Core Agents (CLI-Invokable)

| Agent | Invocation | SKILL.md | Purpose |
|-------|-----------|----------|---------|
| **Orchestrator** | `npm run orchestrator` | `.claude/skills/orchestrator/SKILL.md` | Master coordinator, routes tasks, manages pipelines |
| **Email Agent** | `npm run email-agent` | `.claude/skills/email-agent/SKILL.md` | Processes emails, extracts intents, updates contacts |
| **Content Agent** | `npm run content-agent` | `.claude/skills/content-agent/SKILL.md` | Generates personalized content using Extended Thinking |
| **Workflow** | `npm run workflow` | (uses orchestrator) | Full pipeline: email → content |

### 1.2 SEO Agents

| Agent | Invocation | SKILL.md | Purpose |
|-------|-----------|----------|---------|
| **SEO Research** | `npm run seo:research "topic"` | `.claude/skills/seo-leak/SKILL.md` | Keyword research, SERP analysis |
| **SEO EEAT** | `npm run seo:eeat` | `.claude/skills/no-bluff-seo/SKILL.md` | E-E-A-T audit |
| **SEO Comprehensive** | `npm run seo:comprehensive "topic"` | Multiple skills | Full SEO suite |
| **SEO GMB** | `npm run seo:gmb` | `.claude/skills/business-consistency/SKILL.md` | Google Business Profile |
| **SEO GEO** | `npm run seo:geo` | `.claude/skills/business-consistency/SKILL.md` | Local SEO |

### 1.3 Billing & Infrastructure

| Agent | Invocation | SKILL.md | Purpose |
|-------|-----------|----------|---------|
| **Stripe Agent** | `npm run stripe:setup` | `.claude/skills/stripe-agent/SKILL.md` | Billing operations |
| **Integrity Check** | `npm run integrity:check` | (script only) | System health validation |
| **Quality Assess** | `npm run quality:assess` | (script only) | Code quality check |

### 1.4 Synthex-Specific

| Agent | Invocation | Notes |
|-------|-----------|-------|
| **Synthex Phase1** | `npm run synthex:phase1` | Deployment prep |
| **Synthex Assess** | `npm run synthex:assess` | Assessment scripts |

---

## 2. Current Skill Architecture

### 2.1 Skill Files Located

All skills are under `.claude/skills/`:

```
.claude/skills/
├── ai-phill/SKILL.md           # Strategic advisor (Socratic dialogue)
├── backend/SKILL.md            # API/database development
├── build-diagnostics/SKILL.md  # Build issue resolution
├── business-consistency/SKILL.md # NAP consistency, local SEO
├── cognitive-twin/SKILL.md     # Business health monitoring
├── competitor-analysis/SKILL.md # Competition research
├── content-agent/SKILL.md      # Content generation
├── conversion-copywriting/SKILL.md # CRO copy
├── decision-moment/SKILL.md    # Decision journey mapping
├── deployment-audit/SKILL.md   # Deployment health
├── docs/SKILL.md              # Documentation maintenance
├── email-agent/SKILL.md       # Email processing
├── founder-os/SKILL.md        # Business portfolio management
├── frontend/SKILL.md          # UI development
├── multi-channel/SKILL.md     # Social/ad management
├── no-bluff-seo/SKILL.md      # SEO protocol enforcement
├── orchestrator/SKILL.md      # Master coordinator
├── pre-client/SKILL.md        # Pre-sales intelligence
├── seo-leak/SKILL.md          # SEO intelligence
├── social-playbook/SKILL.md   # Social content planning
├── stripe-agent/SKILL.md      # Billing operations
├── test-infrastructure/SKILL.md # Test quality
├── transparency-reporter/SKILL.md # Transparency reports
├── truth-layer/SKILL.md       # Verification
├── verification-protocol/SKILL.md # Task verification
├── video-generation/SKILL.md  # Video content
├── visual-engine/SKILL.md     # Visual experiences
└── voc-research/SKILL.md      # Voice of customer
```

### 2.2 Skill Invocation Pattern

Skills are currently invoked through:

1. **CLI Scripts** (`npm run <script>`) - Most common
2. **Claude Code Skills** (via `/skill:<name>`) - Developer use
3. **API Routes** (some skills have corresponding routes) - Programmatic

Skills are NOT currently invoked from:
- End-user UI in Synthex portal
- Automated scheduling with user visibility
- Real-time progress feedback to users

---

## 3. Gap: Agents Not Surfaced to End Users

### 3.1 The Visibility Problem

| Capability | Exists In | Visible To User? |
|------------|-----------|------------------|
| Email processing | Email Agent | No |
| Content generation | Content Agent | No (except internal dashboard) |
| SEO analysis | SEO skills | No |
| Lead scoring | Contact Intelligence | No (results shown, process hidden) |
| Campaign execution | Campaign APIs | No |
| Social posting | Multi-channel skill | No |

### 3.2 What Users Should See

1. **Agent Status Widget**
   - Which agents are active/idle
   - Last run timestamps
   - Success/failure rates
   - Next scheduled run

2. **Agent Activity Feed**
   - Real-time stream of agent actions
   - "Email Agent processed 15 emails"
   - "Content Agent generated 3 follow-up emails"
   - "SEO Agent completed audit for example.com"

3. **Agent Trigger Buttons**
   - "Run SEO Audit Now"
   - "Generate Content for Leads"
   - "Process New Emails"
   - "Analyze Competition"

4. **Agent Configuration**
   - Set processing preferences
   - Define content style/tone
   - Configure automation rules

---

## 4. Candidate Agent Skills to Create

### 4.1 User-Facing Skills (Priority: High)

| Skill Name | Purpose | Business Value |
|------------|---------|----------------|
| `user-content-generator` | Generate content from UI with progress feedback | Core value loop |
| `user-seo-auditor` | Run on-demand SEO audits from UI | Paid feature |
| `user-campaign-launcher` | Launch and manage campaigns from UI | Core value loop |
| `user-social-poster` | Schedule and post to social from UI | Core value loop |

### 4.2 Integration Skills (Priority: Medium)

| Skill Name | Purpose | Business Value |
|------------|---------|----------------|
| `gmb-manager` | Manage Google Business Profile | Local SEO |
| `analytics-connector` | Connect and sync GA4/GSC | Reporting |
| `email-connector` | Connect and sync Gmail | Email integration |
| `social-connector` | Connect social accounts | Social integration |

### 4.3 Automation Skills (Priority: Medium)

| Skill Name | Purpose | Business Value |
|------------|---------|----------------|
| `scheduled-auditor` | Daily/weekly automated audits | Ongoing monitoring |
| `competitor-tracker` | Monitor competitor changes | Intelligence |
| `review-requester` | Request reviews from customers | Reputation |
| `lead-nurture-runner` | Execute nurture sequences | Lead conversion |

---

## 5. Agent SDK Integration Opportunities

### 5.1 Current State

The agent architecture uses:
- **SKILL.md files** for capability definitions
- **CLI scripts** for invocation (`scripts/*.mjs`)
- **API routes** for HTTP-based triggers
- **Memory tool** for state persistence

### 5.2 Proposed Enhancements

#### 5.2.1 Agent Trigger API

Create a unified API for triggering agents from UI:

```typescript
// POST /api/agents/trigger
{
  "agent": "content-agent",
  "action": "generate",
  "params": {
    "workspaceId": "uuid",
    "minScore": 60,
    "contentTypes": ["followup"]
  }
}

// Response
{
  "jobId": "uuid",
  "status": "running",
  "websocketChannel": "agent:content-agent:uuid"
}
```

#### 5.2.2 Agent Status API

Create an API for querying agent status:

```typescript
// GET /api/agents/status?workspaceId=uuid
{
  "agents": [
    {
      "id": "email-agent",
      "status": "idle",
      "lastRun": "2025-12-06T10:30:00Z",
      "successRate": 0.98,
      "nextScheduledRun": "2025-12-06T11:00:00Z"
    }
  ]
}
```

#### 5.2.3 Agent Activity Stream

Create WebSocket endpoint for real-time activity:

```typescript
// WebSocket: /api/agents/activity?workspaceId=uuid
{
  "event": "agent:action",
  "agent": "content-agent",
  "action": "generate",
  "data": {
    "contentId": "uuid",
    "type": "followup",
    "contactName": "John Smith"
  },
  "timestamp": "2025-12-06T10:35:00Z"
}
```

### 5.3 Long-Running Agent Service

For agents that need to run continuously (e.g., email monitoring):

```typescript
// Agent daemon pattern
class AgentService {
  private agents: Map<string, Agent>;

  async startAgent(agentId: string, config: AgentConfig): Promise<void>;
  async stopAgent(agentId: string): Promise<void>;
  async getAgentStatus(agentId: string): Promise<AgentStatus>;
  async subscribeToAgent(agentId: string, callback: AgentCallback): void;
}
```

---

## 6. UI/Agent Connection Points

### 6.1 Synthex Dashboard Widget

```tsx
// Agent Status Card for Synthex Dashboard
<AgentStatusCard>
  <AgentList>
    <Agent name="Content Generator" status="idle" lastRun="2h ago" />
    <Agent name="SEO Monitor" status="running" progress={45} />
    <Agent name="Email Processor" status="scheduled" nextRun="in 30m" />
  </AgentList>
  <QuickActions>
    <Button onClick={() => triggerAgent('content')}>Generate Content</Button>
    <Button onClick={() => triggerAgent('seo')}>Run SEO Audit</Button>
  </QuickActions>
</AgentStatusCard>
```

### 6.2 Workspace AI Panel

```tsx
// AI Workspace with Agent Integration
<AIWorkspace>
  <ChatInterface agent="assistant" />
  <AgentTools>
    <Tool name="Content Generation" onClick={openContentWizard} />
    <Tool name="SEO Analysis" onClick={openSEOAudit} />
    <Tool name="Campaign Builder" onClick={openCampaignBuilder} />
  </AgentTools>
  <ActivityFeed stream="/api/agents/activity" />
</AIWorkspace>
```

### 6.3 Settings/Configuration

```tsx
// Agent Configuration in Settings
<AgentSettings>
  <AgentConfig agent="content-agent">
    <Setting name="defaultTone" type="select" options={['professional', 'casual', 'friendly']} />
    <Setting name="autoGenerate" type="toggle" label="Auto-generate for hot leads" />
  </AgentConfig>
  <AgentSchedule>
    <Schedule agent="seo-auditor" frequency="weekly" day="monday" />
    <Schedule agent="email-processor" frequency="hourly" />
  </AgentSchedule>
</AgentSettings>
```

---

## 7. Implementation Roadmap

### Phase B1: Foundation (with Synthex Portal)

1. Create `/api/agents/status` endpoint
2. Create `/api/agents/trigger` endpoint
3. Add basic agent status to Synthex dashboard
4. Wire content generation to UI trigger

### Phase B2: Real-Time Updates

1. Implement WebSocket agent activity stream
2. Add activity feed to dashboard
3. Progress indicators for long-running agents
4. Error handling and user feedback

### Phase B3: Configuration & Scheduling

1. Agent configuration UI
2. User-defined schedules
3. Schedule management API
4. Notification preferences

### Phase B4: Advanced Agent Features

1. Agent-to-agent communication (via orchestrator)
2. Conditional workflows (if SEO score < 50, run audit)
3. Agent recommendations ("Suggest: Generate follow-ups for 5 hot leads")
4. Historical analytics on agent performance

---

## 8. Summary

### What Exists
- 28 well-defined SKILL.md files
- CLI scripts for agent invocation
- API routes for many operations
- Orchestrator pattern for coordination

### What's Missing
- UI surfaces for agent visibility
- User-triggerable agent actions
- Real-time progress feedback
- Agent configuration from UI
- Scheduled agent runs with user awareness

### Priority Actions

1. **Immediate**: Create agent status/trigger APIs
2. **Near-term**: Add agent widget to Synthex dashboard
3. **Mid-term**: Implement real-time activity stream
4. **Future**: Full agent configuration and scheduling UI

---

*Generated by Claude Code Gap Analysis - Phase A1*
