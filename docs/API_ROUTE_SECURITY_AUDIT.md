# API Route Security Audit Report

**Generated:** 2025-12-02T10:43:24.737Z

**Summary:** Analyzed 683 API routes in Unite-Hub

---

## Executive Summary

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ Protected (User Auth) | 589 | 86.2% |
| 🌐 Public (Intentional) | 17 | 2.5% |
| ⏰ Cron (CRON_SECRET) | 4 | 0.6% |
| 🔗 Webhook (Signature) | 2 | 0.3% |
| 🔑 Auth Endpoint | 6 | 0.9% |
| ⚠️ **MISSING AUTH** | **65** | **9.5%** |

**Authentication Coverage:** 90.5%

---

## Critical Security Issues

⚠️ **CRITICAL:** 65 routes have NO AUTHENTICATION

These routes need immediate attention:

- `/api/ai/generate-proposal`
- `/api/ai/interpret-idea`
- `/api/aido/auth/ga4/url`
- `/api/aido/auth/gbp/url`
- `/api/aido/auth/gsc/url`
- `/api/audits`
- `/api/client/ideas`
- `/api/client/proposals`
- `/api/client/vault`
- `/api/connected-apps/callback/[provider]`
- `/api/creative/insights`
- `/api/creative/quality`
- `/api/director/alerts`
- `/api/director/insights`
- `/api/email/oauth/authorize`
- `/api/enterprise/billing/plans`
- `/api/evolution/proposals`
- `/api/executive/briefing`
- `/api/executive/missions`
- `/api/founder/business-vault`
- `/api/founder/business-vault/[businessKey]/channel`
- `/api/founder/business-vault/[businessKey]/snapshot`
- `/api/founder/synthex/setup-analytics`
- `/api/integrations/gmail/callback-multi`
- `/api/integrations/gmail/connect`
- `/api/integrations/gmail/connect-multi`
- `/api/integrations/outlook/callback`
- `/api/integrations/outlook/connect`
- `/api/leviathan/orchestrate`
- `/api/managed/reports/generate`
- `/api/managed/reports/send`
- `/api/marketing/events`
- `/api/marketing/insights`
- `/api/monitoring/metrics`
- `/api/posting/attempts`
- `/api/posting/scheduler`
- `/api/privacy/subject-access-request`
- `/api/reports/sample-by-persona`
- `/api/scaling-mode/health`
- `/api/scaling-mode/history`
- `/api/seo/competitive-benchmark`
- `/api/seo/keyword-gap`
- `/api/staff/activity`
- `/api/staff/me`
- `/api/staff/projects`
- `/api/staff/tasks`
- `/api/staff/tasks/[id]`
- `/api/synthex/offer`
- `/api/synthex/seo/analyses`
- `/api/synthex/seo/analyze`
- `/api/synthex/video/generate`
- `/api/synthex/video/jobs`
- `/api/synthex/video/templates`
- `/api/synthex/visual/brand-kits`
- `/api/synthex/visual/capabilities`
- `/api/synthex/visual/generate`
- `/api/synthex/visual/jobs`
- `/api/trust/signature/callback`
- `/api/v1/agents/orchestrator`
- `/api/v1/auth/session`
- `/api/v1/campaigns`
- `/api/v1/contacts`
- `/api/v1/contacts/[id]`
- `/api/v1/emails`
- `/api/visual/transformation`

---

## Detailed Route Inventory

### ✅ Protected Routes (User Authentication) - 589 routes

Routes requiring user authentication via `validateUserAndWorkspace`, `validateUserAuth`, or `getUser()`:

