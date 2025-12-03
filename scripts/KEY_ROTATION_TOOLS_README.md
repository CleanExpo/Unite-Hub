# Key Rotation Tools - Unite-Hub

Collection of scripts and tools for managing API key rotation lifecycle.

---

## Quick Start

```bash
# Initialize rotation log (first time setup)
npm run security:key-init

# Check key rotation status
npm run security:key-check

# Record a key rotation
npm run security:key-rotate ANTHROPIC_API_KEY

# Send Slack alert for overdue keys
npm run security:key-check:slack
```

---

## Scripts Overview

### 1. `init-key-rotation-log.mjs`

**Purpose**: Create initial key rotation tracking file

**Usage**:
```bash
# Create new log file
node scripts/init-key-rotation-log.mjs

# Overwrite existing log (use with caution)
node scripts/init-key-rotation-log.mjs --force
```

**Output**: Creates `key-rotation-log.json` with default configuration

**When to Use**:
- Initial project setup
- After accidentally deleting the log file
- Resetting rotation history (rare)

---

### 2. `check-key-age.mjs`

**Purpose**: Monitor API key rotation status and alert on keys needing rotation

**Usage**:
```bash
# Pretty table output (default)
node scripts/check-key-age.mjs

# JSON output (for automation)
node scripts/check-key-age.mjs --json

# Send Slack notification
node scripts/check-key-age.mjs --slack
```

**Exit Codes**:
- `0` - All keys within rotation policy ✅
- `1` - One or more keys approaching rotation deadline ⚠️
- `2` - One or more keys overdue (critical) 🚨

**Output Example**:
```
═══════════════════════════════════════════════════════════════════════════════════
  API Key Rotation Status Report
═══════════════════════════════════════════════════════════════════════════════════

Summary:
  Total Keys:      14
  ✅ OK:            10
  ⚠️  Warning:      3
  🚨 Overdue:       1
  ⚠️  Never Rotated: 0

Key Details:

ANTHROPIC_API_KEY
  Risk Level:      HIGH
  Status:          🚨 OVERDUE by 5 days - ROTATE IMMEDIATELY
  Progress:        ████████████████████ 105%
  Last Rotated:    2025-09-03 (95 days ago)
  Next Rotation:   2025-12-02 (-5 days)
  Rotation Count:  2 times
  Frequency:       Every 90 days

OPENROUTER_API_KEY
  Risk Level:      HIGH
  Status:          ⚠️  Approaching rotation deadline (7 days remaining)
  Progress:        ████████████████░░░░ 83%
  Last Rotated:    2025-09-03 (83 days ago)
  Next Rotation:   2025-12-09 (7 days)
  Rotation Count:  1 times
  Frequency:       Every 90 days

...
```

**JSON Output Example**:
```json
[
  {
    "keyName": "ANTHROPIC_API_KEY",
    "status": "OVERDUE",
    "severity": "critical",
    "message": "🚨 OVERDUE by 5 days - ROTATE IMMEDIATELY",
    "riskLevel": "HIGH",
    "daysSinceRotation": 95,
    "daysUntilRotation": -5,
    "rotationProgress": 105,
    "lastRotated": "2025-09-03",
    "nextRotation": "2025-12-02",
    "rotationFrequency": 90,
    "rotationCount": 2
  }
]
```

**Automation Setup**:

Daily cron job (recommended):
```bash
# Add to crontab (run at 9 AM daily)
0 9 * * * cd /opt/unite-hub && node scripts/check-key-age.mjs --slack
```

CI/CD integration:
```yaml
# .github/workflows/key-rotation-check.yml
name: Key Rotation Check
on:
  schedule:
    - cron: '0 9 * * *'  # 9 AM daily
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm install
      - run: npm run security:key-check
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

### 3. `update-key-rotation.mjs`

**Purpose**: Record key rotation in rotation log after rotating a key

**Usage**:
```bash
# Basic rotation (scheduled)
node scripts/update-key-rotation.mjs ANTHROPIC_API_KEY

# Emergency rotation
node scripts/update-key-rotation.mjs STRIPE_SECRET_KEY --reason emergency

# With detailed notes
node scripts/update-key-rotation.mjs NEXTAUTH_SECRET \
  --reason policy \
  --notes "Rotated due to security audit recommendation"

# Specify who rotated (defaults to git user.email)
node scripts/update-key-rotation.mjs CRON_SECRET \
  --rotated-by security-team@unite-hub.com
```

**Arguments**:
- `<KEY_NAME>` (required) - Name of key being rotated
- `--reason <reason>` - Rotation reason:
  - `scheduled` (default) - Regular scheduled rotation
  - `emergency` - Compromised or suspected compromise
  - `policy` - Required by security policy/audit
  - `other` - Other reason (add notes)
- `--notes "<notes>"` - Additional context about the rotation
- `--rotated-by <email>` - Email of person performing rotation

**Interactive Example**:
```bash
$ node scripts/update-key-rotation.mjs ANTHROPIC_API_KEY

