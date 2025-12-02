#!/usr/bin/env node

/**
 * Datadog APM Setup Script
 * Initializes Datadog integration with dashboards and alerts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { writeFile } from 'fs/promises';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function setupDatadog() {
  console.log('🐶 Datadog APM Setup\n');

  // Check environment variables
  const apiKey = process.env.DATADOG_API_KEY;
  const appKey = process.env.DATADOG_APP_KEY;

  if (!apiKey || !appKey) {
    console.error('❌ Error: DATADOG_API_KEY and DATADOG_APP_KEY must be set');
    console.error('\nAdd to .env.local:');
    console.error('DATADOG_API_KEY=your-api-key');
    console.error('DATADOG_APP_KEY=your-app-key');
    console.error('\nGet keys from: https://app.datadoghq.com/organization-settings/api-keys\n');
    process.exit(1);
  }

  console.log('✅ API keys found\n');

  // Import modules (using dynamic import for ESM)
  const { initializeDatadog } = await import('../src/lib/monitoring/datadog-client.ts');
  const { initializeDatadogAlerts } = await import('../src/lib/monitoring/datadog-alerts.ts');
  const { initializeDatadogDashboard } = await import('../src/lib/monitoring/datadog-dashboard-config.ts');

  try {
    // 1. Initialize client
    console.log('📊 Initializing Datadog client...');
    const client = initializeDatadog(apiKey, appKey, '1.0.0');
    console.log('✅ Client initialized\n');

    // 2. Create dashboards
    console.log('📈 Creating dashboards...');
    const dashboard = initializeDatadogDashboard(apiKey, appKey);

    // Health monitoring dashboard
    const healthResult = await dashboard.createHealthDashboard();
    if (healthResult.success) {
      console.log('✅ Health dashboard created');
      console.log(`   URL: ${healthResult.url}`);
    } else {
      console.error(`❌ Health dashboard failed: ${healthResult.error}`);
    }

    // Verification dashboard
    const verifyResult = await dashboard.createVerificationDashboard();
    if (verifyResult.success) {
      console.log('✅ Verification dashboard created');
      console.log(`   URL: ${verifyResult.url}`);
    } else {
      console.error(`❌ Verification dashboard failed: ${verifyResult.error}`);
    }

    console.log('');

    // 3. Create alerts
    console.log('🚨 Creating alert rules...');
    const alerts = initializeDatadogAlerts(apiKey, appKey, ['@slack-alerts']);

    // Health check alerts
    const healthAlertsResult = await alerts.createHealthCheckAlerts();
    if (healthAlertsResult.success) {
      console.log(`✅ Created ${healthAlertsResult.rules.length} health check alerts`);
      healthAlertsResult.rules.forEach((ruleId, i) => {
        console.log(`   ${i + 1}. Alert ID: ${ruleId}`);
      });
    } else {
      console.error('❌ Health alerts creation failed');
    }

    // Verification alerts
    const verifyAlertsResult = await alerts.createVerificationAlerts();
    if (verifyAlertsResult.success) {
      console.log(`✅ Created ${verifyAlertsResult.rules.length} verification alerts`);
    } else {
      console.error('❌ Verification alerts creation failed');
    }

    console.log('');

    // 4. Export dashboard configurations
    console.log('💾 Exporting dashboard configurations...');
    const healthConfig = dashboard.getHealthDashboardConfig();

    const dashboardsDir = resolve(process.cwd(), 'dashboards');
    await writeFile(
      resolve(dashboardsDir, 'datadog-health.json'),
      healthConfig,
      'utf-8'
    ).catch(() => {
      // Directory might not exist, create it
      import('fs').then(({ mkdirSync }) => {
        mkdirSync(dashboardsDir, { recursive: true });
        return writeFile(
          resolve(dashboardsDir, 'datadog-health.json'),
          healthConfig,
          'utf-8'
        );
      });
    });

    console.log('✅ Configurations exported to ./dashboards/');
    console.log('');

    // 5. Test metric submission
    console.log('🧪 Testing metric submission...');
    client.queueMetric('setup.test.metric', 1, ['source:setup-script'], 'count');
    await client.flushMetrics();
    console.log('✅ Test metric sent\n');

    // 6. Print next steps
    console.log('🎉 Datadog setup complete!\n');
    console.log('Next steps:');
    console.log('1. Visit Datadog dashboards to view metrics');
    console.log('2. Configure notification channels for alerts');
    console.log('3. Enable automatic health exports:');
    console.log('   curl "http://localhost:3008/api/health/deep?export=datadog"\n');
    console.log('4. Set up cron job for automated exports:');
    console.log('   */5 * * * * curl -s "https://your-app.com/api/health/deep?export=datadog"\n');

    // Shutdown client
    await client.shutdown();

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run setup
setupDatadog().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
