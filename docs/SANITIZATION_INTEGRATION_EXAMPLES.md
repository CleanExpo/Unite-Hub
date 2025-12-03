# API Key Sanitization - Integration Examples

## Overview

This document provides real-world integration examples for the API key sanitization system.

## 1. API Route Error Handling

### Before (Unsafe)
```typescript
// src/app/api/agents/content/route.ts
export async function POST(request: Request) {
  try {
    const result = await anthropic.messages.create({ /* ... */ });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Content generation failed:', error); // ❌ May leak API keys
    return NextResponse.json(
      { error: error.message }, // ❌ May expose keys to client
      { status: 500 }
    );
  }
}
```

### After (Safe)
```typescript
// src/app/api/agents/content/route.ts
import { sanitizeError } from '@/lib/ai/sanitize';

export async function POST(request: Request) {
  try {
    const result = await anthropic.messages.create({ /* ... */ });
    return NextResponse.json(result);
  } catch (error) {
    const safe = sanitizeError(error); // ✅ Sanitized
    console.error('Content generation failed:', safe);
    return NextResponse.json(
      { error: safe instanceof Error ? safe.message : 'Internal error' },
      { status: 500 }
    );
  }
}
```

## 2. AI Service Wrapper

### Before (Unsafe)
```typescript
// src/lib/ai/anthropic-service.ts
export async function generateText(prompt: string) {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });
    return response.content[0].text;
  } catch (error) {
    logger.error('AI generation failed', { error }); // ❌ May leak keys
    throw error;
  }
}
```

### After (Safe)
```typescript
// src/lib/ai/anthropic-service.ts
import { withErrorSanitization } from '@/lib/ai/sanitize';

export async function generateText(prompt: string) {
  return withErrorSanitization(async () => {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });
    return response.content[0].text;
  });
  // Errors are automatically sanitized before being thrown
}
```

## 3. Logger Configuration

### Before (Unsafe)
```typescript
// src/lib/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'app.log' })
  ]
});
```

### After (Safe)
```typescript
// src/lib/logger.ts
import winston from 'winston';
import { createSanitizedLogger } from '@/lib/ai/sanitize';

export const logger = winston.createLogger({
  format: winston.format.combine(
    createSanitizedLogger(), // ✅ Auto-sanitize all logs
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'app.log' })
  ]
});
```

## 4. Email Agent Error Reporting

### Before (Unsafe)
```typescript
// src/lib/agents/email-processor.ts
async function processEmail(email: Email) {
  try {
    const analysis = await analyzeEmailIntent(email.content);
    return analysis;
  } catch (error) {
    await logToDatabase({
      action: 'email_processing_failed',
      error: JSON.stringify(error), // ❌ May serialize API keys
      metadata: { emailId: email.id }
    });
    throw error;
  }
}
```

### After (Safe)
```typescript
// src/lib/agents/email-processor.ts
import { sanitizeError, sanitizeObject } from '@/lib/ai/sanitize';

async function processEmail(email: Email) {
  try {
    const analysis = await analyzeEmailIntent(email.content);
    return analysis;
  } catch (error) {
    const safe = sanitizeError(error);
    await logToDatabase({
      action: 'email_processing_failed',
      error: JSON.stringify(safe), // ✅ Sanitized
      metadata: sanitizeObject({ emailId: email.id })
    });
    throw safe;
  }
}
```

## 5. Monitoring Integration (Sentry)

### Before (Unsafe)
```typescript
// src/lib/monitoring/sentry-config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  beforeSend(event) {
    return event; // ❌ Raw event may contain API keys
  }
});
```

### After (Safe)
```typescript
// src/lib/monitoring/sentry-config.ts
import * as Sentry from "@sentry/nextjs";
import { sanitizeError, sanitizeObject } from '@/lib/ai/sanitize';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  beforeSend(event) {
    // ✅ Sanitize all error data before sending
    if (event.exception?.values) {
      event.exception.values = event.exception.values.map(value => {
        if (value.value) {
          value.value = sanitizeString(value.value);
        }
        if (value.stacktrace?.frames) {
          value.stacktrace.frames = value.stacktrace.frames.map(frame => ({
            ...frame,
            vars: frame.vars ? sanitizeObject(frame.vars) : undefined
          }));
        }
        return value;
      });
    }
    if (event.contexts) {
      event.contexts = sanitizeObject(event.contexts);
    }
    return event;
  }
});
```

## 6. OpenRouter Service

### Before (Unsafe)
```typescript
// src/lib/ai/openrouter-service.ts
export async function callOpenRouter(params: any) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter failed: ${error}`); // ❌ May include API key
  }

  return response.json();
}
```

### After (Safe)
```typescript
// src/lib/ai/openrouter-service.ts
import { withErrorSanitization, sanitizeString } from '@/lib/ai/sanitize';

