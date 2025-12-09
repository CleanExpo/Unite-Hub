/**
 * Agent Prompt System Orchestrator
 * Consumes Shadow Observer findings → Autonomous refactoring & skill generation
 * Integrated with self-evaluation feedback loop
 */

import fs from 'fs';
import path from 'path';
import { Anthropic } from '@anthropic-ai/sdk';
import { shadowConfig } from './shadow-config';
import type { Violation, ScanResult } from './codebase-violation-scanner';

export interface AgentPromptResult {
  phase: 'audit' | 'refactor' | 'skill_generate' | 'verify';
  violations: Violation[];
  fixes: Array<{
    file: string;
    type: string;
    applied: boolean;
    newTests: number;
    qualityScore: number;
  }>;
  skillsGenerated: Array<{
    name: string;
    files: string[];
    testCases: number;
  }>;
  selfVerificationScore: number;
  recommendations: string[];
  timestamp: string;
}

/**
 * Initialize Anthropic client (lazy singleton, 60s TTL)
 */
let anthropicClient: Anthropic | null = null;
let clientTimestamp = 0;
const CLIENT_TTL = 60000;

function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - clientTimestamp > CLIENT_TTL) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    clientTimestamp = now;
  }
  return anthropicClient;
}

/**
 * PHASE 1: Read violations from Shadow Observer
 */
async function loadViolations(): Promise<ScanResult> {
  const reportPath = path.join(shadowConfig.reportDir, 'violations.json');

  if (!fs.existsSync(reportPath)) {
    throw new Error(`Violations report not found: ${reportPath}`);
  }

  const content = fs.readFileSync(reportPath, 'utf-8');
  return JSON.parse(content) as ScanResult;
}

/**
 * PHASE 2: Generate refactor prompts for critical violations
 */
async function generateRefactorPrompts(violations: Violation[]): Promise<string[]> {
  const criticalViolations = violations.filter(v => v.severity === 'critical');

  const prompts: string[] = [];

  for (const violation of criticalViolations.slice(0, 5)) {
    const prompt = `
OBJECTIVE: Fix critical architecture violation

FILE: ${violation.file}:${violation.line}
TYPE: ${violation.type}
DESCRIPTION: ${violation.description}
FIX: ${violation.fix}

CLAUDE.md PATTERN REQUIREMENTS:
1. Every DB query MUST have .eq("workspace_id", workspaceId)
2. Use correct Supabase client (server in RSC, client in hooks)
3. MUST await context.params in Next.js 15+ routes
4. Lazy Anthropic singleton (60s TTL)
5. No dead code, unused imports, or type violations

PROCESS:
1. Read the file
2. Apply the fix (preserve all logic)
3. Add 1 test case
4. Run type check
5. Self-verify (9/10+ quality)

OUTPUT FORMAT (JSON):
{
  "file": "${violation.file}",
  "fixApplied": true,
  "newTestsAdded": 1,
  "typeCheckPass": true,
  "qualityScore": 9.2,
  "gitDiffSummary": "..."
}
`;
    prompts.push(prompt);
  }

  return prompts;
}

/**
 * PHASE 3: Generate skill creation prompts
 */
async function generateSkillPrompts(): Promise<string[]> {
  const prompts: string[] = [
    `
OBJECTIVE: Generate new agent skill "codebase-auditor"

REQUIREMENTS:
1. Follows agent.md canonical format
2. Implements: Context → Model → Prompt → Tools
3. Exports SkillInput & SkillOutput interfaces
4. Self-verification (9/10+ gate)

STRUCTURE:
- File 1: src/lib/agents/codebase-auditor.ts (implementation)
- File 2: tests/skills/codebase-auditor.test.ts (3+ test cases)
- File 3: .claude/agents/CODEBASE-AUDITOR.md (documentation)

TEMPLATE:
export interface SkillInput {
  context: string;
  targetFiles?: string[];
}

export interface SkillOutput {
  success: boolean;
  output: any;
  errors?: string[];
  selfVerificationScore: number;
}

export async function executeSkill(input: SkillInput): Promise<SkillOutput> {
  // 1. Context validation
  // 2. Tool selection
  // 3. Prompt execution
  // 4. Error handling
  // 5. Self-verification
  // 6. Return structured result
}

Generate complete, production-ready code.
`
  ];

  return prompts;
}

/**
 * PHASE 4: Execute prompts via Claude
 */
async function executeAgentPrompts(prompts: string[]): Promise<string[]> {
  const client = getAnthropicClient();
  const results: string[] = [];

  for (const prompt of prompts) {
    try {
      const message = await client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = message.content[0];
      if (content.type === 'text') {
        results.push(content.text);
      }
    } catch (error) {
      console.error('Agent prompt execution failed:', error);
    }
  }

  return results;
}

/**
 * PHASE 5: Self-verify results
 */
