/**
 * PDF Export Adapter
 * Phase 77: Converts renderable report to PDF payload
 *
 * NOTE: This is a stub adapter that returns HTML-based PDF content.
 * For actual binary PDF generation, integrate with:
 * - puppeteer/playwright for server-side rendering
 * - @react-pdf/renderer for React-based PDF
 * - External PDF service API
 */

import { RenderableReport, preparePdfPayload, PdfPayload } from './reportRenderEngine';

/**
 * PDF export result
 */
export interface PdfExportResult {
  success: boolean;
  format: 'pdf';
  content_type: 'text/html' | 'application/pdf';
  content: string; // HTML string or base64 PDF
  filename: string;
  pages: number;
  size_bytes: number;
  meta: {
    report_type: string;
    client_name: string;
    timeframe: string;
    generated_at: string;
    completeness: number;
  };
  integration_note?: string;
}

/**
 * PDF styling for print
 */
const PDF_STYLES = `
  <style>
    @page {
      size: A4;
      margin: 2cm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1a1a1a;
      margin: 0;
      padding: 0;
    }

    .pdf-cover {
      text-align: center;
      padding: 4cm 2cm;
      page-break-after: always;
    }

    .pdf-cover h1 {
      font-size: 28pt;
      margin-bottom: 0.5em;
      color: #0f172a;
    }

    .pdf-cover h2 {
      font-size: 16pt;
      color: #64748b;
      font-weight: normal;
      margin-bottom: 2em;
    }

    .cover-meta {
      margin-top: 3cm;
    }

    .cover-meta p {
      margin: 0.5em 0;
      font-size: 11pt;
    }

    .pdf-toc {
      page-break-after: always;
    }

    .pdf-toc h2 {
      font-size: 18pt;
      margin-bottom: 1em;
      color: #0f172a;
    }

    .pdf-toc ol {
      list-style: none;
      padding: 0;
    }

    .pdf-toc li {
      display: flex;
      align-items: center;
      padding: 0.5em 0;
      border-bottom: 1px solid #e2e8f0;
    }

    .toc-number {
      width: 2em;
      font-weight: bold;
    }

    .toc-title {
      flex: 1;
    }

    .toc-status {
      font-size: 9pt;
      padding: 0.2em 0.5em;
      border-radius: 3px;
      text-transform: capitalize;
    }

    .status-complete {
      background: #dcfce7;
      color: #166534;
    }

    .status-partial {
      background: #fef9c3;
      color: #854d0e;
    }

    .status-limited {
      background: #ffedd5;
      color: #9a3412;
    }

    .pdf-section {
      page-break-before: always;
      padding-top: 1cm;
    }

    .pdf-section h2 {
      font-size: 16pt;
      color: #0f172a;
      margin-bottom: 0.5em;
    }

    .section-description {
      color: #64748b;
      font-style: italic;
      margin-bottom: 1em;
    }

    .status-badge {
      display: inline-block;
      font-size: 9pt;
      padding: 0.2em 0.5em;
      border-radius: 3px;
      margin-bottom: 1em;
    }

    .section-content {
      margin-top: 1em;
    }

    .section-content p {
      margin: 0.5em 0;
    }

    .section-content ul,
    .section-content ol {
      margin: 0.5em 0;
      padding-left: 1.5em;
    }

    .section-content li {
      margin: 0.3em 0;
    }

    .metric-block {
      display: inline-block;
      text-align: center;
      padding: 1em;
      margin: 0.5em;
      background: #f8fafc;
      border-radius: 8px;
      min-width: 120px;
    }

    .metric-value {
      font-size: 24pt;
      font-weight: bold;
      color: #0f172a;
    }

    .metric-label {
      font-size: 9pt;
      color: #64748b;
      margin-top: 0.3em;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
      font-size: 10pt;
    }

    th, td {
      border: 1px solid #e2e8f0;
      padding: 0.5em;
      text-align: left;
    }

    th {
      background: #f8fafc;
      font-weight: 600;
    }

    .callout {
      padding: 1em;
      border-radius: 6px;
      margin: 1em 0;
    }

    .callout-info {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
    }

    .callout-warning {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
    }

    .callout-success {
      background: #f0fdf4;
      border-left: 4px solid #22c55e;
    }

    .omission-note {
      font-size: 9pt;
      color: #64748b;
      font-style: italic;
      margin-top: 1em;
    }

    .pdf-appendix {
      page-break-before: always;
      padding-top: 1cm;
    }

    .pdf-appendix h2 {
      font-size: 16pt;
      color: #0f172a;
    }

    .appendix-note {
      font-size: 9pt;
      color: #64748b;
      font-style: italic;
    }

    .pdf-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 1cm 2cm;
      font-size: 8pt;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
      background: white;
    }

    .truth-notice {
      font-style: italic;
      margin-bottom: 0.3em;
    }

    .completeness-note {
      font-weight: 500;
    }

    @media print {
      .pdf-footer {
        position: running(footer);
      }

      @page {
        @bottom-center {
          content: element(footer);
        }
      }
    }
  </style>
`;

