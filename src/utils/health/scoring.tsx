/**
 * Project Health Scoring System
 * Automated quality assessment with 0-100 scoring
 */

// Import real helper functions
import {
  getTestCoverage,
  checkCodeComplexity,
  checkDocumentation,
  checkTypeScriptConfig,
  checkErrorHandling,
  checkOfflineSupport,
  getBundleSize,
  getCoreWebVitals,
  scanForSecrets,
  checkDependencies,
  checkSemanticHTML,
  checkColorContrast,
  checkFile,
  checkPackageScripts
} from './helpers';

export interface HealthScore {
  overall: number;
  breakdown: CategoryScores;
  issues: HealthIssue[];
  timestamp: string;
}

export interface CategoryScores {
  maintainability: number;
  reliability: number;
  performance: number;
  security: number;
  accessibility: number;
  dx: number;
}

export interface HealthIssue {
  severity: 'critical' | 'major' | 'minor' | 'info';
  category: keyof CategoryScores;
  description: string;
  file?: string;
  line?: number;
  remediation: string;
  effort: 'low' | 'medium' | 'high';
}

// Scoring weights for overall calculation
const CATEGORY_WEIGHTS = {
  maintainability: 0.20,
  reliability: 0.20,
  performance: 0.15,
  security: 0.20,
  accessibility: 0.15,
  dx: 0.10,
};

/**
 * Calculate overall health score from category scores
 */
export function calculateOverallScore(scores: CategoryScores): number {
  let weighted = 0;
  
  for (const [category, score] of Object.entries(scores)) {
    const weight = CATEGORY_WEIGHTS[category as keyof CategoryScores];
    weighted += score * weight;
  }
  
  return Math.round(weighted);
}

/**
 * Get health status emoji and label
 */
export function getHealthStatus(score: number): { emoji: string; label: string; color: string } {
  if (score >= 90) {
    return { emoji: '🟢', label: 'Excellent', color: 'green' };
  }
  if (score >= 70) {
    return { emoji: '🟡', label: 'Good', color: 'yellow' };
  }
  if (score >= 50) {
    return { emoji: '🟠', label: 'Fair', color: 'orange' };
  }
  return { emoji: '🔴', label: 'Critical', color: 'red' };
}

/**
 * Maintainability scoring
 */
export async function scoreMaintainability(): Promise<{ score: number; issues: HealthIssue[] }> {
  const issues: HealthIssue[] = [];
  let score = 100;
  
  // Check test coverage (mock for now)
  const testCoverage = await getTestCoverage();
  if (testCoverage < 80) {
    const penalty = Math.min(30, (80 - testCoverage) * 0.5);
    score -= penalty;
    issues.push({
      severity: testCoverage < 50 ? 'major' : 'minor',
      category: 'maintainability',
      description: `Test coverage is ${testCoverage}% (target: 80%)`,
      remediation: 'Add unit tests for uncovered code paths',
      effort: 'medium',
    });
  }
  
  // Check code complexity
  const complexity = await checkCodeComplexity();
  if (complexity.high > 0) {
    score -= Math.min(15, complexity.high * 5);
    issues.push({
      severity: 'minor',
      category: 'maintainability',
      description: `${complexity.high} functions have high complexity`,
      remediation: 'Refactor complex functions into smaller units',
      effort: 'medium',
    });
  }
  
  // Check documentation
  const docCoverage = await checkDocumentation();
  if (docCoverage < 70) {
    score -= Math.min(15, (70 - docCoverage) * 0.2);
    issues.push({
      severity: 'info',
      category: 'maintainability',
      description: 'Missing documentation for public APIs',
      remediation: 'Add JSDoc comments to exported functions',
      effort: 'low',
    });
  }
  
  return { score: Math.max(0, score), issues };
}

/**
 * Reliability scoring
 */
export async function scoreReliability(): Promise<{ score: number; issues: HealthIssue[] }> {
  const issues: HealthIssue[] = [];
  let score = 100;
  
  // Check TypeScript strict mode
  const tsConfig = await checkTypeScriptConfig();
  if (!tsConfig.strict) {
    score -= 25;
    issues.push({
      severity: 'major',
      category: 'reliability',
      description: 'TypeScript strict mode is disabled',
      remediation: 'Enable strict mode in tsconfig.json',
      effort: 'low',
    });
  }
  
  // Check error handling
  const errorHandling = await checkErrorHandling();
  if (!errorHandling.hasErrorBoundaries) {
    score -= 15;
    issues.push({
      severity: 'major',
      category: 'reliability',
      description: 'Missing React error boundaries',
      remediation: 'Add error boundaries to catch component errors',
      effort: 'low',
    });
  }
  
  // Check offline support
  const offlineSupport = await checkOfflineSupport();
  if (!offlineSupport) {
    score -= 10;
    issues.push({
      severity: 'minor',
      category: 'reliability',
      description: 'No offline fallback implemented',
      remediation: 'Add service worker or offline detection',
      effort: 'medium',
    });
  }
  
  return { score: Math.max(0, score), issues };
}

