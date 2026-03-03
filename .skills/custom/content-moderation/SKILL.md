# Content Moderation

> Automated content filtering, safety checks, and toxicity detection for NodeJS-Starter-V1.

---

## Metadata

| Field          | Value                                                    |
| -------------- | -------------------------------------------------------- |
| **Skill ID**   | `content-moderation`                                     |
| **Category**   | Document & Content                                       |
| **Complexity** | Medium                                                   |
| **Complements**| `error-taxonomy`, `input-sanitisation`, `audit-trail`    |
| **Version**    | 1.0.0                                                    |
| **Locale**     | en-AU                                                    |

---

## Description

Codifies content moderation patterns for NodeJS-Starter-V1: rule-based content filtering, AI-powered toxicity detection using the existing AI provider layer, moderation queues for human review, automated action policies, content safety middleware for API endpoints, and audit logging of moderation decisions.

---

## When to Apply

### Positive Triggers

- Filtering user-generated content before display
- Detecting toxic, harmful, or inappropriate text in submissions
- Building a moderation queue for human reviewers
- Adding content safety checks to agent-generated outputs
- Implementing automated moderation policies (warn, flag, block)

### Negative Triggers

- Input sanitisation for XSS/injection (use `input-sanitisation` skill)
- Error classification and codes (use `error-taxonomy` skill)
- Audit logging of moderation actions (use `audit-trail` skill)
- Rate limiting submissions (use `rate-limiter` skill)

---

## Core Principles

### The Three Laws of Content Moderation

1. **Defence in Depth**: Combine rule-based filters (fast, deterministic) with AI-based detection (nuanced, contextual). Neither alone is sufficient.
2. **Log Every Decision**: Record what was moderated, why, and what action was taken. Transparency is essential for appeals, compliance, and model improvement.
3. **Fail Safe, Not Silent**: If the moderation system is unavailable, queue content for review rather than publishing unmoderated. Never silently pass unmoderated content.

---

## Pattern 1: Content Safety Model

### Moderation Types and Actions

```python
from enum import Enum
from pydantic import BaseModel, Field


class ModerationCategory(str, Enum):
    TOXICITY = "toxicity"
    HARASSMENT = "harassment"
    HATE_SPEECH = "hate_speech"
    VIOLENCE = "violence"
    SEXUAL = "sexual"
    SPAM = "spam"
    PII = "pii"
    CUSTOM = "custom"


class ModerationAction(str, Enum):
    ALLOW = "allow"
    FLAG = "flag"       # Allow but flag for review
    WARN = "warn"       # Allow with user warning
    BLOCK = "block"     # Reject content
    QUEUE = "queue"     # Hold for human review


class ModerationResult(BaseModel):
    content_id: str
    action: ModerationAction
    categories: list[ModerationCategory] = Field(default_factory=list)
    confidence: float = 0.0
    reason: str = ""
    flagged_segments: list[str] = Field(default_factory=list)


class ModerationPolicy(BaseModel):
    """Configurable policy per content type."""
    content_type: str  # "comment", "document", "agent_output"
    rules: list[str] = Field(default_factory=list)
    ai_check: bool = True
    threshold: float = 0.7  # AI confidence threshold for blocking
    default_action: ModerationAction = ModerationAction.QUEUE
```

---

## Pattern 2: Rule-Based Filter

### Fast Deterministic Checks

```python
import re


class RuleBasedFilter:
    """Fast, deterministic content filtering."""

    def __init__(self) -> None:
        self.blocked_patterns: list[re.Pattern] = []
        self.pii_patterns = {
            "email": re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b"),
            "phone_au": re.compile(r"\b(?:04\d{2}|\+614\d{1})\s?\d{3}\s?\d{3}\b"),
            "tfn": re.compile(r"\b\d{3}\s?\d{3}\s?\d{3}\b"),  # Tax File Number
        }

    def add_blocked_pattern(self, pattern: str) -> None:
        self.blocked_patterns.append(re.compile(pattern, re.IGNORECASE))

    def check(self, content: str) -> ModerationResult:
        categories: list[ModerationCategory] = []
        flagged: list[str] = []

        # Check blocked patterns
        for pattern in self.blocked_patterns:
            matches = pattern.findall(content)
            if matches:
                categories.append(ModerationCategory.CUSTOM)
                flagged.extend(matches[:3])

        # Check PII
        for pii_type, pattern in self.pii_patterns.items():
            if pattern.search(content):
                categories.append(ModerationCategory.PII)
                flagged.append(f"[{pii_type} detected]")

        action = ModerationAction.BLOCK if categories else ModerationAction.ALLOW
        return ModerationResult(
            content_id="",
            action=action,
            categories=categories,
            confidence=1.0,
            reason="Rule-based filter match" if categories else "",
            flagged_segments=flagged,
        )
```

**Australian context**: The PII patterns include Australian phone numbers (`04xx xxx xxx`) and Tax File Numbers (TFN). Extend with ABN, Medicare number, and BSB patterns as needed.

