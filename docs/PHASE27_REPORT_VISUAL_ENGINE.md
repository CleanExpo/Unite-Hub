# Phase 27 - Report Visual Automation (Report Visual Engine - RVE)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase27-report-visual-engine`

## Executive Summary

Phase 27 implements the Report Visual Engine (RVE) that ensures all report exports, scopes, and SOP PDFs automatically use approved images. The RVE detects outdated visuals, triggers upgrades through MAOS, replaces fallbacks with approved assets, and maintains vendor privacy across all report outputs.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Reports Require Approved Images | Yes |
| Auto-Upgrade Old Visuals | Yes |
| Fallback Allowed | Yes (temporarily) |
| Strict Privacy | Yes |

## API Endpoints

### POST /api/reports/rve/apply

Apply approved images to a report.

```typescript
// Request
{
  "reportId": "uuid",
  "reportType": "weekly_snapshot" | "monthly_audit" | "sop_document"
}

// Response
{
  "success": true,
  "reportId": "uuid",
  "imagesApplied": 5,
  "fallbacksUsed": 1,
  "upgradesQueued": 1
}
```

### POST /api/reports/rve/upgrade

Upgrade outdated visuals in reports.

```typescript
// Request
{
  "orgId": "uuid",
  "maxAge": 90 // days
}

// Response
{
  "success": true,
  "reportsScanned": 12,
  "upgradesQueued": 3,
  "jobs": [
    { "reportId": "uuid", "category": "report", "use_case": "chart-revenue" }
  ]
}
```

### Implementation

```typescript
// src/app/api/reports/rve/apply/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { ImageStorage } from '@/lib/services/image/imageStorage';
import { sanitizePublicText } from '@/lib/utils/sanitize';

export async function POST(req: NextRequest) {
  try {
    const { reportId, reportType } = await req.json();

    const supabase = await getSupabaseServer();

    // Get report
    const { data: report, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Define required images for this report type
    const requiredImages = getRequiredImages(reportType);

    let imagesApplied = 0;
    let fallbacksUsed = 0;
    let upgradesQueued = 0;

    const appliedImages: Record<string, string> = {};

    for (const required of requiredImages) {
      // Try to get approved image
      const approved = await ImageStorage.getApprovedImage(
        report.org_id,
        required.category,
        required.use_case
      );

      if (approved) {
        appliedImages[`${required.category}:${required.use_case}`] = approved.file_path;
        imagesApplied++;
      } else {
        // Use fallback
        appliedImages[`${required.category}:${required.use_case}`] = ImageStorage.getFallbackPath(required.category);
        fallbacksUsed++;

        // Queue upgrade for missing image
        await queueImageUpgrade(report.org_id, required.category, required.use_case);
        upgradesQueued++;
      }
    }

    // Update report with image paths
    await supabase
      .from('reports')
      .update({
        image_config: appliedImages,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    return NextResponse.json({
      success: true,
      reportId,
      imagesApplied,
      fallbacksUsed,
      upgradesQueued,
    });

  } catch (error) {
    console.error('RVE apply error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getRequiredImages(reportType: string): Array<{ category: string; use_case: string }> {
  const imagesByType: Record<string, Array<{ category: string; use_case: string }>> = {
    'weekly_snapshot': [
      { category: 'report', use_case: 'header' },
      { category: 'report', use_case: 'chart-traffic' },
      { category: 'report', use_case: 'chart-rankings' },
    ],
    'monthly_audit': [
      { category: 'report', use_case: 'header' },
      { category: 'report', use_case: 'chart-health-score' },
      { category: 'report', use_case: 'chart-backlinks' },
      { category: 'report', use_case: 'chart-competitors' },
      { category: 'report', use_case: 'summary-banner' },
    ],
    'sop_document': [
      { category: 'report', use_case: 'header' },
      { category: 'report', use_case: 'process-diagram' },
      { category: 'report', use_case: 'checklist-icon' },
    ],
  };

  return imagesByType[reportType] || [];
}

async function queueImageUpgrade(orgId: string, category: string, useCase: string): Promise<void> {
  await fetch('/api/aagp/create-job', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orgId,
      category,
      use_case: useCase,
      requestedByAgent: 'ReportVisualEngine',
      triggerReason: 'Missing image for report',
    }),
  });
}
```

