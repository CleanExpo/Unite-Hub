# OAuth Providers Configuration

## Overview

This document explains how to configure OAuth providers (Google and Microsoft) for the Connected Apps system.

## Environment Variables

### Required Variables

```env
# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret
GOOGLE_OAUTH_REDIRECT_URI=https://your-domain.com/api/connected-apps/callback/google

# Microsoft OAuth
MICROSOFT_OAUTH_CLIENT_ID=your-azure-app-id
MICROSOFT_OAUTH_CLIENT_SECRET=your-azure-secret
MICROSOFT_OAUTH_REDIRECT_URI=https://your-domain.com/api/connected-apps/callback/microsoft
MICROSOFT_TENANT_ID=common  # or specific tenant ID

# Token Encryption
EMAIL_INGESTION_ENCRYPTION_KEY=your-32-byte-hex-key

# Sync Settings
EMAIL_INGESTION_DEFAULT_LOOKBACK_DAYS=90
```

### Generating Encryption Key

Generate a secure 32-byte encryption key:

```bash
# Using OpenSSL
openssl rand -hex 32

# Output example: a1b2c3d4e5f6...
```

## Google Workspace Setup

### 1. Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth client ID**
5. Select **Web application**
6. Add authorized redirect URIs:
   - Development: `http://localhost:3008/api/connected-apps/callback/google`
   - Production: `https://your-domain.com/api/connected-apps/callback/google`

### 2. Enable Required APIs

Enable these APIs in Google Cloud Console:

- Gmail API
- Google Calendar API (optional)
- Google Drive API (optional)

### 3. Configure OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**
2. Select **External** (or Internal for Google Workspace orgs)
3. Fill in app information:
   - App name
   - User support email
   - Developer contact information
4. Add scopes:
   ```
   https://www.googleapis.com/auth/gmail.readonly
   https://www.googleapis.com/auth/gmail.send
   https://www.googleapis.com/auth/gmail.labels
   https://www.googleapis.com/auth/userinfo.email
   https://www.googleapis.com/auth/userinfo.profile
   ```

### 4. Submit for Verification (Production)

For production use with external users:

1. Provide detailed justification for each scope
2. Create privacy policy and terms of service
3. Demonstrate use case in application
4. Submit for Google review (can take 4-6 weeks)

## Microsoft 365 Setup

### 1. Register Azure AD Application

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory > App registrations**
3. Click **New registration**
4. Configure:
   - Name: Your app name
   - Supported account types: Choose based on your needs
   - Redirect URI: Web - `https://your-domain.com/api/connected-apps/callback/microsoft`

### 2. Configure API Permissions

1. Go to **API permissions**
2. Click **Add a permission > Microsoft Graph**
3. Select **Delegated permissions**
4. Add:
   ```
   Mail.Read
   Mail.Send
   User.Read
   offline_access
   ```
5. Click **Grant admin consent** if you have admin rights

### 3. Create Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Set description and expiration
4. Copy the secret value immediately (shown only once)

### 4. Configure Tenant

For the `MICROSOFT_TENANT_ID`:

| Value | Use Case |
|-------|----------|
| `common` | Any Microsoft account (personal + work) |
| `organizations` | Work/school accounts only |
| `consumers` | Personal Microsoft accounts only |
| `{tenant-id}` | Specific organization only |

## Scopes Reference

### Google Scopes

| Scope | Permission | Use Case |
|-------|------------|----------|
| `gmail.readonly` | Read emails | Email sync |
| `gmail.send` | Send emails | Reply from CRM |
| `gmail.labels` | Manage labels | Organize emails |
| `calendar.readonly` | Read calendar | Meeting sync |
| `calendar.events` | Manage events | Create meetings |
| `userinfo.email` | Read email address | User identification |
| `userinfo.profile` | Read profile | User name/photo |

### Microsoft Scopes

| Scope | Permission | Use Case |
|-------|------------|----------|
| `Mail.Read` | Read emails | Email sync |
| `Mail.Send` | Send emails | Reply from CRM |
| `Calendars.Read` | Read calendar | Meeting sync |
| `Calendars.ReadWrite` | Manage calendar | Create meetings |
| `User.Read` | Read profile | User identification |
| `offline_access` | Refresh tokens | Token refresh |

## Configuration File

The provider configuration is managed in `config/connectedApps.config.ts`:

```typescript
export const connectedAppsConfig = {
  enabled: process.env.CONNECTED_APPS_ENABLED !== 'false',
  providers: {
    google: {
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI,
      scopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.labels',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
    },
    microsoft: {
      clientId: process.env.MICROSOFT_OAUTH_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_OAUTH_CLIENT_SECRET,
      redirectUri: process.env.MICROSOFT_OAUTH_REDIRECT_URI,
      tenantId: process.env.MICROSOFT_TENANT_ID || 'common',
      scopes: [
        'offline_access',
        'openid',
        'profile',
        'email',
        'Mail.Read',
        'Mail.Send',
        'User.Read',
      ],
    },
  },
};
```

## Testing Configuration

### Verify Google Setup

```bash
# Test OAuth URL generation
curl -X POST http://localhost:3008/api/connected-apps \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"provider": "google", "workspaceId": "YOUR_WORKSPACE_ID"}'
```

### Verify Microsoft Setup

```bash
# Test OAuth URL generation
curl -X POST http://localhost:3008/api/connected-apps \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"provider": "microsoft", "workspaceId": "YOUR_WORKSPACE_ID"}'
```

## Troubleshooting

### Google Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `invalid_client` | Wrong credentials | Verify client ID/secret |
| `redirect_uri_mismatch` | URI not registered | Add exact URI in Console |
| `access_denied` | User denied consent | Re-request with explanation |
| `invalid_grant` | Refresh token expired | Reconnect account |

### Microsoft Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `AADSTS700016` | App not found | Verify app ID |
| `AADSTS7000218` | Secret missing | Check client secret |
| `AADSTS65001` | Consent not granted | Grant admin consent |
| `AADSTS50011` | Reply URL mismatch | Add exact URI in Azure |

## Security Best Practices

1. **Rotate Client Secrets**: Microsoft secrets expire; set reminders
2. **Limit Scopes**: Request only permissions you need
3. **Use HTTPS**: Always use HTTPS for redirect URIs in production
4. **Monitor Usage**: Check API quotas and usage regularly
5. **Handle Revocation**: Gracefully handle token revocation

## Related Documentation

- [Connected Apps Overview](./CONNECTED_APPS_OVERVIEW.md)
- [Email Ingestion Pipeline](./EMAIL_INGESTION_PIPELINE.md)
- [Client Email Intelligence](./CLIENT_EMAIL_INTELLIGENCE.md)
