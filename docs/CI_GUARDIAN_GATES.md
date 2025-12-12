# Guardian CI Gates Configuration

**Purpose**: Configure Guardian validation gates in your CI/CD pipeline.

**Applies To**: All CI providers (GitHub Actions, GitLab CI, Jenkins, CircleCI, etc.)

---

## Overview

Guardian validation gates ensure freeze enforcement and quality standards on every commit.

**Gates**:
1. Migration guard — prevents edits to locked migrations
2. Documentation checker — validates required docs exist
3. Unit tests — runs Guardian test suite
4. TypeScript validation — ensures no compilation errors

**Exit Codes**:
- `0` = All gates passed
- `1` = Gate failed (blocked)
- `2` = Gate passed with warnings

---

## Quick Setup (GitHub Actions)

Create `.github/workflows/guardian-gates.yml`:

```yaml
name: Guardian Validation Gates

on:
  push:
    branches: [main, develop]
    paths:
      - 'supabase/migrations/**'
      - 'src/lib/guardian/**'
      - 'src/app/api/guardian/**'
      - 'src/app/guardian/**'
      - 'docs/guardian-*.json'
  pull_request:
    branches: [main]
    paths:
      - 'supabase/migrations/**'
      - 'src/lib/guardian/**'
      - 'src/app/api/guardian/**'
      - 'src/app/guardian/**'

jobs:
  guardian-gates:
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for migration comparison

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - name: Run Guardian Validation Gates
        run: npm run guardian:gates
        env:
          COMMIT_MESSAGE: ${{ github.event.head_commit.message }}
          GITHUB_REF: ${{ github.ref }}

      - name: Upload Gates Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: guardian-gates-report
          path: docs/guardian-gates-report.json
          retention-days: 30

      - name: Comment PR on Failure
        if: failure() && github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('docs/guardian-gates-report.json', 'utf8'));
            const failedGates = report.gates.filter(g => g.status === 'fail');

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `❌ Guardian validation gates failed:\n\n${failedGates.map(g => `- **${g.name}**: ${g.message}`).join('\n')}\n\nReview [freeze policy](../../docs/GUARDIAN_FREEZE_POLICY.md)`
            });

      - name: Summary
        if: always()
        run: |
          echo "## Guardian Gates Summary" >> $GITHUB_STEP_SUMMARY
          cat docs/guardian-gates-report.json | jq '.summary' >> $GITHUB_STEP_SUMMARY
```

---

## GitLab CI Configuration

Create `.gitlab-ci.yml` section:

```yaml
guardian-gates:
  stage: test
  image: node:20
  script:
    - npm ci
    - npm run guardian:gates
  artifacts:
    reports:
      dotenv: guardian-gates.env
    paths:
      - docs/guardian-gates-report.json
    expire_in: 30 days
  only:
    - merge_requests
    - main
    - develop
  allow_failure: false
```

---

## Jenkins Pipeline Configuration

Create `Jenkinsfile` section:

```groovy
stage('Guardian Gates') {
  when {
    branch pattern: 'main|develop', comparator: 'REGEXP'
  }
  steps {
    sh 'npm ci'
    script {
      def gatesResult = sh(
        script: 'npm run guardian:gates',
        returnStatus: true
      )

      if (gatesResult == 1) {
        error('Guardian gates validation failed')
      } else if (gatesResult == 2) {
        echo 'WARNING: Guardian gates passed with warnings'
      }
    }

    // Archive report
    archiveArtifacts artifacts: 'docs/guardian-gates-report.json', allowEmptyArchive: false
  }
}
```

---

## CircleCI Configuration

Create `.circleci/config.yml` section:

```yaml
jobs:
  guardian-gates:
    docker:
      - image: cimg/node:20.10
    steps:
      - checkout
      - restore_cache:
          keys:
            - v1-npm-{{ checksum "package-lock.json" }}
      - run:
          name: Install dependencies
          command: npm ci
      - save_cache:
          paths:
            - node_modules
          key: v1-npm-{{ checksum "package-lock.json" }}
      - run:
          name: Run Guardian Gates
          command: npm run guardian:gates
      - store_artifacts:
          path: docs/guardian-gates-report.json

workflows:
  guardian:
    jobs:
      - guardian-gates:
          filters:
            branches:
              only:
                - main
                - develop
```

---

## Emergency Override in CI

### GitHub Actions

```yaml
- name: Run Guardian Gates with Override
  if: contains(github.event.head_commit.message, 'GUARDIAN_FREEZE_OVERRIDE:')
  run: npm run guardian:gates
  env:
    GUARDIAN_FREEZE_OVERRIDE: '1'
    COMMIT_MESSAGE: ${{ github.event.head_commit.message }}
```

### GitLab CI

```yaml
guardian-gates-override:
  script:
    - npm ci
    - npm run guardian:gates
  only:
    variables:
      - $COMMIT_MESSAGE =~ /GUARDIAN_FREEZE_OVERRIDE:/
  allow_failure: false
```

---

## Pre-Commit Hook (Local Development)

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
set -e

echo "🔒 Running Guardian Migration Guard..."

# Check if any guardian files changed
if git diff --cached --name-only | grep -E 'supabase/migrations|src/lib/guardian|src/app/api/guardian'; then
  node -r esbuild-register scripts/guardian/guard-migrations.ts
  if [ $? -ne 0 ]; then
    echo "❌ Guardian guard failed. Commit blocked."
    exit 1
  fi
