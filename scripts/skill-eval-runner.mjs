#!/usr/bin/env node

/**
 * Skill Eval Runner — Karpathy Auto-Research Pattern
 *
 * Runs binary assertions against skill output to measure quality.
 *
 * Usage:
 *   node scripts/skill-eval-runner.mjs --skill blog-write
 *   node scripts/skill-eval-runner.mjs --all
 *   node scripts/skill-eval-runner.mjs --skill blog-write --verbose
 */

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { config } from "dotenv";

// ---------------------------------------------------------------------------
// 1. Load environment
// ---------------------------------------------------------------------------
config({ path: join(process.cwd(), ".env.local") });

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error("ERROR: ANTHROPIC_API_KEY not found in .env.local");
  process.exit(1);
}

const MODEL = "claude-sonnet-4-5-20250929";
const MAX_TOKENS = 4096;
const SKILLS_DIR = join(homedir(), ".claude", "skills");

// ---------------------------------------------------------------------------
// 2. Parse CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const verbose = args.includes("--verbose");
const allSkills = args.includes("--all");
const skillIdx = args.indexOf("--skill");
const skillName = skillIdx !== -1 ? args[skillIdx + 1] : null;

if (!allSkills && !skillName) {
  console.error("Usage: node scripts/skill-eval-runner.mjs --skill <name> | --all [--verbose]");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 3. Assertion runners
// ---------------------------------------------------------------------------
function runAssertion(type, value, response) {
  const lower = response.toLowerCase();

  switch (type) {
    case "contains":
      return lower.includes(value.toLowerCase());

    case "not_contains":
      return !lower.includes(value.toLowerCase());

    case "regex":
      return new RegExp(value, "i").test(response);

    case "min_length":
      return response.length >= value;

    case "max_length":
      return response.length <= value;

    case "starts_with":
      return lower.startsWith(value.toLowerCase());

    case "ends_with":
      return lower.endsWith(value.toLowerCase());

    case "json_valid":
      try {
        JSON.parse(response);
        return true;
      } catch {
        return false;
      }

    case "line_count_min":
      return response.split("\n").length >= value;

    case "line_count_max":
      return response.split("\n").length <= value;

    default:
      console.warn(`  Unknown assertion type: ${type}`);
      return false;
  }
}

// ---------------------------------------------------------------------------
// 4. Evaluate a single skill
// ---------------------------------------------------------------------------
async function evaluateSkill(name, client) {
  const skillDir = join(SKILLS_DIR, name);
  const evalPath = join(skillDir, "eval.json");
  const skillPath = join(skillDir, "SKILL.md");

  if (!existsSync(evalPath)) {
    console.warn(`  Skipping "${name}" — no eval.json found at ${evalPath}`);
    return null;
  }
  if (!existsSync(skillPath)) {
    console.warn(`  Skipping "${name}" — no SKILL.md found at ${skillPath}`);
    return null;
  }

  const evalData = JSON.parse(readFileSync(evalPath, "utf-8"));
  const skillMd = readFileSync(skillPath, "utf-8");

  const evals = Array.isArray(evalData) ? evalData : evalData.evals || [];
  if (evals.length === 0) {
    console.warn(`  Skipping "${name}" — eval.json contains no evals`);
    return null;
  }

  let totalAssertions = 0;
  let passedAssertions = 0;
  const evalResults = [];

  console.log(`\u250C\u2500 Skill: ${name} ${"─".repeat(Math.max(1, 44 - name.length))}`);

  for (const evalItem of evals) {
    const evalId = evalItem.id || `eval-${evals.indexOf(evalItem) + 1}`;
    const evalName = evalItem.name || evalItem.description || evalId;
    const prompt = evalItem.prompt || evalItem.input || "";
    const assertions = evalItem.assertions || [];

    if (!prompt) {
      console.log(`\u2502 ${evalId}: ${evalName}  \u26A0  No prompt — skipped`);
      continue;
    }

    // Call Anthropic API
    let responseText = "";
    try {
      if (verbose) {
        console.log(`\u2502   Calling API for ${evalId}...`);
      }

      const message = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: skillMd,
        messages: [{ role: "user", content: prompt }],
      });

      responseText = message.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n");
    } catch (err) {
      console.error(`\u2502 ${evalId}: API ERROR — ${err.message}`);
      evalResults.push({
        id: evalId,
        name: evalName,
        status: "error",
        error: err.message,
        assertions: [],
      });
      continue;
    }

    // Run assertions
    let evalPassed = 0;
    const evalTotal = assertions.length;
    const assertionResults = [];
    const failures = [];

    for (const assertion of assertions) {
      const [type, value] = Array.isArray(assertion)
        ? assertion
        : [assertion.type, assertion.value];

      const passed = runAssertion(type, value, responseText);
      totalAssertions++;

      if (passed) {
        passedAssertions++;
        evalPassed++;
      } else {
        failures.push({ type, value });
      }

      assertionResults.push({ type, value, passed });
    }

    const icon = evalPassed === evalTotal ? "\u2705" : "\u274C";
    console.log(`\u2502 ${evalId}: ${evalName}  ${icon} ${evalPassed}/${evalTotal}`);

    for (const f of failures) {
      const displayVal = typeof f.value === "string" ? `"${f.value}"` : f.value;
      console.log(`\u2502   \u2514 FAIL: ${f.type} ${displayVal}`);
    }

    if (verbose && responseText) {
      const preview = responseText.substring(0, 200).replace(/\n/g, "\\n");
      console.log(`\u2502   \u2514 Response preview: ${preview}...`);
    }

    evalResults.push({
      id: evalId,
      name: evalName,
      status: evalPassed === evalTotal ? "pass" : "fail",
      passed: evalPassed,
      total: evalTotal,
      assertions: assertionResults,
    });
  }

  const passRate = totalAssertions > 0
    ? Math.round((passedAssertions / totalAssertions) * 1000) / 10
    : 0;

  console.log("\u2502");
  console.log(`\u2502 TOTAL: ${passedAssertions}/${totalAssertions} (${passRate}%)`);
  console.log(`\u2514${"─".repeat(50)}`);
  console.log();

  // Write results to eval-results.json
  const results = {
    skill: name,
    timestamp: new Date().toISOString(),
    total_assertions: totalAssertions,
    passed_assertions: passedAssertions,
    pass_rate: passRate,
    evals: evalResults,
  };

  const resultsPath = join(skillDir, "eval-results.json");
  writeFileSync(resultsPath, JSON.stringify(results, null, 2), "utf-8");

  if (verbose) {
    console.log(`  Results written to ${resultsPath}`);
    console.log();
  }

  return results;
}

