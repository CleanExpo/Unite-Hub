/**
 * Content Safety Filter - V2.3
 * Task-007: Verification System - Phased Implementation
 *
 * Filters content for:
 * - PII detection and redaction (email, phone, ABN, TFN, etc.)
 * - Inappropriate content detection
 * - Competitor mentions
 * - Tone analysis
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  VerificationResult,
  ContentSafetyResult,
  PIIDetection,
  VerificationError,
} from './types';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// ============================================================================
// PII Detection Patterns
// ============================================================================

const PII_PATTERNS: Array<{
  type: PIIDetection['type'];
  pattern: RegExp;
  mask: (match: string) => string;
}> = [
  // Email addresses
  {
    type: 'email',
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    mask: (m) => {
      const [local, domain] = m.split('@');
      return `${local[0]}${'*'.repeat(local.length - 1)}@${domain}`;
    },
  },
  // Australian phone numbers
  {
    type: 'phone',
    pattern: /(?:\+61|0)[2-9]?\d{8,9}|\(\d{2}\)\s?\d{4}\s?\d{4}|\d{4}\s?\d{3}\s?\d{3}/g,
    mask: () => '04** *** ***',
  },
  // Australian postcodes with suburb context (4 digits that look like postcodes)
  {
    type: 'address',
    pattern: /\d{1,4}\s+[A-Z][a-zA-Z]+\s+(?:Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Lane|Ln|Court|Ct|Place|Pl|Crescent|Cres|Boulevard|Blvd|Way|Circuit|Cct|Parade|Pde)[,\s]+[A-Z][a-zA-Z\s]+[,\s]+(?:NSW|VIC|QLD|SA|WA|TAS|NT|ACT)\s+\d{4}/gi,
    mask: () => '[ADDRESS REDACTED]',
  },
  // ABN (11 digits, optionally with spaces)
  {
    type: 'abn',
    pattern: /\b\d{2}\s?\d{3}\s?\d{3}\s?\d{3}\b/g,
    mask: (m) => m.slice(0, 2) + ' *** *** ' + m.slice(-3),
  },
  // TFN (8-9 digits, optionally with spaces)
  {
    type: 'tfn',
    pattern: /\b\d{3}\s?\d{3}\s?\d{2,3}\b/g,
    mask: () => '*** *** ***',
  },
  // Credit card numbers (13-19 digits)
  {
    type: 'credit_card',
    pattern: /\b(?:\d{4}[\s-]?){3,4}\d{1,4}\b/g,
    mask: (m) => '**** **** **** ' + m.slice(-4),
  },
  // Bank account numbers (BSB-Account format)
  {
    type: 'bank_account',
    pattern: /\b\d{3}[\s-]?\d{3}[\s-]?\d{6,10}\b/g,
    mask: () => '***-*** ********',
  },
];

// ============================================================================
// Competitor Detection
// ============================================================================

const COMPETITOR_NAMES = [
  // Major restoration companies
  'servpro',
  'servicemaster',
  'belfor',
  'steamatic',
  'rainbow international',
  'paul davis',
  'puroclean',
  'restoration 1',
  '911 restoration',
  'dri-eaz',
  // Add specific Australian competitors
  'sydney restoration',
  'melbourne restoration',
  'brisbane restoration',
  // Add more as needed
];

// ============================================================================
// Inappropriate Content Keywords
// ============================================================================

const INAPPROPRIATE_KEYWORDS = [
  // Profanity (mild list - expand as needed)
  'damn',
  'hell',
  'crap',
  // Unprofessional language
  'stupid',
  'idiot',
  'moron',
  'incompetent',
  // Potentially defamatory
  'fraud',
  'scam',
  'criminal',
  'illegal',
  // Discriminatory (expand as needed)
  'discriminat',
];

// ============================================================================
// Tone Issues
// ============================================================================

const TONE_PATTERNS = [
  { pattern: /!!+/g, issue: 'Multiple exclamation marks appear unprofessional' },
  { pattern: /\?\?+/g, issue: 'Multiple question marks appear aggressive' },
  { pattern: /[A-Z]{4,}/g, issue: 'All caps text appears like shouting' },
  { pattern: /\.{4,}/g, issue: 'Excessive ellipsis appears passive-aggressive' },
  { pattern: /\b(obviously|clearly|simply)\b/gi, issue: 'Condescending language detected' },
  { pattern: /\b(must|have to|need to)\b/gi, issue: 'Demanding language (consider softer alternatives)' },
];

// ============================================================================
// Detection Functions
// ============================================================================

/**
 * Detect PII in content
 */
