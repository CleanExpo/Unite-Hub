# Rate Limiting Deployment Checklist

Use this checklist to verify the rate limiting implementation is complete and working.

---

## Pre-Deployment Checks

### 1. Files Created ✅

- [ ] `src/lib/services/rate-limit-service.ts` exists (344 lines)
- [ ] `src/app/api/_middleware/rate-limit.ts` exists (217 lines)
- [ ] `src/app/api/test-rate-limit/route.ts` exists (37 lines)
- [ ] `src/app/api/admin/rate-limits/route.ts` exists (91 lines)
- [ ] `src/app/api/admin/rate-limits/block-ip/route.ts` exists (94 lines)
- [ ] `docs/RATE_LIMITING_GUIDE.md` exists (520 lines)
- [ ] `scripts/test-rate-limiting.mjs` exists (150 lines)

### 2. Files Modified ✅

- [ ] `src/app/api/_middleware/with-api-handler.ts` updated (imports `applyRateLimit`)
- [ ] `src/app/api/_middleware/index.ts` updated (exports rate-limit)

### 3. Documentation ✅

- [ ] `RATE_LIMITING_IMPLEMENTATION.md` created (complete technical details)
- [ ] `RATE_LIMITING_SUMMARY.md` created (executive summary)
- [ ] `RATE_LIMITING_CHECKLIST.md` created (this file)
- [ ] `docs/RATE_LIMITING_GUIDE.md` created (usage guide)

---

## Database Setup

### 4. Migration 403 Applied

- [ ] Open Supabase Dashboard → SQL Editor
- [ ] Run: `supabase/migrations/403_rate_limiting_infrastructure.sql`
- [ ] Verify tables created:
  ```sql
  SELECT tablename FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename IN ('rate_limit_logs', 'rate_limit_overrides', 'blocked_ips');
  ```
  Expected: 3 rows returned

- [ ] Verify functions created:
  ```sql
  SELECT proname FROM pg_proc
  WHERE pronamespace = 'public'::regnamespace
  AND proname IN ('is_ip_blocked', 'get_rate_limit_override', 'log_rate_limit', 'cleanup_rate_limit_logs');
  ```
  Expected: 4 rows returned

- [ ] Verify view created:
  ```sql
  SELECT viewname FROM pg_views
  WHERE schemaname = 'public'
  AND viewname = 'rate_limit_analytics';
  ```
  Expected: 1 row returned

### 5. Database Permissions

- [ ] Test `is_ip_blocked()` function:
  ```sql
  SELECT public.is_ip_blocked('192.168.1.1');
  ```
  Expected: `false` (if IP not blocked)

- [ ] Test `get_rate_limit_override()` function:
  ```sql
  SELECT * FROM public.get_rate_limit_override('test-client', '/api/test', NULL);
  ```
  Expected: No rows (no overrides yet)

- [ ] Test `log_rate_limit()` function:
  ```sql
  SELECT public.log_rate_limit(
    'test-client',
    '/api/test',
    'client',
    true,
    50,
    NOW() + INTERVAL '1 minute',
    'GET',
    200
  );
  ```
  Expected: UUID returned

- [ ] Verify log was created:
  ```sql
  SELECT * FROM rate_limit_logs WHERE client_key = 'test-client';
  ```
  Expected: 1 row returned

---

## Local Testing

### 6. Start Development Server

- [ ] Run: `npm run dev`
- [ ] Server starts on port 3008
- [ ] No TypeScript compilation errors
- [ ] No import errors in console

### 7. Test Endpoints Exist

- [ ] GET `http://localhost:3008/api/test-rate-limit` → 200 OK
- [ ] POST `http://localhost:3008/api/test-rate-limit` → 200 OK
- [ ] GET `http://localhost:3008/api/health` → 200 OK

### 8. Test Rate Limiting Works

**Manual Test** (Public tier - 10/min):

- [ ] Run 10 requests to `/api/test-rate-limit`
  ```bash
  for i in {1..10}; do
    curl -w "\nStatus: %{http_code}\n" http://localhost:3008/api/test-rate-limit
  done
  ```
  Expected: All return 200

- [ ] Run 11th request
  ```bash
  curl -w "\nStatus: %{http_code}\n" http://localhost:3008/api/test-rate-limit
  ```
  Expected: Returns 429 (Rate Limited)

- [ ] Check response body includes:
  - `error.code: "SECURITY_RATE_LIMITED"`
  - `error.retryAfter: 60`
  - `error.tier: "staff"`

**Automated Test**:

- [ ] Run: `node scripts/test-rate-limiting.mjs`
- [ ] Test passes with "✓ All tests passed!"

### 9. Test Rate Limit Headers

