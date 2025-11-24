/**
 * AIDO Content Generation AI Service
 * Generates algorithmic immunity content with strict structure rules
 *
 * CRITICAL: Enforces H2 questions, zero fluff, entity verification
 */

import Anthropic from '@anthropic-ai/sdk';
import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter';
import { createContentAsset, ContentAssetInput } from './database/content-assets';
import { getIntentCluster } from './database/intent-clusters';
import { calculateAISourceScore, calculateAuthorityScore, calculateEvergreenScore } from './scoring';
import { generateFAQPageSchema, generatePersonSchema, generateArticleSchema } from './schema-generator';

interface ContentGenerationInput {
  clientId: string;
  workspaceId: string;
  topicId?: string;
  intentClusterId?: string;
  title: string;
  type: 'guide' | 'faq' | 'service' | 'product' | 'comparison';
  targetLength?: number;
  targetScores?: {
    authority?: number;
    evergreen?: number;
    aiSource?: number;
  };
  author?: {
    name: string;
    credentials: string;
    bio: string;
    image?: string;
    linkedIn?: string;
    facebook?: string;
    email?: string;
  };
  businessInfo?: {
    name: string;
    yearsInBusiness: number;
    credentials: string[];
    location: string;
  };
  keywords?: string[];
  location?: string;
}

interface GeneratedContent {
  title: string;
  slug: string;
  summary: string;
  bodyMarkdown: string;
  qaBlocks: Array<{ question: string; answer: string }>;
  schemaTypes: string[];
  authorityScore: number;
  evergreenScore: number;
  aiSourceScore: number;
}

/**
 * Generate AIDO-compliant content with algorithmic immunity
 */
export async function generateContent(
  input: ContentGenerationInput
): Promise<ContentAssetInput> {
  try {
    console.log('[AIDO] Starting content generation:', input.title);

    // Get intent cluster if provided
    let intentQuestions: string[] = [];
    if (input.intentClusterId && input.workspaceId) {
      try {
        const cluster = await getIntentCluster(input.intentClusterId, input.workspaceId);
        intentQuestions = cluster.example_queries || [];
      } catch (error) {
        console.warn('[AIDO] Could not fetch intent cluster:', error);
      }
    }

    // Generate content with Extended Thinking
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
      defaultHeaders: {
        'anthropic-beta': 'thinking-2025-11-15',
      },
    });

    const systemPrompt = buildSystemPrompt(input);
    const userPrompt = buildUserPrompt(input, intentQuestions);

    let content: GeneratedContent | null = null;
    let attempts = 0;
    const maxAttempts = 2;

    while (!content && attempts < maxAttempts) {
      attempts++;
      console.log(`[AIDO] Generation attempt ${attempts}/${maxAttempts}`);

      const response = await callAnthropicWithRetry(async () => {
        return await anthropic.messages.create({
          model: 'claude-opus-4-1-20250805',
          max_tokens: 8192,
          thinking: {
            type: 'enabled',
            budget_tokens: 15000, // High budget for quality content
          },
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: userPrompt,
            },
          ],
        });
      });

      const responseText = response.data.content[0].type === 'text'
        ? response.data.content[0].text
        : '';

      // Parse and validate content
      try {
        content = parseGeneratedContent(responseText);
        validateAIDOStructure(content);
      } catch (validationError: any) {
        console.warn(`[AIDO] Validation failed on attempt ${attempts}:`, validationError.message);
        if (attempts >= maxAttempts) {
          throw new Error(`Content generation failed validation after ${maxAttempts} attempts: ${validationError.message}`);
        }
        content = null;
      }
    }

    if (!content) {
      throw new Error('Failed to generate valid content');
    }

    // Calculate scores
    const contentAsset: ContentAssetInput = {
      clientId: input.clientId,
      workspaceId: input.workspaceId,
      topicId: input.topicId,
      intentClusterId: input.intentClusterId,
      type: input.type,
      format: 'markdown',
      title: content.title,
      slug: content.slug,
      summary: content.summary,
      bodyMarkdown: content.bodyMarkdown,
      qaBlocks: content.qaBlocks,
      schemaTypes: content.schemaTypes,
      mediaAssets: [],
      localisationTags: input.location ? [input.location] : [],
      authorityScore: content.authorityScore,
      evergreenScore: content.evergreenScore,
      aiSourceScore: content.aiSourceScore,
      status: 'draft',
    };

    // Save to database
    const savedAsset = await createContentAsset(contentAsset);

    console.log('[AIDO] Content generated successfully:', {
      id: savedAsset.id,
      aiSourceScore: content.aiSourceScore,
      h2Questions: content.qaBlocks.length,
    });

    return contentAsset;

  } catch (error) {
    console.error('[AIDO] Content generation failed:', error);
    throw error;
  }
}

