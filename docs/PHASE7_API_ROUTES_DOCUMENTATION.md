# Phase 7 API Routes Documentation

**Date**: 2025-11-19
**Branch**: `feature/phase7-api-routes`
**Purpose**: Complete backend infrastructure for SEO/GEO Autonomous Operating System

---

## Overview

This documentation covers all API endpoints implemented in Week 18 of Phase 7. These endpoints connect the UI Shell, Intelligence Layer, Autonomy Engine, Client Storage System, GEO Targeting Engine, and DataForSEO services.

**Total Endpoints**: 13
**Categories**: 6 (Client Management, Folder Management, Audit Operations, Reporting, Credential Vault, Autonomy Engine)

---

## Authentication

All endpoints require authentication using one of these methods:

### Method 1: Bearer Token (Recommended for Client-Side)
```typescript
const response = await fetch("/api/endpoint", {
  headers: {
    "Authorization": `Bearer ${session.access_token}`,
    "Content-Type": "application/json"
  }
});
```

### Method 2: Server-Side Authentication
For server-side calls, authentication is handled automatically through Next.js server components using `getSupabaseServer()`.

---

## 1. Client Management Endpoints

### 1.1 POST /api/client/init

**Purpose**: Create new client profile, provision Docker folders, register subscription tier.

**Request Body**:
```typescript
{
  domain: string;              // e.g., "example.com"
  business_name: string;       // e.g., "Example Corp"
  tier: "Free" | "Starter" | "Pro" | "Enterprise";
  geo_radius: 3 | 5 | 10 | 15 | 20 | 25 | 50;  // km
  owner_email: string;         // e.g., "owner@example.com"
}
```

**Response** (200 OK):
```typescript
{
  clientId: string;            // UUID
  domain: string;
  businessName: string;
  tier: string;
  geoRadius: number;
  costMultiplier: number;      // 1.0 to 2.0
  folderPaths: string[];       // Array of 7 folder paths
  message: string;
}
```

**Error Responses**:
- `400`: Missing required fields or invalid values
- `401`: Unauthorized
- `409`: Client with this domain already exists
- `500`: Server error

**Example Usage**:
```typescript
const response = await fetch("/api/client/init", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    domain: "example.com",
    business_name: "Example Corp",
    tier: "Pro",
    geo_radius: 10,
    owner_email: "owner@example.com"
  })
});

const data = await response.json();
console.log("Client ID:", data.clientId);
console.log("Folders created:", data.folderPaths);
```

---

### 1.2 POST /api/client/geo

**Purpose**: Update GEO radius, calculate new cost multiplier, trigger recalculation if radius increases.

**Request Body**:
```typescript
{
  clientId: string;            // UUID
  geo_radius: 3 | 5 | 10 | 15 | 20 | 25 | 50;  // km
}
```

**Response** (200 OK):
```typescript
{
  clientId: string;
  domain: string;
  geoRadius: number;
  costMultiplier: number;      // Updated multiplier
  radiusIncreased: boolean;    // Whether radius was increased
  affectedSuburbs: string[];   // New suburbs in range (if increased)
  message: string;
}
```

**Error Responses**:
- `400`: Missing required fields or invalid radius
- `401`: Unauthorized
- `403`: Radius not allowed for current tier
- `404`: Client not found
- `500`: Server error

**Tier Limits**:
- **Free**: 3, 5 km
- **Starter**: 3, 5, 10 km
- **Pro**: 3, 5, 10, 15, 20 km
- **Enterprise**: 3, 5, 10, 15, 20, 25, 50 km

**Example Usage**:
```typescript
const response = await fetch("/api/client/geo", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    clientId: "client-uuid",
    geo_radius: 20
  })
});

const data = await response.json();
if (data.radiusIncreased) {
  console.log("New suburbs:", data.affectedSuburbs);
}
```

---

## 2. Folder Management Endpoints

### 2.1 POST /api/folder/create

**Purpose**: Create a new subfolder inside the client's Docker volume.

**Request Body**:
```typescript
{
  clientId: string;
  folderType: "audits" | "snapshots" | "competitors" | "keywords" | "backlinks" | "geo" | "reports";
}
```

