# Skills Installation Script for Windows
# Installs skills to Claude Code user directory

$ErrorActionPreference = "Stop"

Write-Host "Skills Installation Script" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

# Define paths
$SkillsDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ClaudeSkillsDir = "$env:USERPROFILE\.claude\skills"

# Create Claude skills directory if it doesn't exist
if (-not (Test-Path $ClaudeSkillsDir)) {
    Write-Host "Creating Claude skills directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $ClaudeSkillsDir -Force | Out-Null
}

# Install Vercel skills
Write-Host "`nInstalling Vercel skills..." -ForegroundColor Green
$VercelSkillsPath = "$SkillsDir\vercel-labs-agent-skills\skills"
if (Test-Path $VercelSkillsPath) {
    $VercelSkills = Get-ChildItem -Path $VercelSkillsPath -Directory
    foreach ($skill in $VercelSkills) {
        $dest = "$ClaudeSkillsDir\$($skill.Name)"
        Write-Host "  - $($skill.Name)" -ForegroundColor Gray
        Copy-Item -Path $skill.FullName -Destination $dest -Recurse -Force
    }
    Write-Host "  Vercel skills installed!" -ForegroundColor Green
} else {
    Write-Host "  Vercel skills not found. Run: git clone https://github.com/vercel-labs/agent-skills.git .skills/vercel-labs-agent-skills" -ForegroundColor Yellow
}

# Install custom skills
Write-Host "`nInstalling custom skills..." -ForegroundColor Green
$CustomSkillsPath = "$SkillsDir\custom"
if (Test-Path $CustomSkillsPath) {
    $CustomSkills = Get-ChildItem -Path $CustomSkillsPath -Directory
    foreach ($skill in $CustomSkills) {
        $dest = "$ClaudeSkillsDir\$($skill.Name)"
        Write-Host "  - $($skill.Name)" -ForegroundColor Gray
        Copy-Item -Path $skill.FullName -Destination $dest -Recurse -Force
    }
    Write-Host "  Custom skills installed!" -ForegroundColor Green
} else {
    Write-Host "  Custom skills directory not found." -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Skills installed to: $ClaudeSkillsDir" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# List installed skills
Write-Host "`nInstalled skills:" -ForegroundColor White
Get-ChildItem -Path $ClaudeSkillsDir -Directory | ForEach-Object {
    Write-Host "  - $($_.Name)" -ForegroundColor Gray
}

Write-Host "`nDone!" -ForegroundColor Green
