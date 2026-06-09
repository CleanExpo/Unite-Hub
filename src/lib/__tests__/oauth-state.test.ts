// Tests for signOAuthState / verifyOAuthState (src/lib/oauth-state.ts).
//
// SCOPE: this covers OAuth STATE integrity — HMAC forgery/tamper protection on the OAuth `state`
// parameter (CSRF defence on OAuth flows). It is a DIFFERENT layer from, and does NOT cover,
// SYN-1019's multi-tenant session/tenant signed-token verification (that layer does not exist in
// this app — Unite-Hub is single-tenant, delegates session-token verification to Supabase GoTrue,
// and does not consume the spine). Do not read these passes as covering SYN-1019.
//
// Pure crypto, no network/DB — runnable in plain `vitest run`.
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import { signOAuthState, verifyOAuthState } from '../oauth-state';

const KEY = 'test-vault-encryption-key-0123456789';

beforeAll(() => {
  process.env.VAULT_ENCRYPTION_KEY = KEY; // read at call time by secret()
});

describe('OAuth-state integrity (CSRF) — signOAuthState / verifyOAuthState', () => {
  it('accepts a validly-signed token and round-trips the payload', () => {
    const payload = { provider: 'google', redirect: '/dashboard', n: 'abc123' };
    expect(verifyOAuthState(signOAuthState(payload))).toEqual(payload);
  });

  it('rejects a token with no signature delimiter', () => {
    const dataOnly = Buffer.from(JSON.stringify({ provider: 'google' })).toString('base64url');
    expect(() => verifyOAuthState(dataOnly)).toThrow(/no signature/);
  });

  it('rejects tampered payload data (recomputed HMAC no longer matches)', () => {
    const state = signOAuthState({ provider: 'google' });
    const dot = state.lastIndexOf('.');
    const data = state.slice(0, dot);
    const sig = state.slice(dot + 1);
    const tamperedData = data.slice(0, -1) + (data.slice(-1) === 'A' ? 'B' : 'A');
    expect(() => verifyOAuthState(`${tamperedData}.${sig}`)).toThrow(/signature mismatch/);
  });

  it('rejects a forged signature minted WITHOUT the secret (the core CSRF protection)', () => {
    const data = Buffer.from(JSON.stringify({ provider: 'google' })).toString('base64url');
    const forgedSig = createHmac('sha256', 'attacker-does-not-know-the-key').update(data).digest('base64url');
    expect(() => verifyOAuthState(`${data}.${forgedSig}`)).toThrow(/signature mismatch/);
  });

  it('rejects a wrong signature of the SAME length (exercises the constant-time path, not a length shortcut)', () => {
    const state = signOAuthState({ provider: 'x' });
    const dot = state.lastIndexOf('.');
    const data = state.slice(0, dot);
    const realSig = state.slice(dot + 1);
    // a different HMAC over different input, but base64url(32-byte digest) is always the same length
    const sameLenWrongSig = createHmac('sha256', KEY).update(data + 'salt').digest('base64url');
    expect(sameLenWrongSig.length).toBe(realSig.length);
    expect(sameLenWrongSig).not.toBe(realSig);
    expect(() => verifyOAuthState(`${data}.${sameLenWrongSig}`)).toThrow(/signature mismatch/);
  });

  it('uses a constant-time comparison (timingSafeEqual), NOT === / !== on the signature bytes', () => {
    const src = readFileSync(new URL('../oauth-state.ts', import.meta.url), 'utf8');
    expect(src).toMatch(/timingSafeEqual\s*\(/);
    expect(src).not.toMatch(/receivedSig\s*[!=]==\s*expectedSig/); // no naive buffer ===/!== compare
  });

  it('DOC GAP (documented, not a protection): does NOT prevent replay — no nonce/expiry, so a valid token verifies repeatedly', () => {
    // The file comment claims state "cannot be replayed or forged". The code prevents FORGERY (above)
    // but has NO replay protection (no nonce, no expiry). This test pins the current behaviour and
    // flags the comment as an overclaim. If replay protection is added later, change this assertion.
    const state = signOAuthState({ provider: 'google' });
    expect(verifyOAuthState(state)).toBeTruthy();
    expect(verifyOAuthState(state)).toBeTruthy(); // replays successfully — gap, by design today
  });
});
