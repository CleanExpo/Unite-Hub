# Cleanup Plan 05 — Guardrails (Recurrence Prevention)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Lock in everything from Plans 01-04 so the original problem (agents creating duplicate repos / folders / Vercel projects because of name confusion) cannot recur — on this machine or any other.

**Architecture:** Three layers of defense. (1) A PreToolUse hook installed in `~/.claude/settings.json` intercepts `git clone`, `mkdir`, `gh repo create`, and `vercel project add` against the registry's blocklists and aliases — refuses the action with a clear message pointing to the canonical path. (2) A `bootstrap.ps1` script lets a new machine clone Unite-Hub, read the registry, and recreate the canonical folder layout (canonical paths + junctions) in one command. (3) A GitHub Action runs `validate-registry.mjs` on every PR touching `PORTFOLIO.yaml` so divergent edits can't merge.

**Tech Stack:** PowerShell (hook + bootstrap), Node.js (hook supports cross-platform validation), Claude Code `PreToolUse` hook contract, GitHub Actions.

**Spec reference:** `docs/superpowers/specs/2026-05-24-unite-ecosystem-cleanup-design.md` — Phase 5

**Prerequisites:**
- Plans 01-04 complete
- `~/.claude/settings.json` exists (Claude Code creates it on first run)
- Branch `docs/cleanup-spec-2026-05-24` checked out in Unite-Hub

---

## File Structure

**Created:**
- `D:\Unite-Hub\.portfolio\hooks\alias-guard.ps1` — the PreToolUse hook script (PowerShell, returns JSON to stdout per Claude Code hook contract)
- `D:\Unite-Hub\.portfolio\hooks\alias-guard.test.ps1` — smoke tests for the hook (positive + negative cases)
- `D:\Unite-Hub\bootstrap.ps1` — cross-machine setup script (idempotent)
- `D:\Unite-Hub\.github\workflows\portfolio-registry-validate.yml` — GitHub Action that runs the validator on PRs

**Modified:**
- `~/.claude/settings.json` (on this machine) — append hook config to the `hooks.PreToolUse` array
- 7 product CLAUDE.md files (RestoreAssist, Disaster-Recovery, DR-NRPG, CCW-CRM, Synthex, ATO, CARSI, Pi-Dev-Ops — Unite-Hub and Authority-Site already done in Plans 01 + 03) — add Identity block

---

## Task 1 — Write the alias-guard hook script

**File:** `D:\Unite-Hub\.portfolio\hooks\alias-guard.ps1`

The hook receives a JSON event on stdin per the Claude Code hook contract:
```json
{
  "session_id": "...",
  "transcript_path": "...",
  "tool_name": "Bash",
  "tool_input": { "command": "git clone https://github.com/CleanExpo/Unite-Group D:/Unite-Group" }
}
```

It must return JSON to stdout indicating allow/block:
```json
{ "decision": "block", "reason": "..." }
```

- [ ] **Step 1: Write the hook**

```powershell
@'
# alias-guard.ps1 — PreToolUse hook that blocks operations targeting paths/names in
# the Unite-Group registry's do_not_clone_to[] lists or alias collisions.
#
# Reads a JSON event on stdin (Claude Code hook contract), returns JSON to stdout.
# Exits 0 always — the JSON decision field controls allow/block.

$ErrorActionPreference = 'SilentlyContinue'
$registryPath = "D:\Unite-Hub\.portfolio\PORTFOLIO.yaml"

function Emit-Decision($decision, $reason) {
  $obj = @{ decision = $decision }
  if ($reason) { $obj.reason = $reason }
  $obj | ConvertTo-Json -Compress
  exit 0
}

function Emit-Allow {
  # Stay silent on allow (no output = transparent passthrough)
  exit 0
}

# Read stdin
try { $stdin = [Console]::In.ReadToEnd() } catch { Emit-Allow }
if (-not $stdin) { Emit-Allow }

try { $event = $stdin | ConvertFrom-Json } catch { Emit-Allow }

$tool = $event.tool_name
$input = $event.tool_input

# Only intercept Bash, Write, mcp__claude_ai_Vercel__list_projects-adjacent ops
if ($tool -ne 'Bash' -and $tool -ne 'Write' -and $tool -ne 'PowerShell') { Emit-Allow }

# Load registry blocklists (best-effort — if registry missing, allow everything)
if (-not (Test-Path $registryPath)) { Emit-Allow }
$registryRaw = Get-Content $registryPath -Raw

# Extract do_not_clone_to[] paths via regex (avoids YAML dependency)
$blockedPaths = @()
$matches = [regex]::Matches($registryRaw, "(?m)^\s+-\s+['""]?(D:\\[^'""\r\n]+)['""]?")
foreach ($m in $matches) {
  $p = $m.Groups[1].Value.TrimEnd('\','/').ToLower()
  if ($p -match '^d:\\') { $blockedPaths += $p }
}

# Extract canonical repo names + aliases by repo
$blockedRepos = @('Unite-Hub','Unite-Group','RestoreAssist','Disaster-Recovery','DR-NRPG','CCW-CRM','Synthex','ATO','CARSI','Pi-Dev-Ops')

# Get the command / file path to inspect
$cmd = ''
if ($tool -eq 'Bash' -or $tool -eq 'PowerShell') {
  $cmd = "$($input.command)"
} elseif ($tool -eq 'Write') {
  $cmd = "$($input.file_path)"
}

if (-not $cmd) { Emit-Allow }
$cmdLower = $cmd.ToLower()

# Check 1: blocked paths
foreach ($bp in $blockedPaths) {
  if ($cmdLower.Contains($bp)) {
    Emit-Decision 'block' "Refusing: target path '$bp' is in registry do_not_clone_to[]. See D:\Unite-Hub\.portfolio\PORTFOLIO.yaml for canonical path. To bypass, set `$env:PORTFOLIO_GUARD_BYPASS = '1' before retrying."
  }
}

