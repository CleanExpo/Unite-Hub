# Connected Apps and Email Intelligence

## Overview

The Connected Apps and Email Intelligence system enables Unite-Hub to integrate with external email providers (Google Workspace and Microsoft 365) to sync emails, extract actionable insights using AI, and surface client communication intelligence within the CRM.

## Architecture

```
                                      ┌─────────────────────┐
                                      │   OAuth Providers   │
                                      │  (Google/Microsoft) │
                                      └──────────┬──────────┘
                                                 │
                                                 ▼
┌─────────────────┐     ┌───────────────────────────────────────┐
│  Settings Page  │────▶│         OAuth Service                 │
│  /connected-apps│     │  - generateAuthUrl()                  │
└─────────────────┘     │  - exchangeCodeForTokens()            │
                        │  - refreshAccessToken()               │
                        └───────────────────────────────────────┘
                                                 │
                                                 ▼
┌───────────────────────────────────────────────────────────────┐
│                      Token Vault                               │
│  - AES-256-GCM encryption                                      │
│  - PKCE code verifier/challenge                                │
│  - Secure token storage                                        │
└───────────────────────────────────────────────────────────────┘
                                                 │
                                                 ▼
┌───────────────────────────────────────────────────────────────┐
│                   Email Ingestion Service                      │
│  ┌─────────────────┐    ┌─────────────────────────────────┐   │
│  │  Gmail Client   │    │   Microsoft Graph Client        │   │
│  │  - listMessages │    │   - listMessages                │   │
│  │  - getThread    │    │   - syncDelta                   │   │
│  │  - syncSince    │    │   - parseMessage                │   │
│  └────────┬────────┘    └────────────────┬────────────────┘   │
│           └──────────────────────────────┘                     │
│                          │                                     │
│                          ▼                                     │
│  ┌───────────────────────────────────────────────────────┐    │
│  │              Email Idea Extractor                      │    │
│  │  - Claude AI analysis                                  │    │
│  │  - Extract: action items, deadlines, follow-ups        │    │
│  │  - Priority & confidence scoring                       │    │
│  └───────────────────────────────────────────────────────┘    │
│                          │                                     │
│                          ▼                                     │
│  ┌───────────────────────────────────────────────────────┐    │
│  │              Client Email Mapper                       │    │
│  │  - Exact email match                                   │    │
│  │  - Domain match                                        │    │
│  │  - Name similarity (Jaccard)                           │    │
│  └───────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────┘
                                                 │
                                                 ▼
┌───────────────────────────────────────────────────────────────┐
│             Client Email Intelligence Service                  │
│  - getClientEmailSummary()                                     │
│  - getClientEmailThreads()                                     │
│  - getClientIdeas()                                            │
│  - generateCommunicationInsights()                             │
│  - getClientTimeline()                                         │
└───────────────────────────────────────────────────────────────┘
```

## Configuration

### Environment Variables

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your-azure-app-id
MICROSOFT_CLIENT_SECRET=your-azure-secret
MICROSOFT_TENANT_ID=common  # or specific tenant

# Token Encryption
TOKEN_VAULT_ENCRYPTION_KEY=your-32-byte-hex-key  # Generate with: openssl rand -hex 32

# Feature Flags
CONNECTED_APPS_ENABLED=true
EMAIL_INGESTION_ENABLED=true
```

### Configuration Files

- `config/connectedApps.config.ts` - OAuth provider settings, token vault config
- `config/emailIngestion.config.ts` - Sync settings, AI extraction config

## Database Schema

### Tables Created

1. **connected_apps** - OAuth connections per workspace
2. **email_threads** - Email conversation threads
3. **email_messages** - Individual email messages
4. **email_ideas** - AI-extracted ideas/actions
5. **email_sync_logs** - Sync operation history

### Migration

Apply migration: `supabase/migrations/291_connected_apps_email_intelligence.sql`

## API Routes

### Connected Apps

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/connected-apps` | List connected apps for workspace |
| POST | `/api/connected-apps` | Initiate OAuth connection |
| GET | `/api/connected-apps/[id]` | Get specific connection |
| DELETE | `/api/connected-apps/[id]` | Disconnect and delete data |
| GET | `/api/connected-apps/callback/[provider]` | OAuth callback handler |

### Email Intelligence

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/email-intel/sync` | Trigger email sync |
| GET | `/api/email-intel/sync` | Get sync logs |
| GET | `/api/email-intel/threads` | List email threads |
| GET | `/api/email-intel/ideas` | List extracted ideas |
| PATCH | `/api/email-intel/ideas` | Update idea status |
| GET | `/api/email-intel/client/[clientId]` | Get client intelligence |
| GET | `/api/email-intel/pending-actions` | Get clients with pending actions |

## Frontend Components

### Connected Apps Settings Page

Location: `/dashboard/settings/connected-apps`

Features:
- Provider cards for Google/Microsoft
- Connect/Disconnect actions
- Manual sync trigger
- Last sync timestamp
- Active services display

### Client Email Intelligence Panel

Location: `src/components/connected-apps/ClientEmailIntelligencePanel.tsx`

Usage in CRM client profiles:
```tsx
import { ClientEmailIntelligencePanel } from '@/components/connected-apps';

<ClientEmailIntelligencePanel
  clientId={contact.id}
  compact={false}  // or true for sidebar view
