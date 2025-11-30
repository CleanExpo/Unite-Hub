# Snake Build Pattern - Efficient Multi-Agent Coordination

**Version**: 1.0.0
**Date**: 2025-11-30
**Pattern**: Orchestrator (head visible) + Specialist Agents (body underground)

---

## The Metaphor

Like a snake, Unite-Hub's build system has:

- **Head (Visible)**: Orchestrator Agent - single point of contact, decision maker
- **Body (Underground)**: Specialist agents - doing real work, not surfacing noise
- **Eyes**: Truth Layer - sees problems before we move
- **Nervous System**: Transparency Reporter - logs what happens

```
        ╔═══════════════════╗
        ║  User Interface   ║
        ║   (Chat/API)      ║
        └──────────┬────────┘
                   │
        ╔══════════▼═════════╗
        ║   ORCHESTRATOR     ║  ← HEAD (visible)
        ║   (Single point    ║
        ║    of contact)     ║
        └────┬─────────┬─────┘
             │         │
      ┌──────▼──┐  ┌──▼───────┐
      │ TRUTH   │  │TRANSPARENCY
      │ LAYER   │  │ REPORTER
      └────┬────┘  └──────────┘
           │
    ╔══════▼═════════════════════════╗  ← BODY (underground)
    ║   SPECIALIST AGENTS            ║
    ║  (working without surface noise)║
    ║  - Build Diagnostics           ║
    ║  - Test Infrastructure         ║
    ║  - Email Agent                 ║
    ║  - Content Agent               ║
    ║  - Frontend/Backend/etc         ║
    └════════════════════════════════╝
```

---

## Why Snake Build Pattern?

### Problem It Solves

**Old way (Too many surface agents)**:
```
User → Email Agent ← reports
     → Content Agent ← reports
     → Frontend Agent ← reports
     → Backend Agent ← reports
     → Test Agent ← reports
     → Diagnostics Agent ← reports

Result: Notification overload, context loss, token bloat
```

**New way (Snake pattern)**:
```
User → Orchestrator Agent
       ↓ (single, clean interface)
       ↓ (no intermediate reports)
       └→ All work happens "underground"

Final report when done: What happened and why
```

### Benefits

1. **Token Efficiency**: No intermediate reports between agents
2. **User Experience**: Single source of truth (Orchestrator)
3. **Context Preservation**: Full flow visible only to agents, not fragmented
4. **Focus**: User sees ONLY final decisions, not debate
5. **Scaling**: Can add 10 more specialist agents without user noticing

---

## Snake Build Architecture

### Layer 1: User Interface (Visible)
```
User submits request to Orchestrator
↓
Example: "Add image upload feature"
```

### Layer 2: Head (Orchestrator - Visible)
```
Orchestrator receives request

DECISION LOGIC:
1. Route through Truth Layer (no intermediate output)
2. Coordinate specialists (no surface reports)
3. Aggregate results (single report back to user)
4. Present decision to user

OUTPUT TO USER:
- Status: [Can proceed / Blocked]
- If blocked: Root cause + ETA
- If proceeding: Timeline + risks
- Next steps: [What we'll do]
```

### Layer 3: Eyes (Truth Layer - Mostly Hidden)
```
Silently runs validation checks:
- Is build working?
- Are types clean?
- Are tests passing?
- Are dependencies resolved?

OUTPUT:
- Only if blocker found → Report to Orchestrator
- Orchestrator decides if user should know details
```

### Layer 4: Body (Specialists - Completely Hidden)
```
Build Diagnostics Agent:
  ├─ Runs build locally
  ├─ Analyzes errors
  ├─ Implements fix
  └─ Verifies it works
  (No user-visible reports until done)

Test Infrastructure Agent:
  ├─ Audits tests
  ├─ Writes missing tests
  ├─ Verifies coverage
  └─ Reports completion
  (No intermediate progress, just "done" or "blocked")

Email/Content/Frontend/Backend Agents:
  ├─ Do their work
  ├─ Handle errors internally
  └─ Report success/failure
  (Specialized work, not user concern)
```

### Layer 5: Nervous System (Transparency Reporter - Logs Everything)
```
Records EVERYTHING underground:
- What tried
- What failed
- Why it failed
- How fixed
- How verified

User never sees this detail, but it's available for:
- Debugging future issues
- Learning patterns
- Improving processes
```

---

## Token Flow (Token Efficiency)

