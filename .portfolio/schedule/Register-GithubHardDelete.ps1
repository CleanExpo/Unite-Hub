# Register-GithubHardDelete.ps1 — fires 2026-05-31 03:30, deletes the 2 archived junk repos.
# MUST be run in elevated PowerShell.
#
# IMPORTANT: gh CLI must be authenticated under the user that runs this scheduled task.
# Principal below uses $env:USERNAME so it runs as the current user (gh auth applies).

$taskName = "UniteCleanup-GithubDelete-2026-05-31"
$repos = @(
  "_archived_Downunder-Miles_2026-05-24",
  "_archived_abacus_crypto_intelligence_2026-05-24"
)

$cmd = ""
foreach ($r in $repos) {
  $cmd += "gh repo delete CleanExpo/$r --yes; "
}
$cmd += "Add-Content 'D:\_archive\github-hard-delete.log' -Value ((Get-Date).ToString() + ' deleted: ' + ($repos -join ', '))"

$action = New-ScheduledTaskAction -Execute "powershell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -Command `"$cmd`""
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date "2026-05-31T03:30:00")
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -RunLevel Highest -LogonType Interactive
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger `
  -Principal $principal -Settings $settings -Force | Out-Null

Write-Output "Registered: $taskName (fires 2026-05-31 03:30)"
Write-Output "Targets:"
$repos | ForEach-Object { Write-Output "  CleanExpo/$_" }
Write-Output ""
Write-Output "To cancel: Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false"
