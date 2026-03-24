---
id: visual-excellence-enforcer
name: visual-excellence-enforcer
type: Encoded Preference Workflow
version: 1.0.0
created: 20/03/2026
modified: 20/03/2026
status: active
triggers:
  - check the UI
  - review the design
  - is the visual quality acceptable
  - audit visual
  - does it look good
  - visual review
  - design review
  - UI audit
  - check the frontend
description: ">"
---


# Visual Excellence Enforcer Skill

> **Purpose**: The system does not accept generic LLM UI as complete.
> Every UI component must meet the Scientific Luxury standard before shipping.
> Proof required: screenshot, not description.

## When to Use

Use this skill when:

- A UI component, page, or layout is claimed to be complete
- Before merging any frontend PR
- When a screenshot or visual proof is requested
- When design QA is required

## Scientific Luxury Design Standard

This repository uses the **Scientific Luxury** design system. Reference: `docs/DESIGN_SYSTEM.md`.

### Non-Negotiable Rules

| Rule                        | Required                                                                                                | Banned                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Background                  | OLED Black `#050505`                                                                                    | Grey, white, any other                                                   |
| Border radius               | `rounded-sm` only                                                                                       | `rounded-lg`, `rounded-full`, `rounded-xl`, `rounded-2xl`, `rounded-3xl` |
| Animations                  | Framer Motion only                                                                                      | CSS `transition: all linear`, `animation:` without Framer                |
| Typography (code/data)      | JetBrains Mono                                                                                          | Any other monospace                                                      |
| Typography (names/headings) | Editorial New                                                                                           | System fonts                                                             |
| Borders                     | `border-[0.5px] border-white/[0.06]`                                                                    | Solid 1px coloured borders                                               |
| Colours                     | Spectral palette (Cyan `#00F5FF`, Emerald `#00FF88`, Amber `#FFB800`, Red `#FF4444`, Magenta `#FF00FF`) | Bootstrap blues, Material greens                                         |
| Shadows                     | None or subtle glow effects                                                                             | `box-shadow: 0 4px 6px rgba(0,0,0,0.1)` (generic)                        |

### Approved CSS Easings

Only these easing functions are approved for animations:

```css
--ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1);
```

### Generic UI Patterns (Auto-Reject)

These patterns indicate factory-default LLM UI and are rejected immediately:

- Unstyled shadcn components with no customisation
- Blue primary buttons (`bg-blue-500`)
- White card backgrounds (`bg-white`, `bg-gray-50`, `bg-gray-100`)
- Default Tailwind grey palette as primary colour
- `<button>` without hover state or animation
- Placeholder text that says "Lorem ipsum" or "Click here"
- Images that are placeholder grey boxes
- Default browser scrollbar (must be styled or hidden)

## Procedure

### Step 1: Request screenshot

If no screenshot has been provided:

```
VISUAL REVIEW REQUIRED
A screenshot of the actual rendered component/page is required.
Description of UI is not accepted as visual proof.
Please provide: [screenshot path or image]
```

### Step 2: Audit screenshot against rules

For each design rule, check the screenshot:

- Background colour: is it `#050505`?
- Border radius: are corners sharp (rounded-sm)?
- Typography: is JetBrains Mono visible for data/code?
- Animations: are they smooth with approved easings (cannot verify from static screenshot — check code)?
- Banned patterns: any generic blue buttons, white backgrounds, placeholder text?

### Step 3: Audit code for banned patterns

Search the component file for:

- `rounded-lg`, `rounded-full`, `rounded-xl` — FAIL
- `bg-white`, `bg-gray-`, `bg-slate-` — FAIL (unless intentional contrast element)
- `transition-all linear` or `transition: all 0.3s` — FAIL
- `animate-` Tailwind animation classes — FAIL (use Framer Motion)

### Step 4: Generate visual audit report

```
VISUAL AUDIT REPORT
═══════════════════════════════════════════════════
Component: [component name / page]
Date: [DD/MM/YYYY]

SCREENSHOT REVIEW
─────────────────
[Screenshot: PROVIDED / NOT PROVIDED]

DESIGN RULE CHECKS
─────────────────
PASS | Background: OLED Black #050505 confirmed
FAIL | Border radius: rounded-lg found on line 23 — replace with rounded-sm
PASS | Typography: JetBrains Mono visible
FAIL | Banned pattern: bg-white on card component — replace with bg-[#050505]
PASS | No placeholder text
PASS | Framer Motion used for animations

SCORE: [N]/[total] rules passing

STATUS: APPROVED | REJECTED
[If rejected: list exact fixes required]
═══════════════════════════════════════════════════
```

## Validation Gates

Before approving a UI component:

- [ ] Screenshot provided (not description)
- [ ] Background is OLED Black `#050505`
- [ ] No `rounded-lg`, `rounded-full`, or larger
- [ ] No generic blue/grey colour palette
- [ ] No placeholder content
- [ ] Animations verified (Framer Motion in code)
- [ ] JetBrains Mono present for any data/code display

## Failure Modes

| Failure                                  | Recovery                                            |
| ---------------------------------------- | --------------------------------------------------- |
| Screenshot not provided                  | Block until screenshot is provided                  |
| Screenshot is localhost, need production | Request production URL screenshot                   |
| `rounded-lg` found                       | Replace with `rounded-sm` across component          |
| `bg-white` found                         | Replace with `bg-[#050505]` or correct design token |
| Generic animation                        | Replace with Framer Motion + approved easing        |
| Generic button styling                   | Apply spectral colour palette + hover state         |

## Eval Examples

### Pass

Component screenshot shows: dark OLED background, sharp corners, cyan accent on active state, JetBrains Mono for API responses, smooth spring animation on hover. — APPROVED

### Fail

Component screenshot shows: white card on light grey background, blue primary button, rounded-2xl corners, no animation. — REJECTED — 4 critical violations found.