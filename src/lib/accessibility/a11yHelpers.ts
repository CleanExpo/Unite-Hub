/**
 * Accessibility Helpers
 * Phase 10: UX-05 Performance & Accessibility
 *
 * Utilities for ensuring WCAG 2.1 AA compliance
 */

/**
 * ARIA live region announcer for dynamic content
 */
export function announceToScreenReader(
  message: string,
  priority: "polite" | "assertive" = "polite"
): void {
  if (typeof document === "undefined") return;

  // Find or create announcer element
  let announcer = document.getElementById("a11y-announcer");

  if (!announcer) {
    announcer = document.createElement("div");
    announcer.id = "a11y-announcer";
    announcer.setAttribute("aria-live", priority);
    announcer.setAttribute("aria-atomic", "true");
    announcer.className = "sr-only";
    // sr-only styles: position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
    announcer.style.cssText =
      "position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;";
    document.body.appendChild(announcer);
  }

  // Update priority if needed
  announcer.setAttribute("aria-live", priority);

  // Clear and set message (forces re-announcement)
  announcer.textContent = "";
  requestAnimationFrame(() => {
    announcer!.textContent = message;
  });
}

/**
 * Check color contrast ratio (WCAG 2.1 AA requires 4.5:1 for normal text, 3:1 for large text)
 */
export function getContrastRatio(
  foreground: string,
  background: string
): number {
  const getLuminance = (color: string): number => {
    // Convert hex to RGB
    let r: number, g: number, b: number;

    if (color.startsWith("#")) {
      const hex = color.slice(1);
      r = parseInt(hex.slice(0, 2), 16) / 255;
      g = parseInt(hex.slice(2, 4), 16) / 255;
      b = parseInt(hex.slice(4, 6), 16) / 255;
    } else if (color.startsWith("rgb")) {
      const match = color.match(/\d+/g);
      if (!match) return 0;
      [r, g, b] = match.map((v) => parseInt(v) / 255);
    } else {
      return 0;
    }

    // Apply sRGB gamma correction
    const [rs, gs, bs] = [r, g, b].map((c) =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    );

    // Calculate relative luminance
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG 2.1 AA requirements
 */
export function meetsContrastRequirements(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const requiredRatio = isLargeText ? 3 : 4.5;
  return ratio >= requiredRatio;
}

/**
 * Focus trap for modal dialogs
 */
export function createFocusTrap(container: HTMLElement): {
  activate: () => void;
  deactivate: () => void;
} {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(", ");

  let previouslyFocused: HTMLElement | null = null;

  const getFocusableElements = (): HTMLElement[] => {
    return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));
  };

  const handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key !== "Tab") return;

    const focusable = getFocusableElements();
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return {
    activate: () => {
      previouslyFocused = document.activeElement as HTMLElement;
      container.addEventListener("keydown", handleKeyDown);

      // Focus first focusable element
      const focusable = getFocusableElements();
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    },
    deactivate: () => {
      container.removeEventListener("keydown", handleKeyDown);

      // Restore focus to previously focused element
      if (previouslyFocused && previouslyFocused.focus) {
        previouslyFocused.focus();
      }
    },
  };
}

/**
 * Skip link helper for keyboard navigation
 */
export function setupSkipLink(
  skipLinkId: string = "skip-link",
  mainContentId: string = "main-content"
): void {
  if (typeof document === "undefined") return;

  const skipLink = document.getElementById(skipLinkId);
  const mainContent = document.getElementById(mainContentId);

  if (!skipLink || !mainContent) return;

  skipLink.addEventListener("click", (e) => {
    e.preventDefault();
    mainContent.setAttribute("tabindex", "-1");
    mainContent.focus();
    mainContent.removeAttribute("tabindex");
  });
}

/**
 * Reduced motion preference detection
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Hook-style listener for reduced motion changes
 */
export function onReducedMotionChange(
  callback: (prefersReduced: boolean) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const handler = (e: MediaQueryListEvent) => callback(e.matches);
  mediaQuery.addEventListener("change", handler);

  // Call immediately with current value
  callback(mediaQuery.matches);

  return () => mediaQuery.removeEventListener("change", handler);
}

/**
 * Generate unique ID for aria-labelledby/aria-describedby
 */
let idCounter = 0;
export function generateA11yId(prefix: string = "a11y"): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

/**
 * Keyboard navigation helper for custom components
 */
export function handleArrowKeyNavigation(
  e: KeyboardEvent,
  items: HTMLElement[],
  currentIndex: number,
  options: {
    horizontal?: boolean;
    vertical?: boolean;
    loop?: boolean;
  } = {}
): number {
  const { horizontal = true, vertical = true, loop = true } = options;

  let newIndex = currentIndex;

  switch (e.key) {
    case "ArrowUp":
      if (vertical) {
        e.preventDefault();
        newIndex = currentIndex - 1;
      }
      break;
    case "ArrowDown":
      if (vertical) {
        e.preventDefault();
        newIndex = currentIndex + 1;
      }
      break;
    case "ArrowLeft":
      if (horizontal) {
        e.preventDefault();
        newIndex = currentIndex - 1;
      }
      break;
    case "ArrowRight":
      if (horizontal) {
        e.preventDefault();
        newIndex = currentIndex + 1;
      }
      break;
    case "Home":
      e.preventDefault();
      newIndex = 0;
      break;
    case "End":
      e.preventDefault();
      newIndex = items.length - 1;
      break;
    default:
      return currentIndex;
  }

  // Handle looping or bounds
  if (loop) {
    if (newIndex < 0) newIndex = items.length - 1;
    if (newIndex >= items.length) newIndex = 0;
  } else {
    newIndex = Math.max(0, Math.min(newIndex, items.length - 1));
  }

  // Focus the new item
  if (items[newIndex]) {
    items[newIndex].focus();
  }

  return newIndex;
}

/**
 * Accessible loading indicator handler
 */
export function handleLoadingState(
  isLoading: boolean,
  elementId: string,
  loadingMessage: string = "Loading..."
): void {
  if (typeof document === "undefined") return;

  const element = document.getElementById(elementId);
  if (!element) return;

  if (isLoading) {
    element.setAttribute("aria-busy", "true");
    announceToScreenReader(loadingMessage);
  } else {
    element.removeAttribute("aria-busy");
    announceToScreenReader("Content loaded");
  }
}

export default {
  announceToScreenReader,
  getContrastRatio,
  meetsContrastRequirements,
  createFocusTrap,
  setupSkipLink,
  prefersReducedMotion,
  onReducedMotionChange,
  generateA11yId,
  handleArrowKeyNavigation,
  handleLoadingState,
};
