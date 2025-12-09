/**
 * Skill Refactor Recommendation Engine (SRRE)
 * Generates structured refactor plans from drift and health data
 *
 * Read-only - generates recommendations ONLY, never applies fixes
 */

import fs from 'fs';
import path from 'path';
import { srreConfig } from './srre-config';
import { svieConfig } from '../svie-config';

export interface RefactorAction {
  action: string;
  description: string;
  estimation: string;
  rationale: string;
  successCriteria: string[];
  resources?: string[];
}

export interface RefactorPlan {
  skillName: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  impactScore: number;
  effortScore: number;
  roiScore: number;  // impact / effort ratio
  issuesCount: number;
  issuesByCategory: Record<string, number>;
  mainIssues: string[];
  actions: RefactorAction[];
  estimatedTimeToCompletion: string;
  risks: string[];
  benefits: string[];
}

export interface SRREAnalysis {
  timestamp: string;
  totalSkillsAnalyzed: number;
  skillsRequiringRefactor: number;
  refactorPlans: RefactorPlan[];
  prioritizedRoadmap: RefactorPlan[];
  estimatedTotalHours: number;
  criticalRefactors: RefactorPlan[];
  highROIRefactors: RefactorPlan[];
  insights: string[];
  recommendations: string[];
}

export class SkillRefactorRecommendationEngine {
  /**
   * Load SVIE report
   */
  private loadSVIEReport(): any {
    try {
      const reports = fs.readdirSync(svieConfig.reportDir)
        .filter(f => f.startsWith('SVIE_ANALYSIS_') && f.endsWith('.json'))
        .sort()
        .reverse();

      if (reports.length === 0) return null;
      const content = fs.readFileSync(
        path.join(svieConfig.reportDir, reports[0]),
        'utf8'
      );
      return JSON.parse(content);
    } catch (error) {
      console.warn('⚠️  Failed to load SVIE report:', error);
      return null;
    }
  }

  /**
   * Load Drift report
   */
  private loadDriftReport(): any {
    try {
      const reports = fs.readdirSync(svieConfig.reportDir)
        .filter(f => f.startsWith('SKILL_DRIFT_') && f.endsWith('.json'))
        .sort()
        .reverse();

      if (reports.length === 0) return null;
      const content = fs.readFileSync(
        path.join(svieConfig.reportDir, reports[0]),
        'utf8'
      );
      return JSON.parse(content);
    } catch (error) {
      console.warn('⚠️  Failed to load Drift report:', error);
      return null;
    }
  }

  /**
   * Load Heatmap report
   */
  private loadHeatmapReport(): any {
    try {
      const reports = fs.readdirSync(svieConfig.reportDir)
        .filter(f => f.startsWith('SKILL_HEATMAP_') && f.endsWith('.json'))
        .sort()
        .reverse();

      if (reports.length === 0) return null;
      const content = fs.readFileSync(
        path.join(svieConfig.reportDir, reports[0]),
        'utf8'
      );
      return JSON.parse(content);
    } catch (error) {
      console.warn('⚠️  Failed to load Heatmap report:', error);
      return null;
    }
  }

