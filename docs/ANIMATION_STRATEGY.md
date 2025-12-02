# Page Transitions & Animation Strategy
**Phase**: 3 (Transformation), Week 10
**Implementation Lead**: Claire (Frontend)
**Design Lead**: Phill
**Timeline**: 5 hours implementation
**Status**: Ready for Implementation

---

## Overview

Add meaningful micro-interactions using Framer Motion to improve perceived performance and provide visual feedback. Focus on performance (60fps) and accessibility (respect prefers-reduced-motion).

**Philosophy**: "Animations should have purpose, not just polish."

---

## Animation Principles

### 1. Performance First
- Only animate `transform` and `opacity` (GPU-accelerated)
- Avoid layout triggers (`width`, `height`, `padding`, `margin`)
- Target 60fps on mid-range devices (iPhone 11, Samsung S10)
- Respect performance budget (no more than 5KB additional JS)

### 2. Purposeful Motion
Every animation must serve one of these purposes:
- **Provide feedback** (button pressed, action completed)
- **Show relationships** (modal sliding from parent card)
- **Guide attention** (highlight important state change)
- **Indicate progress** (loading, processing)

### 3. Accessibility Paramount
- Respect `prefers-reduced-motion` media query
- Provide instant fallbacks for reduced motion users
- Ensure animations don't cause vestibular issues
- Never rely solely on animation to convey information

---

## Animation Categories

### Category 1: Page Transitions (2h implementation)

**When**: User navigates between pages
**Duration**: 200-300ms
**Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` (ease-in-out)

#### Fade Transition (Default)
```tsx
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

**Usage**:
```tsx
// src/app/dashboard/layout.tsx
import { PageTransition } from "@/components/animation/PageTransition";

export default function DashboardLayout({ children }) {
  return (
    <PageTransition>
      {children}
    </PageTransition>
  );
}
```

#### Slide Transition (For Modal/Drawer)
```tsx
export function SlideTransition({
  children,
  direction = "right"
}: {
  children: React.ReactNode;
  direction?: "left" | "right" | "up" | "down";
}) {
  const directions = {
    right: { x: "100%" },
    left: { x: "-100%" },
    up: { y: "-100%" },
    down: { y: "100%" }
  };

  return (
    <motion.div
      initial={directions[direction]}
      animate={{ x: 0, y: 0 }}
      exit={directions[direction]}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
    >
      {children}
    </motion.div>
  );
}
```

---

### Category 2: Loading States (1h implementation)

**When**: Content is loading or processing
**Duration**: Indefinite (until content loads)
**Easing**: Linear or pulse

#### Skeleton Pulse (Existing Pattern)
```tsx
// Already exists in component-patterns.tsx
import { CardSkeleton, TableSkeleton, DashboardSkeleton } from "@/components/ui";

// Use existing skeletons - no new animations needed
```

#### Progress Indicator
```tsx
export function ProgressBar({
  progress,
  label
}: {
  progress: number; // 0-100
  label?: string;
}) {
  return (
    <div className="space-y-2">
      {label && <p className="text-sm text-gray-600">{label}</p>}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-cyan-600"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>
      <p className="text-xs text-gray-500 text-right">{Math.round(progress)}%</p>
    </div>
  );
}
```

#### Spinner with Fade-In Delay
```tsx
export function DelayedSpinner({
  delay = 300,
  size = "md"
}: {
  delay?: number;
  size?: "sm" | "md" | "lg";
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Spinner size={size} />
    </motion.div>
  );
}
```

---

### Category 3: Micro-Interactions (1h implementation)

**When**: User interacts with UI elements
**Duration**: 100-200ms
**Easing**: `ease-out` (feels snappy)

#### Button States
```tsx
export function AnimatedButton({
  children,
  onClick,
  variant = "primary"
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
      className={buttonVariants[variant]}
    >
      {children}
    </motion.button>
  );
}
```

#### Card Hover (Subtle Lift)
```tsx
export function HoverCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      whileHover={{
        y: -4,
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)"
      }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-lg border border-gray-200"
    >
      {children}
    </motion.div>
  );
}
```

