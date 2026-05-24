# Cleanup Plan 02 — GitHub Junk Repos + Branch Protection

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Archive 3 junk GitHub repos under `CleanExpo` and codify the sandbox-first / PR-required workflow across all 8 active product repos.

**Architecture:** Two parallel workstreams. (A) Audit + archive 3 broken-name / duplicate repos (`https-github.com-CleanExpo-Downunder-Miles`, `https-github.com-CleanExpo-SC-Generator`, `abacus_crypto_intelligence`) with a 7-day quiet period before delete. (B) For each active product repo, create a long-lived `sandbox` branch, apply branch protection on `main` (PR required, status checks required, linear history), apply lighter protection on `sandbox`, and add a PR template + CODEOWNERS.

**Tech Stack:** `gh` CLI (already authenticated as CleanExpo), GitHub REST API for branch protection, registry from Plan 01.

**Spec reference:** `docs/superpowers/specs/2026-05-24-unite-ecosystem-cleanup-design.md` — Phase 2A + Phase 4

**Prerequisites:**
- Plan 01 complete (registry exists at `D:\Unite-Hub\.portfolio\PORTFOLIO.yaml`)
- `gh auth status` shows authenticated as CleanExpo with `admin:public_key`, `repo`, `workflow` scopes
- All work on branch `docs/cleanup-spec-2026-05-24` (or successor)

**Active product repos** (from registry, where `github.repo` ≠ null and `status == active`):
`Unite-Hub`, `Unite-Group` (will be merged in Plan 03 — skip protection here to avoid friction during merge), `RestoreAssist`, `Disaster-Recovery`, `DR-NRPG`, `CCW-CRM`, `Synthex`, `ATO`, `CARSI`, `Pi-Dev-Ops` = **9 repos** (excluding Hermes which has no repo).

---

## File Structure

**Created:**
- `D:\Unite-Hub\.portfolio\scripts\github-audit.mjs` — audits a repo (commits, branches, last push, content sample)
- `D:\Unite-Hub\.portfolio\scripts\apply-protection.mjs` — applies branch protection via gh API
- `D:\Unite-Hub\.portfolio\templates\PULL_REQUEST_TEMPLATE.md` — copied into each repo's `.github/`
- `D:\Unite-Hub\.portfolio\templates\CODEOWNERS` — copied into each repo's `.github/`
- `D:\Unite-Hub\.portfolio\schedule\Register-GithubHardDelete.ps1` — 2026-05-31 deletion of archived repos

**Modified:**
- `D:\Unite-Hub\.portfolio\PORTFOLIO.yaml` — flip 3 junk repos to `status: archived` after archive; add new fields if needed

---

## Task 1 — Audit the 3 junk repos before action

**Goal:** Confirm each junk repo's content is duplicate/empty/garbage before archiving. Snapshot to cleanup log.

- [ ] **Step 1: Audit `https-github.com-CleanExpo-Downunder-Miles`**

```bash
gh api repos/CleanExpo/https-github.com-CleanExpo-Downunder-Miles --jq '{name,description,size,default_branch,pushed_at,open_issues_count,fork}'
gh api repos/CleanExpo/https-github.com-CleanExpo-Downunder-Miles/contents | jq -r '.[].name' | head -20
```

Expected: small repo, content overlap with `Downunder-Miles` confirms duplicate.

- [ ] **Step 2: Audit `https-github.com-CleanExpo-SC-Generator`**

```bash
gh api repos/CleanExpo/https-github.com-CleanExpo-SC-Generator --jq '{name,description,size,default_branch,pushed_at,open_issues_count,fork}'
gh api repos/CleanExpo/https-github.com-CleanExpo-SC-Generator/contents | jq -r '.[].name' | head -20
```

Expected: has real content (this one we RENAME, not delete).

- [ ] **Step 3: Audit `abacus_crypto_intelligence` vs `Abacus-Crypto-Intelligence`**

```bash
gh api repos/CleanExpo/abacus_crypto_intelligence --jq '{name,description,size,default_branch,pushed_at}'
gh api repos/CleanExpo/Abacus-Crypto-Intelligence --jq '{name,description,size,default_branch,pushed_at}'
```

