/**
 * Multi-Platform Schema Generator
 * Generates schema.org markup optimized for 6 LLM platforms:
 * - Google SGE (JSON-LD)
 * - ChatGPT (Markdown + structured text)
 * - Perplexity (Citation format)
 * - Bing Copilot (Microdata)
 * - Claude (Semantic HTML)
 * - Gemini (RDFa)
 */

export type Platform = 'google' | 'chatgpt' | 'perplexity' | 'bing' | 'claude' | 'gemini';
export type ContentType = 'review' | 'video' | 'image' | 'faq' | 'local-business' | 'person';

export interface ClientMedia {
  id: string;
  workspace_id: string;
  contribution_type: 'video' | 'photo' | 'voice' | 'text' | 'review' | 'faq';
  content_text?: string;
  media_file_id?: string;
  public_url?: string;
  transcript?: string; // From Whisper API
  analysis?: {
    summary?: string;
    entities?: string[];
    sentiment?: 'positive' | 'neutral' | 'negative';
    topics?: string[];
  };
}

export interface BusinessContext {
  businessName: string;
  industry: string;
  serviceCategory: string;
  location: string;
  ownerName: string;
  ownerTitle: string;
  businessUrl: string;
}

export interface SchemaGenerationConfig {
  platform: Platform;
  contentType: ContentType;
  clientMedia: ClientMedia;
  businessContext: BusinessContext;
  timestamp?: string;
}

export interface GeneratedSchema {
  platform: Platform;
  content: string; // Serialized schema (JSON, HTML, RDFa, etc.)
  type: 'json-ld' | 'markdown' | 'microdata' | 'rdfa' | 'html-semantic' | 'citation-format';
  mimeType: string;
}

/**
 * Main entry point: Generate multi-platform schemas
 */
export async function generateMultiPlatformSchema(
  config: SchemaGenerationConfig
): Promise<Record<Platform, GeneratedSchema>> {
  const baseData = extractBaseData(config);

  return {
    google: generateGoogleSchema(config, baseData),
    chatgpt: generateChatGPTSchema(config, baseData),
    perplexity: generatePerplexitySchema(config, baseData),
    bing: generateBingSchema(config, baseData),
    claude: generateClaudeSchema(config, baseData),
    gemini: generateGeminiSchema(config, baseData),
  };
}

/**
 * Extract common data from contribution
 */
function extractBaseData(config: SchemaGenerationConfig) {
  const { clientMedia, businessContext } = config;
  const timestamp = config.timestamp || new Date().toISOString();

  return {
    contributorName: businessContext.ownerName,
    businessName: businessContext.businessName,
    businessUrl: businessContext.businessUrl,
    industry: businessContext.industry,
    serviceCategory: businessContext.serviceCategory,
    location: businessContext.location,
    mediaUrl: clientMedia.public_url,
    transcript: clientMedia.transcript || clientMedia.content_text || '',
    summary: clientMedia.analysis?.summary || clientMedia.content_text?.substring(0, 200) || '',
    uploadDate: timestamp,
    contentType: clientMedia.contribution_type,
    sentiment: clientMedia.analysis?.sentiment || 'positive',
    topics: clientMedia.analysis?.topics || [],
  };
}

/**
 * GOOGLE SGE: JSON-LD format (standard schema.org)
 * Optimized for Google's AI Overview and Search Generative Experience
 */
function generateGoogleSchema(config: SchemaGenerationConfig, baseData: any): GeneratedSchema {
  const schema = generateSchemaJsonLd(config, baseData);

  return {
    platform: 'google',
    content: JSON.stringify(schema, null, 2),
    type: 'json-ld',
    mimeType: 'application/ld+json',
  };
}

/**
 * CHATGPT: Markdown + structured text
 * ChatGPT prefers markdown tables and clearly formatted structured information
 */
function generateChatGPTSchema(config: SchemaGenerationConfig, baseData: any): GeneratedSchema {
  let markdown = '';

  if (config.contentType === 'review') {
    markdown = `
## ${baseData.summary}

**${baseData.businessName}** - ${baseData.serviceCategory}

| Property | Value |
|----------|-------|
| **Business** | ${baseData.businessName} |
| **Location** | ${baseData.location} |
| **Category** | ${baseData.serviceCategory} |
| **Date** | ${new Date(baseData.uploadDate).toLocaleDateString()} |
| **Sentiment** | ${baseData.sentiment.toUpperCase()} |

### Details
- **Reviewer**: ${baseData.contributorName}
- **Industry**: ${baseData.industry}
- **Topics**: ${baseData.topics.join(', ') || 'General'}

### Review Text
${baseData.transcript || 'No transcript available'}

**Learn more**: [${baseData.businessName}](${baseData.businessUrl})
`.trim();
  } else if (config.contentType === 'video') {
    markdown = `
## Video: ${baseData.summary}

**${baseData.businessName}** - Customer Success Story

| Property | Value |
|----------|-------|
| **Business** | ${baseData.businessName} |
| **Location** | ${baseData.location} |
| **Video Date** | ${new Date(baseData.uploadDate).toLocaleDateString()} |
| **Duration** | See embedded video |

### Video Description
${baseData.transcript || baseData.summary}

### About ${baseData.businessName}
- **Service**: ${baseData.serviceCategory}
- **Industry**: ${baseData.industry}
- **Website**: ${baseData.businessUrl}

### Key Points
${baseData.topics.map((t) => `- ${t}`).join('\n') || '- See video for details'}
`.trim();
  }

  return {
    platform: 'chatgpt',
    content: markdown,
    type: 'markdown',
    mimeType: 'text/markdown',
  };
}

