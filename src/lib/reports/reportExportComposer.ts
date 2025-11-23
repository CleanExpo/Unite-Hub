/**
 * Report Export Composer
 * Phase 76: Transform composed reports into HTML and Markdown
 */

import {
  ComposedReport,
  ReportSection,
  ReportBlock,
} from './reportCompositionEngine';
import {
  LayoutVariant,
  LAYOUT_CONFIGS,
  applyLayout,
  buildCoverContent,
  buildTableOfContents,
  buildFooterContent,
} from './reportLayoutTemplates';

export interface ExportedReport {
  format: 'json' | 'html' | 'markdown';
  content: string;
  filename_suggestion: string;
  meta: {
    report_id: string;
    report_type: string;
    layout: LayoutVariant;
    sections_count: number;
    completeness: number;
  };
}

/**
 * Export report to structured JSON
 */
export function exportReportToJSON(
  report: ComposedReport,
  layout: LayoutVariant = 'standard_agency_report'
): ExportedReport {
  const layoutReport = applyLayout(report, layout);

  return {
    format: 'json',
    content: JSON.stringify(layoutReport, null, 2),
    filename_suggestion: `report_${report.report_type}_${Date.now()}.json`,
    meta: {
      report_id: report.report_id,
      report_type: report.report_type,
      layout,
      sections_count: layoutReport.sections.length,
      completeness: report.data_completeness,
    },
  };
}

/**
 * Export report to HTML
 */
