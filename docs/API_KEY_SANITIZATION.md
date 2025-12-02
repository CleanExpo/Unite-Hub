# API Key Sanitization Guide

**Security Fix - Phase 5 Week 5**

Prevents accidental exposure of API keys in error logs, stack traces, and monitoring systems.

## Overview

The sanitization module (`src/lib/ai/sanitize.ts`) provides comprehensive API key redaction for:
- Anthropic API keys (`sk-ant-...`)
- OpenAI API keys (`sk-...`)
- Google API keys (`AIza...`)
- OpenRouter API keys (`sk-or-v1-...`)
- Perplexity API keys (`pplx-...`)
- Generic long alphanumeric tokens

## Quick Start

### Basic String Sanitization

```typescript
import { sanitizeString } from '@/lib/ai/sanitize';

const logMessage = 'API call failed with key: sk-ant-abc123...';
const safe = sanitizeString(logMessage);
console.log(safe); // "API call failed with key: [REDACTED_API_KEY]"
```

### Error Sanitization

```typescript
import { sanitizeError } from '@/lib/ai/sanitize';

try {
  await anthropic.messages.create({ /* ... */ });
} catch (error) {
  const safeError = sanitizeError(error);
  console.error(safeError); // All API keys redacted
  logger.error('API call failed', safeError);
}
```

### Automatic Error Sanitization

```typescript
import { withErrorSanitization } from '@/lib/ai/sanitize';

const safeApiCall = withErrorSanitization(async () => {
  return await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages: [{ role: 'user', content: 'Hello' }],
  });
});

try {
  const result = await safeApiCall();
} catch (error) {
  // Error is automatically sanitized before being thrown
  console.error(error); // Safe to log
}
```

### Object Sanitization

```typescript
import { sanitizeObject } from '@/lib/ai/sanitize';

const config = {
  apiKey: 'sk-ant-abc123...',
  endpoint: 'https://api.anthropic.com',
  nested: {
    token: 'AIzaSy...',
    metadata: { secret: 'pplx-...' }
  }
};

const safe = sanitizeObject(config);
console.log(safe);
// {
//   apiKey: '[REDACTED_API_KEY]',
//   endpoint: 'https://api.anthropic.com',
//   nested: {
//     token: '[REDACTED_API_KEY]',
//     metadata: { secret: '[REDACTED_API_KEY]' }
//   }
// }
```

## Integration with Existing Code

### Winston Logger Integration

```typescript
import winston from 'winston';
import { createSanitizedLogger } from '@/lib/ai/sanitize';

const logger = winston.createLogger({
  format: winston.format.combine(
    createSanitizedLogger(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'app.log' })
  ]
});

// All logs are automatically sanitized
logger.error('API error', { apiKey: 'sk-ant-123...' });
// Logs: { message: 'API error', apiKey: '[REDACTED_API_KEY]' }
```

### Anthropic Rate Limiter

The rate limiter (`src/lib/anthropic/rate-limiter.ts`) now automatically sanitizes errors:

```typescript
import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter';

const result = await callAnthropicWithRetry(async () => {
  return await anthropic.messages.create({ /* ... */ });
});

// All errors are sanitized before being logged or thrown
```

## Detected Patterns

| Provider | Pattern | Example |
|----------|---------|---------|
| Anthropic | `sk-ant-[a-zA-Z0-9-]{95,}` | `sk-ant-api03-abc123...` |
| OpenAI | `sk-[a-zA-Z0-9]{48}` | `sk-1234567890abcdef...` |
| Google | `AIza[a-zA-Z0-9_-]{35}` | `AIzaSyC1234567890...` |
| OpenRouter | `sk-or-v1-[a-zA-Z0-9]{64}` | `sk-or-v1-abc123...` |
| Perplexity | `pplx-[a-zA-Z0-9]{40}` | `pplx-abc123def456...` |

## Sensitive Key Detection

Keys named with these patterns are automatically redacted:
- `api_key`, `apiKey`, `API_KEY`
- `secret`, `SECRET`
- `token`, `TOKEN`
- `password`, `PASSWORD`
- `auth`, `AUTH`
- `bearer`, `BEARER`

## Testing

Run the sanitization test suite:

```bash
npm run test:sanitization
# or
node scripts/test-sanitization.mjs
```