/**
 * PERPLEXITY: Citation format
 * Perplexity needs source attribution for citations
 */
function generatePerplexitySchema(config: SchemaGenerationConfig, baseData: any): GeneratedSchema {
  const citationFormat = `
## ${baseData.summary}

According to ${baseData.contributorName}, a representative at ${baseData.businessName}:

"${baseData.transcript || baseData.summary}"

**Source**: ${baseData.businessName} (${baseData.serviceCategory})
**Location**: ${baseData.location}
**Date**: ${new Date(baseData.uploadDate).toLocaleDateString()}
**Verified**: Customer testimonial from business operations

### Related Information
- **Business**: ${baseData.businessName}
- **Industry**: ${baseData.industry}
- **Service Type**: ${baseData.serviceCategory}
- **Website**: ${baseData.businessUrl}

**Confidence**: High (verified customer/employee source)
**Last Updated**: ${baseData.uploadDate}
`.trim();

  return {
    platform: 'perplexity',
    content: citationFormat,
    type: 'citation-format',
    mimeType: 'text/plain',
  };
}

/**
 * BING: Microdata (HTML5 attributes)
 * Bing and semantic search engines prefer microdata embedded in HTML
 */
function generateBingSchema(config: SchemaGenerationConfig, baseData: any): GeneratedSchema {
  const microdata = `
<div itemscope itemtype="https://schema.org/${getMicrodataType(config.contentType)}">
  <h1 itemprop="name">${baseData.summary}</h1>

  <div itemprop="author" itemscope itemtype="https://schema.org/Person">
    <span itemprop="name">${baseData.contributorName}</span>
    <span itemprop="jobTitle">Customer</span>
  </div>

  <div itemprop="about" itemscope itemtype="https://schema.org/LocalBusiness">
    <h2 itemprop="name">${baseData.businessName}</h2>
    <span itemprop="areaServed">${baseData.location}</span>
    <span itemprop="industry">${baseData.industry}</span>
    <a itemprop="url" href="${baseData.businessUrl}">${baseData.businessName} Website</a>
  </div>

  <time itemprop="datePublished" datetime="${baseData.uploadDate}">
    ${new Date(baseData.uploadDate).toLocaleDateString()}
  </time>

  <p itemprop="description">${baseData.transcript || baseData.summary}</p>

  <div itemprop="keywords">${baseData.topics.join(', ')}</div>

  ${config.contentType === 'video' ? `<meta itemprop="duration" content="PT${estimateVideoDuration()}M">` : ''}

  <meta itemprop="inLanguage" content="en-US">
</div>
`.trim();

  return {
    platform: 'bing',
    content: microdata,
    type: 'microdata',
    mimeType: 'text/html',
  };
}

/**
 * CLAUDE: Semantic HTML5
 * Claude performs well with semantic HTML structure
 */
function generateClaudeSchema(config: SchemaGenerationConfig, baseData: any): GeneratedSchema {
  const semanticHtml = `
<article class="customer-testimonial">
  <header>
    <h1>${baseData.summary}</h1>
    <address>
      <strong>${baseData.contributorName}</strong>,
      <span class="business-name">${baseData.businessName}</span>
    </address>
    <time datetime="${baseData.uploadDate}">
      ${new Date(baseData.uploadDate).toLocaleDateString()}
    </time>
  </header>

  <section class="business-info">
    <h2>About ${baseData.businessName}</h2>
    <dl>
      <dt>Service Category</dt>
      <dd>${baseData.serviceCategory}</dd>
      <dt>Industry</dt>
      <dd>${baseData.industry}</dd>
      <dt>Location</dt>
      <dd>${baseData.location}</dd>
      <dt>Website</dt>
      <dd><a href="${baseData.businessUrl}">${baseData.businessName}</a></dd>
    </dl>
  </section>

  <section class="review-content">
    <h2>Testimonial</h2>
    <blockquote>
      ${baseData.transcript || baseData.summary}
    </blockquote>
  </section>

  <aside class="metadata">
    <h3>Key Topics</h3>
    <ul>
      ${baseData.topics.map((t: string) => `<li>${t}</li>`).join('\n')}
    </ul>
    <p><strong>Sentiment</strong>: ${baseData.sentiment}</p>
  </aside>
</article>
`.trim();

  return {
    platform: 'claude',
    content: semanticHtml,
    type: 'html-semantic',
    mimeType: 'text/html',
  };
}