Decide: keep the one with more recent `pushed_at` and more content. Archive the other.

- [ ] **Step 4: Snapshot all audit output to cleanup log**

```bash
cat >> "D:/_archive/2026-05-24/_cleanup-log.md" <<EOF

### 2026-05-24 — Plan 02 Task 1 GitHub audit
[paste audit output here]
EOF
```

- [ ] **Step 5: Decision matrix written to log**

For each repo: action = ARCHIVE | RENAME | KEEP. Capture which is which.

---

## Task 2 — Rename `https-github.com-CleanExpo-SC-Generator` → `SC-Generator`

The original `SC-Generator` name does not yet exist under CleanExpo, so the broken-name repo is the only one. We rename it to recover the good name.

- [ ] **Step 1: Verify no name collision**

```bash
gh repo view CleanExpo/SC-Generator 2>&1 | head -3
```

Expected: error like `repository not found` — confirms `SC-Generator` is free.

- [ ] **Step 2: Rename**

```bash
gh api -X PATCH repos/CleanExpo/https-github.com-CleanExpo-SC-Generator -f name=SC-Generator
```

Expected: 200 OK response.

- [ ] **Step 3: Verify**

```bash
gh repo view CleanExpo/SC-Generator --json name,url
```

Expected: `{"name":"SC-Generator","url":"https://github.com/CleanExpo/SC-Generator"}`. GitHub auto-redirects the old URL.

- [ ] **Step 4: Log**

```bash
echo "- 2026-05-24: Renamed CleanExpo/https-github.com-CleanExpo-SC-Generator → CleanExpo/SC-Generator (GitHub URL auto-redirect)" >> "D:/_archive/2026-05-24/_cleanup-log.md"
```

---

## Task 3 — Archive the 2 broken-name / duplicate repos

- [ ] **Step 1: Archive `https-github.com-CleanExpo-Downunder-Miles`**

```bash
gh api -X PATCH repos/CleanExpo/https-github.com-CleanExpo-Downunder-Miles -F archived=true
gh repo view CleanExpo/https-github.com-CleanExpo-Downunder-Miles --json isArchived
```

Expected: `{"isArchived":true}`.

