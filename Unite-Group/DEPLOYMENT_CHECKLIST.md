# Unite Group Deployment Checklist

This document provides a comprehensive deployment checklist to ensure that all components of the Unite Group website are properly configured and tested before going live.

## Pre-Deployment Preparation

- [ ] Run pre-deployment check script: `pwsh pre-deployment-check.ps1`
- [ ] Review any warnings or errors from the pre-deployment check
- [ ] Update all placeholder content with real business content
- [ ] Test all forms and functionality in a staging environment
- [ ] Create `.env.local` file with all required environment variables
- [ ] Run build process to verify compilation: `npm run build`

## Environment Variables

Ensure the following environment variables are configured in your deployment platform:

### Supabase Configuration
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### Email Configuration
- [ ] `SMTP_HOST` - SMTP server hostname
- [ ] `SMTP_PORT` - SMTP server port (usually 587 or 465)
- [ ] `SMTP_USER` - SMTP username/email
- [ ] `SMTP_PASSWORD` - SMTP password
- [ ] `DEFAULT_FROM` - Default sender email address
- [ ] `ADMIN_EMAIL` - Administrator email for notifications

### General Configuration
- [ ] `NEXT_PUBLIC_SITE_URL` - Production site URL
- [ ] `NEXT_PUBLIC_APP_VERSION` - Current application version

## Database Setup

- [ ] Execute database scripts in Supabase SQL Editor:
  - [ ] Run `database/consultations.sql` for consultation schema
  - [ ] Run `database/projects.sql` for project management schema
  - [ ] Create a `health_check` table for monitoring endpoint

- [ ] Configure Row Level Security (RLS) policies:
  - [ ] Verify RLS policies for consultations
  - [ ] Verify RLS policies for projects
  - [ ] Verify RLS policies for contact submissions

## Authentication Configuration

- [ ] Configure Supabase authentication providers
- [ ] Set up email templates for authentication emails
- [ ] Add site URL to Supabase redirect URLs
- [ ] Test login, registration, and password reset flows

## Testing Checklist

- [ ] Test all forms with valid and invalid data
- [ ] Verify email notifications are sent correctly
- [ ] Check authentication flows: login, register, reset password
- [ ] Test responsive layout on multiple devices
- [ ] Verify consultation booking process end-to-end
- [ ] Test dashboard functionality for normal users
- [ ] Test admin functionality for admin users
- [ ] Verify API endpoints and database connections
- [ ] Check monitoring endpoint (/api/health)
- [ ] Validate site performance with Lighthouse or similar tool

## SEO and Analytics

- [ ] Verify sitemap.xml is accessible
- [ ] Verify robots.txt is configured correctly
- [ ] Check meta tags on all pages
- [ ] Configure analytics tracking (if applicable)
- [ ] Test Open Graph tags for social sharing

## Security Checks

- [ ] Verify API endpoints are properly secured
- [ ] Check authentication and authorization controls
- [ ] Ensure sensitive data is not exposed in client-side code
- [ ] Test CORS and CSP configurations
- [ ] Verify form validation and input sanitization

## Final Steps

- [ ] Run the deployment script: `bash deploy.sh`
- [ ] Deploy to Vercel using `vercel --prod` or GitHub integration
- [ ] Perform post-deployment tests on production environment
- [ ] Monitor error logs and performance metrics
- [ ] Update documentation with production URL and details

## Rollback Plan

In case of deployment issues:

1. Identify the nature of the issue
2. If database-related: Restore from the most recent backup
3. If code-related: Redeploy the previous stable version
4. For critical issues: Temporarily enable maintenance mode
5. Document the issue and resolution for future reference

---

**Last Updated**: May 25, 2025  
**Version**: 4.0  
**Prepared By**: UNITE Group Development Team
