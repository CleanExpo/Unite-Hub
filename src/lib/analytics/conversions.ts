/**
 * Conversion tracking — client-side helper
 *
 * Call trackConversion() from any client component or server action to record
 * a conversion event. Events are persisted via the API route and stored in
 * army_opportunities for reporting.
 *
 * Usage:
 *   import { trackConversion } from '@/lib/analytics/conversions';
 *   await trackConversion('unite-group', 'stripe_checkout', 299, { plan: 'pro' });
 *
 * UNI-1457: Conversion tracking
 */

export type ConversionEventType =
  | 'stripe_checkout'
  | 'form_submit'
  | 'enrolment'
  | 'signup'
  | 'phone_click';

export interface ConversionResult {
  ok: boolean;
  conversionId?: string;
  error?: string;
}

/**
 * Records a conversion event for a given site.
 *
 * @param site       Site identifier (e.g. 'unite-group', 'nrpg', 'dr')
 * @param eventType  Type of conversion event
 * @param value      Optional monetary value in AUD
 * @param metadata   Optional additional context (plan name, form ID, etc.)
 */
export async function trackConversion(
  site: string,
  eventType: ConversionEventType,
  value?: number,
  metadata?: Record<string, unknown>,
): Promise<ConversionResult> {
  try {
    const res = await fetch('/api/founder/analytics/conversions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site, eventType, value, metadata }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body.error ?? `HTTP ${res.status}` };
    }

    const body = await res.json();
    return { ok: true, conversionId: body.conversion?.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error';
    console.error('[trackConversion]', message);
    return { ok: false, error: message };
  }
}

/**
 * Fire-and-forget version for use in event handlers where you don't need
 * to await the result (e.g. button click handlers).
 */
export function fireConversion(
  site: string,
  eventType: ConversionEventType,
  value?: number,
  metadata?: Record<string, unknown>,
): void {
  trackConversion(site, eventType, value, metadata).catch((err) => {
    console.error('[fireConversion]', err);
  });
}
