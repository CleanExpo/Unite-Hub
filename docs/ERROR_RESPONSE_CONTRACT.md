# Error Response Contract

**Version**: 1.0.0
**Last Updated**: 2025-12-02
**Status**: Production Ready

## Overview

This document defines the standardized error response format for all Unite-Hub API endpoints. All errors follow a consistent JSON structure with proper HTTP status codes.

## Error Response Format

### Standard Error Response

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "status": 400,
    "domain": "DOMAIN_NAME",
    "details": {
      // Optional: domain-specific details
    },
    "timestamp": "2025-12-02T19:45:00.000Z",
    "traceId": "uuid-v4-for-request-tracking"
  }
}
```

### HTTP Status Codes

| Status | Error Class | Meaning | Recovery |
|--------|-------------|---------|----------|
| 400 | ValidationError | Invalid request input | Correct input and retry |
| 401 | AuthenticationError | Missing/invalid authentication | Provide valid credentials |
| 403 | AuthorizationError | Insufficient permissions | Use authorized account |
| 404 | NotFoundError | Resource doesn't exist | Verify resource ID |
| 409 | ConflictError | Resource already exists | Use different ID/handle |
| 429 | RateLimitError | Too many requests | Wait and retry |
| 500 | DatabaseError | Database operation failed | Retry with backoff |
| 500 | IntegrationError | External service failed | Retry or contact support |
| 500 | InternalServerError | Unexpected server error | Contact support with traceId |

## Error Classes

### 1. ValidationError (400)

**When**: Request input fails validation

**Example Response**:
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Validation failed",
    "status": 400,
    "domain": "VALIDATION",
    "details": {
      "fields": {
        "email": ["Invalid email format"],
        "age": ["Must be 18 or older"]
      }
    }
  }
}
```

**Recovery**: Fix the indicated fields and retry

---

### 2. AuthenticationError (401)

**When**: User is not authenticated or token is invalid

**Example Response**:
```json
{
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "Authentication required",
    "status": 401,
    "domain": "AUTH"
  }
}
```

**Recovery**: Login with valid credentials

**Common Causes**:
- Missing Authorization header
- Expired or invalid token
- Malformed Bearer token

---

### 3. AuthorizationError (403)

**When**: User lacks permission for the resource

**Example Response**:
```json
{
  "error": {
    "code": "ACCESS_DENIED",
    "message": "You don't have permission to access this resource",
    "status": 403,
    "domain": "AUTH",
    "details": {
      "requiredRole": "admin",
      "userRole": "staff"
    }
  }
}
```

**Recovery**: Use an account with proper permissions

**Common Causes**:
- Insufficient user role
- Workspace/organization mismatch
- Resource ownership check failed

---

### 4. NotFoundError (404)

**When**: Requested resource doesn't exist

**Example Response**:
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found",
    "status": 404,
    "domain": "DATABASE",
    "details": {
      "resource": "Contact",
      "id": "contact-123"
    }
  }
}
```

**Recovery**: Verify the resource ID and retry

**Common Causes**:
- Invalid resource ID
- Resource was deleted
- Resource belongs to different workspace

---

### 5. ConflictError (409)

**When**: Resource already exists (duplicate)

**Example Response**:
```json
{
  "error": {
    "code": "ALREADY_EXISTS",
    "message": "A contact with this email already exists",
    "status": 409,
    "domain": "DATABASE",
    "details": {
      "resource": "Contact",
      "field": "email",
      "value": "john@example.com"
    }
  }
}
```

**Recovery**: Use a different value or update existing resource

---

### 6. RateLimitError (429)

**When**: User exceeds API rate limit

**Example Response**:
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again after 60 seconds.",
    "status": 429,
    "domain": "RATE_LIMIT",
    "details": {
      "limit": 100,
      "window": "1 minute",
      "remaining": 0
    }
  }
}
```

**Recovery**: Wait and retry after indicated window

**Rate Limits**:
- General API: 100 requests/minute
- Auth endpoints: 10 requests/minute
- Bulk operations: 10 requests/minute

---

### 7. DatabaseError (500)

**When**: Database operation fails

**Example Response**:
```json
{
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Failed to update contact",
    "status": 500,
    "domain": "DATABASE",
    "details": {
      "operation": "UPDATE",
      "table": "contacts"
    }
  }
}
```

**Recovery**: Retry with exponential backoff

**Common Causes**:
- Database connection lost
- Constraint violation
- Transaction failure

---

### 8. IntegrationError (500)

**When**: External service integration fails

**Example Response**:
```json
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Gmail service is temporarily unavailable",
    "status": 500,
    "domain": "INTEGRATION",
    "details": {
      "service": "Gmail",
      "endpoint": "/v1/send"
    }
  }
}
```

