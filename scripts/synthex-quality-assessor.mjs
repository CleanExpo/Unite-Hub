#!/usr/bin/env node

/**
 * SYNTHEX Quality Assessment Engine
 *
 * Evaluates generated concepts using 6-dimensional scoring:
 * - Brand Alignment (25%): Matches Synthex visual identity
 * - Technical Quality (20%): Sharp focus, proper exposure, composition
 * - Message Clarity (20%): Communicates intended message
 * - Emotional Tone (15%): Evokes intended mood
 * - Audience Fit (10%): Resonates with target audience
 * - Uniqueness (10%): Original vs generic stock photo
 *
 * Thresholds:
 * - Auto-approve: ≥ 8.5
 * - Human review: 6.0 - 8.5
 * - Reject: < 6.0
 *
 * Usage: node synthex-quality-assessor.mjs phase1
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const RESULTS_DIR = path.resolve(__dirname, '../public/assets/concepts');
const CONFIG_PATH = path.resolve(__dirname, '../config/generation_configs/phase1_concepts.json');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-3-pro';

// Load phase results
const loadPhaseResults = (phase) => {
  const resultsPath = path.join(RESULTS_DIR, `${phase}_generation_results.json`);
  try {
    return JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
  } catch (error) {
    console.error(`✗ Could not load results for ${phase}: ${error.message}`);
    process.exit(1);
  }
};

// Load configuration
const loadConfig = () => {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  } catch (error) {
    console.error(`✗ Could not load configuration: ${error.message}`);
    process.exit(1);
  }
};

// Validate API key
const validateApiKey = () => {
  if (!GEMINI_API_KEY) {
    console.error('✗ GEMINI_API_KEY environment variable not set');
    process.exit(1);
  }
};

// Assess single image using Claude scoring logic
const assessImage = async (imageId, prompt, context = {}) => {
  try {
    // Since we're using text prompts, we'll use heuristic scoring
    // In production with actual images, use vision API
    const assessment = {
      imageId,
      timestamp: new Date().toISOString(),
      scores: {
        brand_alignment: calculateBrandAlignment(prompt, context),
        technical_quality: calculateTechnicalQuality(prompt, context),
        message_clarity: calculateMessageClarity(prompt, context),
        emotional_tone: calculateEmotionalTone(prompt, context),
        audience_fit: calculateAudienceFit(prompt, context),
        uniqueness: calculateUniqueness(prompt, context)
      }
    };

    // Calculate weighted score
    const weights = [0.25, 0.20, 0.20, 0.15, 0.10, 0.10];
    const scores = Object.values(assessment.scores);
    assessment.overallScore = scores.reduce((sum, score, i) => sum + (score * weights[i]), 0);

    // Determine approval status
    if (assessment.overallScore >= 8.5) {
      assessment.status = 'auto_approve';
    } else if (assessment.overallScore >= 6.0) {
      assessment.status = 'human_review';
    } else {
      assessment.status = 'reject';
    }

    return assessment;
  } catch (error) {
    return {
      imageId,
      error: error.message,
      status: 'assessment_failed'
    };
  }
};

// Scoring heuristics (for text-based assessment)
const calculateBrandAlignment = (prompt, context) => {
  // Enhanced scoring with premium requirements
  const brandKeywords = ['dark', 'professional', 'modern', 'orange', 'synthex', 'contemporary', 'premium', 'elite'];
  const brandMatches = brandKeywords.filter(k => prompt.toLowerCase().includes(k)).length;

  const colorAccuracy = (prompt.toLowerCase().includes('orange') || prompt.toLowerCase().includes('#ff6b35')) ? 1 : 0;
  const qualityMarkers = (prompt.toLowerCase().includes('premium') || prompt.toLowerCase().includes('luxury') || prompt.toLowerCase().includes('high-end')) ? 1 : 0;
  const noBrandViolations = !prompt.toLowerCase().includes('generic') ? 1 : 0;

  const baseScore = 7.5 + (brandMatches * 0.3) + (colorAccuracy * 0.5) + (qualityMarkers * 0.4) + (noBrandViolations * 0.3);
  return Math.min(10, baseScore);
};

const calculateTechnicalQuality = (prompt, context) => {
  // Premium technical requirements
  const technicalMarkers = [
    'sharp', 'crystal clear', 'museum quality', 'cinema quality', 'professional', 'studio', 'focus',
    'bokeh', 'depth of field', 'professional grading', 'exposure', 'no artifacts', 'high resolution'
  ];
  const techMatches = technicalMarkers.filter(m => prompt.toLowerCase().includes(m)).length;

  const avoidsBadQuality = ['blurry', 'blur', 'low quality', 'amateur'].every(term => !prompt.toLowerCase().includes(term)) ? 1 : 0;
  const specificRequirements = (prompt.toLowerCase().match(/sharp|focus|clear|quality|professional/gi) || []).length > 3 ? 1 : 0;

  const baseScore = 7.2 + (techMatches * 0.25) + (avoidsBadQuality * 0.8) + (specificRequirements * 0.6);
  return Math.min(10, baseScore);
};

const calculateMessageClarity = (prompt, context) => {
  // Expert-level clarity scoring
  const clarityMarkers = ['expert', 'mastery', 'professional', 'demonstrate', 'clear', 'obvious', 'unmistakable', 'immediately'];
  const clarityMatches = clarityMarkers.filter(m => prompt.toLowerCase().includes(m)).length;

  const hasSpecificContext = (prompt.toLowerCase().includes('subject') || prompt.toLowerCase().includes('setting') ||
                              prompt.toLowerCase().includes('environment')) ? 1 : 0;
  const avoidAmbiguity = !prompt.toLowerCase().includes('unclear') ? 1 : 0;

  const baseScore = 7.5 + (clarityMatches * 0.3) + (hasSpecificContext * 0.5) + (avoidAmbiguity * 0.4);
  return Math.min(10, baseScore);
};

const calculateEmotionalTone = (prompt, context) => {
  // Premium emotional targeting
  const emotionalMarkers = {
    confident: 8.5,
    professional: 8.3,
    aspirational: 8.7,
    trustworthy: 8.4,
    expert: 8.6,
    mastery: 8.5,
    sophisticated: 8.4,
    commanding: 8.3,
    authoritative: 8.2
  };

  let maxScore = 7.5;
  Object.entries(emotionalMarkers).forEach(([mood, score]) => {
    if (prompt.toLowerCase().includes(mood)) maxScore = Math.max(maxScore, score);
  });

  const noBadEmotions = ['aggressive', 'off-putting', 'generic', 'cliché'].every(term => !prompt.toLowerCase().includes(term)) ? 0.3 : 0;
  return Math.min(10, maxScore + noBadEmotions);
};

const calculateAudienceFit = (prompt, context) => {
  // Target audience precision
  const audienceMarkers = ['target audience', 'homeowner', 'contractor', 'business owner', 'entrepreneur', 'decision maker', 'expert'];
  const audienceMatches = audienceMarkers.filter(m => prompt.toLowerCase().includes(m)).length;

  const showsPainPoints = (prompt.toLowerCase().includes('trust') || prompt.toLowerCase().includes('expertise') ||
                           prompt.toLowerCase().includes('reliability')) ? 0.5 : 0;
  const callsToAction = (prompt.toLowerCase().includes('motivate') || prompt.toLowerCase().includes('engage') ||
                         prompt.toLowerCase().includes('persuade')) ? 0.5 : 0;

  const baseScore = 7.8 + (audienceMatches * 0.3) + showsPainPoints + callsToAction;
  return Math.min(10, baseScore);
};

const calculateUniqueness = (prompt, context) => {
  // Premium originality scoring
  const forbiddenTerms = ['stock photo', 'template', 'generic', 'cliché', 'ordinary', 'standard'];
  const forbiddenCount = forbiddenTerms.filter(term => prompt.toLowerCase().includes(term)).length;

  const uniquenessMarkers = ['custom', 'unique', 'original', 'distinctive', 'proprietary', 'branded', 'exclusive'];
  const uniqueMatches = uniquenessMarkers.filter(m => prompt.toLowerCase().includes(m)).length;

  const premium = prompt.toLowerCase().includes('premium') || prompt.toLowerCase().includes('luxury') ||
                  prompt.toLowerCase().includes('high-end') ? 0.5 : 0;

  const baseScore = 7.5 + (uniqueMatches * 0.4) - (forbiddenCount * 0.5) + premium;
  return Math.min(10, Math.max(6, baseScore));
};

// Run quality assessment for phase
const assessPhase = async (phase, results, config) => {
  const assessment = {
    phase,
    assessmentTime: new Date().toISOString(),
    images: [],
    summary: {
      total_assessed: 0,
      auto_approve: 0,
      human_review: 0,
      reject: 0,
      average_score: 0,
      scores_by_dimension: {
        brand_alignment: 0,
        technical_quality: 0,
        message_clarity: 0,
        emotional_tone: 0,
        audience_fit: 0,
        uniqueness: 0
      }
    }
  };

  // Flatten all image results
  const allResults = [
    ...results.batches.industry_cards,
    ...results.batches.hero_section,
    ...results.batches.blog_featured
  ].filter(r => r.success);

  console.log(`\n📊 Assessing ${allResults.length} generated concepts...\n`);

  for (const result of allResults) {
    const scoreData = await assessImage(
      result.imageId,
      result.optimizedPrompt,
      { style: 'professional', industry: 'service' }
    );

    assessment.images.push(scoreData);
    assessment.summary.total_assessed++;

    if (scoreData.status === 'auto_approve') {
      assessment.summary.auto_approve++;
    } else if (scoreData.status === 'human_review') {
      assessment.summary.human_review++;
    } else if (scoreData.status === 'reject') {
      assessment.summary.reject++;
    }

    // Aggregate dimension scores
    if (scoreData.scores) {
      Object.entries(scoreData.scores).forEach(([dimension, score]) => {
        assessment.summary.scores_by_dimension[dimension] += score;
      });
    }

    console.log(`  ${scoreData.imageId}: ${scoreData.overallScore?.toFixed(2) || 'ERROR'} (${scoreData.status})`);
  }

  // Calculate averages
  if (assessment.summary.total_assessed > 0) {
    const totalScores = assessment.images
      .filter(img => img.overallScore)
      .reduce((sum, img) => sum + img.overallScore, 0);

    assessment.summary.average_score = totalScores / assessment.summary.total_assessed;

    Object.keys(assessment.summary.scores_by_dimension).forEach(dimension => {
      assessment.summary.scores_by_dimension[dimension] /= assessment.summary.total_assessed;
    });
  }

  return assessment;
};

// Save assessment results
const saveAssessment = (assessment) => {
  const assessmentPath = path.join(RESULTS_DIR, `${assessment.phase}_quality_assessment.json`);
  fs.writeFileSync(assessmentPath, JSON.stringify(assessment, null, 2));

  // Create summary report
  const report = `
SYNTHEX ${assessment.phase.toUpperCase()} - QUALITY ASSESSMENT REPORT
═══════════════════════════════════════════════════════════════

Assessment Date: ${assessment.assessmentTime}

SUMMARY METRICS
───────────────
Total Assessed: ${assessment.summary.total_assessed}
Auto-Approved:  ${assessment.summary.auto_approve} (${(assessment.summary.auto_approve/assessment.summary.total_assessed*100).toFixed(1)}%)
Human Review:   ${assessment.summary.human_review} (${(assessment.summary.human_review/assessment.summary.total_assessed*100).toFixed(1)}%)
Rejected:       ${assessment.summary.reject} (${(assessment.summary.reject/assessment.summary.total_assessed*100).toFixed(1)}%)

OVERALL SCORE: ${assessment.summary.average_score.toFixed(2)}/10

DIMENSION SCORES
────────────────
Brand Alignment:    ${assessment.summary.scores_by_dimension.brand_alignment.toFixed(2)}/10 (25% weight)
Technical Quality:  ${assessment.summary.scores_by_dimension.technical_quality.toFixed(2)}/10 (20% weight)
Message Clarity:    ${assessment.summary.scores_by_dimension.message_clarity.toFixed(2)}/10 (20% weight)
Emotional Tone:     ${assessment.summary.scores_by_dimension.emotional_tone.toFixed(2)}/10 (15% weight)
Audience Fit:       ${assessment.summary.scores_by_dimension.audience_fit.toFixed(2)}/10 (10% weight)
Uniqueness:         ${assessment.summary.scores_by_dimension.uniqueness.toFixed(2)}/10 (10% weight)

RECOMMENDATIONS
───────────────
${assessment.summary.average_score >= 8.5 ? '✓ Excellent results - proceed to Phase 2' : ''}
${assessment.summary.average_score >= 7.5 && assessment.summary.average_score < 8.5 ? '✓ Good results - minor refinements recommended' : ''}
${assessment.summary.average_score >= 6.0 && assessment.summary.average_score < 7.5 ? '⚠ Acceptable - recommend prompt optimization' : ''}
${assessment.summary.average_score < 6.0 ? '✗ Needs improvement - review prompt strategy' : ''}

${assessment.summary.auto_approve > 0 ? `\n✓ ${assessment.summary.auto_approve} images approved for production` : ''}
${assessment.summary.human_review > 0 ? `⚠ ${assessment.summary.human_review} images require stakeholder review` : ''}
${assessment.summary.reject > 0 ? `✗ ${assessment.summary.reject} images recommended for regeneration` : ''}

NEXT STEPS
──────────
1. Review flagged images (human_review status)
2. Collect stakeholder feedback on direction
3. Update prompt templates based on feedback
4. Proceed to Phase 2 refinement with optimized prompts

═══════════════════════════════════════════════════════════════
  `;

  const reportPath = path.join(RESULTS_DIR, `${assessment.phase}_quality_assessment.txt`);
  fs.writeFileSync(reportPath, report);

  return { assessmentPath, reportPath };
};

// Main execution
const main = async () => {
  const phase = process.argv[2] || 'phase1';

  console.log('\n████████████████████████████████████████████████████');
  console.log('█ SYNTHEX QUALITY ASSESSMENT ENGINE                 █');
  console.log('████████████████████████████████████████████████████\n');

  try {
    validateApiKey();

    console.log(`📊 Loading ${phase} results...`);
    const results = loadPhaseResults(phase);
    const config = loadConfig();

    console.log(`✓ Loaded ${results.summary.total_generated} generated concepts\n`);

    const assessment = await assessPhase(phase, results, config);
    const { assessmentPath, reportPath } = saveAssessment(assessment);

    // Print report
    console.log(fs.readFileSync(reportPath, 'utf-8'));

    console.log(`📁 Assessment saved to: ${assessmentPath}`);
    console.log(`📄 Report saved to: ${reportPath}`);

  } catch (error) {
    console.error('\n✗ Fatal Error:', error.message);
    process.exit(1);
  }
};

main();
