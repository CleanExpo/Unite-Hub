---
name: email-template
description: >-
  Responsive transactional email templates using React Email and Resend.
  Covers Scientific Luxury dark-theme email design, Australian locale
  formatting, template composition, preview tooling, and integration
  with the project's cron jobs and notification flows.
license: MIT
metadata:
  author: NodeJS-Starter-V1
  version: '1.0.0'
  locale: en-AU
---

# Email Template - Responsive Transactional Emails

## Description

Provides responsive transactional email template patterns for NodeJS-Starter-V1 using React Email and Resend. Covers Scientific Luxury dark-theme email design, template composition with shared components, preview tooling, and integration with the project's cron jobs and notification flows using Australian locale formatting.

---

## When to Apply

### Positive Triggers

- Creating transactional email templates (welcome, password reset, alerts)
- Building notification emails for cron job reports or agent alerts
- Designing email layouts that match the Scientific Luxury design system
- Setting up email delivery infrastructure (Resend, SMTP, SendGrid)
- Adding email preview and testing tooling
- User mentions: "email", "template", "notification", "transactional", "welcome email"

### Negative Triggers

- Building in-app toast notifications (use UI component patterns)
- Sending Slack or webhook notifications (use `webhook-handler` patterns)
- Generating PDF reports (use `pdf-generator` patterns)
- Handling email as CSV import data (use `csv-processor` instead)

## Core Directives

### The Four Rules of Email Templates

1. **Table-based layout**: Email clients do not support CSS Grid/Flexbox — use `<table>` wrappers
2. **Inline styles**: Most clients strip `<style>` blocks — React Email handles this automatically
3. **Dark theme first**: Scientific Luxury OLED aesthetic adapted for email (dark background, spectral accents)
4. **Preview before send**: Every template must render in the React Email preview before deployment

---

## Recommended Stack

| Tool | Purpose | Install |
|------|---------|---------|
| `@react-email/components` | Component library for email templates | `pnpm add @react-email/components` |
| `react-email` | Dev server for previewing templates | `pnpm add -D react-email` |
| `resend` | Email delivery API (recommended) | `pnpm add resend` |

### Alternative Providers

| Provider | When to Use |
|----------|------------|
| **Resend** | Recommended — React Email native, simple API |
| **SendGrid** | Enterprise — high volume, advanced analytics |
| **AWS SES** | Cost-effective — already on AWS infrastructure |
| **SMTP** | Self-hosted — full control, no vendor lock-in |

---

## File Structure

```
apps/web/
├── emails/                      # Email templates
│   ├── components/              # Shared email components
│   │   ├── email-header.tsx     # Logo + brand header
│   │   ├── email-footer.tsx     # Unsubscribe + address
│   │   └── email-button.tsx     # CTA button
│   ├── welcome.tsx              # Welcome email
│   ├── password-reset.tsx       # Password reset
│   ├── daily-report.tsx         # Daily agent report
│   └── alert-notification.tsx   # System alert
├── lib/email/
│   ├── send.ts                  # Email sending utility
│   └── config.ts                # Provider configuration
```

---

## Template Patterns

### Base Layout Component

```tsx
import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
} from '@react-email/components';

interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          {children}
        </Container>
      </Body>
    </Html>
  );
}

// Scientific Luxury email styles (inline for compatibility)
const body = {
  backgroundColor: '#050505',
  fontFamily: "'Inter', 'SF Pro Display', Helvetica, Arial, sans-serif",
  margin: '0',
  padding: '0',
};

const container = {
  backgroundColor: '#0a0a0a',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: '2px',  // rounded-sm equivalent
  margin: '40px auto',
  maxWidth: '560px',
  padding: '32px',
};
```

### Shared Components