═══════════════════════════════════════════════════════════
  Key Rotation Log Update
═══════════════════════════════════════════════════════════

Key: ANTHROPIC_API_KEY
Provider: Anthropic
Risk Level: HIGH
Current Last Rotated: 2025-09-03
Current Next Rotation: 2025-12-02
Rotation Frequency: 90 days

New values:
Last Rotated: 2025-12-07
Next Rotation: 2026-03-07
Rotated By: security-team@unite-hub.com
Reason: scheduled

Update rotation log with these values? (y/n): y

✅ Key rotation recorded successfully

Next steps:
  1. Verify the new key is working in production
  2. Monitor for API errors over the next 24 hours
  3. Deactivate the old key at the provider after 24h grace period

See docs/SECURITY_KEY_ROTATION.md for detailed procedures
```

**What It Does**:
1. Updates `lastRotated` to today's date
2. Calculates new `nextRotation` based on frequency
3. Adds entry to `rotationHistory` array
4. Updates `lastUpdated` timestamp in log file
5. Saves updated log to `key-rotation-log.json`

**Call This AFTER**:
1. Generating new key at provider
2. Updating key in Vercel environment variables
3. Deploying with new key
4. Verifying new key works correctly

**DO NOT call this BEFORE** actually rotating the key at the provider!

---

## File: `key-rotation-log.json`

**Location**: `D:\Unite-Hub\key-rotation-log.json`

**Purpose**: Track all API key rotation dates and history

**Structure**:
```json
{
  "version": "1.0.0",
  "lastUpdated": "2025-12-07T10:30:00Z",
  "description": "API Key Rotation Tracking for Unite-Hub",
  "keys": {
    "ANTHROPIC_API_KEY": {
      "lastRotated": "2025-12-07",
      "nextRotation": "2026-03-07",
      "rotationFrequencyDays": 90,
      "riskLevel": "HIGH",
      "provider": "Anthropic",
      "rotationHistory": [
        {
          "date": "2025-12-07",
          "rotatedBy": "security-team@unite-hub.com",
          "reason": "scheduled",
          "notes": "Quarterly rotation"
        }
      ]
    }
  }
}
```

**Fields**:
- `lastRotated` - ISO date of last rotation (YYYY-MM-DD)
- `nextRotation` - ISO date when next rotation is due
- `rotationFrequencyDays` - How often to rotate (30, 90, or 180 days)
- `riskLevel` - Security risk if compromised (CRITICAL, HIGH, MEDIUM, LOW)
- `provider` - Service provider name (Anthropic, Stripe, etc.)
- `rotationHistory` - Array of past rotations (kept last 10 entries)

**Security Notes**:
- ✅ **DOES** contain rotation dates
- ✅ **DOES** contain rotation history
- ❌ **DOES NOT** contain actual API keys
- ✅ **SAFE** to commit to git
- ⚠️ **SENSITIVE** information about rotation schedule (could aid attackers)

**Git Recommendation**: Commit to private repositories only

---

## Common Workflows

### Initial Setup

```bash
# 1. Create rotation log
npm run security:key-init

# 2. Update last rotation dates for existing keys
npm run security:key-rotate ANTHROPIC_API_KEY
npm run security:key-rotate STRIPE_SECRET_KEY
npm run security:key-rotate SUPABASE_SERVICE_ROLE_KEY
# ... repeat for all keys

# 3. Check status
npm run security:key-check

# 4. Set up daily monitoring
# Add to crontab or CI/CD (see automation section above)
```

### Scheduled Rotation (90-day)

```bash
# 1. Check which keys need rotation
npm run security:key-check

# 2. Follow rotation procedure in docs/SECURITY_KEY_ROTATION.md
# (Generate new key at provider, update Vercel, deploy, verify)

# 3. Record rotation
npm run security:key-rotate ANTHROPIC_API_KEY

# 4. Verify update
npm run security:key-check
```

### Emergency Rotation (Compromised Key)

```bash
# 1. Immediately revoke old key at provider
# (Don't wait for deployment)

# 2. Generate new key at provider

# 3. Update Vercel environment
# Vercel Dashboard → Environment Variables → Update key

# 4. Trigger immediate deployment
vercel --prod

# 5. Verify new key works
curl -X POST https://unite-hub.com/api/test-endpoint

# 6. Record emergency rotation
npm run security:key-rotate ANTHROPIC_API_KEY \
  --reason emergency \
  --notes "Key found in public GitHub commit abc123"

# 7. Alert team
npm run security:key-check:slack
```

### Monthly High-Risk Key Rotation

```bash
# SUPABASE_SERVICE_ROLE_KEY rotates every 30 days (highest risk)

# 1. Check rotation status
npm run security:key-check

# 2. Follow Supabase service role rotation procedure
# (see docs/SECURITY_KEY_ROTATION.md section 5)

# 3. Record rotation
npm run security:key-rotate SUPABASE_SERVICE_ROLE_KEY \
  --notes "Monthly rotation - bypasses RLS"

