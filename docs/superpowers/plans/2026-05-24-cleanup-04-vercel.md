# Cleanup Plan 04 — Vercel Audit, Cleanup, and Sandbox Provisioning

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Audit all 24 Vercel projects in the `unite-group` team, archive the 10 suspect projects (4 generic + 6 auto-named), reconcile the 3 colliding `unite-group*` names, provision 8 missing `*-sandbox` projects so every active product has the production+sandbox pattern, and schedule a 7-day hard-delete for archived projects.

**Architecture:** All Vercel mutations go through `curl --insecure` to `https://api.vercel.com/*` using the existing `$VERCEL_TOKEN` env var. The Vercel CLI is unusable on this machine due to SSL cert inspection; `curl -k` bypasses the same issue. Reads use the existing Vercel MCP tools. A single shell helper `vercel-api.sh` wraps the curl calls so per-task code stays short.

**Tech Stack:** bash, curl, jq (not installed — substitute with Node), Vercel REST API v9/v10, registry from Plan 01-03.

**Spec reference:** `docs/superpowers/specs/2026-05-24-unite-ecosystem-cleanup-design.md` — Phase 3

**Prerequisites:**
- `$VERCEL_TOKEN` env var set (already present)
- Plans 01-03 complete
- Registry has `vercel.team_id: team_KMZACI5rIltoCRhAtGCXlxUf` set on all products
- Working branch `docs/cleanup-spec-2026-05-24`

---

## File Structure

**Created:**
- `D:\Unite-Hub\.portfolio\scripts\vercel-api.sh` — thin bash wrapper for `curl --insecure` against Vercel REST API
- `D:\Unite-Hub\.portfolio\scripts\vercel-audit.mjs` — audits all projects, produces classification report
- `D:\Unite-Hub\.portfolio\scripts\vercel-archive.mjs` — renames projects to `_archive_*` + disconnects git
- `D:\Unite-Hub\.portfolio\scripts\vercel-provision-sandbox.mjs` — creates the 8 missing sandbox projects + sets env vars
- `D:\Unite-Hub\.portfolio\schedule\Register-VercelHardDelete.ps1` — scheduled task for 2026-05-31 hard-delete
- `D:\_archive\2026-05-24\vercel-audit-report.json` — audit output
- `D:\_archive\2026-05-24\vercel-classification.md` — classification with rationale per project

**Modified:**
- `D:\Unite-Hub\.portfolio\PORTFOLIO.yaml` — fill in `vercel.production.project_id`, `vercel.sandbox.project_id` for each product
- `D:\Unite-Hub\.portfolio\schema\portfolio.schema.json` — add optional `retired_vercel_projects` block

---

## Task 1 — Write `vercel-api.sh` wrapper

**File:** `D:\Unite-Hub\.portfolio\scripts\vercel-api.sh`

- [ ] **Step 1: Write wrapper**

```bash
cat > "D:/Unite-Hub/.portfolio/scripts/vercel-api.sh" <<'EOF'
#!/usr/bin/env bash
# Thin wrapper for Vercel REST API. Uses VERCEL_TOKEN env var.
# This machine's SSL inspection breaks normal cert validation; --insecure works around.
#
# Usage:
#   ./vercel-api.sh GET  /v9/projects?teamId=team_KMZACI5rIltoCRhAtGCXlxUf
#   ./vercel-api.sh POST /v10/projects?teamId=...  '{"name":"foo","framework":null}'
#   ./vercel-api.sh PATCH /v9/projects/<id>?teamId=...  '{"name":"new"}'
#   ./vercel-api.sh DELETE /v9/projects/<id>?teamId=...

set -euo pipefail

if [ -z "${VERCEL_TOKEN:-}" ]; then
  echo "VERCEL_TOKEN not set" >&2
  exit 2
fi

METHOD="$1"; PATH_="$2"; BODY="${3:-}"
URL="https://api.vercel.com${PATH_}"

if [ -n "$BODY" ]; then
  curl -s --insecure -X "$METHOD" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$BODY" \
    "$URL"
else
  curl -s --insecure -X "$METHOD" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    "$URL"
fi
EOF
chmod +x "D:/Unite-Hub/.portfolio/scripts/vercel-api.sh"
echo "written"
```

- [ ] **Step 2: Smoke test against /v2/user**

```bash
"D:/Unite-Hub/.portfolio/scripts/vercel-api.sh" GET /v2/user | head -c 300
```