| Route | Auth Patterns | Lines |
|-------|---------------|-------|
| `/api/admin/approve-access` | getUser, getSupabaseServer | 174 |
| `/api/admin/pending-approvals` | getUser, getSupabaseServer | 76 |
| `/api/admin/rate-limits/block-ip` | withApiHandler | 92 |
| `/api/admin/rate-limits` | withApiHandler | 110 |
| `/api/admin/sandbox-users` | getUser, getSupabaseServer | 243 |
| `/api/admin/send-approval-email` | getUser, getSupabaseServer | 173 |
| `/api/admin/trusted-devices` | getUser, getSupabaseServer | 146 |
| `/api/ads/accounts` | getUser, getSupabaseServer | 143 |
| `/api/ads/campaigns` | getUser, getSupabaseServer | 130 |
| `/api/ads/opportunities` | getUser, getSupabaseServer | 141 |
| `/api/agency/create` | getUser, getSupabaseServer | 69 |
| `/api/agency/switch` | getUser, getSupabaseServer | 98 |
| `/api/agent/execute` | getUser, getSupabaseServer | 227 |
| `/api/agent/plan` | getUser, getSupabaseServer | 203 |
| `/api/agent/status` | getUser, getSupabaseServer | 231 |
| `/api/agent-mandates` | getUser, getSupabaseServer | 99 |
| `/api/agents/contact-intelligence` | validateUserAuth, validateWorkspaceAccess | 66 |
| `/api/agents/content-personalization` | getUser, getSupabaseServer | 94 |
| `/api/agents/continuous-intelligence` | cronSecret, authHeader, getSupabaseServer | 179 |
| `/api/agents/intelligence-extraction` | validateUserAuth, validateWorkspaceAccess, getSupabaseServer | 134 |
| `/api/ai/analyze-stripe` | validateUserAuth | 68 |
| `/api/ai/auto-reply` | validateUserAuth | 136 |
| `/api/ai/budget` | getUser, getSupabaseServer | 117 |
| `/api/ai/campaign` | validateUserAuth | 184 |
| `/api/ai/chat` | getUser, getSupabaseServer | 98 |
| `/api/ai/cost-dashboard` | getUser, getSupabaseServer | 61 |
| `/api/ai/extended-thinking/batch` | getUser, getSupabaseServer | 211 |
| `/api/ai/extended-thinking/execute` | getUser, getSupabaseServer | 187 |
| `/api/ai/extended-thinking/prompts` | getUser | 97 |
| `/api/ai/extended-thinking/stats` | getUser, getSupabaseServer | 219 |
| `/api/ai/generate-code` | validateUserAuth | 79 |
| `/api/ai/generate-image` | validateUserAuth | 115 |
| `/api/ai/generate-marketing` | validateUserAuth | 60 |
| `/api/ai/hooks` | validateUserAuth | 146 |
| `/api/ai/mindmap` | validateUserAuth | 158 |
| `/api/ai/persona` | validateUserAuth | 182 |
| `/api/ai/strategy` | validateUserAuth | 198 |
| `/api/ai/test-models` | validateUserAuth | 242 |
| `/api/ai-consultations` | getUser, getSupabaseServer | 117 |
| `/api/ai-consultations/[id]` | getUser, getSupabaseServer | 125 |
| `/api/ai-workload/policies` | getUser | 50 |
| `/api/ai-workload/snapshots` | getUser | 24 |
| `/api/aido/auth/ga4/callback` | getSession | 96 |
| `/api/aido/auth/gbp/callback` | getSession | 96 |
| `/api/aido/auth/gsc/callback` | getSession | 96 |
| `/api/aido/clients` | getUser, getSupabaseServer | 160 |
| `/api/aido/clients/[id]` | getUser | 189 |
| `/api/aido/content/generate` | getUser | 164 |
| `/api/aido/content` | getUser | 76 |
| `/api/aido/content/[id]` | getUser | 102 |
| `/api/aido/google-curve/analyze` | getUser | 176 |
| `/api/aido/google-curve/monitor` | getUser, cronSecret | 104 |
| `/api/aido/google-curve/signals` | getUser | 71 |
| `/api/aido/intent-clusters/generate` | getUser | 105 |
| `/api/aido/intent-clusters` | getUser | 97 |
| `/api/aido/onboarding/generate` | getUser | 343 |
| `/api/aido/reality-loop/events` | getUser | 72 |
| `/api/aido/reality-loop/ingest` | getUser | 92 |
| `/api/aido/reality-loop/process` | getUser | 105 |
| `/api/aido/topics` | getUser, getSupabaseServer | 124 |
| `/api/alignment/snapshot` | getUser | 77 |
| `/api/analytics/overview` | getUser, getSupabaseServer | 239 |
| `/api/analytics/search-console` | getUser, getSupabaseServer | 176 |
| `/api/analytics/sync` | getUser, getSupabaseServer | 230 |
| `/api/analyze/dashboard` | getUser | 60 |
| `/api/approvals` | validateUserAuth, getSupabaseServer | 206 |
| `/api/approvals/[id]/approve` | getUser, getSupabaseServer | 98 |
| `/api/approvals/[id]/decline` | getUser, getSupabaseServer | 106 |
| `/api/approvals/[id]` | validateUserAuth, getSupabaseServer | 99 |
| `/api/arbitration/events` | getUser | 39 |
| `/api/archive/query` | getUser, getSupabaseServer | 147 |
| `/api/audit/backlinks` | getUser, getSupabaseServer | 109 |
| `/api/audit/delta` | getUser, getSupabaseServer | 247 |
| `/api/audit/entities` | getUser, getSupabaseServer | 182 |
| `/api/audit/history` | getUser, getSupabaseServer | 99 |
| `/api/audit/run` | getUser, getSupabaseServer | 268 |
| `/api/audit/snapshot` | getUser, getSupabaseServer | 237 |
| `/api/auto-action/approve` | getUser, getSupabaseServer | 189 |
| `/api/auto-action/logs` | getUser, getSession, getSupabaseServer | 191 |
| `/api/auto-action/session` | getUser, getSupabaseServer | 268 |
| `/api/autonomy/cron` | cronSecret, getSupabaseServer | 165 |
| `/api/autonomy/evaluate` | getUser, getSupabaseServer | 136 |
| `/api/autonomy/proposals/[id]` | getUser, getSupabaseServer | 187 |
| `/api/autonomy/propose` | getUser, getSupabaseServer | 205 |
| `/api/autonomy/queue` | getUser, getSupabaseServer | 139 |
| `/api/autonomy/rollback` | getUser, getSupabaseServer | 147 |
| `/api/autonomy/start` | getUser, getSupabaseServer | 128 |
| `/api/autonomy/status` | getUser, getSupabaseServer | 111 |
| `/api/autopilot/actions/[id]/approve` | getUser, getSupabaseServer | 51 |
| `/api/autopilot/actions/[id]/skip` | getUser, getSupabaseServer | 46 |
| `/api/autopilot/playbooks` | getUser, getSupabaseServer | 126 |
| `/api/autopilot/preferences` | getUser, getSupabaseServer | 91 |
| `/api/autopilot/stats` | getUser, getSupabaseServer | 46 |
| `/api/billing/checkout` | getUser, getSupabaseServer | 227 |
| `/api/billing/portal` | getUser, getSupabaseServer | 102 |
| `/api/billing/subscription` | getUser, getSupabaseServer | 388 |
| `/api/broadcast/messages` | getUser | 71 |
| `/api/broadcast/receipts` | getUser | 37 |
| `/api/browser-automation/patterns` | getUser, getSupabaseServer | 146 |
| `/api/browser-automation/replay` | getUser, getSupabaseServer | 203 |
| `/api/calendar/availability` | validateUserAndWorkspace | 76 |
| `/api/calendar/create-meeting` | validateUserAndWorkspace, validateUserAuth | 93 |
| `/api/calendar/detect-meeting` | validateUserAndWorkspace, validateUserAuth | 72 |
| `/api/calendar/events` | validateUserAndWorkspace, validateUserAuth | 125 |
| `/api/calendar/generate` | validateUserAndWorkspace, validateUserAuth, getUser, getSupabaseServer | 233 |
| `/api/calendar/suggest-times` | validateUserAndWorkspace, validateUserAuth | 64 |
| `/api/calendar/[postId]/approve` | validateUserAndWorkspace, validateUserAuth, getUser, getSupabaseServer | 115 |
| `/api/calendar/[postId]/regenerate` | validateUserAndWorkspace, validateUserAuth, getUser, getSupabaseServer | 221 |
| `/api/calendar/[postId]` | validateUserAndWorkspace, validateUserAuth, getUser, getSupabaseServer | 259 |
| `/api/calibration/parameters` | getUser, getSupabaseServer | 172 |
| `/api/calibration/run` | getUser, getSupabaseServer | 201 |
| `/api/calibration/status` | getUser, getSupabaseServer | 149 |
| `/api/campaigns/blueprints` | getUser, getSupabaseServer | 192 |
| `/api/campaigns/blueprints/[id]` | getUser, getSupabaseServer | 276 |
| `/api/campaigns/channels` | getUser, getSupabaseServer | 94 |
| `/api/campaigns/drip` | validateUserAndWorkspace, getSupabaseServer | 95 |
| `/api/campaigns/from-template` | validateUserAuth, getSupabaseServer | 220 |
| `/api/campaigns` | validateUserAndWorkspace, getSupabaseServer | 172 |
| `/api/client/feature-flags` | getUser, getSupabaseServer | 158 |
| `/api/client/geo` | getUser, getSupabaseServer | 179 |
| `/api/client/init` | getUser, getSupabaseServer | 147 |
| `/api/client/projects/get` | getUser, getSupabaseServer | 130 |
| `/api/client/projects/list` | getUser, getSupabaseServer | 125 |
| `/api/client/proposals/get` | getUser, getSupabaseServer | 129 |
| `/api/client/proposals/select` | getUser, getSupabaseServer | 227 |
| `/api/client/review-packs` | getUser, getSupabaseServer | 45 |
| `/api/client/success` | getUser, getSupabaseServer | 234 |
| `/api/client/welcome-pack` | getUser, getSupabaseServer | 244 |
| `/api/client-agent/actions` | getUser, getSupabaseServer | 152 |
| `/api/client-agent/chat` | getUser, getSession, getSupabaseServer | 203 |
| `/api/client-agent/policies` | getUser, getSupabaseServer | 148 |
| `/api/client-agent/scheduler` | getUser, getSupabaseServer | 130 |
| `/api/client-approvals` | getUser, getSupabaseServer | 187 |
| `/api/clients` | validateUserAndWorkspace | 70 |
| `/api/coaching/operator/prompts` | getUser | 25 |
| `/api/coalition/form` | getUser, getSupabaseServer | 130 |
| `/api/coalition/history` | getUser, getSupabaseServer | 167 |
| `/api/coalition/status` | getUser, getSupabaseServer | 148 |
| `/api/combat/results` | getUser | 101 |
| `/api/combat/rounds` | getUser | 117 |
| `/api/competitors/analysis/latest` | validateUserAuth, getSupabaseServer | 113 |
| `/api/competitors/analyze` | validateUserAuth, getSupabaseServer | 197 |
| `/api/competitors/compare` | validateUserAuth, getSupabaseServer | 140 |
| `/api/competitors` | validateUserAuth, getSupabaseServer | 196 |
| `/api/competitors/[id]` | validateUserAuth, getSupabaseServer | 217 |
| `/api/compliance/check` | getUser | 62 |
| `/api/compliance/incidents` | getUser, getSupabaseServer | 78 |
| `/api/compliance/policies` | getUser | 58 |
| `/api/connected-apps` | getUser, getSupabaseServer | 120 |
| `/api/connected-apps/[id]` | getUser | 106 |
| `/api/contacts/analyze` | validateUserAndWorkspace, getSupabaseServer | 110 |
| `/api/contacts/delete` | validateUserAuth, getSupabaseServer | 104 |
| `/api/contacts/hot-leads` | validateUserAndWorkspace | 52 |
| `/api/contacts` | validateUserAndWorkspace, getSupabaseServer | 192 |
| `/api/contacts/[contactId]/emails` | validateUserAndWorkspace, validateUserAuth | 109 |
| `/api/contacts/[contactId]/emails/[emailId]/primary` | validateUserAndWorkspace, validateUserAuth | 42 |
| `/api/contacts/[contactId]/emails/[emailId]` | validateUserAndWorkspace, validateUserAuth | 112 |
| `/api/contacts/[contactId]` | validateUserAuth, getSupabaseServer | 58 |
| `/api/content/approve` | getUser, getSupabaseServer | 127 |
| `/api/content/iterate` | getUser, getSupabaseServer | 99 |
| `/api/content/pending` | getUser, getSupabaseServer | 87 |
| `/api/content` | validateUserAndWorkspace, getUser, getSupabaseServer | 446 |
| `/api/correction/start` | getUser, getSupabaseServer | 151 |
| `/api/correction/status` | getUser, getSupabaseServer | 143 |
| `/api/council` | getUser | 86 |
| `/api/creative/adaptive/state` | getUser | 42 |
| `/api/creative/adaptive/suggest` | getUser | 42 |
| `/api/creative/risk` | getUser | 50 |
| `/api/cross-tenant/benchmarks` | getUser | 46 |
| `/api/cross-tenant/boundary` | getUser, getSupabaseServer | 66 |
| `/api/cross-tenant/cohorts` | getUser | 51 |
| `/api/cross-tenant/fairness` | getUser | 71 |
| `/api/cross-tenant/learning` | getUser | 70 |
| `/api/cross-tenant/patterns` | getUser | 61 |
| `/api/decisions/pipeline` | getUser | 33 |
| `/api/demo/initialize` | getSupabaseServer | 474 |
| `/api/desktop/capabilities` | getUser, getSupabaseServer | 146 |
| `/api/desktop/command` | getUser, getSupabaseServer | 205 |
| `/api/early-warning/events` | getUser, getSupabaseServer | 73 |
| `/api/early-warning/events/[id]` | getUser, getSupabaseServer | 114 |
| `/api/email/link` | validateUserAuth, getSupabaseServer | 199 |
| `/api/email/oauth/callback` | getUser, getSupabaseServer | 134 |
| `/api/email/parse` | validateUserAndWorkspace, validateUserAuth, getUser, getSupabaseServer | 85 |
| `/api/email/send` | validateUserAndWorkspace, getSupabaseServer | 192 |
| `/api/email/sync` | validateUserAndWorkspace, validateUserAuth, getUser, getSupabaseServer | 86 |
| `/api/email/unsubscribe` | getSupabaseServer | 243 |
| `/api/email/webhook` | getSupabaseServer | 237 |
| `/api/email-intel/client/[clientId]/ideas` | getUser, getSupabaseServer | 175 |
| `/api/email-intel/client/[clientId]` | getUser | 97 |
| `/api/email-intel/client/[clientId]/summary` | getUser, getSupabaseServer | 206 |
| `/api/email-intel/client/[clientId]/threads` | getUser, getSupabaseServer | 94 |
| `/api/email-intel/ideas` | getUser | 126 |
| `/api/email-intel/pending-actions` | getUser | 51 |
| `/api/email-intel/sync` | getUser, getSupabaseServer | 122 |
| `/api/email-intel/threads` | getUser | 67 |
| `/api/emails/process` | validateUserAndWorkspace, validateUserAuth | 67 |
| `/api/emails/send` | getUser, getSupabaseServer | 135 |
| `/api/engines/aglbase` | validateUserAndWorkspace | 82 |
| `/api/engines/aire` | validateUserAndWorkspace | 44 |
| `/api/engines/asrs` | validateUserAndWorkspace | 60 |
| `/api/engines/egcbi` | validateUserAndWorkspace | 52 |
| `/api/engines/grh` | validateUserAndWorkspace | 56 |
| `/api/engines/gslpie` | validateUserAuth | 77 |
| `/api/engines/health` | getUser | 23 |
| `/api/engines/mcse` | validateUserAndWorkspace | 32 |
| `/api/engines/orchestrator` | validateUserAndWorkspace, validateUserAuth | 93 |
| `/api/engines/raaoe` | validateUserAndWorkspace | 44 |
| `/api/engines/sorie` | validateUserAndWorkspace | 48 |
| `/api/engines/tcpqel` | validateUserAndWorkspace | 75 |
| `/api/engines/ucscel` | validateUserAndWorkspace | 73 |
| `/api/engines/upewe` | validateUserAndWorkspace | 36 |
| `/api/enterprise/billing/invoices` | getUser, getSupabaseServer | 54 |
| `/api/enterprise/billing/subscriptions` | getUser, getSupabaseServer | 127 |
| `/api/enterprise/billing/usage` | getUser, getSupabaseServer | 93 |
| `/api/enterprise/init` | getUser, getSupabaseServer | 203 |
| `/api/enterprise/summary` | getUser, getSupabaseServer | 82 |
| `/api/enterprise/teams` | getUser, getSupabaseServer | 298 |
| `/api/enterprise/workspaces` | validateWorkspaceAccess, getUser, getSupabaseServer | 270 |
| `/api/evolution/adjustments/logs` | getUser | 25 |
| `/api/evolution/adjustments/run` | getUser | 27 |
| `/api/evolution/console/review` | getUser | 46 |
| `/api/evolution/kernel/run` | getUser | 25 |
| `/api/evolution/kernel/tasks` | getUser | 27 |
| `/api/evolution/macro` | getUser | 79 |
| `/api/evolution/mesh/overview` | getUser | 29 |
| `/api/evolution/planner/overview` | getUser | 25 |
| `/api/evolution/planner/schedule` | getUser | 51 |
| `/api/evolution/qa/check` | getUser | 25 |
| `/api/evolution/qa/history` | getUser | 25 |
| `/api/evolution/stability/mode` | getUser | 27 |
| `/api/evolution/stability/overview` | getUser | 28 |
| `/api/execution-logs` | validateUserAuth, getSupabaseServer | 57 |
| `/api/executions/start` | getUser, getSupabaseServer | 103 |
| `/api/executions/[id]/cancel` | getUser, getSupabaseServer | 74 |
| `/api/executions/[id]/pause` | getUser, getSupabaseServer | 90 |
| `/api/executions/[id]/resume` | getUser, getSupabaseServer | 74 |
| `/api/executions/[id]/status` | getUser, getSupabaseServer | 129 |
| `/api/experiments/sandbox/create` | getUser | 25 |
| `/api/experiments/sandbox/results` | getUser | 32 |
| `/api/folder/archive` | getUser, getSupabaseServer | 111 |
| `/api/folder/create` | getUser, getSupabaseServer | 124 |
| `/api/folder/list` | getUser, getSupabaseServer | 109 |
| `/api/founder/assistant` | getUser, getSupabaseServer | 170 |
| `/api/founder/awareness` | getUser | 24 |
| `/api/founder/business-vault/[businessKey]` | getUser | 59 |
| `/api/founder/cognitive-map` | getUser | 77 |
| `/api/founder/flight-deck/layout` | getUser | 70 |
| `/api/founder/memory/decision-scenarios` | getUser, getSupabaseServer | 138 |
| `/api/founder/memory/decision-scenarios/[id]` | getUser, getSupabaseServer | 159 |
| `/api/founder/memory/forecast` | getUser, getSupabaseServer | 123 |
| `/api/founder/memory/momentum` | getUser, getSupabaseServer | 87 |
| `/api/founder/memory/next-actions` | getUser, getSupabaseServer | 144 |
| `/api/founder/memory/opportunities` | getUser, getSupabaseServer | 141 |
| `/api/founder/memory/overload` | getUser, getSupabaseServer | 115 |
| `/api/founder/memory/patterns` | getUser, getSupabaseServer | 76 |
| `/api/founder/memory/risks` | getUser, getSupabaseServer | 138 |
| `/api/founder/memory/snapshot` | getUser, getSupabaseServer | 132 |
| `/api/founder/memory/weekly-digest` | getUser, getSupabaseServer | 164 |
| `/api/founder/ops/brand-workload` | getUser, getSupabaseServer | 76 |
| `/api/founder/ops/overview` | getUser, getSupabaseServer | 186 |
| `/api/founder/ops/queue/daily` | getUser, getSupabaseServer | 87 |
| `/api/founder/ops/queue/pause` | getUser, getSupabaseServer | 51 |
| `/api/founder/ops/queue/resume` | getUser, getSupabaseServer | 45 |
| `/api/founder/ops/queue/weekly` | getUser, getSupabaseServer | 89 |
| `/api/founder/ops/tasks` | getUser, getSupabaseServer | 189 |
| `/api/founder/ops/tasks/[taskId]` | getUser, getSupabaseServer | 132 |
| `/api/founder/platform-mode` | getUser, getSupabaseServer | 125 |
| `/api/founder/settings/platform-mode` | getUser, getSupabaseServer | 120 |
| `/api/founder/synthex/sync-core-vitals` | cronSecret | 367 |
| `/api/founder/synthex/sync-ga4` | cronSecret | 266 |
| `/api/founder/synthex/sync-gsc` | cronSecret | 321 |
| `/api/founder/webhooks/stripe-managed-service` | stripeWebhook, webhookSignature | 435 |
| `/api/founder-intel/alerts` | getUser, getSupabaseServer | 50 |
| `/api/founder-intel/alerts/[id]` | getUser, getSupabaseServer | 91 |
| `/api/founder-intel/briefing` | getUser, getSupabaseServer | 63 |
| `/api/founder-intel/preferences` | getUser, getSupabaseServer | 84 |
| `/api/founder-intel/snapshots` | getUser, getSupabaseServer | 100 |
| `/api/founder-intel/snapshots/[id]` | getUser, getSupabaseServer | 45 |
| `/api/founder-os/ai-phill/insights` | getUser, getSupabaseServer | 171 |
| `/api/founder-os/ai-phill/journal` | getUser, getSupabaseServer | 173 |
| `/api/founder-os/businesses` | getUser, getSupabaseServer | 164 |
| `/api/founder-os/businesses/[id]` | getUser, getSupabaseServer | 239 |
| `/api/founder-os/businesses/[id]/signals` | getUser, getSupabaseServer | 175 |
| `/api/founder-os/businesses/[id]/snapshots` | getUser, getSupabaseServer | 167 |
| `/api/founder-os/businesses/[id]/vault` | getUser, getSupabaseServer | 199 |
| `/api/founder-os/cognitive-twin/decisions` | getUser, getSupabaseServer | 250 |
| `/api/founder-os/cognitive-twin/digests` | getUser, getSupabaseServer | 145 |
| `/api/founder-os/cognitive-twin/scores` | getUser, getSupabaseServer | 146 |
| `/api/franchise/agency-tree` | getUser, getSupabaseServer | 94 |
| `/api/franchise/assign-region` | getUser, getSupabaseServer | 102 |
| `/api/franchise/opportunities` | getUser | 77 |
| `/api/generated-content` | validateUserAuth, getSupabaseServer | 146 |
| `/api/generated-content/[id]/approve` | validateUserAuth, getSupabaseServer | 91 |
| `/api/governance/charter` | getUser | 80 |
| `/api/governance/meta/profiles` | getUser | 31 |
| `/api/governance/meta/settings` | getUser | 48 |
| `/api/hooks/favorite` | validateUserAndWorkspace, validateUserAuth | 103 |
| `/api/hooks/search` | validateUserAndWorkspace, validateUserAuth | 96 |
| `/api/images/generate` | validateUserAndWorkspace, validateUserAuth, getUser, getSupabaseServer | 423 |
| `/api/images/regenerate` | validateUserAndWorkspace, validateUserAuth, getUser, getSupabaseServer | 263 |
| `/api/insights/rendered` | getUser | 50 |
| `/api/integrations/gmail/authorize` | getSupabaseServer | 127 |
| `/api/integrations/gmail/callback` | getSupabaseServer | 94 |
| `/api/integrations/gmail/disconnect` | validateUserAuth | 49 |
| `/api/integrations/gmail/list` | validateUserAuth, validateWorkspaceAccess | 67 |
| `/api/integrations/gmail/send` | validateUserAuth, validateWorkspaceAccess | 92 |
| `/api/integrations/gmail/set-primary` | validateUserAuth, validateWorkspaceAccess | 52 |
| `/api/integrations/gmail/sync` | validateUserAuth, validateWorkspaceAccess | 53 |
| `/api/integrations/gmail/sync-all` | validateUserAuth, validateWorkspaceAccess | 67 |
| `/api/integrations/gmail/toggle-sync` | validateUserAuth | 49 |
| `/api/integrations/gmail/update-label` | validateUserAuth | 49 |
| `/api/integrations/list` | validateUserAuth | 45 |
| `/api/integrations/outlook/accounts` | validateUserAuth | 153 |
| `/api/integrations/outlook/calendar/create` | validateUserAuth | 75 |
| `/api/integrations/outlook/calendar/events` | validateUserAuth | 66 |
| `/api/integrations/outlook/disconnect` | validateUserAuth | 60 |
| `/api/integrations/outlook/send` | validateUserAuth | 65 |
| `/api/integrations/outlook/sync` | validateUserAuth | 60 |
| `/api/integrations/xero/callback` | getUser, getSupabaseServer | 116 |
| `/api/integrations/xero/connect` | getUser, getSupabaseServer | 80 |
| `/api/integrations/xero/disconnect` | getUser, getSupabaseServer | 86 |
| `/api/integrations/xero/set-primary` | getUser, getSupabaseServer | 77 |
| `/api/integrations/xero/status` | getUser, getSupabaseServer | 100 |
| `/api/integrations/xero/update-label` | getUser, getSupabaseServer | 76 |
| `/api/intelligence/contact` | validateUserAuth, validateWorkspaceAccess, getSupabaseServer | 245 |
| `/api/intelligence/dashboard` | validateUserAuth, validateWorkspaceAccess, getSupabaseServer | 214 |
| `/api/intelligence/messages` | getUser | 24 |
| `/api/intelligence/stabilisation-events` | getUser | 23 |
| `/api/knowledge/artifacts` | getUser | 26 |
| `/api/knowledge/generate` | getUser | 27 |
| `/api/landing-pages/generate` | getSupabaseServer | 181 |
| `/api/landing-pages/[id]/alternatives` | getSupabaseServer | 138 |
| `/api/landing-pages/[id]/regenerate` | getSupabaseServer | 146 |
| `/api/landing-pages/[id]` | getSupabaseServer | 145 |
| `/api/landing-pages/[id]/section` | getSupabaseServer | 87 |
| `/api/leviathan/cloud/deploy` | getUser, getSupabaseServer | 334 |
| `/api/leviathan/fabricate` | getUser, getSupabaseServer | 266 |
| `/api/leviathan/social/publish` | getUser, getSupabaseServer | 315 |
| `/api/load/snapshots` | getUser | 23 |
| `/api/loyalty/credit` | getUser, getSupabaseServer | 102 |
| `/api/loyalty/dashboard` | getUser, getSupabaseServer | 107 |
| `/api/loyalty/founder/approve-redemption` | getUser, getSupabaseServer | 135 |
| `/api/loyalty/founder/redemption-queue` | getUser, getSupabaseServer | 126 |
| `/api/loyalty/fraud/alerts` | getUser, getSupabaseServer | 161 |
| `/api/loyalty/history` | getUser, getSupabaseServer | 95 |
| `/api/loyalty/redeem` | getUser, getSupabaseServer | 128 |
| `/api/loyalty/referral/claim` | getUser, getSupabaseServer | 226 |
| `/api/loyalty/referral/create` | getUser, getSupabaseServer | 101 |
| `/api/loyalty/rewards` | getUser, getSupabaseServer | 175 |
| `/api/managed/blue-ocean/generate` | getUser, getSupabaseServer | 283 |
| `/api/managed/no-bluff/analyze` | getUser, getSupabaseServer | 245 |
| `/api/managed/projects/create` | getUser, getSupabaseServer | 119 |
| `/api/managed/scheduler/weekly` | cronSecret, authHeader | 253 |
| `/api/managed/seo/baseline` | getUser, getSupabaseServer | 180 |
| `/api/market/baselines` | getUser | 38 |
| `/api/market/trends` | getUser | 38 |
| `/api/marketplace/collections` | getUser | 68 |
| `/api/marketplace/list` | getUser | 77 |
| `/api/marketplace/search` | getUser | 55 |
| `/api/marketplace/[id/]/export` | getUser | 95 |
| `/api/marketplace/[id/]/favorite` | getUser | 95 |
| `/api/marketplace/[id/]` | getUser | 68 |
| `/api/marketplace/[id/]/variants` | getUser | 127 |
| `/api/media/analyze` | getUser, getSupabaseServer | 412 |
| `/api/media/search` | getUser, getSupabaseServer | 116 |
| `/api/media/transcribe` | getUser, getSupabaseServer | 394 |
| `/api/media/upload` | getUser, getSupabaseServer | 437 |
| `/api/memory/compress` | getUser | 46 |
| `/api/memory/compressed` | getUser | 23 |
| `/api/memory/related` | getUser, getSupabaseServer | 178 |
| `/api/memory/retrieve` | getUser, getSupabaseServer | 201 |
| `/api/memory/spine` | getUser | 24 |
| `/api/memory/store` | getUser, getSupabaseServer | 195 |
| `/api/mesh/node/[nodeId]` | getUser, getSupabaseServer | 67 |
| `/api/mesh/overview` | getUser | 79 |
| `/api/mindmap/nodes/[nodeId]` | getUser, getSupabaseServer | 143 |
| `/api/mindmap/suggestions/[suggestionId]` | getUser, getSupabaseServer | 250 |
| `/api/mindmap/[mindmapId]/ai-analyze` | getUser, getSupabaseServer | 175 |
| `/api/mindmap/[mindmapId]/connections` | getUser, getSupabaseServer | 172 |
| `/api/mindmap/[mindmapId]/nodes` | getUser, getSupabaseServer | 125 |
| `/api/mindmap/[mindmapId]` | getUser, getSupabaseServer | 188 |
| `/api/ml/anomaly-detection/detect` | getUser, getSupabaseServer | 145 |
| `/api/ml/cost-tracking/budget` | getUser, getSupabaseServer | 148 |
| `/api/ml/cost-tracking/summary` | getUser, getSupabaseServer | 125 |
| `/api/ml/cost-tracking/track` | getUser, getSupabaseServer | 114 |
| `/api/ml/pattern-detection/detect` | getUser, getSupabaseServer | 110 |
| `/api/ml/prediction/predict` | getUser, getSupabaseServer | 135 |
| `/api/monitoring/cache-stats` | getSupabaseServer | 247 |
| `/api/monitoring/dashboard` | getSupabaseServer | 58 |
| `/api/multi-channel/ads/accounts` | getUser, getSupabaseServer | 201 |
| `/api/multi-channel/ads/opportunities` | getUser, getSupabaseServer | 200 |
| `/api/multi-channel/boost/jobs` | getUser, getSupabaseServer | 345 |
| `/api/multi-channel/search/keywords` | getUser, getSupabaseServer | 281 |
| `/api/multi-channel/social/accounts` | getUser, getSupabaseServer | 279 |
| `/api/multi-channel/social/messages` | getUser, getSupabaseServer | 207 |
| `/api/mvp/dashboard` | getUser | 154 |
| `/api/narrative/snapshots` | getUser | 69 |
| `/api/navigator/insights` | getUser | 41 |
| `/api/navigator/snapshot` | getUser | 85 |
| `/api/negotiation/decision` | getUser, getSupabaseServer | 104 |
| `/api/negotiation/start` | getUser, getSupabaseServer | 160 |
| `/api/negotiation/status` | getUser, getSupabaseServer | 106 |
| `/api/onboarding/complete-step` | getUser, authHeader, getSupabaseServer | 107 |
| `/api/onboarding/skip` | getUser, authHeader, getSupabaseServer | 64 |
| `/api/onboarding/start` | getUser, authHeader, getSupabaseServer | 87 |
| `/api/onboarding/status` | getUser, authHeader, getSupabaseServer | 81 |
| `/api/operator/insights` | getUser, getSupabaseServer | 352 |
| `/api/operator/playbooks` | getUser, getSupabaseServer | 544 |
| `/api/operator/profile` | getUser, getSupabaseServer | 262 |
| `/api/operator/queue` | getUser, getSupabaseServer | 201 |
| `/api/operator/reports` | getUser, getSupabaseServer | 113 |
| `/api/operator/review` | getUser, getSupabaseServer | 347 |
| `/api/opportunities/generate` | getUser | 113 |
| `/api/opportunities/list` | getUser | 77 |
| `/api/optimizer/profile` | getUser, getSupabaseServer | 203 |
| `/api/optimizer/run` | getUser, getSupabaseServer | 200 |
| `/api/optimizer/status` | getUser, getSupabaseServer | 186 |
| `/api/orchestration/scheduler` | getUser, getSupabaseServer | 129 |
| `/api/orchestration/schedules` | getUser, getSupabaseServer | 157 |
| `/api/orchestrator/dashboard/tasks` | getUser | 101 |
| `/api/orchestrator/dashboard/tasks/[id]/evidence` | getUser | 140 |
| `/api/orchestrator/dashboard/tasks/[id]/failures` | getUser | 253 |
| `/api/orchestrator/dashboard/tasks/[id]/retry` | getUser | 123 |
| `/api/orchestrator/dashboard/tasks/[id]` | getUser | 116 |
| `/api/orchestrator/dashboard/tasks/[id]/steps` | getUser | 94 |
| `/api/orchestrator/execute` | getUser, getSupabaseServer | 119 |
| `/api/orchestrator/plan` | getUser, getSupabaseServer | 117 |
| `/api/orchestrator/status` | getUser, getSupabaseServer | 114 |
| `/api/organization/clients` | validateUserAndWorkspace, validateUserAuth | 68 |
| `/api/organizations/create` | validateUserAndWorkspace, validateUserAuth | 56 |
| `/api/organizations` | getUser | 94 |
| `/api/pair-operator/chat` | getUser | 34 |
| `/api/pair-operator/suggestions` | getUser | 25 |
| `/api/patterns/library` | getUser | 26 |
| `/api/patterns/match` | getUser | 25 |
| `/api/payments/create-checkout-session` | getUser, getSupabaseServer | 231 |
| `/api/payments/stripe-webhook` | getSupabaseServer, webhookSignature | 334 |
| `/api/performance/normalized` | getUser | 23 |
| `/api/performance-reality/external-signals` | getUser, getSupabaseServer | 138 |
| `/api/performance-reality/snapshots` | getUser, getSupabaseServer | 118 |
| `/api/performance-reality/snapshots/[id]` | getUser, getSupabaseServer | 104 |
| `/api/performance-reality/strip` | getUser, getSupabaseServer | 50 |
| `/api/playbooks/intelligence` | getUser | 50 |
| `/api/posting-execution/execute` | getUser | 119 |
| `/api/posting-execution/preflight` | getUser, getSupabaseServer | 93 |
| `/api/posting-execution/rollback` | getUser | 97 |
| `/api/posting-execution/scheduler` | getUser | 103 |
| `/api/postmortem/incidents` | getUser | 48 |
| `/api/postmortem/report` | getUser | 25 |
| `/api/pre-clients` | getUser, getSupabaseServer | 206 |
| `/api/pre-clients/[id]/ingest-history` | getUser, getSupabaseServer | 281 |
| `/api/pre-clients/[id]/insights` | getUser, getSupabaseServer | 259 |
| `/api/pre-clients/[id]` | getUser, getSupabaseServer | 309 |
| `/api/pre-clients/[id]/threads` | getUser, getSupabaseServer | 205 |
| `/api/pre-clients/[id]/timeline` | getUser, getSupabaseServer | 244 |
| `/api/predictions/success` | getUser | 35 |
| `/api/production/jobs` | getUser, getSupabaseServer | 301 |
| `/api/profile/avatar` | getUser, getSupabaseServer | 222 |
| `/api/profile` | getUser, authHeader, getSupabaseServer | 86 |
| `/api/profile/update` | getUser, authHeader, getSupabaseServer | 200 |
| `/api/projects/create` | getUser, authHeader, getSupabaseServer | 96 |
| `/api/projects` | getSupabaseServer | 199 |
| `/api/projects/[projectId]/mindmap` | getUser, getSupabaseServer | 257 |
| `/api/reasoning/start` | getUser, getSupabaseServer | 178 |
| `/api/reasoning/trace` | getUser, getSupabaseServer | 205 |
| `/api/regions/convergence/generate` | getUser | 49 |
| `/api/regions/convergence/packets` | getUser | 40 |
| `/api/regions/health` | getUser | 61 |
| `/api/regions/transfer-safety` | getUser | 69 |
| `/api/regions/[regionId]/snapshot` | getUser | 111 |
| `/api/report/get` | getUser, getSupabaseServer | 148 |
| `/api/reports/analytics` | getUser, getSupabaseServer | 113 |
| `/api/reports/audit` | getUser, getSupabaseServer | 223 |
| `/api/reports/client` | getUser, getSupabaseServer | 243 |
| `/api/reports/export` | getUser, getSupabaseServer | 219 |
| `/api/reports/financial` | getUser, getSupabaseServer | 126 |
| `/api/reports/preview` | getUser, getSupabaseServer | 148 |
| `/api/roadmap/generate` | getUser | 31 |
| `/api/roadmap/list` | getUser | 25 |
| `/api/safety/enforce` | getUser, getSupabaseServer | 157 |
| `/api/safety/intervene` | getUser, getSupabaseServer | 179 |
| `/api/safety/ledger` | getUser, getSupabaseServer | 158 |
| `/api/safety/status` | getUser, getSupabaseServer | 209 |
| `/api/scaling-mode/config` | getUser | 144 |
| `/api/scraping/analyze` | getUser, getSupabaseServer | 190 |
| `/api/scraping/monitor` | getUser, authHeader, getSupabaseServer | 245 |
| `/api/search-suite/alerts` | getUser, getSupabaseServer | 124 |
| `/api/search-suite/keywords` | getUser, getSupabaseServer | 169 |
| `/api/self-healing/jobs` | getUser, getSupabaseServer | 109 |
| `/api/self-healing/patches` | getUser, getSupabaseServer | 204 |
| `/api/seo/bing/query` | getUser, getSupabaseServer | 155 |
| `/api/seo/bing/save-key` | getUser, getSupabaseServer | 162 |
| `/api/seo/brave/auth-url` | getUser, getSupabaseServer | 110 |
| `/api/seo/brave/callback` | getUser, getSupabaseServer | 143 |
| `/api/seo/brave/query` | getUser, getSupabaseServer | 159 |
| `/api/seo/credentials/list` | getUser, getSupabaseServer | 158 |
| `/api/seo/gsc/auth-url` | getUser, getSupabaseServer | 111 |
| `/api/seo/gsc/callback` | getUser, getSupabaseServer | 143 |
| `/api/seo/gsc/query` | getUser, getSupabaseServer | 160 |
| `/api/seo/sync-rankings` | cronSecret | 283 |
| `/api/seo-enhancement/audit` | getUser, getSupabaseServer | 121 |
| `/api/seo-enhancement/competitors` | getUser, getSupabaseServer | 211 |
| `/api/seo-enhancement/content` | getUser, getSupabaseServer | 114 |
| `/api/seo-enhancement/ctr` | getUser, getSupabaseServer | 220 |
| `/api/seo-enhancement/schema` | getUser, getSupabaseServer | 149 |
| `/api/seo-leak/audit` | getUser, getSupabaseServer | 174 |
| `/api/seo-leak/gaps` | getUser, getSupabaseServer | 248 |
| `/api/seo-leak/schema` | getUser, getSupabaseServer | 210 |
| `/api/seo-leak/signals` | getUser, getSupabaseServer | 207 |
| `/api/sequences/generate` | validateUserAndWorkspace, validateUserAuth, getUser, getSupabaseServer | 277 |
| `/api/sequences/[id]` | validateUserAndWorkspace, validateUserAuth, getUser, getSupabaseServer | 360 |
| `/api/signal-purity/snapshots` | getUser | 35 |
| `/api/sites` | getUser, getSupabaseServer | 92 |
| `/api/sites/scan` | getUser, getSupabaseServer | 111 |
| `/api/social-inbox/accounts` | getUser, getSupabaseServer | 140 |
| `/api/social-inbox/messages` | getUser, getSupabaseServer | 169 |
| `/api/social-inbox/reply` | getUser, getSupabaseServer | 185 |
| `/api/social-inbox/triage` | getUser, getSupabaseServer | 161 |
| `/api/social-templates/bulk` | getSupabaseServer | 77 |
| `/api/social-templates/export` | getSupabaseServer | 131 |
| `/api/social-templates/generate` | getSupabaseServer | 184 |
| `/api/social-templates/search` | getSupabaseServer | 73 |
| `/api/social-templates/stats` | getSupabaseServer | 79 |
| `/api/social-templates/[id]/duplicate` | getSupabaseServer | 72 |
| `/api/social-templates/[id]/favorite` | getSupabaseServer | 58 |
| `/api/social-templates/[id]` | getSupabaseServer | 143 |
| `/api/social-templates/[id]/track-usage` | getSupabaseServer | 58 |
| `/api/social-templates/[id]/variations` | getSupabaseServer | 127 |
| `/api/staff/projects/create` | getUser, getSupabaseServer | 241 |
| `/api/staff/proposal-scope/get` | getUser, authHeader, getSupabaseServer | 160 |
| `/api/staff/proposal-scope/save` | getUser, authHeader, getSupabaseServer | 260 |
| `/api/staff/scope-ai/generate` | getUser, authHeader, getSupabaseServer | 159 |
| `/api/staff/time/approve` | getUser, getSupabaseServer | 213 |
| `/api/staff/time/entries` | getUser, getSupabaseServer | 154 |
| `/api/staff/time/manual` | getUser, getSupabaseServer | 167 |
| `/api/staff/time/start` | getUser, getSupabaseServer | 155 |
| `/api/staff/time/stop` | getUser, getSupabaseServer | 117 |
| `/api/staff/time/xero-sync` | getUser, getSupabaseServer | 277 |
| `/api/storytelling/run` | getUser, getSupabaseServer | 201 |
| `/api/storytelling/touchpoints` | getUser, getSupabaseServer | 181 |
| `/api/strategy/create` | getUser, getSupabaseServer | 228 |
| `/api/strategy/drift` | getUser, getSupabaseServer | 217 |
| `/api/strategy/evaluate` | getUser, getSupabaseServer | 228 |
| `/api/strategy/history` | getUser, getSupabaseServer | 224 |
| `/api/strategy/horizon/generate` | getUser, getSupabaseServer | 112 |
| `/api/strategy/horizon/kpi` | getUser, getSupabaseServer | 185 |
| `/api/strategy/horizon/list` | getUser, getSupabaseServer | 93 |
| `/api/strategy/init` | getUser, getSupabaseServer | 202 |
| `/api/strategy/nodes` | getUser, getSupabaseServer | 292 |
| `/api/strategy/refine` | getUser, getSupabaseServer | 134 |
| `/api/strategy/report` | getUser, getSupabaseServer | 111 |
| `/api/strategy/signoff` | getUser, getSupabaseServer | 223 |
| `/api/strategy/simulate` | getUser, getSupabaseServer | 255 |
| `/api/strategy/status` | getUser, getSupabaseServer | 220 |
| `/api/stripe/checkout` | getSupabaseServer | 157 |
| `/api/subscription/cancel` | validateUserAndWorkspace, validateUserAuth, getUser, getSupabaseServer | 150 |
| `/api/subscription/downgrade` | validateUserAndWorkspace, validateUserAuth, getUser, getSupabaseServer | 181 |
| `/api/subscription/invoices` | validateUserAndWorkspace, validateUserAuth, getSupabaseServer | 157 |
| `/api/subscription/portal` | validateUserAndWorkspace, validateUserAuth, getSupabaseServer | 98 |
| `/api/subscription/reactivate` | validateUserAndWorkspace, validateUserAuth, getUser, getSupabaseServer | 156 |
| `/api/subscription/upgrade` | validateUserAndWorkspace, validateUserAuth, getUser, getSupabaseServer | 181 |
| `/api/subscription/[orgId]` | validateUserAndWorkspace, validateUserAuth, getSupabaseServer | 144 |
| `/api/subscriptions/create-checkout` | authHeader | 83 |
| `/api/synthex/billing` | getUser, getSupabaseServer | 268 |
| `/api/synthex/job` | getUser, getSupabaseServer | 164 |
| `/api/synthex/tenant` | getUser, getSupabaseServer | 256 |
| `/api/team` | getSupabaseServer | 142 |
| `/api/team/[id]` | getSupabaseServer | 109 |
| `/api/training/insights` | getUser | 25 |
| `/api/training/recommendations` | getUser | 26 |
| `/api/trends/temporal` | getUser | 35 |
| `/api/trial/activity` | getUser, getSupabaseServer | 113 |
| `/api/trial/profile` | getUser, getSupabaseServer | 66 |
| `/api/trial/status` | getUser, getSupabaseServer | 60 |
| `/api/trust/audit` | getUser, getSupabaseServer | 98 |
| `/api/trust/configure-scopes` | getUser, getSupabaseServer | 120 |
| `/api/trust/init` | getUser, getSupabaseServer | 113 |
| `/api/trust/report` | getUser, getSupabaseServer | 96 |
| `/api/trust/signature/init` | getUser, getSupabaseServer | 140 |
| `/api/trust/status` | getUser, getSupabaseServer | 193 |
| `/api/trust/verify-ownership` | getUser, getSupabaseServer | 198 |
| `/api/vault/get` | getUser, getSupabaseServer | 133 |
| `/api/vault/save` | getUser, getSupabaseServer | 138 |
| `/api/voice/log` | getUser, getSupabaseServer | 53 |
| `/api/webhooks/whatsapp` | verifyToken | 292 |
| `/api/whatsapp/conversations` | validateUserAndWorkspace | 72 |
| `/api/whatsapp/conversations/[id]/messages` | validateUserAndWorkspace | 74 |
| `/api/whatsapp/send` | validateUserAndWorkspace, getSupabaseServer | 207 |
| `/api/whatsapp/templates` | validateUserAndWorkspace | 119 |

