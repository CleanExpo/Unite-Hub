#Requires -Version 5.1
<#
.SYNOPSIS
    Install and verify Claude Code Hooks for NodeJS-Starter-V1

.DESCRIPTION
    This script sets up the Claude Code hooks system for autonomous project management.
    Run this once after cloning the repository or when hooks need to be refreshed.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .claude/hooks/install-hooks.ps1

.NOTES
    Author: NodeJS-Starter-V1 Team
    Version: 1.0.0
    Requires: Python 3.8+, Node.js 18+, Claude Code CLI
#>

param(
    [switch]$Force,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Colours for output
function Write-Info { param($msg) Write-Host "  [INFO] $msg" -ForegroundColor Cyan }
function Write-Success { param($msg) Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  [WARN] $msg" -ForegroundColor Yellow }
function Write-Err { param($msg) Write-Host "  [ERROR] $msg" -ForegroundColor Red }

Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  Claude Code Hooks Installer v1.0.0" -ForegroundColor Magenta
Write-Host "  NodeJS-Starter-V1" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

# Get project root (parent of .claude directory)
$scriptDir = Split-Path -Parent $PSScriptRoot
$projectRoot = Split-Path -Parent $scriptDir

Write-Info "Project root: $projectRoot"

# 1. Verify prerequisites
Write-Host ""
Write-Host "Checking prerequisites..." -ForegroundColor White

# Check Python
try {
    $pythonVersion = python --version 2>&1
    Write-Success "Python: $pythonVersion"
} catch {
    Write-Err "Python not found. Install Python 3.8+ from https://python.org"
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Success "Node.js: $nodeVersion"
} catch {
    Write-Err "Node.js not found. Install Node.js 18+ from https://nodejs.org"
    exit 1
}

# Check Claude Code CLI
try {
    $claudeVersion = claude --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Claude Code: $claudeVersion"
    } else {
        throw "Claude Code not found"
    }
} catch {
    Write-Warn "Claude Code CLI not detected. Install from https://claude.ai/code"
    Write-Warn "Hooks will be configured but won't run until Claude Code is installed."
}

# 2. Verify scripts directory
Write-Host ""
Write-Host "Verifying hook scripts..." -ForegroundColor White

$scriptsDir = Join-Path $PSScriptRoot "scripts"
$requiredScripts = @(
    "session-start-context.ps1",
    "post-edit-format.ps1",
    "pre-bash-validate.py",
    "notification-alert.ps1",
    "stop-verify-todos.py"
)

$missingScripts = @()
foreach ($script in $requiredScripts) {
    $scriptPath = Join-Path $scriptsDir $script
    if (Test-Path $scriptPath) {
        Write-Success "Found: $script"
    } else {
        Write-Err "Missing: $script"
        $missingScripts += $script
    }
}

if ($missingScripts.Count -gt 0) {
    Write-Err "Missing hook scripts. Please restore them from the repository."
    exit 1
}

# 3. Verify settings.json has hooks configured
Write-Host ""
Write-Host "Verifying settings configuration..." -ForegroundColor White

$settingsPath = Join-Path $scriptDir "settings.json"
if (Test-Path $settingsPath) {
    $settings = Get-Content $settingsPath -Raw | ConvertFrom-Json
    if ($settings.hooks) {
        $hookCount = ($settings.hooks.PSObject.Properties | Measure-Object).Count
        Write-Success "settings.json: $hookCount hook events configured"
    } else {
        Write-Warn "settings.json exists but no hooks configured"
    }
} else {
    Write-Err "settings.json not found at $settingsPath"
    exit 1
}

# 4. Create backup
Write-Host ""
Write-Host "Creating backup..." -ForegroundColor White

$backupDir = Join-Path $scriptDir "backups"
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupPath = Join-Path $backupDir "settings-$timestamp.json.backup"
Copy-Item $settingsPath $backupPath
Write-Success "Backup created: settings-$timestamp.json.backup"

# 5. Test hook scripts (dry run)
Write-Host ""
Write-Host "Testing hook scripts..." -ForegroundColor White

# Test Python scripts syntax
$pythonScripts = Get-ChildItem -Path $scriptsDir -Filter "*.py"
foreach ($script in $pythonScripts) {
    $result = python -m py_compile $script.FullName 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Syntax OK: $($script.Name)"
    } else {
        Write-Err "Syntax error in $($script.Name)"
        if ($Verbose) { Write-Host $result }
    }
}

# Test PowerShell scripts syntax
$psScripts = Get-ChildItem -Path $scriptsDir -Filter "*.ps1"
foreach ($script in $psScripts) {
    try {
        $null = [System.Management.Automation.PSParser]::Tokenize((Get-Content $script.FullName -Raw), [ref]$null)
        Write-Success "Syntax OK: $($script.Name)"
    } catch {
        Write-Err "Syntax error in $($script.Name)"
    }
}

# 6. Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "Hooks installed:" -ForegroundColor White
Write-Host "  - SessionStart: Load project context (git, Beads, PROGRESS.md)" -ForegroundColor Gray
Write-Host "  - PostToolUse:  Auto-format files after Edit/Write" -ForegroundColor Gray
Write-Host "  - PreToolUse:   Validate bash commands, block dangerous ones" -ForegroundColor Gray
Write-Host "  - Notification: Windows toast alerts" -ForegroundColor Gray
Write-Host "  - Stop:         Verify work completion before stopping" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Run 'claude /hooks' to view configured hooks" -ForegroundColor Cyan
Write-Host "  2. Run 'claude --debug' to see hook execution" -ForegroundColor Cyan
Write-Host "  3. Press Ctrl+O in Claude to toggle verbose mode" -ForegroundColor Cyan
Write-Host ""
Write-Host "Documentation: CLAUDE.md -> Hooks section" -ForegroundColor Gray
Write-Host ""
