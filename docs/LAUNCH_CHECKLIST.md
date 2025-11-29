# Unite-Hub / Synthex Launch Checklist

**Version**: 1.0.0
**Last Updated**: 2025-11-30
**Target Launch**: Q1 2026

---

## Pre-Launch Checklist (T-14 Days)

### Legal & Compliance

#### Terms of Service
- [ ] Terms of Service document finalized
- [ ] Payment terms and refund policy defined
- [ ] Service limitations documented
- [ ] Dispute resolution process defined
- [ ] Intellectual property clauses included
- [ ] Legal review completed by solicitor
- [ ] Terms displayed at signup with acceptance checkbox

#### Privacy Policy
- [ ] Privacy Policy compliant with Australian Privacy Principles (APPs)
- [ ] Data collection purposes clearly stated
- [ ] Third-party data sharing disclosed
- [ ] Cookie usage explained
- [ ] User rights documented (access, correction, deletion)
- [ ] Data retention periods defined
- [ ] Contact details for privacy inquiries
- [ ] GDPR provisions (for international users)

#### Other Legal
- [ ] Cookie consent banner implemented
- [ ] SPAM Act compliance verified (Australian)
- [ ] Unsubscribe mechanism working
- [ ] ABN displayed on invoices
- [ ] GST calculations correct

---

### Accessibility (WCAG 2.1 AA)

#### Perceivable
- [ ] All images have alt text
- [ ] Color contrast ratio ≥ 4.5:1 for text
- [ ] Text can be resized to 200% without loss
- [ ] No information conveyed by color alone
- [ ] Captions for video content

#### Operable
- [ ] All functionality keyboard accessible
- [ ] No keyboard traps
- [ ] Skip navigation links present
- [ ] Focus indicators visible
- [ ] No content flashing more than 3 times/second

#### Understandable
- [ ] Language attribute set on HTML
- [ ] Form labels associated with inputs
- [ ] Error messages descriptive
- [ ] Consistent navigation across pages
- [ ] Input purpose identifiable

#### Robust
- [ ] Valid HTML markup
- [ ] ARIA roles used correctly
- [ ] Compatible with screen readers (NVDA, VoiceOver)
- [ ] Works without JavaScript for critical paths

#### Testing
- [ ] Run automated accessibility scan (axe, WAVE)
- [ ] Manual keyboard navigation test
- [ ] Screen reader test (at least one)
- [ ] Mobile accessibility verified

---

### Browser & Device Compatibility

#### Desktop Browsers (Last 2 versions)
- [ ] Chrome (Windows, Mac)
- [ ] Firefox (Windows, Mac)
- [ ] Safari (Mac)
- [ ] Edge (Windows)

#### Mobile Browsers
- [ ] Safari (iOS 15+)
- [ ] Chrome (Android 10+)
- [ ] Samsung Internet

#### Screen Sizes
- [ ] Desktop (1920x1080, 1366x768)
- [ ] Laptop (1440x900, 1280x800)
- [ ] Tablet (768x1024 portrait, 1024x768 landscape)
- [ ] Mobile (375x667, 414x896)

#### Testing Checklist
- [ ] Login flow works on all browsers
- [ ] Dashboard renders correctly
- [ ] Campaign builder functional
- [ ] Email preview accurate
- [ ] Forms submit correctly
- [ ] Images load properly
- [ ] Animations perform smoothly

---

### Performance

#### Load Time Targets
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Time to Interactive < 3.5s
- [ ] Cumulative Layout Shift < 0.1

#### Testing
- [ ] Lighthouse score > 90 (Performance)
- [ ] Lighthouse score > 90 (Accessibility)
- [ ] Lighthouse score > 90 (Best Practices)
- [ ] Lighthouse score > 90 (SEO)
- [ ] Load test completed (500 concurrent users)
- [ ] No memory leaks detected

---

### Email Deliverability

#### Domain Configuration
- [ ] SPF record configured
- [ ] DKIM signing enabled
- [ ] DMARC policy set
- [ ] Return-Path configured

#### Reputation
- [ ] Sending domain warmed up (2+ weeks)
- [ ] Test emails pass spam checks
- [ ] Inbox placement rate > 95%
- [ ] Blacklist check passed

#### Testing
- [ ] Test email to Gmail
- [ ] Test email to Outlook/O365
- [ ] Test email to Yahoo
- [ ] Test email to corporate domains
- [ ] Unsubscribe link working
- [ ] Open/click tracking verified

---

### Payment Processing

#### Stripe Configuration
- [ ] Live API keys configured
- [ ] Webhook endpoint verified
- [ ] All price IDs updated for production
- [ ] Tax configuration (GST for Australia)
- [ ] Invoice customization complete
- [ ] Receipt emails working

