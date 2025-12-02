# Mobile Bottom Navigation Design Specification
**Phase**: 3 (Transformation), Weeks 5-6
**Implementation Lead**: Claire (Frontend)
**Design Lead**: Phill
**Timeline**: 10 hours implementation
**Status**: Ready for Implementation

---

## Overview

Replace desktop-centric sidebar with iOS/Android-style bottom tab bar optimized for thumb-zone navigation. Critical for tradie users who work on mobile at job sites (60% of usage).

---

## Problem Statement

### Current Navigation Issues
1. **Desktop sidebar** - Not mobile-friendly
2. **Hamburger menu** - Requires two taps to navigate
3. **No thumb-zone optimization** - Hard to reach top of screen
4. **Context switching cost** - Menu overlay blocks content
5. **No haptic feedback** - Feels disconnected

### User Context
- **Primary Users**: Trade business owners (30-55 years old)
- **Mobile Usage**: 60% of total usage
- **Device Context**: Often wearing gloves, outdoors, one-handed use
- **Use Cases**: Quick lead checks, approvals between jobs, message responses

---

## Design Goals

### 1. Thumb-Zone Optimization
- Bottom 40% of screen = primary navigation
- 44px minimum touch targets (iOS HIG)
- 8px minimum spacing between targets
- One-handed operation friendly

### 2. Context-Aware Active States
- Current page clearly indicated
- Badge counts for notifications
- Visual feedback on tap (ripple effect)
- Smooth transitions between tabs

### 3. iOS/Android Native Feel
- Platform-specific patterns (iOS: filled icons, Android: Material ripple)
- System-level haptic feedback on tap
- Native-feeling animations (spring physics)
- Respect system preferences (reduced motion)

### 4. Progressive Enhancement
- Desktop: Keep sidebar (not affected)
- Tablet: Bottom nav (768px-1024px)
- Mobile: Bottom nav (<768px)

---

## Visual Design

### Layout Structure

```
┌──────────────────────────────────────┐
│                                      │
│   Content Area (full screen)        │
│                                      │
│                                      │
│   [Scrollable content with          │
│    padding-bottom: 80px to           │
│    prevent overlap]                  │
│                                      │
├──────────────────────────────────────┤
│ [Home] [Leads] [Content] [Messages] │ ← 64px height
│   🏠     👤      ✨       💬        │
│ Active  Rest    Rest     Badge(3)   │
└──────────────────────────────────────┘
     ↑
  Thumb zone (bottom 40% of screen)
```

### Dimensions
- **Height**: 64px (includes safe area inset on iOS)
- **Touch Target**: 56x56px (exceeds 44px minimum)
- **Icon Size**: 24x24px
- **Gap Between Icons**: 8px minimum
- **Badge Size**: 20x20px (red dot with count)

### Thumb Zone Analysis

```
┌────────────────────┐
│                    │  ← 60% = Hard to reach (one-handed)
│   Hard to Reach    │
│                    │
├────────────────────┤
│                    │  ← 40% = Easy to reach (thumb zone)
│   Thumb Zone       │
│   (Navigation)     │
└────────────────────┘
```

---

## Navigation Items

### Primary Tabs (4 items)

1. **Home** (Dashboard)
   - Icon: Home
   - Route: `/dashboard/overview`
   - Badge: None

2. **Leads** (Contacts)
   - Icon: Users
   - Route: `/dashboard/contacts`
   - Badge: Hot leads count (>80 score)

3. **Content** (Approvals)
   - Icon: Sparkles
   - Route: `/dashboard/approvals`
   - Badge: Pending count

4. **Messages** (Inbox)
   - Icon: MessageSquare
   - Route: `/dashboard/messages`
   - Badge: Unread count

### Why These 4?
- **80/20 rule**: Cover 80% of mobile use cases
- **Cognitive load**: 4 items = optimal for quick scanning
- **Thumb reach**: All items reachable with one hand
- **Discoverability**: Core features always visible

### Secondary Features (Not in Bottom Nav)
- Settings: Hamburger menu (top right)
- Profile: Header avatar
- Analytics: Via Home tab
- Campaigns: Via Content tab

---

## Component Specifications

### 1. MobileBottomNav Component

**File**: `src/components/navigation/MobileBottomNav.tsx`