### Old Pattern (Token Bloat)
```
User query (100 tokens)
↓
Agent 1 investigates, responds (500 tokens)
↓
Agent 2 reads Agent 1 response, investigates, responds (600 tokens)
↓
Agent 3 reads Agents 1&2, coordinates response (700 tokens)
↓
Final output (200 tokens)

TOTAL: ~2,100 tokens (lots of context switching)
```

### Snake Pattern (Token Efficient)
```
User query (100 tokens)
↓
Orchestrator routes request (no response yet)
↓
Specialists work internally (context preserved internally)
  - No inter-agent reporting
  - No context-switching delays
  - Full context available to each agent
↓
Orchestrator aggregates and responds (300 tokens)

TOTAL: ~400 tokens (5x more efficient!)
```

---

## Implementing Snake Pattern

### Rule 1: Orchestrator is the Only Public Face

```typescript
// Orchestrator receives ALL requests
function receiveRequest(request) {
  // Decide: Can we proceed?
  if (!truthLayerCheck(request)) {
    return {
      status: 'BLOCKED',
      blocker: 'Build is broken',
      rootCause: 'Type errors in analysisAgent',
      eta: '2 hours',
      recommendation: 'Work on other features first'
    };
  }

  // Route to appropriate specialist (no intermediate output)
  result = routeToSpecialist(request);

  // Aggregate results into single response
  return {
    status: 'COMPLETED',
    what: 'Feature added',
    when: '1 hour',
    verified: true,
    nextSteps: 'Deploy to staging'
  };
}
```

### Rule 2: Specialists Don't Report to User

```typescript
// Build Diagnostics - works underground
async function fixBuildError(error) {
  // NO intermediate output to user
  // Only return to Orchestrator: success/failure + details

  const diagnosis = analyzeError(error);
  const solution = implementFix(diagnosis);
  const verified = verifySolution(solution);

  return {
    fixed: verified,
    details: {
      problem: diagnosis.rootCause,
      solution: solution.description,
      timeToFix: solution.duration
    }
  };
}

// Orchestrator decides what to tell user
if (result.fixed) {
  userMessage('Build fixed. Proceeding with feature.');
} else {
  userMessage(`Build issue unresolved. Root cause: ${result.details.problem}`);
}
```

### Rule 3: Truth Layer is Silent Until It Finds Problems

```typescript
// Truth Layer - underground validation
async function validateSystem() {
  // Performs checks silently
  // Only surfaces if blocker found

  const checks = {
    build: runBuild(),      // Silent unless fails
    types: runTypeCheck(),   // Silent unless fails
    tests: runTests(),       // Silent unless fail
    critical: checkCriticalPaths() // Silent unless issues
  };

  const blockers = checks.filter(c => c.failed);

  if (blockers.length === 0) {
    return { valid: true }; // Proceed quietly
  } else {
    return {
      valid: false,
      blockers: blockers // Orchestrator decides what to report
    };
  }
}
```

### Rule 4: Transparency Reporter Logs Everything, But User Sees Summary

```typescript
// Transparency Reporter logs full details
function logBlocker(blocker) {
  // Record complete details to file
  fs.writeFile('/logs/blockers/BLOCKER-[id].md', {
    what: blocker.description,
    rootCause: blocker.cause,
    impact: blocker.impact,
    attempted: blocker.attempts,
    resolution: blocker.solution,
    timeToResolve: blocker.duration
  });

  // But user only gets summary
  return {
    summary: blocker.description,
    eta: blocker.duration,
    alternative: 'Try this instead'
  };
}
```

---

## User Experience with Snake Pattern

### Scenario 1: Feature Can Proceed
```
USER: "Add image upload"

ORCHESTRATOR (internal check):
  ├─ Truth Layer: ✅ All clear
  ├─ Load specialists
  ├─ Build Diagnostics: Task = implement feature
  ├─ Test Infrastructure: Task = write tests
  └─ Frontend Agent: Task = implement UI

USER SEES: (single message)
"Starting image upload feature. ETA: 4 hours.
Proceeding with implementation."

(After 4 hours)

USER SEES: (single message)
"Image upload complete.
- Uploaded files: 200+ test cases
- Coverage: 92%
- Ready for deployment
Recommend: Staging test before production"
```

