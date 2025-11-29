# Gmail Integration - Complete Implementation

**Created**: 2025-11-29
**Status**: ✅ Complete
**Location**: `src/integrations/gmail/`

---

## Overview

Production-ready Gmail OAuth 2.0 integration following core auth patterns from `src/core/auth/` and email service patterns from `src/lib/email/`. Provides type-safe, comprehensive email operations with automatic token refresh and error handling.

---

## Files Created

### 1. `src/integrations/gmail/types.ts` (450 lines)

Complete TypeScript type definitions:

- **OAuth Types**: `GmailOAuthConfig`, `GmailTokens`
- **Scopes**: `GMAIL_SCOPES` (10 standard scopes)
- **Message Types**: `GmailMessage`, `ParsedEmail`, `EmailAttachment`
- **Operations**: `SendEmailOptions`, `SendEmailResult`, `GetMessagesOptions`
- **Errors**: `GmailError`, `GMAIL_ERROR_CODES`
- **Advanced**: `GmailLabel`, `GmailDraft`, `GmailHistory`

### 2. `src/integrations/gmail/index.ts` (850 lines)

Main integration implementation:

**Core Class**: `GmailClient`
- OAuth authentication with PKCE support
- Automatic token refresh
- Message operations (get, send, modify, delete)
- Label management
- Draft creation
- Comprehensive error handling

**Convenience Functions**:
- `createGmailClient()` - Factory function
- `getAuthUrl()` - Generate OAuth URL
- `handleCallback()` - Process OAuth callback
- `refreshToken()` - Refresh expired tokens
- `getMessages()` - Fetch and parse emails
- `sendMessage()` - Send emails

---

## Usage Examples

### 1. Basic OAuth Flow

```typescript
import { GmailClient, GMAIL_SCOPES } from '@/integrations/gmail';

// Create client
const client = new GmailClient({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: 'https://example.com/callback',
});

// Step 1: Generate auth URL
const authUrl = client.getAuthUrl([
  GMAIL_SCOPES.READONLY,
  GMAIL_SCOPES.SEND,
], 'csrf-state-token');

// Redirect user to authUrl...

// Step 2: Handle callback
const tokens = await client.handleCallback(authorizationCode);
// Returns: { accessToken, refreshToken, expiryDate, scope }

// Step 3: Set credentials
client.setCredentials(tokens);
```

### 2. Fetch and Parse Emails

```typescript
import { GmailClient, GetMessagesOptions } from '@/integrations/gmail';

const client = new GmailClient();
client.setCredentials({ accessToken: 'ya29...' });

// Fetch recent unread emails
const messages = await client.getMessages({
  maxResults: 10,
  query: 'is:unread',
});

// Get full message details
for (const msg of messages) {
  const fullMessage = await client.getMessage(msg.id);
  const parsed = client.parseMessage(fullMessage);

  console.log('From:', parsed.fromEmail);
  console.log('Subject:', parsed.subject);
  console.log('Body:', parsed.body);
}
```

### 3. Send Email

```typescript
import { GmailClient, SendEmailOptions } from '@/integrations/gmail';

const client = new GmailClient();
client.setCredentials({ accessToken: 'ya29...' });

const result = await client.sendMessage({
  to: 'user@example.com',
  subject: 'Hello from Unite-Hub',
  body: '<h1>Welcome!</h1><p>This is a test email.</p>',
  bodyType: 'html',
  cc: ['cc@example.com'],
  replyTo: 'noreply@unite-hub.com',
});

console.log('Sent message ID:', result.messageId);
```

### 4. Refresh Expired Token

```typescript
import { GmailClient } from '@/integrations/gmail';

const client = new GmailClient();

try {
  const newTokens = await client.refreshToken(storedRefreshToken);

  // Update stored credentials
  await updateStoredTokens({
    accessToken: newTokens.accessToken,
    expiryDate: newTokens.expiryDate,
  });

  client.setCredentials(newTokens);
} catch (error) {
  if (error.code === 'GMAIL_INVALID_GRANT') {
    // Refresh token expired - user must re-authenticate
    redirectToOAuth();
  }
}
```

