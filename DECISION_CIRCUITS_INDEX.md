# Decision Circuits - Complete Index

**Branch**: `Decision_Circuits`
**Status**: ✅ Ready for testing & integration
**Last Commit**: `2affee53` (2025-12-15)

---

## 📖 Documentation Index

### Quick Navigation
| Document | Purpose | Audience |
|----------|---------|----------|
| **[DECISION_CIRCUITS_QUICK_REF.md](DECISION_CIRCUITS_QUICK_REF.md)** | API cheat sheet & troubleshooting | Developers |
| **[DECISION_CIRCUITS_SUMMARY.md](DECISION_CIRCUITS_SUMMARY.md)** | Architecture & implementation overview | Technical leads |
| **[DECISION_CIRCUITS_DEPLOYMENT.md](DECISION_CIRCUITS_DEPLOYMENT.md)** | Step-by-step deployment guide | DevOps/Deployment |
| **[docs/guides/DECISION-CIRCUITS-GUIDE.md](docs/guides/DECISION-CIRCUITS-GUIDE.md)** | Complete API reference & integration | Developers |
| **[docs/circuits/DECISION-CIRCUITS-SPEC.json](docs/circuits/DECISION-CIRCUITS-SPEC.json)** | Formal specification | Architects/PMs |

---

## 🔧 Code Files Index

### Core Library (`src/lib/decision-circuits/`)

#### [registry.ts](src/lib/decision-circuits/registry.ts) - Circuit Definitions
- 8 decision circuits registered
- Circuit validation functions
- Category-based filtering
- Input/output schema

**Key Exports**:
```typescript
DECISION_CIRCUITS           // Registry of all circuits
getCircuit()               // Get circuit by ID
getCircuitsByCategory()    // Filter by category
validateCircuitInputs()    // Validate inputs
```

#### [executor.ts](src/lib/decision-circuits/executor.ts) - Execution Engine
- Single circuit execution
- Multi-circuit chaining
- Execution logging
- Performance metrics
- Audit trail management

**Key Exports**:
```typescript
executeCircuit()                  // Execute one circuit
chainCircuits()                   // Chain multiple circuits
getCircuitExecutionHistory()      // Get audit trail
getCircuitMetrics()               // Get performance metrics
```

#### [autonomy.ts](src/lib/decision-circuits/autonomy.ts) - Self-Correction
- Strategy health evaluation
- Auto-correction logic
- Strategy rotation
- Escalation handling
- Performance tracking

**Key Exports**:
```typescript
evaluateStrategyHealth()          // Check if rotation needed
executeAutoCorrection()           // Perform auto-correction
updateStrategyMetrics()           // Update performance
getAutonomyDashboard()            // Get health overview
```

#### [index.ts](src/lib/decision-circuits/index.ts) - Public API
- All public exports from the module
- Type definitions
- Interface exports

### API Routes (`src/app/api/circuits/`)

#### [execute/route.ts](src/app/api/circuits/execute/route.ts)
- `POST /api/circuits/execute` — Execute single circuit
- `PUT /api/circuits/execute` — Chain circuits

#### [audit/route.ts](src/app/api/circuits/audit/route.ts)
- `GET /api/circuits/audit` — Execution history & metrics

#### [autonomy/route.ts](src/app/api/circuits/autonomy/route.ts)
- `POST /api/circuits/autonomy` — Evaluate & auto-correct
- `GET /api/circuits/autonomy` — Autonomy dashboard
- `PATCH /api/circuits/autonomy` — Update metrics

---

## 💾 Database Files

### Migration
- **[supabase/migrations/20251215_decision_circuits_init.sql](supabase/migrations/20251215_decision_circuits_init.sql)**
  - Creates 4 new tables with RLS
  - Adds 12 indexes for performance
  - Creates 4 RLS policies
  - Idempotent (safe to re-run)

### Tables Created
1. `circuit_execution_logs` — Full audit trail
2. `circuit_strategy_states` — Current state & metrics
3. `circuit_autocorrection_logs` — Autonomous actions
4. `content_strategies` — Available strategies

---

## 📚 Reference Materials

### Entry Points by Role

**👨‍💻 Developers**
1. Start: [DECISION_CIRCUITS_QUICK_REF.md](DECISION_CIRCUITS_QUICK_REF.md)
2. Deep Dive: [docs/guides/DECISION-CIRCUITS-GUIDE.md](docs/guides/DECISION-CIRCUITS-GUIDE.md)
3. Code: `src/lib/decision-circuits/`
4. Test: `src/app/api/circuits/`

