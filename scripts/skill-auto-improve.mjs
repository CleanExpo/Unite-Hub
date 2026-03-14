#!/usr/bin/env node

/**
 * Skill Auto-Improve — Karpathy Auto-Research Pattern
 * Autonomous loop: read skill -> run assertions -> change -> re-run -> keep/revert
 *
 * Implements the Superpowers TDD cycle:
 *   RED:      Document the failing assertion
 *   GREEN:    Request minimal SKILL.md change to pass that specific assertion
 *   REFACTOR: After pass, request cleanup for skill coherence
 *
 * Usage:
 *   node scripts/skill-auto-improve.mjs --skill blog-write
 *   node scripts/skill-auto-improve.mjs --all
 *   node scripts/skill-auto-improve.mjs --skill blog-write --max-iterations 3
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  existsSync,
  copyFileSync,
  unlinkSync,
} from "fs";
import { join } from "path";
import { homedir } from "os";
import { execFileSync } from "child_process";
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
const MAX_TOKENS = 8192;
const SKILLS_DIR = join(homedir(), ".claude", "skills");
const ASSERTION_RUNNER = join(process.cwd(), "scripts", "skill-eval-runner.mjs");

// ---------------------------------------------------------------------------
// 2. Parse CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const allSkills = args.includes("--all");
const skillIdx = args.indexOf("--skill");
const skillName = skillIdx !== -1 ? args[skillIdx + 1] : null;
const maxIterIdx = args.indexOf("--max-iterations");
const maxIterations = maxIterIdx !== -1 ? parseInt(args[maxIterIdx + 1], 10) : 5;

if (!allSkills && !skillName) {
  console.error(
    "Usage: node scripts/skill-auto-improve.mjs --skill <name> | --all [--max-iterations <N>]"
  );
  process.exit(1);
}

if (isNaN(maxIterations) || maxIterations < 1) {
  console.error("ERROR: --max-iterations must be a positive integer");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 3. Helpers
// ---------------------------------------------------------------------------

/**
 * Run the assertion runner for a single skill and return the parsed results.
 * Shells out to skill-eval-runner.mjs which writes results to
 * ~/.claude/skills/{name}/eval-results.json
 */
function runAssertions(name) {
  const skillDir = join(SKILLS_DIR, name);
  const resultsPath = join(skillDir, "eval-results.json");

  try {
    execFileSync("node", [ASSERTION_RUNNER, "--skill", name], {
      stdio: "pipe",
      encoding: "utf-8",
      timeout: 300_000, // 5 minutes per run
    });
  } catch {
    // Runner exits 1 when assertions fail — that's expected behaviour
  }

  if (!existsSync(resultsPath)) {
    return null;
  }

  return JSON.parse(readFileSync(resultsPath, "utf-8"));
}

/** Extract failing test cases with their assertion details from results. */
function getFailures(results) {
  if (!results || !results.evals) return [];

  return results.evals
    .filter((e) => e.status === "fail" || e.status === "error")
    .map((e) => ({
      id: e.id,
      name: e.name,
      failedAssertions: (e.assertions || [])
        .filter((a) => !a.passed)
        .map((a) => ({ type: a.type, value: a.value })),
    }));
}

/** Format failures into a readable report for the LLM. */
function formatFailureReport(failures) {
  let report = "";
  for (const f of failures) {
    report += `\n### ${f.id}: ${f.name}\n`;
    report += `Failed assertions:\n`;
    for (const a of f.failedAssertions) {
      const displayVal =
        typeof a.value === "string" ? `"${a.value}"` : a.value;
      report += `  - ${a.type}: ${displayVal}\n`;
    }
  }
  return report;
}

