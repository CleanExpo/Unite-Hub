# Client Historical Email Identity Engine

**Version**: 1.0.0
**Status**: Production Ready
**Last Updated**: 2025-11-28

## Overview

The Client Historical Email Identity Engine enables founders and staff to reconstruct client relationships from historical email communications. This system ingests 4-12 months of email history, clusters conversations by theme, builds chronological timelines, and auto-extracts actionable insights - all before clients formally onboard to the platform.

### Key Capabilities

1. **Historical Email Ingestion** - Pull emails from Gmail/Outlook via OAuth
2. **Thread Clustering** - Group messages into conversation threads with AI-powered theme classification
3. **Relationship Timeline** - Build chronological view of all client interactions
4. **Opportunity Detection** - Auto-extract tasks, promises, opportunities, decisions, and risks
5. **Pre-Client Profiles** - Create CRM-ready profiles for clients who haven't onboarded yet
6. **Conversion Pipeline** - Seamlessly convert pre-clients to full CRM contacts

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Client Historical Email Identity Engine          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   Gmail/     │───▶│   History    │───▶│   Thread     │          │
│  │   Outlook    │    │  Ingestion   │    │  Clustering  │          │
│  │   OAuth      │    │   Service    │    │   Service    │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│                              │                   │                   │
│                              ▼                   ▼                   │
│                      ┌──────────────┐    ┌──────────────┐          │
│                      │  Pre-Client  │◀───│ Relationship │          │
│                      │   Mapper     │    │   Timeline   │          │
│                      │   Service    │    │   Service    │          │
│                      └──────────────┘    └──────────────┘          │
│                              │                   │                   │
│                              ▼                   ▼                   │
│                      ┌──────────────┐    ┌──────────────┐          │
│                      │    CRM       │    │ Opportunity  │          │
│                      │  Contacts    │    │  Detector    │          │
│                      │  (Convert)   │    │   Service    │          │
│                      └──────────────┘    └──────────────┘          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `pre_clients` | Pre-system client profiles with metadata |
| `pre_client_threads` | Clustered email threads |
| `pre_client_messages` | Individual email messages |
| `pre_client_insights` | AI-extracted opportunities, tasks, questions |
| `pre_client_timeline` | Chronological relationship events |
| `pre_client_ingestion_jobs` | Background job tracking |

### Migration

Located at: `supabase/migrations/274_pre_client_historical_email_tables.sql`

All tables include:
- Workspace-level RLS policies
- Proper foreign key relationships
- Indexed columns for performance
- Automatic timestamp management

---

## Services

### 1. History Ingestion Service

**Location**: `src/lib/emailIngestion/historyIngestionService.ts`

Pulls historical emails from connected email providers.

```typescript
import { historyIngestionService } from '@/lib/emailIngestion';

// Start ingestion for a pre-client
const result = await historyIngestionService.ingestHistory({
  preClientId: 'uuid',
  workspaceId: 'uuid',
  emailAddress: 'client@example.com',
  provider: 'gmail',
  accessToken: 'oauth-token',
  monthsBack: 6, // 1-12 months
});

// Check job status
const status = await historyIngestionService.getJobStatus(jobId, workspaceId);
```

### 2. Thread Cluster Service

**Location**: `src/lib/emailIngestion/threadClusterService.ts`

Clusters messages into threads and classifies themes.

```typescript
import { threadClusterService } from '@/lib/emailIngestion';

// Cluster messages into threads
const threads = await threadClusterService.clusterMessages(
  preClientId,
  workspaceId
);

// Classify thread themes using AI
const classified = await threadClusterService.classifyThreadThemes(
  threads,
  workspaceId
);

// Get thread summary
const summary = await threadClusterService.getThreadSummary(
  preClientId,
  workspaceId
);
```

**Theme Categories**:
- `sales` - Sales discussions, pricing, quotes
- `support` - Technical support, troubleshooting
- `project` - Project work, deliverables
- `administrative` - Invoices, contracts, scheduling
- `relationship` - General relationship building
- `other` - Uncategorized

