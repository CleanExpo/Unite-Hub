# Linear Pi-Dev-Ops Backlog Cleanup Evidence
Generated: 2026-06-02T02:50:50.917388Z
## Cleanup applied
- Canceled 186 low-relevance [SCOUT] research tickets scored <=3/5.
- Canceled 81 duplicate copies that could not be moved to Linear Duplicate state because Linear requires an explicit duplicate relation for that state.
- Net active open project issues reduced from 3068 to 2801. Backlog reduced from 440 to 174. In Progress reduced from 7 to 6.
- Preserved evidence-backed critical/security/customer issues; did not fake-close work without completion evidence.

## Verified remaining state counts
- Backlog: 174
- Duplicate: 2613
- In Progress: 6
- Pi-Dev: In Progress: 1
- Todo: 7

## Remaining active started work
- RA-2026 — In Progress — P2: Build and deploy full HERMES application using latest docs and all portfolio personas
- RA-2906 — In Progress — P2: [WorkOrder] ccw-crm — ci_failing_python (high)
- RA-3006 — In Progress — P2: Gitignore the 23 runtime-mutated .harness state files (merge-conflict generator)
- RA-3012 — In Progress — P1: Secret-value-stripper wrapper for `railway variables` (RA-2989 process hardening)
- RA-3025 — In Progress — P1: [CCW-CRM][P1] Restore .npmrc on main — Rana's 17:53 push dropped PR#150 fix, all CI red
- RA-3034 — In Progress — P1: SECURITY: Supabase SERVICE_ROLE key committed in Pi-Dev-Ops @ scripts/sync_harness_to_supabase.py:22
- RA-2141 — Pi-Dev: In Progress — P1: RA-2141: Task Completion Gate — eliminate CASHE incomplete/false results (Founder: 100% green handoff required)

## Remaining P0/P1 backlog needing executive sequencing
- RA-2997 — P1: [CI/CD URGENT] Android Release pipeline broken since 2026-05-08 — Google Play API disabled on GCP project 292141944467
- RA-2998 — P1: [NPS URGENT] iOS sign-in regression thrash (PR #940→revert #941→#942) — stop the merge loop, fix RA-2119 first
- RA-3002 — P1: [Nexus] FCR 46.6% + 3 open enterprise churn threats — no triage SLA
- RA-3014 — P1: Provision OPENROUTER_API_KEY + verify Ollama-down fallback path
- RA-3037 — P1: GHSA-3p68-rc4w-qgx5: axios@<1.15.2 SSRF + auth bypass + prototype pollution (DR-NRPG)
- RA-3038 — P1: GHSA-5c6j-r48x-rmvq: serialize-javascript@<=7.0.2 RCE via RegExp.flags (DR-NRPG)
- RA-3039 — P1: GHSA-5c6j-r48x-rmvq: basic-ftp@<5.2.0 CRITICAL path traversal + CRLF command injection (DR-NRPG)
- RA-3040 — P1: GHSA-ggv3-7p47-pfv8: next.js@<16.2.3 HTTP request smuggling + null-origin CSRF bypass (CCW-CRM)
- RA-3751 — P0: Pi-CEO Portfolio Pulse (auto)
- RA-3900 — P1: MORNING BRIEF 2026-05-12 — overnight engineering + security audit
- RA-4188 — P1: [carsi][ci] Unblock DigitalOcean monkfish-app build — commit 0060d6f failed
- RA-5027 — P0: Plaud NotePin S Pipeline (Laptop)

## Remaining high-value research scout backlog
- RA-2912: [SCOUT] ARXIV: NeuroAgent: LLM Agents for Multimodal Neuroimaging Analysis and Research
- RA-2913: [SCOUT] ARXIV: Superintelligent Retrieval Agent: The Next Frontier of Information Retrieval
- RA-4203: [SCOUT] ARXIV: ComplexMCP: Evaluation of LLM Agents in Dynamic, Interdependent, and Large-Scale
- RA-4869: [SCOUT] ARXIV: FlowCompile: An Optimizing Compiler for Structured LLM Workflows
- RA-4882: [SCOUT] ARXIV: Is Grep All You Need? How Agent Harnesses Reshape Agentic Search
- RA-5195: [SCOUT] ARXIV: HarnessAPI: A Skill-First Framework for Unified Streaming APIs and MCP Tools
- RA-5196: [SCOUT] ARXIV: WorkstreamBench: Evaluating LLM Agents on End-to-End Spreadsheet Tasks in Financ
- RA-5510: [SCOUT] ARXIV: Causal methods for LLM development and evaluation
- RA-5616: [SCOUT] ARXIV: MUSE-Autoskill: Self-Evolving Agents via Skill Creation, Memory, Management, and
- RA-5617: [SCOUT] ARXIV: Natural Language Query to Configuration for Retrieval Agents
- RA-5618: [SCOUT] ARXIV: FinHarness: An Inline Lifecycle Safety Harness for Finance LLM Agents
- RA-5634: [SCOUT] ARXIV: Rethinking Memory as Continuously Evolving Connectivity
- RA-5635: [SCOUT] ARXIV: Do Agents Need Semantic Metadata? A Comparative Study in Agentic Data Retrieval

## Recommendation
Current pathway should not chase the whole residual board. Treat Pi-Dev-Ops as a senior-engineer execution engine with four lanes only: security/secrets, CI/deployment gates, customer-facing production failures, and workflow governance. Research scouts and production-content ideas should stay parked until those gates are green.
