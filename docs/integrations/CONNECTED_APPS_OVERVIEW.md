# Connected Apps Overview

## Introduction

The Connected Apps system enables Unite-Hub to integrate with external services like Google Workspace and Microsoft 365. This allows users to sync their emails, calendars, and other data directly into the CRM.

## Supported Providers

### Currently Available

| Provider | Services | Status |
|----------|----------|--------|
| Google Workspace | Gmail, Calendar, Drive | Active |
| Microsoft 365 | Outlook, Calendar, OneDrive | Active |

### Coming Soon

| Provider | Services | Target |
|----------|----------|--------|
| LinkedIn | Messages, Connections | Q2 2025 |
| Facebook | Messenger (Business Pages) | Q2 2025 |
| X (Twitter) | Direct Messages, Mentions | Q3 2025 |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Connected Apps                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Google    │  │  Microsoft  │  │   Future    │    │
│  │  Provider   │  │   Provider  │  │  Providers  │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
│         │                │                │            │
│         └────────────────┼────────────────┘            │
│                          │                             │
│                   ┌──────▼──────┐                      │
│                   │ OAuth Service│                      │
│                   └──────┬──────┘                      │
│                          │                             │
│                   ┌──────▼──────┐                      │
│                   │ Token Vault │ (AES-256-GCM)       │
│                   └──────┬──────┘                      │
│                          │                             │
│                   ┌──────▼──────┐                      │
│                   │  Database   │                      │
│                   │ (Supabase)  │                      │
│                   └─────────────┘                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Key Features

### 1. Secure Token Storage

All OAuth tokens are encrypted at rest using AES-256-GCM encryption. The encryption key is stored separately from the database for defense in depth.

### 2. Automatic Token Refresh

Tokens are automatically refreshed before expiration. The system monitors token expiry and proactively refreshes tokens to ensure uninterrupted access.

### 3. Workspace Isolation

Connected apps are scoped to workspaces. Each workspace can connect its own accounts, and data is isolated between workspaces through Row Level Security (RLS) policies.

### 4. Revocation Support

Users can disconnect providers at any time. Disconnection:
- Revokes tokens with the provider (when supported)
- Deletes encrypted tokens from the database
- Removes all synced data associated with the connection

## User Flow

### Connecting an Account

1. User navigates to **Founder Settings > Connected Apps**
2. User clicks "Connect" on the desired provider card
3. User is redirected to the provider's OAuth consent screen
4. User grants requested permissions
5. User is redirected back to Unite-Hub
6. Tokens are encrypted and stored
7. Initial sync begins automatically

### Disconnecting an Account

1. User navigates to **Founder Settings > Connected Apps**
2. User clicks "Disconnect" on the connected provider
3. Confirmation dialog appears
4. Upon confirmation:
   - Tokens are deleted
   - Synced data is permanently removed
   - Provider access is revoked

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/connected-apps` | GET | List all connections |
| `/api/connected-apps` | POST | Initiate OAuth flow |
| `/api/connected-apps/[id]` | GET | Get connection details |
| `/api/connected-apps/[id]` | DELETE | Disconnect provider |
| `/api/connected-apps/callback/[provider]` | GET | OAuth callback |

## Database Tables

### connected_apps

Stores the connection metadata for each provider.

```sql
CREATE TABLE connected_apps (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL,
  provider_user_id TEXT,
  provider_email TEXT,
  status TEXT DEFAULT 'active',
  active_services TEXT[],
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### oauth_tokens

Stores encrypted OAuth tokens.

```sql
CREATE TABLE oauth_tokens (
  id UUID PRIMARY KEY,
  connected_app_id UUID NOT NULL REFERENCES connected_apps(id),
  encrypted_access_token TEXT NOT NULL,
  encrypted_refresh_token TEXT,
  iv TEXT NOT NULL,
  auth_tag TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  token_type TEXT DEFAULT 'Bearer',
  scope TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Security Considerations

1. **Minimum Permissions**: Only request the scopes needed for intended functionality
2. **Token Encryption**: All tokens encrypted at rest with AES-256-GCM
3. **PKCE Flow**: Uses PKCE for enhanced OAuth security
4. **RLS Policies**: Database access controlled by Row Level Security
5. **Audit Logging**: All connection/disconnection events are logged

## Troubleshooting

### Common Issues

**"Connection Failed" error**
- Verify OAuth client credentials are correct
- Check redirect URI matches configuration
- Ensure provider app is properly configured

**"Token Expired" warning**
- Token refresh failed; reconnect the account
- Check that refresh tokens haven't been revoked

**"Access Denied" when syncing**
- User may have revoked permissions
- Scopes may have changed; reconnect required

## Related Documentation

- [OAuth Providers Configuration](./OAUTH_PROVIDERS_CONFIG.md)
- [Email Ingestion Pipeline](./EMAIL_INGESTION_PIPELINE.md)
- [Client Email Intelligence](./CLIENT_EMAIL_INTELLIGENCE.md)
