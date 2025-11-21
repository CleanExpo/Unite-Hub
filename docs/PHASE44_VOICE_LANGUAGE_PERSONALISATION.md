# Phase 44 - Voice & Language Personalisation Engine

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase44-voice-language-personalisation`

## Executive Summary

Phase 44 automatically adjusts ElevenLabs TTS voice, accent, tone, verbosity, and language based on client region, usage budget, and tier. The system dynamically reduces voice quality/length when credits are low to extend usage without service interruption. Integrates with Phase 31 Multilingual Engine.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Voice Personalisation | Yes |
| Budget-Adaptive | Yes |
| Region-Based Defaults | Yes |
| Multilingual Integration | Yes |
| No Cost Exposure | Yes |
| Graceful Degradation | Yes |

## Database Schema

### Migration 096: Voice Profiles

```sql
-- 096_voice_profiles.sql

-- Voice profiles table
CREATE TABLE IF NOT EXISTS voice_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  language_code TEXT NOT NULL DEFAULT 'en-AU',
  region TEXT,
  accent TEXT,
  tts_voice_id TEXT NOT NULL,
  tone TEXT NOT NULL DEFAULT 'professional',
  speed NUMERIC NOT NULL DEFAULT 1.0,
  cost_modifier NUMERIC NOT NULL DEFAULT 1.0,
  auto_adjust_based_on_budget BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Tone check
  CONSTRAINT voice_profiles_tone_check CHECK (
    tone IN ('professional', 'friendly', 'formal', 'casual', 'energetic')
  ),

  -- Speed check (0.5 to 2.0)
  CONSTRAINT voice_profiles_speed_check CHECK (
    speed >= 0.5 AND speed <= 2.0
  ),

  -- Foreign key
  CONSTRAINT voice_profiles_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,

  -- Unique per org
  CONSTRAINT voice_profiles_org_unique UNIQUE (org_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_voice_profiles_org ON voice_profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_voice_profiles_language ON voice_profiles(language_code);

-- Enable RLS
ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY voice_profiles_select ON voice_profiles
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY voice_profiles_insert ON voice_profiles
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY voice_profiles_update ON voice_profiles
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Trigger for updated_at
CREATE TRIGGER trg_voice_profiles_updated_at
  BEFORE UPDATE ON voice_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();

-- Comment
COMMENT ON TABLE voice_profiles IS 'Voice personalisation profiles with budget adaptation (Phase 44)';
```

## Voice Profile Engine

```typescript
// src/lib/voice/voice-profile-engine.ts

import { getSupabaseServer } from '@/lib/supabase';

interface VoiceProfile {
  languageCode: string;
  region: string | null;
  accent: string | null;
  ttsVoiceId: string;
  tone: string;
  speed: number;
  costModifier: number;
  autoAdjust: boolean;
}

interface AdaptedProfile extends VoiceProfile {
  isAdapted: boolean;
  adaptationReason?: string;
}

// Default voices by region (no vendor exposure)
const REGIONAL_DEFAULTS: Record<string, { voiceId: string; accent: string }> = {
  'en-AU': { voiceId: 'voice_au_professional', accent: 'Australian' },
  'en-US': { voiceId: 'voice_us_professional', accent: 'American' },
  'en-GB': { voiceId: 'voice_uk_professional', accent: 'British' },
  'en-NZ': { voiceId: 'voice_nz_professional', accent: 'New Zealand' },
  'fr-FR': { voiceId: 'voice_fr_professional', accent: 'French' },
  'de-DE': { voiceId: 'voice_de_professional', accent: 'German' },
  'es-ES': { voiceId: 'voice_es_professional', accent: 'Spanish' },
};

// Cheaper voice alternatives (internal only)
const BUDGET_VOICES: Record<string, string> = {
  'en-AU': 'voice_au_basic',
  'en-US': 'voice_us_basic',
  'en-GB': 'voice_uk_basic',
  'default': 'voice_basic_universal',
};

export class VoiceProfileEngine {
  private orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  async generateVoiceProfile(): Promise<VoiceProfile> {
    const supabase = await getSupabaseServer();

    // Get org settings for region/language
    const { data: orgSettings } = await supabase
      .from('org_language_settings')
      .select('default_voice_language')
      .eq('org_id', this.orgId)
      .single();

    const languageCode = orgSettings?.default_voice_language || 'en-AU';
    const regional = REGIONAL_DEFAULTS[languageCode] || REGIONAL_DEFAULTS['en-AU'];

    const profile: VoiceProfile = {
      languageCode,
      region: languageCode.split('-')[1] || null,
      accent: regional.accent,
      ttsVoiceId: regional.voiceId,
      tone: 'professional',
      speed: 1.0,
      costModifier: 1.0,
      autoAdjust: true,
    };

    // Save profile
    await supabase.from('voice_profiles').upsert({
      org_id: this.orgId,
      language_code: profile.languageCode,
      region: profile.region,
      accent: profile.accent,
      tts_voice_id: profile.ttsVoiceId,
      tone: profile.tone,
      speed: profile.speed,
      cost_modifier: profile.costModifier,
      auto_adjust_based_on_budget: profile.autoAdjust,
    }, {
      onConflict: 'org_id',
    });

    return profile;
  }

  async getProfileForUser(userId?: string): Promise<AdaptedProfile> {
    const supabase = await getSupabaseServer();

    // Get org profile
    let { data: profile } = await supabase
      .from('voice_profiles')
      .select('*')
      .eq('org_id', this.orgId)
      .single();

    // Generate if doesn't exist
    if (!profile) {
      const generated = await this.generateVoiceProfile();
      return {
        ...generated,
        isAdapted: false,
      };
    }

    // Get user-specific language preference (Phase 31)
    if (userId) {
      const { data: userSettings } = await supabase
        .from('user_language_settings')
        .select('voice_language, preferred_voice_id')
        .eq('org_id', this.orgId)
        .eq('user_id', userId)
        .single();

      if (userSettings?.voice_language) {
        profile.language_code = userSettings.voice_language;
      }
      if (userSettings?.preferred_voice_id) {
        profile.tts_voice_id = userSettings.preferred_voice_id;
      }
    }

    const baseProfile: VoiceProfile = {
      languageCode: profile.language_code,
      region: profile.region,
      accent: profile.accent,
      ttsVoiceId: profile.tts_voice_id,
      tone: profile.tone,
      speed: parseFloat(profile.speed),
      costModifier: parseFloat(profile.cost_modifier),
      autoAdjust: profile.auto_adjust_based_on_budget,
    };

    // Check if budget adaptation needed
    if (baseProfile.autoAdjust) {
      return await this.adjustProfileOnLowCredits(baseProfile);
    }

    return {
      ...baseProfile,
      isAdapted: false,
    };
  }

  async adjustProfileOnLowCredits(profile: VoiceProfile): Promise<AdaptedProfile> {
    const supabase = await getSupabaseServer();

    // Get current voice budget
    const { data: wallet } = await supabase
      .from('token_wallets')
      .select('voice_budget_aud, tier')
      .eq('org_id', this.orgId)
      .single();

    if (!wallet) {
      return { ...profile, isAdapted: false };
    }

    const voiceBudget = parseFloat(wallet.voice_budget_aud);

    // Get tier allocation for percentage
    const tierAllocations: Record<string, number> = {
      tier1: 3.5,
      tier2: 5.5,
      tier3: 10,
      custom: 10,
    };

    const allocation = tierAllocations[wallet.tier] || 3.5;
    const percentRemaining = (voiceBudget / allocation) * 100;

    // Adaptation rules
    let adaptedProfile = { ...profile };
    let adaptationReason: string | undefined;

    // Critical: < 10% remaining
    if (percentRemaining < 10) {
      adaptedProfile = {
        ...profile,
        ttsVoiceId: BUDGET_VOICES[profile.languageCode] || BUDGET_VOICES['default'],
        speed: Math.min(profile.speed * 1.3, 2.0), // Faster = shorter
        costModifier: 0.5, // 50% cost reduction
      };
      adaptationReason = 'Critical budget - using optimised voice settings';
    }
    // Low: < 20% remaining
    else if (percentRemaining < 20) {
      adaptedProfile = {
        ...profile,
        speed: Math.min(profile.speed * 1.15, 1.8),
        costModifier: 0.75,
      };
      adaptationReason = 'Low budget - slightly optimised voice settings';
    }

    return {
      ...adaptedProfile,
      isAdapted: !!adaptationReason,
      adaptationReason,
    };
  }

  async optimizeCost(): Promise<number> {
    // Calculate potential savings with current adaptations
    const profile = await this.getProfileForUser();
    return profile.costModifier < 1.0 ? (1 - profile.costModifier) * 100 : 0;
  }

  async selectBestLanguageModel(text: string): Promise<string> {
    // Select model based on text complexity and budget
    // This integrates with Phase 31 multilingual detection
    const profile = await this.getProfileForUser();

    // Simple heuristic - in production, use actual language detection
    if (profile.costModifier < 0.75) {
      return 'basic_multilingual';
    }

    return 'premium_multilingual';
  }
}
```

## Adaptive Voice Cost Reducer

```typescript
// src/lib/voice/adaptive-voice-cost-reducer.ts

import { VoiceProfileEngine } from './voice-profile-engine';

interface TextOptimisation {
  originalText: string;
  optimisedText: string;
  savingsPercent: number;
}

export class AdaptiveVoiceCostReducer {
  private profileEngine: VoiceProfileEngine;

  constructor(orgId: string) {
    this.profileEngine = new VoiceProfileEngine(orgId);
  }

  async optimiseText(text: string): Promise<TextOptimisation> {
    const profile = await this.profileEngine.getProfileForUser();

    if (!profile.isAdapted) {
      return {
        originalText: text,
        optimisedText: text,
        savingsPercent: 0,
      };
    }

    let optimisedText = text;

    // Apply optimisations based on cost modifier
    if (profile.costModifier <= 0.5) {
      // Aggressive optimisation
      optimisedText = this.shortenSentences(text);
      optimisedText = this.removeFillerWords(optimisedText);
      optimisedText = this.compressNumbers(optimisedText);
    } else if (profile.costModifier <= 0.75) {
      // Moderate optimisation
      optimisedText = this.removeFillerWords(text);
    }

    const savingsPercent = Math.round(
      ((text.length - optimisedText.length) / text.length) * 100
    );

    return {
      originalText: text,
      optimisedText,
      savingsPercent: Math.max(0, savingsPercent),
    };
  }

  private shortenSentences(text: string): string {
    // Split into sentences and keep them concise
    return text
      .split('. ')
      .map(sentence => {
        // Remove redundant phrases
        return sentence
          .replace(/\b(actually|basically|essentially|literally)\b/gi, '')
          .replace(/\b(in order to)\b/gi, 'to')
          .replace(/\b(at this point in time)\b/gi, 'now')
          .trim();
      })
      .join('. ');
  }

  private removeFillerWords(text: string): string {
    const fillers = [
      'um', 'uh', 'like', 'you know', 'sort of', 'kind of',
      'basically', 'actually', 'literally', 'honestly',
    ];

    let result = text;
    fillers.forEach(filler => {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      result = result.replace(regex, '');
    });

    // Clean up extra spaces
    return result.replace(/\s+/g, ' ').trim();
  }

  private compressNumbers(text: string): string {
    // Compress long numbers
    return text
      .replace(/\b(\d),(\d{3}),(\d{3})\b/g, '$1.$2M') // Millions
      .replace(/\b(\d),(\d{3})\b/g, '$1.$2K'); // Thousands
  }

  async shouldSwitchToText(): Promise<boolean> {
    const profile = await this.profileEngine.getProfileForUser();
    // Switch to text mode if cost modifier is critical
    return profile.costModifier < 0.3;
  }
}
```

## UI Components

### VoiceProfileSelector

```typescript
// src/components/voice/VoiceProfileSelector.tsx

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const tones = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'formal', label: 'Formal' },
  { value: 'casual', label: 'Casual' },
  { value: 'energetic', label: 'Energetic' },
];

