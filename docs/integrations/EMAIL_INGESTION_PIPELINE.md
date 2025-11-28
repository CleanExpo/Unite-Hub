# Email Ingestion Pipeline

## Overview

The Email Ingestion Pipeline automatically syncs emails from connected providers (Gmail, Outlook) and maps them to CRM clients. It extracts actionable insights using AI and surfaces them in client profiles.

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Email Ingestion Pipeline                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐     │
│  │   Gmail     │      │  Outlook    │      │   Future    │     │
│  │   Client    │      │   Client    │      │  Providers  │     │
│  └──────┬──────┘      └──────┬──────┘      └──────┬──────┘     │
│         │                    │                    │             │
│         └────────────────────┼────────────────────┘             │
│                              │                                  │
│                       ┌──────▼──────┐                           │
│                       │  Ingestion  │                           │
│                       │   Service   │                           │
│                       └──────┬──────┘                           │
│                              │                                  │
│              ┌───────────────┼───────────────┐                  │
│              │               │               │                  │
│       ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐          │
│       │   Thread    │ │   Message   │ │    Idea     │          │
│       │   Storage   │ │   Storage   │ │  Extractor  │          │
│       └─────────────┘ └─────────────┘ └──────┬──────┘          │
│                                              │                  │
│                                       ┌──────▼──────┐          │
│                                       │   Client    │          │
│                                       │   Mapper    │          │
│                                       └─────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Sync Types

### Initial Sync

When a provider is first connected:

- Imports last 90 days of emails (configurable via `EMAIL_INGESTION_DEFAULT_LOOKBACK_DAYS`)
- Processes all matching folders
- Extracts ideas from all messages
- Maps participants to CRM clients

### Incremental Sync

For ongoing synchronization:

- Runs every 5 minutes (configurable)
- Uses Gmail `historyId` / Microsoft `deltaLink` for efficiency
- Only fetches new or modified messages
- Minimal API calls

### Manual Sync

Triggered by user action:

- Immediate execution
- Shows progress in UI
- Can target specific client or all clients

## Configuration

### Environment Variables

```env
# Lookback period for initial sync (days)
EMAIL_INGESTION_DEFAULT_LOOKBACK_DAYS=90

# Batch size for API calls
EMAIL_INGESTION_BATCH_SIZE=50

# Polling interval (milliseconds)
EMAIL_INGESTION_POLL_INTERVAL=300000  # 5 minutes

# AI model for idea extraction
EMAIL_INGESTION_AI_MODEL=claude-haiku-4-5-20251001

# Confidence threshold for ideas (0-1)
EMAIL_INGESTION_CONFIDENCE_THRESHOLD=0.6
```

### Configuration File

Located at `config/emailIngestion.config.ts`:

```typescript
export const emailIngestionConfig = {
  enabled: process.env.EMAIL_INGESTION_ENABLED !== 'false',
  sync: {
    initialLookbackDays: 90,
    batchSize: 50,
    pollIntervalMs: 5 * 60 * 1000,
    maxThreadsPerSync: 500,
    retryAttempts: 3,
    retryDelayMs: 5000,
  },
  providerFilters: {
    google: {
      folders: ['INBOX', 'SENT'],
      excludeLabels: ['SPAM', 'TRASH', 'DRAFT'],
    },
    microsoft: {
      folders: ['inbox', 'sentitems'],
      excludeFolders: ['junkemail', 'deleteditems', 'drafts'],
    },
  },
};
```

## API Endpoints

### Trigger Sync

```http
POST /api/email-intel/sync
Content-Type: application/json
Authorization: Bearer {token}

{
  "workspaceId": "ws-123",
  "connectedAppId": "app-456",
  "syncType": "incremental",  // or "full"
  "clientId": "contact-789"   // optional: sync for specific client
}
```

**Response:**

```json
{
  "syncId": "sync-abc",
  "status": "in_progress",
  "progress": {
    "threadsSynced": 45,
    "messagesSynced": 120,
    "ideasExtracted": 23,
    "errors": []
  }
}
```

### Get Sync Logs

```http
GET /api/email-intel/sync?workspaceId=ws-123&limit=10
Authorization: Bearer {token}
```

**Response:**

```json
{
  "logs": [
    {
      "id": "log-123",
      "connectedAppId": "app-456",
      "syncType": "incremental",
      "status": "completed",
      "stats": {
        "threadsSynced": 12,
        "messagesSynced": 34,
        "ideasExtracted": 8
      },
      "createdAt": "2024-01-15T10:00:00Z",
      "completedAt": "2024-01-15T10:02:30Z"
    }
  ]
}
```

## Email Processing Flow

### Step 1: Fetch Threads

```typescript
// Gmail
const threads = await gmail.users.threads.list({
  userId: 'me',
  q: 'after:2024/01/01',
  maxResults: 50,
});

// Microsoft
const messages = await graph.get('/me/mailFolders/inbox/messages', {
  $filter: "receivedDateTime ge 2024-01-01",
  $top: 50,
});
```

