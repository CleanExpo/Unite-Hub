/**
 * Competitive Schema Scanner
 * Analyzes competitor websites for schema.org coverage gaps
 * Generates recommendations for overtaking competitors
 */

import { Anthropic } from '@anthropic-ai/sdk';

export interface CompetitorSchemaAnalysis {
  competitorUrl: string;
  analyzedAt: string;

  schemaTypes: string[]; // ["LocalBusiness", "Review", "VideoObject"]
  schemaCount: number; // Total schema.org markup instances
  schemaCoverage: number; // Percentage of pages with schema (0-100)

  contentMetrics: {
    totalPages: number;
    pagesWithSchema: number;
    avgWordsPerPage: number;
    multimediaCount: {
      images: number;
      videos: number;
      total: number;
    };
    internalLinkCount: number;
  };

  subfolderStructure: {
    depth: number; // Max folder depth
    folders: string[];
    estimatedArchitecture: string; // Description of information architecture
  };

  missingSchemas: SchemaGap[];
  opportunities: CompetitorOpportunity[];
  depthScore: number; // 0-100 comparing content depth
  technicalScore: number; // 0-100 for SEO technical implementation

  recommendations: string[];
}

export interface SchemaGap {
  schemaType: string; // "VideoObject", "FAQPage", etc.
  whereCompetitorHasIt: boolean;
  whereWeCouldAdd: string[]; // ["reviews page", "FAQ section"]
  potentialImpact: 'high' | 'medium' | 'low';
  reason: string;
}

export interface CompetitorOpportunity {
  area: string; // "FAQ automation", "Video testimonials", "Local SEO"
  competitorScore: number; // 0-100
  ourCurrentScore: number; // 0-100
  gap: number; // difference
  action: string; // Specific action to close gap
  estimatedImpact: string; // "Could rank for 15+ keywords"
}

/**
 * Scan competitor website for schema.org coverage
 * Uses Claude to analyze HTML structure and schema patterns
 */
export async function analyzeCompetitorSchema(
  competitorUrl: string,
  includeFullPageAnalysis?: boolean
): Promise<CompetitorSchemaAnalysis> {
  const analysisPrompt = buildCompetitorAnalysisPrompt(competitorUrl, includeFullPageAnalysis);

  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 4000,
      thinking: {
        type: 'enabled',
        budget_tokens: 3000,
      },
      messages: [
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
    });

    // Parse Claude's response into structured analysis
    const analysisText = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as any).text)
      .join('\n');

    return parseCompetitorAnalysis(analysisText, competitorUrl);
  } catch (error) {
    console.error('Failed to analyze competitor schema:', error);
    throw error;
  }
}

/**
 * Build prompt for Claude to analyze competitor website
 */
function buildCompetitorAnalysisPrompt(
  competitorUrl: string,
  includeFullPageAnalysis?: boolean
): string {
  return `
Analyze the website at "${competitorUrl}" for schema.org markup coverage and competitive opportunities.

Your analysis should identify:

1. **Schema.org Coverage**
   - What schema types are currently used (LocalBusiness, Review, VideoObject, FAQPage, etc.)
   - Total count of schema.org markup instances
   - Percentage of pages likely to have schema (estimate 0-100)

2. **Content Depth Metrics**
   - Estimated total pages from sitemap or crawlable structure
   - Estimated pages with schema markup
   - Content architecture (subfolder strategy)
   - Multimedia usage (photos, videos, embedded content)
   - Average content length per page

3. **Information Architecture**
   - Folder structure depth (how nested is content)
   - Main content categories
   - Hub-and-spoke patterns (if any)
   - Internal linking strategy (dense or sparse)

4. **Missing Opportunities** (Critical for competitive advantage)
   For each gap, identify:
   - Schema types they DON'T use but should (VideoObject, FAQPage, AggregateRating, etc.)
   - Where they could add it
   - Potential SEO impact (high/medium/low)

5. **Specific Recommendations**
   What should we do that competitors aren't:
   - Video testimonials with VideoObject schema
   - FAQ pages with FAQPage schema
   - Detailed client case studies
   - Regular content updates
   - Rich media (images, videos, transcripts)

Format your response as a JSON object matching this structure:
{
  "schemaTypes": ["LocalBusiness", "Review"],
  "schemaCount": 5,
  "schemaCoverage": 25,
  "contentMetrics": {
    "totalPages": 40,
    "pagesWithSchema": 10,
    "avgWordsPerPage": 600,
    "multimediaCount": { "images": 120, "videos": 3, "total": 123 },
    "internalLinkCount": 180
  },
  "subfolderStructure": {
    "depth": 3,
    "folders": ["services", "blog", "team", "about"],
    "estimatedArchitecture": "Standard marketing site with blog"
  },
  "missingSchemas": [
    {
      "schemaType": "VideoObject",
      "whereCompetitorHasIt": false,
      "whereWeCouldAdd": ["testimonials", "tutorial pages"],
      "potentialImpact": "high",
      "reason": "Video content significantly improves E-E-A-T signals"
    }
  ],
  "opportunities": [
    {
      "area": "Video testimonials",
      "competitorScore": 10,
      "ourCurrentScore": 80,
      "gap": 70,
      "action": "Add 10+ customer video testimonials with VideoObject schema",
      "estimatedImpact": "Could rank for 20+ local service keywords"
    }
  ],
  "depthScore": 45,
  "technicalScore": 60,
  "recommendations": [
    "Add VideoObject schema to all video content",
    "Create FAQPage with 20+ Q&As from customer inquiries",
    "Expand subfolder depth for main services (separate /reviews/, /faq/, /team/)",
    "Implement AggregateRating schema from customer reviews",
    "Add breadcrumb navigation with BreadcrumbList schema"
  ]
}

Provide ONLY the JSON response, no additional text.
${includeFullPageAnalysis ? 'Include detailed page-by-page analysis.' : ''}
`;
}