- [ ] **Step 2: Archive `abacus_crypto_intelligence`** (assumes Task 1 confirmed it's the duplicate — adjust if Task 1 chose the other)

```bash
gh api -X PATCH repos/CleanExpo/abacus_crypto_intelligence -F archived=true
gh repo view CleanExpo/abacus_crypto_intelligence --json isArchived
```

Expected: `{"isArchived":true}`.

- [ ] **Step 3: Log**

```bash
cat >> "D:/_archive/2026-05-24/_cleanup-log.md" <<'EOF'

### 2026-05-24 — Plan 02 Task 3 GitHub archive
- Archived `CleanExpo/https-github.com-CleanExpo-Downunder-Miles` (duplicate of `Downunder-Miles`)
- Archived `CleanExpo/abacus_crypto_intelligence` (duplicate of `Abacus-Crypto-Intelligence`)
- Hard-delete scheduled for 2026-05-31 via Register-GithubHardDelete.ps1 (Task 11)
- Rollback (within quiet period): `gh api -X PATCH repos/CleanExpo/<repo> -F archived=false`
EOF
```

---

## Task 4 — Write registry update for archived repos

We add a `retired_repos:` top-level section to the registry recording these archive actions so future agents see them.

- [ ] **Step 1: Read current registry tail**

```powershell
Get-Content "D:\Unite-Hub\.portfolio\PORTFOLIO.yaml" -Tail 10
```

- [ ] **Step 2: Append `retired_repos:` block**

Use the Edit tool to add this block immediately AFTER the `products:` list ends (before EOF):

```yaml

retired_repos:
  - org: CleanExpo
    repo: https-github.com-CleanExpo-Downunder-Miles
    archived_at: "2026-05-24"
    reason: "Broken name (full URL pasted as repo name); duplicate of Downunder-Miles"
    rollback: "gh api -X PATCH repos/CleanExpo/https-github.com-CleanExpo-Downunder-Miles -F archived=false"
    hard_delete_at: "2026-05-31"
  - org: CleanExpo
    repo: abacus_crypto_intelligence
    archived_at: "2026-05-24"
    reason: "snake_case duplicate of Abacus-Crypto-Intelligence"
    rollback: "gh api -X PATCH repos/CleanExpo/abacus_crypto_intelligence -F archived=false"
    hard_delete_at: "2026-05-31"

renamed_repos:
  - org: CleanExpo
    old_name: https-github.com-CleanExpo-SC-Generator
    new_name: SC-Generator
    renamed_at: "2026-05-24"
    reason: "Broken name (URL pasted as repo name)"
```

- [ ] **Step 3: Update schema to allow new top-level fields**

Edit `D:\Unite-Hub\.portfolio\schema\portfolio.schema.json` to add `retired_repos` and `renamed_repos` to the top-level `properties` block (both optional arrays).

- [ ] **Step 4: Re-validate and re-mirror**

```bash
node "D:/Unite-Hub/.portfolio/scripts/validate-registry.mjs"
powershell -NoProfile -Command "& 'D:\Unite-Hub\.portfolio\scripts\Mirror-ToHermes.ps1'"
```

Expected: `OK — 11 products, 29 aliases, no collisions` + `Mirrored to ...`.

- [ ] **Step 5: Commit**

```bash
git -C "D:/Unite-Hub" add .portfolio/
git -C "D:/Unite-Hub" commit -m "chore(portfolio): record retired and renamed GitHub repos"
```

---

## Task 5 — Write PR template + CODEOWNERS templates

**Files:**
- Create: `D:\Unite-Hub\.portfolio\templates\PULL_REQUEST_TEMPLATE.md`
- Create: `D:\Unite-Hub\.portfolio\templates\CODEOWNERS`

- [ ] **Step 1: Write PR template**

```powershell
$prTemplate = @'
## Summary
<!-- 1-3 sentences: what changed and why -->

## Registry impact
- [ ] No registry change required
- [ ] Updated `.portfolio/PORTFOLIO.yaml` for this product
- [ ] N/A — this repo is not Unite-Hub (no registry here)

## Sandbox testing
- [ ] Tested on sandbox deployment (URL: ____________)
- [ ] N/A — not user-facing / config change only

## Verification
- [ ] `npm run typecheck` (or equivalent) passes
- [ ] `npm test` passes (or no tests applicable)
- [ ] `npm run build` succeeds
- [ ] Manual smoke test of changed feature

## Screenshots / recordings
<!-- For UI changes, drop image or short video -->

## Rollback plan
<!-- How to revert if this breaks prod -->
'@
New-Item -ItemType Directory -Force -Path "D:\Unite-Hub\.portfolio\templates" | Out-Null
$prTemplate | Out-File "D:\Unite-Hub\.portfolio\templates\PULL_REQUEST_TEMPLATE.md" -Encoding utf8
```

- [ ] **Step 2: Write CODEOWNERS**

```powershell
@'
# CODEOWNERS — sole owner is the CleanExpo account (solo founder workflow)
# Self-review is acceptable for this single-owner setup.
* @CleanExpo
'@ | Out-File "D:\Unite-Hub\.portfolio\templates\CODEOWNERS" -Encoding utf8
```

- [ ] **Step 3: Commit**

```bash
git -C "D:/Unite-Hub" add .portfolio/templates/
git -C "D:/Unite-Hub" commit -m "feat(portfolio): add PR template + CODEOWNERS templates"
```

---

## Task 6 — Write `apply-protection.mjs` script

**File:** `D:\Unite-Hub\.portfolio\scripts\apply-protection.mjs`

This script reads the registry and, for each active product with `github.repo`, applies branch protection via `gh api`.

- [ ] **Step 1: Write the script**

```powershell
@'
#!/usr/bin/env node
// Apply branch protection to active product repos per registry.
// Usage: node apply-protection.mjs [--dry-run] [--only=<canonical_name>]
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const YAML = require("yaml");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const onlyArg = args.find(a => a.startsWith("--only="));
const only = onlyArg ? onlyArg.split("=")[1] : null;

const registry = YAML.parse(readFileSync("D:/Unite-Hub/.portfolio/PORTFOLIO.yaml", "utf8"));
const targets = registry.products.filter(p =>
  p.status === "active" &&
  p.github?.repo &&
  p.canonical_name !== "Authority-Site"   // skip — merging in Plan 03
);

function gh(args) {
  if (dryRun) { console.log("  DRY-RUN:", "gh", args.join(" ")); return ""; }
  return execSync("gh " + args.map(a => /[\s"]/.test(a) ? `"${a.replace(/"/g, "\\\"")}"` : a).join(" "), { encoding: "utf8" });
}