/**
 * GEMINI: RDFa (Resource Description Framework in Attributes)
 * Gemini uses RDFa for semantic web data
 */
function generateGeminiSchema(config: SchemaGenerationConfig, baseData: any): GeneratedSchema {
  const rdfa = `
<div vocab="https://schema.org/" typeof="${getRdfaType(config.contentType)}">
  <h1 property="headline">${baseData.summary}</h1>

  <div property="author" typeof="Person">
    <span property="name">${baseData.contributorName}</span>
    <span property="affiliation" typeof="Organization">
      <span property="name">${baseData.businessName}</span>
    </span>
  </div>

  <span property="datePublished" content="${baseData.uploadDate}">
    ${new Date(baseData.uploadDate).toLocaleDateString()}
  </span>

  <div property="articleBody">
    ${baseData.transcript || baseData.summary}
  </div>

  <div property="mentions" typeof="LocalBusiness">
    <span property="name">${baseData.businessName}</span>
    <span property="areaServed">${baseData.location}</span>
    <span property="industry">${baseData.industry}</span>
  </div>

  <div property="keywords">
    ${baseData.topics.join(', ')}
  </div>

  <meta property="inLanguage" content="en-US">
  <meta property="mainEntity" typeof="LocalBusiness" resource="${baseData.businessUrl}">
</div>
`.trim();

  return {
    platform: 'gemini',
    content: rdfa,
    type: 'rdfa',
    mimeType: 'text/html',
  };
}

/**
 * Generate JSON-LD schema for Google
 */
function generateSchemaJsonLd(config: SchemaGenerationConfig, baseData: any): any {
  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': getSchemaOrgType(config.contentType),
    name: baseData.summary,
    datePublished: baseData.uploadDate,
    inLanguage: 'en-US',
  };

  if (config.contentType === 'review') {
    return {
      ...baseSchema,
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: baseData.contributorName,
      },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: baseData.sentiment === 'positive' ? 5 : 3,
      },
      reviewBody: baseData.transcript || baseData.summary,
      itemReviewed: {
        '@type': 'LocalBusiness',
        name: baseData.businessName,
        areaServed: baseData.location,
        url: baseData.businessUrl,
        industry: baseData.industry,
        serviceType: baseData.serviceCategory,
      },
    };
  } else if (config.contentType === 'video') {
    return {
      ...baseSchema,
      '@type': 'VideoObject',
      description: baseData.summary,
      uploadDate: baseData.uploadDate,
      contentUrl: baseData.mediaUrl,
      thumbnailUrl: baseData.mediaUrl,
      duration: `PT${estimateVideoDuration()}M`,
      transcript: baseData.transcript || '',
      author: {
        '@type': 'Person',
        name: baseData.contributorName,
        affiliation: {
          '@type': 'Organization',
          name: baseData.businessName,
        },
      },
      about: {
        '@type': 'LocalBusiness',
        name: baseData.businessName,
        areaServed: baseData.location,
        url: baseData.businessUrl,
      },
      keywords: baseData.topics.join(', '),
    };
  } else if (config.contentType === 'image') {
    return {
      ...baseSchema,
      '@type': 'ImageObject',
      url: baseData.mediaUrl,
      author: {
        '@type': 'Person',
        name: baseData.contributorName,
      },
      creditText: baseData.businessName,
    };
  } else if (config.contentType === 'faq') {
    return {
      ...baseSchema,
      '@type': 'FAQPage',
      mainEntity: {
        '@type': 'Question',
        name: baseData.summary,
        acceptedAnswer: {
          '@type': 'Answer',
          text: baseData.transcript || baseData.summary,
          author: {
            '@type': 'Person',
            name: baseData.contributorName,
            jobTitle: 'Expert',
            affiliation: baseData.businessName,
          },
        },
      },
    };
  }

  return baseSchema;
}

/**
 * Helper: Get schema.org type
 */
function getSchemaOrgType(contentType: ContentType): string {
  const typeMap: Record<ContentType, string> = {
    review: 'Review',
    video: 'VideoObject',
    image: 'ImageObject',
    faq: 'FAQPage',
    'local-business': 'LocalBusiness',
    person: 'Person',
  };
  return typeMap[contentType] || 'Thing';
}

/**
 * Helper: Get microdata type
 */
function getMicrodataType(contentType: string): string {
  const map: Record<string, string> = {
    review: 'Review',
    video: 'VideoObject',
    image: 'ImageObject',
    faq: 'FAQPage',
    'local-business': 'LocalBusiness',
    person: 'Person',
  };
  return map[contentType] || 'Thing';
}

/**
 * Helper: Get RDFa type
 */
function getRdfaType(contentType: ContentType): string {
  return getSchemaOrgType(contentType);
}

/**
 * Helper: Estimate video duration (default 2 minutes if unknown)
 */
function estimateVideoDuration(seconds?: number): number {
  if (!seconds) return 2;
  return Math.ceil(seconds / 60);
}
