# Unite-Hub API v1

## Overview

The v1 API provides versioned, stable endpoints for Unite-Hub's core resources. This API layer ensures backward compatibility and predictable evolution of the platform.

## Base URL

```
http://localhost:3008/api/v1
https://app.unite-hub.com/api/v1
```

## Authentication

All endpoints (except `/health`) require authentication via Bearer token:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://app.unite-hub.com/api/v1/contacts
```

Get your token from:
- Browser: `localStorage.getItem('supabase.auth.token')`
- Supabase session: `session.access_token`

## Workspace Scoping

All resource endpoints automatically filter by the authenticated user's workspace. You cannot access resources from other workspaces.

## Endpoints

### Health Check

```
GET /api/v1/health
```

No authentication required. Returns API version and status.

**Response:**
```json
{
  "version": "1.0.0",
  "status": "ok",
  "timestamp": "2025-01-29T12:34:56.789Z"
}
```

### Contacts

#### List Contacts

```
GET /api/v1/contacts?page=1&limit=50
```

**Query Parameters:**
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 50, max 100

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "workspace_id": "uuid",
      "email": "contact@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "status": "lead",
      "ai_score": 75,
      "created_at": "2025-01-29T12:00:00Z",
      "updated_at": "2025-01-29T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

#### Create Contact

```
POST /api/v1/contacts
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "contact@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "company": "Acme Inc",
  "job_title": "CEO",
  "status": "lead"
}
```

**Required Fields:**
- `email`: Valid email address (unique per workspace)

**Optional Fields:**
- `first_name`, `last_name`, `company`, `job_title`, `phone`, `status`

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "workspace_id": "uuid",
    "email": "contact@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "status": "lead",
    "ai_score": 0,
    "created_at": "2025-01-29T12:34:56Z",
    "updated_at": "2025-01-29T12:34:56Z"
  }
}
```

#### Get Contact

```
GET /api/v1/contacts/:id
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "workspace_id": "uuid",
    "email": "contact@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "company": "Acme Inc",
    "job_title": "CEO",
    "status": "lead",
    "ai_score": 75,
    "tags": ["enterprise", "warm-lead"],
    "created_at": "2025-01-29T12:00:00Z",
    "updated_at": "2025-01-29T12:00:00Z"
  }
}
```

#### Update Contact

```
PUT /api/v1/contacts/:id
Content-Type: application/json
```

**Request Body:**
```json
{
  "first_name": "Jane",
  "status": "customer",
  "ai_score": 85
}
```

All fields optional. Only provided fields are updated.

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "email": "contact@example.com",
    "first_name": "Jane",
    "status": "customer",
    "ai_score": 85,
    "updated_at": "2025-01-29T13:00:00Z"
  }
}
```

#### Delete Contact

```
DELETE /api/v1/contacts/:id
```

Soft delete (sets `deleted_at` timestamp).

**Response:**
```json
{
  "success": true,
  "message": "Contact deleted successfully"
}
```

## Error Responses

All endpoints return consistent error structures:

**400 Bad Request:**
```json
{
  "error": "Validation failed",
  "details": {
    "email": "Invalid email format"
  }
}
```

**401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "message": "Valid authentication token required"
}
```

**403 Forbidden:**
```json
{
  "error": "Forbidden",
  "message": "You don't have access to this workspace"
}
```

**404 Not Found:**
```json
{
  "error": "Not found",
  "message": "Contact not found or not accessible in your workspace"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

## Rate Limiting

Current limits (per IP):
- 100 requests per minute
- 1000 requests per hour

Rate limit headers included in all responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706534400
```

## Versioning Policy

### Semantic Versioning

We follow semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR** (v1 → v2): Breaking changes requiring code updates
- **MINOR** (v1.0 → v1.1): New features, backward compatible
- **PATCH** (v1.0.0 → v1.0.1): Bug fixes, backward compatible

### Breaking Changes

Breaking changes include:
- Removing endpoints or fields
- Changing required fields
- Modifying response structure
- Changing authentication methods

**Policy:**
- Breaking changes only in new major versions (v1 → v2)
- Previous major version supported for 6 months after new release
- Deprecation warnings sent 3 months before breaking changes

### Non-Breaking Changes

Non-breaking changes (can happen anytime):
- Adding new endpoints
- Adding optional fields
- Adding new response fields (clients should ignore unknown fields)
- Bug fixes
- Performance improvements

### Deprecation Process

1. **Announcement** (3 months before): Deprecation notice in API responses
   ```json
   {
     "data": {...},
     "deprecated": {
       "field": "old_field_name",
       "message": "Use 'new_field_name' instead",
       "sunset_date": "2025-06-30"
     }
   }
   ```

2. **Migration Period** (3 months): Both old and new supported

3. **Sunset**: Old version/field removed in next major version

## Migration Guide

### From Legacy API to v1

**Old endpoint:**
```
GET /api/contacts?workspaceId=uuid
```

**New endpoint:**
```
GET /api/v1/contacts
```

**Changes:**
1. Workspace automatically detected from auth token (no `workspaceId` param)
2. Pagination standardized (`page` and `limit` params)
3. Consistent error responses with proper HTTP status codes
4. All responses wrapped in `{ data: ... }` or `{ error: ... }`

**Migration checklist:**
- [ ] Update API base URL to `/api/v1`
- [ ] Remove manual `workspaceId` parameters
- [ ] Update pagination logic to use `page`/`limit`
- [ ] Handle standardized error responses
- [ ] Unwrap `data` field from successful responses

### Future: v1 to v2 (when released)

We'll provide:
- Detailed migration guide 3 months before v2 release
- Side-by-side comparison of v1 vs v2 endpoints
- Code examples for common migrations
- Support for running v1 and v2 in parallel during transition

## Best Practices

1. **Always specify API version** in URLs (`/api/v1/...`)
2. **Handle unknown response fields** gracefully (ignore extra fields)
3. **Check deprecation warnings** in responses
4. **Implement exponential backoff** for retries on 429/5xx errors
5. **Cache responses** when appropriate (use `Cache-Control` headers)
6. **Validate request data** before sending (faster than server-side validation)

## Support

- **Documentation**: https://docs.unite-hub.com/api/v1
- **Changelog**: https://docs.unite-hub.com/api/changelog
- **Issues**: https://github.com/unite-hub/unite-hub/issues
- **Email**: api-support@unite-hub.com

## Status Page

Check API status: https://status.unite-hub.com

## License

API usage subject to Unite-Hub Terms of Service.
