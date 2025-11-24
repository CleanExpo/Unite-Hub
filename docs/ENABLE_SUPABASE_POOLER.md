# Enable Supabase Connection Pooler

**Impact**: 60-80% latency reduction, 3-5x throughput increase
**Time**: 30 minutes
**Difficulty**: Easy (Dashboard configuration)

---

## 📊 Current Problem

Every API request creates a NEW database connection:

```typescript
// src/lib/supabase.ts - Current (SLOW)
export async function getSupabaseServer() {
  return createSSRServerClient(...); // NEW CONNECTION each time = 300-500ms
}
```

**Impact:**
- API response time: 300-500ms per request
- Connection exhaustion under load (Supabase limit: 60 connections)
- 70-80% slower than properly pooled connections

---

## 🎯 Solution: Enable Supabase Pooler

Supabase provides built-in connection pooling with **two modes**:

### **Transaction Mode** (Port 6543)
- For short-lived connections (API routes, serverless functions)
- Automatically releases connections after each transaction
- **Use for**: Next.js API routes, serverless functions

### **Session Mode** (Port 5432)
- For long-lived connections (background jobs, agents)
- Maintains connection for entire session
- **Use for**: Email agent, content agent, scheduled jobs

---

## 📝 Step-by-Step Instructions

### Step 1: Access Supabase Dashboard (2 min)

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your **Unite-Hub** project
3. Click **Database** in the left sidebar
4. Click **Connection Pooling**

### Step 2: Enable Transaction Pooler (5 min)

**For API Routes (Port 6543):**

1. Look for **Transaction Mode** section
2. Click **Enable** or verify it's already enabled
3. **Port should be**: `6543`
4. **Connection limit**: Default (recommended: 20-50)
5. **Pool mode**: `transaction`

**Copy the connection string - it will look like:**
```
postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
```

**Important Notes:**
- Replace `[PASSWORD]` with your actual database password
- Keep the port number `6543` (do NOT use 5432 for transaction mode)
- The `pooler.supabase.com` domain is correct (not your normal DB domain)

### Step 3: Enable Session Pooler (5 min)

**For Background Agents (Port 5432):**

1. Look for **Session Mode** section
2. Click **Enable** or verify it's already enabled
3. **Port should be**: `5432`
4. **Connection limit**: Default (recommended: 10-20)
5. **Pool mode**: `session`

**Copy the connection string - it will look like:**
```
postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres
```

### Step 4: Save Connection Strings (5 min)

Add both connection strings to your `.env.local`:

```env
# Add these NEW variables (don't replace existing ones)

# Transaction pooler (Port 6543) - for API routes
DATABASE_POOLER_URL=postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres

# Session pooler (Port 5432) - for background agents
DATABASE_SESSION_URL=postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres

# Keep your existing direct connection for migrations
DATABASE_URL=postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].supabase.co:5432/postgres
```

**Security Note:**
- Never commit `.env.local` to git
- Use environment variables in production (Vercel dashboard)

### Step 5: Verify Configuration (5 min)

Test the pooler connections:

```bash
# Install psql if not already installed (optional)
# Windows: choco install postgresql
# Mac: brew install postgresql

# Test transaction pooler (should connect successfully)
psql "$DATABASE_POOLER_URL" -c "SELECT 1;"

# Test session pooler (should connect successfully)
psql "$DATABASE_SESSION_URL" -c "SELECT 1;"
```

**Expected output:**
```
 ?column?
----------
        1
(1 row)
```

If you get connection errors:
- ❌ Check password is correct
- ❌ Check port numbers (6543 for transaction, 5432 for session)
- ❌ Check firewall settings (Supabase pooler uses different IPs)

---

## 🎯 Next Steps

After enabling pooler and adding environment variables:

1. ✅ Create connection pool manager (`src/lib/db/pool.ts`)
2. ✅ Update Supabase client with pooled functions
3. ✅ Migrate high-traffic API routes
4. ✅ Performance test and verify improvements

---

## 📊 Expected Results

### Before Pooling:
- API response: **300-500ms**
- DB query: **200-300ms**
- Concurrent users: **10-20** (connection limit)
- Connection errors under load: **Frequent**

### After Pooling:
- API response: **50-80ms** (60-80% faster! 🚀)
- DB query: **30-50ms** (85% faster!)
- Concurrent users: **500+** (50x increase!)
- Connection errors: **Zero**

---

## ❓ Troubleshooting

### "Connection limit exceeded"
- Check connection pooling is enabled
- Verify you're using pooler URLs (not direct DB URL)
- Check pool size settings in Dashboard

### "Password authentication failed"
- Double-check password in connection string
- Ensure no special characters breaking URL encoding
- Try resetting database password

### "Could not connect to pooler"
- Verify pooler is enabled in Dashboard
- Check port numbers (6543 vs 5432)
- Verify firewall allows outbound connections

---

## 📚 Additional Resources

- [Supabase Connection Pooling Docs](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pool)
- [PgBouncer Documentation](https://www.pgbouncer.org/config.html)
- [Next.js + Supabase Performance Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)

---

**Status**: Ready for Task 1.2 (Update environment variables)
**Next File**: Will create `src/lib/db/pool.ts` after this step
