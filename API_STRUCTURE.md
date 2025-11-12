# Unite-Hub CRM - API Structure

## Visual API Tree Structure

```
/api
│
├── /clients
│   ├── POST /clients                          → Create new client
│   │
│   └── /[id]
│       ├── GET    /clients/[id]               → Get client details
│       ├── PUT    /clients/[id]               → Update client
│       ├── DELETE /clients/[id]               → Delete client
│       │
│       ├── /assets
│       │   ├── GET  /clients/[id]/assets      → Get all assets
│       │   │
│       │   ├── /upload
│       │   │   └── POST /clients/[id]/assets/upload → Upload asset
│       │   │
│       │   └── /[assetId]
│       │       ├── PUT    /clients/[id]/assets/[assetId] → Update asset
│       │       └── DELETE /clients/[id]/assets/[assetId] → Delete asset
│       │
│       ├── /persona
│       │   ├── GET  /clients/[id]/persona     → Get current persona
│       │   ├── POST /clients/[id]/persona     → Generate persona
│       │   │
│       │   ├── /history
│       │   │   └── GET /clients/[id]/persona/history → Get versions
│       │   │
│       │   └── /export
│       │       └── POST /clients/[id]/persona/export → Export persona
│       │
│       ├── /mindmap
│       │   ├── GET /clients/[id]/mindmap      → Get mind map
│       │   │
│       │   ├── /update
│       │   │   └── POST /clients/[id]/mindmap/update → Update mind map
│       │   │
│       │   └── /export
│       │       └── POST /clients/[id]/mindmap/export → Export mind map
│       │
│       ├── /strategy
│       │   ├── GET  /clients/[id]/strategy    → Get strategy
│       │   ├── POST /clients/[id]/strategy    → Generate strategy
│       │   │
│       │   ├── /platforms
│       │   │   └── GET /clients/[id]/strategy/platforms → Platform strategies
│       │   │
│       │   └── /export
│       │       └── POST /clients/[id]/strategy/export → Export strategy
│       │
│       ├── /campaigns
│       │   ├── GET  /clients/[id]/campaigns   → Get all campaigns
│       │   ├── POST /clients/[id]/campaigns   → Create campaign
│       │   │
│       │   ├── /duplicate
│       │   │   └── POST /clients/[id]/campaigns/duplicate → Duplicate
│       │   │
│       │   └── /[cid]
│       │       ├── GET    /clients/[id]/campaigns/[cid] → Get campaign
│       │       ├── PUT    /clients/[id]/campaigns/[cid] → Update campaign
│       │       └── DELETE /clients/[id]/campaigns/[cid] → Delete campaign
│       │
│       └── /hooks
│           ├── GET  /clients/[id]/hooks       → Get all hooks
│           └── POST /clients/[id]/hooks       → Generate hooks
│
├── /hooks
│   ├── /search
│   │   └── GET /hooks/search                  → Search all hooks
│   │
│   └── /favorite
│       ├── GET  /hooks/favorite               → Get favorites
│       └── POST /hooks/favorite               → Toggle favorite
│
└── /organization
    └── /clients
        └── GET /organization/clients          → Get org clients
```

---

## HTTP Methods Summary

| Method | Count | Use Case |
|--------|-------|----------|
| GET | 15 | Retrieve resources |
| POST | 10 | Create/Generate resources |
| PUT | 3 | Update resources |
| DELETE | 3 | Delete resources |

**Total Endpoints**: 31 new endpoints

---

## Resource Categories

### 1. Client Management (5 endpoints)
- CRUD operations for clients
- Organization-level listing
- Pagination and filtering

### 2. Asset Management (4 endpoints)
- Upload, retrieve, update, delete assets
- File type validation
- Tier-based limits

### 3. Persona System (4 endpoints)
- AI-powered persona generation
- Version history tracking
- Multi-format export

### 4. Mind Map (3 endpoints)
- Visual concept mapping
- Real-time updates
- Export functionality

### 5. Marketing Strategy (4 endpoints)
- Comprehensive strategy generation
- Platform-specific tactics
- Export capabilities

### 6. Campaign Management (6 endpoints)
- Multi-platform campaigns
- CRUD operations
- Duplication functionality

### 7. Hooks & Scripts (5 endpoints)
- AI-powered hook generation
- Search functionality
- Favorites management

---

## Request/Response Flow

```
Client Request
      │
      ▼
┌─────────────────┐
│  Next.js Route  │
│    Handler      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Authentication │  ← NextAuth Session
│     Check       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Tier           │  ← TierValidator
│  Validation     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Business       │
│  Logic          │
└────────┬────────┘
         │
         ├─────────────┐
         │             │
         ▼             ▼
┌──────────────┐  ┌─────────────┐
│   Database   │  │   AI API    │
│   (Supabase) │  │  (Claude)   │
└──────┬───────┘  └──────┬──────┘
       │                 │
       └────────┬────────┘
                │
                ▼
       ┌─────────────────┐
       │  Audit Logging  │
       └────────┬────────┘
                │
                ▼
       ┌─────────────────┐
       │  JSON Response  │
       └─────────────────┘
```

---

## Authentication Flow

