#!/usr/bin/env node
// Apply branch protection to active product repos per registry.
// Usage: node apply-protection.mjs [--dry-run] [--only=<canonical_name>]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const YAML = require("yaml");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const onlyArg = args.find(a => a.startsWith("--only="));
const only = onlyArg ? onlyArg.split("=")[1] : null;

const registry = YAML.parse(readFileSync("D:/Unite-Hub/.portfolio/PORTFOLIO.yaml", "utf8"));
const targets = registry.products.filter(p =>
  p.status === "active" &&
  p.github?.repo &&
  p.canonical_name !== "Authority-Site"   // skip — merging in Plan 03
);

const tmpDir = "D:/_archive/_tmp";
if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });

function ghJson(cmd) {
  return execSync("gh " + cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
}

const mainBody = {
  required_status_checks: { strict: true, contexts: [] },
  enforce_admins: false,
  required_pull_request_reviews: { required_approving_review_count: 0, dismiss_stale_reviews: true },
  restrictions: null,
  required_linear_history: true,
  allow_force_pushes: false,
  allow_deletions: false,
  required_conversation_resolution: true,
};

const sandboxBody = {
  required_status_checks: { strict: false, contexts: [] },
  enforce_admins: false,
  required_pull_request_reviews: null,
  restrictions: null,
  required_linear_history: false,
  allow_force_pushes: true,
  allow_deletions: true,
};

for (const p of targets) {
  if (only && p.canonical_name !== only) continue;
  const repo = `${p.github.org}/${p.github.repo}`;
  const mainBranch = p.github.default_branch || "main";
  const sandboxBranch = p.github.sandbox_branch || "sandbox";
  console.log(`\n=== ${p.canonical_name} (${repo}) ===`);

  // Ensure sandbox branch exists
  try {
    const refJson = ghJson(`api "repos/${repo}/git/refs/heads/${mainBranch}"`);
    const ref = JSON.parse(refJson);
    const sha = ref.object?.sha;
    if (!sha) throw new Error("no main sha");
    try {
      ghJson(`api "repos/${repo}/git/refs/heads/${sandboxBranch}"`);
      console.log(`  sandbox exists`);
    } catch {
      if (dryRun) {
        console.log(`  DRY-RUN would create sandbox @ ${sha.slice(0, 7)}`);
      } else {
        ghJson(`api -X POST "repos/${repo}/git/refs" -f ref=refs/heads/${sandboxBranch} -f sha=${sha}`);
        console.log(`  CREATED sandbox @ ${sha.slice(0, 7)}`);
      }
    }
  } catch (e) {
    console.warn(`  WARN ensuring sandbox: ${e.message.split("\n")[0]}`);
    continue;
  }

  // Apply protection
  for (const [branch, body] of [[mainBranch, mainBody], [sandboxBranch, sandboxBody]]) {
    const tmp = `${tmpDir}/protection-${p.canonical_name}-${branch}.json`;
    writeFileSync(tmp, JSON.stringify(body));
    if (dryRun) {
      console.log(`  DRY-RUN would PUT ${branch} protection (body in ${tmp})`);
      continue;
    }
    try {
      ghJson(`api -X PUT "repos/${repo}/branches/${branch}/protection" --input "${tmp}"`);
      console.log(`  applied protection on ${branch}`);
    } catch (e) {
      console.error(`  FAIL ${branch}: ${e.message.split("\n")[0]}`);
    }
  }
}
console.log("\nDone.");