**Recovery**: Retry later or contact support

---

### 9. InternalServerError (500)

**When**: Unexpected error occurs

**Example Response**:
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred. Please contact support.",
    "status": 500,
    "domain": "SERVER",
    "details": {
      "traceId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
    }
  }
}
```

**Recovery**: Contact support with traceId

---

## Error Handling Best Practices

### Client Implementation

```typescript
// TypeScript example
async function handleApiError(error: any) {
  const { status, error: errorData } = error.response;

  switch (status) {
    case 400:
      // Show validation errors to user
      console.error('Validation failed:', errorData.details.fields);
      break;

    case 401:
      // Redirect to login
      window.location.href = '/login';
      break;

    case 403:
      // Show permission denied message
      showError('You don\'t have permission to access this');
      break;

    case 404:
      // Show resource not found
      showError('The resource was not found');
      break;

    case 429:
      // Implement exponential backoff
      const waitSeconds = errorData.details.window;
      setTimeout(retry, waitSeconds * 1000);
      break;

    case 500:
      // Log with traceId for support
      logError(`Server error (${errorData.details.traceId})`);
      showError('An error occurred. Our team has been notified.');
      break;

    default:
      showError('An unexpected error occurred');
  }
}
```

### Retry Strategy

```typescript
async function withRetry(
  fn: () => Promise<any>,
  maxAttempts = 3,
  baseDelay = 1000
) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const status = error.response?.status;
      const isRetryable = [408, 429, 500, 502, 503, 504].includes(status);

      if (!isRetryable || attempt === maxAttempts) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

## Monitoring & Alerting

### Key Metrics

- **Error Rate**: Errors per minute by type
- **Error Distribution**: % of 4xx vs 5xx
- **Response Time**: p50, p95, p99 latency
- **Health Score**: 0-100 based on error patterns

### Alert Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| 5xx Error Rate | > 1% | Page on-call |
| Auth Failures | > 5/min | Security alert |
| Database Errors | > 10/min | Escalate to DBA |
| Rate Limit Hits | > 100/min | Review quotas |
| Health Score | < 50 | System degraded |

## Logging Integration

All errors are automatically logged with:
- Timestamp
- Request ID (traceId)
- User ID (if authenticated)
- Workspace ID
- Error domain and code
- Duration
- Error stack trace (development)

## Example Error Scenarios

### Scenario 1: Validation Error in Contact Creation

**Request**:
```bash
curl -X POST https://api.unite-hub.com/api/contacts \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{"name": "", "email": "invalid"}'
```

**Response** (400):
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Validation failed",
    "status": 400,
    "domain": "VALIDATION",
    "details": {
      "fields": {
        "name": ["Name is required"],
        "email": ["Invalid email format"]
      }
    }
  }
}
```

---

### Scenario 2: Authentication Error

**Request** (missing token):
```bash
curl -X GET https://api.unite-hub.com/api/contacts
```

**Response** (401):
```json
{
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "Authentication required",
    "status": 401,
    "domain": "AUTH"
  }
}
```

---

### Scenario 3: Rate Limit Error

**Request** (100th request in 1 minute):
```bash
curl -X GET https://api.unite-hub.com/api/contacts?page=100 \
  -H "Authorization: Bearer token"
```

**Response** (429):
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again after 60 seconds.",
    "status": 429,
    "domain": "RATE_LIMIT",
    "details": {
      "limit": 100,
      "window": "1 minute",
      "remaining": 0,
      "resetAt": "2025-12-02T19:46:00.000Z"
    }
  }
}
```

---

## Integration with Error Boundaries

All errors are caught by the error boundary system and automatically converted to this format:

```typescript
export const POST = withErrorBoundary(async (req, { params }) => {
  // Any error thrown here becomes a proper error response
  throw new ValidationError([{ field: 'email', message: 'Invalid' }]);
  // Automatically returns 400 with proper error format
});
```

## FAQ

### Q: Should I retry all 5xx errors?
**A**: Yes, but use exponential backoff. Start with 1s, then 2s, 4s, 8s (max 3-4 retries).

### Q: How do I get support for error code X?
**A**: Include the `traceId` from the error response. Our team can look up the full error context.

### Q: Can I disable error details in production?
**A**: Yes, set `NODE_ENV=production`. The API will omit stack traces and sensitive details.

### Q: How are validation field errors structured?
**A**: Fields object maps field names to arrays of error messages: `{ "email": ["Invalid format", "Already exists"] }`

---

**For support**: Include the error code, status, message, and traceId when contacting support.
