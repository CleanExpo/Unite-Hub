---
paths: src/**/*.{ts,tsx}
---

# Next.js Frontend Rules

## Framework Configuration

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19, shadcn/ui (new-york style)
- **Styling**: Tailwind CSS v3, CSS Variables
- **State**: React hooks, Server Components

## Component Patterns

### ✅ DO: Component Structure

```tsx
export interface ComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof componentVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Component = React.forwardRef<HTMLDivElement, ComponentProps>(
  ({ className, variant, ...props }, ref) => {
    // Implementation
  }
);
Component.displayName = "Component";

export { Component, componentVariants };
```

### ✅ DO: Custom Hook Pattern

```tsx
export function useExample() {
  const [state, setState] = useState<ExampleState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getData();
      setState(data);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { state, loading, error, fetchData };
}
```

## Design System Rules

- Use semantic colors: `bg-brand-primary` not `bg-blue-500`
- Use CVA variants for component variants
- Import with `@/` prefix: `import { Button } from "@/components/ui/button"`
- Server Components by default, add `"use client"` only when needed
- Every async component needs loading/error/empty states
- **Icons**: AI-generated custom SVGs only. NO Lucide React. NO Hero Icons. (Deprecated per `standards/agent.md`)
- **Border radius**: `rounded-sm` only. Never `rounded-lg`, `rounded-xl`, `rounded-full`
- **Bundle budget**: First Load JS < 250KB per route. Dynamic import heavy components.

## Route Segment Requirements

Every route segment directory MUST contain:
```
src/app/[segment]/
  page.tsx       # Main content (Server Component)
  loading.tsx    # Skeleton/spinner shown during streaming
  error.tsx      # Error boundary (Client Component with 'use client')
```

`loading.tsx` and `error.tsx` are not optional — blank screens and unhandled errors are not acceptable.

## Anti-Patterns

❌ No explicit types, using `any`, inline styles, raw colors instead of design tokens

## Key Commands

```bash
pnpm dev                          # Development server
pnpm run type-check               # Type checking
pnpm run lint                     # Linting
pnpm build                       # Build for production
