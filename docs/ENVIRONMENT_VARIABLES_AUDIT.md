# Environment Variables Comprehensive Audit
## Security & Configuration Assessment

**Date**: 2026-01-28
**Auditor**: Senior DevOps Engineer (AI-Assisted)
**Scope**: Complete environment variable inventory and security analysis
**Total Variables Found**: 418 unique variables

---

## Executive Summary

### Findings Overview
- **Total Variables in Codebase**: 418
- **Documented in .env.example**: ~60 variables
- **Coverage Gap**: 358 undocumented variables (85.6%)
- **Security Risk**: MEDIUM (no hardcoded secrets found, but extensive undocumented config)
- **Complexity**: HIGH (many feature flags and third-party integrations)

### Critical Actions Required
1. ✅ **IMMEDIATE**: Audit complete - no hardcoded secrets found
2. ⚠️ **HIGH**: Document missing 358 variables
3. ⚠️ **MEDIUM**: Implement environment variable validation on startup
4. ⚠️ **LOW**: Remove unused/deprecated variables

---

## Security Assessment

### ✅ Security Strengths
1. **No Hardcoded Secrets**: All sensitive values use `process.env.*`
2. **Proper .env.example**: Template exists with placeholders
3. **Service Role Key Protected**: Supabase service key properly isolated
4. **OAuth Credentials**: Google OAuth uses environment variables

### ⚠️ Security Concerns
1. **Extensive Undocumented Variables**: 358 variables not in .env.example
2. **No Runtime Validation**: Missing startup validation for required variables
3. **No Secret Rotation Policy**: Need documented rotation schedule
4. **AWS Credentials Found**: Multiple AWS variable references (needs audit)

### 🔒 Sensitive Variable Categories
**API Keys & Tokens** (HIGH RISK):
- `ANTHROPIC_API_KEY` ✅ Documented
- `OPENAI_API_KEY` ✅ Documented
- `GOOGLE_AI_API_KEY` ✅ Documented
- `OPENROUTER_API_KEY` ✅ Documented
- `STRIPE_SECRET_KEY` ✅ Documented
- `SENDGRID_API_KEY` ❌ Missing
- `RESEND_API_KEY` ✅ Documented
- `DATAFORSEO_API_KEY` ✅ Documented
- `SEMRUSH_API_KEY` ✅ Documented
- `WHATSAPP_ACCESS_TOKEN` ✅ Documented
- `AWS_ACCESS_KEY_ID` ❌ Missing (found in code)
- `AWS_SECRET_ACCESS_KEY` ❌ Missing (found in code)
- `AZURE_STORAGE_ACCOUNT_KEY` ❌ Missing (found in code)
- `DIGITALOCEAN_API_TOKEN` ✅ Documented
- `SENTRY_AUTH_TOKEN` ❌ Missing

**Database Credentials** (CRITICAL RISK):
- `NEXT_PUBLIC_SUPABASE_URL` ✅ Documented
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅ Documented
- `SUPABASE_SERVICE_ROLE_KEY` ✅ Documented
- `DATABASE_URL` ❌ Missing (found in code)
- `DATABASE_POOLER_URL` ❌ Missing (found in code)

**OAuth & Authentication** (HIGH RISK):
- `GOOGLE_CLIENT_ID` ✅ Documented
- `GOOGLE_CLIENT_SECRET` ✅ Documented
- `NEXTAUTH_SECRET` ✅ Documented
- `GITHUB_CLIENT_ID` ❌ Missing (found in code)
- `GITHUB_CLIENT_SECRET` ❌ Missing (found in code)
- `FACEBOOK_CLIENT_ID` ❌ Missing (found in code)
- `FACEBOOK_CLIENT_SECRET` ❌ Missing (found in code)

---

## Complete Variable Inventory by Category

### 1. Core Application (REQUIRED)

#### Authentication & Authorization
```bash
# ✅ Documented
NEXTAUTH_URL=http://localhost:3008
NEXTAUTH_SECRET=your-secret-key-here

# ❌ Missing from .env.example
NODE_ENV=development|production
NEXT_PUBLIC_ENVIRONMENT=development|production
```

