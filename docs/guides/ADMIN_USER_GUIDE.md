# Unite-Hub Admin User Guide

**Version**: 1.0.0
**Last Updated**: 2025-11-30
**Audience**: System Administrators & Founders

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard Overview](#2-dashboard-overview)
3. [User Management](#3-user-management)
4. [Workspace Configuration](#4-workspace-configuration)
5. [Security Settings](#5-security-settings)
6. [AI Agent Management](#6-ai-agent-management)
7. [Email Integration](#7-email-integration)
8. [Tier & Billing Management](#8-tier--billing-management)
9. [System Monitoring](#9-system-monitoring)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Getting Started

### 1.1 First Login

1. Navigate to `https://your-domain.com/login`
2. Click **"Continue with Google"**
3. Select your admin Google account
4. You'll be redirected to the dashboard

### 1.2 Initial Setup Checklist

- [ ] Verify your profile information
- [ ] Set up your organization name
- [ ] Configure workspace settings
- [ ] Invite team members
- [ ] Connect email integration (Gmail)
- [ ] Review AI agent settings

### 1.3 Navigation

The main navigation is on the left sidebar:

| Section | Description |
|---------|-------------|
| **Overview** | Dashboard with key metrics |
| **Contacts** | CRM contact management |
| **Campaigns** | Email campaign builder |
| **Analytics** | Reports and insights |
| **Settings** | System configuration |
| **Admin** | Admin-only features |

---

## 2. Dashboard Overview

### 2.1 Key Metrics

The overview dashboard displays:

- **Total Contacts**: All contacts in your workspace
- **Hot Leads**: Contacts with AI score ≥ 80
- **Warm Leads**: Contacts with AI score 60-79
- **Active Campaigns**: Currently running campaigns
- **Email Performance**: Open/click rates

### 2.2 Quick Actions

- **+ New Contact**: Add a contact manually
- **+ New Campaign**: Create email campaign
- **Refresh Scores**: Trigger AI scoring update
- **Export Data**: Download contact data

### 2.3 Activity Feed

The activity feed shows recent actions:
- New contacts added
- Emails sent/opened
- Campaign status changes
- AI score updates

---

## 3. User Management

### 3.1 Viewing Users

Navigate to **Settings → Team Members**

You'll see:
- User name and email
- Role (Admin, Staff, Client)
- Last active date
- Status (Active/Inactive)

### 3.2 Inviting Users

1. Click **"Invite Member"**
2. Enter their email address
3. Select role:
   - **Admin**: Full system access
   - **Staff**: CRM access, no admin features
   - **Client**: Limited portal access (Synthex)
4. Click **"Send Invitation"**

### 3.3 Managing Roles

To change a user's role:

1. Find the user in the team list
2. Click the **⋮** menu
3. Select **"Change Role"**
4. Choose new role
5. Confirm change

### 3.4 Removing Users

1. Find the user in the team list
2. Click the **⋮** menu
3. Select **"Remove from Workspace"**
4. Confirm removal

**Note**: This removes access but preserves their activity history.

---

## 4. Workspace Configuration

### 4.1 General Settings

Navigate to **Settings → Workspace**

| Setting | Description |
|---------|-------------|
| Workspace Name | Display name for your workspace |
| Timezone | Default timezone for scheduling |
| Date Format | DD/MM/YYYY or MM/DD/YYYY |
| Currency | For reporting (AUD, USD, etc.) |

### 4.2 Branding

Customize your workspace appearance:

- **Logo**: Upload your company logo (PNG, max 2MB)
- **Primary Color**: Brand color for UI elements
- **Email Footer**: Default footer for all emails

### 4.3 Contact Fields

Customize contact fields:

1. Go to **Settings → Contact Fields**
2. Click **"Add Field"**
3. Configure:
   - Field name
   - Field type (text, number, dropdown, date)
   - Required/Optional
   - Show in list view

---

## 5. Security Settings

### 5.1 Authentication

Navigate to **Settings → Security**

**Session Settings:**
- Session timeout: 24 hours (default)
- Remember me duration: 30 days

**OAuth Providers:**
- Google: Enabled by default
- (Future: Microsoft, SAML)

### 5.2 API Keys

Manage API access:

1. Go to **Settings → API Keys**
2. Click **"Generate New Key"**
3. Copy the key (shown only once)
4. Set expiration (30/60/90 days or never)

**Key Permissions:**
- Read-only: Can fetch data
- Read-write: Can modify data
- Admin: Full API access

### 5.3 Audit Logs

View security events:

1. Go to **Admin → Audit Logs**
2. Filter by:
   - Date range
   - User
   - Action type
   - Resource

**Logged Actions:**
- Login/logout events
- Data exports
- Role changes
- API key usage

### 5.4 Rate Limiting

Configure rate limits:

1. Go to **Admin → Rate Limits**
2. View current limits by tier
3. Add overrides for specific users/IPs

---

## 6. AI Agent Management

### 6.1 Overview

Unite-Hub uses AI agents for:
- **Lead Scoring**: Automatic 0-100 scores
- **Email Processing**: Intent extraction, sentiment analysis
- **Content Generation**: Personalized email drafts
- **Orchestration**: Multi-step workflow automation

### 6.2 Agent Settings

Navigate to **Settings → AI Agents**

| Agent | Configuration |
|-------|---------------|
| Lead Scoring | Scoring thresholds, weights |
| Email Processor | Intent categories, sentiment sensitivity |
| Content Generator | Tone, length, personalization level |
| Orchestrator | Task queue settings, retry policy |

### 6.3 Scoring Configuration

Adjust lead scoring weights:

```
Email Engagement: 40%  (frequency of opens/clicks)
Sentiment Score:  20%  (positive/negative analysis)
Intent Quality:   20%  (buying signals)
Job Title:        10%  (seniority level)
Status Progress:  10%  (pipeline stage)
```

### 6.4 Monitoring AI Usage

View AI usage in **Admin → AI Usage**:
- Token consumption
- Cost by agent
- Success/failure rates
- Response times

---

## 7. Email Integration

### 7.1 Gmail Setup

1. Go to **Settings → Integrations → Gmail**
2. Click **"Connect Gmail"**
3. Sign in with your Google account
4. Grant required permissions:
   - Read emails
   - Send emails
   - Manage labels
5. Select sync options:
   - Sync inbox (last 30/60/90 days)
   - Auto-extract contacts
   - Track opens/clicks

### 7.2 Email Settings

| Setting | Description |
|---------|-------------|
| Default From Name | Sender name for campaigns |
| Reply-To Address | Where replies go |
| Tracking Domain | Custom domain for link tracking |
| Unsubscribe Link | Required in all marketing emails |

### 7.3 Email Templates

Create reusable templates:

1. Go to **Campaigns → Templates**
2. Click **"New Template"**
3. Design your template:
   - Use the visual editor
   - Insert variables: `{{name}}`, `{{company}}`
   - Add images and links
4. Save and categorize

### 7.4 Deliverability

Monitor email health:

- **Bounce Rate**: Should be < 2%
- **Spam Reports**: Should be < 0.1%
- **Open Rate**: Industry avg 20-25%
- **Click Rate**: Industry avg 2-5%

---

## 8. Tier & Billing Management

### 8.1 Synthex Tiers

For client portal (Synthex) subscriptions:

| Tier | Contacts | Campaigns | AI Features | Price |
|------|----------|-----------|-------------|-------|
| Starter | 500 | 5/month | Basic | $49/mo |
| Professional | 2,500 | 25/month | Advanced | $149/mo |
| Elite | 10,000 | Unlimited | Full + API | $449/mo |

### 8.2 Managing Subscriptions

1. Go to **Admin → Subscriptions**
2. View all client subscriptions
3. Actions available:
   - Upgrade tier
   - Downgrade tier
   - Cancel subscription
   - Issue refund

### 8.3 Usage Tracking

Monitor client usage:

- Contacts created this period
- Campaigns sent
- AI tokens consumed
- API calls made

### 8.4 Billing Portal

Clients can self-manage at `/synthex/billing`:
- Update payment method
- View invoices
- Change subscription
- Cancel account

---

## 9. System Monitoring

### 9.1 Health Dashboard

Navigate to **Admin → System Health**

**Status Indicators:**
- 🟢 Healthy: All systems operational
- 🟡 Degraded: Some issues detected
- 🔴 Down: Critical issues

**Monitored Components:**
- Database connectivity
- Redis cache
- Email provider
- AI API status
- WebSocket server

### 9.2 Performance Metrics

View in **Admin → Performance**:

| Metric | Target | Description |
|--------|--------|-------------|
| API Response Time | < 500ms | Average API latency |
| Database Queries | < 100ms | Query execution time |
| Cache Hit Rate | > 80% | Redis cache efficiency |
| Error Rate | < 1% | Failed requests |

### 9.3 Alerts

Configure alerts in **Admin → Alerts**:

1. Click **"New Alert"**
2. Select trigger:
   - Error rate > threshold
   - Response time > threshold
   - Service down
3. Choose notification channel:
   - Email
   - Slack
   - Webhook
4. Set severity and recipients

### 9.4 Logs

Access logs in **Admin → Logs**:

- **Application Logs**: General app events
- **Error Logs**: Exceptions and failures
- **Access Logs**: API request history
- **Audit Logs**: Security events

---

## 10. Troubleshooting

### 10.1 Common Issues

**"User can't log in"**
1. Check user exists in team list
2. Verify their Google account matches
3. Check session hasn't expired
4. Try clearing browser cookies

**"Emails not sending"**
1. Check email provider status
2. Verify Gmail connection is active
3. Check rate limits haven't been hit
4. Review bounce reports

**"AI scores not updating"**
1. Check AI agent status
2. Verify Anthropic API key is valid
3. Check token budget isn't exhausted
4. Trigger manual rescore

**"Dashboard showing wrong data"**
1. Check workspace filter is correct
2. Clear browser cache
3. Verify date range selection
4. Check user has correct permissions

### 10.2 Getting Help

**Self-Service:**
- Check this guide
- Review API documentation
- Search knowledge base

**Support Channels:**
- Email: support@unite-group.in
- In-app chat (business hours)
- GitHub Issues (technical)

**Emergency:**
- Critical issues: Contact CTO directly
- See `docs/INCIDENT_RUNBOOK.md` for procedures

### 10.3 Reporting Bugs

When reporting issues, include:

1. Steps to reproduce
2. Expected vs actual behavior
3. Screenshots/videos
4. Browser and OS
5. Console errors (F12 → Console)
6. Network errors (F12 → Network)

---

## Appendix A: Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Quick search |
| `Ctrl/Cmd + N` | New contact |
| `Ctrl/Cmd + E` | New email |
| `Ctrl/Cmd + /` | Show all shortcuts |
| `Esc` | Close modal |

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **Workspace** | Isolated environment for data |
| **AI Score** | 0-100 lead quality rating |
| **Hot Lead** | Contact with score ≥ 80 |
| **Warm Lead** | Contact with score 60-79 |
| **Drip Campaign** | Automated email sequence |
| **RLS** | Row Level Security (database) |
| **Tier** | Subscription level (Starter/Pro/Elite) |

---

*For technical details, see `docs/API_SDK_REFERENCE.md`*
*For incidents, see `docs/INCIDENT_RUNBOOK.md`*
