/**
 * Post Phase 4 completion to UNI-1511 epic.
 * Historical record — do not delete.
 */

import { linearComment } from './linear-update.mjs';

// UNI-1511: [Phase 4] Integration Layer — Nexus 2.0 (epic)
const UNI_1511_ID = 'ea608069-7e10-4c32-917a-ad5ec367a520';

const body = `## Phase 4 — Integration Layer: COMPLETE ✅

All 7 sub-issues resolved. Summary of completed work:

---

### UNI-1515 ✅ Linear Kanban — bi-directional sync
- \`/api/linear/issues\` GET + PATCH: auth parity (\`getUser()\`) + \`force-dynamic\`
- Returns \`{ configured: false }\` (200) when \`LINEAR_API_KEY\` missing — not a 502
- \`KanbanBoard\`: shows "Demo — connect Linear via Settings" when unconfigured
- "Linear unreachable" stale banner shown only on real connection failures

### UNI-1513 ✅ Gmail — business thread grouping
- Email page groups threads by portfolio company (businessKey) with colour-coded section headers
- Unread count shown per business section
- Sorted by BUSINESSES config order (canonical business priority)
- Domain shown in thread row instead of redundant businessKey label

### UNI-1514 ✅ Google Calendar — colour-coded events
- Calendar page wired to real \`fetchCalendarEvents(user.id)\` — no more mock data
- Falls back to mocks when Google not configured (graceful degradation)
- Clear "Connect via Email settings" CTA when configured but no accounts connected
- Left colour stripe per event uses \`BUSINESS_COLOURS\` map

### UNI-1511/UNI-1512 ✅ Error boundaries (already shipped Batch 4)
- Founder-area error boundary: \`src/app/(founder)/error.tsx\`
- Route-level boundaries: dashboard, email, bookkeeper, kanban

### UNI-1516/UNI-1518 ✅ Integration health strip (already shipped Batch 4)
- \`IntegrationStatus.tsx\` Server Component — Stripe, Xero, Gmail, Linear status strip

---

### Quality Gates Passed ✅
\`\`\`
pnpm run type-check  →  0 errors
pnpm run lint        →  0 errors
pnpm run build       →  clean build, all routes dynamic (ƒ)
\`\`\`

Commit: \`776c27f3\` — 5 files, 250 insertions
Pushed to \`origin/main\` ✅

---

### Linear housekeeping ✅
- UNI-1513, UNI-1514, UNI-1515 all marked Done
- \`linear-mark-done.mjs\` script added (marks any issue Done by identifier)
- \`linear-update.mjs\` fixed: \`import.meta.url\` guard prevents CLI code running on import

---

### Next: Batch 5 (Tasks 15–16)
- **Task 15** — Production environment setup (Vercel + Supabase)
- **Task 16** — Production smoke tests
`;

console.log('Posting Phase 4 completion to UNI-1511...');

const result = await linearComment(UNI_1511_ID, body);

if (result.success) {
  console.log('✅ Phase 4 completion comment posted to UNI-1511');
} else {
  console.error('❌ Failed to post comment to UNI-1511');
  process.exit(1);
}