**Response** (200 OK):
```typescript
{
  status: "success";
  path: string;                // Full path to created folder
  clientId: string;
  folderType: string;
  message: string;
}
```

**Error Responses**:
- `400`: Missing required fields or invalid folder type
- `401`: Unauthorized
- `404`: Client not found
- `409`: Folder already exists
- `500`: Server error

---

### 2.2 GET /api/folder/list

**Purpose**: List all files inside a client folder.

**Query Parameters**:
```typescript
?clientId=string&folderType=string
```

**Response** (200 OK):
```typescript
{
  clientId: string;
  folderType: string;
  files: string[];             // Array of filenames
  count: number;
}
```

**Example Usage**:
```typescript
const response = await fetch(
  `/api/folder/list?clientId=${clientId}&folderType=audits`,
  {
    headers: { "Authorization": `Bearer ${token}` }
  }
);

const data = await response.json();
console.log("Audit files:", data.files);
```

---

### 2.3 POST /api/folder/archive

**Purpose**: Move files older than X days (default 365) into `/archive/`.

**Request Body**:
```typescript
{
  clientId: string;
  days?: number;               // Optional, defaults to 365
}
```

**Response** (200 OK):
```typescript
{
  clientId: string;
  domain: string;
  archived: number;            // Count of archived files
  retentionDays: number;
  message: string;
}
```

**Example Usage**:
```typescript
// Archive files older than 365 days
const response = await fetch("/api/folder/archive", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    clientId: "client-uuid"
  })
});

const data = await response.json();
console.log(`Archived ${data.archived} files`);
```

---

## 3. Audit Operations Endpoints

### 3.1 POST /api/audit/run

**Purpose**: Run full SEO/GEO audit based on tier, call DataForSEO MCP, GSC, Bing, Brave, and generate reports.

**Request Body**:
```typescript
{
  clientId: string;
  domain: string;
  tier: string;
  geo_radius: number;
  force?: boolean;             // Override 24-hour cooldown
}
```

**Response** (200 OK):
```typescript
{
  auditId: string;             // UUID
  clientId: string;
  domain: string;
  healthScore: number;         // 0-100
  reports: string[];           // Array of report file paths
  folder: string;              // Base folder path
  message: string;
}
```

**Error Responses**:
- `400`: Missing required fields
- `401`: Unauthorized
- `404`: Client not found
- `429`: Audit already run in last 24 hours (use force=true to override)
- `500`: Audit execution failed

**Audit Process**:
1. Validates client and checks for recent audits
2. Builds audit configuration based on tier
3. Executes audit engine with DataForSEO + GSC + Bing + Brave
4. Generates 4 reports:
   - **CSV**: Raw data
   - **MD**: Plain-English summary
   - **HTML**: Dashboard with images
   - **JSON**: Structured data
5. Saves reports to client's Docker volume
6. Returns audit ID and file paths

**Example Usage**:
```typescript
const response = await fetch("/api/audit/run", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    clientId: "client-uuid",
    domain: "example.com",
    tier: "Pro",
    geo_radius: 10
  })
});

const data = await response.json();
console.log("Health Score:", data.healthScore);
console.log("Reports:", data.reports);
```

---

### 3.2 POST /api/audit/snapshot

**Purpose**: Generate weekly snapshot (Starter+) or monthly (Free).

**Request Body**:
```typescript
{
  clientId: string;
}
```

**Response** (200 OK):
```typescript
{
  snapshotId: string;          // UUID
  clientId: string;
  path: string;                // Path to HTML snapshot
  healthScore: number;         // 0-100
  message: string;
}
```

**Error Responses**:
- `400`: Missing required field or no completed audit found
- `401`: Unauthorized
- `404`: Client not found
- `429`: Snapshot already generated in retention period
- `500`: Server error

**Snapshot Frequency by Tier**:
- **Free**: Monthly (30 days)
- **Starter**: Weekly (7 days)
- **Pro**: Weekly (7 days)
- **Enterprise**: Weekly (7 days)

---

### 3.3 GET /api/audit/history

**Purpose**: List all audits performed for the client.

**Query Parameters**:
```typescript
?clientId=string
```