/** Git commit the SKILL.md change. Returns true if committed successfully. */
function gitCommit(skillPath, message) {
  try {
    execFileSync("git", ["add", skillPath], { stdio: "pipe" });
    execFileSync("git", ["commit", "-m", message], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

/** Colour helpers for terminal output. */
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
};

function logHeader(text) {
  console.log(`\n${c.bold}${c.cyan}${"=".repeat(60)}${c.reset}`);
  console.log(`${c.bold}${c.cyan}  ${text}${c.reset}`);
  console.log(`${c.bold}${c.cyan}${"=".repeat(60)}${c.reset}\n`);
}

function logPhase(phase, text) {
  const colours = { RED: c.red, GREEN: c.green, REFACTOR: c.magenta };
  const colour = colours[phase] || c.dim;
  console.log(`  ${colour}${c.bold}[${phase}]${c.reset} ${text}`);
}

// ---------------------------------------------------------------------------
// 4. Core improvement loop for a single skill
// ---------------------------------------------------------------------------
async function improveSkill(name, client) {
  const skillDir = join(SKILLS_DIR, name);
  const skillPath = join(skillDir, "SKILL.md");
  const assertionPath = join(skillDir, "eval.json");

  // Validate prerequisites
  if (!existsSync(skillPath)) {
    console.log(`  ${c.yellow}SKIP${c.reset}: No SKILL.md found for "${name}"`);
    return { skill: name, status: "skipped", reason: "no SKILL.md" };
  }
  if (!existsSync(assertionPath)) {
    console.log(
      `  ${c.yellow}SKIP${c.reset}: No eval.json found for "${name}"`
    );
    return { skill: name, status: "skipped", reason: "no eval.json" };
  }

  logHeader(`Improving: ${name}`);

  // Backup original SKILL.md
  const backupPath = join(skillDir, "SKILL.md.backup");
  copyFileSync(skillPath, backupPath);

  // Initial assertion run
  console.log(`  Running initial assertions...`);
  let results = runAssertions(name);

  if (!results) {
    console.log(`  ${c.red}ERROR${c.reset}: Assertion runner returned no results`);
    return { skill: name, status: "error", reason: "assertion runner failed" };
  }

  let passRate = results.pass_rate;
  const initialPassRate = passRate;

  console.log(
    `  Initial pass rate: ${c.bold}${passRate}%${c.reset} (${results.passed_assertions}/${results.total_assertions})`
  );

  if (passRate === 100) {
    console.log(`  ${c.green}Already at 100% — nothing to improve${c.reset}`);
    try { unlinkSync(backupPath); } catch { /* ignore */ }
    return {
      skill: name,
      status: "perfect",
      passRate: 100,
      iterations: 0,
    };
  }

  let iteration = 0;
  let lastPassRate = passRate;
  let totalImprovements = 0;

  while (iteration < maxIterations && passRate < 100) {
    iteration++;
    console.log(
      `\n${c.dim}--- Iteration ${iteration}/${maxIterations} ---${c.reset}\n`
    );

    // -----------------------------------------------------------------------
    // RED: Document the failing assertions
    // -----------------------------------------------------------------------
    const failures = getFailures(results);
    if (failures.length === 0) {
      console.log(`  ${c.green}All assertions passing — done${c.reset}`);
      break;
    }

    logPhase("RED", `${failures.length} failing test case(s) documented`);
    const failureReport = formatFailureReport(failures);

    // -----------------------------------------------------------------------
    // GREEN: Request minimal SKILL.md change
    // -----------------------------------------------------------------------
    logPhase("GREEN", "Requesting targeted SKILL.md improvement...");

    const currentSkillMd = readFileSync(skillPath, "utf-8");

    let updatedSkillMd;
    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: `You are an expert skill-file editor. Your job is to make ONE targeted change to a SKILL.md file so that when an LLM uses it as a system prompt, the LLM's output will pass the failing binary assertions listed below.

Rules:
- Make the MINIMUM change necessary. Do not rewrite the entire file.
- Focus on the specific failing assertions — add explicit instructions that address them.
- Preserve the existing structure and style of the SKILL.md.
- Use Australian English (colour, behaviour, optimisation, etc.).
- Return ONLY the complete updated SKILL.md content — no explanation, no code fences, no preamble.
- Your response must start with the first character of the SKILL.md and end with the last character.`,
        messages: [
          {
            role: "user",
            content: `Here is the current SKILL.md:\n\n---\n${currentSkillMd}\n---\n\nHere are the FAILING assertions:\n${failureReport}\n\nMake ONE targeted change to fix these failures. Return the complete updated SKILL.md.`,
          },
        ],
      });

      updatedSkillMd = response.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n")
        .trim();
    } catch (err) {
      console.log(`  ${c.red}API ERROR${c.reset}: ${err.message}`);
      console.log(`  Stopping iteration loop for "${name}"`);
      break;
    }

    if (!updatedSkillMd || updatedSkillMd.length < 100) {
      console.log(
        `  ${c.yellow}WARN${c.reset}: LLM returned suspiciously short content (${updatedSkillMd?.length || 0} chars) — reverting`
      );
      break;
    }

    // Write the updated SKILL.md
    writeFileSync(skillPath, updatedSkillMd, "utf-8");
    console.log(
      `  ${c.dim}Wrote updated SKILL.md (${updatedSkillMd.length} chars)${c.reset}`
    );

    // Re-run assertions
    console.log(`  Re-running assertions...`);
    results = runAssertions(name);

    if (!results) {
      console.log(
        `  ${c.red}ERROR${c.reset}: Assertion runner failed after update — reverting`
      );
      copyFileSync(backupPath, skillPath);
      break;
    }

    const newPassRate = results.pass_rate;

    console.log(
      `  Pass rate: ${c.bold}${lastPassRate}% -> ${newPassRate}%${c.reset}`
    );

    // Decide: keep or revert
    if (newPassRate > lastPassRate) {
      // Improvement — commit
      logPhase(
        "GREEN",
        `${c.green}Improvement detected — committing${c.reset}`
      );

      const commitMsg = `improve(${name}): ${lastPassRate}% -> ${newPassRate}%`;
      const committed = gitCommit(skillPath, commitMsg);

      if (committed) {
        console.log(`  ${c.green}Committed${c.reset}: ${commitMsg}`);
      } else {
        console.log(
          `  ${c.yellow}WARN${c.reset}: Git commit failed (working tree may be clean)`
        );
      }

      lastPassRate = newPassRate;
      passRate = newPassRate;
      totalImprovements++;

      // Update backup to the new improved version
      copyFileSync(skillPath, backupPath);

      // -------------------------------------------------------------------
      // REFACTOR: Request coherence cleanup (only if not yet at 100%)
      // -------------------------------------------------------------------
      if (passRate < 100 && iteration < maxIterations) {
        logPhase("REFACTOR", "Requesting coherence cleanup...");

        try {
          const refactorResponse = await client.messages.create({
            model: MODEL,
            max_tokens: MAX_TOKENS,
            system: `You are a skill-file editor performing a coherence pass. The SKILL.md was just modified to fix failing assertions. Your job is to tidy it up:
- Remove any redundant or contradictory instructions
- Ensure consistent formatting and structure
- Keep all the changes that were just made (do NOT remove recently added instructions)
- Use Australian English
- Return ONLY the complete updated SKILL.md — no explanation, no code fences.`,
            messages: [
              {
                role: "user",
                content: `Here is the SKILL.md after the latest improvement:\n\n---\n${readFileSync(skillPath, "utf-8")}\n---\n\nClean it up for coherence. Return the complete SKILL.md.`,
              },
            ],
          });

          const refactoredMd = refactorResponse.content
            .filter((block) => block.type === "text")
            .map((block) => block.text)
            .join("\n")
            .trim();

          if (refactoredMd && refactoredMd.length >= 100) {
            writeFileSync(skillPath, refactoredMd, "utf-8");

            // Verify refactor didn't break anything
            const refactorResults = runAssertions(name);
            if (refactorResults && refactorResults.pass_rate >= passRate) {
              console.log(
                `  ${c.dim}Refactor pass — assertions still at ${refactorResults.pass_rate}%${c.reset}`
              );

              if (refactorResults.pass_rate > passRate) {
                const refactorCommitMsg = `refactor(${name}): coherence cleanup ${passRate}% -> ${refactorResults.pass_rate}%`;
                gitCommit(skillPath, refactorCommitMsg);
              }

              passRate = refactorResults.pass_rate;
              lastPassRate = passRate;
              results = refactorResults;

              // Update backup
              copyFileSync(skillPath, backupPath);
            } else {
              // Refactor broke things — revert to pre-refactor
              console.log(
                `  ${c.yellow}Refactor degraded results — reverting refactor${c.reset}`
              );
              copyFileSync(backupPath, skillPath);
            }
          }
        } catch (err) {
          console.log(
            `  ${c.dim}Refactor step failed (${err.message}) — continuing${c.reset}`
          );
        }
      }
    } else if (newPassRate === lastPassRate) {
      // No improvement — revert
      console.log(
        `  ${c.yellow}No improvement — reverting SKILL.md${c.reset}`
      );
      copyFileSync(backupPath, skillPath);
      results = runAssertions(name);
    } else {
      // Regression — revert
      console.log(
        `  ${c.red}Regression detected — reverting SKILL.md${c.reset}`
      );
      copyFileSync(backupPath, skillPath);
      results = runAssertions(name);
    }
  }

  // Clean up backup file
  try { unlinkSync(backupPath); } catch { /* ignore */ }

  const finalPassRate = passRate;
  const status =
    finalPassRate === 100
      ? "perfect"
      : finalPassRate > initialPassRate
        ? "improved"
        : "plateau";

  console.log(`\n  ${c.bold}Result for ${name}:${c.reset}`);
  console.log(
    `    Initial: ${initialPassRate}% -> Final: ${finalPassRate}%`
  );
  console.log(`    Iterations: ${iteration} | Improvements: ${totalImprovements}`);
  console.log(`    Status: ${status}`);

  return {
    skill: name,
    status,
    initialPassRate,
    finalPassRate,
    iterations: iteration,
    improvements: totalImprovements,
  };
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

    // Only include skills that have both SKILL.md and assertion definitions
    skillNames = readdirSync(SKILLS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .filter((name) => {
        const dir = join(SKILLS_DIR, name);
        return (
          existsSync(join(dir, "SKILL.md")) &&
          existsSync(join(dir, "eval.json"))
        );
      });
  } else {
    skillNames = [skillName];
  }

  if (skillNames.length === 0) {
    console.error("No skills with both SKILL.md and assertion definitions found.");
    process.exit(1);
  }

  logHeader("Skill Auto-Improve — Karpathy Auto-Research Loop");
  console.log(`  Skills queued:     ${skillNames.length}`);
  console.log(`  Max iterations:    ${maxIterations}`);
  console.log(`  Model:             ${MODEL}`);
  console.log(`  TDD pattern:       RED -> GREEN -> REFACTOR`);
  console.log();

  const startTime = Date.now();
  const summaries = [];

  for (const name of skillNames) {
    const result = await improveSkill(name, client);
    summaries.push(result);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // ---------------------------------------------------------------------------
  // 6. Final summary
  // ---------------------------------------------------------------------------
  logHeader("Auto-Improve Summary");

  const perfect = summaries.filter((s) => s.status === "perfect");
  const improved = summaries.filter((s) => s.status === "improved");
  const plateaued = summaries.filter((s) => s.status === "plateau");
  const skipped = summaries.filter((s) => s.status === "skipped");
  const errored = summaries.filter((s) => s.status === "error");

  for (const s of summaries) {
    const icons = {
      perfect: `${c.green}PERFECT${c.reset}`,
      improved: `${c.cyan}IMPROVED${c.reset}`,
      plateau: `${c.yellow}PLATEAU${c.reset}`,
      skipped: `${c.dim}SKIPPED${c.reset}`,
      error: `${c.red}ERROR${c.reset}`,
    };

    const icon = icons[s.status] || s.status;
    const detail =
      s.status === "skipped" || s.status === "error"
        ? s.reason || ""
        : `${s.initialPassRate ?? "?"}% -> ${s.finalPassRate ?? "?"}% (${s.iterations ?? 0} iterations)`;

    console.log(`  ${icon}  ${c.bold}${s.skill}${c.reset}  ${detail}`);
  }

  console.log();
  console.log(
    `  ${c.green}Perfect: ${perfect.length}${c.reset} | ${c.cyan}Improved: ${improved.length}${c.reset} | ${c.yellow}Plateau: ${plateaued.length}${c.reset} | ${c.dim}Skipped: ${skipped.length}${c.reset} | ${c.red}Errors: ${errored.length}${c.reset}`
  );
  console.log(`  Total time: ${elapsed}s`);
  console.log();

  // Exit with failure if any skill is not at 100%
  const anyIncomplete = summaries.some(
    (s) => s.status !== "perfect" && s.status !== "skipped"
  );
  process.exit(anyIncomplete ? 1 : 0);
}

main().catch((err) => {
  console.error(`\n${c.red}Fatal error:${c.reset} ${err.message}`);
  process.exit(1);
});
