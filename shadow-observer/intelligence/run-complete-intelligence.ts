/**
 * Complete Intelligence Layer Orchestrator
 * Runs all 6 intelligence modules in optimal sequence
 *
 * APPM + SRRE + SID (Phase 1)
 * SISE + MARO + ASEE (Phase 2)
 *
 * All non-destructive, read-only analysis
 */

import fs from 'fs';
import path from 'path';

// Phase 1 modules
import { evaluateAgentPerformance } from './appm/appm-engine';
import { generateRefactorPlans } from './srre/srre-engine';

// Phase 2 modules
import { runSkillImpactSimulation } from './simulation/skill-impact-engine';
import { generateRoutingRecommendations } from './routing/agent-routing-optimizer';
import { runSkillEvolutionAnalysis } from './evolution/skill-evolution-engine';

export interface CompleteIntelligenceReport {
  timestamp: string;
  executedModules: string[];
  phase1: {
    appm: any;
    srre: any;
  };
  phase2: {
    sise: any;
    maro: any;
    asee: any;
  };
  consolidatedInsights: string[];
  executiveRecommendations: string[];
  actionItems: ActionItem[];
  metrics: SystemMetrics;
}

export interface ActionItem {
  priority: 'critical' | 'high' | 'medium' | 'low';
  action: string;
  module: string;
  effort: string;
  timeline: string;
}

export interface SystemMetrics {
  totalSkillsAnalyzed: number;
  overallRiskScore: number;
  skillsRequiringAction: number;
  newOpportunitiesIdentified: number;
  blueprintsDrafted: number;
  totalEvolutionItems: number;
}

/**
 * Run complete intelligence layer
 */
