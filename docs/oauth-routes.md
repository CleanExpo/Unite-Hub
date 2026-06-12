---
type: doc
component: oauth-routes-reference
status: draft
created: 2026-06-12
owner: hermes-ceo-orchestrator
reviewer: Phill McGurk
related:
  - src/app/api/auth/{meta,linkedin,tiktok,microsoft,google,youtube}/ (live routes)
  - src/components/founder/social/ConnectionStrip.tsx (the UI that links to these)
  - src/app/api/health/connectors/route.ts (the existing health-check surface)
  - 2nd-brain/Outcomes/2026-06-12-environment-variables-corrected.md (gap analysis)
  - Unite-Hub/docs/env-vars.md (per-feature env-var doc)
---

# OAuth Routes — Per-Provider Reference (Unite-Hub)

**Date:** 2026-06-12
**Scope:** every `src/app/api/auth/*/.../route.ts` (5 providers, 10 routes total)
**Audience:** Phill + future agent runs
**Source of truth:** `find src/app/api/auth -name "*.ts" -not -path "*__tests__*"` plus per-route inspection

This doc is the canonical answer to "what OAuth integrations are live in production, what env vars each needs, and what to do if you want to make one work."

---

## A. The 5 live OAuth providers

Each provider has 2 routes: an `authorize` route (which kicks off the OAuth dance by redirecting to the provider) and a `callback` route (which exchanges the auth code for tokens and stores them in the vault). The founder UI's `ConnectionStrip` (in `src/components/founder/social/`) renders 5 "Connect" buttons that link to these authorize routes:

```ts
// from ConnectionStrip.tsx
function authPath(platform: SocialPlatform): string {
  return platform === 'facebook' || platform === 'instagram' ? 'meta' : platform
}
```

| Provider | Auth routes | Founder UI button | Social channels supported |
|---|---|---|---|
| **Meta (Facebook + Instagram)** | `auth/meta/authorize` + `auth/meta/callback` | "Connect Facebook" / "Connect Instagram" | facebook, instagram |
| **LinkedIn** | `auth/linkedin/authorize` + `auth/linkedin/callback` | "Connect LinkedIn" | linkedin |
| **TikTok** | `auth/tiktok/authorize` + `auth/tiktok/callback` | "Connect TikTok" | tiktok |
| **Microsoft** | `auth/microsoft/authorize` + `auth/microsoft/callback` | (no UI button yet, but routes are wired) | (no SocialChannel type yet) |
| **YouTube** | `auth/youtube/...` | (no UI button yet) | youtube |
| **Google** | `auth/google/authorize` + `auth/google/callback` | (used by `/api/auth/google/*` for Gmail/Calendar/Drive OAuth; 36+ hits in src) | (google workspace) |

## B. The env vars each provider needs

| Provider | Required env vars | Optional | Where read |
|---|---|---|---|
| **Meta** | `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` | `NEXT_PUBLIC_APP_URL` (for redirect URI) | `auth/meta/authorize/route.ts`, `auth/meta/callback/route.ts` |
| **LinkedIn** | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` | `NEXT_PUBLIC_APP_URL` | `auth/linkedin/authorize/route.ts`, `auth/linkedin/callback/route.ts` |
| **TikTok** | `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` | `NEXT_PUBLIC_APP_URL` | `auth/tiktok/authorize/route.ts`, `auth/tiktok/callback/route.ts` |
| **Microsoft** | `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` | `NEXT_PUBLIC_APP_URL` | `auth/microsoft/authorize/route.ts`, `auth/microsoft/callback/route.ts` (existing tests cover 8 missing-env scenarios) |
| **YouTube** | (env vars in `src/app/api/auth/youtube/...`) | (same pattern) | (auth/youtube/*) |
| **Google** | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | `GOOGLE_DRIVE_VAULT_FOLDER_ID` (for the Drive integration specifically) | `auth/google/...` (36+ hits across the codebase; existing tests cover 6 missing-env scenarios) |

## C. The "what happens if env vars are absent" contract

| Provider | Authorize behavior | Callback behavior |
|---|---|---|
| **Meta** | Currently: `TypeError` (route throws on `process.env.X!`). 500 surface to the browser. **Bounded work:** add structured 503 with "Connect via Settings → Social" link. | Currently: redirects to `/founder/social?error=missing_params` if code is missing. **Bounded work:** add the same error code path for missing env vars. |
| **LinkedIn** | Same as Meta. | Same as Meta. |
| **TikTok** | Same as Meta. | Same as Meta. |
| **Microsoft** | Currently: structured 500 with `lastError` (per the existing 8 missing-env tests). | Same pattern. |
| **YouTube** | (verify) | (verify) |
| **Google** | Currently: structured 500 with `lastError` (per the existing 6 missing-env tests). | Same pattern. |

**The bounded-work takeaway:** the 3 providers (Meta, LinkedIn, TikTok) need the structured 500 + "Connect via Settings" UX message. Microsoft and Google already do this. **This is the bounded PR I'm building right now** — add the missing tests for Meta/LinkedIn/TikTok, and the structured 500 response.

## D. The "fail loud, never fake" pattern (from `src/lib/integrations/CLAUDE.md`)

> When classifying routes GREEN/AMBER/RED for the portfolio build: a route backed by an integration that can return `source: 'mock'` is **AMBER until proven connected**. The remediation is always the same — make it GREEN (real data) or fail loudly (clear "not connected" state), never a silent fake.

The OAuth routes are **AMBER until proven connected** (no env vars in Vercel). They fail loudly (500 or 307-redirect-with-error) today, which is correct. The bounded work is to:
- Standardize the fail-loud message ("Connect via Settings → Social" link)
- Add tests that prove the fail-loud contract
- Document the operator setup steps

## E. The operator setup (per provider, if Phill wants to make a provider live)

For each provider Phill wants to enable:

1. **Get OAuth client credentials** from the provider's developer portal:
   - **Meta:** https://developers.facebook.com → My Apps → Create App → "Business" type. Get the App ID and App Secret.
   - **LinkedIn:** https://www.linkedin.com/developers/apps → Create App. Get the Client ID and Client Secret.
   - **TikTok:** https://developers.tiktok.com/apps → Create App. Get the Client Key and Client Secret.
   - **Microsoft:** https://portal.azure.com → App Registrations → New Registration. Get the Application (client) ID and Client Secret.
   - **YouTube:** Google Cloud Console (same flow as Google, but with YouTube Data API v3 scope).
2. **Configure redirect URIs** in the provider's console:
   - For each: `https://unite-group.com.au/api/auth/{provider}/callback`
   - And the Vercel preview URL if applicable.
