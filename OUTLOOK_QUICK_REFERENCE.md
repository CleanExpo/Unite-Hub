# Outlook Integration - Quick Reference Card

**One-page reference for developers working with Outlook integration**

---

## 🔑 Environment Variables

```env
MICROSOFT_CLIENT_ID=your-azure-app-client-id
MICROSOFT_CLIENT_SECRET=your-azure-app-client-secret
NEXT_PUBLIC_URL=http://localhost:3008
```

---

## 🔗 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/integrations/outlook/connect` | POST | Get OAuth URL |
| `/api/integrations/outlook/callback` | GET | OAuth callback |
| `/api/integrations/outlook/sync` | POST | Sync one account |
| `/api/integrations/outlook/send` | POST | Send email |
| `/api/integrations/outlook/disconnect` | POST | Deactivate account |
| `/api/integrations/outlook/accounts` | GET | List accounts |
| `/api/integrations/outlook/accounts` | POST | Manage accounts |
| `/api/integrations/outlook/calendar/events` | GET | Get events |
| `/api/integrations/outlook/calendar/create` | POST | Create event |

---

## 💻 Common Code Snippets

### Connect Account

```typescript
const response = await fetch('/api/integrations/outlook/connect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ orgId })
});
const { authUrl } = await response.json();
window.location.href = authUrl;
```

### Sync Emails

```typescript
await fetch('/api/integrations/outlook/sync', {
  method: 'POST',
  body: JSON.stringify({ integrationId })
});
```

### Send Email

```typescript
await fetch('/api/integrations/outlook/send', {
  method: 'POST',
  body: JSON.stringify({
    integrationId,
    to: 'recipient@example.com',
    subject: 'Subject',
    body: '<p>HTML body</p>'
  })
});
```

### Sync All Accounts

```typescript
await fetch('/api/integrations/outlook/accounts', {
  method: 'POST',
  body: JSON.stringify({
    action: 'sync_all',
    orgId
  })
});
```

### List Accounts

```typescript
const response = await fetch(
  `/api/integrations/outlook/accounts?orgId=${orgId}`
);
const { accounts } = await response.json();
```

### Get Calendar Events

```typescript
const response = await fetch(
  `/api/integrations/outlook/calendar/events?` +
  `integrationId=${id}&` +
  `startDate=${start.toISOString()}&` +
  `endDate=${end.toISOString()}`
);
```

### Create Calendar Event

```typescript
await fetch('/api/integrations/outlook/calendar/create', {
  method: 'POST',
  body: JSON.stringify({
    integrationId,
    subject: 'Meeting',
    start: '2025-11-20T10:00:00Z',
    end: '2025-11-20T11:00:00Z',
    attendees: ['email@example.com']
  })
});
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `src/lib/integrations/outlook.ts` | Core integration logic |
| `src/lib/services/outlook-sync.ts` | Multi-account management |
| `src/app/api/integrations/outlook/*/route.ts` | API endpoints |
| `docs/OUTLOOK_SETUP_GUIDE.md` | Azure AD setup |
| `docs/OUTLOOK_API_REFERENCE.md` | Complete API docs |
| `scripts/verify-outlook-integration.mjs` | Verification script |

---

## 🗄️ Database Fields

**Table**: `email_integrations`

| Field | Value for Outlook |
|-------|-------------------|
| `provider` | `'outlook'` |
| `account_email` | User's email address |
| `access_token` | Microsoft access token |
| `refresh_token` | Microsoft refresh token |
| `token_expires_at` | Token expiry timestamp |
| `is_active` | `true`/`false` |
| `is_primary` | `true`/`false` |
| `account_label` | Custom label (optional) |

---

## 🔧 Azure AD Permissions

**Required**:
- `openid`
- `profile`
- `email`
- `offline_access`
- `Mail.Read`
- `Mail.ReadWrite`
- `Mail.Send`

**Optional** (for calendar):
- `Calendars.Read`
- `Calendars.ReadWrite`

---

## ⚡ Quick Commands

```bash
# Verify integration
node scripts/verify-outlook-integration.mjs

# Install dependencies
npm install @microsoft/microsoft-graph-client @microsoft/microsoft-graph-types

# Start dev server
npm run dev

# Test connection (after setup)
curl -X POST http://localhost:3008/api/integrations/outlook/connect \
  -H "Content-Type: application/json" \
  -d '{"orgId":"your-org-id"}'
```

---

## 🐛 Troubleshooting

| Error | Fix |
|-------|-----|
| `unauthorized_client` | Check `MICROSOFT_CLIENT_ID`, verify redirect URI |
| `invalid_grant` | User needs to re-authorize (don't refresh during OAuth) |
| `insufficient_permissions` | Add permissions in Azure AD, grant admin consent |
| Token expired | Automatic refresh - if fails, user re-authorizes |
| Emails not syncing | Check `is_active=true`, verify token valid |

---

## 📚 Documentation

| Doc | Read Time | Purpose |
|-----|-----------|---------|
| `OUTLOOK_QUICKSTART.md` | 10 min | First-time setup |
| `OUTLOOK_SETUP_GUIDE.md` | 20 min | Complete Azure AD config |
| `OUTLOOK_API_REFERENCE.md` | Reference | API documentation |
| `OUTLOOK_INTEGRATION_SUMMARY.md` | 15 min | Architecture details |

---

## ✅ Setup Checklist

- [ ] Register Azure AD app
- [ ] Add redirect URI: `http://localhost:3008/api/integrations/outlook/callback`
- [ ] Add API permissions (see above)
- [ ] Grant admin consent
- [ ] Copy client ID and secret to `.env.local`
- [ ] Restart dev server
- [ ] Test OAuth flow
- [ ] Sync first emails

---

## 🎯 Common Tasks

**Connect new account**:
1. POST `/api/integrations/outlook/connect` with `orgId`
2. Redirect user to returned `authUrl`
3. User authorizes
4. Microsoft redirects to callback
5. Integration stored automatically

**Schedule automated sync**:
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/sync-outlook",
    "schedule": "*/15 * * * *"
  }]
}
```

**Set primary account**:
```typescript
await fetch('/api/integrations/outlook/accounts', {
  method: 'POST',
  body: JSON.stringify({
    action: 'set_primary',
    orgId,
    integrationId
  })
});
```

---

## 📞 Support

**Issues?** Check:
1. `docs/OUTLOOK_SETUP_GUIDE.md` - Troubleshooting section
2. Verify script: `node scripts/verify-outlook-integration.mjs`
3. Microsoft Graph docs: https://docs.microsoft.com/en-us/graph/

---

**Version**: 1.0.0 | **Status**: ✅ Production Ready | **Last Updated**: 2025-11-15
