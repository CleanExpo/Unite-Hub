# 🧪 End-to-End Testing Guide

## 📋 Test Endpoints Summary

### 🔍 Health & Configuration Tests
1. **Overall Health Check**
   - URL: `/api/health`
   - Tests: All services connectivity

2. **Supabase Connection**
   - URL: `/api/test/supabase-connection`
   - Tests: Database connectivity, tables existence

3. **Email Service (Resend)**
   - URL: `/api/test/email-service`
   - GET: Check configuration
   - POST: Send test email

4. **Stripe Configuration**
   - URL: `/api/test/stripe-connection`
   - Tests: API keys, webhook configuration

5. **Redis Connection**
   - URL: `/api/test/redis-connection`
   - Tests: Cache connectivity (optional)

---

## 🚀 User Flow Tests

### 1. 🌐 Landing Page Flow
- [ ] Visit homepage - loads without blocking
- [ ] Cookie consent appears after 500ms
- [ ] Site is immediately usable
- [ ] Navigation works
- [ ] Services page loads

### 2. 📝 Consultation Booking Flow
- [ ] Navigate to `/services`
- [ ] Click "Book Consultation" on any service
- [ ] Modal opens correctly
- [ ] Form validation works
- [ ] Submission creates database entry
- [ ] Admin receives email notification (if configured)

### 3. 📧 Contact Form Flow
- [ ] Navigate to `/contact`
- [ ] Fill out contact form
- [ ] Form validates correctly
- [ ] Submission saves to database
- [ ] Success message appears

### 4. 🔐 Authentication Flow
- [ ] Sign up creates new user
- [ ] Email verification works
- [ ] Login redirects to dashboard
- [ ] Password reset functions

### 5. 💼 CRM Dashboard
- [ ] Dashboard loads after login
- [ ] Stats display correctly
- [ ] CRM sections accessible
- [ ] Messaging works

---

## 🧪 API Testing

### Quick Test All Endpoints
```bash
# Health check
curl http://localhost:3000/api/health

# Supabase test
curl http://localhost:3000/api/test/supabase-connection

# Email test (GET)
curl http://localhost:3000/api/test/email-service

# Stripe test
curl http://localhost:3000/api/test/stripe-connection

# Redis test
curl http://localhost:3000/api/test/redis-connection
```

### Test Consultation Booking
```bash
curl -X POST http://localhost:3000/api/consultations \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "Test User",
    "client_email": "test@example.com",
    "company": "Test Company",
    "phone": "+1234567890",
    "service_type": "web-development",
    "preferred_date": "2025-06-15",
    "preferred_time": "14:00",
    "message": "Test booking"
  }'
```

---

## ✅ Production Readiness Checklist

### Environment Variables
- [ ] All required variables set in production
- [ ] Test endpoints confirm connectivity
- [ ] No exposed secrets in code

### Database
- [ ] Supabase tables created
- [ ] Consultations table ready
- [ ] CRM tables configured

### Email Service
- [ ] Resend API key valid
- [ ] Admin email configured
- [ ] Test email sends successfully

### Payment Processing
- [ ] Stripe keys configured
- [ ] Test/Live mode appropriate
- [ ] Webhook endpoint set

### Performance
- [ ] Cookie consent doesn't block
- [ ] Pages load quickly
- [ ] No console errors

### Security
- [ ] Authentication working
- [ ] API routes protected
- [ ] CORS configured

---

## 🚨 Common Issues & Solutions

### Issue: "Supabase connection failed"
1. Check `/api/test/supabase-connection`
2. Verify environment variables
3. Check Supabase dashboard status

### Issue: "Email not sending"
1. Check `/api/test/email-service`
2. Verify Resend API key
3. Check domain verification

### Issue: "Stripe not configured"
1. Check `/api/test/stripe-connection`
2. Verify key formats (sk_ and pk_)
3. Ensure keys match mode (test/live)

### Issue: "Cookie consent blocking"
1. Clear browser cache
2. Check console for errors
3. Verify API is accessible

---

## 📊 Test Results Template

```markdown
## Test Run: [DATE]

### Environment
- [ ] Local Development
- [ ] Staging
- [ ] Production

### Test Results
1. Health Check: ✅/❌
2. Database: ✅/❌
3. Email: ✅/❌
4. Payments: ✅/❌
5. Redis: ✅/❌

### User Flows
- Landing Page: ✅/❌
- Consultation Booking: ✅/❌
- Contact Form: ✅/❌
- Authentication: ✅/❌
- Dashboard: ✅/❌

### Issues Found
- None / List issues

### Notes
- Additional observations
```

---

## 🎯 Final Verification

Before going live:
1. Run all test endpoints
2. Complete all user flows
3. Check browser console for errors
4. Verify mobile responsiveness
5. Test in multiple browsers
