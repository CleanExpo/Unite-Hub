# PDF Generator

> Server-side PDF generation from templates with React PDF and reportlab for NodeJS-Starter-V1.

---

## Metadata

| Field          | Value                                                    |
| -------------- | -------------------------------------------------------- |
| **Skill ID**   | `pdf-generator`                                          |
| **Category**   | Document & Content                                       |
| **Complexity** | Medium                                                   |
| **Complements**| `data-transform`, `email-template`, `queue-worker`       |
| **Version**    | 1.0.0                                                    |
| **Locale**     | en-AU                                                    |

---

## Description

Codifies PDF generation patterns for NodeJS-Starter-V1: React PDF components for TypeScript-native document construction, reportlab for Python-side generation, template-based layouts for invoices and reports, streaming PDF responses, background generation via queue workers, and Australian locale formatting.

---

## When to Apply

### Positive Triggers

- Generating downloadable reports from dashboard data
- Creating invoices or receipts with structured layouts
- Exporting audit trail records to PDF for compliance
- Building printable views of agent execution results
- Generating PDF attachments for email notifications

### Negative Triggers

- Rendering Markdown to HTML (use `markdown-processor` skill)
- CSV export of tabular data (use `csv-processor` skill)
- Email template design (use `email-template` skill)
- Report data aggregation (use `metrics-collector` skill)

---

## Core Principles

### The Three Laws of PDF Generation

1. **Template, Don't Concatenate**: Define PDF layouts as reusable templates with typed data inputs. Never build PDFs by concatenating strings — it produces brittle, unmaintainable output.
2. **Generate in Background**: PDF generation is CPU-intensive. For reports over a few pages, enqueue the job to a background worker and return a download URL when complete.
3. **Australian Formatting**: All dates as DD/MM/YYYY, currency as AUD ($X,XXX.XX), page size A4 (210 x 297mm), not US Letter.

---

## Pattern 1: React PDF (TypeScript)

### Component-Based Document Construction

```tsx
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
  },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#050505",
  },
  table: {
    display: "flex",
    flexDirection: "column",
    marginTop: 16,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e0e0e0",
    paddingVertical: 6,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
    paddingBottom: 6,
    fontWeight: "bold",
  },
});

interface ReportData {
  title: string;
  generatedAt: string;
  rows: { label: string; value: string; status: string }[];
}

function ReportDocument({ data }: { data: ReportData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>{data.title}</Text>
        <Text>Generated: {data.generatedAt}</Text>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={{ flex: 2 }}>Item</Text>
            <Text style={{ flex: 1 }}>Value</Text>
            <Text style={{ flex: 1 }}>Status</Text>
          </View>
          {data.rows.map((row, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={{ flex: 2 }}>{row.label}</Text>
              <Text style={{ flex: 1 }}>{row.value}</Text>
              <Text style={{ flex: 1 }}>{row.status}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
```

---

## Pattern 2: PDF API Route (Next.js)

### Streaming PDF Response

```typescript
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

export async function GET(request: NextRequest) {
  const data = await fetchReportData(request);

  const buffer = await renderToBuffer(
    <ReportDocument data={data} />
  );

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="report-${data.generatedAt}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
```

---

## Pattern 3: Python PDF Generation (reportlab)

### Backend Report Builder

```python
from io import BytesIO
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet


def generate_report_pdf(title: str, rows: list[dict]) -> bytes:
    """Generate a PDF report with table data."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()
    elements = []

    # Title
    elements.append(Paragraph(title, styles["Title"]))
    elements.append(Paragraph(
        f"Generated: {datetime.now().strftime('%d/%m/%Y %H:%M')}",
        styles["Normal"],
    ))

    # Table
    table_data = [["Item", "Value", "Status"]]
    for row in rows:
        table_data.append([row["label"], row["value"], row["status"]])

    table = Table(table_data, colWidths=[80 * mm, 50 * mm, 40 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#050505")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e0e0e0")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#fafafa")]),
    ]))
    elements.append(table)

    doc.build(elements)
    buffer.seek(0)
    return buffer.read()
```

**Project Reference**: `apps/web/lib/audit/report-generator.ts` — the existing report generator outputs JSON, Markdown, and HTML formats. PDF generation extends this with a downloadable format.

### FastAPI Endpoint

```python
from fastapi.responses import Response

@router.get("/reports/{report_id}/pdf")
async def download_report_pdf(report_id: str):
    """Generate and stream a PDF report."""
    report_data = await get_report(report_id)
    pdf_bytes = generate_report_pdf(report_data["title"], report_data["rows"])

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="report-{report_id}.pdf"',
        },
    )
```

---

## Pattern 4: Background PDF Generation

### Queue-Backed for Large Reports

```python
async def enqueue_pdf_generation(report_id: str, redis) -> str:
    """Enqueue PDF generation for background processing."""
    import json

    job = {"report_id": report_id, "format": "pdf"}
    await redis.lpush("pdf:queue", json.dumps(job))
    return f"/api/reports/{report_id}/pdf/status"


async def process_pdf_job(job: dict, redis) -> None:
    """Background worker processes PDF generation."""
    report_data = await get_report(job["report_id"])
    pdf_bytes = generate_report_pdf(report_data["title"], report_data["rows"])

    # Store generated PDF (S3, local filesystem, or database)
    await store_pdf(job["report_id"], pdf_bytes)
    await redis.set(f"pdf:status:{job['report_id']}", "complete")
```

**Complements**: `queue-worker` skill — use the arq worker infrastructure for PDF generation jobs. `email-template` skill — attach generated PDFs to notification emails.

---

## Pattern 5: Australian Locale Formatting

### Date, Currency, and Page Standards

```python
from datetime import datetime
from decimal import Decimal


def format_aud(amount: Decimal) -> str:
    """Format amount as Australian dollars."""
    return f"${amount:,.2f}"


def format_date_au(dt: datetime) -> str:
    """Format date as DD/MM/YYYY."""
    return dt.strftime("%d/%m/%Y")


# Page size constants
A4_WIDTH = 210  # mm
A4_HEIGHT = 297  # mm
```

**Rule**: Always use A4 page size, DD/MM/YYYY dates, and AUD currency formatting in generated PDFs.

---

## Anti-Patterns

| Pattern | Problem | Correct Approach |
|---------|---------|-----------------:|
| HTML-to-PDF via headless browser | Slow, resource-heavy, fragile | React PDF or reportlab |
| String concatenation for PDF | Unmaintainable, no layout control | Template-based components |
| Synchronous generation in request | Blocks response for large reports | Background queue + download URL |
| US Letter page size | Not standard in Australia | A4 (210 x 297mm) |
| MM/DD/YYYY dates | Confusing for Australian users | DD/MM/YYYY |
| No Content-Disposition header | Browser renders instead of downloading | `attachment; filename=...` |

---

## Checklist

Before merging pdf-generator changes:

- [ ] React PDF components for TypeScript-side generation
- [ ] reportlab templates for Python-side generation
- [ ] Streaming PDF response with correct Content-Type and Content-Disposition
- [ ] Background generation via queue worker for large reports
- [ ] A4 page size, DD/MM/YYYY dates, AUD currency formatting
- [ ] Download status endpoint for async generation

---

## Response Format

When applying this skill, structure implementation as:

```markdown
### PDF Generator Implementation

**Library**: [React PDF / reportlab / both]
**Generation**: [synchronous / background queue]
**Page Size**: [A4 / US Letter]
**Locale**: [en-AU DD/MM/YYYY AUD / other]
**Templates**: [report / invoice / audit / custom]
**Delivery**: [streaming response / download URL / email attachment]
```