Expected: JSON with `"user":{"username":"zenithfresh25-1436",...}`.

- [ ] **Step 3: Commit**

```bash
git -C "D:/Unite-Hub" add .portfolio/scripts/vercel-api.sh
git -C "D:/Unite-Hub" commit -m "feat(portfolio): add vercel-api.sh wrapper (curl --insecure for SSL inspection)"
```

---

## Task 2 — Write `vercel-audit.mjs`

**File:** `D:\Unite-Hub\.portfolio\scripts\vercel-audit.mjs`

Captures per-project: name, id, framework, link.repo, link.productionBranch, latestDeployments[0].createdAt, alias[] domains, env count (don't fetch values), createdAt.

- [ ] **Step 1: Write script**

```javascript
// D:\Unite-Hub\.portfolio\scripts\vercel-audit.mjs
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const TEAM = "team_KMZACI5rIltoCRhAtGCXlxUf";
const api = (method, path, body) => {
  const cmd = body
    ? `bash D:/Unite-Hub/.portfolio/scripts/vercel-api.sh ${method} "${path}" '${body.replace(/'/g, "\\'")}'`
    : `bash D:/Unite-Hub/.portfolio/scripts/vercel-api.sh ${method} "${path}"`;
  return JSON.parse(execSync(cmd, { encoding: "utf8" }));
};

console.log("Listing projects...");
const projList = api("GET", `/v9/projects?teamId=${TEAM}&limit=100`);
const projects = projList.projects || [];
console.log(`Found ${projects.length} projects.`);

const audit = [];
for (const p of projects) {
  process.stdout.write(`  ${p.name}... `);
  const detail = api("GET", `/v9/projects/${p.id}?teamId=${TEAM}`);
  const deployments = api("GET", `/v6/deployments?teamId=${TEAM}&projectId=${p.id}&limit=1`);
  const envs = api("GET", `/v9/projects/${p.id}/env?teamId=${TEAM}`);
  audit.push({
    id: p.id,
    name: p.name,
    framework: detail.framework || null,
    link: detail.link ? {
      type: detail.link.type,
      repo: detail.link.repo,
      org: detail.link.org,
      productionBranch: detail.link.productionBranch,
    } : null,
    domains: (detail.alias || []).map(a => a.domain),
    latestDeploy: deployments.deployments?.[0]
      ? { createdAt: deployments.deployments[0].created, state: deployments.deployments[0].state, url: deployments.deployments[0].url }
      : null,
    envCount: envs.envs?.length || 0,
    createdAt: new Date(p.createdAt).toISOString(),
  });
  console.log("ok");
}

const out = "D:/_archive/2026-05-24/vercel-audit-report.json";
writeFileSync(out, JSON.stringify(audit, null, 2));
console.log(`\nWrote ${audit.length} project entries to ${out}`);

