/**
 * Content Synthesis
 *
 * Synthesizes research insights into narrative and supporting content.
 * Integrates findings from research agent with content generation.
 *
 * Used by: Content agent for research-informed content creation
 */

export interface ResearchInsight {
  source: string;
  insight: string;
  confidence: number;
  threat_level?: string;
  themes?: string[];
}

export interface SynthesisResult {
  narrative: string;
  keyPoints: string[];
  dataPoints: string[];
  quotes: string[];
  themes: string[];
  confidence: number;
}

/**
 * Synthesize research insights into narrative
 */
export function synthesizeInsights(insights: ResearchInsight[]): SynthesisResult {
  if (insights.length === 0) {
    return {
      narrative: '',
      keyPoints: [],
      dataPoints: [],
      quotes: [],
      themes: [],
      confidence: 0,
    };
  }

  // Extract key points from high-confidence insights
  const highConfidenceInsights = insights.filter(i => i.confidence >= 0.7);
  const keyPoints = highConfidenceInsights.map(i => capitalizeFirst(i.insight));

  // Extract data points and statistics
  const dataPoints = extractDataPoints(insights);

  // Build narrative
  const narrative = buildNarrative(insights, keyPoints);

  // Extract themes
  const themes = extractThemes(insights);

  // Generate quotes/callouts
  const quotes = generateQuotes(insights);

  // Calculate overall confidence
  const confidence =
    insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length;

  return {
    narrative,
    keyPoints,
    dataPoints,
    quotes,
    themes,
    confidence,
  };
}

/**
 * Build narrative from insights
 */
function buildNarrative(insights: ResearchInsight[], keyPoints: string[]): string {
  const parts: string[] = [];

  // Opening
  parts.push(`Based on current market research, ${keyPoints[0]?.toLowerCase() || 'there are important developments'}.`);

  // Body - expand on key points
  for (let i = 0; i < Math.min(keyPoints.length, 3); i++) {
    const insight = insights[i];
    if (insight) {
      const confidence = insight.confidence > 0.85 ? 'strong evidence' :
                        insight.confidence > 0.7 ? 'consistent findings' : 'emerging data';
      parts.push(`${confidence} shows that ${insight.insight.toLowerCase()}`);
    }
  }

  // Closing
  if (insights.some(i => i.threat_level === 'high')) {
    parts.push('These developments suggest significant opportunities and challenges ahead.');
  } else {
    parts.push('Understanding these trends is critical for strategic planning.');
  }

  return parts.join(' ');
}

/**
 * Extract data points and statistics
 */
function extractDataPoints(insights: ResearchInsight[]): string[] {
  const dataPoints: string[] = [];

  for (const insight of insights) {
    // Look for percentages
    const percentMatches = insight.insight.match(/\d+%/g);
    if (percentMatches) {
      dataPoints.push(...percentMatches.map(p => `${p} metric`));
    }

    // Look for numbers
    const numberMatches = insight.insight.match(/\d+(?:\.\d+)?[KMBT]?/g);
    if (numberMatches && numberMatches.length > 0) {
      dataPoints.push(numberMatches[0]);
    }

    // Extract source if reliable
    if (insight.confidence > 0.8) {
      dataPoints.push(`${insight.source}: ${insight.insight}`);
    }
  }

  return dataPoints.slice(0, 5); // Limit to 5 most important
}

/**
 * Extract themes from insights
 */
function extractThemes(insights: ResearchInsight[]): string[] {
  const themeMap: Record<string, number> = {};

  for (const insight of insights) {
    if (insight.themes && Array.isArray(insight.themes)) {
      for (const theme of insight.themes) {
        themeMap[theme] = (themeMap[theme] || 0) + 1;
      }
    }

    // Auto-detect themes from content
    const autoThemes = detectAutoThemes(insight.insight);
    for (const theme of autoThemes) {
      themeMap[theme] = (themeMap[theme] || 0) + 1;
    }
  }

  // Return top themes by frequency
  return Object.entries(themeMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([theme]) => theme);
}

/**
 * Auto-detect themes from insight content
 */