#### Database Configuration
```bash
# ✅ Documented
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_POOLER_URL=
ENABLE_DB_POOLER=false
DB_POOLER_MODE=transaction
DB_POOL_SIZE=20
DB_IDLE_TIMEOUT=600
DB_MAX_LIFETIME=3600

# ❌ Missing from .env.example
DATABASE_URL=postgresql://...
DATABASE_POOLER_URL=postgresql://...
DATABASE_SESSION_URL=postgresql://...
```

---

### 2. AI & Machine Learning (REQUIRED FOR CORE FEATURES)

#### Primary AI Providers
```bash
# ✅ Documented
ANTHROPIC_API_KEY=sk-ant-your-key-here
OPENAI_API_KEY=sk-proj-your-key-here
GOOGLE_AI_API_KEY=your-gemini-api-key-here
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_API_KEY_2=sk-or-v1-your-backup-key-here

# Budget Controls
AI_DAILY_BUDGET=50.00
AI_MONTHLY_BUDGET=1500.00
AI_ALERT_THRESHOLD=80
AI_ENFORCE_BUDGET=true
GEMINI_DAILY_BUDGET=20.00
GEMINI_ALERT_THRESHOLD=16
GEMINI_ENABLE_THINKING=true
```

#### AI Phill (Founder Intelligence Agent)
```bash
# ❌ ALL Missing from .env.example
AI_PHILL_ENABLED=true
AI_PHILL_MODEL=claude-opus-4-5-20251101
AI_PHILL_THINKING_BUDGET_TOKENS=10000
AI_PHILL_GOVERNANCE_MODE=strict|balanced|permissive
AI_PHILL_PERSONA_NAME=Phil
AI_PHILL_PERSONA_ROLE=Strategic Advisor
AI_PHILL_PERSONA_EXPERTISE=Business Strategy, Growth, Operations
AI_PHILL_PERSONA_COMMUNICATION_STYLE=Socratic, Direct, Supportive
AI_PHILL_PERSONA_RISK_TOLERANCE=conservative|moderate|aggressive

# Feature Flags
AI_PHILL_REAL_TIME_ANALYSIS_ENABLED=true
AI_PHILL_PREDICTIVE_INSIGHTS_ENABLED=true
AI_PHILL_ANOMALY_DETECTION_ENABLED=true
AI_PHILL_RECOMMENDATION_CONFIDENCE_THRESHOLD=0.7
AI_PHILL_MAX_INSIGHTS_PER_DAY=50
AI_PHILL_MAX_CONCURRENT_ANALYSIS=5
AI_PHILL_MAX_UMBRELLA_SYNOPSIS_FREQUENCY_HOURS=24
AI_PHILL_INSIGHT_CACHE_HOURS=24
AI_PHILL_ALLOWED_INTENTS=strategy,operations,growth,risk,governance
```

---

### 3. Email & Communication (REQUIRED)

#### Email Service Providers
```bash
# ✅ Documented
RESEND_API_KEY=re_your_api_key_here
CONTACT_EMAIL=hello@unite-hub.com

# ❌ Missing from .env.example
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=noreply@unite-hub.com
SENDGRID_FROM_NAME=Unite-Hub
GMAIL_APP_PASSWORD=your-gmail-app-password
GMAIL_FROM_EMAIL=your-email@gmail.com
EMAIL_PROVIDER=sendgrid|resend|gmail
EMAIL_FALLBACK_ENABLED=true
```

#### Gmail OAuth & Integration
```bash
# ✅ Documented
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3008/api/integrations/gmail/callback
NEXT_PUBLIC_APP_URL=http://localhost:3008

# ❌ Missing from .env.example
GMAIL_WATCH_ENABLED=true
GMAIL_SYNC_INTERVAL_MINUTES=5
GMAIL_MAX_RESULTS=500
GMAIL_HISTORY_RETENTION_DAYS=30
```

#### WhatsApp Business
```bash
# ✅ Documented
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_ACCESS_TOKEN=your-access-token

# ❌ Missing from .env.example
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-verify-token
WHATSAPP_BUSINESS_ACCOUNT_ID=your-business-account-id
```

---

### 4. Payments & Billing (REQUIRED FOR MONETIZATION)

