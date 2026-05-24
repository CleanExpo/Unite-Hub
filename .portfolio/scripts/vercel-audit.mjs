// vercel-audit.mjs — audits all Vercel projects in the unite-group team
// Writes report to D:/_archive/2026-05-24/vercel-audit-report.json
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

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

console.log("Listing projects...");
const projList = api("GET", `/v9/projects?teamId=${TEAM}&limit=100`);
const projects = projList.projects || [];
console.log(`Found ${projects.length} projects.\n`);

const audit = [];
for (const p of projects) {
  process.stdout.write(`  ${p.name}... `);
  let detail = {}, deployments = {}, envs = {};
  try { detail = api("GET", `/v9/projects/${p.id}?teamId=${TEAM}`); } catch (e) { detail._err = e.message; }
  try { deployments = api("GET", `/v6/deployments?teamId=${TEAM}&projectId=${p.id}&limit=1`); } catch (e) { deployments._err = e.message; }
  try { envs = api("GET", `/v9/projects/${p.id}/env?teamId=${TEAM}`); } catch (e) { envs._err = e.message; }

  audit.push({
    id: p.id,
    name: p.name,
    framework: detail.framework || null,
    link: detail.link ? {
      type: detail.link.type,
      repo: detail.link.repo,
      org: detail.link.org,
      productionBranch: detail.link.productionBranch,
    } : null,
    domains: (detail.alias || []).map(a => a.domain),
    latestDeploy: deployments.deployments?.[0] ? {
      createdAt: new Date(deployments.deployments[0].created).toISOString(),
      state: deployments.deployments[0].state,
      url: deployments.deployments[0].url,
    } : null,
    envCount: envs.envs?.length || 0,
    createdAt: new Date(p.createdAt).toISOString(),
  });
  console.log("ok");
}

const out = "D:/_archive/2026-05-24/vercel-audit-report.json";
writeFileSync(out, JSON.stringify(audit, null, 2));
console.log(`\nWrote ${audit.length} entries to ${out}`);

console.log("\n=== Summary ===");
console.log("name                              | linked                  | domains | env | last deploy");
console.log("----------------------------------|-------------------------|---------|-----|------------");
for (const a of audit) {
  const linked = a.link ? `${a.link.org}/${a.link.repo}` : "—";
  console.log(`${a.name.padEnd(34)}| ${linked.padEnd(24)}| ${String(a.domains.length).padStart(7)} | ${String(a.envCount).padStart(3)} | ${a.latestDeploy ? a.latestDeploy.createdAt.slice(0, 10) : "—"}`);
}
