/**
 * POST /api/founder/vault/agent-access
 *
 * Bron requests a credential by label/key.
 * Token-authenticated (x-vault-token header), not session-based.
 *
 * Request: { credentialKey: string; reason: string }
 * Returns: { value: string } on success
 *
 * Security:
 * - Token must match UNITE_HUB_VAULT_TOKEN env var
 * - Credential must have agent_accessible = true
 * - Rate limited: 10 req/min per token
 * - All access is audit-logged
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createDecipheriv } from 'crypto';

// ─── Rate limiter (module-level, per-process) ───────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(token: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(token);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(token, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

// ─── Decrypt helper ─────────────────────────────────────────────────────────

function decryptSecret(encrypted: string): string {
  const keyHex = process.env.VAULT_ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error('VAULT_ENCRYPTION_KEY not configured');
  }
  const key = Buffer.from(keyHex, 'hex');
  const { iv, tag, ciphertext } = JSON.parse(encrypted);
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

// ─── POST ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // Token auth
    const token = req.headers.get('x-vault-token');
    const expectedToken = process.env.UNITE_HUB_VAULT_TOKEN;

    if (!expectedToken || !token || token !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    // Rate limit
    if (!checkRateLimit(token)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded (10 req/min)' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { credentialKey, reason } = body;

    if (!credentialKey || typeof credentialKey !== 'string') {
      return NextResponse.json({ error: 'credentialKey is required' }, { status: 400 });
    }

    if (!reason || typeof reason !== 'string') {
      return NextResponse.json({ error: 'reason is required' }, { status: 400 });
    }

    // Look up credential by label (case-insensitive)
    const { data: item, error } = await supabaseAdmin
      .from('founder_vault_items')
      .select('id, label, secret_encrypted, agent_accessible, owner_id')
      .ilike('label', credentialKey)
      .limit(1)
      .single();

    if (error || !item) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
    }

    // Check agent_accessible flag
    if (!item.agent_accessible) {
      return NextResponse.json(
        { error: 'This credential is restricted to Phill only' },
        { status: 403 }
      );
    }

    // Decrypt
    const value = decryptSecret(item.secret_encrypted);

    // Audit log
    await supabaseAdmin
      .from('founder_vault_audit_log')
      .insert({
        item_id: item.id,
        owner_id: item.owner_id,
        action: 'view',
        ip_address: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'agent',
      })
      .catch(() => null);

    // Also log to approval_queue for visibility
    await supabaseAdmin
      .from('approval_queue')
      .insert({
        type: 'agent_output',
        title: `Vault access: ${item.label}`,
        summary: `Agent accessed credential "${item.label}". Reason: ${reason}`,
        content_json: {
          credential_label: item.label,
          reason,
          accessed_at: new Date().toISOString(),
        },
        status: 'executed',
        priority: 3,
        agent_source: 'bron',
        owner_id: item.owner_id,
      })
      .catch(() => null);

    return NextResponse.json({ value });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[POST /api/founder/vault/agent-access]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