/**
 * Export report to PDF-ready HTML
 */
export function exportToPdf(renderable: RenderableReport): PdfExportResult {
  const payload = preparePdfPayload(renderable);

  // Build complete HTML document
  const pagesHtml = payload.pages.map(page => page.content).join('\n');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${payload.meta.title} - ${payload.meta.client_name}</title>
      ${PDF_STYLES}
    </head>
    <body>
      ${pagesHtml}

      <div class="pdf-footer">
        <p class="truth-notice">${payload.footer.truth_notice}</p>
        <p class="completeness-note">${payload.footer.completeness_note}</p>
      </div>
    </body>
    </html>
  `;

  // Generate filename
  const dateStr = new Date().toISOString().split('T')[0];
  const clientSlug = payload.meta.client_name.toLowerCase().replace(/\s+/g, '-');
  const filename = `${clientSlug}-${payload.meta.report_type}-report-${dateStr}.pdf`;

  return {
    success: true,
    format: 'pdf',
    content_type: 'text/html', // HTML for now, would be application/pdf with actual PDF generation
    content: html,
    filename,
    pages: payload.pages.length,
    size_bytes: new TextEncoder().encode(html).length,
    meta: {
      report_type: payload.meta.report_type,
      client_name: payload.meta.client_name,
      timeframe: payload.meta.timeframe.label,
      generated_at: payload.meta.generated_at,
      completeness: payload.meta.data_completeness,
    },
    integration_note: 'This is an HTML preview. For actual PDF binary output, integrate with puppeteer, @react-pdf/renderer, or an external PDF service.',
  };
}

/**
 * Generate PDF buffer (stub for future implementation)
 *
 * Integration points:
 * - puppeteer: await page.pdf({ format: 'A4' })
 * - @react-pdf/renderer: await pdf(<Document />).toBuffer()
 * - External service: await fetch(PDF_SERVICE_URL, { body: html })
 */
export async function generatePdfBuffer(
  renderable: RenderableReport
): Promise<Uint8Array> {
  // Stub implementation - returns empty buffer
  // In production, this would call puppeteer or external service

  const result = exportToPdf(renderable);

  // For now, return HTML as buffer
  // Replace this with actual PDF generation
  return new TextEncoder().encode(result.content);
}

/**
 * Get PDF generation status
 */
export function getPdfGenerationStatus(): {
  available: boolean;
  method: 'stub' | 'puppeteer' | 'react-pdf' | 'external';
  note: string;
} {
  return {
    available: true,
    method: 'stub',
    note: 'Currently generating HTML-based PDF preview. For binary PDF, integrate a PDF rendering service.',
  };
}

export default {
  exportToPdf,
  generatePdfBuffer,
  getPdfGenerationStatus,
};