// Print summary table
console.log("\n=== Summary ===");
console.log("name                              | linked | domains | env | last deploy");
console.log("----------------------------------|--------|---------|-----|------------");
for (const a of audit) {
  const linked = a.link ? `${a.link.org}/${a.link.repo}` : "—";
  const dom = a.domains.length;
  const last = a.latestDeploy ? a.latestDeploy.createdAt.slice(0, 10) : "—";
  console.log(`${a.name.padEnd(34)}| ${linked.padEnd(7)}| ${String(dom).padStart(7)} | ${String(a.envCount).padStart(3)} | ${last}`);
}
```

- [ ] **Step 2: Run audit**

```bash
node "D:/Unite-Hub/.portfolio/scripts/vercel-audit.mjs"
```

Expected: ~24 projects audited; summary table printed; JSON written to archive.

- [ ] **Step 3: Commit script**

```bash
git -C "D:/Unite-Hub" add .portfolio/scripts/vercel-audit.mjs
git -C "D:/Unite-Hub" commit -m "feat(portfolio): add vercel-audit script"
```

---

## Task 3 — Classify projects + write classification doc

**File:** `D:\_archive\2026-05-24\vercel-classification.md`

Based on the audit JSON, classify each project as:
- `KEEP_PROD` — production for an active registry product
- `KEEP_SANDBOX` — already-existing sandbox
- `ARCHIVE` — junk/experiment, no production domain, safe to archive
- `RECONCILE` — name collision (the 3 `unite-group*`), needs manual decision

- [ ] **Step 1: Write classification doc**

Read `vercel-audit-report.json` and the registry. For each project apply the rules:

```
if project.name in registry.products[].vercel.production.project_name → KEEP_PROD
elif project.name ends with "-sandbox" → KEEP_SANDBOX
elif project.name in ["dashboard","web","tmp","v0-hotel-dashboard"] → ARCHIVE
elif project.name matches /^(brave|infallible|cool|keen|modest)-[a-z]+$/ → ARCHIVE (Vercel auto-name)
elif project.name in ["unite-group","unite-group-ops","unite-group.in"] → RECONCILE
else → KEEP_PROD (unknown — assume real)
```

Write `vercel-classification.md` with one section per classification, showing name + linked repo + domains + last deploy.

- [ ] **Step 2: Append classification to cleanup log**

```bash
cat "D:/_archive/2026-05-24/vercel-classification.md" >> "D:/_archive/2026-05-24/_cleanup-log.md"
```

- [ ] **Step 3: STOP — present classification table to user before any archive action**

The 4 generic-name projects (`dashboard`, `web`, `tmp`, `v0-hotel-dashboard`) may not be junk if they have production domains. The 3 `unite-group*` names need user input on which to keep. Pause and surface the audit; only proceed when user confirms.

---

## Task 4 — Archive the 6 auto-named projects (lowest risk)

The 6 Vercel auto-generated names (`brave-colden`, `infallible-poincare`, `infallible-pasteur`, `cool-moser`, `keen-hellman`, `modest-saha`) are created by `vercel deploy` without a project name. They're almost certainly abandoned. Archive without user confirmation per Plan 02 pattern.

- [ ] **Step 1: Archive each via PATCH name → `_archive_*_2026-05-24` + disconnect git**

```bash
TEAM="team_KMZACI5rIltoCRhAtGCXlxUf"
AUTO_NAMES=("brave-colden" "infallible-poincare" "infallible-pasteur" "cool-moser" "keen-hellman" "modest-saha")

for name in "${AUTO_NAMES[@]}"; do
  echo "=== $name ==="
  # Look up project ID from audit JSON
  PID=$(node -e "const a=require('D:/_archive/2026-05-24/vercel-audit-report.json'); console.log(a.find(p=>p.name==='$name')?.id || '')")
  if [ -z "$PID" ]; then echo "  NOT FOUND — skipping"; continue; fi

  # Rename
  NEW="_archive_${name}_2026-05-24"
  RES=$("D:/Unite-Hub/.portfolio/scripts/vercel-api.sh" PATCH "/v9/projects/$PID?teamId=$TEAM" "{\"name\":\"$NEW\"}")
  echo "  renamed → $NEW"

  # Disconnect git (if linked)
  "D:/Unite-Hub/.portfolio/scripts/vercel-api.sh" DELETE "/v9/projects/$PID/link?teamId=$TEAM" > /dev/null
  echo "  git disconnected"
done
```

- [ ] **Step 2: Verify all 6 renamed**

```bash
"D:/Unite-Hub/.portfolio/scripts/vercel-api.sh" GET "/v9/projects?teamId=$TEAM&limit=100&search=_archive_" | node -e "let s=''; process.stdin.on('data',c=>s+=c); process.stdin.on('end',()=>console.log(JSON.parse(s).projects.map(p=>p.name).join('\n')))"
```

Expected: 6 lines starting `_archive_*_2026-05-24`.

- [ ] **Step 3: Log**

```bash
echo "" >> "D:/_archive/2026-05-24/_cleanup-log.md"
echo "### 2026-05-24 — Plan 04 Task 4: archived 6 auto-named Vercel projects" >> "D:/_archive/2026-05-24/_cleanup-log.md"
printf '  - %s → _archive_%s_2026-05-24\n' "${AUTO_NAMES[@]}" >> "D:/_archive/2026-05-24/_cleanup-log.md"
```

---

## Task 5 — Archive the 4 generic-name projects (after USER review)

For each of `dashboard`, `web`, `tmp`, `v0-hotel-dashboard`: present audit (domains, last deploy, linked repo) to user. Only archive after user confirms each.

- [ ] **Step 1: Print per-project audit summary**

```bash
for n in dashboard web tmp v0-hotel-dashboard; do
  echo "=== $n ==="
  node -e "const a=require('D:/_archive/2026-05-24/vercel-audit-report.json'); console.log(JSON.stringify(a.find(p=>p.name==='$n'), null, 2))"