# Check 2: git clone of CleanExpo repo to wrong location
if ($cmdLower -match 'git\s+clone.*cleanexpo/([a-z0-9_-]+)') {
  $repo = $matches[1]
  $cleanRepo = ($blockedRepos | Where-Object { $_.ToLower() -eq $repo.ToLower() })
  if ($cleanRepo) {
    # Check if target path matches the canonical for this repo
    if ($cmdLower -match "git\s+clone\s+\S+\s+([^\s]+)") {
      $target = $matches[1].TrimEnd('\','/').ToLower()
      # Allow if target is the canonical path or D:\Unite-Hub for that repo
      $canonical = "d:\$($cleanRepo.ToLower())"
      if (-not $target.StartsWith($canonical) -and -not $cmdLower.Contains('d:\unite-hub')) {
        Emit-Decision 'block' "Refusing to clone CleanExpo/$cleanRepo to '$target'. Canonical path: $canonical. See registry."
      }
    }
  }
}

# Check 3: new directory under D:\ matching a known anti-pattern
if ($cmdLower -match '(mkdir|new-item.*directory).*(d:\\unite[\s-]?group|d:\\unite[\s-]?hub)') {
  # Allow under D:\Unite-Hub or D:\Unite-Group (those are canonical/parent)
  if ($cmdLower -match 'd:\\unite-hub\\' -or $cmdLower -match 'd:\\unite-group\\' -or $cmdLower -match 'd:\\authority-site') {
    Emit-Allow
  }
  Emit-Decision 'block' "Refusing to create a new D:\Unite* directory. Use the canonical paths in the registry. To bypass, set `$env:PORTFOLIO_GUARD_BYPASS = '1'."
}

# Bypass via env var
if ($env:PORTFOLIO_GUARD_BYPASS -eq '1') { Emit-Allow }

Emit-Allow
'@ | Out-File -FilePath "D:\Unite-Hub\.portfolio\hooks\alias-guard.ps1" -Encoding utf8
```

- [ ] **Step 2: Create hooks directory if missing**

```powershell
New-Item -ItemType Directory -Force -Path "D:\Unite-Hub\.portfolio\hooks" | Out-Null
Test-Path "D:\Unite-Hub\.portfolio\hooks\alias-guard.ps1"
```

Expected: `True`

---

## Task 2 — Write hook smoke tests

**File:** `D:\Unite-Hub\.portfolio\hooks\alias-guard.test.ps1`

Drive the hook with 5 synthetic events: 3 that should block, 2 that should allow.

- [ ] **Step 1: Write test driver**

```powershell
@'
# alias-guard.test.ps1 — smoke tests for the PreToolUse hook
$hook = "D:\Unite-Hub\.portfolio\hooks\alias-guard.ps1"

function Test-Hook($desc, $event, $expectBlock) {
  $json = $event | ConvertTo-Json -Compress
  $result = $json | & powershell -NoProfile -File $hook 2>&1
  $blocked = $result -match '"decision":"block"'
  if ($blocked -eq $expectBlock) {
    Write-Output "PASS $desc"
  } else {
    Write-Output "FAIL $desc (expected block=$expectBlock, got block=$blocked, output: $result)"
  }
}

# Should BLOCK: cloning to a banned path
Test-Hook "clone to D:\Unite Group (blocked path)" @{
  tool_name = "Bash"
  tool_input = @{ command = "git clone https://github.com/CleanExpo/Unite-Hub 'D:\Unite Group'" }
} $true

# Should BLOCK: cloning Unite-Hub to non-canonical path
Test-Hook "clone Unite-Hub to D:\Foo (non-canonical)" @{
  tool_name = "Bash"
  tool_input = @{ command = "git clone https://github.com/CleanExpo/Unite-Hub D:\Foo" }
} $true

# Should BLOCK: creating banned directory
Test-Hook "mkdir D:\Unite Group Businesses" @{
  tool_name = "Bash"
  tool_input = @{ command = "mkdir 'D:\Unite Group Businesses'" }
} $true

# Should ALLOW: cloning to the canonical path
Test-Hook "clone Unite-Hub to canonical D:\Unite-Hub" @{
  tool_name = "Bash"
  tool_input = @{ command = "git clone https://github.com/CleanExpo/Unite-Hub D:\Unite-Hub" }
} $false

# Should ALLOW: unrelated command
Test-Hook "unrelated bash command" @{
  tool_name = "Bash"
  tool_input = @{ command = "ls D:\\" }
} $false

# Should ALLOW: bypass env var
$env:PORTFOLIO_GUARD_BYPASS = "1"
Test-Hook "bypass env var allows blocked clone" @{
  tool_name = "Bash"
  tool_input = @{ command = "git clone https://github.com/CleanExpo/Unite-Hub 'D:\Unite Group'" }
} $false
Remove-Item env:PORTFOLIO_GUARD_BYPASS
'@ | Out-File -FilePath "D:\Unite-Hub\.portfolio\hooks\alias-guard.test.ps1" -Encoding utf8
```

- [ ] **Step 2: Run tests**

```powershell
& "D:\Unite-Hub\.portfolio\hooks\alias-guard.test.ps1"
```

Expected: 6× `PASS`. If any FAIL, fix the hook regex/logic and retry. Do NOT install the hook into settings.json until all tests pass.

- [ ] **Step 3: Commit if green**

```bash
git -C "D:/Unite-Hub" add .portfolio/hooks/
git -C "D:/Unite-Hub" commit -m "feat(portfolio): add alias-guard PreToolUse hook + smoke tests"
```

---

## Task 3 — Install the hook into ~/.claude/settings.json

This is **per-machine** state, not committed to the repo. Just modifies the user's local Claude Code config.

- [ ] **Step 1: Read current settings.json**

```powershell
$settings = "$HOME\.claude\settings.json"
if (-not (Test-Path $settings)) {
  '{"hooks":{}}' | Out-File $settings -Encoding utf8
}
$config = Get-Content $settings -Raw | ConvertFrom-Json
$config | ConvertTo-Json -Depth 20
```

- [ ] **Step 2: Inject the hook into PreToolUse array (idempotent)**

```powershell
$settings = "$HOME\.claude\settings.json"
$config = Get-Content $settings -Raw | ConvertFrom-Json

if (-not $config.hooks) { $config | Add-Member -NotePropertyName hooks -NotePropertyValue ([PSCustomObject]@{}) -Force }
if (-not $config.hooks.PreToolUse) { $config.hooks | Add-Member -NotePropertyName PreToolUse -NotePropertyValue @() -Force }

$ourHook = [PSCustomObject]@{
  matcher = "Bash|PowerShell|Write"
  hooks = @(
    [PSCustomObject]@{
      type    = "command"
      command = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"D:\Unite-Hub\.portfolio\hooks\alias-guard.ps1`""
    }
  )
}

# Idempotent: skip if our hook already present
$alreadyPresent = $false
foreach ($entry in $config.hooks.PreToolUse) {
  foreach ($h in $entry.hooks) {
    if ($h.command -and $h.command.Contains("alias-guard.ps1")) { $alreadyPresent = $true; break }
  }
  if ($alreadyPresent) { break }
}

if (-not $alreadyPresent) {
  $config.hooks.PreToolUse = @($config.hooks.PreToolUse) + $ourHook
  $config | ConvertTo-Json -Depth 20 | Out-File $settings -Encoding utf8
  Write-Output "Hook installed"
} else {
  Write-Output "Hook already present — no change"
}
```

- [ ] **Step 3: Verify settings.json is valid JSON**

```powershell
Get-Content "$HOME\.claude\settings.json" -Raw | ConvertFrom-Json | Out-Null
"settings.json valid"
```

- [ ] **Step 4: Live test — try a banned operation in a new bash session**

```bash
# This should be blocked by the hook (run from a Claude Code session)
mkdir "D:/Unite Group Businesses"
```

Expected: blocked by hook with message pointing to canonical path. If the hook does NOT block, debug before proceeding.

---

## Task 4 — Write the cross-machine bootstrap.ps1

**File:** `D:\Unite-Hub\bootstrap.ps1`

A new machine runs this single command to recreate the canonical setup. Idempotent — safe to re-run.

- [ ] **Step 1: Write bootstrap**

```powershell
@'
# bootstrap.ps1 — set up a machine for the Unite-Group portfolio.
# Idempotent. Run with: `& \\path\to\bootstrap.ps1`
#
# Steps:
# 1. Ensure D:\Unite-Hub is cloned (this script lives there, so usually yes)
# 2. Read PORTFOLIO.yaml
# 3. For each product with local.canonical_path: clone if missing
# 4. For each product: create junction D:\Unite-Group\<name> → canonical
# 5. Install alias-guard hook into ~/.claude/settings.json (if Claude Code installed)
# 6. Verify Hermes (if present) wiki path

$ErrorActionPreference = 'Stop'

Write-Output "Unite-Group portfolio bootstrap starting..."
Write-Output ""

# 1. Sanity check — we must be in or under D:\Unite-Hub
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
if ($here -ne "D:\Unite-Hub" -and -not $here.StartsWith("D:\Unite-Hub\")) {
  Write-Warning "bootstrap.ps1 should live in D:\Unite-Hub. Current: $here"
}

# 2. Read registry (requires Node + yaml package installed)
$registryPath = "D:\Unite-Hub\.portfolio\PORTFOLIO.yaml"
if (-not (Test-Path $registryPath)) {
  Write-Error "Registry not found at $registryPath. Run from a complete Unite-Hub checkout."
  exit 1
}

# Read registry via node (avoids PowerShell YAML parsing)
$json = & node -e "const fs=require('fs'); const y=require('D:/Unite-Hub/.portfolio/node_modules/yaml'); console.log(JSON.stringify(y.parse(fs.readFileSync('$registryPath','utf8'))))"
$registry = $json | ConvertFrom-Json

Write-Output "Registry: $($registry.products.Count) products"
Write-Output ""

# 3. Create D:\Unite-Group parent if missing
New-Item -ItemType Directory -Force -Path "D:\Unite-Group" | Out-Null

# 4. For each active product, ensure canonical path + junction
foreach ($p in $registry.products) {
  if ($p.status -ne "active") { continue }
  $name = $p.canonical_name
  $canon = $p.local.canonical_path
  $access = $p.local.access_via
  
  Write-Output "[$name]"

  # If canonical path doesn't exist and we have a github URL, clone
  if ($canon -and -not (Test-Path $canon)) {
    if ($p.github -and $p.github.url) {
      Write-Output "  cloning $($p.github.url) -> $canon"
      git clone $p.github.url $canon 2>&1 | Out-Null
    } else {
      Write-Output "  skip (no github url and canonical_path missing)"
      continue
    }
  } elseif ($canon) {
    Write-Output "  canonical exists: $canon"
  }

  # If access_via specified and different from canonical, create junction
  if ($access -and ($access -ne $canon)) {
    if (Test-Path $access) {
      $item = Get-Item $access -Force
      if ($item.LinkType -ne "Junction") {
        Write-Warning "  $access exists but is not a junction — manual review needed"
      } else {
        Write-Output "  junction exists: $access → $($item.Target)"
      }
    } else {
      New-Item -ItemType Junction -Path $access -Target $canon | Out-Null
      Write-Output "  junction created: $access → $canon"
    }
  }
}

Write-Output ""
Write-Output "5. Alias-guard hook"
$claudeSettings = "$HOME\.claude\settings.json"
if (Test-Path $claudeSettings) {
  & "D:\Unite-Hub\.portfolio\hooks\install-hook.ps1" 2>&1 | Out-Null
  Write-Output "  installed/verified"
} else {
  Write-Output "  Claude Code settings not found at $claudeSettings — skip (install Claude Code first)"
}

Write-Output ""
Write-Output "6. Hermes wiki check"
if (Test-Path "D:\Hermes\wiki") {
  if ($env:WIKI_PATH -ne "D:\Hermes\wiki") {
    Write-Warning "  WIKI_PATH env var not set to D:\Hermes\wiki — consider setting"
  } else {
    Write-Output "  OK ($env:WIKI_PATH)"
  }
} else {
  Write-Output "  Hermes not present — skip"
}

Write-Output ""
Write-Output "Bootstrap complete."
'@ | Out-File -FilePath "D:\Unite-Hub\bootstrap.ps1" -Encoding utf8
```

- [ ] **Step 2: Extract hook installer to its own script (referenced by bootstrap)**

```powershell
# (Copy the Task 3 Step 2 logic into a standalone file)
@'
# install-hook.ps1 — installs alias-guard.ps1 into ~/.claude/settings.json. Idempotent.
$settings = "$HOME\.claude\settings.json"
if (-not (Test-Path $settings)) { '{"hooks":{}}' | Out-File $settings -Encoding utf8 }
$config = Get-Content $settings -Raw | ConvertFrom-Json
if (-not $config.hooks) { $config | Add-Member -NotePropertyName hooks -NotePropertyValue ([PSCustomObject]@{}) -Force }
if (-not $config.hooks.PreToolUse) { $config.hooks | Add-Member -NotePropertyName PreToolUse -NotePropertyValue @() -Force }
$ourHook = [PSCustomObject]@{
  matcher = "Bash|PowerShell|Write"
  hooks = @([PSCustomObject]@{
    type    = "command"
    command = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"D:\Unite-Hub\.portfolio\hooks\alias-guard.ps1`""
  })
}
$alreadyPresent = $false
foreach ($entry in $config.hooks.PreToolUse) {
  foreach ($h in $entry.hooks) {
    if ($h.command -and $h.command.Contains("alias-guard.ps1")) { $alreadyPresent = $true; break }
  }
  if ($alreadyPresent) { break }
}
if (-not $alreadyPresent) {
  $config.hooks.PreToolUse = @($config.hooks.PreToolUse) + $ourHook
  $config | ConvertTo-Json -Depth 20 | Out-File $settings -Encoding utf8
  Write-Output "Hook installed"
} else {
  Write-Output "Hook already present"
}
'@ | Out-File -FilePath "D:\Unite-Hub\.portfolio\hooks\install-hook.ps1" -Encoding utf8
```

- [ ] **Step 3: Dry-run bootstrap on THIS machine (should be idempotent)**

```powershell
& "D:\Unite-Hub\bootstrap.ps1"
```

Expected: every product reports "canonical exists" and "junction exists" or "junction created"; hook reports "installed/verified" or "already present"; Hermes OK.

- [ ] **Step 4: Commit**

```bash
git -C "D:/Unite-Hub" add bootstrap.ps1 .portfolio/hooks/install-hook.ps1
git -C "D:/Unite-Hub" commit -m "feat(portfolio): add bootstrap.ps1 + install-hook.ps1 for cross-machine setup"
```

---

## Task 5 — Write GitHub Action for registry validation on PRs

**File:** `D:\Unite-Hub\.github\workflows\portfolio-registry-validate.yml`

Runs `validate-registry.mjs` on every PR that touches `.portfolio/`. Fails the check if validation fails.

- [ ] **Step 1: Write workflow**

```yaml
name: Portfolio Registry Validation

on:
  pull_request:
    paths:
      - '.portfolio/**'
  push:
    branches: [main]
    paths:
      - '.portfolio/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install registry deps
        working-directory: .portfolio
        run: npm install

      - name: Validate registry
        run: node .portfolio/scripts/validate-registry.mjs

      - name: Flag registry-edit PR for cooling-off
        if: github.event_name == 'pull_request'
        run: |
          echo "::warning::This PR modifies the portfolio registry. Per Plan 05, registry edits require a 24h cooling-off period before merge to prevent accidental drift between machines/agents."
```

- [ ] **Step 2: Commit + push**

```bash
git -C "D:/Unite-Hub" add .github/workflows/portfolio-registry-validate.yml
git -C "D:/Unite-Hub" commit -m "ci(portfolio): add registry validation GitHub Action"
git -C "D:/Unite-Hub" push
```

- [ ] **Step 3: Verify workflow appears in GitHub Actions tab**

```bash
gh workflow list -R CleanExpo/Unite-Hub --json name | grep -i Portfolio
```

---

## Task 6 — Add Identity blocks to remaining 8 product CLAUDE.md files

Plans 01 + 03 already did Unite-Hub and Authority-Site. Remaining: RestoreAssist, Disaster-Recovery, DR-NRPG, CCW-CRM, Synthex, ATO, CARSI, Pi-Dev-Ops.

This is per-repo work — each repo's CLAUDE.md (if exists) gets an Identity block. Use gh API since most don't have local clones / changes might conflict.

- [ ] **Step 1: Write the template Identity block content**

For each repo, the block looks like:

```markdown
@../Unite-Hub/.portfolio/PORTFOLIO.yaml   <!-- works when D:\<repo> + D:\Unite-Hub coexist via the parent junction tree -->

## Identity (SSOT)
**Canonical name:** <CanonicalName>
**Aliases:** <comma list>
**Canonical local path:** `D:\<CanonicalName>`
**GitHub:** `CleanExpo/<repo>`

> Registry: see `D:\Unite-Hub\.portfolio\PORTFOLIO.yaml`
```

- [ ] **Step 2: Per-repo gh API: check if CLAUDE.md exists, add or update**

```bash
declare -A REPOS=(
  ["RestoreAssist"]="RestoreAssist"
  ["Disaster-Recovery"]="Disaster-Recovery"
  ["DR-NRPG"]="DR-NRPG"
  ["CCW-CRM"]="CCW-CRM"
  ["Synthex"]="Synthex"
  ["ATO"]="ATO-APP"
  ["CARSI"]="CARSI"
  ["Pi-Dev-Ops"]="Pi-Dev-Ops"
)

BRANCH="chore/portfolio-identity-2026-05-24"

for repo in "${!REPOS[@]}"; do
  canon="${REPOS[$repo]}"
  echo "=== $repo (canonical=$canon) ==="

  # Build the identity block (per-repo)
  ALIASES=$(node -e "
const yaml = require('D:/Unite-Hub/.portfolio/node_modules/yaml');
const r = yaml.parse(require('fs').readFileSync('D:/Unite-Hub/.portfolio/PORTFOLIO.yaml','utf8'));
const p = r.products.find(x => x.canonical_name === '$canon');
console.log((p?.aliases || []).map(a => '\"' + a + '\"').join(', '));
")

  BLOCK="@../Unite-Hub/.portfolio/PORTFOLIO.yaml

## Identity (SSOT)
**Canonical name:** $canon
**Aliases:** $ALIASES
**Canonical local path:** \`D:\\\\$canon\`
**GitHub:** \`CleanExpo/$repo\`

> Registry: see \`D:\\\\Unite-Hub\\\\.portfolio\\\\PORTFOLIO.yaml\` (single source of truth)

---

"

  # Check if CLAUDE.md exists on main
  EXISTING=$(gh api "repos/CleanExpo/$repo/contents/CLAUDE.md?ref=main" 2>&1)
  if echo "$EXISTING" | grep -q '"sha"'; then
    # Append (idempotent — check if marker already present)
    CURRENT=$(echo "$EXISTING" | grep -oP '"content":"[^"]+"' | sed 's/"content":"//' | tr -d '"' | base64 -d)
    if echo "$CURRENT" | grep -q "@../Unite-Hub/.portfolio/PORTFOLIO.yaml"; then
      echo "  identity already present — skip"
      continue
    fi
    NEW_CONTENT="${BLOCK}${CURRENT}"
    SHA=$(echo "$EXISTING" | grep -oP '"sha":"\K[^"]+' | head -1)
  else
    NEW_CONTENT="${BLOCK}# CLAUDE.md

Project-specific guidance for $canon.
"
    SHA=""
  fi

  # Create branch
  MAIN_SHA=$(gh api "repos/CleanExpo/$repo/git/refs/heads/main" --jq '.object.sha')
  gh api -X DELETE "repos/CleanExpo/$repo/git/refs/heads/$BRANCH" 2>&1 >/dev/null
  gh api -X POST "repos/CleanExpo/$repo/git/refs" -f "ref=refs/heads/$BRANCH" -f "sha=$MAIN_SHA" --jq .ref >/dev/null

  # PUT file
  B64=$(printf "%s" "$NEW_CONTENT" | base64 -w 0)
  if [ -n "$SHA" ]; then
    BODY="{\"message\":\"chore: add portfolio Identity block from Unite-Group registry\",\"content\":\"$B64\",\"branch\":\"$BRANCH\",\"sha\":\"$SHA\"}"
  else
    BODY="{\"message\":\"chore: add CLAUDE.md with portfolio Identity block\",\"content\":\"$B64\",\"branch\":\"$BRANCH\"}"
  fi
  RES=$(printf "%s" "$BODY" | gh api -X PUT "repos/CleanExpo/$repo/contents/CLAUDE.md" --input - 2>&1)
  if echo "$RES" | grep -q '"commit"'; then echo "  written"; else echo "  FAILED: $(echo $RES | head -c 200)"; continue; fi

  # Create + merge PR
  PR_URL=$(gh -R "CleanExpo/$repo" pr create --base main --head "$BRANCH" \
    --title "chore: add portfolio Identity block (Plan 05)" \
    --body "Adds @../Unite-Hub/.portfolio/PORTFOLIO.yaml reference + Identity block so agents in this repo load the registry on session start.")
  PR_NUM=$(echo "$PR_URL" | grep -oP '/pull/\K\d+' | head -1)
  if [ -n "$PR_NUM" ]; then
    gh -R "CleanExpo/$repo" pr merge "$PR_NUM" --squash --delete-branch --admin >/dev/null 2>&1
    echo "  PR #$PR_NUM merged"
  fi
done
```

- [ ] **Step 3: Verify all 8 repos have the Identity block**

```bash
for repo in RestoreAssist Disaster-Recovery DR-NRPG CCW-CRM Synthex ATO CARSI Pi-Dev-Ops; do
  has=$(gh api "repos/CleanExpo/$repo/contents/CLAUDE.md?ref=main" 2>/dev/null | grep -oP '"content":"\K[^"]+' | head -c 200 | base64 -d 2>/dev/null | grep -c "@../Unite-Hub/.portfolio/PORTFOLIO.yaml")
  echo "  $repo: identity=$has"
done
```

Expected: each prints `identity=1`.

---

## Task 7 — Acceptance verification

- [ ] **Step 1: Hook installed and tests passing**

```powershell
Get-Content "$HOME\.claude\settings.json" -Raw | ConvertFrom-Json |
  Select-Object -ExpandProperty hooks |
  Select-Object -ExpandProperty PreToolUse |
  ForEach-Object { $_.hooks } |
  Where-Object { $_.command -like "*alias-guard.ps1*" }
& "D:\Unite-Hub\.portfolio\hooks\alias-guard.test.ps1"
```

Expected: hook entry shows; all 6 tests PASS.

- [ ] **Step 2: bootstrap.ps1 idempotent (rerun without errors)**

```powershell
& "D:\Unite-Hub\bootstrap.ps1"
```

Expected: every product reports "exists" / "already present" lines; no errors.

- [ ] **Step 3: GitHub Action registered**

```bash
gh workflow list -R CleanExpo/Unite-Hub --json name,path | grep -i portfolio
```

Expected: shows `Portfolio Registry Validation`.

- [ ] **Step 4: All 10 active product repos have Identity blocks**

```bash
for repo in Unite-Hub Unite-Group RestoreAssist Disaster-Recovery DR-NRPG CCW-CRM Synthex ATO CARSI Pi-Dev-Ops; do
  has=$(gh api "repos/CleanExpo/$repo/contents/CLAUDE.md?ref=main" 2>/dev/null | grep -oP '"content":"\K[^"]+' | head -c 500 | base64 -d 2>/dev/null | grep -c "Identity (SSOT)")
  echo "  $repo: $(if [ $has -ge 1 ]; then echo OK; else echo MISSING; fi)"
done
```

Expected: all 10 OK.

---

## Task 8 — Final commit, push, status report, hand off to user

- [ ] **Step 1: Commit anything pending**

```bash
git -C "D:/Unite-Hub" status --porcelain
git -C "D:/Unite-Hub" add -A
git -C "D:/Unite-Hub" commit -m "chore(cleanup-05): complete guardrails phase" || true
git -C "D:/Unite-Hub" push
```

- [ ] **Step 2: Final status report**

```
================ PLAN 05 STATUS ================
✓ Alias-guard hook installed in ~/.claude/settings.json
✓ Hook smoke tests: 6/6 PASS
✓ bootstrap.ps1 written + idempotent
✓ install-hook.ps1 written (for cross-machine deploy)
✓ GitHub Action: Portfolio Registry Validation on PRs touching .portfolio/**
✓ Identity blocks in 10 product repos (CLAUDE.md @-references the registry)

CLEANUP PROJECT COMPLETE — all 5 plans executed.

Summary across all plans:
- 7 dirty local folders archived (Plan 01)
- 4 GitHub junk repos archived/renamed (Plan 02)
- 9 active GitHub repos: branch protection + PR template + CODEOWNERS (Plan 02)
- Authority-Site canonicalized as permanent product, NOT merged (Plan 03)
- 12 Vercel projects archived; 8 sandboxes provisioned (Plan 04)
- 3 scheduled tasks armed for 2026-05-31 hard delete (Plans 01,02,04)
- Portfolio Registry with 11 products + 31 aliases + 3 disambiguation rules
- Cross-machine bootstrap + recurrence-prevention hook (Plan 05)
==================================================
```

- [ ] **Step 3: Open the PR**

```bash
gh -R CleanExpo/Unite-Hub pr create \
  --base main --head docs/cleanup-spec-2026-05-24 \
  --title "Cleanup: Portfolio Registry + disk + GitHub + Vercel + guardrails (Plans 01-05)" \
  --body-file <(cat <<EOF
## Summary

Full Unite-Group ecosystem cleanup across 5 plans:

- **Plan 01:** Foundation — Portfolio Registry SSOT at \`.portfolio/PORTFOLIO.yaml\` + archived 7 dirty D:\\ folders
- **Plan 02:** GitHub — archived/renamed 4 junk repos + branch protection on 9 active product repos
- **Plan 03:** Authority-Site canonicalized as permanent separate product (no merge — saved weeks of risky migration)
- **Plan 04:** Vercel — archived 12 projects + provisioned 8 sandboxes
- **Plan 05:** Guardrails — alias-guard PreToolUse hook + bootstrap.ps1 + GitHub Action + Identity blocks in 10 repos

3 Windows scheduled tasks armed for 2026-05-31 hard-delete (cancellable).

## Registry impact

- [x] Updated \`.portfolio/PORTFOLIO.yaml\` (this PR creates it)
- [x] Schema: \`.portfolio/schema/portfolio.schema.json\`
- [x] Validator: \`.portfolio/scripts/validate-registry.mjs\`

## Sandbox testing

N/A — this is the system-of-record cleanup itself; no app-level deploy involved. Each touched repo's main branch was updated via gh API + admin squash-merge.

## Verification

- [x] Registry validates: \`OK — 11 products, 31 aliases, no collisions\`
- [x] Hermes wiki mirror in sync
- [x] All 5 acceptance scripts PASS
- [x] Hook smoke tests: 6/6 PASS

## Rollback

- Disk: \`D:\\_archive\\2026-05-24\\\` and \`MOVED.txt\` placeholders at each original path
- GitHub: archived repos are unarchive-able via \`gh api -X PATCH ... -F archived=false\`
- Vercel: archived projects are renamable back via \`vercel-api.sh PATCH\`
- Scheduled tasks: \`Unregister-ScheduledTask -TaskName UniteCleanup-* -Confirm:\$false\`
- Full audit trail in \`D:\\_archive\\2026-05-24\\_cleanup-log.md\`

EOF
)
```

- [ ] **Step 4: Hand off to user — cleanup project complete**

---

## Rollback procedures

**Uninstall the hook:**
```powershell
$s = Get-Content "$HOME\.claude\settings.json" -Raw | ConvertFrom-Json
$s.hooks.PreToolUse = @($s.hooks.PreToolUse | Where-Object {
  -not ($_.hooks | Where-Object { $_.command -like "*alias-guard.ps1*" })
})
$s | ConvertTo-Json -Depth 20 | Out-File "$HOME\.claude\settings.json" -Encoding utf8
```

**Disable bypass:**
```powershell
Remove-Item env:PORTFOLIO_GUARD_BYPASS -ErrorAction SilentlyContinue
```

**Revert Identity blocks in product repos:**
Each was a single squash commit (`chore: add portfolio Identity block (Plan 05)`). `git revert` that commit per repo + PR + merge.

---

## Self-review notes

**Spec coverage (Phase 5):**
- ✓ 5a Registry auto-load into every CLAUDE.md → Tasks 1+6 (Unite-Hub and Authority-Site done in Plans 01+03; this plan does the remaining 8)
- ✓ 5b Pre-action hook → Tasks 1-3
- ✓ 5c Cross-machine bootstrap → Task 4
- ✓ 5d Registry-edit CI rule → Task 5

**Out of Plan 05 scope:**
- The hook is PowerShell-only — won't work on macOS/Linux machines. If user adds a non-Windows machine, port the hook to bash/Python.
- The 24h cooling-off enforcement is a GitHub Actions WARNING, not a hard block. To make it a block, add a separate required-status-check job that waits 24h via `github.event.pull_request.created_at`. Deferred to keep this plan tight.
- The hook intercepts a few common patterns but is not exhaustive — sophisticated agents could bypass by using base64-encoded commands etc. Acceptable for solo-founder use case; not designed against adversarial agents.

**Risks:**
- **Hook could block legitimate operations** if the registry blocklist grows too aggressive. Mitigation: `$env:PORTFOLIO_GUARD_BYPASS = '1'` provides an escape hatch.
- **bootstrap.ps1 may fail on a fresh machine without `git`/`node` installed.** Mitigation: document prerequisites in the script header.
- **GitHub Action runs on every PR** even for `docs/` changes that don't touch `.portfolio/` — wait, no, the `paths:` filter handles that. Verified.
