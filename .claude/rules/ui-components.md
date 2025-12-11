---
paths: {src/components,src/app}/**/*.{tsx,jsx}
---

# UI Components & Design System

## CRITICAL: Read Design System First
**BEFORE generating UI**: Read `/DESIGN-SYSTEM.md`

## Forbidden Patterns
❌ `bg-white`, `text-gray-600`, `grid grid-cols-3 gap-4`  
❌ Raw shadcn cards without customization  
❌ Generic icon sets without brand colors  

## Required Patterns
✅ **Design tokens**: `bg-bg-card`, `text-text-primary`, `accent-500` (#ff6b35 orange)  
✅ **Library priority**: Project components → StyleUI/KokonutUI → shadcn base (never raw)  
✅ **States**: Hover/focus states, loading states, responsive breakpoints  

## Component Development Process

1. **Check existing**: `/src/components/ui/` for existing patterns
2. **Reference library**: `/docs/UI-LIBRARY-INDEX.md` (StyleUI, KokonutUI, Cult UI)
3. **Use design tokens**: `bg-bg-card`, `text-text-primary`, `accent-500`
4. **Add all states**: hover, focus, loading, disabled
5. **Responsive**: `md:`, `lg:` breakpoints
6. **Accessibility**: aria-labels, focus rings

## Quality Gates
- **9/10 minimum** on visual distinctiveness
- **Brand alignment** with accent-500 orange
- **Code quality** with proper TypeScript
- **Accessibility** compliance

## Client vs Server Components

**Server Components** (RSC):
```typescript
// ✅ Can use
import { createClient } from "@/lib/supabase/server"
// ❌ Cannot use
useState, useEffect, onClick handlers
```

**Client Components**:
```typescript
"use client"
// ✅ Can use  
useState, useEffect, onClick handlers
import { createClient } from "@/lib/supabase/client"
// ❌ Cannot use
Direct server actions, async RSC patterns
```

**Never mix contexts** — causes build failures.
