# Cognitive Twin Agent

**ID**: `cognitive-twin`
**Role**: Business Health Monitor & Decision Simulator
**Model**: Haiku 4.5 (summaries), Sonnet 4.5 (guidance)
**Priority**: 3
**Status**: Active

## Purpose

Continuous business health monitoring across 13 business domains. Scores domain health, generates periodic digests, simulates decision outcomes, and tracks decision effectiveness over time.

## Domains Monitored

marketing, sales, delivery, finance, product, clients, engineering, operations, team, legal, partnerships, innovation, culture

## Capabilities

- **Domain Health Scoring**: 0-100 scores with trend analysis per domain
- **Decision Simulation**: Scenario modeling with projected outcomes
- **Periodic Digests**: Daily, weekly, monthly business summaries
- **Outcome Tracking**: Records decision outcomes and learns from patterns
- **Cross-Domain Risk**: Identifies risks that span multiple domains

## Implementation

**File**: `src/lib/agents/cognitiveTwinAgent.ts`
**Export**: Module with functions + singleton `cognitiveTwinAgent`

### Key Methods

| Method | Description |
|--------|-------------|
| `scoreDomainHealth(ownerUserId, domain, businessId)` | Domain health scoring |
| `getDomainSnapshot(ownerUserId, domain, businessId)` | Comprehensive domain snapshot |
| `generatePeriodicDigest(ownerUserId, digestType, businessId)` | Daily/weekly/monthly digests |
| `getDecisionGuidance(ownerUserId, decisionType, scenario, businessId)` | Decision simulation |
| `recordDecisionOutcome(decisionId, ownerUserId, selectedOptionId, outcome)` | Outcome tracking |
| `generateHealthReport(ownerUserId, businessId)` | Comprehensive health analysis |

## Permissions

- **Database**: Read + Write
- **External APIs**: No
- **Send Messages**: No
- **File System**: None

## Delegation

- **Delegates to**: Orchestrator
- **Receives from**: Orchestrator, Founder OS
- **Escalates to**: Orchestrator