### 3. Relationship Timeline Service

**Location**: `src/lib/emailIngestion/relationshipTimelineService.ts`

Builds chronological timeline of client interactions.

```typescript
import { relationshipTimelineService } from '@/lib/emailIngestion';

// Build timeline from threads
const events = await relationshipTimelineService.buildTimeline(
  preClientId,
  workspaceId
);

// Get timeline with filters
const timeline = await relationshipTimelineService.getTimeline(
  preClientId,
  workspaceId,
  {
    eventTypes: ['first_contact', 'project_start', 'milestone'],
    significance: ['major', 'critical'],
    limit: 50,
  }
);

// Generate relationship summary
const summary = await relationshipTimelineService.generateRelationshipSummary(
  preClientId,
  workspaceId
);

// Generate AI narrative
const narrative = await relationshipTimelineService.generateRelationshipNarrative(
  preClientId,
  workspaceId
);
```

**Event Types**:
- `first_contact` - Initial communication
- `meeting_scheduled` - Meeting arrangements
- `proposal_sent` - Proposal/quote sent
- `project_start` - Project kickoff
- `milestone` - Significant achievement
- `issue_raised` - Problem reported
- `issue_resolved` - Problem fixed
- `payment_received` - Payment made
- `contract_signed` - Agreement executed
- `relationship_change` - Status change
- `custom` - Manual events

### 4. Opportunity Detector Service

**Location**: `src/lib/emailIngestion/opportunityDetectorService.ts`

Extracts actionable insights from email content.

```typescript
import { opportunityDetectorService } from '@/lib/emailIngestion';

// Process all messages and extract insights
const insights = await opportunityDetectorService.processPreClient(
  preClientId,
  workspaceId
);

// Get insights with filters
const filtered = await opportunityDetectorService.getInsights(
  preClientId,
  workspaceId,
  {
    categories: ['opportunity', 'task'],
    priorities: ['high', 'urgent'],
    statuses: ['open', 'in_progress'],
  }
);

// Generate full analysis
const analysis = await opportunityDetectorService.generateAnalysis(
  preClientId,
  workspaceId
);

// Identify cross-thread patterns
const patterns = await opportunityDetectorService.identifyCrossThreadPatterns(
  preClientId,
  workspaceId
);
```

**Insight Categories**:
- `opportunity` - Sales/upsell opportunities
- `task` - Action items to complete
- `question` - Unanswered questions
- `commitment` - Promises made
- `decision` - Decisions recorded
- `risk` - Potential issues

**Priority Levels**: `low`, `medium`, `high`, `urgent`

### 5. Pre-Client Mapper Service

**Location**: `src/lib/emailIngestion/preClientMapperService.ts`

Maps emails to profiles and handles conversion to CRM contacts.

```typescript
import { preClientMapperService } from '@/lib/emailIngestion';

// Get pre-client profile
const profile = await preClientMapperService.getPreClient(
  preClientId,
  workspaceId
);

// List pre-clients with filters
const list = await preClientMapperService.listPreClients(workspaceId, {
  status: 'analyzed',
  engagementLevel: 'hot',
  search: 'john',
  limit: 20,
});

// Create from email address
const created = await preClientMapperService.createFromEmail(
  'client@example.com',
  workspaceId,
  { extractedName: 'John Smith', company: 'Acme Inc' }
);

// Enrich profile with AI
const enriched = await preClientMapperService.enrichWithAI(
  preClientId,
  workspaceId
);

// Convert to CRM contact
const contact = await preClientMapperService.convertToContact(
  preClientId,
  workspaceId,
  {
    createTasks: true,
    importOpportunities: true,
  }
);
```

**Pre-Client Statuses**:
- `discovered` - Email address found
- `ingesting` - Processing emails
- `analyzed` - AI analysis complete
- `converted` - Now a CRM contact
- `archived` - No longer active

