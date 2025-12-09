/**
 * Skill Value Intelligence Engine (SVIE)
 * Analyzes skill health, usage patterns, and strategic value
 *
 * Read-only, non-destructive auditing subsystem
 * Generates JSON reports to /reports directory
 */

export { SkillAnalyzer, analyzeSVIE } from './skill-analyzer';
export type { SkillMetrics, SVIEReport } from './skill-analyzer';

export { svieConfig } from './svie-config';
export type { SVIEConfig } from './svie-config';

/**
 * Quick start example:
 *
 * ```typescript
 * import { analyzeSVIE } from '@/shadow-observer/svie';
 *
 * const report = await analyzeSVIE();
 *
 * console.log(report.summary);           // { totalSkills, underutilized, deprecated, bloated }
 * console.log(report.analyzedSkills);    // Array of SkillMetrics
 * console.log(report.insights);          // Strategic recommendations
 * ```
 */
