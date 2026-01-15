#!/bin/bash
# Blue-Green Deployment Script for Unite-Hub
# Performs zero-downtime deployments using Docker Compose
#
# USAGE:
#   ./scripts/deploy-blue-green.sh [blue|green] [options]
#
# OPTIONS:
#   --dry-run          Show what would be done without executing
#   --skip-tests       Skip health checks (not recommended)
#   --force            Force deployment even if health checks fail
#   --rollback         Rollback to previous deployment
#   --version VERSION  Deploy specific version (default: latest)
#
# EXAMPLES:
#   ./scripts/deploy-blue-green.sh blue
#   ./scripts/deploy-blue-green.sh green --version v1.2.3
#   ./scripts/deploy-blue-green.sh blue --dry-run
#   ./scripts/deploy-blue-green.sh --rollback

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.production.yml"
HEALTH_CHECK_URL="http://localhost:3000/api/health/system"
HEALTH_CHECK_TIMEOUT=60  # seconds
HEALTH_CHECK_INTERVAL=5  # seconds

# Parse arguments
DEPLOYMENT_SLOT=""
DRY_RUN=false
SKIP_TESTS=false
FORCE=false
ROLLBACK=false
VERSION="latest"

while [[ $# -gt 0 ]]; do
  case $1 in
    blue|green)
      DEPLOYMENT_SLOT="$1"
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --skip-tests)
      SKIP_TESTS=true
      shift
      ;;
    --force)
      FORCE=true
      shift
      ;;
    --rollback)
      ROLLBACK=true
      shift
      ;;
    --version)
      VERSION="$2"
      shift 2
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Helper functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Detect current active slot
detect_active_slot() {
  if docker ps --filter "name=unite-hub-blue" --filter "status=running" | grep -q unite-hub-blue; then
    if docker ps --filter "name=unite-hub-green" --filter "status=running" | grep -q unite-hub-green; then
      echo "both"
    else
      echo "blue"
    fi
  elif docker ps --filter "name=unite-hub-green" --filter "status=running" | grep -q unite-hub-green; then
    echo "green"
  else
    echo "none"
  fi
}

# Determine target slot
determine_target_slot() {
  local current_slot=$(detect_active_slot)

  if [ "$ROLLBACK" = true ]; then
    log_info "Rollback mode - determining previous slot"
    if [ "$current_slot" = "blue" ]; then
      echo "green"
    elif [ "$current_slot" = "green" ]; then
      echo "blue"
    else
      log_error "No active deployment to rollback from"
      exit 1
    fi
  elif [ -n "$DEPLOYMENT_SLOT" ]; then
    echo "$DEPLOYMENT_SLOT"
  else
    # Auto-detect target slot (opposite of current)
    if [ "$current_slot" = "blue" ]; then
      echo "green"
    elif [ "$current_slot" = "green" ]; then
      echo "blue"
    else
      echo "blue"  # Default to blue if nothing is running
    fi
  fi
}

# Health check function
perform_health_check() {
  local slot=$1
  local port

  if [ "$slot" = "blue" ]; then
    port=3008
  else
    port=3009
  fi

  local url="http://localhost:${port}/api/health"
  local elapsed=0

  log_info "Performing health check on ${slot} slot (port ${port})..."

  while [ $elapsed -lt $HEALTH_CHECK_TIMEOUT ]; do
    if curl -sf "$url" > /dev/null 2>&1; then
      log_success "Health check passed for ${slot} slot"
      return 0
    fi

    sleep $HEALTH_CHECK_INTERVAL
    elapsed=$((elapsed + HEALTH_CHECK_INTERVAL))
    echo -n "."
  done

  echo ""
  log_error "Health check failed for ${slot} slot after ${HEALTH_CHECK_TIMEOUT}s"

  if [ "$FORCE" = true ]; then
    log_warn "Continuing deployment despite failed health check (--force flag)"
    return 0
  else
    return 1
  fi
}

# Update nginx configuration
update_nginx_config() {
  local target_slot=$1

  log_info "Updating nginx configuration to route traffic to ${target_slot}..."

  if [ "$DRY_RUN" = true ]; then
    log_info "[DRY RUN] Would update nginx.conf to point to ${target_slot}"
    return 0
  fi

  # Backup current nginx config
  cp nginx/nginx.conf nginx/nginx.conf.backup

  # Update upstream configuration
  local target_port
  if [ "$target_slot" = "blue" ]; then
    target_port=3008
  else
    target_port=3009
  fi

  # Replace upstream server in nginx.conf
  sed -i.bak "s/server unite-hub-[a-z]*:3000;/server unite-hub-${target_slot}:3000;/g" nginx/nginx.conf

  # Reload nginx
  docker-compose -f $COMPOSE_FILE exec nginx-lb nginx -s reload

  log_success "Nginx configuration updated to ${target_slot}"
}

