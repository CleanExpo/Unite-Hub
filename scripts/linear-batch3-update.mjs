/**
 * One-shot: Post Batch 3 completion progress to UNI-1511.
 *
 * Run: LINEAR_API_KEY=lin_api_xxx node scripts/linear-batch3-update.mjs
 *
 * Historical record — do not delete.
 */

import { linearComment } from './linear-update.mjs';

// UNI-1511: [Phase 4] Integration Layer — Nexus 2.0 (epic)
const UNI_1511_ID = 'ea608069-7e10-4c32-917a-ad5ec367a520';

const body = `## Batch 3 Complete ✅

### Batch 3 — Bug Fixes + Caching

- **Task 8** ✅ Xero P\&L expenses parser fixed — no more hardcoded zeros
  - \`parsePandLExpenses()\` — sums 'Less Cost of Sales' + 'Less Operating Expenses'
  - \`calculateMoMGrowth()\` — MoM % from two-period P\&L (\`periods=2\`)
  - Invoice count: best-effort inner try/catch (non-fatal, rate-limit safe)
  - 8 new unit tests added → 51 total, all green

- **Task 9** ✅ Dead Google OAuth stub deleted — \`/api/google/callback/route.ts\`
  - Confirmed zero live references before deletion
  - Real OAuth callback at \`/api/auth/google/callback\` unaffected

- **Task 10** ✅ Gmail thread caching — 5-min in-memory TTL
  - New \`src/lib/cache.ts\`: \`getCached / setCache / invalidateCache\`
  - \`fetchGmailThreads\` cached: key \`gmail:{founderId}\`, 5-min TTL
  - \`fetchCalendarEvents\` cached: key \`calendar:{founderId}\`, 5-min TTL
  - \`invalidateGoogleCache(founderId)\` exported for manual refresh button
  - ~60 API calls per page load → ~0 on cache hit

### Quality Gates Passed ✅
\`\`\`
pnpm run type-check  →  0 errors
pnpm run lint        →  0 errors
pnpm vitest run      →  51/51 Xero tests passing
pnpm run build       →  clean build, 33 routes
\`\`\`

Commit: \`00d76e58\` — 8 files changed, 536 insertions
Pushed to \`origin/main\` ✅

**Bonus:** \`scripts/linear-update.mjs\` — permanent fix for Linear API reliability
- File-based ESM completely bypasses bash string interpolation on backticks
- Root cause of all previous Linear update failures: \`node -e "..."\` with backtick-quoted identifiers

---

### Next: Batch 4 (Tasks 11–14)
- **Task 11** — Linear kanban live wiring (\`/founder/kanban/page.tsx\` → \`fetchIssues()\`)
- **Task 12** — Founder error boundary (\`src/app/(founder)/error.tsx\`)
- **Task 13** — Route-level error boundaries (dashboard, email, bookkeeper, kanban)
- **Task 14** — Integration health status strip (\`IntegrationStatus.tsx\`)
`;

console.log('Posting Batch 3 progress to UNI-1511...');

const result = await linearComment(UNI_1511_ID, body);

if (result.success) {
  console.log('✅ Progress comment posted to UNI-1511');
} else {
  console.error('❌ Failed to post comment to UNI-1511');
  process.exit(1);
}
