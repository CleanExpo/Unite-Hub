# API Optimization Quick Reference

**For Developers**: Quick guide to using optimized API endpoints

---

## Optimized Endpoints (With Pagination)

### 1. GET /api/contacts

**Query Parameters**:
```
workspaceId (required)  - Your workspace ID
page                    - Page number (default: 1)
pageSize                - Items per page (default: 20, max: 100)
status                  - Filter by status (active, inactive, etc.)
email                   - Filter by email (partial match)
ai_score                - Filter by minimum AI score (e.g., 70)
company                 - Filter by company name (partial match)
job_title               - Filter by job title (partial match)
sortBy                  - Sort field (name|email|created_at|ai_score|status|company)
sortOrder               - Sort direction (asc|desc, default: desc)
```

**Example**:
```javascript
// Get first 20 active contacts with AI score >= 70
const response = await fetch(
  '/api/contacts?workspaceId=xxx&page=1&pageSize=20&status=active&ai_score=70&sortBy=ai_score&sortOrder=desc'
);

const { success, data, meta } = await response.json();
console.log(data.contacts);     // Array of 20 contacts
console.log(meta.total);        // Total count (e.g., 150)
console.log(meta.page);         // Current page (1)
console.log(meta.pageSize);     // Items per page (20)
```

---

### 2. GET /api/campaigns

**Query Parameters**:
```
workspaceId (required)  - Your workspace ID
page                    - Page number (default: 1)
pageSize                - Items per page (default: 20, max: 100)
status                  - Filter by status (draft|scheduled|active|completed|paused)
name                    - Filter by name (partial match)
sortBy                  - Sort field (name|created_at|scheduled_at|status|subject)
sortOrder               - Sort direction (asc|desc, default: desc)
```

**Example**:
```javascript
// Get active campaigns sorted by scheduled date
const response = await fetch(
  '/api/campaigns?workspaceId=xxx&status=active&sortBy=scheduled_at&sortOrder=asc'
);

const { success, data, meta } = await response.json();
console.log(data.campaigns);
```

---

### 3. GET /api/approvals

**Query Parameters**:
```
orgId (required)        - Your organization ID
page                    - Page number (default: 1)
pageSize                - Items per page (default: 20, max: 100)
status                  - Filter by status (pending|approved|declined)
priority                - Filter by priority (low|medium|high)
type                    - Filter by type (document|video|image)
title                   - Filter by title (partial match)
sortBy                  - Sort field (created_at|priority|status|type|title)
sortOrder               - Sort direction (asc|desc, default: desc)
```

**Example**:
```javascript
// Get pending high-priority approvals
const response = await fetch(
  '/api/approvals?orgId=xxx&status=pending&priority=high&sortBy=created_at&sortOrder=desc'
);
```

---

### 4. GET /api/projects

**Query Parameters**:
```
orgId (required)        - Your organization ID
page                    - Page number (default: 1)
pageSize                - Items per page (default: 20, max: 100)
status                  - Filter by status
category                - Filter by category
priority                - Filter by priority
title                   - Filter by title (partial match)
sortBy                  - Sort field (created_at|due_date|priority|status|title)
sortOrder               - Sort direction (asc|desc, default: desc)
```

**Example**:
```javascript
// Get projects due soon
const response = await fetch(
  '/api/projects?orgId=xxx&sortBy=due_date&sortOrder=asc&pageSize=10'
);
```

---

### 5. GET /api/team

**Query Parameters**:
```
orgId (required)        - Your organization ID
page                    - Page number (default: 1)
pageSize                - Items per page (default: 50, max: 100)
sortBy                  - Sort field (name|role|join_date|email)
sortOrder               - Sort direction (asc|desc, default: asc)
```

**Example**:
```javascript
// Get all team members sorted by name
const response = await fetch(
  '/api/team?orgId=xxx&sortBy=name&sortOrder=asc'
);
```

---

## Response Format

### Success Response

```typescript
{
  success: true,
  data: {
    contacts: [...],  // or campaigns, approvals, etc.
  },
  meta: {
    count: 20,       // Items in current page
    total: 150,      // Total items across all pages
    page: 1,         // Current page number
    pageSize: 20     // Items per page
  },
  message?: "Optional success message"
}
```

### Error Response

```typescript
{
  success: false,
  error: "Error message",
  details?: "Additional context or validation errors",
  code?: "ERROR_CODE"  // e.g., VALIDATION_ERROR, UNAUTHORIZED
}
```

---

## Pagination Helper (Client-Side)

```typescript
// Utility function for paginated requests
async function fetchPaginated<T>(
  endpoint: string,
  params: Record<string, any>,
  page: number = 1,
  pageSize: number = 20
) {
  const queryParams = new URLSearchParams({
    ...params,
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  const response = await fetch(`${endpoint}?${queryParams}`);
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error);
  }

  return {
    data: result.data,
    meta: result.meta,
    hasMore: result.meta.page * result.meta.pageSize < result.meta.total,
  };
}

// Usage
const { data, meta, hasMore } = await fetchPaginated(
  '/api/contacts',
  { workspaceId: 'xxx', status: 'active' },
  1,
  20
);
```

