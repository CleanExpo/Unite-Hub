/**
 * AIDO Content Scoring Utilities
 * Calculates Authority, Evergreen, and AI Source scores
 *
 * CRITICAL: AI Source Score prioritizes question-based structure
 */

interface ContentForScoring {
  body_markdown: string;
  qa_blocks: Array<{ question: string; answer: string }>;
  schema_types: string[];
  localisation_tags?: string[];
  media_assets?: Array<{ type: string; url: string }>;
  created_at?: string;
  updated_at?: string;
}

/**
 * Calculate AI Source Score (0.0-1.0)
 * How well content will be cited by AI systems
 */
export function calculateAISourceScore(content: ContentForScoring): number {
  let score = 0.3; // Base score (lower for stricter standards)

  // 1. H2 headings as questions (+0.25 max)
  const h2Headings = (content.body_markdown.match(/^## (.+)$/gm) || []);
  const questionHeadings = h2Headings.filter(h => {
    const heading = h.replace('## ', '').toLowerCase();
    return heading.includes('?') ||
           heading.startsWith('how') ||
           heading.startsWith('what') ||
           heading.startsWith('why') ||
           heading.startsWith('when') ||
           heading.startsWith('where') ||
           heading.startsWith('who') ||
           heading.startsWith('which') ||
           heading.startsWith('can') ||
           heading.startsWith('do') ||
           heading.startsWith('does') ||
           heading.startsWith('is') ||
           heading.startsWith('are') ||
           heading.startsWith('will') ||
           heading.startsWith('should');
  });

  const questionRatio = h2Headings.length > 0
    ? questionHeadings.length / h2Headings.length
    : 0;
  score += questionRatio * 0.25;

  // 2. Immediate answers after H2 (+0.20 max)
  const h2Sections = content.body_markdown.split(/^## /gm).slice(1);
  let immediateAnswers = 0;

  h2Sections.forEach(section => {
    const lines = section.split('\n').filter(l => l.trim());
    const firstContentLine = lines.find(l => !l.startsWith('#'))?.trim() || '';

    // Check if first sentence has numbers/facts and is concise
    if (firstContentLine && firstContentLine.length < 300) {
      const hasNumbers = /\d+/.test(firstContentLine);
      const hasFacts = /\b(is|are|was|were|costs?|takes?|requires?|includes?|consists?)\b/i.test(firstContentLine);

      if (hasNumbers || hasFacts) {
        immediateAnswers++;
      }
    }
  });

  const immediateAnswerRatio = h2Sections.length > 0
    ? immediateAnswers / h2Sections.length
    : 0;
  score += immediateAnswerRatio * 0.20;

  // 3. No fluff phrases (+0.15 if clean)
  const fluffPhrases = [
    'there are many factors',
    'when thinking about',
    'first, we need to understand',
    'it\'s important to consider',
    'before we dive in',
    'let\'s explore',
    'in this guide',
    'things to consider',
    'various aspects',
    'it depends on',
  ];

  const hasFluff = fluffPhrases.some(phrase =>
    content.body_markdown.toLowerCase().includes(phrase)
  );

  if (!hasFluff) {
    score += 0.15;
  }

  // 4. Entity verification (+0.15 max)
  let entityScore = 0;

  // Author byline
  if (content.body_markdown.includes('**Written by**') ||
      content.body_markdown.includes('**Author:**')) {
    entityScore += 0.05;
  }

  // Author profile section
  if (content.body_markdown.includes('## About the Author')) {
    entityScore += 0.05;
  }

  // Social links
  if (content.body_markdown.includes('LinkedIn:') ||
      content.body_markdown.includes('linkedin.com')) {
    entityScore += 0.025;
  }

  if (content.body_markdown.includes('Facebook:') ||
      content.body_markdown.includes('facebook.com')) {
    entityScore += 0.025;
  }

  score += entityScore;

  // 5. Schema.org coverage (+0.15 max)
  let schemaScore = 0;

  // FAQPage schema for Q&A content
  if (content.schema_types.includes('FAQPage') && content.qa_blocks.length > 0) {
    schemaScore += 0.08;
  }

  // Article/HowTo/Service schemas
  if (content.schema_types.includes('Article') ||
      content.schema_types.includes('HowTo') ||
      content.schema_types.includes('Service')) {
    schemaScore += 0.04;
  }

  // Person schema for author
  if (content.schema_types.includes('Person')) {
    schemaScore += 0.03;
  }

  score += schemaScore;

  // 6. Factual density (+0.10 max)
  const factualPatterns = [
    /\b\d+%\b/g,                                                   // Percentages
    /\b\d+\s*(km|m|cm|mm|kg|g|mg|L|ml|hours?|minutes?|days?|weeks?|months?|years?)\b/gi, // Measurements
    /\b(19|20)\d{2}\b/g,                                          // Years
    /\$[\d,]+(\.\d{2})?/g,                                        // Currency
    /\b\d+\.\d+\b/g,                                              // Decimals
    /\b\d{1,3}(,\d{3})*\b/g,                                      // Large numbers with commas
  ];

  let factualStatements = 0;
  factualPatterns.forEach(pattern => {
    const matches = content.body_markdown.match(pattern);
    if (matches) factualStatements += matches.length;
  });

  if (factualStatements >= 40) {
    score += 0.10;
  } else if (factualStatements >= 30) {
    score += 0.08;
  } else if (factualStatements >= 20) {
    score += 0.06;
  } else if (factualStatements >= 10) {
    score += 0.04;
  }

  return Math.min(score, 1.0);
}

/**
 * Calculate Authority Score (0.0-1.0)
 * How authoritative and expert the content appears
 */
export function calculateAuthorityScore(content: ContentForScoring): number {
  let score = 0.4; // Base score

  // 1. Content depth (word count) (+0.15 max)
  const wordCount = content.body_markdown.split(/\s+/).length;
  if (wordCount >= 3000) {
    score += 0.15;
  } else if (wordCount >= 2000) {
    score += 0.10;
  } else if (wordCount >= 1500) {
    score += 0.05;
  }

  // 2. Technical terminology (+0.15 max)
  const technicalTerms = [
    /\b[A-Z]{2,}\b/g,                    // Acronyms
    /\b\w+ation\b/gi,                    // Technical -ation words
    /\b\w+ization\b/gi,                  // Technical -ization words
    /\bISO\s*\d+/gi,                     // ISO standards
    /\bAS\s*\d+/gi,                      // Australian Standards
    /\b(certified|licensed|registered|accredited|qualified)\b/gi,
  ];

  let technicalCount = 0;
  technicalTerms.forEach(pattern => {
    const matches = content.body_markdown.match(pattern);
    if (matches) technicalCount += matches.length;
  });

  if (technicalCount >= 30) {
    score += 0.15;
  } else if (technicalCount >= 20) {
    score += 0.10;
  } else if (technicalCount >= 10) {
    score += 0.05;
  }

  // 3. Credentials mentioned (+0.10 max)
  const credentialPatterns = [
    /\b\d+\+?\s*years?\s*(of\s*)?(experience|expertise)/gi,
    /\b(master|bachelor|degree|diploma|certificate|phd|doctorate)\b/gi,
    /\b(award[- ]winning|industry[- ]leading|recognized|expert)\b/gi,
    /\b(member|fellow|associate)\s+of\b/gi,
  ];

  let credentialCount = 0;
  credentialPatterns.forEach(pattern => {
    if (pattern.test(content.body_markdown)) {
      credentialCount++;
    }
  });

  score += Math.min(credentialCount * 0.025, 0.10);

  // 4. Citations/References (+0.10 max)
  const citationPatterns = [
    /\[\d+\]/g,                          // Numbered citations [1]
    /\([\w\s]+,\s*\d{4}\)/g,            // Academic citations (Author, 2024)
    /according to/gi,
    /research shows/gi,
    /studies indicate/gi,
  ];

  let citationCount = 0;
  citationPatterns.forEach(pattern => {
    const matches = content.body_markdown.match(pattern);
    if (matches) citationCount += matches.length;
  });

  if (citationCount >= 10) {
    score += 0.10;
  } else if (citationCount >= 5) {
    score += 0.06;
  } else if (citationCount >= 2) {
    score += 0.03;
  }

  // 5. Structured sections (+0.10 max)
  const structuralElements = [
    /^## /gm,                            // H2 headings
    /^### /gm,                           // H3 headings
    /^\d+\.\s/gm,                        // Numbered lists
    /^[-*]\s/gm,                         // Bullet points
    /^\|.*\|/gm,                         // Tables
  ];

  let structureCount = 0;
  structuralElements.forEach(pattern => {
    const matches = content.body_markdown.match(pattern);
    if (matches) structureCount += matches.length;
  });

  if (structureCount >= 30) {
    score += 0.10;
  } else if (structureCount >= 20) {
    score += 0.07;
  } else if (structureCount >= 10) {
    score += 0.04;
  }

  return Math.min(score, 1.0);
}

/**
 * Calculate Evergreen Score (0.0-1.0)
 * How timeless vs time-sensitive the content is
 */
export function calculateEvergreenScore(content: ContentForScoring): number {
  let score = 0.8; // Start high, deduct for time-sensitive elements

  // Time-sensitive phrases (deduct points)
  const timeSensitivePhrases = [
    /\b20\d{2}\b/g,                      // Specific years
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/gi,
    /\b(today|yesterday|tomorrow|this week|next week|last week)\b/gi,
    /\b(current|currently|now|recent|recently)\b/gi,
    /\b(latest|newest|just released|breaking|upcoming)\b/gi,
    /\bCOVID-19\b/gi,
    /\bpandemic\b/gi,
  ];

  let timeSensitiveCount = 0;
  timeSensitivePhrases.forEach(pattern => {
    const matches = content.body_markdown.match(pattern);
    if (matches) timeSensitiveCount += matches.length;
  });

  // Deduct based on time-sensitive content
  if (timeSensitiveCount > 20) {
    score -= 0.4;
  } else if (timeSensitiveCount > 10) {
    score -= 0.25;
  } else if (timeSensitiveCount > 5) {
    score -= 0.15;
  } else if (timeSensitiveCount > 2) {
    score -= 0.08;
  }

  // Evergreen topics (add points back)
  const evergreenIndicators = [
    /\bhow to\b/gi,
    /\bwhat is\b/gi,
    /\bwhy do\b/gi,
    /\bguide to\b/gi,
    /\bbasics of\b/gi,
    /\bfundamentals\b/gi,
    /\bprinciples\b/gi,
    /\bbest practices\b/gi,
    /\btips for\b/gi,
    /\bmistakes to avoid\b/gi,
  ];

  let evergreenCount = 0;
  evergreenIndicators.forEach(pattern => {
    if (pattern.test(content.body_markdown)) {
      evergreenCount++;
    }
  });

  score += Math.min(evergreenCount * 0.03, 0.2);

  return Math.max(0, Math.min(score, 1.0));
}

/**
 * Calculate composite content quality score
 */
export function calculateCompositeScore(content: ContentForScoring): number {
  const aiSource = calculateAISourceScore(content);
  const authority = calculateAuthorityScore(content);
  const evergreen = calculateEvergreenScore(content);

  // Weighted average with AI Source having highest weight
  return (aiSource * 0.5) + (authority * 0.3) + (evergreen * 0.2);
}

/**
 * Get content score breakdown with explanations
 */
export function getScoreBreakdown(content: ContentForScoring): {
  aiSource: { score: number; factors: string[] };
  authority: { score: number; factors: string[] };
  evergreen: { score: number; factors: string[] };
  composite: number;
  recommendations: string[];
} {
  const aiSourceScore = calculateAISourceScore(content);
  const authorityScore = calculateAuthorityScore(content);
  const evergreenScore = calculateEvergreenScore(content);
  const compositeScore = calculateCompositeScore(content);

  // Analyze AI Source factors
  const aiSourceFactors: string[] = [];
  const h2Count = (content.body_markdown.match(/^## /gm) || []).length;
  const questionH2Count = (content.body_markdown.match(/^## .*\?/gm) || []).length;

  if (questionH2Count / Math.max(h2Count, 1) >= 0.8) {
    aiSourceFactors.push(`✅ ${questionH2Count}/${h2Count} H2s are questions`);
  } else {
    aiSourceFactors.push(`⚠️ Only ${questionH2Count}/${h2Count} H2s are questions`);
  }

  if (!content.body_markdown.toLowerCase().includes('there are many factors')) {
    aiSourceFactors.push('✅ No fluff phrases detected');
  } else {
    aiSourceFactors.push('❌ Fluff phrases found');
  }

  if (content.body_markdown.includes('## About the Author')) {
    aiSourceFactors.push('✅ Author profile included');
  } else {
    aiSourceFactors.push('❌ Missing author profile');
  }

  if (content.schema_types.includes('FAQPage')) {
    aiSourceFactors.push('✅ FAQPage schema present');
  } else {
    aiSourceFactors.push('⚠️ No FAQPage schema');
  }

  // Analyze Authority factors
  const authorityFactors: string[] = [];
  const wordCount = content.body_markdown.split(/\s+/).length;
  authorityFactors.push(`📝 ${wordCount} words`);

  if (wordCount >= 2000) {
    authorityFactors.push('✅ Comprehensive length');
  } else {
    authorityFactors.push('⚠️ Could be more comprehensive');
  }

  // Analyze Evergreen factors
  const evergreenFactors: string[] = [];
  const yearMatches = content.body_markdown.match(/\b20\d{2}\b/g) || [];

  if (yearMatches.length <= 2) {
    evergreenFactors.push('✅ Minimal date-specific content');
  } else {
    evergreenFactors.push(`⚠️ ${yearMatches.length} year references found`);
  }

  // Generate recommendations
  const recommendations: string[] = [];

  if (aiSourceScore < 0.8) {
    if (questionH2Count < h2Count * 0.8) {
      recommendations.push('Convert more H2 headings to questions');
    }
    if (!content.body_markdown.includes('## About the Author')) {
      recommendations.push('Add "About the Author" section with credentials');
    }
    if (!content.schema_types.includes('FAQPage') && content.qa_blocks.length > 0) {
      recommendations.push('Add FAQPage schema for Q&A sections');
    }
  }

  if (authorityScore < 0.7) {
    if (wordCount < 2000) {
      recommendations.push(`Expand content by ${2000 - wordCount} words`);
    }
    recommendations.push('Add more technical details and expert insights');
  }

  if (evergreenScore < 0.7) {
    recommendations.push('Remove or generalize date-specific references');
    recommendations.push('Focus on timeless principles over current events');
  }

  return {
    aiSource: { score: aiSourceScore, factors: aiSourceFactors },
    authority: { score: authorityScore, factors: authorityFactors },
    evergreen: { score: evergreenScore, factors: evergreenFactors },
    composite: compositeScore,
    recommendations,
  };
}

/**
 * Check if content meets minimum quality thresholds
 */
export function meetsQualityThresholds(
  content: ContentForScoring,
  thresholds = { aiSource: 0.75, authority: 0.6, evergreen: 0.5 }
): boolean {
  const aiSourceScore = calculateAISourceScore(content);
  const authorityScore = calculateAuthorityScore(content);
  const evergreenScore = calculateEvergreenScore(content);

  return (
    aiSourceScore >= thresholds.aiSource &&
    authorityScore >= thresholds.authority &&
    evergreenScore >= thresholds.evergreen
  );
}