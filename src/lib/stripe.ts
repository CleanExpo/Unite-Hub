import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-11-20.acacia",
});

/**
 * DEPRECATED: Use lib/stripe/client.ts and lib/billing/pricing-config.ts instead
 * This file remains for backwards compatibility only.
 *
 * Canonical pricing source: src/lib/billing/pricing-config.ts
 * All prices in AUD, GST inclusive
 */
export const PLANS = {
  starter: {
    name: "Starter",
    price: 49500, // A$495.00 in cents (AUD, GST inclusive)
    interval: "month",
    features: [
      "20,000 AI tokens/month",
      "2 website audits/month",
      "500 contacts",
      "1 team seat",
      "5 email campaigns",
    ],
  },
  professional: {
    name: "Pro",
    price: 89500, // A$895.00 in cents (AUD, GST inclusive)
    interval: "month",
    features: [
      "250,000 AI tokens/month",
      "20 website audits/month",
      "5,000 contacts",
      "3 team seats",
      "Unlimited campaigns",
    ],
  },
  elite: {
    name: "Elite",
    price: 129500, // A$1,295.00 in cents (AUD, GST inclusive)
    interval: "month",
    features: [
      "2,000,000 AI tokens/month",
      "100 website audits/month",
      "Unlimited contacts",
      "10 team seats",
      "White label options",
    ],
  },
};
