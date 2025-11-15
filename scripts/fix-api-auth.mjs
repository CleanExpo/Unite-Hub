#!/usr/bin/env node
/**
 * Comprehensive API Authentication Fixer
 *
 * This script audits ALL API endpoints and generates a report of:
 * 1. Endpoints with NO authentication
 * 2. Endpoints with BROKEN authentication patterns
 * 3. Endpoints that need workspace validation
 * 4. Recommended fixes for each
 *
 * Run: node scripts/fix-api-auth.mjs
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from "fs";
import { join, relative } from "path";

const API_DIR = "src/app/api";
const PROJECT_ROOT = process.cwd();

// Authentication patterns to look for
const AUTH_PATTERNS = {
  supabaseServer: /getSupabaseServer\(\)/,
  supabaseAuth: /supabase\.auth\.getUser\(\)/,
  nextAuth: /auth\(\)/,
  requireAuth: /requireAuth\(/,
  requireWorkspace: /requireWorkspace\(/,
  workspaceValidation: /workspaces.*eq\(['"]id['"]/,
  orgValidation: /user_organizations.*eq\(['"]user_id['"]/,
};

// Endpoints that SHOULD NOT have auth (webhooks, public endpoints)
const PUBLIC_ENDPOINTS = [
  "/api/health",
  "/api/auth/[...nextauth]",
  "/api/webhooks/",
  "/api/tracking/pixel/",
  "/api/stripe/webhook",
  "/api/email/webhook",
];

class APIAuditor {
  constructor() {
    this.routes = [];
    this.results = {
      total: 0,
      withAuth: 0,
      withoutAuth: 0,
      withWorkspaceValidation: 0,
      withOrgValidation: 0,
      publicEndpoints: 0,
      broken: [],
      missing: [],
      correct: [],
    };
  }

  /**
   * Recursively find all route.ts files
   */
  findRouteFiles(dir = API_DIR, routes = []) {
    const fullPath = join(PROJECT_ROOT, dir);

    try {
      const files = readdirSync(fullPath);

      for (const file of files) {
        const filePath = join(fullPath, file);
        const stat = statSync(filePath);

        if (stat.isDirectory()) {
          this.findRouteFiles(join(dir, file), routes);
        } else if (file === "route.ts" || file === "route.js") {
          routes.push(join(dir, file));
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dir}:`, error.message);
    }

    return routes;
  }

  /**
   * Analyze a single route file
   */
  analyzeRoute(filePath) {
    const fullPath = join(PROJECT_ROOT, filePath);
    const content = readFileSync(fullPath, "utf-8");
    const apiPath = filePath.replace("src/app", "").replace("/route.ts", "").replace("/route.js", "");

    const analysis = {
      path: apiPath,
      file: filePath,
      hasSupabaseServer: AUTH_PATTERNS.supabaseServer.test(content),
      hasSupabaseAuth: AUTH_PATTERNS.supabaseAuth.test(content),
      hasNextAuth: AUTH_PATTERNS.nextAuth.test(content),
      hasRequireAuth: AUTH_PATTERNS.requireAuth.test(content),
      hasRequireWorkspace: AUTH_PATTERNS.requireWorkspace.test(content),
      hasWorkspaceValidation: AUTH_PATTERNS.workspaceValidation.test(content),
      hasOrgValidation: AUTH_PATTERNS.orgValidation.test(content),
      isPublic: PUBLIC_ENDPOINTS.some((pub) => apiPath.includes(pub)),
      methods: this.extractHTTPMethods(content),
      issues: [],
      recommendations: [],
    };

    // Determine if auth is implemented
    analysis.hasAuth =
      analysis.hasSupabaseAuth ||
      analysis.hasRequireAuth ||
      analysis.hasNextAuth;

    // Analyze for issues
    if (!analysis.isPublic && !analysis.hasAuth) {
      analysis.issues.push("NO_AUTHENTICATION");
      analysis.recommendations.push(
        "Add authentication using requireAuth() from @/lib/api-auth"
      );
    }

    if (analysis.hasNextAuth && !analysis.hasSupabaseAuth) {
      analysis.issues.push("BROKEN_AUTH_PATTERN");
      analysis.recommendations.push(
        "Replace auth() from NextAuth with requireAuth() from @/lib/api-auth"
      );
    }

    if (
      analysis.hasAuth &&
      !analysis.isPublic &&
      !analysis.hasWorkspaceValidation &&
      !analysis.path.includes("/auth/") &&
      !analysis.path.includes("/profile/") &&
      !analysis.path.includes("/onboarding/")
    ) {
      analysis.issues.push("MISSING_WORKSPACE_VALIDATION");
      analysis.recommendations.push(
        "Add workspace validation using requireWorkspace() or manual validation"
      );
    }

    return analysis;
  }

  /**
   * Extract HTTP methods from route file
   */
  extractHTTPMethods(content) {
    const methods = [];
    if (/export\s+async\s+function\s+GET/m.test(content)) methods.push("GET");
    if (/export\s+async\s+function\s+POST/m.test(content))
      methods.push("POST");
    if (/export\s+async\s+function\s+PUT/m.test(content)) methods.push("PUT");
    if (/export\s+async\s+function\s+PATCH/m.test(content))
      methods.push("PATCH");
    if (/export\s+async\s+function\s+DELETE/m.test(content))
      methods.push("DELETE");
    return methods;
  }

  /**
   * Run full audit
   */
  audit() {
    console.log("🔍 Starting comprehensive API authentication audit...\n");

    const routeFiles = this.findRouteFiles();
    console.log(`Found ${routeFiles.length} API route files\n`);

    this.results.total = routeFiles.length;

    for (const filePath of routeFiles) {
      const analysis = this.analyzeRoute(filePath);
      this.routes.push(analysis);

      if (analysis.isPublic) {
        this.results.publicEndpoints++;
      } else if (analysis.hasAuth) {
        this.results.withAuth++;

        if (analysis.issues.length > 0) {
          this.results.broken.push(analysis);
        } else {
          this.results.correct.push(analysis);
        }
      } else {
        this.results.withoutAuth++;
        this.results.missing.push(analysis);
      }

      if (analysis.hasWorkspaceValidation) {
        this.results.withWorkspaceValidation++;
      }

      if (analysis.hasOrgValidation) {
        this.results.withOrgValidation++;
      }
    }

    return this.results;
  }

  /**
   * Generate detailed report
   */
  generateReport() {
    const report = [];

    report.push("# API Authentication Audit Report");
    report.push(`Generated: ${new Date().toISOString()}\n`);

    report.push("## Summary\n");
    report.push(`- **Total API Routes**: ${this.results.total}`);
    report.push(`- **Public Endpoints**: ${this.results.publicEndpoints}`);
    report.push(`- **With Authentication**: ${this.results.withAuth}`);
    report.push(`- **Without Authentication**: ${this.results.withoutAuth}`);
    report.push(
      `- **With Workspace Validation**: ${this.results.withWorkspaceValidation}`
    );
    report.push(
      `- **With Organization Validation**: ${this.results.withOrgValidation}`
    );
    report.push(`- **Correct Implementation**: ${this.results.correct.length}`);
    report.push(`- **Has Issues**: ${this.results.broken.length}`);
    report.push(
      `- **Missing Authentication**: ${this.results.missing.length}\n`
    );

    // Critical: Missing Authentication
    if (this.results.missing.length > 0) {
      report.push("## ❌ CRITICAL: Missing Authentication\n");
      report.push(
        `${this.results.missing.length} endpoints have NO authentication:\n`
      );

      for (const route of this.results.missing.slice(0, 50)) {
        // Limit output
        report.push(`### ${route.path}`);
        report.push(`**File**: \`${route.file}\``);
        report.push(`**Methods**: ${route.methods.join(", ")}`);
        report.push(`**Issues**: ${route.issues.join(", ")}`);
        report.push(`**Recommendations**:`);
        for (const rec of route.recommendations) {
          report.push(`- ${rec}`);
        }
        report.push("");
      }

      if (this.results.missing.length > 50) {
        report.push(
          `... and ${this.results.missing.length - 50} more endpoints\n`
        );
      }
    }

    // Broken Authentication Patterns
    if (this.results.broken.length > 0) {
      report.push("## ⚠️ Broken Authentication Patterns\n");
      report.push(
        `${this.results.broken.length} endpoints have authentication but with issues:\n`
      );

      for (const route of this.results.broken) {
        report.push(`### ${route.path}`);
        report.push(`**File**: \`${route.file}\``);
        report.push(`**Methods**: ${route.methods.join(", ")}`);
        report.push(`**Issues**: ${route.issues.join(", ")}`);
        report.push(`**Recommendations**:`);
        for (const rec of route.recommendations) {
          report.push(`- ${rec}`);
        }
        report.push("");
      }
    }

    // Correct Implementation (sample)
    if (this.results.correct.length > 0) {
      report.push("## ✅ Correct Implementation (Sample)\n");
      report.push(
        `${this.results.correct.length} endpoints have correct authentication:\n`
      );

      for (const route of this.results.correct.slice(0, 10)) {
        report.push(`- \`${route.path}\` (${route.methods.join(", ")})`);
      }

      if (this.results.correct.length > 10) {
        report.push(`... and ${this.results.correct.length - 10} more\n`);
      }
    }

    // Recommendations
    report.push("## 🔧 Action Plan\n");
    report.push("### Priority 1: Fix Missing Authentication\n");
    report.push(
      "Replace all instances of:\n```typescript\nconst session = await auth();\nif (!session?.user?.id) {\n  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });\n}\n```\n"
    );
    report.push(
      "With:\n```typescript\nimport { requireAuth } from '@/lib/api-auth';\n\nexport async function POST(req: NextRequest) {\n  try {\n    const { user, supabase, orgId } = await requireAuth(req);\n    // ... your logic\n  } catch (error) {\n    if (error instanceof AuthError) {\n      return error.toResponse();\n    }\n    throw error;\n  }\n}\n```\n"
    );

    report.push("### Priority 2: Add Workspace Validation\n");
    report.push(
      "For endpoints that operate on workspace-scoped resources, use:\n```typescript\nimport { requireWorkspace } from '@/lib/api-auth';\n\nexport async function POST(req: NextRequest) {\n  try {\n    const { user, supabase, orgId, workspaceId } = await requireWorkspace(req);\n    // workspaceId is already validated\n  } catch (error) {\n    if (error instanceof AuthError) {\n      return error.toResponse();\n    }\n    throw error;\n  }\n}\n```\n"
    );

    report.push("### Priority 3: Add Detailed Logging\n");
    report.push(
      "All authentication failures should log:\n- User ID (if available)\n- Request URL\n- Request method\n- Error details\n\nThe `requireAuth()` and `requireWorkspace()` helpers do this automatically.\n"
    );

    return report.join("\n");
  }

  /**
   * Print console summary
   */
  printSummary() {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  API AUTHENTICATION AUDIT SUMMARY");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log(`📊 Total API Routes: ${this.results.total}`);
    console.log(`🔓 Public Endpoints: ${this.results.publicEndpoints}`);
    console.log(`✅ With Authentication: ${this.results.withAuth}`);
    console.log(`❌ Without Authentication: ${this.results.withoutAuth}`);
    console.log(
      `🏢 With Workspace Validation: ${this.results.withWorkspaceValidation}`
    );
    console.log(
      `🏛️  With Org Validation: ${this.results.withOrgValidation}\n`
    );

    if (this.results.withoutAuth > 0) {
      console.log(
        `⚠️  WARNING: ${this.results.withoutAuth} endpoints have NO authentication!`
      );
      console.log(
        "   This is a critical security vulnerability.\n"
      );
    }

    if (this.results.broken.length > 0) {
      console.log(
        `⚠️  WARNING: ${this.results.broken.length} endpoints have broken auth patterns!`
      );
      console.log(
        "   These need to be migrated to the new auth middleware.\n"
      );
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  }
}

// Run the audit
const auditor = new APIAuditor();
auditor.audit();
auditor.printSummary();

// Generate and save detailed report
const report = auditor.generateReport();
const reportPath = join(PROJECT_ROOT, "API_AUTH_AUDIT_REPORT.md");
writeFileSync(reportPath, report, "utf-8");

console.log(`📝 Detailed report saved to: ${reportPath}\n`);

// Exit with error code if there are issues
if (auditor.results.withoutAuth > 0 || auditor.results.broken.length > 0) {
  console.log("❌ Audit failed: Authentication issues found\n");
  process.exit(1);
} else {
  console.log("✅ Audit passed: All endpoints have proper authentication\n");
  process.exit(0);
}
