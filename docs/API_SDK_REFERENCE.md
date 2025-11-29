# Unite-Hub API SDK Reference

**Version**: 1.0.0
**Base URL**: `https://api.unite-hub.com/v1` (Production)
**Local**: `http://localhost:3008/api/v1`

---

## Authentication

All API requests require authentication via Bearer token.

```typescript
// Get session token from Supabase
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

// Include in requests
fetch('/api/v1/contacts', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
```

---

## Quick Start

### JavaScript/TypeScript SDK

```typescript
import { UniteHubClient } from '@unite-hub/sdk';

const client = new UniteHubClient({
  token: 'your-access-token',
  workspaceId: 'your-workspace-id',
});

// List contacts
const contacts = await client.contacts.list({ limit: 20 });

// Create contact
const newContact = await client.contacts.create({
  name: 'John Doe',
  email: 'john@example.com',
  company: 'Acme Inc',
});

// Update contact
await client.contacts.update(contactId, { status: 'qualified' });
```

---

## Endpoints

### Health

#### GET /api/v1/health
Check API health status.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2025-11-30T00:00:00Z"
}
```

---

### Contacts

#### GET /api/v1/contacts
List contacts with pagination and filtering.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| workspaceId | string | Yes | Workspace UUID |
| limit | number | No | Results per page (default: 20, max: 100) |
| offset | number | No | Skip records for pagination |
| status | string | No | Filter by status |
| search | string | No | Search name/email |
| minScore | number | No | Minimum AI score |

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "company": "Acme Inc",
      "status": "qualified",
      "ai_score": 85,
      "created_at": "2025-11-30T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

#### POST /api/v1/contacts
Create a new contact.

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "company": "Tech Corp",
  "phone": "+61 400 000 000",
  "source": "website",
  "tags": ["lead", "website"]
}
```

#### GET /api/v1/contacts/:id
Get contact by ID.

#### PUT /api/v1/contacts/:id
Update contact.

#### DELETE /api/v1/contacts/:id
Delete contact.

---

### Campaigns

#### GET /api/v1/campaigns
List campaigns.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| workspaceId | string | Yes | Workspace UUID |
| status | string | No | draft, active, paused, completed |
| type | string | No | one-time, drip |

#### POST /api/v1/campaigns
Create campaign.

**Request Body:**
```json
{
  "name": "Welcome Series",
  "type": "drip",
  "subject": "Welcome to {{company}}",
  "content": "<h1>Hello {{name}}</h1>",
  "trigger": {
    "type": "new_contact",
    "conditions": {}
  }
}
```

---

### Emails

#### GET /api/v1/emails
List email queue.

#### POST /api/v1/emails
Queue email for sending.

**Request Body:**
```json
{
  "to": "recipient@example.com",
  "subject": "Hello",
  "html": "<h1>Content</h1>",
  "text": "Content",
  "contactId": "contact-uuid",
  "campaignId": "campaign-uuid"
}
```

---

### AI Agents

#### POST /api/v1/agents/orchestrator
Submit task to AI orchestrator.

**Request Body:**
```json
{
  "task": "analyze_contacts",
  "params": {
    "contactIds": ["uuid1", "uuid2"],
    "analysisType": "lead_scoring"
  }
}
```

**Response:**
```json
{
  "taskId": "task-uuid",
  "status": "queued",
  "estimatedCompletion": "2025-11-30T00:01:00Z"
}
```

#### GET /api/v1/agents/orchestrator/:taskId
Check task status.

---

### SEO Enhancement

#### POST /api/seo-enhancement/audit
Run SEO audit.

**Request Body:**
```json
{
  "workspaceId": "uuid",
  "url": "https://example.com",
  "auditType": "full"
}
```

#### POST /api/seo-enhancement/schema
Generate schema markup.

**Request Body:**
```json
{
  "workspaceId": "uuid",
  "url": "https://example.com",
  "schemaType": "LocalBusiness"
}
```

---

## Rate Limits

| Tier | Requests/Minute | Burst |
|------|-----------------|-------|
| Public | 20 | 30 |
| Client | 60 | 100 |
| Staff | 120 | 200 |
| Admin | 300 | 500 |
| Agent | 500 | 1000 |

Rate limit headers returned with each response:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1701302400
```

---

## Error Handling

All errors follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "value": "invalid-email"
    }
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Invalid or missing token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid request data |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

---

## Webhooks

Configure webhooks to receive real-time notifications.

### Events

| Event | Description |
|-------|-------------|
| contact.created | New contact added |
| contact.updated | Contact modified |
| contact.scored | AI score updated |
| campaign.started | Campaign activated |
| campaign.completed | Campaign finished |
| email.sent | Email delivered |
| email.opened | Email opened |
| email.clicked | Link clicked |

### Payload Format

```json
{
  "event": "contact.created",
  "timestamp": "2025-11-30T00:00:00Z",
  "workspaceId": "uuid",
  "data": {
    "id": "contact-uuid",
    "name": "John Doe"
  }
}
```

### Webhook Security

All webhook payloads are signed with HMAC-SHA256:

```typescript
const crypto = require('crypto');

function verifyWebhook(payload: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```

---

## TypeScript Types

```typescript
interface Contact {
  id: string;
  workspace_id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
  ai_score: number;
  tags: string[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface Campaign {
  id: string;
  workspace_id: string;
  name: string;
  type: 'one-time' | 'drip';
  status: 'draft' | 'active' | 'paused' | 'completed';
  subject: string;
  content: string;
  trigger?: CampaignTrigger;
  stats: CampaignStats;
  created_at: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
```

---

## Code Examples

### Node.js

```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:3008/api/v1',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});

// List contacts
const { data } = await api.get('/contacts', {
  params: { workspaceId, limit: 20 },
});

// Create contact
await api.post('/contacts', {
  name: 'John Doe',
  email: 'john@example.com',
  workspaceId,
});
```

### Python

```python
import requests

BASE_URL = 'http://localhost:3008/api/v1'
headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json',
}

# List contacts
response = requests.get(
    f'{BASE_URL}/contacts',
    headers=headers,
    params={'workspaceId': workspace_id, 'limit': 20}
)
contacts = response.json()

# Create contact
response = requests.post(
    f'{BASE_URL}/contacts',
    headers=headers,
    json={
        'name': 'John Doe',
        'email': 'john@example.com',
        'workspaceId': workspace_id,
    }
)
```

### cURL

```bash
# List contacts
curl -X GET "http://localhost:3008/api/v1/contacts?workspaceId=xxx&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Create contact
curl -X POST "http://localhost:3008/api/v1/contacts" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","workspaceId":"xxx"}'
```

---

## Support

- **Documentation**: https://docs.unite-hub.com
- **API Status**: https://status.unite-hub.com
- **Support Email**: support@unite-group.in
- **GitHub Issues**: https://github.com/CleanExpo/Unite-Hub/issues

---

*Last updated: 2025-11-30*
