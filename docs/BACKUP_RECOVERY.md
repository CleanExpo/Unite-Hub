# Unite-Hub Backup & Disaster Recovery

**Version**: 1.0.0
**Last Updated**: 2025-11-30
**Phase**: 11 - Deployment Infrastructure

---

## Overview

This document covers backup strategies, recovery procedures, and disaster recovery planning for Unite-Hub production systems.

### Recovery Objectives

| Metric | Target | Description |
|--------|--------|-------------|
| **RPO** (Recovery Point Objective) | 1 hour | Maximum data loss tolerance |
| **RTO** (Recovery Time Objective) | 4 hours | Maximum downtime tolerance |
| **MTTR** (Mean Time to Recovery) | < 30 min | Average recovery time |

---

## 1. Database Backup Strategy

### 1.1 Supabase Automatic Backups

Supabase provides automatic backups on Pro plans and above:

| Plan | Backup Frequency | Retention |
|------|------------------|-----------|
| Free | Daily | 7 days |
| Pro | Daily + PITR | 7 days |
| Team | Daily + PITR | 30 days |
| Enterprise | Continuous | Custom |

**PITR (Point-in-Time Recovery)**: Available on Pro+ plans, allows recovery to any point in time within retention window.

### 1.2 Manual Backup Procedure

#### Via Supabase Dashboard
1. Navigate to **Settings → Database**
2. Click **"Download backup"**
3. Store securely (encrypted, off-site)

#### Via pg_dump (Full Backup)
```bash
# Set environment
export PGPASSWORD=$SUPABASE_DB_PASSWORD

# Full database dump
pg_dump \
  -h db.[project-ref].supabase.co \
  -U postgres \
  -d postgres \
  -F c \
  -f unite_hub_backup_$(date +%Y%m%d_%H%M%S).dump

# Schema only
pg_dump \
  -h db.[project-ref].supabase.co \
  -U postgres \
  -d postgres \
  --schema-only \
  -f unite_hub_schema_$(date +%Y%m%d).sql
```

#### Critical Tables Backup
```sql
-- Export critical tables to CSV
\copy contacts TO '/backups/contacts_backup.csv' CSV HEADER;
\copy organizations TO '/backups/organizations_backup.csv' CSV HEADER;
\copy user_profiles TO '/backups/user_profiles_backup.csv' CSV HEADER;
\copy campaigns TO '/backups/campaigns_backup.csv' CSV HEADER;
\copy drip_campaigns TO '/backups/drip_campaigns_backup.csv' CSV HEADER;
```

### 1.3 Backup Schedule

| Backup Type | Frequency | Retention | Storage |
|-------------|-----------|-----------|---------|
| Supabase Auto | Daily | 7-30 days | Supabase |
| Manual Full | Weekly | 90 days | S3/GCS |
| Critical Tables | Daily | 30 days | S3/GCS |
| Schema Only | On migration | Forever | Git repo |

### 1.4 Backup Verification

Monthly verification procedure:

```bash
# 1. Restore to test environment
pg_restore \
  -h localhost \
  -U postgres \
  -d unite_hub_test \
  -c \
  unite_hub_backup_latest.dump

# 2. Run integrity checks
psql -d unite_hub_test -c "SELECT COUNT(*) FROM contacts;"
psql -d unite_hub_test -c "SELECT COUNT(*) FROM organizations;"

# 3. Verify data consistency
psql -d unite_hub_test -c "
  SELECT
    (SELECT COUNT(*) FROM contacts) as contacts,
    (SELECT COUNT(*) FROM campaigns) as campaigns,
    (SELECT COUNT(*) FROM user_profiles) as users;
"
```

---

## 2. Application Backup

### 2.1 Code Repository
- **Primary**: GitHub (main branch)
- **Mirror**: GitHub backup or secondary remote
- **Tags**: All releases tagged (`v1.0.0`, `v1.0.1`, etc.)

### 2.2 Environment Configuration
```bash
# Backup environment variables (encrypted)
vercel env pull .env.production.backup
gpg -c .env.production.backup
# Store encrypted file securely
```

### 2.3 Infrastructure as Code
Maintain configuration files in version control:
- `vercel.json` - Vercel configuration
- `supabase/config.toml` - Supabase settings
- `.github/workflows/` - CI/CD pipelines

---

## 3. Recovery Procedures

### 3.1 Database Recovery (PITR)

**Scenario**: Need to recover to a specific point in time.

```sql
-- Via Supabase Dashboard:
-- 1. Go to Settings → Database → Backups
-- 2. Select "Point-in-time recovery"
-- 3. Choose timestamp
-- 4. Confirm recovery
```

**Via API (for Enterprise)**:
```bash
curl -X POST "https://api.supabase.com/v1/projects/{ref}/restore" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -d '{"target_time": "2025-11-30T12:00:00Z"}'
```

### 3.2 Full Database Restore

**Scenario**: Complete database corruption or loss.

```bash
# 1. Create new Supabase project (if needed)
# 2. Get connection details
# 3. Restore from backup
pg_restore \
  -h db.[new-project-ref].supabase.co \
  -U postgres \
  -d postgres \
  --clean \
  --if-exists \
  unite_hub_backup_latest.dump

# 4. Verify RLS policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';

# 5. Update environment variables with new project details
```

### 3.3 Partial Table Recovery

**Scenario**: Accidentally deleted or corrupted data in one table.

