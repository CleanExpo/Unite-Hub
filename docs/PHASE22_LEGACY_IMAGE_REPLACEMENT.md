# Phase 22 - UNITE-HUB System-Wide Legacy Image Replacement

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase22-replace-legacy-image-logic`

## Executive Summary

Phase 22 removes all legacy static images from the codebase and replaces them with the DynamicImage component that fetches only approved images from the image approval system. This ensures all visuals pass through human approval before appearing in production.

## Hard Requirements

### Source of Truth

```typescript
ImageStorage.getApprovedImage(orgId, category, use_case)
```

All images MUST be retrieved through this single method. No exceptions.

### Visibility Rules

| Status | Visibility |
|--------|------------|
| `pending` | Internal only (admin dashboard) |
| `revised` | Internal only (admin dashboard) |
| `approved` | Allowed everywhere |
| `rejected` | Denied forever |

### Disallowed Patterns

```typescript
// BANNED - Direct static imports
import logo from '/public/assets/logo.png';
import icon from '@/public/images/icon.svg';

// BANNED - Static src attributes
<img src="/static/banner.jpg" />
<Image src="/public/assets/hero.png" />

// REQUIRED - DynamicImage component
<DynamicImage category="branding" useCase="logo" />
<DynamicImage category="dashboard" useCase="analytics-tile" />
```

## API Endpoints

### GET /api/internal/images/approved

Returns an approved image for the given category and use case.

```typescript
// Request
GET /api/internal/images/approved?category=dashboard&use_case=analytics-tile&org_id=uuid

// Response (success)
{
  "success": true,
  "image": {
    "id": "uuid",
    "file_path": "/data/clients/org-123/images/dashboard-analytics-tile.png",
    "file_name": "dashboard-analytics-tile.png",
    "category": "dashboard",
    "use_case": "analytics-tile",
    "status": "approved"
  }
}

// Response (no approved image)
{
  "success": false,
  "fallback": true,
  "image": {
    "file_path": "/assets/fallbacks/dashboard-default.png"
  }
}
```

### GET /api/internal/images/fallback

Returns a category fallback image.

```typescript
// Request
GET /api/internal/images/fallback?category=dashboard

// Response
{
  "success": true,
  "image": {
    "file_path": "/assets/fallbacks/dashboard-default.png",
    "is_fallback": true
  }
}
```

### Implementation

```typescript
// src/app/api/internal/images/approved/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const useCase = searchParams.get('use_case');
  const orgId = searchParams.get('org_id');

  if (!category || !orgId) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  const supabase = await getSupabaseServer();

  // Only return approved images
  let query = supabase
    .from('image_approvals')
    .select('*')
    .eq('org_id', orgId)
    .eq('category', category)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(1);

  if (useCase) {
    query = query.eq('use_case', useCase);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    // Return fallback
    return NextResponse.json({
      success: false,
      fallback: true,
      image: {
        file_path: `/assets/fallbacks/${category}-default.png`,
        is_fallback: true,
      },
    });
  }

  return NextResponse.json({
    success: true,
    image: data[0],
  });
}
```

## Components

### DynamicImage Component

```typescript
// src/components/ui/DynamicImage.tsx

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizePublicText } from '@/lib/utils/sanitize';

interface DynamicImageProps {
  category: string;
  useCase: string;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  fallbackSrc?: string;
}

