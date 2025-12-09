/**
 * APPM Runner
 * Executes Agent Performance Prediction Model and saves report
 */

import fs from 'fs';
import path from 'path';
import { evaluateAgentPerformance } from './appm-engine';
import { svieConfig } from '../svie-config';

/**
 * Run APPM and generate report
 */
export async function runAPPMAnalysis(): Promise<void> {
  console.log('[APPM Runner] Starting agent performance prediction...');

  try {
    // Ensure reports directory exists
    if (!fs.existsSync(svieConfig.reportDir)) {
      fs.mkdirSync(svieConfig.reportDir, { recursive: true });
    }

    // Run evaluation
    const analysis = await evaluateAgentPerformance();

    // Save report
    const reportPath = path.join(
      svieConfig.reportDir,
      `agent_performance_prediction_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    );
    fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2));

    // Display summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 AGENT PERFORMANCE PREDICTION SUMMARY');
    console.log('='.repeat(60));
    console.log(`\nOverall Risk Score: ${analysis.overallRiskScore}/100`);
    console.log(`Risk Classification: ${analysis.riskClassification.toUpperCase()}`);
    console.log(`\nSkill Risk Distribution:`);
    console.log(`  🚨 High Risk: ${analysis.highRiskSkills.length} skills`);
    console.log(`  ⚠️  Medium Risk: ${analysis.mediumRiskSkills.length} skills`);
    console.log(`  ✅ Low Risk: ${analysis.lowRiskSkills.length} skills`);

    console.log(`\nRisk Breakdown:`);
    console.log(`  Drift Issues: ${analysis.riskBreakdown.driftIssues}`);
    console.log(`  Underutilized Skills: ${analysis.riskBreakdown.underutilizedSkills}`);
    console.log(`  Poor Health Skills: ${analysis.riskBreakdown.poorHealthSkills}`);
    console.log(`  Missing Tests: ${analysis.riskBreakdown.missingTests}`);
    console.log(`  Missing Docs: ${analysis.riskBreakdown.missingDocs}`);

    console.log(`\nInsights:`);
    analysis.insights.forEach(insight => console.log(`  • ${insight}`));

    console.log(`\nRecommendations:`);
    analysis.recommendations.forEach(rec => console.log(`  → ${rec}`));

    if (analysis.highRiskSkills.length > 0) {
      console.log(`\nTop High-Risk Skills:`);
      analysis.highRiskSkills.slice(0, 3).forEach(skill => {
        console.log(`  🚨 ${skill.skillName} (Risk: ${skill.riskContribution})`);
        skill.issues.forEach(issue => console.log(`      • ${issue}`));
      });
    }

    console.log(`\n📋 Report saved: ${reportPath}`);
    console.log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('[APPM] Fatal error:', error);
    process.exit(1);
  }
}

// Run if invoked directly
if (require.main === module) {
  runAPPMAnalysis();
}
