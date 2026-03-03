# Pre-Hydration Pipeline for Minion Blueprint Engine
# Called explicitly by /minion command before agentic execution begins.
# Pure deterministic keyword-to-file mapping. No LLM involved.
#
# Usage: .\pre-hydration.ps1 -TaskText "add rate limiting to login endpoint"
# Output: JSON manifest of files to load

param(
    [Parameter(Mandatory=$true)]
    [string]$TaskText
)

$ErrorActionPreference = "SilentlyContinue"
$taskLower = $TaskText.ToLower()

# --- Blueprint Type Detection ---
$blueprint = "feature"  # default
if ($taskLower -match "bug|fix|broken|error|failing|crash|regression|issue") { $blueprint = "bugfix" }
elseif ($taskLower -match "migrate|upgrade|replace|move|switch|port") { $blueprint = "migration" }
elseif ($taskLower -match "refactor|clean|simplify|extract|rename|restructure|organise|reorganise") { $blueprint = "refactor" }

# --- Toolshed Detection ---
$toolshed = "general"  # default
if ($taskLower -match "react|component|ui|tailwind|nextjs|page|layout|frontend|css|style|animation|framer") {
    $toolshed = "frontend"
} elseif ($taskLower -match "api|fastapi|endpoint|route|python|pydantic|langgraph|agent|backend") {
    $toolshed = "backend"
} elseif ($taskLower -match "database|migration|sql|schema|postgres|postgresql|alembic|model|table|column") {
    $toolshed = "database"
} elseif ($taskLower -match "auth|jwt|login|security|rbac|permission|role|oauth|cors|csrf") {
    $toolshed = "security"
} elseif ($taskLower -match "test|spec|playwright|vitest|pytest|e2e|unit|integration") {
    $toolshed = "test"
} elseif ($taskLower -match "bug|fix|broken|error|crash|failing|regression") {
    $toolshed = "debug"
}

# --- Always-Loaded Files ---
$alwaysFiles = @(
    ".claude/memory/CONSTITUTION.md",
    ".claude/memory/current-state.md"
)

# --- Domain-Specific File Mapping ---
$domainFiles = @()
switch ($toolshed) {
    "frontend" {
        $domainFiles = @(
            "apps/web/lib/design-tokens.ts",
            "apps/web/app/layout.tsx",
            "apps/web/tailwind.config.ts"
        )
    }
    "backend" {
        $domainFiles = @(
            "apps/backend/src/api/main.py",
            "apps/backend/src/config/database.py",
            "apps/backend/src/auth/jwt.py"
        )
    }
    "database" {
        $domainFiles = @(
            "scripts/init-db.sql",
            "apps/backend/src/config/database.py",
            "apps/backend/src/db/"
        )
    }
    "security" {
        $domainFiles = @(
            "apps/backend/src/auth/jwt.py",
            "apps/web/middleware.ts",
            "apps/web/lib/api/auth.ts"
        )
    }
    "test" {
        $domainFiles = @(
            "apps/web/playwright.config.ts",
            "apps/web/vitest.config.ts",
            "apps/backend/pytest.ini"
        )
    }
    "debug" {
        # Minimal context — populated by bug-hunter from error message
        $domainFiles = @()
    }
    default {
        $domainFiles = @(
            ".claude/memory/architectural-decisions.md"
        )
    }
}

# Filter to only include files that actually exist
$projectDir = $env:CLAUDE_PROJECT_DIR
if (-not $projectDir) {
    $projectDir = (Get-Location).Path
}

$existingDomainFiles = $domainFiles | Where-Object {
    $fullPath = Join-Path $projectDir $_
    (Test-Path $fullPath)
}

# --- Generate Task ID ---
$dateStr = Get-Date -Format "yyyyMMdd"
$words = ($TaskText -split '\s+' | Select-Object -First 3) -join '-'
$words = $words -replace '[^a-zA-Z0-9-]', '' | ForEach-Object { $_.ToLower() }
$taskId = "minion-$dateStr-$words"

# --- Output JSON Manifest ---
$manifest = @{
    task_id   = $taskId
    blueprint = $blueprint
    toolshed  = $toolshed
    always    = $alwaysFiles
    domain    = @($existingDomainFiles)
    task_text = $TaskText
    generated = (Get-Date -Format "dd/MM/yyyy HH:mm") + " AEST"
} | ConvertTo-Json -Depth 3

Write-Output $manifest
exit 0
