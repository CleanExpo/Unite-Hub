export interface OrganizationSchema {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  url: string;
  logo: string;
  description?: string;
  address?: {
    '@type': 'PostalAddress';
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  contactPoint?: {
    '@type': 'ContactPoint';
    telephone: string;
    contactType: string;
    availableLanguage?: string[];
  };
  sameAs?: string[];
}

export interface WebPageSchema {
  '@context': 'https://schema.org';
  '@type': 'WebPage';
  name: string;
  description: string;
  url: string;
  breadcrumb?: {
    '@type': 'BreadcrumbList';
    itemListElement: Array<{
      '@type': 'ListItem';
      position: number;
      name: string;
      item?: string;
    }>;
  };
}

export interface ServiceSchema {
  '@context': 'https://schema.org';
  '@type': 'Service';
  name: string;
  description: string;
  provider: {
    '@type': 'Organization';
    name: string;
  };
  areaServed?: string;
  serviceType?: string;
  offers?: {
    '@type': 'Offer';
    price?: string;
    priceCurrency?: string;
  };
}

export interface FAQSchema {
  '@context': 'https://schema.org';
  '@type': 'FAQPage';
  mainEntity: Array<{
    '@type': 'Question';
    name: string;
    acceptedAnswer: {
      '@type': 'Answer';
      text: string;
    };
  }>;
}

export function generateOrganizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Unite Group',
    url: 'https://unitegroup.com.au',
    logo: 'https://unitegroup.com.au/images/unite-logo.png',
    description: 'Australia\'s premier business solutions partner offering consultation, software development, strategic SEO, and expert education.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Brisbane',
      addressRegion: 'QLD',
      addressCountry: 'AU'
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+61-7-3000-0000',
      contactType: 'customer service',
      availableLanguage: ['English', 'Spanish', 'French']
    },
    sameAs: [
      'https://www.linkedin.com/company/unite-group-au',
      'https://twitter.com/unitegroup_au',
      'https://www.facebook.com/unitegroupau'
    ]
  };
}

export function generateServiceSchema(service: {
  name: string;
  description: string;
  price?: string;
  serviceType?: string;
}): ServiceSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    provider: {
      '@type': 'Organization',
      name: 'Unite Group'
    },
    areaServed: 'Australia',
    serviceType: service.serviceType,
    offers: service.price ? {
      '@type': 'Offer',
      price: service.price,
      priceCurrency: 'AUD'
    } : undefined
  };
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url?: string }>): WebPageSchema['breadcrumb'] {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>): FAQSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}