**🏗️ Architects/Leads**
1. Start: [DECISION_CIRCUITS_SUMMARY.md](DECISION_CIRCUITS_SUMMARY.md)
2. Deep Dive: [docs/circuits/DECISION-CIRCUITS-SPEC.json](docs/circuits/DECISION-CIRCUITS-SPEC.json)
3. Code Review: All TypeScript files
4. Architecture: Review executor.ts chaining logic

**🚀 DevOps/Deployment**
1. Start: [DECISION_CIRCUITS_DEPLOYMENT.md](DECISION_CIRCUITS_DEPLOYMENT.md)
2. Migration: [supabase/migrations/20251215_decision_circuits_init.sql](supabase/migrations/20251215_decision_circuits_init.sql)
3. Testing: Step 2-8 in deployment guide
4. Monitoring: See monitoring section

**📊 Product/PM**
1. Overview: [DECISION_CIRCUITS_SUMMARY.md](DECISION_CIRCUITS_SUMMARY.md)
2. Specification: [docs/circuits/DECISION-CIRCUITS-SPEC.json](docs/circuits/DECISION-CIRCUITS-SPEC.json)
3. Roadmap: See Phase 2-3 timelines
4. Metrics: Review success criteria & KPIs

---

## 🎯 The 8 Decision Circuits

| Circuit | File Location | Inputs | Outputs | Use Case |
|---------|---------------|--------|---------|----------|
| CX01 | `registry.ts` | business_profile, campaign_goal, context | detected_intent | Email Agent |
| CX02 | `registry.ts` | detected_intent, location, industry | audience_segment | Email Agent |
| CX03 | `registry.ts` | client_id, audience_segment | prior_strategy_signature | Email/Orchestrator |
| CX04 | `registry.ts` | intent, segment, prior_strategy | content_strategy_id | Content Agent |
| CX05 | `registry.ts` | draft_content, brand_rules | approved_content | Content Agent |
| CX06 | `registry.ts` | strategy_id, approved_content | final_asset | Content Agent |
| CX07 | `registry.ts` | final_asset, platform_metrics | engagement_score | Feedback Loop |
| CX08 | `registry.ts` | engagement_score, baseline | updated_strategy | Autonomy |

---

## 🔌 API Endpoints at a Glance

```
# Execute circuits
POST   /api/circuits/execute?workspaceId=<id>   Single circuit
PUT    /api/circuits/execute?workspaceId=<id>   Chain circuits

# Audit & metrics
GET    /api/circuits/audit?workspaceId=<id>     History & metrics

# Autonomy & health
POST   /api/circuits/autonomy?workspaceId=<id>  Evaluate & correct
GET    /api/circuits/autonomy?workspaceId=<id>  Dashboard
PATCH  /api/circuits/autonomy?workspaceId=<id>  Update metrics
```

---

## 📊 Git Commits

All commits are in `Decision_Circuits` branch:

| Commit | Message | Files |
|--------|---------|-------|
| `2affee53` | docs: Deployment checklist | DECISION_CIRCUITS_DEPLOYMENT.md |
| `7bbb3cf1` | docs: Quick reference card | DECISION_CIRCUITS_QUICK_REF.md |
| `da932f5c` | docs: Summary documentation | DECISION_CIRCUITS_SUMMARY.md |
| `1f8830e8` | feat: Core implementation | Core library + APIs + schema |

---

## 🚀 Quick Start

### 1. Review (5 min)
```bash
# Quick overview
cat DECISION_CIRCUITS_QUICK_REF.md

# Full summary
cat DECISION_CIRCUITS_SUMMARY.md
```

### 2. Deploy (10 min)
```bash
# Apply migration
# → Supabase Dashboard → SQL Editor → Run migration

# Run tests
npm run test
npm run typecheck
```

### 3. Test (15 min)
```bash
# Start dev server
npm run dev

# Test endpoints (see DECISION_CIRCUITS_DEPLOYMENT.md)
curl POST http://localhost:3008/api/circuits/execute...
```

### 4. Integrate (1-2 hours)
```bash
# Integrate with agents
# Email Agent: Use CX01-CX03
# Content Agent: Use CX04-CX06
# Orchestrator: Chain all circuits
```

---

## 🔍 Finding What You Need

