/**
 * Report Render Engine
 * Phase 77: Orchestrates report rendering for PDF and slide exports
 */

import { ComposedReport, ReportSection } from './reportCompositionEngine';
import {
  exportReportToHTML,
  exportReportToMarkdown,
  exportReportToJSON,
  ExportedReport,
} from './reportExportComposer';
import { LayoutVariant } from './reportLayoutTemplates';

/**
 * Unified renderable report structure for adapters
 */
export interface RenderableReport {
  meta: {
    report_id: string;
    report_type: string;
    title: string;
    subtitle: string;
    client_id: string;
    client_name: string;
    workspace_id: string;
    timeframe: {
      start: string;
      end: string;
      label: string;
    };
    generated_at: string;
    data_completeness: number;
    total_sections: number;
    complete_sections: number;
    partial_sections: number;
    omitted_sections: string[];
    data_sources_used: string[];
  };
  sections: ReportSection[];
  html: string;
  markdown: string;
  json: string;
  layout: LayoutVariant;
}

/**
 * PDF payload structure for adapter
 */
export interface PdfPayload {
  meta: RenderableReport['meta'];
  cover: {
    title: string;
    subtitle: string;
    client_name: string;
    timeframe_label: string;
    generated_date: string;
  };
  toc: Array<{
    section_number: number;
    title: string;
    data_status: string;
  }>;
  pages: Array<{
    page_type: 'cover' | 'toc' | 'section' | 'appendix';
    content: string; // HTML content for the page
    section_title?: string;
    section_number?: number;
  }>;
  footer: {
    truth_notice: string;
    completeness_note: string;
  };
}

/**
 * Slide frame structure for presentations
 */
export interface SlideFrame {
  frame_id: string;
  frame_type: 'title' | 'summary' | 'section' | 'metrics' | 'closing';
  title: string;
  subtitle?: string;
  body_html: string;
  notes: string;
  order: number;
}

/**
 * Slide deck structure
 */
export interface SlideDeck {
  meta: RenderableReport['meta'];
  frames: SlideFrame[];
  total_frames: number;
  layout: LayoutVariant;
}

/**
 * Prepare a renderable report from composed report
 */
export function prepareRenderableReport(
  report: ComposedReport,
  layout: LayoutVariant = 'standard_agency_report'
): RenderableReport {
  const htmlExport = exportReportToHTML(report, layout);
  const markdownExport = exportReportToMarkdown(report, layout);
  const jsonExport = exportReportToJSON(report, layout);

  return {
    meta: {
      report_id: report.report_id,
      report_type: report.report_type,
      title: report.title,
      subtitle: report.subtitle,
      client_id: report.client_id,
      client_name: report.client_name,
      workspace_id: report.workspace_id,
      timeframe: report.timeframe,
      generated_at: report.generated_at,
      data_completeness: report.data_completeness,
      total_sections: report.meta.total_sections,
      complete_sections: report.meta.complete_sections,
      partial_sections: report.meta.partial_sections,
      omitted_sections: report.omitted_sections,
      data_sources_used: report.meta.data_sources_used,
    },
    sections: report.sections,
    html: htmlExport.content,
    markdown: markdownExport.content,
    json: jsonExport.content,
    layout,
  };
}

/**
 * Prepare PDF payload from renderable report
 */