const mainBody = {
  required_status_checks: { strict: true, contexts: [] },  // no required contexts initially; tighten in Plan 04
  enforce_admins: false,
  required_pull_request_reviews: { required_approving_review_count: 0, dismiss_stale_reviews: true },
  restrictions: null,
  required_linear_history: true,
  allow_force_pushes: false,
  allow_deletions: false,
  required_conversation_resolution: true,
};

const sandboxBody = {
  required_status_checks: { strict: false, contexts: [] },
  enforce_admins: false,
  required_pull_request_reviews: null,
  restrictions: null,
  required_linear_history: false,
  allow_force_pushes: true,
  allow_deletions: true,
};

for (const p of targets) {
  if (only && p.canonical_name !== only) continue;
  const repo = `${p.github.org}/${p.github.repo}`;
  const mainBranch = p.github.default_branch || "main";
  const sandboxBranch = p.github.sandbox_branch || "sandbox";
  console.log(`\n=== ${p.canonical_name} (${repo}) ===`);

  // Ensure sandbox branch exists
  try {
    const sha = JSON.parse(gh(["api", `repos/${repo}/git/refs/heads/${mainBranch}`]) || "{\"object\":{\"sha\":\"\"}}").object?.sha;
    if (sha) {
      try { gh(["api", `repos/${repo}/git/refs/heads/${sandboxBranch}`]); console.log(`  sandbox exists`); }
      catch {
        gh(["api", "-X", "POST", `repos/${repo}/git/refs`, "-f", `ref=refs/heads/${sandboxBranch}`, "-f", `sha=${sha}`]);
        console.log(`  CREATED sandbox @ ${sha.slice(0,7)}`);
      }
    }
  } catch (e) { console.warn(`  WARN ensuring sandbox: ${e.message}`); }

  // Apply protection
  for (const [branch, body] of [[mainBranch, mainBody], [sandboxBranch, sandboxBody]]) {
    const json = JSON.stringify(body);
    try {
      gh(["api", "-X", "PUT", `repos/${repo}/branches/${branch}/protection`, "--input", "-"]);
      // execSync with stdin: use a different approach — write to a temp file
    } catch (e) {
      // gh CLI doesn't support stdin with --input "-" in all versions; fallback below
    }
    // Robust fallback: temp file
    const tmp = `D:/_archive/_tmp_protection.json`;
    require("node:fs").writeFileSync(tmp, json);
    try {
      gh(["api", "-X", "PUT", `repos/${repo}/branches/${branch}/protection`, "--input", tmp]);
      console.log(`  applied protection on ${branch}`);
    } catch (e) {
      console.error(`  FAIL ${branch}: ${e.message.split("\n")[0]}`);
    }
  }
}
console.log("\nDone.");
'@ | Out-File "D:\Unite-Hub\.portfolio\scripts\apply-protection.mjs" -Encoding utf8
```

- [ ] **Step 2: Dry-run to verify the targeting list**

```bash
node "D:/Unite-Hub/.portfolio/scripts/apply-protection.mjs" --dry-run 2>&1 | head -60
```

Expected: shows each repo it would touch with dry-run gh commands. Should be 8 repos (Unite-Hub, RestoreAssist, Disaster-Recovery, DR-NRPG, CCW-CRM, Synthex, ATO-APP→ATO, CARSI, Pi-Dev-Ops = 9 — minus Authority-Site).

- [ ] **Step 3: Commit script**

```bash
git -C "D:/Unite-Hub" add .portfolio/scripts/apply-protection.mjs
git -C "D:/Unite-Hub" commit -m "feat(portfolio): add apply-protection script (dry-run tested)"
```

---

## Task 7 — Apply protection to Unite-Hub ONLY (smoke test)

Before mass-applying, validate the script works end-to-end on the canonical repo.

- [ ] **Step 1: Apply to Unite-Hub only**

```bash
node "D:/Unite-Hub/.portfolio/scripts/apply-protection.mjs" --only=Unite-Hub 2>&1
```

Expected: `sandbox exists` (or `CREATED sandbox @ <sha>`) + `applied protection on main` + `applied protection on sandbox`.

- [ ] **Step 2: Verify via gh API**

```bash
gh api repos/CleanExpo/Unite-Hub/branches/main/protection --jq '{required_pull_request_reviews,required_linear_history,allow_force_pushes}'
gh api repos/CleanExpo/Unite-Hub/branches/sandbox/protection --jq '{allow_force_pushes,allow_deletions}'
```

Expected: main shows `required_linear_history: true, allow_force_pushes: false`. Sandbox shows `allow_force_pushes: true`.

- [ ] **Step 3: STOP and report results before mass-apply**

If protection landed correctly, proceed to Task 8. If anything looks off, REPORT BLOCKED and surface the gh API output for review.

---

## Task 8 — Mass-apply protection to remaining 7 active product repos

After Task 7 confirms correct behavior on Unite-Hub.

- [ ] **Step 1: Mass-apply (all targets except --only Unite-Hub already done, but the script is idempotent so we run it for all)**

```bash
node "D:/Unite-Hub/.portfolio/scripts/apply-protection.mjs" 2>&1 | tee "D:/_archive/2026-05-24/plan02-protection-run.log"
```

Expected: 9 sections (one per target). Each shows sandbox creation/exists + 2 "applied protection on..." lines.

- [ ] **Step 2: Verify each repo has protection on both branches**

```bash
for repo in Unite-Hub RestoreAssist Disaster-Recovery DR-NRPG CCW-CRM Synthex ATO CARSI Pi-Dev-Ops; do
  echo "=== $repo ==="
  echo -n "  main:    "; gh api repos/CleanExpo/$repo/branches/main/protection --jq '.required_linear_history' 2>&1
  echo -n "  sandbox: "; gh api repos/CleanExpo/$repo/branches/sandbox/protection --jq '.allow_force_pushes' 2>&1