**Response** (200 OK):
```typescript
{
  clientId: string;
  domain: string;
  history: Array<{
    auditId: string;
    type: "full" | "snapshot";
    status: "queued" | "running" | "completed" | "failed";
    healthScore?: number;
    date: string;              // ISO timestamp
    completedAt?: string;
    paths: string[];           // Report file paths
    error?: string;
  }>;
  count: number;
}
```

**Example Usage**:
```typescript
const response = await fetch(
  `/api/audit/history?clientId=${clientId}`,
  {
    headers: { "Authorization": `Bearer ${token}` }
  }
);

const data = await response.json();
data.history.forEach(audit => {
  console.log(`${audit.date}: ${audit.type} - Score: ${audit.healthScore}`);
});
```

---

## 4. Reporting Endpoint

### 4.1 GET /api/report/get

**Purpose**: Retrieve any stored audit or snapshot report.

**Query Parameters**:
```typescript
?clientId=string&filename=string&category=string (optional)
```

**Response** (200 OK):
- Content-Type: `text/html`, `text/csv`, `text/markdown`, or `application/json`
- Content-Disposition: `inline; filename="..."`
- Headers:
  - `X-Client-Id`: Client UUID
  - `X-Category`: Report category

**Error Responses**:
- `400`: Missing required parameters
- `401`: Unauthorized
- `404`: Client or report not found
- `500`: Server error

**Example Usage**:
```typescript
// Download HTML report
const response = await fetch(
  `/api/report/get?clientId=${clientId}&filename=20250119_dashboard.html`,
  {
    headers: { "Authorization": `Bearer ${token}` }
  }
);

const html = await response.text();
document.getElementById("report-container").innerHTML = html;
```

---

## 5. Credential Vault Endpoints

### 5.1 POST /api/vault/save

**Purpose**: Save encrypted credentials using AES-256-GCM.

**Request Body**:
```typescript
{
  clientId: string;
  type: "website_login" | "social_media_api" | "gsc_oauth" | "bing_api" | "brave_api" | "dataforseo_api" | "custom";
  payload: any;                // Credential data (will be encrypted)
  label?: string;              // Optional user-friendly name
}
```

**Response** (200 OK):
```typescript
{
  status: "saved";
  credentialId: string;        // UUID
  clientId: string;
  type: string;
  label: string;
  message: string;
}
```

**Security Features**:
- AES-256-GCM encryption
- Zero-knowledge (staff cannot view plaintext)
- Audit trail for all access
- Per-organization encryption keys

**Example Usage**:
```typescript
const response = await fetch("/api/vault/save", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    clientId: "client-uuid",
    type: "gsc_oauth",
    payload: {
      access_token: "ya29.xxx",
      refresh_token: "1//xxx",
      expires_at: "2025-12-31T23:59:59Z"
    },
    label: "Google Search Console OAuth"
  })
});

const data = await response.json();
console.log("Credential ID:", data.credentialId);
```

---

### 5.2 GET /api/vault/get

**Purpose**: Retrieve and decrypt credentials (server-side only).

**Query Parameters**:
```typescript
?clientId=string&type=string
```

**Response** (200 OK):
```typescript
{
  clientId: string;
  type: string;
  label: string;
  payload: any;                // Decrypted credential data
  message: string;
}
```

**Error Responses**:
- `400`: Missing required parameters
- `401`: Unauthorized
- `404`: Client or credential not found
- `500`: Decryption failed

**Example Usage**:
```typescript
const response = await fetch(
  `/api/vault/get?clientId=${clientId}&type=gsc_oauth`,
  {
    headers: { "Authorization": `Bearer ${token}` }
  }
);

const data = await response.json();
const accessToken = data.payload.access_token;
```

---

## 6. Autonomy Engine Endpoints

### 6.1 POST /api/autonomy/queue

**Purpose**: Add audit or snapshot task to BullMQ with priority.

**Request Body**:
```typescript
{
  clientId: string;
  task: "onboarding" | "snapshot" | "geo" | "full_audit";
  priority?: number;           // Optional, auto-calculated based on tier
}
```

**Response** (200 OK):
```typescript
{
  queueId: string;             // UUID
  clientId: string;
  task: string;
  priority: number;            // 1 (highest) to 5 (lowest)
  status: "queued";
  message: string;
}
```