export function preparePdfPayload(renderable: RenderableReport): PdfPayload {
  const { meta, sections, html } = renderable;

  // Build cover page content
  const cover = {
    title: meta.title,
    subtitle: meta.subtitle,
    client_name: meta.client_name,
    timeframe_label: meta.timeframe.label,
    generated_date: new Date(meta.generated_at).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  };

  // Build table of contents
  const toc = sections.map((section, index) => ({
    section_number: index + 1,
    title: section.title,
    data_status: section.data_status,
  }));

  // Build pages
  const pages: PdfPayload['pages'] = [];

  // Cover page
  pages.push({
    page_type: 'cover',
    content: buildCoverPageHtml(cover),
  });

  // Table of contents page
  pages.push({
    page_type: 'toc',
    content: buildTocPageHtml(toc),
  });

  // Section pages
  sections.forEach((section, index) => {
    pages.push({
      page_type: 'section',
      content: buildSectionPageHtml(section),
      section_title: section.title,
      section_number: index + 1,
    });
  });

  // Appendix page (omitted sections)
  if (meta.omitted_sections.length > 0) {
    pages.push({
      page_type: 'appendix',
      content: buildAppendixPageHtml(meta.omitted_sections),
    });
  }

  // Footer with truth notice
  const footer = {
    truth_notice: `This report summarizes real activity between ${meta.timeframe.start} and ${meta.timeframe.end}. Sections may be omitted when data is incomplete.`,
    completeness_note: `Data completeness: ${meta.data_completeness}% | ${meta.complete_sections}/${meta.total_sections} sections complete`,
  };

  return {
    meta,
    cover,
    toc,
    pages,
    footer,
  };
}

/**
 * Prepare slide frames from renderable report
 */
export function prepareSlideFrames(renderable: RenderableReport): SlideDeck {
  const { meta, sections } = renderable;
  const frames: SlideFrame[] = [];
  let order = 0;

  // Title slide
  frames.push({
    frame_id: `frame_${order}`,
    frame_type: 'title',
    title: meta.title,
    subtitle: meta.subtitle,
    body_html: `
      <div class="title-slide">
        <p><strong>Client:</strong> ${meta.client_name}</p>
        <p><strong>Period:</strong> ${meta.timeframe.label}</p>
        <p><strong>Generated:</strong> ${new Date(meta.generated_at).toLocaleDateString('en-AU')}</p>
      </div>
    `,
    notes: `Title slide for ${meta.report_type} report. Data completeness: ${meta.data_completeness}%`,
    order: order++,
  });

  // Summary slide
  frames.push({
    frame_id: `frame_${order}`,
    frame_type: 'summary',
    title: 'Report Overview',
    body_html: `
      <div class="summary-slide">
        <ul>
          <li>Total sections: ${meta.total_sections}</li>
          <li>Complete sections: ${meta.complete_sections}</li>
          <li>Partial data sections: ${meta.partial_sections}</li>
          <li>Omitted sections: ${meta.omitted_sections.length}</li>
        </ul>
        <p class="completeness">Data completeness: ${meta.data_completeness}%</p>
      </div>
    `,
    notes: `Overview of report coverage. ${meta.omitted_sections.length > 0 ? `Omitted: ${meta.omitted_sections.join(', ')}` : 'All sections included.'}`,
    order: order++,
  });

  // Section slides
  sections.forEach((section) => {
    // Extract key content from blocks
    const blockContent = section.blocks.map(block => {
      switch (block.type) {
        case 'text': {
          const content = block.content as { text: string };
          return `<p>${content.text}</p>`;
        }
        case 'metric': {
          const content = block.content as { label: string; value: number; suffix?: string };
          return `<div class="metric"><strong>${content.value}${content.suffix || ''}</strong> ${content.label}</div>`;
        }
        case 'list': {
          const content = block.content as { items: string[]; title?: string };
          const items = content.items.slice(0, 5).map(item => `<li>${item}</li>`).join('');
          return `${content.title ? `<p><strong>${content.title}</strong></p>` : ''}<ul>${items}</ul>`;
        }
        case 'callout': {
          const content = block.content as { message: string; title?: string };
          return `<div class="callout">${content.title ? `<strong>${content.title}:</strong> ` : ''}${content.message}</div>`;
        }
        default:
          return '';
      }
    }).join('');

    frames.push({
      frame_id: `frame_${order}`,
      frame_type: 'section',
      title: section.title,
      subtitle: section.description,
      body_html: `
        <div class="section-slide">
          <span class="status-badge ${section.data_status}">${section.data_status}</span>
          ${blockContent}
        </div>
      `,
      notes: section.omission_reason || `Section ${section.order}: ${section.title}. Status: ${section.data_status}`,
      order: order++,
    });
  });

  // Closing slide
  frames.push({
    frame_id: `frame_${order}`,
    frame_type: 'closing',
    title: 'Summary & Next Steps',
    body_html: `
      <div class="closing-slide">
        <p><strong>Report Period:</strong> ${meta.timeframe.label}</p>
        <p><strong>Data Coverage:</strong> ${meta.data_completeness}%</p>
        <hr />
        <p class="truth-notice">This report summarizes real activity. Sections may be omitted when data is incomplete.</p>
      </div>
    `,
    notes: 'Closing slide with truth-layer notice.',
    order: order++,
  });

  return {
    meta,
    frames,
    total_frames: frames.length,
    layout: renderable.layout,
  };
}

