/**
 * AIDO Schema.org Generator
 * Creates structured data for algorithmic immunity
 *
 * CRITICAL: Schema helps AI systems understand and cite content
 */

interface FAQItem {
  question: string;
  answer: string;
}

interface PersonInfo {
  name: string;
  jobTitle?: string;
  organization?: string;
  profileUrl?: string;
  imageUrl?: string;
  linkedIn?: string;
  facebook?: string;
  twitter?: string;
  email?: string;
  credentials?: string[];
  alumniOf?: string;
  knowsAbout?: string[];
}

interface ArticleInfo {
  title: string;
  description: string;
  author: PersonInfo;
  datePublished: string;
  dateModified?: string;
  url: string;
  imageUrl?: string;
  keywords?: string[];
  wordCount?: number;
  publisher?: {
    name: string;
    logo?: string;
    url?: string;
  };
}

interface ServiceInfo {
  name: string;
  description: string;
  provider: {
    name: string;
    type: 'Organization' | 'LocalBusiness';
    address?: {
      streetAddress?: string;
      addressLocality: string;
      addressRegion: string;
      postalCode?: string;
      addressCountry: string;
    };
  };
  areaServed?: string | string[];
  serviceType?: string;
  offers?: {
    priceRange?: string;
    priceCurrency?: string;
  };
}

interface HowToStep {
  name: string;
  text: string;
  image?: string;
  url?: string;
  estimatedTime?: string;
}

/**
 * Generate FAQPage schema for Q&A content
 * CRITICAL: This is the most important schema for AI citation
 */
export function generateFAQPageSchema(qaBlocks: FAQItem[]): object {
  if (!qaBlocks || qaBlocks.length === 0) {
    throw new Error('FAQPage schema requires at least one Q&A pair');
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': qaBlocks.map((qa, index) => ({
      '@type': 'Question',
      '@id': `#question-${index + 1}`,
      'name': qa.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        '@id': `#answer-${index + 1}`,
        'text': qa.answer,
        'inLanguage': 'en-AU',
      },
    })),
  };
}

/**
 * Generate Person schema for author entity
 * CRITICAL: Establishes E-E-A-T credibility
 */
export function generatePersonSchema(author: PersonInfo): object {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    'name': author.name,
  };

  if (author.jobTitle) {
    schema.jobTitle = author.jobTitle;
  }

  if (author.organization) {
    schema.worksFor = {
      '@type': 'Organization',
      'name': author.organization,
    };
  }

  if (author.profileUrl) {
    schema.url = author.profileUrl;
  }

  if (author.imageUrl) {
    schema.image = author.imageUrl;
  }

  // Social media profiles (sameAs property)
  const sameAs: string[] = [];
  if (author.linkedIn) {
    sameAs.push(author.linkedIn.startsWith('http') ? author.linkedIn : `https://linkedin.com/in/${author.linkedIn}`);
  }
  if (author.facebook) {
    sameAs.push(author.facebook.startsWith('http') ? author.facebook : `https://facebook.com/${author.facebook}`);
  }
  if (author.twitter) {
    sameAs.push(author.twitter.startsWith('http') ? author.twitter : `https://twitter.com/${author.twitter}`);
  }

  if (sameAs.length > 0) {
    schema.sameAs = sameAs;
  }

  if (author.email) {
    schema.email = author.email;
  }

  if (author.alumniOf) {
    schema.alumniOf = {
      '@type': 'EducationalOrganization',
      'name': author.alumniOf,
    };
  }

  if (author.knowsAbout && author.knowsAbout.length > 0) {
    schema.knowsAbout = author.knowsAbout;
  }

  // Add credentials as honorific suffix or description
  if (author.credentials && author.credentials.length > 0) {
    schema.honorificSuffix = author.credentials.join(', ');
    schema.description = `${author.name} is a ${author.jobTitle || 'professional'} with credentials in ${author.credentials.join(', ')}.`;
  }

  return schema;
}

/**
 * Generate Article schema for blog posts and guides
 */
export function generateArticleSchema(article: ArticleInfo): object {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': article.title,
    'description': article.description,
    'author': generatePersonSchema(article.author),
    'datePublished': article.datePublished,
    'dateModified': article.dateModified || article.datePublished,
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': article.url,
    },
  };

  if (article.imageUrl) {
    schema.image = {
      '@type': 'ImageObject',
      'url': article.imageUrl,
    };
  }

  if (article.keywords && article.keywords.length > 0) {
    schema.keywords = article.keywords.join(', ');
  }

  if (article.wordCount) {
    schema.wordCount = article.wordCount;
  }

  if (article.publisher) {
    schema.publisher = {
      '@type': 'Organization',
      'name': article.publisher.name,
    };

    if (article.publisher.logo) {
      schema.publisher.logo = {
        '@type': 'ImageObject',
        'url': article.publisher.logo,
      };
    }

    if (article.publisher.url) {
      schema.publisher.url = article.publisher.url;
    }
  }

  // Add article sections if content has clear H2 structure
  schema.articleSection = 'Guide';
  schema.inLanguage = 'en-AU';

  return schema;
}

/**
 * Generate HowTo schema for instructional content
 */
