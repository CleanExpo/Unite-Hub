# .github Directory Documentation

This directory contains GitHub-specific configuration, workflows, and documentation.

## 📁 Directory Structure

```
.github/
├── workflows/              # GitHub Actions workflows
│   ├── ci.yml             # Main CI/CD (tests, coverage)
│   ├── security.yml       # Security scanning (Snyk, NPM Audit, Trivy)
│   ├── advanced-testing.yml # Contract, Visual, Performance tests
│   ├── performance-testing.yml # Load testing (k6) + Penetration (OWASP ZAP)
│   ├── agent-pr-checks.yml # Agent PR validation
│   ├── deploy-backend.yml  # Backend deployment
│   └── deploy-frontend.yml # Frontend deployment
│
├── scripts/               # Helper scripts
│   └── setup-secrets.sh   # Automated secrets setup script
│
├── SECRETS.md            # Complete secrets documentation
├── SECRETS-QUICK-START.md # Quick secrets setup guide
└── README.md             # This file
```

## 🚀 Quick Start

### First Time Setup

1. **Add Required Secrets**:

   ```
   See: SECRETS-QUICK-START.md
   ```

2. **Test Workflows**:
   ```
   https://github.com/CleanExpo/NodeJS-Starter-V1/actions
   ```

### Running Workflows

**Automatic Triggers**:

- Push to `main` → CI, Security, Advanced Testing
- Pull Requests → CI, Security, Advanced Testing, Agent Validation
- Weekly (Sundays) → Security, Advanced Testing, Performance Testing

**Manual Triggers**:

```bash
gh workflow run ci.yml
gh workflow run security.yml
gh workflow run advanced-testing.yml
gh workflow run performance-testing.yml
```

## 📊 Workflows Overview

### 1. CI Workflow (`ci.yml`)

**Purpose**: Main continuous integration pipeline

**Runs On**: Every push, every PR

**Jobs**:

- Backend tests (pytest + coverage)
- Frontend tests (vitest + coverage)
- E2E tests (Playwright)
- Codecov upload

**Expected Duration**: 5-8 minutes

---

### 2. Security Workflow (`security.yml`)

**Purpose**: Automated vulnerability scanning

**Runs On**: Push, PR, Weekly (Sundays), Manual

**Jobs**:

- Snyk frontend scan
- Snyk backend scan
- NPM audit
- Trivy container scan
- Dependency review (PRs only)

**Expected Duration**: 3-5 minutes

---

### 3. Advanced Testing Workflow (`advanced-testing.yml`)

**Purpose**: Contract, visual regression, and performance testing

**Runs On**: Push to main/develop, PRs, Weekly (Sundays), Manual

**Jobs**:

- Contract tests (Pact)
- Visual regression (Percy)
- Performance tests (Lighthouse CI)

**Expected Duration**: 8-12 minutes

**Required Secrets**:

- `PERCY_TOKEN`
- `PACT_BROKER_BASE_URL`
- `PACT_BROKER_TOKEN`
- `CODECOV_TOKEN`

---

### 4. Performance Testing Workflow (`performance-testing.yml`)

**Purpose**: Load testing and penetration testing

**Runs On**: Weekly (Sundays), Manual only

**Jobs**:

- k6 load tests (baseline, load, stress)
- k6 spike test (manual only)
- OWASP ZAP baseline scan
- OWASP ZAP full scan (manual/scheduled)

**Expected Duration**: 20-40 minutes

**Why Weekly?**: Resource-intensive tests, suitable for periodic validation

---

### 5. Agent PR Validation (`agent-pr-checks.yml`)

**Purpose**: Validate agent-generated pull requests

**Runs On**: Pull requests only

**Jobs**:

- Detect agent PRs
- Metadata validation
- Quality checks
- Security scanning
- Debug code detection

**Expected Duration**: 2-3 minutes

---

### 6. Deploy Backend (`deploy-backend.yml`)

**Purpose**: Deploy backend to DigitalOcean

**Runs On**: Push to main (when backend changes)

**Required Secrets**:

- `DIGITALOCEAN_ACCESS_TOKEN`

---

### 7. Deploy Frontend (`deploy-frontend.yml`)

**Purpose**: Deploy frontend to Vercel

**Runs On**: Push to main (when frontend changes)

**Note**: Vercel GitHub integration handles deployment automatically

---

## 🔐 Required Secrets

See `SECRETS-QUICK-START.md` for setup instructions.

**Priority 1 (Required for testing)**:

- `PERCY_TOKEN`
- `PACT_BROKER_BASE_URL`
- `PACT_BROKER_TOKEN`
- `CODECOV_TOKEN`

**Priority 2 (Optional - Security)**:

- `SNYK_TOKEN`

**Priority 3 (Optional - Deployment)**:

- `DIGITALOCEAN_ACCESS_TOKEN`
- `VERCEL_TOKEN`

## 📈 Workflow Status

Check workflow status:

```
https://github.com/CleanExpo/NodeJS-Starter-V1/actions
```

## 🧪 Testing Workflows Locally

Some workflows can be tested locally:

**Security scanning**:

```bash
# Snyk
npx snyk test

# NPM audit
npm audit
```

**Load testing**:

```bash
# k6
k6 run tests/performance/baseline-test.js
```

**Penetration testing**:

```bash
# OWASP ZAP
docker run -v ${PWD}:/zap/wrk/:rw -t ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t http://localhost:8000 -c .zap/baseline-scan.yaml
```

## 📝 Workflow Modification

When modifying workflows:

1. **Test locally** (if possible)
2. **Use pull request** to test changes
3. **Check workflow logs** for errors
4. **Update documentation** if behavior changes

## 🆘 Troubleshooting

**Workflow fails with "Secret not found"**:

- Add required secrets (see SECRETS-QUICK-START.md)

**Workflow fails with "Permission denied"**:

- Check repository permissions
- Ensure workflows have write access

**Tests fail in CI but pass locally**:

- Check environment differences
- Verify all dependencies installed
- Review workflow logs for specifics

**Deployment fails**:

- Verify deployment secrets are set
- Check service status (DigitalOcean/Vercel)
- Review deployment logs

## 📚 Additional Resources

- **GitHub Actions Documentation**: https://docs.github.com/en/actions
- **Workflow Syntax**: https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions
- **Testing Guide**: `../TESTING_GUIDE.md`
- **Secrets Documentation**: `SECRETS.md`

## 🔄 Maintenance

**Regular tasks**:

- Review workflow runs weekly
- Rotate secrets every 90 days
- Update action versions quarterly
- Monitor workflow execution times

## ✅ Success Criteria

Workflows are working correctly when:

- ✅ CI passes on every push
- ✅ Security scans complete without critical issues
- ✅ Advanced tests pass (contract, visual, performance)
- ✅ Weekly performance tests complete successfully
- ✅ Deployments succeed when code changes

---

**Last Updated**: 2026-01-06
**Maintained By**: Development Team
