/**
 * Animation Style Recommender
 *
 * Analyzes wizard answers and recommends animation styles.
 * Used by the wizard UI and orchestrator.
 */

import wizardData from '@/data/animationWizardQuestions.json';
import { animationStyles } from './animationStyles';

// ============================================================================
// TYPES
// ============================================================================

export interface WizardAnswer {
  questionId: string;
  selectedOptionIds: string[];
}

export interface StyleScore {
  styleId: string;
  styleName: string;
  score: number;
  reasons: string[];
}

export interface RecommendationResult {
  recommended: StyleScore[];
  notRecommended: string[];
  persona: string | null;
  intensity: 'subtle' | 'normal' | 'dramatic';
  features: string[];
  summary: string;
}

// ============================================================================
// SCORE AGGREGATOR
// ============================================================================

export function calculateScores(answers: WizardAnswer[]): Record<string, number> {
  const scores: Record<string, number> = {};

  for (const answer of answers) {
    const question = wizardData.questions.find(q => q.id === answer.questionId);
    if (!question) continue;

    for (const optionId of answer.selectedOptionIds) {
      const option = question.options.find(o => o.id === optionId);
      if (!option?.scores) continue;

      for (const [key, value] of Object.entries(option.scores)) {
        scores[key] = (scores[key] || 0) + (value as number);
      }
    }
  }

  return scores;
}

// ============================================================================
// PERSONA DETECTION
// ============================================================================

export function detectPersona(scores: Record<string, number>): string | null {
  const personaKeys = Object.keys(scores).filter(k => k.startsWith('persona-'));
  if (personaKeys.length === 0) return null;

  let maxScore = 0;
  let detectedPersona: string | null = null;

  for (const key of personaKeys) {
    if (scores[key] > maxScore) {
      maxScore = scores[key];
      detectedPersona = key.replace('persona-', '');
    }
  }

  return detectedPersona;
}

// ============================================================================
// INTENSITY DETECTION
// ============================================================================

export function detectIntensity(scores: Record<string, number>): 'subtle' | 'normal' | 'dramatic' {
  const subtleScore = scores['intensity-subtle'] || 0;
  const normalScore = scores['intensity-normal'] || 0;
  const dramaticScore = scores['intensity-dramatic'] || 0;

  if (dramaticScore > subtleScore && dramaticScore > normalScore) return 'dramatic';
  if (subtleScore > normalScore) return 'subtle';
  return 'normal';
}

// ============================================================================
// FEATURE DETECTION
// ============================================================================

export function detectFeatures(scores: Record<string, number>): string[] {
  const features: string[] = [];

  if (scores['feature-flashlight'] > 0) features.push('flashlight');
  if (scores['feature-3d'] > 0) features.push('3d');
  if (scores['feature-scroll'] > 0) features.push('scroll');
  if (scores['feature-video'] > 0) features.push('video');

  return features;
}

// ============================================================================
// STYLE MATCHING
// ============================================================================

export function matchStylesToScores(scores: Record<string, number>): StyleScore[] {
  const styleScores: StyleScore[] = [];
  const mapping = wizardData.styleMapping as Record<string, string[]>;

  // Create a score for each style based on mood matches
  const moodScores: Record<string, { score: number; reasons: string[] }> = {};

  for (const [mood, styleIds] of Object.entries(mapping)) {
    const moodScore = scores[mood] || 0;
    if (moodScore === 0) continue;

    for (const styleId of styleIds) {
      if (!moodScores[styleId]) {
        moodScores[styleId] = { score: 0, reasons: [] };
      }
      moodScores[styleId].score += moodScore;
      moodScores[styleId].reasons.push(`Matches "${mood}" preference`);
    }
  }

  // Add persona defaults
  const persona = detectPersona(scores);
  if (persona) {
    const defaults = (wizardData.personaDefaults as Record<string, string[]>)[persona] || [];
    for (const styleId of defaults) {
      if (!moodScores[styleId]) {
        moodScores[styleId] = { score: 0, reasons: [] };
      }
      moodScores[styleId].score += 2;
      moodScores[styleId].reasons.push(`Recommended for ${persona} audience`);
    }
  }

  // Convert to array and add style names
  for (const [styleId, data] of Object.entries(moodScores)) {
    const style = animationStyles.find(s => s.id === styleId);
    styleScores.push({
      styleId,
      styleName: style?.name || styleId,
      score: data.score,
      reasons: data.reasons,
    });
  }

  // Sort by score descending
  return styleScores.sort((a, b) => b.score - a.score);
}

