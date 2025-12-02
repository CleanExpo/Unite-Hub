// app/api/media/transcribe/route.ts
// Phase 2: Transcription Worker API
// Processes audio/video files using OpenAI Whisper
// UPDATED: 2025-01-17 - Fixed to match Unite-Hub patterns and media_files schema

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import OpenAI from 'openai';

// Validate OpenAI API key
if (!process.env.OPENAI_API_KEY) {
  console.error('⚠️ OPENAI_API_KEY not configured');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  confidence?: number;
}

interface TranscriptData {
  segments: TranscriptionSegment[];
  language: string;
  full_text: string;
}

export async function POST(req: NextRequest) {
  try {
    // ✅ CORRECT AUTH PATTERN (from CLAUDE.md Section 1)
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;
    let workspaceId: string | null = null;

    if (token) {
      // Use browser client for implicit OAuth tokens
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    } else {
      // Fallback to server-side cookies (PKCE flow)
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    }

    // Get workspaceId from query params (REQUIRED for workspace isolation)
    workspaceId = req.nextUrl.searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({
        error: 'workspaceId required for workspace isolation'
      }, { status: 400 });
    }

    // Parse request body
    const body = await req.json();
    const { mediaId } = body;

    if (!mediaId) {
      return NextResponse.json({ error: 'mediaId required' }, { status: 400 });
    }

    // ✅ Use admin client for media operations (bypasses RLS)
    const supabaseAdmin = getSupabaseAdmin();

    // Get media record with workspace validation (using media_files table)
    const { data: media, error: mediaError } = await supabaseAdmin
      .from('media_files')
      .select('*')
      .eq('id', mediaId)
      .eq('workspace_id', workspaceId) // ✅ WORKSPACE ISOLATION
      .single();

    if (mediaError || !media) {
      console.error('Media fetch error:', mediaError);
      return NextResponse.json({
        error: 'Media not found or access denied'
      }, { status: 404 });
    }

    // Check if already transcribed
    if (media.transcript && media.transcribed_at) {
      return NextResponse.json({
        message: 'Already transcribed',
        transcript: media.transcript
      });
    }

    // Validate file type (only audio/video can be transcribed)
    if (!['video', 'audio'].includes(media.file_type)) {
      return NextResponse.json({
        error: `Cannot transcribe file type: ${media.file_type}`
      }, { status: 400 });
    }

    // Update status to transcribing
    await supabaseAdmin
      .from('media_files')
      .update({
        status: 'transcribing',
        progress: 25,
      })
      .eq('id', mediaId);

    try {
      // Validate OpenAI API key
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured');
      }

      // Get public URL or storage path
      const fileUrl = media.public_url || media.storage_path;

      if (!fileUrl) {
        throw new Error('No file URL available');
      }

      // Download file from storage
      let fileBlob: Blob;

      if (fileUrl.startsWith('http')) {
        // Public URL - fetch directly
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`Failed to download media file: ${response.statusText}`);
        }
        fileBlob = await response.blob();
      } else {
        // Storage path - use Supabase storage
        const { data: storageData, error: storageError } = await supabaseAdmin
          .storage
          .from(media.storage_bucket)
          .download(media.storage_path);

        if (storageError || !storageData) {
          throw new Error(`Failed to download from storage: ${storageError?.message}`);
        }

        fileBlob = storageData;
      }

      // Create File object for Whisper API
      const file = new File([fileBlob], media.original_filename, { type: media.mime_type });

      console.log(`🎙️ Transcribing ${media.original_filename} (${(fileBlob.size / 1024 / 1024).toFixed(2)} MB)`);

      // Update progress
      await supabaseAdmin
        .from('media_files')
        .update({ progress: 50 })
        .eq('id', mediaId);

      // Call Whisper API with timestamp granularity
      const transcription = await openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        language: 'en', // Auto-detect or specify
        response_format: 'verbose_json', // Get timestamps
        timestamp_granularities: ['segment'],
      });

      // Update progress
      await supabaseAdmin
        .from('media_files')
        .update({ progress: 75 })
        .eq('id', mediaId);

      // Parse segments with timestamps
      const segments: TranscriptionSegment[] = (transcription as any).segments?.map((seg: any) => ({
        start: seg.start,
        end: seg.end,
        text: seg.text.trim(),
        confidence: seg.confidence || undefined,
      })) || [];

      const fullTranscript = transcription.text;
      const wordCount = fullTranscript.split(/\s+/).filter(w => w.length > 0).length;
      const language = (transcription as any).language || 'en';

      console.log(`✅ Transcribed ${wordCount} words in ${segments.length} segments`);

      // Build transcript JSONB object
      const transcriptData: TranscriptData = {
        segments,
        language,
        full_text: fullTranscript,
      };

      // Store transcription in media_files table
      const { data: updatedMedia, error: updateError } = await supabaseAdmin
        .from('media_files')
        .update({
          status: 'analyzing', // Move to next phase
          progress: 100,
          transcript: transcriptData as any, // JSONB column
          transcript_language: language,
          transcript_confidence: (transcription as any).confidence || null,
          transcribed_at: new Date().toISOString(),
        })
        .eq('id', mediaId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to store transcription: ${updateError.message}`);
      }

      // Trigger AI analysis (async, don't wait)
      fetch(`${req.nextUrl.origin}/api/media/analyze?workspaceId=${workspaceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }), // Pass auth token
        },
        body: JSON.stringify({ mediaId }),
      }).catch(error => {
        console.error('Failed to trigger analysis:', error);
      });

      // Log to audit trail
      const supabase = await getSupabaseServer();
      await supabase.from('auditLogs').insert({
        org_id: media.org_id,
        action: 'media.transcribe',
        resource: 'media_file',
        resource_id: mediaId,
        agent: 'transcription-worker',
        status: 'success',
        details: {
          mediaId,
          fileName: media.original_filename,
          wordCount,
          segmentCount: segments.length,
          duration: media.duration_seconds || segments[segments.length - 1]?.end || 0,
          language,
        },
      });

      return NextResponse.json({
        success: true,
        transcript: transcriptData,
        message: 'Transcription completed successfully',
        stats: {
          wordCount,
          segmentCount: segments.length,
          duration: media.duration_seconds || segments[segments.length - 1]?.end || 0,
          language,
        },
      });

    } catch (error) {
      console.error('❌ Transcription error:', error);

      // Update media status to failed
      await supabaseAdmin
        .from('media_files')
        .update({
          status: 'failed',
          progress: 0,
          error_message: error instanceof Error ? error.message : 'Transcription failed',
        })
        .eq('id', mediaId);

      // Log error to audit trail
      const supabase = await getSupabaseServer();
      await supabase.from('auditLogs').insert({
        org_id: media.org_id,
        action: 'media.transcribe',
        resource: 'media_file',
        resource_id: mediaId,
        agent: 'transcription-worker',
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        details: {
          mediaId,
          fileName: media.original_filename,
        },
      });

      return NextResponse.json(
        {
          error: 'Transcription failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Transcription worker error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve transcription
export async function GET(req: NextRequest) {
  try {
    // ✅ CORRECT AUTH PATTERN
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    }

    const { searchParams } = req.nextUrl;
    const mediaId = searchParams.get('mediaId');
    const workspaceId = searchParams.get('workspaceId');

    if (!mediaId) {
      return NextResponse.json({ error: 'mediaId required' }, { status: 400 });
    }

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }

    const supabase = await getSupabaseServer();

    // ✅ WORKSPACE ISOLATION
    const { data: media, error } = await supabase
      .from('media_files')
      .select('id, transcript, transcript_language, transcript_confidence, transcribed_at')
      .eq('id', mediaId)
      .eq('workspace_id', workspaceId)
      .single();

    if (error || !media) {
      return NextResponse.json({
        error: 'Media file not found or access denied'
      }, { status: 404 });
    }

    if (!media.transcript) {
      return NextResponse.json({
        error: 'Transcription not yet completed'
      }, { status: 404 });
    }

    return NextResponse.json({
      transcript: media.transcript,
      language: media.transcript_language,
      confidence: media.transcript_confidence,
      transcribedAt: media.transcribed_at,
    });
  } catch (error) {
    console.error('❌ Get transcription error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