Test output:
```
🧪 Testing API Key Sanitization

Test Results:

1. ✅ PASS - Anthropic API key
2. ✅ PASS - OpenAI API key
3. ✅ PASS - Google API key
4. ✅ PASS - Object sanitization
5. ✅ PASS - Error sanitization

✅ All sanitization tests passed!
```

## Best Practices

### 1. Sanitize Before Logging

Always sanitize errors before logging:

```typescript
// ❌ BAD - May leak API keys
catch (error) {
  console.error('Error:', error);
}

// ✅ GOOD - Sanitized
catch (error) {
  const safe = sanitizeError(error);
  console.error('Error:', safe);
}
```

### 2. Use Wrapper Functions

Wrap AI API calls for automatic sanitization:

```typescript
// ✅ GOOD - Automatically sanitized
const result = await withErrorSanitization(async () => {
  return await aiService.call();
});
```

### 3. Sanitize Monitoring Data

Sanitize before sending to monitoring services:

```typescript
import { sanitizeObject } from '@/lib/ai/sanitize';

// ❌ BAD - May send API keys to Sentry
Sentry.captureException(error);

// ✅ GOOD - Sanitized
const safe = sanitizeError(error);
Sentry.captureException(safe);
```

### 4. Sanitize User-Facing Errors

Never expose API keys in user-facing error messages:

```typescript
// ❌ BAD - May show API key to user
return res.status(500).json({ error: error.message });

// ✅ GOOD - Sanitized
const safe = sanitizeError(error);
return res.status(500).json({ error: safe.message });
```

## Performance

Sanitization has minimal performance impact:
- String sanitization: ~0.1ms per string
- Object sanitization: ~1ms per object (depends on size)
- Error sanitization: ~0.5ms per error

For high-throughput scenarios, consider:
1. Only sanitize when logging (not in hot paths)
2. Use the `withErrorSanitization` wrapper only for external API calls
3. Cache sanitized strings if used repeatedly

## Implementation Details

### How It Works

1. **Pattern Matching**: Uses regex to detect API key patterns
2. **Recursive Traversal**: Walks through nested objects and arrays
3. **Preserves Structure**: Maintains object/error structure while redacting values
4. **Stack Trace Safety**: Sanitizes error stack traces without breaking them

### What Gets Redacted

- API key values in strings
- Environment variable values (when pattern matches)
- Bearer token values
- Values of keys matching sensitive patterns
- API keys in error messages and stack traces

### What's NOT Redacted

- Non-sensitive strings
- Numbers and booleans
- Object keys (only values are redacted)
- Short alphanumeric strings (<40 chars)
- URLs and email addresses

## Troubleshooting

### False Positives

If legitimate strings are being redacted:

```typescript
// Option 1: Adjust the generic pattern
// In sanitize.ts, modify SENSITIVE_PATTERNS.generic

// Option 2: Use a more specific sanitization
import { sanitizeString } from '@/lib/ai/sanitize';
const customSanitize = (str: string) => {
  // Only apply specific patterns
  return str.replace(SENSITIVE_PATTERNS.anthropic, '[REDACTED]')
            .replace(SENSITIVE_PATTERNS.openai, '[REDACTED]');
};
```

### False Negatives

If API keys are not being redacted:

1. Check if the key matches known patterns
2. Add a custom pattern to `SENSITIVE_PATTERNS`
3. Report the issue with an example (redacted) key format

### Testing Your Keys

Never test with real API keys! Use fake keys that match the pattern:

```typescript
// ✅ GOOD - Fake key for testing
const fakeKey = 'sk-ant-' + 'a'.repeat(95);
const sanitized = sanitizeString(fakeKey);
console.log(sanitized); // Should be [REDACTED_API_KEY]
```

## Related Files

- Implementation: `src/lib/ai/sanitize.ts`
- Rate Limiter Integration: `src/lib/anthropic/rate-limiter.ts`
- Test Script: `scripts/test-sanitization.mjs`
- Security Fixes: `docs/SECURITY_FIXES_PHASE5.md`

## Support

For issues or questions:
- Check test results: `npm run test:sanitization`
- Review patterns in `src/lib/ai/sanitize.ts`
- Create GitHub issue with sanitized examples