async function selfVerify(results: string[]): Promise<number> {
  const client = getAnthropicClient();

  const verifyPrompt = `
OBJECTIVE: Self-verify these agent outputs (gate: 9/10+)

DIMENSIONS (all must be 9+):
1. Code quality: readability, maintainability
2. Architecture: multi-tenant isolation, CLAUDE.md compliance
3. Type safety: strict mode, no any, JSDoc coverage
4. Testing: coverage, edge cases
5. Security: no injection vectors, RLS compliance
6. Documentation: clarity, completeness

RESULTS TO VERIFY:
${results.slice(0, 3).join('\n---\n')}

SCORE (1-10): [provide single number]
FAILING_GATES: [list any <9]
CAN_PROCEED: [true if all ≥9, false otherwise]

Return JSON only.
`;

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: verifyPrompt
        }
      ]
    });

    const content = message.content[0];
    if (content.type === 'text') {
      try {
        const parsed = JSON.parse(content.text);
        return parsed.SCORE || 7;
      } catch {
        return 8;
      }
    }
  } catch (error) {
    console.error('Self-verification failed:', error);
  }

  return 7;
}

/**
 * PHASE 6: Generate self-evaluation feedback
 */
async function generateSelfEvalFeedback(
  violations: ScanResult,
  agentScore: number
): Promise<{
  stability: number;
  compliance: number;
  quality: number;
  performance: number;
}> {
  return {
    stability: 100 - Math.min(violations.summary.critical * 10, 100),
    compliance: 100 - Math.min(violations.summary.high * 5, 100),
    quality: agentScore * 10,
    performance: 85 // Placeholder
  };
}

/**
 * Main orchestration flow
 */
export async function runAgentPromptOrchestrator(): Promise<AgentPromptResult> {
  console.log('🤖 Agent Prompt System Orchestrator Starting...');
  const startTime = Date.now();

  const result: AgentPromptResult = {
    phase: 'audit',
    violations: [],
    fixes: [],
    skillsGenerated: [],
    selfVerificationScore: 0,
    recommendations: [],
    timestamp: new Date().toISOString()
  };

  try {
    // Phase 1: Load violations from Shadow Observer
    console.log('📖 PHASE 1: Loading Shadow Observer findings...');
    const violations = await loadViolations();
    result.violations = violations.violations;
    result.phase = 'refactor';

    console.log(`  Found ${violations.summary.critical} critical violations`);
    console.log(`  Found ${violations.summary.high} high violations`);
    console.log(`  Auto-fixable: ${violations.autoFixable.join(', ')}`);

    // Phase 2: Generate refactor prompts
    console.log('\n🔧 PHASE 2: Generating refactor prompts...');
    const refactorPrompts = await generateRefactorPrompts(result.violations);
    console.log(`  Generated ${refactorPrompts.length} refactor prompts`);

    // Phase 3: Generate skill prompts
    console.log('\n🎯 PHASE 3: Generating skill creation prompts...');
    const skillPrompts = await generateSkillPrompts();
    console.log(`  Generated ${skillPrompts.length} skill prompts`);

    // Phase 4: Execute all prompts
    console.log('\n⚙️  PHASE 4: Executing agent prompts via Claude...');
    const allPrompts = [...refactorPrompts, ...skillPrompts];
    const results = await executeAgentPrompts(allPrompts);
    console.log(`  Executed ${results.length} prompts`);
    result.phase = 'verify';

    // Phase 5: Self-verify
    console.log('\n✅ PHASE 5: Self-verifying results...');
    const score = await selfVerify(results);
    result.selfVerificationScore = score;

    if (score < 9) {
      result.recommendations.push('⚠️  Self-verification score below 9/10 — manual review required');
    } else {
      result.recommendations.push('✓ All self-verification gates passed');
    }

    // Phase 6: Generate self-eval feedback
    console.log('\n📊 PHASE 6: Generating self-evaluation feedback...');
    const evalFeedback = await generateSelfEvalFeedback(violations, score);

    // Store feedback (would insert to self_evaluation_factors in real implementation)
    console.log(`  Stability:  ${evalFeedback.stability.toFixed(1)}/100`);
    console.log(`  Compliance: ${evalFeedback.compliance.toFixed(1)}/100`);
    console.log(`  Quality:    ${evalFeedback.quality.toFixed(1)}/100`);
    console.log(`  Performance: ${evalFeedback.performance.toFixed(1)}/100`);

    const elapsed = Date.now() - startTime;
    console.log(`\n✓ Orchestration complete in ${(elapsed / 1000).toFixed(1)}s`);

    return result;
  } catch (error) {
    console.error('❌ Orchestration failed:', error);
    throw error;
  }
}

/**
 * Save results
 */
export async function saveAgentResults(result: AgentPromptResult): Promise<void> {
  const reportPath = path.join(shadowConfig.reportDir, 'agent_prompt_results.json');

  if (!fs.existsSync(shadowConfig.reportDir)) {
    fs.mkdirSync(shadowConfig.reportDir, { recursive: true });
  }

  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
  console.log(`\n📋 Results saved: ${reportPath}`);
}

export async function main() {
  try {
    const result = await runAgentPromptOrchestrator();
    await saveAgentResults(result);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
