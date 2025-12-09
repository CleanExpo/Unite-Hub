/**
 * Skill Drift Detector (SDD)
 * Detects deviations from system architecture and outdated patterns
 */

export { SkillDriftDetector, detectSkillDrift } from './skill-drift-detector';
export type { DriftIssue, DriftAnalysis } from './skill-drift-detector';

export { driftConfig } from './drift-detector-config';
export type { DriftConfig } from './drift-detector-config';
