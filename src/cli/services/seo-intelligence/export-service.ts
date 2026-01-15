/**
 * Export Service - Gap Report Generation & Export
 */

import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import type { CitationGapAnalysis, CitationGap, CitationOpportunity } from './audit-service.js';

export type ExportFormat = 'json' | 'csv' | 'html' | 'markdown';

export interface ExportOptions {
  format: ExportFormat;
  outputPath: string;
  includeMetadata?: boolean;
  includeActionSteps?: boolean;
  prettify?: boolean;
}

export interface ExportResult {
  success: boolean;
  outputPath: string;
  format: ExportFormat;
  fileSize: number;
  recordsExported: number;
  exportedAt: string;
}

export class ExportService {
  async exportGapReport(
    analysis: CitationGapAnalysis,
    options: ExportOptions
  ): Promise<ExportResult> {
    console.log(`[Export] Generating ${options.format.toUpperCase()} report...`);

    // Ensure output directory exists
    await this.ensureDirectory(options.outputPath);

    let content: string;
    let fileSize: number;

    switch (options.format) {
      case 'json':
        content = this.generateJSON(analysis, options);
        break;
      case 'csv':
        content = this.generateCSV(analysis, options);
        break;
      case 'html':
        content = this.generateHTML(analysis, options);
        break;
      case 'markdown':
        content = this.generateMarkdown(analysis, options);
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }

    // Write file
    await writeFile(options.outputPath, content, 'utf-8');
    fileSize = Buffer.byteLength(content, 'utf-8');

    console.log(`[Export] Report saved to ${options.outputPath} (${fileSize} bytes)`);

    return {
      success: true,
      outputPath: options.outputPath,
      format: options.format,
      fileSize,
      recordsExported: analysis.gaps.length,
      exportedAt: new Date().toISOString(),
    };
  }

  private async ensureDirectory(filePath: string): Promise<void> {
    const dir = dirname(filePath);
    await mkdir(dir, { recursive: true });
  }

  private generateJSON(analysis: CitationGapAnalysis, options: ExportOptions): string {
    const data = {
      exportedAt: new Date().toISOString(),
      analysis: {
        clientDomain: analysis.clientDomain,
        competitorsAnalyzed: analysis.competitors.length,
        summary: analysis.summary,
        competitors: analysis.competitors.map((c) => ({
          domain: c.domain,
          authority: c.authority,
          totalCitations: c.totalCitations,
          aiOverviewCitations: c.aiOverviewCitations,
          citationAdvantage: c.citationAdvantage,
        })),
        gaps: analysis.gaps.map((g) => this.formatGapForExport(g, options)),
        opportunities: analysis.opportunities.map((o) => this.formatOpportunityForExport(o, options)),
      },
    };

    return options.prettify
      ? JSON.stringify(data, null, 2)
      : JSON.stringify(data);
  }

  private generateCSV(analysis: CitationGapAnalysis, options: ExportOptions): string {
    const lines: string[] = [];

    // Header
    const headers = [
      'Gap ID',
      'Source URL',
      'Domain',
      'Authority',
      'Citation Type',
      'Priority',
      'Estimated Impact',
      'Present In Competitors',
      'Competitor Count',
    ];

    if (options.includeActionSteps) {
      headers.push('Action Steps');
    }

    lines.push(headers.join(','));

    // Data rows
    analysis.gaps.forEach((gap) => {
      const row = [
        gap.id,
        `"${gap.source.url}"`,
        gap.source.domain,
        gap.source.authority.toString(),
        gap.source.citationType,
        gap.priority,
        gap.estimatedImpact.toString(),
        `"${gap.presentInCompetitors.join(', ')}"`,
        gap.presentInCompetitors.length.toString(),
      ];

      if (options.includeActionSteps) {
        row.push(`"${gap.actionableSteps.join(' | ')}"`);
      }

      lines.push(row.join(','));
    });

    return lines.join('\n');
  }

