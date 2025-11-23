/**
 * A/B Testing Configuration & Framework
 * Phase 52: Experiment management with truth-layer compliance
 */

export interface ABTestVariant {
  id: string;
  name: string;
  weight: number; // Percentage allocation (0-100)
  content: Record<string, unknown>;
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  variants: ABTestVariant[];
  startDate?: string;
  endDate?: string;
  targetPages: string[];
  metrics: string[];
}

// Active experiments configuration
export const experiments: ABTest[] = [
  {
    id: 'hero_messaging_v1',
    name: 'Hero Section Messaging Test',
    description: 'Testing momentum-focused vs simplicity-focused hero copy',
    enabled: true,
    variants: [
      {
        id: 'hero_focus_momentum',
        name: 'Momentum Focus',
        weight: 50,
        content: {
          headline: 'Get 90 Days of Real Marketing Momentum — Not Hype',
          subheadline: 'Start with a 14-day guided trial. Stay for a 90-day activation program that guarantees real insights, real action, and real measurable progress.',
          ctaText: 'Start 14-Day Guided Trial',
        },
      },
      {
        id: 'hero_focus_simplicity',
        name: 'Simplicity Focus',
        weight: 50,
        content: {
          headline: 'AI Marketing That Actually Works',
          subheadline: 'No hype. No vanity metrics. Just a clear 90-day program to build real marketing momentum for your agency.',
          ctaText: 'Start Your 14-Day Trial',
        },
      },
    ],
    startDate: '2025-01-01',
    targetPages: ['/landing', '/'],
    metrics: ['landing_cta_click', 'trial_started', 'landing_scroll_75'],
  },
  {
    id: 'pricing_cta_v1',
    name: 'Pricing CTA Button Test',
    description: 'Testing different CTA button text on pricing page',
    enabled: false, // Ready but not active yet
    variants: [
      {
        id: 'pricing_trial_start',
        name: 'Start Trial',
        weight: 50,
        content: {
          ctaText: 'Start 14-Day Trial',
        },
      },
      {
        id: 'pricing_get_started',
        name: 'Get Started',
        weight: 50,
        content: {
          ctaText: 'Get Started Free',
        },
      },
    ],
    targetPages: ['/pricing'],
    metrics: ['pricing_cta_click', 'trial_started'],
  },
];

// Get assigned variant for a user session
export function getAssignedVariant(testId: string): ABTestVariant | null {
  if (typeof window === 'undefined') return null;

  const test = experiments.find(e => e.id === testId && e.enabled);
  if (!test) return null;

  // Check if already assigned
  const stored = sessionStorage.getItem(`ab_${testId}`);
  if (stored) {
    return test.variants.find(v => v.id === stored) || null;
  }

  // Assign based on weights
  const random = Math.random() * 100;
  let cumulative = 0;

  for (const variant of test.variants) {
    cumulative += variant.weight;
    if (random <= cumulative) {
      sessionStorage.setItem(`ab_${testId}`, variant.id);
      sessionStorage.setItem('ab_test_variant', variant.id);
      return variant;
    }
  }

  return test.variants[0];
}

// Get variant content for a specific key
export function getVariantContent<T>(testId: string, key: string, defaultValue: T): T {
  const variant = getAssignedVariant(testId);
  if (!variant) return defaultValue;

  return (variant.content[key] as T) ?? defaultValue;
}

// Check if a test is active for current page
export function isTestActiveForPage(testId: string, pathname: string): boolean {
  const test = experiments.find(e => e.id === testId);
  if (!test || !test.enabled) return false;

  return test.targetPages.some(page => pathname.includes(page));
}

// Get all active experiments for a page
export function getActiveExperimentsForPage(pathname: string): ABTest[] {
  return experiments.filter(test =>
    test.enabled &&
    test.targetPages.some(page => pathname.includes(page))
  );
}

// Analytics helper to track experiment exposure
export function trackExperimentExposure(testId: string, variantId: string): void {
  if (typeof window === 'undefined') return;

  fetch('/api/analytics/experiments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      testId,
      variantId,
      timestamp: Date.now(),
      sessionId: sessionStorage.getItem('unite_session_id'),
    }),
  }).catch(console.error);
}

// Hook to use A/B testing in components
export function useABTest(testId: string): {
  variant: ABTestVariant | null;
  getContent: <T>(key: string, defaultValue: T) => T;
} {
  const variant = getAssignedVariant(testId);

  return {
    variant,
    getContent: <T>(key: string, defaultValue: T) =>
      variant ? (variant.content[key] as T) ?? defaultValue : defaultValue,
  };
}

export default {
  experiments,
  getAssignedVariant,
  getVariantContent,
  isTestActiveForPage,
  getActiveExperimentsForPage,
  trackExperimentExposure,
  useABTest,
};
