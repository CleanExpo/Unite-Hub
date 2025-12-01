#!/bin/bash

# Nginx Zero-Downtime Reload Script
# Generated: 2025-12-02
# Purpose: Safely reload nginx configuration with zero downtime

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Find nginx master process
find_nginx_master() {
    pgrep -f 'nginx: master process' | head -n 1
}

# Verify nginx is running
verify_nginx_running() {
    local master_pid=$(find_nginx_master)
    if [ -z "$master_pid" ]; then
        log_error "Nginx is not running"
        return 1
    fi
    log_info "Nginx master process found (PID: $master_pid)"
    return 0
}

# Test nginx configuration
test_config() {
    log_info "Testing nginx configuration..."
    if nginx -t 2>&1; then
        log_info "Configuration test passed"
        return 0
    else
        log_error "Configuration test failed"
        return 1
    fi
}

# Send SIGHUP to reload nginx
reload_nginx() {
    local master_pid=$(find_nginx_master)

    log_info "Sending SIGHUP to nginx master process (PID: $master_pid)..."
    if kill -HUP "$master_pid"; then
        log_info "SIGHUP sent successfully"
        return 0
    else
        log_error "Failed to send SIGHUP"
        return 1
    fi
}

# Wait for reload to complete
wait_for_reload() {
    local max_wait=10
    local wait_time=0

    log_info "Waiting for nginx reload to complete..."

    while [ $wait_time -lt $max_wait ]; do
        sleep 1
        wait_time=$((wait_time + 1))

        # Check if new workers have started
        local worker_count=$(pgrep -f 'nginx: worker process' | wc -l)
        if [ "$worker_count" -gt 0 ]; then
            log_info "Nginx workers restarted (count: $worker_count)"
            return 0
        fi
    done

    log_warning "Reload verification timed out after ${max_wait}s"
    return 1
}

# Verify nginx is healthy after reload
verify_health() {
    log_info "Verifying nginx health..."

    # Check if master process is still running
    if ! verify_nginx_running; then
        log_error "Nginx master process not running after reload"
        return 1
    fi

    # Check if workers are running
    local worker_count=$(pgrep -f 'nginx: worker process' | wc -l)
    if [ "$worker_count" -eq 0 ]; then
        log_error "No nginx worker processes found"
        return 1
    fi

    log_info "Nginx is healthy (workers: $worker_count)"
    return 0
}

# Main execution
main() {
    log_info "Starting nginx zero-downtime reload..."
    log_info "Timestamp: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"

    # Step 1: Verify nginx is running
    if ! verify_nginx_running; then
        log_error "Cannot reload - nginx is not running"
        exit 1
    fi

    # Step 2: Test configuration
    if ! test_config; then
        log_error "Configuration test failed - aborting reload"
        exit 1
    fi

    # Step 3: Reload nginx
    if ! reload_nginx; then
        log_error "Failed to reload nginx"
        exit 1
    fi

    # Step 4: Wait for reload to complete
    if ! wait_for_reload; then
        log_warning "Could not verify reload completion"
        # Continue anyway - SIGHUP was sent successfully
    fi

    # Step 5: Verify health
    if ! verify_health; then
        log_error "Health check failed after reload"
        exit 1
    fi

    log_info "Nginx reload completed successfully"
    exit 0
}

# Run main function
main "$@"
