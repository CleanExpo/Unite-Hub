/**
 * Intelligence Layer Orchestrator
 * Runs APPM, SRRE, and generates unified intelligence report
 */

import fs from 'fs';
import path from 'path';
import { evaluateAgentPerformance } from './appm/appm-engine';
import { generateRefactorPlans } from './srre/srre-engine';
import { svieConfig } from './svie-config';

export interface IntelligenceLayerReport {
  timestamp: string;
  executedModules: string[];
  appm: any;
  srre: any;
  consolidatedInsights: string[];
  executiveRecommendations: string[];
  actionItems: ActionItem[];
}

export interface ActionItem {
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  module: string;
  estimatedEffort: string;
  sla: string;
}

/**
 * Run all intelligence modules
 */
export async function runIntelligenceLayer(): Promise<IntelligenceLayerReport> {
  console.log('[Intelligence] Starting comprehensive intelligence analysis...');
  const startTime = Date.now();

  const report: IntelligenceLayerReport = {
    timestamp: new Date().toISOString(),
    executedModules: [],
    appm: {},
    srre: {},
    consolidatedInsights: [],
    executiveRecommendations: [],
    actionItems: []
  };

  // Ensure reports directory exists
  if (!fs.existsSync(svieConfig.reportDir)) {
    fs.mkdirSync(svieConfig.reportDir, { recursive: true });
  }

  try {
    // APPM Analysis
    console.log('[Intelligence] Module 1: Agent Performance Prediction (APPM)...');
    try {
      report.appm = await evaluateAgentPerformance();
      report.executedModules.push('APPM');
      console.log('✓ APPM analysis complete');
    } catch (error) {
      console.warn('⚠️  APPM analysis failed:', error);
      report.appm = { error: 'APPM analysis failed' };
    }

    // SRRE Analysis
    console.log('[Intelligence] Module 2: Skill Refactor Recommendation Engine (SRRE)...');
    try {
      report.srre = await generateRefactorPlans();
      report.executedModules.push('SRRE');
      console.log('✓ SRRE analysis complete');
    } catch (error) {
      console.warn('⚠️  SRRE analysis failed:', error);
      report.srre = { error: 'SRRE analysis failed' };
    }

    // Consolidate insights
    console.log('[Intelligence] Consolidating insights...');
    report.consolidatedInsights = consolidateInsights(report);
    report.executiveRecommendations = generateExecutiveRecommendations(report);
    report.actionItems = generateActionItems(report);

    console.log(`\n✓ Intelligence layer analysis complete in ${(Date.now() - startTime) / 1000}s`);

    // Save consolidated report
    const reportPath = path.join(
      svieConfig.reportDir,
      `INTELLIGENCE_LAYER_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    );
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📋 Report saved: ${reportPath}`);

    // Display summary
    displaySummary(report);

    return report;
  } catch (error) {
    console.error('[Intelligence] Fatal error:', error);
    throw error;
  }
}

/**
 * Consolidate insights from all modules
 */
function consolidateInsights(report: IntelligenceLayerReport): string[] {
  const insights: string[] = [];

  // APPM insights
  if (report.appm?.insights) {
    insights.push(...report.appm.insights.slice(0, 2));
  }

  // SRRE insights
  if (report.srre?.insights) {
    insights.push(...report.srre.insights.slice(0, 2));
  }

  // Risk classification
  if (report.appm?.riskClassification === 'high-risk') {
    insights.push(`🚨 ALERT: Agent performance at HIGH RISK - immediate action required`);
  }

  // Refactor burden
  if (report.srre?.skillsRequiringRefactor > 20) {
    insights.push(
      `📋 PORTFOLIO: ${report.srre.skillsRequiringRefactor} skills require refactoring ` +
      `(${Math.ceil(report.srre.estimatedTotalHours / 40)} weeks of work)`
    );
  }

  return insights;
}

/**
 * Generate executive recommendations
 */
function generateExecutiveRecommendations(report: IntelligenceLayerReport): string[] {
  const recommendations: string[] = [];

  // Critical risk response
  if (report.appm?.riskClassification === 'high-risk') {
    recommendations.push(
      `🚨 PRIORITY 1: Address ${report.appm.highRiskSkills?.length || 0} high-risk skills immediately`
    );
  }

  // Critical refactors
  if (report.srre?.criticalRefactors?.length > 0) {
    recommendations.push(
      `🚨 PRIORITY 2: Execute ${report.srre.criticalRefactors.length} critical refactors within 1 week`
    );
  }

  // High-ROI quick wins
  if (report.srre?.highROIRefactors?.length > 0) {
    recommendations.push(
      `💰 PRIORITY 3: Schedule ${Math.min(5, report.srre.highROIRefactors.length)} high-ROI quick wins for next sprint`
    );
  }

  // Capacity planning
  if (report.srre?.estimatedTotalHours > 150) {
    const weeks = Math.ceil(report.srre.estimatedTotalHours / 40);
    recommendations.push(
      `⏱️ PRIORITY 4: Allocate ${weeks} weeks of dedicated refactoring capacity`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      `✅ Portfolio health is good - maintain current practices and continue monitoring`
    );
  }

  return recommendations;
}

