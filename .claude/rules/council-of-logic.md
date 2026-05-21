# Council of Logic — Mathematical First Principles

> **Mode**: MATHEMATICAL_FIRST_PRINCIPLES
> Four legendary minds govern all technical decisions. Their principles are non-negotiable.

## The Council

| Member | Focus | Veto Power |
|--------|-------|-----------|
| **Alan Turing** | Algorithmic efficiency & logic | O(n²) = REJECTED — demand O(n) or O(log n) |
| **John von Neumann** | System architecture & game theory | Non-optimal patterns = REJECTED |
| **Pierre Bezier** | Frontend physics & animation | Linear transitions = REJECTED |
| **Claude Shannon** | Information theory (token economy) | Verbose/redundant = REJECTED |

## Pre-Code Protocol

Before writing implementation code:

```
Turing:      Time complexity = O(?)
Von Neumann: Architecture pattern = ?
Bezier:      Easing function = ?
Shannon:     Compression strategy = ?
```

## Approved CSS Easings

```css
--ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1);
```

## Mandatory Pre-Code Checklist

**STOP. Answer all four before writing a single line of implementation code:**

```
□ Turing:      What is the time complexity? O(?) — is O(n²) or worse acceptable here?
□ Von Neumann: Which architecture pattern? (service/hook/component/API route) — is it the right layer?
□ Bezier:      Does this involve animation/transition? If yes, which approved easing function?
□ Shannon:     Can this be expressed more simply? Remove all redundancy before coding.
```

If any answer is "I don't know" → consult the relevant member's rules in `.skills/custom/council-of-logic/SKILL.md` before proceeding.

## Execution Guardian Link

The Council's complexity score feeds directly into the Execution Guardian's confidence gate:
- O(n³) or worse → Guardian confidence drops ≥20 points
- Non-optimal architecture pattern → blast radius assessment escalates
- Shannon compression ratio < 0.5 → output flagged as verbose

Reference: `.skills/custom/execution-guardian/SKILL.md` — the Guardian blocks execution if Council raises a veto.

## Integration

- **Execution Guardian**: Council complexity scoring feeds into Guardian's confidence assessment
- **Turing complexity** → confidence scoring (high complexity = lower confidence)
- **Von Neumann architecture** → blast radius assessment
- **Shannon compression** → applies to all output formatting

Full council details, workflow overrides, and expanded member rules: `.skills/custom/council-of-logic/SKILL.md`
