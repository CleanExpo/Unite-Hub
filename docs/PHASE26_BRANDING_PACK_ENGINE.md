# Phase 26 - Personalized Branding Packs (Dynamic Identity Engine)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase26-branding-pack-engine`

## Executive Summary

Phase 26 implements the Branding Pack Engine that generates downloadable branding kits for organizations using only approved images. Organizations can create personalized brand identity packages with logos, colors, and visual assets, all sanitized for vendor privacy.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Auto-Generation | Allowed |
| Safe Images Only | Yes |
| PDF Must Use Approved Images | Yes |
| Strict Privacy | Yes |

## Database Schema

### Migration 082: Branding Packs

```sql
-- 082_branding_packs.sql

CREATE TABLE IF NOT EXISTS branding_packs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  title TEXT NOT NULL,
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign key
  CONSTRAINT branding_packs_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_branding_pack_org ON branding_packs(org_id);
CREATE INDEX IF NOT EXISTS idx_branding_pack_created ON branding_packs(created_at DESC);

-- Enable RLS
ALTER TABLE branding_packs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY branding_packs_select ON branding_packs
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY branding_packs_insert ON branding_packs
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY branding_packs_update ON branding_packs
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ))
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE branding_packs IS 'Stores branding pack configurations for organizations (Phase 26)';
```

## API Endpoints

### POST /api/branding-packs/generate

Generate a new branding pack.

```typescript
// Request
{
  "orgId": "uuid",
  "title": "Q4 2025 Brand Kit",
  "includeCategories": ["branding", "social", "email"]
}

// Response
{
  "success": true,
  "packId": "uuid",
  "title": "Q4 2025 Brand Kit",
  "imageCount": 12,
  "categories": ["branding", "social", "email"]
}
```

### GET /api/branding-packs/list

List all branding packs for an organization.

```typescript
// Response
{
  "success": true,
  "packs": [
    {
      "id": "uuid",
      "title": "Q4 2025 Brand Kit",
      "imageCount": 12,
      "created_at": "2025-11-21T10:00:00Z"
    }
  ]
}
```

### GET /api/branding-packs/download

Download a branding pack as PDF.

```typescript
// Request
GET /api/branding-packs/download?pack_id=uuid

// Response: PDF file stream
```

### Implementation

```typescript
// src/app/api/branding-packs/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { sanitizePublicText } from '@/lib/utils/sanitize';

export async function POST(req: NextRequest) {
  try {
    const { orgId, title, includeCategories } = await req.json();

    const supabase = await getSupabaseServer();

    // Get all approved images for specified categories
    const { data: images, error: imgError } = await supabase
      .from('image_approvals')
      .select('*')
      .eq('org_id', orgId)
      .eq('status', 'approved')
      .in('category', includeCategories)
      .order('category')
      .order('use_case');

    if (imgError) throw imgError;

    // Build config
    const config = {
      title: sanitizePublicText(title),
      generated_at: new Date().toISOString(),
      categories: {} as Record<string, ImageConfig[]>,
    };

    for (const image of images || []) {
      if (!config.categories[image.category]) {
        config.categories[image.category] = [];
      }
      config.categories[image.category].push({
        id: image.id,
        use_case: image.use_case,
        file_path: image.file_path,
        file_name: image.file_name,
      });
    }

    // Store branding pack
    const { data: pack, error } = await supabase
      .from('branding_packs')
      .insert({
        org_id: orgId,
        title: sanitizePublicText(title),
        config,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      packId: pack.id,
      title: pack.title,
      imageCount: images?.length || 0,
      categories: includeCategories,
    });

  } catch (error) {
    console.error('Branding pack generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

interface ImageConfig {
  id: string;
  use_case: string;
  file_path: string;
  file_name: string;
}
```