function detectAutoThemes(insight: string): string[] {
  const themes: string[] = [];
  const lowerInsight = insight.toLowerCase();

  const themePatterns: Record<string, RegExp> = {
    'AI/ML Adoption': /ai|machine learning|automation|neural|algorithm/i,
    'Market Shift': /shift|change|trend|emerging|disrupt/i,
    'Competitive Pressure': /compet|rival|threat|market share/i,
    'Growth Opportunity': /grow|expand|opportunity|potential|scaling/i,
    'Technology Evolution': /technology|tool|platform|innovation|moderniz/i,
    'Regulatory Changes': /regulation|compliance|legal|policy|law/i,
    'Customer Demand': /demand|customer|user|preference|adoption/i,
    'Performance Improvement': /improve|increase|enhance|optimiz|efficiency/i,
  };

  for (const [theme, pattern] of Object.entries(themePatterns)) {
    if (pattern.test(insight)) {
      themes.push(theme);
    }
  }

  return themes;
}

/**
 * Generate quotes/callouts for content
 */
function generateQuotes(insights: ResearchInsight[]): string[] {
  const quotes: string[] = [];

  for (const insight of insights) {
    if (insight.confidence > 0.8) {
      // Use high-confidence insights as quotes
      quotes.push(`"${capitalizeFirst(insight.insight)}"`);
    }

    // Extract compelling statements
    if (insight.insight.includes('increase') || insight.insight.includes('growth')) {
      quotes.push(`📈 ${insight.insight}`);
    }

    if (insight.threat_level === 'high') {
      quotes.push(`⚠️ ${insight.insight}`);
    }
  }

  return quotes.slice(0, 3); // Limit to 3 best quotes
}

/**
 * Summarize research for content snippet
 */
export function summarizeResearchForContent(insights: ResearchInsight[]): string {
  const synthesis = synthesizeInsights(insights);

  const parts: string[] = [];

  // Add key points
  if (synthesis.keyPoints.length > 0) {
    parts.push(`Key Findings: ${synthesis.keyPoints.slice(0, 2).join(' | ')}`);
  }

  // Add data points
  if (synthesis.dataPoints.length > 0) {
    parts.push(`Research: ${synthesis.dataPoints.slice(0, 2).join(', ')}`);
  }

  // Add confidence
  const confidenceLevel =
    synthesis.confidence > 0.85 ? 'strong'
    : synthesis.confidence > 0.7 ? 'solid'
    : 'emerging';
  parts.push(`(${confidenceLevel} evidence)`);

  return parts.join(' ');
}

/**
 * Format research for email inclusion
 */
export function formatResearchForEmail(insights: ResearchInsight[]): string {
  const synthesis = synthesizeInsights(insights);

  if (synthesis.keyPoints.length === 0) {
    return '';
  }

  const points = synthesis.keyPoints
    .slice(0, 3)
    .map((p, i) => `${i + 1}. ${p}`)
    .join('\n');

  return `Recent Market Insights:\n${points}`;
}

/**
 * Format research for article inclusion
 */
export function formatResearchForArticle(insights: ResearchInsight[]): string {
  const synthesis = synthesizeInsights(insights);

  const sections: string[] = [];

  if (synthesis.narrative) {
    sections.push(`## What the Research Shows\n\n${synthesis.narrative}`);
  }

  if (synthesis.keyPoints.length > 0) {
    const points = synthesis.keyPoints
      .map(p => `- ${p}`)
      .join('\n');
    sections.push(`## Key Takeaways\n\n${points}`);
  }

  if (synthesis.themes.length > 0) {
    const themes = synthesis.themes
      .map(t => `#${t.replace(/\s+/g, '')}`)
      .join(' ');
    sections.push(`## Themes\n\n${themes}`);
  }

  return sections.join('\n\n');
}

/**
 * Format research for social media
 */
export function formatResearchForSocial(insights: ResearchInsight[]): string {
  const synthesis = synthesizeInsights(insights);

  const parts: string[] = [];

  // Add emoji if high-threat
  if (insights.some(i => i.threat_level === 'high')) {
    parts.push('🚨');
  } else if (insights.some(i => i.threat_level === 'medium')) {
    parts.push('⚠️');
  } else {
    parts.push('📊');
  }

  // Add key point
  if (synthesis.keyPoints.length > 0) {
    parts.push(synthesis.keyPoints[0]);
  }

  // Add hashtags from themes
  if (synthesis.themes.length > 0) {
    const hashtags = synthesis.themes
      .slice(0, 3)
      .map(t => `#${t.replace(/\s+/g, '')}`)
      .join(' ');
    parts.push(hashtags);
  }

  return parts.join(' ');
}

/**
 * Helper: capitalize first letter
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
