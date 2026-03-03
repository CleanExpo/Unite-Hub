/**
 * Schema / Rich Results API Route (Stub)
 * GET /api/seo-enhancement/schema?url=https://example.com&type=LocalBusiness
 * POST - Generate schema markup (returns stub data)
 */

import { NextRequest, NextResponse } from 'next/server';

type SchemaType = 'LocalBusiness' | 'Article' | 'Product' | 'FAQPage' | 'HowTo' | 'BreadcrumbList' | 'Organization' | 'WebSite';

interface SchemaResult {
  id: string;
  url: string;
  schema_type: SchemaType;
  schema_json: Record<string, unknown>;
  script_tag: string;
  validation_status: string;
  validation_errors: { field: string; message: string; severity: string }[];
  validation_warnings: { field: string; message: string; severity: string }[];
  rich_result_eligible: boolean;
  rich_result_types: string[];
  opportunity_score: number;
  created_at: string;
}

function generateStubSchema(url: string, type: SchemaType): SchemaResult {
  const domain = new URL(url).hostname;

  const schemaJson: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': type,
  };

  switch (type) {
    case 'LocalBusiness':
      Object.assign(schemaJson, {
        name: `${domain} Business`,
        description: `Local business services provided by ${domain}`,
        url,
        telephone: '+61-2-1234-5678',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '123 Main Street',
          addressLocality: 'Sydney',
          addressRegion: 'NSW',
          postalCode: '2000',
          addressCountry: 'AU',
        },
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            opens: '09:00',
            closes: '17:00',
          },
        ],
      });
      break;
    case 'Article':
      Object.assign(schemaJson, {
        headline: 'Sample Article Headline',
        author: { '@type': 'Person', name: 'Author Name' },
        datePublished: '2026-01-15',
        dateModified: '2026-03-01',
        publisher: {
          '@type': 'Organization',
          name: domain,
          logo: { '@type': 'ImageObject', url: `${url}/logo.png` },
        },
        mainEntityOfPage: url,
      });
      break;
    case 'Product':
      Object.assign(schemaJson, {
        name: 'Sample Product',
        description: 'A high-quality product with great reviews.',
        brand: { '@type': 'Brand', name: domain },
        offers: {
          '@type': 'Offer',
          price: '49.99',
          priceCurrency: 'AUD',
          availability: 'https://schema.org/InStock',
          url,
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.5',
          reviewCount: '127',
        },
      });
      break;
    case 'FAQPage':
      Object.assign(schemaJson, {
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What services do you offer?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'We offer a wide range of digital marketing and SEO services.',
            },
          },
          {
            '@type': 'Question',
            name: 'How much does it cost?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Pricing varies by project scope. Contact us for a free quote.',
            },
          },
        ],
      });
      break;
    default:
      Object.assign(schemaJson, {
        name: domain,
        url,
        description: `Schema markup for ${domain}`,
      });
  }

  const scriptTag = `<script type="application/ld+json">\n${JSON.stringify(schemaJson, null, 2)}\n</script>`;

  return {
    id: 'schema_' + Date.now().toString(36),
    url,
    schema_type: type,
    schema_json: schemaJson,
    script_tag: scriptTag,
    validation_status: 'valid',
    validation_errors: [],
    validation_warnings: [
      {
        field: 'image',
        message: 'Adding an image property is recommended for better rich results.',
        severity: 'warning',
      },
    ],
    rich_result_eligible: true,
    rich_result_types: type === 'FAQPage' ? ['FAQ Rich Result'] : type === 'Product' ? ['Product Rich Result', 'Review Snippet'] : ['Knowledge Panel'],
    opportunity_score: 82,
    created_at: new Date().toISOString(),
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');
    const type = (searchParams.get('type') || 'LocalBusiness') as SchemaType;

    if (!url) {
      return NextResponse.json(
        { error: 'url query parameter is required. Usage: /api/seo-enhancement/schema?url=https://example.com&type=LocalBusiness' },
        { status: 400 }
      );
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format. Provide a full URL including protocol.' },
        { status: 400 }
      );
    }

    const result = generateStubSchema(url, type);

    return NextResponse.json({
      success: true,
      data: result,
      _stub: true,
      _message: 'This is placeholder schema. Connect API credentials for AI-generated schema markup.',
    });
  } catch (error) {
    console.error('[API] Schema GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, schemaType } = body;

    if (!url || !schemaType) {
      return NextResponse.json(
        { error: 'url and schemaType are required in request body' },
        { status: 400 }
      );
    }

    const result = generateStubSchema(url, schemaType as SchemaType);

    return NextResponse.json({
      success: true,
      data: result,
      _stub: true,
      _message: 'Schema generated (stub). Connect API credentials for AI-powered generation.',
    });
  } catch (error) {
    console.error('[API] Schema POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
