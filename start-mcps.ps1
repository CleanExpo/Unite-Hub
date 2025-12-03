#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Start MCP servers with automatic Docker image pulling

.DESCRIPTION
    Initializes and starts all MCP services (Filesystem, Process, Database, Git, Gateway)
    Automatically pulls Docker images if not cached locally
    Waits for health checks to pass before confirming startup

.PARAMETER Compose
    Path to docker-compose.yml file (default: ./docker-compose.mcp.yml)

.PARAMETER Pull
    Force pull latest Docker images (default: false)

.PARAMETER Verbose
    Show detailed startup logs
#>

param(
    [string]$Compose = "./docker-compose.mcp.yml",
    [switch]$Pull = $false,
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Stop"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = @{
        "INFO"    = "Green"
        "WARN"    = "Yellow"
        "ERROR"   = "Red"
        "SUCCESS" = "Cyan"
    }[$Level]
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

function Test-DockerInstalled {
    try {
        $version = docker version --format '{{.Server.Version}}' 2>$null
        if ($version) {
            Write-Log "Docker is installed (version: $version)" "SUCCESS"
            return $true
        }
    }
    catch {
        Write-Log "Docker is not installed or not running" "ERROR"
        return $false
    }
}

function Confirm-ComposeFile {
    if (-not (Test-Path $Compose)) {
        Write-Log "docker-compose file not found: $Compose" "ERROR"
        Write-Log "Please ensure docker-compose.mcp.yml exists in the current directory" "WARN"
        exit 1
    }
    Write-Log "Found docker-compose file: $Compose" "SUCCESS"
}

function Pull-Images {
    Write-Log "Pulling latest Docker images..." "INFO"

    try {
        if ($Pull) {
            Write-Log "Force pulling images..." "WARN"
            docker-compose -f $Compose pull --ignore-pull-failures
        }
        else {
            Write-Log "Pulling images (skipping if cached)..." "INFO"
            docker-compose -f $Compose pull --ignore-pull-failures 2>$null
        }
        Write-Log "Image pulling completed" "SUCCESS"
    }
    catch {
        Write-Log "Error during image pull: $_" "WARN"
        Write-Log "Continuing with cached images..." "INFO"
    }
}

function Start-Services {
    Write-Log "Starting MCP services..." "INFO"

    try {
        docker-compose -f $Compose up -d --remove-orphans
        Write-Log "Services started successfully" "SUCCESS"
    }
    catch {
        Write-Log "Failed to start services: $_" "ERROR"
        exit 1
    }
}

function Wait-ForHealthChecks {
    Write-Log "Waiting for health checks to pass..." "INFO"

    $maxRetries = 30
    $retryCount = 0
    $allHealthy = $false

    $servers = @{
        "filesystem" = "http://localhost:3100/health"
        "process"    = "http://localhost:3101/health"
        "database"   = "http://localhost:3102/health"
        "git"        = "http://localhost:3103/health"
        "gateway"    = "http://localhost:3200/health"
    }

    while ($retryCount -lt $maxRetries) {
        $healthyCount = 0

        foreach ($server in $servers.GetEnumerator()) {
            try {
                $response = Invoke-WebRequest -Uri $server.Value -TimeoutSec 2 -ErrorAction SilentlyContinue
                if ($response.StatusCode -eq 200) {
                    Write-Log "✓ $($server.Key) is healthy" "SUCCESS"
                    $healthyCount++
                }
                else {
                    Write-Log "✗ $($server.Key) returned status $($response.StatusCode)" "WARN"
                }
            }
            catch {
                if ($Verbose) {
                    Write-Log "✗ $($server.Key) health check failed: $_" "WARN"
                }
            }
        }

        if ($healthyCount -eq $servers.Count) {
            $allHealthy = $true
            break
        }

        $retryCount++
        if ($retryCount -lt $maxRetries) {
            Write-Log "Health check progress: $healthyCount/$($servers.Count) services ready (retry $retryCount/$maxRetries)" "INFO"
            Start-Sleep -Seconds 1
        }
    }

    if ($allHealthy) {
        Write-Log "All services are healthy!" "SUCCESS"
        return $true
    }
    else {
        Write-Log "Some services did not become healthy after $maxRetries attempts" "WARN"
        Write-Log "Run 'docker-compose -f $Compose logs' to see detailed logs" "WARN"
        return $false
    }
}

