/**
 * synthex export Commands
 *
 * Export citation gap reports in various formats
 */

import { Command } from 'commander';
import { logger } from '../utils/logger.js';
import { AuditService } from '../services/seo-intelligence/audit-service.js';
import { ExportService, type ExportFormat } from '../services/seo-intelligence/export-service.js';
import { ConfigManager } from '../utils/config-manager.js';

export function createExportCommand(): Command {
  const command = new Command('export');

  command.description('Export citation gap reports');

  // synthex export gap-report --format json --output ./audits/report.json
  command
    .command('gap-report')
    .description('Export the most recent citation gap analysis')
    .requiredOption('--format <format>', 'Export format (json, csv, html, markdown)')
    .requiredOption('--output <path>', 'Output file path')
    .option('--audit-id <id>', 'Specific audit ID (default: most recent)')
    .option('--include-metadata', 'Include metadata in export')
    .option('--include-action-steps', 'Include actionable steps')
    .option('--prettify', 'Prettify JSON output')
    .action(async (options) => {
      try {
        await exportGapReport(options);
      } catch (error) {
        await logger.error('Export failed');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex export batch --format json --output-dir ./audits
  command
    .command('batch')
    .description('Export multiple audits')
    .requiredOption('--format <format>', 'Export format (json, csv, html, markdown)')
    .requiredOption('--output-dir <path>', 'Output directory')
    .option('--limit <number>', 'Number of audits to export', '5')
    .action(async (options) => {
      try {
        await exportBatch(options);
      } catch (error) {
        await logger.error('Batch export failed');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  return command;
}

async function exportGapReport(options: {
  format: string;
  output: string;
  auditId?: string;
  includeMetadata?: boolean;
  includeActionSteps?: boolean;
  prettify?: boolean;
}): Promise<void> {
  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized. Run: synthex init');
    process.exit(1);
  }

  await logger.header('Export: Citation Gap Report');
  await logger.divider();

  // Validate format
  const validFormats = ['json', 'csv', 'html', 'markdown'];
  if (!validFormats.includes(options.format)) {
    await logger.error(`Invalid format: ${options.format}`);
    await logger.info(`Valid formats: ${validFormats.join(', ')}`);
    process.exit(1);
  }

  const format = options.format as ExportFormat;

  await logger.info(`Format: ${format.toUpperCase()}`);
  await logger.info(`Output: ${options.output}`);
  await logger.divider();

  const spinner = await logger.spinner('Fetching audit data...');

  try {
    const auditService = new AuditService();
    const exportService = new ExportService();

    // Get the most recent audit (or specific audit by ID)
    const audits = await auditService.getRecentAudits(1);

    if (audits.length === 0) {
      spinner.fail('No audits found');
      await logger.error('No citation gap analysis found');
      await logger.info('Run: synthex audit citation-gap --client "YourDomain.com"');
      process.exit(1);
    }

    const audit = audits[0];
    const analysisData = audit.analysis_data;

    if (!analysisData) {
      spinner.fail('Invalid audit data');
      await logger.error('Audit data is incomplete');
      process.exit(1);
    }

    // Construct full analysis object
    const analysis = {
      clientDomain: audit.client_domain,
      competitors: analysisData.competitors || [],
      gaps: analysisData.gaps || [],
      opportunities: analysisData.opportunities || [],
      summary: analysisData.summary || {
        totalGaps: audit.total_gaps,
        highPriorityGaps: audit.high_priority_gaps,
        quickWinOpportunities: 0,
        opportunityScore: audit.opportunity_score,
        estimatedCatchUpTime: 'Unknown',
      },
      completedAt: audit.created_at,
    };

    spinner.text = `Generating ${format.toUpperCase()} report...`;

    const result = await exportService.exportGapReport(analysis, {
      format,
      outputPath: options.output,
      includeMetadata: options.includeMetadata,
      includeActionSteps: options.includeActionSteps,
      prettify: options.prettify,
    });

    spinner.stop();

    await logger.success('Export complete!');
    await logger.divider();

    await logger.keyValue('Output Path', result.outputPath);
    await logger.keyValue('Format', result.format.toUpperCase());
    await logger.keyValue('File Size', `${(result.fileSize / 1024).toFixed(2)} KB`);
    await logger.keyValue('Records Exported', result.recordsExported.toString());
    await logger.keyValue('Exported At', new Date(result.exportedAt).toLocaleString());

    await logger.info('');
    await logger.success(`Report saved successfully to: ${result.outputPath}`);
    await logger.info('');
    await logger.example('View the report:');
    if (format === 'html') {
      await logger.example(`  open ${result.outputPath}`);
    } else if (format === 'json') {
      await logger.example(`  cat ${result.outputPath} | jq`);
    } else if (format === 'markdown') {
      await logger.example(`  cat ${result.outputPath}`);
    } else {
      await logger.example(`  cat ${result.outputPath}`);
    }
  } catch (error) {
    spinner.fail('Export failed');
    throw error;
  }
}

async function exportBatch(options: {
  format: string;
  outputDir: string;
  limit?: string;
}): Promise<void> {
  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized');
    process.exit(1);
  }

  await logger.header('Export: Batch Export');
  await logger.divider();

  // Validate format
  const validFormats = ['json', 'csv', 'html', 'markdown'];
  if (!validFormats.includes(options.format)) {
    await logger.error(`Invalid format: ${options.format}`);
    await logger.info(`Valid formats: ${validFormats.join(', ')}`);
    process.exit(1);
  }

  const format = options.format as ExportFormat;
  const limit = parseInt(options.limit || '5', 10);

  await logger.info(`Format: ${format.toUpperCase()}`);
  await logger.info(`Output Directory: ${options.outputDir}`);
  await logger.info(`Limit: ${limit} audits`);
  await logger.divider();

  const spinner = await logger.spinner('Fetching audits...');

  try {
    const auditService = new AuditService();
    const exportService = new ExportService();

    const audits = await auditService.getRecentAudits(limit);

    if (audits.length === 0) {
      spinner.fail('No audits found');
      await logger.error('No citation gap analyses found');
      await logger.info('Run: synthex audit citation-gap --client "YourDomain.com"');
      process.exit(1);
    }

    spinner.text = `Exporting ${audits.length} audits...`;

    // Convert audits to analysis format
    const analyses = audits.map((audit) => ({
      clientDomain: audit.client_domain,
      competitors: audit.analysis_data?.competitors || [],
      gaps: audit.analysis_data?.gaps || [],
      opportunities: audit.analysis_data?.opportunities || [],
      summary: audit.analysis_data?.summary || {
        totalGaps: audit.total_gaps,
        highPriorityGaps: audit.high_priority_gaps,
        quickWinOpportunities: 0,
        opportunityScore: audit.opportunity_score,
        estimatedCatchUpTime: 'Unknown',
      },
      completedAt: audit.created_at,
    }));

    const results = await exportService.exportBatch(analyses, options.outputDir, format);

    spinner.stop();

    await logger.success('Batch export complete!');
    await logger.divider();

    await logger.keyValue('Total Audits Exported', results.length.toString());
    await logger.keyValue('Output Directory', options.outputDir);
    await logger.keyValue('Format', format.toUpperCase());

    const totalSize = results.reduce((sum, r) => sum + r.fileSize, 0);
    await logger.keyValue('Total Size', `${(totalSize / 1024).toFixed(2)} KB`);

    await logger.divider();
    await logger.header('Exported Files');

    for (const result of results) {
      const filename = result.outputPath.split(/[/\\]/).pop();
      await logger.info(`  ${filename} (${(result.fileSize / 1024).toFixed(2)} KB)`);
    }

    await logger.info('');
    await logger.success(`All reports saved to: ${options.outputDir}`);
  } catch (error) {
    spinner.fail('Batch export failed');
    throw error;
  }
}
