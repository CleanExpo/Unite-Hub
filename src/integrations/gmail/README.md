# Gmail Integration

Production-ready Gmail OAuth 2.0 integration for Unite-Hub.

## Quick Start

```typescript
import { GmailClient, GMAIL_SCOPES } from '@/integrations/gmail';

// Create client
const client = new GmailClient();

// Get OAuth URL
const authUrl = client.getAuthUrl([GMAIL_SCOPES.READONLY, GMAIL_SCOPES.SEND]);

// Handle callback
const tokens = await client.handleCallback(code);

// Set credentials
client.setCredentials(tokens);

// Fetch messages
const messages = await client.getMessages({ maxResults: 10 });

// Send email
await client.sendMessage({
  to: 'user@example.com',
  subject: 'Hello',
  body: 'Test message',
  bodyType: 'text',
});
```

## Files

- **`types.ts`** (286 lines) - Complete TypeScript type definitions
- **`index.ts`** (799 lines) - Main implementation with GmailClient class
- **Total**: 1,085 lines of production-ready code

## Features

✅ OAuth 2.0 with PKCE support
✅ Automatic token refresh
✅ Email fetching and parsing
✅ Email sending with HTML support
✅ Message operations (read, trash, delete, modify)
✅ Label management
✅ Draft creation
✅ Comprehensive error handling
✅ Rate limiting awareness
✅ Full TypeScript type safety

## Documentation

See `docs/GMAIL_INTEGRATION_COMPLETE.md` for:
- Complete API reference
- Usage examples
- Integration patterns
- Error handling guide
- Migration from old integration
- Best practices

## Environment Variables

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3008/api/integrations/gmail/callback
```

## Example: Complete OAuth Flow

```typescript
import { GmailClient, GMAIL_SCOPES } from '@/integrations/gmail';

// Step 1: Generate auth URL
const client = new GmailClient();
const state = crypto.randomUUID();
const authUrl = client.getAuthUrl([
  GMAIL_SCOPES.READONLY,
  GMAIL_SCOPES.SEND,
], state);

// Step 2: Redirect user to authUrl
// User authorizes and is redirected back with code

// Step 3: Handle callback
const tokens = await client.handleCallback(code);

// Step 4: Store tokens securely
await db.storeTokens(userId, {
  accessToken: tokens.accessToken,
  refreshToken: tokens.refreshToken,
  expiresAt: new Date(tokens.expiryDate),
});

// Step 5: Use client
client.setCredentials(tokens);
const profile = await client.getProfile();
console.log('Connected:', profile.emailAddress);
```

## Error Handling

```typescript
import { GmailError, GMAIL_ERROR_CODES } from '@/integrations/gmail';

try {
  await client.sendMessage({ ... });
} catch (error) {
  if (error instanceof GmailError) {
    if (error.code === GMAIL_ERROR_CODES.INVALID_GRANT) {
      // Refresh token expired - require re-auth
    } else if (error.code === GMAIL_ERROR_CODES.RATE_LIMIT) {
      // Rate limit exceeded - implement backoff
    }
  }
}
```

## Testing

```typescript
import { describe, it, expect } from 'vitest';
import { GmailClient } from '@/integrations/gmail';

describe('GmailClient', () => {
  it('should generate valid auth URL', () => {
    const client = new GmailClient({
      clientId: 'test',
      clientSecret: 'test',
      redirectUri: 'http://localhost/callback',
    });

    const url = client.getAuthUrl(['gmail.readonly'], 'state-123');
    expect(url).toContain('scope=gmail.readonly');
    expect(url).toContain('state=state-123');
  });
});
```

## Architecture

Follows Unite-Hub core patterns:
- **Auth patterns**: `src/core/auth/`
- **Email patterns**: `src/lib/email/email-service.ts`
- **Type safety**: Full TypeScript coverage
- **Error handling**: Custom GmailError class with error codes
- **Security**: PKCE OAuth flow support

## Status

✅ **Production Ready**
- 1,085 lines of code
- Full type coverage
- Comprehensive error handling
- Ready for integration testing
- Documentation complete
