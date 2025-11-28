/**
 * Style Profile
 *
 * Represents a client's animation style preferences.
 * Used by the orchestrator for consistent recommendations.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface StyleProfile {
  id: string;
  clientName: string;
  brandName?: string;
  createdAt: string;
  updatedAt: string;

  // Core preferences
  persona: string;
  intensity: 'subtle' | 'normal' | 'dramatic';
  mood: string[];

  // Style selections
  preferredStyles: string[];
  doNotUseStyles: string[];

  // Feature toggles
  features: {
    flashlightCursor: boolean;
    threeDElements: boolean;
    scrollAnimations: boolean;
    videoBackgrounds: boolean;
    magneticElements: boolean;
  };

  // Notes and context
  notes: string;
  industry?: string;
  audienceDescription?: string;

  // Wizard answers (for re-running)
  wizardAnswers?: Array<{
    questionId: string;
    selectedOptionIds: string[];
  }>;
}

export interface StyleProfileSummary {
  id: string;
  clientName: string;
  persona: string;
  styleCount: number;
  createdAt: string;
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export function createStyleProfile(
  clientName: string,
  options: Partial<StyleProfile> = {}
): StyleProfile {
  const now = new Date().toISOString();

  return {
    id: generateProfileId(),
    clientName,
    createdAt: now,
    updatedAt: now,
    persona: options.persona || 'default',
    intensity: options.intensity || 'normal',
    mood: options.mood || [],
    preferredStyles: options.preferredStyles || [],
    doNotUseStyles: options.doNotUseStyles || [],
    features: options.features || {
      flashlightCursor: false,
      threeDElements: false,
      scrollAnimations: true,
      videoBackgrounds: false,
      magneticElements: false,
    },
    notes: options.notes || '',
    industry: options.industry,
    audienceDescription: options.audienceDescription,
    wizardAnswers: options.wizardAnswers,
    brandName: options.brandName,
  };
}

export function createProfileFromWizard(
  clientName: string,
  recommendationResult: {
    recommended: Array<{ styleId: string }>;
    notRecommended: string[];
    persona: string | null;
    intensity: 'subtle' | 'normal' | 'dramatic';
    features: string[];
  },
  wizardAnswers: Array<{ questionId: string; selectedOptionIds: string[] }>
): StyleProfile {
  return createStyleProfile(clientName, {
    persona: recommendationResult.persona || 'default',
    intensity: recommendationResult.intensity,
    preferredStyles: recommendationResult.recommended.map(r => r.styleId),
    doNotUseStyles: recommendationResult.notRecommended,
    features: {
      flashlightCursor: recommendationResult.features.includes('flashlight'),
      threeDElements: recommendationResult.features.includes('3d'),
      scrollAnimations: recommendationResult.features.includes('scroll'),
      videoBackgrounds: recommendationResult.features.includes('video'),
      magneticElements: false,
    },
    wizardAnswers,
  });
}

// ============================================================================
// SERIALIZATION
// ============================================================================

export function serializeProfile(profile: StyleProfile): string {
  return JSON.stringify(profile, null, 2);
}

export function deserializeProfile(json: string): StyleProfile | null {
  try {
    const parsed = JSON.parse(json);
    // Basic validation
    if (!parsed.id || !parsed.clientName || !parsed.preferredStyles) {
      return null;
    }
    return parsed as StyleProfile;
  } catch {
    return null;
  }
}

// ============================================================================
// PROFILE COMPARISON
// ============================================================================

export function compareProfiles(
  a: StyleProfile,
  b: StyleProfile
): { similar: boolean; differences: string[] } {
  const differences: string[] = [];

  if (a.persona !== b.persona) {
    differences.push(`Persona: ${a.persona} vs ${b.persona}`);
  }
  if (a.intensity !== b.intensity) {
    differences.push(`Intensity: ${a.intensity} vs ${b.intensity}`);
  }

  const aStyles = new Set(a.preferredStyles);
  const bStyles = new Set(b.preferredStyles);
  const sharedStyles = [...aStyles].filter(s => bStyles.has(s));

  if (sharedStyles.length < Math.min(aStyles.size, bStyles.size) / 2) {
    differences.push('Different style preferences');
  }

  return {
    similar: differences.length <= 1,
    differences,
  };
}

// ============================================================================
// PROFILE FOR ORCHESTRATOR
// ============================================================================

export interface OrchestratorStyleContext {
  persona: string;
  intensity: string;
  preferredStyles: string[];
  doNotUseStyles: string[];
  enableFlashlight: boolean;
  enable3D: boolean;
}

export function getOrchestratorContext(profile: StyleProfile): OrchestratorStyleContext {
  return {
    persona: profile.persona,
    intensity: profile.intensity,
    preferredStyles: profile.preferredStyles,
    doNotUseStyles: profile.doNotUseStyles,
    enableFlashlight: profile.features.flashlightCursor,
    enable3D: profile.features.threeDElements,
  };
}

// ============================================================================
// EXPORT FOR PDF
// ============================================================================

export interface ProfileExportData {
  clientName: string;
  brandName?: string;
  createdAt: string;
  summary: string;
  styles: Array<{
    id: string;
    name: string;
    description: string;
    bestFor: string[];
  }>;
  settings: {
    persona: string;
    intensity: string;
    features: string[];
  };
  notes: string;
}

export function prepareProfileForExport(
  profile: StyleProfile,
  styleDetails: Array<{ id: string; name: string; description: string; bestFor?: string[] }>
): ProfileExportData {
  const enabledFeatures: string[] = [];
  if (profile.features.flashlightCursor) enabledFeatures.push('Cursor Spotlight');
  if (profile.features.threeDElements) enabledFeatures.push('3D Elements');
  if (profile.features.scrollAnimations) enabledFeatures.push('Scroll Animations');
  if (profile.features.videoBackgrounds) enabledFeatures.push('Video Backgrounds');
  if (profile.features.magneticElements) enabledFeatures.push('Magnetic Elements');

  const styles = profile.preferredStyles.map(styleId => {
    const detail = styleDetails.find(d => d.id === styleId);
    return {
      id: styleId,
      name: detail?.name || styleId,
      description: detail?.description || '',
      bestFor: detail?.bestFor || [],
    };
  });

  const personaNames: Record<string, string> = {
    trade: 'Trade & Service Businesses',
    consumer: 'Homeowners & Consumers',
    corporate: 'Corporate & B2B',
    saas: 'Tech & SaaS',
    creative: 'Creative & Agencies',
    nonprofit: 'Government & Nonprofit',
    default: 'General Purpose',
  };

  return {
    clientName: profile.clientName,
    brandName: profile.brandName,
    createdAt: profile.createdAt,
    summary: `Animation style profile optimized for ${personaNames[profile.persona] || profile.persona} with ${profile.intensity} intensity. Includes ${styles.length} recommended styles.`,
    styles,
    settings: {
      persona: personaNames[profile.persona] || profile.persona,
      intensity: profile.intensity.charAt(0).toUpperCase() + profile.intensity.slice(1),
      features: enabledFeatures,
    },
    notes: profile.notes,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function generateProfileId(): string {
  return `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default StyleProfile;
