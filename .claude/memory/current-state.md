# Current State
> Updated by PreCompact hook. Session: ef11b34a

## Active Task
Connecting Xero OAuth — waiting for user to log into developer.xero.com.

## Recent Architectural Choices
See architectural-decisions.md for logged decisions.

## In-Progress Work
- Xero integration fully built (xero.ts, /api/xero/callback, /api/xero/revenue, KPICard, KPIGrid)
- XERO_CLIENT_ID + XERO_CLIENT_SECRET NOT yet added to .env.local or Vercel
- Dev server port changed to 3003 (.claude/launch.json)
- Redirect URIs to register: http://localhost:3003/api/xero/callback + https://unite-group.in/api/xero/callback

## Next Steps
1. User logs into developer.xero.com
2. Create OAuth app → copy Client ID + Secret
3. Add to .env.local + Vercel env vars
4. Register redirect URIs
5. Connect 3 business accounts via OAuth (state param = businessKey: dr, nrpg, carsi, ccw)

## Last Updated
10/03/2026 AEST
