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
  ($obj | ConvertTo-Json -Compress)
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
$evtInput = $event.tool_input

# Only intercept Bash, PowerShell, Write
if ($tool -ne 'Bash' -and $tool -ne 'Write' -and $tool -ne 'PowerShell') { Emit-Allow }

# Bypass via env var
if ($env:PORTFOLIO_GUARD_BYPASS -eq '1') { Emit-Allow }

# Load registry blocklists (best-effort — if registry missing, allow everything)
if (-not (Test-Path $registryPath)) { Emit-Allow }
$registryRaw = Get-Content $registryPath -Raw

# Extract do_not_clone_to[] paths via regex (avoids YAML dependency)
$blockedPaths = @()
$ms = [regex]::Matches($registryRaw, "(?m)^\s+-\s+['""]?(D:\\[^'""\r\n]+)['""]?")
foreach ($m in $ms) {
  $p = $m.Groups[1].Value.TrimEnd('\','/').ToLower()
  if ($p -match '^d:\\') { $blockedPaths += $p }
}

# Known canonical CleanExpo product repos (subset; for clone-target verification)
$cleanExpoRepos = @('Unite-Hub','Unite-Group','RestoreAssist','Disaster-Recovery','DR-NRPG','CCW-CRM','Synthex','ATO','CARSI','Pi-Dev-Ops')

# Get the command / file path to inspect
$cmd = ''
if ($tool -eq 'Bash' -or $tool -eq 'PowerShell') {
  $cmd = "$($evtInput.command)"
} elseif ($tool -eq 'Write') {
  $cmd = "$($evtInput.file_path)"
}

if (-not $cmd) { Emit-Allow }
$cmdLower = $cmd.ToLower()

# Check 1: blocked paths (do_not_clone_to[]) — substring match
foreach ($bp in $blockedPaths) {
  if ($cmdLower.Contains($bp)) {
    Emit-Decision 'block' "Refusing: target path '$bp' is in registry do_not_clone_to[]. Use the canonical path from D:\Unite-Hub\.portfolio\PORTFOLIO.yaml. To bypass: set `$env:PORTFOLIO_GUARD_BYPASS = '1'."
  }
}

# Check 2: git clone of a CleanExpo product repo to non-canonical path
if ($cmdLower -match 'git\s+clone[^\r\n]*cleanexpo/([a-z0-9_-]+)(\.git)?\s+([^\s]+)') {
  $repo = $matches[1]
  $target = $matches[3].Trim('"',"'").TrimEnd('\','/').ToLower()
  $cleanRepo = ($cleanExpoRepos | Where-Object { $_.ToLower() -eq $repo.ToLower() })
  if ($cleanRepo) {
    $canonical = "d:\$($cleanRepo.ToLower())"
    if (-not $target.StartsWith($canonical)) {
      Emit-Decision 'block' "Refusing to clone CleanExpo/$cleanRepo to '$target'. Canonical path: $canonical. To bypass: set `$env:PORTFOLIO_GUARD_BYPASS = '1'."
    }
  }
}

# Check 3: mkdir / New-Item creating a D:\Unite* directory that isn't canonical
if ($cmdLower -match '(mkdir|new-item[^\r\n]*directory)[^\r\n]*(d:\\unite[\s-]?group[^\\]|d:\\unite[\s-]?hub[\s_])') {
  # Allow under D:\Unite-Hub\... or D:\Unite-Group\... (those are canonical/parent)
  if ($cmdLower -match 'd:\\unite-hub\\' -or $cmdLower -match 'd:\\unite-group\\' -or $cmdLower -match 'd:\\authority-site') {
    Emit-Allow
  }
  Emit-Decision 'block' "Refusing to create a new top-level D:\Unite* directory. Use canonical paths in registry. To bypass: set `$env:PORTFOLIO_GUARD_BYPASS = '1'."
}

Emit-Allow
