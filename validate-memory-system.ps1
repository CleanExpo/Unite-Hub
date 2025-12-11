# Validate Claude Memory Management System
Write-Host "=== Claude Memory System Validation ===" -ForegroundColor Green

# Check main CLAUDE.md size
$mainLines = (Get-Content CLAUDE.md | Measure-Object -Line).Lines
Write-Host "Main CLAUDE.md: $mainLines lines (was 300+)" -ForegroundColor Yellow

# List rule files
Write-Host "`nModular rules created:" -ForegroundColor Yellow
Get-ChildItem .claude/rules -Name "*.md"

# Count total lines in rule files
$ruleFiles = Get-ChildItem .claude/rules -Name "*.md"
$totalRuleLines = 0
foreach ($file in $ruleFiles) {
    $lines = (Get-Content ".claude/rules/$file" | Measure-Object -Line).Lines
    Write-Host "  $file`: $lines lines" -ForegroundColor Cyan
    $totalRuleLines += $lines
}

Write-Host "`nTotal rule files: $($ruleFiles.Count)" -ForegroundColor Green
Write-Host "Total rule lines: $totalRuleLines" -ForegroundColor Green
Write-Host "Combined reduction: $($mainLines + $totalRuleLines) lines vs. previous monolithic approach" -ForegroundColor Green

# Validate YAML frontmatter
Write-Host "`nValidating YAML frontmatter:" -ForegroundColor Yellow
$yamlFiles = @()
foreach ($file in $ruleFiles) {
    $content = Get-Content ".claude/rules/$file" -Raw
    if ($content -match '^---\s*\r?\npaths:') {
        $yamlFiles += $file
        Write-Host "  ✓ $file has conditional loading" -ForegroundColor Green
    } else {
        Write-Host "  - $file (always loaded)" -ForegroundColor White
    }
}

Write-Host "`nPath-conditional rules: $($yamlFiles.Count)/$($ruleFiles.Count)" -ForegroundColor Green

# Check imports in main CLAUDE.md
Write-Host "`nValidating imports in main CLAUDE.md:" -ForegroundColor Yellow
$mainContent = Get-Content CLAUDE.md -Raw
$importCount = ([regex]::Matches($mainContent, '@\.claude/rules/')).Count
Write-Host "  Import references found: $importCount" -ForegroundColor Green

Write-Host "`n=== Validation Complete ===" -ForegroundColor Green
