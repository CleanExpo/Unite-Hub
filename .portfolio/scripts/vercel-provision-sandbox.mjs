// vercel-provision-sandbox.mjs — creates a sandbox Vercel project for one canonical product
// Usage: node vercel-provision-sandbox.mjs <canonical_name>
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const YAML = require("yaml");

const TEAM = "team_KMZACI5rIltoCRhAtGCXlxUf";

function api(method, path, body) {
  const escapedBody = body ? body.replace(/'/g, "'\\''") : "";
  const cmd = body
    ? `bash D:/Unite-Hub/.portfolio/scripts/vercel-api.sh ${method} "${path}" '${escapedBody}'`
    : `bash D:/Unite-Hub/.portfolio/scripts/vercel-api.sh ${method} "${path}"`;
  const out = execSync(cmd, { encoding: "utf8" });
  try { return JSON.parse(out); }
  catch { return { _raw: out }; }
}

const target = process.argv[2];
if (!target) {
  console.error("Usage: node vercel-provision-sandbox.mjs <canonical_name>");
  process.exit(1);
}

const reg = YAML.parse(readFileSync("D:/Unite-Hub/.portfolio/PORTFOLIO.yaml", "utf8"));
const p = reg.products.find(x => x.canonical_name === target);
if (!p) {
  console.error(`Product "${target}" not in registry`);
  process.exit(1);
}
if (!p.github?.repo) {
  console.error(`Product "${target}" has no github repo`);
  process.exit(1);
}

const sandboxName = p.vercel?.sandbox?.project_name;
if (!sandboxName) {
  console.error(`No vercel.sandbox.project_name in registry for ${target}`);
  process.exit(1);
}

if (p.vercel?.sandbox?.project_id && p.vercel.sandbox.project_id !== "TBD" && p.vercel.sandbox.project_id !== null) {
  console.log(`Already provisioned: ${sandboxName} (${p.vercel.sandbox.project_id})`);
  process.exit(0);
}

const body = {
  name: sandboxName,
  framework: p.stack?.framework?.startsWith("next") ? "nextjs" : null,
  gitRepository: {
    type: "github",
    repo: `${p.github.org}/${p.github.repo}`,
    productionBranch: p.github.sandbox_branch || "sandbox",
  },
};

console.log(`Creating ${sandboxName} linked to ${p.github.org}/${p.github.repo}@${p.github.sandbox_branch || 'sandbox'}...`);
const res = api("POST", `/v10/projects?teamId=${TEAM}`, JSON.stringify(body));

if (res.error) {
  console.error(`FAIL: ${res.error.message || JSON.stringify(res.error)}`);
  process.exit(1);
}

console.log(`Created: ${res.name} (${res.id})`);
console.log(`Link: https://vercel.com/unite-group/${res.name}`);
console.log(`\nNext step: update registry vercel.sandbox.project_id for ${target} = ${res.id}`);
