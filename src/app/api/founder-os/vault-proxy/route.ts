import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createDecipheriv } from 'crypto';

// ─── Rate Limiter (in-memory, per-process) ──────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(token: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(token);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(token, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

// ─── Vault Decryption (mirrors src/lib/security/founder-vault.ts) ───────────

interface EncryptedBlob {
  iv: string;
  tag: string;
  ciphertext: string;
}

function getVaultKey(): Buffer {
  const keyHex = process.env.VAULT_ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error('VAULT_ENCRYPTION_KEY not configured');
  }
  return Buffer.from(keyHex, 'hex');
}

function decryptSecret(encrypted: string): string {
  const key = getVaultKey();
  const { iv, tag, ciphertext }: EncryptedBlob = JSON.parse(encrypted);
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

// ─── Handler ────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // 1. Verify vault token
    const vaultToken = req.headers.get('x-vault-token');
    const expectedToken = process.env.UNITE_HUB_VAULT_TOKEN;

    if (!expectedToken) {
      return NextResponse.json({ error: 'Vault proxy not configured' }, { status: 503 });
    }

    if (!vaultToken || vaultToken !== expectedToken) {
      return NextResponse.json({ error: 'Invalid vault token' }, { status: 401 });
    }

    // 2. Rate limit
    if (!checkRateLimit(vaultToken)) {
      return NextResponse.json({ error: 'Rate limit exceeded (60/hour)' }, { status: 429 });
    }

    // 3. Parse request
    const { credentialKey, reason } = await req.json();

    if (!credentialKey || typeof credentialKey !== 'string') {
      return NextResponse.json({ error: 'credentialKey is required' }, { status: 400 });
    }

    if (!reason || typeof reason !== 'string') {
      return NextResponse.json({ error: 'reason is required' }, { status: 400 });
    }

    // 4. Look up credential — try founder_vault_items first, then founder_business_vault_secrets
    let secretValue: string | null = null;

    // Try founder_vault_items (label-based lookup)
    const { data: vaultItem } = await supabaseAdmin
      .from('founder_vault_items')
      .select('id, secret_encrypted, owner_id')
      .eq('label', credentialKey)
      .limit(1)
      .maybeSingle();

    if (vaultItem?.secret_encrypted) {
      // Decrypt using AES-256-GCM
      secretValue = decryptSecret(vaultItem.secret_encrypted);
    } else {
      // Fallback: try founder_business_vault_secrets (plaintext storage)
      const { data: bizSecret } = await supabaseAdmin
        .from('founder_business_vault_secrets')
        .select('id, secret_payload, metadata')
        .eq('secret_label', credentialKey)
        .limit(1)
        .maybeSingle();

      if (bizSecret?.secret_payload) {
        // Check agent_accessible flag if present in metadata
        const metadata = bizSecret.metadata as Record<string, unknown> | null;
        if (metadata && metadata.agent_accessible === false) {
          return NextResponse.json({ error: 'Credential not agent-accessible' }, { status: 403 });
        }
        secretValue = bizSecret.secret_payload;
      }
    }

    if (!secretValue) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
    }

    // 5. Audit log — write access event to project_events
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    await supabaseAdmin
      .from('project_events')
      .insert({
        project_id: null,
        event_type: 'vault.access',
        payload: { key: credentialKey, reason, ip },
      })
      .catch(() => null); // Non-fatal

    // 6. Return decrypted value — never log it
    return NextResponse.json({ value: secretValue });
  } catch (err) {
    console.error('[vault-proxy] Error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
