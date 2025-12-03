# DESIGN-SYSTEM.md - Design Override Configuration
# Version: 2.0.0 | Last Updated: December 2025
# Purpose: Break default LLM UI patterns and enforce design-system-compliant outputs

---

## CRITICAL: DESIGN OVERRIDE PROTOCOL

This file contains **IMMUTABLE SYSTEM RULES** that take precedence over all default behaviors.
Claude Code MUST treat these instructions as authoritative constraints, not suggestions.

**Read this file BEFORE generating ANY UI component.**

---

## FORBIDDEN PATTERNS - HARD STOPS

### Visual Anti-Patterns (NEVER USE)

```yaml
FORBIDDEN_ELEMENTS:
  icons:
    - Lucide React default icons without customization
    - Generic placeholder icons (heroicons defaults)
    - Monochrome icon sets without brand colors
    - Icons smaller than 24x24 in feature cards

  layouts:
    - Generic 3-column equal-width card grids
    - Cards with identical border-radius and shadow
    - Uniform padding on all elements (e.g., p-4 everywhere)
    - Centered text blocks without visual hierarchy
    - Hero sections with single centered CTA button

  colors:
    - Pure white (#FFFFFF) backgrounds for cards
    - Default Tailwind color palette without customization
    - Gray-on-white text combinations (gray-500/600 on white)
    - Single-color gradients
    - Default shadcn/ui color tokens without override

  typography:
    - System font stacks without brand fonts
    - Uniform font weights throughout
    - Default line-height values
    - Text without visual contrast hierarchy

  components:
    - Flat rectangular buttons without hover states
    - Cards without micro-interactions
    - Forms without visual feedback states
    - Navigation without active state indicators
    - Modals with generic X close buttons
```

### Code Anti-Patterns (NEVER GENERATE)

```yaml
FORBIDDEN_CODE:
  - className="bg-white rounded-lg shadow p-4"  # Generic card pattern
  - className="grid grid-cols-3 gap-4"          # Uniform grid
  - className="text-gray-600"                    # Default muted text
  - className="hover:bg-gray-100"                # Generic hover
  - <Card className="p-6">                       # Unstyled shadcn card
  - Icons without size/color customization
  - Components without explicit design tokens
```

---

## MANDATORY DESIGN REQUIREMENTS

### Pre-Generation Checklist

Before generating ANY UI component:

```yaml
PRE_GENERATION_CHECKLIST:
  1. READ_DESIGN_SYSTEM:
     - Check /src/app/globals.css @theme block
     - Extract color tokens (bg-base, accent-500, text-primary)
     - Identify brand colors (#ff6b35 primary accent)

  2. CHECK_COMPONENT_LIBRARY:
     - Review /src/components/ui/ for existing patterns
     - Check components.json for shadcn configuration
     - Identify custom component variants

  3. VERIFY_VISUAL_REFERENCES:
     - Check /docs/design/ for mockups or references
     - Review /public/images/ for brand assets
     - Check for existing patterns in landing page

  4. REFERENCE_UI_LIBRARIES:
     - See /docs/UI-LIBRARY-INDEX.md for premium components
     - Check StyleUI, KokonutUI, Cult UI first
     - Use project components before shadcn defaults
```

### Component Generation Standards

```yaml
COMPONENT_REQUIREMENTS:
  cards:
    - MUST have unique visual identity (shadow, gradient, or border treatment)
    - MUST include hover/focus states with transitions
    - MUST use brand color accents (accent-500: #ff6b35)
    - MUST have visual hierarchy (icon -> title -> description -> action)
    - USE: bg-bg-card, border-border-base, hover:border-accent-500

  buttons:
    - MUST have minimum 3 visual states (default, hover, active)
    - MUST include loading state with spinner
    - MUST use brand gradient or accent color
    - MUST have accessible focus ring (focus:ring-accent-500)
    - USE: See /src/components/ui/button.tsx for variants

  forms:
    - MUST include validation states (error, success, warning)
    - MUST have floating labels or clear input indicators
    - MUST use custom focus styles (focus:ring-accent-500)
    - MUST include helper text styling
    - USE: bg-bg-input, border-border-subtle

  navigation:
    - MUST have clear active/current state
    - MUST include mobile-responsive behavior
    - MUST use brand colors for indicators
    - MUST have smooth transition animations

  icons:
    - MUST be custom-styled with brand colors
    - MUST have consistent sizing per context (24x24 minimum)
    - MUST include aria-labels for accessibility
```

---