**Engagement Levels**: `cold`, `warm`, `hot`, `active`

---

## API Reference

### Base URL: `/api/pre-clients`

### List Pre-Clients

```http
GET /api/pre-clients?workspaceId={uuid}&status={status}&engagement={level}&search={query}
Authorization: Bearer {token}
```

**Response**:
```json
{
  "success": true,
  "profiles": [
    {
      "id": "uuid",
      "name": "John Smith",
      "email": "john@example.com",
      "company": "Acme Inc",
      "status": "analyzed",
      "totalThreads": 15,
      "totalMessages": 47,
      "firstContactDate": "2024-06-15T10:30:00Z",
      "lastContactDate": "2025-11-20T14:22:00Z",
      "sentimentScore": 0.78,
      "engagementLevel": "hot"
    }
  ],
  "total": 1
}
```

### Create Pre-Client

```http
POST /api/pre-clients
Authorization: Bearer {token}
Content-Type: application/json

{
  "workspaceId": "uuid",
  "action": "create",
  "name": "John Smith",
  "email": "john@example.com",
  "company": "Acme Inc"
}
```

### Get Pre-Client Details

```http
GET /api/pre-clients/{id}?workspaceId={uuid}
Authorization: Bearer {token}
```

### Start History Ingestion

```http
POST /api/pre-clients/{id}/ingest-history
Authorization: Bearer {token}
Content-Type: application/json

{
  "workspaceId": "uuid",
  "action": "start",
  "provider": "gmail",
  "accessToken": "oauth-token",
  "monthsBack": 6,
  "runFullPipeline": true
}
```

### Get Threads

```http
GET /api/pre-clients/{id}/threads?workspaceId={uuid}&themes=sales,project
Authorization: Bearer {token}
```

### Build Timeline

```http
POST /api/pre-clients/{id}/timeline
Authorization: Bearer {token}
Content-Type: application/json

{
  "workspaceId": "uuid",
  "action": "build"
}
```

### Get Timeline Summary

```http
POST /api/pre-clients/{id}/timeline
Authorization: Bearer {token}
Content-Type: application/json

{
  "workspaceId": "uuid",
  "action": "summary"
}
```

### Generate AI Narrative

```http
POST /api/pre-clients/{id}/timeline
Authorization: Bearer {token}
Content-Type: application/json

{
  "workspaceId": "uuid",
  "action": "narrative"
}
```

### Process Insights

```http
POST /api/pre-clients/{id}/insights
Authorization: Bearer {token}
Content-Type: application/json

{
  "workspaceId": "uuid",
  "action": "process"
}
```

### Get Opportunity Analysis

```http
POST /api/pre-clients/{id}/insights
Authorization: Bearer {token}
Content-Type: application/json

{
  "workspaceId": "uuid",
  "action": "analyze"
}
```

### Convert to Contact

```http
POST /api/pre-clients/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "workspaceId": "uuid",
  "action": "convert",
  "createTasks": true,
  "importOpportunities": true
}
```

---

## Orchestrator Intents

Three new intents are available through the orchestrator:

### 1. `ingest_pre_client_history`

Triggers historical email ingestion for a pre-client.

**Trigger phrases**:
- "Ingest historical emails for {client}"
- "Pull email history for {email}"
- "Import past conversations with {name}"

**Steps**:
1. `validate_pre_client` - Verify pre-client exists
2. `check_connected_apps` - Verify OAuth connection
3. `start_ingestion` - Begin background job
4. `monitor_progress` - Track completion

### 2. `build_pre_client_timeline`

Builds relationship timeline from email threads.

**Trigger phrases**:
- "Build timeline for {client}"
- "Create relationship history for {name}"
- "Show conversation timeline with {email}"

**Steps**:
1. `fetch_threads` - Get clustered threads
2. `extract_events` - Identify timeline events
3. `build_timeline` - Create chronological view
4. `generate_summary` - AI relationship summary