  private generateHTML(analysis: CitationGapAnalysis, options: ExportOptions): string {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Citation Gap Analysis - ${analysis.clientDomain}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 40px;
        }
        h1 {
            color: #2c3e50;
            margin-bottom: 10px;
            font-size: 2em;
        }
        h2 {
            color: #34495e;
            margin-top: 30px;
            margin-bottom: 15px;
            font-size: 1.5em;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }
        h3 {
            color: #34495e;
            margin-top: 20px;
            margin-bottom: 10px;
            font-size: 1.2em;
        }
        .meta {
            color: #7f8c8d;
            margin-bottom: 30px;
            font-size: 0.9em;
        }
        .summary {
            background: #ecf0f1;
            padding: 20px;
            border-radius: 6px;
            margin-bottom: 30px;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        .summary-item {
            background: white;
            padding: 15px;
            border-radius: 4px;
        }
        .summary-item .label {
            font-size: 0.85em;
            color: #7f8c8d;
            margin-bottom: 5px;
        }
        .summary-item .value {
            font-size: 1.5em;
            font-weight: bold;
            color: #2c3e50;
        }
        .competitor {
            background: #f8f9fa;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 4px;
            border-left: 4px solid #3498db;
        }
        .competitor-header {
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 8px;
        }
        .competitor-stats {
            display: flex;
            gap: 20px;
            font-size: 0.9em;
            color: #555;
        }
        .gap {
            background: #fff;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 6px;
            border: 1px solid #ddd;
        }
        .gap-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        .gap-title {
            font-weight: bold;
            color: #2c3e50;
            font-size: 1.1em;
        }
        .priority {
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 0.85em;
            font-weight: bold;
            text-transform: uppercase;
        }
        .priority-high {
            background: #e74c3c;
            color: white;
        }
        .priority-medium {
            background: #f39c12;
            color: white;
        }
        .priority-low {
            background: #95a5a6;
            color: white;
        }
        .gap-details {
            display: grid;
            gap: 10px;
            margin-bottom: 15px;
            font-size: 0.9em;
        }
        .gap-detail {
            display: flex;
        }
        .gap-detail-label {
            font-weight: bold;
            min-width: 150px;
            color: #555;
        }
        .gap-detail-value {
            color: #333;
        }
        .action-steps {
            margin-top: 15px;
        }
        .action-steps h4 {
            color: #2c3e50;
            margin-bottom: 10px;
            font-size: 1em;
        }
        .action-steps ul {
            list-style-type: none;
            padding-left: 0;
        }
        .action-steps li {
            padding: 8px 12px;
            background: #f8f9fa;
            margin-bottom: 6px;
            border-radius: 4px;
            border-left: 3px solid #3498db;
        }
        .opportunity {
            background: #e8f5e9;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 4px;
            border-left: 4px solid #27ae60;
        }
        .opportunity-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .opportunity-type {
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 0.85em;
            font-weight: bold;
        }
        .type-quick_win {
            background: #27ae60;
            color: white;
        }
        .type-strategic {
            background: #2980b9;
            color: white;
        }
        .type-long_term {
            background: #8e44ad;
            color: white;
        }
        .opportunity-details {
            font-size: 0.9em;
            color: #555;
        }
        footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #7f8c8d;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Citation Gap Analysis Report</h1>
        <div class="meta">
            <div>Client Domain: <strong>${analysis.clientDomain}</strong></div>
            <div>Analysis Date: ${new Date(analysis.completedAt).toLocaleString()}</div>
            <div>Competitors Analyzed: ${analysis.competitors.length}</div>
        </div>

        <div class="summary">
            <h2>Executive Summary</h2>
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="label">Total Gaps</div>
                    <div class="value">${analysis.summary.totalGaps}</div>
                </div>
                <div class="summary-item">
                    <div class="label">High Priority</div>
                    <div class="value">${analysis.summary.highPriorityGaps}</div>
                </div>
                <div class="summary-item">
                    <div class="label">Quick Wins</div>
                    <div class="value">${analysis.summary.quickWinOpportunities}</div>
                </div>
                <div class="summary-item">
                    <div class="label">Opportunity Score</div>
                    <div class="value">${analysis.summary.opportunityScore}/100</div>
                </div>
                <div class="summary-item">
                    <div class="label">Est. Catch-Up Time</div>
                    <div class="value" style="font-size: 1.2em">${analysis.summary.estimatedCatchUpTime}</div>
                </div>
            </div>
        </div>

        <h2>Competitor Analysis</h2>
        ${analysis.competitors.map((comp) => `
            <div class="competitor">
                <div class="competitor-header">${comp.domain}</div>
                <div class="competitor-stats">
                    <span>Authority: ${comp.authority}</span>
                    <span>Citations: ${comp.totalCitations}</span>
                    <span>AI Overview: ${comp.aiOverviewCitations}</span>
                    <span>Advantage: ${comp.citationAdvantage}</span>
                </div>
            </div>
        `).join('')}

        <h2>Citation Gaps (${analysis.gaps.length})</h2>
        ${analysis.gaps.slice(0, 20).map((gap) => `
            <div class="gap">
                <div class="gap-header">
                    <div class="gap-title">${gap.source.domain}</div>
                    <span class="priority priority-${gap.priority}">${gap.priority}</span>
                </div>
                <div class="gap-details">
                    <div class="gap-detail">
                        <span class="gap-detail-label">URL:</span>
                        <span class="gap-detail-value"><a href="${gap.source.url}" target="_blank">${gap.source.url}</a></span>
                    </div>
                    <div class="gap-detail">
                        <span class="gap-detail-label">Authority:</span>
                        <span class="gap-detail-value">${gap.source.authority}</span>
                    </div>
                    <div class="gap-detail">
                        <span class="gap-detail-label">Citation Type:</span>
                        <span class="gap-detail-value">${gap.source.citationType}</span>
                    </div>
                    <div class="gap-detail">
                        <span class="gap-detail-label">Estimated Impact:</span>
                        <span class="gap-detail-value">${gap.estimatedImpact}%</span>
                    </div>
                    <div class="gap-detail">
                        <span class="gap-detail-label">Present In:</span>
                        <span class="gap-detail-value">${gap.presentInCompetitors.join(', ')}</span>
                    </div>
                </div>
                ${options.includeActionSteps ? `
                    <div class="action-steps">
                        <h4>Actionable Steps:</h4>
                        <ul>
                            ${gap.actionableSteps.map((step) => `<li>${step}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `).join('')}

        <h2>Top Opportunities (${analysis.opportunities.length})</h2>
        ${analysis.opportunities.slice(0, 10).map((opp) => `
            <div class="opportunity">
                <div class="opportunity-header">
                    <div>${opp.recommendedAction}</div>
                    <span class="opportunity-type type-${opp.type}">${opp.type.replace('_', ' ')}</span>
                </div>
                <div class="opportunity-details">
                    <div>Difficulty: ${opp.difficulty} | Timeframe: ${opp.estimatedTimeframe} | Impact: ${opp.potentialImpact}%</div>
                </div>
            </div>
        `).join('')}

        <footer>
            <p>Generated by Synthex Citation Intelligence System</p>
            <p>Report Date: ${new Date().toLocaleString()}</p>
        </footer>
    </div>
</body>
</html>
`;

    return html.trim();
  }

  private generateMarkdown(analysis: CitationGapAnalysis, options: ExportOptions): string {
    const lines: string[] = [];

    lines.push(`# Citation Gap Analysis Report`);
    lines.push('');
    lines.push(`**Client Domain:** ${analysis.clientDomain}`);
    lines.push(`**Analysis Date:** ${new Date(analysis.completedAt).toLocaleString()}`);
    lines.push(`**Competitors Analyzed:** ${analysis.competitors.length}`);
    lines.push('');

    lines.push(`## Executive Summary`);
    lines.push('');
    lines.push(`- **Total Gaps:** ${analysis.summary.totalGaps}`);
    lines.push(`- **High Priority Gaps:** ${analysis.summary.highPriorityGaps}`);
    lines.push(`- **Quick Win Opportunities:** ${analysis.summary.quickWinOpportunities}`);
    lines.push(`- **Opportunity Score:** ${analysis.summary.opportunityScore}/100`);
    lines.push(`- **Estimated Catch-Up Time:** ${analysis.summary.estimatedCatchUpTime}`);
    lines.push('');

    lines.push(`## Competitor Analysis`);
    lines.push('');
    analysis.competitors.forEach((comp) => {
      lines.push(`### ${comp.domain}`);
      lines.push(`- Authority: ${comp.authority}`);
      lines.push(`- Total Citations: ${comp.totalCitations}`);
      lines.push(`- AI Overview Citations: ${comp.aiOverviewCitations}`);
      lines.push(`- Citation Advantage: ${comp.citationAdvantage}`);
      lines.push('');
    });

    lines.push(`## Citation Gaps (${analysis.gaps.length} total)`);
    lines.push('');
    analysis.gaps.slice(0, 20).forEach((gap, idx) => {
      lines.push(`### ${idx + 1}. ${gap.source.domain} [${gap.priority.toUpperCase()}]`);
      lines.push('');
      lines.push(`- **URL:** ${gap.source.url}`);
      lines.push(`- **Authority:** ${gap.source.authority}`);
      lines.push(`- **Citation Type:** ${gap.source.citationType}`);
      lines.push(`- **Estimated Impact:** ${gap.estimatedImpact}%`);
      lines.push(`- **Present In Competitors:** ${gap.presentInCompetitors.join(', ')}`);
      lines.push('');

      if (options.includeActionSteps && gap.actionableSteps.length > 0) {
        lines.push(`**Actionable Steps:**`);
        gap.actionableSteps.forEach((step) => {
          lines.push(`- ${step}`);
        });
        lines.push('');
      }
    });

    lines.push(`## Top Opportunities (${analysis.opportunities.length} total)`);
    lines.push('');
    analysis.opportunities.slice(0, 10).forEach((opp, idx) => {
      lines.push(`### ${idx + 1}. ${opp.type.replace('_', ' ').toUpperCase()}`);
      lines.push('');
      lines.push(`**Recommendation:** ${opp.recommendedAction}`);
      lines.push('');
      lines.push(`- **Difficulty:** ${opp.difficulty}`);
      lines.push(`- **Timeframe:** ${opp.estimatedTimeframe}`);
      lines.push(`- **Potential Impact:** ${opp.potentialImpact}%`);
      lines.push('');
    });

    lines.push('---');
    lines.push(`*Generated by Synthex Citation Intelligence System*`);
    lines.push(`*Report Date: ${new Date().toLocaleString()}*`);

    return lines.join('\n');
  }

  private formatGapForExport(gap: CitationGap, options: ExportOptions): any {
    const formatted: any = {
      id: gap.id,
      priority: gap.priority,
      estimatedImpact: gap.estimatedImpact,
      missingFromClient: gap.missingFromClient,
      presentInCompetitors: gap.presentInCompetitors,
      source: {
        url: gap.source.url,
        domain: gap.source.domain,
        authority: gap.source.authority,
        citationType: gap.source.citationType,
      },
    };

    if (options.includeActionSteps) {
      formatted.actionableSteps = gap.actionableSteps;
    }

    if (options.includeMetadata) {
      formatted.source.metadata = gap.source.metadata;
    }

    return formatted;
  }

  private formatOpportunityForExport(opp: CitationOpportunity, options: ExportOptions): any {
    return {
      id: opp.id,
      type: opp.type,
      recommendedAction: opp.recommendedAction,
      difficulty: opp.difficulty,
      estimatedTimeframe: opp.estimatedTimeframe,
      potentialImpact: opp.potentialImpact,
      gapId: opp.gap.id,
    };
  }

  async exportBatch(
    analyses: CitationGapAnalysis[],
    outputDir: string,
    format: ExportFormat
  ): Promise<ExportResult[]> {
    const results: ExportResult[] = [];

    for (const analysis of analyses) {
      const timestamp = new Date(analysis.completedAt).toISOString().replace(/[:.]/g, '-');
      const filename = `citation-gap-${analysis.clientDomain}-${timestamp}.${format}`;
      const outputPath = join(outputDir, filename);

      const result = await this.exportGapReport(analysis, {
        format,
        outputPath,
        includeMetadata: true,
        includeActionSteps: true,
        prettify: true,
      });

      results.push(result);
    }

    return results;
  }
}
