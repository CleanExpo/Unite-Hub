# Current State
> Updated: 10/03/2026 AEST

## Active Task
Xero OAuth app created ("Unite Group Nexus") — awaiting Client ID + Secret from user.
App ID: 29ea9ead-6207-4ad2-b91d-5f46097eab6f

## In-Progress Work
- Xero OAuth app created at developer.xero.com (Web app type)
- Redirect URIs registered: https://unite-group.in/api/xero/callback + http://localhost:3003/api/xero/callback
- Waiting for user to copy Client ID + Secret from Xero config page
- Once credentials received → write to .env.local → connect CARSI, DR, DR Qld

## Next Steps
1. User pastes Client ID + Secret
2. Write XERO_CLIENT_ID + XERO_CLIENT_SECRET to .env.local
3. Test OAuth flow: /founder/xero?business=carsi
4. Add BankTransactions API to xero.ts for per-account transaction history
5. Gmail auto-forward rule → Xero receipt inbox per business

## Recent Architectural Choices
See architectural-decisions.md for logged decisions.

## Last Updated
10/03/2026 AEST (manual)
