# Move-ToArchive.ps1 — safe archive of a top-level D:\ folder
# Performs pre-checks, moves to D:\_archive\2026-05-24\, places MOVED.txt
# breadcrumb, appends to cleanup log. Idempotent.
#
# Usage:
#   . .\Move-ToArchive.ps1
#   Move-ToArchive -Path 'D:\unite-group-app' -CanonicalReplacement 'D:\Unite-Hub'

function Move-ToArchive {
  [CmdletBinding(SupportsShouldProcess=$true)]
  param(
    [Parameter(Mandatory)][string]$Path,
    [Parameter(Mandatory)][string]$CanonicalReplacement,
    [string]$ArchiveRoot = "D:\_archive\2026-05-24",
    [string]$LogFile = "D:\_archive\2026-05-24\_cleanup-log.md",
    [switch]$Force
  )

  if (-not (Test-Path $Path)) {
    Write-Warning "Path does not exist: $Path (already archived?)"
    return
  }

  # Pre-checks for git repos
  if (Test-Path "$Path\.git") {
    Push-Location $Path
    $dirty   = (git status --porcelain 2>$null | Measure-Object).Lines
    $unpush  = (git log --branches --not --remotes --oneline 2>$null | Measure-Object).Lines
    $branch  = git branch --show-current 2>$null
    $remote  = git config --get remote.origin.url 2>$null
    Pop-Location
    if ($dirty -gt 0 -and -not $Force) {
      throw "REFUSING: $Path has $dirty uncommitted files. Commit or stash first, or pass -Force."
    }
    if ($unpush -gt 0 -and -not $Force) {
      throw "REFUSING: $Path has $unpush unpushed commits. Push first, or pass -Force."
    }
  } else { $dirty=0; $unpush=0; $branch=""; $remote="" }

  $name = Split-Path $Path -Leaf
  $flat = ($Path -replace '[:\\]', '_' -replace '\s+', '_').TrimStart('_')
  $destDir = Join-Path $ArchiveRoot $flat

  if (Test-Path $destDir) {
    if (-not $Force) { throw "REFUSING: archive destination already exists: $destDir (pass -Force to overwrite)" }
    Remove-Item $destDir -Recurse -Force
  }

  $size = "{0:N1} MB" -f (((Get-ChildItem $Path -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum) / 1MB)
  $lastWrite = (Get-Item $Path).LastWriteTime.ToString('yyyy-MM-dd HH:mm')

  if ($PSCmdlet.ShouldProcess($Path, "Move to $destDir")) {
    Move-Item -Path $Path -Destination $destDir -Force

    $movedTxt = @"
This folder was archived 2026-05-24.
Canonical path: $CanonicalReplacement
See D:\_archive\2026-05-24\_cleanup-log.md for rollback.
"@
    New-Item -ItemType Directory -Force -Path $Path | Out-Null
    $movedTxt | Out-File -FilePath (Join-Path $Path "MOVED.txt") -Encoding utf8

    $logEntry = @"

### $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') — $Path
- **Action:** Move-ToArchive
- **Size:** $size
- **Last modified:** $lastWrite
- **Git remote:** $remote
- **Branch:** $branch
- **Dirty files (forced):** $dirty
- **Unpushed commits (forced):** $unpush
- **Archive destination:** $destDir
- **Breadcrumb:** $Path\MOVED.txt
- **Rollback:** ``Remove-Item '$Path' -Recurse -Force; Move-Item '$destDir' '$Path'``

"@
    Add-Content -Path $LogFile -Value $logEntry -Encoding utf8
    Write-Output "Archived: $Path -> $destDir"
  }
}