  /**
   * Generate refactor plan for a skill
   */
  private generateRefactorPlan(
    skillName: string,
    svieData: any,
    driftData: any,
    heatmapData: any
  ): RefactorPlan | null {
    const svieSkill = svieData?.analyzedSkills?.find((s: any) => s.name === skillName);
    const driftIssues = driftData?.issues?.filter((i: any) => i.skillName === skillName) || [];
    const heatmapSkill = heatmapData?.heatPoints?.find((h: any) => h.skillName === skillName);

    // Skip healthy skills with no drift
    if (driftIssues.length === 0 && svieSkill?.healthScore >= 8) {
      return null;
    }

    // Categorize issues
    const issuesByCategory: Record<string, number> = {};
    for (const issue of driftIssues) {
      issuesByCategory[issue.issueType] = (issuesByCategory[issue.issueType] || 0) + 1;
    }

    // Determine priority
    let priority: 'critical' | 'high' | 'medium' | 'low' = 'low';
    const criticalCount = driftIssues.filter((i: any) => i.severity === 'critical').length;
    const highCount = driftIssues.filter((i: any) => i.severity === 'high').length;

    if (criticalCount > 0) priority = 'critical';
    else if (criticalCount > 0 || highCount > 2) priority = 'high';
    else if (highCount > 0 || driftIssues.length > 3) priority = 'medium';
    else priority = 'low';

    // Calculate scores
    const impactScore = driftIssues.length * 15 + (10 - svieSkill?.healthScore || 5) * 5;
    const effortScore = driftIssues.length * 10 + Math.max(0, 30 - svieSkill?.usageCount || 25);
    const roiScore = impactScore / Math.max(effortScore, 1);

    // Generate actions
    const actions = this.generateActions(skillName, driftIssues, svieSkill);

    // Calculate effort
    let totalHours = 0;
    for (const action of actions) {
      const effort = this.estimateEffort(action.estimation);
      totalHours += effort;
    }

    // Generate risks and benefits
    const risks = this.identifyRisks(skillName, svieSkill, driftIssues);
    const benefits = this.identifyBenefits(skillName, svieSkill);

    return {
      skillName,
      priority,
      impactScore: Math.round(impactScore),
      effortScore: Math.round(effortScore),
      roiScore: Number(roiScore.toFixed(2)),
      issuesCount: driftIssues.length,
      issuesByCategory,
      mainIssues: driftIssues.slice(0, 3).map((i: any) => `${i.issueType}: ${i.description}`),
      actions,
      estimatedTimeToCompletion: this.estimateCompletion(totalHours),
      risks,
      benefits
    };
  }

  /**
   * Generate refactor actions
   */
  private generateActions(skillName: string, issues: any[], svieSkill: any): RefactorAction[] {
    const actions: RefactorAction[] = [];
    const issueTypes = new Set(issues.map(i => i.issueType));

    // Security issues
    if (issueTypes.has('security_concern')) {
      actions.push({
        action: 'Security Audit & Fix',
        description: 'Review and remove security vulnerabilities (eval, exec, etc.)',
        estimation: '1-4 hours',
        rationale: 'Security issues pose immediate risk to system stability',
        successCriteria: [
          'No eval() or exec() calls in code',
          'Input validation implemented',
          'Security review approved'
        ],
        resources: ['Security checklist', 'Code review']
      });
    }

    // Documentation issues
    if (issueTypes.has('missing_documentation') || issueTypes.has('incomplete_documentation')) {
      actions.push({
        action: 'Documentation Refactor',
        description: 'Add/update README with Inputs, Outputs, Implementation sections',
        estimation: '1-2 hours',
        rationale: 'Complete documentation improves maintainability and usability',
        successCriteria: [
          'README.md contains all required sections',
          'Examples provided',
          'API documented'
        ],
        resources: ['Documentation template', 'README guidelines']
      });
    }

    // Testing issues
    if (issueTypes.has('missing_tests')) {
      actions.push({
        action: 'Test Coverage',
        description: 'Create unit and integration tests',
        estimation: '1-2 days',
        rationale: 'Tests ensure reliability and enable safe refactoring',
        successCriteria: [
          '80%+ code coverage',
          'Unit tests pass',
          'Integration tests defined'
        ],
        resources: ['Test templates', 'Testing framework (Vitest)']
      });
    }

    // Architecture/pattern issues
    if (issueTypes.has('outdated_pattern')) {
      actions.push({
        action: 'Architecture Modernization',
        description: 'Update outdated patterns and upgrade to current architecture',
        estimation: '1-3 days',
        rationale: 'Modern patterns improve performance, maintainability, and team alignment',
        successCriteria: [
          'Updated to current Next.js patterns',
          'TypeScript strict mode compliance',
          'Code review approved'
        ],
        resources: ['Architecture guide', 'Migration checklist']
      });
    }

    // Type safety issues
    if (issueTypes.has('weak_typing')) {
      actions.push({
        action: 'Type Safety Enhancement',
        description: 'Remove `any` types and add strict TypeScript',
        estimation: '4-8 hours',
        rationale: 'Strong typing prevents runtime errors and improves IDE support',
        successCriteria: [
          'No `any` types used',
          'Strict TypeScript enabled',
          'Type checks pass'
        ],
        resources: ['TypeScript guide', 'Type definitions']
      });
    }

    // Performance issues (file bloat)
    if (issueTypes.has('file_bloat')) {
      actions.push({
        action: 'Code Splitting & Optimization',
        description: 'Split large files and optimize performance',
        estimation: '2-4 days',
        rationale: 'Smaller, focused modules are easier to maintain and test',
        successCriteria: [
          'All files < 50KB',
          'Single responsibility maintained',
          'Performance benchmarks met'
        ],
        resources: ['Code splitting guide', 'Performance profiler']
      });
    }

    // General health improvement
    if (svieSkill?.healthScore && svieSkill.healthScore < 5) {
      actions.push({
        action: 'General Health Assessment',
        description: 'Comprehensive review and improvement of skill health metrics',
        estimation: '4-8 hours',
        rationale: 'Systematic improvement ensures long-term maintainability',
        successCriteria: [
          'Health score > 7',
          'All documentation complete',
          'Tests added'
        ],
        resources: ['Health assessment checklist']
      });
    }

    return actions.length > 0 ? actions : [
      {
        action: 'Monitoring',
        description: 'Continue monitoring for regressions',
        estimation: 'Ongoing',
        rationale: 'Ensure health metrics remain stable',
        successCriteria: ['Health score maintained > 7']
      }
    ];
  }