```tsx
import { Home, Users, Sparkles, MessageSquare } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  badge?: number;
}

interface MobileBottomNavProps {
  hotLeadsCount?: number;
  pendingContentCount?: number;
  unreadMessagesCount?: number;
}

export function MobileBottomNav({
  hotLeadsCount = 0,
  pendingContentCount = 0,
  unreadMessagesCount = 0
}: MobileBottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems: NavItem[] = useMemo(
    () => [
      {
        id: "home",
        label: "Home",
        icon: Home,
        route: "/dashboard/overview"
      },
      {
        id: "leads",
        label: "Leads",
        icon: Users,
        route: "/dashboard/contacts",
        badge: hotLeadsCount
      },
      {
        id: "content",
        label: "Content",
        icon: Sparkles,
        route: "/dashboard/approvals",
        badge: pendingContentCount
      },
      {
        id: "messages",
        label: "Messages",
        icon: MessageSquare,
        route: "/dashboard/messages",
        badge: unreadMessagesCount
      }
    ],
    [hotLeadsCount, pendingContentCount, unreadMessagesCount]
  );

  const handleNavigation = (route: string) => {
    // Haptic feedback (if supported)
    if ("vibrate" in navigator) {
      navigator.vibrate(10); // 10ms haptic tap
    }

    // Navigate
    router.push(route);
  };

  const isActive = (route: string) => {
    return pathname.startsWith(route);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.route);

          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.route)}
              className="relative flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-all active:scale-95"
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              {/* Icon */}
              <div
                className={`
                  w-6 h-6 flex items-center justify-center transition-colors
                  ${active ? "text-cyan-600" : "text-gray-600"}
                `}
              >
                <Icon className="w-6 h-6" strokeWidth={active ? 2.5 : 2} />
              </div>

              {/* Label */}
              <span
                className={`
                  text-xs mt-1 font-medium transition-colors
                  ${active ? "text-cyan-600" : "text-gray-600"}
                `}
              >
                {item.label}
              </span>

              {/* Badge */}
              {item.badge && item.badge > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}

              {/* Active Indicator */}
              {active && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-cyan-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
```

### 2. SafeAreaProvider Component

**File**: `src/components/navigation/SafeAreaProvider.tsx`

```tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

const SafeAreaContext = createContext<SafeAreaInsets>({
  top: 0,
  bottom: 0,
  left: 0,
  right: 0
});

export function SafeAreaProvider({ children }: { children: React.ReactNode }) {
  const [insets, setInsets] = useState<SafeAreaInsets>({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  });

  useEffect(() => {
    // Get safe area insets from CSS environment variables
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);

    const getInset = (side: string) => {
      const value = computedStyle.getPropertyValue(`--safe-area-inset-${side}`);
      return parseInt(value || "0", 10);
    };

    setInsets({
      top: getInset("top"),
      bottom: getInset("bottom"),
      left: getInset("left"),
      right: getInset("right")
    });
  }, []);

  return (
    <SafeAreaContext.Provider value={insets}>
      {children}
    </SafeAreaContext.Provider>
  );
}

export function useSafeArea() {
  return useContext(SafeAreaContext);
}
```

### 3. MobileContentWrapper Component

**File**: `src/components/navigation/MobileContentWrapper.tsx`

```tsx
"use client";

import { useSafeArea } from "./SafeAreaProvider";

interface MobileContentWrapperProps {
  children: React.ReactNode;
}

export function MobileContentWrapper({ children }: MobileContentWrapperProps) {
  const { bottom } = useSafeArea();

  // Add padding to prevent content from being hidden behind bottom nav
  // 64px (nav height) + safe area inset
  const paddingBottom = 64 + bottom;

  return (
    <div
      className="lg:pb-0"
      style={{ paddingBottom: `${paddingBottom}px` }}
    >
      {children}
    </div>
  );
}
```

---

## Platform-Specific Patterns

### iOS Pattern

**Visual Style**:
- Filled icons for active state
- Outline icons for inactive state
- Spring animation (0.3s, ease-out)
- Blur background (backdrop-filter)

**Haptics**:
- Light tap feedback (10ms vibration)
- Triggered on button press (not release)

**Safe Area**:
- Respect `env(safe-area-inset-bottom)` for home indicator
- Minimum 34px bottom padding on iPhone X+

### Android Pattern

**Visual Style**:
- Material ripple effect on tap
- Elevation shadow (4dp) on bottom nav
- Linear animation (0.2s, ease-in-out)

**Haptics**:
- Medium tap feedback (20ms vibration)
- Triggered on button press

**Navigation Bar**:
- Respect system navigation bar height
- Use `WindowInsets` for padding

---

## Responsive Breakpoints

### Mobile (<768px)
```css
@media (max-width: 767px) {
  /* Show bottom nav */
  .mobile-bottom-nav {
    display: flex;
  }

  /* Hide desktop sidebar */
  .desktop-sidebar {
    display: none;
  }

  /* Add bottom padding to content */
  .page-content {
    padding-bottom: 80px; /* 64px nav + 16px buffer */
  }
}
```