/**
 * Parse Claude's analysis response into structured CompetitorSchemaAnalysis
 */
function parseCompetitorAnalysis(
  analysisText: string,
  competitorUrl: string
): CompetitorSchemaAnalysis {
  try {
    const data = JSON.parse(analysisText);

    return {
      competitorUrl,
      analyzedAt: new Date().toISOString(),
      schemaTypes: data.schemaTypes || [],
      schemaCount: data.schemaCount || 0,
      schemaCoverage: data.schemaCoverage || 0,
      contentMetrics: data.contentMetrics || {
        totalPages: 0,
        pagesWithSchema: 0,
        avgWordsPerPage: 0,
        multimediaCount: { images: 0, videos: 0, total: 0 },
        internalLinkCount: 0,
      },
      subfolderStructure: data.subfolderStructure || {
        depth: 0,
        folders: [],
        estimatedArchitecture: '',
      },
      missingSchemas: data.missingSchemas || [],
      opportunities: data.opportunities || [],
      depthScore: data.depthScore || 0,
      technicalScore: data.technicalScore || 0,
      recommendations: data.recommendations || [],
    };
  } catch (error) {
    console.error('Failed to parse competitor analysis:', error);
    throw new Error(`Invalid competitor analysis response: ${analysisText.substring(0, 200)}`);
  }
}

/**
 * Compare our schema coverage vs competitor
 * Used in dashboard to show competitive positioning
 */
export function generateCompetitiveComparison(
  competitorAnalysis: CompetitorSchemaAnalysis,
  ourMetrics: {
    schemaTypes: string[];
    schemaCoverage: number;
    contentMetrics: CompetitorSchemaAnalysis['contentMetrics'];
    depthScore: number;
    technicalScore: number;
  }
): CompetitiveComparison {
  const schemaGap = ourMetrics.schemaCoverage - competitorAnalysis.schemaCoverage;
  const depthGap = ourMetrics.depthScore - competitorAnalysis.depthScore;
  const technicalGap = ourMetrics.technicalScore - competitorAnalysis.technicalScore;

  const areWeAhead = schemaGap > 0 && depthGap > 0;

  return {
    competitor: competitorAnalysis.competitorUrl,
    areWeAhead,
    metrics: {
      schemaCoverage: {
        ours: ourMetrics.schemaCoverage,
        theirs: competitorAnalysis.schemaCoverage,
        gap: schemaGap,
        advantage: schemaGap > 0 ? 'us' : 'them',
      },
      depthScore: {
        ours: ourMetrics.depthScore,
        theirs: competitorAnalysis.depthScore,
        gap: depthGap,
        advantage: depthGap > 0 ? 'us' : 'them',
      },
      technicalScore: {
        ours: ourMetrics.technicalScore,
        theirs: competitorAnalysis.technicalScore,
        gap: technicalGap,
        advantage: technicalGap > 0 ? 'us' : 'them',
      },
      contentPages: {
        ours: ourMetrics.contentMetrics.totalPages,
        theirs: competitorAnalysis.contentMetrics.totalPages,
        gap: ourMetrics.contentMetrics.totalPages - competitorAnalysis.contentMetrics.totalPages,
      },
    },
    topOpportunities: competitorAnalysis.opportunities.slice(0, 3),
    actionItems: generateActionItems(competitorAnalysis),
  };
}

export interface CompetitiveComparison {
  competitor: string;
  areWeAhead: boolean;
  metrics: {
    schemaCoverage: { ours: number; theirs: number; gap: number; advantage: 'us' | 'them' };
    depthScore: { ours: number; theirs: number; gap: number; advantage: 'us' | 'them' };
    technicalScore: { ours: number; theirs: number; gap: number; advantage: 'us' | 'them' };
    contentPages: { ours: number; theirs: number; gap: number };
  };
  topOpportunities: CompetitorOpportunity[];
  actionItems: ActionItem[];
}

