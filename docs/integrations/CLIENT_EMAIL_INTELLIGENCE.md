# Client Email Intelligence

## Overview

Client Email Intelligence aggregates and analyzes all email communication with a specific CRM client, providing AI-powered insights, extracted action items, and meeting preparation briefings.

## Features

### 1. Email Thread History

View all email conversations with a client in one place:

- Chronological thread listing
- Message count and last activity
- Participant information
- Full message content access

### 2. AI-Extracted Ideas

Automatically extracted insights from emails:

| Type | Description | Example |
|------|-------------|---------|
| `action_item` | Task to be completed | "Send the proposal by Friday" |
| `meeting_request` | Meeting/call request | "Let's schedule a call next week" |
| `deadline` | Date-bound commitment | "The deadline is January 31st" |
| `follow_up` | Follow-up needed | "I'll check back next month" |
| `opportunity` | Business opportunity | "We're also looking for X service" |
| `concern` | Risk or issue | "We're worried about the timeline" |
| `feedback` | Product/service feedback | "The last delivery was excellent" |
| `question` | Question needing answer | "What's the pricing for bulk orders?" |
| `decision_needed` | Decision to be made | "We need to decide by next week" |

### 3. Meeting Briefings

AI-generated summaries for meeting preparation:

- Communication overview
- Key topics discussed
- Pending action items
- Risk indicators
- Opportunity signals
- Suggested talking points

### 4. Communication Insights

AI analysis of communication patterns:

- Overall sentiment trend
- Key topics/themes
- Engagement level
- Response patterns

## User Interface

### Client Profile Panel

The `ClientEmailIntelligencePanel` component displays:

```
┌─────────────────────────────────────────────────────────────┐
│ Email Intelligence                              [Refresh]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │
│  │ 45 emails │ │ 8 pending │ │ 76%       │ │ Jan 12    │  │
│  │ Messages  │ │ Actions   │ │ Engaged   │ │ Last Sync │  │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘  │
│                                                             │
│  ▼ AI Communication Insights                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ This client has been actively engaged over the      │   │
│  │ past 3 months, primarily discussing project scope   │   │
│  │ and timeline adjustments...                         │   │
│  │                                                     │   │
│  │ Key Topics: [pricing] [timeline] [features]         │   │
│  │                                                     │   │
│  │ Suggested Actions:                                  │   │
│  │ ✓ Follow up on budget approval                      │   │
│  │ ✓ Send revised timeline                             │   │
│  │                                                     │   │
│  │ Risk Indicators:                                    │   │
│  │ ⚠ Concerns about timeline mentioned twice          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ▼ Pending Actions (5)                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [high] Review budget document      Due: Jan 19  [✓] │   │
│  │ [med]  Schedule follow-up call     Due: Jan 22  [✓] │   │
│  │ [low]  Send case study             No due date  [✓] │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Separate Component Views

#### Thread List (`ClientEmailThreadList`)

```tsx
<ClientEmailThreadList
  clientId="contact-123"
  onThreadSelect={(thread) => openThread(thread)}
  limit={20}
/>
```

#### Idea List (`ClientEmailIdeaList`)

```tsx
<ClientEmailIdeaList
  clientId="contact-123"
  groupByType={true}
  showFilters={true}
  onStatusChange={(id, status) => handleStatusChange(id, status)}
/>
```

#### Summary Header (`ClientEmailSummaryHeader`)

```tsx
<ClientEmailSummaryHeader
  clientId="contact-123"
  showBriefing={true}
  meetingContext="Q1 Planning Meeting"
/>
```

## API Endpoints

### Get Client Summary

```http
GET /api/email-intel/client/{clientId}/summary?workspaceId=ws-123
Authorization: Bearer {token}
```

**Response:**

```json
{
  "summary": {
    "clientId": "contact-123",
    "clientName": "John Doe",
    "totalThreads": 12,
    "totalMessages": 45,
    "totalIdeas": 23,
    "pendingIdeas": 8,
    "averageSentiment": 0.35,
    "lastEmailAt": "2024-01-15T10:00:00Z",
    "engagementScore": 76,
    "insights": {
      "summary": "Active engagement with focus on project timeline...",
      "keyTopics": ["pricing", "timeline", "features"],
      "suggestedActions": ["Follow up on budget approval"],
      "riskIndicators": ["Timeline concerns mentioned twice"],
      "opportunitySignals": ["Interest in additional services"]
    }
  },
  "meetingBriefing": {
    "clientName": "John Doe",
    "relationshipDuration": "4 months",
    "lastContactAt": "2024-01-15T10:00:00Z",
    "communicationFrequency": "Active (5-10 msgs/week)",
    "overallSentiment": "Positive",
    "engagementScore": 76,
    "keyTopics": ["pricing", "timeline"],
    "talkingPoints": [
      "8 pending action items to review",
      "2 upcoming deadlines",
      "1 potential opportunity to discuss"
    ],
    "riskIndicators": ["Timeline concerns"],
    "opportunitySignals": ["Mentioned interest in X"],
    "suggestedActions": ["Address timeline concerns first"]
  }
}
```

### Get Client Threads

```http
GET /api/email-intel/client/{clientId}/threads?workspaceId=ws-123&page=1&limit=20
Authorization: Bearer {token}
```

### Get Client Ideas

```http
GET /api/email-intel/client/{clientId}/ideas?workspaceId=ws-123&status=pending&category=action_item
Authorization: Bearer {token}
```

### Update Idea Status

```http
PATCH /api/email-intel/client/{clientId}/ideas
Authorization: Bearer {token}
Content-Type: application/json

