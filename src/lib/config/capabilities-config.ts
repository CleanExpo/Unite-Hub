/**
 * Capabilities Config
 * Phase 36: MVP Client Truth Layer
 *
 * Transparent listing of what Unite-Hub can and cannot do
 */

export interface Capability {
  id: string;
  name: string;
  description: string;
  status: "available" | "testing" | "planned";
}

export const CAPABILITIES: Capability[] = [
  // Currently Available (Stage 1 MVP)
  {
    id: "website_audits",
    name: "Website Audits",
    description: "Technical, SEO, GEO, and content audits with real score output",
    status: "available",
  },
  {
    id: "visual_concepts",
    name: "Visual Concept Packs",
    description: "AI-generated wireframes, layouts, and copy concepts (clearly labeled)",
    status: "available",
  },
  {
    id: "client_persona",
    name: "Client Persona & Vision",
    description: "AI-generated summaries of your business context and goals",
    status: "available",
  },
  {
    id: "roadmap_tracking",
    name: "Roadmap & Task Tracking",
    description: "Project roadmaps with task statuses linked to approvals",
    status: "available",
  },
  {
    id: "approval_pipeline",
    name: "Approval Pipeline",
    description: "Review and approve/reject all AI-generated content before use",
    status: "available",
  },
  {
    id: "ai_timeline",
    name: "AI Event Timeline",
    description: "Full transparency log of all AI-generated content with model attribution",
    status: "available",
  },
  {
    id: "stripe_billing",
    name: "Stripe Billing",
    description: "AU pricing with 14-day trials, annual plans, and subscription management",
    status: "available",
  },
  {
    id: "enhancement_suggestions",
    name: "Enhancement Suggestions",
    description: "AI-powered suggestions based on audits (proposals only, not auto-execution)",
    status: "available",
  },

  // In Testing (Not client-facing yet)
  {
    id: "video_concepts",
    name: "Video Concept Generation",
    description: "Veo 3 video concepts with safety filters and approval workflow",
    status: "testing",
  },
  {
    id: "voice_demos",
    name: "Voice Demo Generation",
    description: "ElevenLabs voice demos clearly labeled as AI-generated",
    status: "testing",
  },
  {
    id: "gmail_sync",
    name: "Gmail Integration",
    description: "Automatic email sync and knowledge extraction",
    status: "testing",
  },

  // Planned / Not Yet Available
  {
    id: "auto_implementation",
    name: "Auto-Implementation",
    description: "Automatic execution of approved enhancements",
    status: "planned",
  },
  {
    id: "multi_user",
    name: "Team Collaboration",
    description: "Multiple users per workspace with role-based access",
    status: "planned",
  },
  {
    id: "advanced_analytics",
    name: "Advanced Analytics",
    description: "Deep-dive performance analytics and attribution",
    status: "planned",
  },
  {
    id: "white_label",
    name: "White Label",
    description: "Custom branding for agencies",
    status: "planned",
  },
];

/**
 * Get capabilities by status
 */
export function getCapabilitiesByStatus(status: "available" | "testing" | "planned"): Capability[] {
  return CAPABILITIES.filter((c) => c.status === status);
}

/**
 * Check if a capability is available
 */
export function isCapabilityAvailable(id: string): boolean {
  const cap = CAPABILITIES.find((c) => c.id === id);
  return cap?.status === "available";
}