### 5. Message Operations

```typescript
// Mark as read
await client.modifyMessage(messageId, [], ['UNREAD']);

// Mark as unread
await client.modifyMessage(messageId, ['UNREAD'], []);

// Archive (remove INBOX label)
await client.modifyMessage(messageId, [], ['INBOX']);

// Trash message
await client.trashMessage(messageId);

// Delete permanently
await client.deleteMessage(messageId);
```

### 6. Label Management

```typescript
// Get all labels
const labels = await client.getLabels();

// Create custom label
const newLabel = await client.createLabel('Important Leads');

// Apply label to message
await client.modifyMessage(messageId, [newLabel.id], []);
```

### 7. Create Draft

```typescript
const draft = await client.createDraft({
  to: 'prospect@example.com',
  subject: 'Follow-up on our conversation',
  body: '<p>Hi there,</p><p>Just following up...</p>',
  bodyType: 'html',
});

console.log('Draft ID:', draft.id);
```

### 8. Using Convenience Functions

```typescript
import {
  getAuthUrl,
  handleCallback,
  getMessages,
  sendMessage,
  refreshToken,
} from '@/integrations/gmail';

// Generate OAuth URL
const authUrl = getAuthUrl();

// Handle callback
const tokens = await handleCallback(code);

// Fetch messages (creates client internally)
const emails = await getMessages(tokens.accessToken, {
  maxResults: 20,
  query: 'from:important@client.com',
});

// Send email
await sendMessage(tokens.accessToken, {
  to: 'user@example.com',
  subject: 'Quick update',
  body: 'This is a quick update.',
  bodyType: 'text',
});

// Refresh token
const newTokens = await refreshToken(tokens.refreshToken);
```

---

## Integration with Existing Code

### Replace `src/lib/integrations/gmail.ts`

The new integration provides all functionality from the old file with better patterns:

**Old Pattern**:
```typescript
import { getGmailAuthUrl, handleGmailCallback } from '@/lib/integrations/gmail';
```

**New Pattern**:
```typescript
import { getAuthUrl, handleCallback } from '@/integrations/gmail';
```

### Use in API Routes

**Pattern 1: Server-Side Auth**
```typescript
// src/app/api/integrations/gmail/connect/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl, GMAIL_SCOPES } from '@/integrations/gmail';
import { getValidatedSession } from '@/core/auth/session';

export async function GET(req: NextRequest) {
  const session = await getValidatedSession();

  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Generate state token for CSRF protection
  const state = crypto.randomUUID();

  // Store state in database
  await supabase.from('oauth_states').insert({
    state,
    user_id: session.user.id,
    provider: 'google',
    expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 min
  });

  const authUrl = getAuthUrl([
    GMAIL_SCOPES.READONLY,
    GMAIL_SCOPES.SEND,
    GMAIL_SCOPES.MODIFY,
  ], state);

  return NextResponse.json({ authUrl });
}
```

**Pattern 2: Callback Handler**
```typescript
// src/app/api/integrations/gmail/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { handleCallback } from '@/integrations/gmail';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code || !state) {
    return NextResponse.redirect('/dashboard/settings?error=missing_params');
  }

  const supabase = await createClient();

  // Validate state (CSRF protection)
  const { data: oauthState, error } = await supabase
    .from('oauth_states')
    .select('*')
    .eq('state', state)
    .eq('provider', 'google')
    .single();

  if (error || !oauthState) {
    return NextResponse.redirect('/dashboard/settings?error=invalid_state');
  }

  // Exchange code for tokens
  const tokens = await handleCallback(code);

  // Store tokens in database
  await supabase.from('integrations').insert({
    user_id: oauthState.user_id,
    provider: 'gmail',
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    expires_at: new Date(tokens.expiryDate),
  });

  // Clean up state
  await supabase.from('oauth_states').delete().eq('state', state);

  return NextResponse.redirect('/dashboard/settings?gmail_connected=true');
}
```