done
```

- [ ] **Step 2: USER GATE — confirm each project is safe to archive**

> Pause and ask the user to OK each one. Do NOT auto-archive.

- [ ] **Step 3: For confirmed ones, archive via same method as Task 4**

```bash
# For each user-confirmed name:
"D:/Unite-Hub/.portfolio/scripts/vercel-api.sh" PATCH "/v9/projects/$PID?teamId=$TEAM" "{\"name\":\"_archive_${name}_2026-05-24\"}"
"D:/Unite-Hub/.portfolio/scripts/vercel-api.sh" DELETE "/v9/projects/$PID/link?teamId=$TEAM"
```

---

## Task 6 — Reconcile the 3 `unite-group*` projects

`unite-group`, `unite-group-ops`, `unite-group.in` — all under the `unite-group` team. Per Plan 03 registry:
- `unite-group` (prj_IfUuJNLjXTE8VXqEGwLAleIGhiA0) is canonical for Authority-Site

Unknown:
- What does `unite-group-ops` deploy?
- What does `unite-group.in` deploy and which domain does it hold?

- [ ] **Step 1: Print each project's audit**

```bash
for n in unite-group unite-group-ops unite-group.in; do
  echo "=== $n ==="
  node -e "const a=require('D:/_archive/2026-05-24/vercel-audit-report.json'); console.log(JSON.stringify(a.find(p=>p.name==='$n'), null, 2))"
done
```

- [ ] **Step 2: USER DECISION** — based on audit, which serves the real `unite-group.vercel.app` and `unite-group.in` domains? Confirm canonical is `unite-group`.

- [ ] **Step 3: If `unite-group-ops` is unused, archive it** (same archive method).

- [ ] **Step 4: If `unite-group.in` is a real customer domain holder, keep but note as a domain-only project in the registry under a `domain_projects:` block** (schema addition needed). Otherwise archive.

---

## Task 7 — Provision 8 missing sandbox projects

For each active product without an existing sandbox Vercel project, create:
- New Vercel project named `<canonical>-sandbox`
- Link to same GitHub repo
- Set `productionBranch` to `sandbox`

Missing sandboxes (per Plan 01 registry): `unite-hub-sandbox`, `disaster-recovery-sandbox`, `dr-nrpg-sandbox`, `synthex-sandbox`, `ato-app-sandbox`, `carsi-web-sandbox`, `pi-dev-ops-sandbox`, `unite-group-sandbox` (Authority-Site)

Already exist: `restoreassist-sandbox`, `ccw-crm-sandbox`.

- [ ] **Step 1: Write `vercel-provision-sandbox.mjs`**

```javascript
// Creates a sandbox Vercel project linked to <repo>:sandbox.
// Usage: node vercel-provision-sandbox.mjs <canonical_name>
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const YAML = require("yaml");

const TEAM = "team_KMZACI5rIltoCRhAtGCXlxUf";
const api = (method, path, body) => {
  const cmd = body
    ? `bash D:/Unite-Hub/.portfolio/scripts/vercel-api.sh ${method} "${path}" '${body.replace(/'/g, "\\'")}'`
    : `bash D:/Unite-Hub/.portfolio/scripts/vercel-api.sh ${method} "${path}"`;
  return JSON.parse(execSync(cmd, { encoding: "utf8" }));
};

const target = process.argv[2];
if (!target) { console.error("Usage: node vercel-provision-sandbox.mjs <canonical_name>"); process.exit(1); }

const reg = YAML.parse(readFileSync("D:/Unite-Hub/.portfolio/PORTFOLIO.yaml", "utf8"));
const p = reg.products.find(x => x.canonical_name === target);
if (!p) { console.error(`Product "${target}" not in registry`); process.exit(1); }
if (!p.github?.repo) { console.error(`Product "${target}" has no github repo`); process.exit(1); }

const sandboxName = p.vercel.sandbox.project_name;
if (!sandboxName) { console.error(`No vercel.sandbox.project_name in registry`); process.exit(1); }

if (p.vercel.sandbox.project_id) {
  console.log(`Already provisioned: ${sandboxName} (${p.vercel.sandbox.project_id})`);
  process.exit(0);
}

