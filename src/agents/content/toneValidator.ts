/**
 * Tone Validator
 *
 * Validates generated content against brand positioning and tone guidelines.
 * Ensures content aligns with brand voice, audience expectations, and
 * positioning map requirements.
 *
 * Used by: Content agent for pre-approval validation
 */

import { brandPositioningMap } from '@/lib/brands/brandPositioningMap';
import type { BrandId } from '@/lib/brands/brandRegistry';

export interface ToneValidationResult {
  aligned: boolean;
  score: number; // 0-100
  issues: string[];
  matchedTones: string[];
  missingTones: string[];
  recommendations: string[];
}

/**
 * Validate content tone against brand positioning
 */
export function validateBrandTone(brandId: BrandId, content: string): ToneValidationResult {
  const brand = brandPositioningMap[brandId];

  if (!brand) {
    return {
      aligned: false,
      score: 0,
      issues: [`Brand "${brandId}" not found in positioning map`],
      matchedTones: [],
      missingTones: [],
      recommendations: [],
    };
  }

  const contentLower = content.toLowerCase();

  // Check for tone indicators
  const toneIndicators: Record<string, string[]> = {
    professional: ['professional', 'expertise', 'proven', 'certified', 'standard', 'best practice'],
    friendly: ['friendly', 'approachable', 'easy', 'simple', 'welcome', 'let\'s'],
    authoritative: ['leading', 'industry', 'authority', 'expert', 'trusted', 'proven track'],
    engaging: ['exciting', 'innovative', 'transform', 'discover', 'unlock', 'incredible'],
    conversational: ['you', 'we', 'let\'s', 'here\'s', 'think about', 'consider'],
    educational: ['learn', 'guide', 'understand', 'explore', 'discover', 'education'],
    motivational: ['achieve', 'succeed', 'potential', 'growth', 'overcome', 'empower'],
    practical: ['solution', 'implement', 'actionable', 'step', 'process', 'real-world'],
  };

  // Detect tones present in content
  const matchedTones: string[] = [];
  const toneScores: Record<string, number> = {};

  for (const [tone, indicators] of Object.entries(toneIndicators)) {
    const matches = indicators.filter(ind => contentLower.includes(ind)).length;
    const score = (matches / indicators.length) * 100;
    toneScores[tone] = score;

    if (score >= 25) {
      matchedTones.push(tone);
    }
  }

  // Compare with brand required tones
  const brandTones = brand.tone || [];
  const missingTones = brandTones.filter(t => !matchedTones.includes(t));
  const extraTones = matchedTones.filter(t => !brandTones.includes(t));

  // Calculate alignment score
  const matchedRequiredTones = matchedTones.filter(t => brandTones.includes(t));
  const alignmentScore =
    brandTones.length === 0 ? 50 : Math.round((matchedRequiredTones.length / brandTones.length) * 100);

  // Build issues list
  const issues: string[] = [];

  if (missingTones.length > 0) {
    issues.push(`Missing required tones: ${missingTones.join(', ')}`);
  }

  if (extraTones.length > 3) {
    issues.push(`Too many extra tones (${extraTones.length}) - content may be unfocused`);
  }

  // Check for risk flag violations
  const riskIssues = checkRiskFlags(brandId, content);
  issues.push(...riskIssues);

  // Generate recommendations
  const recommendations: string[] = [];

  if (missingTones.length > 0) {
    recommendations.push(
      `Strengthen ${missingTones[0]} tone by using words like: ${getToneKeywords(missingTones[0]).join(', ')}`
    );
  }

  if (issues.length === 0) {
    recommendations.push('Content aligns well with brand positioning. Ready for approval.');
  }

  // Adjust score based on risk flag violations
  let finalScore = alignmentScore;
  if (riskIssues.length > 0) {
    finalScore = Math.max(0, finalScore - riskIssues.length * 15);
  }

  return {
    aligned: finalScore >= 75 && riskIssues.length === 0,
    score: finalScore,
    issues,
    matchedTones,
    missingTones,
    recommendations,
  };
}

