/**
 * ATO Schema Components — UNI-799
 *
 * Renders JSON-LD structured data for ATO Tax Optimizer.
 * Includes SoftwareApplication, FinancialProduct, and Organization schemas.
 *
 * Note: JSON-LD structured data is static/trusted per Schema.org spec;
 * dangerouslySetInnerHTML is safe for this use case.
 */

const ATO_URL = 'https://ato-ai.app';
const UNITE_URL = 'https://unite-group.in';

interface AtoSchemasProps {
  /** Include FAQPage schema inline (default: false — import and embed faqSchema directly) */
  includeFaq?: boolean;
  faqSchema?: Record<string, unknown>;
  /** Include HowTo schema inline */
  includeHowTo?: boolean;
  howToSchema?: Record<string, unknown>;
}

/**
 * SoftwareApplication schema for ATO Tax Optimizer.
 */
function SoftwareApplicationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${ATO_URL}/#software`,
    name: 'ATO Tax Optimizer',
    applicationCategory: 'FinanceApplication',
    applicationSubCategory: 'Tax Analysis Software',
    operatingSystem: 'Web Browser',
    url: ATO_URL,
    description:
      'AI-powered forensic Xero analysis platform that recovers missed Australian tax benefits — R&D Tax Incentive, Division 7A compliance, FBT optimisation, and unclaimed deductions.',
    offers: {
      '@type': 'Offer',
      priceCurrency: 'AUD',
      price: '0',
      name: 'Free Trial',
      description: 'One full forensic analysis included in the free trial.',
      availability: 'https://schema.org/InStock',
    },
    featureList: [
      'R&D Tax Incentive analysis',
      'Division 7A compliance checking',
      'Xero OAuth 2.0 integration (read-only)',
      'PDF and Excel report export',
      'Forensic Xero data analysis',
      'FBT optimisation recommendations',
      'Unclaimed deductions discovery',
      'ATO legislative reference linking',
    ],
    softwareVersion: '1.0',
    inLanguage: 'en-AU',
    provider: {
      '@type': 'Organization',
      name: 'Unite Group',
      url: UNITE_URL,
    },
    audience: {
      '@type': 'BusinessAudience',
      audienceType: 'Australian SMEs, accountants, tax agents',
      geographicArea: {
        '@type': 'Country',
        name: 'Australia',
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * FinancialProduct schema for ATO Tax Optimizer.
 */
function FinancialProductSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FinancialProduct',
    '@id': `${ATO_URL}/#financial-product`,
    name: 'ATO Tax Optimizer',
    description:
      'AI-powered forensic Xero analysis to recover missed Australian tax benefits for SMEs. Covers R&D Tax Incentive (43.5% refundable offset), Division 7A compliance, FBT optimisation, and carry-forward losses.',
    url: ATO_URL,
    feesAndCommissionsSpecification: 'Free trial includes one full forensic analysis run.',
    areaServed: {
      '@type': 'Country',
      name: 'Australia',
    },
    audience: {
      '@type': 'BusinessAudience',
      audienceType: 'Australian SMEs, accountants, tax agents',
      geographicArea: {
        '@type': 'Country',
        name: 'Australia',
      },
    },
    provider: {
      '@type': 'Organization',
      name: 'Unite Group',
      url: UNITE_URL,
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'AUD',
      price: '0',
      name: 'Free Trial',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Organization schema for Unite Group with ATO Tax Optimizer sameAs.
 */
function UniteGroupOrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${UNITE_URL}/#organization`,
    name: 'Unite Group',
    url: UNITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${UNITE_URL}/logos/unite-hub-logo.png`,
      width: 200,
      height: 60,
    },
    description:
      'Unite Group builds AI-powered business tools for Australian SMEs — including Unite-Group CRM and ATO Tax Optimizer.',
    foundingDate: '2024',
    areaServed: {
      '@type': 'Country',
      name: 'Australia',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@unite-group.in',
      contactType: 'Customer Support',
      areaServed: 'AU',
      availableLanguage: 'English',
    },
    sameAs: [
      ATO_URL,
      'https://www.linkedin.com/company/unite-group',
      'https://twitter.com/unitegroup',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * AtoSchemas — renders all three ATO Tax Optimizer JSON-LD schemas.
 *
 * Optionally also renders FAQPage and/or HowTo schemas when provided.
 *
 * Usage:
 * ```tsx
 * import faqSchema from '@/content/seo/ato-faq-schema.json';
 * import howToSchema from '@/content/seo/ato-howto-schema.json';
 *
 * <AtoSchemas includeFaq faqSchema={faqSchema} includeHowTo howToSchema={howToSchema} />
 * ```
 */
export function AtoSchemas({
  includeFaq = false,
  faqSchema,
  includeHowTo = false,
  howToSchema,
}: AtoSchemasProps) {
  return (
    <>
      <SoftwareApplicationSchema />
      <FinancialProductSchema />
      <UniteGroupOrganizationSchema />

      {includeFaq && faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      {includeHowTo && howToSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
        />
      )}
    </>
  );
}