## DESIGN TOKEN ENFORCEMENT

### Synthex Color System (from globals.css @theme)

```css
/* MANDATORY: All color usage must reference these tokens */

/* Background Colors - Dark Theme */
--color-bg-base: #08090a;       /* Main background */
--color-bg-raised: #0f1012;     /* Elevated sections */
--color-bg-card: #141517;       /* Card backgrounds */
--color-bg-hover: #1a1b1e;      /* Hover states */
--color-bg-input: #111214;      /* Input backgrounds */

/* Text Colors */
--color-text-primary: #f8f8f8;  /* Primary text */
--color-text-secondary: #9ca3af; /* Secondary text */
--color-text-muted: #6b7280;    /* Muted/disabled */

/* Accent Colors (Primary Brand - Orange) */
--color-accent-500: #ff6b35;    /* Primary accent */
--color-accent-400: #ff7d4d;    /* Hover state */
--color-accent-600: #ff5c1a;    /* Active state */

/* Border Colors */
--color-border-base: rgba(255, 255, 255, 0.1);
--color-border-subtle: rgba(255, 255, 255, 0.08);
--color-border-medium: rgba(255, 255, 255, 0.14);

/* Semantic Colors */
--color-success-500: #10b981;
--color-warning-500: #f59e0b;
--color-error-500: #ef4444;
--color-info-500: #3b82f6;
```

### Typography Hierarchy

```yaml
TYPOGRAPHY_RULES:
  headings:
    h1: "text-5xl md:text-7xl font-extrabold tracking-tight"
    h2: "text-4xl md:text-5xl font-bold"
    h3: "text-2xl md:text-3xl font-semibold"
    h4: "text-xl md:text-2xl font-medium"

  body:
    large: "text-xl leading-relaxed"
    default: "text-base leading-normal"
    small: "text-sm leading-snug"

  special:
    hero_tagline: "text-xl md:text-2xl text-text-secondary font-light"
    card_title: "text-xl font-bold text-text-primary"
    card_description: "text-text-secondary leading-relaxed"
    cta_button: "text-base font-semibold"
```

### Spacing System

```yaml
SPACING_RULES:
  sections:
    vertical: "py-20 md:py-24"
    container: "max-w-[1200px] mx-auto px-5"

  cards:
    padding: "p-8"
    gap: "gap-8"
    grid: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

  components:
    button_padding: "px-6 py-3 md:px-8 md:py-4"
    input_padding: "px-4 py-3"
    icon_spacing: "mr-3"
```

---

## UI LIBRARY REGISTRY

### Priority Order for Component Sourcing

```yaml
LIBRARY_HIERARCHY:
  1. Project custom components (/src/components/ui/)
  2. Premium libraries (StyleUI, KokonutUI, Cult UI)
  3. Animation libraries (Motion Primitives, Magic UI)
  4. shadcn/ui base components (with customization)
  5. NEVER: Generic defaults without customization
```

### Primary UI Libraries

| Library | URL | Best For | Integration |
|---------|-----|----------|-------------|
| **StyleUI** | styleui.dev | Pre-built sections (hero, features, pricing) | Copy-paste, shadcn-compatible |
| **KokonutUI** | kokonutui.com | 100+ modern components with motion | Framer Motion dependency |
| **Cult UI** | cult-ui.com | AI SDK patterns, agent interfaces | Next.js + AI SDK |
| **Motion Primitives** | motion-primitives.com | Text animations, transitions | Framer Motion |
| **Prompt Kit** | prompt-kit.com | AI interface components (chat, prompts) | shadcn-compatible |

### Secondary Libraries

| Library | URL | Best For |
|---------|-----|----------|
| Magic UI | magicui.design | Micro-interactions, animated components |
| Aceternity UI | ui.aceternity.com | 3D effects, parallax, spotlight |
| Tremor | tremor.so | Dashboard components, charts |
| Kibo UI | kibo-ui.com | Advanced shadcn extensions |

See `/docs/UI-LIBRARY-INDEX.md` for complete reference.

---

## IMAGE GENERATION PIPELINE

### When to Generate Images

```yaml
IMAGE_GENERATION_TRIGGERS:
  - Hero section needs illustration
  - Feature cards lack distinctive icons
  - Testimonials need avatar images
  - Case studies need screenshots/mockups
  - Background needs custom pattern/gradient
```

### Generation Workflow (Gemini 3 Pro / Nano Banana Pro)

