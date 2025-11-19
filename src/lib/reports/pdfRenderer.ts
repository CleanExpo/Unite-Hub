/**
 * PDF Renderer - Phase 7 Week 20
 *
 * Converts HTML reports to high-quality PDF format using Puppeteer.
 * Supports A4 landscape format for wide tables.
 */

export interface PDFRenderOptions {
  format?: "A4" | "Letter" | "Legal";
  landscape?: boolean;
  printBackground?: boolean;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}

export class PDFRenderer {
  /**
   * Render HTML to PDF
   *
   * NOTE: This implementation uses a lightweight approach without Puppeteer
   * to avoid heavy dependencies. In production, you would use:
   * - Puppeteer (full Chrome instance)
   * - html-pdf-node (lightweight)
   * - PDFKit (programmatic PDF generation)
   *
   * For now, we'll create a placeholder that returns the HTML as base64
   * with instructions for PDF conversion.
   */
  async render(htmlContent: string, options: PDFRenderOptions = {}): Promise<Buffer> {
    const {
      format = "A4",
      landscape = true,
      printBackground = true,
      margin = {
        top: "1cm",
        right: "1cm",
        bottom: "1cm",
        left: "1cm",
      },
    } = options;

    console.log("[PDFRenderer] Rendering PDF with options:", {
      format,
      landscape,
      printBackground,
      margin,
    });

    // Production implementation would use Puppeteer:
    /*
    const puppeteer = require('puppeteer');

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: format as any,
      landscape,
      printBackground,
      margin,
    });

    await browser.close();

    return pdfBuffer;
    */

    // Placeholder: Return HTML as buffer with conversion instructions
    const placeholderContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>PDF Conversion Required</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .notice {
      background: white;
      border-left: 4px solid #4F46E5;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #4F46E5;
      margin-top: 0;
    }
    code {
      background: #f0f0f0;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
    .steps {
      margin: 20px 0;
    }
    .step {
      margin: 10px 0;
      padding-left: 30px;
      position: relative;
    }
    .step::before {
      content: "→";
      position: absolute;
      left: 10px;
      color: #4F46E5;
    }
  </style>
</head>
<body>
  <div class="notice">
    <h1>📄 PDF Conversion Required</h1>
    <p>This is a placeholder PDF renderer. To enable full PDF generation:</p>

    <div class="steps">
      <div class="step">Install Puppeteer: <code>npm install puppeteer</code></div>
      <div class="step">Uncomment the Puppeteer code in <code>src/lib/reports/pdfRenderer.ts</code></div>
      <div class="step">Re-run the report generation</div>
    </div>

    <p><strong>Alternative Options:</strong></p>
    <ul>
      <li>Use browser print-to-PDF on the HTML report</li>
      <li>Use html-pdf-node for lightweight conversion</li>
      <li>Use PDFKit for programmatic generation</li>
      <li>Use external services (CloudConvert, DocRaptor)</li>
    </ul>

    <p><strong>Configured Options:</strong></p>
    <ul>
      <li>Format: ${format}</li>
      <li>Landscape: ${landscape ? "Yes" : "No"}</li>
      <li>Print Background: ${printBackground ? "Yes" : "No"}</li>
      <li>Margins: ${JSON.stringify(margin)}</li>
    </ul>

    <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">

    <p><strong>Embedded HTML Report:</strong></p>
    <p>The full HTML report is embedded below. Use your browser's Print function (Cmd/Ctrl + P) and select "Save as PDF".</p>
  </div>

  <hr style="margin: 50px 0;">

  ${htmlContent}
</body>
</html>
    `.trim();

    return Buffer.from(placeholderContent, "utf8");
  }

  /**
   * Check if Puppeteer is available
   */
  async isPuppeteerAvailable(): Promise<boolean> {
    try {
      require.resolve("puppeteer");
      return true;
    } catch {
      return false;
    }
  }
}

export default PDFRenderer;
