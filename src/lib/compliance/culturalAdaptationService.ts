/**
 * Cultural Adaptation Service
 * Phase 93: Apply locale-aware tone, spelling, and adaptation
 */

import type {
  LocaleProfile,
  AdaptedCopyResult,
  CulturalNotes
} from './complianceTypes';
import {
  getSpellingDifferences,
  checkUpcomingHolidays
} from './localeProfileService';

interface AdaptCopyParams {
  text: string;
  localeProfile: LocaleProfile;
  sourceVariant?: string;
}

/**
 * Adapt copy to locale-specific spelling and tone
 */
export async function adaptCopyToLocale(
  params: AdaptCopyParams
): Promise<AdaptedCopyResult> {
  const { text, localeProfile, sourceVariant = 'american' } = params;

  const changes: AdaptedCopyResult['changes'] = [];
  let adaptedText = text;

  // Apply spelling changes
  const spellingDiffs = getSpellingDifferences(
    sourceVariant,
    localeProfile.spellingVariant
  );

  for (const [from, to] of Object.entries(spellingDiffs)) {
    const regex = new RegExp(`\\b${from}\\b`, 'gi');
    if (regex.test(adaptedText)) {
      adaptedText = adaptedText.replace(regex, to);
      changes.push({
        type: 'spelling',
        original: from,
        adapted: to,
        reason: `${localeProfile.spellingVariant} spelling`,
      });
    }
  }

  // Check for sensitivity issues
  for (const flag of localeProfile.sensitivityFlags) {
    const flagLower = flag.toLowerCase().replace(/_/g, ' ');
    if (text.toLowerCase().includes(flagLower)) {
      changes.push({
        type: 'sensitivity',
        original: flag,
        adapted: flag,
        reason: `Topic requires cultural sensitivity in ${localeProfile.regionSlug}`,
      });
    }
  }

  return {
    originalText: text,
    adaptedText,
    changes,
    localeCode: localeProfile.localeCode,
  };
}

/**
 * Suggest cultural adjustments for content
 */
export async function suggestCulturalAdjustments(params: {
  text: string;
  localeProfile: LocaleProfile;
}): Promise<CulturalNotes> {
  const { text, localeProfile } = params;

  const suggestions: CulturalNotes['suggestions'] = [];
  const sensitivityWarnings: string[] = [];

  // Check tone guidelines
  const tone = localeProfile.toneGuidelines;

  // Check for overly formal/informal language
  if (tone.formality === 'casual' || tone.formality === 'casual-professional') {
    const formalPhrases = [
      'I am pleased to inform you',
      'pursuant to',
      'herewith',
      'aforementioned',
    ];
    for (const phrase of formalPhrases) {
      if (text.toLowerCase().includes(phrase)) {
        suggestions.push({
          type: 'tone',
          suggestion: `Consider less formal phrasing instead of "${phrase}"`,
          reason: `${localeProfile.regionSlug} audiences prefer ${tone.formality} tone`,
        });
      }
    }
  }

  // Check for overly enthusiastic language in reserved cultures
  if (tone.directness === 'polite-indirect') {
    const enthusiasticPhrases = ['amazing', 'incredible', 'best ever', 'guaranteed'];
    for (const phrase of enthusiasticPhrases) {
      if (text.toLowerCase().includes(phrase)) {
        suggestions.push({
          type: 'tone',
          suggestion: `Consider more understated language instead of "${phrase}"`,
          reason: `${localeProfile.regionSlug} audiences may find excessive enthusiasm off-putting`,
        });
      }
    }
  }

  // Check humor appropriateness
  if (tone.humor === 'dry-wit-appreciated' || tone.humor === 'self-deprecating') {
    const directHumor = ['lol', 'haha', '😂', 'rofl'];
    for (const phrase of directHumor) {
      if (text.toLowerCase().includes(phrase)) {
        suggestions.push({
          type: 'tone',
          suggestion: `Consider more subtle humor instead of "${phrase}"`,
          reason: `${localeProfile.regionSlug} audiences appreciate ${tone.humor}`,
        });
      }
    }
  }

  // Check sensitivity flags
  for (const flag of localeProfile.sensitivityFlags) {
    const flagWords = flag.toLowerCase().replace(/_/g, ' ').split(' ');
    const hasFlag = flagWords.some(word => text.toLowerCase().includes(word));

    if (hasFlag) {
      sensitivityWarnings.push(
        `Content may touch on "${flag}" - this topic requires extra care in ${localeProfile.regionSlug}`
      );
    }
  }

  // Check upcoming holidays
  const upcomingHolidays = checkUpcomingHolidays(localeProfile, 14);

  if (upcomingHolidays.length > 0) {
    for (const holiday of upcomingHolidays) {
      if (holiday.note) {
        suggestions.push({
          type: 'cultural',
          suggestion: `Upcoming: ${holiday.name} (${holiday.date})`,
          reason: holiday.note,
        });
      }
    }
  }

  return {
    suggestions,
    sensitivityWarnings,
    upcomingHolidays,
  };
}

/**
 * Get tone recommendation for locale
 */
export function getToneRecommendation(localeProfile: LocaleProfile): string {
  const tone = localeProfile.toneGuidelines;
  const parts: string[] = [];

  if (tone.formality) {
    parts.push(`**Formality**: ${tone.formality}`);
  }
  if (tone.directness) {
    parts.push(`**Directness**: ${tone.directness}`);
  }
  if (tone.humor) {
    parts.push(`**Humor**: ${tone.humor}`);
  }
  if (tone.notes) {
    parts.push(`**Notes**: ${tone.notes}`);
  }

  return parts.join('\n');
}
