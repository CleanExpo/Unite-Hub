# Phase 6: Production Deployment Checklist

**Date:** 2025-01-18
**Target:** Unite-Hub V1 MVP Launch
**Current Status:** 95% Ready
**Target Status:** 100% Production-Ready

---

## 📋 Pre-Deployment Checklist

### Environment Setup

- [ ] **Vercel Project Created**
  - Project name: unite-hub-production
  - Connected to GitHub repository
  - Auto-deploy on main branch enabled

- [ ] **Supabase Production Instance**
  - Project created: unite-hub-production
  - Database region selected
  - Database password saved securely
  - Connection pooling enabled (recommended)

- [ ] **Environment Variables** (Vercel + Local)
  ```env
  # Supabase
  NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
  SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]

  # NextAuth
  NEXTAUTH_URL=https://unite-hub.vercel.app
  NEXTAUTH_SECRET=[generate-new-secret]

  # Google OAuth
  GOOGLE_CLIENT_ID=[your-google-client-id]
  GOOGLE_CLIENT_SECRET=[your-google-client-secret]
  GOOGLE_CALLBACK_URL=https://unite-hub.vercel.app/api/integrations/gmail/callback

  # Anthropic Claude AI
  ANTHROPIC_API_KEY=sk-ant-[your-key]

  # OpenAI (for Whisper transcription)
  OPENAI_API_KEY=sk-[your-key]

  # Stripe (for billing)
  STRIPE_SECRET_KEY=sk_live_[your-key]
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[your-key]
  STRIPE_WEBHOOK_SECRET=whsec_[your-key]
  ```

- [ ] **Domain Configuration**
  - Custom domain: unite-hub.com (or your domain)
  - DNS configured
  - SSL certificate active
  - WWW redirect configured

---

## 🗄️ Database Migration Deployment

Follow `PHASE6_MIGRATION_DEPLOYMENT_GUIDE.md` for detailed steps.

### Quick Checklist:

- [ ] **001: Initial Schema** - Core tables created
- [ ] **002: Team & Projects** - 8 tables created
- [ ] **003: User Organizations** - User management tables + triggers
- [ ] **004: Profile Fields** - Enhanced user profiles
- [ ] **038: Core SaaS Tables** - projects, email_integrations, sent_emails, client_emails
- [ ] **023: RLS Helper Functions** - get_user_workspace_id(), user_has_workspace_access()
- [ ] **025: Complete RLS** - Workspace isolation policies on 9 tables
- [ ] **029-031: Media System** - media_files table + storage bucket + policies

### Verification:

- [ ] Run all verification queries from deployment guide
- [ ] Confirm RLS enabled on all tables
- [ ] Confirm helper functions exist
- [ ] Confirm storage bucket created
- [ ] Test workspace isolation manually

---

## 🔐 Security Audit

### Authentication

- [ ] **Session Management**
  - JWT tokens expiring correctly
  - Refresh token flow working
  - Logout clears all sessions
  - No token leakage in logs