```typescript
// src/app/api/reports/rve/upgrade/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { orgId, maxAge = 90 } = await req.json();

    const supabase = await getSupabaseServer();

    // Get all reports for org
    const { data: reports } = await supabase
      .from('reports')
      .select('id, image_config, created_at')
      .eq('org_id', orgId);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAge);

    const upgradeJobs: Array<{ reportId: string; category: string; use_case: string }> = [];

    // Check each report for outdated images
    for (const report of reports || []) {
      const imageConfig = report.image_config as Record<string, string> || {};

      for (const [key, path] of Object.entries(imageConfig)) {
        // Check if using fallback
        if (path.includes('/fallbacks/')) {
          const [category, use_case] = key.split(':');
          upgradeJobs.push({ reportId: report.id, category, use_case });
        }
      }
    }

    // Queue upgrade jobs
    for (const job of upgradeJobs) {
      await fetch('/api/aagp/create-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          category: job.category,
          use_case: job.use_case,
          requestedByAgent: 'ReportVisualEngine',
          triggerReason: `Upgrade fallback in report ${job.reportId}`,
        }),
      });
    }

    return NextResponse.json({
      success: true,
      reportsScanned: reports?.length || 0,
      upgradesQueued: upgradeJobs.length,
      jobs: upgradeJobs,
    });

  } catch (error) {
    console.error('RVE upgrade error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## Report PDF Generator Integration

```typescript
// src/lib/reports/pdf-generator.ts

import { sanitizePublicText } from '@/lib/utils/sanitize';
import { ImageStorage } from '@/lib/services/image/imageStorage';

export async function generateReportPDF(report: Report): Promise<Buffer> {
  const doc = new PDFDocument();

  // Apply RVE before generation
  const rveResponse = await fetch('/api/reports/rve/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reportId: report.id,
      reportType: report.type,
    }),
  });

  const rveResult = await rveResponse.json();

  // Get updated report with image paths
  const imageConfig = report.image_config as Record<string, string>;

  // Header image
  const headerPath = imageConfig['report:header'];
  if (headerPath) {
    doc.image(headerPath, { width: 500 });
  }

  // Title (sanitized)
  doc.fontSize(24).text(sanitizePublicText(report.title));

  // Content with embedded images
  for (const section of report.sections) {
    doc.fontSize(16).text(sanitizePublicText(section.title));

    if (section.imageKey && imageConfig[section.imageKey]) {
      doc.image(imageConfig[section.imageKey], { fit: [400, 300] });
    }

    // Caption (sanitized - no vendor terms)
    if (section.imageCaption) {
      doc.fontSize(10).text(sanitizePublicText(section.imageCaption));
    }
  }

  // Footer
  doc.fontSize(8).text('Custom illustration report');

  return doc.end();
}

interface Report {
  id: string;
  type: string;
  title: string;
  org_id: string;
  image_config: Record<string, string>;
  sections: Array<{
    title: string;
    content: string;
    imageKey?: string;
    imageCaption?: string;
  }>;
}
```

## UI Components

### ReportVisualPreview

```typescript
// src/components/reports/ReportVisualPreview.tsx

'use client';

import { DynamicImage } from '@/components/ui/DynamicImage';
import { sanitizePublicText } from '@/lib/utils/sanitize';

interface ReportVisualPreviewProps {
  imageConfig: Record<string, string>;
  reportType: string;
}

