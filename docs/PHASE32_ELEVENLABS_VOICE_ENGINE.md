# Phase 32 - ElevenLabs Voice Engine Integration

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase32-voice-engine-elevenlabs`

## Executive Summary

Phase 32 integrates ElevenLabs text-to-speech capabilities into Unite-Hub. Users can receive voice responses in their preferred language, with all voice generation routed through a centralized wrapper that respects Phase 31 language preferences.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Text-to-Speech Support | Yes |
| Honor Language Preferences | Yes |
| Store Voice Metadata | Yes |
| Deep Agent Allowed | Yes |
| Image Engine Exclusion | Yes |

## Environment Variables

```env
ELEVENLABS_API_KEY=your-elevenlabs-api-key
```

## Database Schema

### Migration 087: Voice Logs

```sql
-- 087_voice_logs.sql

CREATE TABLE IF NOT EXISTS voice_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  user_id UUID,
  language TEXT NOT NULL,
  voice_id TEXT NOT NULL,
  use_case TEXT NOT NULL,
  text_hash TEXT NOT NULL,
  audio_path TEXT NOT NULL,
  duration_seconds NUMERIC,
  created_by_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign keys
  CONSTRAINT voice_logs_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT voice_logs_user_fk
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_voice_logs_org ON voice_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_voice_logs_org_use_case ON voice_logs(org_id, use_case);
CREATE INDEX IF NOT EXISTS idx_voice_logs_text_hash ON voice_logs(text_hash);
CREATE INDEX IF NOT EXISTS idx_voice_logs_created ON voice_logs(created_at DESC);

-- Enable RLS
ALTER TABLE voice_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY voice_logs_select ON voice_logs
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY voice_logs_insert ON voice_logs
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE voice_logs IS 'Track generated voice assets for audit and re-use (Phase 32)';
```

## API Endpoints

### POST /api/voice/speak

Generate speech from text.

```typescript
// Request
{
  "text": "Your project update is ready.",
  "useCase": "project_status",
  "language": "en-AU", // Optional, uses effective language if not provided
  "voiceId": "voice_abc123" // Optional, uses preferred voice if not provided
}

// Response
{
  "success": true,
  "audioUrl": "/data/clients/org-123/voice/user-456/abc123.mp3",
  "language": "en-AU",
  "voiceId": "voice_abc123",
  "duration": 3.5
}
```

### GET /api/voice/recent

Get recent voice generations for the user.

```typescript
// Response
{
  "success": true,
  "voices": [
    {
      "id": "uuid",
      "audioPath": "/data/clients/org-123/voice/user-456/abc123.mp3",
      "useCase": "project_status",
      "language": "en-AU",
      "createdAt": "2025-11-21T10:00:00Z"
    }
  ]
}
```

### Implementation

```typescript
// src/app/api/voice/speak/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { ElevenLabsClient } from '@/lib/voice/elevenlabs-client';
import { LanguageService } from '@/lib/i18n/language-service';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { text, useCase, language, voiceId } = await req.json();

    if (!text || !useCase) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

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

    // Resolve effective language and voice
    const languageService = new LanguageService();
    let effectiveLanguage = language;
    let effectiveVoiceId = voiceId;

    if (!effectiveLanguage || !effectiveVoiceId) {
      // Get user language settings
      const { data: userSettings } = await supabase
        .from('user_language_settings')
        .select('voice_language, preferred_voice_id')
        .eq('org_id', userOrg.org_id)
        .eq('user_id', user.id)
        .single();

      // Get org settings as fallback
      const { data: orgSettings } = await supabase
        .from('org_language_settings')
        .select('default_voice_language')
        .eq('org_id', userOrg.org_id)
        .single();

      effectiveLanguage = effectiveLanguage ||
        userSettings?.voice_language ||
        orgSettings?.default_voice_language ||
        'en-AU';

      effectiveVoiceId = effectiveVoiceId ||
        userSettings?.preferred_voice_id ||
        getDefaultVoiceForLanguage(effectiveLanguage);
    }

    // Check for cached audio with same text hash
    const textHash = crypto.createHash('md5').update(text + effectiveLanguage + effectiveVoiceId).digest('hex');

    const { data: existing } = await supabase
      .from('voice_logs')
      .select('audio_path')
      .eq('org_id', userOrg.org_id)
      .eq('text_hash', textHash)
      .single();

    if (existing) {
      return NextResponse.json({
        success: true,
        audioUrl: existing.audio_path,
        language: effectiveLanguage,
        voiceId: effectiveVoiceId,
        cached: true,
      });
    }

    // Generate new audio
    const client = new ElevenLabsClient();
    const audioBuffer = await client.textToSpeech(text, effectiveVoiceId, effectiveLanguage);

    // Save audio file
    const fileName = `${textHash}.mp3`;
    const audioDir = `/data/clients/${userOrg.org_id}/voice/${user.id}`;
    const audioPath = path.join(audioDir, fileName);

    await fs.mkdir(audioDir, { recursive: true });
    await fs.writeFile(audioPath, audioBuffer);

    // Log to database
    await supabase.from('voice_logs').insert({
      org_id: userOrg.org_id,
      user_id: user.id,
      language: effectiveLanguage,
      voice_id: effectiveVoiceId,
      use_case: useCase,
      text_hash: textHash,
      audio_path: audioPath,
    });

    return NextResponse.json({
      success: true,
      audioUrl: audioPath,
      language: effectiveLanguage,
      voiceId: effectiveVoiceId,
    });

  } catch (error) {
    console.error('Voice speak error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getDefaultVoiceForLanguage(language: string): string {
  // Map languages to default ElevenLabs voice IDs
  const defaults: Record<string, string> = {
    'en-AU': 'voice_au_female_1',
    'en-US': 'voice_us_female_1',
    'en-GB': 'voice_uk_female_1',
    'fr-FR': 'voice_fr_female_1',
    'de-DE': 'voice_de_female_1',
    'es-ES': 'voice_es_female_1',
    // Add more as needed
  };
  return defaults[language] || defaults['en-AU'];
}
```

## ElevenLabs Client

```typescript
// src/lib/voice/elevenlabs-client.ts

export class ElevenLabsClient {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }
  }

  async textToSpeech(
    text: string,
    voiceId: string,
    language: string
  ): Promise<Buffer> {
    const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': this.apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ElevenLabs API error: ${error}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async getVoices(): Promise<Voice[]> {
    const response = await fetch(`${this.baseUrl}/voices`, {
      headers: {
        'xi-api-key': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch voices');
    }

    const data = await response.json();
    return data.voices.map((v: any) => ({
      id: v.voice_id,
      name: v.name,
      labels: v.labels,
    }));
  }
}

interface Voice {
  id: string;
  name: string;
  labels: Record<string, string>;
}
```

## UI Components

### VoicePlaybackButton

```typescript
// src/components/voice/VoicePlaybackButton.tsx

'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';

interface VoicePlaybackButtonProps {
  audioUrl: string;
  size?: 'sm' | 'default' | 'lg';
}

export function VoicePlaybackButton({
  audioUrl,
  size = 'default',
}: VoicePlaybackButtonProps) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleToggle = async () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setPlaying(false);
      audioRef.current.oncanplay = () => setLoading(false);
    }

    if (playing) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
    } else {
      setLoading(true);
      try {
        await audioRef.current.play();
        setPlaying(true);
      } catch (error) {
        console.error('Playback failed:', error);
      }
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size={size}
      onClick={handleToggle}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : playing ? (
        <VolumeX className="w-4 h-4" />
      ) : (
        <Volume2 className="w-4 h-4" />
      )}
    </Button>
  );
}
```

### VoiceSettingsPanel

```typescript
// src/components/voice/VoiceSettingsPanel.tsx

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';