**"How do I execute a circuit?"**
→ [DECISION_CIRCUITS_QUICK_REF.md](DECISION_CIRCUITS_QUICK_REF.md#api-quick-reference)

**"What's the autonomy rule?"**
→ [DECISION_CIRCUITS_QUICK_REF.md](DECISION_CIRCUITS_QUICK_REF.md#autonomy-rules-self-correction)

**"How do I deploy this?"**
→ [DECISION_CIRCUITS_DEPLOYMENT.md](DECISION_CIRCUITS_DEPLOYMENT.md)

**"What's the full API?"**
→ [docs/guides/DECISION-CIRCUITS-GUIDE.md](docs/guides/DECISION-CIRCUITS-GUIDE.md#api-reference)

**"What databases are created?"**
→ [DECISION_CIRCUITS_DEPLOYMENT.md](DECISION_CIRCUITS_DEPLOYMENT.md#step-2-test-core-functionality)

**"How do I integrate with Email Agent?"**
→ [DECISION_CIRCUITS_DEPLOYMENT.md](DECISION_CIRCUITS_DEPLOYMENT.md#step-5-integration-with-email-agent)

**"What's the failure mode for CX04?"**
→ [DECISION_CIRCUITS_QUICK_REF.md](DECISION_CIRCUITS_QUICK_REF.md#8-decision-circuits)

**"How do I troubleshoot?"**
→ [DECISION_CIRCUITS_QUICK_REF.md](DECISION_CIRCUITS_QUICK_REF.md#troubleshooting)

---

## ✅ Verification Checklist

Before using, verify:
- [x] Branch `Decision_Circuits` exists
- [x] 4 commits created
- [x] ~3,500 lines of code added
- [x] ~2,000 lines of documentation added
- [x] All TypeScript files compile
- [x] No ESLint errors
- [x] Database migration is idempotent
- [x] 6 API endpoints defined
- [x] 4 database tables designed
- [x] RLS policies created

---

## 📞 Support

**Issue with circuit execution?**
1. Check `src/lib/decision-circuits/executor.ts`
2. Review execution logs: `GET /api/circuits/audit`
3. See troubleshooting: [DECISION_CIRCUITS_QUICK_REF.md](DECISION_CIRCUITS_QUICK_REF.md#troubleshooting)

**Question about autonomy?**
1. See rules: [DECISION_CIRCUITS_QUICK_REF.md](DECISION_CIRCUITS_QUICK_REF.md#autonomy-rules-self-correction)
2. Check implementation: `src/lib/decision-circuits/autonomy.ts`
3. Review spec: [docs/circuits/DECISION-CIRCUITS-SPEC.json](docs/circuits/DECISION-CIRCUITS-SPEC.json)

**How to integrate?**
1. See deployment guide: [DECISION_CIRCUITS_DEPLOYMENT.md](DECISION_CIRCUITS_DEPLOYMENT.md)
2. Check examples: [docs/guides/DECISION-CIRCUITS-GUIDE.md](docs/guides/DECISION-CIRCUITS-GUIDE.md#integration-examples)

---

## 🎓 Learning Path

1. **Orientation** (10 min)
   - Read: [DECISION_CIRCUITS_QUICK_REF.md](DECISION_CIRCUITS_QUICK_REF.md)

2. **Architecture** (20 min)
   - Read: [DECISION_CIRCUITS_SUMMARY.md](DECISION_CIRCUITS_SUMMARY.md)
   - Review: `src/lib/decision-circuits/registry.ts`

3. **API & Integration** (30 min)
   - Read: [docs/guides/DECISION-CIRCUITS-GUIDE.md](docs/guides/DECISION-CIRCUITS-GUIDE.md)
   - Review: `src/app/api/circuits/`

4. **Implementation** (45 min)
   - Code: `src/lib/decision-circuits/executor.ts`
   - Test: `src/lib/decision-circuits/autonomy.ts`

5. **Deployment** (60 min)
   - Follow: [DECISION_CIRCUITS_DEPLOYMENT.md](DECISION_CIRCUITS_DEPLOYMENT.md)
   - Verify: Database migration, API tests

---

**Navigation**: [Quick Ref](DECISION_CIRCUITS_QUICK_REF.md) | [Summary](DECISION_CIRCUITS_SUMMARY.md) | [Deployment](DECISION_CIRCUITS_DEPLOYMENT.md) | [Full Guide](docs/guides/DECISION-CIRCUITS-GUIDE.md) | [Spec](docs/circuits/DECISION-CIRCUITS-SPEC.json)

**Branch**: `Decision_Circuits`
**Status**: ✅ Ready for integration
**Support**: See documentation files above