# 4. Verify all services using service role key
# (email agent, cron jobs, database migrations)
```

---

## Troubleshooting

### Error: Key rotation log not found

```bash
# Create the log file
npm run security:key-init
```

### Error: Key not found in rotation log

```bash
# Check available keys
npm run security:key-check

# If key is missing, manually add to key-rotation-log.json
# Use existing key structure as template
```

### Warning: SLACK_WEBHOOK_URL not set

```bash
# Set environment variable for Slack notifications
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Or add to .env.local (for local development)
echo "SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL" >> .env.local
```

### Keys showing as "Never Rotated"

This is normal for initial setup. Update with actual rotation dates:

```bash
npm run security:key-rotate ANTHROPIC_API_KEY \
  --notes "Updating initial rotation date"
```

### Check exits with code 2 (overdue keys)

**This is critical!** Rotate overdue keys immediately:

1. Check which keys are overdue:
   ```bash
   npm run security:key-check
   ```

2. Prioritize by risk level:
   - CRITICAL: Rotate within 4 hours
   - HIGH: Rotate within 24 hours
   - MEDIUM: Rotate within 7 days
   - LOW: Rotate within 30 days

3. Follow rotation procedures in `docs/SECURITY_KEY_ROTATION.md`

---

## Integration with CI/CD

### GitHub Actions Example

```yaml
# .github/workflows/security-key-check.yml
name: Security - Key Rotation Check
on:
  schedule:
    - cron: '0 9 * * *'  # 9 AM daily
  workflow_dispatch:     # Manual trigger

jobs:
  check-key-rotation:
    name: Check API Key Rotation Status
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install dependencies
        run: npm ci

      - name: Check key rotation status
        id: check
        run: |
          npm run security:key-check:json > key-status.json
          cat key-status.json

      - name: Send Slack notification
        if: always()
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
        run: npm run security:key-check:slack

      - name: Upload key status
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: key-rotation-status
          path: key-status.json

      - name: Fail if overdue keys
        run: npm run security:key-check
```

### Vercel Cron Job Example

```typescript
// app/api/cron/check-key-rotation/route.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { stdout } = await execAsync('node scripts/check-key-age.mjs --slack');
    return Response.json({ success: true, output: stdout });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/check-key-rotation",
      "schedule": "0 9 * * *"
    }
  ]
}
```

---

## Best Practices

### DO ✅

1. **Run checks daily**: Set up automated monitoring
2. **Rotate proactively**: Don't wait for overdue alerts
3. **Record immediately**: Update log right after rotation
4. **Monitor after rotation**: Watch for API errors for 24 hours
5. **Keep grace period**: Don't deactivate old key immediately
6. **Document emergencies**: Use `--notes` for emergency rotations
7. **Test in staging first**: Verify new key before production

### DON'T ❌

1. **Don't skip recording**: Always update log after rotation
2. **Don't rotate all at once**: Stagger rotations to reduce risk
3. **Don't delete history**: Keep rotation history for audit trail
4. **Don't commit actual keys**: Log file contains dates, not keys
5. **Don't ignore warnings**: Rotate keys approaching deadline
6. **Don't rush**: Follow full rotation procedure in docs
7. **Don't test with production keys**: Use separate keys for testing

---

## Security Considerations

### Log File Security

The `key-rotation-log.json` file contains:
- **✅ Safe**: Rotation dates, frequencies, risk levels
- **⚠️ Sensitive**: Rotation schedule (could aid timing attacks)
- **❌ Never includes**: Actual API key values

**Recommendations**:
- Commit to private repositories only
- Don't expose in public documentation
- Include in `.gitignore` for maximum security (optional)
- Restrict file permissions on server: `chmod 600`

### Monitoring Security

**Watch for**:
- Sudden changes to rotation log (unauthorized modification)
- Multiple failed rotation attempts
- Keys rotated outside normal schedule
- Rotation log deletion or corruption

**Set up alerts**:
```bash
# Git hook to alert on rotation log changes
# .git/hooks/post-commit
if git diff HEAD~1 --name-only | grep -q "key-rotation-log.json"; then
  echo "⚠️  Key rotation log modified in this commit"
  # Send notification to security team
fi
```

---

## Related Documentation

- **Full rotation procedures**: `docs/SECURITY_KEY_ROTATION.md`
- **Emergency procedures**: `docs/SECURITY_KEY_ROTATION.md#emergency-rotation-procedure`
- **Provider-specific notes**: `docs/SECURITY_KEY_ROTATION.md#appendix-provider-specific-notes`
- **Compliance requirements**: `docs/SECURITY_KEY_ROTATION.md#compliance--auditing`

---

## Support

**Issues**: Create GitHub issue with `security` label
**Urgent**: Contact security@unite-hub.com or PagerDuty on-call
**Slack**: #security channel for questions

---

**Last Updated**: 2025-12-02
**Maintained By**: Security Team