#### Checkbox/Toggle Animation
```tsx
export function AnimatedCheckbox({
  checked,
  onChange,
  label
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <motion.div
        className="w-5 h-5 border-2 rounded flex items-center justify-center"
        animate={{
          borderColor: checked ? "#0d9488" : "#d1d5db",
          backgroundColor: checked ? "#0d9488" : "#ffffff"
        }}
        transition={{ duration: 0.15 }}
      >
        <AnimatePresence>
          {checked && (
            <motion.svg
              className="w-3 h-3 text-white"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              transition={{ duration: 0.2, type: "spring" }}
              viewBox="0 0 12 12"
            >
              <path
                d="M2 6l3 3 5-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.div>
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  );
}
```

---

### Category 4: State Change Animations (1h implementation)

**When**: UI state changes (success, error, new content)
**Duration**: 300-500ms
**Easing**: Spring physics (natural feel)

#### Success Checkmark
```tsx
export function SuccessAnimation({ onComplete }: { onComplete?: () => void }) {
  return (
    <motion.div
      className="flex items-center justify-center"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      onAnimationComplete={onComplete}
    >
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <motion.svg
          className="w-8 h-8 text-green-600"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewBox="0 0 24 24"
        >
          <motion.path
            d="M5 13l4 4L19 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </div>
    </motion.div>
  );
}
```

#### Error Shake
```tsx
export function ErrorShake({ children }: { children: React.ReactNode }) {
  const controls = useAnimation();

  const triggerShake = async () => {
    await controls.start({
      x: [0, -10, 10, -10, 10, 0],
      transition: { duration: 0.4 }
    });
  };

  useEffect(() => {
    triggerShake();
  }, []);

  return (
    <motion.div animate={controls}>
      {children}
    </motion.div>
  );
}
```

#### New Content Stagger
```tsx
export function StaggerList({
  children
}: {
  children: React.ReactNode[];
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.05 // 50ms between each child
          }
        }
      }}
    >
      {React.Children.map(children, (child, i) => (
        <motion.div
          key={i}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ duration: 0.3 }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
```

**Usage**:
```tsx
<StaggerList>
  <ApprovalCard {...card1} />
  <ApprovalCard {...card2} />
  <ApprovalCard {...card3} />
</StaggerList>
```

---

## Performance Budget

### File Size Impact
- Framer Motion: Already installed (11.12.0)
- New animation components: ~2KB gzipped
- Total impact: Negligible (library already loaded)

### Runtime Performance

**GPU-Accelerated Properties** (Use These):
- `transform: translate3d()`
- `transform: scale()`
- `transform: rotate()`
- `opacity`

**Layout-Triggering Properties** (Avoid):
- `width`, `height`
- `padding`, `margin`
- `top`, `left`, `bottom`, `right` (use `transform` instead)
- `border-width`

**Performance Testing**:
```bash
# Chrome DevTools Performance tab
# Record interaction (e.g., page transition)
# Check for:
# - Frame rate (should be 60fps)
# - Layout shifts (should be 0)
# - Long tasks (should be <50ms)
```

---

## Accessibility: Reduced Motion

### Implementation

**Global CSS** (add to `globals.css`):
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**React Hook** (for component-level control):
```tsx
// src/hooks/useReducedMotion.ts
import { useEffect, useState } from "react";

export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  return reducedMotion;
}
```

**Usage in Components**:
```tsx
export function SmartButton({ children }: { children: React.ReactNode }) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.button
      whileHover={reducedMotion ? {} : { scale: 1.02 }}
      whileTap={reducedMotion ? {} : { scale: 0.98 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.1 }}
    >
      {children}
    </motion.button>
  );
}
```

---

## Animation Guidelines by Page Type

### Dashboard Pages
**Animations to Use**:
- Fade page transitions (200ms)
- Skeleton loaders for data fetching
- Stagger list for approval cards (50ms delay)
- Hover lift on stat cards (4px)

