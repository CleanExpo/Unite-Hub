/**
 * SISE Runner - Skill Impact Simulation Engine
 */

import fs from 'fs';
import path from 'path';
import { runSkillImpactSimulation } from './skill-impact-engine';

export async function runSISE(): Promise<void> {
  console.log('[SISE Runner] Starting skill impact simulation...\n');

  try {
    // Ensure reports directory exists
    if (!fs.existsSync('reports')) {
      fs.mkdirSync('reports', { recursive: true });
    }

    // Run simulation
    const report = await runSkillImpactSimulation();

    // Save report
    const reportPath = path.join(
      'reports',
      `skill_impact_simulation_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    );
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Display summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 SKILL IMPACT SIMULATION REPORT');
    console.log('='.repeat(70));

    console.log('\nBaseline Metrics:');
    console.log(`  Total Skills: ${report.baselineMetrics.totalSkills}`);
    console.log(`  Avg Health: ${report.baselineMetrics.avgHealthScore}/10`);
    console.log(`  Drift Issues: ${report.baselineMetrics.driftIssuesCount}`);
    console.log(`  Underutilized: ${report.baselineMetrics.underutilizedCount}`);
    console.log(`  Risk Score: ${report.baselineMetrics.overallRiskScore}/100`);

    console.log('\nTop Impact Scenarios:');
    report.topImpactScenarios.slice(0, 3).forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.scenarioName} (Impact: ${s.overallImpactScore}/100)`);
      console.log(`     Effort: ${s.effort}`);
    });

    console.log('\nSequential Approach:');
    console.log(`  Scenarios: ${report.combinedScenarioAnalysis.sequentialApproach.length}`);
    console.log(`  Total Effort: ${report.combinedScenarioAnalysis.estimatedTotalEffort}`);
    console.log(`  Expected Improvement: ${report.combinedScenarioAnalysis.estimatedTotalImprovement}%`);

    console.log('\nInsights:');
    report.insights.forEach(i => console.log(`  • ${i}`));

    console.log('\nRecommendations:');
    report.recommendations.forEach(r => console.log(`  → ${r}`));

    console.log(`\n📄 Report saved: ${reportPath}`);
    console.log('='.repeat(70));

    process.exit(0);
  } catch (error) {
    console.error('[SISE] Fatal error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runSISE();
}