function detectPII(content: string): PIIDetection[] {
  const detections: PIIDetection[] = [];

  for (const { type, pattern, mask } of PII_PATTERNS) {
    // Reset regex lastIndex
    pattern.lastIndex = 0;

    let match;
    while ((match = pattern.exec(content)) !== null) {
      detections.push({
        type,
        value: match[0],
        masked: mask(match[0]),
        location: {
          start: match.index,
          end: match.index + match[0].length,
        },
      });
    }
  }

  // Sort by location
  detections.sort((a, b) => a.location.start - b.location.start);

  return detections;
}

/**
 * Detect inappropriate content
 */
function detectInappropriateContent(content: string): string[] {
  const found: string[] = [];
  const contentLower = content.toLowerCase();

  for (const keyword of INAPPROPRIATE_KEYWORDS) {
    if (contentLower.includes(keyword)) {
      found.push(keyword);
    }
  }

  return [...new Set(found)]; // Unique values
}

/**
 * Detect competitor mentions
 */
function detectCompetitorMentions(content: string): string[] {
  const found: string[] = [];
  const contentLower = content.toLowerCase();

  for (const competitor of COMPETITOR_NAMES) {
    if (contentLower.includes(competitor.toLowerCase())) {
      found.push(competitor);
    }
  }

  return [...new Set(found)];
}

/**
 * Detect tone issues
 */
function detectToneIssues(content: string): string[] {
  const issues: string[] = [];

  for (const { pattern, issue } of TONE_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(content)) {
      issues.push(issue);
    }
  }

  return [...new Set(issues)];
}

/**
 * Redact PII from content
 */
function redactContent(content: string, piiDetections: PIIDetection[]): string {
  // Sort detections in reverse order to preserve indices
  const sorted = [...piiDetections].sort((a, b) => b.location.start - a.location.start);

  let redacted = content;
  for (const detection of sorted) {
    redacted =
      redacted.slice(0, detection.location.start) +
      detection.masked +
      redacted.slice(detection.location.end);
  }

  return redacted;
}

/**
 * AI-powered content safety check for complex issues
 */
async function aiSafetyCheck(
  content: string
): Promise<{
  inappropriate: string[];
  tone_issues: string[];
  suggestions: string[];
}> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: `Analyze this business report content for safety and professionalism issues.

CONTENT:
${content}

Respond with JSON only (no markdown):
{
  "inappropriate": ["List of inappropriate content found"],
  "tone_issues": ["List of tone/professionalism issues"],
  "suggestions": ["Suggestions for improvement"]
}

Check for:
- Unprofessional language or tone
- Potentially defamatory statements
- Biased or discriminatory language
- Overly casual or inappropriate language for a business report
- Aggressive or accusatory tone
- Vague claims without evidence
- Emotional language that should be more objective`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { inappropriate: [], tone_issues: [], suggestions: [] };
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { inappropriate: [], tone_issues: [], suggestions: [] };
  }
}

// ============================================================================
// Main Validation Function
// ============================================================================

/**
 * Check content for safety issues
 */
