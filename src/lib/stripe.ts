import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-11-20.acacia",
});

export const PLANS = {
  starter: {
    name: "Starter",
    price: 9900, // $99.00 in cents
    interval: "month",
    features: [
      "1 Client Account",
      "Up to 5,000 contacts",
      "Email processing",
      "Basic reporting",
    ],
  },
  professional: {
    name: "Professional",
    price: 29900, // $299.00 in cents
    interval: "month",
    features: [
      "5 Client Accounts",
      "Up to 50,000 contacts",
      "Email + content generation",
      "Advanced analytics",
      "Priority support",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: null, // Custom pricing
    interval: "month",
    features: [
      "Unlimited accounts",
      "Unlimited contacts",
      "All features included",
      "Dedicated manager",
      "Custom integrations",
    ],
  },
};