### 🌐 Public Routes (Intentionally Public) - 17 routes

Routes that should be publicly accessible:

| Route | Purpose | Lines |
|-------|---------|-------|
| `/api/contact/submit` | Contact form | 192 |
| `/api/deployment-check` | Deployment check | 20 |
| `/api/docs` | Public API | 18 |
| `/api/health/anthropic` | Health check | 82 |
| `/api/health/deep` | Health check | 366 |
| `/api/health` | Health check | 199 |
| `/api/health/routes` | Health check | 244 |
| `/api/metrics` | Public API | 95 |
| `/api/monitoring/health` | Health check | 74 |
| `/api/system/health` | Health check | 121 |
| `/api/test/db` | Public API | 41 |
| `/api/test-opus-4-5` | Public API | 107 |
| `/api/test-rate-limit` | Public API | 44 |
| `/api/testing/chaos` | Public API | 227 |
| `/api/testing/load` | Public API | 209 |
| `/api/tracking/pixel/[trackingPixelId]` | Public API | 72 |
| `/api/v1/health` | Health check | 54 |

### ⏰ Cron Jobs (CRON_SECRET) - 4 routes

Routes protected by CRON_SECRET for scheduled tasks:

| Route | Purpose | Lines |
|-------|---------|-------|
| `/api/cron/health-check` | Health monitoring | 217 |
| `/api/cron/success-email` | Success metrics | 173 |
| `/api/cron/success-insights` | Success metrics | 88 |
| `/api/cron/success-score` | Success metrics | 98 |

