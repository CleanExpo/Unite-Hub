# Current State
> Updated by PreCompact hook. Session: ef11b34a

## Active Task
Idle — session complete.

## Recent Architectural Choices
- Removed `/_next/static/:path*` immutable cache header from `next.config.mjs` (commit `2a123f62`)
  - Turbopack dev uses path-based chunk IDs; immutable caching caused permanent stale JS
- Google OAuth login added (`src/app/(auth)/auth/login/page.tsx`) + callback route
- Xero OAuth connect flow added (`src/app/(founder)/integrations/xero/page.tsx`)

## In-Progress Work
None. All changes committed to `main`.

## Next Steps
- Hard-reload `/auth/login` in Chrome (`Ctrl+Shift+R`) to see Google OAuth button
- Enable Google provider in Supabase dashboard (Authentication → Providers)
- Configure Xero developer portal credentials when ready
- Connect CARSI / DR / DR Qld Xero accounts via OAuth

## Last Updated
10/03/2026 (session end)