#### Testing
- [ ] Test purchase each tier
- [ ] Test subscription upgrade
- [ ] Test subscription downgrade
- [ ] Test cancellation flow
- [ ] Verify webhook handling
- [ ] Check failed payment handling

---

### Security

#### Final Checks
- [ ] All API routes authenticated
- [ ] Rate limiting active
- [ ] RLS policies verified
- [ ] No sensitive data in logs
- [ ] Error messages don't leak internals
- [ ] Session timeout working

#### Penetration Testing
- [ ] Scope defined
- [ ] Testing vendor selected
- [ ] Testing scheduled
- [ ] Remediation time allocated
- [ ] Report review scheduled

---

## Launch Day Checklist (T-0)

### Pre-Launch (Morning)
- [ ] Team briefed on launch plan
- [ ] Support team ready
- [ ] Monitoring dashboards open
- [ ] Error tracking active (Sentry)
- [ ] Status page ready
- [ ] Rollback plan confirmed

### Launch Sequence
- [ ] DNS updated (if changing domains)
- [ ] SSL certificate verified
- [ ] Final smoke test passed
- [ ] Beta → Production switch
- [ ] Email to beta users sent
- [ ] Social media posts scheduled

### Post-Launch (Day 1)
- [ ] Monitor error rates (target: < 1%)
- [ ] Monitor response times (target: < 500ms p95)
- [ ] Check payment processing
- [ ] Respond to support tickets
- [ ] Social media engagement
- [ ] Collect initial feedback

---

## Soft Launch Plan (Beta)

### Beta User Selection (10-20 users)
- [ ] Mix of Starter/Professional tier candidates
- [ ] Include at least 2 restoration industry businesses
- [ ] Include at least 2 general trade businesses
- [ ] Technical and non-technical users represented
- [ ] Geographic diversity (metro and regional)

### Beta Onboarding
- [ ] Personal onboarding call with each user
- [ ] Walkthrough of key features
- [ ] Set expectations (beta limitations)
- [ ] Establish feedback channel (Slack/Discord)
- [ ] Weekly check-in scheduled

### Feedback Collection
- [ ] In-app feedback widget enabled
- [ ] Weekly survey sent
- [ ] Bug report process explained
- [ ] Feature request tracking
- [ ] NPS survey at end of beta

### Beta Success Criteria
- [ ] 80% of users complete onboarding
- [ ] 70% of users send at least one campaign
- [ ] NPS score > 30
- [ ] No critical bugs reported
- [ ] Performance stable under load

### Beta → Public Timeline
- Week 1-2: Onboard beta users
- Week 3-4: Collect feedback, fix critical issues
- Week 5: Review go/no-go criteria
- Week 6: Public launch (if criteria met)

---

## Public Launch (T+6 weeks)

### Marketing Launch
- [ ] Press release distributed
- [ ] Product Hunt launch scheduled
- [ ] Social media campaign active
- [ ] Partner announcements coordinated
- [ ] Case study published
- [ ] Demo video live

### Content
- [ ] Landing page optimized
- [ ] Pricing page accurate
- [ ] Help center populated
- [ ] Blog post announcing launch
- [ ] Email to waiting list

### Monitoring (First Week)
- [ ] Daily error rate review
- [ ] Daily signup tracking
- [ ] Daily support ticket review
- [ ] Response time monitoring
- [ ] Customer feedback collection

---

## Rollback Plan

### Trigger Conditions
- Error rate > 5% for 15+ minutes
- Critical functionality broken
- Data corruption detected
- Security breach confirmed

### Rollback Steps
1. Notify team via Slack
2. Update status page
3. Rollback Vercel deployment
4. Restore database if needed
5. Verify rollback successful
6. Communicate to affected users
7. Post-mortem within 24 hours

---

## Success Metrics

### Week 1
- [ ] 50+ signups
- [ ] 20+ trial starts
- [ ] 0 critical bugs
- [ ] < 1% error rate
- [ ] < 24hr average support response

### Month 1
- [ ] 200+ signups
- [ ] 50+ paid conversions
- [ ] NPS > 40
- [ ] Churn < 5%
- [ ] MRR target: $2,500

### Month 3
- [ ] 500+ total users
- [ ] 150+ paying customers
- [ ] NPS > 50
- [ ] Churn < 3%
- [ ] MRR target: $15,000

---

## Contacts

| Role | Name | Contact |
|------|------|---------|
| Product Lead | TBD | product@synthex.com.au |
| Tech Lead | TBD | tech@synthex.com.au |
| Marketing | TBD | marketing@synthex.com.au |
| Support | TBD | support@synthex.com.au |
| Legal | TBD | legal@synthex.com.au |

---

*Last Updated: 2025-11-30*
*Next Review: Before soft launch*