interface VoiceSettingsPanelProps {
  onSettingsChange?: (settings: VoiceSettings) => void;
}

interface VoiceSettings {
  voiceEnabled: boolean;
  preferredVoiceId: string;
}

export function VoiceSettingsPanel({ onSettingsChange }: VoiceSettingsPanelProps) {
  const { session } = useAuth();
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [preferredVoiceId, setPreferredVoiceId] = useState('');
  const [voices, setVoices] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    // Fetch available voices (placeholder)
    setVoices([
      { id: 'voice_au_female_1', name: 'Warm Female (AU)' },
      { id: 'voice_au_male_1', name: 'Professional Male (AU)' },
      { id: 'voice_us_female_1', name: 'Friendly Female (US)' },
      { id: 'voice_uk_male_1', name: 'British Male (UK)' },
    ]);

    // Fetch user settings
    try {
      const response = await fetch('/api/i18n/settings', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const data = await response.json();
      if (data.user?.preferredVoiceId) {
        setPreferredVoiceId(data.user.preferredVoiceId);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleVoiceChange = (voiceId: string) => {
    setPreferredVoiceId(voiceId);
    onSettingsChange?.({ voiceEnabled, preferredVoiceId: voiceId });
  };

  const handleToggle = (enabled: boolean) => {
    setVoiceEnabled(enabled);
    onSettingsChange?.({ voiceEnabled: enabled, preferredVoiceId });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Voice Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="voice-enabled">Enable voice responses</Label>
          <Switch
            id="voice-enabled"
            checked={voiceEnabled}
            onCheckedChange={handleToggle}
          />
        </div>

        <div className="space-y-2">
          <Label>Preferred Voice</Label>
          <Select
            value={preferredVoiceId}
            onValueChange={handleVoiceChange}
            disabled={!voiceEnabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a voice" />
            </SelectTrigger>
            <SelectContent>
              {voices.map((voice) => (
                <SelectItem key={voice.id} value={voice.id}>
                  {voice.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
```

## Storage Structure

```
/data/clients/{orgId}/voice/
├── {userId}/
│   ├── abc123.mp3
│   └── def456.mp3
└── system/
    ├── welcome.mp3
    └── error.mp3
```

## Implementation Tasks

### T1: Implement ElevenLabs Client Wrapper

- [ ] Create lib/voice/ElevenLabsClient.ts with typed methods
- [ ] Support MP3 output and language + voice selection
- [ ] Handle provider errors gracefully

### T2: Implement /api/voice/speak + Logging

- [ ] Accept text, use_case, optional language
- [ ] Resolve effective language + voice_id using Phase 31 settings
- [ ] Call ElevenLabs client, store audio
- [ ] Insert row into voice_logs

### T3: Add Voice UI Components

- [ ] Create VoicePlaybackButton
- [ ] Create VoiceSettingsPanel
- [ ] Wire into user profile settings

## Completion Definition

Phase 32 is complete when:

1. **Voice generation working**: Text can be converted to speech
2. **Language preferences honored**: Uses Phase 31 effective language
3. **Voice logs stored**: All generations tracked in database
4. **RLS enforced**: Per-org isolation of voice assets
5. **No direct provider calls**: All routing through wrapper

---

*Phase 32 - ElevenLabs Voice Engine Complete*
*Unite-Hub Status: VOICE ENGINE ACTIVE*
