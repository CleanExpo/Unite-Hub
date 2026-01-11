# Dashboard UI Reference

Visual guide to the Web Scraper Dashboard components and layouts.

## Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Web Scraper                                  + New Project   │ ← Header
├─────────────────────────────────────────────────────────────┤
│ Discover URLs, scrape content, extract data for research    │
└─────────────────────────────────────────────────────────────┘

┌───────────┬───────────┬───────────┐
│ Project 1 │ Project 2 │ Project 3 │ ← Projects Grid (3 cols desktop)
├───────────┼───────────┼───────────┤
│ Project 4 │ Project 5 │           │
└───────────┴───────────┴───────────┘
```

## Projects List Card (Individual Project)

```
┌─────────────────────────────────────┐
│ AI Tools Pricing          [Completed]│ ← Status badge
├─────────────────────────────────────┤
│ Keywords:                            │
│ [AI pricing] [API costs] [models]   │
├─────────────────────────────────────┤
│ URLs Found: 18  │ Scraped: 15  │ F: 0│ ← Stats
├─────────────────────────────────────┤
│ ████████████████░░░░ 15/18          │ ← Progress bar
│                                      │
│ Created 2 hours ago                  │
├─────────────────────────────────────┤
│ [View Details]  [Delete]            │ ← Actions
└─────────────────────────────────────┘
```

## Create Project Form

```
┌─────────────────────────────────────────────────────┐
│ Create New Project                                  │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Project Name *                                      │
│ [e.g., AI Tools Comparison         ]               │
│                                                      │
│ Description                                         │
│ [Optional: What you're researching  ]              │
│                                                      │
│ Starting URL *                                      │
│ [e.g., openai.com                  ]               │
│ The main domain to start from                       │
│                                                      │
│ Keywords * (Max 5)                                  │
│ [Type keyword...          ] [Add]                   │
│ [AI pricing] [API costs] [models]                  │
│                                                      │
│ Maximum URLs to Scrape                              │
│ [20] (5-50)                                        │
│                                                      │
│ ☑ Include Images                                    │
│ ☑ Extract Pricing Data                              │
│                                                      │
│ ℹ️ Estimated Time: 10-20 minutes for 20 URLs      │
│                                                      │
│ [Cancel]  [Start Scraping]                         │
└─────────────────────────────────────────────────────┘
```

## Project Detail - Overview Tab (Processing)

```
┌──────────────────────────────────────────────────────┐
│ AI Tools Pricing                              ← back │
├──────────────────────────────────────────────────────┤
│ Status: Extracting  │ URLs: 18  │ Scraped: 15 │ F: 0│
├──────────────────────────────────────────────────────┤
│ Extracting Data                                      │
│ ███████████░░░░░░░░░░░░░░░░░░░░░░░░░  12/18       │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Configuration          │ Results Summary             │
│ ─────────────────────  │ ────────────────────────   │
│ Seed URL:             │ Products Found: 24         │
│ openai.com            │ Pricing Models: 8          │
│                       │ Images Extracted: 32       │
│ Keywords:             │                            │
│ [AI pricing]          │                            │
│ [API costs]           │                            │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## Project Detail - Products Tab (Completed)

```
┌───────────────┬───────────────┬───────────────┐
│               │               │               │
│ [Product Image] [Product Image] [Product Image]│
│                               │               │
│ Pro Plan      │ Enterprise    │ Starter       │
│ $99/month     │ Custom price  │ $29/month     │
│ Features:     │ Features:     │ Features:     │
│ • Feature 1   │ • Feature 1   │ • Feature 1   │
│ • Feature 2   │ • Feature 2   │ • Feature 2   │
│ • Feature 3   │ • Feature 3   │               │
│               │               │               │
└───────────────┴───────────────┴───────────────┘
```

## Project Detail - Pricing Tab (Completed)

```
┌──────────────────────────────────────────────────────┐
│ Plan Name      │ Price          │ Features           │
├──────────────────────────────────────────────────────┤
│ Starter        │ $29/month      │ Basic features     │
│ Professional   │ $99/month      │ Advanced features  │
│ Enterprise     │ Custom price   │ All features       │
│ Plus 10 more rows...                                │
└──────────────────────────────────────────────────────┘
```

## Project Detail - Images Tab (Completed)

```
┌──────────┬──────────┬──────────┬──────────┐
│ [Product]│ [Feature]│ [Logo]   │ [Product]│
│          │          │          │          │
│ product  │ feature  │ logo     │ product  │
├──────────┼──────────┼──────────┼──────────┤
│ [Product]│ [Feature]│ [Product]│ [Feature]│
│          │          │          │          │
│ product  │ feature  │ product  │ feature  │
└──────────┴──────────┴──────────┴──────────┘
```

## Project Detail - Article Tab (Completed)

```
┌─────────────────────────────────────────────┐
│ Complete AI Pricing Guide                   │
│                                              │
│ Key Highlights                               │
│ • Prices range from $29-$999/month         │
│ • Most offer free tier options              │
│ • API usage is main cost driver             │
├─────────────────────────────────────────────┤
│ 1. Introduction                              │
│ Overview of AI pricing landscape...         │
│ Sources: url1, url2, url3                   │
│                                              │
│ 2. Pricing Comparison                        │
│ Key differences between plans...            │
│ Sources: url2, url4, url5                   │
│                                              │
│ 3. Features & Tiers                          │
│ What each plan includes...                  │
│ Sources: url1, url3, url6                   │
│                                              │
│ Recommended action: Try free tiers first    │
├─────────────────────────────────────────────┤
│ [Copy as Markdown]  [Download as PDF]      │
└─────────────────────────────────────────────┘
```

## Color Scheme

```
Background Colors:
  Base:       #08090a (main background)
  Raised:     #0f1012 (elevated sections)
  Card:       #141517 (card backgrounds)
  Hover:      #1a1b1e (hover states)
  Input:      #111214 (input backgrounds)

Text Colors:
  Primary:    #f8f8f8 (main text)
  Secondary:  #9ca3af (less important)
  Muted:      #6b7280 (disabled/muted)

Accent Colors (Primary Brand - Orange):
  Primary:    #ff6b35 (buttons, highlights)
  Hover:      #ff7d4d (hover state)
  Active:     #ff5c1a (active state)

Status Colors:
  Success:    #10b981 (green)
  Warning:    #f59e0b (yellow)
  Error:      #ef4444 (red)
  Info:       #3b82f6 (blue)
```

## Responsive Breakpoints

```
Mobile (<640px):
  - 1 column layouts
  - Full-width forms
  - Stacked navigation
  - Touch-optimized buttons (48px minimum)

Tablet (640px - 1024px):
  - 2 column grid
  - Side-by-side forms
  - Responsive tables (scrollable)

Desktop (>1024px):
  - 3 column grid
  - Multi-panel layouts
  - Full tables without scroll
```

## Interactive States

### Buttons

```
Default:        bg-accent-500 text-white
Hover:          bg-accent-400 (lighter)
Active:         bg-accent-600 (darker)
Disabled:       bg-text-muted opacity-50
Loading:        Animated spinner + text
Focus:          Ring-2 ring-accent-500
```

### Cards

```
Default:        border-border-base bg-bg-card
Hover:          border-accent-500/50 shadow-lg
Focus:          ring-2 ring-accent-500
```

### Inputs

```
Default:        bg-bg-input border-border-base
Hover:          border-border-medium
Focus:          ring-2 ring-accent-500 border-accent-500
Error:          border-error-500 bg-error-500/5
Success:        border-success-500 bg-success-500/5
```

### Progress Bars

```
Background:     bg-bg-hover
Fill:           gradient from-accent-500 to-accent-400
Animation:      transition-all duration-500
```

## Typography Scale

```
h1:  text-4xl font-bold
h2:  text-3xl font-bold
h3:  text-2xl font-semibold
h4:  text-xl font-semibold
h5:  text-lg font-medium

Body Large:  text-base
Body Normal: text-sm
Body Small:  text-xs

Highlight:   font-bold text-accent-500
Muted:       text-text-muted
Secondary:   text-text-secondary
```

## Spacing System

```
xs: 4px   (0.25rem)
sm: 8px   (0.5rem)
md: 16px  (1rem)
lg: 24px  (1.5rem)
xl: 32px  (2rem)
2xl: 48px (3rem)

Common Usage:
  Card padding:      24px (lg)
  Section gap:       32px (xl)
  Button padding:    12px 24px (sm, lg)
  Input padding:     12px 16px (sm, md)
  Icon gap:          8px (sm)
```

## Animation Guidelines

```
Transitions:
  Colors:     150ms ease-out
  Opacity:    200ms ease-out
  Transforms: 300ms ease-out

Progress:    500ms ease-out (smooth bar fill)
Spinner:     continuous rotation
Loading:     Pulse effect on disabled state
Hover:       Subtle lift + border color change
```

## Accessibility

```
Focus States:
  - Visible focus ring on all interactive elements
  - Minimum 8px ring width
  - Color: accent-500
  - Z-index: on top of content

Color Contrast:
  - Text on background: 7:1 (AAA standard)
  - Icon on background: 4.5:1 (AA standard)

Alt Text:
  - All images must have meaningful alt text
  - Format: "Product screenshot", "Feature icon"

ARIA Labels:
  - Buttons without visible text need aria-label
  - Form fields have associated labels
  - Status updates announce to screen readers

Keyboard Navigation:
  - Tab order follows visual flow
  - Enter submits forms
  - Escape closes modals
  - Arrow keys in tab lists
```

## Component Library

**Used Libraries:**
- shadcn/ui (base components)
- Tailwind CSS (styling)
- date-fns (date formatting)
- Custom components (project-specific)

**Design Tokens:**
All colors use CSS variables defined in globals.css
```
var(--color-bg-base)
var(--color-text-primary)
var(--color-accent-500)
etc.
```

**Typography:**
System font stack with fallbacks
```
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", ...
```
