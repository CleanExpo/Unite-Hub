import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks (hoisted above all imports by Vitest transform) ────────────────────

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

// ── Static imports (resolved AFTER vi.mock() hoisting) ───────────────────────

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GET } from '../route';

// ── Mock helpers ─────────────────────────────────────────────────────────────

const mockMaybySingle = vi.fn();
const mockLimit = vi.fn(() => ({ maybeSingle: mockMaybySingle }));
const mockSelect = vi.fn(() => ({ limit: mockLimit }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

const mockCookieStore = {
  getAll: vi.fn(() => []),
  set: vi.fn(),
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset implementation after clearAllMocks (clearAllMocks clears calls but
    // not implementations set via mockReturnValue — however we re-set them here
    // explicitly for clarity and safety)
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);
    vi.mocked(createServerClient).mockReturnValue({ from: mockFrom } as any);

    // Default: empty table (PGRST116 = table exists, no rows — connection is fine)
    mockMaybySingle.mockResolvedValue({ error: { code: 'PGRST116' } });
  });

  it('returns 200 with ok status when Supabase is reachable', async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.connections.supabase).toBe('ok');
    expect(typeof body.timestamp).toBe('string');
  });

  it('returns 200 when table exists but is empty (PGRST116)', async () => {
    mockMaybySingle.mockResolvedValue({
      error: { code: 'PGRST116', message: 'Fetched 0 rows' },
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.connections.supabase).toBe('ok');
  });

  it('returns 503 with degraded status when Supabase query returns an error', async () => {
    mockMaybySingle.mockResolvedValue({
      error: { code: '42P01', message: 'relation "nexus_pages" does not exist' },
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe('degraded');
    expect(body.connections.supabase).toBe('error');
  });

  it('returns 503 when Supabase client throws an exception', async () => {
    vi.mocked(createServerClient).mockReturnValue({
      from: vi.fn(() => {
        throw new Error('Connection refused');
      }),
    } as any);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.connections.supabase).toBe('error');
  });

  it('includes a timestamp in the response', async () => {
    const before = new Date().toISOString();
    const response = await GET();
    const after = new Date().toISOString();
    const body = await response.json();

    expect(body.timestamp >= before).toBe(true);
    expect(body.timestamp <= after).toBe(true);
  });
});