### 3. `analyze_pre_client_insights`

Extracts opportunities and insights from emails.

**Trigger phrases**:
- "Analyze opportunities with {client}"
- "Find tasks from {name}'s emails"
- "What did we promise {client}?"

**Steps**:
1. `process_messages` - Extract from all messages
2. `categorize_insights` - Sort by type
3. `identify_patterns` - Cross-thread analysis
4. `generate_recommendations` - AI suggestions

---

## Frontend Pages

### Pre-Clients Dashboard

**Route**: `/founder/pre-clients`

Features:
- Stats cards (total, hot leads, analyzed, pending)
- Search and filter controls
- Pre-client table with actions
- Create new pre-client dialog

### Pre-Client Detail Page

**Route**: `/founder/pre-clients/[id]`

Tabs:
1. **Overview** - Profile info, stats, quick actions
2. **Threads** - Email threads by theme
3. **Timeline** - Chronological events
4. **Insights** - Opportunities, tasks, questions

Actions:
- Start ingestion
- Refresh data
- Convert to contact
- Archive

---

## Configuration

### Environment Variables

```env
# Required for AI-powered features
ANTHROPIC_API_KEY=sk-ant-...

# Supabase connection
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...

# Gmail OAuth (for ingestion)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### AI Model Configuration

The engine uses these Claude models:

| Task | Model | Reasoning |
|------|-------|-----------|
| Theme classification | `claude-sonnet-4-20250514` | Balance of quality and cost |
| Timeline narrative | `claude-sonnet-4-20250514` | Quality narrative generation |
| Insight extraction | `claude-sonnet-4-20250514` | Complex analysis |
| Profile enrichment | `claude-haiku-4-20250514` | Cost-effective for simple tasks |

### Ingestion Limits

| Setting | Default | Max |
|---------|---------|-----|
| Months back | 6 | 12 |
| Messages per thread | 100 | 500 |
| Threads per client | 50 | 200 |
| Batch size | 50 | 100 |

---

## Usage Examples

### Complete Ingestion Pipeline

```typescript
import {
  historyIngestionService,
  threadClusterService,
  relationshipTimelineService,
  opportunityDetectorService,
  preClientMapperService,
} from '@/lib/emailIngestion';

async function processNewPreClient(email: string, workspaceId: string) {
  // 1. Create pre-client profile
  const preClient = await preClientMapperService.createFromEmail(
    email,
    workspaceId
  );

  // 2. Start ingestion
  const job = await historyIngestionService.ingestHistory({
    preClientId: preClient.id,
    workspaceId,
    emailAddress: email,
    provider: 'gmail',
    accessToken: await getOAuthToken(),
    monthsBack: 6,
  });

  // 3. Wait for completion
  await waitForJob(job.jobId);

  // 4. Cluster into threads
  const threads = await threadClusterService.clusterMessages(
    preClient.id,
    workspaceId
  );

  // 5. Classify themes
  await threadClusterService.classifyThreadThemes(threads, workspaceId);

  // 6. Build timeline
  await relationshipTimelineService.buildTimeline(preClient.id, workspaceId);

  // 7. Extract insights
  await opportunityDetectorService.processPreClient(preClient.id, workspaceId);

  // 8. Update status
  await preClientMapperService.updatePreClient(preClient.id, workspaceId, {
    status: 'analyzed',
  });

  return preClient;
}
```

### Converting to CRM Contact

```typescript
import { preClientMapperService } from '@/lib/emailIngestion';

