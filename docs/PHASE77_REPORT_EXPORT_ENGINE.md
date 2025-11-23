# Phase 77: Report Export Engine

## Overview

Phase 77 adds a thin, safe export layer on top of the existing Client Report Center to generate downloadable PDF and slide-style exports. It reuses the existing report composition engine outputs without changing their contracts.

## Objectives Completed

- Added report render engine for PDF and slide payload preparation
- Created PDF export adapter (HTML-based with integration points)
- Created slide export adapter (JSON frames for presentation tools)
- Built UI components for export controls
- Added export API endpoint supporting 5 formats
- Maintained all truth-layer constraints

## Architecture

### Export Flow

```
Report Center UI
    ↓
ReportExportBar (format selector)
    ↓
/api/reports/export
    ↓
reportCompositionEngine (build report)
    ↓
reportRenderEngine (prepare renderable)
    ↓
├─→ pdfExportAdapter → HTML-based PDF
├─→ slideExportAdapter → JSON slide frames
├─→ exportReportToHTML → styled HTML
├─→ exportReportToMarkdown → Markdown
└─→ exportReportToJSON → structured JSON
```

### Export Formats

| Format | Output | Use Case |
|--------|--------|----------|
| `pdf` | HTML-based PDF | Sending to clients |
| `slides` | JSON frames | Presentations |
| `markdown` | Markdown string | Documentation |
| `html` | Styled HTML | Web viewing |
| `json` | Structured JSON | Integrations |

## Files Created

### Library (`src/lib/reports/`)

| File | Lines | Purpose |
|------|-------|---------|
| `reportRenderEngine.ts` | ~380 | Orchestrates rendering, prepares PDF/slide payloads |
| `pdfExportAdapter.ts` | ~320 | Converts to PDF-ready HTML with print styling |
| `slideExportAdapter.ts` | ~280 | Generates JSON slide frames |

### UI Components (`src/ui/components/`)

| File | Lines | Purpose |
|------|-------|---------|
| `ReportExportBar.tsx` | ~280 | Format selector and export button |
| `ReportViewerModal.tsx` | ~200 | Preview HTML/Markdown before export |

### API

| Path | Purpose |
|------|---------|
| `src/app/api/reports/export/route.ts` | Export reports in various formats |

## Key Interfaces

### RenderableReport

```typescript
interface RenderableReport {
  meta: {
    report_id: string;
    report_type: string;
    title: string;
    subtitle: string;
    client_id: string;
    client_name: string;
    workspace_id: string;
    timeframe: { start: string; end: string; label: string };
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
```

### PdfPayload

```typescript
interface PdfPayload {
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
    content: string;
  }>;
  footer: {
    truth_notice: string;
    completeness_note: string;
  };
}
```

### SlideFrame

```typescript
interface SlideFrame {
  frame_id: string;
  frame_type: 'title' | 'summary' | 'section' | 'metrics' | 'closing';
  title: string;
  subtitle?: string;
  body_html: string;
  notes: string;
  order: number;
}
```

## Usage

### Export via API

```typescript
const response = await fetch('/api/reports/export', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    client_id: 'contact_456',
    workspace_id: 'ws_123',
    report_type: 'monthly',
    client_name: 'Acme Corp',
    format: 'pdf', // 'pdf' | 'slides' | 'markdown' | 'html' | 'json'
    layout_variant: 'standard_agency_report',
    view_type: 'client',
  }),
});

const result = await response.json();
// result.content contains the export
// result.filename suggests download name
```

### Using ReportExportBar Component

```tsx
import { ReportExportBar } from '@/ui/components/ReportExportBar';

<ReportExportBar
  reportType="monthly"
  clientId="contact_456"
  workspaceId="ws_123"
  clientName="Acme Corp"
/>
```

### Programmatic Export

```typescript
import { prepareRenderableReport } from '@/lib/reports/reportRenderEngine';
import { exportToPdf } from '@/lib/reports/pdfExportAdapter';
import { exportToSlides } from '@/lib/reports/slideExportAdapter';

// Build report
const report = buildClientReport({
  workspace_id: 'ws_123',
  client_id: 'contact_456',
  client_name: 'Acme Corp',
  report_type: 'monthly',
});

// Prepare for rendering
const renderable = prepareRenderableReport(report);

// Export to PDF
const pdfResult = exportToPdf(renderable);
// pdfResult.content is HTML string
// pdfResult.filename is suggested filename

// Export to slides
const slideResult = exportToSlides(renderable);
// slideResult.deck.frames contains slide data
```

