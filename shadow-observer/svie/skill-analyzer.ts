/**
 * Skill Value Intelligence Engine (SVIE)
 * Analyzes skill health, usage, expertise value, and impact
 * Read-only, non-destructive analysis
 */

import fs from 'fs';
import path from 'path';
import { svieConfig } from './svie-config';

export interface SkillMetrics {
  name: string;
  path: string;
  fileSize: number;
  lastModified: string;
  hasDocumentation: boolean;
  docLength: number;
  usageCount: number;
  lastUsed?: string;
  expertiseScore: number;      // 1-10
  healthScore: number;         // 1-10
  performanceScore: number;    // 1-10
  overallValue: number;        // 1-10 weighted
  riskFlags: string[];
  recommendations: string[];
}

export interface SVIEReport {
  timestamp: string;
  totalSkills: number;
  analyzedSkills: SkillMetrics[];
  summary: {
    avgValue: number;
    highValueSkills: string[];
    underutilizedSkills: string[];
    deprecatedSkills: string[];
    bloatedSkills: string[];
    poorHealthSkills: string[];
  };
  insights: string[];
}

/**
 * Scan skill directory and collect metadata
 */
function scanSkillDirectory(): string[] {
  if (!fs.existsSync(svieConfig.skillRoot)) {
    console.warn(`⚠️  Skill directory not found: ${svieConfig.skillRoot}`);
    return [];
  }

  const entries = fs.readdirSync(svieConfig.skillRoot, { withFileTypes: true });
  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);
}

/**
 * Calculate expertise score based on documentation length and complexity
 */
function calculateExpertiseScore(docLength: number, codeLines: number): number {
  // Well-documented, substantial skills score higher
  let score = 5; // baseline

  if (docLength > 5000) score += 2;
  if (docLength > 10000) score += 1;
  if (codeLines > 500) score += 1;
  if (codeLines > 1000) score += 0.5;

  return Math.min(score, 10);
}

/**
 * Calculate health score based on documentation completeness
 */
function calculateHealthScore(
  hasReadme: boolean,
  hasTests: boolean,
  docLength: number,
  fileSize: number,
  lastModified: Date
): number {
  let score = 5;

  // Documentation
  if (hasReadme) score += 2;
  if (docLength > 2000) score += 1;

  // Testing
  if (hasTests) score += 1.5;

  // Maintenance (modified recently)
  const daysOld = (Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24);
  if (daysOld < 30) score += 1;
  if (daysOld > 180) score -= 2;

  // Not bloated
  if (fileSize < svieConfig.maxFileSize) score += 0.5;

  return Math.min(Math.max(score, 1), 10);
}

/**
 * Calculate performance score (proxy metrics)
 */
function calculatePerformanceScore(fileSize: number, complexity: number): number {
  let score = 7; // baseline good

  // Smaller files = better performance potential
  if (fileSize < 10000) score += 1;
  if (fileSize > svieConfig.maxFileSize) score -= 2;

  // Lower complexity = better performance
  if (complexity < 5) score += 1;
  if (complexity > 15) score -= 1;

  return Math.min(Math.max(score, 1), 10);
}

/**
 * Load usage data from logs
 */
function loadUsageData(): Map<string, { count: number; lastUsed: string }> {
  const usageMap = new Map();

  if (!fs.existsSync(svieConfig.usageLogPath)) {
    return usageMap;
  }

  try {
    const logContent = fs.readFileSync(svieConfig.usageLogPath, 'utf-8');
    const lines = logContent.split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line);
        if (entry.skillName) {
          const existing = usageMap.get(entry.skillName) || { count: 0, lastUsed: '' };
          existing.count = (existing.count || 0) + 1;
          existing.lastUsed = entry.timestamp || existing.lastUsed;
          usageMap.set(entry.skillName, existing);
        }
      } catch {
        // Skip malformed lines
      }
    }
  } catch (error) {
    console.warn('Could not load usage data:', error);
  }

  return usageMap;
}

/**
 * Analyze a single skill
 */