async function convertPreClient(preClientId: string, workspaceId: string) {
  // Get analysis first
  const analysis = await opportunityDetectorService.generateAnalysis(
    preClientId,
    workspaceId
  );

  // Convert with options
  const result = await preClientMapperService.convertToContact(
    preClientId,
    workspaceId,
    {
      createTasks: true, // Import pending tasks
      importOpportunities: true, // Import opportunities
      setInitialScore: true, // Set AI score based on engagement
    }
  );

  console.log(`Created contact: ${result.contactId}`);
  console.log(`Created ${result.tasksCreated} tasks`);
  console.log(`Created ${result.opportunitiesImported} opportunities`);

  return result;
}
```

### Generating Relationship Report

```typescript
import {
  relationshipTimelineService,
  opportunityDetectorService,
} from '@/lib/emailIngestion';

async function generateReport(preClientId: string, workspaceId: string) {
  // Get summary
  const summary = await relationshipTimelineService.generateRelationshipSummary(
    preClientId,
    workspaceId
  );

  // Get narrative
  const narrative = await relationshipTimelineService.generateRelationshipNarrative(
    preClientId,
    workspaceId
  );

  // Get insights
  const analysis = await opportunityDetectorService.generateAnalysis(
    preClientId,
    workspaceId
  );

  // Get patterns
  const patterns = await opportunityDetectorService.identifyCrossThreadPatterns(
    preClientId,
    workspaceId
  );

  return {
    summary,
    narrative,
    analysis,
    patterns,
  };
}
```

---

## Security Considerations

### RLS Policies

All tables enforce workspace-level isolation:

```sql
CREATE POLICY "workspace_isolation" ON pre_clients
  FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM user_organizations
    WHERE user_id = auth.uid()
  ));
```

### Data Retention

- Email content is stored encrypted
- Access tokens are never persisted (session-only)
- Ingestion jobs auto-expire after 30 days
- Deleted pre-clients cascade to all related data

### Audit Trail

All operations are logged to `audit_logs`:
- Ingestion starts/completions
- Profile conversions
- Manual edits
- Data exports

---

## Troubleshooting

### Common Issues

**1. Ingestion stuck at "ingesting"**
- Check OAuth token validity
- Verify email provider connection
- Review job logs for errors

**2. No threads created**
- Ensure messages exist in `pre_client_messages`
- Check clustering threshold settings
- Verify message timestamps

**3. Timeline empty**
- Run `build` action first
- Check thread clustering completed
- Verify significance filters

**4. AI features not working**
- Verify `ANTHROPIC_API_KEY` is set
- Check API rate limits
- Review error logs

### Debug Mode

Enable verbose logging:

```typescript
// In service calls
const result = await historyIngestionService.ingestHistory({
  ...config,
  debug: true, // Enables detailed logging
});
```

---

## Performance Optimization

### Batch Processing

For large email volumes:

```typescript
// Process in batches
const batchSize = 50;
for (let offset = 0; offset < totalMessages; offset += batchSize) {
  await processMessageBatch(messages.slice(offset, offset + batchSize));
  await sleep(1000); // Rate limiting
}
```

### Caching

Timeline and insights are cached:

```typescript
// Cache key format
const cacheKey = `pre_client:${preClientId}:timeline:${workspaceId}`;

// TTL: 5 minutes for active processing, 1 hour for stable data
```

### Indexing

Recommended indexes (already in migration):

```sql
CREATE INDEX idx_pre_client_messages_date ON pre_client_messages(received_at);
CREATE INDEX idx_pre_client_timeline_date ON pre_client_timeline(event_date);
CREATE INDEX idx_pre_client_insights_category ON pre_client_insights(category, status);
```

---

## Related Documentation

- [Email Ingestion Overview](./EMAIL_INGESTION.md)
- [Orchestrator Agent Guide](./ORCHESTRATOR_AGENT.md)
- [CRM Contact Management](./CRM_CONTACTS.md)
- [Gmail OAuth Setup](./GMAIL_OAUTH_SETUP.md)

---

## Changelog

### v1.0.0 (2025-11-28)
- Initial release
- History ingestion from Gmail
- Thread clustering with AI classification
- Relationship timeline builder
- Opportunity detection engine
- Pre-client to CRM conversion
- Founder dashboard and detail pages
- 3 orchestrator intents
