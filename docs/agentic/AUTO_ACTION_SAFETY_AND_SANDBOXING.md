# Auto-Action Safety & Sandboxing

**Version**: 1.0.0
**Last Updated**: 2025-11-28

---

## Safety Philosophy

The Synthex Auto-Action Engine follows a **safety-first** approach:

1. **Defense in Depth**: Multiple layers of protection
2. **Principle of Least Privilege**: Only necessary permissions
3. **Human-in-the-Loop**: Critical actions require approval
4. **Fail-Safe Defaults**: Stop on error, not continue

---

## Critical Point System

### Categories

| Category | Description | Examples | Risk Level |
|----------|-------------|----------|------------|
| `financial_information` | Payment data | Credit cards, bank accounts | Critical |
| `identity_documents` | Personal ID | Passports, SSN, licenses | Critical |
| `passwords_and_security_answers` | Credentials | Passwords, 2FA codes | Critical |
| `final_submission_or_purchase` | Transactions | Orders, purchases, agreements | High |
| `irreversible_changes` | Permanent changes | Email change, ownership transfer | High |
| `destructive_actions` | Deletion/termination | Account deletion, data erasure | High |

### Detection Patterns

The guard uses regex patterns to detect critical content:

```typescript
// Financial
/credit.?card/i
/card.?number/i
/cvv|cvc|security.?code/i
/bank.?account/i
/payment.?method/i

// Identity
/passport/i
/driver.?s?.?licen[sc]e/i
/social.?security/i
/ssn|sin|tin/i

// Security
/password/i
/secret.?question/i
/two.?factor|2fa|mfa/i
/recovery.?code/i

// Submission
/submit.?order/i
/confirm.?purchase/i
/sign.?agreement/i
/accept.?terms/i

// Destructive
/delete.?account/i
/terminate/i
/erase.?data/i
```

### Approval Flow

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│ Action       │────►│ Critical Point  │────►│ Wait for     │
│ Planned      │     │ Detection       │     │ Approval     │
└──────────────┘     └─────────────────┘     └──────┬───────┘
                                                     │
                     ┌──────────────────────────────┴───────────────────────┐
                     │                                                       │
                     ▼                                                       ▼
              ┌──────────────┐                                      ┌──────────────┐
              │ User Approves│                                      │ User Rejects │
              │              │                                      │ or Timeout   │
              └──────┬───────┘                                      └──────┬───────┘
                     │                                                     │
                     ▼                                                     ▼
              ┌──────────────┐                                      ┌──────────────┐
              │ Execute      │                                      │ Skip Action  │
              │ Action       │                                      │ Continue     │
              └──────────────┘                                      └──────────────┘
```

### Timeout Behavior

- Default timeout: 5 minutes (300,000ms)
- Auto-reject on timeout: Enabled by default
- Configurable via `CRITICAL_POINT_TIMEOUT`

---

## Sandbox Constraints

### Step Limits

| Constraint | Default | Purpose |
|------------|---------|---------|
| Max Steps | 50 | Prevent runaway automation |
| Step Timeout | 30 seconds | Prevent stuck actions |
| Session Timeout | 10 minutes | Prevent zombie sessions |

### Rate Limiting

| Limit | Default | Purpose |
|-------|---------|---------|
| Actions per Minute | 30 | Prevent rapid-fire actions |
| Sessions per Hour | 10 | Prevent abuse |

### Blocked Actions

These actions are **always blocked** regardless of approval:

- `deleteAccount`
- `formatDisk`
- `installSoftware`
- `modifySystemSettings`
- `accessTerminal`
- `runShellCommands`

### Origin Restrictions

Only allowed domains can be automated:

```env
AUTO_ACTION_ALLOWED_ORIGINS=localhost,synthex.social,unite-hub.com
```

The sandbox validates URLs before each action:

```typescript
function isOriginAllowed(url: string): boolean {
  const hostname = new URL(url).hostname.toLowerCase();
  return allowedOrigins.some((allowed) =>
    hostname.includes(allowed.toLowerCase())
  );
}
```

---

## Violation Handling

### Violation Types

| Type | Description | Response |
|------|-------------|----------|
| `rate_limit` | Too many actions/minute | Wait, continue |
| `blocked_action` | Action in blocklist | Skip, continue |
| `blocked_origin` | Domain not allowed | Skip, log error |
| `max_steps` | Step limit reached | End session |
| `timeout` | Session too long | End session |

### Violation Logging

All violations are logged with:
- Timestamp
- Violation type
- Message
- Context details

```typescript
{
  type: 'blocked_action',
  message: 'Action "deleteAccount" is blocked',
  timestamp: '2025-11-28T12:00:00Z',
  details: { action: 'deleteAccount' }
}
```

---

## Session Security

### Session Creation

```typescript
const session = sandboxManager.createSession(sessionId, userId);
```

Checks performed:
1. User's hourly session limit
2. No conflicting active sessions
3. Valid workspace context

### Session Validation

Before each action:

```typescript
const validation = sandboxManager.validateAction(sessionId, actionType, url);

