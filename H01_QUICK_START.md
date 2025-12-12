# Guardian H01: AI Rule Suggestion Studio — Quick Start

**Status**: ✅ Production Ready (All 8 Tasks Complete)

---

## What Is H01?

Guardian H01 adds **AI-assisted rule suggestions** that:
- Analyze Guardian signals (counts, rates, windows — no raw data)
- Generate suggestions via heuristics (always) + optional AI (governance-gated)
- Never auto-create or auto-enable production rules
- Require admin review and explicit apply
- Are fully tenant-scoped with RLS

---

## Quick Routes

### Generate Suggestions
```bash
POST /api/guardian/ai/rule-suggestions?workspaceId=ws-123
{
  "windowHours": 24,      # or 168 (7d), 720 (30d)
  "maxSuggestions": 10,
  "expiresInDays": 30
}
```

Returns: `{ created, aiUsed, suggestions }`

### View Suggestions
```bash
GET /api/guardian/ai/rule-suggestions?workspaceId=ws-123
```

Returns: List with status, source, confidence, created/expires dates

### View One Suggestion
```bash
GET /api/guardian/ai/rule-suggestions/sugg-id?workspaceId=ws-123
```

Returns: Full detail with signals, rule draft, safety metadata

### Update Status
```bash
PATCH /api/guardian/ai/rule-suggestions/sugg-id?workspaceId=ws-123
{ "status": "reviewing" | "accepted" | "rejected" }
```

### Apply Suggestion (Create Draft Rule)
```bash
POST /api/guardian/ai/rule-suggestions/sugg-id/apply?workspaceId=ws-123
```

Returns: `{ ruleId, suggestionId, status: "applied", message }`
→ Created rule always has `enabled: false`

---

## UI Console

**Route**: `/guardian/rules/suggestions?workspaceId=ws-123`

### Features
1. **Generate** — Select time window, click "Generate Suggestions"
2. **List** — See all suggestions with status, source, confidence
3. **Review** — Click suggestion, view full details in right panel
4. **Act** — Mark reviewing, accept, reject, or apply
5. **Navigate** — After apply, link opens rule in editor

---

## Data Safety

✅ **What's Exported**:
- Counts (# alerts, # incidents)
- Rates (alerts/hour, failure %)
- Dimensions (rule names, channels)

❌ **What's NOT Exported**:
- Raw alert/incident payloads
- Email addresses, IP addresses
- Webhook URLs with credentials
- User names, contact info
- Free-text fields with input
- API keys, tokens, secrets

---

## Governance Integration

H01 respects Z10 `ai_usage_policy` flag:
- `enabled` → Use AI suggestions (Claude Sonnet)
- `disabled` → Heuristics only
- **Missing Z10** → Fallback to heuristics (graceful)

Check flag: Open Z10 governance console, see feature flags

---

## Files at a Glance

### Services (in `src/lib/guardian/ai/`)
- `ruleSuggestionSignals.ts` — Collects PII-free aggregates
- `heuristicRuleSuggester.ts` — Deterministic suggestions
- `aiRuleSuggester.ts` — Claude-powered suggestions
- `ruleSuggestionOrchestrator.ts` — Orchestrates full flow

### API Routes (in `src/app/api/guardian/ai/rule-suggestions/`)
- `route.ts` — GET list, POST generate
- `[id]/route.ts` — GET detail, PATCH status
- `[id]/feedback/route.ts` — POST feedback
- `[id]/apply/route.ts` — POST create rule

### UI (in `src/app/guardian/rules/`)
- `suggestions/page.tsx` — Console (list + detail)

### Tests
- `tests/guardian/h01_ai_rule_suggestion_studio.test.ts` — 27+ tests

### Database
- `supabase/migrations/611_*.sql` — Tables + RLS

---

## Workflow

1. **Generate** → POST `/api/guardian/ai/rule-suggestions`
2. **View List** → GET `/api/guardian/ai/rule-suggestions`
3. **Review Detail** → GET `/api/guardian/ai/rule-suggestions/[id]`
4. **Mark Reviewing** → PATCH status="reviewing"
5. **Accept** → PATCH status="accepted"
6. **Apply** → POST `/api/guardian/ai/rule-suggestions/[id]/apply`
7. **Edit Rule** → Navigate from apply response, edit + enable
8. **Track Feedback** → POST `/api/guardian/ai/rule-suggestions/[id]/feedback`

---

## Troubleshooting

| Issue | Check |
|-------|-------|
| No suggestions | Generate with 7d window (more data) |
| AI disabled | Check Z10 governance flags |
| Safety warning | Review rule draft, check signals |
| Rule not in editor | Verify applied_rule_id in response |

---

## Next Steps

1. **Deploy** → `npm run build && npm run deploy`
2. **Test** → Navigate to `/guardian/rules/suggestions`
3. **Generate** → Create suggestions for 24h window
4. **Review** → Check signals, rule draft, safety
5. **Apply** → Create draft rule, enable in editor

---

**Documentation**: [PHASE_H01_GUARDIAN_AI_RULE_SUGGESTION_STUDIO.md](docs/PHASE_H01_GUARDIAN_AI_RULE_SUGGESTION_STUDIO.md)
