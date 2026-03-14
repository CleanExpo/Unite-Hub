/**
 * One-shot: Post Batch 4 completion progress to UNI-1511.
 *
 * Run: LINEAR_API_KEY=lin_api_xxx node scripts/linear-batch4-update.mjs
 *
 * Historical record — do not delete.
 */

import { linearComment } from './linear-update.mjs';

// UNI-1511: [Phase 4] Integration Layer — Nexus 2.0 (epic)
const UNI_1511_ID = 'ea608069-7e10-4c32-917a-ad5ec367a520';

const body = `## Batch 4 Complete ✅

### Batch 4 — Integration Wiring + Error Resilience

- **Task 11** ✅ Linear kanban live wiring — auth parity + Demo fallback
  - \`/api/linear/issues\` GET + PATCH: added \`getUser()\` auth check + \`force-dynamic\`
  - Returns \`{ configured: false }\` (200) when \`LINEAR_API_KEY\` missing — not a 502
  - \`KanbanBoard\`: shows "Demo — connect Linear via Settings" when unconfigured
  - "Linear unreachable" stale banner shown only on real connection failures
  - 60-second polling already in place

- **Task 12** ✅ Founder error boundary — \`src/app/(founder)/error.tsx\`
  - Renders within \`FounderShell\` (sidebar preserved — Next.js hierarchy)
  - Sentry reporting: \`errorBoundary: 'founder'\` tag + digest ref
  - CTA: Try again (reset) + Back to dashboard (Link)
  - Scientific Luxury design: cyan accent, OLED background, \`rounded-sm\`

- **Task 13** ✅ Route-level error boundaries (4 files)
  - \`founder/dashboard/error.tsx\` — "Check integrations" CTA → /founder/vault
  - \`founder/email/error.tsx\` — "Gmail connection may have expired — reconnect"
  - \`founder/bookkeeper/error.tsx\` — "Xero connection may have expired — reconnect"
  - \`founder/kanban/error.tsx\` — "Linear connection may have expired — check API key"
  - All report to Sentry with route-specific \`errorBoundary\` tag

- **Task 14** ✅ Integration health status strip — \`IntegrationStatus.tsx\`
  - Server Component — reads env vars directly, never exposes keys to client
  - Stripe: counts configured businesses (per-key map)
  - Xero: \`isXeroConfigured()\` — single OAuth app
  - Gmail: \`isGoogleConfigured()\` — single OAuth app
  - Linear: \`process.env.LINEAR_API_KEY\` check
  - Wired into dashboard page below KPI grid

### Quality Gates Passed ✅
\`\`\`
pnpm run type-check  →  0 errors
pnpm run lint        →  0 errors
pnpm vitest run xero →  51/51 Xero tests passing
pnpm run build       →  clean build, all routes dynamic
\`\`\`

Commit: \`bcc8afe5\` — 9 files changed, 479 insertions
Pushed to \`origin/main\` ✅

---

### Next: Batch 5 (Tasks 15–16)
- **Task 15** — Production environment setup (Vercel + Supabase)
- **Task 16** — Production smoke tests
`;

console.log('Posting Batch 4 progress to UNI-1511...');

const result = await linearComment(UNI_1511_ID, body);

if (result.success) {
  console.log('✅ Progress comment posted to UNI-1511');
} else {
  console.error('❌ Failed to post comment to UNI-1511');
  process.exit(1);
}
