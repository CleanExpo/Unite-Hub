# Phase 25 - Visual Intelligence Engine (VIE) & Image Safety Layer

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase25-visual-intelligence-engine`

## Executive Summary

Phase 25 implements the Visual Intelligence Engine (VIE) that scans all generated images for safety labels, automatically blocks harmful content, and provides reviewers with detailed safety information. This ensures Unite-Hub is protected from unsafe visual content.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Model Lock | `gemini-3-pro-image-preview` |
| Scan Required | Yes, for all images |
| Safety Labels Required | Yes |
| Auto-Block Unsafe | Yes |
| No Vendor Terms | Yes |

## Database Schema

### Migration 081: Image Safety Labels

```sql
-- 081_image_safety_labels.sql

CREATE TABLE IF NOT EXISTS image_safety_labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_approval_id UUID NOT NULL,
  label TEXT NOT NULL,
  score NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign key
  CONSTRAINT image_safety_labels_approval_fk
    FOREIGN KEY (image_approval_id) REFERENCES image_approvals(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_safety_image_fk ON image_safety_labels(image_approval_id);
CREATE INDEX IF NOT EXISTS idx_safety_label ON image_safety_labels(label);
CREATE INDEX IF NOT EXISTS idx_safety_score ON image_safety_labels(score DESC);

-- Enable RLS
ALTER TABLE image_safety_labels ENABLE ROW LEVEL SECURITY;

-- RLS Policies (internal access)
CREATE POLICY safety_labels_select ON image_safety_labels
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY safety_labels_insert ON image_safety_labels
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY safety_labels_update ON image_safety_labels
  FOR UPDATE TO authenticated
  USING (true);

-- Comment
COMMENT ON TABLE image_safety_labels IS 'Stores VIE safety analysis tags for images (Phase 25)';
```

## API Endpoints

### POST /api/vie/scan

Scan an image for safety labels.

```typescript
// Request
{
  "imageId": "uuid",
  "imagePath": "/data/clients/org-123/images/dashboard-tile.png"
}

// Response
{
  "success": true,
  "imageId": "uuid",
  "labels": [
    { "label": "safe", "score": 0.98 },
    { "label": "professional", "score": 0.95 },
    { "label": "business", "score": 0.92 }
  ],
  "isSafe": true,
  "autoBlocked": false
}

// Response (unsafe)
{
  "success": true,
  "imageId": "uuid",
  "labels": [
    { "label": "inappropriate", "score": 0.85 },
    { "label": "unsafe", "score": 0.78 }
  ],
  "isSafe": false,
  "autoBlocked": true,
  "blockReason": "Inappropriate content detected"
}
```

### GET /api/vie/labels

Get safety labels for an image.

```typescript
// Request
GET /api/vie/labels?image_id=uuid

// Response
{
  "success": true,
  "labels": [
    { "id": "uuid", "label": "safe", "score": 0.98, "created_at": "..." },
    { "id": "uuid", "label": "professional", "score": 0.95, "created_at": "..." }
  ]
}
```

### Implementation

```typescript
// src/app/api/vie/scan/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { VIEScanner } from '@/lib/vie/scanner';

const UNSAFE_LABELS = ['inappropriate', 'unsafe', 'explicit', 'harmful', 'violent'];
const BLOCK_THRESHOLD = 0.7;

export async function POST(req: NextRequest) {
  try {
    const { imageId, imagePath } = await req.json();

    const supabase = await getSupabaseServer();

    // Run VIE scan
    const scanner = new VIEScanner();
    const scanResult = await scanner.scan(imagePath);

    // Store labels
    const labelInserts = scanResult.labels.map(label => ({
      image_approval_id: imageId,
      label: label.name,
      score: label.score,
    }));

    await supabase.from('image_safety_labels').insert(labelInserts);

    // Check for unsafe content
    const unsafeLabels = scanResult.labels.filter(
      label => UNSAFE_LABELS.includes(label.name.toLowerCase()) && label.score >= BLOCK_THRESHOLD
    );

    const isSafe = unsafeLabels.length === 0;
    let autoBlocked = false;

    // Auto-reject if unsafe
    if (!isSafe) {
      await supabase
        .from('image_approvals')
        .update({
          status: 'rejected',
          notes: `Auto-rejected by VIE: ${unsafeLabels.map(l => l.name).join(', ')}`,
        })
        .eq('id', imageId);

      autoBlocked = true;
    }

    return NextResponse.json({
      success: true,
      imageId,
      labels: scanResult.labels.map(l => ({ label: l.name, score: l.score })),
      isSafe,
      autoBlocked,
      ...(autoBlocked && { blockReason: `Detected: ${unsafeLabels.map(l => l.name).join(', ')}` }),
    });

  } catch (error) {
    console.error('VIE scan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## VIE Scanner Service

```typescript
// src/lib/vie/scanner.ts

export class VIEScanner {
  async scan(imagePath: string): Promise<ScanResult> {
    // Use Gemini's vision capabilities to analyze image
    const response = await this.analyzeImage(imagePath);

    // Extract safety labels
    const labels: Label[] = [
      { name: 'safe', score: response.safeScore || 0 },
      { name: 'professional', score: response.professionalScore || 0 },
      { name: 'business', score: response.businessScore || 0 },
    ];

    // Add any detected unsafe labels
    if (response.unsafeCategories) {
      for (const category of response.unsafeCategories) {
        labels.push({
          name: category.name,
          score: category.confidence,
        });
      }
    }

    return { labels };
  }

  private async analyzeImage(imagePath: string): Promise<AnalysisResponse> {
    // Implementation using Gemini vision API
    const { GoogleGenAI } = await import('@google/genai');
    const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Read image and analyze
    const fs = await import('fs/promises');
    const imageData = await fs.readFile(imagePath);
    const base64Image = imageData.toString('base64');

    const result = await client.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: [
        {
          parts: [
            { inlineData: { mimeType: 'image/png', data: base64Image } },
            {
              text: `Analyze this image for safety. Return JSON with:
              - safeScore (0-1): How safe/appropriate is this image
              - professionalScore (0-1): How professional/business-appropriate
              - businessScore (0-1): How suitable for business context
              - unsafeCategories: Array of {name, confidence} for any concerns

              Categories to check: inappropriate, explicit, violent, harmful, offensive

              Return only valid JSON.`
            }
          ]
        }
      ]
    });

    return JSON.parse(result.response.text());
  }
}

interface Label {
  name: string;
  score: number;
}

interface ScanResult {
  labels: Label[];
}

interface AnalysisResponse {
  safeScore: number;
  professionalScore: number;
  businessScore: number;
  unsafeCategories?: Array<{ name: string; confidence: number }>;
}
```

## UI Components

### VIESafetyTagList

```typescript
// src/components/admin/VIESafetyTagList.tsx

'use client';

import { Badge } from '@/components/ui/badge';

interface SafetyLabel {
  label: string;
  score: number;
}

interface VIESafetyTagListProps {
  labels: SafetyLabel[];
}

export function VIESafetyTagList({ labels }: VIESafetyTagListProps) {
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTagColor = (label: string) => {
    const unsafeLabels = ['inappropriate', 'unsafe', 'explicit', 'harmful', 'violent'];
    if (unsafeLabels.includes(label.toLowerCase())) {
      return 'bg-red-100 text-red-800 border-red-300';
    }
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div className="flex flex-wrap gap-2">
      {labels.map((item, index) => (
        <Badge
          key={index}
          variant="outline"
          className={getTagColor(item.label)}
        >
          {item.label}
          <span className={`ml-1 px-1 rounded text-xs ${getScoreColor(item.score)}`}>
            {(item.score * 100).toFixed(0)}%
          </span>
        </Badge>
      ))}
    </div>
  );
}
```

### VIEScanButton

```typescript
// src/components/admin/VIEScanButton.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Scan, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface VIEScanButtonProps {
  imageId: string;
  imagePath: string;
  onScanComplete?: (result: ScanResult) => void;
}

interface ScanResult {
  isSafe: boolean;
  autoBlocked: boolean;
  labels: Array<{ label: string; score: number }>;
}

export function VIEScanButton({ imageId, imagePath, onScanComplete }: VIEScanButtonProps) {
  const { session } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  const handleScan = async () => {
    setScanning(true);
    try {
      const response = await fetch('/api/vie/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ imageId, imagePath }),
      });

      const data = await response.json();
      setResult(data);
      onScanComplete?.(data);
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleScan}
        disabled={scanning}
        variant={result?.autoBlocked ? 'destructive' : 'outline'}
        size="sm"
      >
        {scanning ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Scanning...
          </>
        ) : result ? (
          result.isSafe ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Safe
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 mr-2" />
              Blocked
            </>
          )
        ) : (
          <>
            <Scan className="w-4 h-4 mr-2" />
            Scan
          </>
        )}
      </Button>
    </div>
  );
}
```

## Integration with Image Approval Flow

```typescript
// Update image approval process to include VIE scan

// src/lib/image-engine/client.ts

export class GeminiBanana2Client {
  async generateImage(prompt: string, options: GenerateOptions): Promise<ImageGenerationResult> {
    // ... existing generation code ...

    // After generation, run VIE scan
    const vieResponse = await fetch('/api/vie/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageId: approvalRecord.id,
        imagePath: result.filePath,
      }),
    });

    const vieResult = await vieResponse.json();

    // If auto-blocked, update result
    if (vieResult.autoBlocked) {
      return {
        ...result,
        autoBlocked: true,
        blockReason: vieResult.blockReason,
      };
    }

    return result;
  }
}
```

## CI Enforcement

```typescript
// tests/ci/vie-enforcement.test.ts

describe('VIE CI Enforcement', () => {
  test('no unsafe images in approved status', async () => {
    const unsafeApproved = await supabase
      .from('image_approvals')
      .select(`
        id,
        image_safety_labels!inner(label, score)
      `)
      .eq('status', 'approved')
      .in('image_safety_labels.label', ['inappropriate', 'unsafe', 'explicit', 'harmful'])
      .gte('image_safety_labels.score', 0.7);

    expect(unsafeApproved.data?.length || 0).toBe(0);
  });

  test('all approved images have safety scan', async () => {
    const { data: approved } = await supabase
      .from('image_approvals')
      .select('id')
      .eq('status', 'approved');

    for (const image of approved || []) {
      const { data: labels } = await supabase
        .from('image_safety_labels')
        .select('id')
        .eq('image_approval_id', image.id);

      expect(labels?.length).toBeGreaterThan(0);
    }
  });
});
```

## Implementation Tasks

### T1: Implement VIE Scan Engine

- [ ] Create `/api/vie/scan` route
- [ ] Implement VIEScanner service
- [ ] Integrate with Gemini vision API
- [ ] Trigger via Orchestrator after generation

### T2: Add Safety Label Storage

- [ ] Create migration 081
- [ ] Insert label rows after scan
- [ ] Link to image_approvals

### T3: Block Harmful Content

- [ ] Auto-reject unsafe images
- [ ] Update approval status
- [ ] Notify reviewers
- [ ] Log block reason

### T4: UI Components

- [ ] VIESafetyTagList component
- [ ] VIEScanButton component
- [ ] Integrate into review page

### T5: CI Enforcement

- [ ] Test for unsafe approved images
- [ ] Test for missing scans
- [ ] Fail build on violations

## Completion Definition

Phase 25 is complete when:

1. **VIE scans all images**: Every generated image is analyzed
2. **Labels stored**: Safety scores in database
3. **Harmful content blocked**: Auto-rejected with reason
4. **Reviewers have visibility**: Labels shown in admin UI
5. **No vendor terms**: All output sanitized
6. **CI tests passing**: No unsafe images in production

---

*Phase 25 - Visual Intelligence Engine Complete*
*Unite-Hub Status: VIE PROTECTION ACTIVE*