function analyzeSkill(skillName: string, usageData: Map<string, any>): SkillMetrics {
  const skillPath = path.join(svieConfig.skillRoot, skillName);
  const skillMdPath = path.join(skillPath, 'skill.md');
  const readmePath = path.join(skillPath, 'README.md');
  const testsPath = path.join(skillPath, 'tests');

  // Basic metrics
  const stats = fs.statSync(skillPath);
  const lastModified = stats.mtime;

  // Documentation
  let docLength = 0;
  let hasDocumentation = false;
  const hasReadme = fs.existsSync(readmePath);
  const hasTests = fs.existsSync(testsPath);

  if (fs.existsSync(skillMdPath)) {
    const docContent = fs.readFileSync(skillMdPath, 'utf-8');
    docLength = docContent.length;
    hasDocumentation = true;
  }

  // File size (sum of all files in skill directory)
  let totalFileSize = 0;
  function sizeDir(dir: string): number {
    let size = 0;
    try {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      for (const file of files) {
        if (file.isDirectory()) {
          size += sizeDir(path.join(dir, file.name));
        } else {
          size += fs.statSync(path.join(dir, file.name)).size;
        }
      }
    } catch {
      // ignore errors
    }
    return size;
  }
  totalFileSize = sizeDir(skillPath);

  // Usage data
  const usage = usageData.get(skillName) || { count: 0, lastUsed: undefined };

  // Calculate scores
  const codeLines = docLength > 0 ? Math.floor(docLength / 50) : 0; // Rough estimate
  const expertiseScore = calculateExpertiseScore(docLength, codeLines);
  const healthScore = calculateHealthScore(hasReadme, hasTests, docLength, totalFileSize, lastModified);
  const performanceScore = calculatePerformanceScore(totalFileSize, codeLines);

  // Weighted overall value
  const overallValue =
    expertiseScore * svieConfig.scoreWeights.expertise +
    healthScore * svieConfig.scoreWeights.health +
    performanceScore * svieConfig.scoreWeights.performance +
    (Math.min(usage.count / 50, 1) * 10) * svieConfig.scoreWeights.usage;

  // Risk flags
  const riskFlags: string[] = [];
  if (usage.count < svieConfig.minActivityThreshold) riskFlags.push('underutilized');
  if (usage.count === 0) riskFlags.push('deprecated');
  if (totalFileSize > svieConfig.maxFileSize) riskFlags.push('bloated');
  if (healthScore < 5) riskFlags.push('poor_health');
  if (!hasReadme) riskFlags.push('missing_documentation');
  if (!hasTests) riskFlags.push('no_tests');

  // Recommendations
  const recommendations: string[] = [];
  if (riskFlags.includes('underutilized')) {
    recommendations.push('Consider consolidating or removing this skill if not needed');
  }
  if (riskFlags.includes('bloated')) {
    recommendations.push('Skill is too large - consider breaking into smaller focused skills');
  }
  if (riskFlags.includes('missing_documentation')) {
    recommendations.push('Add comprehensive documentation to improve discoverability');
  }
  if (riskFlags.includes('no_tests')) {
    recommendations.push('Add test coverage to ensure reliability');
  }
  if (expertiseScore > 9 && usage.count > svieConfig.minActivityThreshold) {
    recommendations.push('High-value skill - consider promoting or expanding');
  }

  return {
    name: skillName,
    path: skillPath,
    fileSize: totalFileSize,
    lastModified: lastModified.toISOString(),
    hasDocumentation,
    docLength,
    usageCount: usage.count,
    lastUsed: usage.lastUsed,
    expertiseScore,
    healthScore,
    performanceScore,
    overallValue: Math.round(overallValue * 10) / 10,
    riskFlags,
    recommendations
  };
}

/**
 * Run full SVIE analysis
 */
export async function analyzeSVIE(): Promise<SVIEReport> {
  console.log('🔬 Starting Skill Value Intelligence Engine (SVIE) analysis...');

  const skillNames = scanSkillDirectory();
  const usageData = loadUsageData();

  const analyzedSkills: SkillMetrics[] = [];

  for (const skillName of skillNames) {
    try {
      const metrics = analyzeSkill(skillName, usageData);
      analyzedSkills.push(metrics);
    } catch (error) {
      console.warn(`⚠️  Failed to analyze skill "${skillName}":`, error);
    }
  }

  // Sort by overall value
  analyzedSkills.sort((a, b) => b.overallValue - a.overallValue);

  // Generate summary
  const avgValue = analyzedSkills.length > 0
    ? Math.round((analyzedSkills.reduce((sum, s) => sum + s.overallValue, 0) / analyzedSkills.length) * 10) / 10
    : 0;

  const summary = {
    avgValue,
    highValueSkills: analyzedSkills
      .filter(s => s.overallValue >= 9)
      .map(s => s.name),
    underutilizedSkills: analyzedSkills
      .filter(s => s.usageCount < svieConfig.minActivityThreshold)
      .map(s => s.name),
    deprecatedSkills: analyzedSkills
      .filter(s => s.usageCount === 0)
      .map(s => s.name),
    bloatedSkills: analyzedSkills
      .filter(s => s.fileSize > svieConfig.maxFileSize)
      .map(s => s.name),
    poorHealthSkills: analyzedSkills
      .filter(s => s.healthScore < 5)
      .map(s => s.name)
  };

  // Generate insights
  const insights: string[] = [];

  if (summary.highValueSkills.length > 0) {
    insights.push(`✓ ${summary.highValueSkills.length} high-value skills (score ≥9): ${summary.highValueSkills.join(', ')}`);
  }

  if (summary.deprecatedSkills.length > 0) {
    insights.push(`⚠️  ${summary.deprecatedSkills.length} deprecated skills (never used): ${summary.deprecatedSkills.join(', ')}`);
  }

  if (summary.underutilizedSkills.length > 0) {
    insights.push(`⚠️  ${summary.underutilizedSkills.length} underutilized skills: ${summary.underutilizedSkills.slice(0, 5).join(', ')}`);
  }

  if (summary.bloatedSkills.length > 0) {
    insights.push(`⚠️  ${summary.bloatedSkills.length} skills exceed size threshold - consider refactoring`);
  }

  insights.push(`📊 Average skill value: ${avgValue}/10`);
  insights.push(`📈 Total skills analyzed: ${analyzedSkills.length}`);

  const report: SVIEReport = {
    timestamp: new Date().toISOString(),
    totalSkills: analyzedSkills.length,
    analyzedSkills,
    summary,
    insights
  };

  console.log(`✓ SVIE analysis complete: ${analyzedSkills.length} skills analyzed`);

  return report;
}