{
  "workspaceId": "ws-123",
  "ideaId": "idea-456",
  "status": "completed"
}
```

## AI Idea Extraction

### Extraction Process

1. Email content is sent to Claude AI
2. AI analyzes for actionable items
3. Each idea is categorized and scored
4. Ideas above confidence threshold are stored

### Prompt Structure

```typescript
const extractionPrompt = `
Analyze this email and extract actionable ideas:

Subject: ${email.subject}
From: ${email.from}
Date: ${email.date}
Body: ${email.bodyText}

Extract:
1. Action items (tasks to be done)
2. Meeting requests (calls/meetings mentioned)
3. Deadlines (date-bound commitments)
4. Follow-ups (things to check back on)
5. Opportunities (business opportunities)
6. Concerns (risks or issues raised)
7. Questions (questions needing answers)
8. Decisions needed (choices to be made)

For each, provide:
- type: category from above
- title: brief description (max 100 chars)
- description: fuller context
- priority: urgent/high/medium/low
- dueDate: if mentioned (ISO format)
- confidence: 0-1 score
`;
```

### Confidence Scoring

Ideas are scored based on:

- Explicit vs implicit language
- Specificity of request
- Presence of dates/deadlines
- Action verb usage
- Context clarity

Threshold: 0.6 (configurable)

## Client Mapping

### Mapping Strategies

1. **Exact Email Match** (confidence: 1.0)
   ```typescript
   // Direct match on contact email
   SELECT * FROM contacts
   WHERE email = 'john@acme.com'
   AND workspace_id = 'ws-123'
   ```

2. **Domain Match** (confidence: 0.7)
   ```typescript
   // Match by company domain
   SELECT * FROM contacts
   WHERE company_domain = 'acme.com'
   AND workspace_id = 'ws-123'
   ```

3. **Name Similarity** (confidence: 0.5-0.9)
   ```typescript
   // Jaccard similarity on name tokens
   const similarity = calculateJaccard(
     tokenize(emailName),
     tokenize(contactName)
   );
   ```

### Manual Override

Users can manually reassign emails to different clients:

```http
POST /api/email-intel/threads/{threadId}/reassign
Authorization: Bearer {token}
Content-Type: application/json

{
  "workspaceId": "ws-123",
  "newClientId": "contact-456"
}
```

## Database Schema

### email_ideas

```sql
CREATE TABLE email_ideas (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,
  client_id UUID NOT NULL,
  thread_id UUID REFERENCES email_threads(id),
  message_id UUID REFERENCES email_messages(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  due_date TIMESTAMPTZ,
  confidence NUMERIC(3,2),
  notes TEXT,
  assigned_to UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_email_ideas_client ON email_ideas(workspace_id, client_id);
CREATE INDEX idx_email_ideas_status ON email_ideas(status) WHERE status != 'completed';
CREATE INDEX idx_email_ideas_priority ON email_ideas(priority) WHERE status = 'pending';
CREATE INDEX idx_email_ideas_due_date ON email_ideas(due_date) WHERE due_date IS NOT NULL;
```

## Orchestrator Integration

### summarise_client_ideas Intent

```typescript
// Via orchestrator
await orchestrate({
  workspaceId: 'ws-123',
  userPrompt: 'Summarize email insights for John Doe',
  context: { clientId: 'contact-456' },
});

// Response includes:
// - Client communication summary
// - Pending ideas with priorities
// - AI-generated meeting briefing
// - Suggested actions
```

## Best Practices

### For Users

1. **Regular Review**: Check pending ideas weekly
2. **Mark Complete**: Update idea status to keep list accurate
3. **Use Briefings**: Review meeting briefings before calls
4. **Manual Corrections**: Reassign misattributed emails

### For Implementation

1. **Batch Extraction**: Process ideas in batches
2. **Cache Insights**: Cache AI-generated insights (5 min TTL)
3. **Async Processing**: Extract ideas asynchronously after sync
4. **Confidence Filtering**: Only show high-confidence ideas

## Troubleshooting

### No Ideas Extracted

1. Verify `ANTHROPIC_API_KEY` is set
2. Check AI extraction is enabled in config
3. Review email content (may be too short/unclear)
4. Check confidence threshold setting

### Wrong Client Attribution

1. Verify contact email addresses are correct
2. Check company domain settings
3. Use manual reassignment for edge cases
4. Add missing contacts to CRM

### Missing Communication History

1. Ensure sync has completed
2. Check connected app status
3. Verify folder filters include relevant folders
4. Review sync logs for errors

## Related Documentation

- [Connected Apps Overview](./CONNECTED_APPS_OVERVIEW.md)
- [OAuth Providers Configuration](./OAUTH_PROVIDERS_CONFIG.md)
- [Email Ingestion Pipeline](./EMAIL_INGESTION_PIPELINE.md)