done
```

Expected: each repo prints `main: true`, `sandbox: true`.

- [ ] **Step 3: Log**

```bash
echo "" >> "D:/_archive/2026-05-24/_cleanup-log.md"
echo "### 2026-05-24 — Plan 02 Task 8: branch protection applied" >> "D:/_archive/2026-05-24/_cleanup-log.md"
cat "D:/_archive/2026-05-24/plan02-protection-run.log" >> "D:/_archive/2026-05-24/_cleanup-log.md"
```

---

## Task 9 — Push PR template + CODEOWNERS to each active repo

For each active product repo (excluding Unite-Hub, which gets its own commit, and Authority-Site, deferred to Plan 03), commit the template files into `.github/`.

- [ ] **Step 1: Write a helper script** `D:\Unite-Hub\.portfolio\scripts\Push-Templates.ps1`

```powershell
@'
# Push-Templates.ps1 — copy PR template + CODEOWNERS into each active product repo
# and commit/push to its main branch.
# Requires local clones at each registry product's local.canonical_path.

param([string]$Only)

$prSrc = "D:\Unite-Hub\.portfolio\templates\PULL_REQUEST_TEMPLATE.md"
$coSrc = "D:\Unite-Hub\.portfolio\templates\CODEOWNERS"

# Hard-coded local-path list (matches registry status:active with local.canonical_path != null)
$targets = @(
  @{ name="Unite-Hub";          path="D:\Unite-Hub" },
  @{ name="RestoreAssist";      path="D:\RestoreAssist" },
  @{ name="Disaster-Recovery";  path="D:\Disaster-Recovery" },
  @{ name="DR-NRPG";            path="D:\Disaster Recovery - NRP" },
  @{ name="CCW-CRM";            path="D:\CCW-CRM" },
  @{ name="Synthex";            path="D:\Synthex" },
  @{ name="ATO-APP";            path="D:\ATO" }
)
# Note: CARSI + Pi-Dev-Ops have no local clone — handled via gh API in Step 2 of this task

