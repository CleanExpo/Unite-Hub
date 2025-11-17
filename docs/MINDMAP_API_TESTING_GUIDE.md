# Mindmap API Testing Guide

**Version:** 1.0
**Date:** 2025-01-17
**Purpose:** Complete guide for testing all Mindmap API endpoints

---

## Table of Contents

1. [Setup](#setup)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Testing Scenarios](#testing-scenarios)
5. [Troubleshooting](#troubleshooting)
6. [Automated Testing](#automated-testing)

---

## Setup

### Prerequisites

- Unite-Hub running locally on port 3008
- Supabase project configured
- Valid user account with authentication

### Environment Variables

Ensure these are set in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=sk-ant-your-key
```

### Get Authentication Token

```bash
# Method 1: From Browser DevTools
# 1. Log in to Unite-Hub
# 2. Open DevTools → Application → Local Storage
# 3. Find 'supabase.auth.token'
# 4. Copy the access_token value

# Method 2: Using Supabase CLI
supabase auth login
```

---

## Authentication

All API endpoints require authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Example:**
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
     http://localhost:3008/api/projects/PROJECT_ID/mindmap
```

---

## API Endpoints

### 1. Get/Create Project Mindmap

**Endpoint:** `GET /api/projects/[projectId]/mindmap`

**Description:** Gets existing mindmap or creates new one for a project

**Request:**
```bash
curl -X GET \
  "http://localhost:3008/api/projects/{PROJECT_ID}/mindmap" \
  -H "Authorization: Bearer {TOKEN}"
```

**Response (200):**
```json
{
  "mindmap": {
    "id": "uuid",
    "project_id": "uuid",
    "workspace_id": "uuid",
    "org_id": "uuid",
    "version": 1,
    "created_at": "2025-01-17T00:00:00Z"
  },
  "nodes": [
    {
      "id": "uuid",
      "mindmap_id": "uuid",
      "parent_id": null,
      "node_type": "project_root",
      "label": "Project Name",
      "description": "Project description",
      "position_x": 0,
      "position_y": 0,
      "status": "in_progress",
      "priority": 10
    }
  ],
  "connections": [],
  "suggestions": []
}
```

**Test:**
```bash
# Save PROJECT_ID from your database
PROJECT_ID="your-project-uuid"
TOKEN="your-access-token"

curl -X GET \
  "http://localhost:3008/api/projects/$PROJECT_ID/mindmap" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'
```

---

### 2. Create Node

**Endpoint:** `POST /api/mindmap/[mindmapId]/nodes`

**Description:** Creates a new node in the mindmap

**Request:**
```bash
curl -X POST \
  "http://localhost:3008/api/mindmap/{MINDMAP_ID}/nodes" \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "node_type": "feature",
    "label": "User Authentication",
    "description": "Login and signup functionality",
    "position_x": 200,
    "position_y": 100,
    "status": "pending",
    "priority": 8,
    "ai_enrich": false
  }'
```

**Parameters:**
- `node_type` (required): project_root | feature | requirement | task | milestone | idea | question | note
- `label` (required): Node title
- `description` (optional): Node description
- `parent_id` (optional): Parent node UUID
- `position_x` (optional): X coordinate (default: 0)
- `position_y` (optional): Y coordinate (default: 0)
- `status` (optional): pending | in_progress | completed | blocked | on_hold
- `priority` (optional): 0-10 (default: 0)
- `ai_enrich` (optional): true/false - trigger AI enrichment

**Response (200):**
```json
{
  "node": {
    "id": "uuid",
    "mindmap_id": "uuid",
    "label": "User Authentication",
    "node_type": "feature",
    ...
  },
  "enrichment": null,
  "message": "Node created successfully"
}
```

---

### 3. Update Node

**Endpoint:** `PUT /api/mindmap/nodes/[nodeId]`

**Description:** Updates an existing node

**Request:**
```bash
curl -X PUT \
  "http://localhost:3008/api/mindmap/nodes/{NODE_ID}" \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Updated Label",
    "description": "Updated description",
    "status": "in_progress",
    "position_x": 250,
    "position_y": 120
  }'
```

**Response (200):**
```json
{
  "node": {
    "id": "uuid",
    "label": "Updated Label",
    ...
  }
}
```

---

### 4. Delete Node

**Endpoint:** `DELETE /api/mindmap/nodes/[nodeId]`

**Description:** Deletes a node and its children (cascade)

**Request:**
```bash
curl -X DELETE \
  "http://localhost:3008/api/mindmap/nodes/{NODE_ID}" \
  -H "Authorization: Bearer {TOKEN}"
```

**Response (200):**
```json
{
  "message": "Node deleted successfully"
}
```

---

### 5. Create Connection

**Endpoint:** `POST /api/mindmap/[mindmapId]/connections`

**Description:** Creates a connection between two nodes

**Request:**
```bash
curl -X POST \
  "http://localhost:3008/api/mindmap/{MINDMAP_ID}/connections" \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "source_node_id": "uuid",
    "target_node_id": "uuid",
    "connection_type": "depends_on",
    "label": "Requires",
    "strength": 8
  }'
```

**Parameters:**
- `source_node_id` (required): Source node UUID
- `target_node_id` (required): Target node UUID
- `connection_type` (optional): relates_to | depends_on | leads_to | part_of | inspired_by | conflicts_with
- `label` (optional): Connection label
- `strength` (optional): 1-10 (default: 5)

**Response (200):**
```json
{
  "connection": {
    "id": "uuid",
    "source_node_id": "uuid",
    "target_node_id": "uuid",
    "connection_type": "depends_on",
    ...
  },
  "message": "Connection created successfully"
}
```

---

### 6. Trigger AI Analysis

**Endpoint:** `POST /api/mindmap/[mindmapId]/ai-analyze`

**Description:** Runs AI analysis on the mindmap and generates suggestions

**Request:**
```bash
curl -X POST \
  "http://localhost:3008/api/mindmap/{MINDMAP_ID}/ai-analyze" \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "analysis_type": "full",
    "focus_node_id": null
  }'
```

**Parameters:**
- `analysis_type` (optional): full | quick | focused (default: full)
- `focus_node_id` (optional): Specific node UUID to focus on

**Response (200):**
```json
{
  "suggestions": [
    {
      "suggestion_type": "add_feature",
      "suggestion_text": "Consider adding OAuth social login",
      "reasoning": "Improves security and user experience",
      "confidence_score": 0.85,
      "node_id": "uuid"
    }
  ],
  "insights": {
    "total_nodes": 5,
    "complexity_score": 65,
    "completeness_score": 70,
    "identified_gaps": ["missing authentication docs"],
    "estimated_timeline": "2-3 months",
    "technology_recommendations": ["Next.js", "Supabase Auth"]
  },
  "cache_stats": {
    "cache_hit": true,
    "input_tokens": 1500,
    "cache_read_tokens": 800,
    "output_tokens": 450
  },
  "saved_to_db": 3
}
```

---

### 7. Get Suggestions

**Endpoint:** `GET /api/mindmap/[mindmapId]/ai-analyze?status=pending`

**Description:** Retrieves AI suggestions for a mindmap

**Request:**
```bash
curl -X GET \
  "http://localhost:3008/api/mindmap/{MINDMAP_ID}/ai-analyze?status=pending" \
  -H "Authorization: Bearer {TOKEN}"
```

**Response (200):**
```json
{
  "suggestions": [
    {
      "id": "uuid",
      "mindmap_id": "uuid",
      "suggestion_type": "add_feature",
      "suggestion_text": "...",
      "reasoning": "...",
      "confidence_score": 0.85,
      "status": "pending",
      "created_at": "2025-01-17T00:00:00Z"
    }
  ],
  "count": 1
}
```

---

### 8. Accept/Dismiss Suggestion

**Endpoint:** `PUT /api/mindmap/suggestions/[suggestionId]`

**Description:** Updates suggestion status

**Request (Accept):**
```bash
curl -X PUT \
  "http://localhost:3008/api/mindmap/suggestions/{SUGGESTION_ID}" \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "accepted"
  }'
```

**Request (Dismiss):**
```bash
curl -X DELETE \
  "http://localhost:3008/api/mindmap/suggestions/{SUGGESTION_ID}" \
  -H "Authorization: Bearer {TOKEN}"
```

**Response (200):**
```json
{
  "suggestion": {
    "id": "uuid",
    "status": "accepted",
    ...
  },
  "message": "Suggestion accepted successfully"
}
```

---

### 9. Apply Suggestion

**Endpoint:** `POST /api/mindmap/suggestions/[suggestionId]`

**Description:** Applies a suggestion to the mindmap (creates nodes, updates descriptions, etc.)

**Request:**
```bash
curl -X POST \
  "http://localhost:3008/api/mindmap/suggestions/{SUGGESTION_ID}" \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json"
```

**Response (200):**
```json
{
  "message": "Suggestion applied successfully",
  "result": {
    "node_created": {
      "id": "uuid",
      "label": "OAuth Social Login",
      ...
    }
  }
}
```

---

## Testing Scenarios

### Scenario 1: Create Complete Mindmap

```bash
#!/bin/bash

TOKEN="your-token-here"
PROJECT_ID="your-project-id"
BASE_URL="http://localhost:3008"

# 1. Get or create mindmap
MINDMAP=$(curl -s -X GET \
  "$BASE_URL/api/projects/$PROJECT_ID/mindmap" \
  -H "Authorization: Bearer $TOKEN")

MINDMAP_ID=$(echo $MINDMAP | jq -r '.mindmap.id')
echo "Mindmap ID: $MINDMAP_ID"

# 2. Create root node
ROOT_NODE=$(curl -s -X POST \
  "$BASE_URL/api/mindmap/$MINDMAP_ID/nodes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "node_type": "project_root",
    "label": "My Project",
    "description": "Main project node",
    "position_x": 0,
    "position_y": 0,
    "status": "in_progress",
    "priority": 10
  }')

ROOT_ID=$(echo $ROOT_NODE | jq -r '.node.id')
echo "Root Node ID: $ROOT_ID"

# 3. Create feature node
FEATURE_NODE=$(curl -s -X POST \
  "$BASE_URL/api/mindmap/$MINDMAP_ID/nodes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"parent_id\": \"$ROOT_ID\",
    \"node_type\": \"feature\",
    \"label\": \"User Authentication\",
    \"description\": \"Login and signup\",
    \"position_x\": 200,
    \"position_y\": 100,
    \"status\": \"pending\",
    \"priority\": 8
  }")

FEATURE_ID=$(echo $FEATURE_NODE | jq -r '.node.id')
echo "Feature Node ID: $FEATURE_ID"

# 4. Create connection
curl -s -X POST \
  "$BASE_URL/api/mindmap/$MINDMAP_ID/connections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"source_node_id\": \"$ROOT_ID\",
    \"target_node_id\": \"$FEATURE_ID\",
    \"connection_type\": \"part_of\",
    \"label\": \"Contains\"
  }"

# 5. Trigger AI analysis
curl -s -X POST \
  "$BASE_URL/api/mindmap/$MINDMAP_ID/ai-analyze" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "analysis_type": "full"
  }' | jq '.'

echo "Mindmap created and analyzed!"
```

---

## Troubleshooting

### Error: 401 Unauthorized

**Cause:** Missing or invalid authentication token

**Solution:**
1. Verify token is included in Authorization header
2. Check token hasn't expired
3. Ensure user is logged in
4. Try getting a fresh token

### Error: 404 Not Found

**Cause:** Resource doesn't exist or wrong ID

**Solution:**
1. Verify UUIDs are correct
2. Check resource exists in database
3. Ensure workspace access

### Error: 500 Internal Server Error

**Cause:** Server-side error

**Solution:**
1. Check server logs: `npm run dev` output
2. Verify database connection
3. Check all required env variables set
4. Verify Anthropic API key valid

### Error: "Could not find column"

**Cause:** Database schema mismatch

**Solution:**
1. Verify migration 028 applied: `node scripts/check-mindmap-tables.mjs`
2. Check Supabase schema cache refreshed
3. Re-run migration if needed

---

## Automated Testing

### Run Verification Script

```bash
node scripts/check-mindmap-tables.mjs
```

**Expected Output:**
```
✓ project_mindmaps: OK
✓ mindmap_nodes: OK
✓ mindmap_connections: OK
✓ ai_suggestions: OK
✓ get_mindmap_structure: EXISTS
```

### Run API Test Script

```bash
node scripts/test-mindmap-api.mjs
```

**Expected Output:**
```
1️⃣ Testing GET /api/projects/[projectId]/mindmap
  ✓ Created new mindmap

2️⃣ Testing POST /api/mindmap/[mindmapId]/nodes
  ✓ Created root node
  ✓ Created child node

...

📊 Test Summary
✅ Passed: 9
❌ Failed: 0
📈 Success Rate: 100%
```

---

## Postman Collection

**Import this JSON to test in Postman:**

```json
{
  "info": {
    "name": "Unite-Hub Mindmap API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get Project Mindmap",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{access_token}}"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/projects/{{project_id}}/mindmap",
          "host": ["{{base_url}}"],
          "path": ["api", "projects", "{{project_id}}", "mindmap"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3008"
    },
    {
      "key": "access_token",
      "value": "your-token-here"
    },
    {
      "key": "project_id",
      "value": "your-project-id"
    }
  ]
}
```

---

**Next Steps:**
1. Test each endpoint individually
2. Run automated test script
3. Test in Postman
4. Test frontend integration
5. Deploy to production

---

**Created:** 2025-01-17
**Version:** 1.0
**Status:** Complete