export function exportReportToHTML(
  report: ComposedReport,
  layout: LayoutVariant = 'standard_agency_report'
): ExportedReport {
  const config = LAYOUT_CONFIGS[layout];
  const layoutReport = applyLayout(report, layout);

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${report.title} - ${report.client_name}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #333; line-height: 1.6; }
    .cover { text-align: center; padding: 60px 0; border-bottom: 2px solid #eee; margin-bottom: 40px; }
    .cover h1 { font-size: 2.5em; margin: 0 0 10px 0; }
    .cover .subtitle { color: #666; font-size: 1.2em; }
    .cover .meta { margin-top: 20px; color: #999; font-size: 0.9em; }
    .toc { padding: 20px; background: #f8f8f8; border-radius: 8px; margin-bottom: 40px; }
    .toc h2 { margin: 0 0 15px 0; font-size: 1.2em; }
    .toc ul { margin: 0; padding-left: 20px; }
    .toc li { margin: 5px 0; }
    .section { margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1px solid #eee; }
    .section h2 { color: #222; font-size: 1.5em; margin: 0 0 5px 0; }
    .section .description { color: #666; font-size: 0.9em; margin-bottom: 15px; }
    .section .status { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.75em; text-transform: uppercase; }
    .status-complete { background: #e8f5e9; color: #2e7d32; }
    .status-partial { background: #fff8e1; color: #f9a825; }
    .status-limited { background: #fff3e0; color: #ef6c00; }
    .block { margin: 15px 0; }
    .block-metric { background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; }
    .block-metric .value { font-size: 2em; font-weight: bold; color: #333; }
    .block-metric .label { color: #666; font-size: 0.9em; }
    .block-list { padding-left: 20px; }
    .block-list li { margin: 5px 0; }
    .block-table { width: 100%; border-collapse: collapse; }
    .block-table th, .block-table td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; }
    .block-table th { background: #f5f5f5; font-weight: 600; }
    .block-callout { padding: 15px; border-radius: 8px; margin: 15px 0; }
    .callout-info { background: #e3f2fd; border-left: 4px solid #2196f3; }
    .callout-warning { background: #fff8e1; border-left: 4px solid #ff9800; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #eee; font-size: 0.85em; color: #666; }
    .footer p { margin: 5px 0; }
  </style>
</head>
<body>
`;

  // Cover
  if (config.show_cover) {
    const cover = buildCoverContent(report);
    html += `
  <div class="cover">
    <h1>${cover.title}</h1>
    <div class="subtitle">${cover.subtitle}</div>
    <div class="meta">
      <div>${cover.timeframe}</div>
      <div>Generated: ${cover.generated_date}</div>
    </div>
  </div>
`;
  }

  // Table of contents
  if (config.show_table_of_contents) {
    const toc = buildTableOfContents(layoutReport);
    html += `
  <div class="toc">
    <h2>Contents</h2>
    <ul>
`;
    for (const item of toc) {
      html += `      <li><a href="#${item.section_id}">${config.show_section_numbers ? `${item.number}. ` : ''}${item.title}</a></li>\n`;
    }
    html += `    </ul>
  </div>
`;
  }

  // Sections
  for (let i = 0; i < layoutReport.sections.length; i++) {
    const section = layoutReport.sections[i];
    const number = config.show_section_numbers ? `${i + 1}. ` : '';
    const statusClass = `status-${section.data_status}`;

    html += `
  <div class="section" id="${section.section_id}">
    <h2>${number}${section.title}</h2>
    <div class="description">${section.description}</div>
    <span class="status ${statusClass}">${section.data_status}</span>
`;

    // Render blocks
    for (const block of section.blocks) {
      html += renderBlockToHTML(block);
    }

    html += `  </div>
`;
  }

  // Footer
  if (config.show_footer) {
    const footer = buildFooterContent(report);
    html += `
  <div class="footer">
    <p>${footer.data_notice}</p>
    <p>${footer.timeframe_notice}</p>
`;
    if (footer.omitted_notice) {
      html += `    <p>${footer.omitted_notice}</p>\n`;
    }
    html += `    <p>${footer.generated_notice}</p>
  </div>
`;
  }

  html += `</body>
</html>`;

  return {
    format: 'html',
    content: html,
    filename_suggestion: `report_${report.report_type}_${Date.now()}.html`,
    meta: {
      report_id: report.report_id,
      report_type: report.report_type,
      layout,
      sections_count: layoutReport.sections.length,
      completeness: report.data_completeness,
    },
  };
}

/**
 * Render a single block to HTML
 */
function renderBlockToHTML(block: ReportBlock): string {
  switch (block.type) {
    case 'text': {
      const content = block.content as { text: string };
      return `    <div class="block"><p>${content.text}</p></div>\n`;
    }

    case 'metric': {
      const content = block.content as { label: string; value: number; suffix?: string };
      return `
    <div class="block block-metric">
      <div class="value">${content.value}${content.suffix || ''}</div>
      <div class="label">${content.label}</div>
    </div>
`;
    }

    case 'list': {
      const content = block.content as { items: string[]; ordered?: boolean; title?: string };
      const tag = content.ordered ? 'ol' : 'ul';
      let html = content.title ? `    <div class="block"><strong>${content.title}</strong>` : '    <div class="block">';
      html += `<${tag} class="block-list">\n`;
      for (const item of content.items) {
        html += `      <li>${item}</li>\n`;
      }
      html += `    </${tag}></div>\n`;
      return html;
    }

    case 'table': {
      const content = block.content as { headers: string[]; rows: string[][] };
      let html = `    <table class="block-table">\n      <thead><tr>\n`;
      for (const header of content.headers) {
        html += `        <th>${header}</th>\n`;
      }
      html += `      </tr></thead>\n      <tbody>\n`;
      for (const row of content.rows) {
        html += `      <tr>\n`;
        for (const cell of row) {
          html += `        <td>${cell}</td>\n`;
        }
        html += `      </tr>\n`;
      }
      html += `      </tbody>\n    </table>\n`;
      return html;
    }

    case 'callout': {
      const content = block.content as { variant?: string; title?: string; message: string };
      const variant = content.variant || 'info';
      let html = `    <div class="block block-callout callout-${variant}">\n`;
      if (content.title) {
        html += `      <strong>${content.title}</strong><br>\n`;
      }
      html += `      ${content.message}\n    </div>\n`;
      return html;
    }

    default:
      return '';
  }
}

/**
 * Export report to Markdown
 */
export function exportReportToMarkdown(
  report: ComposedReport,
  layout: LayoutVariant = 'standard_agency_report'
): ExportedReport {
  const config = LAYOUT_CONFIGS[layout];
  const layoutReport = applyLayout(report, layout);

  let md = '';

  // Cover
  if (config.show_cover) {
    const cover = buildCoverContent(report);
    md += `# ${cover.title}\n\n`;
    md += `*${cover.subtitle}*\n\n`;
    md += `**Timeframe:** ${cover.timeframe}  \n`;
    md += `**Generated:** ${cover.generated_date}\n\n`;
    md += `---\n\n`;
  }

  // Table of contents
  if (config.show_table_of_contents) {
    const toc = buildTableOfContents(layoutReport);
    md += `## Contents\n\n`;
    for (const item of toc) {
      md += `${config.show_section_numbers ? `${item.number}. ` : '- '}[${item.title}](#${item.section_id.replace(/_/g, '-')})\n`;
    }
    md += `\n---\n\n`;
  }

  // Sections
  for (let i = 0; i < layoutReport.sections.length; i++) {
    const section = layoutReport.sections[i];
    const number = config.show_section_numbers ? `${i + 1}. ` : '';

    md += `## ${number}${section.title}\n\n`;
    md += `*${section.description}*\n\n`;
    md += `**Data Status:** ${section.data_status}\n\n`;

    // Render blocks
    for (const block of section.blocks) {
      md += renderBlockToMarkdown(block);
    }

    md += `---\n\n`;
  }

  // Footer
  if (config.show_footer) {
    const footer = buildFooterContent(report);
    md += `## Report Notes\n\n`;
    md += `${footer.data_notice}\n\n`;
    md += `${footer.timeframe_notice}\n\n`;
    if (footer.omitted_notice) {
      md += `${footer.omitted_notice}\n\n`;
    }
    md += `*${footer.generated_notice}*\n`;
  }

  return {
    format: 'markdown',
    content: md,
    filename_suggestion: `report_${report.report_type}_${Date.now()}.md`,
    meta: {
      report_id: report.report_id,
      report_type: report.report_type,
      layout,
      sections_count: layoutReport.sections.length,
      completeness: report.data_completeness,
    },
  };
}

/**
 * Render a single block to Markdown
 */
function renderBlockToMarkdown(block: ReportBlock): string {
  switch (block.type) {
    case 'text': {
      const content = block.content as { text: string };
      return `${content.text}\n\n`;
    }

    case 'metric': {
      const content = block.content as { label: string; value: number; suffix?: string };
      return `**${content.label}:** ${content.value}${content.suffix || ''}\n\n`;
    }

    case 'list': {
      const content = block.content as { items: string[]; ordered?: boolean; title?: string };
      let md = content.title ? `**${content.title}**\n\n` : '';
      for (let i = 0; i < content.items.length; i++) {
        const prefix = content.ordered ? `${i + 1}.` : '-';
        md += `${prefix} ${content.items[i]}\n`;
      }
      return md + '\n';
    }

    case 'table': {
      const content = block.content as { headers: string[]; rows: string[][] };
      let md = '| ' + content.headers.join(' | ') + ' |\n';
      md += '| ' + content.headers.map(() => '---').join(' | ') + ' |\n';
      for (const row of content.rows) {
        md += '| ' + row.join(' | ') + ' |\n';
      }
      return md + '\n';
    }

    case 'callout': {
      const content = block.content as { variant?: string; title?: string; message: string };
      let md = '> ';
      if (content.title) {
        md += `**${content.title}**  \n> `;
      }
      md += `${content.message}\n\n`;
      return md;
    }

    default:
      return '';
  }
}

export default {
  exportReportToJSON,
  exportReportToHTML,
  exportReportToMarkdown,
};