foreach ($t in $targets) {
  if ($Only -and $t.name -ne $Only) { continue }
  $repo = $t.path
  Write-Output ""
  Write-Output "=== $($t.name) at $repo ==="

  if (-not (Test-Path "$repo\.git")) { Write-Warning "  NOT A REPO: skipping"; continue }

  # Refuse if working tree dirty
  $dirty = (git -C $repo status --porcelain | Measure-Object).Count
  if ($dirty -gt 0) { Write-Warning "  DIRTY working tree — skipping"; continue }

  # Ensure on main
  $branch = git -C $repo branch --show-current
  if ($branch -ne "main") {
    Write-Warning "  on branch '$branch' not main — skipping"; continue
  }

  # Pull latest
  git -C $repo pull --ff-only origin main 2>&1 | Out-Null

  # Create branch
  $newBranch = "chore/portfolio-templates-2026-05-24"
  git -C $repo checkout -b $newBranch 2>&1 | Out-Null

  # Copy files
  New-Item -ItemType Directory -Force -Path "$repo\.github" | Out-Null
  Copy-Item -Path $prSrc -Destination "$repo\.github\PULL_REQUEST_TEMPLATE.md" -Force
  Copy-Item -Path $coSrc -Destination "$repo\.github\CODEOWNERS" -Force

  # Commit
  git -C $repo add ".github/PULL_REQUEST_TEMPLATE.md" ".github/CODEOWNERS"
  $changes = (git -C $repo status --porcelain | Measure-Object).Count
  if ($changes -gt 0) {
    git -C $repo commit -m "chore(portfolio): add PR template + CODEOWNERS from Unite-Group registry" 2>&1 | Out-Null
    git -C $repo push -u origin $newBranch 2>&1 | Out-Null

    # Open PR
    gh -R "CleanExpo/$($t.name -replace '-APP$','')" pr create --base main --head $newBranch --title "chore(portfolio): add PR template + CODEOWNERS" --body "Adds PR template and CODEOWNERS from Unite-Group portfolio registry. Part of cleanup Plan 02." 2>&1
  } else {
    Write-Output "  no changes — templates already current"
    git -C $repo checkout main 2>&1 | Out-Null
    git -C $repo branch -D $newBranch 2>&1 | Out-Null
  }
}

Write-Output ""
Write-Output "Done. Review PRs at https://github.com/CleanExpo?tab=overview"
'@ | Out-File "D:\Unite-Hub\.portfolio\scripts\Push-Templates.ps1" -Encoding utf8
```

- [ ] **Step 2: Run dry-test against Unite-Hub first**

```powershell
& "D:\Unite-Hub\.portfolio\scripts\Push-Templates.ps1" -Only "Unite-Hub"
```

Expected: branch created, files copied, PR opened against `CleanExpo/Unite-Hub`.

NOTE: Unite-Hub repo name mapping: script does `$t.name -replace '-APP$',''` to handle `ATO-APP` → `ATO`. Unite-Hub itself isn't transformed. Verify the gh command targets `CleanExpo/Unite-Hub`.

- [ ] **Step 3: Run for remaining targets**

```powershell
& "D:\Unite-Hub\.portfolio\scripts\Push-Templates.ps1"
```

Each repo will get its own PR. Self-merge each after a quick visual review on github.com.

- [ ] **Step 4: Handle CARSI and Pi-Dev-Ops (no local clone)**

For these two, use `gh` to create the files directly via API:

```bash
for repo in CARSI Pi-Dev-Ops; do
  for file in PULL_REQUEST_TEMPLATE.md CODEOWNERS; do
    content=$(base64 -w 0 "D:/Unite-Hub/.portfolio/templates/$file")
    sha=$(gh api "repos/CleanExpo/$repo/contents/.github/$file" --jq .sha 2>/dev/null || echo "")
    body="{\"message\":\"chore: add $file from portfolio registry\",\"content\":\"$content\",\"branch\":\"main\""
    [ -n "$sha" ] && body="$body,\"sha\":\"$sha\""
    body="$body}"
    echo "$body" | gh api -X PUT "repos/CleanExpo/$repo/contents/.github/$file" --input -
  done
