/**
 * Skill Drift Detector (SDD)
 * Detects deviations from system architecture and outdated patterns
 *
 * Read-only analysis - identifies drift issues without modifying code
 */

import fs from 'fs';
import path from 'path';
import { driftConfig } from './drift-detector-config';
import { svieConfig } from '../svie-config';

export interface DriftIssue {
  skillName: string;
  issueType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  location?: string;
  suggestion: string;
}

export interface DriftAnalysis {
  timestamp: string;
  totalSkillsAnalyzed: number;
  skillsWithDrift: number;
  driftFreeSkills: number;
  issues: DriftIssue[];
  driftByCategory: Record<string, number>;
  criticalDrifts: DriftIssue[];
  overallDriftScore: number;
  recommendations: string[];
}

export class SkillDriftDetector {
  /**
   * Analyze single skill for drift patterns
   */
  private analyzeSkill(skillName: string, skillDir: string): DriftIssue[] {
    const issues: DriftIssue[] = [];

    // Check for skill.ts file
    const skillFile = path.join(skillDir, `${skillName}.ts`);
    const skillMd = path.join(skillDir, 'README.md');
    const skillTests = path.join(skillDir, `${skillName}.test.ts`);

    // Check modern schema structure
    if (!fs.existsSync(skillMd)) {
      issues.push({
        skillName,
        issueType: 'missing_documentation',
        severity: 'high',
        description: 'Missing README.md (modern skill standard)',
        suggestion: 'Create README.md with Inputs, Outputs, Implementation sections'
      });
    } else {
      const mdContent = fs.readFileSync(skillMd, 'utf8');

      // Check for required sections
      const requiredSections = driftConfig.architecturePatterns.modernSkillSchema.required;
      const missingSections = requiredSections.filter(section => !mdContent.includes(section));

      if (missingSections.length > 0) {
        issues.push({
          skillName,
          issueType: 'incomplete_documentation',
          severity: 'medium',
          description: `Missing documentation sections: ${missingSections.join(', ')}`,
          suggestion: `Add sections: ${missingSections.join(', ')}`
        });
      }

      // Check for forbidden patterns
      const forbidden = driftConfig.architecturePatterns.modernSkillSchema.forbidden;
      for (const pattern of forbidden) {
        if (mdContent.includes(pattern)) {
          const severity = pattern.includes('cursor://') ? 'high' : 'medium';
          issues.push({
            skillName,
            issueType: 'outdated_pattern',
            severity: severity as 'high' | 'medium',
            description: `Contains outdated reference: ${pattern}`,
            suggestion: `Replace ${pattern} with modern equivalent`
          });
        }
      }
    }

    // Check for test file
    if (!fs.existsSync(skillTests)) {
      issues.push({
        skillName,
        issueType: 'missing_tests',
        severity: 'medium',
        description: 'No test file found',
        suggestion: 'Create test file with unit and integration tests'
      });
    }

    // Check TypeScript compliance if skill file exists
    if (fs.existsSync(skillFile)) {
      const tsContent = fs.readFileSync(skillFile, 'utf8');

      // Check for any type (type safety)
      if (tsContent.includes(': any') || tsContent.includes('as any')) {
        issues.push({
          skillName,
          issueType: 'weak_typing',
          severity: 'medium',
          description: 'Use of `any` type reduces type safety',
          suggestion: 'Replace `any` with proper type definitions'
        });
      }

      // Check error handling
      const hasTry = tsContent.includes('try');
      const hasCatch = tsContent.includes('catch');
      if (!hasTry || !hasCatch) {
        issues.push({
          skillName,
          issueType: 'poor_error_handling',
          severity: 'medium',
          description: 'Lacks proper try-catch error handling',
          suggestion: 'Add try-catch blocks around external calls'
        });
      }

      // Check for insecure patterns
      for (const [patternName, pattern] of Object.entries(driftConfig.outdatedPatterns)) {
        if (pattern instanceof RegExp && pattern.test(tsContent)) {
          issues.push({
            skillName,
            issueType: 'security_concern',
            severity: 'critical',
            description: `Detected insecure pattern: ${patternName}`,
            suggestion: `Remove ${patternName} - security risk`
          });
        }
      }
    }

    // Check file size (bloat indicator)
    if (fs.existsSync(skillFile)) {
      const fileSize = fs.statSync(skillFile).size;
      if (fileSize > svieConfig.maxFileSize) {
        issues.push({
          skillName,
          issueType: 'file_bloat',
          severity: 'low',
          description: `Skill file is ${fileSize} bytes (target: < ${svieConfig.maxFileSize})`,
          suggestion: 'Consider splitting into smaller, focused modules'
        });
      }
    }

    return issues;
  }