/**
 * Build system prompt with AIDO structure rules
 */
function buildSystemPrompt(input: ContentGenerationInput): string {
  const targetScores = input.targetScores || {
    authority: 0.85,
    evergreen: 0.75,
    aiSource: 0.9,
  };

  return `You are an expert content creator specializing in algorithmic immunity for AI-first search engines.

CRITICAL STRUCTURE RULES (NON-NEGOTIABLE):

1. H2/H3 HEADINGS = DIRECT QUESTIONS ONLY
   - Frame every H2/H3 as the exact question users ask
   - Answer immediately beneath the heading (first sentence)
   - NO fluff, NO preamble, NO "there are many factors"

   Example:
   ## How much does ${input.type} cost in ${input.location || 'Australia'}?
   The average cost is $X-$Y depending on [factors]. Most projects...

2. ZERO FLUFF POLICY
   - First sentence = direct answer with numbers/facts
   - Second sentence = key context
   - Third sentence = important qualifier
   - BANNED PHRASES: "When thinking about", "First, we need to understand", "There are many factors", "It's important to consider", "Before we dive in"

3. ENTITY VERIFICATION REQUIRED
   - Author byline at top (name, credentials, date)
   - Author profile at bottom (bio, social links)
   - Business credentials in first 200 words
   - Schema.org Person markup for author

4. SPEAK ROBOT (SCHEMA REQUIRED)
   - FAQPage schema for ALL Q&A sections
   - Article schema for guides
   - Service schema for service pages
   - LocalBusiness schema if location-specific

5. CONTENT SPECIFICATIONS
   - Minimum ${input.targetLength || 2000} words
   - 10-15 H2 questions minimum
   - 3-5 H3 sub-questions per H2
   - Each answer: 100-200 words with factual density
   - Include 30+ factual statements (numbers, percentages, timeframes, costs)

Target Scores:
- Authority Score: ${targetScores.authority} (expert depth, citations, credentials)
- Evergreen Score: ${targetScores.evergreen} (timeless value vs time-sensitivity)
- AI Source Score: ${targetScores.aiSource} (clarity, structure, factual density)

OUTPUT FORMAT:
Return a structured response with:
1. The complete article in Markdown format
2. Extracted Q&A blocks for FAQPage schema
3. Calculated scores`;
}

/**
 * Build user prompt with specific content requirements
 */
