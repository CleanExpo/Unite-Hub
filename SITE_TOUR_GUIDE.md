# 🌐 Unite Hub - Live Site Tour Guide

**Server Status:** ✅ Running on http://localhost:3008
**Database:** ✅ Connected (Default Organization found)

---

## 🏠 Homepage & Authentication

### Landing Page
**URL:** http://localhost:3008
- Main landing page with product overview
- Sign up / Sign in buttons

### Sign In
**URL:** http://localhost:3008/auth/signin
- Google OAuth sign-in
- Email/password sign-in (if SMTP configured)

### Sign Up
**URL:** http://localhost:3008/auth/signup
- Create new account
- User registration form

---

## 📊 Dashboard Pages

### Overview
**URL:** http://localhost:3008/dashboard/overview
- Key metrics and KPIs
- Recent activity
- Quick stats dashboard

### Contacts
**URL:** http://localhost:3008/dashboard/contacts
**Features:**
- View all contacts with AI scores (0-100)
- Filter by score, status, tags
- Add new contacts
- Search and sort
- View contact details and history

**What to Try:**
- Click "+ Add Contact" to create a test contact
- View AI scores for each contact
- Click on a contact to see details

### Campaigns

#### Email Campaigns
**URL:** http://localhost:3008/dashboard/campaigns
**Features:**
- View all email campaigns
- Campaign performance metrics
- Create new campaigns
- Track opens, clicks, replies

#### Drip Sequences
**URL:** http://localhost:3008/dashboard/campaigns/drip
**Features:**
- Visual campaign builder
- Multi-step automated sequences
- Conditional branching
- Trigger configuration
- Performance tracking

**What to Try:**
- Click "Create Campaign"
- Add email steps
- Set wait times
- Configure conditions
- Activate campaign

### Content
**URL:** http://localhost:3008/dashboard/content
**Features:**
- AI-generated content drafts
- Review and approve content
- Content performance
- Personalized messaging

### Intelligence
**URL:** http://localhost:3008/dashboard/intelligence
**Features:**
- AI insights and recommendations
- Lead scoring analytics
- Contact intelligence
- Predictive analytics

### Settings
**URL:** http://localhost:3008/dashboard/settings
**Features:**
- Profile settings
- Gmail integration setup
- API keys
- Team management
- Billing (Stripe)

**What to Try:**
- Click "Connect" under Gmail
- Test OAuth flow
- Configure integrations

### Workspaces
**URL:** http://localhost:3008/dashboard/workspaces
**Features:**
- Manage team workspaces
- Create new workspaces
- Team collaboration
- Workspace settings

---

## 🚀 Additional Pages

### Onboarding
**URL:** http://localhost:3008/onboarding
- New user setup wizard
- Initial configuration
- Quick start guide

### Pricing
**URL:** http://localhost:3008/pricing
- Pricing plans
- Feature comparison
- Subscription options

### Billing
**URL:** http://localhost:3008/billing
- Payment history
- Subscription management
- Invoices

---

## 🧪 Test API Endpoints

### Database Health Check
```bash
curl http://localhost:3008/api/test/db
```
**Response:**
```json
{
  "success": true,
  "message": "Database connection successful",
  "data": [...]
}
```

### List Contacts
```bash
curl http://localhost:3008/api/contacts/list
```

### Campaign API
```bash
curl -X POST http://localhost:3008/api/campaigns/drip \
  -H "Content-Type: application/json" \
  -d '{"action":"list","workspaceId":"default-workspace"}'
```

---

## 🎨 Key Features to Explore

### 1. AI-Powered Lead Scoring
- Navigate to Contacts
- View AI scores (0-100) for each contact
- Scores based on engagement, sentiment, behavior

### 2. Drip Campaign Builder
- Go to Campaigns → Drip Sequences
- Visual drag-and-drop interface
- Multi-step automation
- Conditional logic

### 3. Gmail Integration
- Settings → Integrations
- Connect Gmail via OAuth
- Sync emails automatically
- Send via Gmail API

### 4. Content Generation
- Contacts → Select high-score contact
- Generate personalized content
- AI uses Claude Opus 4
- Review and edit drafts

### 5. Analytics Dashboard
- Overview page
- Campaign performance
- Contact intelligence
- Engagement metrics

---

## 🎯 Quick Demo Flow

### Step 1: Add a Test Contact (2 minutes)
```
1. Go to: http://localhost:3008/dashboard/contacts
2. Click "+ Add Contact"
3. Enter:
   - Name: John Doe
   - Email: john@example.com
   - Company: Example Corp
   - Job Title: VP Marketing
4. Click "Save"
```

### Step 2: Run AI Analysis (1 minute)
```bash
npm run analyze-contacts
```
Watch as the AI analyzes your contact and assigns a score.

### Step 3: Generate Content (2 minutes)
```bash
npm run generate-content
```
AI will generate personalized content for your contact.

### Step 4: Create Drip Campaign (5 minutes)
```
1. Go to: http://localhost:3008/dashboard/campaigns/drip
2. Click "Create Campaign"
3. Name: "Welcome Series"
4. Add Email Step:
   - Subject: "Welcome to our community!"
   - Content: "Hi {{name}}, thanks for joining..."
5. Add Wait Step: 2 days
6. Add Follow-up Email Step
7. Click "Save & Activate"
```

### Step 5: Process Campaign (1 minute)
```bash
npm run process-campaigns
```
See your campaigns execute in real-time.

---

## 🎨 UI/UX Features

### Dark Theme
- Slate-800/700/600 color scheme
- Modern, professional design
- Easy on the eyes

### Responsive Design
- Works on desktop, tablet, mobile
- Adaptive layouts
- Touch-friendly

### Real-time Updates
- Live data via Supabase
- Instant feedback
- No page refreshes needed

### Components
- shadcn/ui components
- Lucide React icons
- Tailwind CSS styling
- Smooth animations

---

## 📊 What's Working Now

### ✅ Fully Functional
- Dashboard pages (all 13 pages)
- Database connections
- AI content generation
- Contact management
- Campaign builder UI
- API endpoints
- Automation scripts

### ⚠️ Needs Configuration
- Gmail OAuth (needs Google Console update)
- Email Auth (needs SMTP setup)
- Stripe Payments (needs API keys)

### 🔄 Automation Scripts
```bash
# Run any of these:
npm run analyze-contacts    # AI analysis
npm run generate-content    # Content generation
npm run process-campaigns   # Campaign automation
```

---

## 🐛 Troubleshooting

### Can't Access Site?
```bash
# Check server is running
curl http://localhost:3008

# Restart if needed
npm run dev
```

### Database Connection Issues?
```bash
# Test connection
curl http://localhost:3008/api/test/db

# Check environment variables
cat .env.local | grep SUPABASE
```

### Gmail OAuth Not Working?
1. Update Google Cloud Console redirect URI:
   `http://localhost:3008/api/integrations/gmail/callback`
2. Ensure credentials are correct in .env.local

---

## 🎉 Enjoy Your Product!

**Main Dashboard:**
👉 http://localhost:3008/dashboard/overview

**Start Here:**
1. Visit dashboard
2. Add a test contact
3. Run automation scripts
4. Explore features
5. Build a drip campaign

**Need Help?**
- See: README.md
- See: DEPLOYMENT_SUMMARY.md
- See: docs/QUICKSTART.md

---

**Server Running:** ✅ http://localhost:3008
**Database:** ✅ Connected
**Status:** 🟢 All Systems Operational