### Step 2: Process Messages

For each thread/conversation:

1. Fetch full message content
2. Parse headers (from, to, cc, date)
3. Extract body text (plain + HTML)
4. Store in `email_threads` and `email_messages` tables

### Step 3: Extract Ideas

Using Claude AI:

```typescript
const ideas = await emailIdeaExtractor.extractIdeas({
  subject: message.subject,
  body: message.bodyText,
  from: message.from,
  date: message.date,
});
```

### Step 4: Map to Clients

```typescript
const mapping = await clientEmailMapper.mapParticipantToClient(
  { email: message.from.email, name: message.from.name },
  workspaceId
);

// Mapping strategies:
// 1. Exact email match (confidence: 1.0)
// 2. Domain match (confidence: 0.7)
// 3. Name similarity (confidence: 0.5-0.9)
```

## Database Schema

### email_threads

```sql
CREATE TABLE email_threads (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,
  client_id UUID,
  connected_app_id UUID NOT NULL,
  external_thread_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  subject TEXT,
  snippet TEXT,
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  participants JSONB,
  labels TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### email_messages

```sql
CREATE TABLE email_messages (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,
  thread_id UUID NOT NULL REFERENCES email_threads(id),
  external_message_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  from_address JSONB NOT NULL,
  to_addresses JSONB NOT NULL,
  cc_addresses JSONB,
  bcc_addresses JSONB,
  subject TEXT,
  snippet TEXT,
  body_text TEXT,
  body_html TEXT,
  sent_at TIMESTAMPTZ NOT NULL,
  direction TEXT,
  headers JSONB,
  attachments JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### email_sync_logs

```sql
CREATE TABLE email_sync_logs (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,
  connected_app_id UUID NOT NULL,
  sync_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  threads_synced INTEGER DEFAULT 0,
  messages_synced INTEGER DEFAULT 0,
  ideas_extracted INTEGER DEFAULT 0,
  errors JSONB,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  history_id TEXT,
  delta_link TEXT
);
```

## Error Handling

### Rate Limiting

Both Gmail and Microsoft Graph have rate limits:

```typescript
// Exponential backoff
const retryWithBackoff = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429) {
        await sleep(Math.pow(2, i) * 1000);
      } else {
        throw error;
      }
    }
  }
};
```

### Token Expiration

```typescript
// Auto-refresh before API calls
const client = await emailIngestionService.getClientWithFreshTokens(
  connectedAppId
);
```

### Sync Failures

Failed syncs are logged and can be retried:

```typescript
// Check for failed syncs
const failed = await supabase
  .from('email_sync_logs')
  .select('*')
  .eq('status', 'failed')
  .order('created_at', { ascending: false });

// Retry with fresh state
await emailIngestionService.retrySync(failedSyncId);
```

## Performance Optimization

### Batch Processing

Messages are processed in batches to optimize memory and API usage:

```typescript
const BATCH_SIZE = 50;

for (let i = 0; i < messages.length; i += BATCH_SIZE) {
  const batch = messages.slice(i, i + BATCH_SIZE);
  await Promise.all(batch.map(processMessage));
}
```

### Incremental Sync

Using provider-specific change tracking:

```typescript
// Gmail: History ID
const history = await gmail.users.history.list({
  userId: 'me',
  startHistoryId: lastHistoryId,
  historyTypes: ['messageAdded'],
});

// Microsoft: Delta Link
const delta = await graph.get(lastDeltaLink);
```

### Caching

Thread and client mappings are cached:

```typescript
const cacheKey = `client-mapping:${email}:${workspaceId}`;
const cached = await cache.get(cacheKey);

if (!cached) {
  const mapping = await mapper.map(email, workspaceId);
  await cache.set(cacheKey, mapping, { ttl: 300 }); // 5 min
}
```

## Monitoring

### Sync Metrics

Track sync performance:

- Threads synced per minute
- Messages processed per minute
- Ideas extracted per sync
- Error rate
- API quota usage

### Alerts

Configure alerts for:

- Sync failures (3+ consecutive)
- High error rate (>5%)
- Token expiration warnings
- API quota approaching limit

## Troubleshooting

### No Emails Syncing

1. Check connection status in Connected Apps
2. Verify OAuth scopes are correct
3. Check folder filters in configuration
4. Review sync logs for errors

### Missing Client Mappings

1. Verify client email addresses in CRM
2. Check mapping confidence threshold
3. Use manual mapping for edge cases

### Slow Sync Performance

1. Reduce batch size for initial sync
2. Increase poll interval
3. Check API rate limits
4. Review database indexes

## Related Documentation

- [Connected Apps Overview](./CONNECTED_APPS_OVERVIEW.md)
- [OAuth Providers Configuration](./OAUTH_PROVIDERS_CONFIG.md)
- [Client Email Intelligence](./CLIENT_EMAIL_INTELLIGENCE.md)
