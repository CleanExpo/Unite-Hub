# Unite-Hub API Routes

## Overview

Complete backend API for Unite-Hub CRM system built with Next.js 15 App Router.

## Quick Start

### Base URL
- **Development**: `http://localhost:3008/api`
- **Production**: `https://unite-hub.vercel.app/api`

### Authentication
All routes require authentication via NextAuth.js session token.

```typescript
import { auth } from "@/lib/auth";

const session = await auth();
if (!session?.user?.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

---

## API Categories

### 1. Client Management
- Create, read, update, delete clients
- Organization-level client listing
- Pagination and filtering

**Routes**:
- `POST /api/clients`
- `GET /api/clients/[id]`
- `PUT /api/clients/[id]`
- `DELETE /api/clients/[id]`
- `GET /api/organization/clients`

### 2. Asset Management
- Upload client assets (logos, photos, documents)
- Manage asset metadata
- Tier-based storage limits

**Routes**:
- `POST /api/clients/[id]/assets/upload`
- `GET /api/clients/[id]/assets`
- `PUT /api/clients/[id]/assets/[assetId]`
- `DELETE /api/clients/[id]/assets/[assetId]`

### 3. Persona System
- AI-powered persona generation
- Version history tracking
- Multi-format export (PDF, DOCX, JSON)

**Routes**:
- `GET /api/clients/[id]/persona`
- `POST /api/clients/[id]/persona`
- `GET /api/clients/[id]/persona/history`
- `POST /api/clients/[id]/persona/export`

### 4. Mind Map
- Visual concept mapping
- Real-time updates
- Export functionality

**Routes**:
- `GET /api/clients/[id]/mindmap`
- `POST /api/clients/[id]/mindmap/update`
- `POST /api/clients/[id]/mindmap/export`

### 5. Marketing Strategy
- Comprehensive strategy generation
- Platform-specific tactics (Facebook, Instagram, TikTok, LinkedIn)
- Budget guidance and success metrics

**Routes**:
- `GET /api/clients/[id]/strategy`
- `POST /api/clients/[id]/strategy`
- `GET /api/clients/[id]/strategy/platforms`
- `POST /api/clients/[id]/strategy/export`

### 6. Campaign Management
- Multi-platform campaigns
- Scheduling and performance tracking
- Campaign duplication

**Routes**:
- `GET /api/clients/[id]/campaigns`
- `POST /api/clients/[id]/campaigns`
- `GET /api/clients/[id]/campaigns/[cid]`
- `PUT /api/clients/[id]/campaigns/[cid]`
- `DELETE /api/clients/[id]/campaigns/[cid]`
- `POST /api/clients/[id]/campaigns/duplicate`

### 7. Hooks & Scripts
- AI-powered hook generation
- Search and favorites functionality
- Performance scoring

**Routes**:
- `GET /api/clients/[id]/hooks`
- `POST /api/clients/[id]/hooks`
- `GET /api/hooks/search`
- `POST /api/hooks/favorite`
- `GET /api/hooks/favorite`

---

## Common Patterns

### Error Handling
All routes use standardized error handling:

```typescript
import { handleError, NotFoundError } from "@/lib/utils/error-handler";

try {
  // Route logic
} catch (error) {
  return handleError(error);
}
```

### Tier Validation
Enforce subscription tier limits:

```typescript
import { TierValidator } from "@/lib/utils/tier-validator";

const validator = new TierValidator(organization.plan);

if (!validator.isPlatformAvailable(platform)) {
  throw new TierLimitError("Platform not available in current plan");
}
```

### Audit Logging
Log all important actions:

```typescript
await db.auditLogs.create({
  org_id: workspace.org_id,
  action: "client_created",
  resource: "client",
  resource_id: client.id,
  agent: "user",
  status: "success",
  details: { client_name: client.name },
});
```

---

## Request/Response Examples

### Create Client
```bash
curl -X POST http://localhost:3008/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "workspace_id": "uuid"
  }'
```

**Response**:
```json
{
  "client": {
    "id": "uuid",
    "name": "John Doe",
    "created_at": "2025-01-13T00:00:00Z"
  }
}
```

### Get Client Details
```bash
curl http://localhost:3008/api/clients/uuid
```

**Response**:
```json
{
  "client": {
    "id": "uuid",
    "name": "John Doe",
    "emails": [],
    "interactions": []
  }
}
```

---

## Tier Limits

| Feature | Starter | Professional |
|---------|---------|--------------|
| Asset Storage | 100MB | Unlimited |
| Platforms | Facebook | All 4 |
| Hooks | 20 | Unlimited |
| Images/Concept | 3 | 5 |
| Export Formats | PDF | PDF, DOCX, JSON |

---

## Utilities

### Tier Validator
```typescript
import { TierValidator } from "@/lib/utils/tier-validator";

const validator = new TierValidator("starter");
validator.isPlatformAvailable("instagram"); // false
validator.hasFeature("hasVideoSupport"); // false
```

### Error Handler
```typescript
import {
  NotFoundError,
  ValidationError,
  TierLimitError
} from "@/lib/utils/error-handler";

throw new NotFoundError("Client");
throw new ValidationError("Invalid email format");
throw new TierLimitError("Feature not available");
```

---

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### API Testing with cURL
```bash
# Test authentication
curl -X GET http://localhost:3008/api/clients/test-uuid

# Test creation
curl -X POST http://localhost:3008/api/clients \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","workspace_id":"uuid"}'
```

---

## Development

### Adding New Routes

1. Create route file:
```typescript
// src/app/api/new-route/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Route logic
}
```

2. Add error handling:
```typescript
import { handleError } from "@/lib/utils/error-handler";

try {
  // Logic
} catch (error) {
  return handleError(error);
}
```

3. Add tier validation (if needed):
```typescript
const validator = new TierValidator(organization.plan);
// Validation logic
```

4. Add audit logging:
```typescript
await db.auditLogs.create({
  // Audit details
});
```

---

## Security

### Authentication
- All routes require NextAuth.js session
- Session validation on every request
- User ID extracted from session

### Authorization
- Organization-level access control
- Workspace isolation
- Tier-based feature restrictions

### Input Validation
- Required field validation
- Email format validation
- File type and size validation
- Input sanitization

### Audit Trail
- All operations logged
- User actions tracked
- Error logging

---

## Performance

### Optimization Strategies
- Database query optimization
- Pagination for large datasets
- Caching (ready for Redis integration)
- Async operations
- Connection pooling

### Rate Limiting
- Standard: 100 req/min
- Professional: 500 req/min
- Enterprise: Unlimited

---

## Deployment

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=your-url
```

### Build
```bash
npm run build
```

### Deploy to Vercel
```bash
vercel --prod
```

---

## Documentation

- **API Routes**: `API_ROUTES.md` - Complete endpoint documentation
- **API Structure**: `API_STRUCTURE.md` - Visual tree structure
- **Build Summary**: `API_BUILD_SUMMARY.md` - Implementation details
- **Architecture**: `ARCHITECTURE.md` - System architecture

---

## Support

For issues or questions:
1. Check documentation files
2. Review error logs
3. Verify tier limits
4. Check authentication

---

**Version**: 1.0.0
**Status**: Production-ready
**Framework**: Next.js 15
**Language**: TypeScript
**Database**: Supabase (PostgreSQL)
