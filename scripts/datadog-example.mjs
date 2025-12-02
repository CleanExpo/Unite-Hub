#!/usr/bin/env node

/**
 * Datadog APM Usage Examples
 * Demonstrates common patterns for monitoring and alerting
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function runExamples() {
  console.log('🐶 Datadog APM Usage Examples\n');

  // Import modules
  const { initializeDatadog } = await import('../src/lib/monitoring/datadog-client.ts');
  const { default: HealthMetricsExporter } = await import('../src/lib/monitoring/health-metrics-exporter.ts');
  const { default: DatadogTrending } = await import('../src/lib/monitoring/datadog-trending.ts');
  const { default: SLAMonitor } = await import('../src/lib/monitoring/sla-monitor.ts');

  // Initialize client
  const client = initializeDatadog();
  console.log('✅ Client initialized\n');

  // Example 1: Send simple metrics
  console.log('📊 Example 1: Sending metrics');
  console.log('────────────────────────────');

  client.queueMetric('example.requests.total', 1, ['endpoint:/api/health'], 'count');
  client.queueMetric('example.latency.ms', 123, ['endpoint:/api/health'], 'gauge');
  client.queueMetric('example.error.rate', 0.5, ['severity:low'], 'gauge');

  console.log('✅ Queued 3 metrics');
  console.log('   Status:', client.getQueueStatus());
  console.log('');

  // Example 2: Export health metrics
  console.log('📊 Example 2: Exporting health snapshot');
  console.log('────────────────────────────────────────');

  const exporter = new HealthMetricsExporter(client);

  const healthSnapshot = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: {
        status: 'healthy',
        latency_ms: 45,
        timestamp: new Date().toISOString(),
      },
      cache: {
        status: 'healthy',
        latency_ms: 12,
        timestamp: new Date().toISOString(),
      },
      ai_services: {
        status: 'degraded',
        latency_ms: 234,
        error: 'Slow response',
        timestamp: new Date().toISOString(),
      },
      external_apis: {
        status: 'healthy',
        latency_ms: 67,
        timestamp: new Date().toISOString(),
      },
    },
  };

  await exporter.exportHealthMetrics(healthSnapshot);
  console.log('✅ Health metrics exported');
  console.log('   Queue:', client.getQueueStatus());
  console.log('');

  // Example 3: Export route health
  console.log('📊 Example 3: Exporting route health');
  console.log('──────────────────────────────────────');

  const routeSnapshot = {
    total_routes_in_system: 672,
    checked: 50,
    healthy: 48,
    unhealthy: 2,
    routes_sampled: [
      {
        route: '/api/health',
        method: 'GET',
        status: 'accessible',
        response_time_ms: 123,
      },
      {
        route: '/api/contacts',
        method: 'POST',
        status: 'accessible',
        response_time_ms: 456,
      },
      {
        route: '/api/campaigns/slow',
        method: 'GET',
        status: 'error',
        response_time_ms: 5000,
        error: 'Timeout',
      },
    ],
    timestamp: new Date().toISOString(),
  };

  await exporter.exportRouteHealth(routeSnapshot);
  console.log('✅ Route health exported');
  console.log('   Success rate:', ((48 / 50) * 100).toFixed(1), '%');
  console.log('');

  // Example 4: Trending analysis
  console.log('📈 Example 4: Analyzing trends');
  console.log('────────────────────────────────');

  const trending = new DatadogTrending(client);

  // Note: This will fail if metrics don't exist yet
  console.log('⚠️  Skipping trend analysis (requires historical data)');
  console.log('   Run after metrics have been collected for 24+ hours');
  console.log('');

  /*
  // Uncomment after 24 hours of data collection:
  const trend = await trending.calculateTrend('health.check.latency_ms', 7);
  console.log('   Trend direction:', trend.direction);
  console.log('   Change:', trend.change_percent.toFixed(1), '%');
  console.log('   Forecast:', trend.forecast.toFixed(2), 'ms');
  */

  // Example 5: SLA monitoring
  console.log('📋 Example 5: SLA monitoring');
  console.log('──────────────────────────────');

  const slaMonitor = new SLAMonitor(client);

  const definitions = slaMonitor.getSLADefinitions();
  console.log(`✅ ${definitions.length} default SLAs configured:`);

  definitions.forEach((sla, i) => {
    console.log(`   ${i + 1}. ${sla.name} (${sla.target_percentage}%)`);
  });
  console.log('');

  // Define custom SLA
  slaMonitor.defineSLA(
    'custom_api_latency',
    'API Latency P95 < 500ms',
    'example.latency.ms',
    95.0,
    168, // 7 days
    'latency_percentile',
    500,
    95
  );

  console.log('✅ Custom SLA defined');
  console.log('');

  // Example 6: Flush and view stats
  console.log('💾 Example 6: Flushing metrics');
  console.log('────────────────────────────────');

  console.log('Before flush:', client.getQueueStatus());
  await client.flushMetrics();
  console.log('After flush:', client.getQueueStatus());
  console.log('✅ All metrics sent to Datadog');
  console.log('');

  // Example 7: Create event
  console.log('📅 Example 7: Creating timeline event');
  console.log('───────────────────────────────────────');

  const eventResult = await client.createEvent(
    'Datadog Integration Example Completed',
    'Successfully ran all example scenarios',
    ['source:example-script', 'type:demo'],
    'low',
    'success'
  );

  if (eventResult.success) {
    console.log('✅ Event created in Datadog timeline');
  } else {
    console.error('❌ Event creation failed:', eventResult.error);
  }
  console.log('');

  // Cleanup
  console.log('🧹 Shutting down client...');
  await client.shutdown();
  console.log('✅ Clean shutdown complete\n');

  // Summary
  console.log('═══════════════════════════════════════════');
  console.log('✅ All examples completed successfully!');
  console.log('═══════════════════════════════════════════\n');

  console.log('📖 Next steps:');
  console.log('1. View metrics in Datadog Metrics Explorer');
  console.log('2. Check the Events timeline for the example event');
  console.log('3. Set up dashboards using setup-datadog.mjs');
  console.log('4. Configure alerts for your thresholds');
  console.log('5. Monitor SLA compliance over time\n');

  console.log('📚 Documentation:');
  console.log('   docs/DATADOG_APM_INTEGRATION.md\n');
}

// Run examples
runExamples().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