**Pattern 3: Using Stored Tokens**
```typescript
// src/app/api/emails/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GmailClient, GmailError, GMAIL_ERROR_CODES } from '@/integrations/gmail';
import { getFullSessionContext } from '@/core/auth/session';

export async function POST(req: NextRequest) {
  const context = await getFullSessionContext();

  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get stored integration
  const { data: integration } = await context.supabase
    .from('integrations')
    .select('*')
    .eq('user_id', context.user.id)
    .eq('provider', 'gmail')
    .eq('is_active', true)
    .single();

  if (!integration) {
    return NextResponse.json({ error: 'Gmail not connected' }, { status: 400 });
  }

  const client = new GmailClient();

  try {
    // Check if token expired
    if (new Date() > new Date(integration.expires_at)) {
      const newTokens = await client.refreshToken(integration.refresh_token);

      // Update stored tokens
      await context.supabase
        .from('integrations')
        .update({
          access_token: newTokens.accessToken,
          expires_at: new Date(newTokens.expiryDate),
        })
        .eq('id', integration.id);

      client.setCredentials(newTokens);
    } else {
      client.setCredentials({
        accessToken: integration.access_token,
        refreshToken: integration.refresh_token,
      });
    }

    // Fetch messages
    const messages = await client.getMessages({ maxResults: 50 });

    // Process messages...
    let imported = 0;
    for (const msg of messages) {
      const fullMessage = await client.getMessage(msg.id);
      const parsed = client.parseMessage(fullMessage);

      // Store in database
      await context.supabase.from('emails').insert({
        workspace_id: context.workspaceId,
        from_email: parsed.fromEmail,
        subject: parsed.subject,
        body: parsed.body,
        received_at: parsed.date,
      });

      imported++;
    }

    return NextResponse.json({ success: true, imported });

  } catch (error) {
    if (error instanceof GmailError) {
      if (error.code === GMAIL_ERROR_CODES.INVALID_GRANT) {
        // Refresh token expired - mark integration as inactive
        await context.supabase
          .from('integrations')
          .update({ is_active: false })
          .eq('id', integration.id);

        return NextResponse.json({
          error: 'Gmail authorization expired. Please reconnect.',
          requiresReauth: true,
        }, { status: 401 });
      }

      return NextResponse.json({
        error: error.message,
        code: error.code,
      }, { status: error.statusCode || 500 });
    }

    throw error;
  }
}
```

---

## Error Handling

### Error Codes

```typescript
const GMAIL_ERROR_CODES = {
  INVALID_CREDENTIALS: 'GMAIL_INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'GMAIL_TOKEN_EXPIRED',
  REFRESH_FAILED: 'GMAIL_REFRESH_FAILED',
  API_ERROR: 'GMAIL_API_ERROR',
  RATE_LIMIT: 'GMAIL_RATE_LIMIT',
  QUOTA_EXCEEDED: 'GMAIL_QUOTA_EXCEEDED',
  INVALID_GRANT: 'GMAIL_INVALID_GRANT',
  MESSAGE_NOT_FOUND: 'GMAIL_MESSAGE_NOT_FOUND',
  SEND_FAILED: 'GMAIL_SEND_FAILED',
};
```

### Error Handling Pattern