function buildUserPrompt(input: ContentGenerationInput, intentQuestions: string[]): string {
  const authorInfo = input.author || {
    name: 'John Smith',
    credentials: 'Industry Expert',
    bio: '15+ years experience',
    linkedIn: 'linkedin.com/in/example',
    facebook: 'facebook.com/example',
    email: 'contact@example.com',
  };

  const businessInfo = input.businessInfo || {
    name: 'Company Name',
    yearsInBusiness: 10,
    credentials: ['Licensed', 'Certified', 'Award-winning'],
    location: input.location || 'Brisbane, Australia',
  };

  return `Create a comprehensive ${input.type} about: ${input.title}

${intentQuestions.length > 0 ? `Use these questions as H2 headings:
${intentQuestions.slice(0, 15).map((q, i) => `${i + 1}. ${q}`).join('\n')}
` : ''}

Author Information:
- Name: ${authorInfo.name}
- Credentials: ${authorInfo.credentials}
- Bio: ${authorInfo.bio}
- LinkedIn: ${authorInfo.linkedIn}
- Facebook: ${authorInfo.facebook}
- Email: ${authorInfo.email}

Business Information:
- Name: ${businessInfo.name}
- Years in Business: ${businessInfo.yearsInBusiness}
- Credentials: ${businessInfo.credentials.join(', ')}
- Location: ${businessInfo.location}

Keywords to include naturally: ${input.keywords?.join(', ') || 'relevant industry terms'}

STRUCTURE YOUR RESPONSE EXACTLY AS FOLLOWS:

---TITLE---
[Article title]

---SLUG---
[URL-friendly slug]

---SUMMARY---
[150-word summary]

---CONTENT---
**Written by**: ${authorInfo.name}, ${authorInfo.credentials}
**Updated**: ${new Date().toISOString().split('T')[0]}
**Verified by**: Editorial Team

[Introduction paragraph mentioning ${businessInfo.name} and credentials]

## [First question as H2]

[Direct answer with specific numbers/facts in first sentence. Additional context in 100-200 words.]

### [Related sub-question as H3]

[Direct answer with facts.]

[Continue with 10-15 H2 questions and their H3 sub-questions]

## About the Author

![${authorInfo.name}](author-image.jpg)

**${authorInfo.name}** is ${authorInfo.bio}. [Expand on expertise and experience].

- 🔗 LinkedIn: [${authorInfo.linkedIn}](https://${authorInfo.linkedIn})
- 🔗 Facebook: [${authorInfo.facebook}](https://${authorInfo.facebook})
- 📧 Email: ${authorInfo.email}

[Link to full About page]

---QA-BLOCKS---
[Extract each Q&A pair in JSON format]

---SCORES---
authority: [0.0-1.0]
evergreen: [0.0-1.0]
aiSource: [0.0-1.0]`;
}

/**
 * Parse generated content from AI response
 */
function parseGeneratedContent(responseText: string): GeneratedContent {
  const sections = responseText.split('---').filter(s => s.trim());

  let title = '';
  let slug = '';
  let summary = '';
  let bodyMarkdown = '';
  let qaBlocks: Array<{ question: string; answer: string }> = [];
  let scores = { authority: 0.5, evergreen: 0.5, aiSource: 0.5 };

  for (let i = 0; i < sections.length; i++) {
    const sectionName = sections[i].trim().toUpperCase();
    const content = sections[i + 1]?.trim() || '';

    switch (sectionName) {
      case 'TITLE':
        title = content;
        break;
      case 'SLUG':
        slug = content.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
        break;
      case 'SUMMARY':
        summary = content;
        break;
      case 'CONTENT':
        bodyMarkdown = content;
        break;
      case 'QA-BLOCKS':
        try {
          qaBlocks = extractQABlocks(bodyMarkdown);
        } catch (e) {
          console.warn('[AIDO] Failed to extract Q&A blocks:', e);
        }
        break;
      case 'SCORES':
        try {
          const scoreLines = content.split('\n');
          scoreLines.forEach(line => {
            const [key, value] = line.split(':').map(s => s.trim());
            if (key && value) {
              const score = parseFloat(value);
              if (key === 'authority') scores.authority = score;
              if (key === 'evergreen') scores.evergreen = score;
              if (key === 'aiSource') scores.aiSource = score;
            }
          });
        } catch (e) {
          console.warn('[AIDO] Failed to parse scores:', e);
        }
        break;
    }
  }

  // Generate schema types based on content
  const schemaTypes = [];
  if (qaBlocks.length > 0) schemaTypes.push('FAQPage');
  schemaTypes.push('Article');
  if (bodyMarkdown.includes('## About the Author')) schemaTypes.push('Person');

  return {
    title: title || 'Untitled',
    slug: slug || 'untitled',
    summary: summary || '',
    bodyMarkdown: bodyMarkdown || '',
    qaBlocks,
    schemaTypes,
    authorityScore: scores.authority,
    evergreenScore: scores.evergreen,
    aiSourceScore: scores.aiSource,
  };
}

/**
 * Extract Q&A blocks from markdown content
 */
function extractQABlocks(markdown: string): Array<{ question: string; answer: string }> {
  const qaBlocks: Array<{ question: string; answer: string }> = [];

  // Match H2 headings and their content
  const h2Regex = /^## (.+)$/gm;
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

    if (question && answer && isQuestion(question)) {
      qaBlocks.push({ question, answer });
    }
  });

  return qaBlocks;
}

