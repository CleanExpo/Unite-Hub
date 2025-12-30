# The Agentic Layer: Unite-Hub's Self-Driving Codebase
## Meta-Framework Documentation

**Status**: Active
**Version**: 1.0.0 (Class 1 Grade 4 → Class 2-3 in progress)
**Last Updated**: December 30, 2025

---

## What is the Agentic Layer?

The **agentic layer** is the autonomous engineering team living in Unite-Hub's codebase. It's composed of:
- **43 AI agents** (marketing, intelligence, infrastructure)
- **System prompts** (.claude/CLAUDE.md, rules/*.md)
- **Memory files** (agent learnings, decisions, patterns)
- **Tool definitions** (MCP servers, CLI access)
- **Agent skills** (domain-specific expertise)

**Goal**: Reach **codebase singularity** - the moment when agents run and improve the codebase better than humans.

---

## Current State: Class 1 Grade 4 ✅

### What We Have (Production-Ready)

**Grade 1: System Prompts**
- ✅ .claude/CLAUDE.md (project primer)
- ✅ .claude/agent.md (agent definitions)
- ✅ AGENTS.md (AI coding agent guide)

**Grade 2: Specialized Sub-Agents**
- ✅ 43 specialized agents (email, content, intelligence, etc.)
- ✅ Orchestrator coordination (orchestrator-router.ts)
- ✅ Planning agent (agentPlanner.ts)

**Grade 3: Tool Use**
- ✅ RabbitMQ message bus
- ✅ Supabase database access
- ✅ Claude AI (Opus/Sonnet/Haiku)
- ✅ Gmail, Stripe, Calendar integrations

**Grade 4: Feedback Loops**
- ✅ Independent verification (prevents self-attestation)
- ✅ Test-driven iteration (run tests, fix, repeat)
- ✅ Code review patterns (agentSafety.ts)
- ✅ Self-healing (orchestrator-self-healing.ts)

**Plus: Project Vend Phase 2**
- ✅ Metrics & observability
- ✅ Business rules engine
- ✅ Verification layer
- ✅ Smart escalations
- ✅ Cost control & budgets

**Result**: Agents can handle complex multi-step tasks with minimal oversight.

---

## Target State: Class 2-3 (In Progress)

### Class 2: Orchestrated Multi-Agent System

**Goal**: Orchestrator manages team of subagents in parallel

**Features**:
- 🔨 Parallel agent execution
- 🔨 Isolated subagent contexts (via Claude Agent SDK)
- 🔨 Plan → Parallelize → Integrate workflow
- 🔨 Capability-based routing (not just hardcoded intents)

**Implementation**:
- Install @anthropic-ai/claude-agent-sdk
- Create SDK orchestrator (src/lib/agents/sdk/)
- Spawn subagents with isolated contexts
- Coordinate multi-agent workflows

### Class 3: Autonomous Codebase (Codebase Singularity)

**Goal**: Agents run entire development lifecycle

**Features**:
- 🔨 Autonomous feature development (ROADMAP.md → PR)
- 🔨 Code review agent (PR review automation)
- 🔨 Continuous optimization (nightly improvements)
- 🔨 Security scanning (CVE monitoring)
- 🔨 Documentation sync (auto-updates docs)
- 🔨 Deploy gate automation (verify before deploy)

**Implementation**:
- Code reviewer agent
- Continuous optimizer agent
- Documentation agent
- Security agent
- Feature development workflow
- Bug fix workflow
- Refactoring workflow

---

## Architecture: Agentic Layer Components

### 1. System Prompts (The Brain)

**Files**:
- `AGENTS.md` - For AI coding agents
- `.claude/CLAUDE.md` - Project guide
- `.claude/rules/*.md` - Auto-loaded patterns
- `.claude/agent.md` - Agent definitions

**Principle**: "Right altitude" - not too rigid, not too abstract

### 2. Memory System (The Experience)

**Location**: `src/lib/memory/`

**Four Layers**:
1. **MemoryStore** - Write layer (store learnings)
2. **MemoryRetriever** - Read layer (hybrid ranking)
3. **MemoryRanker** - Scoring (recency + relevance + importance)
4. **MemoryArchiveBridge** - Cross-system integration

**Usage**:
```typescript
// Store learning
await memoryStore.store({
  type: 'lesson',
  content: 'Pattern X works better than Pattern Y for task Z',
  tags: ['performance', 'optimization'],
  importance: 0.8
});

// Retrieve relevant memories
const memories = await memoryRetriever.retrieve({
  query: 'How to optimize database queries',
  limit: 5
});
```

### 3. Agent Skills (The Expertise)

**Location**: `.claude/skills/`

**Pattern**: Progressive disclosure
- Metadata in system prompt (name + description)
- Full skill loaded on-demand when needed
- Scales to unlimited expertise without context bloat

**Structure**:
```
.claude/skills/
├── database-migration/
│   ├── SKILL.md          # Main instructions
│   ├── examples/         # Code examples
│   └── templates/        # Boilerplate
├── new-agent-creation/
│   ├── SKILL.md
│   └── checklist.md
└── api-endpoint-creation/
    ├── SKILL.md
    └── boilerplate/
```

### 4. Orchestrator (The Conductor)

**Current**: `orchestrator-router.ts` + `orchestratorEngine.ts`
- Intent classification (54 types)
- Multi-step workflow execution
- Risk supervision
- Milestone-based completion gates

**Enhanced (Class 2)**: `src/lib/agents/sdk/claude-orchestrator.ts`
- Spawn subagents via Claude Agent SDK
- Parallel execution
- Isolated contexts
- Plan → Parallelize → Integrate

### 5. Verification (The Quality Gate)

**Independent Verification** (Prevents Self-Attestation):
- File existence checks
- TypeScript compilation
- Test execution
- Placeholder detection
- Endpoint response verification

**Pattern**:
```typescript
const verification = await verifier.verify({
  type: 'file_exists',
  path: 'src/new-feature.ts'
});

if (!verification.verified) {
  throw new Error('Verification failed');
}
```

### 6. Feedback Loops (The Learning)

**Current Loops**:
- Budget check → Execution → Metrics → Health update
- Rules check → Execute → Verify → Escalate if needed
- Test → Fix → Retest (until pass)

**Enhanced Loops (Class 3)**:
- Code → Review → Fix → Review (until approved)
- Deploy → Monitor → Rollback (if issues)
- Scan → Optimize → Test → PR (continuous improvement)

---

## Evolution Path

### Class 1: Basic Augmentation ✅ COMPLETE

**What We Built**:
- System prompts + documentation
- 43 specialized agents
- Tool integrations (RabbitMQ, Supabase, Claude)
- Independent verification + feedback loops

**Capability**: Single agent handles complex tasks with retries and verification

### Class 2: Orchestrated System 🔨 IN PROGRESS

**What We're Building**:
- Claude Agent SDK integration
- Subagent spawning (isolated contexts)
- Parallel execution
- Plan → Parallelize → Integrate workflows

**Capability**: Orchestrator manages team of subagents working in parallel

### Class 3: Autonomous Codebase 🔨 NEXT

**What We'll Build**:
- Code review agent (PR automation)
- Continuous optimizer (nightly improvements)
- Documentation agent (auto-sync)
- Security agent (CVE scanning)
- Feature development workflow (ROADMAP.md → PR)
- Bug fix workflow (logs → fix → PR)

**Capability**: Agents autonomously develop features, fix bugs, improve code

---

## Agent Communication Patterns

### Current: Orchestrator-Mediated (Hub-and-Spoke)

```
User Request
    ↓
Orchestrator
    ├─→ Agent A (via RabbitMQ)
    ├─→ Agent B (via RabbitMQ)
    └─→ Agent C (via RabbitMQ)
    ↓
Results aggregated
    ↓
Verification
    ↓
Response
```

**Benefits**:
- Clear coordination
- No agent confusion
- Centralized state management
- Easy debugging

### Enhanced: SDK Subagents (Class 2)

```
Orchestrator
    ├─→ Subagent 1 (isolated context) ─┐
    ├─→ Subagent 2 (isolated context) ─┤ Parallel
    └─→ Subagent 3 (isolated context) ─┘
    ↓
Results integrated
    ↓
Verification
    ↓
Response
```

**Benefits**:
- Parallelization (speed)
- Context isolation (clarity)
- Automatic management (SDK handles it)

---

## Standards & Best Practices

### For All Agents

**MUST**:
- Filter by workspace_id (multi-tenant isolation)
- Record to agent_execution_metrics
- Respect budget limits
- Pass verification if verification_required=true
- Handle errors gracefully

**SHOULD**:
- Use appropriate model (Opus/Sonnet/Haiku)
- Store learnings in memory system
- Update relevant documentation
- Create tests for new capabilities

**MUST NOT**:
- Call other agents directly (use orchestrator)
- Skip workspace validation
- Exceed budget without escalation
- Trust own output without verification
- Make breaking changes without tests

### For Agentic Coding Agents

**When Adding Features**:
1. Read AGENTS.md for project context
2. Check .claude/rules/*.md for patterns
3. Load relevant skills from .claude/skills/
4. Write code following TypeScript strict mode
5. Create tests (100% pass required)
6. Update documentation
7. Verify via independent-verifier
8. Create PR for human review

**When Fixing Bugs**:
1. Reproduce bug (write failing test)
2. Fix code
3. Verify test passes
4. Check no regressions (run full suite)
5. Update docs if needed
6. Create PR

**When Refactoring**:
1. Ensure tests exist and pass (baseline)
2. Refactor code
3. Verify tests still pass (behavior preserved)
4. Measure improvement (performance, readability)
5. Create PR with before/after metrics

---

## Tool Access

### Available Tools (via MCP & Direct)

**File Operations**:
- Read, Write, Edit
- Glob (file search)
- Grep (content search)

**System**:
- Bash (CLI commands)
- npm scripts
- git operations

**Database**:
- Supabase client (via code)
- SQL migrations (via files)

**AI Models**:
- Claude (Opus/Sonnet/Haiku)
- OpenRouter (multi-model)
- Perplexity (research)

**Web**:
- WebSearch
- WebFetch

---

## Success Metrics

### Class 2 Success
- ✅ 5+ subagents spawning successfully
- ✅ Parallel workflows executing
- ✅ Plan → Parallelize → Integrate working
- ✅ Context isolation maintained

### Class 3 Success
- ✅ Autonomous feature development (ROADMAP.md → PR)
- ✅ Code review agent approving PRs
- ✅ Continuous optimization running
- ✅ Documentation always in sync
- ✅ Security scans automated

### Codebase Singularity
- ✅ "Agents run Unite-Hub better than I can"
- ✅ 90%+ routine development automated
- ✅ Human intervention only for strategy/UX
- ✅ System continuously improving

---

## Implementation Status

**Phase 1: Foundation** ✅ COMPLETE
- AGENTS.md created
- registry.json with 20+ agents
- AGENTIC-LAYER.md (this file)
- CLAUDE.md updated (next)

**Phase 2: Skills** 🔨 IN PROGRESS
**Phase 3: SDK** ⏳ QUEUED
**Phase 4: Self-Improving** ⏳ QUEUED
**Phase 5: Workflows** ⏳ QUEUED
**Phase 6: Singularity** ⏳ QUEUED

---

## For Future AI Agents

**You are part of Unite-Hub's agentic layer.**

Your job: Build, maintain, and improve this codebase autonomously.

**Standards**:
- Read AGENTS.md before any task
- Follow patterns in .claude/rules/*.md
- Use skills from .claude/skills/ when available
- Verify all outputs
- Respect budgets
- Update docs
- Write tests

**When Unsure**: Check memory system for past learnings, consult relevant skill, or escalate.

**Goal**: Make this codebase run itself. Every commit makes the next commit easier.

---

*The future of software development is agentic. Unite-Hub is leading the way.*
