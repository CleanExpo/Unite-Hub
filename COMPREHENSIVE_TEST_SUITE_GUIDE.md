# 🧪 COMPREHENSIVE TEST SUITE GUIDE
## Testing Everything We Build with Docker Integration

This guide explains the comprehensive test suite I've built for your Unite Group project. This system tests all 80+ API endpoints, integrates with Docker for debugging, and provides automated pre-deployment validation.

---

## 📖 TABLE OF CONTENTS

1. [Overview](#overview)
2. [Components](#components)
3. [Quick Start](#quick-start)
4. [Testing Commands](#testing-commands)
5. [Docker Integration](#docker-integration)
6. [Pre-Deployment Automation](#pre-deployment-automation)
7. [Reports and Analysis](#reports-and-analysis)
8. [Troubleshooting](#troubleshooting)
9. [Advanced Usage](#advanced-usage)

---

## 🔍 OVERVIEW

The comprehensive test suite provides:

- **Complete API Coverage**: Tests all 80+ endpoints across 17 categories
- **Docker Integration**: Real-time log monitoring and health analysis
- **Pre-deployment Validation**: Automated pipeline that validates before deployment
- **Performance Testing**: Response time and threshold validation
- **Security Scanning**: Basic security checks and vulnerability detection
- **Detailed Reporting**: HTML and JSON reports with recommendations
- **Retry Logic**: Automatic retry for flaky tests
- **Dependency Management**: Tests run in proper dependency order

### 🎯 Test Categories

1. **Core Infrastructure** (Critical)
2. **Authentication & Security** (Critical)
3. **CRM Core System** (Critical)
4. **CRM Messaging & Communication** (High)
5. **CRM Pipeline & Workflow** (High)
6. **AI & Analytics** (High)
7. **Business Intelligence** (Medium)
8. **Autonomous Systems** (Medium)
9. **Communication & Content** (Medium)
10. **Compliance & Monitoring** (High)
11. **Public APIs** (Medium)
12. **E-commerce & Payment** (High)
13. **Marketing & Analytics** (Medium)
14. **Admin & Management** (High)
15. **Testing & Development** (Low)
16. **Real-time & Socket** (Medium)
17. **Production Readiness** (Critical)

---

## 🛠️ COMPONENTS

### 1. Test Configuration (`tests/comprehensive-test-suite.config.ts`)
Defines all test categories, endpoints, priorities, and Docker settings.

### 2. Test Runner (`tests/comprehensive-test-runner.ts`)
Main engine that executes tests with Docker integration and generates reports.

### 3. Docker Integration (`tests/docker-integration.ts`)
Advanced Docker log analysis and container health monitoring.

### 4. Pre-deployment Automation (`tests/pre-deployment-automation.ts`)
Complete pipeline that validates deployment readiness.

---

## 🚀 QUICK START

### 1. Run All Tests
```bash
npm run test:comprehensive
```

### 2. Run Critical Tests Only
```bash
npm run test:comprehensive:critical
```

### 3. Test Specific Category
```bash
npm run test:comprehensive:crm
npm run test:comprehensive:ai
```

### 4. Pre-deployment Check
```bash
npm run test:pre-deploy
```

### 5. Fast Pre-deployment (Skip Docker)
```bash
npm run test:pre-deploy:fast
```

---

## 📝 TESTING COMMANDS

### Comprehensive Testing

```bash
# Run all tests with full Docker integration
npm run test:comprehensive

# Run only critical and high priority tests
npm run test:comprehensive:critical

# Run specific categories
npm run test:comprehensive:crm
npm run test:comprehensive:ai

# Run without Docker monitoring
npm run test:comprehensive:no-docker
```

### Pre-deployment Testing

```bash
# Full pre-deployment pipeline
npm run test:pre-deploy

# Fast pre-deployment (skip Docker, fewer retries)
npm run test:pre-deploy:fast

# Full pipeline with all validations
npm run test:pre-deploy:full

# Automated deployment (test first, then deploy)
npm run deploy:automated
```

### Manual Testing

```bash
# Run comprehensive test runner directly
tsx tests/comprehensive-test-runner.ts

# Run with specific options
tsx tests/comprehensive-test-runner.ts --categories "CRM,AI" --priority high

# Run pre-deployment automation
tsx tests/pre-deployment-automation.ts

# Run with webhook notifications
tsx tests/pre-deployment-automation.ts --webhook https://hooks.slack.com/...
```

---

## 🐳 DOCKER INTEGRATION

The test suite includes advanced Docker integration for real-time debugging.

### Features

- **Container Discovery**: Automatically finds running containers
- **Log Streaming**: Real-time log collection and analysis
- **Health Monitoring**: CPU, memory, and network monitoring
- **Error Detection**: Automatic error pattern recognition
- **Performance Analysis**: Resource usage tracking

### Container Names Monitored

- `unite-group-app`
- `nextjs`
- `app`
- Any container matching your project patterns

### Docker Commands

```bash
# Check if Docker is available
docker --version

# View container logs manually
docker logs -f unite-group-app

# Check container stats
docker stats unite-group-app --no-stream
```

### Log Analysis

The system automatically analyzes logs for:

- **Errors**: ERROR, FATAL, CRITICAL patterns
- **Warnings**: WARN, WARNING patterns
- **Performance**: slow, timeout, memory issues
- **Security**: unauthorized, forbidden, invalid_token

---

## 🚀 PRE-DEPLOYMENT AUTOMATION

The pre-deployment automation runs a complete pipeline before deployment.

### Pipeline Steps

1. **Environment Validation**
   - Node.js and npm versions
   - Required environment variables
   - System dependencies

2. **Build Validation**
   - Clean previous build
   - Run full application build
   - Check for build warnings

3. **Docker Health Check**
   - Container status verification
   - Resource usage analysis
   - Error log analysis

4. **Comprehensive Testing**
   - Run full test suite
   - Retry failed tests
   - Critical test validation

5. **Performance Validation**
   - Response time testing
   - Threshold compliance
   - Performance benchmarking

6. **Security Scanning**
   - Environment variable security
   - API security headers
   - Basic vulnerability checks

7. **Final Analysis**
   - Deployment readiness assessment
   - Risk analysis
   - Recommendation generation

### Deployment Criteria

For deployment approval, the system checks:

- ✅ **Test pass rate**: ≥85%
- ✅ **Critical tests**: 0 failures
- ✅ **Performance**: All thresholds met
- ✅ **Security**: No high-severity issues

### Usage Examples

```bash
# Basic pre-deployment check
npm run test:pre-deploy

# Skip Docker monitoring (faster)
npm run test:pre-deploy:fast

# With webhook notifications
WEBHOOK_URL=https://hooks.slack.com/... npm run deploy:with-webhook

# Manual with options
tsx tests/pre-deployment-automation.ts --skip-build --retries 3
```

---

## 📊 REPORTS AND ANALYSIS

### Report Types

1. **JSON Reports**: Machine-readable test results
2. **HTML Reports**: Human-readable dashboards
3. **Emergency Reports**: Critical failure analysis
4. **Docker Analysis**: Container health and logs

### Report Locations

```
tests/reports/
├── test-report-2024-12-09T06-30-00.json
├── test-report-2024-12-09T06-30-00.html
├── deployment/
│   ├── deployment-report-2024-12-09T06-30-00.json
│   └── deployment-report-2024-12-09T06-30-00.html
└── emergency/
    └── emergency-report-2024-12-09T06-30-00.json
```

### Understanding Reports

#### Test Results
- **PASS**: Test completed successfully
- **FAIL**: Test failed with error
- **TIMEOUT**: Test exceeded time limit
- **SKIP**: Test was skipped

#### Priority Levels
- **Critical**: Must pass for deployment
- **High**: Important for stability
- **Medium**: Nice to have working
- **Low**: Development/debugging only

#### Docker Health
- **Healthy**: Container running normally
- **Warning**: Minor issues detected
- **Critical**: Serious problems found

---

## 🔧 TROUBLESHOOTING

### Common Issues

#### 1. Docker Not Available
```
⚠️  Docker not available - continuing without Docker monitoring
```
**Solution**: Install Docker or use `--no-docker` flag

#### 2. Environment Variables Missing
```
❌ Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL
```
**Solution**: Check your `.env.local` file

#### 3. Build Failures
```
❌ Build failed: Command failed with exit code 1
```
**Solution**: Fix TypeScript errors first, then retry

#### 4. Test Failures
```
🚨 CRITICAL CATEGORY FAILED: Core Infrastructure
```
**Solution**: Check individual test results and fix the failing endpoints

#### 5. Performance Issues
```
⚠️  /api/crm/dashboard: 6200ms (exceeds 5000ms threshold)
```
**Solution**: Optimize the slow endpoint or adjust thresholds

### Debug Commands

```bash
# Run tests with verbose output
DEBUG=1 npm run test:comprehensive

# Test single category
npm run test:comprehensive:critical

# Check specific endpoint manually
curl http://localhost:3000/api/health

# View Docker logs
docker logs unite-group-app --tail 100

# Check container status
docker ps --filter "name=unite-group"
```

### Getting Help

1. Check the test report HTML file for detailed analysis
2. Review Docker logs for application errors
3. Verify environment variables are set correctly
4. Ensure the application is running on localhost:3000
5. Check that required services (Supabase, Redis) are accessible

---

## 🎛️ ADVANCED USAGE

### Custom Test Configuration

Edit `tests/comprehensive-test-suite.config.ts` to:

- Add new test categories
- Modify endpoint lists
- Adjust timeouts and retries
- Configure Docker monitoring

### Environment Variables

```bash
# Test configuration
TEST_BASE_URL=http://localhost:3000
TEST_USER_EMAIL=test@unitegroup.com.au
TEST_USER_PASSWORD=test123

# Webhook notifications
WEBHOOK_URL=https://hooks.slack.com/services/...

# Docker configuration
DOCKER_CONTAINER_NAME=unite-group-app
```

### Integration with CI/CD

```yaml
# GitHub Actions example
- name: Run comprehensive tests
  run: npm run test:pre-deploy

- name: Deploy if tests pass
  if: success()
  run: vercel --prod

- name: Notify on failure
  if: failure()
  run: |
    curl -X POST $WEBHOOK_URL \
      -H 'Content-Type: application/json' \
      -d '{"text":"Deployment tests failed!"}'
```

### Custom Webhooks

The system can send notifications to:

- Slack webhooks
- Discord webhooks
- Microsoft Teams
- Custom HTTP endpoints

Example webhook payload:
```json
{
  "status": "success",
  "summary": "Deployment READY - 156/160 tests passed",
  "details": {
    "testsRun": 160,
    "testsPassed": 156,
    "testsFailed": 4,
    "deploymentReady": true
  },
  "timestamp": "2024-12-09T06:30:00.000Z"
}
```

---

## 🎯 BEST PRACTICES

### 1. Regular Testing
- Run comprehensive tests before every deployment
- Use critical tests for quick validation during development
- Monitor test performance over time

### 2. Docker Integration
- Keep Docker containers running during development
- Monitor container health regularly
- Address Docker warnings promptly

### 3. Performance Monitoring
- Set realistic performance thresholds
- Monitor response times for degradation
- Optimize slow endpoints identified by tests

### 4. Security Scanning
- Review security recommendations
- Fix high-severity issues immediately
- Regular security audits

### 5. Report Analysis
- Review HTML reports for insights
- Track test trends over time
- Address failing test patterns

---

## 🚀 GETTING STARTED TODAY

1. **Start the application**:
   ```bash
   npm run dev
   ```

2. **Run a quick test**:
   ```bash
   npm run test:comprehensive:critical
   ```

3. **Check the results**:
   - View the console output
   - Open the generated HTML report
   - Review any failures

4. **Run pre-deployment check**:
   ```bash
   npm run test:pre-deploy:fast
   ```

5. **Deploy with confidence**:
   ```bash
   npm run deploy:automated
   ```

---

This comprehensive test suite ensures that every feature you build is thoroughly tested, monitored, and validated before deployment. The Docker integration provides deep insights into application behavior, while the automated pipeline prevents problematic deployments.

**The system is designed to give you confidence in every deployment while catching issues before they reach production.**
