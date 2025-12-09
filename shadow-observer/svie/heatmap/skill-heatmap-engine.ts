/**
 * Skill Heatmap Engine (SHE)
 * Visualizes skill usage, value, and health distributions
 * Identifies hot spots, cold zones, and trend patterns
 *
 * Read-only analysis - generates visual heatmap reports only
 */

import { heatmapConfig } from './heatmap-config';

export interface SkillHeatPoint {
  skillName: string;
  usageIntensity: number;      // 0-100 (frequency of use)
  valueIntensity: number;       // 0-100 (skill value/expertise)
  healthIntensity: number;      // 0-100 (maintenance/docs quality)
  overallIntensity: number;     // 0-100 (weighted average)
  zone: string;                 // superhotCore, hotStrategic, warmMaintained, coolUnderutilized, frozenDeprecated
  usageCount: number;
  lastUsed: string;
  expertiseScore: number;
  healthScore: number;
  trend: 'rising' | 'stable' | 'falling';
  trendPercentage: number;
}

export interface SkillHeatmap {
  timestamp: string;
  totalSkills: number;
  heatPoints: SkillHeatPoint[];
  zoneDistribution: {
    superhotCore: number;
    hotStrategic: number;
    warmMaintained: number;
    coolUnderutilized: number;
    frozenDeprecated: number;
  };
  insights: string[];
  recommendations: string[];
}

export class SkillHeatmapEngine {
  /**
   * Calculate intensity value (0-100) based on weighted factors
   */
  private calculateIntensity(
    usageCount: number,
    lastUsedDaysAgo: number,
    expertiseScore: number,
    healthScore: number,
    maxUsageInCohort: number
  ): number {
    // Normalize usage to 0-100
    const usageIntensity = Math.min(100, (usageCount / Math.max(1, maxUsageInCohort)) * 100);

    // Recency penalty: skills not used recently get lower intensity
    const recencyPenalty = Math.max(0, 100 - lastUsedDaysAgo * 0.5);

    // Normalize expertise (already 1-10)
    const expertiseIntensity = (expertiseScore / 10) * 100;

    // Normalize health (already 1-10)
    const healthIntensity = (healthScore / 10) * 100;

    // Weighted average
    const intensity =
      usageIntensity * heatmapConfig.weights.usage +
      Math.min(100, expertiseIntensity + recencyPenalty) * heatmapConfig.weights.value +
      healthIntensity * heatmapConfig.weights.health;

    return Math.round(Math.min(100, Math.max(0, intensity)));
  }

  /**
   * Assign skill to heat zone based on intensity and metrics
   */
  private assignZone(
    intensity: number,
    usageCount: number,
    expertiseScore: number,
    healthScore: number
  ): string {
    const zones = heatmapConfig.heatZones;

    if (
      intensity >= zones.superhotCore.minIntensity &&
      usageCount >= zones.superhotCore.minUsage &&
      expertiseScore >= zones.superhotCore.minValue
    ) {
      return 'superhotCore';
    }

    if (
      intensity >= zones.hotStrategic.minIntensity &&
      usageCount >= zones.hotStrategic.minUsage &&
      expertiseScore >= zones.hotStrategic.minValue
    ) {
      return 'hotStrategic';
    }

    if (
      intensity >= zones.warmMaintained.minIntensity &&
      usageCount >= zones.warmMaintained.minUsage &&
      expertiseScore >= zones.warmMaintained.minValue
    ) {
      return 'warmMaintained';
    }

    if (
      intensity >= zones.coolUnderutilized.minIntensity &&
      expertiseScore >= zones.coolUnderutilized.minValue
    ) {
      return 'coolUnderutilized';
    }

    return 'frozenDeprecated';
  }

  /**
   * Determine trend direction (rising/stable/falling)
   */
  private calculateTrend(
    currentIntensity: number,
    previousIntensity: number
  ): { trend: 'rising' | 'stable' | 'falling'; percentage: number } {
    const change = ((currentIntensity - previousIntensity) / Math.max(1, previousIntensity)) * 100;

    if (Math.abs(change) < 5) {
      return { trend: 'stable', percentage: 0 };
    }

    return {
      trend: change > 0 ? 'rising' : 'falling',
      percentage: Math.abs(change)
    };
  }

  /**
   * Generate heatmap from skill metrics
   */
  async generateHeatmap(skills: any[]): Promise<SkillHeatmap> {
    if (skills.length === 0) {
      return this.createEmptyHeatmap();
    }

    // Find max usage for normalization
    const maxUsage = Math.max(...skills.map(s => s.usageCount || 0), 1);

    // Generate heat points
    const heatPoints: SkillHeatPoint[] = skills.map(skill => {
      const lastUsedDaysAgo = skill.lastUsed
        ? Math.floor(
            (Date.now() - new Date(skill.lastUsed).getTime()) / (1000 * 60 * 60 * 24)
          )
        : 999;

      const overallIntensity = this.calculateIntensity(
        skill.usageCount || 0,
        lastUsedDaysAgo,
        skill.expertiseScore || 5,
        skill.healthScore || 5,
        maxUsage
      );

      const zone = this.assignZone(
        overallIntensity,
        skill.usageCount || 0,
        skill.expertiseScore || 5,
        skill.healthScore || 5
      );

      const { trend, percentage } = this.calculateTrend(
        overallIntensity,
        skill.previousIntensity || overallIntensity * 0.95
      );

      return {
        skillName: skill.name,
        usageIntensity: Math.min(100, (skill.usageCount || 0) / maxUsage * 100),
        valueIntensity: Math.min(100, (skill.expertiseScore || 5) * 10),
        healthIntensity: Math.min(100, (skill.healthScore || 5) * 10),
        overallIntensity,
        zone,
        usageCount: skill.usageCount || 0,
        lastUsed: skill.lastUsed || 'Never',
        expertiseScore: skill.expertiseScore || 5,
        healthScore: skill.healthScore || 5,
        trend,
        trendPercentage: percentage
      };
    });

    // Calculate zone distribution
    const zoneDistribution = {
      superhotCore: 0,
      hotStrategic: 0,
      warmMaintained: 0,
      coolUnderutilized: 0,
      frozenDeprecated: 0
    };

    heatPoints.forEach(point => {
      zoneDistribution[point.zone as keyof typeof zoneDistribution]++;
    });

    // Generate insights
    const insights = this.generateInsights(heatPoints, zoneDistribution);
    const recommendations = this.generateRecommendations(heatPoints, zoneDistribution);

    return {
      timestamp: new Date().toISOString(),
      totalSkills: skills.length,
      heatPoints,
      zoneDistribution,
      insights,
      recommendations
    };
  }