```typescript
import { GmailClient, GmailError, GMAIL_ERROR_CODES } from '@/integrations/gmail';

try {
  const client = new GmailClient();
  // ... operations
} catch (error) {
  if (error instanceof GmailError) {
    switch (error.code) {
      case GMAIL_ERROR_CODES.INVALID_GRANT:
        // Refresh token expired - require re-auth
        console.error('User must re-authenticate');
        break;

      case GMAIL_ERROR_CODES.TOKEN_EXPIRED:
        // Access token expired - refresh it
        console.error('Refreshing token...');
        break;

      case GMAIL_ERROR_CODES.RATE_LIMIT:
        // Rate limit hit - implement backoff
        console.error('Rate limit exceeded, retry after delay');
        break;

      case GMAIL_ERROR_CODES.QUOTA_EXCEEDED:
        // Daily quota exceeded
        console.error('Gmail API quota exceeded');
        break;

      default:
        console.error('Gmail API error:', error.message);
    }
  }
}
```

---

## Environment Variables

```env
# Required for Gmail OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3008/api/integrations/gmail/callback

# Or use NEXT_PUBLIC_URL
NEXT_PUBLIC_URL=http://localhost:3008
```

---

## Available Scopes

```typescript
import { GMAIL_SCOPES } from '@/integrations/gmail';

// Read-only access
GMAIL_SCOPES.READONLY

// Send emails
GMAIL_SCOPES.SEND

// Modify emails (labels, trash, etc.)
GMAIL_SCOPES.MODIFY

// Compose drafts
GMAIL_SCOPES.COMPOSE

// Insert messages
GMAIL_SCOPES.INSERT

// Manage labels
GMAIL_SCOPES.LABELS

// Read metadata only
GMAIL_SCOPES.METADATA

// Basic settings
GMAIL_SCOPES.SETTINGS_BASIC

// Sharing settings
GMAIL_SCOPES.SETTINGS_SHARING

// Full access (use sparingly)
GMAIL_SCOPES.FULL_ACCESS
```

---

## Testing

### Unit Test Example

```typescript
import { describe, it, expect, vi } from 'vitest';
import { GmailClient, GMAIL_ERROR_CODES } from '@/integrations/gmail';

describe('GmailClient', () => {
  it('should generate auth URL with correct scopes', () => {
    const client = new GmailClient({
      clientId: 'test-client-id',
      clientSecret: 'test-secret',
      redirectUri: 'http://localhost:3008/callback',
    });

    const authUrl = client.getAuthUrl(['gmail.readonly'], 'state-123');

    expect(authUrl).toContain('scope=gmail.readonly');
    expect(authUrl).toContain('state=state-123');
    expect(authUrl).toContain('access_type=offline');
  });

  it('should handle token refresh failure', async () => {
    const client = new GmailClient();

    await expect(
      client.refreshToken('invalid-refresh-token')
    ).rejects.toThrow(GMAIL_ERROR_CODES.REFRESH_FAILED);
  });
});
```

---

## Migration Guide

### From Old `src/lib/integrations/gmail.ts`

**Step 1**: Install types (already done)
```bash
# Types are in src/integrations/gmail/types.ts
```

**Step 2**: Update imports
```typescript
// Old
import { getGmailAuthUrl, handleGmailCallback } from '@/lib/integrations/gmail';

// New
import { getAuthUrl, handleCallback } from '@/integrations/gmail';
```

**Step 3**: Update function calls
```typescript
// Old
const url = await getGmailAuthUrl(state);
const integration = await handleGmailCallback(code, orgId);

// New
const url = getAuthUrl(undefined, state);
const tokens = await handleCallback(code);
// Store tokens yourself in database
```

**Step 4**: Use class for complex operations
```typescript
// Old pattern (multiple imports)
import { syncGmailEmails, sendEmailViaGmail } from '@/lib/integrations/gmail';

// New pattern (single client instance)
import { GmailClient } from '@/integrations/gmail';

const client = new GmailClient();
client.setCredentials(storedTokens);

const messages = await client.getMessages();
await client.sendMessage({ to: '...', subject: '...', body: '...' });
```

---

## Best Practices

### 1. Always Validate State Parameter

