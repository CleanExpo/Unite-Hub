/**
 * Information Architecture System
 * Generates optimal subfolder structure for local services
 * Implements hub-and-spoke model with superior content depth
 */

export type ServiceCategory =
  | 'plumbing'
  | 'electrical'
  | 'hvac'
  | 'roofing'
  | 'cleaning'
  | 'landscaping'
  | 'dental'
  | 'medical'
  | 'legal'
  | 'automotive'
  | 'general';

export interface ArchitectureConfig {
  businessName: string;
  serviceCategory: ServiceCategory;
  primaryServices: string[]; // ["Emergency Plumbing", "Water Heater Repair"]
  locations: string[]; // ["New York", "New Jersey"]
  contentDepth: 'basic' | 'intermediate' | 'advanced'; // Determines # of pages
}

export interface UrlStructurePath {
  path: string; // /services/plumbing/reviews
  purpose: string; // "Client review aggregation"
  schemaType: string; // "Review", "AggregateRating"
  estPages: number; // Estimated # of pages
  contentStrategy: string; // "Best practices for this section"
}

export interface InformationArchitecture {
  businessName: string;
  serviceCategory: ServiceCategory;
  hubUrl: string; // /services/[service-name]
  spokes: UrlStructurePath[];
  internalLinkingStrategy: InternalLinkingRule[];
  breadcrumbStructure: BreadcrumbNode[];
  contentDepthScore: number; // 0-100 vs competitors
  estimatedTotalPages: number;
}

/**
 * Generate optimal URL structure (hub-and-spoke model)
 */
export function generateInformationArchitecture(
  config: ArchitectureConfig
): InformationArchitecture {
  const hubUrl = `/services/${slugify(config.serviceCategory)}`;

  const baseSpokes: UrlStructurePath[] = [
    {
      path: `${hubUrl}/`,
      purpose: 'Service overview hub',
      schemaType: 'Service',
      estPages: 1,
      contentStrategy: 'Comprehensive service description with schema.org Service markup',
    },
    {
      path: `${hubUrl}/reviews/`,
      purpose: 'Client review aggregation',
      schemaType: 'Review, AggregateRating',
      estPages: config.contentDepth === 'basic' ? 5 : config.contentDepth === 'intermediate' ? 15 : 30,
      contentStrategy:
        'Video testimonials, star ratings, review schema with E-E-A-T signals. Auto-generate from client contributions.',
    },
    {
      path: `${hubUrl}/case-studies/`,
      purpose: 'Video case studies',
      schemaType: 'VideoObject, CreativeWork',
      estPages: config.contentDepth === 'basic' ? 3 : config.contentDepth === 'intermediate' ? 8 : 15,
      contentStrategy:
        'Client success stories with before/after visuals. Include transcript and structured metadata.',
    },
    {
      path: `${hubUrl}/faq/`,
      purpose: 'Client questions & answers',
      schemaType: 'FAQPage, Question, Answer',
      estPages: config.contentDepth === 'basic' ? 2 : config.contentDepth === 'intermediate' ? 5 : 10,
      contentStrategy:
        'Extract Q&A from client interactions. Auto-generate FAQPage schema from customer inquiries.',
    },
    {
      path: `${hubUrl}/team/`,
      purpose: 'Expert profiles',
      schemaType: 'Person, Occupation',
      estPages: 1,
      contentStrategy:
        'Business owner and key team member profiles with E-E-A-T credentials, certifications, years of experience.',
    },
    {
      path: `${hubUrl}/gallery/`,
      purpose: 'Before/after gallery',
      schemaType: 'ImageObject, ImageGallery',
      estPages: config.contentDepth === 'basic' ? 1 : config.contentDepth === 'intermediate' ? 3 : 5,
      contentStrategy:
        'Rich media with detailed image captions, structured metadata, and schema.org markup.',
    },
  ];

  // Add location-specific pages if multiple locations
  if (config.locations.length > 0) {
    baseSpokes.push({
      path: `/locations/`,
      purpose: 'Location index',
      schemaType: 'LocalBusiness, Place',
      estPages: config.locations.length,
      contentStrategy:
        'Location-specific pages with LocalBusiness schema, maps, local SEO optimization.',
    });

    config.locations.forEach((location) => {
      baseSpokes.push({
        path: `/locations/${slugify(location)}/${config.serviceCategory}/`,
        purpose: `Geo-specific service page for ${location}`,
        schemaType: 'LocalBusiness, Service',
        estPages: 1,
        contentStrategy: 'Geo-targeted content with local schema and area-served markup.',
      });
    });
  }

  // Add advanced content sections for advanced depth
  if (config.contentDepth === 'advanced') {
    baseSpokes.push(
      {
        path: `${hubUrl}/guides/`,
        purpose: 'How-to and educational content',
        schemaType: 'Article, HowTo',
        estPages: 12,
        contentStrategy: 'In-depth guides with step-by-step instructions and schema markup.',
      },
      {
        path: `${hubUrl}/blog/`,
        purpose: 'Industry news and insights',
        schemaType: 'BlogPosting, NewsArticle',
        estPages: 20,
        contentStrategy:
          'Regular content updates for topical authority and fresh indexing signals.',
      },
      {
        path: `${hubUrl}/certifications/`,
        purpose: 'Licenses and credentials',
        schemaType: 'Credential, Certificate',
        estPages: 1,
        contentStrategy: 'Transparency around certifications, licenses, and industry memberships.',
      }
    );
  }

  // Calculate total estimated pages
  const estimatedTotalPages = baseSpokes.reduce((sum, spoke) => sum + spoke.estPages, 0);

  // Generate breadcrumb structure
  const breadcrumbStructure = generateBreadcrumbStructure(hubUrl, config.serviceCategory);

  // Generate internal linking rules
  const internalLinkingStrategy = generateInternalLinkingRules(hubUrl, baseSpokes);

  return {
    businessName: config.businessName,
    serviceCategory: config.serviceCategory,
    hubUrl,
    spokes: baseSpokes,
    internalLinkingStrategy,
    breadcrumbStructure,
    contentDepthScore: calculateContentDepthScore(config.contentDepth, estimatedTotalPages),
    estimatedTotalPages,
  };
}