# Main deployment function
deploy() {
  local target_slot=$1
  local container_name="unite-hub-${target_slot}"

  log_info "==================== Blue-Green Deployment ===================="
  log_info "Target slot: ${target_slot}"
  log_info "Version: ${VERSION}"
  log_info "Dry run: ${DRY_RUN}"
  log_info "=============================================================="

  # Step 1: Build new image
  log_info "Step 1: Building new image..."
  if [ "$DRY_RUN" = true ]; then
    log_info "[DRY RUN] Would build: docker-compose -f $COMPOSE_FILE build $container_name"
  else
    docker-compose -f $COMPOSE_FILE build $container_name
    log_success "Image built successfully"
  fi

  # Step 2: Deploy to target slot
  log_info "Step 2: Deploying to ${target_slot} slot..."
  if [ "$DRY_RUN" = true ]; then
    log_info "[DRY RUN] Would deploy: docker-compose -f $COMPOSE_FILE up -d $container_name"
  else
    docker-compose -f $COMPOSE_FILE up -d $container_name
    log_success "Container started: $container_name"
  fi

  # Step 3: Health check
  if [ "$SKIP_TESTS" = false ]; then
    log_info "Step 3: Running health checks..."
    if ! perform_health_check "$target_slot"; then
      log_error "Health check failed. Deployment aborted."
      exit 1
    fi
  else
    log_warn "Skipping health checks (--skip-tests flag)"
  fi

  # Step 4: Update load balancer
  log_info "Step 4: Updating load balancer..."
  update_nginx_config "$target_slot"

  # Step 5: Monitor for 30 seconds
  log_info "Step 5: Monitoring new deployment..."
  if [ "$DRY_RUN" = false ]; then
    sleep 30
    if perform_health_check "$target_slot"; then
      log_success "Deployment stable after 30 seconds"
    else
      log_error "Deployment became unstable"
      exit 1
    fi
  fi

  # Step 6: Stop old slot
  local old_slot
  if [ "$target_slot" = "blue" ]; then
    old_slot="green"
  else
    old_slot="blue"
  fi

  log_info "Step 6: Stopping old ${old_slot} slot..."
  if [ "$DRY_RUN" = true ]; then
    log_info "[DRY RUN] Would stop: docker-compose -f $COMPOSE_FILE stop unite-hub-${old_slot}"
  else
    if docker ps --filter "name=unite-hub-${old_slot}" --filter "status=running" | grep -q "unite-hub-${old_slot}"; then
      docker-compose -f $COMPOSE_FILE stop "unite-hub-${old_slot}"
      log_success "Old ${old_slot} slot stopped"
    else
      log_info "Old ${old_slot} slot was not running"
    fi
  fi

  log_success "==================== Deployment Complete ===================="
  log_success "Active slot: ${target_slot}"
  log_success "Version: ${VERSION}"
  log_success "Nginx routing traffic to: ${target_slot}"
  log_success "=============================================================="
}

# Rollback function
rollback() {
  local current_slot=$(detect_active_slot)
  local target_slot

  if [ "$current_slot" = "blue" ]; then
    target_slot="green"
  elif [ "$current_slot" = "green" ]; then
    target_slot="blue"
  else
    log_error "No active deployment to rollback from"
    exit 1
  fi

  log_warn "==================== Rollback ===================="
  log_warn "Rolling back from ${current_slot} to ${target_slot}"
  log_warn "=============================================="

  # Check if target slot container exists
  if ! docker ps -a --filter "name=unite-hub-${target_slot}" | grep -q "unite-hub-${target_slot}"; then
    log_error "Previous ${target_slot} deployment not found"
    exit 1
  fi

  # Restart target slot
  log_info "Restarting ${target_slot} slot..."
  if [ "$DRY_RUN" = false ]; then
    docker-compose -f $COMPOSE_FILE up -d "unite-hub-${target_slot}"

    # Wait for startup
    sleep 10

    if perform_health_check "$target_slot"; then
      update_nginx_config "$target_slot"
      docker-compose -f $COMPOSE_FILE stop "unite-hub-${current_slot}"
      log_success "Rollback completed successfully"
    else
      log_error "Rollback failed - ${target_slot} slot unhealthy"
      exit 1
    fi
  else
    log_info "[DRY RUN] Would perform rollback to ${target_slot}"
  fi
}

# Main execution
main() {
  # Check prerequisites
  if ! command -v docker-compose &> /dev/null; then
    log_error "docker-compose is not installed"
    exit 1
  fi

  if [ ! -f "$COMPOSE_FILE" ]; then
    log_error "Compose file not found: $COMPOSE_FILE"
    exit 1
  fi

  # Determine target slot
  if [ "$ROLLBACK" = true ]; then
    rollback
  else
    local target_slot=$(determine_target_slot)
    deploy "$target_slot"
  fi
}

# Run main function
main