```bash
# ✅ Documented
STRIPE_SECRET_KEY=sk_test_your-key-here
STRIPE_PRICE_ID_STARTER=price_your_starter_price_id
STRIPE_PRICE_ID_PROFESSIONAL=price_your_professional_price_id
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# ❌ Missing from .env.example
STRIPE_PUBLISHABLE_KEY=pk_test_your-key-here
STRIPE_PRICE_ID_ENTERPRISE=price_your_enterprise_price_id
STRIPE_TAX_RATE_ID=txr_your_tax_rate_id
STRIPE_WEBHOOK_TOLERANCE=300
PADDLE_VENDOR_ID=your-paddle-vendor-id
PADDLE_API_KEY=your-paddle-api-key
PADDLE_WEBHOOK_SECRET=your-paddle-webhook-secret
```

---

### 5. SEO & Marketing Intelligence (OPTIONAL)

#### DataForSEO & Semrush
```bash
# ✅ Documented
DATAFORSEO_API_KEY=your-login:your-password
SEMRUSH_API_KEY=your-semrush-api-key-here
ENFORCE_NO_BLUFF_POLICY=true

# ❌ Missing from .env.example
DATAFORSEO_API_LOGIN=your-login-email
DATAFORSEO_API_PASSWORD=your-api-password
DATAFORSEO_CACHE_HOURS=24
SEMRUSH_RATE_LIMIT_PER_MINUTE=10
PERPLEXITY_API_KEY=your-perplexity-api-key
SEO_INTELLIGENCE_ENABLED=true
```

#### Boost & Bump (Local SEO)
```bash
# ❌ ALL Missing from .env.example
BOOST_BUMP_ENABLED=true
BOOST_BUMP_GOVERNANCE_MODE=strict|balanced|permissive
BOOST_BUMP_SAFE_MODE=true
BOOST_BUMP_MAX_DAILY_BOOSTS=10
BOOST_BUMP_MAX_ACTIVE_BOOSTS=50
BOOST_BUMP_DEFAULT_BOOST_DURATION_DAYS=30
BOOST_BUMP_DEFAULT_GEO_TARGET=local
BOOST_BUMP_MIN_IMPACT_THRESHOLD=0.05
BOOST_BUMP_CACHE_HOURS=6

# Feature Flags
BOOST_BUMP_LOCAL_PACK_OPTIMIZATION_ENABLED=true
BOOST_BUMP_GBP_OPTIMIZATION_ENABLED=true
BOOST_BUMP_CTR_SIMULATION_ENABLED=true
BOOST_BUMP_COMPETITOR_TRACKING_ENABLED=true
BOOST_BUMP_REVIEW_SENTIMENT_ENABLED=true
BOOST_BUMP_VIDEO_RETENTION_ENABLED=true
BOOST_BUMP_MAPS_PERSONA_ENABLED=true
```

---

### 6. Social Media & Multi-Channel (OPTIONAL)

```bash
# ❌ ALL Missing from .env.example

# YouTube
YOUTUBE_CLIENT_ID=your-youtube-client-id
YOUTUBE_CLIENT_SECRET=your-youtube-client-secret
YOUTUBE_API_KEY=your-youtube-api-key
YOUTUBE_CHANNEL_ID=your-channel-id

# Instagram
INSTAGRAM_CLIENT_ID=your-instagram-client-id
INSTAGRAM_CLIENT_SECRET=your-instagram-client-secret
INSTAGRAM_ACCESS_TOKEN=your-access-token

# TikTok
TIKTOK_CLIENT_KEY=your-tiktok-client-key
TIKTOK_CLIENT_SECRET=your-tiktok-client-secret

# LinkedIn
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# Twitter/X
TWITTER_API_KEY=your-twitter-api-key
TWITTER_API_SECRET=your-twitter-api-secret
TWITTER_ACCESS_TOKEN=your-access-token
TWITTER_ACCESS_SECRET=your-access-secret

# Facebook
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret
FACEBOOK_PAGE_ID=your-page-id
FACEBOOK_ACCESS_TOKEN=your-access-token

# Reddit
REDDIT_CLIENT_ID=your-reddit-client-id
REDDIT_CLIENT_SECRET=your-reddit-client-secret
REDDIT_USERNAME=your-username
REDDIT_PASSWORD=your-password

# Pinterest
PINTEREST_APP_ID=your-pinterest-app-id
PINTEREST_APP_SECRET=your-pinterest-app-secret
```

---

### 7. Cloud Infrastructure (OPTIONAL)