  /**
   * Generate strategic insights from heatmap
   */
  private generateInsights(
    heatPoints: SkillHeatPoint[],
    zones: Record<string, number>
  ): string[] {
    const insights: string[] = [];

    // Core strength analysis
    if (zones.superhotCore > 0) {
      insights.push(
        `🔥 Strategic Core: ${zones.superhotCore} skills in active use with high value (supercritical to system)`
      );
    }

    // Strategic gaps
    const cold = zones.frozenDeprecated + zones.coolUnderutilized;
    if (cold > heatPoints.length * 0.3) {
      insights.push(
        `❄️  Cold Zone: ${cold} skills underutilized or deprecated (${Math.round((cold / heatPoints.length) * 100)}% of portfolio)`
      );
    }

    // Rising skills
    const rising = heatPoints.filter(p => p.trend === 'rising').length;
    if (rising > 0) {
      insights.push(`📈 Growth Momentum: ${rising} skills showing rising usage trends`);
    }

    // Falling skills
    const falling = heatPoints.filter(p => p.trend === 'falling').length;
    if (falling > 0) {
      insights.push(`📉 Declining Skills: ${falling} skills showing falling usage (watch for deprecation)`);
    }

    // Maintenance burden
    const lowHealth = heatPoints.filter(p => p.healthScore < 5).length;
    if (lowHealth > 0) {
      insights.push(
        `🔧 Maintenance Alert: ${lowHealth} skills need documentation/test improvements`
      );
    }

    // Portfolio balance
    const avgIntensity = heatPoints.reduce((sum, p) => sum + p.overallIntensity, 0) / heatPoints.length;
    if (avgIntensity > 75) {
      insights.push('⚡ Healthy Portfolio: High overall skill intensity and utilization');
    } else if (avgIntensity < 40) {
      insights.push('⚠️  Portfolio Imbalance: Low overall skill intensity suggests underutilization');
    }

    return insights;
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    heatPoints: SkillHeatPoint[],
    zones: Record<string, number>
  ): string[] {
    const recommendations: string[] = [];

    // Protect core skills
    if (zones.superhotCore > 0) {
      const coreSkills = heatPoints
        .filter(p => p.zone === 'superhotCore')
        .map(p => p.skillName)
        .slice(0, 3);
      recommendations.push(
        `🛡️  Protect Core Assets: Ensure ${coreSkills.join(', ')} receive highest maintenance priority`
      );
    }

    // Consolidate cold skills
    const coldSkills = heatPoints.filter(p => p.zone === 'frozenDeprecated').length;
    if (coldSkills > 0) {
      recommendations.push(
        `🧹 Consolidation Opportunity: ${coldSkills} frozen/deprecated skills ready for archival or consolidation`
      );
    }

    // Promote rising stars
    const stars = heatPoints.filter(p => p.trend === 'rising' && p.zone === 'warmMaintained');
    if (stars.length > 0) {
      recommendations.push(
        `⭐ Promote Rising Stars: ${stars.length} skills trending upward (candidates for expanded investment)`
      );
    }

    // Revitalize underutilized
    const underutilized = heatPoints.filter(p => p.zone === 'coolUnderutilized' && p.expertiseScore > 7);
    if (underutilized.length > 0) {
      recommendations.push(
        `🔄 Revitalize Underutilized: ${underutilized.length} high-expertise skills are underused (increase visibility/adoption)`
      );
    }

    // Health improvements
    const needsDocs = heatPoints.filter(p => p.healthScore < 4 && p.zone !== 'frozenDeprecated').length;
    if (needsDocs > 0) {
      recommendations.push(
        `📚 Documentation Sprint: ${needsDocs} skills lack adequate documentation (block time for README updates)`
      );
    }

    return recommendations;
  }

  /**
   * Create empty heatmap for no data
   */
  private createEmptyHeatmap(): SkillHeatmap {
    return {
      timestamp: new Date().toISOString(),
      totalSkills: 0,
      heatPoints: [],
      zoneDistribution: {
        superhotCore: 0,
        hotStrategic: 0,
        warmMaintained: 0,
        coolUnderutilized: 0,
        frozenDeprecated: 0
      },
      insights: ['No skills data available for heatmap analysis'],
      recommendations: ['Start tracking skill usage to generate heatmap insights']
    };
  }
}

/**
 * Convenience function
 */
export async function generateSkillHeatmap(skills: any[]): Promise<SkillHeatmap> {
  const engine = new SkillHeatmapEngine();
  return engine.generateHeatmap(skills);
}