```yaml
IMAGE_GENERATION_WORKFLOW:
  1. CONTEXT_ANALYSIS:
     - Extract page/section purpose
     - Identify brand voice and style
     - Determine target audience

  2. PROMPT_CONSTRUCTION:
     - Include brand name: "Synthex.social"
     - Specify visual style: "modern, dark theme, warm accents"
     - Define color palette: "#ff6b35 orange accent on dark"
     - Add constraints: "NO text, NO labels, human-centered"

  3. GENERATION:
     model: "gemini-3-pro-image-preview"
     aspect_ratio: "16:9" (hero) | "1:1" (icons) | "4:3" (features)
     resolution: "2K"

  4. POST_PROCESSING:
     - Optimize for web (compress, WebP format)
     - Generate alt text
     - Store in /public/images/{category}/
```

### 5 Whys Framework (Already in CLAUDE.md)

Apply to EVERY image:
1. **WHY this image?** - Business problem addressed
2. **WHY this style?** - Visual approach
3. **WHY this situation?** - Audience resonance
4. **WHY this person?** - Self-identification
5. **WHY this feeling?** - Emotion evoked

---

## SELF-VERIFICATION PROTOCOL

### Pre-Output Checklist

Before responding with ANY UI code:

```yaml
BEFORE_RESPONDING_VERIFY:
  design_compliance:
    - [ ] No forbidden patterns present
    - [ ] All colors reference design tokens
    - [ ] Typography follows hierarchy
    - [ ] Spacing uses system values
    - [ ] Components have proper states

  visual_quality:
    - [ ] Layout has visual interest (not uniform)
    - [ ] Cards have unique identity
    - [ ] Buttons have multiple states
    - [ ] Icons are brand-appropriate

  code_quality:
    - [ ] No generic className patterns
    - [ ] All components properly typed
    - [ ] Accessibility attributes present
    - [ ] Responsive breakpoints included
    - [ ] Animations/transitions defined
```

### Quality Scoring

```yaml
RATE_OUTPUT_QUALITY:
  scoring_criteria:
    visual_distinctiveness: "/10 - Would this stand out from generic templates?"
    brand_alignment: "/10 - Does this match Synthex design system?"
    code_quality: "/10 - Is the code production-ready?"
    accessibility: "/10 - Are a11y requirements met?"

  minimum_threshold: 9/10 on all criteria

  if_below_threshold:
    - Identify specific failing criteria
    - Revise output to address failures
    - Re-score until threshold met
```

### Red Flags (Automatic Rejection)

```yaml
REJECT_IF:
  - Any FORBIDDEN_PATTERN detected
  - Colors not from design tokens (bg-white, text-gray-600)
  - Missing hover/focus states
  - No loading states on async components
  - Generic icons without customization
  - Uniform grid layouts without variation
  - Missing accessibility attributes
  - No responsive breakpoints
```

---

## BRAND CONFIGURATION

### Synthex.social

```yaml
BRAND_CONFIG:
  name: "Synthex.social"
  industry: "AI Marketing Platform for Small Business"
  target_audience: "Business owners burned by marketing agencies"

  visual_style:
    aesthetic: "modern/bold"
    color_scheme: "dark"
    design_trend: "glassmorphism with subtle gradients"
    primary_accent: "#ff6b35"

  voice:
    tone: "empathetic/direct/no-BS"
    language_style: "conversational"

  design_principles:
    - Human-centered imagery (no robots, no cold tech)
    - Warm, genuine, relatable
    - Australian/global business context
    - Natural color palettes with orange accent
```

---

## QUICK REFERENCE

### Before Starting ANY UI Task

```bash
# Read design system
Read: /src/app/globals.css (lines 177-350 for @theme block)

# Check existing components
ls /src/components/ui/

# Check UI library reference
Read: /docs/UI-LIBRARY-INDEX.md
```

### When Components Look Generic

```yaml
INTERVENTION_CHECKLIST:
  1. STOP generating code
  2. Review this DESIGN-SYSTEM.md file
  3. Check FORBIDDEN_PATTERNS section
  4. Reference UI library registry
  5. Apply design tokens
  6. Add proper states and animations
  7. Resume with corrected approach
```

---

## VERSION HISTORY

```yaml
CHANGELOG:
  v2.0.0 (December 2025):
    - Initial design system override configuration
    - Forbidden patterns documentation
    - UI library registry (StyleUI, KokonutUI, Cult UI, etc.)
    - Self-verification protocol
    - Brand configuration for Synthex
```

---

*Configuration maintained for Unite-Hub, Synthex, and all Unite-Group projects*