### 🔗 Webhooks (Signature Verification) - 2 routes

Routes protected by webhook signature verification:

| Route | Provider | Lines |
|-------|----------|-------|
| `/api/stripe/webhook` | Stripe | 598 |
| `/api/webhooks/stripe/[mode]` | Stripe | 355 |

### 🔑 Auth Endpoints - 6 routes

Authentication and session management endpoints:

| Route | Purpose | Lines |
|-------|---------|-------|
| `/api/auth/client-login` | Login | 40 |
| `/api/auth/client-logout` | Logout | 21 |
| `/api/auth/fix-profile` | Auth | 106 |
| `/api/auth/initialize-user` | User initialization | 317 |
| `/api/auth/staff-login` | Login | 40 |
| `/api/auth/[...nextauth]` | Auth | 7 |

### ⚠️ MISSING AUTHENTICATION - 65 routes

**CRITICAL SECURITY ISSUE:** These routes have NO authentication and should be reviewed immediately:

| Route | Lines | File Path |
|-------|-------|-----------|
| `/api/ai/generate-proposal` | 48 | `D:/Unite-Hub/src/app/api/ai/generate-proposal/route.ts` |
| `/api/ai/interpret-idea` | 49 | `D:/Unite-Hub/src/app/api/ai/interpret-idea/route.ts` |
| `/api/aido/auth/ga4/url` | 38 | `D:/Unite-Hub/src/app/api/aido/auth/ga4/url/route.ts` |
| `/api/aido/auth/gbp/url` | 38 | `D:/Unite-Hub/src/app/api/aido/auth/gbp/url/route.ts` |
| `/api/aido/auth/gsc/url` | 38 | `D:/Unite-Hub/src/app/api/aido/auth/gsc/url/route.ts` |
| `/api/audits` | 116 | `D:/Unite-Hub/src/app/api/audits/route.ts` |
| `/api/client/ideas` | 99 | `D:/Unite-Hub/src/app/api/client/ideas/route.ts` |
| `/api/client/proposals` | 48 | `D:/Unite-Hub/src/app/api/client/proposals/route.ts` |
| `/api/client/vault` | 102 | `D:/Unite-Hub/src/app/api/client/vault/route.ts` |
| `/api/connected-apps/callback/[provider]` | 77 | `D:/Unite-Hub/src/app/api/connected-apps/callback/[provider]/route.ts` |
| `/api/creative/insights` | 88 | `D:/Unite-Hub/src/app/api/creative/insights/route.ts` |
| `/api/creative/quality` | 109 | `D:/Unite-Hub/src/app/api/creative/quality/route.ts` |
| `/api/director/alerts` | 88 | `D:/Unite-Hub/src/app/api/director/alerts/route.ts` |
| `/api/director/insights` | 62 | `D:/Unite-Hub/src/app/api/director/insights/route.ts` |
| `/api/email/oauth/authorize` | 40 | `D:/Unite-Hub/src/app/api/email/oauth/authorize/route.ts` |
| `/api/enterprise/billing/plans` | 25 | `D:/Unite-Hub/src/app/api/enterprise/billing/plans/route.ts` |
| `/api/evolution/proposals` | 124 | `D:/Unite-Hub/src/app/api/evolution/proposals/route.ts` |
| `/api/executive/briefing` | 88 | `D:/Unite-Hub/src/app/api/executive/briefing/route.ts` |
| `/api/executive/missions` | 167 | `D:/Unite-Hub/src/app/api/executive/missions/route.ts` |
| `/api/founder/business-vault` | 78 | `D:/Unite-Hub/src/app/api/founder/business-vault/route.ts` |
| `/api/founder/business-vault/[businessKey]/channel` | 66 | `D:/Unite-Hub/src/app/api/founder/business-vault/[businessKey]/channel/route.ts` |
| `/api/founder/business-vault/[businessKey]/snapshot` | 72 | `D:/Unite-Hub/src/app/api/founder/business-vault/[businessKey]/snapshot/route.ts` |
| `/api/founder/synthex/setup-analytics` | 390 | `D:/Unite-Hub/src/app/api/founder/synthex/setup-analytics/route.ts` |
| `/api/integrations/gmail/callback-multi` | 59 | `D:/Unite-Hub/src/app/api/integrations/gmail/callback-multi/route.ts` |
| `/api/integrations/gmail/connect` | 40 | `D:/Unite-Hub/src/app/api/integrations/gmail/connect/route.ts` |
| `/api/integrations/gmail/connect-multi` | 53 | `D:/Unite-Hub/src/app/api/integrations/gmail/connect-multi/route.ts` |
| `/api/integrations/outlook/callback` | 47 | `D:/Unite-Hub/src/app/api/integrations/outlook/callback/route.ts` |
| `/api/integrations/outlook/connect` | 40 | `D:/Unite-Hub/src/app/api/integrations/outlook/connect/route.ts` |
| `/api/leviathan/orchestrate` | 160 | `D:/Unite-Hub/src/app/api/leviathan/orchestrate/route.ts` |
| `/api/managed/reports/generate` | 139 | `D:/Unite-Hub/src/app/api/managed/reports/generate/route.ts` |
| `/api/managed/reports/send` | 420 | `D:/Unite-Hub/src/app/api/managed/reports/send/route.ts` |
| `/api/marketing/events` | 87 | `D:/Unite-Hub/src/app/api/marketing/events/route.ts` |
| `/api/marketing/insights` | 75 | `D:/Unite-Hub/src/app/api/marketing/insights/route.ts` |
| `/api/monitoring/metrics` | 46 | `D:/Unite-Hub/src/app/api/monitoring/metrics/route.ts` |
| `/api/posting/attempts` | 58 | `D:/Unite-Hub/src/app/api/posting/attempts/route.ts` |
| `/api/posting/scheduler` | 120 | `D:/Unite-Hub/src/app/api/posting/scheduler/route.ts` |
| `/api/privacy/subject-access-request` | 417 | `D:/Unite-Hub/src/app/api/privacy/subject-access-request/route.ts` |
| `/api/reports/sample-by-persona` | 30 | `D:/Unite-Hub/src/app/api/reports/sample-by-persona/route.ts` |
| `/api/scaling-mode/health` | 87 | `D:/Unite-Hub/src/app/api/scaling-mode/health/route.ts` |
| `/api/scaling-mode/history` | 32 | `D:/Unite-Hub/src/app/api/scaling-mode/history/route.ts` |
| `/api/seo/competitive-benchmark` | 67 | `D:/Unite-Hub/src/app/api/seo/competitive-benchmark/route.ts` |
| `/api/seo/keyword-gap` | 69 | `D:/Unite-Hub/src/app/api/seo/keyword-gap/route.ts` |
| `/api/staff/activity` | 50 | `D:/Unite-Hub/src/app/api/staff/activity/route.ts` |
| `/api/staff/me` | 23 | `D:/Unite-Hub/src/app/api/staff/me/route.ts` |
| `/api/staff/projects` | 37 | `D:/Unite-Hub/src/app/api/staff/projects/route.ts` |
| `/api/staff/tasks` | 101 | `D:/Unite-Hub/src/app/api/staff/tasks/route.ts` |
| `/api/staff/tasks/[id]` | 105 | `D:/Unite-Hub/src/app/api/staff/tasks/[id]/route.ts` |
| `/api/synthex/offer` | 107 | `D:/Unite-Hub/src/app/api/synthex/offer/route.ts` |
| `/api/synthex/seo/analyses` | 49 | `D:/Unite-Hub/src/app/api/synthex/seo/analyses/route.ts` |
| `/api/synthex/seo/analyze` | 104 | `D:/Unite-Hub/src/app/api/synthex/seo/analyze/route.ts` |
| `/api/synthex/video/generate` | 99 | `D:/Unite-Hub/src/app/api/synthex/video/generate/route.ts` |
| `/api/synthex/video/jobs` | 47 | `D:/Unite-Hub/src/app/api/synthex/video/jobs/route.ts` |
| `/api/synthex/video/templates` | 45 | `D:/Unite-Hub/src/app/api/synthex/video/templates/route.ts` |
| `/api/synthex/visual/brand-kits` | 108 | `D:/Unite-Hub/src/app/api/synthex/visual/brand-kits/route.ts` |
| `/api/synthex/visual/capabilities` | 92 | `D:/Unite-Hub/src/app/api/synthex/visual/capabilities/route.ts` |
| `/api/synthex/visual/generate` | 157 | `D:/Unite-Hub/src/app/api/synthex/visual/generate/route.ts` |
| `/api/synthex/visual/jobs` | 63 | `D:/Unite-Hub/src/app/api/synthex/visual/jobs/route.ts` |
| `/api/trust/signature/callback` | 131 | `D:/Unite-Hub/src/app/api/trust/signature/callback/route.ts` |
| `/api/v1/agents/orchestrator` | 315 | `D:/Unite-Hub/src/app/api/v1/agents/orchestrator/route.ts` |
| `/api/v1/auth/session` | 93 | `D:/Unite-Hub/src/app/api/v1/auth/session/route.ts` |
| `/api/v1/campaigns` | 175 | `D:/Unite-Hub/src/app/api/v1/campaigns/route.ts` |
| `/api/v1/contacts` | 196 | `D:/Unite-Hub/src/app/api/v1/contacts/route.ts` |
| `/api/v1/contacts/[id]` | 268 | `D:/Unite-Hub/src/app/api/v1/contacts/[id]/route.ts` |
| `/api/v1/emails` | 228 | `D:/Unite-Hub/src/app/api/v1/emails/route.ts` |
| `/api/visual/transformation` | 80 | `D:/Unite-Hub/src/app/api/visual/transformation/route.ts` |

