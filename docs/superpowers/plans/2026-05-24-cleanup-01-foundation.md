# Cleanup Plan 01 — Foundation: Portfolio Registry + Disk Cleanup

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the Portfolio Registry (SSOT) and safely archive the 7 dirty top-level folders on `D:\`, with full reversibility for 7 days.

**Architecture:** A YAML registry at `D:\Unite-Hub\.portfolio\PORTFOLIO.yaml` becomes the single source of truth mapping every product's canonical name → aliases → repo → local path → Vercel projects. Phase 1 then uses a single reusable PowerShell function (`Move-ToArchive`) to relocate each dirty folder to `D:\_archive\2026-05-24\`, dropping a `MOVED.txt` breadcrumb at the original path. A scheduled Windows task fires the hard-delete on 2026-05-31.

**Tech Stack:** PowerShell 5.1 (Windows), YAML, git, Windows Task Scheduler, Node.js (registry schema validator).

**Spec reference:** `docs/superpowers/specs/2026-05-24-unite-ecosystem-cleanup-design.md`

**Prerequisites:**
- Run from `D:\Unite-Hub` on branch `docs/cleanup-spec-2026-05-24` (or a successor branch)
- `gh` CLI authenticated as `CleanExpo`
- Admin PowerShell (required for Register-ScheduledTask)
- No active edits open in any `D:\Unite*` folder (close VS Code / Cursor / IDEs before starting Task 9 onwards)

---

## File Structure

**Created:**
- `D:\Unite-Hub\.portfolio\PORTFOLIO.yaml` — the registry (SSOT)
- `D:\Unite-Hub\.portfolio\README.md` — explains the registry's role
- `D:\Unite-Hub\.portfolio\schema\portfolio.schema.json` — JSON Schema for validation
- `D:\Unite-Hub\.portfolio\scripts\validate-registry.mjs` — Node validator
- `D:\Unite-Hub\.portfolio\scripts\Move-ToArchive.ps1` — reusable archive function
- `D:\Unite-Hub\.portfolio\scripts\Mirror-ToHermes.ps1` — sync to Hermes wiki
- `D:\_archive\2026-05-24\_cleanup-log.md` — append-only action log
- `D:\Unite-Hub\.portfolio\schedule\Register-HardDelete.ps1` — scheduled-task installer

**Modified:**
- `D:\Unite-Hub\CLAUDE.md` — adds `@.portfolio/PORTFOLIO.yaml` reference + Identity block
- `D:\Hermes\wiki\entities\portfolio\PORTFOLIO.yaml` — mirror (generated, not hand-edited)

---

## Task 1 — Create the archive root and cleanup log

**Files:**
- Create: `D:\_archive\2026-05-24\_cleanup-log.md`

- [ ] **Step 1: Create archive directory**

```powershell
New-Item -ItemType Directory -Force -Path "D:\_archive\2026-05-24" | Out-Null
Test-Path "D:\_archive\2026-05-24"
```

Expected: `True`

- [ ] **Step 2: Initialize the cleanup log**

```powershell
@"
# Unite-Group Ecosystem Cleanup — Action Log
**Date:** 2026-05-24
**Spec:** D:\Unite-Hub\docs\superpowers\specs\2026-05-24-unite-ecosystem-cleanup-design.md
**Plan:** D:\Unite-Hub\docs\superpowers\plans\2026-05-24-cleanup-01-foundation.md

> Append-only. Every destructive action records pre-state, action, post-state, and rollback command.

## Schedule
- 2026-05-24: Archive operations performed
- 2026-05-31: Hard delete scheduled (UniteCleanup-2026-05-31 task)

## Actions

"@ | Out-File -FilePath "D:\_archive\2026-05-24\_cleanup-log.md" -Encoding utf8
Get-Content "D:\_archive\2026-05-24\_cleanup-log.md" | Select-Object -First 5
```

Expected: First 5 lines of the log.

- [ ] **Step 3: Verify**

```powershell
if ((Test-Path "D:\_archive\2026-05-24\_cleanup-log.md") -and ((Get-Item "D:\_archive\2026-05-24\_cleanup-log.md").Length -gt 0)) { "OK" } else { throw "FAIL" }
```

Expected: `OK`

---

## Task 2 — Create the registry directory + skeleton

**Files:**
- Create: `D:\Unite-Hub\.portfolio\README.md`
- Create: `D:\Unite-Hub\.portfolio\PORTFOLIO.yaml`

- [ ] **Step 1: Create directory**

```powershell
New-Item -ItemType Directory -Force -Path "D:\Unite-Hub\.portfolio\schema" | Out-Null
New-Item -ItemType Directory -Force -Path "D:\Unite-Hub\.portfolio\scripts" | Out-Null
New-Item -ItemType Directory -Force -Path "D:\Unite-Hub\.portfolio\schedule" | Out-Null
Test-Path "D:\Unite-Hub\.portfolio"
```

Expected: `True`

- [ ] **Step 2: Write `.portfolio\README.md`**

```powershell
@'
# .portfolio — Unite-Group Portfolio Registry

This directory is the **single source of truth** mapping each product in the
Unite-Group portfolio to its canonical name, aliases, GitHub repo, local
canonical path, Vercel projects, and workflow rules.

**Files:**
- `PORTFOLIO.yaml` — the registry. EDIT HERE ONLY.
- `schema/portfolio.schema.json` — JSON Schema validating PORTFOLIO.yaml
- `scripts/validate-registry.mjs` — `node` validator (run before commit)
- `scripts/Move-ToArchive.ps1` — reusable cleanup function
- `scripts/Mirror-ToHermes.ps1` — sync to `D:\Hermes\wiki\entities\portfolio\`
- `schedule/Register-HardDelete.ps1` — installs the scheduled-task hard-delete

**Auto-loading:** Every product's `CLAUDE.md` references this file via
`@../.portfolio/PORTFOLIO.yaml` so agents preload it on session start.

**Editing rules:**
1. Only edit `PORTFOLIO.yaml` here. The Hermes mirror is generated.
2. Run `node scripts/validate-registry.mjs` before commit.
3. Any change requires a PR with 24h cooling-off (solo founder rule).
'@ | Out-File -FilePath "D:\Unite-Hub\.portfolio\README.md" -Encoding utf8
```

- [ ] **Step 3: Verify**

```powershell
(Get-Content "D:\Unite-Hub\.portfolio\README.md" -Raw).Length -gt 100
```

Expected: `True`

---

## Task 3 — Write the initial PORTFOLIO.yaml (all 11 products)

**Files:**
- Create: `D:\Unite-Hub\.portfolio\PORTFOLIO.yaml`

- [ ] **Step 1: Write the registry file**

