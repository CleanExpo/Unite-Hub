-- Apply ALL migrations in correct order
-- Run this in Supabase SQL Editor

-- Migration 001: Initial Schema
\i 001_initial_schema.sql

-- Migration 002: Team Projects Approvals
\i 002_team_projects_approvals.sql

-- Migration 003: User Organizations
\i 003_user_organizations.sql

-- Migration 004: Email Integrations
\i 004_email_integrations.sql

-- Migration 005: User Profile Enhancements
\i 005_user_profile_enhancements.sql

-- Migration 006: WhatsApp Integration
\i 006_whatsapp_integration.sql

-- Migration 007: User Onboarding
\i 007_user_onboarding.sql

-- Migration 008: Drip Campaigns (FIXED - removed contact_id from drip_campaigns)
\i 008_drip_campaigns.sql

-- Migration 009: Contacts Enhancements
\i 009_contacts_enhancements.sql

-- Migration 010: Fix Organizations Table
\i 010_fix_organizations_table.sql

-- Migration 011: Generated Images
\i 011_generated_images.sql

-- Migration 012: Subscriptions (FIXED - org_id changed from UUID to TEXT)
\i 012_subscriptions.sql

-- Migration 013: Calendar System
\i 013_calendar_system.sql
