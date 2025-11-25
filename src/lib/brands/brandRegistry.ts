/**
 * Brand Registry
 * Central registry of all brands under Unite-Hub Nexus
 *
 * This defines the brands, their categories, and metadata used by:
 * - Founder Ops Hub (task assignment per brand)
 * - Topic discovery (identifying relevant topics per brand)
 * - Content builder (multi-channel blueprints per brand)
 * - Cross-linking rules (when to link between brands)
 */

export const brandRegistry = [
  {
    id: 'unite_hub',
    slug: 'unite-hub',
    name: 'Unite-Hub',
    domain: 'https://unite-hub.io',
    category: 'CRM Platform',
    tagline: 'Your daily business command center',
    description: 'AI-powered CRM and automation platform for trade businesses',
    status: 'active',
  },
  {
    id: 'disaster_recovery_au',
    slug: 'disaster-recovery',
    name: 'Disaster Recovery Australia',
    domain: 'https://www.disasterrecovery.com.au',
    category: 'Restoration Services',
    tagline: '24/7 Water, Fire & Mould Specialists',
    description: 'Emergency restoration services for water, fire, and mould damage',
    status: 'active',
  },
  {
    id: 'carsi',
    slug: 'carsi',
    name: 'CARSI',
    domain: 'https://carsi.com.au',
    category: 'Education & Certification',
    tagline: 'Cleaning & Restoration Science Institute',
    description: 'Professional education and certification for cleaners and restorers',
    status: 'active',
  },
  {
    id: 'synthex',
    slug: 'synthex',
    name: 'Synthex',
    domain: 'https://synthex.social',
    category: 'Marketing Agency',
    tagline: 'Done-for-you marketing using AI',
    description: 'Performance marketing agency powered by Unite-Hub',
    status: 'active',
  },
  {
    id: 'nrpg',
    slug: 'nrpg',
    name: 'NRPG',
    domain: 'https://nrpg.business',
    category: 'Industry Standards',
    tagline: 'National Restoration Professionals Group',
    description: 'Contractor vetting, standards, and guidelines for restoration professionals',
    status: 'active',
  },
  {
    id: 'unite_group',
    slug: 'unite-group',
    name: 'Unite-Group',
    domain: 'https://unite-group.in',
    category: 'Holding Company',
    tagline: 'Technology + AI + Industry Operations',
    description: 'Umbrella brand for all SaaS, agency, and training products',
    status: 'active',
  },
] as const;

export type BrandId = typeof brandRegistry[number]['id'];
export type BrandSlug = typeof brandRegistry[number]['slug'];

/**
 * Get brand by ID
 */
export function getBrandById(id: BrandId) {
  return brandRegistry.find(b => b.id === id);
}

/**
 * Get brand by slug
 */
export function getBrandBySlug(slug: BrandSlug) {
  return brandRegistry.find(b => b.slug === slug);
}

/**
 * Get all active brands
 */
export function getActiveBrands() {
  return brandRegistry.filter(b => b.status === 'active');
}

/**
 * Get brand names mapped to IDs
 */
export function getBrandNameMap(): Record<BrandId, string> {
  const map = {} as Record<BrandId, string>;
  brandRegistry.forEach(b => {
    map[b.id] = b.name;
  });
  return map;
}
