/**
 * Landing Page Analytics & Event Tracking
 * Phase 52: Conversion tracking with truth-layer compliance
 */

export type LandingEvent =
  | 'landing_hero_view'
  | 'landing_scroll_25'
  | 'landing_scroll_50'
  | 'landing_scroll_75'
  | 'landing_cta_click'
  | 'pricing_cta_click'
  | 'trial_started'
  | 'demo_requested'
  | 'feature_viewed'
  | 'faq_expanded'
  | 'pricing_toggle_changed';

export interface EventPayload {
  event: LandingEvent;
  timestamp: number;
  sessionId: string;
  userId?: string;
  page: string;
  variant?: string;
  metadata?: Record<string, unknown>;
}

// Generate session ID for anonymous tracking
export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';

  let sessionId = sessionStorage.getItem('unite_session_id');
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('unite_session_id', sessionId);
  }
  return sessionId;
}

// Track landing page events
export function trackEvent(
  event: LandingEvent,
  metadata?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return;

  const payload: EventPayload = {
    event,
    timestamp: Date.now(),
    sessionId: getSessionId(),
    page: window.location.pathname,
    metadata,
  };

  // Get A/B test variant if active
  const variant = sessionStorage.getItem('ab_test_variant');
  if (variant) {
    payload.variant = variant;
  }

  // Send to analytics endpoint
  sendToAnalytics(payload);

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', event, metadata);
  }
}

// Send analytics data to backend
async function sendToAnalytics(payload: EventPayload): Promise<void> {
  try {
    await fetch('/api/analytics/landing-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    // Silent fail - don't break user experience
    console.error('[Analytics] Failed to send event:', error);
  }
}

// Scroll depth tracking setup (call inside useEffect)
export function setupScrollDepthTracking(): void {
  if (typeof window === 'undefined') return;

  const tracked = {
    scroll_25: false,
    scroll_50: false,
    scroll_75: false,
  };

  const handleScroll = () => {
    const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;

    if (scrollPercent >= 25 && !tracked.scroll_25) {
      tracked.scroll_25 = true;
      trackEvent('landing_scroll_25');
    }
    if (scrollPercent >= 50 && !tracked.scroll_50) {
      tracked.scroll_50 = true;
      trackEvent('landing_scroll_50');
    }
    if (scrollPercent >= 75 && !tracked.scroll_75) {
      tracked.scroll_75 = true;
      trackEvent('landing_scroll_75');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
}

// CTA click tracking
export function trackCTAClick(
  ctaType: 'hero_trial' | 'hero_demo' | 'pricing_trial' | 'pricing_contact' | 'footer_cta',
  planName?: string
): void {
  const event = ctaType.includes('pricing') ? 'pricing_cta_click' : 'landing_cta_click';
  trackEvent(event, {
    cta_type: ctaType,
    plan_name: planName,
  });
}

// Industry variant tracking
export function trackIndustryVariant(industry: string): void {
  trackEvent('landing_hero_view', {
    industry_variant: industry,
    landing_type: 'industry_specific',
  });
}

// Conversion funnel helpers
export interface ConversionStep {
  step: string;
  completed: boolean;
  timestamp?: number;
}

export function getConversionFunnel(): ConversionStep[] {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem('conversion_funnel');
  return stored ? JSON.parse(stored) : [];
}

export function updateConversionFunnel(step: string): void {
  if (typeof window === 'undefined') return;

  const funnel = getConversionFunnel();
  const existingStep = funnel.find(s => s.step === step);

  if (!existingStep) {
    funnel.push({
      step,
      completed: true,
      timestamp: Date.now(),
    });
    localStorage.setItem('conversion_funnel', JSON.stringify(funnel));
  }
}

export default {
  trackEvent,
  trackCTAClick,
  trackIndustryVariant,
  useScrollDepthTracking,
  getSessionId,
  getConversionFunnel,
  updateConversionFunnel,
};
