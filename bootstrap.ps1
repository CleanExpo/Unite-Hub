# bootstrap.ps1 — set up a machine for the Unite-Group portfolio.
# Idempotent. Run with: & D:\Unite-Hub\bootstrap.ps1
#
# Prerequisites: git, node (in PATH), Claude Code (optional — hook install skipped if missing)
#
# Steps:
# 1. Sanity check location
# 2. Read PORTFOLIO.yaml via node
# 3. For each active product with local.canonical_path: clone if missing
# 4. For each active product: create junction D:\Unite-Group\<name> -> canonical
# 5. Install alias-guard hook into ~/.claude/settings.json (if Claude Code installed)
# 6. Verify Hermes (if present)

$ErrorActionPreference = 'Stop'

Write-Output "Unite-Group portfolio bootstrap starting..."
Write-Output ""

# 1. Sanity check
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
if ($here -ne "D:\Unite-Hub" -and -not $here.StartsWith("D:\Unite-Hub\")) {
  Write-Warning "bootstrap.ps1 should live in D:\Unite-Hub. Current: $here"
}

# 2. Read registry
$registryPath = "D:\Unite-Hub\.portfolio\PORTFOLIO.yaml"
if (-not (Test-Path $registryPath)) {
  Write-Error "Registry not found at $registryPath."
  exit 1
}

$nodeModules = "D:\Unite-Hub\.portfolio\node_modules\yaml"
if (-not (Test-Path $nodeModules)) {
  Write-Output "Installing registry deps..."
  Push-Location "D:\Unite-Hub\.portfolio"
  & npm install --silent 2>&1 | Out-Null
  Pop-Location
}

$regPathFwd = $registryPath -replace '\\','/'
$json = & node -e "const fs=require('fs'); const y=require('D:/Unite-Hub/.portfolio/node_modules/yaml'); console.log(JSON.stringify(y.parse(fs.readFileSync('$regPathFwd','utf8'))))"
$registry = $json | ConvertFrom-Json
Write-Output "Registry: $($registry.products.Count) products"
Write-Output ""

# 3. Create parent
New-Item -ItemType Directory -Force -Path "D:\Unite-Group" | Out-Null

# 4. Per-product clone + junction
foreach ($p in $registry.products) {
  if ($p.status -ne "active") { continue }
  $name = $p.canonical_name
  $canon = $p.local.canonical_path
  $access = $p.local.access_via

  Write-Output "[$name]"

  if ($canon -and -not (Test-Path $canon)) {
    if ($p.github -and $p.github.url) {
      Write-Output "  cloning $($p.github.url) -> $canon"
      & git clone $p.github.url $canon 2>&1 | Out-Null
    } else {
      Write-Output "  skip (no github url and canonical_path missing)"
      continue
    }
  } elseif ($canon) {
    Write-Output "  canonical exists: $canon"
  } else {
    Write-Output "  no canonical_path defined"
    continue
  }

  if ($access -and ($access -ne $canon)) {
    if (Test-Path $access) {
      $item = Get-Item $access -Force
      if ($item.LinkType -ne "Junction") {
        Write-Warning "  $access exists but is not a junction"
      } else {
        Write-Output "  junction exists: $access -> $($item.Target)"
      }
    } else {
      New-Item -ItemType Junction -Path $access -Target $canon | Out-Null
      Write-Output "  junction created: $access -> $canon"
    }
  }
}

Write-Output ""
Write-Output "[Alias-guard hook]"
if (Test-Path "$HOME\.claude") {
  $hookInstaller = "D:\Unite-Hub\.portfolio\hooks\install-hook.ps1"
  if (Test-Path $hookInstaller) {
    & $hookInstaller
  } else {
    Write-Output "  install-hook.ps1 missing"
  }
} else {
  Write-Output "  Claude Code not installed (no ~/.claude/) — skip"
}

Write-Output ""
Write-Output "[Hermes wiki]"
if (Test-Path "D:\Hermes\wiki") {
  if ($env:WIKI_PATH -eq "D:\Hermes\wiki") {
    Write-Output "  WIKI_PATH OK"
  } else {
    Write-Warning "  WIKI_PATH not set to D:\Hermes\wiki (current: $env:WIKI_PATH)"
  }
} else {
  Write-Output "  Hermes not present — skip"
}

Write-Output ""
Write-Output "Bootstrap complete."
