export interface PricingPlan {
  id: string
  name: string
  description: string
  monthlyPrice: number | string
  annualPrice: number | string
  features: string[]
  ctaText: string
  ctaLink?: string
  isPopular?: boolean
  highlightColor?: string // e.g., 'cyan' or 'purple' for accents
}

export interface FAQItem {
  id: string
  question: string
  answer: string
}

export const pricingPlansData: PricingPlan[] = [
  {
    id: "startup",
    name: "Startup",
    description: "Perfect for small businesses and startups",
    monthlyPrice: 299,
    annualPrice: 239, // 20% discount
    features: [
      "CRM for up to 10 users",
      "Cloud infrastructure setup",
      "Basic AI analytics",
      "24/7 email support",
      "5GB storage",
      "Mobile app access",
      "Basic integrations",
      "Monthly reports",
      "Custom AI solutions",
      "Dedicated account manager",
      "Advanced security features",
      "Custom integrations",
    ],
    ctaText: "Start Free Trial",
    ctaLink: "#contact", // Placeholder
    isPopular: false,
    highlightColor: "bg-slate-700",
  },
  {
    id: "professional",
    name: "Professional",
    description: "Ideal for growing businesses",
    monthlyPrice: 799,
    annualPrice: 639, // 20% discount
    features: [
      "CRM for up to 50 users",
      "Advanced cloud solutions",
      "AI-powered analytics & insights",
      "24/7 priority support",
      "50GB storage",
      "Mobile app access",
      "Advanced integrations",
      "Weekly reports",
      "Custom workflows",
      "API access",
      "Team collaboration tools",
      "Data backup & recovery",
      "White-label options",
      "On-premise deployment",
    ],
    ctaText: "Start Free Trial",
    ctaLink: "#contact", // Placeholder
    isPopular: true,
    highlightColor: "bg-cyan-500",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organizations with custom needs",
    monthlyPrice: "Custom",
    annualPrice: "Custom",
    features: [
      "Unlimited users",
      "Full cloud infrastructure",
      "Custom AI solutions",
      "Dedicated account manager",
      "Unlimited storage",
      "Mobile app access",
      "Custom integrations",
      "Real-time analytics",
      "Advanced security features",
      "SLA guarantee",
      "On-premise options",
      "White-label solutions",
      "Custom training",
      "Compliance support",
      "24/7 dedicated support",
    ],
    ctaText: "Contact Sales",
    ctaLink: "#contact", // Placeholder
    isPopular: false,
    highlightColor: "bg-slate-700",
  },
]

export const faqDataItems: FAQItem[] = [
  {
    id: "faq1",
    question: "Can I change my plan later?",
    answer:
      "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any differences.",
  },
  {
    id: "faq2",
    question: "Do you offer a free trial?",
    answer: "Yes! All our plans come with a 14-day free trial. No credit card required to start.",
  },
  {
    id: "faq3",
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, bank transfers, and can arrange custom billing for enterprise clients.",
  },
  {
    id: "faq4",
    question: "Is there a setup fee?",
    answer: "No setup fees for any of our plans. You only pay for the subscription.",
  },
]