/>
```

Features:
- Communication summary stats
- AI-generated insights
- Pending action items
- Mark complete functionality

## Orchestrator Intents

Three new intents are registered with the orchestrator:

### connect_app
Triggers OAuth flow for a given provider.

```typescript
await orchestrate({
  workspaceId: 'ws-123',
  userPrompt: 'Connect my Google account',
});
```

### import_client_emails
Syncs recent emails and maps them to CRM clients.

```typescript
await orchestrate({
  workspaceId: 'ws-123',
  userPrompt: 'Import client emails',
});
```

### summarise_client_ideas
Generates AI summary of extracted email ideas for a client.

```typescript
await orchestrate({
  workspaceId: 'ws-123',
  userPrompt: 'Summarize client communication insights',
  context: { clientId: 'contact-456' },
});
```

## Security

### Token Encryption

All OAuth tokens are encrypted at rest using AES-256-GCM:

```typescript
// Token storage
const encrypted = tokenVault.encryptTokens({
  accessToken: 'ya29...',
  refreshToken: '1//...',
  expiresAt: Date.now() + 3600000,
});

// Token retrieval
const tokens = tokenVault.decryptTokens(encrypted);
```

### PKCE Flow

OAuth uses PKCE (Proof Key for Code Exchange) for enhanced security:

```typescript
const codeVerifier = tokenVault.generateCodeVerifier();
const codeChallenge = tokenVault.generateCodeChallenge(codeVerifier);

// Include in auth URL
const authUrl = `${authEndpoint}?code_challenge=${codeChallenge}&code_challenge_method=S256`;
```

### OAuth Scopes

**Google Gmail**:
- `gmail.readonly` - Read emails
- `gmail.send` - Send emails
- `gmail.labels` - Manage labels

**Microsoft Graph**:
- `Mail.Read` - Read mail
- `Mail.Send` - Send mail
- `User.Read` - Read user profile

### Row Level Security

All tables have RLS policies ensuring workspace isolation:

```sql
-- Example: connected_apps table
CREATE POLICY "workspace_isolation" ON connected_apps
  FOR ALL USING (workspace_id IN (
    SELECT workspace_id FROM user_organizations
    WHERE user_id = auth.uid()
  ));
```

## Email Idea Types

The AI extractor identifies the following idea types:

| Type | Description |
|------|-------------|
| `action_item` | Task to be completed |
| `meeting_request` | Request for meeting/call |
| `deadline` | Date-bound commitment |
| `follow_up` | Need to follow up later |
| `opportunity` | Potential business opportunity |
| `concern` | Risk or issue raised |
| `feedback` | Product/service feedback |
| `question` | Question requiring response |
| `decision_needed` | Decision to be made |

## Priority Levels

Ideas are assigned priority based on AI analysis:

- **urgent** - Requires immediate attention
- **high** - Important, address soon
- **medium** - Standard priority
- **low** - Can wait

## Sync Behavior

### Initial Sync
- Imports last 90 days of emails
- Full sync of all matching folders

### Incremental Sync
- Runs every 5 minutes (configurable)
- Only fetches new/modified messages
- Uses Gmail historyId / Microsoft deltaLink

### Manual Sync
- Triggered via UI or API
- Immediate incremental sync

## Client Mapping Algorithm

Emails are mapped to CRM contacts using three strategies:

1. **Exact Email Match** (confidence: 100%)
   - Direct match on contact email address

2. **Domain Match** (confidence: 70%)
   - Company domain matches organization

3. **Name Similarity** (confidence: 50-90%)
   - Jaccard similarity on name tokens
   - Requires >50% similarity

## Usage Example

### Complete Flow

```typescript
// 1. Connect Google account
const { authUrl } = await fetch('/api/connected-apps', {
  method: 'POST',
  body: JSON.stringify({
    provider: 'google',
    workspaceId: 'ws-123',
    returnUrl: '/dashboard/settings/connected-apps',
  }),
}).then(r => r.json());

// 2. Redirect user to authUrl for OAuth consent

// 3. After callback, trigger sync
await fetch('/api/email-intel/sync', {
  method: 'POST',
  body: JSON.stringify({
    workspaceId: 'ws-123',
    connectedAppId: 'app-456',
    syncType: 'full',
  }),
});

// 4. Get client intelligence
const intel = await fetch(
  '/api/email-intel/client/contact-789?workspaceId=ws-123'
).then(r => r.json());

// 5. Display in UI
console.log(intel.summary);     // Email stats
console.log(intel.insights);    // AI insights
console.log(intel.ideas);       // Extracted actions
```

## Troubleshooting

### OAuth Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `invalid_client` | Wrong client ID/secret | Check env vars |
| `redirect_uri_mismatch` | Callback URL not registered | Add URL in provider console |
| `access_denied` | User rejected consent | Request again with explanation |

### Sync Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `token_expired` | Refresh token invalid | Reconnect account |
| `rate_limited` | Too many API calls | Wait and retry |
| `invalid_grant` | Token revoked | Reconnect account |

### Common Issues

1. **No emails syncing**: Check folder filters in config
2. **Ideas not extracting**: Verify ANTHROPIC_API_KEY is set
3. **Client mapping failing**: Check contacts have email addresses

## Performance Considerations

- **Batch Size**: 50 messages per sync batch (configurable)
- **Rate Limits**: Respects provider rate limits (exponential backoff)
- **Caching**: Thread data cached for 5 minutes
- **Parallel Processing**: Ideas extracted in parallel batches

## Future Enhancements

- [ ] Calendar integration (Google Calendar, Outlook)
- [ ] Drive/OneDrive attachment sync
- [ ] Email compose from CRM
- [ ] Real-time webhook sync (Gmail Push, Graph webhooks)
- [ ] Bulk idea assignment to team members
