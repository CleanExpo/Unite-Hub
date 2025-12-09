/**
 * Autonomous Skill Evolution Engine (ASEE)
 * Plans skill ecosystem evolution: refine, split, merge, deprecate, create
 * Generates blueprint drafts for new skills
 *
 * Read-only analysis - never implements, only recommends
 */

import fs from 'fs';
import path from 'path';
import { aseeConfig } from './skill-evolution-config';

export interface SkillEvolutionPlan {
  skill: string;
  action: 'refine' | 'split' | 'merge' | 'deprecate' | 'create';
  priority: 'critical' | 'high' | 'medium' | 'low';
  rationale: string[];
  effort: string;
  impact: string;
  risks: string[];
  successCriteria: string[];
  affectedDependencies?: string[];
  estimatedCompletion: string;
}

export interface EvolutionOpportunity {
  id: string;
  type: 'gap' | 'complexity' | 'performance' | 'maintenance';
  title: string;
  description: string;
  impactScore: number;
  effortScore: number;
  roiScore: number;
  recommendedAction: string;
  timelinePriority: string;
}

export interface ASEEReport {
  timestamp: string;
  evolutionPlans: SkillEvolutionPlan[];
  newSkillOpportunities: EvolutionOpportunity[];
  blueprintDrafts: Array<{
    name: string;
    path: string;
    templateUsed: string;
    status: 'draft' | 'review_ready' | 'implementation_ready';
  }>;
  refineSkills: SkillEvolutionPlan[];
  splitSkills: SkillEvolutionPlan[];
  mergeSkills: SkillEvolutionPlan[];
  deprecateSkills: SkillEvolutionPlan[];
  insights: string[];
  recommendations: string[];
}

export class AutonomousSkillEvolutionEngine {
  /**
   * Load skill data from existing reports
   */
  private loadSkillData(): any {
    try {
      const reportDir = 'reports';

      // Load latest SVIE
      const svieFile = fs.readdirSync(reportDir)
        .filter(f => f.startsWith('SVIE_ANALYSIS') && f.endsWith('.json'))
        .sort()
        .reverse()[0];

      if (!svieFile) return null;

      const svie = JSON.parse(fs.readFileSync(path.join(reportDir, svieFile), 'utf8'));

      // Load drift data
      const driftFile = fs.readdirSync(reportDir)
        .filter(f => f.startsWith('SKILL_DRIFT') && f.endsWith('.json'))
        .sort()
        .reverse()[0];

      const drift = driftFile
        ? JSON.parse(fs.readFileSync(path.join(reportDir, driftFile), 'utf8'))
        : null;

      return { svie, drift };
    } catch (error) {
      console.warn('⚠️ Failed to load skill data:', error);
      return null;
    }
  }

  /**
   * Generate evolution plan for a skill
   */
  private generateEvolutionPlan(
    skill: any,
    driftIssues: any[]
  ): SkillEvolutionPlan | null {
    const health = skill.healthScore || 5;
    const fileSize = skill.fileSize || 0;
    const usage = skill.usageCount || 0;
    const daysOld = skill.daysOld || 0;

    let action: 'refine' | 'split' | 'merge' | 'deprecate' | 'create' | null = null;
    let priority: 'critical' | 'high' | 'medium' | 'low' = 'low';
    const rationale: string[] = [];
    let effort = '';

    // Deprecate check
    if (usage === 0 && daysOld > aseeConfig.thresholds.deprecateAgeThreshold) {
      action = 'deprecate';
      priority = 'medium';
      rationale.push(`No usage in ${daysOld}+ days`);
      rationale.push('Outdated approach or replaced by better alternative');
      effort = 'Minimal';
    }

    // Split check
    else if (fileSize > aseeConfig.thresholds.splitComplexityThreshold * 1024) {
      action = 'split';
      priority = 'high';
      rationale.push(`File size exceeds ${aseeConfig.thresholds.splitComplexityThreshold}KB`);
      rationale.push('Multiple responsibilities or concerns detected');
      effort = '2-3 weeks';
    }

    // Merge check
    else if (usage < aseeConfig.thresholds.mergeUnderutilizationThreshold && health > 6) {
      action = 'merge';
      priority = 'medium';
      rationale.push(`Underutilized: only ${usage} uses`);
      rationale.push('Potential overlap with other skills');
      effort = '1 week';
    }

    // Refine check
    else if (health < aseeConfig.thresholds.refineHealthThreshold && usage > 0) {
      action = 'refine';
      priority = health < 4 ? 'high' : 'medium';
      rationale.push(`Low health score: ${health}/10`);
      if (driftIssues.length > 0) {
        rationale.push(`${driftIssues.length} drift issues detected`);
      }
      effort = '1-2 weeks';
    }

    if (!action) return null;

    const plan: SkillEvolutionPlan = {
      skill: skill.name,
      action,
      priority,
      rationale,
      effort,
      impact: this.estimateImpact(action),
      risks: this.identifyRisks(action, skill),
      successCriteria: this.generateSuccessCriteria(action),
      estimatedCompletion: this.estimateTimeline(effort)
    };

    return plan;
  }