```powershell
@'
# Unite-Group Portfolio Registry — SSOT
# Spec: docs/superpowers/specs/2026-05-24-unite-ecosystem-cleanup-design.md
# Edit here only. Hermes mirror is auto-generated.

schema_version: 1
generated_at: "2026-05-24"
parent_company: "Unite-Group Nexus Pty Ltd"

products:
  - canonical_name: Unite-Hub
    aliases: ["Unite Hub", "Unite-Group", "Unite Group", "Unite-Group CRM", "the CRM", "Marketing CRM"]
    purpose: "AI-first marketing CRM and email automation platform"
    status: active
    owner: phill
    github:
      org: CleanExpo
      repo: Unite-Hub
      url: https://github.com/CleanExpo/Unite-Hub
      default_branch: main
      sandbox_branch: sandbox
    local:
      canonical_path: 'D:\Unite-Hub'
      access_via: 'D:\Unite-Group\Unite-Hub'
      do_not_clone_to:
        - 'D:\Unite Group'
        - 'D:\Unite-Group CRM'
        - 'D:\unite-group-app'
        - 'D:\Unite-Hub Marketing Update'
    vercel:
      team_id: team_KMZACI5rIltoCRhAtGCXlxUf
      production: { project_id: TBD, project_name: TBD, domain: unite-hub.vercel.app }
      sandbox:    { project_id: TBD, project_name: unite-hub-sandbox, domain: unite-hub-sandbox.vercel.app }
    workflow: { sandbox_first: true, pr_required_for_prod: true, ci_required_checks: [typecheck, lint, test, build] }
    stack: { framework: "next@16", runtime: "react@19", package_manager: npm, dev_port: 3008 }
    dependencies:
      - { canonical_name: Hermes, relationship: "consumes wiki via WIKI_PATH" }

  - canonical_name: Authority-Site
    aliases: ["Empire Command Center", "CEO Dashboard", "Synthex Authority Hub", "Unite-Group Dashboard"]
    purpose: "CEO dashboard surfacing portfolio health + Pi-CEO agent activity (being merged into Unite-Hub)"
    status: active
    note: "Will flip to status:archived after Phase 2B merge completes"
    owner: phill
    github:
      org: CleanExpo
      repo: Unite-Group
      url: https://github.com/CleanExpo/Unite-Group
      default_branch: main
    local:
      canonical_path: 'D:\Unite-Group\Authority-Site'
      do_not_clone_to:
        - 'D:\Unite-Group Agency\Unite-Group'
        - 'D:\Unite-Group Agency\Unite-Group-Main'
    vercel:
      team_id: team_KMZACI5rIltoCRhAtGCXlxUf
      production: { project_id: TBD, project_name: TBD, domain: unite-group.vercel.app }
      sandbox:    { project_id: null, project_name: null, domain: null }
    workflow: { sandbox_first: true, pr_required_for_prod: true, ci_required_checks: [typecheck, build] }
    stack: { framework: "next@14", runtime: "react@18", package_manager: pnpm, dev_port: 3000 }
    dependencies:
      - { canonical_name: Pi-CEO, relationship: "consumes via PI_CEO_API_URL" }

  - canonical_name: RestoreAssist
    aliases: ["Restore Assist", "RA"]
    purpose: "Restoration product"
    status: active
    owner: phill
    github: { org: CleanExpo, repo: RestoreAssist, url: https://github.com/CleanExpo/RestoreAssist, default_branch: main, sandbox_branch: sandbox }
    local: { canonical_path: 'D:\RestoreAssist', access_via: 'D:\Unite-Group\RestoreAssist', do_not_clone_to: [] }
    vercel:
      team_id: team_KMZACI5rIltoCRhAtGCXlxUf
      production: { project_id: prj_Aw90JJ2x7mTMatTxa3ymgcU7WPV2, project_name: restoreassist, domain: TBD }
      sandbox:    { project_id: prj_i9clta3fzdpQwNhVmf9BMMddpG3k, project_name: restoreassist-sandbox, domain: TBD }
    workflow: { sandbox_first: true, pr_required_for_prod: true, ci_required_checks: [typecheck, lint, build] }

  - canonical_name: Disaster-Recovery
    aliases: ["DR", "Disaster Recovery"]
    purpose: "DR consumer product"
    status: active
    owner: phill
    github: { org: CleanExpo, repo: Disaster-Recovery, url: https://github.com/CleanExpo/Disaster-Recovery, default_branch: main, sandbox_branch: sandbox }
    local: { canonical_path: 'D:\Disaster-Recovery', access_via: 'D:\Unite-Group\Disaster-Recovery', do_not_clone_to: [] }
    vercel:
      team_id: team_KMZACI5rIltoCRhAtGCXlxUf
      production: { project_id: prj_dvNqTXXZxYENjFozhFnqIO72ABhW, project_name: disaster-recovery, domain: TBD }
      sandbox:    { project_id: null, project_name: disaster-recovery-sandbox, domain: TBD }
    workflow: { sandbox_first: true, pr_required_for_prod: true, ci_required_checks: [typecheck, lint, build] }

  - canonical_name: DR-NRPG
    aliases: ["NRPG", "Disaster Recovery NRP"]
    purpose: "NRPG contractor platform"
    status: active
    owner: phill
    github: { org: CleanExpo, repo: DR-NRPG, url: https://github.com/CleanExpo/DR-NRPG, default_branch: main, sandbox_branch: sandbox }
    local: { canonical_path: 'D:\Disaster Recovery - NRP', access_via: 'D:\Unite-Group\DR-NRPG', do_not_clone_to: [] }
    vercel:
      team_id: team_KMZACI5rIltoCRhAtGCXlxUf
      production: { project_id: prj_15zLJSeVhpqXcWf1s2U1fHdIHOtw, project_name: dr-nrpg-platform, domain: TBD }
      sandbox:    { project_id: null, project_name: dr-nrpg-sandbox, domain: TBD }
    workflow: { sandbox_first: true, pr_required_for_prod: true, ci_required_checks: [typecheck, lint, build] }

  - canonical_name: CCW-CRM
    aliases: ["CCW", "CCW CRM"]
    purpose: "CCW client CRM product"
    status: active
    owner: phill
    github: { org: CleanExpo, repo: CCW-CRM, url: https://github.com/CleanExpo/CCW-CRM, default_branch: main, sandbox_branch: sandbox }
    local: { canonical_path: 'D:\CCW-CRM', access_via: 'D:\Unite-Group\CCW-CRM', do_not_clone_to: [] }
    vercel:
      team_id: team_KMZACI5rIltoCRhAtGCXlxUf
      production: { project_id: prj_oTCifkMVqP1NFoTJFBv6u82JmBYd, project_name: ccw-crm-web, domain: TBD }
      sandbox:    { project_id: prj_8fNWSeOAy2mlSfkjllpWlb4TCQmM, project_name: ccw-crm-sandbox, domain: TBD }
    workflow: { sandbox_first: true, pr_required_for_prod: true, ci_required_checks: [typecheck, lint, build] }

  - canonical_name: Synthex
    aliases: ["Marketing Made Easy", "Synthex Marketing"]
    purpose: "Marketing platform"
    status: active
    owner: phill
    github: { org: CleanExpo, repo: Synthex, url: https://github.com/CleanExpo/Synthex, default_branch: main, sandbox_branch: sandbox }
    local: { canonical_path: 'D:\Synthex', access_via: 'D:\Unite-Group\Synthex', do_not_clone_to: [] }
    vercel:
      team_id: team_KMZACI5rIltoCRhAtGCXlxUf
      production: { project_id: prj_gbQmHn6quoHgG3AswRrDoUlYaF40, project_name: synthex, domain: TBD }
      sandbox:    { project_id: null, project_name: synthex-sandbox, domain: TBD }
    workflow: { sandbox_first: true, pr_required_for_prod: true, ci_required_checks: [typecheck, lint, build] }

  - canonical_name: ATO-APP
    aliases: ["ATO", "ato-app", "Tax App"]
    purpose: "Tax/accountant app"
    status: active
    owner: phill
    github: { org: CleanExpo, repo: ATO, url: https://github.com/CleanExpo/ATO, default_branch: main, sandbox_branch: sandbox }
    local: { canonical_path: 'D:\ATO', access_via: 'D:\Unite-Group\ATO-APP', do_not_clone_to: [] }
    vercel:
      team_id: team_KMZACI5rIltoCRhAtGCXlxUf
      production: { project_id: prj_vP8AEIPZmIu1Q3eB6y3qUAUQ20EJ, project_name: ato-app, domain: TBD }
      sandbox:    { project_id: null, project_name: ato-app-sandbox, domain: TBD }
    workflow: { sandbox_first: true, pr_required_for_prod: true, ci_required_checks: [typecheck, lint, build] }

  - canonical_name: CARSI
    aliases: ["Online Training LMS"]
    purpose: "Online training LMS"
    status: active
    owner: phill
    github: { org: CleanExpo, repo: CARSI, url: https://github.com/CleanExpo/CARSI, default_branch: main, sandbox_branch: sandbox }
    local: { canonical_path: null, do_not_clone_to: [] }
    vercel:
      team_id: team_KMZACI5rIltoCRhAtGCXlxUf
      production: { project_id: prj_hIQAdXiHQGGec6nNKEGzn7SyMh9p, project_name: carsi-web, domain: TBD }
      sandbox:    { project_id: null, project_name: carsi-web-sandbox, domain: TBD }
    workflow: { sandbox_first: true, pr_required_for_prod: true, ci_required_checks: [typecheck, build] }

  - canonical_name: Pi-Dev-Ops
    aliases: ["Pi DevOps", "Pi-CEO Dev Ops"]
    purpose: "Pi-CEO DevOps tooling"
    status: active
    owner: phill
    github: { org: CleanExpo, repo: Pi-Dev-Ops, url: https://github.com/CleanExpo/Pi-Dev-Ops, default_branch: main, sandbox_branch: sandbox }
    local: { canonical_path: null, do_not_clone_to: [] }
    vercel:
      team_id: team_KMZACI5rIltoCRhAtGCXlxUf
      production: { project_id: prj_I5sYqNTlL51DlvyzSFjiHX6FrLAX, project_name: pi-dev-ops, domain: TBD }
      sandbox:    { project_id: null, project_name: pi-dev-ops-sandbox, domain: TBD }
    workflow: { sandbox_first: true, pr_required_for_prod: true, ci_required_checks: [typecheck, build] }

  - canonical_name: Hermes
    aliases: ["Nexus-Hub", "Live-Nexus", "Hermes Agent"]
    purpose: "Operator command center (wiki SSOT, agent runtime)"
    status: active
    owner: phill
    github: { org: null, repo: null, url: null, default_branch: null }
    local: { canonical_path: 'D:\Hermes', access_via: 'D:\Unite-Group\Nexus-Hub', do_not_clone_to: [] }
    vercel:
      team_id: team_KMZACI5rIltoCRhAtGCXlxUf
      production: { project_id: prj_oOqmFFnJGCp2pvrZkNgpcg8qk6rD, project_name: live-nexus, domain: TBD }
      sandbox:    { project_id: null, project_name: live-nexus-sandbox, domain: TBD }
    workflow: { sandbox_first: true, pr_required_for_prod: true, ci_required_checks: [typecheck, build] }
'@ | Out-File -FilePath "D:\Unite-Hub\.portfolio\PORTFOLIO.yaml" -Encoding utf8
```