---

## Pattern 3: AI-Powered Moderation

### Using the Existing AI Provider Layer

```python
from src.models.selector import get_ai_provider

MODERATION_PROMPT = """Analyse the following content for safety issues.
Respond with JSON only:
{
  "safe": true/false,
  "categories": ["toxicity", "harassment", "hate_speech", "violence", "sexual", "spam"],
  "confidence": 0.0-1.0,
  "reason": "brief explanation"
}

Content to analyse:
{content}"""


async def ai_moderation_check(content: str) -> ModerationResult:
    """Use AI provider for nuanced content moderation."""
    provider = get_ai_provider()
    response = await provider.complete(
        MODERATION_PROMPT.format(content=content[:2000]),
    )

    import json
    result = json.loads(response)

    categories = [
        ModerationCategory(c) for c in result.get("categories", [])
        if c in ModerationCategory.__members__.values()
    ]

    action = ModerationAction.ALLOW if result["safe"] else ModerationAction.FLAG
    if not result["safe"] and result.get("confidence", 0) > 0.9:
        action = ModerationAction.BLOCK

    return ModerationResult(
        content_id="",
        action=action,
        categories=categories,
        confidence=result.get("confidence", 0.0),
        reason=result.get("reason", ""),
    )
```

**Project Reference**: `apps/backend/src/models/selector.py` — the AI provider selector automatically chooses between Ollama (local) and Anthropic (cloud). Content moderation uses the same abstraction.

---

## Pattern 4: Moderation Middleware (FastAPI)

### Endpoint-Level Content Checks

```python
from fastapi import Request, HTTPException


async def moderate_request_body(request: Request) -> None:
    """FastAPI dependency that moderates request body content."""
    body = await request.json()
    content_fields = ["content", "body", "message", "description"]

    for field in content_fields:
        text = body.get(field)
        if not text or not isinstance(text, str):
            continue

        # Fast rule-based check first
        rule_result = rule_filter.check(text)
        if rule_result.action == ModerationAction.BLOCK:
            raise HTTPException(
                status_code=422,
                detail={
                    "error": "content_moderation_failed",
                    "reason": rule_result.reason,
                    "categories": [c.value for c in rule_result.categories],
                },
            )

        # AI check for borderline content
        if rule_result.action == ModerationAction.ALLOW:
            ai_result = await ai_moderation_check(text)
            if ai_result.action == ModerationAction.BLOCK:
                raise HTTPException(
                    status_code=422,
                    detail={
                        "error": "content_moderation_failed",
                        "reason": ai_result.reason,
                    },
                )


# Usage on endpoints
@router.post("/documents")
async def create_document(
    body: CreateDocumentRequest,
    _moderation: None = Depends(moderate_request_body),
):
    ...
```

---

## Pattern 5: Moderation Queue (TypeScript)

### Human Review Interface

```typescript
interface ModerationItem {
  id: string;
  contentId: string;
  contentType: string;
  content: string;
  aiResult: {
    categories: string[];
    confidence: number;
    reason: string;
  };
  status: "pending" | "approved" | "rejected";
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

// API endpoints for moderation queue
// GET  /api/moderation/queue         - List pending items
// POST /api/moderation/{id}/approve  - Approve content
// POST /api/moderation/{id}/reject   - Reject content
```

**Complements**: `audit-trail` skill — every moderation decision (automated or human) is logged as an audit event with the reviewer, action, and reason.

---

## Anti-Patterns

| Pattern | Problem | Correct Approach |
|---------|---------|-----------------:|
| Only regex-based filtering | Misses context-dependent toxicity | Combine rules + AI detection |
| Only AI-based moderation | Slow, expensive, non-deterministic | Rules for known patterns, AI for nuance |
| No moderation on agent output | AI can generate harmful content | Moderate all output before display |
| Silent blocking without reason | User frustration, no appeal path | Return reason and category |
| No audit log of decisions | Cannot review false positives | Log every moderation decision |
| Passing unmoderated on system failure | Harmful content reaches users | Queue for review on failure |

---

## Checklist

Before merging content-moderation changes:

- [ ] `ModerationResult` model with action, categories, confidence
- [ ] Rule-based filter with PII detection (AU phone, TFN, email)
- [ ] AI-powered moderation using existing provider layer
- [ ] FastAPI middleware dependency for endpoint-level checks
- [ ] Moderation queue for human review of flagged content
- [ ] Audit logging of all moderation decisions
- [ ] Agent output moderation before display

---

## Response Format

When applying this skill, structure implementation as:

```markdown
### Content Moderation Implementation

**Rule Engine**: [regex patterns / PII detection / custom]
**AI Detection**: [Ollama / Anthropic / disabled]
**Actions**: [allow, flag, warn, block, queue]
**Human Review**: [moderation queue / email alert / none]
**Audit**: [audit-trail integration / standalone log]
**Coverage**: [user input / agent output / both]
```
