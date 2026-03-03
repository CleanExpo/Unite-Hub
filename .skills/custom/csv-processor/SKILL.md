---
name: csv-processor
description: >-
  Streaming CSV parse and generate patterns for large file support across
  Next.js frontend and FastAPI backend. Covers row-by-row streaming, Zod
  row validation, Pydantic export models, Australian locale formatting
  (DD/MM/YYYY dates, AUD currency), and memory-safe chunked processing.
license: MIT
metadata:
  author: NodeJS-Starter-V1
  version: '1.0.0'
  locale: en-AU
---

# CSV Processor - Streaming CSV Parse & Generate

## Description

Provides streaming CSV parse and generate patterns for NodeJS-Starter-V1, covering large file imports, exports, and transformations across Next.js frontend and FastAPI backend. Enforces row-by-row streaming, Zod and Pydantic row validation, and Australian locale formatting (DD/MM/YYYY dates, AUD currency).

---

## When to Apply

### Positive Triggers

- Importing CSV files from user uploads
- Exporting data to CSV for download (contractors, reports, agent runs)
- Parsing large CSV datasets (1,000+ rows)
- Validating CSV row structure against a schema
- Transforming CSV data between formats
- User mentions: "CSV", "import", "export", "spreadsheet", "download data", "upload file"

### Negative Triggers

- Validating form inputs without file upload (use `data-validation` instead)
- Generating PDF or HTML reports (use `report-generator` patterns)
- Processing JSON API responses (use `api-contract` instead)
- Working with binary file formats (xlsx, parquet) — different tooling required

## Core Directives

### The Three Laws of CSV Processing

1. **Stream, never buffer**: Process row-by-row. Never load entire files into memory.
2. **Validate every row**: Each row passes through a Zod (frontend) or Pydantic (backend) schema.
3. **Locale-aware output**: Dates as DD/MM/YYYY, currency as AUD, Australian English headers.

---

## Recommended Libraries

### Frontend (Next.js)

| Library | Purpose | Install |
|---------|---------|---------|
| `papaparse` | Streaming CSV parse (browser + Node) | `pnpm add papaparse` |
| `@types/papaparse` | TypeScript definitions | `pnpm add -D @types/papaparse` |

### Backend (FastAPI)

| Library | Purpose | Install |
|---------|---------|---------|
| `python-multipart` | File upload handling (already installed) | — |
| Built-in `csv` module | Streaming read/write | — |
| `aiofiles` | Async file I/O | `uv add aiofiles` |

No additional backend library needed — Python's built-in `csv` module supports streaming via `csv.reader` and `csv.DictWriter`.

---

## Frontend Patterns (Next.js)

### CSV Import with Zod Validation

```typescript
import Papa from 'papaparse';
import * as z from 'zod';

// Define row schema — mirrors backend Pydantic model
const contractorRowSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().regex(/^04\d{8}$/, 'Australian mobile required'),
  abn: z.string().regex(/^\d{11}$/, 'ABN must be 11 digits'),
  state: z.enum(['QLD', 'NSW', 'VIC', 'SA', 'WA', 'TAS', 'NT', 'ACT']),
});

type ContractorRow = z.infer<typeof contractorRowSchema>;

interface ParseResult {
  valid: ContractorRow[];
  errors: Array<{ row: number; issues: z.ZodIssue[] }>;
}

function parseContractorCsv(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const valid: ContractorRow[] = [];
    const errors: ParseResult['errors'] = [];
    let rowIndex = 0;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      step(results) {
        rowIndex++;
        const parsed = contractorRowSchema.safeParse(results.data);
        if (parsed.success) {
          valid.push(parsed.data);
        } else {
          errors.push({ row: rowIndex, issues: parsed.error.issues });
        }
      },
      complete() {
        resolve({ valid, errors });
      },
    });
  });
}
```

### CSV Export with Australian Formatting

```typescript
import Papa from 'papaparse';

interface ExportOptions {
  filename: string;
  data: Record<string, unknown>[];
  columns?: string[];
}

function exportToCsv({ filename, data, columns }: ExportOptions): void {
  // Format Australian dates and currency before export
  const formatted = data.map((row) => {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      if (value instanceof Date) {
        out[key] = value.toLocaleDateString('en-AU');  // DD/MM/YYYY
      } else if (typeof value === 'number' && key.includes('amount')) {
        out[key] = `$${value.toFixed(2)}`;  // AUD
      } else {
        out[key] = value;
      }
    }
    return out;
  });

  const csv = Papa.unparse(formatted, { columns });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}
```

