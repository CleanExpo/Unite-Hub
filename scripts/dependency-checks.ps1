# NodeJS-Starter-V1 Dependency Verification Functions (PowerShell)
# Reusable functions for checking dependencies across the pnpm workspace on Windows
# Dot-source this file: . .\scripts\dependency-checks.ps1

# ============================================================================
# Function 1: Test Lockfile Integrity
# ============================================================================
function Test-LockfileIntegrity {
    [CmdletBinding()]
    param()

    $lockfile = "pnpm-lock.yaml"
    $packageJson = "package.json"

    # Check existence
    if (-not (Test-Path $lockfile)) {
        return @{
            Success = $false
            Severity = "Error"
            Message = "Lockfile $lockfile does not exist"
        }
    }

    if (-not (Test-Path $packageJson)) {
        return @{
            Success = $false
            Severity = "Error"
            Message = "$packageJson does not exist"
        }
    }

    # Check YAML validity
    $content = Get-Content $lockfile -Raw
    if ($content -notmatch "lockfileVersion:") {
        return @{
            Success = $false
            Severity = "Error"
            Message = "Lockfile missing lockfileVersion header"
        }
    }

    # Check modification times
    $pkgMtime = (Get-Item $packageJson).LastWriteTime
    $lockMtime = (Get-Item $lockfile).LastWriteTime

    if ($lockMtime -lt $pkgMtime) {
        return @{
            Success = $false
            Severity = "Warning"
            Message = "Lockfile is older than package.json (may be out of sync)"
        }
    }

    return @{ Success = $true }
}

# ============================================================================
# Function 2: Test Dependency Synchronization
# Verifies that declared dependencies are installed with correct versions
# ============================================================================
function Test-DependencySync {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$Workspace
    )

    $packageJson = Join-Path $Workspace "package.json"
    if (-not (Test-Path $packageJson)) {
        return @{
            Success = $false
            Missing = @()
            Mismatched = @()
        }
    }

    try {
        $pkg = Get-Content $packageJson -Raw | ConvertFrom-Json
    }
    catch {
        return @{
            Success = $false
            Missing = @()
            Mismatched = @()
        }
    }

    $deps = @{}

    # Collect all dependencies
    if ($pkg.dependencies) {
        $pkg.dependencies.PSObject.Properties | ForEach-Object {
            $deps[$_.Name] = $_.Value
        }
    }
    if ($pkg.devDependencies) {
        $pkg.devDependencies.PSObject.Properties | ForEach-Object {
            $deps[$_.Name] = $_.Value
        }
    }

    $missing = @()
    $mismatched = @()

    foreach ($dep in $deps.GetEnumerator()) {
        # Skip workspace: dependencies
        if ($dep.Value -like "workspace:*") {
            continue
        }

        # Check installation paths
        $localModulePath = Join-Path $Workspace "node_modules" $dep.Key "package.json"
        $rootModulePath = Join-Path "node_modules" $dep.Key "package.json"

        $installed = $false
        $installedVersion = $null

        # Check local node_modules
        if (Test-Path $localModulePath) {
            try {
                $installedPkg = Get-Content $localModulePath -Raw | ConvertFrom-Json
                $installed = $true
                $installedVersion = $installedPkg.version
            }
            catch {
                # Ignore parse errors
            }
        }

        # Check root node_modules (pnpm hoisting)
        if (-not $installed -and (Test-Path $rootModulePath)) {
            try {
                $installedPkg = Get-Content $rootModulePath -Raw | ConvertFrom-Json
                $installed = $true
                $installedVersion = $installedPkg.version
            }
            catch {
                # Ignore parse errors
            }
        }

        # Report issues
        if (-not $installed) {
            $missing += @{
                Name = $dep.Key
                Version = $dep.Value
            }
        }
        elseif ($installedVersion) {
            # Check for version mismatch
            $declaredClean = $dep.Value -replace '^[\^~>=<]+', ''
            if ($declaredClean -ne "*" -and $declaredClean -ne $installedVersion -and $dep.Value -notlike "*$installedVersion*") {
                $mismatched += @{
                    Name = $dep.Key
                    Declared = $dep.Value
                    Installed = $installedVersion
                }
            }
        }
    }

    return @{
        Success = ($missing.Count -eq 0 -and $mismatched.Count -eq 0)
        Missing = $missing
        Mismatched = $mismatched
    }
}

