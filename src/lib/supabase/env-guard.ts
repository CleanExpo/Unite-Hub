/**
 * Supabase Environment Guard
 *
 * Centralises runtime validation of the Supabase env vars so that a missing
 * or truncated key fails LOUD and SPECIFIC instead of surfacing later as the
 * cryptic Supabase gateway error:
 *
 *   {"message":"No API key found in request",
 *    "hint":"No `apikey` request header or url param was found."}
 *
 * That gateway error means a request reached Supabase with NO `apikey` header
 * at all — which happens when `createServerClient` / `createClient` is handed an
 * `undefined` or empty key (e.g. an environment where the var was never set, or
 * was set to a truncated placeholder like "eyJ...").
 *
 * Every server-side Supabase entry point (server.ts, service.ts, middleware.ts)
 * should resolve its key through these helpers.
 */

// A real Supabase JWT key is a long base64url string (200+ chars). Anything
// shorter is almost certainly a truncated placeholder. We use 40 as a very
// conservative floor so we never reject a legitimate key.
const MIN_KEY_LENGTH = 40;

function describeEnv(): string {
  // VERCEL_ENV is "production" | "preview" | "development" on Vercel.
  const scope =
    process.env.VERCEL_ENV ??
    process.env.NODE_ENV ??
    'unknown';
  return scope;
}

/**
 * Resolve a required Supabase env var, throwing a clear, actionable error if it
 * is missing or obviously truncated.
 *
 * @param name  The env var name (used verbatim in the error message).
 * @param value The raw value read from process.env.
 * @param kind  'key' applies the minimum-length floor (keys are long JWTs);
 *              'url' only checks presence + the "..." placeholder, since a
 *              valid Supabase URL can be well under 40 chars.
 */
export function requireSupabaseEnv(
  name: string,
  value: string | undefined,
  kind: 'key' | 'url' = 'key',
): string {
  const scope = describeEnv();

  if (value === undefined || value.trim() === '') {
    throw new Error(
      `Missing ${name} at runtime (env: ${scope}) — set it in this ` +
        `environment's Vercel env (Preview/Production) or .env.local. ` +
        `Without it, Supabase requests are sent with NO apikey header and fail ` +
        `with "No API key found in request".`,
    );
  }

  const trimmed = value.trim();
  const tooShort = kind === 'key' && trimmed.length < MIN_KEY_LENGTH;

  if (trimmed.includes('...') || tooShort) {
    throw new Error(
      `${name} looks truncated/placeholder at runtime (env: ${scope}, ` +
        `length: ${trimmed.length}) — replace it with the real key in ` +
        `this environment's Vercel env (Preview/Production) or .env.local. ` +
        `A truncated key causes Supabase to reject requests with ` +
        `"No API key found in request".`,
    );
  }

  return trimmed;
}

/**
 * Resolve the Supabase URL + anon key pair used by the SSR clients.
 */
export function getSupabaseAnonConfig(): { url: string; anonKey: string } {
  return {
    url: requireSupabaseEnv(
      'NEXT_PUBLIC_SUPABASE_URL',
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      'url',
    ),
    anonKey: requireSupabaseEnv(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
  };
}

/**
 * Resolve the Supabase URL only (no key). Callers that own a restricted key
 * (e.g. service.ts reading SUPABASE_SERVICE_ROLE_KEY under its lint allowlist)
 * read the key themselves and validate it with `requireSupabaseEnv`.
 */
export function getSupabaseUrl(): string {
  return requireSupabaseEnv(
    'NEXT_PUBLIC_SUPABASE_URL',
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    'url',
  );
}