// Helper functions for building HTML pages

function buildCoverPageHtml(cover: PdfPayload['cover']): string {
  return `
    <div class="pdf-cover">
      <h1>${cover.title}</h1>
      <h2>${cover.subtitle}</h2>
      <div class="cover-meta">
        <p><strong>Client:</strong> ${cover.client_name}</p>
        <p><strong>Period:</strong> ${cover.timeframe_label}</p>
        <p><strong>Generated:</strong> ${cover.generated_date}</p>
      </div>
    </div>
  `;
}

function buildTocPageHtml(toc: PdfPayload['toc']): string {
  const items = toc.map(item => `
    <li>
      <span class="toc-number">${item.section_number}.</span>
      <span class="toc-title">${item.title}</span>
      <span class="toc-status status-${item.data_status}">${item.data_status}</span>
    </li>
  `).join('');

  return `
    <div class="pdf-toc">
      <h2>Table of Contents</h2>
      <ol>${items}</ol>
    </div>
  `;
}

function buildSectionPageHtml(section: ReportSection): string {
  const blocksHtml = section.blocks.map(block => {
    switch (block.type) {
      case 'text': {
        const content = block.content as { text: string };
        return `<p>${content.text}</p>`;
      }
      case 'metric': {
        const content = block.content as { label: string; value: number; suffix?: string };
        return `
          <div class="metric-block">
            <div class="metric-value">${content.value}${content.suffix || ''}</div>
            <div class="metric-label">${content.label}</div>
          </div>
        `;
      }
      case 'list': {
        const content = block.content as { items: string[]; ordered?: boolean; title?: string };
        const tag = content.ordered ? 'ol' : 'ul';
        const items = content.items.map(item => `<li>${item}</li>`).join('');
        return `
          ${content.title ? `<p><strong>${content.title}</strong></p>` : ''}
          <${tag}>${items}</${tag}>
        `;
      }
      case 'table': {
        const content = block.content as { headers: string[]; rows: string[][] };
        const headerCells = content.headers.map(h => `<th>${h}</th>`).join('');
        const bodyRows = content.rows.map(row =>
          `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
        ).join('');
        return `
          <table>
            <thead><tr>${headerCells}</tr></thead>
            <tbody>${bodyRows}</tbody>
          </table>
        `;
      }
      case 'callout': {
        const content = block.content as { variant?: string; title?: string; message: string };
        return `
          <div class="callout callout-${content.variant || 'info'}">
            ${content.title ? `<strong>${content.title}:</strong> ` : ''}${content.message}
          </div>
        `;
      }
      default:
        return '';
    }
  }).join('');

  return `
    <div class="pdf-section">
      <h2>${section.title}</h2>
      <p class="section-description">${section.description}</p>
      <span class="status-badge status-${section.data_status}">${section.data_status}</span>
      <div class="section-content">
        ${blocksHtml}
      </div>
      ${section.omission_reason ? `<p class="omission-note">${section.omission_reason}</p>` : ''}
    </div>
  `;
}

function buildAppendixPageHtml(omittedSections: string[]): string {
  const items = omittedSections.map(section =>
    `<li>${section.replace(/_/g, ' ')}</li>`
  ).join('');

  return `
    <div class="pdf-appendix">
      <h2>Omitted Sections</h2>
      <p>The following sections were omitted due to insufficient data:</p>
      <ul>${items}</ul>
      <p class="appendix-note">These sections will be included in future reports as data becomes available.</p>
    </div>
  `;
}

export default {
  prepareRenderableReport,
  preparePdfPayload,
  prepareSlideFrames,
};