### Tablet (768px-1024px)
```css
@media (min-width: 768px) and (max-width: 1023px) {
  /* Show bottom nav on portrait tablets */
  .mobile-bottom-nav {
    display: flex;
  }

  /* Optionally show condensed sidebar on landscape */
  @media (orientation: landscape) {
    .desktop-sidebar {
      display: flex;
      width: 60px; /* Icon-only */
    }

    .mobile-bottom-nav {
      display: none;
    }
  }
}
```

### Desktop (1024px+)
```css
@media (min-width: 1024px) {
  /* Hide bottom nav */
  .mobile-bottom-nav {
    display: none;
  }

  /* Show full sidebar */
  .desktop-sidebar {
    display: flex;
    width: 240px;
  }
}
```

---

## Badge Logic

### Badge Counts Calculation

**Hot Leads Badge**:
```typescript
const hotLeadsCount = await supabase
  .from("contacts")
  .select("id", { count: "exact" })
  .eq("workspace_id", workspaceId)
  .gte("ai_score", 80)
  .single();

// Show badge if > 0, max 9+
```

**Pending Content Badge**:
```typescript
const pendingCount = await supabase
  .from("generatedContent")
  .select("id", { count: "exact" })
  .eq("workspace_id", workspaceId)
  .eq("status", "pending")
  .single();
```

**Unread Messages Badge**:
```typescript
const unreadCount = await supabase
  .from("messages")
  .select("id", { count: "exact" })
  .eq("workspace_id", workspaceId)
  .eq("read", false)
  .single();
```

### Badge Update Strategy
- **Real-time**: WebSocket updates for messages
- **Polling**: Every 60s for leads and content
- **On focus**: Refresh when app returns to foreground

---

## Accessibility

### WCAG 2.1 AA Compliance

1. **Touch Target Size**
   - Minimum 44x44px (iOS HIG)
   - Minimum 48x48dp (Material Design)
   - We use 56x56px (exceeds both)

2. **Color Contrast**
   - Active state: Cyan 600 on white = 4.5:1 (AA)
   - Inactive state: Gray 600 on white = 4.5:1 (AA)
   - Badge: White on red 500 = 5.1:1 (AA)

3. **Screen Reader Support**
   - `aria-label` on each button
   - `aria-current="page"` on active tab
   - Badge counts announced ("3 unread messages")

4. **Keyboard Navigation**
   - Tab order: Left to right
   - Enter/Space to activate
   - Arrow keys for quick switching (optional)

### Testing Commands
```bash
# Lighthouse accessibility audit
npm run test:a11y

# Axe-core automated testing
npm run test:axe

# Manual screen reader testing
# NVDA (Windows): NVDA + Down Arrow to read nav
# VoiceOver (iOS): Swipe right to navigate
```

---

## Haptic Feedback Implementation

### Web Vibration API

```typescript
function triggerHaptic(pattern: "light" | "medium" | "heavy") {
  if (!("vibrate" in navigator)) {
    return; // Fallback: no haptics
  }

  const patterns = {
    light: 10,   // 10ms
    medium: 20,  // 20ms
    heavy: 50    // 50ms
  };

  navigator.vibrate(patterns[pattern]);
}

// Usage in component
const handleNavigation = (route: string) => {
  triggerHaptic("light");
  router.push(route);
};
```

### iOS Haptic Engine (Progressive Enhancement)

```typescript
// Detect iOS device
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);

if (isIOS && "vibrate" in navigator) {
  // iOS supports impact feedback
  navigator.vibrate([10, 50, 10]); // Double tap pattern
}
```

---

## Animation Strategy

### Framer Motion Transitions

```tsx
import { motion, AnimatePresence } from "framer-motion";

function AnimatedNavItem({ children, isActive }: { children: React.ReactNode; isActive: boolean }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      animate={{
        color: isActive ? "#0891b2" : "#4b5563",
        scale: isActive ? 1.05 : 1
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20
      }}
    >
      {children}

      {/* Active indicator */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="absolute bottom-0 left-1/2 w-8 h-1 bg-cyan-600 rounded-full"
            initial={{ scale: 0, x: "-50%" }}
            animate={{ scale: 1, x: "-50%" }}
            exit={{ scale: 0, x: "-50%" }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
}
```

