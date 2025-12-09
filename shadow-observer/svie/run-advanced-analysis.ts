/**
 * Advanced SVIE Analysis Orchestrator
 * Runs Heatmap, Drift, and Opportunity analyses
 *
 * Integrates: SHE (heatmap) + SDD (drift) + SOG (opportunities)
 */

import fs from 'fs';
import path from 'path';
import { svieConfig } from './svie-config';
import { analyzeSVIE } from './skill-analyzer';
import { generateSkillHeatmap } from './heatmap/skill-heatmap-engine';
import { detectSkillDrift } from './drift/skill-drift-detector';
import { generateSkillOpportunities } from './opportunities/skill-opportunity-generator';

export interface AdvancedAnalysisReport {
  timestamp: string;
  executedModules: string[];
  svieAnalysis: any;
  heatmapAnalysis: any;
  driftAnalysis: any;
  opportunityAnalysis: any;
  consolidatedInsights: string[];
  executiveRecommendations: string[];
  overallScore: number;
  portfolioHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
}

/**
 * Run all three advanced analyses
 */
export async function runAdvancedSVIEAnalysis(
  skillsDir: string = svieConfig.skillRoot
): Promise<AdvancedAnalysisReport> {
  console.log('[SVIE Advanced Analysis] Starting integrated analysis...');
  const startTime = Date.now();

  const report: AdvancedAnalysisReport = {
    timestamp: new Date().toISOString(),
    executedModules: [],
    svieAnalysis: {},
    heatmapAnalysis: {},
    driftAnalysis: {},
    opportunityAnalysis: {},
    consolidatedInsights: [],
    executiveRecommendations: [],
    overallScore: 0,
    portfolioHealth: 'fair'
  };

  // Ensure reports directory exists
  if (!fs.existsSync(svieConfig.reportDir)) {
    fs.mkdirSync(svieConfig.reportDir, { recursive: true });
  }

  try {
    // STEP 1: Run SVIE core analysis
    console.log('[SVIE] Step 1: Running Skill Value Intelligence...');
    report.svieAnalysis = await analyzeSVIE();
    report.executedModules.push('SVIE');

    if (!report.svieAnalysis || !report.svieAnalysis.analyzedSkills) {
      console.warn('⚠️  SVIE analysis incomplete, skipping dependent analyses');
      return report;
    }

    // STEP 2: Run Heatmap Engine
    console.log('[SHE] Step 2: Running Skill Heatmap Engine...');
    try {
      report.heatmapAnalysis = await generateSkillHeatmap(report.svieAnalysis.analyzedSkills);
      report.executedModules.push('SHE');
      console.log(`✓ Heatmap generated: ${report.heatmapAnalysis.totalSkills} skills analyzed`);
    } catch (error) {
      console.warn('⚠️  Heatmap analysis failed:', error);
      report.heatmapAnalysis = { error: 'Failed to generate heatmap' };
    }

    // STEP 3: Run Drift Detector
    console.log('[SDD] Step 3: Running Skill Drift Detector...');
    try {
      report.driftAnalysis = await detectSkillDrift(skillsDir);
      report.executedModules.push('SDD');
      console.log(`✓ Drift analysis complete: ${report.driftAnalysis.issues.length} issues found`);
    } catch (error) {
      console.warn('⚠️  Drift detection failed:', error);
      report.driftAnalysis = { error: 'Failed to detect drift' };
    }

    // STEP 4: Run Opportunity Generator
    console.log('[SOG] Step 4: Running Skill Opportunity Generator...');
    try {
      report.opportunityAnalysis = await generateSkillOpportunities(
        report.svieAnalysis.analyzedSkills
      );
      report.executedModules.push('SOG');
      console.log(`✓ Opportunities identified: ${report.opportunityAnalysis.totalOpportunities} total`);
    } catch (error) {
      console.warn('⚠️  Opportunity analysis failed:', error);
      report.opportunityAnalysis = { error: 'Failed to generate opportunities' };
    }

    // STEP 5: Consolidate insights and calculate scores
    console.log('[Analysis] Step 5: Consolidating insights...');
    report.consolidatedInsights = this.consolidateInsights(report);
    report.executiveRecommendations = this.generateExecutiveRecommendations(report);
    report.overallScore = this.calculateOverallScore(report);
    report.portfolioHealth = this.determinePortfolioHealth(report.overallScore);

    console.log(`\n✓ Advanced analysis complete in ${(Date.now() - startTime) / 1000}s`);
    console.log(`  Overall Score: ${report.overallScore}/100`);
    console.log(`  Portfolio Health: ${report.portfolioHealth.toUpperCase()}`);
    console.log(`  Modules Run: ${report.executedModules.join(', ')}`);

    // Save consolidated report
    const reportPath = path.join(
      svieConfig.reportDir,
      `ADVANCED_SVIE_ANALYSIS_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    );
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📋 Report saved: ${reportPath}`);

    return report;
  } catch (error) {
    console.error('[Error] Advanced analysis failed:', error);
    throw error;
  }
}