export async function callOpenRouter(params: any) {
  return withErrorSanitization(async () => {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const error = await response.text();
      const safeError = sanitizeString(error); // ✅ Sanitize error text
      throw new Error(`OpenRouter failed: ${safeError}`);
    }

    return response.json();
  });
}
```

## 7. Content Agent with Extended Thinking

### Before (Unsafe)
```typescript
// src/lib/agents/content-agent.ts
export async function generateContent(params: ContentParams) {
  try {
    const result = await callAnthropicWithRetry(() =>
      anthropic.messages.create({
        model: 'claude-opus-4-5-20251101',
        max_tokens: 8000,
        thinking: {
          type: 'enabled',
          budget_tokens: 5000
        },
        messages: [{ role: 'user', content: params.prompt }]
      })
    );
    return extractContentFromResponse(result.data);
  } catch (error) {
    console.error('Content generation failed:', error); // ❌ Unsafe
    throw error;
  }
}
```

### After (Safe)
```typescript
// src/lib/agents/content-agent.ts
import { sanitizeError } from '@/lib/ai/sanitize';

export async function generateContent(params: ContentParams) {
  try {
    const result = await callAnthropicWithRetry(() =>
      anthropic.messages.create({
        model: 'claude-opus-4-5-20251101',
        max_tokens: 8000,
        thinking: {
          type: 'enabled',
          budget_tokens: 5000
        },
        messages: [{ role: 'user', content: params.prompt }]
      })
    );
    return extractContentFromResponse(result.data);
  } catch (error) {
    // ✅ callAnthropicWithRetry already sanitizes, but be explicit
    const safe = sanitizeError(error);
    console.error('Content generation failed:', safe);
    throw safe;
  }
}
```

## 8. Webhook Endpoint Error Response

### Before (Unsafe)
```typescript
// src/app/api/webhooks/ai-callback/route.ts
export async function POST(req: Request) {
  try {
    const body = await req.json();
    await processWebhook(body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    // ❌ Exposes full error to external service
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### After (Safe)
```typescript
// src/app/api/webhooks/ai-callback/route.ts
import { sanitizeError } from '@/lib/ai/sanitize';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await processWebhook(body);
    return NextResponse.json({ success: true });
  } catch (error) {
    const safe = sanitizeError(error); // ✅ Sanitized
    console.error('Webhook processing failed:', safe);

    // ✅ Safe generic message to external service
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
```

## 9. Database Audit Logging

### Before (Unsafe)
```typescript
// src/lib/audit/logger.ts
export async function logAuditEvent(event: AuditEvent) {
  await supabase.from('auditLogs').insert({
    action: event.action,
    userId: event.userId,
    metadata: event.metadata, // ❌ May contain API keys
    error: event.error, // ❌ May contain API keys
    timestamp: new Date().toISOString()
  });
}
```

### After (Safe)
```typescript
// src/lib/audit/logger.ts
import { sanitizeObject, sanitizeError } from '@/lib/ai/sanitize';

export async function logAuditEvent(event: AuditEvent) {
  await supabase.from('auditLogs').insert({
    action: event.action,
    userId: event.userId,
    metadata: sanitizeObject(event.metadata || {}), // ✅ Sanitized
    error: event.error ? JSON.stringify(sanitizeError(event.error)) : null,
    timestamp: new Date().toISOString()
  });
}
```

## 10. CLI Script Error Output

### Before (Unsafe)
```bash
# scripts/run-email-agent.mjs
try {
  await processEmails();
  console.log('✅ Email processing complete');
} catch (error) {
  console.error('❌ Email processing failed:', error); // ❌ Unsafe
  process.exit(1);
}
```

### After (Safe)
```bash
# scripts/run-email-agent.mjs
import { sanitizeError } from '../src/lib/ai/sanitize.ts';

try {
  await processEmails();
  console.log('✅ Email processing complete');
} catch (error) {
  const safe = sanitizeError(error); // ✅ Sanitized
  console.error('❌ Email processing failed:', safe);
  process.exit(1);
}
```

## Best Practices Summary

### Do ✅
1. **Always sanitize before logging**: `console.error(sanitizeError(error))`
2. **Use wrappers for AI calls**: `withErrorSanitization(async () => ...)`
3. **Sanitize before external systems**: Sentry, webhooks, monitoring
4. **Sanitize audit logs**: Database logs may be exposed
5. **Test sanitization**: Run `npm run test:sanitization` regularly

### Don't ❌
1. **Don't log raw errors**: `console.error(error)` without sanitization
2. **Don't expose errors to clients**: Always use generic messages
3. **Don't serialize unsanitized objects**: `JSON.stringify(error)`
4. **Don't skip sanitization in scripts**: CLI tools need it too
5. **Don't assume it's handled**: Explicitly sanitize at boundaries

## Testing Your Integration

After integrating sanitization, test with:

```typescript
// Test error with fake API key
const fakeError = new Error('API call failed with key: sk-ant-' + 'a'.repeat(95));

const safe = sanitizeError(fakeError);
console.log(safe.message);
// Should log: "API call failed with key: [REDACTED_API_KEY]"

// Verify no API key leaked
if (safe.message.includes('sk-ant-')) {
  throw new Error('❌ SANITIZATION FAILED - API key leaked!');
}
console.log('✅ Sanitization working');
```

## Related Documentation

- Main Guide: `docs/API_KEY_SANITIZATION.md`
- Implementation: `src/lib/ai/sanitize.ts`
- Rate Limiter: `src/lib/anthropic/rate-limiter.ts`
- Security Fixes: `docs/SECURITY_FIXES_PHASE5.md`