export function DynamicImage({
  category,
  useCase,
  alt = 'Image',
  className = '',
  width = 400,
  height = 300,
  priority = false,
  fallbackSrc,
}: DynamicImageProps) {
  const { session, currentOrganization } = useAuth();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchImage() {
      if (!currentOrganization?.org_id) {
        setLoading(false);
        return;
      }

      try {
        const params = new URLSearchParams({
          category,
          use_case: useCase,
          org_id: currentOrganization.org_id,
        });

        const response = await fetch(`/api/internal/images/approved?${params}`, {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        });

        const data = await response.json();

        if (data.success && data.image) {
          setImageSrc(data.image.file_path);
        } else if (data.fallback && data.image) {
          setImageSrc(data.image.file_path);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Failed to fetch dynamic image:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchImage();
  }, [category, useCase, currentOrganization, session]);

  // Sanitize alt text
  const sanitizedAlt = sanitizePublicText(alt);

  if (loading) {
    return (
      <div
        className={`animate-pulse bg-gray-200 ${className}`}
        style={{ width, height }}
      />
    );
  }

  if (error || !imageSrc) {
    const fallback = fallbackSrc || `/assets/fallbacks/${category}-default.png`;
    return (
      <Image
        src={fallback}
        alt={sanitizedAlt}
        width={width}
        height={height}
        className={className}
        priority={priority}
      />
    );
  }

  return (
    <Image
      src={imageSrc}
      alt={sanitizedAlt}
      width={width}
      height={height}
      className={className}
      priority={priority}
    />
  );
}
```

### FallbackImage Component

```typescript
// src/components/ui/FallbackImage.tsx

import Image from 'next/image';
import { sanitizePublicText } from '@/lib/utils/sanitize';

interface FallbackImageProps {
  category: string;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
}

export function FallbackImage({
  category,
  alt = 'Fallback image',
  className = '',
  width = 400,
  height = 300,
}: FallbackImageProps) {
  const sanitizedAlt = sanitizePublicText(alt);
  const src = `/assets/fallbacks/${category}-default.png`;

  return (
    <Image
      src={src}
      alt={sanitizedAlt}
      width={width}
      height={height}
      className={className}
    />
  );
}
```

### Sanitization Utility

```typescript
// src/lib/utils/sanitize.ts

const BANNED_PUBLIC_TERMS = [
  'Gemini',
  'Google',
  'Nano Banana',
  'Claude',
  'Anthropic',
  'OpenAI',
  'GPT',
  'Midjourney',
  'Stable Diffusion',
  'Jina',
  'DALL-E',
  'AI-generated',
];

export function sanitizePublicText(text: string): string {
  let sanitized = text;

  for (const term of BANNED_PUBLIC_TERMS) {
    const regex = new RegExp(term, 'gi');
    sanitized = sanitized.replace(regex, 'custom');
  }

  return sanitized;
}

export function containsBannedTerms(text: string): boolean {
  const lowerText = text.toLowerCase();
  return BANNED_PUBLIC_TERMS.some(term =>
    lowerText.includes(term.toLowerCase())
  );
}
```

## ImageStorage Service

```typescript
// src/lib/services/image/imageStorage.ts

import { getSupabaseServer } from '@/lib/supabase';

export class ImageStorage {
  /**
   * Get an approved image for a category and use case.
   * Returns null if no approved image exists.
   */
  static async getApprovedImage(
    orgId: string,
    category: string,
    useCase?: string
  ): Promise<ImageApproval | null> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('image_approvals')
      .select('*')
      .eq('org_id', orgId)
      .eq('category', category)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(1);

    if (useCase) {
      query = query.eq('use_case', useCase);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return null;
    }

    return data[0];
  }

  /**
   * Get fallback image path for a category.
   */
  static getFallbackPath(category: string): string {
    return `/assets/fallbacks/${category}-default.png`;
  }

  /**
   * Check if an image is approved.
   */
  static async isApproved(imageId: string): Promise<boolean> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('image_approvals')
      .select('status')
      .eq('id', imageId)
      .single();

    return data?.status === 'approved';
  }
}

interface ImageApproval {
  id: string;
  org_id: string;
  category: string;
  use_case: string;
  file_path: string;
  file_name: string;
  status: 'pending' | 'revised' | 'approved' | 'rejected';
  created_at: string;
}
```

## Implementation Tasks

### T1: Audit Codebase for Legacy Image Usage

```bash
# Find all static image imports
grep -r "from.*['\"].*\.(png|jpg|jpeg|svg|gif)['\"]" src/ --include="*.tsx" --include="*.ts"

# Find all static src attributes
grep -r "src=['\"]/(public|static|assets)" src/ --include="*.tsx"

# Find all Image imports with static paths
grep -r "<Image.*src=['\"]/" src/ --include="*.tsx"
```

Expected replacements:
- Dashboard tiles
- Sidebar icons
- User avatars
- Email headers
- Onboarding illustrations
- Status indicators
- Branding assets

### T2: Build DynamicImage Component

- [ ] Create `src/components/ui/DynamicImage.tsx`
- [ ] Create `src/components/ui/FallbackImage.tsx`
- [ ] Create `src/lib/utils/sanitize.ts`
- [ ] Add loading skeleton
- [ ] Add error fallback
- [ ] Implement banned term sanitization

### T3: Replace Images in Dashboard

Replace in these components:
- [ ] `src/app/(staff)/staff/page.tsx` - Dashboard overview
- [ ] `src/components/dashboard/HealthScoreWidget.tsx`
- [ ] `src/components/dashboard/MetricCards.tsx`
- [ ] `src/components/HotLeadsPanel.tsx`
- [ ] Sidebar navigation icons
- [ ] Status indicators

Example replacement:
```typescript
// Before
<Image src="/assets/icons/analytics.svg" alt="Analytics" />