```tsx
import { Heading, Hr, Link, Text } from '@react-email/components';

// Header with brand name
export function EmailHeader({ title }: { title: string }) {
  return (
    <>
      <Text style={brandLabel}>NODEJS-STARTER-V1</Text>
      <Heading style={heading}>{title}</Heading>
      <Hr style={divider} />
    </>
  );
}

// CTA Button — spectral cyan accent
export function EmailButton({ href, children }: { href: string; children: string }) {
  return (
    <Link href={href} style={button}>
      {children}
    </Link>
  );
}

// Footer with unsubscribe
export function EmailFooter() {
  return (
    <>
      <Hr style={divider} />
      <Text style={footer}>
        Sent by NodeJS-Starter-V1 — Brisbane, QLD, Australia
      </Text>
    </>
  );
}

const brandLabel = {
  color: 'rgba(255, 255, 255, 0.3)',
  fontSize: '10px',
  fontFamily: "'JetBrains Mono', monospace",
  letterSpacing: '0.3em',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px',
};

const heading = {
  color: 'rgba(255, 255, 255, 0.9)',
  fontSize: '24px',
  fontWeight: '200',
  letterSpacing: '-0.02em',
  margin: '0 0 24px',
};

const divider = {
  borderColor: 'rgba(255, 255, 255, 0.06)',
  borderWidth: '0.5px',
  margin: '24px 0',
};

const button = {
  backgroundColor: '#00F5FF',
  borderRadius: '2px',
  color: '#050505',
  display: 'inline-block',
  fontFamily: "'Inter', Helvetica, sans-serif",
  fontSize: '14px',
  fontWeight: '500',
  padding: '12px 24px',
  textDecoration: 'none',
};

const footer = {
  color: 'rgba(255, 255, 255, 0.3)',
  fontSize: '11px',
  margin: '0',
};
```

### Example: Daily Report Email

```tsx
import { Text } from '@react-email/components';
import { EmailLayout } from './components/email-layout';
import { EmailHeader, EmailFooter } from './components/email-header';

interface DailyReportProps {
  date: string;          // DD/MM/YYYY
  total: number;
  completed: number;
  failed: number;
  successRate: string;
}

export function DailyReportEmail({
  date, total, completed, failed, successRate,
}: DailyReportProps) {
  return (
    <EmailLayout preview={`Agent Report — ${date}`}>
      <EmailHeader title="Daily Agent Report" />
      <Text style={metric}>
        <span style={metricLabel}>DATE</span>
        <br />
        <span style={metricValue}>{date}</span>
      </Text>
      <Text style={metric}>
        <span style={metricLabel}>TOTAL RUNS</span>
        <br />
        <span style={metricValue}>{total}</span>
      </Text>
      <Text style={metric}>
        <span style={metricLabel}>SUCCESS RATE</span>
        <br />
        <span style={{ ...metricValue, color: '#00FF88' }}>{successRate}</span>
      </Text>
      {failed > 0 && (
        <Text style={metric}>
          <span style={metricLabel}>FAILED</span>
          <br />
          <span style={{ ...metricValue, color: '#FF4444' }}>{failed}</span>
        </Text>
      )}
      <EmailFooter />
    </EmailLayout>
  );
}

const metric = { margin: '0 0 16px' };
const metricLabel = {
  color: 'rgba(255, 255, 255, 0.3)',
  fontSize: '10px',
  fontFamily: "'JetBrains Mono', monospace",
  letterSpacing: '0.2em',
  textTransform: 'uppercase' as const,
};
const metricValue = {
  color: 'rgba(255, 255, 255, 0.9)',
  fontSize: '20px',
  fontFamily: "'JetBrains Mono', monospace",
  fontWeight: '500',
};
```

---

## Sending Emails

### Resend Integration

```typescript
// apps/web/lib/email/send.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
}

export async function sendEmail({ to, subject, react }: SendEmailOptions) {
  const { data, error } = await resend.emails.send({
    from: 'NodeJS-Starter-V1 <noreply@yourdomain.com.au>',
    to,
    subject,
    react,
  });

  if (error) {
    throw new Error(`Email send failed: ${error.message}`);
  }

  return data;
}
```

### Cron Job Integration

Wire into the existing daily report cron:

```typescript
// apps/web/app/api/cron/daily-report/route.ts
import { sendEmail } from '@/lib/email/send';
import { DailyReportEmail } from '@/emails/daily-report';

// After generating the report...
if (process.env.REPORT_EMAIL_RECIPIENTS) {
  const recipients = process.env.REPORT_EMAIL_RECIPIENTS.split(',');
  await sendEmail({
    to: recipients,
    subject: `Agent Report — ${report.date}`,
    react: DailyReportEmail({
      date: new Date(report.date).toLocaleDateString('en-AU'),
      total: report.summary.total,
      completed: report.summary.completed,
      failed: report.summary.failed,
      successRate: report.summary.successRate,
    }),
  });
}
```

---

## Scientific Luxury Email Palette

Adapted from the project's design tokens for email client compatibility:

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#050505` | Email body |
| Container | `#0a0a0a` | Content area |
| Border | `rgba(255, 255, 255, 0.06)` | Dividers, container |
| Text primary | `rgba(255, 255, 255, 0.9)` | Headings, values |
| Text secondary | `rgba(255, 255, 255, 0.7)` | Body text |
| Text muted | `rgba(255, 255, 255, 0.3)` | Labels, footer |
| Cyan accent | `#00F5FF` | CTA buttons, links |
| Emerald | `#00FF88` | Success metrics |
| Red | `#FF4444` | Failure metrics |
| Amber | `#FFB800` | Warning states |

