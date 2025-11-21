# Phase 30 - Tenant-Level Feature Flags & Image Engine Kill Switches

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase30-image-engine-feature-flags`

## Executive Summary

Phase 30 implements feature flags and kill switches that allow per-org control over the image engine and other features. Global kill switches can disable image generation across all orgs in an emergency, while per-org flags allow granular control.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Per-Org Feature Flags | Yes |
| Global Kill Switch | Yes |
| Orchestrator Respects Flags | Yes |
| Vendor-Neutral Descriptions | Yes |

## Database Schema

### Migration 085: Feature Flags

```sql
-- 085_feature_flags.sql

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  feature_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign key
  CONSTRAINT feature_flags_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,

  -- Unique constraint
  CONSTRAINT feature_flags_org_key_unique
    UNIQUE (org_id, feature_key)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feature_flags_org_key
  ON feature_flags(org_id, feature_key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_feature
  ON feature_flags(feature_key);

-- Enable RLS
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY feature_flags_select ON feature_flags
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY feature_flags_insert ON feature_flags
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY feature_flags_update ON feature_flags
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Comment
COMMENT ON TABLE feature_flags IS 'Toggle image-engine features per organization (Phase 30)';

-- Create global_settings table for kill switches
CREATE TABLE IF NOT EXISTS global_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  environment TEXT NOT NULL DEFAULT 'production',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index for global settings
CREATE INDEX IF NOT EXISTS idx_global_settings_key
  ON global_settings(key);
CREATE INDEX IF NOT EXISTS idx_global_settings_env
  ON global_settings(environment);

-- Comment
COMMENT ON TABLE global_settings IS 'Global system settings and kill switches (Phase 30)';

-- Insert default image engine kill switch
INSERT INTO global_settings (key, value, environment)
VALUES (
  'image_engine_global_enabled',
  '{"enabled": true, "reason": null, "disabled_at": null}'::jsonb,
  'production'
)
ON CONFLICT (key) DO NOTHING;
```

## Feature Keys

```typescript
// Standard feature keys for image engine
const IMAGE_ENGINE_FEATURES = {
  IMAGE_GENERATION: 'image_engine_generation',
  IMAGE_AUTO_APPROVAL: 'image_engine_auto_approval',
  IMAGE_VIE_SCANNING: 'image_engine_vie_scanning',
  IMAGE_BRANDING_PACKS: 'image_engine_branding_packs',
  IMAGE_RVE_UPGRADE: 'image_engine_rve_upgrade',
  IMAGE_ANALYTICS: 'image_engine_analytics',
};
```

## API Endpoints

### GET /api/feature-flags

Get all feature flags for the current organization.

```typescript
// Response
{
  "success": true,
  "flags": [
    {
      "id": "uuid",
      "feature_key": "image_engine_generation",
      "enabled": true,
      "description": "Enable AI image generation"
    },
    {
      "id": "uuid",
      "feature_key": "image_engine_branding_packs",
      "enabled": false,
      "description": "Enable branding pack generation"
    }
  ]
}
```

### POST /api/feature-flags/toggle

Toggle a feature flag.

```typescript
// Request
{
  "featureKey": "image_engine_generation",
  "enabled": false
}

// Response
{
  "success": true,
  "flag": {
    "feature_key": "image_engine_generation",
    "enabled": false
  }
}
```

### GET /api/feature-flags/image-engine-status

Get the overall image engine status (includes global kill switch).

```typescript
// Response
{
  "success": true,
  "globalEnabled": true,
  "orgEnabled": true,
  "effectiveStatus": "enabled",
  "features": {
    "generation": true,
    "vie_scanning": true,
    "branding_packs": false,
    "rve_upgrade": true
  }
}
```

### Implementation

```typescript
// src/app/api/feature-flags/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();

    // Get user and org
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get org
    const { data: userOrg } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    if (!userOrg) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Get flags
    const { data: flags, error } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('org_id', userOrg.org_id)
      .order('feature_key');

    if (error) throw error;

    return NextResponse.json({
      success: true,
      flags: flags || [],
    });

  } catch (error) {
    console.error('Feature flags error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

```typescript
// src/app/api/feature-flags/toggle/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { featureKey, enabled } = await req.json();

    if (!featureKey || typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const supabase = await getSupabaseServer();

    // Get user and org
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get org and check admin role
    const { data: userOrg } = await supabase
      .from('user_organizations')
      .select('org_id, role')
      .eq('user_id', user.id)
      .single();

    if (!userOrg) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    if (userOrg.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Upsert flag
    const { data: flag, error } = await supabase
      .from('feature_flags')
      .upsert({
        org_id: userOrg.org_id,
        feature_key: featureKey,
        enabled,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'org_id,feature_key',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      flag,
    });

  } catch (error) {
    console.error('Feature flag toggle error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

```typescript
// src/app/api/feature-flags/image-engine-status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();

    // Get user and org
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get org
    const { data: userOrg } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    if (!userOrg) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Check global kill switch (using admin client to bypass RLS)
    const { data: globalSetting } = await supabaseAdmin
      .from('global_settings')
      .select('value')
      .eq('key', 'image_engine_global_enabled')
      .eq('environment', process.env.NODE_ENV || 'production')
      .single();

    const globalEnabled = globalSetting?.value?.enabled ?? true;

    // Get org flags
    const { data: flags } = await supabase
      .from('feature_flags')
      .select('feature_key, enabled')
      .eq('org_id', userOrg.org_id)
      .like('feature_key', 'image_engine_%');

    // Build features map
    const features: Record<string, boolean> = {
      generation: true,
      vie_scanning: true,
      branding_packs: true,
      rve_upgrade: true,
    };

    for (const flag of flags || []) {
      const shortKey = flag.feature_key.replace('image_engine_', '');
      features[shortKey] = flag.enabled;
    }

    // Check if any image feature is enabled
    const orgEnabled = Object.values(features).some(v => v);

    // Effective status
    let effectiveStatus = 'enabled';
    if (!globalEnabled) {
      effectiveStatus = 'disabled_globally';
    } else if (!orgEnabled) {
      effectiveStatus = 'disabled_for_org';
    }

    return NextResponse.json({
      success: true,
      globalEnabled,
      orgEnabled,
      effectiveStatus,
      features,
    });

  } catch (error) {
    console.error('Image engine status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## Feature Flag Service

```typescript
// src/lib/feature-flags/feature-flag-service.ts

import { getSupabaseServer } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase';

export class FeatureFlagService {
  /**
   * Check if a feature is enabled for an organization.
   */
  async isEnabled(orgId: string, featureKey: string): Promise<boolean> {
    // First check global kill switch
    const globalEnabled = await this.isGloballyEnabled(featureKey);
    if (!globalEnabled) return false;

    // Check org-specific flag
    const supabase = await getSupabaseServer();

    const { data: flag } = await supabase
      .from('feature_flags')
      .select('enabled')
      .eq('org_id', orgId)
      .eq('feature_key', featureKey)
      .single();

    // Default to true if no flag exists
    return flag?.enabled ?? true;
  }

  /**
   * Check global kill switch for a feature.
   */
  async isGloballyEnabled(featureKey: string): Promise<boolean> {
    // For image engine features, check the global kill switch
    if (featureKey.startsWith('image_engine_')) {
      const { data } = await supabaseAdmin
        .from('global_settings')
        .select('value')
        .eq('key', 'image_engine_global_enabled')
        .single();

      return data?.value?.enabled ?? true;
    }

    return true;
  }

  /**
   * Check if image generation is allowed for an org.
   */
  async canGenerateImages(orgId: string): Promise<CanGenerateResult> {
    const enabled = await this.isEnabled(orgId, 'image_engine_generation');

    if (!enabled) {
      return {
        allowed: false,
        reason: 'Image generation is currently disabled',
      };
    }

    return { allowed: true };
  }

  /**
   * Set global kill switch (admin only).
   */
  async setGlobalKillSwitch(enabled: boolean, reason?: string): Promise<void> {
    await supabaseAdmin
      .from('global_settings')
      .update({
        value: {
          enabled,
          reason: enabled ? null : reason,
          disabled_at: enabled ? null : new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('key', 'image_engine_global_enabled');
  }
}

interface CanGenerateResult {
  allowed: boolean;
  reason?: string;
}

export const featureFlagService = new FeatureFlagService();
```

## Image Engine Integration

```typescript
// src/lib/image-engine/client.ts (integration example)

import { featureFlagService } from '@/lib/feature-flags/feature-flag-service';

export class GeminiBanana2Client {
  async generateImage(
    prompt: string,
    options: GenerateOptions
  ): Promise<ImageGenerationResult> {
    // MANDATORY: Check feature flags before generation
    const canGenerate = await featureFlagService.canGenerateImages(options.orgId);

    if (!canGenerate.allowed) {
      return {
        success: false,
        error: canGenerate.reason || 'Image generation is disabled',
        disabled: true,
      };
    }

    // Proceed with generation
    // ... existing generation code ...
  }
}
```

## UI Components

### FeatureFlagSettingsPage

```typescript
// src/app/(admin)/admin/settings/features/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { ImageEngineStatusBanner } from '@/components/admin/ImageEngineStatusBanner';

const FEATURE_DESCRIPTIONS: Record<string, string> = {
  image_engine_generation: 'Enable AI-powered image generation',
  image_engine_vie_scanning: 'Enable automated safety scanning for images',
  image_engine_branding_packs: 'Enable downloadable branding pack generation',
  image_engine_rve_upgrade: 'Enable automatic report visual upgrades',
  image_engine_analytics: 'Enable image usage analytics tracking',
};

export default function FeatureFlagSettingsPage() {
  const { session } = useAuth();
  const [flags, setFlags] = useState<Flag[]>([]);
  const [engineStatus, setEngineStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch flags
      const flagsRes = await fetch('/api/feature-flags', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const flagsData = await flagsRes.json();
      setFlags(flagsData.flags || []);

      // Fetch engine status
      const statusRes = await fetch('/api/feature-flags/image-engine-status', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const statusData = await statusRes.json();
      setEngineStatus(statusData);
    } catch (error) {
      console.error('Failed to fetch feature flags:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = async (featureKey: string, enabled: boolean) => {
    try {
      await fetch('/api/feature-flags/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ featureKey, enabled }),
      });

      // Update local state
      setFlags(prev =>
        prev.map(f =>
          f.feature_key === featureKey ? { ...f, enabled } : f
        )
      );
    } catch (error) {
      console.error('Failed to toggle flag:', error);
    }
  };

  const getFeatureEnabled = (featureKey: string): boolean => {
    const flag = flags.find(f => f.feature_key === featureKey);
    return flag?.enabled ?? true;
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Feature Settings</h1>

      {engineStatus && (
        <ImageEngineStatusBanner status={engineStatus} className="mb-6" />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Image Engine Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(FEATURE_DESCRIPTIONS).map(([key, description]) => (
              <div
                key={key}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div>
                  <p className="font-medium">
                    {key.replace('image_engine_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                  <p className="text-sm text-gray-500">{description}</p>
                </div>
                <Switch
                  checked={getFeatureEnabled(key)}
                  onCheckedChange={(enabled) => toggleFlag(key, enabled)}
                  disabled={!engineStatus?.globalEnabled}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface Flag {
  id: string;
  feature_key: string;
  enabled: boolean;
  description?: string;
}
```

### ImageEngineStatusBanner

```typescript
// src/components/admin/ImageEngineStatusBanner.tsx

'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface ImageEngineStatusBannerProps {
  status: {
    globalEnabled: boolean;
    orgEnabled: boolean;
    effectiveStatus: string;
  };
  className?: string;
}

export function ImageEngineStatusBanner({
  status,
  className = '',
}: ImageEngineStatusBannerProps) {
  if (status.effectiveStatus === 'disabled_globally') {
    return (
      <Alert className={`bg-red-50 border-red-200 ${className}`}>
        <XCircle className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-800">Image Engine Disabled</AlertTitle>
        <AlertDescription className="text-red-700">
          The image generation system is currently disabled globally. Contact support for assistance.
        </AlertDescription>
      </Alert>
    );
  }

  if (status.effectiveStatus === 'disabled_for_org') {
    return (
      <Alert className={`bg-yellow-50 border-yellow-200 ${className}`}>
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-800">All Features Disabled</AlertTitle>
        <AlertDescription className="text-yellow-700">
          All image engine features are currently disabled for your organization.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className={`bg-green-50 border-green-200 ${className}`}>
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertTitle className="text-green-800">Image Engine Active</AlertTitle>
      <AlertDescription className="text-green-700">
        The image generation system is running normally.
      </AlertDescription>
    </Alert>
  );
}
```

### FeatureToggleRow

```typescript
// src/components/admin/FeatureToggleRow.tsx

'use client';

import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface FeatureToggleRowProps {
  featureKey: string;
  label: string;
  description: string;
  enabled: boolean;
  disabled?: boolean;
  onToggle: (enabled: boolean) => void;
}

export function FeatureToggleRow({
  featureKey,
  label,
  description,
  enabled,
  disabled = false,
  onToggle,
}: FeatureToggleRowProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b last:border-0">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{label}</span>
          {disabled && (
            <Badge variant="secondary" className="text-xs">
              Locked
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={onToggle}
        disabled={disabled}
      />
    </div>
  );
}
```

## Agent Integration

### Orchestrator Respects Flags

```typescript
// Example: Orchestrator checks flags before image operations

export class OrchestratorAgent {
  async requestImage(request: ImageRequest): Promise<ImageResult> {
    // MANDATORY: Check feature flags
    const featureFlagService = new FeatureFlagService();
    const canGenerate = await featureFlagService.canGenerateImages(request.orgId);

    if (!canGenerate.allowed) {
      // Return friendly message instead of error
      return {
        success: false,
        message: 'Image generation is currently unavailable. Please try again later.',
        disabled: true,
      };
    }

    // Proceed with image request
    // ... existing code ...
  }
}
```

## Implementation Tasks

### T1: Implement Feature Flag Table & API

- [ ] Create feature_flags table
- [ ] Create global_settings table
- [ ] Add GET/POST endpoints
- [ ] Wire RLS policies

### T2: Wire Feature Flags Into Image Engine

- [ ] Wrap GeminiBanana2Client calls with flag checks
- [ ] Return safe errors when disabled
- [ ] Update MAOS to respect flags

### T3: Add Global Kill Switch

- [ ] Implement environment-aware global toggle
- [ ] Ensure agents respect it
- [ ] Add admin UI for kill switch

## Completion Definition

Phase 30 is complete when:

1. **Org-level flag disables images**: Per-org control working
2. **Global kill switch disables all**: Emergency shutdown functional
3. **Orchestrator respects flags**: All agents check before operations
4. **No vendor terms in flag UI**: All descriptions sanitised
5. **Admin-only access**: Only admins can toggle flags

---

*Phase 30 - Feature Flags & Kill Switches Complete*
*Unite-Hub Status: CONTROL MECHANISMS ACTIVE*