// ---------------------------------------------------------------------------
// 5. Main
// ---------------------------------------------------------------------------
async function main() {
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  let skillNames = [];

  if (allSkills) {
    if (!existsSync(SKILLS_DIR)) {
      console.error(`ERROR: Skills directory not found at ${SKILLS_DIR}`);
      process.exit(1);
    }
    skillNames = readdirSync(SKILLS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } else {
    skillNames = [skillName];
  }

  if (skillNames.length === 0) {
    console.error("No skills found to evaluate.");
    process.exit(1);
  }

  console.log(`\nSkill Eval Runner — ${skillNames.length} skill(s) queued`);
  console.log(`Model: ${MODEL} | Max tokens: ${MAX_TOKENS}`);
  console.log();

  let anyFailed = false;
  const allResults = [];

  for (const name of skillNames) {
    const result = await evaluateSkill(name, client);
    if (result) {
      allResults.push(result);
      if (result.passed_assertions < result.total_assertions) {
        anyFailed = true;
      }
    }
  }

  // Summary when running --all with multiple skills
  if (allResults.length > 1) {
    console.log("═".repeat(52));
    console.log("  SUMMARY");
    console.log("═".repeat(52));

    let grandTotal = 0;
    let grandPassed = 0;

    for (const r of allResults) {
      const icon = r.passed_assertions === r.total_assertions ? "\u2705" : "\u274C";
      console.log(`  ${icon} ${r.skill}: ${r.passed_assertions}/${r.total_assertions} (${r.pass_rate}%)`);
      grandTotal += r.total_assertions;
      grandPassed += r.passed_assertions;
    }

    const grandRate = grandTotal > 0
      ? Math.round((grandPassed / grandTotal) * 1000) / 10
      : 0;

    console.log();
    console.log(`  GRAND TOTAL: ${grandPassed}/${grandTotal} (${grandRate}%)`);
    console.log("═".repeat(52));
    console.log();
  }

  process.exit(anyFailed ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
