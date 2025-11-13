# Unite-Hub CRM - API Routes Documentation

## Overview
Complete API documentation for Unite-Hub CRM backend routes.

**Base URL**: `https://unite-hub.vercel.app/api` (production)
**Base URL**: `http://localhost:3008/api` (development)

**Authentication**: All routes require valid session token via NextAuth.js

---

## Client Management

### Create Client
**POST** `/api/clients`

Create a new client record.

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "company": "Acme Corp",
  "phone": "+1234567890",
  "job_title": "CEO",
  "workspace_id": "uuid",
  "status": "prospect",
  "tags": ["enterprise", "hot-lead"]
}
```

**Response** (201):
```json
{
  "client": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2025-01-13T00:00:00Z"
  }
}
```

---

### Get Client Details
**GET** `/api/clients/:id`

Retrieve detailed information for a specific client.

**Response** (200):
```json
{
  "client": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "emails": [],
    "interactions": []
  }
}
```

---

### Update Client
**PUT** `/api/clients/:id`

Update client information.

**Request Body**:
```json
{
  "name": "John Smith",
  "status": "customer",
  "tags": ["vip"]
}
```

**Response** (200):
```json
{
  "client": {
    "id": "uuid",
    "name": "John Smith",
    "updated_at": "2025-01-13T00:00:00Z"
  }
}
```

---

### Delete Client
**DELETE** `/api/clients/:id`

Soft delete a client (sets status to inactive).

**Response** (200):
```json
{
  "success": true
}
```

---

### Get Organization Clients
**GET** `/api/organization/clients?workspace_id=uuid&status=active&limit=100&offset=0`

Get all clients for an organization workspace.

**Query Parameters**:
- `workspace_id` (required): Workspace UUID
- `status` (optional): Filter by status (prospect, lead, customer, inactive)
- `limit` (optional): Results per page (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response** (200):
```json
{
  "clients": [],
  "pagination": {
    "total": 150,
    "limit": 100,
    "offset": 0,
    "hasMore": true
  }
}
```

---

## Asset Management

### Upload Asset
**POST** `/api/clients/:id/assets/upload`

Upload an asset for a client (logo, photos, documents).

**Request**: `multipart/form-data`
- `file`: File to upload
- `type`: Asset type (logo, photo, document, video)
- `description`: Asset description

**Tier Limits**:
- Starter: 10MB max, 100MB total storage
- Professional: 100MB max, unlimited storage

**Response** (201):
```json
{
  "asset": {
    "id": "uuid",
    "file_name": "logo.png",
    "file_type": "image/png",
    "file_size": 1024000,
    "url": "https://storage.example.com/...",
    "created_at": "2025-01-13T00:00:00Z"
  }
}
```

---

### Get All Assets
**GET** `/api/clients/:id/assets?type=logo`

Get all assets for a client.

**Query Parameters**:
- `type` (optional): Filter by asset type

**Response** (200):
```json
{
  "assets": [],
  "total": 5
}
```

---

### Update Asset Metadata
**PUT** `/api/clients/:id/assets/:assetId`

Update asset metadata (description, tags, etc.).

**Request Body**:
```json
{
  "description": "Company logo updated 2025",
  "tags": ["primary", "brand"]
}
```

**Response** (200):
```json
{
  "asset": {
    "id": "uuid",
    "description": "Company logo updated 2025",
    "updated_at": "2025-01-13T00:00:00Z"
  }
}
```

---

### Delete Asset
**DELETE** `/api/clients/:id/assets/:assetId`

Delete an asset.

**Response** (200):
```json
{
  "success": true
}
```

---

## Persona Management

### Get Current Persona
**GET** `/api/clients/:id/persona`

Get the current persona for a client.

**Response** (200):
```json
{
  "persona": {
    "id": "uuid",
    "client_id": "uuid",
    "version": 1,
    "demographics": {
      "age_range": "25-45",
      "gender": "All",
      "location": "Urban areas"
    },
    "psychographics": {
      "interests": [],
      "values": [],
      "pain_points": []
    },
    "created_at": "2025-01-13T00:00:00Z"
  }
}
```

---

### Generate Persona
**POST** `/api/clients/:id/persona`

Generate or update client persona using AI.

**Response** (201):
```json
{
  "persona": {
    "id": "uuid",
    "status": "active",
    "version": 1
  }
}
```

---

### Get Persona History
**GET** `/api/clients/:id/persona/history?limit=10`

Get version history of persona changes.

**Response** (200):
```json
{
  "history": [
    {
      "id": "uuid",
      "version": 1,
      "created_at": "2025-01-13T00:00:00Z",
      "changes_summary": "Initial generation"
    }
  ],
  "total": 1
}
```

---

### Export Persona
**POST** `/api/clients/:id/persona/export`

Export persona as PDF, DOCX, or JSON.

**Request Body**:
```json
{
  "format": "pdf"
}
```

**Tier Limits**:
- Starter: PDF only
- Professional: PDF, DOCX, JSON

**Response** (200):
```json
{
  "export_url": "https://storage.example.com/exports/persona-uuid.pdf",
  "format": "pdf",
  "expires_at": "2025-01-13T01:00:00Z"
}
```

---

## Mind Map

### Get Mind Map
**GET** `/api/clients/:id/mindmap`

Get the mind map for a client.

**Response** (200):
```json
{
  "mindmap": {
    "id": "uuid",
    "version": 1,
    "root_node": {
      "id": "root",
      "label": "Business Name"
    },
    "nodes": [],
    "edges": []
  }
}
```

---

### Update Mind Map
**POST** `/api/clients/:id/mindmap/update`

Update the mind map structure.

**Request Body**:
```json
{
  "action": "add_node",
  "nodes": [],
  "edges": []
}
```

**Response** (200):
```json
{
  "mindmap": {
    "id": "uuid",
    "version": 2,
    "updated_at": "2025-01-13T00:00:00Z"
  }
}
```

---

### Export Mind Map
**POST** `/api/clients/:id/mindmap/export`

Export mind map as PNG, SVG, PDF, or JSON.

**Request Body**:
```json
{
  "format": "png"
}
```

**Response** (200):
```json
{
  "export_url": "https://storage.example.com/exports/mindmap-uuid.png",
  "format": "png",
  "expires_at": "2025-01-13T01:00:00Z"
}
```

---

## Marketing Strategy

### Get Strategy
**GET** `/api/clients/:id/strategy`

Get marketing strategy for a client.

**Response** (200):
```json
{
  "strategy": {
    "id": "uuid",
    "version": 1,
    "executive_summary": {
      "overview": "...",
      "key_objectives": []
    },
    "market_analysis": {},
    "channels": {
      "primary": ["LinkedIn", "Email"],
      "available_platforms": ["facebook", "instagram"]
    }
  }
}
```

---

### Generate Strategy
**POST** `/api/clients/:id/strategy`

Generate or update marketing strategy using AI.

**Response** (201):
```json
{
  "strategy": {
    "id": "uuid",
    "status": "active"
  }
}
```

---

### Get Platform Strategies
**GET** `/api/clients/:id/strategy/platforms?platform=facebook`

Get platform-specific strategies.

**Query Parameters**:
- `platform` (optional): Specific platform (facebook, instagram, tiktok, linkedin)

**Tier Limits**:
- Starter: Facebook only
- Professional: All platforms

**Response** (200):
```json
{
  "strategy": {
    "platform": "Facebook",
    "objectives": [],
    "content_types": [],
    "posting_frequency": "3-5 times per week",
    "ad_strategy": {}
  }
}
```

---

### Export Strategy
**POST** `/api/clients/:id/strategy/export`

Export strategy document.

**Request Body**:
```json
{
  "format": "pdf"
}
```

**Response** (200):
```json
{
  "export_url": "https://storage.example.com/exports/strategy-uuid.pdf",
  "format": "pdf",
  "expires_at": "2025-01-13T01:00:00Z"
}
```

---

## Campaigns

### Get All Campaigns
**GET** `/api/clients/:id/campaigns?platform=facebook&status=active`

Get all campaigns for a client.

**Query Parameters**:
- `platform` (optional): Filter by platform
- `status` (optional): Filter by status (draft, scheduled, active, completed, paused)

**Response** (200):
```json
{
  "campaigns": [
    {
      "id": "uuid",
      "name": "Q1 Brand Awareness",
      "platform": "facebook",
      "status": "active",
      "performance": {
        "impressions": 15000,
        "engagement": 450
      }
    }
  ],
  "total": 1
}
```

---

### Create Campaign
**POST** `/api/clients/:id/campaigns`

Create a new campaign.

**Request Body**:
```json
{
  "name": "Q1 Brand Awareness",
  "platform": "facebook",
  "objective": "awareness",
  "start_date": "2025-01-15",
  "end_date": "2025-03-31",
  "posts": []
}
```

**Tier Limits**:
- Starter: Facebook only
- Professional: All platforms

**Response** (201):
```json
{
  "campaign": {
    "id": "uuid",
    "name": "Q1 Brand Awareness",
    "status": "draft"
  }
}
```

---

### Update Campaign
**PUT** `/api/clients/:id/campaigns/:cid`

Update campaign details.

**Response** (200):
```json
{
  "campaign": {
    "id": "uuid",
    "updated_at": "2025-01-13T00:00:00Z"
  }
}
```

---

### Delete Campaign
**DELETE** `/api/clients/:id/campaigns/:cid`

Delete a campaign.

**Response** (200):
```json
{
  "success": true
}
```

---

### Duplicate Campaign
**POST** `/api/clients/:id/campaigns/duplicate`

Duplicate an existing campaign.

**Request Body**:
```json
{
  "campaign_id": "uuid",
  "new_name": "Q2 Brand Awareness"
}
```

**Response** (201):
```json
{
  "campaign": {
    "id": "new-uuid",
    "name": "Q2 Brand Awareness"
  }
}
```

---

## Hooks & Scripts

### Get All Hooks
**GET** `/api/clients/:id/hooks?category=attention_grabber&platform=facebook&limit=50`

Get all hooks for a client.

**Query Parameters**:
- `category` (optional): Filter by category
- `platform` (optional): Filter by platform
- `limit` (optional): Results limit (default: 50)

**Tier Limits**:
- Starter: 20 hooks max
- Professional: Unlimited

**Response** (200):
```json
{
  "hooks": [
    {
      "id": "uuid",
      "hook_text": "What if you could...",
      "script": "Full script...",
      "category": "attention_grabber",
      "platform": "facebook",
      "performance_score": 0.85
    }
  ],
  "total": 5,
  "plan_limit": 20,
  "has_unlimited_access": false
}
```

---

### Generate Hooks
**POST** `/api/clients/:id/hooks`

Generate new hooks using AI.

**Request Body**:
```json
{
  "platform": "facebook",
  "category": "curiosity",
  "count": 5
}
```

**Tier Limits**:
- Starter: 5 per generation
- Professional: 20 per generation

**Response** (201):
```json
{
  "hooks": [
    {
      "id": "uuid",
      "hook_text": "Generated hook",
      "script": "Generated script"
    }
  ]
}
```

---

### Search Hooks
**GET** `/api/hooks/search?q=growth&category=question&platform=facebook&min_score=0.7&limit=20`

Search hooks across all clients.

**Query Parameters**:
- `q` (required): Search query (min 2 characters)
- `category` (optional): Filter by category
- `platform` (optional): Filter by platform
- `min_score` (optional): Minimum performance score (0-1)
- `limit` (optional): Results limit (default: 20)

**Response** (200):
```json
{
  "results": [
    {
      "id": "uuid",
      "hook_text": "What if you could double your growth?",
      "match_score": 0.9,
      "performance_score": 0.85
    }
  ],
  "total": 1,
  "query": "growth"
}
```

---

### Toggle Favorite Hook
**POST** `/api/hooks/favorite`

Add or remove a hook from favorites.

**Request Body**:
```json
{
  "hook_id": "uuid",
  "is_favorite": true
}
```

**Response** (200):
```json
{
  "hook": {
    "id": "uuid",
    "is_favorite": true
  },
  "message": "Added to favorites"
}
```

---

### Get Favorite Hooks
**GET** `/api/hooks/favorite?client_id=uuid`

Get all favorite hooks.

**Response** (200):
```json
{
  "hooks": [],
  "total": 5
}
```

---

## Error Responses

All endpoints return standardized error responses:

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden (Tier Limit)
```json
{
  "error": "Multiple platform strategies are only available in Professional plan",
  "code": "TIER_LIMIT_EXCEEDED"
}
```

### 404 Not Found
```json
{
  "error": "Client not found"
}
```

### 400 Bad Request
```json
{
  "error": "Missing required fields: name, email",
  "code": "VALIDATION_ERROR"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to create client",
  "code": "INTERNAL_ERROR"
}
```

---

## Rate Limiting

- Standard tier: 100 requests per minute
- Professional tier: 500 requests per minute
- Enterprise tier: Unlimited

---

## Tier Feature Matrix

| Feature | Starter | Professional | Enterprise |
|---------|---------|--------------|------------|
| Clients | 1 | 1 | Unlimited |
| Email Addresses | 5 | Unlimited | Unlimited |
| Asset Storage | 100MB | Unlimited | Unlimited |
| Personas | 1 | Multiple | Unlimited |
| Platforms | Facebook | All 4 | All 4 |
| Hooks Library | 20 | Unlimited | Unlimited |
| Images/Concept | 3 | 5 | 10 |
| Export Formats | PDF | PDF, DOCX, JSON | All formats |
| API Access | No | Yes | Yes |

---

## Audit Logging

All actions are automatically logged to the audit_logs table:
- Client operations
- Asset uploads/deletions
- Persona generations
- Strategy updates
- Campaign modifications
- Hook generations

Access audit logs via the database or future admin endpoints.

---

**Last Updated**: 2025-01-13
**API Version**: 1.0
**Documentation**: Production-ready
