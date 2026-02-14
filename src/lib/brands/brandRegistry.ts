/**
 * Brand Registry
 * Central registry of all businesses managed by Unite-Hub
 *
 * This defines the businesses, their categories, and metadata used by:
 * - Founder OS Hub (task assignment per business)
 * - Topic discovery (identifying relevant topics per business)
 * - Content builder (multi-channel blueprints per business)
 * - Cross-linking rules (when to link between businesses)
 *
 * Managed Businesses:
 * 1. Synthex - AI Marketing Agency (separate app, managed from here)
 * 2. RestoreAssist - Restoration Management Software
 * 3. CARSI - Cleaning & Restoration Science Institute
 * 4. Disaster Recovery - Emergency Restoration Services
 * 5. NRPG - National Restoration Professionals Group
 * 6. ATO Audit - Tax Audit & Compliance Services
 */

export const brandRegistry = [
  {
    id: 'unite_hub',
    slug: 'unite-hub',
    name: 'Unite-Hub',
    domain: 'https://unite-hub.com',
    category: 'Business Hub',
    tagline: 'Your Business. One Hub.',
    description: 'AI-powered Business Hub for managing all businesses from one intelligent dashboard',
    status: 'active',
  },
  {
    id: 'synthex',
    slug: 'synthex',
    name: 'Synthex',
    domain: 'https://synthex.social',
    category: 'AI Marketing Agency',
    tagline: 'Done-for-you marketing using AI',
    description: 'Performance marketing agency powered by AI (separate application)',
    status: 'active',
  },
  {
    id: 'restore_assist',
    slug: 'restore-assist',
    name: 'RestoreAssist',
    domain: 'https://restoreassist.com.au',
    category: 'Restoration Software',
    tagline: 'Restoration Management Made Simple',
    description: 'Restoration job management software for water, fire, and mould remediation businesses',
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
    id: 'disaster_recovery_au',
    slug: 'disaster-recovery',
    name: 'Disaster Recovery',
    domain: 'https://www.disasterrecovery.com.au',
    category: 'Restoration Services',
    tagline: '24/7 Water, Fire & Mould Specialists',
    description: 'Emergency restoration services for water, fire, and mould damage',
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
    id: 'ato_audit',
    slug: 'ato-audit',
    name: 'ATO Audit',
    domain: 'https://atoaudit.com.au',
    category: 'Tax & Compliance',
    tagline: 'Tax Audit & Compliance Services',
    description: 'BAS automation, ATO compliance, and tax audit management services',
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
 * Get all active brands (businesses)
 */
export function getActiveBrands() {
  return brandRegistry.filter(b => b.status === 'active');
}

/**
 * Get managed businesses (excludes Unite-Hub itself)
 */
export function getManagedBusinesses() {
  return brandRegistry.filter(b => b.status === 'active' && b.id !== 'unite_hub');
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