fi

echo "✅ Pre-commit checks passed"
exit 0
```

Make executable:
```bash
chmod +x .git/hooks/pre-commit
```

---

## Integration with Existing Workflows

### Combined with Lint/Build/Test

```yaml
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test

      # Guardian gates after other checks
      - run: npm run guardian:gates

      - run: npm run build
```

### Parallel Execution

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - run: npm run lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - run: npm run typecheck

  tests:
    runs-on: ubuntu-latest
    steps:
      - run: npm run test

  guardian:
    runs-on: ubuntu-latest
    steps:
      - run: npm run guardian:gates

  build:
    needs: [lint, typecheck, tests, guardian]
    runs-on: ubuntu-latest
    steps:
      - run: npm run build
```

---

## Handling Gate Failures

### Migration Guard Failure
```
❌ LOCKED MIGRATION MODIFIED: 614_guardian_i04_...

Expected SHA256: abc123...
Got: def456...
```

**Fix**:
1. Revert changes to migration file:
   ```bash
   git checkout supabase/migrations/614_*.sql
   ```
2. Create new migration for the fix:
   ```bash
   cp supabase/migrations/614_guardian_i04_*.sql supabase/migrations/617_fix_description.sql
   # Edit 617_...sql with your fix
   ```
3. Add override if emergency:
   ```bash
   export GUARDIAN_FREEZE_OVERRIDE=1
   npm run guardian:gates
   ```

### Docs Check Failure
```
❌ MISSING: PHASE_H06_*.md
```

**Fix**:
1. Check `docs/GUARDIAN_MASTER_INDEX.md` exists
2. Ensure required phase docs exist
3. Add links to master index
4. Run check again:
   ```bash
   npm run guardian:docs
   ```

### Tests Failure
```
❌ Guardian Unit Tests failed
```

**Fix**:
1. Run tests locally:
   ```bash
   npm run test -- tests/guardian/
   ```
2. Fix test failures
3. Commit and push

### TypeScript Failure
```
❌ TypeScript Validation failed
```

**Fix**:
1. Run typecheck locally:
   ```bash
   npm run typecheck
   ```
2. Fix compilation errors
3. Commit and push

---

## Monitoring & Alerting

### Slack Notification

```yaml
- name: Notify on Failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    payload: |
      {
        "text": "❌ Guardian gates failed",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*Guardian Validation Failed* \nBranch: ${{ github.ref }} \nCommit: ${{ github.event.head_commit.message }}"
            }
          }
        ]
      }
```

### Email Notification

```yaml
- name: Send Email on Failure
  if: failure()
  uses: davissamuel/action-send-email@main
  with:
    server_address: ${{ secrets.EMAIL_SERVER }}
    server_port: ${{ secrets.EMAIL_PORT }}
    username: ${{ secrets.EMAIL_USERNAME }}
    password: ${{ secrets.EMAIL_PASSWORD }}
    subject: 'Guardian gates validation failed'
    to: 'dev-team@company.com'
    from: 'ci@company.com'
    body: 'Check the pipeline for details: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}'
```

---

## Best Practices

1. **Run gates on every commit to Guardian paths**
   - Use `paths` filter to avoid unnecessary runs
   - Check migrations, services, APIs, docs

2. **Allow override for emergency patches**
   - Require `GUARDIAN_FREEZE_OVERRIDE` token in commit message
   - Log all overrides in gates report
   - Notify team of overrides

3. **Archive gates report**
   - Keep for audit trail
   - Store 30 days minimum
   - Link in PR comments for visibility

4. **Fail CI on gate failures**
   - Block merges to main if gates fail
   - Allow override only for documented emergencies
   - Require manager approval for overrides

5. **Notify on failures**
   - Post comments to PRs
   - Send Slack/email alerts
   - Include links to freeze policy

---

## Testing Your CI Configuration

### Local Simulation

```bash
# Simulate gate failure (edit a locked migration)
cd supabase/migrations
echo "-- test" >> 614_*.sql
npm run guardian:gates  # Should fail

# Revert
git checkout supabase/migrations/614_*.sql

# Simulate override
GUARDIAN_FREEZE_OVERRIDE=1 npm run guardian:gates  # Should pass with warnings
```

### CI Dry-Run

```bash
# Test your workflow syntax (GitHub)
act -j guardian-gates --input node-version=20

# For other providers, check their documentation
```

---

## Troubleshooting

### Gates Always Pass (Not Detecting Changes)

```bash
# Check git history is available
git fetch --unshallow

# Run with verbose logging
DEBUG=* npm run guardian:gates
```

### Gates Timeout

Increase timeout in workflow:
```yaml
steps:
  - name: Run Guardian Gates
    timeout-minutes: 20  # Increase from default
    run: npm run guardian:gates
```

### Report File Not Found

Check artifacts are being saved:
```yaml
- uses: actions/upload-artifact@v4
  with:
    name: guardian-gates-report
    path: docs/guardian-gates-report.json
```

---

## Further Reading

- [GUARDIAN_FREEZE_POLICY.md](./GUARDIAN_FREEZE_POLICY.md) — Freeze rules
- [GUARDIAN_FREEZE_CHECKLIST.md](./GUARDIAN_FREEZE_CHECKLIST.md) — Release checklist
- Scripts: `scripts/guardian/run-guardian-gates.ts`

---

**Guardian CI Gates Configuration**
*Last Updated: 2025-12-12*