- [ ] **Route Protection**
  - Middleware protecting /dashboard/* routes
  - API routes checking Authorization header
  - Proper 401 responses for unauthenticated requests

- [ ] **Password Security**
  - Minimum 8 characters enforced
  - Password reset flow working
  - No passwords in logs/errors

### Row Level Security (RLS)

- [ ] **All Tables Have RLS Enabled**
  ```sql
  SELECT tablename, rowsecurity
  FROM pg_tables
  WHERE schemaname = 'public'
  AND rowsecurity = false;
  -- Should return 0 rows (except utility tables)
  ```

- [ ] **Workspace Isolation Working**
  - Users can only see their workspace data
  - Cross-workspace access blocked
  - Service role can bypass RLS (for admin operations)

- [ ] **Test Cases**
  - Create data as User A (Org 1)
  - Login as User B (Org 2)
  - Verify User B cannot see User A's data

### API Security

- [ ] **Input Validation**
  - All user inputs validated
  - SQL injection prevention (parameterized queries)
  - XSS prevention (React automatically escapes)
  - CSRF tokens (NextAuth handles this)

- [ ] **Rate Limiting**
  - Consider adding rate limiting to API routes
  - Especially: /api/auth/*, /api/media/upload

- [ ] **CORS Configuration**
  - Only allow requests from your domain
  - Check next.config.mjs for CORS settings

### Secrets Management

- [ ] **No Secrets in Code**
  - No API keys in source code
  - .env.local in .gitignore
  - Environment variables in Vercel only

- [ ] **Service Role Key Protection**
  - Never exposed to client
  - Only used in API routes
  - Rotated if compromised

---

## ⚡ Performance Optimization

### Prompt Caching

- [ ] **Anthropic Prompt Caching Implemented**
  - Check all AI agent files have cache_control
  - Verify cache hit rate in logs
  - Estimated 90% cost savings on cached tokens

**Files to verify:**
- `src/lib/agents/contact-intelligence.ts`
- `src/lib/agents/content-personalization.ts`
- `src/lib/agents/email-processor.ts`
- `src/lib/agents/calendar-intelligence.ts`
- `src/lib/agents/whatsapp-intelligence.ts`

### Database Indexes

- [ ] **Performance Indexes Created**
  ```sql
  -- Verify indexes exist
  SELECT tablename, indexname
  FROM pg_indexes
  WHERE schemaname = 'public'
  ORDER BY tablename;
  -- Should see indexes on workspace_id, email, org_id, user_id
  ```

### Image Optimization

- [ ] **Next.js Image Optimization**
  - Using next/image for all images
  - Lazy loading enabled
  - WebP format served when supported

### Caching Strategy

- [ ] **API Route Caching**
  - Static data cached appropriately
  - Cache headers set correctly
  - Revalidation strategy defined

- [ ] **CDN Configuration**
  - Vercel Edge Network active
  - Static assets cached at edge
  - Dynamic routes cached when appropriate

---

## 🧪 Testing

### End-to-End Test Plan

- [ ] **Authentication Flow**
  - [ ] Register new account
  - [ ] Email verification (if enabled)
  - [ ] Login with email/password
  - [ ] Logout
  - [ ] Forgot password flow
  - [ ] Password reset

- [ ] **Contact Management**
  - [ ] View contacts list
  - [ ] Add new contact
  - [ ] Edit contact
  - [ ] Delete contact (with confirmation)
  - [ ] Send email to contact
  - [ ] View contact details
  - [ ] AI scoring displays correctly

- [ ] **Campaign Management**
  - [ ] View campaigns list
  - [ ] Create new campaign
  - [ ] Pause campaign
  - [ ] Resume campaign
  - [ ] Delete campaign
  - [ ] View campaign analytics

- [ ] **Team Management**
  - [ ] View team roster
  - [ ] Add team member
  - [ ] Update team member capacity
  - [ ] Remove team member

- [ ] **Profile & Settings**
  - [ ] View profile
  - [ ] Edit profile (name, bio, phone)
  - [ ] Upload avatar
  - [ ] Change timezone
  - [ ] Update notification preferences
  - [ ] Change password

- [ ] **Media System**
  - [ ] Upload video file
  - [ ] Upload audio file
  - [ ] View transcription
  - [ ] View AI analysis
  - [ ] Search media files
  - [ ] Delete media file

- [ ] **Billing**
  - [ ] View subscription status
  - [ ] View usage metrics
  - [ ] Update payment method (if Stripe live)
  - [ ] Cancel subscription

### Integration Tests

- [ ] **Gmail Integration**
  - OAuth flow working
  - Email sync working
  - Email sending working

- [ ] **Stripe Integration**
  - Webhook receiving events
  - Subscription creation working
  - Payment processing working

- [ ] **Anthropic Claude API**
  - Contact intelligence working
  - Content generation working
  - Email processing working
  - Extended Thinking enabled

- [ ] **OpenAI Whisper API**
  - Transcription working
  - Progress tracking working
  - Language detection working

### Error Handling Tests

- [ ] **Error Boundaries**
  - Trigger error in component
  - Verify error boundary catches it
  - Verify friendly error UI shows
  - Verify "Try Again" button works

- [ ] **API Error Handling**
  - Test 401 Unauthorized
  - Test 403 Forbidden
  - Test 404 Not Found
  - Test 500 Server Error
  - Verify error messages are user-friendly

- [ ] **Network Errors**
  - Disconnect internet
  - Try to load page
  - Verify graceful degradation

### Performance Tests

- [ ] **Page Load Speed**
  - Homepage: < 2s
  - Dashboard: < 3s
  - Contact details: < 2s
  - All pages: < 5s

- [ ] **API Response Times**
  - GET /api/contacts: < 500ms
  - POST /api/contacts: < 1s
  - POST /api/agents/contact-intelligence: < 10s
  - POST /api/media/transcribe: < 30s

- [ ] **Lighthouse Scores**
  - Performance: > 90
  - Accessibility: > 90
  - Best Practices: > 90
  - SEO: > 90

---

## 📊 Monitoring & Analytics

### Error Tracking

- [ ] **Sentry or Similar**
  - Account created
  - DSN configured
  - Error tracking working
  - Alerts configured

### Analytics

- [ ] **Google Analytics or Similar**
  - Tracking ID configured
  - Page views tracking
  - Event tracking (button clicks, form submissions)
  - Conversion tracking

### Database Monitoring

- [ ] **Supabase Dashboard**
  - Monitor query performance
  - Set up alerts for slow queries
  - Monitor database size
  - Set up backup schedule

### API Monitoring

- [ ] **Vercel Analytics**
  - Monitor function execution times
  - Monitor error rates
  - Set up alerts for high error rates

---

## 🚀 Deployment Steps

### Pre-Deployment

- [ ] Create production branch from main
- [ ] Run all tests locally
- [ ] Build production bundle: `npm run build`
- [ ] Verify build succeeds
- [ ] Test production build locally: `npm start`

### Database Deployment

- [ ] Follow PHASE6_MIGRATION_DEPLOYMENT_GUIDE.md
- [ ] Run all 10 migrations in order
- [ ] Verify all migrations succeeded
- [ ] Run verification queries
- [ ] Test workspace isolation manually

### Application Deployment

- [ ] **Deploy to Vercel**
  - Push to main branch (auto-deploys)
  - OR manually deploy via Vercel dashboard
  - Wait for build to complete
  - Check build logs for errors

- [ ] **Verify Deployment**
  - Visit production URL
  - Check all pages load
  - Test login flow
  - Test one complete user journey

### Post-Deployment

- [ ] **Smoke Tests**
  - Run through critical user paths
  - Verify no console errors
  - Verify no API errors
  - Check Sentry for new errors

- [ ] **Monitor for 24 Hours**
  - Watch error logs
  - Monitor performance metrics
  - Check user feedback (if any)
  - Be ready to rollback if needed

---

## 🔄 Rollback Plan

If deployment fails:

### Application Rollback

1. Go to Vercel dashboard
2. Navigate to "Deployments"
3. Find previous successful deployment
4. Click "..." → "Promote to Production"
5. Verify rollback successful

### Database Rollback

1. Disable RLS on all tables
2. Drop failed tables
3. Restore from backup (if available)
4. Re-enable application

---

## ✅ Go-Live Checklist

Final checks before announcing launch:

- [ ] All tests passed
- [ ] Database migrations deployed successfully
- [ ] All environment variables configured
- [ ] Custom domain working
- [ ] SSL certificate active
- [ ] Error tracking configured
- [ ] Analytics configured
- [ ] Monitoring configured
- [ ] Team notified of launch
- [ ] Support email configured (support@unite-hub.com)
- [ ] Privacy policy accessible (/privacy)
- [ ] Terms of service accessible (/terms)
- [ ] Contact page working (/contact)

---

## 📈 Success Metrics

Track these metrics after launch:

- **User Acquisition**
  - New signups per day
  - Signup conversion rate
  - User activation rate

- **User Engagement**
  - Daily active users (DAU)
  - Monthly active users (MAU)
  - Average session duration
  - Features used most

- **Performance**
  - Average page load time
  - API response times
  - Error rate
  - Uptime percentage

- **Revenue** (if applicable)
  - Paid conversions
  - Monthly recurring revenue (MRR)
  - Churn rate
  - Customer lifetime value (LTV)

---

## 🎯 Post-Launch Tasks

After successful launch:

### Week 1
- [ ] Monitor error logs daily
- [ ] Respond to user feedback
- [ ] Fix any critical bugs
- [ ] Optimize slow queries

### Week 2-4
- [ ] Implement feedback from early users
- [ ] Add missing features (if any)
- [ ] Performance optimizations
- [ ] Marketing and user acquisition

### Month 2+
- [ ] Plan V2 features
- [ ] Scale infrastructure if needed
- [ ] Implement advanced analytics
- [ ] Build out campaign builder (currently Coming Soon)

---

## 📞 Emergency Contacts

- **Technical Issues**: [Your email]
- **Database Issues**: Check Supabase Dashboard logs
- **Hosting Issues**: Vercel support
- **Payment Issues**: Stripe dashboard

---

## 🎉 Launch Announcement

When ready:

- [ ] Announce on social media
- [ ] Email waiting list (if any)
- [ ] Post on Product Hunt (optional)
- [ ] Share with relevant communities
- [ ] Update website with "Now Live" banner

---

**Total Estimated Time:** 4-6 hours
**Risk Level:** MEDIUM (with proper testing)
**Recommended:** Deploy during off-peak hours
**Backup Plan:** Rollback procedures documented above

---

*Last Updated: 2025-01-18*
*Phase 6: Production Deployment & Testing*
*Status: Ready to Deploy*
