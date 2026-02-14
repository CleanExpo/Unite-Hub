# Pre-Client Identity Agent

**ID**: `pre-client-identity`
**Role**: Pre-Sales Intelligence & Relationship Builder
**Model**: Sonnet 4.5
**Priority**: 2
**Status**: Active

## Purpose

Pre-sales intelligence system that ingests incoming emails, identifies potential clients before they formally enter the pipeline, builds relationship timelines, and detects conversion opportunities from communication patterns.

## Capabilities

- **Pre-Client Identification**: Detect potential clients from email patterns
- **Relationship Timeline**: Build comprehensive touchpoint history
- **Opportunity Detection**: Identify buying signals and readiness indicators
- **Relationship Analysis**: Score relationship health and engagement depth
- **Email Intelligence**: Extract context, intent, and sentiment from threads

## Implementation

**File**: `src/lib/agents/preClientIdentityAgent.ts`
**Export**: Module with functions + singleton `preClientIdentityAgent`

### Key Methods

| Method | Description |
|--------|-------------|
| `processEmail(workspaceId, emailData)` | Email processing and pre-client identification |
| `buildTimeline(preClientId, workspaceId)` | Relationship timeline construction |
| `identifyOpportunity(preClientId, workspaceId)` | Opportunity identification from emails |
| `analyzeRelationship(preClientId, workspaceId)` | Relationship health analysis |
| `getPreClients(workspaceId, filters)` | Pre-client list retrieval |

## Database Tables

- `pre_clients` — Pre-client profiles
- `email_threads` — Email thread tracking
- `pre_client_insights` — AI-generated insights

## Permissions

- **Database**: Read + Write
- **External APIs**: No
- **Send Messages**: No
- **File System**: None

## Delegation

- **Delegates to**: Orchestrator, Email Agent
- **Receives from**: Orchestrator, Email Agent
- **Escalates to**: Orchestrator
