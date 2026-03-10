/**
 * One-shot: Post Batch 1 & 2 completion progress to UNI-1511.
 *
 * Run: LINEAR_API_KEY=lin_api_xxx node scripts/linear-batch2-update.mjs
 *
 * Historical record — do not delete.
 */

import { linearComment } from './linear-update.mjs';

// UNI-1511: [Phase 4] Integration Layer — Nexus 2.0 (epic)
const UNI_1511_ID = 'ea608069-7e10-4c32-917a-ad5ec367a520';

const body = `## Batch 1 & 2 Complete ✅

### Batch 1 — Production Hardening
- **Task 1** ✅ Stripe per-business key resolution — \`STRIPE_KEY_MAP\`, auth parity with Xero route
- **Task 2** ✅ KPI dashboard — fake numbers replaced with neutral \`—\` placeholders; \`dr_qld\` added to grid
- **Task 3** ✅ Build-time env validation — \`src/instrumentation.ts\` (Next.js 16 native \`register()\` hook)

### Batch 2 — V1 Bloat Removal (~378MB)
- **Task 4** ✅ Dead directories deleted: \`convex/\`, \`apps/backend/\`, \`apps/web/\`, \`modules/\`, \`lib/\`, \`_disabled/\`, \`archived/\`, \`examples/\`, \`skills/\`, \`tests/\`
- **Task 5** ✅ 25 dead packages removed: Three.js, ReactFlow, FullCalendar (5×), OpenTelemetry (7×), Neo4j, Puppeteer, Bull, BullMQ, Convex, Elk.js…
- **Task 6** ✅ Config cleaned — dead path aliases removed from \`tsconfig.json\`; dead \`transpilePackages\` + \`lodash\` removed from \`next.config.mjs\`
- **Task 7** ✅ Dead CI workflows deleted: \`ci-starter.yml\`, \`self-improvement.yml\`, \`agent-pr-checks.yml\`

### Quality Gates Passed ✅
\`\`\`
pnpm run type-check  →  0 errors
pnpm run lint        →  0 errors
pnpm run build       →  clean build, 33 routes
\`\`\`

Commit: \`a722660b\` — 686 files changed, 217,763 deletions
Pushed to \`origin/main\` ✅

---

### Next: Batch 3 (Tasks 8–10)
- **Task 8** — Fix Xero P&L expenses parser (hardcoded zeros → real calculations from P&L report sections)
- **Task 9** — Delete dead Google OAuth stub (\`/api/google/callback/route.ts\`)
- **Task 10** — Gmail thread caching (5-min in-memory TTL — eliminates ~60 API calls per page load)
`;

console.log('Posting Batch 1 & 2 progress to UNI-1511...');

const result = await linearComment(UNI_1511_ID, body);

if (result.success) {
  console.log('✅ Progress comment posted to UNI-1511');
} else {
  console.error('❌ Failed to post comment to UNI-1511');
  process.exit(1);
}
