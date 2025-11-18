/**
 * Unit Tests for /api/media/upload
 * Tests file upload, validation, storage, and database operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/media/upload/route';
import * as supabaseModule from '@/lib/supabase';
import * as rateLimitModule from '@/lib/rate-limit';

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  getSupabaseServer: vi.fn(),
  getSupabaseAdmin: vi.fn(),
  supabaseBrowser: {
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(),
}));

describe('POST /api/media/upload', () => {
  let mockRequest: Partial<NextRequest>;
  let mockSupabase: any;
  let mockSupabaseAdmin: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Supabase client
    mockSupabase = {
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
        data: { role: 'owner', workspaces: [{ id: 'workspace-123' }] },
        error: null,
      }),
      storage: {
        from: vi.fn().mockReturnValue({
          upload: vi.fn().mockResolvedValue({
            data: { path: 'workspace-123/file-123/test.mp4' },
            error: null,
          }),
          getPublicUrl: vi.fn().mockReturnValue({
            data: { publicUrl: 'https://storage.example.com/test.mp4' },
          }),
        }),
      },
    };

    mockSupabaseAdmin = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'media-123',
          filename: 'test.mp4',
          status: 'processing',
        },
        error: null,
      }),
    };

    // Mock environment
    process.env.MAX_FILE_SIZE_MB = '100';

    vi.mocked(supabaseModule.getSupabaseServer).mockResolvedValue(mockSupabase);
    vi.mocked(supabaseModule.getSupabaseAdmin).mockReturnValue(mockSupabaseAdmin);
    vi.mocked(rateLimitModule.rateLimit).mockResolvedValue(null);
  });

  it('should successfully upload a video file', async () => {
    // Create mock file
    const file = new File(['video content'], 'test.mp4', { type: 'video/mp4' });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('workspace_id', 'workspace-123');
    formData.append('org_id', 'org-123');
    formData.append('file_type', 'video');

    mockRequest = {
      headers: new Headers({ authorization: 'Bearer test-token' }),
      formData: vi.fn().mockResolvedValue(formData),
      nextUrl: {
        origin: 'http://localhost:3008',
      } as any,
    };

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.media).toBeDefined();
    expect(data.media.filename).toBe('test.mp4');
    expect(data.media.status).toBe('processing');
  });

  it('should reject files over size limit', async () => {
    // Create mock file > 100MB
    const largeFile = new File(
      [new ArrayBuffer(101 * 1024 * 1024)],
      'large.mp4',
      { type: 'video/mp4' }
    );
    const formData = new FormData();
    formData.append('file', largeFile);
    formData.append('workspace_id', 'workspace-123');
    formData.append('org_id', 'org-123');
    formData.append('file_type', 'video');

    mockRequest = {
      headers: new Headers({ authorization: 'Bearer test-token' }),
      formData: vi.fn().mockResolvedValue(formData),
    };

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('File too large');
  });

  it('should reject unauthorized requests', async () => {
    vi.mocked(supabaseModule.getSupabaseServer).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Unauthorized'),
        }),
      },
    } as any);

    mockRequest = {
      headers: new Headers(),
      formData: vi.fn(),
    };

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should reject invalid file types', async () => {
    const file = new File(['content'], 'test.exe', { type: 'application/x-msdownload' });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('workspace_id', 'workspace-123');
    formData.append('org_id', 'org-123');
    formData.append('file_type', 'video'); // Says video but is .exe

    mockRequest = {
      headers: new Headers({ authorization: 'Bearer test-token' }),
      formData: vi.fn().mockResolvedValue(formData),
    };

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid file extension');
  });

  it('should enforce workspace access', async () => {
    mockSupabase.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null, // No workspace access
            error: new Error('Not found'),
          }),
        }),
      }),
    });

    const file = new File(['content'], 'test.mp4', { type: 'video/mp4' });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('workspace_id', 'workspace-123');
    formData.append('org_id', 'org-123');
    formData.append('file_type', 'video');

    mockRequest = {
      headers: new Headers({ authorization: 'Bearer test-token' }),
      formData: vi.fn().mockResolvedValue(formData),
    };

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('Access denied');
  });

  it('should rollback storage upload on database error', async () => {
    // Mock database error
    mockSupabaseAdmin.single.mockResolvedValue({
      data: null,
      error: new Error('Database error'),
    });

    // Mock storage remove function
    const mockRemove = vi.fn().mockResolvedValue({ data: null, error: null });
    mockSupabase.storage.from = vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({
        data: { path: 'test-path' },
        error: null,
      }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: 'https://test.com/file' },
      }),
      remove: mockRemove,
    });

    const file = new File(['content'], 'test.mp4', { type: 'video/mp4' });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('workspace_id', 'workspace-123');
    formData.append('org_id', 'org-123');
    formData.append('file_type', 'video');

    mockRequest = {
      headers: new Headers({ authorization: 'Bearer test-token' }),
      formData: vi.fn().mockResolvedValue(formData),
      nextUrl: {
        origin: 'http://localhost:3008',
      } as any,
    };

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('database');
    expect(mockRemove).toHaveBeenCalled(); // Verify rollback
  });

  it('should accept valid tags', async () => {
    const file = new File(['content'], 'test.mp4', { type: 'video/mp4' });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('workspace_id', 'workspace-123');
    formData.append('org_id', 'org-123');
    formData.append('file_type', 'video');
    formData.append('tags', JSON.stringify(['client', 'demo', 'important']));

    mockRequest = {
      headers: new Headers({ authorization: 'Bearer test-token' }),
      formData: vi.fn().mockResolvedValue(formData),
      nextUrl: {
        origin: 'http://localhost:3008',
      } as any,
    };

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Verify tags were passed to database
    const insertCall = mockSupabaseAdmin.insert.mock.calls[0][0];
    expect(insertCall.tags).toEqual(['client', 'demo', 'important']);
  });
});

describe('GET /api/media/upload', () => {
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
            is: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'media-1',
                    filename: 'test1.mp4',
                    file_type: 'video',
                    status: 'completed',
                  },
                  {
                    id: 'media-2',
                    filename: 'test2.mp3',
                    file_type: 'audio',
                    status: 'processing',
                  },
                ],
                error: null,
              }),
            }),
          }),
        }),
      }),
    };

    vi.mocked(supabaseModule.getSupabaseServer).mockResolvedValue(mockSupabase);
  });

  it('should list all media files for workspace', async () => {
    mockRequest = {
      url: 'http://localhost:3008/api/media/upload?workspace_id=workspace-123',
      nextUrl: {
        searchParams: new URLSearchParams('workspace_id=workspace-123'),
      } as any,
    };

    const response = await GET(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.media_files).toHaveLength(2);
    expect(data.count).toBe(2);
  });

  it('should filter by file type', async () => {
    mockRequest = {
      url: 'http://localhost:3008/api/media/upload?workspace_id=workspace-123&file_type=video',
      nextUrl: {
        searchParams: new URLSearchParams('workspace_id=workspace-123&file_type=video'),
      } as any,
    };

    const response = await GET(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should require workspace_id parameter', async () => {
    mockRequest = {
      url: 'http://localhost:3008/api/media/upload',
      nextUrl: {
        searchParams: new URLSearchParams(),
      } as any,
    };

    const response = await GET(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('workspace_id');
  });

  it('should require authentication', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Unauthorized'),
    });

    mockRequest = {
      url: 'http://localhost:3008/api/media/upload?workspace_id=workspace-123',
      nextUrl: {
        searchParams: new URLSearchParams('workspace_id=workspace-123'),
      } as any,
    };

    const response = await GET(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });
});