  /**
   * Estimate effort hours from string
   */
  private estimateEffort(estimation: string): number {
    if (estimation.includes('minimal') || estimation === '< 1 hour') return 0.5;
    if (estimation.includes('1-4 hours')) return 2;
    if (estimation.includes('1-2 hours')) return 1;
    if (estimation.includes('1-2 days')) return 8;
    if (estimation.includes('2-4 days')) return 16;
    if (estimation.includes('3-5 days')) return 32;
    if (estimation.includes('1-3 weeks')) return 60;
    if (estimation === 'Ongoing') return 2;
    return 4;
  }

  /**
   * Estimate time to completion
   */
  private estimateCompletion(hours: number): string {
    if (hours < 1) return '< 1 hour';
    if (hours < 4) return `${Math.ceil(hours)} hours`;
    if (hours < 24) return `${Math.ceil(hours / 8)} days`;
    if (hours < 120) return `${Math.ceil(hours / 40)} weeks`;
    return '3+ weeks';
  }

  /**
   * Identify risks
   */
  private identifyRisks(skillName: string, svieSkill: any, issues: any[]): string[] {
    const risks: string[] = [];

    if (svieSkill?.usageCount > 10) {
      risks.push('High usage count - changes may impact many dependent systems');
    }

    if (issues.some((i: any) => i.issueType === 'security_concern')) {
      risks.push('Security vulnerabilities present - urgent fixing required');
    }

    if (!issues.some((i: any) => i.issueType === 'missing_tests')) {
      risks.push('Lack of test coverage - changes may introduce regressions');
    }

    if (svieSkill?.healthScore < 4) {
      risks.push('Low health score - systemic issues may exist');
    }

    return risks;
  }

  /**
   * Identify benefits
   */
  private identifyBenefits(skillName: string, svieSkill: any): string[] {
    const benefits: string[] = [];

    benefits.push('Improved maintainability and code readability');
    benefits.push('Better test coverage and reliability');

    if (svieSkill?.usageCount > 0) {
      benefits.push('Enhanced usability for downstream consumers');
    }

    benefits.push('Alignment with team standards and best practices');
    benefits.push('Reduced technical debt');

    return benefits;
  }