## PDF Export Details

### Current Implementation

The PDF adapter currently returns HTML-based PDF content optimized for print. It includes:

- Cover page with title, client name, timeframe
- Table of contents with section status badges
- Section pages with blocks and status indicators
- Appendix for omitted sections
- Footer with truth notice and completeness

### Integration Points

For actual binary PDF generation, integrate with:

1. **Puppeteer/Playwright** (server-side)
   ```typescript
   const browser = await puppeteer.launch();
   const page = await browser.newPage();
   await page.setContent(pdfResult.content);
   const buffer = await page.pdf({ format: 'A4' });
   ```

2. **@react-pdf/renderer** (React-based)
   ```typescript
   import { pdf } from '@react-pdf/renderer';
   const blob = await pdf(<ReportDocument report={report} />).toBlob();
   ```

3. **External Service**
   ```typescript
   const response = await fetch(PDF_SERVICE_URL, {
     method: 'POST',
     body: pdfResult.content,
   });
   ```

## Slide Export Details

### Frame Types

- **title** - Opening slide with report title and meta
- **summary** - Report overview with statistics
- **section** - Individual section content
- **metrics** - Key metrics display
- **closing** - Summary and truth notice

### Condensed Mode

For report types with many sections, use condensed mode:

```typescript
const result = exportToSlides(renderable, {
  condensed: true,
  max_frames: 8,
});
```

### Integration Points

For actual presentation generation:

1. **Google Slides API**
2. **PowerPoint via Office.js**
3. **Keynote via AppleScript**

## Truth-Layer Compliance

### All Exports Include

1. **Timeframe** - Clear start/end dates
2. **Scope** - What data sources were used
3. **Completeness** - Percentage of available data
4. **Omissions** - List of sections not included and why

### Footer Notice

Every export includes:
```
This report summarizes real activity between DATE_START and DATE_END.
Sections may be omitted when data is incomplete.
Data completeness: XX% | Y/Z sections complete
```

### Section Status

Each section displays its data status:
- **complete** - All required signals present
- **partial** - Some signals present
- **limited** - Minimal data available

## Files Modified

- `src/app/client/dashboard/reports-center/page.tsx` - Added ReportExportBar
- `src/app/founder/dashboard/reports-center/page.tsx` - Added ReportExportBar

## Testing

### Manual Testing

1. Navigate to `/client/dashboard/reports-center`
2. Select format from dropdown (PDF, Slides, Markdown, HTML, JSON)
3. Click Export button
4. Verify file downloads or content copies

5. Navigate to `/founder/dashboard/reports-center`
6. Select client and report type
7. Export in various formats
8. Verify truth notice appears in all exports

### API Testing

```bash
# Export as PDF
curl -X POST http://localhost:3008/api/reports/export \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "test",
    "workspace_id": "ws_test",
    "report_type": "weekly",
    "format": "pdf"
  }'

# Export as slides
curl -X POST http://localhost:3008/api/reports/export \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "test",
    "workspace_id": "ws_test",
    "report_type": "monthly",
    "format": "slides"
  }'

# Get endpoint info
curl http://localhost:3008/api/reports/export
```

## Future Enhancements

1. **Binary PDF Generation** - Integrate puppeteer for actual PDF output
2. **Google Slides Integration** - Generate actual presentations
3. **Email Delivery** - Send exports directly to clients
4. **Scheduled Exports** - Automatic weekly/monthly generation
5. **Custom Branding** - Client-specific logos and colors
6. **Export History** - Track what was exported and when

## No Database Changes

Phase 77 does not require any database migrations. All export functionality operates on existing composed reports.

## Safety Guarantees

- No modification of existing business logic contracts
- No hard dependency on external binary PDF engines
- Truth-layer fully enforced in all exports
- Read-only integration with existing data
- Rollback available (remove export routes and components)

## Related Documentation

- [Phase 76: Client Report Center](./PHASE76_CLIENT_REPORT_CENTER.md)
- [Phase 74: Client Storytelling Engine](./PHASE74_CLIENT_STORYTELLING_ENGINE.md)