  /**
   * Estimate impact of evolution action
   */
  private estimateImpact(action: string): string {
    const impacts: Record<string, string> = {
      refine: 'Improved quality, reduced technical debt, better maintainability',
      split: 'Better separation of concerns, improved testability, clearer API',
      merge: 'Reduced codebase, simplified imports, cleaner portfolio',
      deprecate: 'Reduced maintenance burden, cleaner architecture',
      create: 'Fill capability gaps, enable new features, improve flexibility'
    };
    return impacts[action] || 'Improved system health';
  }

  /**
   * Identify risks
   */
  private identifyRisks(action: string, skill: any): string[] {
    const risks: string[] = [];

    switch (action) {
      case 'refine':
        if (skill.usageCount > 10) {
          risks.push('High usage may cause issues if refactoring introduces bugs');
        }
        risks.push('Requires comprehensive testing to validate changes');
        break;

      case 'split':
        risks.push('Splitting may break existing imports and dependencies');
        risks.push('Requires careful API design to maintain compatibility');
        break;

      case 'merge':
        risks.push('Merging changes API surface - may break consumers');
        risks.push('Risk of losing important abstractions');
        break;

      case 'deprecate':
        risks.push('Verify no hidden usage before full removal');
        risks.push('Provide migration guide for any users');
        break;

      case 'create':
        risks.push('New skill adds codebase maintenance burden');
        risks.push('Requires clear documentation and ownership');
        break;
    }

    return risks;
  }

  /**
   * Generate success criteria
   */
  private generateSuccessCriteria(action: string): string[] {
    const criteria: Record<string, string[]> = {
      refine: [
        'Health score improved to 8+',
        'All tests pass',
        'No regressions detected',
        'Code review approved'
      ],
      split: [
        'Each new skill has single responsibility',
        'All tests pass',
        'Clear API boundaries defined',
        'Documentation updated'
      ],
      merge: [
        'Consolidated skill functions correctly',
        'All tests pass',
        'Consumers migrated to new API',
        'Old skill archived'
      ],
      deprecate: [
        'No active usage detected',
        'Replacement skill in place',
        'Deprecation notice added',
        'Removal completed'
      ],
      create: [
        'All requirements implemented',
        'Test coverage 80%+',
        'Documentation complete',
        'Ready for production use'
      ]
    };

    return criteria[action] || [];
  }

  /**
   * Estimate timeline
   */
  private estimateTimeline(effort: string): string {
    const mapping: Record<string, string> = {
      'Minimal': 'This week',
      '1 week': 'Next week',
      '1-2 weeks': 'Next sprint',
      '2-3 weeks': 'Next 2 sprints',
      '2-4 weeks': '1-2 months',
      '3-4 weeks': '1-2 months',
      '4-6 weeks': '2-3 months'
    };
    return mapping[effort] || 'TBD';
  }

