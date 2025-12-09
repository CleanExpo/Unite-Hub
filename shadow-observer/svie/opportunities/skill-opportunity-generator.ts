/**
 * Skill Opportunity Generator (SOG)
 * Identifies gaps, consolidation opportunities, and strategic expansions
 *
 * Read-only analysis - generates opportunity reports without modifying skills
 */

import { opportunityConfig } from './opportunity-config';

export interface SkillOpportunity {
  id: string;
  title: string;
  category: 'consolidation' | 'expansion' | 'modernization' | 'specialization';
  description: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
  effort: 'minimal' | 'small' | 'medium' | 'large';
  rationale: string;
  benefits: string[];
  relatedSkills: string[];
  estimatedTimeToImplement: string;
  successMetrics: string[];
}

export interface OpportunitySummary {
  timestamp: string;
  totalSkills: number;
  totalOpportunities: number;
  opportunitiesByCategory: Record<string, number>;
  criticalOpportunities: SkillOpportunity[];
  gapAnalysis: {
    underutilizedSkills: number;
    deprecatedSkills: number;
    missingCapabilities: string[];
  };
  consolidationCandidates: {
    skillName: string;
    reason: string;
    potentialSavings: string;
  }[];
  expansionRecommendations: SkillOpportunity[];
  prioritizedRoadmap: SkillOpportunity[];
  insights: string[];
}

export class SkillOpportunityGenerator {
  /**
   * Analyze skills for gaps and opportunities
   */
  async analyzeOpportunities(skills: any[]): Promise<OpportunitySummary> {
    if (skills.length === 0) {
      return this.createEmptySummary();
    }

    const opportunities: SkillOpportunity[] = [];
    const gapAnalysis = this.analyzeGaps(skills);
    const consolidationCandidates = this.findConsolidationCandidates(skills);
    const expansionRecs = this.generateExpansionRecommendations(skills, gapAnalysis);

    opportunities.push(...expansionRecs);

    // Add consolidation opportunities
    for (const candidate of consolidationCandidates) {
      opportunities.push({
        id: `consolidate-${candidate.skillName}`,
        title: `Consolidate: ${candidate.skillName}`,
        category: 'consolidation',
        description: `${candidate.skillName} is ${candidate.reason}`,
        impact: 'medium',
        effort: 'small',
        rationale: candidate.reason,
        benefits: [
          'Reduce codebase complexity',
          'Lower maintenance burden',
          'Improve code reuse'
        ],
        relatedSkills: [candidate.skillName],
        estimatedTimeToImplement: '2-4 hours',
        successMetrics: ['Consolidated into active skill', 'Usage redirected', 'Documentation updated']
      });
    }

    // Prioritize opportunities
    const prioritized = this.prioritizeOpportunities(opportunities);

    const opportunitiesByCategory = {
      consolidation: 0,
      expansion: 0,
      modernization: 0,
      specialization: 0
    };

    opportunities.forEach(opp => {
      opportunitiesByCategory[opp.category]++;
    });

    const criticalOpps = opportunities.filter(o => o.impact === 'critical');

    const insights = this.generateInsights(skills, opportunities, gapAnalysis);

    return {
      timestamp: new Date().toISOString(),
      totalSkills: skills.length,
      totalOpportunities: opportunities.length,
      opportunitiesByCategory,
      criticalOpportunities: criticalOpps,
      gapAnalysis,
      consolidationCandidates,
      expansionRecommendations: expansionRecs,
      prioritizedRoadmap: prioritized.slice(0, 5),
      insights
    };
  }

  /**
   * Analyze skill portfolio for gaps
   */
  private analyzeGaps(skills: any[]) {
    const underutilized = skills.filter(
      s => s.usageCount < opportunityConfig.gapAnalysis.usageGapThreshold
    ).length;

    const deprecated = skills.filter(
      s => s.deprecationDaysAgo > opportunityConfig.gapAnalysis.frequencyGapThreshold
    ).length;

    // Detect missing capabilities
    const missingCapabilities: string[] = [];
    const existingDomains = new Set(
      skills.map(s => (s.category || s.domain || 'other').toLowerCase())
    );

    for (const gap of opportunityConfig.commonGaps) {
      if (!existingDomains.has(gap.domain.toLowerCase()) && gap.priority === 'high') {
        missingCapabilities.push(`${gap.name} (${gap.domain})`);
      }
    }

    return {
      underutilizedSkills: underutilized,
      deprecatedSkills: deprecated,
      missingCapabilities
    };
  }

  /**
   * Find skills that should be consolidated
   */
  private findConsolidationCandidates(
    skills: any[]
  ): { skillName: string; reason: string; potentialSavings: string }[] {
    const candidates = [];

    // Find underutilized but valuable skills
    for (const skill of skills) {
      if (
        skill.usageCount < opportunityConfig.gapAnalysis.usageGapThreshold &&
        skill.expertiseScore > 6
      ) {
        candidates.push({
          skillName: skill.name,
          reason: 'underutilized but valuable (could be integrated into related skill)',
          potentialSavings: '10-20 maintenance hours/year'
        });
      }
    }

    // Find deprecated skills
    for (const skill of skills) {
      if (skill.deprecationDaysAgo > opportunityConfig.gapAnalysis.frequencyGapThreshold) {
        candidates.push({
          skillName: skill.name,
          reason: 'deprecated (no usage in ' + skill.deprecationDaysAgo + ' days)',
          potentialSavings: '5-10 maintenance hours/year'
        });
      }
    }

    // Portfolio size warning
    if (skills.length > opportunityConfig.gapAnalysis.skillCountThreshold) {
      candidates.push({
        skillName: 'Portfolio Portfolio',
        reason: `portfolio has ${skills.length} skills (${skills.length - opportunityConfig.gapAnalysis.skillCountThreshold} above optimal)`,
        potentialSavings: 'Significant - consolidation highly recommended'
      });
    }

    return candidates.slice(0, 5);
  }

