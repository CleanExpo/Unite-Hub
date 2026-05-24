# Register-HardDelete.ps1 — installs Windows scheduled task that hard-deletes
# the 2026-05-24 archive on 2026-05-31 at 03:00 local time.
# Cancellable: Unregister-ScheduledTask -TaskName UniteCleanup-2026-05-31 -Confirm:$false
#
# MUST be run in elevated PowerShell.

$taskName = "UniteCleanup-2026-05-31"
$archivePath = "D:\_archive\2026-05-24"

$action  = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -Command `"if (Test-Path '$archivePath') { Remove-Item '$archivePath' -Recurse -Force; Add-Content 'D:\_archive\hard-delete.log' -Value (Get-Date).ToString() + ' deleted $archivePath' } else { Add-Content 'D:\_archive\hard-delete.log' -Value (Get-Date).ToString() + ' skipped (already gone) $archivePath' }`""

$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date "2026-05-31T03:00:00")
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -RunLevel Highest -LogonType Interactive
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force
Write-Output "Registered: $taskName (fires 2026-05-31 03:00)"
Write-Output "To cancel: Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false"
