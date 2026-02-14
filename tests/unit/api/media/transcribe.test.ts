/**
 * Unit Tests for /api/media/transcribe
 * Tests OpenAI Whisper transcription integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/media/transcribe/route';
import * as supabaseModule from '@/lib/supabase';

// Hoist shared mock for OpenAI Whisper (must be before vi.mock)
const { mockWhisperCreate } = vi.hoisted(() => {
  return {
    mockWhisperCreate: vi.fn(),
  };
});

// Mock OpenAI - all instances share the same create function
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      audio: {
        transcriptions: {
          create: mockWhisperCreate, // Shared across all instances
        },
      },
    })),
  };
});

// Import after mock to get mocked version
import OpenAI from 'openai';

// Create mock objects that will be reused (hoisted above vi.mock)
const { mockSupabaseBrowser } = vi.hoisted(() => {
  const mockSupabaseBrowser = {
    auth: {
      getUser: vi.fn(),
    },
  };
  return { mockSupabaseBrowser };
});

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  getSupabaseServer: vi.fn(),
  getSupabaseAdmin: vi.fn(),
  supabaseBrowser: mockSupabaseBrowser,
}));

// Mock next/headers for server-side operations
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(() => null),
    set: vi.fn(),
    delete: vi.fn(),
  })),
  headers: vi.fn(() => ({
    get: vi.fn(() => null),
  })),
}));

// Mock @supabase/ssr for server client creation
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      }),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: { role: 'owner' },
      error: null,
    }),
  })),
}));

describe('POST /api/media/transcribe', () => {
  let mockRequest: Partial<NextRequest>;
  let mockSupabase: any;
  let mockSupabaseAdmin: any;
  let mockCreate: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Use the shared OpenAI mock
    mockCreate = mockWhisperCreate;

    // Setup supabaseBrowser mock
    mockSupabaseBrowser.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Create chainable query builder
    const createMockQueryBuilder = (table?: string) => {
      if (table === 'auditLogs') {
        // Audit logs just need insert support
        return {
          insert: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        };
      }
      // Default media_files query builder
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'media-123',
            workspace_id: 'workspace-123',
            file_type: 'audio',
            public_url: 'https://storage.example.com/test.mp3',
            original_filename: 'test.mp3',
            mime_type: 'audio/mpeg',
            storage_bucket: 'media-uploads',
            storage_path: 'workspace/file/test.mp3',
            org_id: 'org-123',
            transcript: null,
            transcribed_at: null,
          },
          error: null,
        }),
      };
    };

    // Mock Supabase
    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn().mockImplementation((table) => createMockQueryBuilder(table)),
    };

    // Mock admin client - return proper media record
    mockSupabaseAdmin = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'media_files') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            update: vi.fn().mockImplementation((data: any) => {
              // Create a promise-like object that supports chaining
              const updateChain = {
                eq: vi.fn().mockImplementation(() => {
                  // Return a thenable object that can be awaited OR chained
                  const eqChain = {
                    select: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({
                      data: {
                        id: 'media-123',
                        workspace_id: 'workspace-123',
                        file_type: 'audio',
                        status: 'analyzing',
                        progress: 100,
                        transcript: data.transcript || null,
                        transcribed_at: data.transcribed_at || null,
                      },
                      error: null,
                    }),
                    // Make it awaitable (returns a resolved promise)
                    then: vi.fn((resolve) => resolve({ data: null, error: null })),
                  };
                  return eqChain;
                }),
              };
              return updateChain;
            }),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'media-123',
                workspace_id: 'workspace-123',
                file_type: 'audio',
                public_url: 'https://storage.example.com/test.mp3',
                original_filename: 'test.mp3',
                mime_type: 'audio/mpeg',
                storage_bucket: 'media-uploads',
                storage_path: 'workspace/file/test.mp3',
                org_id: 'org-123',
                transcript: null,
                transcribed_at: null,
              },
              error: null,
            }),
          };
        }
        // For audit logs or other tables
        return {
          insert: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        };
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
    mockCreate.mockResolvedValue({
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

    // Apply mocks
    vi.mocked(supabaseModule.getSupabaseServer).mockResolvedValue(mockSupabase);
    vi.mocked(supabaseModule.getSupabaseAdmin).mockReturnValue(mockSupabaseAdmin);

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

    // Mock fetch for file download and analysis trigger
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['audio content']),
      json: async () => ({ success: true }),
    });

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    // Debug: show error details if not 200
    expect(response.status, `Error: ${data.error} | Details: ${data.details || 'none'}`).toBe(200);
    expect(data.success).toBe(true);
    expect(data.transcript).toBeDefined();
    expect(data.transcript.full_text).toBe('This is a test transcription.');
    expect(data.transcript.segments).toHaveLength(1);
    expect(data.transcript.language).toBe('en');
    expect(data.stats.wordCount).toBe(5);
  });

  it('should reject non-audio/video files', async () => {
    // Override to return document file type
    mockSupabaseAdmin.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'media_files') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'media-123',
              file_type: 'document', // Not audio/video
              workspace_id: 'workspace-123',
            },
            error: null,
          }),
          update: vi.fn().mockImplementation(() => ({
            eq: vi.fn().mockImplementation(() => ({
              then: vi.fn((resolve) => resolve({ data: null, error: null })),
            })),
          })),
        };
      }
      return {
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
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
    // Override to return already transcribed media
    mockSupabaseAdmin.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'media_files') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'media-123',
              workspace_id: 'workspace-123',
              file_type: 'audio',
              transcript: {
                full_text: 'Already transcribed',
                segments: [],
              },
              transcribed_at: new Date().toISOString(),
            },
            error: null,
          }),
        };
      }
      return {
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
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
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('should handle OpenAI API errors gracefully', async () => {
    mockCreate.mockRejectedValue(
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
    // Override to return no access
    mockSupabaseAdmin.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'media_files') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null, // No access
            error: new Error('Not found'),
          }),
        };
      }
      return {
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
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

    // Override fetch to include blob() for file download
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['audio content'], { type: 'audio/mpeg' }),
      json: async () => ({ success: true }),
    });

    const response = await POST(mockRequest as NextRequest);

    expect(response.status).toBe(200);
    // Audit logs are inserted via getSupabaseServer (not admin)
    expect(mockSupabase.from).toHaveBeenCalledWith('auditLogs');
  });
});

describe('GET /api/media/transcribe', () => {
  let mockRequest: Partial<NextRequest>;
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup supabaseBrowser mock for Bearer auth
    mockSupabaseBrowser.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Create chainable query builder for GET endpoint
    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(), // Chainable for multiple .eq() calls
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
    };

    vi.mocked(supabaseModule.getSupabaseServer).mockResolvedValue(mockSupabase);
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
    // Override to return media without transcript
    mockSupabase.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(), // Chainable
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'media-123',
          transcript: null, // No transcription yet
        },
        error: null,
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