#### AWS Services
```bash
# ❌ ALL Missing from .env.example
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
AWS_SNS_ACCESS_KEY_ID=your-sns-access-key
AWS_SNS_SECRET_ACCESS_KEY=your-sns-secret-key
AWS_SNS_REGION=us-east-1
```

#### Azure Services
```bash
# ❌ ALL Missing from .env.example
AZURE_STORAGE_ACCOUNT_NAME=your-account-name
AZURE_STORAGE_ACCOUNT_KEY=your-account-key
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;...
```

#### DigitalOcean
```bash
# ✅ Documented
DIGITALOCEAN_API_TOKEN=your-digitalocean-api-token-here
DIGITALOCEAN_APP_NAME=synthex-social
DIGITALOCEAN_REGION=nyc
```

---

### 8. Monitoring & Observability (OPTIONAL)

#### Sentry Error Tracking
```bash
# ✅ Partially Documented (commented out)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/your-project-id
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/your-project-id

# ❌ Missing from .env.example
SENTRY_AUTH_TOKEN=your-sentry-auth-token-here
SENTRY_ORG=unite-hub
SENTRY_PROJECT=unite-hub-web
SENTRY_RELEASE=production-v1.0.0
```

#### Redis Caching
```bash
# ✅ Documented
REDIS_URL=redis://localhost:6379
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io

# ❌ Missing from .env.example
UPSTASH_REDIS_REST_TOKEN=your-rest-token
REDIS_PASSWORD=your-redis-password
REDIS_TLS_ENABLED=true
REDIS_KEY_PREFIX=unite-hub:
```

#### APM & Datadog
```bash
# ✅ Documented
ENABLE_APM=false
APM_PROVIDER=none
APM_SERVICE_NAME=unite-hub
APM_SAMPLE_RATE=1.0
APM_FLUSH_INTERVAL=10000
DD_API_KEY=
DD_SITE=datadoghq.com
DD_SERVICE=unite-hub
DD_ENV=production
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_SERVICE_NAME=unite-hub

# ❌ Missing from .env.example
DD_VERSION=1.0.0
DD_TRACE_ENABLED=true
DD_PROFILING_ENABLED=false
DD_RUNTIME_METRICS_ENABLED=true
```

#### Logging
```bash
# ✅ Documented
LOG_LEVEL=info
LOG_TO_FILE=true
LOG_DIR=logs
ENABLE_DB_LOGGING=false

# ❌ Missing from .env.example
LOG_MAX_FILE_SIZE=20m
LOG_MAX_FILES=14
LOG_ROTATION=daily
LOG_COMPRESS=true
STRUCTURED_LOGGING_ENABLED=true
```

---

### 9. Australian Tax Office (ATO) Integration (OPTIONAL)

```bash
# ✅ ALL Documented
ATO_CLIENT_ID=your-ato-client-id
ATO_CLIENT_SECRET=your-ato-client-secret
ATO_AUTH_URL=https://auth.ato.gov.au/oauth2/authorize
ATO_TOKEN_URL=https://auth.ato.gov.au/oauth2/token
ATO_API_URL=https://sandbox.api.ato.gov.au/v1
ATO_SCOPE=https://ato.gov.au/api/v1
ATO_SANDBOX_MODE=true
ABR_GUID=your-abr-api-guid

# ❌ Missing additional ATO variables
ATO_REFRESH_TOKEN_ENABLED=true
ATO_TOKEN_EXPIRY_BUFFER_MINUTES=10
```

---

### 10. Feature Flags & Configuration (DEVELOPMENT)

#### General Feature Flags
```bash
# ❌ ALL Missing from .env.example
ENABLE_TELEMETRY=false
AUDIT_LOGGING_ENABLED=true
BROWSER_AUTOMATION_ENABLED=false
AB_TESTING_ENABLED=false
AUTO_SYNC_ENABLED=true
AUTO_OPTIMIZATION_ENABLED=false
ACCESSIBILITY_SCANNING_ENABLED=false
BOT_DETECTION_AVOIDANCE_ENABLED=false
CONFLICT_RESOLUTION_ENABLED=true
CONNECTED_APPS_ENABLED=true
```

#### Cache Configuration
```bash
# ❌ ALL Missing from .env.example
APPS_CACHE_HOURS=24
AUTOMATION_CACHE_HOURS=12
ADS_CACHE_HOURS=6
BOOST_BUMP_CACHE_HOURS=6
SOCIAL_INBOX_CACHE_HOURS=1
```

