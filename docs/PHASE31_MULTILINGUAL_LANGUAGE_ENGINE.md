# Phase 31 - Multilingual Preference & Language Engine

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase31-multilingual-engine`

## Executive Summary

Phase 31 implements the Multilingual Language Engine that enables per-organization and per-user language preferences. This foundation supports UI language, content language, and voice language settings that will be used by subsequent voice and chatbot phases.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Per-User Language Support | Yes |
| Per-Org Default Language | Yes |
| Language Selection UI | Yes |
| Vendor-Neutral Labels | Yes |
| Deep Agent Allowed | Yes |
| Image Engine Exclusion | Yes |

## Supported Locales

```typescript
const SUPPORTED_LOCALES = [
  'en-AU', // English (Australia) - Default
  'en-US', // English (US)
  'en-GB', // English (UK)
  'fr-FR', // French
  'de-DE', // German
  'es-ES', // Spanish
  'pt-BR', // Portuguese (Brazil)
  'it-IT', // Italian
  'nl-NL', // Dutch
  'pl-PL', // Polish
  'cs-CZ', // Czech
  'ja-JP', // Japanese
  'ko-KR', // Korean
  'zh-CN', // Chinese (Simplified)
  'hi-IN', // Hindi
];
```

## Database Schema

### Migration 086: Language Settings

```sql
-- 086_language_settings.sql

-- Create helper function for updated_at if not exists
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Organization language settings
CREATE TABLE IF NOT EXISTS org_language_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  default_ui_language TEXT NOT NULL DEFAULT 'en-AU',
  default_content_language TEXT NOT NULL DEFAULT 'en-AU',
  default_voice_language TEXT NOT NULL DEFAULT 'en-AU',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign key
  CONSTRAINT org_language_settings_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,

  -- Unique constraint
  CONSTRAINT org_language_settings_org_unique UNIQUE (org_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_org_language_org_id
  ON org_language_settings(org_id);

-- Enable RLS
ALTER TABLE org_language_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY org_language_settings_select ON org_language_settings
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY org_language_settings_insert ON org_language_settings
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  ));

CREATE POLICY org_language_settings_update ON org_language_settings
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  ))
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  ));

-- Trigger for updated_at
CREATE TRIGGER trg_org_language_updated_at
  BEFORE UPDATE ON org_language_settings
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();

-- Comment
COMMENT ON TABLE org_language_settings IS 'Store default language preferences at organisation level (Phase 31)';

-- User language settings
CREATE TABLE IF NOT EXISTS user_language_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,
  ui_language TEXT NOT NULL DEFAULT 'en-AU',
  content_language TEXT NOT NULL DEFAULT 'en-AU',
  voice_language TEXT NOT NULL DEFAULT 'en-AU',
  preferred_voice_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign keys
  CONSTRAINT user_language_settings_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT user_language_settings_user_fk
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Unique constraint
  CONSTRAINT user_language_settings_org_user_unique UNIQUE (org_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_language_org_user
  ON user_language_settings(org_id, user_id);

-- Enable RLS
ALTER TABLE user_language_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY user_language_settings_select ON user_language_settings
  FOR SELECT TO authenticated
  USING (
    org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    AND user_id = auth.uid()
  );

CREATE POLICY user_language_settings_insert ON user_language_settings
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    AND user_id = auth.uid()
  );

CREATE POLICY user_language_settings_update ON user_language_settings
  FOR UPDATE TO authenticated
  USING (
    org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    AND user_id = auth.uid()
  )
  WITH CHECK (
    org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    AND user_id = auth.uid()
  );

-- Trigger for updated_at
CREATE TRIGGER trg_user_language_updated_at
  BEFORE UPDATE ON user_language_settings
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();

