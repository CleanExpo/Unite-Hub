/**
 * SRRE Runner
 * Executes Skill Refactor Recommendation Engine and saves report
 */

import fs from 'fs';
import path from 'path';
import { generateRefactorPlans } from './srre-engine';
import { svieConfig } from '../svie-config';

/**
 * Run SRRE and generate refactor plans
 */
export async function runSRREAnalysis(): Promise<void> {
  console.log('[SRRE Runner] Generating skill refactor plans...');

  try {
    // Ensure reports directory exists
    if (!fs.existsSync(svieConfig.reportDir)) {
      fs.mkdirSync(svieConfig.reportDir, { recursive: true });
    }

    // Generate refactor plans
    const analysis = await generateRefactorPlans();

    // Save JSON report
    const jsonReportPath = path.join(
      svieConfig.reportDir,
      `skill_refactor_plan_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    );
    fs.writeFileSync(jsonReportPath, JSON.stringify(analysis, null, 2));

    // Generate Markdown report
    const mdContent = generateMarkdownReport(analysis);
    const mdReportPath = path.join(
      svieConfig.reportDir,
      `skill_refactor_plan_${new Date().toISOString().replace(/[:.]/g, '-')}.md`
    );
    fs.writeFileSync(mdReportPath, mdContent);

    // Display summary
    console.log('\n' + '='.repeat(70));
    console.log('📋 SKILL REFACTOR RECOMMENDATION ENGINE SUMMARY');
    console.log('='.repeat(70));
    console.log(`\nSkill Portfolio Analysis:`);
    console.log(`  Total Skills: ${analysis.totalSkillsAnalyzed}`);
    console.log(`  Requiring Refactor: ${analysis.skillsRequiringRefactor}`);
    console.log(`  ${Math.round((analysis.skillsRequiringRefactor / analysis.totalSkillsAnalyzed) * 100)}% of portfolio`);

    console.log(`\nRefactor Breakdown:`);
    console.log(`  🚨 Critical: ${analysis.criticalRefactors.length} skills`);
    console.log(`  💰 High ROI: ${analysis.highROIRefactors.length} refactors`);

    console.log(`\nEffort Estimate:`);
    const weeks = Math.ceil(analysis.estimatedTotalHours / 40);
    console.log(`  Total Hours: ${Math.round(analysis.estimatedTotalHours)}`);
    console.log(`  Timeline: ~${weeks} week${weeks !== 1 ? 's' : ''} (full capacity)`);
    console.log(`  Daily Effort: ~${Math.round(analysis.estimatedTotalHours / 20)} hours/day (half capacity)`);

    console.log(`\nInsights:`);
    analysis.insights.forEach(insight => console.log(`  • ${insight}`));

    console.log(`\nRecommendations:`);
    analysis.recommendations.forEach(rec => console.log(`  → ${rec}`));

    if (analysis.criticalRefactors.length > 0) {
      console.log(`\nCritical Refactors (First Sprint):`);
      analysis.criticalRefactors.slice(0, 5).forEach(plan => {
        console.log(`  🚨 ${plan.skillName}`);
        console.log(`      Issues: ${plan.issuesCount} | Effort: ${plan.estimatedTimeToCompletion}`);
        plan.mainIssues.forEach(issue => console.log(`      • ${issue}`));
      });
    }

    if (analysis.highROIRefactors.length > 0) {
      console.log(`\nHigh-ROI Quick Wins:`);
      analysis.highROIRefactors.slice(0, 5).forEach(plan => {
        console.log(`  💰 ${plan.skillName} (ROI: ${plan.roiScore})`);
        console.log(`      Impact: ${plan.impactScore} | Effort: ${plan.effortScore} | Time: ${plan.estimatedTimeToCompletion}`);
      });
    }

    console.log(`\n📄 JSON Report: ${jsonReportPath}`);
    console.log(`📄 Markdown Report: ${mdReportPath}`);
    console.log('='.repeat(70));

    process.exit(0);
  } catch (error) {
    console.error('[SRRE] Fatal error:', error);
    process.exit(1);
  }
}

/**
 * Generate Markdown-formatted refactor plan report
 */
function generateMarkdownReport(analysis: any): string {
  let md = `# Skill Refactor Recommendation Report\n\n`;
  md += `**Generated**: ${new Date().toLocaleString()}\n\n`;

  md += `## Executive Summary\n\n`;
  md += `- **Total Skills Analyzed**: ${analysis.totalSkillsAnalyzed}\n`;
  md += `- **Skills Requiring Refactor**: ${analysis.skillsRequiringRefactor} (${Math.round((analysis.skillsRequiringRefactor / analysis.totalSkillsAnalyzed) * 100)}%)\n`;
  md += `- **Critical Refactors**: ${analysis.criticalRefactors.length}\n`;
  md += `- **Estimated Total Effort**: ${Math.round(analysis.estimatedTotalHours)} hours (~${Math.ceil(analysis.estimatedTotalHours / 40)} weeks)\n\n`;

  md += `## Key Insights\n\n`;
  analysis.insights.forEach((insight: string) => {
    md += `- ${insight}\n`;
  });
  md += `\n`;

  md += `## Recommendations\n\n`;
  analysis.recommendations.forEach((rec: string) => {
    md += `- ${rec}\n`;
  });
  md += `\n`;

  if (analysis.criticalRefactors.length > 0) {
    md += `## Critical Refactors\n\n`;
    md += `**Action Required**: Address within 1 week\n\n`;
    for (const plan of analysis.criticalRefactors.slice(0, 10)) {
      md += `### ${plan.skillName}\n\n`;
      md += `- **Priority**: 🚨 CRITICAL\n`;
      md += `- **Issues**: ${plan.issuesCount}\n`;
      md += `- **Estimated Time**: ${plan.estimatedTimeToCompletion}\n`;
      md += `- **Issues**:\n`;
      plan.mainIssues.forEach((issue: string) => {
        md += `  - ${issue}\n`;
      });
      md += `- **Risks**:\n`;
      plan.risks.forEach((risk: string) => {
        md += `  - ${risk}\n`;
      });
      md += `- **Benefits**:\n`;
      plan.benefits.forEach((benefit: string) => {
        md += `  - ${benefit}\n`;
      });
      md += `\n`;
    }
  }

  if (analysis.highROIRefactors.length > 0) {
    md += `## High-ROI Quick Wins\n\n`;
    md += `**Quick Wins**: High impact with low effort\n\n`;
    for (const plan of analysis.highROIRefactors.slice(0, 5)) {
      md += `### ${plan.skillName}\n\n`;
      md += `- **ROI Score**: ${plan.roiScore}\n`;
      md += `- **Impact**: ${plan.impactScore} | **Effort**: ${plan.effortScore}\n`;
      md += `- **Estimated Time**: ${plan.estimatedTimeToCompletion}\n`;
      md += `\n`;
    }
  }

  md += `## Prioritized Roadmap\n\n`;
  md += `| Rank | Skill | Priority | Issues | Effort | ROI |\n`;
  md += `|------|-------|----------|--------|--------|-----|\n`;
  for (let i = 0; i < Math.min(15, analysis.prioritizedRoadmap.length); i++) {
    const plan = analysis.prioritizedRoadmap[i];
    const priorityEmoji = plan.priority === 'critical' ? '🚨' : plan.priority === 'high' ? '⚠️' : '📋';
    md += `| ${i + 1} | ${plan.skillName} | ${priorityEmoji} ${plan.priority.toUpperCase()} | ${plan.issuesCount} | ${plan.estimatedTimeToCompletion} | ${plan.roiScore} |\n`;
  }
  md += `\n`;

  md += `## Notes\n\n`;
  md += `- This report contains **recommendations only** — no code changes have been made\n`;
  md += `- Prioritization is based on critical issues first, then ROI (impact/effort ratio)\n`;
  md += `- All effort estimates are conservative and should include code review time\n`;
  md += `- Execute critical refactors in dedicated sprints to prevent technical debt accumulation\n`;

  return md;
}

// Run if invoked directly
if (require.main === module) {
  runSRREAnalysis();
}