export async function runCompleteIntelligence(): Promise<CompleteIntelligenceReport> {
  console.log('[Intelligence Layer] Starting complete analysis (6 modules)...\n');
  const startTime = Date.now();

  const report: CompleteIntelligenceReport = {
    timestamp: new Date().toISOString(),
    executedModules: [],
    phase1: {
      appm: null,
      srre: null
    },
    phase2: {
      sise: null,
      maro: null,
      asee: null
    },
    consolidatedInsights: [],
    executiveRecommendations: [],
    actionItems: [],
    metrics: {
      totalSkillsAnalyzed: 0,
      overallRiskScore: 0,
      skillsRequiringAction: 0,
      newOpportunitiesIdentified: 0,
      blueprintsDrafted: 0,
      totalEvolutionItems: 0
    }
  };

  // Ensure reports directory
  if (!fs.existsSync('reports')) {
    fs.mkdirSync('reports', { recursive: true });
  }

  try {
    // ===== PHASE 1: Risk Assessment & Refactoring =====
    console.log('='.repeat(70));
    console.log('PHASE 1: Risk Assessment & Refactoring Planning');
    console.log('='.repeat(70));

    // APPM
    console.log('\n[1/6] APPM - Agent Performance Prediction...');
    try {
      report.phase1.appm = await evaluateAgentPerformance();
      report.executedModules.push('APPM');
      console.log('✓ APPM complete');
    } catch (error) {
      console.warn('⚠️ APPM failed:', error);
    }

    // SRRE
    console.log('[2/6] SRRE - Skill Refactor Recommendations...');
    try {
      report.phase1.srre = await generateRefactorPlans();
      report.executedModules.push('SRRE');
      console.log('✓ SRRE complete');
    } catch (error) {
      console.warn('⚠️ SRRE failed:', error);
    }

    // ===== PHASE 2: Impact Simulation & Evolution =====
    console.log('\n' + '='.repeat(70));
    console.log('PHASE 2: Impact Simulation & Skill Evolution');
    console.log('='.repeat(70));

    // SISE
    console.log('\n[3/6] SISE - Skill Impact Simulation...');
    try {
      report.phase2.sise = await runSkillImpactSimulation();
      report.executedModules.push('SISE');
      console.log('✓ SISE complete');
    } catch (error) {
      console.warn('⚠️ SISE failed:', error);
    }

    // MARO
    console.log('[4/6] MARO - Multi-Agent Routing Optimization...');
    try {
      report.phase2.maro = await generateRoutingRecommendations();
      report.executedModules.push('MARO');
      console.log('✓ MARO complete');
    } catch (error) {
      console.warn('⚠️ MARO failed:', error);
    }

    // ASEE
    console.log('[5/6] ASEE - Autonomous Skill Evolution...');
    try {
      report.phase2.asee = await runSkillEvolutionAnalysis();
      report.executedModules.push('ASEE');
      console.log('✓ ASEE complete');
    } catch (error) {
      console.warn('⚠️ ASEE failed:', error);
    }

    // ===== CONSOLIDATION =====
    console.log('\n[6/6] Consolidating insights...');

    // Extract metrics
    if (report.phase1.appm) {
      report.metrics.overallRiskScore = report.phase1.appm.overallRiskScore || 0;
    }
    if (report.phase1.srre) {
      report.metrics.skillsRequiringAction = report.phase1.srre.skillsRequiringRefactor || 0;
    }
    if (report.phase2.asee) {
      report.metrics.newOpportunitiesIdentified = report.phase2.asee.newSkillOpportunities.length || 0;
      report.metrics.blueprintsDrafted = report.phase2.asee.blueprintDrafts.length || 0;
      report.metrics.totalEvolutionItems = report.phase2.asee.evolutionPlans.length || 0;
    }

    // Consolidate insights
    report.consolidatedInsights = consolidateInsights(report);

    // Generate recommendations
    report.executiveRecommendations = generateExecutiveRecommendations(report);

    // Generate action items
    report.actionItems = generateActionItems(report);

    console.log('✓ Consolidation complete');

    // Save consolidated report
    const reportPath = path.join(
      'reports',
      `COMPLETE_INTELLIGENCE_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    );
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n' + '='.repeat(70));
    console.log(`✓ Complete intelligence analysis finished in ${(Date.now() - startTime) / 1000}s`);
    console.log('='.repeat(70));

    displaySummary(report);

    return report;
  } catch (error) {
    console.error('[Intelligence Layer] Fatal error:', error);
    throw error;
  }
}

/**
 * Consolidate insights from all 6 modules
 */
function consolidateInsights(report: CompleteIntelligenceReport): string[] {
  const insights: string[] = [];

  // From APPM
  if (report.phase1.appm?.insights) {
    insights.push(...report.phase1.appm.insights.slice(0, 1));
  }

  // From SRRE
  if (report.phase1.srre?.insights) {
    insights.push(...report.phase1.srre.insights.slice(0, 1));
  }

  // From SISE
  if (report.phase2.sise?.insights) {
    insights.push(...report.phase2.sise.insights.slice(0, 1));
  }

  // From MARO
  if (report.phase2.maro?.insights) {
    insights.push(...report.phase2.maro.insights.slice(0, 1));
  }

  // From ASEE
  if (report.phase2.asee?.insights) {
    insights.push(...report.phase2.asee.insights.slice(0, 1));
  }

  return insights.filter(i => i);
}

/**
 * Generate executive recommendations
 */
function generateExecutiveRecommendations(report: CompleteIntelligenceReport): string[] {
  const recommendations: string[] = [];

  // Risk-driven
  if (report.phase1.appm?.riskClassification === 'high-risk') {
    recommendations.push(
      `🚨 CRITICAL: Address ${report.phase1.appm.highRiskSkills?.length || 0} high-risk skills immediately`
    );
  }

  // Refactoring-driven
  if (report.phase1.srre?.criticalRefactors?.length > 0) {
    recommendations.push(
      `🔧 Execute ${report.phase1.srre.criticalRefactors.length} critical refactors within 1 week`
    );
  }

  // Impact-driven
  if (report.phase2.sise?.topImpactScenarios?.length > 0) {
    const top = report.phase2.sise.topImpactScenarios[0];
    recommendations.push(
      `📈 Pursue ${top.scenarioName} for maximum system improvement (${top.overallImpactScore}% impact)`
    );
  }

  // Evolution-driven
  if (report.phase2.asee?.blueprintDrafts?.length > 0) {
    recommendations.push(
      `💡 Review ${report.phase2.asee.blueprintDrafts.length} new skill blueprints for implementation`
    );
  }

  // Routing-driven
  if (report.phase2.maro?.routingHooks?.length > 0) {
    const critical = report.phase2.maro.routingHooks.filter((h: any) => h.priority === 'critical');
    if (critical.length > 0) {
      recommendations.push(
        `🔒 Activate ${critical.length} critical routing hooks to prevent misrouting`
      );
    }
  }

  return recommendations;
}

/**
 * Generate action items
 */
function generateActionItems(report: CompleteIntelligenceReport): ActionItem[] {
  const items: ActionItem[] = [];

  // From APPM
  if (report.phase1.appm?.highRiskSkills?.length > 0) {
    items.push({
      priority: 'critical',
      action: `Audit ${report.phase1.appm.highRiskSkills.length} high-risk skills`,
      module: 'APPM',
      effort: '4-8 hours',
      timeline: '3 business days'
    });
  }

  // From SRRE
  if (report.phase1.srre?.criticalRefactors?.length > 0) {
    items.push({
      priority: 'critical',
      action: `Execute ${report.phase1.srre.criticalRefactors.length} critical refactors`,
      module: 'SRRE',
      effort: `${report.phase1.srre.criticalRefactors.length * 8} hours`,
      timeline: '1 week'
    });
  }

  // From SISE
  if (report.phase2.sise?.topImpactScenarios?.length > 0) {
    items.push({
      priority: 'high',
      action: `Execute top impact scenario: ${report.phase2.sise.topImpactScenarios[0].scenarioName}`,
      module: 'SISE',
      effort: report.phase2.sise.topImpactScenarios[0].effort,
      timeline: 'Next quarter'
    });
  }

  // From ASEE
  if (report.phase2.asee?.evolutionPlans?.length > 0) {
    const critical = report.phase2.asee.evolutionPlans.filter(p => p.priority === 'critical');
    if (critical.length > 0) {
      items.push({
        priority: 'high',
        action: `Execute ${critical.length} critical evolution plans`,
        module: 'ASEE',
        effort: `${critical.reduce((sum, p) => sum + (p.effort.includes('week') ? 40 : 8), 0)} hours`,
        timeline: 'This month'
      });
    }
  }

  return items;
}

/**
 * Display final summary
 */
function displaySummary(report: CompleteIntelligenceReport): void {
  console.log('\n' + '='.repeat(70));
  console.log('📊 COMPLETE INTELLIGENCE SUMMARY');
  console.log('='.repeat(70));

  console.log(`\nModules Executed (${report.executedModules.length}/6):`);
  report.executedModules.forEach(m => {
    const icon = m.length > 4 ? '✓' : '✓';
    console.log(`  ${icon} ${m}`);
  });

  console.log('\nSystem Metrics:');
  console.log(`  Risk Score: ${report.metrics.overallRiskScore}/100`);
  console.log(`  Skills Requiring Action: ${report.metrics.skillsRequiringAction}`);
  console.log(`  New Opportunities: ${report.metrics.newOpportunitiesIdentified}`);
  console.log(`  Evolution Items: ${report.metrics.totalEvolutionItems}`);
  console.log(`  Blueprints Drafted: ${report.metrics.blueprintsDrafted}`);

  console.log('\nConsolidated Insights:');
  report.consolidatedInsights.forEach(i => console.log(`  • ${i}`));

  console.log('\nExecutive Recommendations:');
  report.executiveRecommendations.forEach(r => console.log(`  → ${r}`));

  if (report.actionItems.length > 0) {
    console.log('\nTop Action Items:');
    report.actionItems.slice(0, 5).forEach((item, i) => {
      const emoji = item.priority === 'critical' ? '🚨' : '⚠️';
      console.log(`\n  ${i + 1}. ${emoji} ${item.action}`);
      console.log(`     Module: ${item.module} | Effort: ${item.effort} | Timeline: ${item.timeline}`);
    });
  }

  console.log('\n' + '='.repeat(70));
}

/**
 * CLI entry point
 */
export async function main() {
  try {
    await runCompleteIntelligence();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