  /**
   * Generate refactor plans for all skills
   */
  async generateRefactorPlans(): Promise<SRREAnalysis> {
    console.log('[SRRE] Generating skill refactor plans...');
    const startTime = Date.now();

    const analysis: SRREAnalysis = {
      timestamp: new Date().toISOString(),
      totalSkillsAnalyzed: 0,
      skillsRequiringRefactor: 0,
      refactorPlans: [],
      prioritizedRoadmap: [],
      estimatedTotalHours: 0,
      criticalRefactors: [],
      highROIRefactors: [],
      insights: [],
      recommendations: []
    };

    try {
      // Load reports
      const svieData = this.loadSVIEReport();
      const driftData = this.loadDriftReport();
      const heatmapData = this.loadHeatmapReport();

      if (!svieData?.analyzedSkills) {
        console.warn('⚠️  No skill data available');
        return analysis;
      }

      analysis.totalSkillsAnalyzed = svieData.analyzedSkills.length;

      // Generate plans for each skill
      for (const skill of svieData.analyzedSkills) {
        const plan = this.generateRefactorPlan(skill.name, svieData, driftData, heatmapData);
        if (plan) {
          analysis.refactorPlans.push(plan);

          if (plan.priority === 'critical') {
            analysis.criticalRefactors.push(plan);
          }

          if (plan.roiScore > 1.5) {
            analysis.highROIRefactors.push(plan);
          }

          // Calculate total hours
          for (const action of plan.actions) {
            analysis.estimatedTotalHours += this.estimateEffort(action.estimation);
          }
        }
      }

      analysis.skillsRequiringRefactor = analysis.refactorPlans.length;

      // Sort for roadmap (priority, then ROI)
      analysis.prioritizedRoadmap = [...analysis.refactorPlans]
        .sort((a, b) => {
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return b.roiScore - a.roiScore;
        });

      // Sort high-ROI by ROI score
      analysis.highROIRefactors.sort((a, b) => b.roiScore - a.roiScore);

      // Generate insights
      analysis.insights = this.generateInsights(analysis);

      // Generate recommendations
      analysis.recommendations = this.generateRecommendations(analysis);

      console.log(`✓ Refactor plan generation complete in ${(Date.now() - startTime) / 1000}s`);
      console.log(`  Skills requiring refactor: ${analysis.skillsRequiringRefactor}`);
      console.log(`  Critical refactors: ${analysis.criticalRefactors.length}`);
      console.log(`  Estimated total effort: ${Math.round(analysis.estimatedTotalHours)} hours`);

      return analysis;
    } catch (error) {
      console.error('[SRRE] Plan generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate insights
   */
  private generateInsights(analysis: SRREAnalysis): string[] {
    const insights: string[] = [];

    if (analysis.criticalRefactors.length > 0) {
      insights.push(
        `🚨 CRITICAL: ${analysis.criticalRefactors.length} skill${analysis.criticalRefactors.length !== 1 ? 's' : ''} ` +
        `require immediate refactoring`
      );
    }

    if (analysis.highROIRefactors.length > 0) {
      insights.push(
        `💰 HIGH ROI: ${analysis.highROIRefactors.length} refactor${analysis.highROIRefactors.length !== 1 ? 's' : ''} ` +
        `with excellent impact/effort ratio`
      );
    }

    if (analysis.skillsRequiringRefactor > 10) {
      insights.push(
        `📊 PORTFOLIO HEALTH: ${analysis.skillsRequiringRefactor} skills need attention ` +
        `(${Math.round((analysis.skillsRequiringRefactor / analysis.totalSkillsAnalyzed) * 100)}%)`
      );
    }

    const weeks = Math.ceil(analysis.estimatedTotalHours / 40);
    insights.push(
      `⏱️ EFFORT ESTIMATE: ${Math.round(analysis.estimatedTotalHours)} hours ` +
      `(~${weeks} week${weeks !== 1 ? 's' : ''} at full capacity)`
    );

    return insights;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(analysis: SRREAnalysis): string[] {
    const recommendations: string[] = [];

    if (analysis.criticalRefactors.length > 0) {
      recommendations.push(
        `🚨 PRIORITY 1: Address ${analysis.criticalRefactors.length} critical refactors within 1 week`
      );
    }

    if (analysis.skillsRequiringRefactor > 15) {
      recommendations.push(
        `📋 PRIORITY 2: Plan quarterly refactoring schedule for remaining ${analysis.skillsRequiringRefactor} skills`
      );
    }

    if (analysis.highROIRefactors.length > 3) {
      recommendations.push(
        `💰 PRIORITY 3: Execute top ${Math.min(5, analysis.highROIRefactors.length)} high-ROI refactors next sprint`
      );
    }

    if (analysis.estimatedTotalHours > 200) {
      recommendations.push(
        `⏱️ PRIORITY 4: Allocate dedicated refactoring capacity (${Math.ceil(analysis.estimatedTotalHours / 40)} weeks)`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        `✅ Codebase is healthy - continue monitoring and maintain standards`
      );
    }

    return recommendations;
  }
}

export async function generateRefactorPlans(): Promise<SRREAnalysis> {
  const engine = new SkillRefactorRecommendationEngine();
  return engine.generateRefactorPlans();
}