3. **Add the env vars to Vercel production** (and Vercel preview if you want it to work there):
   - `vercel env add FACEBOOK_APP_ID production`
   - `vercel env add FACEBOOK_APP_SECRET production`
   - (and so on per provider)
4. **Verify** the integration via the founder UI: navigate to `/founder/social`, click "Connect Facebook" (or whichever provider), confirm the OAuth flow completes.
5. **Confirm** the channel is stored in the `social_channels` table.

Per provider, the bounded time is ~10-15 min for the operator (excluding the OAuth app-review time at the provider — Facebook and LinkedIn typically take 1-3 business days for app review if the app is new).

## F. What's in this PR (Lane #1, this turn)

1. `src/app/api/auth/linkedin/__tests__/oauth.test.ts` — 6 new tests (LinkedIn authorize + callback)
2. `src/app/api/auth/tiktok/__tests__/oauth.test.ts` — 5 new tests (TikTok authorize + callback)
3. `src/app/api/auth/meta/__tests__/callback.test.ts` — 3 new tests (Meta callback specifically, complementing the existing oauth.test.ts which only covers authorize)
4. This doc (`docs/oauth-routes.md`)

**Total:** 14 new tests + 1 reference doc. All bounded, all mergeable, all on main.

## G. What's NOT in this PR (deferred to follow-on batches)

- The actual structured 500 response for the 3 AMBER providers (Meta, LinkedIn, TikTok) — would require patching the routes' code to catch the env-var throws and return a 503 with a structured body. ~80 LOC + 6 more tests. Bounded but a follow-on.
- Connecting any of these to Vercel production (operator action, per the setup steps above).
- The Microsoft / YouTube / Google routes' "what env vars are needed" docs (the env-vars.md Section F already covers Google; Microsoft and YouTube need similar treatment).
- The Microsoft callback test file (the existing 8 tests are authorize-only, same gap as Meta).
- The Reddit (`src/app/api/social/reddit/...`) dead-code analysis — separate bounded work; Reddit is also reachable from `ConnectionStrip`'s `authPath` mapping.
- The actual `linkedin` channel type — the `SocialPlatform` enum has 'linkedin' but the `PLATFORM_META` for LinkedIn uses the OAuth provider path 'linkedin'. **Verify** the integration end-to-end after env vars land.

---

**Cross-references:**
- Spec: `2nd-brain/.agentic_nexus/SPEC_FINISH_EVERYTHING_2026-06-12.md`
- Per-feature env-var doc: `Unite-Hub/docs/env-vars.md`
- Corrected gap analysis: `2nd-brain/Outcomes/2026-06-12-environment-variables-corrected.md`
- Integration contract: `src/lib/integrations/CLAUDE.md`
- Health connectors route: `src/app/api/health/connectors/route.ts`
- ConnectionStrip UI: `src/components/founder/social/ConnectionStrip.tsx`
