# Phase B25 Quick Start Guide

**Feature**: Synthex Global Admin & Cross-Tenant Reporting
**Time to Setup**: 5 minutes

---

## Step 1: Apply Database Migration (2 min)

1. Open **Supabase Dashboard** → SQL Editor
2. Copy and paste the entire contents of:
   ```
   D:\Unite-Hub\supabase\migrations\431_synthex_admin_views.sql
   ```
3. Click **Run**
4. **Wait 1-5 minutes** for schema cache to update

---

## Step 2: Create Admin User (1 min)

1. Get your user ID from Supabase:
   ```sql
   SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
   ```

2. Insert admin record:
   ```sql
   INSERT INTO synthex_admins (user_id, scope)
   VALUES ('your-user-id-here', 'global')
   ON CONFLICT (user_id) DO NOTHING;
   ```

3. Verify:
   ```sql
   SELECT * FROM synthex_admins WHERE user_id = 'your-user-id-here';
   ```

---

## Step 3: Test API Endpoints (1 min)

### Option A: Browser
Navigate to:
```
http://localhost:3008/api/synthex/admin/overview
http://localhost:3008/api/synthex/admin/tenants
```

### Option B: cURL
```bash
# Get KPIs
curl http://localhost:3008/api/synthex/admin/overview

# Get tenant list
curl http://localhost:3008/api/synthex/admin/tenants?limit=5

# Get tenant health
curl http://localhost:3008/api/synthex/admin/tenants/[tenant-id]/health
```

---

## Step 4: Access Admin Console (1 min)

Navigate to:
```
http://localhost:3008/synthex/admin/overview
```

**Expected**:
- ✅ 4 KPI cards with data
- ✅ Plan distribution chart
- ✅ Status distribution chart
- ✅ Recent tenants table

Click **"View"** on any tenant → Tenant detail page

---

## Troubleshooting

### Error: 403 Forbidden
**Cause**: No admin record for your user
**Fix**: Run Step 2 again with correct user_id

### Error: Table/View doesn't exist
**Cause**: Migration not applied or schema cache not updated
**Fix**:
1. Verify migration ran: `SELECT * FROM synthex_admins LIMIT 1;`
2. Wait 5 more minutes for cache
3. Run `SELECT * FROM view_synthex_tenant_summary LIMIT 1;`

### Error: Empty data / No tenants
**Cause**: No tenant data in database yet
**Fix**: This is expected if no tenants exist. Create test tenant:
```sql
INSERT INTO synthex_tenants (owner_user_id, business_name, industry)
VALUES ('[your-user-id]', 'Test Business', 'trades');
```

### UI shows "Access Error"
**Cause**: Not logged in or not an admin
**Fix**:
1. Ensure you're logged into Synthex
2. Verify admin record exists (Step 2)

---

## Quick Reference

### Admin Scopes
- **global**: See all tenants
- **group**: See specific tenant_ids[] only
- **tenant**: See single tenant

### Health Score Ranges
- **100**: Active + recent activity (✅ Healthy)
- **80**: Trial + active (✅ Good)
- **60**: Default (⚠️ Monitor)
- **40**: Past due (⚠️ At-risk)
- **20**: Inactive 30+ days (❌ Dormant)
- **0**: Suspended/churned (❌ Lost)

### API Endpoints
```
GET  /api/synthex/admin/overview
GET  /api/synthex/admin/tenants
GET  /api/synthex/admin/tenants/[id]/health
POST /api/synthex/admin/tenants/[id]/actions
```

### UI Pages
```
/synthex/admin/overview         → Global KPIs
/synthex/admin/tenant/[id]      → Tenant detail
```

---

## Next Steps

1. ✅ Complete setup (Steps 1-4)
2. 📊 Review KPIs in admin console
3. 🔍 Inspect tenant health scores
4. 🎯 Run health checks on at-risk tenants
5. 📈 Monitor trends over time

---

## Full Documentation

See: `docs/PHASE_B25_SYNTHEX_GLOBAL_ADMIN_STATUS.md`

---

**Ready to go!** 🚀
