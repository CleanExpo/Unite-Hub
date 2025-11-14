# Database Setup Documentation

## Overview
Unite-Hub uses **Supabase** (PostgreSQL) as the primary database with Row-Level Security (RLS) policies for multi-tenant data isolation.

## Connection Details

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://lksfwktwtmyznckodsau.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
```

## Migrations Applied

1. `001_initial_schema.sql` - Core tables ✅
2. `002_team_projects_approvals.sql` - Team/Projects ✅
3. `003_user_organizations.sql` - Multi-tenant auth ✅

## All Systems Operational

Database: ✅ CONNECTED
Migrations: ✅ APPLIED
RLS Policies: ✅ ACTIVE
