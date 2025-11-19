/**
 * Scope Planner - Phase 3A Client Portal
 *
 * Transforms raw client ideas into structured project proposals
 * with Good/Better/Best packages.
 *
 * Phase 3 Step 1: TypeScript stub with deterministic logic.
 * Future steps will integrate AI-assisted scope generation.
 */

export type ScopeTier = 'good' | 'better' | 'best';

export interface ClientIdea {
  id: string;
  organizationId: string;
  clientId: string;
  title: string;
  description: string;
  createdAt: string;
}

export interface ScopeSection {
  id: string;
  title: string;
  description: string;
  order?: number;
}

export interface ScopePackage {
  id: string;
  tier: ScopeTier;
  label: string;
  summary: string;
  deliverables?: string[];
  estimatedHours?: number;
  priceMin?: number;
  priceMax?: number;
  timeline?: string;
}

export interface ProposalScope {
  idea: ClientIdea;
  sections: ScopeSection[];
  packages: ScopePackage[];
  metadata?: {
    generatedAt: string;
    generatedBy?: string;
    aiModel?: string;
  };
}

/**
 * planScopeFromIdea
 *
 * Phase 3 Step 1: This is a pure TypeScript stub that returns a minimal,
 * deterministic structure for testing and wiring.
 *
 * Future enhancements:
 * - Call AI models (via existing OpenRouter routing) for content generation
 * - Use templates for common project types
 * - Allow manual editing by staff before client sees it
 *
 * @param idea - Client idea to transform into a scope
 * @returns ProposalScope with Good/Better/Best packages
 */
export function planScopeFromIdea(idea: ClientIdea): ProposalScope {
  const baseSection: ScopeSection = {
    id: `${idea.id}-overview`,
    title: 'Project Overview',
    description: idea.description,
    order: 1,
  };

  const packages: ScopePackage[] = [
    {
      id: `${idea.id}-good`,
      tier: 'good',
      label: 'Good',
      summary: 'Essential scope based on the submitted idea.',
      deliverables: ['Core functionality', 'Basic design', 'Documentation'],
      estimatedHours: undefined,
      priceMin: undefined,
      priceMax: undefined,
      timeline: '4-6 weeks',
    },
    {
      id: `${idea.id}-better`,
      tier: 'better',
      label: 'Better',
      summary: 'Balanced scope with additional refinements.',
      deliverables: [
        'Core functionality',
        'Professional design',
        'SEO optimization',
        'Analytics integration',
        'Documentation',
      ],
      estimatedHours: undefined,
      priceMin: undefined,
      priceMax: undefined,
      timeline: '6-8 weeks',
    },
    {
      id: `${idea.id}-best`,
      tier: 'best',
      label: 'Best',
      summary: 'Premium scope with maximum impact.',
      deliverables: [
        'Core functionality',
        'Premium design',
        'SEO optimization',
        'Analytics integration',
        'Custom animations',
        'A/B testing setup',
        'Comprehensive documentation',
      ],
      estimatedHours: undefined,
      priceMin: undefined,
      priceMax: undefined,
      timeline: '8-12 weeks',
    },
  ];

  return {
    idea,
    sections: [baseSection],
    packages,
    metadata: {
      generatedAt: new Date().toISOString(),
    },
  };
}

/**
 * calculatePackagePricing
 *
 * Phase 3 Step 3 placeholder: Calculate price ranges based on effort estimation.
 *
 * @param estimatedHours - Estimated hours for the package
 * @param hourlyRate - Hourly rate (default: $150/hour)
 * @param margin - Profit margin (default: 30%)
 * @returns Price range {priceMin, priceMax}
 */
export function calculatePackagePricing(
  estimatedHours: number,
  hourlyRate: number = 150,
  margin: number = 0.3
): { priceMin: number; priceMax: number } {
  const baseCost = estimatedHours * hourlyRate;
  const priceMin = baseCost * (1 + margin);
  const priceMax = priceMin * 1.2; // 20% range for negotiation

  return {
    priceMin: Math.round(priceMin),
    priceMax: Math.round(priceMax),
  };
}