/**
 * Generate prioritized action items
 */
function generateActionItems(report: IntelligenceLayerReport): ActionItem[] {
  const actions: ActionItem[] = [];

  // Critical risk actions
  if (report.appm?.highRiskSkills?.length > 0) {
    actions.push({
      priority: 'critical',
      title: `Audit ${report.appm.highRiskSkills.length} High-Risk Skills`,
      description: 'Review and remediate high-risk skills identified by performance prediction model',
      module: 'APPM',
      estimatedEffort: '4-8 hours',
      sla: 'Complete within 3 business days'
    });
  }

  // Critical refactors
  if (report.srre?.criticalRefactors?.length > 0) {
    const topCritical = report.srre.criticalRefactors.slice(0, 3);
    actions.push({
      priority: 'critical',
      title: `Execute Critical Refactors (${topCritical.length} skills)`,
      description: `${topCritical.map((r: any) => r.skillName).join(', ')}`,
      module: 'SRRE',
      estimatedEffort: `${Math.round(topCritical.reduce((sum: number, r: any) => sum + (r.actions?.length || 1) * 4, 0))} hours`,
      sla: 'Complete within 1 week'
    });
  }

  // High-ROI quick wins
  if (report.srre?.highROIRefactors?.length > 0) {
    const topROI = report.srre.highROIRefactors.slice(0, 2);
    actions.push({
      priority: 'high',
      title: `Execute High-ROI Quick Wins (${topROI.length} refactors)`,
      description: `${topROI.map((r: any) => `${r.skillName} (ROI: ${r.roiScore})`).join(', ')}`,
      module: 'SRRE',
      estimatedEffort: `${Math.round(topROI.reduce((sum: number, r: any) => sum + (r.actions?.length || 1) * 2, 0))} hours`,
      sla: 'Schedule for next sprint'
    });
  }

  // Monitoring
  if (report.appm?.riskClassification === 'medium-risk') {
    actions.push({
      priority: 'high',
      title: 'Increase Monitoring for Medium-Risk Skills',
      description: `${report.appm.mediumRiskSkills?.length || 0} skills require elevated monitoring`,
      module: 'APPM',
      estimatedEffort: '2-4 hours',
      sla: 'Implement within 1 week'
    });
  }

  // Capacity allocation
  if (report.srre?.estimatedTotalHours > 100) {
    actions.push({
      priority: 'high',
      title: 'Plan Quarterly Refactoring Roadmap',
      description: `Allocate resources for ${Math.ceil(report.srre.estimatedTotalHours / 40)} weeks of refactoring work`,
      module: 'SRRE',
      estimatedEffort: '4-8 hours',
      sla: 'Plan by end of week'
    });
  }

  return actions;
}

/**
 * Display summary to console
 */
function displaySummary(report: IntelligenceLayerReport): void {
  console.log('\n' + '='.repeat(70));
  console.log('📊 INTELLIGENCE LAYER SUMMARY');
  console.log('='.repeat(70));

  console.log('\nExecuted Modules:', report.executedModules.join(' + '));

  console.log('\n--- AGENT PERFORMANCE (APPM) ---');
  if (report.appm?.overallRiskScore !== undefined) {
    console.log(`Risk Score: ${report.appm.overallRiskScore}/100 (${report.appm.riskClassification})`);
    console.log(`High Risk Skills: ${report.appm.highRiskSkills?.length || 0}`);
    console.log(`Medium Risk Skills: ${report.appm.mediumRiskSkills?.length || 0}`);
  } else {
    console.log('(Analysis failed)');
  }

  console.log('\n--- REFACTOR RECOMMENDATIONS (SRRE) ---');
  if (report.srre?.skillsRequiringRefactor !== undefined) {
    console.log(`Skills Requiring Refactor: ${report.srre.skillsRequiringRefactor}`);
    console.log(`Critical Refactors: ${report.srre.criticalRefactors?.length || 0}`);
    console.log(`High-ROI Opportunities: ${report.srre.highROIRefactors?.length || 0}`);
    console.log(`Est. Total Effort: ${Math.round(report.srre.estimatedTotalHours)} hours`);
  } else {
    console.log('(Analysis failed)');
  }

  console.log('\n--- CONSOLIDATED INSIGHTS ---');
  report.consolidatedInsights.forEach(insight => {
    console.log(`• ${insight}`);
  });

  console.log('\n--- EXECUTIVE RECOMMENDATIONS ---');
  report.executiveRecommendations.forEach(rec => {
    console.log(`→ ${rec}`);
  });

  if (report.actionItems.length > 0) {
    console.log('\n--- TOP ACTION ITEMS ---');
    report.actionItems.slice(0, 5).forEach((item, i) => {
      const emoji = item.priority === 'critical' ? '🚨' : '⚠️';
      console.log(`\n${i + 1}. ${emoji} [${item.priority.toUpperCase()}] ${item.title}`);
      console.log(`   Module: ${item.module}`);
      console.log(`   Effort: ${item.estimatedEffort}`);
      console.log(`   SLA: ${item.sla}`);
    });
  }

  console.log('\n' + '='.repeat(70));
}

/**
 * CLI entry point
 */
export async function main() {
  try {
    await runIntelligenceLayer();
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