# ============================================================================
# Function 3: Test for Orphaned Dependencies
# Finds packages in node_modules that aren't declared in package.json
# ============================================================================
function Test-OrphanedDependencies {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$Workspace
    )

    $nodeModules = Join-Path $Workspace "node_modules"
    if (-not (Test-Path $nodeModules)) {
        return @{ Orphaned = @() }
    }

    $packageJson = Join-Path $Workspace "package.json"
    if (-not (Test-Path $packageJson)) {
        return @{ Orphaned = @() }
    }

    try {
        $pkg = Get-Content $packageJson -Raw | ConvertFrom-Json
    }
    catch {
        return @{ Orphaned = @() }
    }

    $declared = @{}

    # Collect declared dependencies
    if ($pkg.dependencies) {
        $pkg.dependencies.PSObject.Properties | ForEach-Object {
            $declared[$_.Name] = $true
        }
    }
    if ($pkg.devDependencies) {
        $pkg.devDependencies.PSObject.Properties | ForEach-Object {
            $declared[$_.Name] = $true
        }
    }

    $orphaned = @()

    # Check all entries in node_modules
    Get-ChildItem $nodeModules -Directory | ForEach-Object {
        $name = $_.Name

        # Skip system directories
        if ($name -like ".*" -or $name -eq ".bin") {
            return
        }

        if ($name -like "@*") {
            # Handle scoped packages
            $scopePath = $_.FullName
            Get-ChildItem $scopePath -Directory | ForEach-Object {
                $scopedName = $_.Name
                if ($scopedName -notlike ".*") {
                    $fullName = "$name/$scopedName"
                    if (-not $declared[$fullName]) {
                        $pkgJsonPath = Join-Path $_.FullName "package.json"
                        if (Test-Path $pkgJsonPath) {
                            try {
                                $mod = Get-Content $pkgJsonPath -Raw | ConvertFrom-Json
                                $orphaned += @{
                                    Name = $fullName
                                    Version = $mod.version
                                }
                            }
                            catch {
                                # Ignore parse errors
                            }
                        }
                    }
                }
            }
        }
        else {
            # Regular package
            if (-not $declared[$name]) {
                $pkgJsonPath = Join-Path $_.FullName "package.json"
                if (Test-Path $pkgJsonPath) {
                    try {
                        $mod = Get-Content $pkgJsonPath -Raw | ConvertFrom-Json
                        $orphaned += @{
                            Name = $name
                            Version = $mod.version
                        }
                    }
                    catch {
                        # Ignore parse errors
                    }
                }
            }
        }
    }

    return @{ Orphaned = $orphaned }
}

# ============================================================================
# Function 4: Test Workspace Consistency
# Detects version conflicts for same package across workspaces
# ============================================================================
function Test-WorkspaceConsistency {
    [CmdletBinding()]
    param()

    $workspaces = @(".", "apps/web", "apps/backend", "packages/shared", "packages/config")
    $depMatrix = @{}

    foreach ($ws in $workspaces) {
        $pkgPath = Join-Path $ws "package.json"

        if (-not (Test-Path $pkgPath)) {
            continue
        }

        try {
            $pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json
        }
        catch {
            continue
        }

        $deps = @{}

        if ($pkg.dependencies) {
            $pkg.dependencies.PSObject.Properties | ForEach-Object {
                $deps[$_.Name] = $_.Value
            }
        }
        if ($pkg.devDependencies) {
            $pkg.devDependencies.PSObject.Properties | ForEach-Object {
                $deps[$_.Name] = $_.Value
            }
        }

        foreach ($dep in $deps.GetEnumerator()) {
            if ($dep.Value -like "workspace:*") {
                continue
            }

            if (-not $depMatrix[$dep.Key]) {
                $depMatrix[$dep.Key] = @()
            }

            $depMatrix[$dep.Key] += @{
                Workspace = $ws
                Version = $dep.Value
            }
        }
    }

    $conflicts = @()
    foreach ($dep in $depMatrix.GetEnumerator()) {
        $versions = @($dep.Value | Select-Object -ExpandProperty Version -Unique)

        if ($versions.Count -gt 1) {
            $conflicts += @{
                Package = $dep.Key
                Versions = $versions
                Usages = $dep.Value
            }
        }
    }

    return @{
        Success = ($conflicts.Count -eq 0)
        Conflicts = $conflicts
    }
}

# ============================================================================
# Module initialization
# ============================================================================
Write-Host "✓ Dependency verification functions loaded" -ForegroundColor Green
Write-Host "Available functions:" -ForegroundColor Cyan
Write-Host "  - Test-LockfileIntegrity" -ForegroundColor Gray
Write-Host "  - Test-DependencySync -Workspace <path>" -ForegroundColor Gray
Write-Host "  - Test-OrphanedDependencies -Workspace <path>" -ForegroundColor Gray
Write-Host "  - Test-WorkspaceConsistency" -ForegroundColor Gray
