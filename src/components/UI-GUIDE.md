# UI Components Guide

## IMPORTANT: Design System Enforcement
YOU MUST read `/DESIGN-SYSTEM.md` before generating any UI component.
Check `/docs/UI-LIBRARY-INDEX.md` for premium component library.

## Forbidden Patterns (NEVER use)

| Forbidden | Use Instead |
|-----------|-------------|
| `bg-white` | `bg-bg-card` |
| `text-gray-600` | `text-text-primary` |
| `text-gray-400` | `text-text-secondary` |
| `grid grid-cols-3 gap-4` | Responsive patterns from design system |
| Raw shadcn cards | Customized with design tokens |

## Exemplar Files
- `src/components/ui/Modal.tsx` - Accessible dialog with portal, animations
- `src/components/ui/Toast.tsx` - Notification system
- `src/components/patterns/Card.tsx` - Card patterns with design tokens

## Design Tokens

```css
/* Accent */
accent-500: #ff6b35 (orange)

/* Background */
bg-bg-card: Card backgrounds
bg-bg-primary: Primary backgrounds

/* Text */
text-text-primary: Primary text
text-text-secondary: Secondary text

/* Animation */
Framer Motion preferred
```

## DO: Component Template

```tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface MyComponentProps {
  children: React.ReactNode;
  variant?: 'default' | 'accent';
}

export function MyComponent({ children, variant = 'default' }: MyComponentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`
        bg-bg-card text-text-primary rounded-lg p-4
        ${variant === 'accent' ? 'border-l-4 border-accent-500' : ''}
      `}
    >
      {children}
    </motion.div>
  );
}

export default MyComponent;
```

## DO: Modal Pattern

```tsx
// See src/components/ui/Modal.tsx for full implementation
import Modal from '@/components/ui/Modal';

<Modal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  size="md"
>
  <p className="text-text-secondary">Modal content</p>
</Modal>
```

## DON'T: Anti-patterns

- **Generic LLM UI**: Using default Tailwind colors without design tokens
- **Missing 'use client'**: For components with hooks or browser APIs
- **No accessibility**: Missing ARIA attributes, keyboard navigation
- **Direct DOM manipulation**: Use refs and React patterns instead

## Key Imports

```typescript
// Animation
import { motion, AnimatePresence } from 'framer-motion';

// shadcn/ui (customize with design tokens)
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';

// Icons
import { Loader2, Check, X } from 'lucide-react';
```

## Search Commands

```bash
rg "bg-bg-card" src/components/ | head -10       # Design token usage
rg "motion\." src/components/ | head -10          # Animation usage
rg "'use client'" src/components/ -l              # Client components
rg "DialogContent" src/components/                # Dialog usage
```

## Pre-PR Checklist

```bash
npm run lint && npm run build
# Visual review required for all UI changes
```

## Quality Gates (9/10 minimum)
- Visual distinctiveness
- Brand alignment (accent color, tokens)
- Code quality
- Accessibility (ARIA, keyboard nav)