- [ ] **Step 2: Verify file exists and is parseable**

```powershell
$f = "D:\Unite-Hub\.portfolio\PORTFOLIO.yaml"
if (-not (Test-Path $f)) { throw "registry not written" }
$lines = (Get-Content $f | Measure-Object).Lines
"$f written: $lines lines"
```

Expected: ~150 lines.

- [ ] **Step 3: Commit**

```powershell
git -C "D:\Unite-Hub" add .portfolio/
git -C "D:\Unite-Hub" commit -m "feat(portfolio): add registry skeleton with 11 products"
```

---

## Task 4 — Write the JSON Schema for the registry

**Files:**
- Create: `D:\Unite-Hub\.portfolio\schema\portfolio.schema.json`

- [ ] **Step 1: Write schema**

```powershell
@'
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Unite-Group Portfolio Registry",
  "type": "object",
  "required": ["schema_version", "generated_at", "parent_company", "products"],
  "properties": {
    "schema_version": { "type": "integer", "minimum": 1 },
    "generated_at":   { "type": "string", "pattern": "^\\d{4}-\\d{2}-\\d{2}$" },
    "parent_company": { "type": "string" },
    "products": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["canonical_name", "aliases", "purpose", "status", "github", "local", "vercel"],
        "properties": {
          "canonical_name": { "type": "string", "pattern": "^[A-Za-z][A-Za-z0-9_-]+$" },
          "aliases":        { "type": "array", "items": { "type": "string" } },
          "purpose":        { "type": "string" },
          "status":         { "enum": ["active", "maintenance", "archived"] },
          "owner":          { "type": "string" },
          "note":           { "type": "string" },
          "github": {
            "type": "object",
            "properties": {
              "org":             { "type": ["string", "null"] },
              "repo":            { "type": ["string", "null"] },
              "url":             { "type": ["string", "null"] },
              "default_branch":  { "type": ["string", "null"] },
              "sandbox_branch":  { "type": "string" }
            }
          },
          "local": {
            "type": "object",
            "properties": {
              "canonical_path":   { "type": ["string", "null"] },
              "access_via":       { "type": "string" },
              "do_not_clone_to":  { "type": "array", "items": { "type": "string" } }
            }
          },
          "vercel": {
            "type": "object",
            "required": ["team_id"],
            "properties": {
              "team_id": { "type": "string", "pattern": "^team_" },
              "production": {
                "type": "object",
                "properties": {
                  "project_id":   { "type": ["string", "null"] },
                  "project_name": { "type": ["string", "null"] },
                  "domain":       { "type": ["string", "null"] }
                }
              },
              "sandbox": {
                "type": "object",
                "properties": {
                  "project_id":   { "type": ["string", "null"] },
                  "project_name": { "type": ["string", "null"] },
                  "domain":       { "type": ["string", "null"] }
                }
              }
            }
          },
          "workflow": { "type": "object" },
          "stack":    { "type": "object" },
          "dependencies": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["canonical_name", "relationship"],
              "properties": {
                "canonical_name": { "type": "string" },
                "relationship":   { "type": "string" }
              }
            }
          }
        }
      }
    }
  }
}
'@ | Out-File -FilePath "D:\Unite-Hub\.portfolio\schema\portfolio.schema.json" -Encoding utf8
```