-- Comment
COMMENT ON TABLE user_language_settings IS 'Store per-user language and voice preferences (Phase 31)';
```

## API Endpoints

### GET /api/i18n/settings

Get effective language settings for the current user.

```typescript
// Response
{
  "success": true,
  "effective": {
    "uiLanguage": "en-AU",
    "contentLanguage": "en-AU",
    "voiceLanguage": "en-AU",
    "preferredVoiceId": null
  },
  "source": {
    "uiLanguage": "user",
    "contentLanguage": "org",
    "voiceLanguage": "browser"
  },
  "org": {
    "defaultUiLanguage": "en-AU",
    "defaultContentLanguage": "en-AU",
    "defaultVoiceLanguage": "en-AU"
  },
  "user": {
    "uiLanguage": "en-AU",
    "contentLanguage": null,
    "voiceLanguage": null
  }
}
```

### POST /api/i18n/org-settings

Update organization language defaults (Admin/Manager only).

```typescript
// Request
{
  "defaultUiLanguage": "en-AU",
  "defaultContentLanguage": "en-AU",
  "defaultVoiceLanguage": "en-AU"
}

// Response
{
  "success": true,
  "settings": {
    "defaultUiLanguage": "en-AU",
    "defaultContentLanguage": "en-AU",
    "defaultVoiceLanguage": "en-AU"
  }
}
```

### POST /api/i18n/user-settings

Update user language preferences.

```typescript
// Request
{
  "uiLanguage": "fr-FR",
  "contentLanguage": "fr-FR",
  "voiceLanguage": "fr-FR",
  "preferredVoiceId": "voice_abc123"
}

// Response
{
  "success": true,
  "settings": {
    "uiLanguage": "fr-FR",
    "contentLanguage": "fr-FR",
    "voiceLanguage": "fr-FR",
    "preferredVoiceId": "voice_abc123"
  }
}
```

### Implementation

```typescript
// src/app/api/i18n/settings/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { LanguageService } from '@/lib/i18n/language-service';

