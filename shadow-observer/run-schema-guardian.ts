import { liveSchemaSnapshot } from './schema-guardian/liveSchemaSnapshot';
import { schemaDriftAnalyzer } from './schema-guardian/schemaDriftAnalyzer';
import { schemaHealthScan } from './schema-guardian/schemaHealthScan';

interface SchemaGuardianReport {
  timestamp: string;
  phase: string;
  modules: Array<{
    name: string;
    status: 'success' | 'error';
    reportPath: string;
    message?: string;
  }>;
  summary: {
    snapshotStatus: string;
    driftCount: number;
    healthScore: number;
  };
  notes: string[];
}

async function runSchemaGuardian(): Promise<SchemaGuardianReport> {
  const report: SchemaGuardianReport = {
    timestamp: new Date().toISOString(),
    phase: 'Schema Guardian (Live Schema + Drift Analysis + Health)',
    modules: [],
    summary: {
      snapshotStatus: 'unknown',
      driftCount: 0,
      healthScore: 0
    },
    notes: [
      'Non-destructive schema analysis',
      'Compares live Supabase schema vs. migration history',
      'Detects drift, identifies health issues',
      'All outputs written to /reports directory'
    ]
  };

  try {
    console.log('[shadow-observer] Starting Schema Guardian analysis...\n');

    // Step 1: Live Schema Snapshot
    console.log('📸 [1/3] Capturing live schema snapshot...');
    let snapshotResult;
    try {
      snapshotResult = await liveSchemaSnapshot();
      report.modules.push({
        name: 'Live Schema Snapshot',
        status: 'success',
        reportPath: 'reports/live_schema_snapshot.sql'
      });
      report.summary.snapshotStatus = snapshotResult.status;
      console.log(`   ✓ Schema snapshot: ${snapshotResult.message}`);
      if (snapshotResult.schemaSize) {
        console.log(`   ✓ Schema size: ${snapshotResult.schemaSize} bytes`);
      }
    } catch (err) {
      report.modules.push({
        name: 'Live Schema Snapshot',
        status: 'error',
        reportPath: 'reports/live_schema_snapshot.sql',
        message: String(err)
      });
      console.error(`   ✗ Snapshot failed: ${err}`);
    }

    // Step 2: Schema Drift Analysis
    console.log('🔄 [2/3] Analyzing schema drift...');
    try {
      const driftReport = await schemaDriftAnalyzer();
      report.modules.push({
        name: 'Schema Drift Analyzer',
        status: 'success',
        reportPath: 'reports/schema_drift_report.json'
      });
      report.summary.driftCount = driftReport.summary.totalDrifts;
      console.log(`   ✓ Drift analysis complete (${driftReport.summary.totalDrifts} drifts found)`);
    } catch (err) {
      report.modules.push({
        name: 'Schema Drift Analyzer',
        status: 'error',
        reportPath: 'reports/schema_drift_report.json',
        message: String(err)
      });
      console.error(`   ✗ Drift analysis failed: ${err}`);
    }

    // Step 3: Schema Health Scan
    console.log('💊 [3/3] Running schema health scan...');
    try {
      const healthReport = await schemaHealthScan();
      report.modules.push({
        name: 'Schema Health Scan',
        status: 'success',
        reportPath: 'reports/schema_health_report.json'
      });
      report.summary.healthScore = healthReport.summary.overallScore;
      console.log(`   ✓ Health scan complete (score: ${healthReport.summary.overallScore}/100)`);
    } catch (err) {
      report.modules.push({
        name: 'Schema Health Scan',
        status: 'error',
        reportPath: 'reports/schema_health_report.json',
        message: String(err)
      });
      console.error(`   ✗ Health scan failed: ${err}`);
    }

    console.log('\n✅ Schema Guardian analysis complete!\n');
    console.log('📊 Reports generated:');
    report.modules.forEach((m) => {
      const icon = m.status === 'success' ? '✓' : '✗';
      console.log(`   ${icon} ${m.name} → ${m.reportPath}`);
    });

    return report;
  } catch (err) {
    console.error('Fatal error in Schema Guardian:', err);
    throw err;
  }
}

// Auto-run when imported as main module
runSchemaGuardian()
  .then((report) => {
    console.log('\n' + JSON.stringify(report, null, 2));
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });

export { runSchemaGuardian };
