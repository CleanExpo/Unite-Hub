/**
 * Update Linear with completed work from this session (11/03/2026):
 * 1. MACAS (Multi-Agent Competitive Accounting System) — new issue, Done
 * 2. Vault Change Password — new issue, Done
 * Run: node scripts/linear-session-update.mjs
 */

import { linearGql } from './linear-update.mjs'

const UNI_TEAM   = 'ab9c7810-4dd6-4ce2-8e8f-e1fc94c6b88b'
const DONE       = '1bd0ff72-1041-428a-b2c8-737bf0849173'
const PARENT_1511 = 'ea608069-7e10-4c32-917a-ad5ec367a520'

async function createIssue(input) {
  const data = await linearGql(`
    mutation CreateIssue($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue { identifier title url }
      }
    }
  `, { input })
  return data.issueCreate
}

// 1. MACAS
const macas = await createIssue({
  teamId: UNI_TEAM,
  parentId: PARENT_1511,
  stateId: DONE,
  priority: 2,
  title: '[Phase 4] MACAS — Multi-Agent Competitive Accounting System',
  description: `## Completed 11/03/2026 · Deployed to production

4 AI accounting firms compete over 5 debate rounds to produce the best ATO-compliant tax strategy. Judge (Claude Opus) scores all proposals. Registered accountant must approve before execution.

## Architecture

- **Schema**: 4 tables (advisory_cases, advisory_proposals, advisory_evidence, advisory_judge_scores) with full RLS
- **Agents**: 4 firm agents (claude-sonnet-4-5) + Judge (claude-opus-4-5) with ATO-curated reference bases
- **Debate Engine**: AsyncGenerator, 5 rounds (PROPOSAL → REBUTTAL → COUNTERARGUMENT → RISK → FINAL), Promise.allSettled for parallel calls, exponential backoff retry
- **Streaming**: Supabase Realtime broadcast — fire-and-forget start, live events to browser
- **API**: 8 routes under /api/advisory/cases/
- **Frontend**: AdvisoryWorkbench, 5 tabs (Cases, New Case, Live Debate, Evidence, History), 4 shared components
- **Evidence Ledger**: ATO citation format validation (TR, S., Div, ATO ID)
- **Cost tracking**: ~$1.70/case tracked per proposal

## Commits
- \`65d90c25\` — MACAS (33 files, +3,393 lines)
- \`7642015d\` — ATO Tax Optimizer business → active

## URL
https://unite-group.in/founder/advisory`,
})
console.log('MACAS:', macas.success ? `${macas.issue.identifier} — ${macas.issue.url}` : 'FAILED')

// 2. Vault Change Password
const vault = await createIssue({
  teamId: UNI_TEAM,
  stateId: DONE,
  priority: 3,
  title: '[Vault] Change Master Password — Web Crypto SHA-256 via localStorage',
  description: `## Completed 11/03/2026 · Deployed to production

Added the ability to change the Vault master password from within the app.

## Implementation

- **vault-password.ts**: Web Crypto SHA-256 hash/verify/change via localStorage (default 'nexus2026' seeded on first use)
- **VaultLock.tsx**: Async password verification replaces hardcoded constant
- **VaultChangePassword.tsx**: Modal with current/new/confirm fields, 8-char minimum, mismatch validation, success flash then auto-close
- **VaultPageClient.tsx**: 'Change Password' button visible only when vault is unlocked

## Security note
Password controls UI access only. Actual credential encryption uses VAULT_ENCRYPTION_KEY (AES-256-GCM, unchanged).

## Commit
\`f1ac7732\` — vault change-password + dead planning-status cleanup

## URL
https://unite-group.in/founder/vault`,
})
console.log('Vault:', vault.success ? `${vault.issue.identifier} — ${vault.issue.url}` : 'FAILED')