### Email Client Dark Mode Considerations

Some email clients force light mode. Add fallback:

```tsx
const container = {
  backgroundColor: '#0a0a0a',
  // Outlook forces white — use border as visual anchor
  border: '1px solid #1a1a1a',
};
```

---

## Preview and Testing

### React Email Dev Server

```bash
# Add script to package.json
# "email:dev": "email dev --dir apps/web/emails --port 3001"

pnpm email:dev
# Opens http://localhost:3001 with live preview
```

### Programmatic Rendering (For Tests)

```typescript
import { render } from '@react-email/render';
import { DailyReportEmail } from '@/emails/daily-report';

const html = await render(
  DailyReportEmail({
    date: '23/01/2026',
    total: 42,
    completed: 38,
    failed: 4,
    successRate: '90.5%',
  })
);
// html is a string of rendered HTML — can be used in tests or SMTP
```

---

## Anti-Patterns

| Anti-Pattern | Why It Fails | Correct Approach |
|---|---|---|
| CSS Grid/Flexbox in emails | Not supported in Outlook, Gmail | Table-based layout via React Email |
| External `<style>` blocks | Stripped by most clients | Inline styles (React Email default) |
| Light theme email from dark app | Inconsistent brand experience | Dark theme email matching Scientific Luxury |
| `<img>` without `alt` text | Accessibility failure | Always include descriptive `alt` |
| Hardcoded recipient addresses | Breaks across environments | Use `REPORT_EMAIL_RECIPIENTS` env var |
| Sending without preview | Rendering bugs in production | Always preview in React Email dev server |

---

## Checklist for New Email Templates

### Design

- [ ] Uses Scientific Luxury palette (dark background, spectral accents)
- [ ] Table-based layout (no CSS Grid/Flexbox)
- [ ] `rounded-sm` equivalent (2px border-radius) — no large radii
- [ ] JetBrains Mono for data values, Inter for editorial text
- [ ] Single pixel borders (`rgba(255, 255, 255, 0.06)`)

### Implementation

- [ ] Extends `EmailLayout` base component
- [ ] Includes `<Preview>` text for inbox snippet
- [ ] Uses `EmailHeader` and `EmailFooter` shared components
- [ ] All images have `alt` attributes
- [ ] Props typed with TypeScript interface

### Delivery

- [ ] `sendEmail()` utility used (not direct Resend/SMTP calls)
- [ ] Recipient from environment variable (not hardcoded)
- [ ] Error handling with structured logging
- [ ] Tested in React Email dev server

### Australian Locale

- [ ] Dates formatted as DD/MM/YYYY
- [ ] Currency as AUD ($X,XXX.XX)
- [ ] Footer references Australian location
- [ ] Spelling: colour, behaviour, analyse, organise

---

## Response Format

```
[AGENT_ACTIVATED]: Email Template
[PHASE]: {Design | Implementation | Review}
[STATUS]: {in_progress | complete}

{email template analysis or implementation guidance}

[NEXT_ACTION]: {what to do next}
```

## Integration Points

### Scientific Luxury

- Email palette derived from `apps/web/lib/design-tokens.ts`
- Dark background, spectral accents, sharp corners, monospace data values
- No standard Bootstrap/Tailwind email themes

### Cron Scheduler

- Daily report email wired into `/api/cron/daily-report` route
- Alert emails triggered by cron health check failures
- `cron-scheduler` patterns for scheduling digest emails

### Structured Logging

- Log `email_sent`, `email_failed` events with recipient count and template name
- Include `correlation_id` for tracing email delivery through the pipeline

### Error Taxonomy

- Email delivery failures: `SYS_EXTERNAL_EMAIL_PROVIDER` (503)
- Invalid recipient: `DATA_VALIDATION_INVALID_EMAIL` (422)
- Template rendering errors: `SYS_RUNTIME_EMAIL_RENDER` (500)

## Australian Localisation (en-AU)

- **Date Format**: DD/MM/YYYY in email body
- **Currency**: AUD ($) — formatted as `$X,XXX.XX`
- **Timezone**: AEST/AEDT — timestamps display Australian time
- **Spelling**: colour, behaviour, analyse, organise, centre
- **Footer**: Australian business address (Brisbane, QLD)
