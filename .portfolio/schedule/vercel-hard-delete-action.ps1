# vercel-hard-delete-action.ps1 — runs on 2026-05-31 03:45 via scheduled task.
# Deletes all Vercel projects named _archive_*_2026-05-24.
# Uses curl.exe (Windows built-in) with --insecure to bypass SSL inspection.

$ErrorActionPreference = 'Continue'
$logFile = 'D:\_archive\vercel-hard-delete.log'

$tok = $env:VERCEL_TOKEN
if (-not $tok) {
  Add-Content $logFile -Value ((Get-Date).ToString() + ' ABORT: no VERCEL_TOKEN in env at fire time')
  exit 1
}

$team = 'team_KMZACI5rIltoCRhAtGCXlxUf'
$listUrl = "https://api.vercel.com/v9/projects?teamId=$team&limit=100"

# List projects via curl
$listJson = & curl.exe -s --insecure -H "Authorization: Bearer $tok" $listUrl 2>&1
if ($LASTEXITCODE -ne 0) {
  Add-Content $logFile -Value ((Get-Date).ToString() + ' LIST FAILED (curl exit ' + $LASTEXITCODE + '): ' + ($listJson -join ' '))
  exit 1
}

try {
  $list = $listJson | ConvertFrom-Json
} catch {
  Add-Content $logFile -Value ((Get-Date).ToString() + ' LIST PARSE FAILED: ' + $_.Exception.Message)
  exit 1
}

$projects = @($list.projects | Where-Object { $_.name -like '_archive_*_2026-05-24' })
Add-Content $logFile -Value ((Get-Date).ToString() + ' Found ' + $projects.Count + ' projects to delete')

foreach ($p in $projects) {
  $delUrl = "https://api.vercel.com/v9/projects/$($p.id)?teamId=$team"
  $delRes = & curl.exe -s --insecure -X DELETE -H "Authorization: Bearer $tok" -w "%{http_code}" $delUrl 2>&1
  $httpCode = ($delRes | Select-Object -Last 1)
  if ($httpCode -match '^(200|202|204)$') {
    Add-Content $logFile -Value ((Get-Date).ToString() + ' deleted ' + $p.name + ' (' + $p.id + ') HTTP ' + $httpCode)
  } else {
    Add-Content $logFile -Value ((Get-Date).ToString() + ' FAILED ' + $p.name + ' (' + $p.id + ') HTTP ' + $httpCode + ' response: ' + ($delRes -join ' '))
  }
}

Add-Content $logFile -Value ((Get-Date).ToString() + ' Run complete')
