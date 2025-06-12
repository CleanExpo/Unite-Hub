#!/bin/bash

# Docker Debug Script for Next.js Build Failures
# Implements comprehensive debugging from the Docker build failures guide

set -e

echo "🔍 Docker Build Failure Diagnostic Tool"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check Docker installation
check_docker() {
    print_status "Checking Docker installation..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running"
        exit 1
    fi
    
    DOCKER_VERSION=$(docker --version)
    print_success "Docker is running: $DOCKER_VERSION"
}

# Function to check Next.js configuration
check_nextjs_config() {
    print_status "Checking Next.js configuration..."
    
    # Check for next.config files
    if [ -f "next.config.js" ]; then
        print_success "Found next.config.js"
        echo "Checking for standalone output configuration..."
        if grep -q "output.*standalone" next.config.js; then
            print_success "✓ Standalone output is configured"
        else
            print_warning "⚠ Standalone output not found in next.config.js"
            echo "Add: output: 'standalone' to your next.config.js"
        fi
    elif [ -f "next.config.mjs" ]; then
        print_success "Found next.config.mjs"
        if grep -q "output.*standalone" next.config.mjs; then
            print_success "✓ Standalone output is configured"
        else
            print_warning "⚠ Standalone output not found in next.config.mjs"
        fi
    else
        print_warning "No next.config.js or next.config.mjs found"
    fi
    
    # Check for resilient config
    if [ -f "next.config.resilient.js" ]; then
        print_success "Found resilient configuration"
    else
        print_warning "Resilient configuration not found"
    fi
}

# Function to check package.json
check_package_json() {
    print_status "Checking package.json..."
    
    if [ ! -f "package.json" ]; then
        print_error "package.json not found!"
        exit 1
    fi
    
    # Check Next.js version
    NEXTJS_VERSION=$(node -pe "JSON.parse(require('fs').readFileSync('package.json', 'utf8')).dependencies.next || 'not found'")
    print_success "Next.js version: $NEXTJS_VERSION"
    
    # Verify version supports standalone
    if [[ "$NEXTJS_VERSION" == *"15."* ]] || [[ "$NEXTJS_VERSION" == *"14."* ]] || [[ "$NEXTJS_VERSION" == *"13."* ]]; then
        print_success "✓ Next.js version supports standalone builds"
    else
        print_warning "⚠ Next.js version may not fully support standalone builds"
    fi
    
    # Check for build scripts
    if grep -q '"build"' package.json; then
        print_success "✓ Build script found"
    else
        print_error "No build script found in package.json"
    fi
}

# Function to analyze Dockerfile
analyze_dockerfile() {
    print_status "Analyzing Dockerfile..."
    
    local dockerfile="Dockerfile"
    if [ "$1" ]; then
        dockerfile="$1"
    fi
    
    if [ ! -f "$dockerfile" ]; then
        print_error "$dockerfile not found!"
        return 1
    fi
    
    print_success "Found $dockerfile"
    
    # Check for multi-stage build
    if grep -q "FROM.*AS" "$dockerfile"; then
        print_success "✓ Multi-stage build detected"
    else
        print_warning "⚠ Single-stage build detected (consider multi-stage for optimization)"
    fi
    
    # Check for Node.js version
    if grep -q "FROM node:18" "$dockerfile"; then
        print_success "✓ Using Node.js 18 (recommended)"
    elif grep -q "FROM node:" "$dockerfile"; then
        NODE_VERSION=$(grep "FROM node:" "$dockerfile" | head -1 | sed 's/.*node:\([^-]*\).*/\1/')
        print_warning "Using Node.js $NODE_VERSION (consider upgrading to 18+)"
    fi
    
    # Check for alpine
    if grep -q "alpine" "$dockerfile"; then
        print_success "✓ Using Alpine Linux (smaller image size)"
    fi
    
    # Check for verification steps
    if grep -q "standalone" "$dockerfile"; then
        print_success "✓ Standalone verification present"
    else
        print_warning "⚠ No standalone verification found"
    fi
}

# Function to test build locally
test_local_build() {
    print_status "Testing local build..."
    
    if [ -d ".next" ]; then
        print_warning "Removing existing .next directory..."
        rm -rf .next
    fi
    
    print_status "Running npm run build..."
    if npm run build; then
        print_success "✓ Local build successful"
        
        # Check for standalone directory
        if [ -d ".next/standalone" ]; then
            print_success "✓ Standalone directory created"
            
            if [ -f ".next/standalone/server.js" ]; then
                print_success "✓ server.js found"
            else
                print_error "server.js not found in standalone directory"
            fi
        else
            print_error "Standalone directory not created"
            echo "Contents of .next/:"
            ls -la .next/ || echo "No .next directory"
        fi
    else
        print_error "Local build failed"
        return 1
    fi
}