done
```

Expected: 4 commits land via API (2 per repo). If branch protection blocks direct main commits, the script will fail — fall back to creating a branch + PR via API.

---

## Task 10 — Commit script artifacts to Unite-Hub

- [ ] **Step 1: Commit Push-Templates and any other new scripts**

```bash
git -C "D:/Unite-Hub" add .portfolio/scripts/
git -C "D:/Unite-Hub" commit -m "feat(portfolio): add Push-Templates script for cross-repo template sync"
```

---

## Task 11 — Schedule hard-delete of archived GitHub repos

**File:** `D:\Unite-Hub\.portfolio\schedule\Register-GithubHardDelete.ps1`

- [ ] **Step 1: Write the registration script**

```powershell
@'
# Register-GithubHardDelete.ps1 — fires 2026-05-31 03:30, deletes the 2 archived junk repos.
# MUST be run in elevated PowerShell.

$taskName = "UniteCleanup-GithubDelete-2026-05-31"
$repos = @("https-github.com-CleanExpo-Downunder-Miles", "abacus_crypto_intelligence")
$cmd = ""
foreach ($r in $repos) {
  $cmd += "gh repo delete CleanExpo/$r --yes; "
}
$cmd += "Add-Content 'D:\_archive\github-hard-delete.log' -Value (Get-Date).ToString() + ' deleted CleanExpo/$($repos -join ',CleanExpo/')'"

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -Command `"$cmd`""
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date "2026-05-31T03:30:00")
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -RunLevel Highest -LogonType Interactive
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force
Write-Output "Registered: $taskName (fires 2026-05-31 03:30)"
Write-Output "To cancel: Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false"
Write-Output ""
Write-Output "NOTE: gh CLI must be authenticated under the user identity that runs this scheduled task."
Write-Output "If the task fires under a different account, gh will fail. Test by running manually in elevated PS first:"
Write-Output "  gh repo delete CleanExpo/https-github.com-CleanExpo-Downunder-Miles --yes"
'@ | Out-File "D:\Unite-Hub\.portfolio\schedule\Register-GithubHardDelete.ps1" -Encoding utf8
```

- [ ] **Step 2: USER ACTION — register in elevated PowerShell**

```powershell
& 'D:\Unite-Hub\.portfolio\schedule\Register-GithubHardDelete.ps1'
```

- [ ] **Step 3: Verify**

```powershell
Get-ScheduledTask -TaskName "UniteCleanup-GithubDelete-2026-05-31" | Select TaskName, State
```

- [ ] **Step 4: Commit**

```bash
git -C "D:/Unite-Hub" add .portfolio/schedule/Register-GithubHardDelete.ps1
git -C "D:/Unite-Hub" commit -m "feat(portfolio): add scheduled task for GitHub junk repo hard-delete"
```

---

## Task 12 — Acceptance verification

- [ ] **Step 1: All Phase 2A criteria**

```bash
echo "=== 2 junk repos archived ==="
for r in https-github.com-CleanExpo-Downunder-Miles abacus_crypto_intelligence; do
  isArch=$(gh repo view CleanExpo/$r --json isArchived --jq .isArchived 2>&1)
  echo "  $r: archived=$isArch"
done

echo "=== SC-Generator renamed ==="
gh repo view CleanExpo/SC-Generator --json name,url --jq '"name=" + .name + " url=" + .url'

echo "=== Registry validates ==="
node "D:/Unite-Hub/.portfolio/scripts/validate-registry.mjs"
```

- [ ] **Step 2: All Phase 4 (workflow) criteria**

```bash
echo "=== Branch protection on main + sandbox for 9 repos ==="
for repo in Unite-Hub RestoreAssist Disaster-Recovery DR-NRPG CCW-CRM Synthex ATO CARSI Pi-Dev-Ops; do
  main_ok=$(gh api repos/CleanExpo/$repo/branches/main/protection --jq .required_linear_history 2>/dev/null)
  sand_ok=$(gh api repos/CleanExpo/$repo/branches/sandbox/protection --jq .allow_force_pushes 2>/dev/null)
  echo "  $repo: main_linear=$main_ok sandbox_force=$sand_ok"