/**
 * Generate breadcrumb structure for schema.org BreadcrumbList
 */
function generateBreadcrumbStructure(
  hubUrl: string,
  serviceCategory: ServiceCategory
): BreadcrumbNode[] {
  return [
    {
      name: 'Home',
      url: '/',
      position: 1,
    },
    {
      name: 'Services',
      url: '/services',
      position: 2,
    },
    {
      name: toTitleCase(serviceCategory),
      url: hubUrl,
      position: 3,
    },
  ];
}

export interface BreadcrumbNode {
  name: string;
  url: string;
  position: number;
}

/**
 * Generate BreadcrumbList schema for navigation
 */
export function generateBreadcrumbListSchema(
  breadcrumbs: BreadcrumbNode[]
): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb) => ({
      '@type': 'ListItem',
      position: crumb.position,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

/**
 * Internal linking rules for hub-and-spoke model
 */
interface InternalLinkingRule {
  fromSection: string;
  toSections: string[];
  anchorText: string;
  rationale: string;
}

function generateInternalLinkingRules(
  hubUrl: string,
  spokes: UrlStructurePath[]
): InternalLinkingRule[] {
  return [
    {
      fromSection: 'hub',
      toSections: ['reviews', 'case-studies', 'faq', 'team'],
      anchorText: 'See {{section}} →',
      rationale: 'Hub should link to all major content sections (relevance + crawlability)',
    },
    {
      fromSection: 'reviews',
      toSections: ['case-studies', 'team', 'faq'],
      anchorText: 'Related: {{section}}',
      rationale: 'Reviews → Case Studies (social proof chain), Reviews → Team (authority)',
    },
    {
      fromSection: 'case-studies',
      toSections: ['reviews', 'faq', 'team'],
      anchorText: 'Learn more in {{section}}',
      rationale: 'Case studies → FAQ (answer common questions), → Team (expert credibility)',
    },
    {
      fromSection: 'faq',
      toSections: ['reviews', 'case-studies', 'team'],
      anchorText: 'See {{section}} for more',
      rationale: 'FAQ → Case Studies (proof), → Reviews (customer validation)',
    },
    {
      fromSection: 'team',
      toSections: ['reviews', 'case-studies'],
      anchorText: 'See {{team}} work in {{section}}',
      rationale: 'Team profiles → actual work examples (E-E-A-T signal)',
    },
    {
      fromSection: 'gallery',
      toSections: ['case-studies', 'reviews'],
      anchorText: 'Full story in {{section}}',
      rationale: 'Visual gallery → detailed narratives (engagement funnel)',
    },
  ];
}

/**
 * Calculate content depth score (0-100) vs competitors
 */
function calculateContentDepthScore(contentDepth: string, estimatedPages: number): number {
  let baseScore = 0;

  switch (contentDepth) {
    case 'basic':
      baseScore = 30;
      break;
    case 'intermediate':
      baseScore = 60;
      break;
    case 'advanced':
      baseScore = 90;
      break;
  }

  // Bonus points for high page count
  if (estimatedPages > 50) {
    baseScore = Math.min(100, baseScore + 10);
  }

  return baseScore;
}

/**
 * Generate schema.org schema for a service section
 */
export interface ServiceSchemaOptions {
  serviceName: string;
  description: string;
  businessName: string;
  url: string;
  provider?: {
    name: string;
    image?: string;
  };
  areaServed?: string[];
  hasOfferCatalog?: {
    '@type': 'OfferCatalog';
    name: string;
    itemListElement: Array<{
      '@type': 'Offer';
      itemOffered: {
        '@type': 'Service';
        name: string;
      };
    }>;
  };
}

export function generateServiceSchema(options: ServiceSchemaOptions): Record<string, any> {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: options.serviceName,
    description: options.description,
    provider: {
      '@type': 'Organization',
      name: options.businessName,
      url: '/',
    },
    url: options.url,
  };

  if (options.areaServed) {
    schema.areaServed = options.areaServed.map((area) => ({
      '@type': 'Place',
      name: area,
    }));
  }

  if (options.hasOfferCatalog) {
    schema.hasOfferCatalog = options.hasOfferCatalog;
  }

  return schema;
}

/**
 * Content strategy recommendations for each section
 */
export function getContentStrategyForSection(
  section: string
): {
  minWords: number;
  recommendations: string[];
  schemaTypes: string[];
} {
  const strategies: Record<
    string,
    {
      minWords: number;
      recommendations: string[];
      schemaTypes: string[];
    }
  > = {
    reviews: {
      minWords: 500,
      recommendations: [
        'Include video testimonials with transcripts',
        'Add star ratings with date',
        'Mention specific results and outcomes',
        'Include customer name and location',
      ],
      schemaTypes: ['Review', 'AggregateRating', 'VideoObject'],
    },
    'case-studies': {
      minWords: 1500,
      recommendations: [
        'Tell complete customer story (problem → solution → results)',
        'Include before/after visuals',
        'Add quantifiable metrics/results',
        'Feature customer testimonial video',
      ],
      schemaTypes: ['CreativeWork', 'VideoObject', 'ImageObject'],
    },
    faq: {
      minWords: 1000,
      recommendations: [
        'Extract actual customer questions',
        'Provide detailed, authoritative answers',
        'Include relevant links to other pages',
        'Update regularly with new questions',
      ],
      schemaTypes: ['FAQPage', 'Question', 'Answer'],
    },
    team: {
      minWords: 800,
      recommendations: [
        'Include professional headshots',
        'List certifications and licenses',
        'Highlight years of experience',
        'Add specialty areas of expertise',
      ],
      schemaTypes: ['Person', 'Credential', 'Occupation'],
    },
    'case-studies': {
      minWords: 2000,
      recommendations: [
        'Detailed problem-solution narrative',
        'Time-series progress (before → during → after)',
        'Professional photography/video',
        'Quantified business impact',
      ],
      schemaTypes: ['VideoObject', 'CreativeWork', 'ImageObject'],
    },
    guides: {
      minWords: 2000,
      recommendations: [
        'Step-by-step instructions',
        'Helpful diagrams or videos',
        'Safety warnings where applicable',
        'Tools and materials needed',
      ],
      schemaTypes: ['HowTo', 'Article'],
    },
  };

  return (
    strategies[section] || {
      minWords: 500,
      recommendations: ['Provide original, helpful content'],
      schemaTypes: ['Article'],
    }
  );
}

/**
 * Utility: Slugify strings for URLs
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Utility: Title case
 */
function toTitleCase(text: string): string {
  return text
    .toLowerCase()
    .split(/[\s-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generate comprehensive architecture documentation
 */
export function generateArchitectureDocumentation(
  architecture: InformationArchitecture
): string {
  const doc = [
    `# Information Architecture for ${architecture.businessName}`,
    ``,
    `## Overview`,
    `Service Category: ${toTitleCase(architecture.serviceCategory)}`,
    `Hub URL: ${architecture.hubUrl}`,
    `Estimated Pages: ${architecture.estimatedTotalPages}`,
    `Content Depth Score: ${architecture.contentDepthScore}/100`,
    ``,
    `## URL Structure (Hub-and-Spoke Model)`,
    ``,
    `### Hub`,
    `- **${architecture.hubUrl}/** - Service overview with comprehensive schema`,
    ``,
    `### Spokes`,
    architecture.spokes
      .map((spoke) => {
        return (
          `- **${spoke.path}** (${spoke.estPages} pages)` +
          `\n  - Purpose: ${spoke.purpose}` +
          `\n  - Schema Types: ${spoke.schemaType}` +
          `\n  - Strategy: ${spoke.contentStrategy}`
        );
      })
      .join(`\n`),
    ``,
    `## Internal Linking Strategy`,
    ``,
    architecture.internalLinkingStrategy
      .map(
        (rule) =>
          `**${rule.fromSection}** → ${rule.toSections.join(', ')}\n` +
          `Anchor Text: "${rule.anchorText}"\n` +
          `Rationale: ${rule.rationale}`
      )
      .join(`\n\n`),
    ``,
    `## Breadcrumb Navigation`,
    `${architecture.breadcrumbStructure.map((b) => `${' '.repeat(b.position - 1)}${b.name}`).join(' > ')}`,
    ``,
  ];

  return doc.join('\n');
}