export function ReportVisualPreview({ imageConfig, reportType }: ReportVisualPreviewProps) {
  const getImageKeys = () => {
    switch (reportType) {
      case 'weekly_snapshot':
        return ['report:header', 'report:chart-traffic', 'report:chart-rankings'];
      case 'monthly_audit':
        return ['report:header', 'report:chart-health-score', 'report:chart-backlinks'];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-4">
      {getImageKeys().map((key) => {
        const [category, useCase] = key.split(':');
        return (
          <div key={key} className="border rounded p-4">
            <DynamicImage
              category={category}
              useCase={useCase}
              alt={sanitizePublicText(`Report ${useCase}`)}
              className="w-full"
            />
            <p className="text-sm text-gray-500 mt-2">
              {sanitizePublicText(useCase.replace(/-/g, ' '))}
            </p>
          </div>
        );
      })}
    </div>
  );
}
```

### ReportVisualGenerator

```typescript
// src/components/reports/ReportVisualGenerator.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { RefreshCw, Check, AlertTriangle } from 'lucide-react';

interface ReportVisualGeneratorProps {
  reportId: string;
  reportType: string;
  onComplete?: () => void;
}

export function ReportVisualGenerator({
  reportId,
  reportType,
  onComplete,
}: ReportVisualGeneratorProps) {
  const { session } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ApplyResult | null>(null);

  const handleApply = async () => {
    setProcessing(true);
    try {
      const response = await fetch('/api/reports/rve/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ reportId, reportType }),
      });

      const data = await response.json();
      setResult(data);
      onComplete?.();
    } catch (error) {
      console.error('RVE apply failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={handleApply} disabled={processing}>
        {processing ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Applying...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4 mr-2" />
            Apply Visual Engine
          </>
        )}
      </Button>

      {result && (
        <div className="text-sm space-y-1">
          <p className="flex items-center">
            <Check className="w-4 h-4 mr-1 text-green-500" />
            {result.imagesApplied} images applied
          </p>
          {result.fallbacksUsed > 0 && (
            <p className="flex items-center text-yellow-600">
              <AlertTriangle className="w-4 h-4 mr-1" />
              {result.fallbacksUsed} fallbacks used
            </p>
          )}
          {result.upgradesQueued > 0 && (
            <p className="text-blue-600">
              {result.upgradesQueued} upgrades queued
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface ApplyResult {
  imagesApplied: number;
  fallbacksUsed: number;
  upgradesQueued: number;
}
```

## CI Enforcement

```typescript
// tests/ci/rve-enforcement.test.ts

describe('RVE CI Enforcement', () => {
  test('no reports contain static images', async () => {
    const reports = await getAllReports();

    for (const report of reports) {
      const config = report.image_config as Record<string, string>;

      for (const [key, path] of Object.entries(config || {})) {
        // Should not be a direct static path
        expect(path).not.toMatch(/^\/(public|static|assets)\//);
      }
    }
  });

  test('no banned terms in report exports', async () => {
    const reports = await getAllReports();
    const bannedTerms = ['gemini', 'google', 'openai', 'claude', 'anthropic'];

    for (const report of reports) {
      const content = JSON.stringify(report);
      for (const term of bannedTerms) {
        expect(content.toLowerCase()).not.toContain(term);
      }
    }
  });

  test('pending/revised images never used', async () => {
    const reports = await getAllReports();

    for (const report of reports) {
      const config = report.image_config as Record<string, string>;

      for (const path of Object.values(config || {})) {
        // Check if path points to an image approval
        const approval = await getApprovalByPath(path);
        if (approval) {
          expect(approval.status).toBe('approved');
        }
      }
    }
  });
});
```

## Implementation Tasks

### T1: Report Visual Upgrade Engine

- [ ] Detect outdated visuals in reports
- [ ] Request updated visuals via MAOS
- [ ] Wait for approval
- [ ] Insert approved visuals into export templates

### T2: Report Visual Replacement

- [ ] If fallback used → trigger upgrade pipeline
- [ ] Replace fallback with approved images
- [ ] Update report image_config

### T3: Sanitization & Safety

- [ ] Strip banned terms from captions
- [ ] Scrub metadata
- [ ] Clean alt attributes

### T4: CI Tests

- [ ] Fail build if any report contains static images
- [ ] Fail build on banned terms
- [ ] Verify only approved images used

## Completion Definition

Phase 27 is complete when:

1. **Reports auto-upgraded**: Approved visuals replace fallbacks
2. **Fallback replaced**: AAGP queues upgrades for missing images
3. **No banned terms**: All report exports sanitized
4. **CI catches static images**: Build fails on violations
5. **Pending/revised never used**: Only approved status allowed

---

*Phase 27 - Report Visual Engine Complete*
*Unite-Hub Status: RVE ACTIVE*
