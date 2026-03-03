---
name: council-of-logic
description: Mathematical first principles validation for code quality. Triggers on "optimise", "algorithm", "performance", "complexity", "O(n)", or when reviewing code for efficiency. Enforces Turing (algorithmic), Von Neumann (architecture), Bezier (animation), and Shannon (compression) principles.
license: MIT
metadata:
  author: NodeJS-Starter-V1
  version: '2.0.1'
  locale: en-AU
---

# Council of Logic - Mathematical First Principles

Four legendary minds govern all technical decisions. Their principles are non-negotiable.

## Description

Validates all technical output against four mathematical first principles: Turing (algorithmic efficiency), Von Neumann (system architecture and game theory), Bezier (physics-based animation curves), and Shannon (information compression and token economy). Acts as a pre-flight gate that rejects sub-optimal code, blocking transitions, linear CSS timing, and verbose payloads.

## When to Apply

### Positive Triggers

- Writing or reviewing algorithms
- Optimising performance
- Designing system architecture
- Implementing animations or UI transitions
- Reducing data payload sizes
- User mentions: "optimise", "performance", "complexity", "efficient"

### Negative Triggers

- Writing documentation or README files (use Specialist D)
- Implementing UI layouts without animations (use `scientific-luxury` instead)
- Configuring environment variables or deployment settings

## The Council

### Alan Turing - Algorithmic Efficiency & Logic

**Focus**: Reduce code complexity. Demand optimal time complexity.

**Rules**:

- O(n²) algorithms are **REJECTED** - demand O(n) or O(log n)
- Every loop must justify its existence
- Recursive solutions must prove termination
- State machines must be deterministic and minimal

**Pre-Code Check**:

```
Turing Check: What is the time complexity?
- If O(n²) or worse → REFACTOR
- If O(n log n) → ACCEPTABLE
- If O(n) or O(log n) → APPROVED
```

**Red Flags**: Nested loops, `.filter().map().filter()` chains

**Resolution**: Single-pass algorithm

---

### John von Neumann - System Architecture & Game Theory

**Focus**: Optimise agent workflows. Treat interactions as strategic games.

**Rules**:

- Every user interaction is a game theory move
- Maximise conversion through optimal strategy
- System architecture must support parallel execution
- Memory hierarchy: hot path = cache, cold path = lazy load

**Pre-Architecture Check**:

```
Von Neumann Check: Is this the Nash Equilibrium?
- User benefit maximised? ✓
- System cost minimised? ✓
- Competing concerns balanced? ✓
```

**Red Flags**: Blocking operations, race conditions

**Resolution**: Async/parallel design

---

### Pierre Bezier - Frontend Physics & Animation

**Focus**: Interpolation curves for luxury UI. No linear transitions.

**Rules**:

- **BANNED**: `transition: all 0.3s linear`
- **REQUIRED**: Physics-based springs, cubic-bezier curves
- Every animation must feel "weighted" and "intentional"
- Micro-interactions on every state change

**Approved Easings**:

```css
/* Spring - bouncy, playful */
--ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);

/* Smooth - elegant, refined */
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);

/* Bounce - energetic, celebration */
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);

/* Out-Expo - snappy, decisive */
--ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1);
```

**Pre-Animation Check**:

```
Bezier Check: Does this feel "expensive"?
- Linear timing? → REJECT
- Abrupt start/stop? → REJECT
- Physics-based curve? → APPROVED
```

**Red Flags**: Linear timing, jarring transitions

**Resolution**: Spring/bezier curves

---

### Claude Shannon - Information Theory (Token Economy)

**Focus**: Maximum signal, minimum noise. Compress everything.

**Rules**:

- Every prompt must be entropy-optimised
- Data structures compressed to essential bits
- Redundant information is wasted tokens
- API responses: return exactly what's needed, nothing more

**Pre-Communication Check**:

