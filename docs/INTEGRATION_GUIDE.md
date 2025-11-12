# Unite-Hub Integration Guide

This guide provides a complete overview of the Supabase and Stripe integration in Unite-Hub.

## Table of Contents

1. [Overview](#overview)
2. [Supabase Setup](#supabase-setup)
3. [Stripe Setup](#stripe-setup)
4. [Authentication](#authentication)
5. [Database Schema](#database-schema)
6. [API Routes](#api-routes)
7. [Testing](#testing)

## Overview

Unite-Hub uses the following technology stack:
- **Next.js 16.0.1** - React framework with App Router
- **Supabase** - PostgreSQL database and authentication backend
- **Stripe** - Payment processing and subscription management
- **NextAuth.js** - Authentication with Supabase adapter
- **TypeScript** - Type-safe development

## Supabase Setup

### 1. Create a Supabase Project

1. Go to https://supabase.com and create a new project
2. Copy your project credentials from Settings > API

### 2. Configure Environment Variables

Add the following to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Apply Database Schema

Run the migration to create all necessary tables:

```bash
# Navigate to Supabase dashboard > SQL Editor
# Copy and paste the contents of supabase/migrations/001_initial_schema.sql
# Click "Run"
```

Or use the Supabase CLI:

```bash
supabase link --project-ref your-project-ref
supabase db push
```

### 4. Verify Setup

Check that all tables were created:
- organizations
- workspaces
- contacts
- emails
- generated_content
- campaigns
- audit_logs

## Stripe Setup

### 1. Create Stripe Account

1. Go to https://stripe.com and create an account
2. Switch to test mode for development

### 2. Create Products and Prices

Create the following products in your Stripe dashboard:

**Starter Plan**
- Name: Starter
- Price: $99/month
- Add metadata: `plan: starter`
- Copy the Price ID

**Professional Plan**
- Name: Professional
- Price: $299/month
- Add metadata: `plan: professional`
- Copy the Price ID

### 3. Configure Environment Variables

Add to your `.env.local`:

```env
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_public_key
STRIPE_PRICE_ID_STARTER=price_1234567890
STRIPE_PRICE_ID_PROFESSIONAL=price_0987654321
NEXT_PUBLIC_URL=http://localhost:3001
```

### 4. Set Up Webhook

1. In Stripe Dashboard, go to Developers > Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events:
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
4. Copy the webhook signing secret
5. Add to `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

For local development, use Stripe CLI:

```bash
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

## Authentication

### NextAuth Configuration

Unite-Hub uses NextAuth with Supabase adapter for database-backed sessions.

**File:** `src/lib/auth.ts`

**Providers:**
- Google OAuth
- Email (Magic Links)

**Setup Required:**

1. **Google OAuth:**
   ```env
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

   Get credentials from: https://console.cloud.google.com

2. **Email Provider:**
   ```env
   EMAIL_SERVER_HOST=smtp.gmail.com
   EMAIL_SERVER_PORT=587
   EMAIL_SERVER_USER=your-email@gmail.com
   EMAIL_SERVER_PASSWORD=your-app-password
   EMAIL_FROM=noreply@unite-hub.io
   ```

3. **NextAuth Secret:**
   ```env
   NEXTAUTH_URL=http://localhost:3001
   NEXTAUTH_SECRET=your-secret-here
   ```

   Generate with: `openssl rand -base64 32`

### Supabase Auth Tables

NextAuth with Supabase adapter automatically creates:
- `users` - User accounts
- `accounts` - OAuth accounts
- `sessions` - User sessions
- `verification_tokens` - Email magic links

## Database Schema

### Organizations

Stores organization/company data with subscription information.

```typescript
interface Organization {
  id: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  team_size?: string;
  industry?: string;
  plan: "starter" | "professional" | "enterprise";
  status: "active" | "trial" | "cancelled";
  trial_ends_at?: string;
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
}
```

### Workspaces

Each organization can have multiple workspaces.

```typescript
interface Workspace {
  id: string;
  org_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}
```

### Contacts

Contact information with AI scoring.

```typescript
interface Contact {
  id: string;
  workspace_id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  job_title?: string;
  ai_score: number; // 0-1
  status: "prospect" | "lead" | "customer" | "contact";
  last_interaction?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}
```

See `src/lib/supabase.ts` for all interfaces.

## API Routes

### Organization Management

**POST** `/api/organizations/create`

Creates a new organization with default workspace.

```typescript
Request:
{
  name: string;
  email: string;
  phone?: string;
  website?: string;
  teamSize?: string;
  industry?: string;
}

Response:
{
  org: Organization;
  workspace: Workspace;
}
```

### Stripe Checkout

**POST** `/api/stripe/checkout`

Creates a Stripe checkout session.

```typescript
Request:
{
  plan: "starter" | "professional";
  email: string;
  orgId: string;
}

Response:
{
  sessionId: string;
}
```

### Stripe Webhook

**POST** `/api/webhooks/stripe`

Handles Stripe events:
- `customer.subscription.updated` - Updates organization plan
- `customer.subscription.deleted` - Marks organization as cancelled
- `invoice.paid` - Logs successful payment

## Database Operations

### Using the DB Helper

```typescript
import { db } from '@/lib/db';

// Create organization
const org = await db.organizations.create({
  name: "Acme Corp",
  email: "admin@acme.com",
  plan: "starter",
  status: "trial",
});

// Get organization by ID
const org = await db.organizations.getById(orgId);

// Update organization
await db.organizations.update(orgId, {
  plan: "professional",
  status: "active",
});

// Get organization by Stripe customer ID
const org = await db.organizations.getByStripeCustomerId(customerId);

// Create workspace
const workspace = await db.workspaces.create({
  org_id: orgId,
  name: "Main Workspace",
});

// Create contact
const contact = await db.contacts.create({
  workspace_id: workspaceId,
  name: "John Doe",
  email: "john@example.com",
  ai_score: 0.85,
  status: "lead",
});

// Log audit event
await db.auditLogs.create({
  org_id: orgId,
  action: "subscription.created",
  resource: "organization",
  resource_id: orgId,
  agent: "system",
  status: "success",
  details: { plan: "professional" },
});
```

## Testing

### Local Development

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Test authentication:
   - Navigate to `/auth/signin`
   - Try Google OAuth or email login

3. Test organization creation:
   ```bash
   curl -X POST http://localhost:3001/api/organizations/create \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test Org",
       "email": "test@example.com"
     }'
   ```

4. Test Stripe checkout:
   ```bash
   curl -X POST http://localhost:3001/api/stripe/checkout \
     -H "Content-Type: application/json" \
     -d '{
       "plan": "starter",
       "email": "test@example.com",
       "orgId": "your-org-id"
     }'
   ```

### Testing Webhooks

1. Install Stripe CLI:
   ```bash
   stripe login
   ```

2. Forward webhooks to local server:
   ```bash
   stripe listen --forward-to localhost:3001/api/webhooks/stripe
   ```

3. Trigger test events:
   ```bash
   stripe trigger customer.subscription.updated
   stripe trigger invoice.paid
   ```

## Security Considerations

1. **Environment Variables:** Never commit `.env.local` to version control
2. **Service Role Key:** Only use on server-side (API routes)
3. **Anon Key:** Safe to use in client-side code with RLS enabled
4. **Webhook Signature:** Always verify Stripe webhook signatures
5. **Row Level Security:** Customize RLS policies for your access control needs

## Troubleshooting

### Database Connection Issues
- Verify Supabase credentials in `.env.local`
- Check if project is paused (free tier)
- Ensure RLS policies allow access

### Stripe Webhook Failures
- Verify webhook secret matches
- Check webhook signature verification
- Ensure endpoint is publicly accessible

### Authentication Issues
- Verify NextAuth configuration
- Check provider credentials
- Ensure callback URLs are correct

## Integrations

### Gmail Integration (Optional)

Sync emails and send messages through Gmail.

**Setup:**

1. Create a Google Cloud Project at https://console.cloud.google.com
2. Enable Gmail API
3. Configure OAuth consent screen
4. Create OAuth 2.0 credentials
5. Add to `.env.local`:
   ```env
   GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GMAIL_CLIENT_SECRET=your-client-secret
   GMAIL_REDIRECT_URI=http://localhost:3000/api/integrations/gmail/callback
   ```

See `docs/GMAIL_INTEGRATION.md` for detailed setup instructions.

## AI Features

### Contact Intelligence (Optional)

Unite-Hub includes an AI-powered contact intelligence system using Claude Opus.

**Setup:**

1. Get an Anthropic API key from https://console.anthropic.com
2. Add to `.env.local`:
   ```env
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   ```

**Usage:**

```typescript
// Analyze a single contact
POST /api/contacts/analyze
{
  "contactId": "uuid-here"
}

// Batch analyze contacts in a workspace
PUT /api/contacts/analyze
{
  "workspaceId": "uuid-here",
  "limit": 10
}
```

The system analyzes:
- Engagement score (0-100)
- Buying intent (high/medium/low)
- Decision stage (awareness/consideration/decision)
- Role type (decision_maker/influencer/end_user)
- Risk and opportunity signals
- Next best action recommendations

## Next Steps

1. Customize Row Level Security policies
2. Set up production Stripe account
3. Configure production domain
4. Add custom email templates for NextAuth
5. Implement user-organization relationship management
6. Add organization member invites
7. Build dashboard UI for managing organizations and workspaces
8. Configure Anthropic API key for contact intelligence features

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