const body = {
  name: sandboxName,
  framework: p.stack?.framework?.startsWith("next") ? "nextjs" : null,
  gitRepository: {
    type: "github",
    repo: `${p.github.org}/${p.github.repo}`,
    productionBranch: p.github.sandbox_branch || "sandbox",
  },
};

const res = api("POST", `/v10/projects?teamId=${TEAM}`, JSON.stringify(body));
if (res.error) { console.error(`FAIL: ${res.error.message}`); process.exit(1); }
console.log(`Created: ${res.name} (${res.id})`);
console.log(`Link: https://vercel.com/unite-group/${res.name}`);
console.log(`Linked to: ${p.github.org}/${p.github.repo}@${p.github.sandbox_branch || 'sandbox'}`);
console.log(`\nNext: fill in registry .vercel.sandbox.project_id = ${res.id}`);
```

- [ ] **Step 2: Smoke-test on Unite-Hub first**

```bash
node "D:/Unite-Hub/.portfolio/scripts/vercel-provision-sandbox.mjs" Unite-Hub
```

Expected: creates `unite-hub-sandbox` Vercel project, prints the new ID.

- [ ] **Step 3: USER GATE** — verify the new project in Vercel dashboard before mass-provisioning. Confirm it builds successfully from the `sandbox` branch (which Plan 02 created for all active repos).

- [ ] **Step 4: Mass-provision the remaining 7**

```bash
for canon in Disaster-Recovery DR-NRPG Synthex ATO-APP CARSI Pi-Dev-Ops Authority-Site; do
  node "D:/Unite-Hub/.portfolio/scripts/vercel-provision-sandbox.mjs" "$canon"
done
```

Expected: 7 sandbox projects created, IDs printed.

- [ ] **Step 5: Update registry with new project_ids**

For each new sandbox, edit `PORTFOLIO.yaml` to fill in `vercel.sandbox.project_id` and `vercel.sandbox.domain` (which is `<sandbox-name>.vercel.app`).

- [ ] **Step 6: Re-validate + re-mirror**

```bash
node "D:/Unite-Hub/.portfolio/scripts/validate-registry.mjs"
powershell -NoProfile -Command "& 'D:\Unite-Hub\.portfolio\scripts\Mirror-ToHermes.ps1'"
```

- [ ] **Step 7: Commit**

```bash
git -C "D:/Unite-Hub" add .portfolio/
git -C "D:/Unite-Hub" commit -m "feat(portfolio): provision 8 sandbox Vercel projects + fill registry IDs"
```

---

## Task 8 — Set sandbox env var conventions

Each new sandbox needs env vars distinct from prod (separate Supabase URL, test Stripe keys, email disabled, etc.). The spec defines the pattern but each product's env list is unique.

This task is **per-product manual**: agent reads the prod project's env list, prepares a sandbox-equivalent, and the user confirms each value before injection.

- [ ] **Step 1: List prod env vars per product (no values, just names)**

```bash
for canon in Unite-Hub Disaster-Recovery DR-NRPG Synthex ATO-APP CARSI Pi-Dev-Ops Authority-Site; do
  PROD_ID=$(node -e "const r=require('js-yaml').load(require('fs').readFileSync('D:/Unite-Hub/.portfolio/PORTFOLIO.yaml','utf8')); console.log(r.products.find(p=>p.canonical_name==='$canon').vercel.production.project_id)")
  echo "=== $canon (prod=$PROD_ID) ==="
  "D:/Unite-Hub/.portfolio/scripts/vercel-api.sh" GET "/v9/projects/$PROD_ID/env?teamId=$TEAM" \
    | node -e "let s=''; process.stdin.on('data',c=>s+=c); process.stdin.on('end',()=>console.log((JSON.parse(s).envs||[]).map(e=>e.key+' ('+e.type+')').join('\n')))"
done
```

This Task 8 is a **read-only inventory**. The actual env var injection is deferred — needs per-product per-value decisions that should not be batched.

- [ ] **Step 2: Write env inventory to cleanup log**

```bash
echo "" >> "D:/_archive/2026-05-24/_cleanup-log.md"
echo "### 2026-05-24 — Plan 04 Task 8: prod env var inventory per product" >> "D:/_archive/2026-05-24/_cleanup-log.md"
# … repeat the loop above, redirect output …
```

- [ ] **Step 3: Document the gap explicitly**

The plan acknowledges this is unfinished: each sandbox starts EMPTY of env vars. The user (or a follow-up plan) must populate them before sandboxes can build/run. Until that's done, sandbox projects exist but cannot deploy.

---

## Task 9 — Schedule Vercel hard-delete for archived projects

**File:** `D:\Unite-Hub\.portfolio\schedule\Register-VercelHardDelete.ps1`

- [ ] **Step 1: Write registration script**

```powershell
# Register-VercelHardDelete.ps1 — fires 2026-05-31 03:45, deletes ALL Vercel projects
# whose name starts with "_archive_" and ends with "_2026-05-24".
# MUST be run in elevated PowerShell.