/**
 * Consolidate insights from all analyses
 */
function consolidateInsights(report: AdvancedAnalysisReport): string[] {
  const insights: string[] = [];

  // From SVIE
  if (report.svieAnalysis.insights) {
    insights.push(...report.svieAnalysis.insights.slice(0, 2));
  }

  // From Heatmap
  if (report.heatmapAnalysis.insights) {
    insights.push(...report.heatmapAnalysis.insights.slice(0, 2));
  }

  // From Drift
  if (report.driftAnalysis.issues && report.driftAnalysis.issues.length > 0) {
    const critical = report.driftAnalysis.criticalDrifts.length;
    if (critical > 0) {
      insights.push(`🚨 Critical Drift: ${critical} security/architectural issues detected`);
    }
  }

  // From Opportunities
  if (report.opportunityAnalysis.insights) {
    insights.push(...report.opportunityAnalysis.insights.slice(0, 2));
  }

  return insights;
}

/**
 * Generate executive-level recommendations
 */
function generateExecutiveRecommendations(report: AdvancedAnalysisReport): string[] {
  const recommendations: string[] = [];

  // Critical issues
  if (report.driftAnalysis.criticalDrifts && report.driftAnalysis.criticalDrifts.length > 0) {
    recommendations.push(
      `🚨 PRIORITY 1: Fix ${report.driftAnalysis.criticalDrifts.length} critical drift issues immediately`
    );
  }

  // Consolidation
  if (report.opportunityAnalysis.consolidationCandidates) {
    const count = report.opportunityAnalysis.consolidationCandidates.length;
    if (count > 0) {
      recommendations.push(
        `🧹 PRIORITY 2: Consolidate ${count} underutilized skills (save 50+ maintenance hours/year)`
      );
    }
  }

  // Expansion
  if (report.opportunityAnalysis.gapAnalysis?.missingCapabilities?.length > 0) {
    const gaps = report.opportunityAnalysis.gapAnalysis.missingCapabilities.length;
    recommendations.push(
      `📈 PRIORITY 3: Build ${gaps} new skills to fill capability gaps`
    );
  }

  // Modernization
  if (report.driftAnalysis.overallDriftScore > 50) {
    recommendations.push(
      `🔧 PRIORITY 4: Architecture review and modernization sprint needed`
    );
  }

  // Success state
  if (recommendations.length === 0) {
    recommendations.push('✅ Portfolio is healthy - maintain current practices and continue monitoring');
  }

  return recommendations;
}

/**
 * Calculate overall portfolio score (0-100)
 */
function calculateOverallScore(report: AdvancedAnalysisReport): number {
  let score = 100;

  // Deduct for drift issues
  if (report.driftAnalysis.overallDriftScore) {
    score -= report.driftAnalysis.overallDriftScore * 0.3;
  }

  // Deduct for underutilized skills
  if (report.opportunityAnalysis.gapAnalysis?.underutilizedSkills) {
    const underutilizedPct = (report.opportunityAnalysis.gapAnalysis.underutilizedSkills /
      report.opportunityAnalysis.totalSkills) * 100;
    score -= Math.min(20, underutilizedPct * 0.2);
  }

  // Deduct for missing capabilities
  if (report.opportunityAnalysis.gapAnalysis?.missingCapabilities?.length > 0) {
    score -= Math.min(15, report.opportunityAnalysis.gapAnalysis.missingCapabilities.length * 2);
  }

  // Bonus for cold zone management (well-maintained older skills)
  if (report.heatmapAnalysis.zoneDistribution) {
    const warmMaintained = report.heatmapAnalysis.zoneDistribution.warmMaintained || 0;
    const total = report.heatmapAnalysis.totalSkills || 1;
    if (warmMaintained / total > 0.2) {
      score += 5;
    }
  }

  return Math.max(0, Math.round(Math.min(100, score)));
}

/**
 * Determine portfolio health status
 */
function determinePortfolioHealth(
  score: number
): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'fair';
  if (score >= 30) return 'poor';
  return 'critical';
}

/**
 * CLI entry point
 */
export async function main() {
  try {
    const report = await runAdvancedSVIEAnalysis();

    console.log('\n' + '='.repeat(60));
    console.log('📊 ADVANCED SVIE ANALYSIS SUMMARY');
    console.log('='.repeat(60));
    console.log(`\nPortfolio Health: ${report.portfolioHealth.toUpperCase()}`);
    console.log(`Overall Score: ${report.overallScore}/100\n`);

    console.log('Consolidated Insights:');
    report.consolidatedInsights.forEach(insight => console.log(`  • ${insight}`));

    console.log('\nExecutive Recommendations:');
    report.executiveRecommendations.forEach(rec => console.log(`  → ${rec}`));

    console.log('\nModules Executed: ' + report.executedModules.join(' + '));
    console.log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if invoked directly
if (require.main === module) {
  main();
}
