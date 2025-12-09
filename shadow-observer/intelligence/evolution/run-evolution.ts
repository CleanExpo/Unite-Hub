/**
 * ASEE Runner - Autonomous Skill Evolution Engine
 */

import fs from 'fs';
import path from 'path';
import { runSkillEvolutionAnalysis } from './skill-evolution-engine';

export async function runASEE(): Promise<void> {
  console.log('[ASEE Runner] Analyzing autonomous skill evolution...\n');

  try {
    // Ensure directories exist
    if (!fs.existsSync('reports')) {
      fs.mkdirSync('reports', { recursive: true });
    }
    if (!fs.existsSync('blueprints/skills')) {
      fs.mkdirSync('blueprints/skills', { recursive: true });
    }

    // Run evolution analysis
    const report = await runSkillEvolutionAnalysis();

    // Save report
    const reportPath = path.join(
      'reports',
      `skill_evolution_plan_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    );
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Display summary
    console.log('\n' + '='.repeat(70));
    console.log('🔄 AUTONOMOUS SKILL EVOLUTION REPORT');
    console.log('='.repeat(70));

    console.log('\nEvolution Plans:');
    console.log(`  Refine: ${report.refineSkills.length} skills`);
    console.log(`  Split: ${report.splitSkills.length} skills`);
    console.log(`  Merge: ${report.mergeSkills.length} skills`);
    console.log(`  Deprecate: ${report.deprecateSkills.length} skills`);

    console.log('\nNew Skill Opportunities:');
    console.log(`  Total: ${report.newSkillOpportunities.length}`);
    const nextSprint = report.newSkillOpportunities.filter(o => o.timelinePriority === 'next_sprint');
    console.log(`  Next Sprint: ${nextSprint.length}`);

    console.log('\nBlueprint Drafts Generated:');
    console.log(`  Total: ${report.blueprintDrafts.length}`);
    report.blueprintDrafts.forEach(b => {
      console.log(`  - ${b.name} (${b.path})`);
    });

    console.log('\nInsights:');
    report.insights.forEach(i => console.log(`  • ${i}`));

    console.log('\nRecommendations:');
    report.recommendations.forEach(r => console.log(`  → ${r}`));

    if (report.evolutionPlans.length > 0) {
      console.log('\nTop Evolution Plans:');
      report.evolutionPlans.slice(0, 5).forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.skill} (${p.action.toUpperCase()})`);
        console.log(`     Priority: ${p.priority} | Effort: ${p.effort}`);
      });
    }

    console.log(`\n📄 Report saved: ${reportPath}`);
    console.log(`📁 Blueprints saved to: blueprints/skills/`);
    console.log('='.repeat(70));

    process.exit(0);
  } catch (error) {
    console.error('[ASEE] Fatal error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runASEE();
}