$taskName = "UniteCleanup-VercelDelete-2026-05-31"
$archivePattern = "_archive_*_2026-05-24"
$cmd = @"
`$ErrorActionPreference = 'Continue'
`$token = `$env:VERCEL_TOKEN
if (-not `$token) { Add-Content 'D:\_archive\vercel-hard-delete.log' -Value '$(Get-Date) ABORT: no VERCEL_TOKEN'; exit 1 }
`$team = 'team_KMZACI5rIltoCRhAtGCXlxUf'
`$resp = Invoke-WebRequest -Uri ('https://api.vercel.com/v9/projects?teamId=' + `$team + '&limit=100') -Headers @{Authorization='Bearer '+`$token} -SkipCertificateCheck
`$projects = (`$resp.Content | ConvertFrom-Json).projects | Where-Object { `$_.name -like '$archivePattern' }
foreach (`$p in `$projects) {
  Invoke-WebRequest -Uri ('https://api.vercel.com/v9/projects/' + `$p.id + '?teamId=' + `$team) -Method DELETE -Headers @{Authorization='Bearer '+`$token} -SkipCertificateCheck | Out-Null
  Add-Content 'D:\_archive\vercel-hard-delete.log' -Value ('$(Get-Date) deleted ' + `$p.name + ' (' + `$p.id + ')')
}
"@

$action = New-ScheduledTaskAction -Execute "powershell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -Command `"$cmd`""
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date "2026-05-31T03:45:00")
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -RunLevel Highest -LogonType Interactive
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger `
  -Principal $principal -Settings $settings -Force | Out-Null

Write-Output "Registered: $taskName (fires 2026-05-31 03:45)"
Write-Output "Will delete all Vercel projects matching: $archivePattern"
```

- [ ] **Step 2: USER GATE — register in elevated PowerShell**

```powershell
& 'D:\Unite-Hub\.portfolio\schedule\Register-VercelHardDelete.ps1'
```

- [ ] **Step 3: Verify**

```powershell
Get-ScheduledTask -TaskName "UniteCleanup-VercelDelete-2026-05-31" | Select TaskName, State
```

---

## Task 10 — Update registry with all final IDs + retired_vercel_projects block

- [ ] **Step 1: Add `retired_vercel_projects:` block to PORTFOLIO.yaml** (parallel to `retired_repos:`)

For each archived Vercel project, an entry recording the rename, when, why, rollback.

- [ ] **Step 2: Update schema** (allow `retired_vercel_projects:` optional array)

- [ ] **Step 3: Re-validate + re-mirror + commit**

---

## Task 11 — Acceptance verification

- [ ] **Step 1: 6 auto-named + N user-confirmed projects renamed to `_archive_*`**

```bash
"D:/Unite-Hub/.portfolio/scripts/vercel-api.sh" GET "/v9/projects?teamId=$TEAM&limit=100" \
  | node -e "let s=''; process.stdin.on('data',c=>s+=c); process.stdin.on('end',()=>{const ps=JSON.parse(s).projects.filter(p=>p.name.startsWith('_archive_'));console.log(\`Archived: \${ps.length}\`); ps.forEach(p=>console.log(\`  \${p.name}\`))})"