```
Request Headers
      │
      ▼
┌──────────────────────┐
│  NextAuth Session    │
│  - User ID           │
│  - Email             │
│  - Permissions       │
└──────────┬───────────┘
           │
           ▼
    ┌──────────────┐
    │  Authorized? │
    └──────┬───────┘
           │
     ┌─────┴─────┐
     │           │
    Yes         No
     │           │
     ▼           ▼
┌─────────┐  ┌──────────┐
│Continue │  │ Return   │
│Process  │  │ 401      │
└─────────┘  └──────────┘
```

---

## Tier Validation Flow

```
Request
   │
   ▼
┌────────────────────────┐
│  Get User's Plan       │
│  (starter/professional)│
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│  TierValidator         │
│  - Check feature access│
│  - Check usage limits  │
│  - Check platform      │
└──────────┬─────────────┘
           │
     ┌─────┴──────┐
     │            │
  Allowed     Not Allowed
     │            │
     ▼            ▼
┌─────────┐  ┌──────────────┐
│Continue │  │ Return 403   │
│         │  │ with upgrade │
│         │  │ message      │
└─────────┘  └──────────────┘
```

---

## Error Handling Flow

```
Exception Thrown
       │
       ▼
┌──────────────────┐
│  Error Handler   │
└────────┬─────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌─────────────────┐  ┌─────────────────┐
│  AppError?      │  │  Standard Error │
│  - Known errors │  │  - Unknown      │
│  - Typed        │  │  - Generic 500  │
└────────┬────────┘  └────────┬────────┘
         │                    │
         └──────────┬─────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  Log Error           │
         │  - Console           │
         │  - External service  │
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  Return JSON         │
         │  - Error message     │
         │  - Error code        │
         │  - Status code       │
         └──────────────────────┘
```

---

## File Organization

```
src/app/api/
│
├── clients/                           # Client management
│   ├── route.ts                       # POST /clients
│   │
│   └── [id]/                          # Dynamic client ID
│       ├── route.ts                   # GET, PUT, DELETE
│       │
│       ├── assets/                    # Asset management
│       │   ├── route.ts               # GET assets
│       │   ├── upload/
│       │   │   └── route.ts           # POST upload
│       │   └── [assetId]/
│       │       └── route.ts           # PUT, DELETE
│       │
│       ├── persona/                   # Persona system
│       │   ├── route.ts               # GET, POST
│       │   ├── history/
│       │   │   └── route.ts           # GET history
│       │   └── export/
│       │       └── route.ts           # POST export
│       │
│       ├── mindmap/                   # Mind mapping
│       │   ├── route.ts               # GET
│       │   ├── update/
│       │   │   └── route.ts           # POST update
│       │   └── export/
│       │       └── route.ts           # POST export
│       │
│       ├── strategy/                  # Marketing strategy
│       │   ├── route.ts               # GET, POST
│       │   ├── platforms/
│       │   │   └── route.ts           # GET platforms
│       │   └── export/
│       │       └── route.ts           # POST export
│       │
│       ├── campaigns/                 # Campaign management
│       │   ├── route.ts               # GET, POST
│       │   ├── duplicate/
│       │   │   └── route.ts           # POST duplicate
│       │   └── [cid]/
│       │       └── route.ts           # GET, PUT, DELETE
│       │
│       └── hooks/                     # Hooks for client
│           └── route.ts               # GET, POST
│
├── hooks/                             # Global hooks
│   ├── search/
│   │   └── route.ts                   # GET search
│   └── favorite/
│       └── route.ts                   # GET, POST
│
└── organization/                      # Organization-level
    └── clients/
        └── route.ts                   # GET all clients
```

---

## Data Flow Diagram

```
┌──────────────┐
│   Frontend   │
│  (Next.js)   │
└──────┬───────┘
       │
       │ HTTP Request
       ▼
┌──────────────────────────────────────────┐
│         API Routes Layer                 │
│  - Authentication                        │
│  - Validation                            │
│  - Business Logic                        │
└──────┬──────────────────────────┬────────┘
       │                          │
       │                          │
       ▼                          ▼
┌─────────────────┐      ┌────────────────┐
│   Database      │      │   AI Services  │
│   (Supabase)    │      │   (Claude)     │
│                 │      │                │
│ - Organizations │      │ - Personas     │
│ - Workspaces    │      │ - Strategies   │
│ - Clients       │      │ - Hooks        │
│ - Campaigns     │      │ - Content      │
│ - Assets        │      └────────────────┘
│ - Audit Logs    │
└─────────────────┘
       │
       │
       ▼
┌─────────────────┐
│  Cloud Storage  │
│  (S3/Cloudinary)│
│                 │
│ - Asset files   │
│ - Exports       │
│ - Generated     │
│   images        │
└─────────────────┘
```

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total API Route Files | 21 |
| Total Endpoints | 31 |
| GET Endpoints | 15 |
| POST Endpoints | 10 |
| PUT Endpoints | 3 |
| DELETE Endpoints | 3 |
| Utility Files | 2 |
| Documentation Files | 3 |
| Lines of Code | ~2,500+ |

---

**Status**: Production-ready API structure
**Architecture**: RESTful, scalable, secure
**Framework**: Next.js 15 App Router
**Language**: TypeScript
**Authentication**: NextAuth.js
**Database**: Supabase (PostgreSQL)