export interface ActionItem {
  priority: 'high' | 'medium' | 'low';
  action: string;
  estimatedImpact: string;
  timeline: string;
}

/**
 * Generate prioritized action items from competitive analysis
 */
function generateActionItems(analysis: CompetitorSchemaAnalysis): ActionItem[] {
  const items: ActionItem[] = [];

  // High-impact gaps with missing schema
  const highImpactGaps = analysis.missingSchemas.filter((g) => g.potentialImpact === 'high');
  highImpactGaps.forEach((gap) => {
    items.push({
      priority: 'high',
      action: `Add ${gap.schemaType} schema to ${gap.whereWeCouldAdd.join(', ')}`,
      estimatedImpact: gap.reason,
      timeline: '1-2 weeks',
    });
  });

  // Medium-impact opportunities
  analysis.opportunities.filter((o) => o.gap > 30).forEach((opp) => {
    items.push({
      priority: opp.gap > 50 ? 'high' : 'medium',
      action: opp.action,
      estimatedImpact: opp.estimatedImpact,
      timeline: opp.gap > 50 ? '2-3 weeks' : '3-4 weeks',
    });
  });

  // Sort by priority
  return items.sort((a, b) => {
    const priorityMap = { high: 0, medium: 1, low: 2 };
    return priorityMap[a.priority] - priorityMap[b.priority];
  });
}

/**
 * Track competitor analysis over time
 * Store in database for trend analysis
 */
export interface CompetitorAnalysisHistory {
  id: string;
  workspace_id: string;
  competitor_url: string;
  analysis: CompetitorSchemaAnalysis;
  created_at: string;
  updated_at: string;
}

/**
 * Batch analyze multiple competitors
 */
export async function analyzeMultipleCompetitors(
  competitorUrls: string[]
): Promise<CompetitorSchemaAnalysis[]> {
  return Promise.all(competitorUrls.map((url) => analyzeCompetitorSchema(url)));
}

/**
 * Generate summary report across all competitors
 */
export function generateCompetitiveIntelligenceReport(
  analyses: CompetitorSchemaAnalysis[]
): CompetitiveIntelligenceReport {
  const avgSchemaCoverage =
    analyses.reduce((sum, a) => sum + a.schemaCoverage, 0) / analyses.length;
  const avgDepthScore = analyses.reduce((sum, a) => sum + a.depthScore, 0) / analyses.length;
  const avgTechnicalScore =
    analyses.reduce((sum, a) => sum + a.technicalScore, 0) / analyses.length;

  // Aggregate all missed opportunities
  const allOpportunities = analyses.flatMap((a) => a.opportunities);
  const topOpportunities = allOpportunities
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 5);

  // Most common missing schemas
  const missingSchemaFrequency: Record<string, number> = {};
  analyses.forEach((a) => {
    a.missingSchemas.forEach((gap) => {
      missingSchemaFrequency[gap.schemaType] =
        (missingSchemaFrequency[gap.schemaType] || 0) + 1;
    });
  });

  const commonMissingSchemas = Object.entries(missingSchemaFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([schema, count]) => ({ schema, frequency: count }));

  return {
    competitorCount: analyses.length,
    generatedAt: new Date().toISOString(),
    avgMetrics: {
      schemaCoverage: Math.round(avgSchemaCoverage),
      depthScore: Math.round(avgDepthScore),
      technicalScore: Math.round(avgTechnicalScore),
    },
    topOpportunities,
    commonMissingSchemas,
    strategyRecommendation: generateStrategyRecommendation(
      avgSchemaCoverage,
      avgDepthScore,
      commonMissingSchemas
    ),
  };
}

export interface CompetitiveIntelligenceReport {
  competitorCount: number;
  generatedAt: string;
  avgMetrics: {
    schemaCoverage: number;
    depthScore: number;
    technicalScore: number;
  };
  topOpportunities: CompetitorOpportunity[];
  commonMissingSchemas: Array<{ schema: string; frequency: number }>;
  strategyRecommendation: string;
}

function generateStrategyRecommendation(
  avgSchemaCoverage: number,
  avgDepthScore: number,
  missingSchemas: Array<{ schema: string; frequency: number }>
): string {
  const recommendations: string[] = [];

  if (avgSchemaCoverage < 50) {
    recommendations.push(
      'Competitors have weak schema coverage. Focus on complete schema.org implementation across all pages.'
    );
  }

  if (avgDepthScore < 40) {
    recommendations.push('Competitors lack content depth. Create 2x more pages than competitors.');
  }

  if (missingSchemas.length > 0 && missingSchemas[0].frequency > 0) {
    recommendations.push(
      `${missingSchemas[0].schema} is missing from most competitors. This is a high-impact opportunity.`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('Competitors are well-optimized. Focus on unique content differentiation.');
  }

  return recommendations.join(' ');
}
