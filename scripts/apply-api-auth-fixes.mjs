#!/usr/bin/env node
/**
 * Automated API Authentication Fixer
 *
 * This script automatically fixes authentication in ALL API endpoints by:
 * 1. Replacing broken auth() patterns with requireAuth()
 * 2. Adding authentication to endpoints that lack it
 * 3. Adding workspace validation where needed
 * 4. Adding proper error handling and logging
 *
 * Run: node scripts/apply-api-auth-fixes.mjs --dry-run (to preview)
 * Run: node scripts/apply-api-auth-fixes.mjs --apply (to apply fixes)
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const PROJECT_ROOT = process.cwd();
const DRY_RUN = process.argv.includes("--dry-run");
const APPLY = process.argv.includes("--apply");

// Files that should remain unchanged (public endpoints)
const SKIP_FILES = [
  "src/app/api/health/route.ts",
  "src/app/api/auth/[...nextauth]/route.ts",
  "src/app/api/webhooks/whatsapp/route.ts",
  "src/app/api/stripe/webhook/route.ts",
  "src/app/api/email/webhook/route.ts",
  "src/app/api/tracking/pixel/[trackingPixelId]/route.ts",
];

// Endpoints that need workspace validation
const NEEDS_WORKSPACE = [
  "/api/contacts/",
  "/api/campaigns/",
  "/api/clients/",
  "/api/emails/",
  "/api/integrations/",
  "/api/social-templates/",
  "/api/landing-pages/",
  "/api/sequences/",
];

class AuthFixer {
  constructor() {
    this.stats = {
      total: 0,
      fixed: 0,
      skipped: 0,
      errors: 0,
      changes: [],
    };
  }

  /**
   * Check if file should be skipped
   */
  shouldSkip(filePath) {
    return SKIP_FILES.some((skip) => filePath.includes(skip.replace(/\//g, "\\")));
  }

  /**
   * Check if endpoint needs workspace validation
   */
  needsWorkspace(filePath) {
    return NEEDS_WORKSPACE.some((path) =>
      filePath.includes(path.replace(/\//g, "\\"))
    );
  }

  /**
   * Fix authentication in a single file
   */
  fixFile(filePath) {
    this.stats.total++;

    if (this.shouldSkip(filePath)) {
      console.log(`⏭️  Skipping public endpoint: ${filePath}`);
      this.stats.skipped++;
      return;
    }

    try {
      const content = readFileSync(filePath, "utf-8");
      let newContent = content;
      let changes = [];

      // Pattern 1: Replace broken auth() pattern from NextAuth
      if (
        /import.*auth.*from.*@\/lib\/auth/.test(content) &&
        /const session = await auth\(\)/.test(content)
      ) {
        changes.push("Replace NextAuth with requireAuth");

        // Remove old import
        newContent = newContent.replace(
          /import\s+{\s*auth\s*}\s+from\s+["']@\/lib\/auth["'];?\n/g,
          ""
        );

        // Add new import
        if (!/import.*requireAuth.*from.*@\/lib\/api-auth/.test(newContent)) {
          newContent = newContent.replace(
            /import { NextRequest, NextResponse } from "next\/server";/,
            `import { NextRequest, NextResponse } from "next/server";\nimport { requireAuth, AuthError } from "@/lib/api-auth";`
          );
        }

        // Replace auth check pattern
        newContent = newContent.replace(
          /const session = await auth\(\);\s*if \(!session\?\.user\?\.id\) {\s*return NextResponse\.json\(\s*{\s*error:\s*["']Unauthorized["']\s*},\s*{\s*status:\s*401\s*}\s*\);\s*}/g,
          "const { user, supabase, orgId } = await requireAuth(req);"
        );

        // Replace session.user.id references
        newContent = newContent.replace(/session\.user\.id/g, "user.id");
        newContent = newContent.replace(/session\.user\.email/g, "user.email");
      }

      // Pattern 2: Add authentication to endpoints that lack it
      if (
        !/requireAuth|getSupabaseServer/.test(content) &&
        /export async function (GET|POST|PUT|PATCH|DELETE)/.test(content)
      ) {
        changes.push("Add missing authentication");

        // Add import
        if (!/import.*requireAuth.*from.*@\/lib\/api-auth/.test(newContent)) {
          newContent = newContent.replace(
            /import { NextRequest, NextResponse } from "next\/server";/,
            `import { NextRequest, NextResponse } from "next/server";\nimport { requireAuth, AuthError } from "@/lib/api-auth";`
          );
        }

        // Add auth check to each handler
        newContent = newContent.replace(
          /(export async function (GET|POST|PUT|PATCH|DELETE)\([^)]*\) {\s*)(try \{)?/g,
          (match, p1, p2, p3) => {
            if (p3) {
              // Already has try-catch
              return `${p1}try {\n    const { user, supabase, orgId } = await requireAuth(req);\n`;
            } else {
              // No try-catch
              return `${p1}try {\n    const { user, supabase, orgId } = await requireAuth(req);\n`;
            }
          }
        );

        // Add catch block if not present
        if (!/catch.*AuthError/.test(newContent)) {
          newContent = newContent.replace(
            /(}\s*catch\s*\([^)]*\)\s*{[^}]*})/g,
            (match) => {
              if (!/AuthError/.test(match)) {
                return match.replace(
                  /(catch\s*\()/,
                  `catch (error) {\n    if (error instanceof AuthError) {\n      return error.toResponse();\n    }\n    // Original catch handling\n    `
                );
              }
              return match;
            }
          );
        }
      }

      // Pattern 3: Enhance getSupabaseServer pattern with better error handling
      if (
        /getSupabaseServer/.test(content) &&
        !/requireAuth/.test(content)
      ) {
        changes.push("Migrate getSupabaseServer to requireAuth");

        // Add import
        if (!/import.*requireAuth.*from.*@\/lib\/api-auth/.test(newContent)) {
          newContent = newContent.replace(
            /import.*getSupabaseServer.*from.*@\/lib\/supabase.*;?\n/,
            `import { requireAuth, AuthError } from "@/lib/api-auth";\n`
          );
        }

        // Replace getSupabaseServer() + auth.getUser() pattern
        newContent = newContent.replace(
          /const supabase = await getSupabaseServer\(\);\s*const\s*{\s*data:\s*{\s*user\s*},\s*error:\s*authError[^}]*}\s*=\s*await supabase\.auth\.getUser\(\);[^}]*if \(authError \|\| !user\) {[^}]*return NextResponse\.json\([^)]*\);?\s*}/gs,
          "const { user, supabase, orgId } = await requireAuth(req);"
        );
      }

      // Pattern 4: Add workspace validation where needed
      if (
        this.needsWorkspace(filePath) &&
        !/requireWorkspace/.test(content) &&
        /workspaceId|workspace_id/.test(content)
      ) {
        changes.push("Add workspace validation");

        // Replace requireAuth with requireWorkspace in import
        if (/import.*requireAuth.*from.*@\/lib\/api-auth/.test(newContent)) {
          newContent = newContent.replace(
            /import { requireAuth, AuthError } from "@\/lib\/api-auth";/,
            `import { requireAuth, requireWorkspace, AuthError } from "@/lib/api-auth";`
          );

          // Replace requireAuth call with requireWorkspace
          newContent = newContent.replace(
            /const { user, supabase, orgId } = await requireAuth\(req\);/g,
            "const { user, supabase, orgId, workspaceId } = await requireWorkspace(req);"
          );
        }
      }

      // If changes were made
      if (changes.length > 0) {
        console.log(`\n✅ ${filePath}`);
        console.log(`   Changes: ${changes.join(", ")}`);

        this.stats.changes.push({
          file: filePath,
          changes,
        });

        if (APPLY) {
          writeFileSync(filePath, newContent, "utf-8");
          console.log(`   ✏️  Applied changes`);
          this.stats.fixed++;
        } else {
          console.log(`   📋 Would apply changes (use --apply to write)`);
        }
      }
    } catch (error) {
      console.error(`❌ Error fixing ${filePath}:`, error.message);
      this.stats.errors++;
    }
  }

  /**
   * Generate summary report
   */
  printSummary() {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  API AUTHENTICATION FIXER SUMMARY");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log(`📊 Total Files Processed: ${this.stats.total}`);
    console.log(`✅ Files Fixed: ${this.stats.fixed}`);
    console.log(`⏭️  Files Skipped: ${this.stats.skipped}`);
    console.log(`❌ Errors: ${this.stats.errors}`);

    if (DRY_RUN) {
      console.log(`\n📋 DRY RUN MODE: No changes were written`);
      console.log(`   Run with --apply to apply fixes\n`);
    } else if (APPLY) {
      console.log(`\n✏️  CHANGES APPLIED: ${this.stats.fixed} files updated\n`);
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  }
}

// Usage check
if (!DRY_RUN && !APPLY) {
  console.error("❌ Error: Must specify either --dry-run or --apply\n");
  console.log("Usage:");
  console.log("  node scripts/apply-api-auth-fixes.mjs --dry-run  (preview changes)");
  console.log("  node scripts/apply-api-auth-fixes.mjs --apply    (apply changes)\n");
  process.exit(1);
}

console.log("🔧 Starting API authentication fixes...\n");
console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "APPLY CHANGES"}\n`);

// Read the audit report to get list of files
const reportPath = join(PROJECT_ROOT, "API_AUTH_AUDIT_REPORT.md");
const report = readFileSync(reportPath, "utf-8");

// Extract file paths from report (look for **File**: `...` lines)
const fileMatches = report.matchAll(/\*\*File\*\*:\s*`([^`]+)`/g);
const filesToFix = [];

for (const match of fileMatches) {
  const filePath = match[1];
  if (!filesToFix.includes(filePath)) {
    filesToFix.push(filePath);
  }
}

console.log(`Found ${filesToFix.length} files to process\n`);

// Process each file
const fixer = new AuthFixer();
for (const filePath of filesToFix) {
  const fullPath = join(PROJECT_ROOT, filePath);
  fixer.fixFile(fullPath);
}

// Print summary
fixer.printSummary();

// Exit
process.exit(fixer.stats.errors > 0 ? 1 : 0);