  /**
   * Generate expansion recommendations based on gaps
   */
  private generateExpansionRecommendations(
    skills: any[],
    gaps: any
  ): SkillOpportunity[] {
    const recommendations: SkillOpportunity[] = [];

    // High-priority missing capabilities
    for (const missing of gaps.missingCapabilities) {
      recommendations.push({
        id: `expand-${missing.replace(/\s+/g, '-').toLowerCase()}`,
        title: `Create: ${missing}`,
        category: 'expansion',
        description: `Add new skill for ${missing}`,
        impact: 'high',
        effort: 'medium',
        rationale: `No existing skill covers ${missing} (high-demand gap)`,
        benefits: [
          `Enable ${missing} use cases`,
          'Expand system capabilities',
          'Reduce manual workarounds'
        ],
        relatedSkills: [],
        estimatedTimeToImplement: '1-2 weeks',
        successMetrics: [
          'Skill created and tested',
          'Documentation complete',
          'Initial adoption by team'
        ]
      });
    }

    // High-value expansion opportunities
    const highValue = skills.filter(s => s.expertiseScore > 8);
    for (const skill of highValue.slice(0, 2)) {
      recommendations.push({
        id: `specialize-${skill.name}`,
        title: `Specialize: ${skill.name}`,
        category: 'expansion',
        description: `Create specialized variant of ${skill.name}`,
        impact: 'medium',
        effort: 'small',
        rationale: `${skill.name} is high-value (${skill.expertiseScore}/10) - opportunity for specialization`,
        benefits: [
          'Increased adoption',
          'Better performance for specific use cases',
          'Competitive advantage'
        ],
        relatedSkills: [skill.name],
        estimatedTimeToImplement: '3-5 days',
        successMetrics: ['Variant created', 'Performance measured', 'Usage tracked']
      });
    }

    return recommendations;
  }

  /**
   * Prioritize opportunities by impact and effort
   */
  private prioritizeOpportunities(opportunities: SkillOpportunity[]): SkillOpportunity[] {
    const impactScore = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1
    };

    const effortScore = {
      minimal: 4,
      small: 3,
      medium: 2,
      large: 1
    };

    const scored = opportunities.map(opp => ({
      ...opp,
      score: (impactScore[opp.impact] * 2) + effortScore[opp.effort]
    }));

    return scored.sort((a, b) => b.score - a.score).map(({ score, ...opp }) => opp);
  }

  /**
   * Generate strategic insights
   */
  private generateInsights(skills: any[], opportunities: SkillOpportunity[], gaps: any): string[] {
    const insights: string[] = [];

    // Portfolio health
    const highValue = skills.filter(s => s.expertiseScore > 8).length;
    insights.push(
      `📊 Portfolio Health: ${highValue}/${skills.length} skills are high-value (${Math.round((highValue / skills.length) * 100)}%)`
    );

    // Gap coverage
    if (gaps.missingCapabilities.length > 0) {
      insights.push(
        `⚠️  Capability Gaps: ${gaps.missingCapabilities.length} critical domains not covered (${gaps.missingCapabilities.slice(0, 2).join(', ')}...)`
      );
    } else {
      insights.push('✅ Capability Coverage: No critical gaps detected in core domains');
    }

    // Consolidation opportunity
    if (gaps.underutilizedSkills > 5) {
      insights.push(
        `🧹 Consolidation Potential: ${gaps.underutilizedSkills} underutilized skills represent consolidation opportunity`
      );
    }

    // Growth potential
    const expandable = opportunities.filter(o => o.category === 'expansion');
    if (expandable.length > 0) {
      insights.push(
        `🚀 Growth Opportunities: ${expandable.length} expansion opportunities identified (estimated ROI: high)`
      );
    }

    // Technical debt
    const modernization = opportunities.filter(o => o.category === 'modernization');
    if (modernization.length > 0) {
      insights.push(
        `🔧 Technical Debt: ${modernization.length} skills need modernization (impact: medium)`
      );
    }

    return insights;
  }

  /**
   * Create empty summary
   */
  private createEmptySummary(): OpportunitySummary {
    return {
      timestamp: new Date().toISOString(),
      totalSkills: 0,
      totalOpportunities: 0,
      opportunitiesByCategory: {
        consolidation: 0,
        expansion: 0,
        modernization: 0,
        specialization: 0
      },
      criticalOpportunities: [],
      gapAnalysis: {
        underutilizedSkills: 0,
        deprecatedSkills: 0,
        missingCapabilities: []
      },
      consolidationCandidates: [],
      expansionRecommendations: [],
      prioritizedRoadmap: [],
      insights: ['No skills available for opportunity analysis']
    };
  }
}

/**
 * Convenience function
 */
export async function generateSkillOpportunities(skills: any[]): Promise<OpportunitySummary> {
  const generator = new SkillOpportunityGenerator();
  return generator.analyzeOpportunities(skills);
}
