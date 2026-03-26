---
name: council-of-logic
category: reasoning
version: 1.0.0
priority: P1
auto_load: true
triggers:
  - architectural_decision
  - technical_tradeoff
  - debugging_complex
  - system_design
  - performance_analysis
  - security_review
  - strategy_evaluation
description: |
  Apply this skill for ANY decision with non-obvious tradeoffs: architectural choices,
  debugging without a clear root cause, performance strategies, security decisions,
  feature design with competing constraints, refactoring scope decisions.
  Forces multi-perspective analysis before committing to a solution.
  P1 auto-load — always active on complex reasoning tasks.
context: fork
---

# Council of Logic

## The Default Being Overridden

Left unchecked, LLMs default to:
- **First-answer bias**: The first plausible solution surfaces and gets committed to immediately
- **Confirmation anchoring**: Evidence that supports the initial hypothesis gets weighted higher than contradicting evidence
- **Mono-perspective reasoning**: Analysis from a single angle, missing structural weaknesses that another lens would catch
- **Premature convergence**: "This looks right" treated as "this is right" without stress-testing
- **Complexity blindness**: Elegant-looking solutions that hide failure modes not immediately visible

This skill overrides those defaults by requiring adversarial multi-perspective analysis before concluding.

---

## The Four Advisors

Before committing to any complex technical decision, consult all four:

### Advisor 1: Turing — Formal Correctness

*"Does this solution actually compute the right answer? Can you prove it?"*

Turing asks about correctness, not elegance. Questions:
- Is the algorithm provably correct, or is it "probably correct"?
- Are there inputs that produce wrong outputs?
- Are there off-by-one errors, boundary conditions, integer overflow, null cases?
- Can you write a test that would catch if this breaks?
- Is there any path where the code returns silently without doing its job?

**Turing's verdict format**: Identifies the formal correctness risk, states whether the solution handles the edge case.

---

### Advisor 2: Shannon — Information & Signal

*"Where is the information? Where is the noise? What are you actually measuring?"*

Shannon asks about signal quality and information flow. Questions:
- What data does this decision depend on? How reliable is that data?
- Is there latency between reality and what the system knows?
- Are you measuring the right thing or a proxy for the right thing?
- If the input is noisy/wrong, how does the system fail?
- Is there information loss at any point in the pipeline?
- Are there race conditions where two parts of the system have different views of the same fact?

**Shannon's verdict format**: Identifies information gaps, data quality risks, and race conditions.

---

### Advisor 3: Von Neumann — Systems Thinking

*"What does this do to the system as a whole, not just to this component?"*

Von Neumann asks about emergent system behavior. Questions:
- What are the second-order effects of this change?
- How does this interact with the parts of the system you're NOT modifying?
- What happens under load? Under concurrent access?
- Does this create a bottleneck elsewhere?
- Does this add a hard dependency that limits future flexibility?
- What does the failure mode look like from the user's perspective?

**Von Neumann's verdict format**: Identifies system-level risks, cascading failures, bottlenecks.

---

### Advisor 4: Gödel — Completeness & Limits

*"What can this approach NOT solve? What are its inherent limits?"*

Gödel asks about completeness and self-reference. Questions:
- What category of problems is this approach fundamentally unable to handle?
- Is there a case where this solution generates a problem that the solution itself can't solve?
- What assumptions does this approach require to hold true? If they stop holding, what breaks?
- Is there a simpler solution that the chosen approach's complexity is obscuring?
- Are we inside the problem (self-referential) in a way that blinds us to a dimension of it?

**Gödel's verdict format**: Identifies the conceptual limits of the approach, the simplest alternative not yet considered.

---

## How to Apply the Council

For any decision that warrants multi-perspective analysis:

```
Council Review: [Decision being made]

TURING (Correctness):
[Statement of the formal correctness risk, if any. Or "No formal correctness risk identified."]

SHANNON (Information):
[Statement of data/signal quality risk. Or "Information flow is sound."]

VON NEUMANN (Systems):
[Statement of system-level impact. Or "No adverse system-level effects identified."]

GÖDEL (Completeness):
[Statement of approach limits and simplest unconsidered alternative.]

SYNTHESIS:
[The recommendation, incorporating all four verdicts. Where advisors conflict, state the tradeoff explicitly.]
```

---

## When to Use the Full Council

Use all four advisors when the cost of getting it wrong is high:
- Architectural decisions that will be hard to reverse
- Security-sensitive implementations (auth, RLS, data access)
- Performance-critical paths (database queries, caching strategies)
- Complex bugs with unclear root causes
- Feature designs with multiple competing constraints
- Refactoring scope decisions (how much to change at once)

**Abbreviated Council** (Turing + Von Neumann only) for:
- Medium-complexity component implementations
- Standard CRUD patterns in a new context
- Debugging with a likely-but-unverified cause

**No Council needed** for:
- Mechanical, unambiguous tasks (rename a variable, add a CSS class)
- Fully-specified implementations (the spec covers every case)
- Copy changes, documentation updates

---

## The Dissenting Voice

Before finalising any non-trivial solution, generate one dissenting argument:

*"The strongest argument against this approach is: [argument]. This matters because: [why]. The counterargument is: [why I'm proceeding anyway]."*

If you cannot generate a genuine dissenting argument, the solution may be trivially correct — or you haven't thought hard enough. One of these is fine. Know which.

---

## Pattern: Complex Debugging

When debugging a non-obvious issue, the Council applies in order:

1. **Turing**: What does the code actually do? (Read it literally, not as you intended it)
2. **Shannon**: What data does the code actually receive? (Log it, don't assume)
3. **Von Neumann**: How does the system reach this code? (Trace the call path)
4. **Gödel**: What assumption is the code making that might not hold in this context?

The answer is almost always in step 4.

---

## References

The Council pattern is named in SKILLS-INDEX.md as one of four P1 auto-loaded skills. It is derived from multi-model adversarial review patterns (cf. Anthropic's multi-agent reliability research) — where separate evaluator models stress-test outputs before they are accepted as final.
