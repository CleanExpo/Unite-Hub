/**
 * POST /api/founder/openclaw/proxy
 *
 * Secure server-side proxy for OpenClaw API calls.
 * The frontend never needs the API key — this route handles authentication.
 *
 * Body: { path: string, method?: string, body?: unknown }
 *
 * Credential lookup order:
 *   1. OPENCLAW_URL + OPENCLAW_API_KEY env vars
 *   2. founder_vault_items (label ILIKE '%openclaw%' or '%open-claw%')
 *
 * Includes a 10-second request timeout.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase';
import { getVaultItemDecrypted } from '@/lib/security/founder-vault';

export const runtime = 'nodejs';

const PROXY_TIMEOUT_MS = 10_000;

// ─── Credential resolution ────────────────────────────────────────────────────

interface OpenClawCredentials {
  url: string;
  apiKey: string;
  vaultItemId?: string;
}

async function resolveCredentials(userId: string): Promise<OpenClawCredentials | null> {
  // Priority 1: env vars
  const envUrl = process.env.OPENCLAW_URL;
  const envKey = process.env.OPENCLAW_API_KEY;
  if (envUrl && envKey) {
    return { url: envUrl.replace(/\/$/, ''), apiKey: envKey };
  }

  // Priority 2: Founder Vault
  try {
    const { data: vaultItems, error } = await supabaseAdmin
      .from('founder_vault_items')
      .select('id, url')
      .eq('owner_id', userId)
      .or('label.ilike.%openclaw%,label.ilike.%open-claw%')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !vaultItems || vaultItems.length === 0) return null;

    const vaultItem = vaultItems[0];
    if (!vaultItem.url) return null;

    // Decrypt the secret from the vault
    const { secret } = await getVaultItemDecrypted(vaultItem.id, userId);

    return {
      url: vaultItem.url.replace(/\/$/, ''),
      apiKey: secret,
      vaultItemId: vaultItem.id,
    };
  } catch (err) {
    console.warn('[openclaw/proxy] Vault credential lookup failed:', err);
    return null;
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // ── Auth check ─────────────────────────────────────────────────────────
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorised' }, { status: 401 });
    }

    // ── Parse request body ─────────────────────────────────────────────────
    let parsed: { path?: string; method?: string; body?: unknown };
    try {
      parsed = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const { path, method = 'GET', body } = parsed;

    if (!path || typeof path !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing required field: path' },
        { status: 400 }
      );
    }

    // Prevent SSRF — only allow relative paths
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return NextResponse.json(
        { success: false, error: 'path must be a relative path, not a full URL' },
        { status: 400 }
      );
    }

    // ── Resolve credentials ────────────────────────────────────────────────
    const creds = await resolveCredentials(user.id);
    if (!creds) {
      return NextResponse.json(
        {
          success: false,
          error: 'OpenClaw is not configured. Set OPENCLAW_URL and OPENCLAW_API_KEY env vars, or store credentials in the Founder Vault.',
        },
        { status: 503 }
      );
    }

    // ── Forward to OpenClaw ────────────────────────────────────────────────
    const targetUrl = `${creds.url}${path.startsWith('/') ? path : `/${path}`}`;
    const upperMethod = (method as string).toUpperCase();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

    let upstream: Response;
    try {
      upstream = await fetch(targetUrl, {
        method: upperMethod,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${creds.apiKey}`,
          'X-Forwarded-By': 'unite-group-crm',
        },
        body: body !== undefined && upperMethod !== 'GET' && upperMethod !== 'HEAD'
          ? JSON.stringify(body)
          : undefined,
        signal: controller.signal,
      });
    } catch (fetchErr: unknown) {
      const isAbort = fetchErr instanceof Error && fetchErr.name === 'AbortError';
      return NextResponse.json(
        {
          success: false,
          error: isAbort
            ? 'Request to OpenClaw timed out after 10 seconds'
            : `Failed to reach OpenClaw: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`,
        },
        { status: isAbort ? 504 : 502 }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    // ── Return upstream response ───────────────────────────────────────────
    let responseData: unknown;
    const contentType = upstream.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
      responseData = await upstream.json();
    } else {
      responseData = { text: await upstream.text() };
    }

    return NextResponse.json(responseData, { status: upstream.status });
  } catch (error) {
    console.error('[openclaw/proxy] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