```sql
-- 1. Create recovery table
CREATE TABLE contacts_recovery AS
SELECT * FROM contacts WHERE false;

-- 2. Import from backup
\copy contacts_recovery FROM '/backups/contacts_backup.csv' CSV HEADER;

-- 3. Identify missing/corrupted records
SELECT r.id, r.email, c.id as current_id
FROM contacts_recovery r
LEFT JOIN contacts c ON r.id = c.id
WHERE c.id IS NULL OR r.updated_at > c.updated_at;

-- 4. Restore specific records
INSERT INTO contacts
SELECT * FROM contacts_recovery r
WHERE NOT EXISTS (SELECT 1 FROM contacts c WHERE c.id = r.id);

-- 5. Cleanup
DROP TABLE contacts_recovery;
```

### 3.4 Application Rollback

**Scenario**: Bad deployment causing issues.

```bash
# Via Vercel Dashboard (fastest):
# 1. Go to Deployments
# 2. Find last working deployment
# 3. Click "..." → "Promote to Production"

# Via CLI:
vercel rollback [deployment-url]
```

---

## 4. Disaster Recovery Plan

### 4.1 Disaster Scenarios

| Scenario | Likelihood | Impact | Recovery Strategy |
|----------|------------|--------|-------------------|
| Database corruption | Low | Critical | PITR, restore from backup |
| Vercel outage | Very Low | High | Wait or migrate to backup host |
| Supabase outage | Very Low | Critical | Wait or restore to self-hosted |
| Accidental deletion | Medium | Variable | PITR, table recovery |
| Security breach | Low | Critical | Incident response + recovery |
| Region failure | Very Low | Critical | Cross-region restore |

### 4.2 Communication Plan

**Internal Notification Chain**:
1. DevOps/SRE team (immediate)
2. Engineering lead (within 15 min)
3. Product/CEO (within 30 min if major)

**Customer Communication**:
1. Status page update (immediate)
2. Email notification (if > 1 hour downtime)
3. Post-mortem within 48 hours

### 4.3 Recovery Runbook

#### Step 1: Assessment (0-5 min)
```bash
# Check system status
curl -I https://unite-hub.com/api/health

# Check Vercel status
curl -s https://www.vercelstatus.com/api/v2/status.json | jq '.status'

# Check Supabase status
curl -s https://status.supabase.com/api/v2/status.json | jq '.status'
```

#### Step 2: Triage (5-15 min)
- Is this a platform issue (Vercel/Supabase) or application issue?
- What is affected? (Full outage, partial, specific feature)
- What was the last change? (Deployment, migration, config)

#### Step 3: Mitigation (15-60 min)
- **Platform issue**: Wait + communicate status
- **Bad deployment**: Rollback via Vercel
- **Database issue**: Initiate PITR or backup restore
- **Configuration issue**: Fix config, redeploy

#### Step 4: Resolution (1-4 hours)
- Complete recovery procedures
- Verify all systems operational
- Run smoke tests
- Update status page

#### Step 5: Post-Incident (24-48 hours)
- Write incident report
- Identify root cause
- Implement preventive measures
- Update runbooks if needed

---

## 5. Testing & Drills

### 5.1 Quarterly Backup Test
1. Restore backup to test environment
2. Verify data integrity
3. Test application functionality
4. Document results

### 5.2 Annual DR Drill
1. Simulate complete outage scenario
2. Execute recovery procedures
3. Measure RTO/RPO achievements
4. Identify improvements

### 5.3 Test Checklist
- [ ] Database restore successful
- [ ] Application functional post-restore
- [ ] User authentication working
- [ ] Data integrity verified
- [ ] Performance acceptable
- [ ] No data loss beyond RPO

---

## 6. Backup Storage & Security

### 6.1 Storage Locations
| Backup Type | Primary | Secondary |
|-------------|---------|-----------|
| Database | Supabase | AWS S3 (encrypted) |
| Config | GitHub | Encrypted local |
| Secrets | Vercel | 1Password/Vault |

### 6.2 Security Requirements
- [ ] All backups encrypted at rest (AES-256)
- [ ] Backups encrypted in transit (TLS 1.3)
- [ ] Access logs enabled
- [ ] MFA required for backup access
- [ ] Regular access review (quarterly)

### 6.3 Retention Policy
| Data Type | Retention | Legal Requirement |
|-----------|-----------|-------------------|
| User data | 7 years | Australian Privacy Act |
| Transaction logs | 7 years | Tax requirements |
| Audit logs | 3 years | Compliance |
| System backups | 90 days | Operational |

---

## 7. Quick Reference

### Emergency Contacts
| Role | Contact | Available |
|------|---------|-----------|
| DevOps Lead | [Slack handle] | 24/7 |
| DBA | [Slack handle] | Business hours |
| Security | [Slack handle] | 24/7 |
| Supabase Support | support@supabase.io | 24/7 (Enterprise) |
| Vercel Support | support@vercel.com | 24/7 (Enterprise) |

### Critical URLs
- Vercel Dashboard: https://vercel.com/unite-hub
- Supabase Dashboard: https://supabase.com/dashboard/project/[ref]
- Status Page: https://status.unite-hub.com
- Sentry: https://sentry.io/organizations/unite-hub

### Key Commands
```bash
# Quick health check
curl https://unite-hub.com/api/health

# View recent errors
sentry-cli issues list --project unite-hub

# Check database connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# View deployment logs
vercel logs --prod
```

---

*Last Updated: 2025-11-30*
*Review Schedule: Quarterly*
*Next Drill: Q1 2026*
