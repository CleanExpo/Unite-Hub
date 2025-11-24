# Safe Database Migration Patterns

**Version**: 1.0.0
**Last Updated**: 2025-11-25
**Priority**: P0 - Critical for Zero-Downtime

---

## OVERVIEW

All schema changes must follow the **expand-migrate-contract pattern**:
1. **Expand**: Add new schema (backward-compatible)
2. **Migrate**: Deploy code that uses both old and new
3. **Contract**: Remove old schema (after code fully migrated)

---

## SAFE PATTERNS

### Pattern 1: Adding a Column

SAFE: Adding optional columns
```sql
ALTER TABLE contacts ADD COLUMN phone_number TEXT;
ALTER TABLE contacts ADD COLUMN status TEXT DEFAULT 'active';
```

### Pattern 2: Renaming a Column (Multi-Phase)

DANGEROUS: Single-step rename breaks code immediately
```sql
-- DON'T DO THIS
ALTER TABLE contacts RENAME COLUMN email TO email_address;
```

SAFE: Three-phase approach

**Migration 001**: Add new column
```sql
ALTER TABLE contacts ADD COLUMN email_address TEXT;
UPDATE contacts SET email_address = email WHERE email_address IS NULL;
```

**Code v1**: Reads from both
```typescript
const email = contact.email_address || contact.email;
```

**Migration 002**: Make new column required
```sql
ALTER TABLE contacts ALTER COLUMN email_address SET NOT NULL;
```

**Code v2**: Writes to both
```typescript
await supabase.from('contacts').update({
  email: newEmail,
  email_address: newEmail
});
```

**Migration 003**: Remove old column
```sql
ALTER TABLE contacts DROP COLUMN email;
```

### Pattern 3: Adding an Index

SAFE: Non-blocking index creation
```sql
CREATE INDEX CONCURRENTLY idx_contacts_email ON contacts(email);
```

DANGEROUS: Blocking index locks table
```sql
-- DON'T DO THIS
CREATE INDEX idx_contacts_email ON contacts(email);
```

### Pattern 4: Adding Constraints

SAFE: Add constraint NOT VALID first
```sql
ALTER TABLE contacts 
  ADD CONSTRAINT valid_email 
  CHECK (email ~ '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
  NOT VALID;

ALTER TABLE contacts VALIDATE CONSTRAINT valid_email;
```

---

## MIGRATION TESTING CHECKLIST

Before running ANY migration:

- [ ] Test on local database
- [ ] Test on staging database
- [ ] Verify old code still works after migration
- [ ] Document rollback SQL
- [ ] Schedule during low-traffic window (2-4 AM)
- [ ] Monitor for 24+ hours post-migration

---

## ROLLBACK STRATEGIES

### Drop Added Column
```sql
ALTER TABLE contacts DROP COLUMN IF EXISTS new_column;
```

### Restore Renamed Column
```sql
ALTER TABLE contacts RENAME COLUMN email_address TO email;
```

### Remove Constraint
```sql
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS valid_email;
```

---

## EXECUTION GUIDELINES

### Timing
- **Weekday**: Tuesday-Thursday
- **Time**: 2-4 AM local time
- **Avoid**: Holidays, launch days

### Monitoring
- Error rate: <0.1%
- API response time: <200ms
- Database connections: <60
- Query latency: <100ms

### Alert Thresholds
- ROLLBACK if: Error rate >1% for 5+ minutes
- INVESTIGATE if: Response time >500ms sustained
- SUCCESS if: All metrics normal for 24+ hours

---

**Status**: Production-Ready
**Related**: DEPLOYMENT_STRATEGY.md