/**
 * Check for brand risk flag violations
 */
function checkRiskFlags(brandId: BrandId, content: string): string[] {
  const brand = brandPositioningMap[brandId];
  const issues: string[] = [];

  if (!brand || !brand.riskFlags) {
    return issues;
  }

  const contentLower = content.toLowerCase();

  // Risk flag patterns for different industries
  const riskPatterns: Record<string, RegExp[]> = {
    // Financial/Insurance risks
    guarantee: [/guarantee/i, /guaranteed/i, /promise/i, /promise.*100%/i],
    financial_promise: [/(\d+%.*return|return.*\d+%)/i, /make.*money/i, /earn.*\$\d+/i],
    risk_minimization: [/no risk/i, /risk.{0,5}free/i, /safe.*guaranteed/i],

    // Medical/Health risks
    medical_claims: [/cure/i, /treat.*disease/i, /prevent.*disease/i, /FDA approved/i],
    health_promise: [/heal/i, /medical/i, /diagnosed/i, /prescription/i],

    // Legal risks
    legal_statement: [/lawsuit/i, /legal.*advice/i, /attorney/i, /copyright/i],
    compliance: [/illegal/i, /comply.{0,10}law/i, /regulation/i],

    // Exaggeration
    extreme_claim: [/amazing/i, /incredible/i, /life.{0,5}changing/i, /revolutionary/i],
    unsubstantiated: [/proven/i, /best/i, /only.*solution/i],
  };

  const flagChecks: Record<string, string> = {
    'Avoid guarantees about outcomes': 'guarantee',
    'Avoid financial promises or ROI claims': 'financial_promise',
    'Avoid medical/health claims': 'medical_claims',
    'Avoid legal advice claims': 'legal_statement',
    'Avoid extreme or unsubstantiated claims': 'extreme_claim',
  };

  for (const [flag, pattern] of Object.entries(flagChecks)) {
    const patterns = riskPatterns[pattern] || [];
    const violations = patterns.filter(p => p.test(content));

    if (violations.length > 0) {
      issues.push(`Risk flag violation: ${flag}`);
    }
  }

  return issues;
}

/**
 * Get keyword suggestions for a tone
 */
function getToneKeywords(tone: string): string[] {
  const keywords: Record<string, string[]> = {
    professional: ['expertise', 'proven', 'certified', 'standards', 'best practices', 'industry-leading'],
    friendly: ['easy', 'simple', 'welcome', 'together', 'happy', 'enjoy'],
    authoritative: ['expert', 'leading', 'trusted', 'established', 'authority', 'recognized'],
    engaging: ['discover', 'unlock', 'transform', 'innovate', 'inspire', 'engage'],
    conversational: ['you', 'we', 'let\'s', 'here\'s', 'think', 'consider'],
    educational: ['learn', 'understand', 'explore', 'guide', 'knowledge', 'insights'],
    motivational: ['achieve', 'succeed', 'potential', 'growth', 'empower', 'succeed'],
    practical: ['actionable', 'implement', 'real-world', 'step-by-step', 'solution', 'results'],
  };

  return keywords[tone] || [];
}

/**
 * Suggest tone improvements
 */
export function suggestToneImprovements(
  brandId: BrandId,
  content: string
): { improvements: string[]; priority: 'high' | 'medium' | 'low' } {
  const result = validateBrandTone(brandId, content);
  const improvements: string[] = [];

  // High priority: missing required tones
  if (result.missingTones.length > 0) {
    improvements.push(`Add ${result.missingTones[0]} tone to align with brand`);
  }

  // Medium priority: too many extra tones
  const extraTones = result.matchedTones.filter(t => !result.missingTones.includes(t));
  if (extraTones.length > 2) {
    improvements.push('Simplify tone - too many competing voices');
  }

  // High priority: risk flag violations
  if (result.issues.some(i => i.includes('Risk flag'))) {
    improvements.push('Address risk flag violations before approval');
  }

  const priority =
    result.score < 50 ? 'high' : result.score < 75 ? 'medium' : 'low';

  return { improvements, priority };
}
