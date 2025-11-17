#!/usr/bin/env node

/**
 * Script to check authentication status across all API routes
 */

import { readFileSync } from 'fs';
import { globSync } from 'glob';

const AUTH_PATTERNS = [
  'validateUserAuth',
  'validateUserAndWorkspace',
  'getServerSession',
  'auth.getUser()',
];

const EXEMPT_ROUTES = [
  'src/app/api/auth/', // Auth routes themselves
  'src/app/api/webhooks/', // Webhook endpoints (use signature validation)
  'src/app/api/health', // Health check endpoint
  'src/app/api/metrics', // Metrics endpoint (Prometheus scraping)
  'src/app/api/deployment-check', // Deployment verification
  'src/app/api/integrations/gmail/callback', // OAuth callbacks
  'src/app/api/integrations/gmail/authorize', // OAuth authorization
  'src/app/api/integrations/outlook/callback', // OAuth callbacks
  'src/app/api/email/webhook', // Email webhook (signature verified)
  'src/app/api/stripe/webhook', // Stripe webhook (signature verified)
  'src/app/api/tracking/pixel', // Tracking pixel (public)
  'src/app/api/test/db', // Database test endpoint (dev only)
  'src/app/api/demo/initialize', // Demo initialization (public)
  'src/app/api/docs', // API documentation (public)
];

console.log('🔍 Checking API Route Authentication Status\n');

const routeFiles = globSync('src/app/api/**/route.ts');

const routesWithAuth = [];
const routesWithoutAuth = [];
const exemptRoutes = [];

routeFiles.forEach((file) => {
  // Normalize path for comparison (handle both forward and backslashes)
  const normalizedFile = file.replace(/\\/g, '/');

  // Check if route is exempt
  const isExempt = EXEMPT_ROUTES.some((exemptPath) => normalizedFile.includes(exemptPath));

  if (isExempt) {
    exemptRoutes.push(file);
    return;
  }

  const content = readFileSync(file, 'utf8');

  const hasAuth = AUTH_PATTERNS.some((pattern) => content.includes(pattern));

  if (hasAuth) {
    routesWithAuth.push(file);
  } else {
    routesWithoutAuth.push(file);
  }
});

console.log(`✅ Routes with authentication: ${routesWithAuth.length}`);
console.log(`❌ Routes without authentication: ${routesWithoutAuth.length}`);
console.log(`⚠️  Exempt routes (webhooks, auth): ${exemptRoutes.length}`);
console.log(`\n📊 Total API routes: ${routeFiles.length}`);
console.log(`📈 Auth coverage: ${((routesWithAuth.length / (routeFiles.length - exemptRoutes.length)) * 100).toFixed(1)}%\n`);

if (routesWithoutAuth.length > 0) {
  console.log('❌ Routes WITHOUT Authentication:\n');
  routesWithoutAuth.forEach((file) => {
    console.log(`   - ${file}`);
  });
  console.log('');
}

// Exit with error if any routes lack auth
if (routesWithoutAuth.length > 0) {
  console.error('⚠️  WARNING: Some API routes lack authentication!');
  process.exit(1);
} else {
  console.log('✅ All API routes have proper authentication!');
  process.exit(0);
}