**Priority Levels**:
- **1**: Onboarding tasks (highest priority)
- **2**: Enterprise tier
- **3**: Pro tier
- **4**: Starter tier
- **5**: Free tier (default)

**Example Usage**:
```typescript
const response = await fetch("/api/autonomy/queue", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    clientId: "client-uuid",
    task: "full_audit"
  })
});

const data = await response.json();
console.log("Queue ID:", data.queueId);
console.log("Priority:", data.priority);
```

---

### 6.2 GET /api/autonomy/status

**Purpose**: Return current queue status for background tasks.

**Query Parameters**:
```typescript
?jobId=string
```

**Response** (200 OK):
```typescript
{
  jobId: string;
  clientId: string;
  taskType: string;
  status: "queued" | "processing" | "complete" | "failed";
  priority: number;
  createdAt: string;           // ISO timestamp
  startedAt?: string;
  completedAt?: string;
  estimatedCompletion?: string; // ISO timestamp (if processing)
  error?: string;
  result?: object;             // Task result (if complete)
}
```

**Example Usage**:
```typescript
const response = await fetch(
  `/api/autonomy/status?jobId=${queueId}`,
  {
    headers: { "Authorization": `Bearer ${token}` }
  }
);

const data = await response.json();
console.log("Status:", data.status);

if (data.status === "processing") {
  console.log("ETA:", data.estimatedCompletion);
}

if (data.status === "complete") {
  console.log("Result:", data.result);
}
```

---

## Error Handling

All endpoints follow a consistent error response format:

```typescript
{
  error: string;               // Human-readable error message
  // Additional context (varies by endpoint)
}
```

**HTTP Status Codes**:
- `200`: Success
- `400`: Bad Request (invalid input)
- `401`: Unauthorized (authentication failed)
- `403`: Forbidden (tier limit exceeded)
- `404`: Not Found (resource doesn't exist)
- `409`: Conflict (duplicate resource)
- `429`: Too Many Requests (rate limit or cooldown)
- `500`: Internal Server Error

---

## Rate Limiting

### Audit Operations
- **Full Audits**: 1 per 24 hours per client (unless `force=true`)
- **Snapshots**: Based on tier frequency (7-30 days)

### Tier Execution Limits
From `execution_limits` in spec:

| Tier | Audits/Month |
|------|--------------|
| Free | 1 |
| Starter | 4 |
| Pro | 12 |
| Enterprise | 30 |

---

## Database Tables Used

### Core Tables
- **seo_client_profiles**: Client metadata, tier, GEO radius
- **seo_audit_history**: Audit records and results
- **client_storage_audit**: File operations audit trail
- **autonomy_queue**: Background task queue

### Security Tables
- **credential_vault**: Encrypted credentials
- **credential_vault_audit_log**: Credential access audit
- **encryption_keys**: Organization encryption keys

---

## Testing Endpoints

### Quick Test Suite

```bash
# 1. Initialize client
curl -X POST http://localhost:3008/api/client/init \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "test.com",
    "business_name": "Test Corp",
    "tier": "Pro",
    "geo_radius": 10,
    "owner_email": "test@test.com"
  }'

# 2. List folders
curl -X GET "http://localhost:3008/api/folder/list?clientId=${CLIENT_ID}&folderType=audits" \
  -H "Authorization: Bearer ${TOKEN}"

# 3. Queue audit
curl -X POST http://localhost:3008/api/autonomy/queue \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "'${CLIENT_ID}'",
    "task": "full_audit"
  }'

# 4. Check status
curl -X GET "http://localhost:3008/api/autonomy/status?jobId=${QUEUE_ID}" \
  -H "Authorization: Bearer ${TOKEN}"
```

---

## Next Steps

### Week 19: GEO Onboarding UI
- Create `/client/onboarding/seo-geo` page
- Implement GEO questionnaire form components
- Integrate Google Maps Geocoding API
- Add radius selector with cost preview

### Week 20: Report Generation & Testing
- Create HTML report templates with Jina AI images
- Implement end-to-end report generation workflow
- Test DataForSEO MCP integration
- Test automatic archiving after 365 days

---

**Status**: ✅ **13 Endpoints Implemented**
**Branch**: `feature/phase7-api-routes`
**Ready For**: UI integration and end-to-end testing