### File Upload Component

Wrap the parse function in a `<input type="file" accept=".csv,text/csv">` component. Validate file extension (`.csv`), MIME type (`text/csv`), and size (default 10 MB cap) before parsing. Display row-level errors using `ParseResult.errors`.

---

## Backend Patterns (FastAPI)

### CSV Import Endpoint

```python
import csv
import io
from typing import Any

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from pydantic import BaseModel, Field, field_validator

router = APIRouter(prefix="/import", tags=["Import"])


class ContractorImportRow(BaseModel):
    """Schema for a single CSV row."""

    name: str = Field(min_length=1)
    email: str
    phone: str
    abn: str
    state: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        import re
        cleaned = re.sub(r"[^\d]", "", v)
        if not re.match(r"^04\d{8}$", cleaned):
            raise ValueError("Australian mobile required (04XX XXX XXX)")
        return cleaned


class ImportResult(BaseModel):
    """Result of CSV import."""

    total_rows: int
    valid_rows: int
    error_rows: int
    errors: list[dict[str, Any]] = Field(default_factory=list)


@router.post("/contractors", response_model=ImportResult)
async def import_contractors(file: UploadFile = File(...)) -> ImportResult:
    """Import contractors from CSV file."""
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Only CSV files accepted",
        )

    content = await file.read()
    reader = csv.DictReader(io.StringIO(content.decode("utf-8")))

    valid: list[ContractorImportRow] = []
    errors: list[dict[str, Any]] = []

    for i, row in enumerate(reader, start=1):
        try:
            parsed = ContractorImportRow(**row)
            valid.append(parsed)
        except Exception as e:
            errors.append({"row": i, "error": str(e)})

    # Process valid rows (insert into database)
    # await bulk_insert_contractors(valid)

    return ImportResult(
        total_rows=len(valid) + len(errors),
        valid_rows=len(valid),
        error_rows=len(errors),
        errors=errors[:50],  # Cap error list
    )
```

### CSV Export Endpoint

```python
import csv
import io
from datetime import datetime

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/export", tags=["Export"])


@router.get("/contractors")
async def export_contractors() -> StreamingResponse:
    """Export contractors as CSV download."""
    # Fetch data
    contractors = await get_all_contractors()

    # Stream CSV output
    output = io.StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=["name", "email", "phone", "abn", "state", "created_at"],
    )
    writer.writeheader()

    for c in contractors:
        writer.writerow({
            "name": c.name,
            "email": c.email,
            "phone": c.phone,
            "abn": c.abn,
            "state": c.state,
            "created_at": _format_au_date(c.created_at),
        })

    output.seek(0)
    timestamp = datetime.now().strftime("%d-%m-%Y")

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="contractors-{timestamp}.csv"'
        },
    )


def _format_au_date(dt: datetime) -> str:
    """Format datetime as DD/MM/YYYY for CSV export."""
    return dt.strftime("%d/%m/%Y")
```

### Streaming Large Files

For files over 10 MB, use async generators:

```python
from collections.abc import AsyncGenerator

async def stream_csv_rows(
    file: UploadFile,
    chunk_size: int = 8192,
) -> AsyncGenerator[dict[str, str], None]:
    """Stream CSV rows without loading entire file into memory."""
    buffer = ""
    reader = None

    while chunk := await file.read(chunk_size):
        buffer += chunk.decode("utf-8")
        lines = buffer.split("\n")
        buffer = lines.pop()  # Keep incomplete line in buffer

        if reader is None and lines:
            # First chunk — extract headers
            header_line = lines.pop(0)
            headers = next(csv.reader([header_line]))
            reader = headers

        for line in lines:
            if line.strip() and reader:
                values = next(csv.reader([line]))
                yield dict(zip(reader, values))

    # Process remaining buffer
    if buffer.strip() and reader:
        values = next(csv.reader([buffer]))
        yield dict(zip(reader, values))
```

---

## Australian Locale Formatting

### Date Columns

| Context | Format | Example |
|---------|--------|---------|
| CSV export | DD/MM/YYYY | 23/01/2026 |
| CSV import (accept) | DD/MM/YYYY or ISO 8601 | 23/01/2026, 2026-01-23 |
| Database storage | ISO 8601 | 2026-01-23T00:00:00Z |

