import { runSqlInventory } from './sql';
import { buildSqlDiffPlan } from './sql/sql-diff-plan';
import { runContextProfiler } from './context';
import { buildCCCScopeRecommendations } from './context/ccc-scope-recommender';

interface InfraGuardianReport {
  timestamp: string;
  phase: string;
  modules: Array<{
    name: string;
    status: 'success' | 'error';
    reportPath: string;
    message?: string;
  }>;
  summary: {
    sqlFilesFound: number;
    largestDirs: Array<{ path: string; sizeBytes: number }>;
    largestFiles: Array<{ path: string; sizeBytes: number }>;
  };
  notes: string[];
}

async function runInfraGuardian(): Promise<InfraGuardianReport> {
  const report: InfraGuardianReport = {
    timestamp: new Date().toISOString(),
    phase: 'Infra Guardian (Terminal Context + SQL Visibility)',
    modules: [],
    summary: {
      sqlFilesFound: 0,
      largestDirs: [],
      largestFiles: []
    },
    notes: [
      'Non-destructive infrastructure analysis',
      'No database modifications, no runtime code changes',
      'All outputs written to /reports directory',
      'Use these reports to plan cleanup and context optimization'
    ]
  };

  try {
    console.log('[shadow-observer] Starting Infra Guardian analysis...\n');

    // Step 1: SQL Inventory
    console.log('📋 [1/4] Scanning SQL migrations...');
    try {
      const sqlInventory = await runSqlInventory();
      report.modules.push({
        name: 'SQL Inventory',
        status: 'success',
        reportPath: 'reports/sql_migration_inventory.json'
      });
      report.summary.sqlFilesFound = sqlInventory.summary.count;
      console.log(`   ✓ Found ${sqlInventory.summary.count} migration files`);
    } catch (err) {
      report.modules.push({
        name: 'SQL Inventory',
        status: 'error',
        reportPath: 'reports/sql_migration_inventory.json',
        message: String(err)
      });
      console.error(`   ✗ SQL Inventory failed: ${err}`);
    }

    // Step 2: SQL Diff Plan
    console.log('📊 [2/4] Building SQL diff plan skeleton...');
    try {
      await buildSqlDiffPlan();
      report.modules.push({
        name: 'SQL Diff Plan',
        status: 'success',
        reportPath: 'reports/sql_diff_plan.json'
      });
      console.log('   ✓ SQL diff plan created (checklist for future work)');
    } catch (err) {
      report.modules.push({
        name: 'SQL Diff Plan',
        status: 'error',
        reportPath: 'reports/sql_diff_plan.json',
        message: String(err)
      });
      console.error(`   ✗ SQL Diff Plan failed: ${err}`);
    }

    // Step 3: Context Profiler
    console.log('🔍 [3/4] Profiling repository context...');
    try {
      const profile = await runContextProfiler('.');
      report.modules.push({
        name: 'Context Profiler',
        status: 'success',
        reportPath: 'reports/context_profile.json'
      });
      report.summary.largestDirs = profile.dirs.slice(0, 5);
      report.summary.largestFiles = profile.largeFiles.slice(0, 5);
      console.log(`   ✓ Profiled ${profile.dirs.length} directories`);
      console.log(`   ✓ Found ${profile.largeFiles.length} large files (>250KB)`);
    } catch (err) {
      report.modules.push({
        name: 'Context Profiler',
        status: 'error',
        reportPath: 'reports/context_profile.json',
        message: String(err)
      });
      console.error(`   ✗ Context Profiler failed: ${err}`);
    }

    // Step 4: CCC Scope Recommender
    console.log('🎯 [4/4] Generating CCC scope recommendations...');
    try {
      await buildCCCScopeRecommendations();
      report.modules.push({
        name: 'CCC Scope Recommender',
        status: 'success',
        reportPath: 'reports/ccc_scope_recommendations.json'
      });
      console.log('   ✓ CCC scope recommendations created');
    } catch (err) {
      report.modules.push({
        name: 'CCC Scope Recommender',
        status: 'error',
        reportPath: 'reports/ccc_scope_recommendations.json',
        message: String(err)
      });
      console.error(`   ✗ CCC Scope Recommender failed: ${err}`);
    }

    console.log('\n✅ Infra Guardian analysis complete!\n');
    console.log('📊 Reports generated:');
    report.modules.forEach((m) => {
      const icon = m.status === 'success' ? '✓' : '✗';
      console.log(`   ${icon} ${m.name} → ${m.reportPath}`);
    });

    return report;
  } catch (err) {
    console.error('Fatal error in Infra Guardian:', err);
    throw err;
  }
}

// Auto-run when imported as main module
runInfraGuardian().then((report) => {
  console.log('\n' + JSON.stringify(report, null, 2));
}).catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

export { runInfraGuardian };