---

## Recommended Actions

For routes with MISSING authentication:

1. **Determine if the route should be:**
   - ✅ **Protected** - Add `validateUserAndWorkspace(req, workspaceId)` or `validateUserAuth(req)`
   - 🌐 **Public** - Document why it's public and add rate limiting
   - ⏰ **Cron** - Add `validateCronRequest(req)` with CRON_SECRET check
   - 🔗 **Webhook** - Add signature verification

2. **Implementation patterns:**

### Protected Route (User Auth)
```typescript
import { validateUserAndWorkspace } from "@/lib/workspace-validation";

export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");

  // Validate user authentication and workspace access
  await validateUserAndWorkspace(req, workspaceId);

  // Your route logic here
}
```

### Cron Job (CRON_SECRET)
```typescript
import { validateCronRequest } from "@/lib/cron/auth";

export async function GET(req: NextRequest) {
  // Validate cron request
  const auth = validateCronRequest(req, { logPrefix: 'JobName' });
  if (!auth.valid) {
    return auth.response;
  }

  // Your job logic here
}
```

### Webhook (Signature Verification)
```typescript
export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");

  // Verify webhook signature
  const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

  // Your webhook logic here
}
```

### Public Route (Rate Limited)
```typescript
import { publicRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await publicRateLimit(req);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  // Your public route logic here
}
```


