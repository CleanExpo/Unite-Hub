#!/usr/bin/env node
/**
 * API Route Security Audit Script
 * Analyzes all API routes for authentication status
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Authentication patterns to look for
const AUTH_PATTERNS = {
  validateUserAndWorkspace: /validateUserAndWorkspace/,
  validateUserAuth: /validateUserAuth/,
  validateWorkspaceAccess: /validateWorkspaceAccess/,
  getUser: /getUser\s*\(/,
  getSession: /getSession\s*\(/,
  cronSecret: /CRON_SECRET|validateCronRequest/,
  stripeWebhook: /stripe\.webhooks\.constructEvent/,
  authHeader: /authorization.*header/i,
  getSupabaseServer: /getSupabaseServer/,
  createServerClient: /createServerClient/,
  withApiHandler: /withApiHandler/,
  verifyToken: /VERIFY_TOKEN|verify_token/,
  webhookSignature: /signature.*verif/i,
};

// Public route patterns (intentionally public)
const PUBLIC_ROUTE_PATTERNS = [
  /\/api\/health/,
  /\/api\/monitoring\/health/,
  /\/api\/system\/health/,
  /\/api\/contact\/submit/,
  /\/api\/auth\//,
  /\/api\/deployment-check/,
  /\/api\/test/,
  /\/api\/tracking\/pixel/,
  /\/api\/docs$/,
  /\/api\/metrics$/,
  /\/api\/v1\/health/,
];

// Webhook patterns
const WEBHOOK_PATTERNS = [
  /\/api\/webhooks\//,
  /\/api\/stripe\/webhook/,
  /\/api\/email\/webhook/,
];

// Cron patterns
const CRON_PATTERNS = [
  /\/api\/cron\//,
];

function findAllRoutes(dir) {
  const routes = [];

  function traverse(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        traverse(fullPath);
      } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
        routes.push(fullPath);
      }
    }
  }

  traverse(dir);
  return routes;
}

function analyzeRoute(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = filePath.replace(/\\/g, '/').split('src/app')[1].replace('/route.ts', '').replace('/route.js', '');

  const analysis = {
    path: relativePath,
    fullPath: filePath,
    hasAuth: false,
    authType: 'MISSING',
    authPatterns: [],
    intentionallyPublic: false,
    lineCount: content.split('\n').length,
  };

  // Check if intentionally public
  if (PUBLIC_ROUTE_PATTERNS.some(pattern => pattern.test(relativePath))) {
    analysis.intentionallyPublic = true;
    analysis.authType = 'Public';
    analysis.hasAuth = true;
  }

  // Check for cron
  if (CRON_PATTERNS.some(pattern => pattern.test(relativePath))) {
    if (AUTH_PATTERNS.cronSecret.test(content)) {
      analysis.hasAuth = true;
      analysis.authType = 'Cron';
      analysis.authPatterns.push('CRON_SECRET');
    }
  }

  // Check for webhook
  if (WEBHOOK_PATTERNS.some(pattern => pattern.test(relativePath))) {
    if (AUTH_PATTERNS.stripeWebhook.test(content)) {
      analysis.hasAuth = true;
      analysis.authType = 'Webhook';
      analysis.authPatterns.push('stripe signature verification');
    }
  }

  // Check for user auth patterns
  for (const [name, pattern] of Object.entries(AUTH_PATTERNS)) {
    if (pattern.test(content)) {
      analysis.hasAuth = true;
      if (!analysis.authType || analysis.authType === 'MISSING') {
        analysis.authType = 'Protected';
      }
      analysis.authPatterns.push(name);
    }
  }

  // Special case: auth routes themselves
  if (relativePath.includes('/api/auth/')) {
    analysis.hasAuth = true;
    analysis.authType = 'Auth Endpoint';
  }

  return analysis;
}

function generateReport(routes) {
  const results = routes.map(analyzeRoute);

  // Statistics
  const stats = {
    total: results.length,
    protected: results.filter(r => r.authType === 'Protected').length,
    public: results.filter(r => r.authType === 'Public').length,
    cron: results.filter(r => r.authType === 'Cron').length,
    webhook: results.filter(r => r.authType === 'Webhook').length,
    authEndpoint: results.filter(r => r.authType === 'Auth Endpoint').length,
    missing: results.filter(r => r.authType === 'MISSING').length,
  };

  // Group by auth type
  const byAuthType = {
    Protected: results.filter(r => r.authType === 'Protected'),
    Public: results.filter(r => r.authType === 'Public'),
    Cron: results.filter(r => r.authType === 'Cron'),
    Webhook: results.filter(r => r.authType === 'Webhook'),
    'Auth Endpoint': results.filter(r => r.authType === 'Auth Endpoint'),
    MISSING: results.filter(r => r.authType === 'MISSING'),
  };

  // Generate markdown report
  let report = `# API Route Security Audit Report

**Generated:** ${new Date().toISOString()}

**Summary:** Analyzed ${stats.total} API routes in Unite-Hub

---

## Executive Summary

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ Protected (User Auth) | ${stats.protected} | ${((stats.protected / stats.total) * 100).toFixed(1)}% |
| 🌐 Public (Intentional) | ${stats.public} | ${((stats.public / stats.total) * 100).toFixed(1)}% |
| ⏰ Cron (CRON_SECRET) | ${stats.cron} | ${((stats.cron / stats.total) * 100).toFixed(1)}% |
| 🔗 Webhook (Signature) | ${stats.webhook} | ${((stats.webhook / stats.total) * 100).toFixed(1)}% |
| 🔑 Auth Endpoint | ${stats.authEndpoint} | ${((stats.authEndpoint / stats.total) * 100).toFixed(1)}% |
| ⚠️ **MISSING AUTH** | **${stats.missing}** | **${((stats.missing / stats.total) * 100).toFixed(1)}%** |

**Authentication Coverage:** ${(((stats.total - stats.missing) / stats.total) * 100).toFixed(1)}%

---

## Critical Security Issues

`;

  if (stats.missing > 0) {
    report += `⚠️ **CRITICAL:** ${stats.missing} routes have NO AUTHENTICATION

These routes need immediate attention:

`;
    byAuthType.MISSING.forEach(route => {
      report += `- \`${route.path}\`\n`;
    });
  } else {
    report += `✅ **EXCELLENT:** All routes have authentication!\n\n`;
  }

  report += `\n---

## Detailed Route Inventory

### ✅ Protected Routes (User Authentication) - ${stats.protected} routes

Routes requiring user authentication via \`validateUserAndWorkspace\`, \`validateUserAuth\`, or \`getUser()\`:

| Route | Auth Patterns | Lines |
|-------|---------------|-------|
`;

  byAuthType.Protected.forEach(route => {
    report += `| \`${route.path}\` | ${route.authPatterns.join(', ')} | ${route.lineCount} |\n`;
  });

  report += `\n### 🌐 Public Routes (Intentionally Public) - ${stats.public} routes

Routes that should be publicly accessible:

| Route | Purpose | Lines |
|-------|---------|-------|
`;

  byAuthType.Public.forEach(route => {
    const purpose = route.path.includes('/health') ? 'Health check' :
                    route.path.includes('/contact') ? 'Contact form' :
                    route.path.includes('/deployment') ? 'Deployment check' :
                    route.path.includes('/auth') ? 'Authentication' : 'Public API';
    report += `| \`${route.path}\` | ${purpose} | ${route.lineCount} |\n`;
  });

  report += `\n### ⏰ Cron Jobs (CRON_SECRET) - ${stats.cron} routes

Routes protected by CRON_SECRET for scheduled tasks:

| Route | Purpose | Lines |
|-------|---------|-------|
`;

  byAuthType.Cron.forEach(route => {
    const purpose = route.path.includes('health-check') ? 'Health monitoring' :
                    route.path.includes('success') ? 'Success metrics' : 'Scheduled task';
    report += `| \`${route.path}\` | ${purpose} | ${route.lineCount} |\n`;
  });

  report += `\n### 🔗 Webhooks (Signature Verification) - ${stats.webhook} routes

Routes protected by webhook signature verification:

| Route | Provider | Lines |
|-------|----------|-------|
`;

  byAuthType.Webhook.forEach(route => {
    const provider = route.path.includes('stripe') ? 'Stripe' :
                     route.path.includes('gmail') ? 'Gmail' : 'Generic';
    report += `| \`${route.path}\` | ${provider} | ${route.lineCount} |\n`;
  });

  report += `\n### 🔑 Auth Endpoints - ${stats.authEndpoint} routes

Authentication and session management endpoints:

| Route | Purpose | Lines |
|-------|---------|-------|
`;

  byAuthType['Auth Endpoint'].forEach(route => {
    const purpose = route.path.includes('initialize') ? 'User initialization' :
                    route.path.includes('callback') ? 'OAuth callback' :
                    route.path.includes('login') ? 'Login' :
                    route.path.includes('logout') ? 'Logout' : 'Auth';
    report += `| \`${route.path}\` | ${purpose} | ${route.lineCount} |\n`;
  });

  if (stats.missing > 0) {
    report += `\n### ⚠️ MISSING AUTHENTICATION - ${stats.missing} routes

**CRITICAL SECURITY ISSUE:** These routes have NO authentication and should be reviewed immediately:

| Route | Lines | File Path |
|-------|-------|-----------|
`;

    byAuthType.MISSING.forEach(route => {
      report += `| \`${route.path}\` | ${route.lineCount} | \`${route.fullPath.replace(/\\/g, '/')}\` |\n`;
    });

    report += `\n---

## Recommended Actions

For routes with MISSING authentication:

1. **Determine if the route should be:**
   - ✅ **Protected** - Add \`validateUserAndWorkspace(req, workspaceId)\` or \`validateUserAuth(req)\`
   - 🌐 **Public** - Document why it's public and add rate limiting
   - ⏰ **Cron** - Add \`validateCronRequest(req)\` with CRON_SECRET check
   - 🔗 **Webhook** - Add signature verification

2. **Implementation patterns:**

### Protected Route (User Auth)
\`\`\`typescript
import { validateUserAndWorkspace } from "@/lib/workspace-validation";

export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");

  // Validate user authentication and workspace access
  await validateUserAndWorkspace(req, workspaceId);

  // Your route logic here
}
\`\`\`

### Cron Job (CRON_SECRET)
\`\`\`typescript
import { validateCronRequest } from "@/lib/cron/auth";

export async function GET(req: NextRequest) {
  // Validate cron request
  const auth = validateCronRequest(req, { logPrefix: 'JobName' });
  if (!auth.valid) {
    return auth.response;
  }

  // Your job logic here
}
\`\`\`

### Webhook (Signature Verification)
\`\`\`typescript
export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");

  // Verify webhook signature
  const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

  // Your webhook logic here
}
\`\`\`

### Public Route (Rate Limited)
\`\`\`typescript
import { publicRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await publicRateLimit(req);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  // Your public route logic here
}
\`\`\`

`;
  }

  report += `\n---

## Authentication Patterns Reference

### User Authentication Functions

1. **\`validateUserAndWorkspace(req, workspaceId)\`**
   - Validates user session AND workspace access
   - Use for routes that operate on workspace data
   - Returns user object with userId and orgId

2. **\`validateUserAuth(req)\`**
   - Validates user session only
   - Use for routes that don't need workspace context
   - Returns user object

3. **\`validateWorkspaceAccess(workspaceId, orgId)\`**
   - Validates workspace belongs to organization
   - Use after getting user's orgId

4. **\`getUser()\`** (via Supabase)
   - Low-level session check
   - Returns user from session cookie/token

### Security Best Practices

✅ **DO:**
- Always validate workspaceId for multi-tenant data
- Use rate limiting on all routes (especially public ones)
- Log failed authentication attempts
- Return generic error messages (don't leak info)
- Use service role only for initialization/admin tasks

❌ **DON'T:**
- Skip workspace validation (breaks tenant isolation)
- Expose detailed error messages to clients
- Use service role for regular user operations
- Allow SQL injection via unvalidated inputs
- Skip rate limiting on public endpoints

---

## Audit Metadata

- **Total Routes Analyzed:** ${stats.total}
- **Auth Coverage:** ${(((stats.total - stats.missing) / stats.total) * 100).toFixed(1)}%
- **Critical Issues:** ${stats.missing}
- **Audit Tool:** \`scripts/audit-api-auth.mjs\`
- **Run Command:** \`node scripts/audit-api-auth.mjs\`

---

**Next Steps:**
1. Review routes with MISSING authentication
2. Add appropriate auth to each route
3. Test authentication with real requests
4. Re-run audit to verify 100% coverage
`;

  return report;
}

// Main execution
const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
console.log('🔍 Scanning API routes...\n');

const routes = findAllRoutes(apiDir);
console.log(`📊 Found ${routes.length} API routes\n`);

console.log('🔐 Analyzing authentication patterns...\n');
const report = generateReport(routes);

const outputPath = path.join(__dirname, '..', 'docs', 'API_ROUTE_SECURITY_AUDIT.md');
fs.writeFileSync(outputPath, report);

console.log(`✅ Audit complete! Report saved to: docs/API_ROUTE_SECURITY_AUDIT.md\n`);

// Print summary to console
const lines = report.split('\n');
const summaryStart = lines.findIndex(l => l.includes('Executive Summary'));
const summaryEnd = lines.findIndex(l => l.includes('Critical Security Issues'));
console.log(lines.slice(summaryStart, summaryEnd + 1).join('\n'));
