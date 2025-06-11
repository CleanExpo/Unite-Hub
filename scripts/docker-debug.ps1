# Docker Debug Script for Next.js Build Failures (PowerShell Version)
# Implements comprehensive debugging from the Docker build failures guide

param(
    [switch]$SkipBuild,
    [switch]$SkipDocker,
    [string]$Dockerfile = "Dockerfile.resilient"
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Cyan"

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

function Test-Docker {
    Write-Status "Checking Docker installation..."
    
    try {
        $dockerVersion = docker --version
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Docker is running: $dockerVersion"
            return $true
        }
    }
    catch {
        Write-Error "Docker is not installed or not in PATH"
        return $false
    }
    
    try {
        docker info | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Docker daemon is accessible"
            return $true
        }
        else {
            Write-Error "Docker daemon is not running"
            return $false
        }
    }
    catch {
        Write-Error "Docker daemon is not running"
        return $false
    }
}

function Test-NextJsConfig {
    Write-Status "Checking Next.js configuration..."
    
    $configFiles = @("next.config.js", "next.config.mjs", "next.config.ts")
    $foundConfig = $false
    
    foreach ($configFile in $configFiles) {
        if (Test-Path $configFile) {
            Write-Success "Found $configFile"
            $foundConfig = $true
            
            $content = Get-Content $configFile -Raw
            if ($content -match "output.*standalone") {
                Write-Success "✓ Standalone output is configured"
            }
            else {
                Write-Warning "⚠ Standalone output not found in $configFile"
                Write-Host "Add: output: 'standalone' to your $configFile"
            }
            break
        }
    }
    
    if (-not $foundConfig) {
        Write-Warning "No Next.js config file found"
    }
    
    if (Test-Path "next.config.resilient.js") {
        Write-Success "Found resilient configuration"
    }
    else {
        Write-Warning "Resilient configuration not found"
    }
}

function Test-PackageJson {
    Write-Status "Checking package.json..."
    
    if (-not (Test-Path "package.json")) {
        Write-Error "package.json not found!"
        return $false
    }
    
    try {
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        $nextVersion = $packageJson.dependencies.next
        
        if ($nextVersion) {
            Write-Success "Next.js version: $nextVersion"
            
            if ($nextVersion -match "1[5-9]\." -or $nextVersion -match "1[4-9]\." -or $nextVersion -match "1[3-9]\.") {
                Write-Success "✓ Next.js version supports standalone builds"
            }
            else {
                Write-Warning "⚠ Next.js version may not fully support standalone builds"
            }
        }
        else {
            Write-Error "Next.js not found in dependencies"
        }
        
        if ($packageJson.scripts.build) {
            Write-Success "✓ Build script found"
        }
        else {
            Write-Error "No build script found in package.json"
        }
        
        return $true
    }
    catch {
        Write-Error "Failed to parse package.json"
        return $false
    }
}

function Test-Dockerfile {
    param([string]$DockerfilePath)
    
    Write-Status "Analyzing $DockerfilePath..."
    
    if (-not (Test-Path $DockerfilePath)) {
        Write-Error "$DockerfilePath not found!"
        return $false
    }
    
    Write-Success "Found $DockerfilePath"
    
    $content = Get-Content $DockerfilePath -Raw
    
    if ($content -match "FROM.*AS") {
        Write-Success "✓ Multi-stage build detected"
    }
    else {
        Write-Warning "⚠ Single-stage build detected (consider multi-stage for optimization)"
    }
    
    if ($content -match "FROM node:18") {
        Write-Success "✓ Using Node.js 18 (recommended)"
    }
    elseif ($content -match "FROM node:") {
        $nodeMatch = [regex]::Match($content, "FROM node:([^-\s]+)")
        if ($nodeMatch.Success) {
            $nodeVersion = $nodeMatch.Groups[1].Value
            Write-Warning "Using Node.js $nodeVersion (consider upgrading to 18+)"
        }
    }
    
    if ($content -match "alpine") {
        Write-Success "✓ Using Alpine Linux (smaller image size)"
    }
    
    if ($content -match "standalone") {
        Write-Success "✓ Standalone verification present"
    }
    else {
        Write-Warning "⚠ No standalone verification found"
    }
    
    return $true
}

function Test-LocalBuild {
    Write-Status "Testing local build..."
    
    if (Test-Path ".next") {
        Write-Warning "Removing existing .next directory..."
        Remove-Item ".next" -Recurse -Force
    }
    
    Write-Status "Running npm run build..."
    try {
        npm run build
        if ($LASTEXITCODE -eq 0) {
            Write-Success "✓ Local build successful"
            
            if (Test-Path ".next/standalone") {
                Write-Success "✓ Standalone directory created"
                
                if (Test-Path ".next/standalone/server.js") {
                    Write-Success "✓ server.js found"
                    return $true
                }
                else {
                    Write-Error "server.js not found in standalone directory"
                    return $false
                }
            }
            else {
                Write-Error "Standalone directory not created"
                Write-Host "Contents of .next/:"
                if (Test-Path ".next") {
                    Get-ChildItem ".next" | Format-Table -AutoSize
                }
                else {
                    Write-Host "No .next directory"
                }
                return $false
            }
        }
        else {
            Write-Error "Local build failed"
            return $false
        }
    }
    catch {
        Write-Error "Build command failed: $_"
        return $false
    }
}

