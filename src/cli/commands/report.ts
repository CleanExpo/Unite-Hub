/**
 * synthex report Commands
 *
 * Comprehensive V3 audit reports combining all Phase 8 features
 */

import { Command } from 'commander';
import { logger } from '../utils/logger.js';
import { ComprehensiveReportService } from '../services/audit/comprehensive-report-service.js';

export function createReportCommand(): Command {
  const command = new Command('report');

  command.description('Comprehensive V3 audit reports (trust anchor, citation gaps, UCP, ghostwriter)');

  // synthex report generate --client "ANZ Professional Partner" --sector "Legal/Finance"
  command
    .command('generate')
    .description('Generate comprehensive V3 audit report')
    .requiredOption('--client <name>', 'Client name')
    .requiredOption('--sector <sector>', 'Business sector (e.g., Legal/Finance, Professional Services)')
    .option('--abn-nzbn <number>', 'ABN or NZBN (format: "12 345 678 901")')
    .option('--output <path>', 'Output file path (JSON)')
    .action(async (options) => {
      try {
        await generateReport(options);
      } catch (error) {
        await logger.error('Report generation failed');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex report list
  command
    .command('list')
    .description('List recent comprehensive reports')
    .option('--limit <number>', 'Number of reports to show', '10')
    .action(async (options) => {
      try {
        await listReports(options);
      } catch (error) {
        await logger.error('Failed to fetch reports');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex report view --report-id "report-123"
  command
    .command('view')
    .description('View a specific report')
    .requiredOption('--report-id <id>', 'Report ID')
    .action(async (options) => {
      try {
        await viewReport(options);
      } catch (error) {
        await logger.error('Failed to fetch report');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  return command;
}

async function generateReport(options: {
  client: string;
  sector: string;
  abnNzbn?: string;
  output?: string;
}): Promise<void> {
  await logger.header('Report: Comprehensive V3 Audit');
  await logger.divider();

  await logger.info(`Client: ${options.client}`);
  await logger.info(`Sector: ${options.sector}`);
  if (options.abnNzbn) {
    await logger.info(`ABN/NZBN: ${options.abnNzbn}`);
  }
  await logger.divider();

  const spinner = await logger.spinner('Generating comprehensive report...');

  try {
    const service = new ComprehensiveReportService();

    spinner.text = 'Fetching trust anchor data...';
    spinner.text = 'Analyzing citation gaps...';
    spinner.text = 'Checking UCP status...';
    spinner.text = 'Compiling report...';

    const report = await service.generateReport({
      clientName: options.client,
      sector: options.sector,
      abnNzbn: options.abnNzbn,
    });

    spinner.stop();

    await logger.success('Report generated!');
    await logger.divider();

    // Display report summary
    await logger.header('Report Summary');
    await logger.keyValue('Client', report.client.name);
    await logger.keyValue('Sector', report.client.sector);
    await logger.keyValue('Timestamp', new Date(report.timestamp).toLocaleString());

    await logger.divider();
    await logger.header('Trust Anchor');
    await logger.keyValue('ABN/NZBN', report.client.trust_anchor.abn_nzbn);
    await logger.keyValue(
      'Google Maps',
      report.client.trust_anchor.maps_verified ? '✓ Verified' : '✗ Not verified'
    );
    await logger.keyValue('E-E-A-T Score', `${report.client.trust_anchor.eeat_score}/100`);

    // Show E-E-A-T rating
    const eeatRating =
      report.client.trust_anchor.eeat_score >= 90
        ? 'Excellent'
        : report.client.trust_anchor.eeat_score >= 75
        ? 'Good'
        : report.client.trust_anchor.eeat_score >= 60
        ? 'Fair'
        : 'Needs Improvement';
    await logger.info(`   Rating: ${eeatRating}`);

    await logger.divider();
    await logger.header(`Citation Gap Analysis (${report.citation_gap_analysis.length} gaps)`);

    for (let i = 0; i < Math.min(3, report.citation_gap_analysis.length); i++) {
      const gap = report.citation_gap_analysis[i];
      const strengthIcon =
        gap.potential_citation_vector_strength === 'High'
          ? '🔴'
          : gap.potential_citation_vector_strength === 'Medium'
          ? '🟡'
          : '🟢';

      await logger.info(`${i + 1}. ${strengthIcon} ${gap.potential_citation_vector_strength} Priority`);
      await logger.info(`   Query: "${gap.query}"`);
      await logger.info(`   Current: ${gap.current_citation}`);
      await logger.info(`   Gap: ${gap.gap_reason}`);
      await logger.info(`   Action: ${gap.synthex_action}`);
      await logger.divider();
    }

    if (report.citation_gap_analysis.length > 3) {
      await logger.info(`... and ${report.citation_gap_analysis.length - 3} more gaps`);
      await logger.divider();
    }

    await logger.header('UCP Status');
    await logger.keyValue(
      'Direct Purchase',
      report.ucp_status.direct_purchase_enabled ? 'Enabled ✓' : 'Disabled'
    );
    await logger.keyValue('Shopify MCP', report.ucp_status.shopify_mcp_connection);
    await logger.keyValue('Active Offers', report.ucp_status.active_offers.length.toString());

    if (report.ucp_status.active_offers.length > 0) {
      await logger.divider();
      await logger.info('Sample Offers:');
      for (let i = 0; i < Math.min(3, report.ucp_status.active_offers.length); i++) {
        const offer = report.ucp_status.active_offers[i];
        await logger.info(
          `  ${i + 1}. ${offer.sku} - ${offer.offer_type} - $${offer.price_aud.toFixed(2)} AUD`
        );
      }
    }

    await logger.divider();
    await logger.header('Ghostwriter Constraints');
    await logger.keyValue('Voice', report.ghostwriter_constraints.voice);
    await logger.keyValue('Burstiness Target', report.ghostwriter_constraints.burstiness_target.toString());
    await logger.keyValue(
      'Forbidden Words',
      `${report.ghostwriter_constraints.forbidden_words.length} words`
    );
    await logger.info(`  (${report.ghostwriter_constraints.forbidden_words.slice(0, 5).join(', ')}...)`);

    // Export to file if specified
    if (options.output) {
      await logger.divider();
      const exportSpinner = await logger.spinner('Exporting report...');

      try {
        await service.exportReport(report, options.output);
        exportSpinner.stop();

        await logger.success(`Report exported: ${options.output}`);
      } catch (error) {
        exportSpinner.fail('Export failed');
        throw error;
      }
    }

    await logger.info('');
    await logger.success('Comprehensive V3 audit complete!');
    await logger.info('');
    await logger.example('Next steps:');
    await logger.example('  synthex ghost write --input <citation_gap_file>');
    await logger.example('  synthex deploy graph --target "Google_Search_AI_Mode"');
    await logger.example('  synthex social drip --network "LinkedIn_AU" --frequency "Daily_3"');
  } catch (error) {
    spinner.fail('Report generation failed');
    throw error;
  }
}

async function listReports(options: { limit?: string }): Promise<void> {
  await logger.header('Comprehensive Reports');
  await logger.divider();

  const spinner = await logger.spinner('Fetching reports...');

  try {
    const service = new ComprehensiveReportService();
    const limit = parseInt(options.limit || '10', 10);
    const reports = await service.listReports(limit);

    spinner.stop();

    if (reports.length === 0) {
      await logger.info('No reports found');
      await logger.info('');
      await logger.example('Generate a report:');
      await logger.example('  synthex report generate --client "ClientName" --sector "Legal/Finance"');
      return;
    }

    for (let i = 0; i < reports.length; i++) {
      const report = reports[i];
      const reportData = report.report_data;

      await logger.info(`${i + 1}. ${report.client_name} - ${report.sector}`);
      await logger.info(`   ID: ${report.id}`);
      await logger.info(`   E-E-A-T: ${reportData.client.trust_anchor.eeat_score}/100`);
      await logger.info(`   Citation Gaps: ${reportData.citation_gap_analysis.length}`);
      await logger.info(`   UCP Offers: ${reportData.ucp_status.active_offers.length}`);
      await logger.info(`   Created: ${new Date(report.created_at).toLocaleString()}`);
      await logger.divider();
    }

    await logger.info('');
    await logger.example('View a report:');
    await logger.example(`  synthex report view --report-id "${reports[0].id}"`);
  } catch (error) {
    spinner.fail('Failed to fetch reports');
    throw error;
  }
}

async function viewReport(options: { reportId: string }): Promise<void> {
  await logger.header('View Report');
  await logger.divider();

  await logger.info(`Report ID: ${options.reportId}`);
  await logger.divider();

  const spinner = await logger.spinner('Fetching report...');

  try {
    const service = new ComprehensiveReportService();

    // Query report from database
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const { data: report } = await supabase
      .from('comprehensive_reports')
      .select('*')
      .eq('id', options.reportId)
      .single();

    spinner.stop();

    if (!report) {
      await logger.error('Report not found');
      return;
    }

    const reportData = report.report_data;

    // Display full report
    await logger.header('Client Information');
    await logger.keyValue('Name', reportData.client.name);
    await logger.keyValue('Sector', reportData.client.sector);
    await logger.keyValue('ABN/NZBN', reportData.client.trust_anchor.abn_nzbn);
    await logger.keyValue(
      'Google Maps',
      reportData.client.trust_anchor.maps_verified ? '✓ Verified' : '✗ Not verified'
    );
    await logger.keyValue('E-E-A-T Score', `${reportData.client.trust_anchor.eeat_score}/100`);

    await logger.divider();
    await logger.header('Citation Gap Analysis');

    for (let i = 0; i < reportData.citation_gap_analysis.length; i++) {
      const gap = reportData.citation_gap_analysis[i];
      await logger.info(`${i + 1}. ${gap.query}`);
      await logger.info(`   Current: ${gap.current_citation}`);
      await logger.info(`   Gap: ${gap.gap_reason}`);
      await logger.info(`   Action: ${gap.synthex_action}`);
      await logger.info(`   Strength: ${gap.potential_citation_vector_strength}`);
      await logger.divider();
    }

    await logger.header('UCP Status');
    await logger.keyValue('Direct Purchase', reportData.ucp_status.direct_purchase_enabled ? 'Yes' : 'No');
    await logger.keyValue('Shopify MCP', reportData.ucp_status.shopify_mcp_connection);

    for (let i = 0; i < reportData.ucp_status.active_offers.length; i++) {
      const offer = reportData.ucp_status.active_offers[i];
      await logger.info(
        `  ${i + 1}. ${offer.sku} - ${offer.offer_type} - $${offer.price_aud.toFixed(2)} AUD`
      );
    }

    await logger.divider();
    await logger.header('Ghostwriter Constraints');
    await logger.keyValue('Voice', reportData.ghostwriter_constraints.voice);
    await logger.keyValue('Burstiness', reportData.ghostwriter_constraints.burstiness_target.toString());
    await logger.info(
      `Forbidden Words: ${reportData.ghostwriter_constraints.forbidden_words.join(', ')}`
    );

    await logger.info('');
  } catch (error) {
    spinner.fail('Failed to fetch report');
    throw error;
  }
}
