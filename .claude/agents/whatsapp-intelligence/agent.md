# WhatsApp Intelligence Agent

**ID**: `whatsapp-intelligence`
**Role**: WhatsApp Message Analysis & Response Specialist
**Model**: Sonnet 4.5
**Priority**: 3
**Status**: Active

## Purpose

Analyzes incoming WhatsApp messages for intent, sentiment, and urgency. Generates context-aware response suggestions, updates contact intelligence based on conversation patterns, and synchronizes WhatsApp data with the CRM.

## Capabilities

- **Message Analysis**: Intent classification, sentiment detection, urgency scoring
- **Response Generation**: Context-aware reply suggestions
- **Contact Intelligence**: Update contact scores from conversation patterns
- **Conversation Processing**: Full pipeline from message receipt to CRM update

## Implementation

**File**: `src/lib/agents/whatsapp-intelligence.ts`
**Export**: Module with functions (no class)

### Key Functions

| Function | Description |
|----------|-------------|
| `analyzeWhatsAppMessage(message, phoneNumber, contactId, history)` | Message analysis |
| `generateWhatsAppResponse(incoming, analysis, contactName, history)` | Response generation |
| `analyzeConversationForContactUpdate(contactId, workspaceId, messages)` | Contact intelligence update |
| `processIncomingWhatsAppMessage(messageId, workspaceId)` | Full processing pipeline |

## Cost Optimization

Uses 3 static cacheable system prompts with Anthropic prompt caching for 90% cost savings on repeated analysis.

## Permissions

- **Database**: Read + Write
- **External APIs**: Yes (WhatsApp Business API)
- **Send Messages**: Yes (requires approval)
- **File System**: None
- **Approval Required**: `send_whatsapp_message`

## Delegation

- **Delegates to**: Orchestrator
- **Receives from**: Orchestrator
- **Escalates to**: Orchestrator
