# Feature Flag

> Feature toggle patterns with gradual rollout, percentage-based targeting, and runtime configuration for NodeJS-Starter-V1.

---

## Metadata

| Field          | Value                                                    |
| -------------- | -------------------------------------------------------- |
| **Skill ID**   | `feature-flag`                                           |
| **Category**   | Orchestration & Workflow                                 |
| **Complexity** | Medium                                                   |
| **Complements**| `api-contract`, `metrics-collector`, `cache-strategy`    |
| **Version**    | 1.0.0                                                    |
| **Locale**     | en-AU                                                    |

---

## Description

Codifies feature flag patterns for NodeJS-Starter-V1: database-backed flag storage, percentage-based rollout, user targeting rules, React hook for client-side flag evaluation, FastAPI dependency for server-side checks, and operational controls for kill switches.

---

## When to Apply

### Positive Triggers

- Gradually rolling out a new feature to a percentage of users
- Adding kill switches for risky features in production
- A/B testing different implementations
- Enabling features per user role or environment
- Decoupling deployment from feature release

### Negative Triggers

- Environment-specific configuration (use environment variables)
- Role-based access control for endpoints (use `rbac-patterns` skill)
- API versioning for breaking changes (use `api-versioning` skill)
- Scheduled feature activation (use `cron-scheduler` skill)

---

## Core Principles

### The Three Laws of Feature Flags

1. **Short-Lived by Default**: Feature flags are temporary. Every flag must have an expiry date. Permanent flags become technical debt that obscures the codebase.
2. **Evaluate, Don't Branch**: Check the flag value once at the entry point. Do not scatter flag checks throughout the codebase — it creates unmaintainable conditional spaghetti.
3. **Observable**: Every flag evaluation must be logged or metriced. Without observability, you cannot know which flags are active, which are stale, and which are causing issues.

---

## Pattern 1: Flag Model (Python)

### Database-Backed Flag Storage

```python
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field


class FlagStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"


class RolloutStrategy(str, Enum):
    ALL = "all"              # Enabled for everyone
    NONE = "none"            # Disabled for everyone
    PERCENTAGE = "percentage" # Enabled for N% of users
    ALLOWLIST = "allowlist"  # Enabled for specific users
    ROLE = "role"            # Enabled for specific roles


class FeatureFlag(BaseModel):
    key: str                    # e.g., "new-dashboard-v2"
    description: str
    status: FlagStatus = FlagStatus.INACTIVE
    strategy: RolloutStrategy = RolloutStrategy.NONE
    percentage: int = 0         # 0-100, used with PERCENTAGE strategy
    allowlist: list[str] = Field(default_factory=list)  # User IDs
    allowed_roles: list[str] = Field(default_factory=list)
    expires_at: datetime | None = None
    created_at: datetime = Field(default_factory=datetime.now)


class FlagEvaluation(BaseModel):
    flag_key: str
    user_id: str | None
    enabled: bool
    reason: str  # "percentage", "allowlist", "role", "default"
```

---

## Pattern 2: Flag Evaluator

### Deterministic Evaluation with Hashing

```python
import hashlib


class FlagEvaluator:
    """Evaluates feature flags for a given user context."""

    def __init__(self, flags: dict[str, FeatureFlag]) -> None:
        self.flags = flags

    def is_enabled(
        self,
        key: str,
        user_id: str | None = None,
        user_role: str | None = None,
    ) -> FlagEvaluation:
        flag = self.flags.get(key)
        if not flag or flag.status != FlagStatus.ACTIVE:
            return FlagEvaluation(flag_key=key, user_id=user_id, enabled=False, reason="not_found")

        # Check expiry
        if flag.expires_at and datetime.now() > flag.expires_at:
            return FlagEvaluation(flag_key=key, user_id=user_id, enabled=False, reason="expired")

        match flag.strategy:
            case RolloutStrategy.ALL:
                return FlagEvaluation(flag_key=key, user_id=user_id, enabled=True, reason="all")

            case RolloutStrategy.NONE:
                return FlagEvaluation(flag_key=key, user_id=user_id, enabled=False, reason="none")

            case RolloutStrategy.ALLOWLIST:
                enabled = user_id in flag.allowlist if user_id else False
                return FlagEvaluation(flag_key=key, user_id=user_id, enabled=enabled, reason="allowlist")

            case RolloutStrategy.ROLE:
                enabled = user_role in flag.allowed_roles if user_role else False
                return FlagEvaluation(flag_key=key, user_id=user_id, enabled=enabled, reason="role")

            case RolloutStrategy.PERCENTAGE:
                if not user_id:
                    return FlagEvaluation(flag_key=key, user_id=None, enabled=False, reason="no_user")
                # Deterministic hash-based percentage
                hash_input = f"{key}:{user_id}"
                hash_val = int(hashlib.sha256(hash_input.encode()).hexdigest()[:8], 16)
                bucket = hash_val % 100
                enabled = bucket < flag.percentage
                return FlagEvaluation(flag_key=key, user_id=user_id, enabled=enabled, reason="percentage")

        return FlagEvaluation(flag_key=key, user_id=user_id, enabled=False, reason="default")
```

