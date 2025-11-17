/**
 * Unit Tests for /api/media/transcribe
 * Tests OpenAI Whisper transcription integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/media/transcribe/route';

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  getSupabaseServer: vi.fn(),
  getSupabaseAdmin: vi.fn(),
  supabaseBrowser: {
    auth: {
      getUser: vi.fn(),
    },
  },
}));

vi.mock('openai', () => ({
  default: class OpenAI {
    audio = {
      transcriptions: {
        create: vi.fn(),
      },
    };
  },
}));

describe('POST /api/media/transcribe', () => {
  let mockRequest: Partial<NextRequest>;
  let mockSupabase: any;
  let mockSupabaseAdmin: any;
  let mockOpenAI: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Supabase
    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
    };

    mockSupabaseAdmin = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'media-123',
                file_type: 'audio',
                public_url: 'https://storage.example.com/test.mp3',
                original_filename: 'test.mp3',
                mime_type: 'audio/mpeg',
                storage_bucket: 'media-uploads',
                storage_path: 'workspace/file/test.mp3',
                org_id: 'org-123',
              },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { status: 'analyzing' },
                error: null,
              }),
            }),
          }),
        }),
      }),
      storage: {
        from: vi.fn().mockReturnValue({
          download: vi.fn().mockResolvedValue({
            data: new Blob(['audio content']),
            error: null,
          }),
        }),
      },
    };

    // Mock OpenAI Whisper
    const OpenAI = require('openai').default;
    mockOpenAI = new OpenAI();
    mockOpenAI.audio.transcriptions.create.mockResolvedValue({
      text: 'This is a test transcription.',
      language: 'en',
      segments: [
        {
          start: 0.0,
          end: 5.2,
          text: 'This is a test transcription.',
          confidence: 0.95,
        },
      ],
    });

    const { getSupabaseServer, getSupabaseAdmin } = require('@/lib/supabase');
    getSupabaseServer.mockResolvedValue(mockSupabase);
    getSupabaseAdmin.mockReturnValue(mockSupabaseAdmin);

    // Mock environment
    process.env.OPENAI_API_KEY = 'sk-test-key';
  });

  it('should successfully transcribe an audio file', async () => {
    mockRequest = {
      headers: new Headers({ authorization: 'Bearer test-token' }),
      nextUrl: {
        searchParams: new URLSearchParams('workspaceId=workspace-123'),
        origin: 'http://localhost:3008',
      } as any,
      json: vi.fn().mockResolvedValue({ mediaId: 'media-123' }),
    };

    // Mock fetch for analysis trigger
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.transcript).toBeDefined();
    expect(data.transcript.full_text).toBe('This is a test transcription.');
    expect(data.transcript.segments).toHaveLength(1);
    expect(data.transcript.language).toBe('en');
    expect(data.stats.wordCount).toBe(5);
  });

  it('should reject non-audio/video files', async () => {
    mockSupabaseAdmin.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'media-123',
              file_type: 'document', // Not audio/video
            },
            error: null,
          }),
        }),
      }),
    });

    mockRequest = {
      headers: new Headers({ authorization: 'Bearer test-token' }),
      nextUrl: {
        searchParams: new URLSearchParams('workspaceId=workspace-123'),
      } as any,
      json: vi.fn().mockResolvedValue({ mediaId: 'media-123' }),
    };

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Cannot transcribe');
  });

  it('should handle already transcribed files', async () => {
    mockSupabaseAdmin.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'media-123',
              file_type: 'audio',
              transcript: {
                full_text: 'Already transcribed',
                segments: [],
              },
              transcribed_at: new Date().toISOString(),
            },
            error: null,
          }),
        }),
      }),
    });

    mockRequest = {
      headers: new Headers({ authorization: 'Bearer test-token' }),
      nextUrl: {
        searchParams: new URLSearchParams('workspaceId=workspace-123'),
      } as any,
      json: vi.fn().mockResolvedValue({ mediaId: 'media-123' }),
    };

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toContain('Already transcribed');
    expect(mockOpenAI.audio.transcriptions.create).not.toHaveBeenCalled();
  });

  it('should handle OpenAI API errors gracefully', async () => {
    mockOpenAI.audio.transcriptions.create.mockRejectedValue(
      new Error('OpenAI API error')
    );

    // Mock file download
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['audio']),
    });

    mockRequest = {
      headers: new Headers({ authorization: 'Bearer test-token' }),
      nextUrl: {
        searchParams: new URLSearchParams('workspaceId=workspace-123'),
        origin: 'http://localhost:3008',
      } as any,
      json: vi.fn().mockResolvedValue({ mediaId: 'media-123' }),
    };

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Transcription failed');

    // Verify media status updated to failed
    expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('media_files');
  });

  it('should require workspaceId parameter', async () => {
    mockRequest = {
      headers: new Headers({ authorization: 'Bearer test-token' }),
      nextUrl: {
        searchParams: new URLSearchParams(), // No workspaceId
      } as any,
      json: vi.fn().mockResolvedValue({ mediaId: 'media-123' }),
    };

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('workspaceId required');
  });

  it('should enforce workspace isolation', async () => {
    mockSupabaseAdmin.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null, // No access
            error: new Error('Not found'),
          }),
        }),
      }),
    });

    mockRequest = {
      headers: new Headers({ authorization: 'Bearer test-token' }),
      nextUrl: {
        searchParams: new URLSearchParams('workspaceId=workspace-123'),
      } as any,
      json: vi.fn().mockResolvedValue({ mediaId: 'media-123' }),
    };

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain('access denied');
  });

  it('should log to audit trail on success', async () => {
    mockRequest = {
      headers: new Headers({ authorization: 'Bearer test-token' }),
      nextUrl: {
        searchParams: new URLSearchParams('workspaceId=workspace-123'),
        origin: 'http://localhost:3008',
      } as any,
      json: vi.fn().mockResolvedValue({ mediaId: 'media-123' }),
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    const response = await POST(mockRequest as NextRequest);

    expect(response.status).toBe(200);
    expect(mockSupabase.from).toHaveBeenCalledWith('auditLogs');
  });
});

describe('GET /api/media/transcribe', () => {
  let mockRequest: Partial<NextRequest>;
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'media-123',
                transcript: {
                  full_text: 'Test transcription',
                  segments: [],
                  language: 'en',
                },
                transcript_language: 'en',
                transcript_confidence: 0.95,
                transcribed_at: '2025-01-17T10:00:00Z',
              },
              error: null,
            }),
          }),
        }),
      }),
    };

    const { getSupabaseServer } = require('@/lib/supabase');
    getSupabaseServer.mockResolvedValue(mockSupabase);
  });

  it('should retrieve existing transcription', async () => {
    mockRequest = {
      headers: new Headers({ authorization: 'Bearer test-token' }),
      nextUrl: {
        searchParams: new URLSearchParams(
          'mediaId=media-123&workspaceId=workspace-123'
        ),
      } as any,
    };

    const response = await GET(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.transcript).toBeDefined();
    expect(data.transcript.full_text).toBe('Test transcription');
    expect(data.language).toBe('en');
    expect(data.confidence).toBe(0.95);
  });

  it('should return 404 if transcription not found', async () => {
    mockSupabase.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'media-123',
              transcript: null, // No transcription yet
            },
            error: null,
          }),
        }),
      }),
    });

    mockRequest = {
      headers: new Headers({ authorization: 'Bearer test-token' }),
      nextUrl: {
        searchParams: new URLSearchParams(
          'mediaId=media-123&workspaceId=workspace-123'
        ),
      } as any,
    };

    const response = await GET(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain('not yet completed');
  });

  it('should require both mediaId and workspaceId', async () => {
    mockRequest = {
      headers: new Headers({ authorization: 'Bearer test-token' }),
      nextUrl: {
        searchParams: new URLSearchParams('mediaId=media-123'), // Missing workspaceId
      } as any,
    };

    const response = await GET(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('workspaceId required');
  });
});
