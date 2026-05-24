# User Prompt Compass Injector for Claude Code
# Triggered before every user message (UserPromptSubmit hook).
# Injects the compass.md contents as additionalContext — keeps critical rules
# alive between messages without consuming significant token budget (~100 tokens).

$ErrorActionPreference = "SilentlyContinue"

# Locate compass.md relative to project directory
$projectDir = $env:CLAUDE_PROJECT_DIR
if (-not $projectDir) {
    $projectDir = Get-Location
}

$compassPath = "$projectDir\.claude\memory\compass.md"

# Gracefully degrade if compass not found
if (-not (Test-Path $compassPath)) {
    # Output empty context — never error, never block the conversation
    $output = @{
        hookSpecificOutput = @{
            hookEventName = "UserPromptSubmit"
            additionalContext = ""
        }
    } | ConvertTo-Json -Depth 3 -Compress

    Write-Output $output
    exit 0
}

# Read compass contents
$compass = Get-Content $compassPath -Raw -ErrorAction SilentlyContinue

if (-not $compass) {
    $output = @{
        hookSpecificOutput = @{
            hookEventName = "UserPromptSubmit"
            additionalContext = ""
        }
    } | ConvertTo-Json -Depth 3 -Compress

    Write-Output $output
    exit 0
}

# Trim whitespace and build context
$compassTrimmed = $compass.Trim()

$output = @{
    hookSpecificOutput = @{
        hookEventName = "UserPromptSubmit"
        additionalContext = "COMPASS: $compassTrimmed"
    }
} | ConvertTo-Json -Depth 3 -Compress

Write-Output $output
exit 0