---

## Authentication Patterns Reference

### User Authentication Functions

1. **`validateUserAndWorkspace(req, workspaceId)`**
   - Validates user session AND workspace access
   - Use for routes that operate on workspace data
   - Returns user object with userId and orgId

2. **`validateUserAuth(req)`**
   - Validates user session only
   - Use for routes that don't need workspace context
   - Returns user object

3. **`validateWorkspaceAccess(workspaceId, orgId)`**
   - Validates workspace belongs to organization
   - Use after getting user's orgId

4. **`getUser()`** (via Supabase)
   - Low-level session check
   - Returns user from session cookie/token

### Security Best Practices

✅ **DO:**
- Always validate workspaceId for multi-tenant data
- Use rate limiting on all routes (especially public ones)
- Log failed authentication attempts
- Return generic error messages (don't leak info)
- Use service role only for initialization/admin tasks

❌ **DON'T:**
- Skip workspace validation (breaks tenant isolation)
- Expose detailed error messages to clients
- Use service role for regular user operations
- Allow SQL injection via unvalidated inputs
- Skip rate limiting on public endpoints

---

## Audit Metadata

- **Total Routes Analyzed:** 683
- **Auth Coverage:** 90.5%
- **Critical Issues:** 65
- **Audit Tool:** `scripts/audit-api-auth.mjs`
- **Run Command:** `node scripts/audit-api-auth.mjs`

---

**Next Steps:**
1. Review routes with MISSING authentication
2. Add appropriate auth to each route
3. Test authentication with real requests
4. Re-run audit to verify 100% coverage
