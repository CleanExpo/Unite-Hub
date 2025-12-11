# Environment & Configuration

## Environment Variables

**Required**:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` — Admin operations (server-only)
- `ANTHROPIC_API_KEY` — Claude AI
- `NEXTAUTH_URL` — Auth callback URL (http://localhost:3008)
- `NEXTAUTH_SECRET` — Session encryption key

**Optional**:
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — Gmail OAuth
- `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` — Outlook OAuth
- `OPENROUTER_API_KEY` — Multi-model routing
- `PERPLEXITY_API_KEY` — SEO research
- `SENDGRID_API_KEY` or `RESEND_API_KEY` — Email sending

**Validate**: `npm run validate:env`

## Development Commands

**Development**:
```bash
npm run dev              # Start dev server (port 3008)
npm run build            # Production build
npm run typecheck        # TypeScript validation
npm run lint             # ESLint
```

**Agents & Automation**:
```bash
npm run email-agent      # Process emails with AI
npm run content-agent    # Generate personalized content
npm run orchestrator     # Multi-agent workflows
npm run integrity:check  # Founder OS health check
```

**Database**:
```bash
npm run check:db         # Verify schema
# Apply migrations: Supabase Dashboard → SQL Editor
```

**Docker** (optional):
```bash
npm run docker:start     # Start containers
npm run docker:health    # Health check
npm run docker:logs      # View logs
```

**Quality**:
```bash
npm run quality:assess   # Assess code quality
npm run audit:navigation # Check for broken links
npm run audit:placeholders # Find TODO comments
```

## Key File Locations

**Architecture**:
- `src/lib/supabase/server.ts` — Server client (PKCE cookies)
- `src/lib/supabase/client.ts` — Browser client (singleton)
- `src/lib/api-helpers.ts` — Pagination, filtering, responses
- `src/lib/anthropic/rate-limiter.ts` — AI retry logic
- `src/middleware.ts` — Auth middleware
