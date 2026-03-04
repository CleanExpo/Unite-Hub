/**
 * Analytics Event Helpers — client-side
 * Fires events to Plausible, GA4, and Microsoft Clarity simultaneously.
 *
 * Import in any client component:
 *   import { trackEvent, analyticsEvents } from '@/lib/analytics/events';
 *
 * UNI-1453
 */

// Extend Window with analytics globals
declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number> }) => void;
    gtag?: (...args: unknown[]) => void;
    clarity?: (command: string, value?: string) => void;
    dataLayer?: unknown[];
  }
}

/**
 * Track a custom event across all three analytics platforms simultaneously.
 * Safe to call server-side — guards against missing `window`.
 */
export function trackEvent(
  name: string,
  props?: Record<string, string | number>
): void {
  if (typeof window === 'undefined') return;

  // Plausible
  try {
    window.plausible?.(name, props ? { props } : undefined);
  } catch {
    // silent — tracking must never break UX
  }

  // GA4
  try {
    window.gtag?.('event', name, props ?? {});
  } catch {
    // silent
  }

  // Microsoft Clarity — supports custom event tags
  try {
    window.clarity?.('event', name);
  } catch {
    // silent
  }

  // Development logging
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics Event]', name, props);
  }
}

/**
 * Pre-built conversion events for Unite-Group.
 * Use these instead of raw trackEvent() for consistency.
 */
export const analyticsEvents = {
  /** User completes sign-up */
  signUp: () =>
    trackEvent('sign_up'),

  /** User enters the Stripe checkout flow */
  stripeCheckout: (product: string, value: number) =>
    trackEvent('begin_checkout', { product, value }),

  /** User submits a form */
  formSubmit: (formName: string) =>
    trackEvent('form_submit', { form: formName }),

  /** User clicks a CTA button */
  ctaClick: (ctaName: string) =>
    trackEvent('cta_click', { cta: ctaName }),

  /** User starts a free trial */
  trialStarted: (plan: string) =>
    trackEvent('trial_started', { plan }),

  /** User requests a demo */
  demoRequested: (source: string) =>
    trackEvent('demo_requested', { source }),

  /** User views a pricing plan */
  pricingViewed: (plan: string) =>
    trackEvent('pricing_viewed', { plan }),

  /** User logs in */
  login: (method: string) =>
    trackEvent('login', { method }),

  /** User adds a contact */
  contactCreated: () =>
    trackEvent('contact_created'),

  /** User creates a campaign */
  campaignCreated: (type: string) =>
    trackEvent('campaign_created', { type }),
} as const;
