# Register-VercelHardDelete.ps1 — fires 2026-05-31 03:45, runs vercel-hard-delete-action.ps1
# which deletes all Vercel projects named _archive_*_2026-05-24.
# MUST be run in elevated PowerShell.

$taskName = "UniteCleanup-VercelDelete-2026-05-31"
$actionScript = "D:\Unite-Hub\.portfolio\schedule\vercel-hard-delete-action.ps1"

if (-not (Test-Path $actionScript)) {
  Write-Error "Action script missing: $actionScript"
  exit 1
}

$action = New-ScheduledTaskAction `
  -Execute "powershell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$actionScript`""

$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date "2026-05-31T03:45:00")
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -RunLevel Highest -LogonType Interactive
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger `
  -Principal $principal -Settings $settings -Force | Out-Null

Write-Output "Registered: $taskName (fires 2026-05-31 03:45)"
Write-Output "Will run: $actionScript"
Write-Output ""
Write-Output "Currently archived projects that will be deleted:"
$listJson = & curl.exe -s --insecure -H ("Authorization: Bearer " + $env:VERCEL_TOKEN) "https://api.vercel.com/v9/projects?teamId=team_KMZACI5rIltoCRhAtGCXlxUf&limit=100" 2>&1
try {
  $projects = ($listJson | ConvertFrom-Json).projects | Where-Object { $_.name -like '_archive_*_2026-05-24' }
  $projects | ForEach-Object { Write-Output ("  - " + $_.name) }
  Write-Output ""
  Write-Output ("Total: " + @($projects).Count)
} catch {
  Write-Warning ("Could not list archived projects: " + $_)
}

Write-Output ""
Write-Output "To cancel: Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false"
