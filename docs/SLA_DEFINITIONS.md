# Unite-Hub / Synthex Service Level Agreement (SLA)

**Version**: 1.0.0
**Effective Date**: 2025-12-01
**Last Updated**: 2025-11-30

---

## 1. Service Availability

### 1.1 Uptime Commitment

| Tier | Monthly Uptime SLA | Max Downtime/Month |
|------|-------------------|-------------------|
| Starter | 99.5% | ~3.6 hours |
| Professional | 99.9% | ~43 minutes |
| Elite | 99.95% | ~22 minutes |

**Uptime Calculation**:
```
Uptime % = ((Total Minutes - Downtime Minutes) / Total Minutes) × 100
```

### 1.2 Scheduled Maintenance

- **Window**: Sundays 2:00 AM - 6:00 AM AEST
- **Notice**: 72 hours advance notice for planned maintenance
- **Exclusion**: Scheduled maintenance does not count against uptime SLA
- **Emergency**: Critical security patches may be applied with shorter notice

### 1.3 Exclusions

The following are excluded from uptime calculations:
- Scheduled maintenance windows
- Force majeure events (natural disasters, war, etc.)
- Third-party service outages (AWS, Google, Stripe)
- Customer-caused issues (misconfiguration, abuse)
- Features explicitly marked as "beta" or "preview"

---

## 2. Support Response Times

### 2.1 Support Channels by Tier

| Channel | Starter | Professional | Elite |
|---------|---------|--------------|-------|
| Knowledge Base | ✅ 24/7 | ✅ 24/7 | ✅ 24/7 |
| Email Support | ✅ | ✅ | ✅ |
| Live Chat | - | ✅ Business hours | ✅ 24/7 |
| Phone Support | - | - | ✅ Business hours |
| Dedicated CSM | - | - | ✅ |

**Business Hours**: Monday-Friday, 9:00 AM - 5:00 PM AEST

### 2.2 Response Time Targets

| Priority | Starter | Professional | Elite |
|----------|---------|--------------|-------|
| Critical (P1) | 24 hours | 4 hours | 1 hour |
| High (P2) | 48 hours | 8 hours | 4 hours |
| Medium (P3) | 72 hours | 24 hours | 8 hours |
| Low (P4) | 5 business days | 48 hours | 24 hours |

### 2.3 Priority Definitions

| Priority | Definition | Examples |
|----------|------------|----------|
| **P1 - Critical** | Service completely unavailable; major business impact | Complete outage, data loss, security breach |
| **P2 - High** | Major feature unavailable; significant impact | Email sending broken, login failures |
| **P3 - Medium** | Feature degraded; workaround available | Slow performance, minor UI issues |
| **P4 - Low** | Minor issue; minimal impact | Feature requests, documentation questions |

---

## 3. Performance Standards

### 3.1 Response Time Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response (p50) | < 200ms | 50th percentile |
| API Response (p95) | < 500ms | 95th percentile |
| API Response (p99) | < 1000ms | 99th percentile |
| Page Load (First Contentful Paint) | < 1.5s | Core Web Vitals |
| Page Load (Time to Interactive) | < 3.0s | Core Web Vitals |

### 3.2 Email Delivery

| Metric | Target |
|--------|--------|
| Delivery rate | > 98% |
| Bounce rate | < 2% |
| Spam complaint rate | < 0.1% |
| Send queue time | < 5 minutes |

### 3.3 Data Processing

| Operation | Target |
|-----------|--------|
| Contact import (1,000 records) | < 2 minutes |
| Campaign send (1,000 recipients) | < 10 minutes |
| Report generation | < 30 seconds |
| AI scoring update | < 5 seconds |

---

## 4. Data & Security

### 4.1 Data Backup

| Aspect | Commitment |
|--------|------------|
| Backup frequency | Daily |
| Backup retention | 30 days (Pro), 90 days (Elite) |
| Point-in-time recovery | Available (Pro+) |
| Geographic redundancy | Australian data centers |

### 4.2 Security Standards