  /**
   * Analyze all skills for drift
   */
  async detectDrift(skillsDir: string = svieConfig.skillRoot): Promise<DriftAnalysis> {
    if (!fs.existsSync(skillsDir)) {
      return this.createEmptyAnalysis();
    }

    const skillDirs = fs.readdirSync(skillsDir);
    const allIssues: DriftIssue[] = [];
    const driftByCategory: Record<string, number> = {};

    // Analyze each skill
    for (const skillName of skillDirs) {
      const skillPath = path.join(skillsDir, skillName);

      if (!fs.statSync(skillPath).isDirectory()) continue;

      const issues = this.analyzeSkill(skillName, skillPath);
      allIssues.push(...issues);

      // Count issues by category
      for (const issue of issues) {
        const category = issue.issueType;
        driftByCategory[category] = (driftByCategory[category] || 0) + 1;
      }
    }

    // Calculate overall drift score (0-100, 0=perfect, 100=severe)
    const driftScore = Math.min(100, (allIssues.length / Math.max(skillDirs.length, 1)) * 50);

    // Separate critical drifts
    const criticalDrifts = allIssues.filter(issue => issue.severity === 'critical');

    // Generate recommendations
    const recommendations = this.generateRecommendations(allIssues, skillDirs.length);

    return {
      timestamp: new Date().toISOString(),
      totalSkillsAnalyzed: skillDirs.length,
      skillsWithDrift: new Set(allIssues.map(i => i.skillName)).size,
      driftFreeSkills: skillDirs.length - new Set(allIssues.map(i => i.skillName)).size,
      issues: allIssues,
      driftByCategory,
      criticalDrifts,
      overallDriftScore: Math.round(driftScore),
      recommendations
    };
  }

  /**
   * Generate remediation recommendations
   */
  private generateRecommendations(issues: DriftIssue[], totalSkills: number): string[] {
    const recommendations: string[] = [];

    // Critical issues
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    if (criticalCount > 0) {
      recommendations.push(
        `🚨 CRITICAL: ${criticalCount} security issues detected (${
          issues.filter(i => i.severity === 'critical').map(i => i.skillName).join(', ')
        }) - FIX IMMEDIATELY`
      );
    }

    // Documentation gaps
    const docIssues = issues.filter(i => i.issueType.includes('documentation')).length;
    if (docIssues > 0) {
      recommendations.push(
        `📚 Documentation Sprint: ${docIssues} skills need documentation improvements (block 4-6 hours)`
      );
    }

    // Testing gaps
    const testIssues = issues.filter(i => i.issueType.includes('test')).length;
    if (testIssues > 0) {
      recommendations.push(
        `🧪 Testing Initiative: ${testIssues} skills lack proper test coverage (prioritize)`
      );
    }

    // Type safety
    const typeIssues = issues.filter(i => i.issueType === 'weak_typing').length;
    if (typeIssues > 0) {
      recommendations.push(
        `🔒 Type Safety: ${typeIssues} skills use `any` type (refactor for strict typing)`
      );
    }

    // Drift ratio
    const driftRatio = (new Set(issues.map(i => i.skillName)).size / totalSkills) * 100;
    if (driftRatio > 50) {
      recommendations.push(
        `⚠️  Portfolio Health: ${Math.round(driftRatio)}% of skills have drift issues (architecture review needed)`
      );
    } else if (driftRatio < 10) {
      recommendations.push(
        `✅ Good Health: Only ${Math.round(driftRatio)}% of skills show drift (maintain current standards)`
      );
    }

    // Remediation order
    if (issues.length > 0) {
      recommendations.push(
        `📋 Remediation Order: 1) Fix critical security, 2) Add missing documentation, 3) Add tests, 4) Refactor type safety`
      );
    }

    return recommendations;
  }

  /**
   * Create empty analysis
   */
  private createEmptyAnalysis(): DriftAnalysis {
    return {
      timestamp: new Date().toISOString(),
      totalSkillsAnalyzed: 0,
      skillsWithDrift: 0,
      driftFreeSkills: 0,
      issues: [],
      driftByCategory: {},
      criticalDrifts: [],
      overallDriftScore: 0,
      recommendations: ['No skills found for drift analysis']
    };
  }
}

/**
 * Convenience function
 */
export async function detectSkillDrift(skillsDir?: string): Promise<DriftAnalysis> {
  const detector = new SkillDriftDetector();
  return detector.detectDrift(skillsDir);
}