---

## Filtering Examples

### Single Filter
```javascript
// Get only active contacts
fetch('/api/contacts?workspaceId=xxx&status=active')
```

### Multiple Filters
```javascript
// Get active contacts from specific company with high AI score
fetch('/api/contacts?workspaceId=xxx&status=active&company=Acme&ai_score=80')
```

### Search Filter (ilike)
```javascript
// Find contacts with "john" in email
fetch('/api/contacts?workspaceId=xxx&email=john')
```

---

## Sorting Examples

### Single Sort
```javascript
// Sort by creation date (newest first)
fetch('/api/contacts?workspaceId=xxx&sortBy=created_at&sortOrder=desc')
```

### Sort + Filter
```javascript
// Get active contacts sorted by AI score (highest first)
fetch('/api/contacts?workspaceId=xxx&status=active&sortBy=ai_score&sortOrder=desc')
```

---

## Complete Example (React)

```typescript
import { useState, useEffect } from 'react';

interface Contact {
  id: string;
  name: string;
  email: string;
  status: string;
  ai_score: number;
}

interface PaginationMeta {
  count: number;
  total: number;
  page: number;
  pageSize: number;
}

export function ContactsList({ workspaceId }: { workspaceId: string }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('active');

  useEffect(() => {
    const fetchContacts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          workspaceId,
          page: page.toString(),
          pageSize: '20',
          status,
          sortBy: 'ai_score',
          sortOrder: 'desc',
        });

        const response = await fetch(`/api/contacts?${params}`);
        const result = await response.json();

        if (result.success) {
          setContacts(result.data.contacts);
          setMeta(result.meta);
        }
      } catch (error) {
        console.error('Failed to fetch contacts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [workspaceId, page, status]);

  return (
    <div>
      {/* Filter */}
      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      {/* List */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {contacts.map((contact) => (
            <li key={contact.id}>
              {contact.name} ({contact.ai_score})
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      {meta && (
        <div>
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span>
            Page {meta.page} of {Math.ceil(meta.total / meta.pageSize)}
          </span>
          <button
            disabled={page * meta.pageSize >= meta.total}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
          <p>Showing {meta.count} of {meta.total} contacts</p>
        </div>
      )}
    </div>
  );
}
```

---

## Performance Tips

### 1. Use Appropriate Page Sizes

```javascript
// Good: Small page size for mobile
fetch('/api/contacts?workspaceId=xxx&pageSize=10')

// Good: Larger page size for desktop
fetch('/api/contacts?workspaceId=xxx&pageSize=50')

// Bad: Too large (hits max limit)
fetch('/api/contacts?workspaceId=xxx&pageSize=1000')  // Will be capped at 100
```

### 2. Combine Filters and Sorting

```javascript
// Good: Filter + sort in single request
fetch('/api/contacts?workspaceId=xxx&status=active&ai_score=70&sortBy=ai_score&sortOrder=desc')

// Bad: Multiple requests
fetch('/api/contacts?workspaceId=xxx')  // Then filter client-side
```

### 3. Selective Field Loading (Coming Soon)

```javascript
// Future feature: Request only needed fields
fetch('/api/contacts?workspaceId=xxx&fields=id,name,email')
```

---

## Error Handling

```typescript
async function fetchContacts(workspaceId: string) {
  const response = await fetch(`/api/contacts?workspaceId=${workspaceId}`);
  const result = await response.json();

  if (!result.success) {
    // Handle different error types
    switch (result.code) {
      case 'VALIDATION_ERROR':
        console.error('Validation failed:', result.details);
        break;
      case 'UNAUTHORIZED':
        console.error('Not authenticated');
        // Redirect to login
        break;
      case 'FORBIDDEN':
        console.error('Access denied');
        break;
      default:
        console.error('Unknown error:', result.error);
    }
    throw new Error(result.error);
  }

  return result.data;
}
```

---

## Migration from Old API

### Old Code (Still Works)

```javascript
const response = await fetch('/api/contacts?workspaceId=xxx');
const { contacts, count } = await response.json();
```

### New Code (Recommended)

```javascript
const response = await fetch('/api/contacts?workspaceId=xxx&page=1&pageSize=20');
const { success, data, meta } = await response.json();

if (success) {
  const contacts = data.contacts;
  const totalCount = meta.total;
}
```

---

## Backward Compatibility

✅ All old endpoints still work
✅ Default pagination (page=1, pageSize=20) applied automatically
✅ Response format extended (not changed)
✅ No breaking changes

**Note**: Old response format `{ contacts, count }` is wrapped in new format:
```json
{
  "success": true,
  "data": {
    "contacts": [...],
  },
  "meta": {
    "count": 20,
    "total": 100,
    ...
  }
}
```

---

## Support

For questions or issues:
1. Check full documentation: `docs/API_OPTIMIZATION_REPORT.md`
2. Review helper utilities: `src/lib/api-helpers.ts`
3. Create GitHub issue with `[API]` prefix

---

**Last Updated**: 2025-11-18
**Version**: 1.0.0