**Rule**: Use SHA-256 hashing for percentage rollout. This ensures the same user always gets the same result for a given flag, preventing flickering.

---

## Pattern 3: FastAPI Integration

### Dependency-Injection Flag Checks

```python
from fastapi import Depends


def require_flag(flag_key: str):
    """FastAPI dependency that gates an endpoint behind a feature flag."""

    async def guard(
        current_user = Depends(get_current_user),
        evaluator: FlagEvaluator = Depends(get_flag_evaluator),
    ):
        result = evaluator.is_enabled(
            flag_key,
            user_id=str(current_user.id),
            user_role=current_user.role,
        )
        if not result.enabled:
            raise HTTPException(status_code=404, detail="Not found")
        return current_user

    return guard


# Usage
@router.get("/dashboard/v2")
async def new_dashboard(
    user = Depends(require_flag("new-dashboard-v2")),
):
    """New dashboard — behind feature flag."""
    ...
```

---

## Pattern 4: React Hook (TypeScript)

### Client-Side Flag Evaluation

```typescript
"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface FlagContext {
  flags: Record<string, boolean>;
  isEnabled: (key: string) => boolean;
}

const FlagContext = createContext<FlagContext>({
  flags: {},
  isEnabled: () => false,
});

export function FlagProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/flags")
      .then((r) => r.json())
      .then((data) => setFlags(data.flags));
  }, []);

  const isEnabled = (key: string) => flags[key] ?? false;

  return (
    <FlagContext.Provider value={{ flags, isEnabled }}>
      {children}
    </FlagContext.Provider>
  );
}

export function useFeatureFlag(key: string): boolean {
  const { isEnabled } = useContext(FlagContext);
  return isEnabled(key);
}

// Usage in components
function DashboardPage() {
  const showNewDashboard = useFeatureFlag("new-dashboard-v2");

  return showNewDashboard ? <NewDashboard /> : <LegacyDashboard />;
}
```

---

## Pattern 5: Admin API for Flag Management

### CRUD Endpoints

```python
@router.get("/api/flags")
async def list_flags(user = Depends(require_permission("flags:read"))):
    flags = await get_all_flags()
    return {"flags": {f.key: evaluator.is_enabled(f.key).enabled for f in flags}}


@router.put("/api/flags/{key}")
async def update_flag(
    key: str,
    update: FeatureFlag,
    user = Depends(require_permission("flags:manage")),
):
    await save_flag(update)
    return {"status": "updated"}
```

**Complements**: `rbac-patterns` skill — flag management requires `flags:manage` permission. `metrics-collector` skill — track flag evaluation counts for rollout monitoring.

---

## Anti-Patterns

| Pattern | Problem | Correct Approach |
|---------|---------|-----------------:|
| Permanent feature flags | Codebase littered with dead branches | Expiry dates, clean up after rollout |
| Flag checks scattered everywhere | Unmaintainable conditional logic | Single evaluation at entry point |
| Random-based percentage | User sees different state on refresh | Deterministic hash-based bucketing |
| No flag observability | Cannot tell which flags are active | Log every evaluation |
| Flags in environment variables | Requires redeploy to change | Database-backed, runtime updateable |

---

## Checklist

Before merging feature-flag changes:

- [ ] `FeatureFlag` model with strategy, percentage, allowlist, expiry
- [ ] `FlagEvaluator` with deterministic hash-based percentage rollout
- [ ] `require_flag()` FastAPI dependency for endpoint gating
- [ ] `useFeatureFlag()` React hook with context provider
- [ ] Admin API for flag CRUD with `flags:manage` permission
- [ ] Flag evaluation logging for observability

---

## Response Format

When applying this skill, structure implementation as:

```markdown
### Feature Flag Implementation

**Storage**: [database / Redis / environment]
**Strategies**: [all, none, percentage, allowlist, role]
**Percentage Method**: [hash-based / random]
**Client SDK**: [React hook / fetch / none]
**Admin UI**: [API endpoints / dashboard / CLI]
**Observability**: [metrics / logging / both]
```