**Animations to Avoid**:
- Parallax scrolling (distracting)
- Auto-playing animations (annoying)
- Complex 3D transforms (performance cost)

### Modal/Drawer Overlays
**Animations to Use**:
- Slide transition from triggering element
- Backdrop fade-in (200ms)
- Scale animation for small modals (spring physics)

**Animations to Avoid**:
- Bounce effects (feels dated)
- Rotation (causes motion sickness)

### Forms & Inputs
**Animations to Use**:
- Error shake (400ms, 5 iterations)
- Success checkmark (500ms spring)
- Focus ring pulse (100ms)

**Animations to Avoid**:
- Label slide (causes layout shift)
- Placeholder fade (accessibility issue)

### Loading States
**Animations to Use**:
- Delayed spinner (300ms delay)
- Progress bar with smooth easing
- Skeleton pulse (existing pattern)

**Animations to Avoid**:
- Infinite spinners (provide progress feedback)
- Fast pulsing (seizure risk)

---

## Implementation Checklist

### Step 1: Install Dependencies (Already Done)
```bash
# Framer Motion already installed in package.json
npm install framer-motion@11.12.0
```

### Step 2: Create Animation Components (3h)
- [ ] `PageTransition.tsx` (fade + slide variants)
- [ ] `LoadingStates.tsx` (progress bar, delayed spinner)
- [ ] `MicroInteractions.tsx` (button, card, checkbox)
- [ ] `StateChangeAnimations.tsx` (success, error, stagger)

### Step 3: Create Utilities (1h)
- [ ] `useReducedMotion.ts` hook
- [ ] Animation preset constants (durations, easings)
- [ ] Global CSS for reduced motion

### Step 4: Integration (1h)
- [ ] Add `PageTransition` to dashboard layout
- [ ] Replace button components with animated versions
- [ ] Add stagger to approval queue
- [ ] Test on mobile devices

---

## Testing Strategy

### Performance Testing
```typescript
// performance.test.ts
describe("Animation Performance", () => {
  it("page transition runs at 60fps", async () => {
    const { result } = renderHook(() => usePageTransition());

    // Start performance measurement
    const perfObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const longTasks = entries.filter((e) => e.duration > 16.67); // 60fps = 16.67ms per frame

      expect(longTasks.length).toBe(0);
    });

    perfObserver.observe({ entryTypes: ["longtask"] });

    // Trigger page transition
    await act(async () => {
      result.current.navigateToPage("/dashboard");
    });
  });
});
```

### Accessibility Testing
```typescript
// a11y.test.ts
describe("Reduced Motion Compliance", () => {
  it("respects prefers-reduced-motion", () => {
    // Mock reduced motion preference
    Object.defineProperty(window, "matchMedia", {
      value: jest.fn(() => ({
        matches: true, // Reduced motion enabled
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      }))
    });

    const { container } = render(<AnimatedButton>Click</AnimatedButton>);

    // Check that animations are disabled
    expect(container.querySelector("motion.button")).toHaveAttribute(
      "transition",
      expect.objectContaining({ duration: 0 })
    );
  });
});
```

### Visual Regression Testing
```bash
# Percy.io or Chromatic for screenshot comparison
npm run test:visual

# Should capture:
# - Page transition midpoint
# - Loading states
# - Success/error animations
# - Hover states
```

---

## Animation Constants

**File**: `src/lib/animation/constants.ts`

```typescript
export const DURATIONS = {
  instant: 0,
  fast: 100,
  normal: 200,
  slow: 300,
  slower: 500
} as const;

export const EASINGS = {
  linear: [0, 0, 1, 1],
  easeIn: [0.4, 0, 1, 1],
  easeOut: [0, 0, 0.2, 1],
  easeInOut: [0.4, 0, 0.2, 1]
} as const;

export const SPRING = {
  gentle: { stiffness: 200, damping: 25 },
  snappy: { stiffness: 300, damping: 20 },
  bouncy: { stiffness: 400, damping: 15 }
} as const;

export const TRANSITIONS = {
  page: {
    duration: DURATIONS.normal,
    ease: EASINGS.easeInOut
  },
  modal: {
    type: "spring",
    ...SPRING.gentle
  },
  button: {
    duration: DURATIONS.fast,
    ease: EASINGS.easeOut
  },
  stagger: {
    delayChildren: 0.05,
    staggerChildren: 0.05
  }
} as const;
```