- [ ] **Step 2: Verify valid JSON**

```powershell
Get-Content "D:\Unite-Hub\.portfolio\schema\portfolio.schema.json" -Raw | ConvertFrom-Json | Out-Null
"schema is valid JSON"
```

Expected: `schema is valid JSON`

---

## Task 5 — Write the registry validator

**Files:**
- Create: `D:\Unite-Hub\.portfolio\scripts\validate-registry.mjs`

- [ ] **Step 1: Write validator**

```powershell
@'
#!/usr/bin/env node
// Validates PORTFOLIO.yaml against schema, plus extra invariants:
// - canonical_names are unique
// - no alias collides with another product's canonical_name or alias
// - do_not_clone_to paths are absolute Windows paths
// Usage: node validate-registry.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import YAML from "yaml";
import Ajv from "ajv";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const yamlText = readFileSync(resolve(root, "PORTFOLIO.yaml"), "utf8");
const schema = JSON.parse(readFileSync(resolve(root, "schema/portfolio.schema.json"), "utf8"));
const data = YAML.parse(yamlText);

const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema);
if (!validate(data)) {
  console.error("Schema validation failed:");
  for (const err of validate.errors) console.error(`  ${err.instancePath} ${err.message}`);
  process.exit(1);
}

const errors = [];
const seenCanon = new Set();
const seenAlias = new Map(); // alias -> canonical

for (const p of data.products) {
  if (seenCanon.has(p.canonical_name)) errors.push(`duplicate canonical_name: ${p.canonical_name}`);
  seenCanon.add(p.canonical_name);

  for (const a of p.aliases ?? []) {
    if (seenAlias.has(a) && seenAlias.get(a) !== p.canonical_name) {
      errors.push(`alias "${a}" used by both ${seenAlias.get(a)} and ${p.canonical_name}`);
    }
    if (seenCanon.has(a) && a !== p.canonical_name) {
      errors.push(`alias "${a}" collides with a different canonical_name`);
    }
    seenAlias.set(a, p.canonical_name);
  }

  for (const path of p.local?.do_not_clone_to ?? []) {
    if (!/^[A-Z]:\\/.test(path)) errors.push(`${p.canonical_name}: do_not_clone_to path not absolute: ${path}`);
  }
}

if (errors.length) {
  console.error("Invariant errors:");
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log(`OK — ${data.products.length} products, ${seenAlias.size} aliases, no collisions`);
'@ | Out-File -FilePath "D:\Unite-Hub\.portfolio\scripts\validate-registry.mjs" -Encoding utf8
```

- [ ] **Step 2: Install validator deps**

```powershell
cd "D:\Unite-Hub\.portfolio"
npm init -y | Out-Null
npm install --save-dev yaml ajv 2>&1 | Select-Object -Last 3
```

- [ ] **Step 3: Run validator**

```powershell
node "D:\Unite-Hub\.portfolio\scripts\validate-registry.mjs"
```

Expected: `OK — 11 products, N aliases, no collisions`

- [ ] **Step 4: Commit**

```powershell
git -C "D:\Unite-Hub" add .portfolio/
git -C "D:\Unite-Hub" commit -m "feat(portfolio): add JSON schema + validator"
```

---

## Task 6 — Wire registry into Unite-Hub CLAUDE.md

**Files:**
- Modify: `D:\Unite-Hub\CLAUDE.md` (insert Identity block at top)

- [ ] **Step 1: Insert Identity block after the existing top heading**

Read the current first 5 lines:

```powershell
Get-Content "D:\Unite-Hub\CLAUDE.md" -TotalCount 5
```

- [ ] **Step 2: Inject the Identity block**

```powershell
$file = "D:\Unite-Hub\CLAUDE.md"
$content = Get-Content $file -Raw
$identity = @'
@.portfolio/PORTFOLIO.yaml

## Identity (SSOT)
**Canonical name:** Unite-Hub
**Aliases this project answers to:** "Unite Group", "Unite-Group", "Unite-Group CRM", "the CRM", "Marketing CRM"
**Canonical local path:** `D:\Unite-Hub`
**Access via:** `D:\Unite-Group\Unite-Hub` (junction)
**GitHub:** `CleanExpo/Unite-Hub`

> If the user uses any alias, this is what they mean.
> Do NOT create new repos or clones. Do NOT create folders matching
> `local.do_not_clone_to[]` in `.portfolio/PORTFOLIO.yaml`.

---

'@
# Insert AFTER the first `# CLAUDE.md` heading (idempotent)
if ($content -notmatch '@\.portfolio/PORTFOLIO\.yaml') {
  $new = $content -replace '(?m)^(# CLAUDE.md[^\r\n]*\r?\n)', "`$1`r`n$identity"
  $new | Out-File -FilePath $file -Encoding utf8 -NoNewline
  "inserted"
} else { "already present" }
```

Expected: `inserted` (first run) or `already present` (subsequent runs).

- [ ] **Step 3: Verify**

```powershell
(Get-Content "D:\Unite-Hub\CLAUDE.md" -Raw) -match '@\.portfolio/PORTFOLIO\.yaml'
```

Expected: `True`

- [ ] **Step 4: Commit**

```powershell
git -C "D:\Unite-Hub" add CLAUDE.md
git -C "D:\Unite-Hub" commit -m "feat(portfolio): wire registry into CLAUDE.md identity block"
```

---

## Task 7 — Write the Mirror-ToHermes script

**Files:**
- Create: `D:\Unite-Hub\.portfolio\scripts\Mirror-ToHermes.ps1`

- [ ] **Step 1: Write the script**

```powershell
@'
# Mirror-ToHermes.ps1 — copies PORTFOLIO.yaml to Hermes wiki
# Hermes wiki SSOT path: D:\Hermes\wiki\entities\portfolio\
$src  = "D:\Unite-Hub\.portfolio\PORTFOLIO.yaml"
$dest = "D:\Hermes\wiki\entities\portfolio\PORTFOLIO.yaml"
$destDir = Split-Path $dest -Parent

if (-not (Test-Path "D:\Hermes")) {
  Write-Warning "Hermes not present at D:\Hermes — skipping mirror (this is OK on machines without Hermes)"
  exit 0
}

New-Item -ItemType Directory -Force -Path $destDir | Out-Null
Copy-Item -Path $src -Destination $dest -Force

# Add a header banner so editors know not to hand-edit this copy
$banner = @"
# >>> AUTO-GENERATED MIRROR — DO NOT EDIT HERE <<<
# Edit only: D:\Unite-Hub\.portfolio\PORTFOLIO.yaml
# Last sync: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

