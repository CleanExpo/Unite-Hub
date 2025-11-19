# Unite-Hub API Documentation - Phase 2

**Created**: 2025-11-19
**Status**: ✅ Production-Ready
**Total Endpoints**: 12+ routes

---

## Overview

This is the complete API route architecture for Phase 2 UI/UX overhaul. All routes are:

✅ **TypeScript** - Fully typed with Next.js 16 App Router
✅ **Authenticated** - Protected with staff/client middleware
✅ **Validated** - Zod schema validation on inputs
✅ **Isolated** - No dependencies on existing `src/app/api/` routes
✅ **Feature-Flagged** - Respects `newUIEnabled` flag
✅ **Error-Handled** - Proper status codes and error messages

---

## Base URL

**Development**: `http://localhost:3008/api`
**Production**: `https://your-domain.com/api`

---

## Authentication

All protected routes require a Bearer token in the `Authorization` header:

```bash
Authorization: Bearer <your_token_here>
```

### Getting a Token

**Staff Login**:
```bash
POST /api/auth/staff-login
Content-Type: application/json

{
  "email": "staff@unite-group.in",
  "password": "yourpassword"
}
```

**Response**:
```json
{
  "success": true,
  "user": { "id": "uuid", "email": "..." },
  "session": { "access_token": "...", "expires_at": "..." },
  "role": "founder"
}
```

---

## API Routes

### Authentication Routes

#### POST /api/auth/staff-login
Staff login endpoint.

**Request**:
```json
{
  "email": "staff@unite-group.in",
  "password": "password123"
}
```

**Response** (200):
```json
{
  "success": true,
  "user": { "id": "uuid", "email": "staff@unite-group.in" },
  "session": { "access_token": "...", "refresh_token": "..." },
  "role": "founder"
}
```

**Errors**:
- `400` - Invalid email format or missing fields
- `401` - Invalid credentials
- `403` - Inactive staff account

---

### Staff Routes

All staff routes require staff authentication (`withStaffAuth` middleware).

#### GET /api/staff/me
Get current authenticated staff user.

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "staff@unite-group.in",
    "role": "founder"
  }
}
```

---

#### GET /api/staff/tasks
List all tasks (optionally filter to user's assigned tasks).

**Headers**:
```
Authorization: Bearer <token>
```

**Query Parameters**:
- `my_tasks_only` (optional): `true` | `false` - Filter to user's tasks

**Response** (200):
```json
{
  "success": true,
  "tasks": [
    {
      "id": "uuid",
      "title": "Complete homepage design",
      "status": "in_progress",
      "due_date": "2025-11-25",
      "assigned_to": "uuid",
      "projects": { "id": "uuid", "status": "active" }
    }
  ]
}
```

---

#### POST /api/staff/tasks
Create a new task.

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request**:
```json
{
  "project_id": "uuid",
  "title": "Complete homepage design",
  "description": "Design and implement homepage",
  "due_date": "2025-11-25"
}
```

**Response** (200):
```json
{
  "success": true,
  "task": {
    "id": "uuid",
    "title": "Complete homepage design",
    "status": "pending",
    "assigned_to": "uuid"
  }
}
```

**Errors**:
- `400` - Invalid request body or missing required fields
- `401` - Not authenticated
- `500` - Failed to create task

---

#### GET /api/staff/tasks/[id]
Get a specific task by ID.

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "task": {
    "id": "uuid",
    "title": "Complete homepage design",
    "status": "in_progress",
    "proof": { "screenshots": ["url1", "url2"] }
  }
}
```

**Errors**:
- `404` - Task not found

---

#### PATCH /api/staff/tasks/[id]
Update a task.

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request**:
```json
{
  "id": "uuid",
  "status": "completed",
  "proof": { "screenshots": ["url1"] }
}
```

**Response** (200):
```json
{
  "success": true,
  "task": { "id": "uuid", "status": "completed" }
}
```

---

#### DELETE /api/staff/tasks/[id]
Delete a task.

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

---

#### GET /api/staff/projects
List all projects.

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "projects": [
    {
      "id": "uuid",
      "status": "active",
      "progress": 45,
      "client_users": { "id": "uuid", "name": "Client Name", "email": "client@example.com" }
    }
  ]
}
```

---

#### GET /api/staff/activity
Get staff activity logs.

**Headers**:
```
Authorization: Bearer <token>
```

**Query Parameters**:
- `limit` (optional): Number of logs to return (default: 50)

**Response** (200):
```json
{
  "success": true,
  "logs": [
    {
      "id": "uuid",
      "staff_id": "uuid",
      "action": "staff_login",
      "metadata": { "email": "staff@unite-group.in" },
      "timestamp": "2025-11-19T10:00:00Z"
    }
  ]
}
```

**Note**: Non-admin users only see their own logs. Admins/founders see all logs.

---

### Client Routes

All client routes require client authentication (`withClientAuth` middleware).

#### GET /api/client/ideas
List client's submitted ideas.

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "ideas": [
    {
      "id": "uuid",
      "content": "Build a mobile app for restaurant management",
      "type": "text",
      "status": "pending",
      "ai_interpretation": { "core_objective": "..." },
      "created_at": "2025-11-19T10:00:00Z"
    }
  ]
}
```

