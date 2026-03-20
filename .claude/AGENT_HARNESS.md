# Agent Harness — Multi-Agent Convergence Protocol

> **Purpose**: 8-phase convergence protocol for complex multi-agent tasks (3+ agents, cross-domain).
> **Authority**: Orchestrator selects this protocol. Complements (does not replace) the Minion one-shot protocol.
> **When to use**: Complex tasks requiring 3+ agents, cross-domain coordination, or iterative refinement.
> **When NOT to use**: Single-domain tasks, quick fixes, exploration → use Minion or direct delegation.

---

## Harness vs Minion Decision

| Signal | Use Minion | Use Harness |
|--------|-----------|-------------|
| Task scope | Single domain | 3+ domains |
| Agent count | 1–2 | 3+ |
| Iteration expected | No | Yes (max 2 cycles) |
| Output type | Code/PR | Integrated deliverable |
| Complexity | Clear, bounded | Ambiguous, emergent |
| Verification | Type-check/lint | Cross-agent review |

---

## 8-Phase Convergence Protocol

### Phase 1 — Intake

**Orchestrator action**: Receive and classify the task.

```
HARNESS INTAKE
task: {description}
complexity: {LOW/MEDIUM/HIGH/CRITICAL}
estimated_agents: {n}
cross_domain: {yes/no}
```

**Output**: Classified task ready for discovery.

---

### Phase 2 — Discovery

**Orchestrator action**: Scan Vault Index and codebase for all relevant context.

Checklist:
- [ ] Read `.claude/VAULT-INDEX.md` for asset lookup
- [ ] Identify all files in scope (Glob/Grep, NOT full file reads)
- [ ] Load relevant toolshed from `.claude/data/toolsheds.json`
- [ ] Check `.claude/memory/architectural-decisions.md` for precedents
- [ ] Check `.claude/memory/CONSTITUTION.md` for constraints

**Output**: Context manifest with bounded file list.

---

### Phase 3 — Decomposition

**Orchestrator action**: Break the task into independent, assignable subtasks.

Rules:
- Each subtask must have a **single owner agent**
- Subtasks with dependencies must be sequenced (not parallelised)
- Maximum **6 subtasks** per Harness invocation (if more, decompose into sub-Harness)
- Identify the critical path (longest sequential chain)

```
DECOMPOSITION PLAN
critical_path: {phase_a} → {phase_b} → {phase_c}
parallel_tracks:
  track_1: {subtask_x}
  track_2: {subtask_y}
```

**Output**: Subtask list with dependencies, owners, and file boundaries.

---

### Phase 4 — Execution

**Orchestrator action**: Dispatch subtasks to specialist agents.

Protocol per subtask:
1. Load relevant toolshed skills (max 5–6 per agent)
2. Provide **only** the files in that agent's scope
3. Include Australian context (always)
4. Set clear success criteria and output format
5. Monitor for `BLUEPRINT_ESCALATION` signals

**Context partitioning**: Each agent gets its own isolated context. No agent sees another's working files unless they are explicit inputs.

---

### Phase 5 — Aggregation

**Orchestrator action**: Collect and merge all subtask outputs.

Checklist:
- [ ] All subtasks completed (or failed with documented reason)
- [ ] No conflicting changes (diff review across all outputs)
- [ ] Australian English verified across all outputs
- [ ] Design tokens compliance verified (if UI changes)
- [ ] No cross-agent file conflicts

**Output**: Integrated deliverable ready for verification.

---

### Phase 6 — Verification

**Rule**: NO agent verifies its own work. Route to `[[verification]]` agent.

Verification tiers applied based on task type:

| Task Type | Verification Tier | Time |
|-----------|------------------|------|
| Code changes | Tier A (type-check + lint + test) | 30s |
| Feature additions | Tier B (+ integration tests) | 2–3min |
| Migration/deploy | Tier C (+ E2E + security) | 5–10min |
| Production release | Tier D (full suite) | 15–20min |

**Blocking condition**: If verification fails, go to Phase 7 (Iteration). Do NOT proceed to production.

---

### Phase 7 — Iteration

**Hard cap**: Maximum **2 iteration cycles** per Harness invocation.

```
Iteration counter: {n}/2

If n >= 2 → HARNESS_ESCALATION → surface to human
```

**Cycle**: Verification findings → targeted fixes → re-verification.

**Rules**:
- Only fix what verification identified — no scope creep
- Re-run the same verification tier (not a lighter one)
- Document all changes made in this iteration

**HARNESS_ESCALATION** (when cap reached):
```
HARNESS_ESCALATION
task: {description}
cycles_used: 2/2
blocking_issue: {what failed}
evidence: {last verification output}
recommended_action: Human review required
```

---

### Phase 8 — Production

**Orchestrator action**: Commit, document, and close out.

Checklist:
- [ ] All verification tiers passed
- [ ] Commit staged with clean message
- [ ] `.claude/memory/architectural-decisions.md` updated (if architectural decision was made)
- [ ] `.claude/memory/current-state.md` updated
- [ ] PR created (if applicable)
- [ ] HARNESS session state cleared

**Output**:
```
HARNESS COMPLETE
task: {description}
agents_used: {list}
iterations: {n}/2
verification: Tier {A/B/C/D} — all passed
deliverable: {file list or PR URL}
```

---

## Orchestrator Routing Reference

From `.claude/agents/orchestrator/agent.md` — extended routing:

| Condition | Route |
|-----------|-------|
| Single domain, bounded scope | `/minion` (Blueprint DAG) |
| 3+ domains, complex integration | Agent Harness (this protocol) |
| Architecture decision needed | `[[discuss]]` command + `[[technical-architect]]` |
| HARNESS_ESCALATION received | Surface to human — do not retry |

---

## Key Rules

1. **No self-verification** — `[[verification]]` always verifies, never the executing agent
2. **Context isolation** — each agent gets only its scope, not the full codebase
3. **2-cycle hard cap** — escalate, never loop endlessly
4. **Australian defaults** — `[[standards]]` agent enforces on every output
5. **Vault-first discovery** — check `[[VAULT-INDEX]]` before Glob/Grep
6. **Architectural decisions → ADR** — write to `architectural-decisions.md` after Phase 8

---

## Cross-References

- **Simple tasks**: `.claude/commands/minion.md`
- **Orchestrator**: `.claude/agents/orchestrator/agent.md`
- **Verification**: `.claude/agents/verification/agent.md`
- **Vault lookup**: `.claude/VAULT-INDEX.md`
- **Toolsheds**: `.claude/data/toolsheds.json`
