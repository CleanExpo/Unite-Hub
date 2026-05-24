# Register-VercelHardDelete.ps1 — fires 2026-05-31 03:45, deletes all Vercel projects
# whose name starts with "_archive_" and ends with "_2026-05-24".
# MUST be run in elevated PowerShell.

$taskName = "UniteCleanup-VercelDelete-2026-05-31"
$pattern  = "_archive_*_2026-05-24"

# Inline command run by the scheduled task (PowerShell single-line).
# IMPORTANT: $env:VERCEL_TOKEN must be set in the user's environment for this
# to authenticate on fire time. Verify with: echo $env:VERCEL_TOKEN
$cmd = @'
$ErrorActionPreference='Continue'
$tok = $env:VERCEL_TOKEN
if (-not $tok) { Add-Content 'D:\_archive\vercel-hard-delete.log' -Value ((Get-Date).ToString() + ' ABORT: no VERCEL_TOKEN'); exit 1 }
$team='team_KMZACI5rIltoCRhAtGCXlxUf'
try {
  $resp = Invoke-WebRequest -Uri ('https://api.vercel.com/v9/projects?teamId=' + $team + '&limit=100') -Headers @{Authorization='Bearer '+$tok} -SkipCertificateCheck -UseBasicParsing
  $projects = ($resp.Content | ConvertFrom-Json).projects | Where-Object { $_.name -like '_archive_*_2026-05-24' }
  foreach ($p in $projects) {
    try {
      Invoke-WebRequest -Uri ('https://api.vercel.com/v9/projects/' + $p.id + '?teamId=' + $team) -Method DELETE -Headers @{Authorization='Bearer '+$tok} -SkipCertificateCheck -UseBasicParsing | Out-Null
      Add-Content 'D:\_archive\vercel-hard-delete.log' -Value ((Get-Date).ToString() + ' deleted ' + $p.name + ' (' + $p.id + ')')
    } catch {
      Add-Content 'D:\_archive\vercel-hard-delete.log' -Value ((Get-Date).ToString() + ' FAILED ' + $p.name + ' : ' + $_.Exception.Message)
    }
  }
} catch {
  Add-Content 'D:\_archive\vercel-hard-delete.log' -Value ((Get-Date).ToString() + ' LIST FAILED: ' + $_.Exception.Message)
}
'@

$action = New-ScheduledTaskAction -Execute "powershell.exe" `
  -Argument ('-NoProfile -ExecutionPolicy Bypass -Command "' + ($cmd -replace '"','""') + '"')
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date "2026-05-31T03:45:00")
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -RunLevel Highest -LogonType Interactive
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger `
  -Principal $principal -Settings $settings -Force | Out-Null

Write-Output "Registered: $taskName (fires 2026-05-31 03:45)"
Write-Output "Will delete all Vercel projects matching: $pattern"
Write-Output ""
Write-Output "Currently archived projects that will be deleted:"
$resp = Invoke-WebRequest -Uri ('https://api.vercel.com/v9/projects?teamId=team_KMZACI5rIltoCRhAtGCXlxUf&limit=100') -Headers @{Authorization='Bearer '+$env:VERCEL_TOKEN} -SkipCertificateCheck -UseBasicParsing
$projects = ($resp.Content | ConvertFrom-Json).projects | Where-Object { $_.name -like '_archive_*_2026-05-24' }
$projects | ForEach-Object { Write-Output ("  - " + $_.name) }
Write-Output ""
Write-Output ("Total: " + $projects.Count)
Write-Output ""
Write-Output "To cancel: Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false"
