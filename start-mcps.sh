#!/bin/bash

##############################################################################
# Start MCP servers with automatic Docker image pulling
#
# Usage:
#   ./start-mcps.sh [OPTIONS]
#
# Options:
#   -c, --compose FILE    Path to docker-compose file (default: docker-compose.mcp.yml)
#   -p, --pull            Force pull latest Docker images
#   -v, --verbose         Show detailed startup logs
#   -h, --help            Show this help message
##############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.mcp.yml"
FORCE_PULL=false
VERBOSE=false
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--compose)
            COMPOSE_FILE="$2"
            shift 2
            ;;
        -p|--pull)
            FORCE_PULL=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            grep "^#" "$0" | tail -n +2 | sed 's/^# *//'
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Logging functions
log_info() {
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${GREEN}[$timestamp] [INFO]${NC} $1"
}

log_warn() {
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${YELLOW}[$timestamp] [WARN]${NC} $1"
}

log_error() {
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${RED}[$timestamp] [ERROR]${NC} $1"
}

log_success() {
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${CYAN}[$timestamp] [SUCCESS]${NC} $1"
}

# Check Docker installation
test_docker_installed() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        return 1
    fi

    if ! docker version &> /dev/null; then
        log_error "Docker is not running"
        return 1
    fi

    local version=$(docker version --format '{{.Server.Version}}')
    log_success "Docker is installed (version: $version)"
    return 0
}

# Verify compose file exists
confirm_compose_file() {
    if [[ ! -f "$COMPOSE_FILE" ]]; then
        log_error "docker-compose file not found: $COMPOSE_FILE"
        log_warn "Please ensure $COMPOSE_FILE exists in the current directory"
        return 1
    fi
    log_success "Found docker-compose file: $COMPOSE_FILE"
    return 0
}

# Pull Docker images
pull_images() {
    log_info "Pulling latest Docker images..."

    if [[ "$FORCE_PULL" == true ]]; then
        log_warn "Force pulling images..."
        docker-compose -f "$COMPOSE_FILE" pull --ignore-pull-failures
    else
        log_info "Pulling images (skipping if cached)..."
        docker-compose -f "$COMPOSE_FILE" pull --ignore-pull-failures 2>/dev/null || true
    fi

    log_success "Image pulling completed"
}

# Start services
start_services() {
    log_info "Starting MCP services..."

    if ! docker-compose -f "$COMPOSE_FILE" up -d --remove-orphans; then
        log_error "Failed to start services"
        return 1
    fi

    log_success "Services started successfully"
    return 0
}

# Wait for health checks
wait_for_healthchecks() {
    log_info "Waiting for health checks to pass..."

    local max_retries=30
    local retry_count=0
    local all_healthy=false

    declare -A servers=(
        ["filesystem"]="http://localhost:3100/health"
        ["process"]="http://localhost:3101/health"
        ["database"]="http://localhost:3102/health"
        ["git"]="http://localhost:3103/health"
        ["gateway"]="http://localhost:3200/health"
    )

    while [[ $retry_count -lt $max_retries ]]; do
        local healthy_count=0

        for server_name in "${!servers[@]}"; do
            local url="${servers[$server_name]}"

            if curl -sf "$url" > /dev/null 2>&1; then
                log_success "✓ $server_name is healthy"
                ((healthy_count++))
            else
                if [[ "$VERBOSE" == true ]]; then
                    log_warn "✗ $server_name health check failed"
                fi
            fi
        done

        if [[ $healthy_count -eq ${#servers[@]} ]]; then
            all_healthy=true
            break
        fi

        ((retry_count++))
        if [[ $retry_count -lt $max_retries ]]; then
            log_info "Health check progress: $healthy_count/${#servers[@]} services ready (retry $retry_count/$max_retries)"
            sleep 1
        fi
    done

    if [[ "$all_healthy" == true ]]; then
        log_success "All services are healthy!"
        return 0
    else
        log_warn "Some services did not become healthy after $max_retries attempts"
        log_warn "Run 'docker-compose -f $COMPOSE_FILE logs' to see detailed logs"
        return 1
    fi
}

# Show gateway status
show_gateway_status() {
    log_info "Retrieving MCP gateway status..."

    if ! command -v jq &> /dev/null; then
        log_warn "jq not installed, skipping detailed status output"
        return 0
    fi

    local response=$(curl -sf "http://localhost:3200/mcps" 2>/dev/null || echo "{}")

    if [[ -z "$response" ]] || [[ "$response" == "{}" ]]; then
        log_warn "Could not retrieve gateway status"
        return 0
    fi

    log_success "Gateway Status:"
    echo "  Port: $(echo "$response" | jq -r '.gateway.port // "unknown"')"
    echo "  Version: $(echo "$response" | jq -r '.gateway.version // "unknown"')"
    echo ""
    echo -e "${CYAN}Available MCP Servers:${NC}"

    echo "$response" | jq -r '.servers | to_entries[] | .key as $name | .value | "  ✓ \($name) (\(.status // "unknown")) - \(.endpoint // "unknown")"' | while read line; do
        echo -e "$line"
    done

    echo ""
    echo -e "${CYAN}Gateway Endpoints:${NC}"
    echo "  Health Check: GET http://localhost:3200/health"
    echo "  List MCPs: GET http://localhost:3200/mcps"
    echo "  Proxy Template: /mcp/{server}/*"
}

# Show next steps
show_next_steps() {
    log_info "Next steps:"
    echo ""
    echo -e "${CYAN}1. Configure Claude Code:${NC}"
    echo "   - Copy .claude/mcp-docker.json to your Claude Code settings"
    echo "   - Update environment variables if needed"
    echo ""
    echo -e "${CYAN}2. View logs:${NC}"
    echo "   docker-compose -f $COMPOSE_FILE logs -f"
    echo ""
    echo -e "${CYAN}3. Stop services:${NC}"
    echo "   docker-compose -f $COMPOSE_FILE down"
    echo ""
    echo -e "${CYAN}4. Check individual service health:${NC}"
    echo "   curl http://localhost:3200/mcps"
    echo ""
}

# Cleanup on exit
cleanup() {
    read -p "Stop MCP services on exit? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Stopping services..."
        docker-compose -f "$COMPOSE_FILE" down
        log_success "Services stopped"
    fi
}

# Main execution
main() {
    log_info "=== Unite-Hub MCP Server Startup ==="
    log_info "Docker Compose file: $COMPOSE_FILE"
    echo ""

    # Verify prerequisites
    if ! test_docker_installed; then
        log_error "Docker Desktop must be running. Please start Docker and try again."
        exit 1
    fi

    if ! confirm_compose_file; then
        exit 1
    fi

    # Pull and start
    pull_images
    if ! start_services; then
        exit 1
    fi

    # Wait for health
    echo ""
    if wait_for_healthchecks; then
        echo ""
        show_gateway_status
        echo ""
        show_next_steps

        log_success "MCP servers are ready for Claude Code!"
        log_warn "Press Ctrl+C to stop"

        # Set cleanup trap
        trap cleanup EXIT

        # Keep running
        while true; do
            sleep 60
        done
    else
        log_error "MCP servers failed to become healthy"
        log_warn "Check docker-compose logs for details:"
        echo -e "${YELLOW}docker-compose -f $COMPOSE_FILE logs${NC}"
        exit 1
    fi
}

# Run main function
main "$@"