**Usage**:
```tsx
import { DURATIONS, EASINGS, TRANSITIONS } from "@/lib/animation/constants";

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={TRANSITIONS.page}
>
  Content
</motion.div>
```

---

## Common Pitfalls to Avoid

### 1. Over-Animation
**Problem**: Animating everything reduces impact
**Solution**: Use animation sparingly, only where it adds value

### 2. Layout Shifts
**Problem**: Animating `height` causes reflow
**Solution**: Use `transform: scaleY()` instead

### 3. Accessibility Violations
**Problem**: Motion causes vestibular issues
**Solution**: Always respect `prefers-reduced-motion`

### 4. Performance Degradation
**Problem**: Too many simultaneous animations
**Solution**: Limit concurrent animations to 5-10 max

### 5. Missing Fallbacks
**Problem**: Animation-only feedback (no text/icon)
**Solution**: Always provide non-animated alternative

---

## Examples by Use Case

### Use Case 1: Dashboard Stats Update
```tsx
export function AnimatedStatCard({ value, label }: { value: number; label: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayValue(value);
    }, 100);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <Card>
      <CardContent>
        <p className="text-sm text-gray-600">{label}</p>
        <motion.p
          className="text-3xl font-bold text-gray-900"
          key={displayValue}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, type: "spring" }}
        >
          {displayValue}
        </motion.p>
      </CardContent>
    </Card>
  );
}
```

### Use Case 2: Form Submission
```tsx
export function FormWithAnimation() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async () => {
    setStatus("loading");

    try {
      await submitForm();
      setStatus("success");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (error) {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}

      <AnimatePresence mode="wait">
        {status === "idle" && (
          <motion.button
            key="submit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            type="submit"
          >
            Submit
          </motion.button>
        )}

        {status === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <DelayedSpinner delay={0} />
          </motion.div>
        )}

        {status === "success" && (
          <motion.div
            key="success"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <SuccessAnimation />
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            key="error"
            initial={{ x: 0 }}
            animate={{ x: [-10, 10, -10, 10, 0] }}
            exit={{ opacity: 0 }}
          >
            <ErrorMessage message="Submission failed" />
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
```

---

## Success Criteria

### Functional Requirements
- [ ] All animations run at 60fps on target devices
- [ ] `prefers-reduced-motion` respected globally
- [ ] No layout shifts (CLS = 0) during animations
- [ ] Animations complete within expected durations

### Quality Requirements
- [ ] Bundle size impact <5KB
- [ ] Lighthouse Performance score maintained (90+)
- [ ] Accessibility audit passes (WCAG 2.1 AA)
- [ ] Visual regression tests pass

### User Experience Requirements
- [ ] Animations feel purposeful, not decorative
- [ ] Loading states provide clear feedback
- [ ] State changes are visually communicated
- [ ] Page transitions don't feel jarring

---

## Rollback Plan

### If Performance Issues
1. **Immediate**: Disable animations globally (CSS override)
2. **Partial**: Remove page transitions, keep micro-interactions
3. **Feature Flag**: Add `ENABLE_ANIMATIONS` env var

### Monitoring
- Track Lighthouse Performance scores before/after
- Monitor FPS in production (Chrome User Experience Report)
- Check for increased error rates (motion sickness reports)

---

## References

- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Web Animation Performance](https://web.dev/animations/)
- [Reduced Motion Media Query](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [Spring Physics Explained](https://www.joshwcomeau.com/animation/a-friendly-introduction-to-spring-physics/)

---

**Document Version**: 1.0
**Last Updated**: 2025-12-02
**Status**: Ready for Implementation
**Estimated Hours**: 5 hours (Claire)