# Function to test Docker build with detailed output
test_docker_build() {
    print_status "Testing Docker build with detailed output..."
    
    local dockerfile="Dockerfile.resilient"
    if [ "$1" ]; then
        dockerfile="$1"
    fi
    
    if [ ! -f "$dockerfile" ]; then
        print_error "$dockerfile not found!"
        return 1
    fi
    
    print_status "Building with $dockerfile..."
    
    # Build with progress=plain for detailed output
    if DOCKER_BUILDKIT=1 docker build --progress=plain --no-cache -f "$dockerfile" -t debug-test . 2>&1 | tee "docker-build-$(date +%Y%m%d_%H%M%S).log"; then
        print_success "✓ Docker build successful"
        
        # Test the built image
        print_status "Testing built image..."
        if docker run --rm debug-test ls -la .next/standalone/; then
            print_success "✓ Standalone files present in image"
        else
            print_error "Standalone files missing in image"
        fi
    else
        print_error "Docker build failed"
        echo "Check the build log for details"
        return 1
    fi
}

# Function to analyze build logs
analyze_build_logs() {
    print_status "Analyzing recent build logs..."
    
    local latest_log=$(ls -t docker-build-*.log 2>/dev/null | head -1)
    if [ -n "$latest_log" ]; then
        print_success "Found recent build log: $latest_log"
        
        echo "Checking for common issues..."
        
        if grep -qi "error\|failed\|missing\|not found" "$latest_log"; then
            print_warning "Errors found in build log:"
            grep -i "error\|failed\|missing\|not found" "$latest_log" | head -10
        else
            print_success "No obvious errors in build log"
        fi
        
        if grep -qi "memory\|space" "$latest_log"; then
            print_warning "Memory/space issues detected:"
            grep -i "memory\|space" "$latest_log" | head -5
        fi
    else
        print_warning "No recent build logs found"
    fi
}

# Function to check system resources
check_system_resources() {
    print_status "Checking system resources..."
    
    # Check available memory
    if command -v free &> /dev/null; then
        echo "Memory usage:"
        free -h
    elif command -v vm_stat &> /dev/null; then
        echo "Memory info (macOS):"
        vm_stat
    fi
    
    # Check disk space
    echo "Disk space:"
    df -h . 2>/dev/null || echo "Disk info not available"
    
    # Check Docker resources
    print_status "Docker system info:"
    docker system df 2>/dev/null || echo "Docker system info not available"
}

# Function to provide recommendations
provide_recommendations() {
    print_status "Providing recommendations..."
    
    echo "🚀 BUILD TROUBLESHOOTING RECOMMENDATIONS:"
    echo "========================================="
    echo
    echo "1. CONFIGURATION FIXES:"
    echo "   - Ensure next.config.js has: output: 'standalone'"
    echo "   - Use Next.js 12.1.0+ for standalone support"
    echo "   - Consider using next.config.resilient.js for Docker builds"
    echo
    echo "2. MEMORY OPTIMIZATION:"
    echo "   - Increase Docker memory limit to 6-8GB"
    echo "   - Use NODE_OPTIONS='--max-old-space-size=6144'"
    echo "   - Enable webpackMemoryOptimizations in experimental config"
    echo
    echo "3. DOCKER IMPROVEMENTS:"
    echo "   - Use multi-stage builds (Dockerfile.resilient)"
    echo "   - Add build verification steps"
    echo "   - Implement retry logic for dependency installation"
    echo
    echo "4. NUCLEAR OPTIONS (if all else fails):"
    echo "   - Use Dockerfile.nuclear for maximum compatibility"
    echo "   - Disable TypeScript/ESLint checking during build"
    echo "   - Increase memory to 8GB+ and disable caching"
    echo
    echo "5. DEBUGGING COMMANDS:"
    echo "   npm run build:debug          # Debug local build"
    echo "   npm run build:nuclear        # Nuclear build option"
    echo "   npm run docker:build-debug   # Debug Docker build"
    echo "   npm run verify:standalone    # Verify standalone output"
    echo
}

# Main execution
main() {
    echo "Starting comprehensive Docker build analysis..."
    echo
    
    check_docker
    echo
    
    check_nextjs_config
    echo
    
    check_package_json
    echo
    
    analyze_dockerfile "Dockerfile"
    echo
    
    if [ -f "Dockerfile.resilient" ]; then
        analyze_dockerfile "Dockerfile.resilient"
        echo
    fi
    
    check_system_resources
    echo
    
    # Ask user if they want to test builds
    read -p "Do you want to test local build? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        test_local_build
        echo
    fi
    
    read -p "Do you want to test Docker build? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        test_docker_build "Dockerfile.resilient"
        echo
    fi
    
    analyze_build_logs
    echo
    
    provide_recommendations
}

# Run main function
main "$@"
