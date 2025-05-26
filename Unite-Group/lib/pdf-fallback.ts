import { logger } from "./logger"

interface SimplePDFOptions {
  title: string
  content: string
  filename: string
}

/**
 * Generates a simple PDF without using the canvas dependency
 * This is a fallback for environments where canvas cannot be installed
 */
export async function generateSimplePDF(options: SimplePDFOptions): Promise<string> {
  try {
    logger.info(`Generating simple fallback PDF: ${options.filename}`)

    // Create a simple PDF using only string manipulation
    // This avoids any dependencies on canvas or other native modules

    // PDF structure (simplified)
    const pdfContent = `
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Font << /F1 6 0 R >> >>
endobj
5 0 obj
<< /Length 90 >>
stream
BT
/F1 24 Tf
50 700 Td
(${options.title}) Tj
/F1 12 Tf
0 -50 Td
(${options.content}) Tj
ET
endstream
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 7
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000210 00000 n
0000000251 00000 n
0000000390 00000 n
trailer
<< /Size 7 /Root 1 0 R >>
startxref
457
%%EOF
`

    // Convert to base64
    const base64 = Buffer.from(pdfContent).toString("base64")
    return `data:application/pdf;base64,${base64}`
  } catch (error) {
    logger.error("Error generating fallback PDF:", error)
    throw new Error(`Failed to generate fallback PDF: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