```
Shannon Check: What is the signal-to-noise ratio?
- Redundant words? → COMPRESS
- Unnecessary fields? → REMOVE
- Implicit > Explicit when context allows
```

**Red Flags**: Verbose prompts, bloated payloads

**Resolution**: Compress, dedupe, minimise

---

## Workflow Protocol

### STEP 1: THE PROOF

Before writing ANY code, state the mathematical/logical model:

```markdown
## Mathematical Model

**Problem**: [State the problem in formal terms]

**Turing**: Time complexity target = O(?)
**Von Neumann**: Architecture pattern = [pattern]
**Bezier**: Animation curve = [easing function]
**Shannon**: Data compression = [strategy]
```

### STEP 2: THE SOLVE

Execute with council approval:

```markdown
## Implementation

**Turing Approval**: [complexity analysis]
**Von Neumann Approval**: [architecture justification]
**Bezier Approval**: [animation specification]
**Shannon Approval**: [compression verification]
```

### STEP 3: THE VERIFY

Post-implementation council review:

```markdown
## Council Review

- [ ] Turing: No O(n²) or worse
- [ ] Von Neumann: Nash equilibrium achieved
- [ ] Bezier: All transitions physics-based
- [ ] Shannon: Maximum compression applied
```

## Quick Reference: Council Objections

| Council Member | Red Flag                                 | Resolution                 |
| -------------- | ---------------------------------------- | -------------------------- |
| Turing         | Nested loops, `.filter().map().filter()` | Single-pass algorithm      |
| Von Neumann    | Blocking operations, race conditions     | Async/parallel design      |
| Bezier         | Linear timing, jarring transitions       | Spring/bezier curves       |
| Shannon        | Verbose prompts, bloated payloads        | Compress, dedupe, minimise |

## Code Examples

### Turing Violation (BAD)

```typescript
// O(n²) - REJECTED
const result = items.filter((item) => otherItems.some((other) => other.id === item.id));
```

### Turing Approved (GOOD)

```typescript
// O(n) - APPROVED
const otherSet = new Set(otherItems.map((o) => o.id));
const result = items.filter((item) => otherSet.has(item.id));
```

### Bezier Violation (BAD)

```css
/* Linear - REJECTED */
transition: all 0.3s linear;
```

### Bezier Approved (GOOD)

```css
/* Physics-based - APPROVED */
transition: transform 0.5s cubic-bezier(0.19, 1, 0.22, 1);
```

## Response Format

```
[AGENT_ACTIVATED]: Council of Logic
[PHASE]: {Proof | Solve | Verify}
[STATUS]: {in_progress | complete}

{council analysis or verification results}

[NEXT_ACTION]: {what to do next}
```

## Anti-Patterns

| Pattern | Problem | Correct Approach |
| ------- | ------- | ---------------- |
| O(n²) algorithms accepted without review | Exponential degradation at scale | Demand O(n) or O(log n); use Set/Map lookups instead of nested iterations |
| Linear CSS transitions approved | Mechanical, lifeless UI that violates design principles | Apply physics-based cubic-bezier or spring easing curves |
| Verbose prompts not compressed | Wasted tokens, poor signal-to-noise ratio | Apply Shannon compression — remove redundancy, dedupe, minimise |
| Blocking operations in async code | Thread starvation, degraded responsiveness | Use async/parallel design patterns per Von Neumann principles |
| Skipping the Proof step before coding | Unvalidated assumptions baked into implementation | State the mathematical model (complexity, architecture, easing, compression) first |

## Checklist

- [ ] Turing: Time complexity verified as O(n log n) or better
- [ ] Von Neumann: Architecture checked for async execution and Nash equilibrium
- [ ] Bezier: All animation curves use physics-based easing (no linear timing)
- [ ] Shannon: Data payloads and prompts compressed to maximum signal density
- [ ] Proof step completed before implementation began
- [ ] Council Review checklist verified post-implementation

---

**Remember**: These are not guidelines. They are **mathematical laws**.