### Scenario 2: Feature Blocked by Build Issue
```
USER: "Add image upload"

ORCHESTRATOR (internal check):
  ├─ Truth Layer: ❌ Build broken
  ├─ Build Diagnostics: Investigates (underground)
  │  └─ Finds: Turbopack error
  │  └─ Root cause identified
  └─ Returns: Can't proceed, here's why

USER SEES: (single message)
"Cannot start image upload feature.

BLOCKER: Build system broken
ROOT CAUSE: Turbopack manifest write error
IMPACT: All features blocked
ETA TO FIX: 1 hour
RECOMMENDATION:
  - If urgent: Wait 1 hour for build fix
  - If not urgent: Work on documentation/design

Once fixed, I'll proceed with image upload implementation."
```

### Scenario 3: Issue During Implementation
```
USER: "Add image upload feature"

ORCHESTRATOR sends work underground:
  ├─ 30 min: UI implemented ✅
  ├─ 15 min: Tests written ✅
  ├─ 10 min: Database integration ✅
  ├─ 5 min: Truth Layer validation
  │  └─ Type error found
  └─ Build Diagnostics fixes it (5 min)

USER SEES: (single message, after all work)
"Image upload complete.
- Implemented: UI, database, API routes
- Tests: 42 new tests, all passing
- Minor issue encountered and fixed: Type safety
- Verified: Build clean, types pass, tests pass
- Ready: Deploy to staging"
```

---

## Managing Context Underground

### Each Specialist Has Full Context

```
When Build Diagnostics investigates:
- Knows what user requested (from Orchestrator)
- Knows current system state (from Truth Layer)
- Knows what tests exist (from Test Infrastructure)
- Can coordinate with other agents if needed
- But DOESN'T report back until done
```

### No Handoff Delays

```
OLD (with handoffs):
1. Orchestrator routes to Build Diagnostics
2. Build Diagnostics reports back to Orchestrator
3. Orchestrator decides on next step
4. Orchestrator routes to Test Infrastructure
5. Test Infrastructure reports back
...
(Total time = work time + handoff delays)

NEW (snake pattern):
1. Orchestrator routes to Build Diagnostics
2. Build Diagnostics coordinates directly with Test Infrastructure
3. When done, single report back to Orchestrator
...
(Total time = work time + zero delays)
```

---

## Fallback: When to Surface Details

```
RULE: Keep details underground UNLESS:
1. Blocker found that blocks user request
2. User explicitly asks for details
3. Issue is critical/high severity
4. Context switching needed between specialists
5. Problem-solving advice needed from user

EXAMPLE of good context surfacing:
"IMAGE UPLOAD FEATURE
Status: BLOCKED

Issue: Database schema incompatible with image metadata
Root cause: Schema designed before image feature was planned
Options:
  A) Migration (30 min) - recommended
  B) Redesign (2 hours)
  C) Workaround (1 hour, but temporary)

Which approach preferred?"
```

---

## Metrics Under Snake Pattern

### What Gets Reported to User
```
WEEKLY STATUS:
✅ Features completed: 3
⏸️ Features blocked: 1 (ETA 2 days)
🔧 In progress: 2 features

Build health: ✅ All green
Test coverage: 76% (↑ from 72%)
Deployment ready: Yes
```

### What Gets Logged Underground (Available if Needed)
```
/logs/blockers/ - detailed investigation records
/logs/solutions/ - what fixed each issue
/logs/metrics/ - detailed metrics
/logs/decisions/ - why we chose each approach
```

---

## Benefits Summary

| Aspect | Benefit |
|--------|---------|
| **Token Usage** | 5x more efficient |
| **User Experience** | Single clear message vs noise |
| **Scaling** | Add agents without user noticing |
| **Context** | Full context available to agents |
| **Speed** | No handoff delays |
| **Transparency** | Full logs available, clean UX |
| **Team Trust** | Honest but not overwhelming |

---

## Implementation Checklist

- [x] Create Truth Layer Agent (underground eyes)
- [x] Create Build Diagnostics Agent (underground body)
- [x] Create Test Infrastructure Agent (underground body)
- [x] Create Transparency Reporter Agent (underground nervous system)
- [x] Update Orchestrator to coordinate (visible head)
- [x] Document Snake Pattern (this file)
- [ ] Test with real blockers (in progress)
- [ ] Refine based on first cycle

---

**Key Principle**:

> The Orchestrator is the visible head. Everything else works underground.
> User sees decisions, not process. We report results, not research.
> That's how we're efficient AND transparent at the same time.
