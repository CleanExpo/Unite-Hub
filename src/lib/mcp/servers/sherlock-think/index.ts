/**
 * Sherlock Think Alpha MCP Server - Code Execution API
 *
 * TypeScript wrapper for the Sherlock Think Alpha MCP server.
 * Use this instead of direct tool calls to save context tokens.
 *
 * @example
 * import * as sherlock from '@/lib/mcp/servers/sherlock-think';
 *
 * // Deep analysis with 1.84M context window
 * const analysis = await sherlock.thinkDeep({
 *   prompt: 'Analyze the security of this authentication flow',
 *   context: authFlowCode
 * });
 *
 * // Codebase analysis
 * const audit = await sherlock.analyzeCodebase({
 *   task: 'security audit',
 *   files: { 'src/auth.ts': authCode, 'src/api/login.ts': loginCode }
 * });
 */

import { callMCPTool } from '../../client';

const SERVER_NAME = 'sherlock-think-alpha';

// ========================================================================
// Type Definitions
// ========================================================================

export interface ThinkDeepInput {
  /** The analysis task or question */
  prompt: string;
  /** Large context to analyze (can be entire codebase) */
  context: string;
  /** Optional system prompt to guide the analysis */
  system_prompt?: string;
  /** Maximum tokens to generate (default: 16000) */
  max_tokens?: number;
}

export interface AnalyzeCodebaseInput {
  /** What to analyze (e.g., 'security audit', 'architecture review', 'performance optimization') */
  task: string;
  /** Object mapping file paths to their content */
  files: Record<string, string>;
  /** Specific areas to focus on (optional) */
  focus_areas?: string[];
}

export interface CodebaseAnalysis {
  analysis: string;
  patterns: string[];
  issues: string[];
  recommendations: string[];
  full_response: string;
}

// ========================================================================
// Tool Functions
// ========================================================================

/**
 * Use Sherlock Think Alpha (1.84M context) for deep analysis
 *
 * Use this for:
 * - Large codebase understanding
 * - Complex reasoning tasks
 * - Security analysis
 * - Architecture review
 *
 * @example
 * const result = await thinkDeep({
 *   prompt: 'What are the security vulnerabilities in this code?',
 *   context: entireCodebase,
 *   system_prompt: 'You are a security expert focusing on OWASP Top 10'
 * });
 */
export async function thinkDeep(input: ThinkDeepInput): Promise<string> {
  const result = await callMCPTool<{ type: string; text: string }[]>(
    SERVER_NAME,
    'think_deep',
    input
  );
  return result[0]?.text || '';
}

/**
 * Analyze entire codebase with structured output
 *
 * Returns patterns, issues, and recommendations with file locations.
 *
 * @example
 * const analysis = await analyzeCodebase({
 *   task: 'performance optimization',
 *   files: {
 *     'src/api/contacts.ts': contactsCode,
 *     'src/api/emails.ts': emailsCode
 *   },
 *   focus_areas: ['database queries', 'N+1 problems']
 * });
 *
 * console.log(analysis.issues); // Array of issues with file:line
 * console.log(analysis.recommendations); // Array of recommendations
 */
export async function analyzeCodebase(
  input: AnalyzeCodebaseInput
): Promise<CodebaseAnalysis> {
  const result = await callMCPTool<{ type: string; text: string }[]>(
    SERVER_NAME,
    'analyze_codebase',
    input
  );
  return JSON.parse(result[0]?.text || '{}');
}

// ========================================================================
// Convenience Functions (Context-Efficient Patterns)
// ========================================================================

/**
 * Quick security audit - filters and returns only critical findings
 *
 * @example
 * const critical = await quickSecurityAudit(files);
 * console.log(`Found ${critical.length} critical issues`);
 */
export async function quickSecurityAudit(
  files: Record<string, string>
): Promise<string[]> {
  const analysis = await analyzeCodebase({
    task: 'security audit',
    files,
    focus_areas: [
      'SQL injection',
      'XSS vulnerabilities',
      'Authentication bypass',
      'Sensitive data exposure',
      'CSRF',
    ],
  });

  // Filter to only critical issues
  return analysis.issues.filter(
    (issue) =>
      issue.toLowerCase().includes('critical') ||
      issue.toLowerCase().includes('high') ||
      issue.toLowerCase().includes('injection') ||
      issue.toLowerCase().includes('bypass')
  );
}

/**
 * Architecture review with summary
 *
 * @example
 * const { summary, patterns } = await architectureReview(files);
 */
export async function architectureReview(
  files: Record<string, string>
): Promise<{ summary: string; patterns: string[]; recommendations: string[] }> {
  const analysis = await analyzeCodebase({
    task: 'architecture review',
    files,
    focus_areas: [
      'Design patterns',
      'Separation of concerns',
      'Dependency management',
      'Scalability',
    ],
  });

  return {
    summary: analysis.analysis.slice(0, 500), // First 500 chars
    patterns: analysis.patterns,
    recommendations: analysis.recommendations,
  };
}

/**
 * Performance analysis with prioritized recommendations
 *
 * @example
 * const improvements = await performanceAnalysis(files);
 * // Returns only top 5 highest-impact improvements
 */
export async function performanceAnalysis(
  files: Record<string, string>
): Promise<string[]> {
  const analysis = await analyzeCodebase({
    task: 'performance optimization',
    files,
    focus_areas: [
      'N+1 queries',
      'Unnecessary re-renders',
      'Memory leaks',
      'Bundle size',
      'API latency',
    ],
  });

  // Return top 5 recommendations
  return analysis.recommendations.slice(0, 5);
}