  /**
   * Identify new skill opportunities
   */
  private identifyNewSkillOpportunities(skillData: any): EvolutionOpportunity[] {
    const opportunities: EvolutionOpportunity[] = [];

    if (!skillData?.svie?.summary) return opportunities;

    // Capability gaps
    const commonGaps = [
      { id: 'compliance', title: 'Compliance & Governance', type: 'gap', impact: 80 },
      { id: 'performance', title: 'Performance Profiler', type: 'performance', impact: 70 },
      { id: 'quality', title: 'Quality Gate Enforcer', type: 'maintenance', impact: 75 },
      { id: 'architecture', title: 'Architecture Monitor', type: 'maintenance', impact: 70 },
      { id: 'dependency', title: 'Dependency Manager', type: 'complexity', impact: 60 }
    ];

    for (const gap of commonGaps) {
      const opportunity: EvolutionOpportunity = {
        id: gap.id,
        type: gap.type,
        title: gap.title,
        description: `Implement ${gap.title} skill to improve ${gap.type}`,
        impactScore: gap.impact,
        effortScore: 40,
        roiScore: gap.impact / 40,
        recommendedAction: `Create new skill: ${gap.title}`,
        timelinePriority: gap.impact > 75 ? 'next_sprint' : 'next_quarter'
      };

      opportunities.push(opportunity);
    }

    return opportunities;
  }

  /**
   * Generate blueprint drafts
   */
  private generateBlueprintDrafts(): Array<{
    name: string;
    path: string;
    templateUsed: string;
    status: string;
  }> {
    const blueprints: any[] = [];
    const blueprintDir = 'blueprints/skills';

    // Create blueprints for high-priority new skills
    const prioritySkills = aseeConfig.commonNewSkillTemplates
      .filter(s => s.priority === 'high')
      .slice(0, 3);

    for (const skill of prioritySkills) {
      const filename = `${skill.name.toLowerCase().replace(/ /g, '-')}-blueprint.md`;
      const filepath = path.join(blueprintDir, filename);

      // Create directory if needed
      if (!fs.existsSync(blueprintDir)) {
        fs.mkdirSync(blueprintDir, { recursive: true });
      }

      // Generate blueprint content
      const content = this.generateBlueprintContent(skill);

      // Write blueprint file
      try {
        fs.writeFileSync(filepath, content);
        blueprints.push({
          name: skill.name,
          path: filepath,
          templateUsed: skill.name,
          status: 'draft'
        });
      } catch (error) {
        console.warn(`⚠️ Failed to write blueprint for ${skill.name}:`, error);
      }
    }

    return blueprints;
  }

  /**
   * Generate blueprint markdown content
   */
  private generateBlueprintContent(skill: any): string {
    return `# ${skill.name} - Skill Blueprint

**Status**: Draft
**Created**: ${new Date().toISOString()}
**Priority**: ${skill.priority}

## Purpose
${skill.purpose}

## Description
${skill.description}

## Design

### Inputs
${skill.inputs.map(i => `- ${i}`).join('\n')}

### Outputs
${skill.outputs.map(o => `- ${o}`).join('\n')}

### Dependencies
${skill.dependencies.length > 0 ? skill.dependencies.map(d => `- ${d}`).join('\n') : '- None'}

## Implementation

### Effort Estimate
${skill.estimatedEffort}

### Key Responsibilities
- Analyze inputs and process them appropriately
- Generate quality outputs that meet specified criteria
- Handle errors gracefully
- Maintain compatibility with dependent skills

### Success Criteria
- [ ] Fully implements all specified functionality
- [ ] Code passes all tests (80%+ coverage minimum)
- [ ] Documentation is complete and clear
- [ ] Ready for integration into main system

## Testing Strategy
- Unit tests for core logic
- Integration tests with dependencies
- Edge case validation
- Performance benchmarks

## Deployment Notes
- Requires review and approval before production use
- Monitor initial usage for issues
- Gather feedback from consumers
- Iterate on design based on real-world usage

---
*Generated by Autonomous Skill Evolution Engine (ASEE)*
`;
  }

