/* ----------------------------------------
   Design System
   ----------------------------------------
   Central export for all design system
   utilities, configuration, and validation.
   ---------------------------------------- */

// Configuration
export {
  brandConfig,
  typographyConfig,
  spacingConfig,
  componentPreferences,
  colorTokens,
  animationTokens,
  designSystem,
  getHeadingClasses,
  getBodyClasses,
  getSpecialClasses,
  getSectionSpacing,
  getContainerClasses,
  type BrandConfig,
  type TypographyConfig,
  type SpacingConfig,
  type ComponentPreferences,
  type DesignSystem,
} from "./config";

// Library Registry
export {
  primaryLibraries,
  secondaryLibraries,
  componentSourceMap,
  sourcingHierarchy,
  integrationPatterns,
  getLibraryForComponent,
  getPrimaryLibrary,
  getAllLibraries,
  getLibraryByName,
  getSourcingRecommendation,
  type UILibrary,
  type ComponentCategory,
  type SourcingRecommendation,
} from "./library-registry";

// Pattern Validator
export {
  PatternValidator,
  validator,
  validateContent,
  validateComponent,
  isCompliant,
  getScore,
  usePatternValidation,
  printValidationReport,
  forbiddenPatterns,
  type ForbiddenPattern,
  type ValidationIssue,
  type ValidationResult,
} from "./pattern-validator";
