# Supabase Database Setup

This directory contains the database schema and migrations for Unite-Hub.

## Prerequisites

1. A Supabase project (create one at https://supabase.com)
2. Supabase CLI installed: `npm install -g supabase`

## Setup Instructions

### 1. Link Your Supabase Project

```bash
supabase link --project-ref your-project-ref
```

You can find your project ref in your Supabase project settings.

### 2. Apply the Migration

Run the migration to create all tables:

```bash
supabase db push
```

Or manually run the SQL in the Supabase SQL Editor:
- Go to your Supabase Dashboard
- Navigate to SQL Editor
- Copy and paste the contents of `migrations/001_initial_schema.sql`
- Click "Run"

### 3. Verify the Setup

After running the migration, you should have the following tables:
- `organizations` - Stores organization/company data
- `workspaces` - Stores workspace data (multiple per organization)
- `contacts` - Stores contact information with AI scoring
- `emails` - Stores email communications
- `generated_content` - Stores AI-generated content
- `campaigns` - Stores marketing campaign data
- `audit_logs` - Stores system activity logs

## Database Schema

### Organizations
Stores company/organization information including subscription plan and Stripe customer ID.

### Workspaces
Each organization can have multiple workspaces for different teams or projects.

### Contacts
Stores contact information with AI scoring (0-1) and categorization.

### Emails
Stores email communications linked to contacts and workspaces.

### Generated Content
Stores AI-generated content (follow-ups, proposals, case studies).

### Campaigns
Tracks marketing campaigns with metrics (sent, opened, clicked, replied).

### Audit Logs
Comprehensive activity logging including payment events from Stripe webhooks.

## Row Level Security (RLS)

The database has Row Level Security enabled on all tables. The current policies allow:
- Service role has full access (used by API routes)
- Authenticated users can read data (policies can be customized)

### Customizing RLS Policies

To add more specific access control, you can modify the policies. For example, to restrict organizations by user:

```sql
CREATE POLICY "Users can only view their own organization" ON organizations
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM organization_members WHERE org_id = organizations.id
    )
  );
```

## Environment Variables

Make sure your `.env.local` file has the correct Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

You can find these in your Supabase project settings under API.

## Testing the Database

You can test the database connection using the Supabase client:

```typescript
import { supabase } from '@/lib/supabase';

// Test query
const { data, error } = await supabase
  .from('organizations')
  .select('*')
  .limit(10);

console.log(data, error);
```

## Troubleshooting

### Migration Fails
- Ensure you're logged in: `supabase login`
- Verify your project is linked: `supabase projects list`
- Check for syntax errors in the SQL

### Permission Errors
- Make sure you're using the service role key for server-side operations
- Check RLS policies if client-side queries fail

### Connection Issues
- Verify environment variables are set correctly
- Ensure your Supabase project is active
- Check if your IP is allowed in project settings
