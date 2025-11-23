# PR: Environment and Config Hardening

**Branch**: `abacus/env-hardening`
**Source Map**: `docs/abacus/env-map.json`

---

## Summary

This PR hardens environment variable management by:

1. Creating typed environment configuration
2. Adding runtime validation for required variables
3. Providing feature detection utilities
4. Adding debugging/status tools

## Changes

### New Files

- `src/lib/config/env.ts` - Environment configuration module

### Types Added

- `EnvConfig` - Full typed config interface (25 variables)
- `ValidationError` - Validation error structure
- `ValidationResult` - Validation result with errors/warnings

### Features Added

- **Validation**: Runtime check for 8 required variables
- **Type safety**: Full TypeScript types for all env vars
- **Feature detection**: Check which features are available
- **Debugging**: Print status for troubleshooting

## Usage

### Get validated config

```typescript
import env from '@/lib/config/env';

const config = env();
const supabaseUrl = config.NEXT_PUBLIC_SUPABASE_URL;
```

### Check feature availability

```typescript
import { features } from '@/lib/config/env';

if (features.hasOpenRouter()) {
  // Use OpenRouter
}

if (features.hasEmailProvider()) {
  // Send email
}
```

### Validate environment

```typescript
import { validateEnv } from '@/lib/config/env';

const result = validateEnv();
if (!result.valid) {
  console.error(result.errors);
}
```

### Debug environment

```typescript
import { printEnvStatus } from '@/lib/config/env';

// Prints formatted status of all env vars
printEnvStatus();
```

## Validation Rules

### Required Variables (8)

| Variable | Validation |
|----------|------------|
| NEXT_PUBLIC_SUPABASE_URL | Must be valid URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Must exist |
| SUPABASE_SERVICE_ROLE_KEY | Must exist |
| NEXTAUTH_URL | Must exist |
| NEXTAUTH_SECRET | Warn if < 32 chars |
| GOOGLE_CLIENT_ID | Must exist |
| GOOGLE_CLIENT_SECRET | Must exist |
| ANTHROPIC_API_KEY | Warn if not sk-ant-* |

### Optional Features

| Feature | Variables Required |
|---------|-------------------|
| OpenRouter | OPENROUTER_API_KEY |
| Perplexity | PERPLEXITY_API_KEY |
| Gemini | GEMINI_API_KEY |
| SendGrid | SENDGRID_API_KEY |
| Resend | RESEND_API_KEY |
| Stripe | STRIPE_SECRET_KEY |
| WhatsApp | WHATSAPP_PHONE_NUMBER_ID + WHATSAPP_ACCESS_TOKEN |

## Benefits

1. **Early failure** - Catch missing vars at startup
2. **Type safety** - No more `process.env.VAR!`
3. **Feature flags** - Conditional feature availability
4. **Better debugging** - Status output for troubleshooting
5. **Documentation** - Self-documenting config

## Migration

1. Import `env()` or `features` from `@/lib/config/env`
2. Replace `process.env.VAR!` with `env().VAR`
3. Use `features.hasXxx()` for conditional logic

## Validation Checklist

- [x] No .env files modified
- [x] No secrets exposed
- [x] Documentation included
- [ ] Tests pass (to be verified)

---

**Risk Level**: Low
**Recommendation**: MERGE after test verification