#### Rate Limiting & Delays
```bash
# ❌ ALL Missing from .env.example
ACTION_DELAY_MS=1000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Variable Classification

### By Requirement Level

#### ✅ CRITICAL (System Won't Start)
1. `NEXT_PUBLIC_SUPABASE_URL`
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `SUPABASE_SERVICE_ROLE_KEY`
4. `NEXTAUTH_URL`
5. `NEXTAUTH_SECRET`
6. `ANTHROPIC_API_KEY`

#### ⚠️ HIGH PRIORITY (Core Features Break)
1. `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Gmail integration
2. `OPENROUTER_API_KEY` - AI routing
3. `STRIPE_SECRET_KEY` - Payments
4. `EMAIL_PROVIDER` API keys - Email sending

#### 📋 MEDIUM PRIORITY (Advanced Features)
1. SEO intelligence keys
2. Social media integrations
3. Monitoring services
4. Cloud storage

#### 🔧 LOW PRIORITY (Optional Enhancements)
1. Feature flags
2. Cache tuning
3. Performance monitoring
4. Development tools

---

## Missing from .env.example (HIGH PRIORITY)

### Immediate Additions Needed

```bash
# ====================================
# Email Service (CRITICAL - Missing)
# ====================================
# SendGrid (Primary email provider)
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=noreply@unite-hub.com
SENDGRID_FROM_NAME=Unite-Hub

# Gmail SMTP (Fallback)
GMAIL_APP_PASSWORD=your-gmail-app-password
GMAIL_FROM_EMAIL=your-email@gmail.com

# Email Configuration
EMAIL_PROVIDER=sendgrid  # sendgrid|resend|gmail
EMAIL_FALLBACK_ENABLED=true

# ====================================
# Sentry (CRITICAL - Incomplete)
# ====================================
SENTRY_DSN=https://your-sentry-dsn@sentry.io/your-project-id
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/your-project-id
SENTRY_AUTH_TOKEN=your-sentry-auth-token-here
SENTRY_ORG=unite-hub
SENTRY_PROJECT=unite-hub-web

# ====================================
# Redis (HIGH PRIORITY - Incomplete)
# ====================================
UPSTASH_REDIS_REST_TOKEN=your-rest-token
REDIS_PASSWORD=your-redis-password
REDIS_KEY_PREFIX=unite-hub:

# ====================================
# Core Environment (MISSING)
# ====================================
NODE_ENV=production
NEXT_PUBLIC_ENVIRONMENT=production

# ====================================
# Database (ALTERNATIVE FORMATS)
# ====================================
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
DATABASE_POOLER_URL=postgresql://postgres:[password]@[host]:6543/postgres?pgbouncer=true
```

---

## Security Recommendations

### 1. Immediate Actions (This Week)

#### A. Create Environment Validation Function
```typescript
// src/lib/env/validator.ts
export function validateRequiredEnv() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'ANTHROPIC_API_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}

// Call in next.config.mjs or src/app/layout.tsx
```

#### B. Update .env.example
- Add 50+ missing critical variables
- Add comments explaining each variable
- Include default values where appropriate
- Add "REQUIRED" vs "OPTIONAL" markers

#### C. Create Secret Rotation Policy
Document in `docs/SECURITY_SECRET_ROTATION.md`:
- **Critical secrets**: Rotate every 90 days
- **API keys**: Rotate every 180 days
- **OAuth credentials**: Rotate annually
- **Database passwords**: Rotate every 90 days

### 2. Short-term Actions (This Month)

#### A. Implement Environment Variable Groups
```typescript
// src/lib/env/groups.ts
export const ENV_GROUPS = {
  critical: ['SUPABASE_SERVICE_ROLE_KEY', ...],
  required: ['ANTHROPIC_API_KEY', ...],
  optional: ['DATAFORSEO_API_KEY', ...],
  deprecated: ['OLD_API_KEY', ...],
};
```

#### B. Add Runtime Checks
- Validate variable format (URLs, keys, etc.)
- Check for common mistakes (localhost in production)
- Warn about missing optional variables

#### C. Audit Third-Party Integrations
- Review each integration for actual usage
- Remove unused integrations
- Document integration dependencies

### 3. Long-term Actions (This Quarter)