// After
<DynamicImage category="icons" useCase="analytics" alt="Analytics" />
```

### T4: Replace Images in Onboarding Wizard

Replace in:
- [ ] `src/app/(auth)/onboarding/page.tsx`
- [ ] Step illustrations
- [ ] Progress indicators
- [ ] Welcome banners

### T5: Replace Images in Emails & Notifications

Check and replace in:
- [ ] Email templates (MJML/HTML)
- [ ] Notification components
- [ ] PDF report headers

For emails, use absolute URLs to approved images:
```html
<!-- Before -->
<img src="https://unite-hub.com/static/email-header.png" />

<!-- After - Dynamic URL from approved images -->
<img src="{{approved_image_url}}" />
```

### T6: CI Enforcement

Add tests to prevent regression:

```typescript
// tests/ci/no-static-images.test.ts

import { execSync } from 'child_process';

describe('No Static Images', () => {
  it('should have no direct static image imports', () => {
    const result = execSync(
      'grep -r "from.*[\'\\"].*\\.(png|jpg|jpeg|svg|gif)[\'\\"]" src/ --include="*.tsx" --include="*.ts" || true',
      { encoding: 'utf-8' }
    );

    expect(result.trim()).toBe('');
  });

  it('should have no static src paths', () => {
    const result = execSync(
      'grep -r "src=[\'\\"]/(public|static)" src/ --include="*.tsx" || true',
      { encoding: 'utf-8' }
    );

    expect(result.trim()).toBe('');
  });
});

// tests/ci/no-banned-terms.test.ts

import { containsBannedTerms } from '@/lib/utils/sanitize';

describe('No Banned Terms', () => {
  it('should not contain banned terms in public strings', () => {
    const publicStrings = [
      // Collect all public-facing strings
    ];

    for (const str of publicStrings) {
      expect(containsBannedTerms(str)).toBe(false);
    }
  });
});
```

## Fallback Image Structure

Create default fallback images:

```
public/assets/fallbacks/
├── branding-default.png
├── dashboard-default.png
├── icons-default.png
├── onboarding-default.png
├── email-default.png
├── social-default.png
├── report-default.png
└── avatar-default.png
```

## Security

### Middleware

```typescript
// src/middleware/image-status-guard.ts

export function imageStatusGuard(status: string): boolean {
  // Only approved images can be returned publicly
  return status === 'approved';
}
```

### Access Control

- No client-facing component may import a static image
- All visuals must use the DynamicImage component
- Pending/revised images ONLY visible in admin dashboard
- Rejected images NEVER accessible

## Testing Requirements

```typescript
// tests/e2e/dynamic-images.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Dynamic Images', () => {
  test('should render approved images only', async ({ page }) => {
    await page.goto('/dashboard');

    // Check that images loaded
    const images = await page.locator('img[data-dynamic="true"]').all();

    for (const img of images) {
      const src = await img.getAttribute('src');
      // Should not be a static path
      expect(src).not.toMatch(/^\/(public|static|assets)/);
    }
  });

  test('should show fallback when no approved image', async ({ page }) => {
    // Navigate to dashboard with no approved images
    await page.goto('/dashboard');

    const fallbackImages = await page.locator('img[data-fallback="true"]').count();
    expect(fallbackImages).toBeGreaterThan(0);
  });

  test('should sanitize alt text', async ({ page }) => {
    await page.goto('/dashboard');

    const images = await page.locator('img').all();

    for (const img of images) {
      const alt = await img.getAttribute('alt');
      if (alt) {
        expect(alt.toLowerCase()).not.toContain('gemini');
        expect(alt.toLowerCase()).not.toContain('google');
        expect(alt.toLowerCase()).not.toContain('openai');
      }
    }
  });
});
```

## Completion Definition

Phase 22 is complete when:

1. **Zero legacy images**: No direct static image imports in codebase
2. **DynamicImage everywhere**: All visuals use DynamicImage component
3. **Approval gate enforced**: Only status='approved' images returned publicly
4. **Fallbacks working**: Missing images show category fallback
5. **Sanitization active**: All alt text and labels sanitized
6. **CI tests passing**: Build fails if static images detected

## Next Phase Preview

### Phase 23: MAOS Orchestrator Training & Image Engine Integration

- Teach Orchestrator to request images
- Implement approval wait loop
- Add MAOS skills for image management
- Audit logging for orchestrator actions

---

*Phase 22 - Legacy Image Replacement Complete*
*Unite-Hub Status: DYNAMIC IMAGES ONLY*