export function generateHowToSchema(
  title: string,
  description: string,
  steps: HowToStep[],
  totalTime?: string,
  estimatedCost?: { currency: string; value: string }
): object {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    'name': title,
    'description': description,
    'step': steps.map((step, index) => {
      const stepSchema: any = {
        '@type': 'HowToStep',
        'position': index + 1,
        'name': step.name,
        'text': step.text,
      };

      if (step.image) {
        stepSchema.image = step.image;
      }

      if (step.url) {
        stepSchema.url = step.url;
      }

      if (step.estimatedTime) {
        stepSchema.performTime = step.estimatedTime;
      }

      return stepSchema;
    }),
  };

  if (totalTime) {
    schema.totalTime = totalTime;
  }

  if (estimatedCost) {
    schema.estimatedCost = {
      '@type': 'MonetaryAmount',
      'currency': estimatedCost.currency,
      'value': estimatedCost.value,
    };
  }

  return schema;
}

/**
 * Generate Service schema for service pages
 */
export function generateServiceSchema(service: ServiceInfo): object {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    'name': service.name,
    'description': service.description,
    'provider': {
      '@type': service.provider.type,
      'name': service.provider.name,
    },
  };

  if (service.provider.address) {
    schema.provider.address = {
      '@type': 'PostalAddress',
      ...service.provider.address,
    };
  }

  if (service.areaServed) {
    schema.areaServed = Array.isArray(service.areaServed)
      ? service.areaServed
      : service.areaServed;
  }

  if (service.serviceType) {
    schema.serviceType = service.serviceType;
  }

  if (service.offers) {
    schema.offers = {
      '@type': 'Offer',
      ...service.offers,
    };
  }

  return schema;
}

/**
 * Generate LocalBusiness schema for location-based businesses
 */
export function generateLocalBusinessSchema(
  name: string,
  description: string,
  address: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  },
  telephone?: string,
  email?: string,
  url?: string,
  openingHours?: string[],
  priceRange?: string,
  image?: string
): object {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    'name': name,
    'description': description,
    'address': {
      '@type': 'PostalAddress',
      ...address,
    },
  };

  if (telephone) {
    schema.telephone = telephone;
  }

  if (email) {
    schema.email = email;
  }

  if (url) {
    schema.url = url;
  }

  if (openingHours && openingHours.length > 0) {
    schema.openingHoursSpecification = openingHours.map(hours => ({
      '@type': 'OpeningHoursSpecification',
      'dayOfWeek': hours,
    }));
  }

  if (priceRange) {
    schema.priceRange = priceRange;
  }

  if (image) {
    schema.image = image;
  }

  // Add geo coordinates if available (helps with local search)
  schema.geo = {
    '@type': 'GeoCoordinates',
    'latitude': -27.4705, // Example: Brisbane latitude
    'longitude': 153.0260, // Example: Brisbane longitude
  };

  return schema;
}

/**
 * Generate BreadcrumbList schema for navigation
 */
export function generateBreadcrumbSchema(
  breadcrumbs: Array<{ name: string; url: string }>
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': crumb.name,
      'item': crumb.url,
    })),
  };
}

/**
 * Generate WebPage schema with all relevant sub-schemas
 */
export function generateWebPageSchema(
  title: string,
  description: string,
  url: string,
  datePublished: string,
  dateModified: string,
  author?: PersonInfo,
  breadcrumbs?: Array<{ name: string; url: string }>,
  faqs?: FAQItem[]
): object {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    'name': title,
    'description': description,
    'url': url,
    'datePublished': datePublished,
    'dateModified': dateModified,
    'inLanguage': 'en-AU',
  };

  // Add author if provided
  if (author) {
    schema.author = generatePersonSchema(author);
  }

  // Add breadcrumbs if provided
  if (breadcrumbs && breadcrumbs.length > 0) {
    schema.breadcrumb = generateBreadcrumbSchema(breadcrumbs);
  }

  // Add FAQs if provided
  if (faqs && faqs.length > 0) {
    schema.mainEntity = generateFAQPageSchema(faqs);
  }

  return schema;
}

/**
 * Combine multiple schemas into a graph
 * Use when you need multiple schema types on one page
 */
export function generateSchemaGraph(schemas: object[]): object {
  return {
    '@context': 'https://schema.org',
    '@graph': schemas.map(schema => {
      // Remove @context from individual schemas when combining
      const { '@context': _, ...schemaWithoutContext } = schema as any;
      return schemaWithoutContext;
    }),
  };
}

/**
 * Extract Q&A blocks from markdown content for FAQPage schema
 */
export function extractQAFromMarkdown(markdown: string): FAQItem[] {
  const qaBlocks: FAQItem[] = [];

  // Match H2 headings that are questions
  const h2Regex = /^## (.+\?)$/gm;
  const h2Matches = Array.from(markdown.matchAll(h2Regex));

  h2Matches.forEach((match, index) => {
    const question = match[1].trim();
    const startIndex = match.index! + match[0].length;
    const endIndex = h2Matches[index + 1]?.index || markdown.length;

    // Extract content between this H2 and the next H2
    const content = markdown.substring(startIndex, endIndex).trim();

    // Get the first paragraph as the answer (skip any H3 headings)
    const paragraphs = content.split(/\n\n/).filter(p => !p.startsWith('#'));
    const answer = paragraphs[0]?.trim() || '';

    if (question && answer) {
      qaBlocks.push({ question, answer });
    }
  });

  return qaBlocks;
}

/**
 * Validate schema.org JSON-LD
 */
export function validateSchema(schema: object): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for required @context
  if (!schema['@context']) {
    errors.push('Missing @context property');
  }

  // Check for @type
  if (!schema['@type'] && !schema['@graph']) {
    errors.push('Missing @type property (or @graph for multiple schemas)');
  }

  // Basic structure validation
  try {
    JSON.stringify(schema);
  } catch (e) {
    errors.push('Invalid JSON structure');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate schema script tag for HTML insertion
 */
export function generateSchemaScriptTag(schema: object): string {
  return `<script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
</script>`;
}