/**
 * Performance scoring
 */
export async function scorePerformance(): Promise<{ score: number; issues: HealthIssue[] }> {
  const issues: HealthIssue[] = [];
  let score = 100;
  
  // Check bundle size
  const bundleSize = await getBundleSize();
  if (bundleSize > 200) {
    const penalty = Math.min(30, (bundleSize - 200) * 0.1);
    score -= penalty;
    issues.push({
      severity: bundleSize > 500 ? 'major' : 'minor',
      category: 'performance',
      description: `Bundle size is ${bundleSize}KB (target: 200KB)`,
      remediation: 'Enable code splitting and lazy loading',
      effort: 'medium',
    });
  }
  
  // Check Core Web Vitals
  const vitals = await getCoreWebVitals();
  if (vitals.fcp > 1.8) {
    score -= 10;
    issues.push({
      severity: 'minor',
      category: 'performance',
      description: `First Contentful Paint is ${vitals.fcp}s (target: 1.8s)`,
      remediation: 'Optimize initial bundle and critical CSS',
      effort: 'medium',
    });
  }
  
  return { score: Math.max(0, score), issues };
}

/**
 * Security scoring
 */
export async function scoreSecurity(): Promise<{ score: number; issues: HealthIssue[] }> {
  const issues: HealthIssue[] = [];
  let score = 100;
  
  // Check for secrets
  const secrets = await scanForSecrets();
  if (secrets.found > 0) {
    score -= 30;
    issues.push({
      severity: 'critical',
      category: 'security',
      description: `Found ${secrets.found} potential secrets in code`,
      remediation: 'Move secrets to environment variables',
      effort: 'low',
    });
  }
  
  // Check dependencies
  const vulnerabilities = await checkDependencies();
  if (vulnerabilities.critical > 0) {
    score -= vulnerabilities.critical * 10;
    issues.push({
      severity: 'critical',
      category: 'security',
      description: `${vulnerabilities.critical} critical vulnerabilities in dependencies`,
      remediation: 'Run npm audit fix or update vulnerable packages',
      effort: 'low',
    });
  }
  
  return { score: Math.max(0, score), issues };
}

/**
 * Accessibility scoring
 */
export async function scoreAccessibility(): Promise<{ score: number; issues: HealthIssue[] }> {
  const issues: HealthIssue[] = [];
  let score = 100;
  
  // Check semantic HTML
  const semantics = await checkSemanticHTML();
  if (semantics.issues > 0) {
    score -= Math.min(25, semantics.issues * 5);
    issues.push({
      severity: 'minor',
      category: 'accessibility',
      description: `${semantics.issues} semantic HTML issues found`,
      remediation: 'Use proper heading hierarchy and ARIA labels',
      effort: 'low',
    });
  }
  
  // Check color contrast
  const contrast = await checkColorContrast();
  if (contrast.failures > 0) {
    score -= Math.min(20, contrast.failures * 4);
    issues.push({
      severity: 'major',
      category: 'accessibility',
      description: `${contrast.failures} color contrast issues`,
      remediation: 'Adjust colors to meet WCAG AA standards',
      effort: 'low',
    });
  }
  
  return { score: Math.max(0, score), issues };
}

/**
 * Developer Experience scoring
 */
export async function scoreDX(): Promise<{ score: number; issues: HealthIssue[] }> {
  const issues: HealthIssue[] = [];
  let score = 100;
  
  // Check documentation
  const hasReadme = await checkFile('README.md');
  if (!hasReadme) {
    score -= 15;
    issues.push({
      severity: 'minor',
      category: 'dx',
      description: 'Missing README.md',
      remediation: 'Add project documentation',
      effort: 'low',
    });
  }
  
  // Check scripts
  const scripts = await checkPackageScripts();
  if (!scripts.hasLint) {
    score -= 10;
    issues.push({
      severity: 'minor',
      category: 'dx',
      description: 'No linting script configured',
      remediation: 'Add "lint" script to package.json',
      effort: 'low',
    });
  }
  
  return { score: Math.max(0, score), issues };
}

/**
 * Run complete health check
 */
export async function runHealthCheck(): Promise<HealthScore> {
  const [
    maintainability,
    reliability,
    performance,
    security,
    accessibility,
    dx,
  ] = await Promise.all([
    scoreMaintainability(),
    scoreReliability(),
    scorePerformance(),
    scoreSecurity(),
    scoreAccessibility(),
    scoreDX(),
  ]);
  
  const scores: CategoryScores = {
    maintainability: maintainability.score,
    reliability: reliability.score,
    performance: performance.score,
    security: security.score,
    accessibility: accessibility.score,
    dx: dx.score,
  };
  
  const allIssues = [
    ...maintainability.issues,
    ...reliability.issues,
    ...performance.issues,
    ...security.issues,
    ...accessibility.issues,
    ...dx.issues,
  ];
  
  return {
    overall: calculateOverallScore(scores),
    breakdown: scores,
    issues: allIssues,
    timestamp: new Date().toISOString(),
  };
}