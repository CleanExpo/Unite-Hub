# Social Inbox Agent

**ID**: `social-inbox`
**Role**: Unified Social Media Inbox Manager
**Model**: Haiku 4.5 (categorization), Sonnet 4.5 (response suggestions)
**Priority**: 3
**Status**: Active
**Mode**: ADVISORY ONLY

## Purpose

Manages a unified inbox across all connected social media platforms. Provides AI-powered message categorization, response suggestions, engagement insights, and thread management.

## Capabilities

- **Unified Inbox**: Aggregate messages from Facebook, Instagram, LinkedIn, Twitter
- **Message Categorization**: AI-powered triage (inquiry, complaint, praise, spam, etc.)
- **Response Suggestions**: Context-aware draft responses (ADVISORY ONLY)
- **Engagement Insights**: Inbox statistics, response time metrics, trending topics
- **Thread Management**: Assignment, flagging, status tracking

## Implementation

**File**: `src/lib/agents/socialInboxAgent.ts`
**Export**: Module with functions + singleton `socialInboxAgent`

### Key Methods

| Method | Description |
|--------|-------------|
| `getConnectedAccounts(workspaceId)` | List connected social accounts |
| `syncSocialAccount(workspaceId, accountId, options)` | Sync messages from platform |
| `getInboxMessages(workspaceId, filters, page, limit)` | Message retrieval |
| `categorizeMessage(message)` | AI message categorization |
| `suggestResponse(message, context)` | Response suggestions |
| `getInboxInsights(workspaceId)` | Inbox statistics and recommendations |
| `batchCategorizeMessages(workspaceId, messageIds)` | Bulk categorization |

## Permissions

- **Database**: Read + Write
- **External APIs**: Yes (social platform APIs)
- **Send Messages**: No (ADVISORY ONLY — requires approval)
- **File System**: None
- **Approval Required**: `send_social_message`

## Delegation

- **Delegates to**: Orchestrator
- **Receives from**: Orchestrator
- **Escalates to**: Orchestrator