- [ ] Make request to `/api/test-rate-limit`
- [ ] Check response headers include:
  - `X-RateLimit-Limit: 100`
  - `X-RateLimit-Remaining: 99` (or less)
  - `X-RateLimit-Reset: [timestamp]`
  - `X-RateLimit-Tier: staff`

### 10. Test Database Logging

- [ ] Make a few requests to `/api/test-rate-limit`
- [ ] Check database logs:
  ```sql
  SELECT * FROM rate_limit_logs
  ORDER BY created_at DESC
  LIMIT 10;
  ```
- [ ] Verify logs contain:
  - `client_key` (IP address)
  - `endpoint` (`/api/test-rate-limit`)
  - `tier` (`staff`)
  - `allowed` (`true` or `false`)
  - `remaining` (number)

### 11. Test IP Blocking (Admin Only)

**Note**: Requires ADMIN or FOUNDER role. Skip if not available.

- [ ] Get admin token: `$ADMIN_TOKEN`
- [ ] Block test IP:
  ```bash
  curl -X POST http://localhost:3008/api/admin/rate-limits/block-ip \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"ip": "127.0.0.1", "reason": "Test block", "duration": 60}'
  ```
  Expected: 200 OK with success message

- [ ] Try to access API from blocked IP:
  ```bash
  curl http://localhost:3008/api/test-rate-limit
  ```
  Expected: 403 Forbidden with `SECURITY_IP_BLOCKED` error

- [ ] Verify block in database:
  ```sql
  SELECT * FROM blocked_ips WHERE ip_address = '127.0.0.1';
  ```
  Expected: 1 row returned

- [ ] Unblock IP:
  ```bash
  curl -X DELETE "http://localhost:3008/api/admin/rate-limits/block-ip?ip=127.0.0.1" \
    -H "Authorization: Bearer $ADMIN_TOKEN"
  ```
  Expected: 200 OK

- [ ] Verify access restored:
  ```bash
  curl http://localhost:3008/api/test-rate-limit
  ```
  Expected: 200 OK

### 12. Test Rate Limit Overrides (Admin Only)

**Note**: Requires ADMIN or FOUNDER role. Skip if not available.

- [ ] Create override:
  ```bash
  curl -X POST http://localhost:3008/api/admin/rate-limits \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "endpointPattern": "/api/test-rate-limit",
      "maxRequests": 200,
      "windowSeconds": 60,
      "reason": "Testing override"
    }'
  ```
  Expected: 200 OK with success message

- [ ] Verify override in database:
  ```sql
  SELECT * FROM rate_limit_overrides
  WHERE endpoint_pattern = '/api/test-rate-limit';
  ```
  Expected: 1 row returned with `max_requests = 200`

### 13. Test Analytics (Admin Only)

- [ ] View analytics:
  ```bash
  curl "http://localhost:3008/api/admin/rate-limits?startDate=2024-01-01" \
    -H "Authorization: Bearer $ADMIN_TOKEN"
  ```
  Expected: 200 OK with analytics array

- [ ] View analytics in database:
  ```sql
  SELECT * FROM rate_limit_analytics
  WHERE date >= CURRENT_DATE - INTERVAL '7 days'
  ORDER BY total_requests DESC;
  ```
  Expected: Rows showing aggregated stats

---

## Integration Testing

### 14. Test with Existing Endpoints

Pick 3-5 existing API routes and add rate limiting:

**Example Route**: `/api/contacts/route.ts`

- [ ] Add `rateLimit` option to `withApiHandler`:
  ```typescript
  export const GET = withApiHandler(
    async (request, context) => {
      // existing logic
    },
    {
      auth: true,
      workspace: true,
      rateLimit: 'staff', // ADD THIS
    }
  );
  ```

- [ ] Test route still works (200 OK)
- [ ] Test rate limit headers present
- [ ] Test rate limiting works (429 after limit)

**Repeat for**:
- [ ] Route 1: _______________
- [ ] Route 2: _______________
- [ ] Route 3: _______________

### 15. Test Tier Detection

- [ ] Health check (`/api/health`) → public tier (10/min)
- [ ] Webhook (`/api/webhooks/stripe/test/route.ts` if exists) → webhook tier (1000/min)
- [ ] Auth endpoint (`/api/auth/[...nextauth]/route.ts`) → public tier (10/min)
- [ ] Agent endpoint (`/api/agents/*/route.ts`) → agent tier (200/min)
- [ ] Admin endpoint (`/api/admin/*/route.ts`) → admin tier (500/min)
- [ ] Client endpoint (`/api/client/*/route.ts`) → client tier (50/min)
- [ ] Staff endpoint (`/api/staff/*/route.ts`) → staff tier (100/min)

---

## Production Readiness

### 16. Performance Testing

- [ ] Test with 100 concurrent requests (use `ab` or `wrk`)
  ```bash
  ab -n 100 -c 10 http://localhost:3008/api/test-rate-limit
  ```
