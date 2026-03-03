# NotebookLM Sync Hook — Post-verify/build auto-sync
# Triggered by PostToolUse (Bash). Only acts on verify/build commands.
# Reads tool input from stdin to determine if the command is relevant.

param(
    [switch]$DryRun
)

$ErrorActionPreference = "SilentlyContinue"

# --- 1. Read stdin (tool input JSON) and check if command is relevant ---
$stdinContent = ""
try {
    if (-not [Console]::IsInputRedirected) {
        exit 0
    }
    $stdinContent = [Console]::In.ReadToEnd()
} catch {
    exit 0
}

if (-not $stdinContent) {
    exit 0
}

# Parse the tool input to extract the command
$toolInput = $null
try {
    $toolInput = $stdinContent | ConvertFrom-Json
} catch {
    exit 0
}

$command = ""
if ($toolInput.tool_input -and $toolInput.tool_input.command) {
    $command = $toolInput.tool_input.command
} elseif ($toolInput.command) {
    $command = $toolInput.command
}

if (-not $command) {
    exit 0
}

# Only proceed for verify or build commands
$isRelevant = ($command -match '\bverify\b') -or ($command -match '\bbuild\b')
if (-not $isRelevant) {
    exit 0
}

# Check if the tool result indicates success
if ($toolInput.tool_result -and $toolInput.tool_result.exitCode -and $toolInput.tool_result.exitCode -ne 0) {
    exit 0
}

# --- 2. Check nlm is installed ---
$nlmPath = Get-Command "nlm" -ErrorAction SilentlyContinue
if (-not $nlmPath) {
    exit 0
}

# --- 3. Check authentication ---
$authCheck = & nlm login --check 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "notebooklm-sync: not authenticated (run 'nlm login')" -ForegroundColor Yellow
    exit 0
}

# --- 4. Read notebook config ---
$configPath = Join-Path $PSScriptRoot "..\..\notebooklm\notebooks.json"
$configPath = (Resolve-Path $configPath -ErrorAction SilentlyContinue).Path

if (-not $configPath -or -not (Test-Path $configPath)) {
    exit 0
}

$config = Get-Content $configPath -Raw | ConvertFrom-Json
$notebookId = $config.notebooks.project_sot.id

if (-not $notebookId -or $notebookId -eq "") {
    exit 0
}

# --- 5. Build implementation note ---
$date = Get-Date -Format "dd/MM/yyyy HH:mm"
$commitHash = (git rev-parse --short HEAD 2>$null) ?? "unknown"
$commitMsg = (git log -1 --format="%s" 2>$null) ?? "unknown"
$diffStat = git diff HEAD~1 --stat 2>$null
$changedFiles = if ($diffStat) { $diffStat -join "`n" } else { "No diff available" }

# Detect TODO items in recently changed files
$todos = ""
$recentFiles = git diff HEAD~1 --name-only 2>$null
if ($recentFiles) {
    $todoMatches = $recentFiles | ForEach-Object {
        if (Test-Path $_) {
            Select-String -Path $_ -Pattern "TODO|FIXME|HACK|XXX" -ErrorAction SilentlyContinue
        }
    }
    if ($todoMatches) {
        $todos = ($todoMatches | ForEach-Object { "- $($_.Filename):$($_.LineNumber) $($_.Line.Trim())" }) -join "`n"
    }
}

$noteContent = @"
## Implementation Note — $date [$commitHash]

**What changed**: $commitMsg

**Files**:
$changedFiles

**Follow-ups**:
$(if ($todos) { $todos } else { "None detected" })
"@

# --- 6. Sync or dry-run ---
if ($DryRun) {
    Write-Host "=== DRY RUN — NotebookLM Sync ===" -ForegroundColor Cyan
    Write-Host "Notebook: $notebookId"
    Write-Host "Note title: Sync $date"
    Write-Host ""
    Write-Host $noteContent
    Write-Host "=== END DRY RUN ===" -ForegroundColor Cyan
    exit 0
}

$noteTitle = "Sync $date"
$noteContent | & nlm note create $notebookId $noteTitle --text - 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "notebooklm-sync: synced to project_sot [$commitHash]" -ForegroundColor Green
} else {
    Write-Host "notebooklm-sync: failed to sync (nlm returned $LASTEXITCODE)" -ForegroundColor Yellow
}

exit 0
