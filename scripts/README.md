# Unite-Hub AI Agent Scripts

This directory contains standalone CLI scripts for running AI agents.

## Email Agent

**Location**: `scripts/run-email-agent.mjs`

### What It Does

The Email Agent processes unprocessed emails from Duncan's workspace and:

1. ✅ Fetches all unprocessed emails
2. 🔗 Links emails to existing contacts (or creates new ones)
3. 🧠 Analyzes email content for intents and sentiment
4. 💾 Marks emails as processed
5. 📊 Updates contact AI engagement scores
6. 📝 Adds interaction notes to contacts
7. 📋 Logs all actions to audit trail

### Prerequisites

1. **Convex dev server running**:
   ```bash
   npm run dev
   # or
   npx convex dev
   ```

2. **Environment variables** (optional):
   ```bash
   export CONVEX_URL="http://127.0.0.1:3210"
   ```

### How to Run

**Option 1: Using npm script**
```bash
npm run agent:email
```

**Option 2: Direct execution**
```bash
node scripts/run-email-agent.mjs
```

**Option 3: Make it executable (Linux/Mac)**
```bash
chmod +x scripts/run-email-agent.mjs
./scripts/run-email-agent.mjs
```

### Configuration

Edit the script to change organization and workspace IDs:

```javascript
const ORG_ID = "k57akqzf14r07d9q3pbf9kebvn7v7929";
const WORKSPACE_ID = "kh72b1cng9h88691sx4x7krt2h7v7deh";
```

### Sample Output

```
📧 Email Agent Started
Organization: k57akqzf14r07d9q3pbf9kebvn7v7929
Workspace: kh72b1cng9h88691sx4x7krt2h7v7deh

🔍 Fetching unprocessed emails...
Found 3 unprocessed emails

📨 Processing: "Interested in your services"
   From: john@techstartup.com
   🔗 Looking up contact...
   ✅ Linked to existing contact
   🧠 Analyzing content...
   Intents: inquiry, partnership
   Sentiment: positive
   💾 Updating email status...
   📊 Updating contact score...
   📝 Adding interaction note...
   ✅ Email processed successfully

📨 Processing: "Follow-up: Campaign proposal"
   From: lisa@ecommerce.com
   🔗 Looking up contact...
   ✅ Linked to existing contact
   🧠 Analyzing content...
   Intents: followup, proposal
   Sentiment: positive
   💾 Updating email status...
   📊 Updating contact score...
   📝 Adding interaction note...
   ✅ Email processed successfully

==================================================
✅ Email Processing Complete
==================================================
Total processed: 3
New contacts created: 0
Errors: 0
==================================================
```

### Intent Detection

The agent detects these intents:

- **inquiry**: interested, partnership, collaboration, services, help
- **proposal**: proposal, quote, pricing, investment, deal
- **complaint**: issue, problem, concerned, unhappy, urgent, error
- **question**: ?, how, what, when, where, why, can you
- **followup**: follow up, re:, update, following up
- **meeting**: meeting, call, sync, schedule, zoom, teams

### Sentiment Analysis

- **Positive**: excited, love, great, thank, appreciate, interested, wonderful, excellent
- **Negative**: problem, issue, concerned, unhappy, urgent, frustrated, angry
- **Neutral**: Standard business tone

### Troubleshooting

**Error: Cannot find module 'convex/browser'**
```bash
npm install convex
```

**Error: CONVEX_URL not set**
```bash
export CONVEX_URL="http://127.0.0.1:3210"
# or on Windows:
set CONVEX_URL=http://127.0.0.1:3210
```

**Error: Connection refused**
- Make sure Convex dev server is running: `npm run dev`

**No emails found**
- Make sure emails exist in the database and are marked as `isProcessed: false`
- Check that ORG_ID and WORKSPACE_ID match your data

### Next Steps

After processing emails:

1. **View updated contacts** in Convex dashboard
2. **Check audit logs** for processing history
3. **Generate follow-up content** for high-value contacts
4. **Score contacts** using contact intelligence agent

### Future Enhancements

- [ ] Add Claude API integration for better intent/sentiment analysis
- [ ] Support command-line arguments for org/workspace selection
- [ ] Add email filtering by date range
- [ ] Support batch processing with concurrency limits
- [ ] Add retry logic for failed emails
- [ ] Generate summary reports