function Test-DockerBuild {
    param([string]$DockerfilePath)
    
    Write-Status "Testing Docker build with detailed output..."
    
    if (-not (Test-Path $DockerfilePath)) {
        Write-Error "$DockerfilePath not found!"
        return $false
    }
    
    Write-Status "Building with $DockerfilePath..."
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $logFile = "docker-build-$timestamp.log"
    
    try {
        $env:DOCKER_BUILDKIT = "1"
        $buildCommand = "docker build --progress=plain --no-cache -f `"$DockerfilePath`" -t debug-test ."
        
        Write-Status "Running: $buildCommand"
        
        # Execute build and capture output
        Invoke-Expression $buildCommand 2>&1 | Tee-Object -FilePath $logFile
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "✓ Docker build successful"
            
            Write-Status "Testing built image..."
            docker run --rm debug-test ls -la .next/standalone/ 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Success "✓ Standalone files present in image"
                return $true
            }
            else {
                Write-Error "Standalone files missing in image"
                return $false
            }
        }
        else {
            Write-Error "Docker build failed"
            Write-Host "Check the build log: $logFile"
            return $false
        }
    }
    catch {
        Write-Error "Docker build command failed: $_"
        return $false
    }
}

function Get-SystemResources {
    Write-Status "Checking system resources..."
    
    try {
        # Memory info
        $memory = Get-WmiObject -Class Win32_ComputerSystem
        $totalMemory = [math]::Round($memory.TotalPhysicalMemory / 1GB, 2)
        Write-Host "Total Memory: $totalMemory GB"
        
        # Disk space
        $disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'"
        $freeSpace = [math]::Round($disk.FreeSpace / 1GB, 2)
        $totalSpace = [math]::Round($disk.Size / 1GB, 2)
        Write-Host "Disk Space (C:): $freeSpace GB free of $totalSpace GB total"
        
        # Docker info
        Write-Status "Docker system info:"
        docker system df 2>&1
    }
    catch {
        Write-Warning "Could not retrieve all system information: $_"
    }
}

function Show-Recommendations {
    Write-Status "Providing recommendations..."
    
    Write-Host @"

🚀 BUILD TROUBLESHOOTING RECOMMENDATIONS:
=========================================

1. CONFIGURATION FIXES:
   - Ensure next.config.js has: output: 'standalone'
   - Use Next.js 12.1.0+ for standalone support
   - Consider using next.config.resilient.js for Docker builds

2. MEMORY OPTIMIZATION:
   - Increase Docker Desktop memory limit to 6-8GB
   - Use NODE_OPTIONS='--max-old-space-size=6144'
   - Enable webpackMemoryOptimizations in experimental config

3. DOCKER IMPROVEMENTS:
   - Use multi-stage builds (Dockerfile.resilient)
   - Add build verification steps
   - Implement retry logic for dependency installation

4. NUCLEAR OPTIONS (if all else fails):
   - Use Dockerfile.nuclear for maximum compatibility
   - Disable TypeScript/ESLint checking during build
   - Increase memory to 8GB+ and disable caching

5. DEBUGGING COMMANDS (PowerShell):
   npm run build:debug          # Debug local build
   npm run build:nuclear        # Nuclear build option
   npm run docker:build-debug   # Debug Docker build
   npm run verify:standalone    # Verify standalone output

6. WINDOWS-SPECIFIC:
   - Ensure Docker Desktop is running
   - Check Windows file path length limits
   - Verify WSL2 backend is enabled for Docker

"@ -ForegroundColor White
}

# Main execution
function Main {
    Write-Host "🔍 Docker Build Failure Diagnostic Tool (PowerShell)" -ForegroundColor Magenta
    Write-Host "========================================================" -ForegroundColor Magenta
    Write-Host ""
    
    Write-Status "Starting comprehensive Docker build analysis..."
    Write-Host ""
    
    # Check Docker
    if (-not (Test-Docker)) {
        Write-Error "Docker is not available. Please ensure Docker Desktop is installed and running."
        return
    }
    Write-Host ""
    
    # Check Next.js config
    Test-NextJsConfig
    Write-Host ""
    
    # Check package.json
    if (-not (Test-PackageJson)) {
        Write-Error "Critical package.json issues found. Please fix before continuing."
        return
    }
    Write-Host ""
    
    # Check Dockerfile
    Test-Dockerfile "Dockerfile"
    Write-Host ""
    
    if (Test-Path "Dockerfile.resilient") {
        Test-Dockerfile "Dockerfile.resilient"
        Write-Host ""
    }
    
    # System resources
    Get-SystemResources
    Write-Host ""
    
    # Interactive testing
    if (-not $SkipBuild) {
        $response = Read-Host "Do you want to test local build? (y/n)"
        if ($response -eq "y" -or $response -eq "Y") {
            Test-LocalBuild
            Write-Host ""
        }
    }
    
    if (-not $SkipDocker) {
        $response = Read-Host "Do you want to test Docker build? (y/n)"
        if ($response -eq "y" -or $response -eq "Y") {
            Test-DockerBuild $Dockerfile
            Write-Host ""
        }
    }
    
    Show-Recommendations
}

# Run main function
Main
