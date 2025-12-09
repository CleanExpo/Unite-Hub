# Intelligence Layer Quick Start

**TL;DR**: Three new advisory modules for skill analytics. Read-only, non-destructive. Use immediately.

---

## What You Get

| Module | Does | Output |
|--------|------|--------|
| **APPM** | Predicts agent failure risk | `/reports/agent_performance_prediction_*.json` |
| **SRRE** | Generates refactor plans | `/reports/skill_refactor_plan_*.json` + `.md` |
| **SID** | Shows beautiful dashboard | `/admin/skill-intelligence` |

---

## Quick Start (5 minutes)

### 1. Generate reports

```bash
npm run shadow:full
```

### 2. Run intelligence analysis

```bash
npm run intelligence:all
```

### 3. View dashboard

```
http://localhost:3008/admin/skill-intelligence
```

---

## What You'll See

### Dashboard Stats
- 📊 Total skills analyzed
- 🚨 Risk score (0-100)
- 📋 Drift issues detected
- 🔧 Skills needing refactor

### Risk Breakdown
- 🚨 High-risk skills (immediate action)
- ⚠️ Medium-risk skills (monitor)
- ✅ Low-risk skills (healthy)

### Refactor Opportunities
- 💰 High-ROI quick wins
- 🚨 Critical refactors
- 📊 Effort estimates

### Recommendations
- Priority-ordered action items
- SLAs for each action
- Consolidated insights

---

## Key Concepts

### APPM (Risk Scoring)
```
Risk Score = (drift_issues × 12) + (underutilized × 8) + (poor_health × 5)

Classification:
  > 60 = 🚨 HIGH RISK (immediate action)
  > 30 = ⚠️ MEDIUM RISK (plan this sprint)
  ≤ 30 = ✅ LOW RISK (healthy)
```

### SRRE (ROI Scoring)
```
ROI = Impact / Effort

Example:
  Skill A: Impact=100, Effort=20 → ROI=5.0 (high-value)
  Skill B: Impact=50, Effort=50 → ROI=1.0 (lower-value)

Prioritize high-ROI first
```

### SID (Dashboard)
- Real-time data from all reports
- No code changes (read-only)
- Beautiful visualization
- Click-through to details

---

## CLI Commands

### Run Individual Modules
```bash
# Risk assessment only
npm run intelligence:appm

# Refactor planning only
npm run intelligence:srre

# Both together
npm run intelligence:all
```

### View Reports
```bash
# List all reports
ls reports/

# View APPM results
cat reports/agent_performance_prediction_*.json | jq

# View SRRE results
cat reports/skill_refactor_plan_*.json | jq
```

---

## Integration with Shadow Observer

The intelligence layer **automatically reads** from Shadow Observer reports:

```
Shadow Observer Output (step 10)
  ↓
  ├→ SVIE_ANALYSIS_*.json
  ├→ SKILL_DRIFT_*.json
  ├→ SKILL_HEATMAP_*.json
  │
  └→ Intelligence Layer Input
      ├→ APPM (risk prediction)
      ├→ SRRE (refactor planning)
      └→ SID (visualization)
```

**No manual configuration needed** — just run the commands above.

---

## Common Scenarios

### "My risk score is 65 — what do I do?"
1. Review APPM insights in dashboard
2. Check high-risk skills list
3. Follow priority recommendations
4. Allocate ~2-4 weeks for fixes

### "Which refactors should I do first?"
1. Filter by "SRRE: High-ROI Quick Wins"
2. Sort by effort (lowest first)
3. Do critical refactors first (🚨 priority 1)
4. Then high-ROI (💰 priority 3)

### "What about the dashboard data?"
- Refreshes when you reload `/admin/skill-intelligence`
- Reads latest reports from `/reports/`
- No caching (always fresh data)
- Safe to view anytime

### "Can the modules break anything?"
No. All modules are:
- ✅ Read-only from reports
- ✅ Write-only to `/reports/`
- ✅ Never modify code/database
- ✅ Safe to run repeatedly

---

## Expected Results

### APPM Output Example
```json
{
  "overallRiskScore": 45,
  "riskClassification": "medium-risk",
  "highRiskSkills": [...],
  "insights": ["⚠️ MEDIUM RISK: 5 skills require attention"]
}
```

### SRRE Output Example
```json
{
  "skillsRequiringRefactor": 18,
  "criticalRefactors": 2,
  "highROIRefactors": 4,
  "estimatedTotalHours": 96
}
```

### SID Dashboard
- Beautiful cards with real numbers
- Heat zone visualization
- Risk distribution chart
- Actionable recommendations
- Clickable stat cards

---

## Troubleshooting

### "Dashboard shows 'No data available'"
→ Run `npm run shadow:full` first, then `npm run intelligence:all`

### "APPM/SRRE runs but produces empty reports"
→ Check that SVIE analysis ran: `ls reports/SVIE_*.json`

### "Can't access /admin/skill-intelligence"
→ Ensure dev server is running: `npm run dev`

### "Reports seem outdated"
→ Refresh page (data loads from latest reports)

---

## Files Overview

```
shadow-observer/intelligence/     ← New modules
  ├── appm/                       ← Risk prediction (400 lines)
  ├── srre/                       ← Refactor plans (500 lines)
  └── run-all-intelligence.ts     ← Orchestrator (300 lines)

app/admin/skill-intelligence/     ← Dashboard UI
  └── page.tsx                    ← Beautiful dashboard (500 lines)

src/app/api/admin/skill-intelligence/  ← API
  └── route.ts                    ← Data endpoint
```

---

## Next Steps

1. ✅ Run `npm run shadow:full`
2. ✅ Run `npm run intelligence:all`
3. ✅ Visit `/admin/skill-intelligence`
4. ✅ Review recommendations
5. → Action items based on SLAs

---

## Support

**Full Documentation**:
- `INTELLIGENCE-LAYER-DELIVERY.md` — Complete feature guide
- `INTELLIGENCE-LAYER-IMPLEMENTATION.md` — Technical details

**Code**:
- `shadow-observer/intelligence/appm/` — APPM module
- `shadow-observer/intelligence/srre/` — SRRE module
- `app/admin/skill-intelligence/page.tsx` — Dashboard

---

**Status**: 🟢 Production Ready
**Ready to use**: Yes, immediately
**Non-destructive**: 100%