"@
$existing = Get-Content $dest -Raw
$banner + $existing | Out-File -FilePath $dest -Encoding utf8

Write-Output "Mirrored to $dest"
'@ | Out-File -FilePath "D:\Unite-Hub\.portfolio\scripts\Mirror-ToHermes.ps1" -Encoding utf8
```

- [ ] **Step 2: Run mirror**

```powershell
& "D:\Unite-Hub\.portfolio\scripts\Mirror-ToHermes.ps1"
```

Expected: `Mirrored to D:\Hermes\wiki\entities\portfolio\PORTFOLIO.yaml` OR warning if Hermes absent.

- [ ] **Step 3: Verify**

```powershell
if (Test-Path "D:\Hermes") {
  Test-Path "D:\Hermes\wiki\entities\portfolio\PORTFOLIO.yaml"
} else { "Hermes absent — skip" }
```

Expected: `True` (or skip message).

- [ ] **Step 4: Commit**

```powershell
git -C "D:\Unite-Hub" add .portfolio/scripts/Mirror-ToHermes.ps1
git -C "D:\Unite-Hub" commit -m "feat(portfolio): add Mirror-ToHermes sync script"
```

---

## Task 8 — Write the reusable Move-ToArchive function

**Files:**
- Create: `D:\Unite-Hub\.portfolio\scripts\Move-ToArchive.ps1`

- [ ] **Step 1: Write the function**

```powershell
@'
# Move-ToArchive.ps1 — safe archive of a top-level D:\ folder
# Performs pre-checks, moves to D:\_archive\2026-05-24\, places MOVED.txt
# breadcrumb, appends to cleanup log. Idempotent.
#
# Usage:
#   . .\Move-ToArchive.ps1
#   Move-ToArchive -Path 'D:\unite-group-app' -CanonicalReplacement 'D:\Unite-Hub'