  /**
   * Run evolution analysis
   */
  async runEvolutionAnalysis(): Promise<ASEEReport> {
    console.log('[ASEE] Starting autonomous skill evolution analysis...');
    const startTime = Date.now();

    const report: ASEEReport = {
      timestamp: new Date().toISOString(),
      evolutionPlans: [],
      newSkillOpportunities: [],
      blueprintDrafts: [],
      refineSkills: [],
      splitSkills: [],
      mergeSkills: [],
      deprecateSkills: [],
      insights: [],
      recommendations: []
    };

    try {
      // Load skill data
      const data = this.loadSkillData();

      if (!data?.svie?.analyzedSkills) {
        console.warn('⚠️ No skill data available for evolution analysis');
        return report;
      }

      // Generate plans for each skill
      for (const skill of data.svie.analyzedSkills) {
        const driftForSkill = data.drift?.issues?.filter((i: any) => i.skillName === skill.name) || [];
        const plan = this.generateEvolutionPlan(skill, driftForSkill);

        if (plan) {
          report.evolutionPlans.push(plan);

          // Categorize
          switch (plan.action) {
            case 'refine':
              report.refineSkills.push(plan);
              break;
            case 'split':
              report.splitSkills.push(plan);
              break;
            case 'merge':
              report.mergeSkills.push(plan);
              break;
            case 'deprecate':
              report.deprecateSkills.push(plan);
              break;
          }
        }
      }

      // Identify new opportunities
      report.newSkillOpportunities = this.identifyNewSkillOpportunities(data);

      // Generate blueprint drafts
      report.blueprintDrafts = this.generateBlueprintDrafts();

      // Sort by priority
      report.evolutionPlans.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      // Generate insights and recommendations
      report.insights = this.generateInsights(report);
      report.recommendations = this.generateRecommendations(report);

      console.log(`✓ Evolution analysis complete in ${(Date.now() - startTime) / 1000}s`);

      return report;
    } catch (error) {
      console.error('[ASEE] Evolution analysis failed:', error);
      throw error;
    }
  }

  /**
   * Generate insights
   */
  private generateInsights(report: ASEEReport): string[] {
    const insights: string[] = [];

    if (report.evolutionPlans.length > 0) {
      insights.push(
        `📋 Evolution Plans: ${report.evolutionPlans.length} skills identified for improvement`
      );
    }

    if (report.refineSkills.length > 0) {
      insights.push(
        `🔧 Refinement: ${report.refineSkills.length} skills need quality improvements`
      );
    }

    if (report.splitSkills.length > 0) {
      insights.push(
        `✂️ Splitting: ${report.splitSkills.length} skills are too complex and should be split`
      );
    }

    if (report.mergeSkills.length > 0) {
      insights.push(
        `🔗 Consolidation: ${report.mergeSkills.length} underutilized skills could be merged`
      );
    }

    if (report.deprecateSkills.length > 0) {
      insights.push(
        `🗑️ Deprecation: ${report.deprecateSkills.length} unused skills ready for archival`
      );
    }

    if (report.newSkillOpportunities.length > 0) {
      insights.push(
        `💡 Opportunities: ${report.newSkillOpportunities.length} new skills could fill capability gaps`
      );
    }

    if (report.blueprintDrafts.length > 0) {
      insights.push(
        `📄 Blueprints: ${report.blueprintDrafts.length} new skill blueprints auto-generated and ready for review`
      );
    }

    return insights;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(report: ASEEReport): string[] {
    const recommendations: string[] = [];

    // Immediate actions
    if (report.refineSkills.filter(s => s.priority === 'high').length > 0) {
      recommendations.push(
        `🔧 PRIORITY 1: Refine ${report.refineSkills.filter(s => s.priority === 'high').length} high-priority skills this sprint`
      );
    }

    if (report.deprecateSkills.length > 0) {
      recommendations.push(
        `🗑️ PRIORITY 2: Archive ${report.deprecateSkills.length} deprecated skills with 2-week notice`
      );
    }

    if (report.splitSkills.length > 0) {
      recommendations.push(
        `✂️ PRIORITY 3: Plan splitting of ${report.splitSkills.length} complex skills for next quarter`
      );
    }

    if (report.newSkillOpportunities.filter(o => o.timelinePriority === 'next_sprint').length > 0) {
      const urgent = report.newSkillOpportunities.filter(o => o.timelinePriority === 'next_sprint');
      recommendations.push(
        `💡 PRIORITY 4: Implement ${urgent.length} high-opportunity new skills to improve capabilities`
      );
    }

    if (report.blueprintDrafts.length > 0) {
      recommendations.push(
        `📄 Review ${report.blueprintDrafts.length} auto-generated blueprints and provide feedback`
      );
    }

    return recommendations;
  }
}

export async function runSkillEvolutionAnalysis(): Promise<ASEEReport> {
  const engine = new AutonomousSkillEvolutionEngine();
  return engine.runEvolutionAnalysis();
}