---

#### POST /api/client/ideas
Submit a new idea.

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request**:
```json
{
  "content": "Build a mobile app for restaurant management with real-time inventory tracking",
  "type": "text"
}
```

**Validation**:
- `content`: Min 10 characters, max 5000 characters
- `type`: Must be one of: `voice`, `text`, `video`, `uploaded`

**Response** (200):
```json
{
  "success": true,
  "idea": {
    "id": "uuid",
    "content": "Build a mobile app...",
    "type": "text",
    "status": "pending",
    "created_at": "2025-11-19T10:00:00Z"
  }
}
```

**Errors**:
- `400` - Invalid content length or type

---

#### GET /api/client/proposals
List proposals generated from client's ideas.

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "proposals": [
    {
      "id": "uuid",
      "idea_id": "uuid",
      "scope": { "deliverables": [...], "features": [...] },
      "pricing": { "development": 5000, "design": 2000 },
      "timeline": { "phases": [...], "estimated_hours": 200 }
    }
  ]
}
```

---

#### GET /api/client/vault
List digital vault entries (metadata only).

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "entries": [
    {
      "id": "uuid",
      "key_name": "AWS Access Key",
      "category": "api_keys",
      "created_at": "2025-11-19T10:00:00Z"
    }
  ]
}
```

**Note**: Values are not exposed in list view for security.

---

#### POST /api/client/vault
Add a new vault entry.

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request**:
```json
{
  "key_name": "AWS Access Key",
  "value": "AKIAIOSFODNN7EXAMPLE",
  "category": "api_keys"
}
```

**Validation**:
- `key_name`: Max 100 characters
- `value`: Max 1000 characters

**Response** (200):
```json
{
  "success": true,
  "entry": {
    "id": "uuid",
    "key_name": "AWS Access Key",
    "category": "api_keys",
    "created_at": "2025-11-19T10:00:00Z"
  }
}
```

---

### AI Routes

#### POST /api/ai/interpret-idea
Interpret client idea using AI orchestrator.

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request**:
```json
{
  "ideaId": "uuid",
  "content": "Build a mobile app for restaurant management"
}
```

**Response** (200):
```json
{
  "success": true,
  "interpretation": {
    "core_objective": "Restaurant management mobile application",
    "suggested_approach": "React Native cross-platform app",
    "complexity": "medium",
    "key_requirements": [...],
    "potential_challenges": [...]
  },
  "provider": "anthropic"
}
```

**Errors**:
- `400` - Missing ideaId or content
- `500` - AI processing failed

---

#### POST /api/ai/generate-proposal
Generate project proposal from idea interpretation.

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request**:
```json
{
  "ideaId": "uuid",
  "interpretation": { "core_objective": "...", ... }
}
```

**Response** (200):
```json
{
  "success": true,
  "proposal": {
    "scope": { "deliverables": [...], "features": [...] },
    "pricing": { "development": 5000, "design": 2000 },
    "timeline": { "phases": [...] }
  },
  "provider": "anthropic"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### Common Status Codes

- `200` - Success
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

**Not yet implemented**. Future versions will include:
- Staff: 1000 requests/hour
- Client: 100 requests/hour
- AI routes: 50 requests/hour

---

## Testing

Run API tests:
```bash
npm run test:api
```

Test files located in `tests/api/`.

---

## Feature Flags

All routes respect feature flags from `config/featureFlags.json`:

```json
{
  "flags": {
    "newUIEnabled": true
  }
}
```

When `newUIEnabled` is `false`, routes may return 404 or redirect to old system.

---

## Additional Resources

- **Authentication**: `next/core/middleware/auth.ts`
- **Validation**: `next/core/middleware/validation.ts`
- **AI Orchestrator**: `next/core/ai/orchestrator.ts`
- **Database Schema**: `supabase/migrations/048_phase1_core_tables.sql`

---

**Status**: ✅ Phase 2 Step 2 Complete
**Routes Created**: 12+ endpoints
**Test Coverage**: Basic tests included
**Production Ready**: Yes
