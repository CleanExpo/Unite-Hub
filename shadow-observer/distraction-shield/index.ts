/**
 * Distraction Shield Intelligence Module
 * Complete system for analyzing founder focus patterns and distraction impact
 *
 * Read-only, non-destructive auditing subsystem
 * Generates JSON reports to /reports directory
 */

export { analyzeDistractions, DistractionAnalyzer } from './distraction-analyzer';
export type { DistractionAnalysis, DistractionSource } from './distraction-analyzer';

export { analyzeFocusSessions, FocusAnalyzer } from './focus-analyzer';
export type { FocusAnalysis, FocusCategory } from './focus-analyzer';

export { runDistractionShieldAnalysis, executeDistraction Shield } from './run-distraction-shield';
export type { DistractionShieldReport, DistractionShieldOptions } from './run-distraction-shield';

export { distractionConfig } from './distraction-config';
export type { DistractionConfig } from './distraction-config';

/**
 * Quick start example:
 *
 * ```typescript
 * import { runDistractionShieldAnalysis } from '@/shadow-observer/distraction-shield';
 *
 * const report = await runDistractionShieldAnalysis({
 *   tenantId: 'founder-id-123',
 *   days: 7,
 *   founderId: 'founder-id-123'
 * });
 *
 * console.log(report.healthStatus);  // 'excellent' | 'good' | 'moderate' | 'warning' | 'critical'
 * console.log(report.overallScore);  // 0-100
 * console.log(report.actionPlan);    // Array of actionable recommendations
 * ```
 */