function Show-GatewayStatus {
    Write-Log "Retrieving MCP gateway status..." "INFO"

    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3200/mcps" -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $mcps = $response.Content | ConvertFrom-Json

            Write-Log "Gateway Status:" "SUCCESS"
            Write-Host "  Port: $($mcps.gateway.port)"
            Write-Host "  Version: $($mcps.gateway.version)"
            Write-Host ""
            Write-Host "Available MCP Servers:" -ForegroundColor Cyan

            foreach ($server in $mcps.servers.PSObject.Properties) {
                $name = $server.Name
                $status = $server.Value.status
                $endpoint = $server.Value.endpoint
                $statusColor = if ($status -eq "healthy") { "Green" } else { "Yellow" }
                Write-Host "  ✓ $name ($status) - $endpoint" -ForegroundColor $statusColor
            }

            Write-Host ""
            Write-Host "Gateway Endpoints:" -ForegroundColor Cyan
            Write-Host "  Health Check: GET http://localhost:3200/health"
            Write-Host "  List MCPs: GET http://localhost:3200/mcps"
            Write-Host "  Proxy Template: /mcp/{server}/*"
        }
    }
    catch {
        Write-Log "Could not retrieve gateway status: $_" "WARN"
    }
}

function Show-NextSteps {
    Write-Log "Next steps:" "INFO"
    Write-Host ""
    Write-Host "1. Configure Claude Code:" -ForegroundColor Cyan
    Write-Host "   - Copy .claude/mcp-docker.json to your Claude Code settings"
    Write-Host "   - Update environment variables if needed"
    Write-Host ""
    Write-Host "2. View logs:" -ForegroundColor Cyan
    Write-Host "   docker-compose -f $Compose logs -f"
    Write-Host ""
    Write-Host "3. Stop services:" -ForegroundColor Cyan
    Write-Host "   docker-compose -f $Compose down"
    Write-Host ""
    Write-Host "4. Check individual service health:" -ForegroundColor Cyan
    Write-Host "   curl http://localhost:3200/mcps"
    Write-Host ""
}

function Stop-OnExit {
    $response = Read-Host "Stop MCP services on exit? (y/n)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Write-Log "Stopping services..." "INFO"
        docker-compose -f $Compose down
        Write-Log "Services stopped" "SUCCESS"
    }
}

# Main execution
Write-Log "=== Unite-Hub MCP Server Startup ===" "INFO"
Write-Log "Docker Compose file: $Compose" "INFO"
Write-Log ""

# Verify prerequisites
if (-not (Test-DockerInstalled)) {
    Write-Log "Docker Desktop must be running. Please start Docker and try again." "ERROR"
    exit 1
}

Confirm-ComposeFile

# Pull and start
Pull-Images
Start-Services

# Wait for health
Write-Log ""
if (Wait-ForHealthChecks) {
    Write-Log ""
    Show-GatewayStatus
    Write-Log ""
    Show-NextSteps

    Write-Log "MCP servers are ready for Claude Code!" "SUCCESS"
    Write-Log "Press Ctrl+C to stop" "WARN"

    # Keep running
    try {
        while ($true) {
            Start-Sleep -Seconds 60
        }
    }
    catch [System.OperationCanceledException] {
        Write-Log ""
        Stop-OnExit
    }
}
else {
    Write-Log "MCP servers failed to become healthy" "ERROR"
    Write-Log "Check docker-compose logs for details:" "WARN"
    Write-Host "docker-compose -f $Compose logs" -ForegroundColor Yellow
    exit 1
}