### Date Parsing (Dual Format)

```typescript
function parseAustralianDate(value: string): Date {
  // Try DD/MM/YYYY first
  const auMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (auMatch) {
    return new Date(`${auMatch[3]}-${auMatch[2]}-${auMatch[1]}`);
  }
  // Fall back to ISO 8601
  const iso = new Date(value);
  if (!isNaN(iso.getTime())) return iso;
  throw new Error(`Invalid date: ${value}`);
}
```

```python
from datetime import datetime

def parse_au_date(value: str) -> datetime:
    """Parse DD/MM/YYYY or ISO 8601 date string."""
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%Y-%m-%dT%H:%M:%S"):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    raise ValueError(f"Invalid date: {value}")
```

### Currency Columns

```typescript
// Export: format as AUD
const amount = 1234.5;
const formatted = `$${amount.toFixed(2)}`;  // "$1234.50"

// Import: strip $ and commas
const raw = '$1,234.50';
const parsed = parseFloat(raw.replace(/[$,]/g, ''));  // 1234.5
```

---

## Anti-Patterns

| Anti-Pattern | Why It Fails | Correct Approach |
|---|---|---|
| `file.text()` then split by `\n` | Breaks on quoted fields with newlines | Use PapaParse or `csv` module |
| Load entire file into array | Memory overflow on large files | Stream row-by-row |
| No row validation | Bad data corrupts database | Zod/Pydantic per row |
| Hardcoded column indices (`row[3]`) | Breaks when columns reorder | Use header-based access (`row.name`) |
| MM/DD/YYYY date format | Australian users expect DD/MM/YYYY | Always DD/MM/YYYY in CSV |
| UTF-8 BOM not handled | Excel exports include BOM bytes | Strip BOM before parsing |

### BOM Stripping

```typescript
// PapaParse handles BOM automatically with `skipEmptyLines: true`

// Manual stripping if needed
function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}
```

---

## Checklist for CSV Features

### Import

- [ ] File type validated (`.csv` extension and `text/csv` MIME)
- [ ] File size limit enforced (configurable, default 10 MB)
- [ ] Streaming parse (PapaParse `step` or Python `csv.reader`)
- [ ] Row-level Zod/Pydantic validation
- [ ] Error report with row numbers and issues
- [ ] DD/MM/YYYY date parsing supported
- [ ] UTF-8 BOM handled

### Export

- [ ] `StreamingResponse` (backend) or `Blob` download (frontend)
- [ ] Australian date format (DD/MM/YYYY) in output
- [ ] AUD currency formatting (`$X,XXX.XX`)
- [ ] Filename includes export date (`contractors-23-01-2026.csv`)
- [ ] `Content-Disposition` header set for download

### Cross-Stack

- [ ] Column names match between import and export
- [ ] Row schema shared between frontend Zod and backend Pydantic
- [ ] Large file support tested (10,000+ rows)

---

## Response Format

```
[AGENT_ACTIVATED]: CSV Processor
[PHASE]: {Design | Implementation | Review}
[STATUS]: {in_progress | complete}

{CSV processing analysis or implementation guidance}

[NEXT_ACTION]: {what to do next}
```

## Integration Points

### Data Validation

- Row schemas are Zod (frontend) and Pydantic (backend) — same as `data-validation` patterns
- Import validation reuses existing schema definitions where possible

### API Contract

- CSV import endpoint uses `UploadFile` with `response_model=ImportResult`
- CSV export endpoint returns `StreamingResponse` with `text/csv` media type
- Both documented in OpenAPI via FastAPI decorators

### Structured Logging

- Log `csv_import_started`, `csv_import_completed`, `csv_import_failed`
- Include `total_rows`, `valid_rows`, `error_rows`, `duration_ms`

### Error Taxonomy

- File validation errors: `DATA_VALIDATION_INVALID_FORMAT` (422)
- Row validation errors: included in `ImportResult.errors` (not HTTP errors)
- File size exceeded: `DATA_VALIDATION_FILE_TOO_LARGE` (413)

## Australian Localisation (en-AU)

- **Date Format**: DD/MM/YYYY in CSV; ISO 8601 in database
- **Currency**: AUD ($) — `$X,XXX.XX` format in CSV columns
- **Spelling**: serialise, analyse, optimise, behaviour, colour
- **Phone**: Australian mobile format (04XX XXX XXX)
- **ABN**: 11-digit Australian Business Number validation