- [ ] Check database CPU usage (should be <10%)
- [ ] Check application memory usage (should be stable)
- [ ] No memory leaks after 1000+ requests

### 17. Error Handling

- [ ] Test with invalid IP format:
  ```bash
  curl -X POST http://localhost:3008/api/admin/rate-limits/block-ip \
    -d '{"ip": "invalid", "reason": "Test"}'
  ```
  Expected: 400 Bad Request

- [ ] Test without required fields:
  ```bash
  curl -X POST http://localhost:3008/api/admin/rate-limits \
    -d '{"maxRequests": 100}'
  ```
  Expected: 400 Bad Request (missing clientKey/endpointPattern/workspaceId)

- [ ] Test with expired JWT:
  ```bash
  curl http://localhost:3008/api/admin/rate-limits \
    -H "Authorization: Bearer expired-token"
  ```
  Expected: 401 Unauthorized

### 18. Monitoring Setup

- [ ] Set up cleanup cron job:
  ```sql
  -- Run weekly via cron or pg_cron
  SELECT public.cleanup_rate_limit_logs(7);
  ```

- [ ] Create monitoring dashboard (optional):
  - Block rate per tier
  - Top limited endpoints
  - Blocked IP count
  - Active overrides count

- [ ] Set up alerts (optional):
  - Block rate >20% for any tier
  - Spike in blocks (5x vs. yesterday)
  - Blocked IP count >100

---

## Documentation Review

### 19. Documentation Complete

- [ ] `RATE_LIMITING_GUIDE.md` reviewed
- [ ] `RATE_LIMITING_IMPLEMENTATION.md` reviewed
- [ ] `RATE_LIMITING_SUMMARY.md` reviewed
- [ ] All code comments accurate
- [ ] README updated (if needed)

### 20. Knowledge Transfer

- [ ] Team briefed on rate limiting system
- [ ] Admin users trained on override/blocking APIs
- [ ] Monitoring procedures documented
- [ ] Incident response plan updated

---

## Final Checks

### 21. Code Quality

- [ ] No TypeScript errors: `npm run build`
- [ ] No linting errors: `npm run lint` (if configured)
- [ ] All imports resolve correctly
- [ ] No console.log statements in production code
- [ ] Error handling in place

### 22. Security Review

- [ ] Admin endpoints require ADMIN/FOUNDER role
- [ ] Rate limit overrides protected by RLS
- [ ] Blocked IPs protected by RLS
- [ ] No sensitive data in logs
- [ ] SQL injection prevention (parameterized queries)

### 23. Deployment

- [ ] All changes committed to git
- [ ] Migration 403 applied to production database
- [ ] Environment variables set (if any new ones)
- [ ] Deployment successful
- [ ] Production testing completed

---

## Post-Deployment Verification

### 24. Production Smoke Tests

- [ ] Health check returns 200: `curl https://your-domain.com/api/health`
- [ ] Rate limiting works in production
- [ ] Database logging works in production
- [ ] Admin APIs accessible (with auth)
- [ ] No errors in production logs

### 25. Production Monitoring

- [ ] Check logs for rate limit events:
  ```sql
  SELECT COUNT(*) FROM rate_limit_logs
  WHERE created_at > NOW() - INTERVAL '1 hour';
  ```

- [ ] Verify no blocked IPs (unless expected):
  ```sql
  SELECT COUNT(*) FROM blocked_ips
  WHERE blocked_until IS NULL OR blocked_until > NOW();
  ```

- [ ] Check analytics view:
  ```sql
  SELECT * FROM rate_limit_analytics
  WHERE date = CURRENT_DATE;
  ```

---

## Success Criteria

### All checks passed?

- [ ] ✅ All pre-deployment checks complete
- [ ] ✅ Database migration applied successfully
- [ ] ✅ Local testing passed (manual + automated)
- [ ] ✅ Integration testing passed
- [ ] ✅ Production deployment successful
- [ ] ✅ Post-deployment verification complete

### If all checked:

**🎉 Rate Limiting Implementation COMPLETE!**

---

## Troubleshooting

If any checks fail, refer to:

1. `docs/RATE_LIMITING_GUIDE.md` - Troubleshooting section
2. `RATE_LIMITING_IMPLEMENTATION.md` - Technical details
3. Application logs - Check for error messages
4. Database logs - Check function execution

Common issues:
- Migration not applied → Check Supabase SQL Editor
- Functions not found → Grant EXECUTE permissions
- IP blocking not working → Check IP format (INET type)
- Logs not appearing → Check async logging errors

---

**Checklist Version**: 1.0.0
**Last Updated**: 2025-11-29
**Estimated Time**: 30-60 minutes (full checklist)