export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();

    // Get user
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

    // Get browser language from header
    const browserLanguage = req.headers.get('accept-language')?.split(',')[0] || 'en-AU';

    // Get org settings
    const { data: orgSettings } = await supabase
      .from('org_language_settings')
      .select('*')
      .eq('org_id', userOrg.org_id)
      .single();

    // Get user settings
    const { data: userSettings } = await supabase
      .from('user_language_settings')
      .select('*')
      .eq('org_id', userOrg.org_id)
      .eq('user_id', user.id)
      .single();

    // Resolve effective language using priority order
    const languageService = new LanguageService();
    const effective = languageService.resolveEffective(
      userSettings,
      orgSettings,
      browserLanguage
    );

    return NextResponse.json({
      success: true,
      effective,
      source: {
        uiLanguage: userSettings?.ui_language ? 'user' : orgSettings?.default_ui_language ? 'org' : 'browser',
        contentLanguage: userSettings?.content_language ? 'user' : orgSettings?.default_content_language ? 'org' : 'browser',
        voiceLanguage: userSettings?.voice_language ? 'user' : orgSettings?.default_voice_language ? 'org' : 'browser',
      },
      org: orgSettings ? {
        defaultUiLanguage: orgSettings.default_ui_language,
        defaultContentLanguage: orgSettings.default_content_language,
        defaultVoiceLanguage: orgSettings.default_voice_language,
      } : null,
      user: userSettings ? {
        uiLanguage: userSettings.ui_language,
        contentLanguage: userSettings.content_language,
        voiceLanguage: userSettings.voice_language,
        preferredVoiceId: userSettings.preferred_voice_id,
      } : null,
    });

  } catch (error) {
    console.error('i18n settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

```typescript
// src/app/api/i18n/org-settings/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { defaultUiLanguage, defaultContentLanguage, defaultVoiceLanguage } = await req.json();

    const supabase = await getSupabaseServer();

    // Get user and check role
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userOrg } = await supabase
      .from('user_organizations')
      .select('org_id, role')
      .eq('user_id', user.id)
      .single();

    if (!userOrg) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    if (!['admin', 'manager'].includes(userOrg.role)) {
      return NextResponse.json({ error: 'Admin or Manager access required' }, { status: 403 });
    }

    // Upsert org settings
    const { data, error } = await supabase
      .from('org_language_settings')
      .upsert({
        org_id: userOrg.org_id,
        default_ui_language: defaultUiLanguage || 'en-AU',
        default_content_language: defaultContentLanguage || 'en-AU',
        default_voice_language: defaultVoiceLanguage || 'en-AU',
      }, {
        onConflict: 'org_id',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      settings: {
        defaultUiLanguage: data.default_ui_language,
        defaultContentLanguage: data.default_content_language,
        defaultVoiceLanguage: data.default_voice_language,
      },
    });

  } catch (error) {
    console.error('Org i18n settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

```typescript
// src/app/api/i18n/user-settings/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { uiLanguage, contentLanguage, voiceLanguage, preferredVoiceId } = await req.json();

    const supabase = await getSupabaseServer();

    // Get user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userOrg } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    if (!userOrg) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Upsert user settings
    const { data, error } = await supabase
      .from('user_language_settings')
      .upsert({
        org_id: userOrg.org_id,
        user_id: user.id,
        ui_language: uiLanguage || 'en-AU',
        content_language: contentLanguage || 'en-AU',
        voice_language: voiceLanguage || 'en-AU',
        preferred_voice_id: preferredVoiceId || null,
      }, {
        onConflict: 'org_id,user_id',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      settings: {
        uiLanguage: data.ui_language,
        contentLanguage: data.content_language,
        voiceLanguage: data.voice_language,
        preferredVoiceId: data.preferred_voice_id,
      },
    });

  } catch (error) {
    console.error('User i18n settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## Language Service

```typescript
// src/lib/i18n/language-service.ts

const SUPPORTED_LOCALES = [
  'en-AU', 'en-US', 'en-GB', 'fr-FR', 'de-DE', 'es-ES',
  'pt-BR', 'it-IT', 'nl-NL', 'pl-PL', 'cs-CZ',
  'ja-JP', 'ko-KR', 'zh-CN', 'hi-IN',
];

export class LanguageService {
  /**
   * Resolve effective language using priority order:
   * 1. User preference
   * 2. Org default
   * 3. Browser accept-language
   * 4. System default (en-AU)
   */
  resolveEffective(
    userSettings: any,
    orgSettings: any,
    browserLanguage: string
  ): EffectiveLanguage {
    const normalizedBrowser = this.normalizeLocale(browserLanguage);

    return {
      uiLanguage: this.resolve([
        userSettings?.ui_language,
        orgSettings?.default_ui_language,
        normalizedBrowser,
        'en-AU',
      ]),
      contentLanguage: this.resolve([
        userSettings?.content_language,
        orgSettings?.default_content_language,
        normalizedBrowser,
        'en-AU',
      ]),
      voiceLanguage: this.resolve([
        userSettings?.voice_language,
        orgSettings?.default_voice_language,
        normalizedBrowser,
        'en-AU',
      ]),
      preferredVoiceId: userSettings?.preferred_voice_id || null,
    };
  }

  private resolve(candidates: (string | null | undefined)[]): string {
    for (const candidate of candidates) {
      if (candidate && this.isSupported(candidate)) {
        return candidate;
      }
    }
    return 'en-AU';
  }

  private isSupported(locale: string): boolean {
    return SUPPORTED_LOCALES.includes(locale);
  }

  private normalizeLocale(locale: string): string {
    // Convert browser locale (e.g., "en-AU,en;q=0.9") to supported format
    const primary = locale.split(',')[0].trim();

    // Try exact match
    if (this.isSupported(primary)) {
      return primary;
    }

    // Try language code match (e.g., "en" -> "en-AU")
    const langCode = primary.split('-')[0];
    const match = SUPPORTED_LOCALES.find(l => l.startsWith(langCode));
    return match || 'en-AU';
  }

  /**
   * Get display name for a locale (vendor-neutral).
   */
  getDisplayName(locale: string): string {
    const names: Record<string, string> = {
      'en-AU': 'English (Australia)',
      'en-US': 'English (US)',
      'en-GB': 'English (UK)',
      'fr-FR': 'French',
      'de-DE': 'German',
      'es-ES': 'Spanish',
      'pt-BR': 'Portuguese (Brazil)',
      'it-IT': 'Italian',
      'nl-NL': 'Dutch',
      'pl-PL': 'Polish',
      'cs-CZ': 'Czech',
      'ja-JP': 'Japanese',
      'ko-KR': 'Korean',
      'zh-CN': 'Chinese (Simplified)',
      'hi-IN': 'Hindi',
    };
    return names[locale] || locale;
  }
}

interface EffectiveLanguage {
  uiLanguage: string;
  contentLanguage: string;
  voiceLanguage: string;
  preferredVoiceId: string | null;
}

export { SUPPORTED_LOCALES };
```

## UI Components

### LanguageSelector

```typescript
// src/components/i18n/LanguageSelector.tsx

'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SUPPORTED_LOCALES, LanguageService } from '@/lib/i18n/language-service';

interface LanguageSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
}

export function LanguageSelector({
  value,
  onChange,
  label,
  disabled = false,
}: LanguageSelectorProps) {
  const languageService = new LanguageService();

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_LOCALES.map((locale) => (
            <SelectItem key={locale} value={locale}>
              {languageService.getDisplayName(locale)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

### I18nUserPreferencesPage

```typescript
// src/app/(dashboard)/dashboard/settings/language/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LanguageSelector } from '@/components/i18n/LanguageSelector';
import { useAuth } from '@/contexts/AuthContext';
import { Save } from 'lucide-react';

export default function I18nUserPreferencesPage() {
  const { session } = useAuth();
  const [settings, setSettings] = useState({
    uiLanguage: 'en-AU',
    contentLanguage: 'en-AU',
    voiceLanguage: 'en-AU',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/i18n/settings', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const data = await response.json();

      if (data.user) {
        setSettings({
          uiLanguage: data.user.uiLanguage || data.effective.uiLanguage,
          contentLanguage: data.user.contentLanguage || data.effective.contentLanguage,
          voiceLanguage: data.user.voiceLanguage || data.effective.voiceLanguage,
        });
      } else {
        setSettings({
          uiLanguage: data.effective.uiLanguage,
          contentLanguage: data.effective.contentLanguage,
          voiceLanguage: data.effective.voiceLanguage,
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/i18n/user-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Language Preferences</h1>

      <Card>
        <CardHeader>
          <CardTitle>Your Language Settings</CardTitle>
          <CardDescription>
            Choose your preferred languages for the interface, content, and voice.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <LanguageSelector
            label="Interface Language"
            value={settings.uiLanguage}
            onChange={(value) => setSettings({ ...settings, uiLanguage: value })}
          />

          <LanguageSelector
            label="Content Language"
            value={settings.contentLanguage}
            onChange={(value) => setSettings({ ...settings, contentLanguage: value })}
          />

          <LanguageSelector
            label="Voice Language"
            value={settings.voiceLanguage}
            onChange={(value) => setSettings({ ...settings, voiceLanguage: value })}
          />

          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Preferences'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Implementation Tasks

### T1: Create Language Settings Tables and RLS

- [ ] Implement migration for org_language_settings
- [ ] Implement migration for user_language_settings
- [ ] Add RLS policies for org + user isolation
- [ ] Add updated_at triggers

### T2: Implement i18n Settings API

- [ ] GET /api/i18n/settings - return effective language
- [ ] POST /api/i18n/org-settings - Admin/Manager set org defaults
- [ ] POST /api/i18n/user-settings - users set personal preferences

### T3: Implement Language Selector UI

- [ ] Add org-level language settings page under Admin settings
- [ ] Add user-level language preferences page under profile
- [ ] Create LanguageSelector component

## Completion Definition

Phase 31 is complete when:

1. **Org settings working**: Admins can set organization language defaults
2. **User settings working**: Users can override with personal preferences
3. **Effective resolution working**: API returns correct language based on priority
4. **RLS enforced**: Users cannot access other users' settings
5. **Vendor-neutral UI**: No model/vendor names in language labels

---

*Phase 31 - Multilingual Language Engine Complete*
*Unite-Hub Status: i18n FOUNDATION READY*