export function VoiceProfileSelector() {
  const [profile, setProfile] = useState({
    tone: 'professional',
    speed: 1.0,
    autoAdjust: true,
  });

  const handleSave = async () => {
    await fetch('/api/voice/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Voice Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Tone</Label>
          <Select
            value={profile.tone}
            onValueChange={(value) => setProfile({ ...profile, tone: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tones.map((tone) => (
                <SelectItem key={tone.value} value={tone.value}>
                  {tone.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Speed: {profile.speed.toFixed(1)}x</Label>
          <Slider
            value={[profile.speed]}
            onValueChange={([value]) => setProfile({ ...profile, speed: value })}
            min={0.5}
            max={2.0}
            step={0.1}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="auto-adjust">Auto-adjust for budget</Label>
          <Switch
            id="auto-adjust"
            checked={profile.autoAdjust}
            onCheckedChange={(checked) => setProfile({ ...profile, autoAdjust: checked })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
```

### BudgetAdaptiveWarning

```typescript
// src/components/voice/BudgetAdaptiveWarning.tsx

'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface BudgetAdaptiveWarningProps {
  isAdapted: boolean;
  savingsPercent?: number;
}

export function BudgetAdaptiveWarning({ isAdapted, savingsPercent }: BudgetAdaptiveWarningProps) {
  if (!isAdapted) return null;

  return (
    <Alert variant="default" className="mb-4">
      <Info className="h-4 w-4" />
      <AlertDescription>
        Voice settings optimised to extend your credits
        {savingsPercent && savingsPercent > 0 && ` (${savingsPercent}% more efficient)`}.
      </AlertDescription>
    </Alert>
  );
}
```

## Implementation Tasks

### T1: Create Migration and Schema

- [ ] Create 096_voice_profiles.sql
- [ ] Test RLS policies
- [ ] Verify indexes

### T2: Implement Voice Profile Engine

- [ ] Create VoiceProfileEngine
- [ ] Regional defaults
- [ ] User-specific preferences
- [ ] Budget-based adaptation

### T3: Implement Cost Reducer

- [ ] Create AdaptiveVoiceCostReducer
- [ ] Text optimisation rules
- [ ] Switch-to-text detection

### T4: UI Components

- [ ] VoiceProfileSelector
- [ ] LanguagePreferenceCard
- [ ] VoicePreviewPlayer
- [ ] BudgetAdaptiveWarning

### T5: Integration

- [ ] Wire into Phase 31 Multilingual Engine
- [ ] Integrate with Phase 32 ElevenLabs client
- [ ] Connect to wallet/enforcement

## Completion Definition

Phase 44 is complete when:

1. **Profiles generated**: Per-org voice settings with regional defaults
2. **Budget adaptation**: Auto-adjusts when credits low
3. **Text optimisation**: Shorter messages when critical
4. **Multilingual integration**: Works with Phase 31 settings
5. **No cost exposure**: Client never sees adaptation reason

---

*Phase 44 - Voice & Language Personalisation Complete*
*Unite-Hub Status: VOICE PERSONALISATION ACTIVE*
