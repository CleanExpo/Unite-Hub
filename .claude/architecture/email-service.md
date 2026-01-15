# Email Service Architecture

**Pattern**: Multi-Provider Fallback
**Status**: ⏳ To be migrated from CLAUDE.md
**Last Updated**: 2026-01-15

---

## Overview

Multi-provider email system with automatic failover for reliability.

## Provider Priority

**Priority order**: SendGrid → Resend → Gmail SMTP

```typescript
import { sendEmail } from '@/lib/email/email-service';

const result = await sendEmail({
  to: 'user@example.com',
  subject: 'Welcome',
  html: '<h1>Welcome!</h1>',
  text: 'Welcome!',
  provider: 'auto', // Automatic failover
});

if (result.success) {
  console.log('Sent via:', result.provider);
  console.log('Message ID:', result.messageId);
}
```

## Configuration

```env
# SendGrid (priority 1)
SENDGRID_API_KEY=your-key

# Resend (priority 2)
RESEND_API_KEY=your-key

# Gmail SMTP (priority 3, always available)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=contact@unite-group.in
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=contact@unite-group.in
```

## Testing

```bash
node scripts/test-email-config.mjs
```

## Key Files

- `src/lib/email/email-service.ts` - Multi-provider service (535 lines)
- `EMAIL_SERVICE_COMPLETE.md` - Implementation summary
- `GMAIL_APP_PASSWORD_SETUP.md` - Gmail SMTP setup guide

---

**To be migrated from**: CLAUDE.md lines 477-512