### Performance Considerations
- Use `transform` and `opacity` only (GPU-accelerated)
- Avoid layout shifts (`width`, `height`, `padding`)
- Respect `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Implementation Plan

### Phase 1: Core Component (3h)
1. Create `MobileBottomNav.tsx` with static items (1h)
2. Add active state detection (usePathname) (1h)
3. Implement touch target sizing and styling (1h)

### Phase 2: Badge Logic (2h)
1. Create badge count API endpoints (1h)
2. Wire up badge counts in component (0.5h)
3. Add real-time updates (WebSocket for messages) (0.5h)

### Phase 3: Haptics & Animations (2h)
1. Implement Web Vibration API (0.5h)
2. Add Framer Motion transitions (1h)
3. Add prefers-reduced-motion support (0.5h)

### Phase 4: Safe Area & Responsive (2h)
1. Create SafeAreaProvider for iOS notch (0.5h)
2. Implement responsive breakpoints (1h)
3. Test on multiple devices (0.5h)

### Phase 5: Testing & Polish (1h)
1. Accessibility audit (0.5h)
2. Cross-browser testing (0.25h)
3. Performance validation (0.25h)

---

## Testing Strategy

### Device Matrix

**Real Devices** (minimum):
- iPhone 14 Pro (iOS 17) - 6.1"
- Samsung Galaxy S23 (Android 13) - 6.1"
- iPad Air (portrait) - 10.9"

**BrowserStack** (fallback):
- iPhone SE (iOS 16) - 4.7" (smallest)
- Google Pixel 7 (Android 13)
- OnePlus 9 (Android 12)

### Test Cases

1. **Touch Target Accuracy**
   - [ ] All buttons tappable with thumb
   - [ ] No accidental adjacent taps
   - [ ] Works with gloves (if possible)

2. **Safe Area Handling**
   - [ ] No overlap with iOS home indicator
   - [ ] Correct padding on notched devices
   - [ ] Landscape orientation works

3. **Badge Counts**
   - [ ] Counts update in real-time
   - [ ] Max "9+" displays correctly
   - [ ] Zero badge hides completely

4. **Haptic Feedback**
   - [ ] Vibration triggers on tap
   - [ ] Works on iOS and Android
   - [ ] Graceful fallback if unsupported

5. **Performance**
   - [ ] Navigation feels instant (<100ms)
   - [ ] Animations run at 60fps
   - [ ] No jank on scroll

---

## Integration with Existing Layout

### Dashboard Layout Update

**File**: `src/app/dashboard/layout.tsx`

```tsx
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { MobileContentWrapper } from "@/components/navigation/MobileContentWrapper";
import { SafeAreaProvider } from "@/components/navigation/SafeAreaProvider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Desktop sidebar (hidden on mobile) */}
        <aside className="hidden lg:block fixed left-0 top-0 h-screen w-60 bg-white border-r">
          {/* Existing sidebar content */}
        </aside>

        {/* Main content */}
        <main className="lg:ml-60">
          <MobileContentWrapper>
            {children}
          </MobileContentWrapper>
        </main>

        {/* Mobile bottom nav (hidden on desktop) */}
        <MobileBottomNav
          hotLeadsCount={hotLeadsCount}
          pendingContentCount={pendingContentCount}
          unreadMessagesCount={unreadMessagesCount}
        />
      </div>
    </SafeAreaProvider>
  );
}
```

---

## Performance Budget

### Bundle Size Impact
- MobileBottomNav: ~3KB gzipped
- SafeAreaProvider: ~1KB gzipped
- Framer Motion: Already installed
- Total new code: ~4KB

### Lighthouse Targets
- Performance: 90+ (maintain)
- Accessibility: 95+ (improve)
- Best Practices: 95+ (maintain)

---

## Rollback Plan

### If Issues Arise
1. **Immediate**: Hide bottom nav with CSS (`display: none`)
2. **Partial**: Show hamburger menu fallback
3. **Feature Flag**: Add `ENABLE_MOBILE_BOTTOM_NAV` env var

---

## Success Criteria

### Functional Requirements
- [ ] Bottom nav visible on mobile (<768px)
- [ ] Active state highlights correct tab
- [ ] Badge counts display accurately
- [ ] Navigation works on tap
- [ ] Safe area insets respected on iOS

### Quality Requirements
- [ ] Touch targets ≥44px (iOS) / ≥48dp (Android)
- [ ] Haptic feedback works on supported devices
- [ ] Animations run at 60fps
- [ ] Accessibility audit passes (WCAG 2.1 AA)

### User Experience Requirements
- [ ] Navigation feels instant (<100ms)
- [ ] One-handed thumb operation works
- [ ] Badge counts update in real-time
- [ ] Works with gloves (tradie context)

---

## References

### Design Systems
- [iOS Human Interface Guidelines - Tab Bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- [Material Design - Bottom Navigation](https://m3.material.io/components/navigation-bar/overview)
- [Thumb Zone Mapping](https://www.smashingmagazine.com/2016/09/the-thumb-zone-designing-for-mobile-users/)

### Code Examples
- [Framer Motion Examples](https://www.framer.com/motion/examples/)
- [Web Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API)
- [CSS Safe Area Insets](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)

---

**Document Version**: 1.0
**Last Updated**: 2025-12-02
**Status**: Ready for Implementation
**Estimated Hours**: 10 hours (Claire)