if (!validation.allowed) {
  // Handle violation
  logger.logSandboxViolation(sessionId, validation.violation);
  return;
}
```

### Session Termination

Sessions end when:
- Task completes successfully
- User stops the session
- Maximum steps reached
- Session timeout exceeded
- Too many errors (5+)

---

## Audit Trail

### What's Logged

| Event | Data Captured |
|-------|---------------|
| Session Start | User, workspace, flow type, task |
| Action Planned | Action type, target, reasoning |
| Action Executed | Success/failure, screenshot (optional) |
| Critical Point | Category, risk, context |
| Approval | Response, responder, note |
| Violation | Type, message, details |
| Error | Error name, message, stack |
| Session End | Status, outcome, duration |

### Log Retention

- Default: 30 days
- Configurable via `AUTO_ACTION_LOG_RETENTION_DAYS`
- Automatic cleanup removes old sessions

### Log Access

Logs are filtered by user:
- Users can only see their own sessions
- Workspace admins can see workspace sessions
- Super admins can see all logs

---

## Risk Assessment

### Risk Levels

| Level | Score | Actions |
|-------|-------|---------|
| Low | < 0.3 | Proceed with logging |
| Medium | 0.3-0.6 | Proceed with caution |
| High | 0.6-0.8 | Require approval |
| Critical | > 0.8 | Always require approval |

### Risk Factors

1. **Category**: Financial and identity = higher risk
2. **Action Confidence**: Low confidence = higher risk
3. **Action Type**: Destructive = higher risk
4. **User History**: Many rejections = higher risk

---

## Best Practices

### For Developers

1. **Always validate inputs** before creating sessions
2. **Handle violations gracefully** - don't crash on errors
3. **Log everything** - helps debugging and compliance
4. **Test critical point detection** - ensure patterns work

### For Users

1. **Review approvals carefully** - understand what's being done
2. **Don't rush timeouts** - take time to verify
3. **Monitor progress** - watch the action log
4. **Report issues** - help improve detection patterns

### For Administrators

1. **Set appropriate limits** - balance security and usability
2. **Review logs regularly** - look for anomalies
3. **Update allowed origins** - only trusted domains
4. **Configure timeouts** - based on use case needs

---

## Compliance Considerations

### GDPR

- User consent required before automation
- Data minimization - only capture necessary data
- Right to erasure - logs can be deleted on request
- Audit trail maintained

### SOC 2

- Access controls enforced
- Audit logging enabled
- Change management tracked
- Security monitoring active

### PCI DSS

- Card data patterns detected
- Human approval required for payments
- Logs don't store card numbers
- Encrypted transmission

---

## Emergency Procedures

### Stopping a Runaway Session

```typescript
// Via API
await fetch('/api/auto-action/session', { method: 'DELETE' });

// Via code
const orchestrator = getComputerUseOrchestrator();
orchestrator.stop();
```

### Clearing All Sessions

```typescript
const sandbox = getSandboxManager();
for (const session of sandbox.getActiveSessions()) {
  sandbox.endSession(session.sessionId);
}
```

### Disabling Auto-Action

Set environment variable:
```env
AUTO_ACTION_ENABLED=false
```

All new sessions will be rejected immediately.

---

## Security Checklist

Before deploying:

- [ ] API keys not exposed in frontend
- [ ] Allowed origins configured
- [ ] Blocked actions list reviewed
- [ ] Rate limits appropriate
- [ ] Session timeouts set
- [ ] Audit logging enabled
- [ ] Critical point patterns tested
- [ ] Approval flow working
- [ ] Error handling in place
- [ ] Monitoring configured

---

## Incident Response

### If unauthorized automation detected:

1. **Stop all sessions** immediately
2. **Review audit logs** for affected data
3. **Revoke compromised credentials**
4. **Notify affected users**
5. **Implement additional controls**
6. **Document incident**

### If critical point bypassed:

1. **Stop the session**
2. **Review the action taken**
3. **Check detection patterns**
4. **Add missing patterns**
5. **Test improvements**
6. **Deploy fix**

---

## Related Documentation

- [SYNTHEX_AUTO_ACTION_ENGINE.md](./SYNTHEX_AUTO_ACTION_ENGINE.md) - Main overview
- [FARA7B_QWEN_INTEGRATION.md](./FARA7B_QWEN_INTEGRATION.md) - Model details
- [ONBOARDING_AUTOMATION_FLOWS.md](./ONBOARDING_AUTOMATION_FLOWS.md) - Flow templates
