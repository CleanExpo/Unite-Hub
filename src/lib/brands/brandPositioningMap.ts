/**
 * Brand Positioning Map
 * Defines positioning, mission, promise, audience, tone, and risk flags for each brand
 *
 * Used by:
 * - Content builder (ensuring brand-consistent messaging)
 * - Topic discovery (identifying relevant topics per brand)
 * - Multi-channel blueprint (platform-specific messaging)
 * - Truth layer enforcement (flagging messaging risks)
 */

import type { BrandId } from './brandRegistry';

export interface BrandPosition {
  brand: BrandId;
  mission: string;
  promise: string;
  audience: string[];
  tone: string[];
  strengths: string[];
  riskFlags: string[];
}

export const brandPositioningMap: Record<BrandId, BrandPosition> = {
  unite_hub: {
    brand: 'unite_hub',
    mission: 'Centralize daily operations for trade businesses with automation and AI governance.',
    promise: 'Run your entire business from one place.',
    audience: ['Trade business owners', 'Operations managers', 'Admin staff', 'Sales teams'],
    tone: ['direct', 'practical', 'confident', 'supportive'],
    strengths: ['automation', 'multi-agent orchestration', 'daily operations', 'ease of use'],
    riskFlags: [
      'Avoid technical jargon without definitions',
      'Avoid income/revenue guarantees',
      'Avoid replacing professional advice (legal, accounting)',
    ],
  },
  disaster_recovery_au: {
    brand: 'disaster_recovery_au',
    mission: 'Fast, certified restoration services with transparency and compliance to help people recover after disaster.',
    promise: 'When disaster strikes, we respond immediately with expertise and care.',
    audience: ['Homeowners', 'Insurance adjusters', 'Property managers', 'Businesses'],
    tone: ['reassuring', 'urgent', 'expert', 'empathetic'],
    strengths: ['24/7 speed', 'IICRC compliance', 'certification', 'customer care'],
    riskFlags: [
      'Avoid medical or health claims',
      'Avoid guarantees about insurance outcomes',
      'Avoid understating complexity of damage',
    ],
  },
  carsi: {
    brand: 'carsi',
    mission: 'Industry-leading training built on science and field experience for cleaning and restoration professionals.',
    promise: 'Professional education that actually prepares you for the field.',
    audience: ['Technicians', 'Restoration companies', 'Insurance partners', 'Educators'],
    tone: ['educational', 'authoritative', 'friendly', 'practical'],
    strengths: ['industry trust', 'science-based curriculum', 'certification', 'practical training'],
    riskFlags: [
      'Avoid giving legal advice',
      'Avoid medical claims',
      'Ensure compliance with education regulations',
    ],
  },
  synthex: {
    brand: 'synthex',
    mission: 'Done-for-you and done-with-you marketing using ethical, data-driven strategies powered by Unite-Hub.',
    promise: 'Get results-driven marketing without the agency overhead.',
    audience: ['Service businesses', 'Restoration companies', 'Contractors', 'Entrepreneurs'],
    tone: ['results-focused', 'transparent', 'energetic', 'collaborative'],
    strengths: ['SEO', 'content strategy', 'automation', 'results-driven approach'],
    riskFlags: [
      'Avoid unsubstantiated results claims',
      'Always cite data sources for case studies',
      'Avoid guarantees about ranking positions',
    ],
  },
  nrpg: {
    brand: 'nrpg',
    mission: 'Establish industry standards and best practices for restoration professionals, independent of insurer or builder interests.',
    promise: 'Trust the standards that put professionals first.',
    audience: ['Restoration contractors', 'Technicians', 'Insurance partners', 'Industry bodies'],
    tone: ['authoritative', 'fair', 'professional', 'principled'],
    strengths: ['independence', 'standards', 'vetting rigor', 'industry credibility'],
    riskFlags: [
      'Avoid conflicts of interest with insurance or builders',
      'Maintain strict vetting standards',
      'Ensure transparency in vetting process',
    ],
  },
  restore_assist: {
    brand: 'restore_assist',
    mission: 'Simplify restoration job management with modern software built for water, fire, and mould remediation businesses.',
    promise: 'Manage restoration jobs from scope to completion, all in one place.',
    audience: ['Restoration companies', 'Project managers', 'Field technicians', 'Insurance coordinators'],
    tone: ['practical', 'efficient', 'supportive', 'professional'],
    strengths: ['job tracking', 'field mobility', 'documentation', 'insurance integration'],
    riskFlags: [
      'Avoid making insurance claim guarantees',
      'Avoid overstating automation capabilities',
      'Ensure data privacy compliance',
    ],
  },
  ato_audit: {
    brand: 'ato_audit',
    mission: 'Streamline ATO compliance and BAS lodgement with automation and expert guidance.',
    promise: 'Stay compliant, reduce stress, and save time on tax obligations.',
    audience: ['Small business owners', 'Accountants', 'Bookkeepers', 'Business administrators'],
    tone: ['trustworthy', 'precise', 'reassuring', 'professional'],
    strengths: ['BAS automation', 'compliance tracking', 'ATO integration', 'audit preparation'],
    riskFlags: [
      'Avoid giving specific tax advice without disclaimer',
      'Always recommend professional accountant consultation',
      'Ensure accuracy in compliance calculations',
    ],
  },
};

/**
 * Get positioning for a brand
 */
export function getBrandPositioning(brandId: BrandId): BrandPosition {
  return brandPositioningMap[brandId];
}

/**
 * Check if a message aligns with brand tone
 */
export function checkBrandToneAlignment(brandId: BrandId, text: string): { aligned: boolean; issues: string[] } {
  const positioning = getBrandPositioning(brandId);
  const issues: string[] = [];

  // Simple heuristics (can be enhanced)
  const lowerText = text.toLowerCase();

  // Check for risky phrases
  positioning.riskFlags.forEach(flag => {
    if (flag.includes('guarantee') && lowerText.includes('guarantee')) {
      issues.push('Contains guarantee language - may violate risk flag');
    }
    if (flag.includes('medical') && (lowerText.includes('heal') || lowerText.includes('cure'))) {
      issues.push('Contains medical claims - may violate risk flag');
    }
  });

  return {
    aligned: issues.length === 0,
    issues,
  };
}
