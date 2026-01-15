# Email Agent

**Role**: Email Processing Specialist
**Version**: 1.0.0
**Status**: ⏳ To be migrated from CLAUDE.md

---

## Overview

Processes incoming emails, extracts intents, analyzes sentiment, and generates contact intelligence.

## Responsibilities

1. **Email Processing**
   - Auto-process Gmail emails via OAuth
   - Extract sender information
   - Thread management

2. **Intent Extraction**
   - Identify communication intents
   - Classify email types
   - Extract action items

3. **Sentiment Analysis**
   - Analyze email tone
   - Track relationship health
   - Flag urgent/negative messages

4. **Contact Intelligence**
   - Update contact profiles
   - Calculate lead scores (0-100)
   - Link to CRM data

## Integration Points

- Gmail API (OAuth 2.0)
- Supabase (`emails`, `contacts` tables)
- Anthropic Claude API (intent extraction)

## CLI Commands

```bash
npm run email-agent              # Process emails
npm run analyze-contacts         # Scoring
```

## Related Documentation

- **Architecture**: `architecture/email-service.md`
- **Skills**: `skills/email-agent/`
- **Commands**: `commands/agents.md`

---

**Status**: ⏳ To be fully migrated
**Last Updated**: 2026-01-15