| Standard | Status |
|----------|--------|
| Data encryption at rest | AES-256 |
| Data encryption in transit | TLS 1.3 |
| Authentication | OAuth 2.0 PKCE |
| Access logging | Full audit trail |
| Vulnerability scanning | Weekly |
| Penetration testing | Annual |

### 4.3 Compliance

- Australian Privacy Act compliance
- GDPR readiness (for international data)
- SOC 2 Type II (planned)

---

## 5. Service Credits

### 5.1 Credit Calculation

If monthly uptime falls below the SLA commitment:

| Uptime Achieved | Service Credit |
|-----------------|----------------|
| 99.0% - 99.9% | 10% of monthly fee |
| 98.0% - 99.0% | 25% of monthly fee |
| 95.0% - 98.0% | 50% of monthly fee |
| Below 95.0% | 100% of monthly fee |

### 5.2 Credit Request Process

1. Submit credit request within 30 days of incident
2. Include: Account ID, incident date/time, description
3. Credits applied to next billing cycle
4. Maximum credit: 100% of one month's fee

### 5.3 Credit Exclusions

Credits do not apply when:
- Customer caused the issue
- Scheduled maintenance window
- External factors beyond our control
- Customer fails to report within 30 days

---

## 6. Customer Responsibilities

### 6.1 Account Management

- Maintain accurate contact information
- Protect account credentials
- Report security concerns immediately
- Keep payment information current

### 6.2 Acceptable Use

- Comply with anti-spam regulations
- Maintain list hygiene (< 2% bounce rate)
- Respect rate limits
- Not use for illegal activities

### 6.3 Data Quality

- Ensure imported data is clean
- Maintain opt-in consent records
- Process unsubscribes promptly

---

## 7. Communication

### 7.1 Incident Communication

| Severity | Initial Notification | Updates |
|----------|---------------------|---------|
| Critical | Within 15 minutes | Every 30 minutes |
| High | Within 1 hour | Every 2 hours |
| Medium | Within 4 hours | Every 8 hours |
| Low | Within 24 hours | As resolved |

### 7.2 Communication Channels

- **Status Page**: status.synthex.com.au (real-time)
- **Email**: Automatic alerts for affected customers
- **In-App**: Banner notifications for active sessions
- **Twitter/X**: @SynthexStatus for major incidents

### 7.3 Post-Incident Reports

For P1/P2 incidents:
- Initial report within 24 hours
- Root cause analysis within 5 business days
- Prevention measures documented

---

## 8. Escalation Path

### 8.1 Support Escalation

| Level | Response Time | Contact |
|-------|--------------|---------|
| L1 - Support Agent | First response | support@synthex.com.au |
| L2 - Senior Support | 4 hours | Automatic escalation |
| L3 - Engineering | 8 hours | Automatic escalation |
| L4 - Management | 24 hours | escalations@synthex.com.au |

### 8.2 Account Escalation

For Elite customers:
- CSM is primary escalation point
- Direct line to engineering team
- Executive sponsor available

---

## 9. Termination & Data

### 9.1 Contract Terms

- Monthly plans: Cancel anytime
- Annual plans: Cancel with 30 days notice
- No early termination fees

### 9.2 Data Export

- Full data export available in dashboard
- Export formats: CSV, JSON
- Export includes: Contacts, campaigns, analytics
- Export available for 30 days post-termination

### 9.3 Data Deletion

- Upon request, data deleted within 30 days
- Backup data purged within 90 days
- Written confirmation provided

---

## 10. SLA Review

### 10.1 Review Schedule

- Quarterly internal SLA review
- Annual SLA terms review
- Customer feedback incorporated

### 10.2 Changes to SLA

- 30 days notice for material changes
- Changes effective next billing cycle
- Customer may terminate if terms are unacceptable

---

## Contact Information

| Purpose | Contact |
|---------|---------|
| Support | support@synthex.com.au |
| Billing | billing@synthex.com.au |
| Security | security@synthex.com.au |
| Legal | legal@synthex.com.au |
| Escalations | escalations@synthex.com.au |

**Mailing Address**:
Synthex (Unite Group)
Brisbane, QLD, Australia

---

*This SLA is subject to the Master Service Agreement and Terms of Service.*
*Last Updated: 2025-11-30*
