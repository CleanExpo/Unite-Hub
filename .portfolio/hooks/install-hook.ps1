# install-hook.ps1 — installs alias-guard.ps1 into ~/.claude/settings.json. Idempotent.
# Used by bootstrap.ps1 on new machines.

$settings = "$HOME\.claude\settings.json"

if (-not (Test-Path $settings)) {
  New-Item -ItemType Directory -Force -Path (Split-Path $settings -Parent) | Out-Null
  '{"hooks":{}}' | Out-File $settings -Encoding utf8
}

$config = Get-Content $settings -Raw | ConvertFrom-Json
if (-not $config.hooks) {
  $config | Add-Member -NotePropertyName hooks -NotePropertyValue ([PSCustomObject]@{}) -Force
}
if (-not $config.hooks.PreToolUse) {
  $config.hooks | Add-Member -NotePropertyName PreToolUse -NotePropertyValue @() -Force
}

$ourHook = [PSCustomObject]@{
  matcher = "Bash|PowerShell|Write"
  hooks = @(
    [PSCustomObject]@{
      type    = "command"
      command = 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "D:\Unite-Hub\.portfolio\hooks\alias-guard.ps1"'
    }
  )
}

# Idempotent
$alreadyPresent = $false
foreach ($entry in @($config.hooks.PreToolUse)) {
  foreach ($h in @($entry.hooks)) {
    if ($h.command -and $h.command.Contains("alias-guard.ps1")) { $alreadyPresent = $true; break }
  }
  if ($alreadyPresent) { break }
}

if ($alreadyPresent) {
  Write-Output "Hook already present"
} else {
  $config.hooks.PreToolUse = @(@($config.hooks.PreToolUse) + $ourHook)
  $config | ConvertTo-Json -Depth 20 | Out-File $settings -Encoding utf8
  Write-Output "Hook installed"
}
