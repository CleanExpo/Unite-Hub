/**
 * MARO Runner - Multi-Agent Routing Optimizer
 */

import fs from 'fs';
import path from 'path';
import { generateRoutingRecommendations } from './agent-routing-optimizer';

export async function runMAR(): Promise<void> {
  console.log('[MARO Runner] Generating agent routing recommendations...\n');

  try {
    // Ensure reports directory exists
    if (!fs.existsSync('reports')) {
      fs.mkdirSync('reports', { recursive: true });
    }

    // Generate recommendations
    const report = await generateRoutingRecommendations();

    // Save report
    const reportPath = path.join(
      'reports',
      `agent_routing_recommendations_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    );
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Display summary
    console.log('\n' + '='.repeat(70));
    console.log('🔀 AGENT ROUTING OPTIMIZATION REPORT');
    console.log('='.repeat(70));

    console.log('\nTask Pattern Coverage:');
    console.log(`  Total Patterns: ${report.taskPatternsCovered}`);
    console.log(`  Routing Rules: ${report.routingRecommendations.length}`);

    console.log('\nAgent Load Distribution:');
    Object.entries(report.routingAccuracy.byAgent).forEach(([agent, percentage]) => {
      console.log(`  ${agent}: ${percentage}% of tasks`);
    });

    console.log('\nRoutingHooks Active:');
    const critical = report.routingHooks.filter(h => h.priority === 'critical');
    const high = report.routingHooks.filter(h => h.priority === 'high');
    console.log(`  Critical: ${critical.length}`);
    console.log(`  High: ${high.length}`);
    console.log(`  Medium: ${report.routingHooks.length - critical.length - high.length}`);

    console.log('\nApproval Requirements:');
    const approvals = report.routingRecommendations.filter(r => r.requiresApproval);
    console.log(`  Task Types Requiring Approval: ${approvals.length}`);

    console.log('\nInsights:');
    report.insights.forEach(i => console.log(`  • ${i}`));

    console.log('\nRecommendations:');
    report.recommendations.forEach(r => console.log(`  → ${r}`));

    console.log(`\n📄 Report saved: ${reportPath}`);
    console.log('='.repeat(70));

    process.exit(0);
  } catch (error) {
    console.error('[MARO] Fatal error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runMAR();
}
