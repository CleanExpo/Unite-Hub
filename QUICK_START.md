# Unite-Hub Quick Start Guide

Get your AI-powered marketing automation platform up and running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Anthropic API key (for content generation)

## Installation

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
# Edit .env.local with your settings:
# - CONVEX_URL
# - ORG_ID
# - WORKSPACE_ID
# - ANTHROPIC_API_KEY
```

## Seed Test Data

```bash
# Populate database with Duncan's Marketing Agency sample data
npx convex run seed:seedDuncan
```

This creates:
- 1 organization (Duncan's Marketing Agency)
- 3 users (Duncan, Sarah, Mike)
- 5 contacts (John Smith, Lisa Johnson, Carlos Rodriguez, Emma Chen, David Thompson)
- 3 sample emails
- 1 campaign
- 2 content drafts

## Running the Platform

### Option 1: Web Dashboard

```bash
# Terminal 1: Start Convex backend
npm run convex

# Terminal 2: Start Next.js dashboard
npm run dev
```

Then open http://localhost:3000 in your browser.

### Option 2: CLI Agents

```bash
# Process all unprocessed emails
npm run email-agent

# Generate content for warm leads (AI score ≥ 60)
npm run content-agent

# Run full workflow: email → content → health check
npm run orchestrator

# Run system audit only
npm run audit-system
```

## Dashboard Features

Once running, you'll see:

- **Stats Overview**: Contacts, high-value leads, content drafts, recent actions
- **Top Contacts**: Sorted by AI engagement score (0-100)
- **Content Drafts**: AI-generated marketing emails pending review
- **Recent Activity**: Live audit log feed
- **CLI Commands**: Quick reference for running agents

## AI Agent Workflows

### Email Agent
Processes incoming emails with AI analysis:
- Extracts intent (inquiry, proposal, complaint, etc.)
- Analyzes sentiment (positive, neutral, negative)
- Links to contacts automatically
- Updates AI engagement scores

### Content Agent
Generates personalized marketing content using Claude AI:
- **Followup emails** (AI score 60-79)
- **Proposals** (AI score ≥ 80)
- **General outreach** (AI score 60+, low engagement)

All content is contextually aware based on:
- Contact interaction history
- Company/industry
- Job title
- Previous email sentiment
- AI engagement score

### Orchestrator
Coordinates multi-agent pipelines:
1. Run email agent → process all unprocessed emails
2. Run content agent → generate content for warm leads
3. Health check → system metrics and error analysis
4. Report → comprehensive workflow summary

## Understanding AI Scores

Contacts are scored 0-100 based on:
- **Email engagement** (40%): Number of interactions
- **Sentiment** (20%): Positive sentiment increases score
- **Intent quality** (20%): Proposals/meetings score higher
- **Job title** (10%): Decision-maker titles (CEO, VP) score higher
- **Status** (10%): Lead > Prospect > Customer progression

### Score Interpretation

- **80-100**: Hot lead → Generate proposal
- **60-79**: Warm lead → Generate followup
- **40-59**: Cool lead → Monitor, no immediate action
- **0-39**: Cold lead → Re-engage campaigns

## Next Steps

1. **Review Generated Content**
   - Check dashboard for pending drafts
   - Edit/approve content for sending
   - Schedule sends to contacts

2. **Run Agents Regularly**
   - Set up cron jobs or scheduled tasks
   - Process new emails daily
   - Generate content for new warm leads

3. **Monitor System Health**
   - Run `npm run audit-system` weekly
   - Check error rates and agent performance
   - Review audit logs for anomalies

4. **Customize AI Prompts**
   - Edit `scripts/run-content-agent.mjs`
   - Adjust content type logic in `buildPrompt()`
   - Modify Claude system prompt for brand voice

5. **Extend Functionality**
   - Add email sending integration
   - Build calendar scheduling
   - Create custom reports
   - Integrate with CRM (Salesforce, HubSpot)

## Troubleshooting

### Convex Connection Issues
```bash
# Restart Convex
npm run convex
```

### Frontend Build Errors
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### Agent Errors
Check audit logs in dashboard or run:
```bash
npx convex query system:getAuditLogs '{"orgId":"your-org-id","limit":50}'
```

### Claude API Errors
- Verify `ANTHROPIC_API_KEY` in `.env.local`
- Check API quota/rate limits
- Review error in audit logs

## Support

For issues and questions, check the README.md or open an issue on the repository.

---

Built with Convex, Next.js, React, Tailwind CSS, and Claude AI