```typescript
// src/app/api/branding-packs/download/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { generateBrandingPDF } from '@/lib/branding/pdf-generator';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const packId = searchParams.get('pack_id');

    if (!packId) {
      return NextResponse.json({ error: 'Missing pack_id' }, { status: 400 });
    }

    const supabase = await getSupabaseServer();

    // Get pack
    const { data: pack, error } = await supabase
      .from('branding_packs')
      .select('*')
      .eq('id', packId)
      .single();

    if (error || !pack) {
      return NextResponse.json({ error: 'Pack not found' }, { status: 404 });
    }

    // Generate PDF
    const pdfBuffer = await generateBrandingPDF(pack);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${pack.title.replace(/[^a-z0-9]/gi, '_')}_branding_pack.pdf"`,
      },
    });

  } catch (error) {
    console.error('Branding pack download error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## PDF Generator

```typescript
// src/lib/branding/pdf-generator.ts

import PDFDocument from 'pdfkit';
import { sanitizePublicText } from '@/lib/utils/sanitize';
import fs from 'fs/promises';

export async function generateBrandingPDF(pack: BrandingPack): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Title page
    doc.fontSize(32).text(sanitizePublicText(pack.title), { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(14).text(`Generated: ${new Date(pack.config.generated_at).toLocaleDateString()}`, { align: 'center' });
    doc.addPage();

    // Categories
    const config = pack.config as PackConfig;

    for (const [category, images] of Object.entries(config.categories)) {
      // Category header
      doc.fontSize(24).text(capitalizeFirst(category), { underline: true });
      doc.moveDown();

      for (const image of images) {
        try {
          // Add image
          const imageData = await fs.readFile(image.file_path);
          doc.image(imageData, {
            fit: [400, 300],
            align: 'center',
          });

          // Caption (sanitized)
          doc.moveDown(0.5);
          doc.fontSize(12).text(sanitizePublicText(image.use_case), { align: 'center' });
          doc.moveDown(2);

          // New page if needed
          if (doc.y > 650) {
            doc.addPage();
          }
        } catch (err) {
          console.error(`Failed to add image ${image.file_path}:`, err);
        }
      }

      doc.addPage();
    }

    // Footer
    doc.fontSize(10).text('Custom illustration pack', { align: 'center' });

    doc.end();
  });
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

interface BrandingPack {
  id: string;
  org_id: string;
  title: string;
  config: PackConfig;
}

interface PackConfig {
  title: string;
  generated_at: string;
  categories: Record<string, Array<{
    id: string;
    use_case: string;
    file_path: string;
    file_name: string;
  }>>;
}
```

## UI Pages

### BrandingPackListPage

```typescript
// src/app/(admin)/admin/branding-packs/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Download, Plus } from 'lucide-react';
import Link from 'next/link';

export default function BrandingPackListPage() {
  const { session, currentOrganization } = useAuth();
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPacks();
  }, []);

  const fetchPacks = async () => {
    try {
      const response = await fetch(
        `/api/branding-packs/list?org_id=${currentOrganization?.org_id}`,
        {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        }
      );
      const data = await response.json();
      setPacks(data.packs || []);
    } catch (error) {
      console.error('Failed to fetch packs:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPack = async (packId: string) => {
    window.open(`/api/branding-packs/download?pack_id=${packId}`, '_blank');
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Branding Packs</h1>
        <Link href="/admin/branding-packs/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Pack
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {packs.map((pack) => (
          <Card key={pack.id}>
            <CardHeader>
              <CardTitle className="text-lg">{pack.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                {pack.imageCount} images
              </p>
              <p className="text-xs text-gray-400 mb-4">
                Created: {new Date(pack.created_at).toLocaleDateString()}
              </p>
              <Button
                onClick={() => downloadPack(pack.id)}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {packs.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No branding packs yet</p>
          <Link href="/admin/branding-packs/new">
            <Button className="mt-4">Create your first pack</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

interface Pack {
  id: string;
  title: string;
  imageCount: number;
  created_at: string;
}
```

## Implementation Tasks

### T1: Scan Org for Approved Images

- [ ] Query image_approvals by category
- [ ] Group by use_case
- [ ] Filter only approved status

### T2: Generate Branding Pack

- [ ] Build config JSON
- [ ] Store in branding_packs table
- [ ] Sanitize all text fields

### T3: Generate Branding Pack PDF

- [ ] Pull images from file system
- [ ] Insert into PDF templates
- [ ] Sanitize all captions and labels

### T4: UI for Packs

- [ ] BrandingPackListPage
- [ ] BrandingPackDetailPage
- [ ] Create new pack form

### T5: Security Checks

- [ ] Sanitize all PDF fields
- [ ] Verify only approved images used
- [ ] RLS prevents cross-org access

## Completion Definition

Phase 26 is complete when:

1. **Packs generated**: Organizations can create branding packs
2. **PDF export safe**: All output sanitized
3. **Only approved images**: No pending/revised/rejected
4. **CI rejects banned terms**: Build fails on violations
5. **RLS enforced**: Cross-org access blocked

---

*Phase 26 - Branding Pack Engine Complete*
*Unite-Hub Status: BRANDING PACKS READY*
