# System Supervisor - Completeness Matrix Reference

Layer-by-layer checklist with path patterns, minimum thresholds, and percentage calculation methodology.

---

## Layer Definitions

### 1. UI Layer

**What constitutes "complete"**:
- React component exists and renders without errors
- Component follows Scientific Luxury design system (if UI-facing)
- Responsive behaviour defined (or explicitly desktop-only)

**Path patterns to scan**:
```
apps/web/app/**/page.tsx       # Page routes
apps/web/app/**/layout.tsx     # Layout wrappers
apps/web/components/**/*.tsx   # Shared components
```

**Scoring**: Y = component exists and renders | P = component exists, incomplete | N = no component

### 2. API Route Layer

**What constitutes "complete"**:
- FastAPI route handler defined with correct HTTP method
- Request/response models defined (Pydantic)
- Route registered in router

**Path patterns to scan**:
```
apps/backend/src/api/**/*.py   # Route handlers
apps/backend/src/api/deps.py   # Shared dependencies
```

**Scoring**: Y = route exists with models | P = route exists, missing models | N = no route

### 3. Data Model Layer

**What constitutes "complete"**:
- SQLAlchemy model defined with all required columns
- Relationships configured if applicable
- Migration exists for table creation

**Path patterns to scan**:
```
apps/backend/src/db/models.py  # SQLAlchemy models
apps/backend/src/db/*.py       # Additional model files
scripts/init-db.sql            # Initial schema
```

**Scoring**: Y = model + migration | P = model without migration | N = no model

### 4. Validation Layer

**What constitutes "complete"**:
- Backend: Pydantic model validates request input
- Frontend: Zod schema validates form input (if UI exists)
- Edge cases handled (empty strings, null values, boundary values)

**Path patterns to scan**:
```
apps/backend/src/api/**/*.py           # Pydantic models inline
apps/backend/src/models/**/*.py        # Shared Pydantic models
apps/web/lib/api/*.ts                  # Zod schemas
apps/web/components/**/*.tsx           # Inline Zod usage
```

**Scoring**: Y = both backend + frontend validation | P = one side only | N = no validation

### 5. Test Layer

**What constitutes "complete"**:
- At least one test per API endpoint (happy path)
- At least one test per critical business rule
- Edge case tests for validation (recommended but not required for "complete")

**Path patterns to scan**:
```
apps/backend/tests/**/*.py             # Backend tests
apps/web/**/*.test.ts                  # Frontend unit tests
apps/web/**/*.test.tsx                 # Frontend component tests
```

**Scoring**: Y = happy path + edge cases | P = happy path only | N = no tests

### 6. Documentation Layer

**What constitutes "complete"**:
- Feature or endpoint documented in `docs/`
- README or spec file references the feature
- Inline code comments for complex logic (not required for simple CRUD)

**Path patterns to scan**:
```
docs/features/**/*.md                  # Feature docs
docs/reference/**/*.md                 # API reference
docs/phases/**/*.md                    # Phase specs mentioning feature
```

**Scoring**: Y = dedicated doc or spec entry | P = mentioned but not detailed | N = undocumented

### 7. Error Handling Layer

**What constitutes "complete"**:
- API errors follow error-taxonomy format (`DOMAIN_CATEGORY_SPECIFIC`)
- Frontend handles API errors with user-facing messages
- No empty catch blocks or swallowed exceptions

**Path patterns to scan**:
```
apps/backend/src/api/**/*.py           # HTTPException raises
apps/web/lib/api/*.ts                  # ApiClientError handling
apps/web/app/**/error.tsx              # Error boundary pages
```

**Scoring**: Y = structured errors + frontend handling | P = partial | N = no error handling

---

## Percentage Calculation

### Per-Feature Score

Each layer scores: Y = 1.0, P = 0.5, N = 0.0

```
feature_score = (sum of layer scores / total layers) * 100
```

**Example**: Auth feature with Y, Y, Y, Y, Y, Y, Y = 7/7 = 100%
**Example**: Contractors with Y, Y, Y, P, N, N, P = 4.0/7 = 57%

### Overall Project Score

```
project_score = (sum of feature scores / number of features)
```

---

## Thresholds

| Score | Status | Gate |
|-------|--------|------|
| 100% | Release-ready | May merge and deploy |
| 80-99% | Acceptable | May merge; document gaps in Beads |
| 50-79% | Incomplete | Requires completion plan before merge |
| < 50% | Not ready | Must complete core layers (UI, API, Model, Tests) |

### Minimum Viable Completeness

For a feature to be considered "merge-ready" even at < 100%, these layers are **mandatory**:

1. **API Route** — must be Y or P
2. **Data Model** — must be Y or P (if feature persists data)
3. **Error Handling** — must be Y or P

These layers are **recommended** but not blocking:

4. **Tests** — strongly recommended, blocking in SCALE mode
5. **Documentation** — recommended, blocking before release
6. **Validation** — recommended, blocking for user-facing input
7. **UI** — required only if feature is user-facing
