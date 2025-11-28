/**
 * Visual System Exports
 * Phase 10: UX-02 Visual System Integration
 *
 * Central export point for all visual persona and style utilities
 */

// Persona definitions and detection
export {
  type VisualPersona,
  type StyleMix,
  type ColourProfile,
  SYNTHEX_PERSONAS,
  getPersona,
  detectPersonaFromContext,
} from "./visualPersonas";

// Style matrix and profile generation
export {
  type VisualStyle,
  type VisualProfile,
  VISUAL_STYLES,
  selectVisualProfile,
  generateImagePrompt,
  generateVideoPrompt,
  getCSSVariablesString,
} from "./visualStyleMatrix";

// Section registry
export {
  type SectionConfig,
  LANDING_SECTIONS,
  getSectionConfig,
  getSectionConfigForPersona,
  getAllSectionIds,
  getSectionsByVariant,
  generateSectionImagePrompt,
  getSectionFallbackImage,
} from "./visualSectionRegistry";

// ============================================================================
// VISUAL EXPERIENCE ENGINE (Phase 10+)
// ============================================================================

// Animation Registry and Orchestrator
export { AnimationRegistry, CommonTransitions, getRegistry } from './animations/animationRegistry';
export { AnimationOrchestrator, getOrchestrator } from './animationOrchestrator';

// Animation Styles
export { animationStyles, stylesByMood, stylesForPersona } from './animationStyles';

// Style Profile System
export {
  createStyleProfile,
  createProfileFromWizard,
  serializeProfile,
  deserializeProfile,
  compareProfiles,
  getOrchestratorContext,
  prepareProfileForExport,
} from './styleProfile';
export type {
  StyleProfile,
  StyleProfileSummary,
  OrchestratorStyleContext,
  ProfileExportData,
} from './styleProfile';

// Animation Style Recommender
export {
  calculateScores,
  detectPersona,
  detectIntensity,
  detectFeatures,
  matchStylesToScores,
  generateRecommendations,
  getDefaultStylesForPersona,
  validateAnswers,
} from './animationStyleRecommender';
export type {
  WizardAnswer,
  StyleScore,
  RecommendationResult,
} from './animationStyleRecommender';

// Pack Builder
export {
  generatePackContent,
  generatePackHTML,
  downloadPack,
  exportPackAsJSON,
} from './animationPackBuilder';
export type {
  AnimationPackConfig,
  PackSection,
} from './animationPackBuilder';
