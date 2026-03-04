/**
 * Stripe MRR (Monthly Recurring Revenue) fetcher — UNI-873
 *
 * Given a Stripe restricted API key (read-only subscriptions + charges),
 * returns live MRR, active subscription count, and 30-day sparkline.
 *
 * Each Unite Group business has its own Stripe account with a separate
 * restricted key stored in env vars:
 *   STRIPE_KEY_DISASTER_RECOVERY
 *   STRIPE_KEY_RESTORE_ASSIST
 *   STRIPE_KEY_ATO
 *   STRIPE_KEY_NRPG
 *   STRIPE_KEY_UNITE_GROUP
 */

import Stripe from "stripe";

export interface StripeMrrResult {
  mrr: number;
  mrrChange: number;
  activeSubscriptions: number;
  sparkline: number[];
  currency: string;
  source: "stripe" | "stub";
}

// Map business ID → env var name
const STRIPE_KEY_ENV_MAP: Record<string, string> = {
  "disaster-recovery": "STRIPE_KEY_DISASTER_RECOVERY",
  "restore-assist": "STRIPE_KEY_RESTORE_ASSIST",
  ato: "STRIPE_KEY_ATO",
  nrpg: "STRIPE_KEY_NRPG",
  "unite-group": "STRIPE_KEY_UNITE_GROUP",
};

export function getStripeKeyForBusiness(businessId: string): string | undefined {
  const envVar = STRIPE_KEY_ENV_MAP[businessId];
  return envVar ? process.env[envVar] : undefined;
}

/**
 * Fetch live MRR data for a business using its Stripe restricted API key.
 * Returns null if no key is configured or on error.
 */
export async function fetchStripeMrr(stripeKey: string): Promise<StripeMrrResult | null> {
  const stripe = new Stripe(stripeKey, { apiVersion: "2024-11-20.acacia" });

  try {
    // Fetch all active subscriptions (up to 100 — increase if needed)
    const subscriptions = await stripe.subscriptions.list({
      status: "active",
      limit: 100,
      expand: ["data.items.data.price"],
    });

    // Calculate current MRR: sum monthly-normalised amounts
    let currentMrr = 0;
    for (const sub of subscriptions.data) {
      for (const item of sub.items.data) {
        const price = item.price;
        if (!price.unit_amount) continue;
        const qty = item.quantity ?? 1;
        let monthly = (price.unit_amount * qty) / 100;
        // Normalise non-monthly intervals to monthly
        if (price.recurring?.interval === "year") monthly /= 12;
        if (price.recurring?.interval === "week") monthly *= 4.33;
        if (price.recurring?.interval === "day") monthly *= 30;
        currentMrr += monthly;
      }
    }
    currentMrr = Math.round(currentMrr);

    // Calculate MRR 30 days ago for the trend % change
    // Use charges created in the 30d window as a proxy if subscription history isn't available
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const sixtyDaysAgo = thirtyDaysAgo - 30 * 24 * 60 * 60;

    // Get invoices paid in last 60 days for sparkline
    const invoices = await stripe.invoices.list({
      status: "paid",
      limit: 100,
      created: { gte: sixtyDaysAgo },
    });

    // Build 30-day daily revenue sparkline (last 30 days)
    const now = Date.now();
    const dayMs = 86400000;
    const dailyRevenue = new Array(30).fill(0);

    for (const inv of invoices.data) {
      if (!inv.amount_paid || !inv.period_start) continue;
      const invDay = Math.floor((inv.period_start * 1000 - (now - 30 * dayMs)) / dayMs);
      if (invDay >= 0 && invDay < 30) {
        dailyRevenue[invDay] += inv.amount_paid / 100;
      }
    }

    // Calculate 30d-ago MRR approximation for trend
    const recentRevenue = invoices.data
      .filter((inv: Stripe.Invoice) => inv.created && inv.created >= thirtyDaysAgo)
      .reduce((sum: number, inv: Stripe.Invoice) => sum + (inv.amount_paid ?? 0), 0) / 100;

    const previousRevenue = invoices.data
      .filter((inv: Stripe.Invoice) => inv.created && inv.created >= sixtyDaysAgo && inv.created < thirtyDaysAgo)
      .reduce((sum: number, inv: Stripe.Invoice) => sum + (inv.amount_paid ?? 0), 0) / 100;

    const mrrChange = previousRevenue > 0
      ? Math.round(((recentRevenue - previousRevenue) / previousRevenue) * 100)
      : 0;

    return {
      mrr: currentMrr,
      mrrChange,
      activeSubscriptions: subscriptions.data.length,
      sparkline: dailyRevenue.map(v => Math.round(v)),
      currency: "AUD",
      source: "stripe",
    };
  } catch (err) {
    console.error("[stripe-mrr] Error fetching Stripe MRR:", err);
    return null;
  }
}