done

echo "=== PR template + CODEOWNERS present in 9 repos ==="
for repo in Unite-Hub RestoreAssist Disaster-Recovery DR-NRPG CCW-CRM Synthex ATO CARSI Pi-Dev-Ops; do
  pr=$(gh api "repos/CleanExpo/$repo/contents/.github/PULL_REQUEST_TEMPLATE.md" --jq .name 2>/dev/null || echo "MISSING")
  co=$(gh api "repos/CleanExpo/$repo/contents/.github/CODEOWNERS" --jq .name 2>/dev/null || echo "MISSING")
  echo "  $repo: PR=$pr CO=$co"
done

echo "=== Scheduled task registered ==="
powershell -Command "Get-ScheduledTask -TaskName 'UniteCleanup-GithubDelete-2026-05-31' -ErrorAction SilentlyContinue | Select TaskName, State"
```

Expected: all rows green.

---

## Task 13 — Final commit, push, and handoff to Plan 03

- [ ] **Step 1: Final commit if anything pending**

```bash
git -C "D:/Unite-Hub" status --porcelain
git -C "D:/Unite-Hub" add -A 2>&1
git -C "D:/Unite-Hub" commit -m "chore(cleanup-02): complete GitHub junk + protection phase" 2>&1
```

- [ ] **Step 2: Push branch**

```bash
git -C "D:/Unite-Hub" push 2>&1 | tail -5
```

- [ ] **Step 3: Status report**

Print summary: repos archived, repo renamed, repos protected, templates pushed, scheduled task registered.

- [ ] **Step 4: Next plan**

Plan 03 = Unite-Group (Empire Command Center) merge into Unite-Hub. Biggest task in the series — full code migration. Get user OK before writing.

---

## Rollback procedures

**Unarchive a repo (within 7-day quiet period):**
```bash
gh api -X PATCH repos/CleanExpo/<repo> -F archived=false
```

**Revert SC-Generator rename:**
```bash
gh api -X PATCH repos/CleanExpo/SC-Generator -f name=https-github.com-CleanExpo-SC-Generator
```

**Remove branch protection:**
```bash
gh api -X DELETE repos/CleanExpo/<repo>/branches/<branch>/protection
```

**Cancel scheduled hard-delete:**
```powershell
Unregister-ScheduledTask -TaskName 'UniteCleanup-GithubDelete-2026-05-31' -Confirm:$false
```

---

## Self-review notes

**Spec coverage (Phase 2A + Phase 4):**
- ✓ Archive 3 junk repos → Tasks 1-3
- ✓ Rename SC-Generator → Task 2
- ✓ Long-lived sandbox branch on each active repo → Task 6 (apply-protection script handles)
- ✓ Branch protection on main → Tasks 6-8
- ✓ Branch protection on sandbox → Tasks 6-8
- ✓ PR template → Tasks 5, 9
- ✓ CODEOWNERS → Tasks 5, 9
- ✓ Registry records retired/renamed repos → Task 4

**Out of Plan 02 scope:**
- GitHub Actions workflow templates (deferred to Plan 04 or per-product later)
- Authority-Site / Unite-Group repo handling → Plan 03 (will be merged then deleted)
- Vercel project changes → Plan 04
- alias-guard hook → Plan 05

**Risks:**
- Task 9: branch protection on main may block the very PRs we want to push from Push-Templates.ps1 — script opens PRs (which IS allowed); if branch protection requires PR approval, self-approve.
- Task 11 scheduled task: `gh` CLI auth is per-user; if the task fires under SYSTEM context it'll fail. Mitigation: principal set to `$env:USERNAME` runs as the current user.
- Task 8 mass-apply: a network blip during one repo's protection PUT could leave it half-configured. Re-running the script is idempotent (gh PUT replaces).
