# Stripe Subscription System - Deployment Checklist

Use this checklist to ensure your Stripe integration is properly configured and tested before going to production.

## Pre-Deployment (Development/Staging)

### Environment Setup
- [ ] All environment variables set in `.env.local`
  - [ ] `STRIPE_SECRET_KEY` (test mode)
  - [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (test mode)
  - [ ] `STRIPE_PRICE_ID_STARTER`
  - [ ] `STRIPE_PRICE_ID_PROFESSIONAL`
  - [ ] `STRIPE_WEBHOOK_SECRET` (test mode)
  - [ ] `NEXT_PUBLIC_URL`
  - [ ] `NEXT_PUBLIC_CONVEX_URL`

### Stripe Account Configuration
- [ ] Stripe account created and verified
- [ ] Test mode enabled
- [ ] Products created:
  - [ ] Starter ($249 AUD/month)
  - [ ] Professional ($549 AUD/month)
- [ ] Price IDs copied to environment variables
- [ ] Webhook endpoint configured (test mode)
- [ ] Webhook events selected (10 events)
- [ ] Webhook secret copied to environment variables

### Code Verification
- [ ] All files present in `lib/stripe/`
  - [ ] `client.ts`
  - [ ] `types.ts`
  - [ ] `utils.ts`
  - [ ] `index.ts`
  - [ ] `README.md`
  - [ ] `MIGRATION.md`
  - [ ] `QUICKSTART.md`
  - [ ] `test-integration.ts`
- [ ] All API routes present in `src/app/api/`
  - [ ] `stripe/checkout/route.ts`
  - [ ] `stripe/webhook/route.ts`
  - [ ] `subscription/[orgId]/route.ts`
  - [ ] `subscription/upgrade/route.ts`
  - [ ] `subscription/downgrade/route.ts`
  - [ ] `subscription/cancel/route.ts`
  - [ ] `subscription/reactivate/route.ts`
  - [ ] `subscription/invoices/route.ts`
  - [ ] `subscription/portal/route.ts`
- [ ] Convex functions present
  - [ ] `convex/subscriptions.ts`
- [ ] No TypeScript compilation errors

### Testing

#### Integration Tests
- [ ] Run integration test suite: `npx ts-node lib/stripe/test-integration.ts`
- [ ] All tests passing:
  - [ ] Environment Variables
  - [ ] Stripe API Connection
  - [ ] Price IDs
  - [ ] Customer Creation
  - [ ] Webhook Endpoint
  - [ ] Plan Configuration

#### Manual Testing - Checkout Flow
- [ ] Create checkout session via API
- [ ] Redirect to Stripe Checkout works
- [ ] Complete payment with test card: `4242 4242 4242 4242`
- [ ] Redirected to success page
- [ ] Webhook event received: `customer.subscription.created`
- [ ] Subscription created in Convex database
- [ ] Customer created in Stripe
- [ ] Subscription visible in Stripe Dashboard

#### Manual Testing - Subscription Management
- [ ] Get subscription details via API
- [ ] Subscription data correct (plan, status, dates)
- [ ] Upgrade subscription to Professional
  - [ ] Proration calculated correctly
  - [ ] Stripe subscription updated
  - [ ] Convex database updated
  - [ ] Webhook event received: `customer.subscription.updated`
- [ ] Downgrade subscription to Starter
  - [ ] Credit calculated correctly
  - [ ] Stripe subscription updated
  - [ ] Convex database updated
  - [ ] Webhook event received: `customer.subscription.updated`
- [ ] Cancel subscription (at period end)
  - [ ] Status updated correctly
  - [ ] `cancelAtPeriodEnd` set to true
  - [ ] Access continues until period end
  - [ ] Convex database updated
- [ ] Reactivate canceled subscription
  - [ ] `cancelAtPeriodEnd` set to false
  - [ ] Status returned to active
  - [ ] Convex database updated

#### Manual Testing - Invoices
- [ ] Get billing history via API
- [ ] Past invoices displayed correctly
- [ ] Invoice PDFs accessible
- [ ] Upcoming invoice preview shown
- [ ] Proration amounts correct

#### Manual Testing - Billing Portal
- [ ] Create portal session via API
- [ ] Redirect to Stripe portal works
- [ ] Can update payment method
- [ ] Can view billing history
- [ ] Can download invoices
- [ ] Return URL works correctly

#### Manual Testing - Webhook Events
- [ ] Use Stripe CLI to forward webhooks: `stripe listen --forward-to localhost:3008/api/stripe/webhook`
- [ ] Test each event type:
  - [ ] `stripe trigger customer.subscription.created`
  - [ ] `stripe trigger customer.subscription.updated`
  - [ ] `stripe trigger customer.subscription.deleted`
  - [ ] `stripe trigger invoice.paid`
  - [ ] `stripe trigger invoice.payment_failed`
  - [ ] `stripe trigger payment_intent.succeeded`
  - [ ] `stripe trigger payment_intent.payment_failed`
- [ ] All events processed successfully
- [ ] Database updated correctly for each event
- [ ] No errors in logs

#### Manual Testing - Error Handling
- [ ] Test with declining card: `4000 0000 0000 0002`
- [ ] Payment failure handled gracefully
- [ ] Webhook event received: `invoice.payment_failed`
- [ ] Subscription status updated to `past_due`
- [ ] Test with 3D Secure card: `4000 0027 6000 3184`
- [ ] Authentication flow works
- [ ] Payment completes after authentication
- [ ] Test API with invalid data
  - [ ] Missing required fields
  - [ ] Invalid organization ID
  - [ ] Invalid plan name
- [ ] Appropriate error messages returned
- [ ] HTTP status codes correct

## Production Deployment

### Pre-Production Steps
- [ ] Review all code changes
- [ ] Run all tests one final time
- [ ] Backup current production database
- [ ] Document rollback procedure
- [ ] Schedule deployment during low-traffic period

### Stripe Production Setup
- [ ] Switch Stripe Dashboard to Live mode
- [ ] Create live products:
  - [ ] Starter ($249 AUD/month)
  - [ ] Professional ($549 AUD/month)
- [ ] Copy live Price IDs
- [ ] Get live API keys:
  - [ ] Secret key (starts with `sk_live_`)
  - [ ] Publishable key (starts with `pk_live_`)
- [ ] Configure live webhook endpoint
  - [ ] URL: `https://your-domain.com/api/stripe/webhook`
  - [ ] Select all 10 events
  - [ ] Copy webhook signing secret
- [ ] Test webhook delivery to production URL

### Production Environment Variables
- [ ] Update production environment variables:
  - [ ] `STRIPE_SECRET_KEY` (live mode)
  - [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (live mode)
  - [ ] `STRIPE_PRICE_ID_STARTER` (live)
  - [ ] `STRIPE_PRICE_ID_PROFESSIONAL` (live)
  - [ ] `STRIPE_WEBHOOK_SECRET` (live)
  - [ ] `NEXT_PUBLIC_URL` (production domain)
  - [ ] `NEXT_PUBLIC_CONVEX_URL` (production Convex URL)
- [ ] Verify environment variables are set correctly
- [ ] Restart production servers

### Production Testing

#### Smoke Tests
- [ ] Application loads without errors
- [ ] No console errors
- [ ] All API endpoints accessible
- [ ] Webhook endpoint responding (check with Stripe CLI)

#### End-to-End Production Tests
- [ ] Create checkout session with REAL card
- [ ] Complete payment successfully
- [ ] Verify subscription created in:
  - [ ] Stripe Dashboard (live mode)
  - [ ] Production Convex database
- [ ] Verify webhook events received
- [ ] Check webhook delivery in Stripe Dashboard
- [ ] Get subscription details via production API
- [ ] Test billing portal access
- [ ] Download an invoice PDF

#### Production Security Verification
- [ ] Webhook signature verification working
- [ ] HTTPS enforced on all endpoints
- [ ] API keys not exposed in frontend
- [ ] Environment variables properly secured
- [ ] Error messages don't leak sensitive data
- [ ] Logs don't contain sensitive information

### Monitoring Setup
- [ ] Error monitoring configured (Sentry, etc.)
- [ ] Webhook failure alerts set up
- [ ] Payment failure alerts configured
- [ ] Subscription metrics dashboard created
- [ ] Log aggregation set up
- [ ] Uptime monitoring enabled

### Documentation
- [ ] Internal team documentation updated
- [ ] Support team trained on subscription management
- [ ] Customer-facing documentation created:
  - [ ] How to subscribe
  - [ ] How to upgrade/downgrade
  - [ ] How to cancel
  - [ ] How to update payment method
  - [ ] Refund policy
  - [ ] Cancellation policy
- [ ] Runbook created for common issues

### Post-Deployment Verification
- [ ] Monitor webhook events for 24 hours
- [ ] Check for failed webhook deliveries
- [ ] Verify database consistency
- [ ] Check error rates in monitoring
- [ ] Review customer feedback
- [ ] Test with real customer (if possible)

## Post-Deployment Monitoring (First Week)

### Daily Checks
- [ ] Day 1: Monitor all webhook events
- [ ] Day 2: Check subscription creation rate
- [ ] Day 3: Review error logs
- [ ] Day 4: Verify payment success rate
- [ ] Day 5: Check database consistency
- [ ] Day 6: Review customer support tickets
- [ ] Day 7: Analyze subscription metrics

### Metrics to Track
- [ ] Total subscriptions created
- [ ] Subscription by plan (Starter vs Professional)
- [ ] Payment success rate
- [ ] Payment failure rate
- [ ] Webhook delivery success rate
- [ ] API response times
- [ ] Error rates per endpoint
- [ ] Upgrade/downgrade frequency
- [ ] Cancellation rate
- [ ] Average subscription duration

### Issues to Watch For
- [ ] Failed webhook deliveries
- [ ] Payment failures
- [ ] Database sync issues
- [ ] Proration calculation errors
- [ ] Customer complaints
- [ ] API timeout errors
- [ ] Unexpected subscription statuses

## Rollback Procedure (If Needed)

### Immediate Actions
1. [ ] Stop processing new subscriptions
2. [ ] Point Stripe webhook back to old endpoint (if applicable)
3. [ ] Revert to previous code version
4. [ ] Restore database backup if needed
5. [ ] Notify affected customers
6. [ ] Document what went wrong

### Investigation
1. [ ] Review error logs
2. [ ] Check webhook event logs
3. [ ] Verify database state
4. [ ] Identify root cause
5. [ ] Plan fix

### Recovery
1. [ ] Fix identified issues
2. [ ] Test thoroughly in staging
3. [ ] Re-deploy with fixes
4. [ ] Verify resolution
5. [ ] Resume normal operations

## Success Criteria

### Technical Success
- [ ] 100% webhook delivery success rate
- [ ] < 1% payment failure rate (excluding customer issues)
- [ ] < 500ms average API response time
- [ ] 0 critical errors in first 24 hours
- [ ] Database sync 100% accurate

### Business Success
- [ ] Customers can successfully subscribe
- [ ] Customers can manage subscriptions
- [ ] Support tickets < 5% of subscriptions
- [ ] No revenue disruption
- [ ] Positive customer feedback

## Ongoing Maintenance

### Weekly
- [ ] Review subscription metrics
- [ ] Check webhook delivery rates
- [ ] Monitor error rates
- [ ] Review customer feedback

### Monthly
- [ ] Analyze subscription trends
- [ ] Review cancellation reasons
- [ ] Optimize based on data
- [ ] Update documentation as needed

### Quarterly
- [ ] Review pricing strategy
- [ ] Analyze feature usage by plan
- [ ] Consider new plan tiers
- [ ] Evaluate customer satisfaction

## Emergency Contacts

Document key contacts for production issues:

- **Stripe Support**: https://support.stripe.com
- **On-Call Engineer**: [Name/Phone]
- **DevOps Lead**: [Name/Phone]
- **Product Manager**: [Name/Phone]
- **Customer Support Lead**: [Name/Phone]

## Resources

- **Full Documentation**: `lib/stripe/README.md`
- **Quick Start Guide**: `lib/stripe/QUICKSTART.md`
- **Migration Guide**: `lib/stripe/MIGRATION.md`
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Stripe API Logs**: https://dashboard.stripe.com/logs
- **Webhook Events**: https://dashboard.stripe.com/webhooks

---

**Deployment Date**: _________________
**Deployed By**: _____________________
**Sign-off By**: _____________________

**Status**: [ ] Development [ ] Staging [ ] Production [ ] Complete

---

Keep this checklist and update it as you complete each step. Good luck with your deployment!