function Move-ToArchive {
  [CmdletBinding(SupportsShouldProcess=$true)]
  param(
    [Parameter(Mandatory)][string]$Path,
    [Parameter(Mandatory)][string]$CanonicalReplacement,
    [string]$ArchiveRoot = "D:\_archive\2026-05-24",
    [string]$LogFile = "D:\_archive\2026-05-24\_cleanup-log.md",
    [switch]$Force
  )

  if (-not (Test-Path $Path)) {
    Write-Warning "Path does not exist: $Path (already archived?)"
    return
  }

  # Pre-checks for git repos
  if (Test-Path "$Path\.git") {
    Push-Location $Path
    $dirty   = (git status --porcelain 2>$null | Measure-Object).Lines
    $unpush  = (git log --branches --not --remotes --oneline 2>$null | Measure-Object).Lines
    $branch  = git branch --show-current 2>$null
    $remote  = git config --get remote.origin.url 2>$null
    Pop-Location
    if ($dirty -gt 0 -and -not $Force) {
      throw "REFUSING: $Path has $dirty uncommitted files. Commit or stash first, or pass -Force."
    }
    if ($unpush -gt 0 -and -not $Force) {
      throw "REFUSING: $Path has $unpush unpushed commits. Push first, or pass -Force."
    }
  } else { $dirty=0; $unpush=0; $branch=""; $remote="" }

  $name = Split-Path $Path -Leaf
  $flat = ($Path -replace '[:\\]', '_' -replace '\s+', '_').TrimStart('_')
  $destDir = Join-Path $ArchiveRoot $flat

  if (Test-Path $destDir) {
    if (-not $Force) { throw "REFUSING: archive destination already exists: $destDir (pass -Force to overwrite)" }
    Remove-Item $destDir -Recurse -Force
  }

  $size = "{0:N1} MB" -f (((Get-ChildItem $Path -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum) / 1MB)
  $lastWrite = (Get-Item $Path).LastWriteTime.ToString('yyyy-MM-dd HH:mm')

  if ($PSCmdlet.ShouldProcess($Path, "Move to $destDir")) {
    Move-Item -Path $Path -Destination $destDir -Force

    $movedTxt = @"
This folder was archived 2026-05-24.
Canonical path: $CanonicalReplacement
See D:\_archive\2026-05-24\_cleanup-log.md for rollback.
"@
    New-Item -ItemType Directory -Force -Path $Path | Out-Null
    $movedTxt | Out-File -FilePath (Join-Path $Path "MOVED.txt") -Encoding utf8

    $logEntry = @"

### $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') — $Path
- **Action:** Move-ToArchive
- **Size:** $size
- **Last modified:** $lastWrite
- **Git remote:** $remote
- **Branch:** $branch
- **Dirty files (forced):** $dirty
- **Unpushed commits (forced):** $unpush
- **Archive destination:** $destDir
- **Breadcrumb:** $Path\MOVED.txt
- **Rollback:** ``Remove-Item '$Path' -Recurse -Force; Move-Item '$destDir' '$Path'``

"@
    Add-Content -Path $LogFile -Value $logEntry -Encoding utf8
    Write-Output "Archived: $Path -> $destDir"
  }
}
'@ | Out-File -FilePath "D:\Unite-Hub\.portfolio\scripts\Move-ToArchive.ps1" -Encoding utf8
```

- [ ] **Step 2: Smoke test with a fake folder**

```powershell
New-Item -ItemType Directory -Force -Path "D:\__smoketest_archive" | Out-Null
"test content" | Out-File "D:\__smoketest_archive\file.txt"
. "D:\Unite-Hub\.portfolio\scripts\Move-ToArchive.ps1"
Move-ToArchive -Path "D:\__smoketest_archive" -CanonicalReplacement "D:\nowhere"
```

Expected: `Archived: D:\__smoketest_archive -> D:\_archive\2026-05-24\D__smoketest_archive`

- [ ] **Step 3: Verify breadcrumb + log**

```powershell
Get-Content "D:\__smoketest_archive\MOVED.txt"
"---"
Get-Content "D:\_archive\2026-05-24\_cleanup-log.md" -Tail 12
```

Expected: breadcrumb text + log entry visible.

- [ ] **Step 4: Cleanup smoke test artifacts**

```powershell
Remove-Item "D:\__smoketest_archive" -Recurse -Force
Remove-Item "D:\_archive\2026-05-24\D__smoketest_archive" -Recurse -Force
# Trim the smoke test log entry
$log = Get-Content "D:\_archive\2026-05-24\_cleanup-log.md" -Raw
$log -replace '(?s)\n### \d{4}-\d{2}-\d{2}[^\n]*__smoketest_archive.*?(?=(\n### |\Z))', '' | Out-File "D:\_archive\2026-05-24\_cleanup-log.md" -Encoding utf8
```

- [ ] **Step 5: Commit**

```powershell
git -C "D:\Unite-Hub" add .portfolio/scripts/Move-ToArchive.ps1
git -C "D:\Unite-Hub" commit -m "feat(portfolio): add Move-ToArchive function with pre-checks"
```

---

## Task 9 — Verify `D:\Unite Group` branch pushed before archival

This folder has a non-main branch (`feat/superpowers-integration`). Push it to a safety tag/branch on origin before archiving the local copy.

- [ ] **Step 1: Check branch state**

```powershell
$p = "D:\Unite Group"
$branch = git -C "$p" branch --show-current
$unpushed = (git -C "$p" log --branches --not --remotes --oneline 2>$null | Measure-Object).Lines
"Branch: $branch | Unpushed commits: $unpushed"
```

Expected: `Branch: feat/superpowers-integration | Unpushed commits: N`

- [ ] **Step 2: Push branch to origin if not present**

```powershell
$p = "D:\Unite Group"
$branch = git -C "$p" branch --show-current
git -C "$p" ls-remote --heads origin $branch
if ($LASTEXITCODE -ne 0 -or -not (git -C "$p" ls-remote --heads origin $branch)) {
  git -C "$p" push origin "$branch`:archive/superpowers-integration-2026-05-24"
} else {
  git -C "$p" push origin $branch
}
```

Expected: branch pushed (or already up to date).

- [ ] **Step 3: Verify push succeeded**

```powershell
git -C "D:\Unite Group" fetch origin
$ahead = git -C "D:\Unite Group" log --branches --not --remotes --oneline | Measure-Object | % Lines
if ($ahead -eq 0) { "SAFE TO ARCHIVE" } else { throw "still $ahead unpushed commits" }
```

Expected: `SAFE TO ARCHIVE`

---

## Task 10 — Archive `D:\unite-group-app` (target #1, empty/broken)

- [ ] **Step 1: Confirm it is empty**

```powershell
(Get-ChildItem "D:\unite-group-app" -Force | Measure-Object).Count
```

Expected: `0` or `1` (just `.git`).

- [ ] **Step 2: Archive**

```powershell
. "D:\Unite-Hub\.portfolio\scripts\Move-ToArchive.ps1"
Move-ToArchive -Path "D:\unite-group-app" -CanonicalReplacement "D:\Unite-Hub" -Force
```

Expected: `Archived: D:\unite-group-app -> D:\_archive\2026-05-24\D_unite-group-app`

- [ ] **Step 3: Verify breadcrumb + archive contents present**

```powershell
Test-Path "D:\unite-group-app\MOVED.txt"
Test-Path "D:\_archive\2026-05-24\D_unite-group-app"
```

Expected: both `True`.

---

## Task 11 — Archive `D:\Unite-Hub Marketing Update` (target #2, empty)

- [ ] **Step 1: Confirm empty**

```powershell
(Get-ChildItem "D:\Unite-Hub Marketing Update" -Force | Measure-Object).Count
```

Expected: `0`.

- [ ] **Step 2: Archive**

```powershell
. "D:\Unite-Hub\.portfolio\scripts\Move-ToArchive.ps1"
Move-ToArchive -Path "D:\Unite-Hub Marketing Update" -CanonicalReplacement "D:\Unite-Hub" -Force
```

Expected: archived.

- [ ] **Step 3: Verify**

```powershell
Test-Path "D:\Unite-Hub Marketing Update\MOVED.txt"
```

Expected: `True`.

---

## Task 12 — Inspect and archive `D:\Unite Group Businesses`

- [ ] **Step 1: Snapshot contents to log**

```powershell
$p = "D:\Unite Group Businesses"
$snap = Get-ChildItem $p -Recurse -Force -ErrorAction SilentlyContinue |
  Select-Object FullName, Length, LastWriteTime | Format-Table -AutoSize | Out-String
Add-Content -Path "D:\_archive\2026-05-24\_cleanup-log.md" -Value @"

### PRE-ARCHIVE SNAPSHOT: $p
``````
$snap
``````
"@
"snapshot written"
```

- [ ] **Step 2: Archive (no git pre-check applies — not a repo)**

```powershell
. "D:\Unite-Hub\.portfolio\scripts\Move-ToArchive.ps1"
Move-ToArchive -Path "D:\Unite Group Businesses" -CanonicalReplacement "D:\Unite-Hub" -Force
```

Expected: archived.

- [ ] **Step 3: Verify**

```powershell
Test-Path "D:\Unite Group Businesses\MOVED.txt"
```

Expected: `True`.

---

## Task 13 — Inspect and archive `D:\Unite Trade Group Directory`

- [ ] **Step 1: Snapshot**

```powershell
$p = "D:\Unite Trade Group Directory"
$snap = Get-ChildItem $p -Recurse -Force -ErrorAction SilentlyContinue |
  Select-Object FullName, Length, LastWriteTime | Format-Table -AutoSize | Out-String
Add-Content -Path "D:\_archive\2026-05-24\_cleanup-log.md" -Value @"

### PRE-ARCHIVE SNAPSHOT: $p
``````
$snap
``````
"@
"snapshot written"
```

- [ ] **Step 2: Archive**

```powershell
. "D:\Unite-Hub\.portfolio\scripts\Move-ToArchive.ps1"
Move-ToArchive -Path "D:\Unite Trade Group Directory" -CanonicalReplacement "D:\Unite-Hub" -Force
```

- [ ] **Step 3: Verify**

```powershell
Test-Path "D:\Unite Trade Group Directory\MOVED.txt"
```

Expected: `True`.

---

## Task 14 — Inspect and archive `D:\Unite-Group Agency` (contains 2 internal clones)

- [ ] **Step 1: Snapshot git state of internal clones**

```powershell
foreach ($sub in "Unite-Group", "Unite-Group-Main") {
  $cp = "D:\Unite-Group Agency\$sub"
  if (Test-Path "$cp\.git") {
    Add-Content "D:\_archive\2026-05-24\_cleanup-log.md" -Value @"

### PRE-ARCHIVE GIT SNAPSHOT: $cp
- remote: $(git -C $cp config --get remote.origin.url)
- branch: $(git -C $cp branch --show-current)
- last commit: $(git -C $cp log --oneline -1)
- all-refs log (last 20):
``````
$(git -C $cp log --all --oneline -20 | Out-String)
``````
"@
  }
}
"snapshots written"
```

- [ ] **Step 2: Snapshot top-level listing**

```powershell
$snap = Get-ChildItem "D:\Unite-Group Agency" -Force -ErrorAction SilentlyContinue |
  Select-Object Name, Mode, LastWriteTime | Format-Table -AutoSize | Out-String
Add-Content "D:\_archive\2026-05-24\_cleanup-log.md" -Value "``````$snap``````"
"top-level snapshot written"
```

- [ ] **Step 3: Archive**

```powershell
. "D:\Unite-Hub\.portfolio\scripts\Move-ToArchive.ps1"
Move-ToArchive -Path "D:\Unite-Group Agency" -CanonicalReplacement "D:\Unite-Hub" -Force
```

- [ ] **Step 4: Verify**

```powershell
Test-Path "D:\Unite-Group Agency\MOVED.txt"
```

Expected: `True`.

---

## Task 15 — Archive `D:\Unite Group` (live Unite-Hub duplicate)

Requires Task 9 completion (branch pushed).

- [ ] **Step 1: Re-verify branch fully pushed**

```powershell
$p = "D:\Unite Group"
git -C "$p" fetch origin
$unpushed = (git -C "$p" log --branches --not --remotes --oneline | Measure-Object).Lines
if ($unpushed -ne 0) { throw "still $unpushed unpushed commits — STOP" }
"SAFE"
```

Expected: `SAFE`.

- [ ] **Step 2: Archive**

```powershell
. "D:\Unite-Hub\.portfolio\scripts\Move-ToArchive.ps1"
Move-ToArchive -Path "D:\Unite Group" -CanonicalReplacement "D:\Unite-Hub"
```

Expected: archived without `-Force` (no dirty, no unpushed).

- [ ] **Step 3: Verify**

```powershell
Test-Path "D:\Unite Group\MOVED.txt"
```

Expected: `True`.

---

## Task 16 — Archive `D:\Unite-Group CRM` (live Unite-Hub duplicate)

- [ ] **Step 1: Pre-check clean**

```powershell
$p = "D:\Unite-Group CRM"
$dirty   = (git -C "$p" status --porcelain | Measure-Object).Lines
$unpush  = (git -C "$p" log --branches --not --remotes --oneline | Measure-Object).Lines
"dirty=$dirty unpushed=$unpush"
if ($dirty -ne 0 -or $unpush -ne 0) { throw "STOP: unclean repo" }
```

Expected: `dirty=0 unpushed=0`.

- [ ] **Step 2: Archive**

```powershell
. "D:\Unite-Hub\.portfolio\scripts\Move-ToArchive.ps1"
Move-ToArchive -Path "D:\Unite-Group CRM" -CanonicalReplacement "D:\Unite-Hub"
```

- [ ] **Step 3: Verify**

```powershell
Test-Path "D:\Unite-Group CRM\MOVED.txt"
```

Expected: `True`.

---

## Task 17 — Update registry `do_not_clone_to[]` with archived paths

The Unite-Hub entry already lists 4 paths. After archiving, confirm all 7 archived paths are reflected somewhere in the registry.

- [ ] **Step 1: List archived paths**

```powershell
$archived = @(
  'D:\unite-group-app',
  'D:\Unite-Hub Marketing Update',
  'D:\Unite Group Businesses',
  'D:\Unite Trade Group Directory',
  'D:\Unite-Group Agency',
  'D:\Unite Group',
  'D:\Unite-Group CRM'
)
$archived
```

- [ ] **Step 2: Verify each appears in registry**

```powershell
$registry = Get-Content "D:\Unite-Hub\.portfolio\PORTFOLIO.yaml" -Raw
$missing = $archived | Where-Object { $registry -notmatch [regex]::Escape($_) }
if ($missing) {
  Write-Warning "These paths are NOT in registry do_not_clone_to[]:"
  $missing
} else { "all 7 paths present" }
```

Expected: `all 7 paths present`. (If missing, manually add them to the Unite-Hub product's `do_not_clone_to[]` list and re-run.)

- [ ] **Step 3: Re-validate and re-mirror**

```powershell
node "D:\Unite-Hub\.portfolio\scripts\validate-registry.mjs"
& "D:\Unite-Hub\.portfolio\scripts\Mirror-ToHermes.ps1"
```

Expected: `OK — 11 products …` and `Mirrored to …`.

- [ ] **Step 4: Commit registry edits if any**

```powershell
$changed = git -C "D:\Unite-Hub" status --porcelain .portfolio/
if ($changed) {
  git -C "D:\Unite-Hub" add .portfolio/
  git -C "D:\Unite-Hub" commit -m "chore(portfolio): finalise do_not_clone_to[] after Phase 1 archives"
} else { "no changes" }
```

---

## Task 18 — Register the hard-delete scheduled task

**Files:**
- Create: `D:\Unite-Hub\.portfolio\schedule\Register-HardDelete.ps1`

- [ ] **Step 1: Write the registration script**

```powershell
@'
# Register-HardDelete.ps1 — installs Windows scheduled task that hard-deletes
# the 2026-05-24 archive on 2026-05-31 at 03:00 local time.
# Cancellable: Unregister-ScheduledTask -TaskName UniteCleanup-2026-05-31 -Confirm:$false
#
# MUST be run in elevated PowerShell.

$taskName = "UniteCleanup-2026-05-31"
$archivePath = "D:\_archive\2026-05-24"

$action  = New-ScheduledTaskAction -Execute "powershell.exe" -Argument @"
-NoProfile -ExecutionPolicy Bypass -Command "if (Test-Path '$archivePath') { Remove-Item '$archivePath' -Recurse -Force; Add-Content 'D:\_archive\hard-delete.log' -Value `"$(Get-Date) deleted $archivePath`" } else { Add-Content 'D:\_archive\hard-delete.log' -Value `"$(Get-Date) skipped (already gone) $archivePath`" }"
"@