```

Expected: ≥6 archived (6 auto-named + however many generic-name ones the user OKed).

- [ ] **Step 2: 10 active products now have BOTH prod + sandbox project_id in registry**

```bash
node -e "
const yaml = require('D:/Unite-Hub/.portfolio/node_modules/yaml');
const fs = require('fs');
const r = yaml.parse(fs.readFileSync('D:/Unite-Hub/.portfolio/PORTFOLIO.yaml','utf8'));
const missing = [];
for (const p of r.products) {
  if (p.status !== 'active' || !p.github?.repo) continue;
  const prod = p.vercel?.production?.project_id;
  const sand = p.vercel?.sandbox?.project_id;
  if (prod === 'TBD' || !prod) missing.push(\`\${p.canonical_name}: prod missing\`);
  if (sand === 'TBD' || !sand) missing.push(\`\${p.canonical_name}: sandbox missing\`);
}
if (missing.length) { console.log('MISSING:'); missing.forEach(m=>console.log('  '+m)); } else console.log('All product IDs filled');
"
```

Expected: `All product IDs filled`.

- [ ] **Step 3: Registry validates + Hermes mirror in sync**

- [ ] **Step 4: Scheduled task `UniteCleanup-VercelDelete-2026-05-31` exists**

---

## Task 12 — Final commit, push, handoff

- [ ] **Step 1: Final commit**

```bash
git -C "D:/Unite-Hub" status --porcelain
git -C "D:/Unite-Hub" add -A
git -C "D:/Unite-Hub" commit -m "chore(cleanup-04): complete Vercel audit + sandbox provisioning" || true
```

- [ ] **Step 2: Push**

```bash
git -C "D:/Unite-Hub" push 2>&1 | tail -3
```

- [ ] **Step 3: Status report**

```
================ PLAN 04 STATUS ================
✓ Vercel audit JSON: D:\_archive\2026-05-24\vercel-audit-report.json
✓ Classification doc: D:\_archive\2026-05-24\vercel-classification.md
✓ Archived projects: 6 auto-named + N user-confirmed
✓ Sandbox projects provisioned: 8
✓ Registry: all 10 active products have prod + sandbox project_ids
✓ Hard-delete scheduled: UniteCleanup-VercelDelete-2026-05-31 (fires 03:45)
⚠ Sandbox env vars: NOT populated (Task 8 deferred — per-product values needed)

NEXT: Plan 05 (Guardrails — alias hook + bootstrap script)
================================================
```

- [ ] **Step 4: Hand off**

Ask user to confirm Plan 04 outcome and approve writing Plan 05.

---

## Rollback procedures

**Unarchive a Vercel project (within 7 days):**
```bash
PID=...  # from cleanup log
"D:/Unite-Hub/.portfolio/scripts/vercel-api.sh" PATCH "/v9/projects/$PID?teamId=$TEAM" \
  '{"name":"<original-name>"}'
```

**Cancel scheduled hard-delete:**
```powershell
Unregister-ScheduledTask -TaskName 'UniteCleanup-VercelDelete-2026-05-31' -Confirm:$false
```

**Re-link archived git connection** (cannot via API — must use Vercel dashboard if needed).

**Delete an accidentally-created sandbox:**
```bash
"D:/Unite-Hub/.portfolio/scripts/vercel-api.sh" DELETE "/v9/projects/$PID?teamId=$TEAM"
```

---

## Self-review notes

**Coverage of spec Phase 3:**
- ✓ Sub-phase 3a audit & purge → Tasks 1-6
- ✓ Sub-phase 3b sandbox provisioning → Task 7
- ✓ Env var conventions doc → Task 8 (partial — read-only inventory; actual sync deferred)
- ✓ Scheduled hard-delete → Task 9
- ✓ Registry sync → Tasks 7, 10
- ✓ Acceptance criteria → Task 11

**Out of Plan 04 scope:**
- Per-product env var values for sandboxes (Task 8 deferred — needs human values: separate Supabase URLs, test Stripe keys, etc.). A follow-up plan or manual step.
- Custom domain transfer between projects (e.g., if `unite-group.in` holds a domain we want on a different project)
- Vercel team-level billing review
- Vercel `unite-group.in` reconciliation will need user input on whether it's a real customer-facing domain

**Risks:**
- **`unite-group-ops` could be a real production deployment** (its name implies operational tooling). Audit reveals what it's linked to BEFORE any action.
- **Renaming a Vercel project breaks any external references** to its `<name>.vercel.app` URL. Mitigation: only auto-archive the 6 Vercel auto-named projects (which by design have no real users). The 4 generic + 3 colliding require user confirmation.
- **Sandbox projects deploy from `sandbox` branch** — if that branch is broken (e.g., from a botched test push), the sandbox project's first deploy will fail. Acceptable for initial provisioning.
- **The `--insecure` curl bypass** is an SSL inspection workaround. Documented in Plan 01's cleanup log. Long-term fix is corporate CA install, not this plan's scope.