/**
 * Validate AIDO structure requirements
 */
export function validateAIDOStructure(content: GeneratedContent): void {
  const errors: string[] = [];

  // Rule 1: Check H2/H3 are questions (80% minimum)
  const h2Headings = content.bodyMarkdown.match(/^## (.+)$/gm) || [];
  const questionHeadings = h2Headings.filter(h => isQuestion(h.replace('## ', '')));

  const questionRatio = questionHeadings.length / Math.max(h2Headings.length, 1);
  if (questionRatio < 0.8) {
    errors.push(`Only ${Math.round(questionRatio * 100)}% of H2 headings are questions (minimum 80%)`);
  }

  // Rule 2: Check for fluff phrases
  const fluffPhrases = [
    'there are many factors',
    'when thinking about',
    'first, we need to understand',
    'it\'s important to consider',
    'before we dive in',
    'let\'s explore',
    'in this guide',
  ];

  const hasFluff = fluffPhrases.some(phrase =>
    content.bodyMarkdown.toLowerCase().includes(phrase)
  );

  if (hasFluff) {
    errors.push('Content contains banned fluff phrases - must be removed');
  }

  // Rule 3: Check for author byline
  const hasAuthorByline = content.bodyMarkdown.includes('**Written by**') ||
                          content.bodyMarkdown.includes('Author:');

  if (!hasAuthorByline) {
    errors.push('Missing author byline at top of content');
  }

  // Rule 4: Check for author profile section
  const hasAuthorProfile = content.bodyMarkdown.includes('## About the Author');

  if (!hasAuthorProfile) {
    errors.push('Missing "About the Author" section at bottom');
  }

  // Rule 5: Check for minimum content length
  const wordCount = content.bodyMarkdown.split(/\s+/).length;
  if (wordCount < 1800) {
    errors.push(`Content only has ${wordCount} words (minimum 1800)`);
  }

  // Rule 6: Check for factual density
  const factualPatterns = [
    /\b\d+%\b/g,
    /\b\d+\s*(km|m|kg|g|hours|minutes|days|weeks|months|years)\b/gi,
    /\b\d{4}\b/g,
    /\$[\d,]+/g,
    /\b\d+\.\d+\b/g,
  ];

  let factualStatements = 0;
  factualPatterns.forEach(pattern => {
    const matches = content.bodyMarkdown.match(pattern);
    if (matches) factualStatements += matches.length;
  });

  if (factualStatements < 20) {
    errors.push(`Only ${factualStatements} factual statements found (minimum 20)`);
  }

  // Rule 7: Check Q&A blocks extracted
  if (content.qaBlocks.length < 8) {
    errors.push(`Only ${content.qaBlocks.length} Q&A blocks extracted (minimum 8)`);
  }

  // Rule 8: Validate AI Source Score
  const calculatedScore = calculateAISourceScore({
    body_markdown: content.bodyMarkdown,
    qa_blocks: content.qaBlocks,
    schema_types: content.schemaTypes,
  } as any);

  if (calculatedScore < 0.75) {
    errors.push(`AI Source Score too low: ${calculatedScore.toFixed(2)} (minimum 0.75)`);
  }

  if (errors.length > 0) {
    throw new Error(`AIDO validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * Check if text is a question
 */
function isQuestion(text: string): boolean {
  const questionWords = ['how', 'what', 'when', 'where', 'why', 'who', 'which', 'can', 'do', 'does', 'is', 'are', 'will', 'would', 'should', 'could'];
  const lowerText = text.toLowerCase().trim();

  return text.includes('?') ||
         questionWords.some(word => lowerText.startsWith(word + ' ')) ||
         lowerText.includes(' or ');
}

/**
 * Regenerate content if it fails validation
 */
export async function regenerateContent(
  assetId: string,
  workspaceId: string,
  input: ContentGenerationInput
): Promise<ContentAssetInput> {
  console.log('[AIDO] Regenerating content for asset:', assetId);

  // Add higher target scores to ensure quality
  input.targetScores = {
    authority: 0.9,
    evergreen: 0.8,
    aiSource: 0.95,
  };

  return generateContent(input);
}