#### A. Secrets Management Service
- Migrate to Vault, AWS Secrets Manager, or similar
- Implement automatic rotation
- Add audit logging for secret access

#### B. Environment-Specific Configs
- Separate development, staging, production
- Use deployment-time variable injection
- Implement config validation in CI/CD

---

## Unused/Deprecated Variables (TO REMOVE)

Variables found in code but likely unused:

```bash
# Social Media (Extensive list suggests over-planning)
BLOGGER_REFRESH_TOKEN=?
BRAVE_CREATOR_CLIENT_ID=?
BRAVE_CREATOR_CLIENT_SECRET=?

# Abacus Integration (Unknown purpose)
ABACUS_API_KEY=?

# Multiple similar cache hours (consolidate)
APPS_CACHE_HOURS
AUTOMATION_CACHE_HOURS
ADS_CACHE_HOURS
# Recommendation: Use CACHE_DEFAULT_HOURS=24
```

**Action**: Grep for actual usage and remove if dead code.

---

## Production Deployment Checklist

### Before First Deploy

- [ ] All CRITICAL variables set and tested
- [ ] .env.production created (not in git)
- [ ] Secrets stored in secure vault
- [ ] Environment validation runs on startup
- [ ] Sentry DSN configured
- [ ] Redis connection tested
- [ ] Email service tested
- [ ] Stripe webhook verified
- [ ] Database pooling enabled
- [ ] Node_ENV=production set

### Production-Specific Values

```bash
NODE_ENV=production
NEXT_PUBLIC_ENVIRONMENT=production
NEXTAUTH_URL=https://yourdomain.com
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/integrations/gmail/callback
NEXT_PUBLIC_APP_URL=https://yourdomain.com
ATO_SANDBOX_MODE=false
ATO_API_URL=https://api.ato.gov.au/v1
DB_POOL_SIZE=20
ENABLE_DB_POOLER=true
LOG_LEVEL=info
APM_SAMPLE_RATE=0.1
ENABLE_APM=true
```

---

## Quick Reference: Most Important Variables

### Top 10 - Must Have for MVP

1. `NEXT_PUBLIC_SUPABASE_URL` - Database connection
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Database auth
3. `SUPABASE_SERVICE_ROLE_KEY` - Database admin
4. `NEXTAUTH_SECRET` - Session security
5. `ANTHROPIC_API_KEY` - AI features
6. `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` - Gmail
7. `SENDGRID_API_KEY` or `RESEND_API_KEY` - Email sending
8. `STRIPE_SECRET_KEY` - Payments
9. `SENTRY_DSN` - Error tracking
10. `REDIS_URL` or `UPSTASH_REDIS_REST_URL` - Caching

### Top 10 - Nice to Have

1. `OPENROUTER_API_KEY` - Cost-effective AI
2. `DATAFORSEO_API_KEY` - SEO intelligence
3. `DIGITALOCEAN_API_TOKEN` - Deployment
4. `WHATSAPP_ACCESS_TOKEN` - WhatsApp channel
5. `DD_API_KEY` - APM monitoring
6. `YOUTUBE_API_KEY` - Social integration
7. `SEMRUSH_API_KEY` - SEO analysis
8. `PERPLEXITY_API_KEY` - Research
9. `ATO_CLIENT_ID` + `ATO_CLIENT_SECRET` - Tax integration
10. `AWS_ACCESS_KEY_ID` - Cloud storage

---

## Next Steps

### Immediate (Today)
1. ✅ Audit complete
2. ⏳ Create updated .env.example with missing variables
3. ⏳ Implement environment validator function
4. ⏳ Document secret rotation policy

### This Week
1. Add runtime validation for all critical variables
2. Create production deployment checklist
3. Test all integrations with real credentials
4. Remove unused variables from codebase

### This Month
1. Migrate to secrets management service
2. Implement automatic rotation
3. Add environment-specific configs
4. Complete security hardening

---

## Appendix: Complete Variable List

See: `/tmp/all_env_vars.txt` for complete list of 418 variables

**Note**: This file contains the raw grep output and should be processed
further for production documentation.

---

**Document Version**: 1.0
**Status**: DRAFT - Requires review
**Owner**: DevOps Team
**Next Review**: 2026-02-04

**Sprint 1, Day 2 Deliverable**: Environment Variable Audit Complete ✅
