# AI Phill Agent

**ID**: `ai-phill`
**Role**: Strategic Advisor & Thinking Partner
**Model**: Opus 4.5 (Extended Thinking, 15,000-20,000 token budget)
**Priority**: 2
**Status**: Active
**Mode**: HUMAN_GOVERNED

## Purpose

Strategic advisor for founders. Facilitates deep thinking through Socratic dialogue, identifies risks and opportunities, generates business digests, and provides decision analysis frameworks.

## Capabilities

- **Strategic Dialogue**: Socratic questioning for founder reflection
- **Risk Assessment**: Business risk and opportunity evaluation
- **Journal Facilitation**: Guided reflection and journaling prompts
- **Weekly Digests**: Business performance summaries
- **Decision Analysis**: Multi-option decision frameworks with constraints

## Implementation

**File**: `src/lib/agents/aiPhillAgent.ts`
**Class**: `AiPhillAgent`
**Singleton**: `aiPhillAgent`

### Key Methods

| Method | Description |
|--------|-------------|
| `analyzeBusinessStrategy(userId, businessId, context)` | Strategic analysis with Extended Thinking |
| `facilitateJournalEntry(userId, prompt)` | Guided reflection prompts |
| `assessRisks(businessId)` | Risk/opportunity assessment |
| `generateWeeklyDigest(userId)` | Weekly business digest |
| `conductStrategicDialogue(userId, question)` | Strategic conversation support |
| `analyzeDecision(userId, decision, options, constraints)` | Decision support framework |

## Permissions

- **Database**: Read + Write
- **External APIs**: No
- **Send Messages**: No
- **File System**: None
- **Approval Required**: High-risk strategic recommendations

## Skills Required

- `STRATEGIC-ANALYSIS.md`
- `DECISION-FRAMEWORK.md`

## Delegation

- **Delegates to**: Orchestrator
- **Receives from**: Orchestrator, Founder OS
- **Escalates to**: Orchestrator

## Truth Layer

All strategic advice includes uncertainty disclosure and reasoning traces.