// ============================================================================
// MAIN RECOMMENDATION FUNCTION
// ============================================================================

export function generateRecommendations(answers: WizardAnswer[]): RecommendationResult {
  const scores = calculateScores(answers);
  const persona = detectPersona(scores);
  const intensity = detectIntensity(scores);
  const features = detectFeatures(scores);
  const styleScores = matchStylesToScores(scores);

  // Get intensity settings
  const intensitySettings = wizardData.intensityMapping[`intensity-${intensity}` as keyof typeof wizardData.intensityMapping];
  const maxStyles = intensitySettings?.maxStyles || 5;

  // Filter styles based on intensity preference
  let filteredStyles = styleScores;
  if (intensity === 'subtle') {
    filteredStyles = styleScores.filter(s => {
      const style = animationStyles.find(st => st.id === s.styleId);
      return !style?.presets?.some(p => p.includes('dramatic'));
    });
  }

  // Take top N styles
  const recommended = filteredStyles.slice(0, maxStyles);
  const recommendedIds = recommended.map(s => s.styleId);

  // Get not recommended styles (opposite mood)
  const notRecommended: string[] = [];
  if (scores['calm'] > scores['bold']) {
    notRecommended.push('neon-edge-reactive', 'split-reveal-slider');
  }
  if (scores['professional'] > scores['playful']) {
    notRecommended.push('magnetic-cursor-pull');
  }

  // Generate summary
  const summary = generateSummary(persona, intensity, features, recommended);

  return {
    recommended,
    notRecommended,
    persona,
    intensity,
    features,
    summary,
  };
}

// ============================================================================
// SUMMARY GENERATOR
// ============================================================================

function generateSummary(
  persona: string | null,
  intensity: 'subtle' | 'normal' | 'dramatic',
  features: string[],
  recommended: StyleScore[]
): string {
  const parts: string[] = [];

  // Persona intro
  if (persona) {
    const personaNames: Record<string, string> = {
      trade: 'trade and service businesses',
      consumer: 'homeowners and consumers',
      corporate: 'corporate and B2B clients',
      saas: 'tech and SaaS products',
      creative: 'creative professionals and agencies',
      nonprofit: 'nonprofits and government',
    };
    parts.push(`Optimized for ${personaNames[persona] || persona}.`);
  }

  // Intensity
  const intensityDesc: Record<string, string> = {
    subtle: 'Subtle, refined animations that add polish without distraction.',
    normal: 'Balanced animations that are noticeable but not overwhelming.',
    dramatic: 'High-impact animations that create memorable impressions.',
  };
  parts.push(intensityDesc[intensity]);

  // Features
  if (features.length > 0) {
    const featureNames: Record<string, string> = {
      flashlight: 'cursor spotlight effects',
      '3d': '3D visual elements',
      scroll: 'scroll-triggered animations',
      video: 'video backgrounds',
    };
    const featureList = features.map(f => featureNames[f] || f).join(', ');
    parts.push(`Includes ${featureList}.`);
  }

  // Top style
  if (recommended.length > 0) {
    parts.push(`Primary style: ${recommended[0].styleName}.`);
  }

  return parts.join(' ');
}

// ============================================================================
// UTILITY: GET DEFAULT STYLES FOR PERSONA
// ============================================================================

export function getDefaultStylesForPersona(persona: string): string[] {
  return (wizardData.personaDefaults as Record<string, string[]>)[persona] || [];
}

// ============================================================================
// UTILITY: VALIDATE ANSWERS
// ============================================================================

export function validateAnswers(answers: WizardAnswer[]): { valid: boolean; missing: string[] } {
  const requiredQuestions = wizardData.questions
    .filter(q => q.type === 'single')
    .map(q => q.id);

  const answeredQuestions = answers.map(a => a.questionId);
  const missing = requiredQuestions.filter(q => !answeredQuestions.includes(q));

  return {
    valid: missing.length === 0,
    missing,
  };
}

export default generateRecommendations;
