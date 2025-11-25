/**
 * Brand Cross-Linking Rules
 * Defines when and how to link between brands
 *
 * Used by:
 * - Content builder (determining cross-brand references)
 * - Topic discovery (identifying multi-brand topic opportunities)
 * - Founder approval (transparency on brand relationships)
 */

import type { BrandId } from './brandRegistry';

export interface CrossLinkRule {
  from: BrandId;
  to: BrandId;
  context: string;
  rule: string;
  frequency: 'common' | 'occasional' | 'rare';
}

export const brandCrossLinkingRules: CrossLinkRule[] = [
  {
    from: 'carsi',
    to: 'disaster_recovery_au',
    context: 'Training → Real-world application',
    rule: 'CARSI training courses can reference Disaster Recovery Australia as a leading practitioner example.',
    frequency: 'common',
  },
  {
    from: 'disaster_recovery_au',
    to: 'carsi',
    context: 'Services → Professional development',
    rule: 'DRA can recommend CARSI as the trusted education provider behind technician training standards.',
    frequency: 'occasional',
  },
  {
    from: 'nrpg',
    to: 'carsi',
    context: 'Standards → Education',
    rule: 'NRPG standards can cross-reference CARSI for aligned professional development.',
    frequency: 'occasional',
  },
  {
    from: 'carsi',
    to: 'nrpg',
    context: 'Training → Industry standards',
    rule: 'CARSI curriculum can reference NRPG standards to show alignment with industry best practices.',
    frequency: 'common',
  },
  {
    from: 'synthex',
    to: 'unite_hub',
    context: 'Agency services → Platform technology',
    rule: 'Synthex can mention Unite-Hub as the technology powering their campaigns.',
    frequency: 'common',
  },
  {
    from: 'unite_hub',
    to: 'synthex',
    context: 'Platform → Agency use case',
    rule: 'Unite-Hub can reference Synthex as an agency powered by the platform.',
    frequency: 'occasional',
  },
  {
    from: 'disaster_recovery_au',
    to: 'nrpg',
    context: 'Services → Contractor verification',
    rule: 'DRA can mention NRPG vetting as a marker of quality and standards compliance.',
    frequency: 'occasional',
  },
  {
    from: 'unite_group',
    to: 'unite_hub',
    context: 'Holding company → Product',
    rule: 'Unite-Group can reference Unite-Hub as a key product in the portfolio.',
    frequency: 'occasional',
  },
  {
    from: 'unite_group',
    to: 'disaster_recovery_au',
    context: 'Holding company → Operating company',
    rule: 'Unite-Group can reference DRA as an operating company in the portfolio.',
    frequency: 'rare',
  },
  {
    from: 'unite_group',
    to: 'carsi',
    context: 'Holding company → Education division',
    rule: 'Unite-Group can reference CARSI as education division.',
    frequency: 'rare',
  },
  {
    from: 'unite_group',
    to: 'synthex',
    context: 'Holding company → Agency',
    rule: 'Unite-Group can reference Synthex as marketing agency powered by platform.',
    frequency: 'rare',
  },
];

/**
 * Get all linking rules from a brand
 */
export function getLinkingRulesFrom(brandId: BrandId): CrossLinkRule[] {
  return brandCrossLinkingRules.filter(r => r.from === brandId);
}

/**
 * Get all linking rules to a brand
 */
export function getLinkingRulesTo(brandId: BrandId): CrossLinkRule[] {
  return brandCrossLinkingRules.filter(r => r.to === brandId);
}

/**
 * Check if a cross-link is allowed
 */
export function isCrossLinkAllowed(from: BrandId, to: BrandId): boolean {
  return brandCrossLinkingRules.some(r => r.from === from && r.to === to);
}

/**
 * Get cross-link rule details
 */
export function getCrossLinkRule(from: BrandId, to: BrandId): CrossLinkRule | undefined {
  return brandCrossLinkingRules.find(r => r.from === from && r.to === to);
}
