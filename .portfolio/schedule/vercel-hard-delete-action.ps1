# vercel-hard-delete-action.ps1 — the actual deletion logic, invoked by the
# scheduled task. Kept as a separate file so the scheduled-task registration
# doesn't have to embed quoted PowerShell. Logs to D:\_archive\vercel-hard-delete.log.

$ErrorActionPreference = 'Continue'
$logFile = 'D:\_archive\vercel-hard-delete.log'

# Windows PowerShell 5.1 — bypass SSL cert validation (machine has cert inspection)
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12

$tok = $env:VERCEL_TOKEN
if (-not $tok) {
  Add-Content $logFile -Value ((Get-Date).ToString() + ' ABORT: no VERCEL_TOKEN in env at fire time')
  exit 1
}

$team = 'team_KMZACI5rIltoCRhAtGCXlxUf'

try {
  $resp = Invoke-WebRequest `
    -Uri ('https://api.vercel.com/v9/projects?teamId=' + $team + '&limit=100') `
    -Headers @{ Authorization = 'Bearer ' + $tok } `
    -UseBasicParsing

  $projects = ($resp.Content | ConvertFrom-Json).projects |
    Where-Object { $_.name -like '_archive_*_2026-05-24' }

  Add-Content $logFile -Value ((Get-Date).ToString() + ' Found ' + $projects.Count + ' projects matching _archive_*_2026-05-24')

  foreach ($p in $projects) {
    try {
      Invoke-WebRequest `
        -Uri ('https://api.vercel.com/v9/projects/' + $p.id + '?teamId=' + $team) `
        -Method DELETE `
        -Headers @{ Authorization = 'Bearer ' + $tok } `
        -UseBasicParsing | Out-Null
      Add-Content $logFile -Value ((Get-Date).ToString() + ' deleted ' + $p.name + ' (' + $p.id + ')')
    } catch {
      Add-Content $logFile -Value ((Get-Date).ToString() + ' FAILED ' + $p.name + ' : ' + $_.Exception.Message)
    }
  }
} catch {
  Add-Content $logFile -Value ((Get-Date).ToString() + ' LIST FAILED: ' + $_.Exception.Message)
  exit 1
}