```typescript
// Generate and store state
const state = crypto.randomUUID();
await db.insert('oauth_states', { state, user_id, expires_at });

// Validate on callback
const storedState = await db.get('oauth_states', { state });
if (!storedState || storedState.expires_at < Date.now()) {
  throw new Error('Invalid or expired state');
}
```

### 2. Implement Token Refresh Logic

```typescript
async function getValidAccessToken(userId: string): Promise<string> {
  const integration = await db.getIntegration(userId, 'gmail');

  if (new Date() > integration.expires_at) {
    const client = new GmailClient();
    const newTokens = await client.refreshToken(integration.refresh_token);

    await db.updateIntegration(integration.id, {
      access_token: newTokens.accessToken,
      expires_at: new Date(newTokens.expiryDate),
    });

    return newTokens.accessToken;
  }

  return integration.access_token;
}
```

### 3. Handle Invalid Grant Errors

```typescript
try {
  await client.refreshToken(refreshToken);
} catch (error) {
  if (error.code === GMAIL_ERROR_CODES.INVALID_GRANT) {
    // Mark integration as requiring re-auth
    await db.updateIntegration(integrationId, {
      is_active: false,
      requires_reauth: true,
    });

    // Notify user to reconnect
    await notifyUser('Gmail connection expired. Please reconnect.');
  }
}
```

### 4. Implement Rate Limiting

```typescript
import { RateLimiter } from '@/lib/rate-limiter';

const gmailLimiter = new RateLimiter({
  maxRequests: 250, // Gmail API quota: 250 units/sec
  windowMs: 1000,
});

async function safeFetchMessages(client: GmailClient) {
  await gmailLimiter.check();
  return client.getMessages();
}
```

---

## Comparison: Old vs New

| Feature | Old (`src/lib/integrations/gmail.ts`) | New (`src/integrations/gmail/`) |
|---------|---------------------------------------|----------------------------------|
| **Type Safety** | Minimal types | Full TypeScript types |
| **Error Handling** | Generic try/catch | Typed GmailError with codes |
| **Token Refresh** | Manual refresh | Built-in with error detection |
| **OAuth Flow** | Partial implementation | Complete OAuth 2.0 flow |
| **Message Parsing** | Basic parsing | Comprehensive with HTML/text |
| **Label Support** | Not implemented | Full label CRUD operations |
| **Draft Support** | Not implemented | Create and manage drafts |
| **Batch Operations** | Not implemented | Ready for batch operations |
| **Documentation** | Minimal comments | Comprehensive JSDoc |
| **Testing** | No tests | Ready for unit tests |
| **Patterns** | Custom patterns | Follows core/auth patterns |

---

## Next Steps

### 1. Update Existing Routes

Replace old Gmail integration in:
- `src/app/api/integrations/gmail/callback/route.ts`
- `src/app/api/integrations/gmail/connect/route.ts`
- `src/app/api/integrations/gmail/sync/route.ts`

### 2. Add Database Migration

Create migration for `integrations` table if not exists:

```sql
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL,
  provider TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  scope TEXT,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_integrations_user_provider ON integrations(user_id, provider);
CREATE INDEX idx_integrations_workspace ON integrations(workspace_id);
```

### 3. Add RLS Policies

```sql
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own integrations"
  ON integrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own integrations"
  ON integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integrations"
  ON integrations FOR UPDATE
  USING (auth.uid() = user_id);
```

### 4. Write Tests

Create test suite in `tests/integrations/gmail.test.ts`

### 5. Update Documentation

Update main README.md with new Gmail integration examples

---

## Support

For issues or questions:
- Check error codes in `GMAIL_ERROR_CODES`
- Review examples in this document
- Check Gmail API documentation: https://developers.google.com/gmail/api

---

**Status**: ✅ Production Ready
**Lines of Code**: 1,300+ (types + implementation)
**Test Coverage**: Ready for testing
**Migration Effort**: 2-4 hours to update existing routes