export async function checkContentSafety(
  content: string,
  options: {
    check_pii?: boolean;
    check_inappropriate?: boolean;
    check_competitors?: boolean;
    check_tone?: boolean;
    use_ai?: boolean;
    redact?: boolean;
  } = {}
): Promise<VerificationResult<ContentSafetyResult>> {
  const startTime = Date.now();
  const errors: VerificationError[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Default options
  const opts = {
    check_pii: true,
    check_inappropriate: true,
    check_competitors: true,
    check_tone: true,
    use_ai: true,
    redact: true,
    ...options,
  };

  try {
    // PII Detection
    let piiDetections: PIIDetection[] = [];
    if (opts.check_pii) {
      piiDetections = detectPII(content);
      if (piiDetections.length > 0) {
        errors.push({
          code: 'PII_DETECTED',
          message: `Found ${piiDetections.length} PII item(s): ${[...new Set(piiDetections.map((p) => p.type))].join(', ')}`,
          severity: 'error',
        });
        suggestions.push('Review and redact sensitive information before publishing');
      }
    }

    // Inappropriate content
    let inappropriateContent: string[] = [];
    if (opts.check_inappropriate) {
      inappropriateContent = detectInappropriateContent(content);
      if (inappropriateContent.length > 0) {
        errors.push({
          code: 'INAPPROPRIATE_CONTENT',
          message: `Found inappropriate content: ${inappropriateContent.join(', ')}`,
          severity: 'error',
        });
      }
    }

    // Competitor mentions
    let competitorMentions: string[] = [];
    if (opts.check_competitors) {
      competitorMentions = detectCompetitorMentions(content);
      if (competitorMentions.length > 0) {
        warnings.push(`Competitor mention(s) found: ${competitorMentions.join(', ')}`);
        suggestions.push('Consider removing competitor references');
      }
    }

    // Tone issues
    let toneIssues: string[] = [];
    if (opts.check_tone) {
      toneIssues = detectToneIssues(content);
    }

    // AI safety check for more nuanced issues
    if (opts.use_ai) {
      const aiCheck = await aiSafetyCheck(content);
      inappropriateContent = [...new Set([...inappropriateContent, ...aiCheck.inappropriate])];
      toneIssues = [...new Set([...toneIssues, ...aiCheck.tone_issues])];
      suggestions.push(...aiCheck.suggestions);
    }

    // Add warnings for tone issues
    if (toneIssues.length > 0) {
      warnings.push(`Tone issues detected: ${toneIssues.length}`);
      for (const issue of toneIssues) {
        suggestions.push(issue);
      }
    }

    // Generate redacted content if requested
    let redactedContent: string | undefined;
    if (opts.redact && piiDetections.length > 0) {
      redactedContent = redactContent(content, piiDetections);
    }

    // Determine if safe
    const isSafe =
      piiDetections.length === 0 &&
      inappropriateContent.length === 0 &&
      (!opts.check_competitors || competitorMentions.length === 0);

    const result: ContentSafetyResult = {
      is_safe: isSafe,
      pii_detected: piiDetections,
      inappropriate_content: inappropriateContent,
      competitor_mentions: competitorMentions,
      tone_issues: toneIssues,
      redacted_content: redactedContent,
    };

    return {
      status: isSafe ? 'passed' : errors.some((e) => e.severity === 'critical') ? 'failed' : 'warning',
      passed: isSafe,
      message: isSafe
        ? 'Content passed safety checks'
        : `Content has ${errors.length + warnings.length} safety issue(s)`,
      data: result,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Content safety check error:', error);
    return {
      status: 'failed',
      passed: false,
      message: 'Content safety check failed due to an internal error',
      errors: [
        {
          code: 'SAFETY_CHECK_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          severity: 'critical',
        },
      ],
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
    };
  }
}

/**
 * Quick PII check (regex only, no AI)
 */
export function quickPIICheck(content: string): {
  has_pii: boolean;
  types_found: string[];
} {
  const detections = detectPII(content);
  const types = [...new Set(detections.map((d) => d.type))];
  return {
    has_pii: detections.length > 0,
    types_found: types,
  };
}

/**
 * Redact all PII from content
 */
export function redactAllPII(content: string): string {
  const detections = detectPII(content);
  return redactContent(content, detections);
}

export default {
  checkContentSafety,
  quickPIICheck,
  redactAllPII,
};
