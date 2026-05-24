# Mirror-ToHermes.ps1 — copies PORTFOLIO.yaml to Hermes wiki
# Hermes wiki SSOT path: D:\Hermes\wiki\entities\portfolio\
$src  = "D:\Unite-Hub\.portfolio\PORTFOLIO.yaml"
$dest = "D:\Hermes\wiki\entities\portfolio\PORTFOLIO.yaml"
$destDir = Split-Path $dest -Parent

if (-not (Test-Path "D:\Hermes")) {
  Write-Warning "Hermes not present at D:\Hermes — skipping mirror (this is OK on machines without Hermes)"
  exit 0
}

New-Item -ItemType Directory -Force -Path $destDir | Out-Null
Copy-Item -Path $src -Destination $dest -Force

# Add a header banner so editors know not to hand-edit this copy
$banner = @"
# >>> AUTO-GENERATED MIRROR — DO NOT EDIT HERE <<<
# Edit only: D:\Unite-Hub\.portfolio\PORTFOLIO.yaml
# Last sync: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

"@
$existing = Get-Content $dest -Raw
$banner + $existing | Out-File -FilePath $dest -Encoding utf8

Write-Output "Mirrored to $dest"