$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date "2026-05-31T03:00:00")
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -RunLevel Highest -LogonType Interactive
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force
Write-Output "Registered: $taskName (fires 2026-05-31 03:00)"
Write-Output "To cancel: Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false"
'@ | Out-File -FilePath "D:\Unite-Hub\.portfolio\schedule\Register-HardDelete.ps1" -Encoding utf8
```

- [ ] **Step 2: Run the registration (REQUIRES ELEVATED POWERSHELL)**

```powershell
# If not elevated, this will fail with access denied.
& "D:\Unite-Hub\.portfolio\schedule\Register-HardDelete.ps1"
```

Expected: `Registered: UniteCleanup-2026-05-31 (fires 2026-05-31 03:00)`

- [ ] **Step 3: Verify the task is registered**

```powershell
Get-ScheduledTask -TaskName "UniteCleanup-2026-05-31" | Select-Object TaskName, State, @{N='NextRun';E={(Get-ScheduledTaskInfo $_).NextRunTime}}
```

Expected: row with `State: Ready` and `NextRun: 2026-05-31 03:00:00`.

- [ ] **Step 4: Commit**

```powershell
git -C "D:\Unite-Hub" add .portfolio/schedule/
git -C "D:\Unite-Hub" commit -m "feat(portfolio): add hard-delete scheduled task installer"
```

---

## Task 19 — Acceptance verification

Run the full acceptance check defined in the spec's Phase 1 section.

- [ ] **Step 1: All 7 paths archived (breadcrumb present)**

```powershell
$paths = @('D:\unite-group-app','D:\Unite-Hub Marketing Update','D:\Unite Group Businesses','D:\Unite Trade Group Directory','D:\Unite-Group Agency','D:\Unite Group','D:\Unite-Group CRM')
$results = $paths | ForEach-Object {
  [PSCustomObject]@{
    Path = $_
    BreadcrumbPresent = Test-Path "$_\MOVED.txt"
    ArchivePresent = Test-Path ("D:\_archive\2026-05-24\" + (($_ -replace '[:\\]','_' -replace '\s+','_').TrimStart('_')))
  }
}
$results | Format-Table -AutoSize
$failed = $results | Where-Object { -not $_.BreadcrumbPresent -or -not $_.ArchivePresent }
if ($failed) { throw "FAIL: $($failed.Count) targets incomplete" } else { "all 7 archived OK" }
```

Expected: `all 7 archived OK`.

- [ ] **Step 2: Cleanup log has entries for each**

```powershell
$log = Get-Content "D:\_archive\2026-05-24\_cleanup-log.md" -Raw
$paths | ForEach-Object {
  $found = $log -match [regex]::Escape($_)
  "$_ : $(if ($found) { 'logged' } else { 'MISSING' })"
}
```

Expected: every line ends with `logged`.

- [ ] **Step 3: Scheduled task exists**

```powershell
$t = Get-ScheduledTask -TaskName "UniteCleanup-2026-05-31" -ErrorAction SilentlyContinue
if ($t) { "task registered: $($t.State)" } else { throw "scheduled task missing" }
```

Expected: `task registered: Ready`.

- [ ] **Step 4: Registry validates**

```powershell
node "D:\Unite-Hub\.portfolio\scripts\validate-registry.mjs"
```

Expected: `OK — 11 products …`.

- [ ] **Step 5: Hermes mirror current (if Hermes present)**

```powershell
if (Test-Path "D:\Hermes") {
  $diff = Compare-Object (Get-Content "D:\Unite-Hub\.portfolio\PORTFOLIO.yaml") (Get-Content "D:\Hermes\wiki\entities\portfolio\PORTFOLIO.yaml" | Select-Object -Skip 4)
  if (-not $diff) { "mirror in sync" } else { "REFRESH NEEDED"; & "D:\Unite-Hub\.portfolio\scripts\Mirror-ToHermes.ps1" }
} else { "Hermes absent — skip" }
```

Expected: `mirror in sync` (or refreshed).

- [ ] **Step 6: CLAUDE.md identity block present**

```powershell
$ok = (Get-Content "D:\Unite-Hub\CLAUDE.md" -Raw) -match '@\.portfolio/PORTFOLIO\.yaml'
if (-not $ok) { throw "CLAUDE.md missing registry reference" } else { "CLAUDE.md OK" }
```

Expected: `CLAUDE.md OK`.

---

## Task 20 — Final commit + branch push + status report

- [ ] **Step 1: Final commit if any uncommitted changes**

```powershell
$status = git -C "D:\Unite-Hub" status --porcelain
if ($status) {
  git -C "D:\Unite-Hub" add -A
  git -C "D:\Unite-Hub" commit -m "chore(cleanup-01): complete foundation phase (registry + disk)"
} else { "nothing to commit" }
```

- [ ] **Step 2: Show branch state**

```powershell
git -C "D:\Unite-Hub" log --oneline -10
```

Expected: ~6-8 new commits on `docs/cleanup-spec-2026-05-24` branch.

- [ ] **Step 3: Push the branch (ASK USER FIRST)**

> **PAUSE.** Do not push without explicit user approval. Show the branch state and ask:
> "Plan 01 (Foundation) complete. Branch `docs/cleanup-spec-2026-05-24` has N commits. Push to origin and open PR, or hold for review?"

- [ ] **Step 4: Print final status report**

```powershell
@"

================ PLAN 01 STATUS ================
✓ Registry created: D:\Unite-Hub\.portfolio\PORTFOLIO.yaml
✓ Validator working: node validate-registry.mjs → OK
✓ Hermes mirror: $(if (Test-Path 'D:\Hermes\wiki\entities\portfolio\PORTFOLIO.yaml') { 'present' } else { 'N/A on this machine' })
✓ CLAUDE.md wired: @.portfolio/PORTFOLIO.yaml reference active
✓ 7 dirty folders archived to D:\_archive\2026-05-24\
✓ Cleanup log: D:\_archive\2026-05-24\_cleanup-log.md
✓ Hard-delete scheduled: 2026-05-31 03:00 (cancellable)

NEXT: Plan 02 (GitHub junk repos + branch protection) → docs/superpowers/plans/2026-05-24-cleanup-02-github.md
================================================
"@
```

- [ ] **Step 5: Hand off to Plan 02**

After user approves Plan 01 completion, invoke the next-plan writer:
> "Plan 01 complete. Ready to write Plan 02 (GitHub cleanup + branch protection)?"

---

## Rollback / Emergency procedures

**If any archive step fails partway:**

```powershell
# Rollback a single folder:
Remove-Item "<original-path>" -Recurse -Force        # remove MOVED.txt stub
Move-Item "D:\_archive\2026-05-24\<flat-name>" "<original-path>"
# Then remove the offending entry from _cleanup-log.md by hand
```

**To cancel the hard-delete scheduled task:**

```powershell
Unregister-ScheduledTask -TaskName "UniteCleanup-2026-05-31" -Confirm:$false
```

**To roll back ALL archives (within 7 days, before hard delete fires):**

```powershell
# Read cleanup log, extract rollback commands, run them
Get-Content "D:\_archive\2026-05-24\_cleanup-log.md" |
  Select-String '\*\*Rollback:\*\* `(.+?)`' |
  ForEach-Object { Invoke-Expression $_.Matches.Groups[1].Value }
```

---

## Self-review notes

**Spec coverage check (Phase 1 requirements):**
- ✓ 7 dirty folders moved to `D:\_archive\2026-05-24\` — Tasks 10-16
- ✓ `MOVED.txt` placeholders at each original path — Task 8 (in `Move-ToArchive`), verified Task 19
- ✓ `_cleanup-log.md` complete with rollback commands — Task 1, populated by Task 8
- ✓ Scheduled task `UniteCleanup-2026-05-31` registered — Task 18
- ✓ Registry's `do_not_clone_to[]` updated — Task 3 (initial) + Task 17 (verify)

**Registry SSOT requirements:**
- ✓ Lives at `D:\Unite-Hub\.portfolio\PORTFOLIO.yaml` — Task 3
- ✓ Mirrored to Hermes wiki — Task 7
- ✓ Auto-loaded into CLAUDE.md via `@reference` — Task 6
- ✓ Validatable (schema + invariants) — Tasks 4-5

**Out of Plan 01 scope (handled in later plans):**
- Phase 2A: GitHub junk repos → Plan 02
- Phase 2B: Unite-Group → Unite-Hub merge → Plan 03
- Phase 3: Vercel cleanup + sandboxes → Plan 04
- Phase 4: Workflow rules / branch protection → Plan 02 (combined for efficiency)
- Phase 5: Guardrails / hooks / bootstrap → Plan 05
- `D:\Unite-Group\Authority-Site` archiving → Plan 03 (kept for merge)

**Risk acknowledgement:**
- Task 18 requires elevated PowerShell — if not run elevated, scheduled-task creation will fail with access denied. Plan execution should pause and request elevation.
- Task 9 push could fail if origin has diverged from local — surface as failure, do not auto-resolve.
- Tasks 12-14 (stale folders) snapshot contents to log; large folders will produce a verbose log. Acceptable.

