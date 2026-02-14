# Load Testing Suite

Comprehensive load testing for Unite-Hub using Artillery.

## Prerequisites

```bash
npm install
```

## Test Scenarios

### 1. Basic Load Test

Tests basic API endpoints under moderate load.

**Run:**
```bash
npx artillery run tests/load/basic-load.yml
```

### 2. Stress Test

Tests system under extreme load conditions.

**Run:**
```bash
npx artillery run tests/load/stress-test.yml
```

### 3. Spike Test

Tests system under sudden traffic spikes.

**Run:**
```bash
npx artillery run tests/load/spike-test.yml
```

## Generate HTML Report

```bash
npx artillery run --output report.json tests/load/basic-load.yml
npx artillery report report.json
```

---

**Production Readiness**: Load testing is essential for 100% readiness.
