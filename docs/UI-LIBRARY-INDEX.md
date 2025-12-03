# UI Library Index - Component Reference

Quick reference for premium UI libraries. Check these BEFORE using default shadcn/ui components.

---

## Priority Order

1. **Project Components** (`/src/components/ui/`) - Always check first
2. **Primary Libraries** - StyleUI, KokonutUI, Cult UI, Motion Primitives, Prompt Kit
3. **Secondary Libraries** - Magic UI, Aceternity, Tremor, Kibo UI
4. **shadcn/ui Base** - Only with customization
5. **NEVER** - Generic defaults without brand styling

---

## Primary Libraries

### StyleUI - Premium Blocks & Templates

| | |
|---|---|
| **URL** | [styleui.dev](https://www.styleui.dev/) |
| **Type** | shadcn/ui extension |
| **Best For** | Pre-built sections (heroes, features, pricing, dashboards) |
| **Integration** | Copy-paste, shadcn-compatible |

**Use for:**
- Hero sections
- Feature grids
- Pricing tables
- Complete page layouts

---

### KokonutUI - 100+ Modern Components

| | |
|---|---|
| **URL** | [kokonutui.com](https://kokonutui.com/) |
| **Type** | Tailwind + shadcn + Motion |
| **Best For** | Interactive components with motion |
| **Integration** | Copy-paste with Framer Motion |

**Use for:**
- Modern card designs
- Animated interfaces
- Upload/file components
- Interactive UI elements

---

### Cult UI - Design Engineer Components

| | |
|---|---|
| **URL** | [cult-ui.com](https://www.cult-ui.com/) |
| **Type** | shadcn-compatible blocks & templates |
| **Best For** | AI SDK agent patterns, Gemini Flash integration |
| **Integration** | Copy-paste, includes AI SDK patterns |

**Special Blocks:**
- Gemini Flash Image Editor
- Agent - Multi-Step Tool Pattern
- Agent - Orchestrator Pattern
- Agent - Routing Pattern

**Use for:**
- AI chat interfaces
- Agent orchestration UIs
- Image generation/editing interfaces
- Landing pages with animations
- SEO tools and dashboards

---

### Motion Primitives - Animation Components

| | |
|---|---|
| **URL** | [motion-primitives.com](https://motion-primitives.com/) |
| **Type** | Animation-focused UI kit |
| **Best For** | Text animations, page transitions, micro-interactions |
| **Integration** | Copy-paste, Framer Motion based |

**Use for:**
- Text animations (scramble, reveal, typewriter)
- Page transitions
- Micro-interactions
- Scroll-triggered animations
- Loading states

---

### Prompt Kit - AI Interface Components

| | |
|---|---|
| **URL** | [prompt-kit.com](https://www.prompt-kit.com/) |
| **Type** | AI interface building blocks |
| **Best For** | Chat interfaces, prompt inputs, AI responses |
| **Integration** | shadcn-compatible, copy-paste |

**Components:**
- PromptInput
- PromptInputTextarea
- PromptInputAction
- MessageBubble
- ResponseStream

---

## Secondary Libraries

### Magic UI - Micro-interactions & Effects

| | |
|---|---|
| **URL** | [magicui.design](https://magicui.design/) |
| **Type** | Animated components + effects |
| **Best For** | Landing page animations, background effects |

---

### Aceternity UI - Premium Animated Components

| | |
|---|---|
| **URL** | [ui.aceternity.com](https://ui.aceternity.com/) |
| **Type** | React + Tailwind + Framer Motion |
| **Best For** | 3D effects, parallax, spotlight effects |

---

### Tremor - Dashboard Components

| | |
|---|---|
| **URL** | [tremor.so](https://www.tremor.so/) |
| **Type** | Dashboard-focused UI |
| **Best For** | Analytics dashboards, KPI displays, data tables |

---

### Kibo UI - Advanced shadcn Extensions

| | |
|---|---|
| **URL** | [kibo-ui.com](https://www.kibo-ui.com/) |
| **Type** | shadcn gap-filler |
| **Best For** | Stories, reels, deck, mini calendar, comparison |

---

### shadcn.io Community - Extended Ecosystem

| | |
|---|---|
| **URL** | [shadcn.io](https://www.shadcn.io/) |
| **Type** | Community resource hub |
| **Best For** | Charts, effects, WebGL shaders, custom hooks |

---

### Eldora UI - Modern Tailwind Components

| | |
|---|---|
| **URL** | [eldoraui.site](https://www.eldoraui.site/) |
| **Type** | Tailwind + Framer Motion |
| **Best For** | Modern landing pages, theme generator |

---

### UI Layouts - Complete Toolkit

| | |
|---|---|
| **URL** | [ui-layouts.com](https://www.ui-layouts.com/) |
| **Type** | Components + effects + blocks |
| **Best For** | Complex layouts, visual effects |

---

## Specialized Libraries

### For Marketing Sites

| Library | URL | Use |
|---------|-----|-----|
| Tailark | tailark.com | Marketing-specific blocks |
| shadcnblocks | shadcnblocks.com | 579+ handcrafted blocks |
| TailGrids | tailgrids.com | 600+ responsive components |

### For Animations

| Library | URL | Use |
|---------|-----|-----|
| Framer Motion | framer.com/motion | Complex animations, gestures |
| Auto Animate | auto-animate.formkit.com | Zero-config animations |
| GSAP | greensock.com/gsap | Advanced timeline animations |

### For Forms

| Library | Use |
|---------|-----|
| React Hook Form | Form state management |
| Zod | Schema validation |
| Formik | Alternative form handling |

### For Data Display

| Library | URL | Use |
|---------|-----|-----|
| TanStack Table | tanstack.com/table | Advanced data tables |
| Recharts | recharts.org | Charts (shadcn default) |
| Nivo | nivo.rocks | Rich data visualization |

---

## Usage Workflow

```yaml
WHEN_BUILDING_COMPONENTS:
  1. CHECK_PROJECT_COMPONENTS:
     - Look in /src/components/ui/ first
     - 48 existing components available

  2. CHECK_SPECIALIZED_LIBRARIES:
     for_ai_interfaces: "Prompt Kit, Cult UI"
     for_animations: "Motion Primitives, Magic UI, Aceternity"
     for_sections: "StyleUI, KokonutUI"
     for_dashboards: "Tremor, Kibo UI"
     for_marketing: "Tailark, shadcnblocks"

  3. CHECK_SHADCN_BASE:
     - Use as foundation
     - ALWAYS customize colors/styling
     - NEVER use defaults without modification

  4. COMBINE_AND_CUSTOMIZE:
     - Mix components from multiple libraries
     - Apply Synthex design system
     - Add brand-specific styling (#ff6b35 accent)
```

---

## Existing Project Components

Located in `/src/components/ui/`:

**Core Components:**
- button.tsx (8 variants, loading states)
- card.tsx
- input.tsx
- badge.tsx
- dialog.tsx
- dropdown-menu.tsx

**Animation Components:**
- three-d-carousel.tsx
- infinite-slider.tsx
- animated-number.tsx
- text-loop.tsx
- progressive-blur.tsx
- scroll-progress.tsx

**Dashboard Components:**
- metrics-card.tsx
- stat-card.tsx
- skeleton-card.tsx

**Navigation:**
- dock.tsx
- tabs.tsx
- Breadcrumbs.tsx

---

*Reference this file before generating any new UI components.*
