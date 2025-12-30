/**
 * Code Review Agent
 * Automatically reviews pull requests and code changes
 *
 * Part of Agentic Layer Phase 4 - Self-Improving Agents
 */

import { BaseAgent, AgentTask, AgentConfig } from './base-agent';
import { getAnthropicClient } from '@/lib/anthropic/lazy-client';

export interface CodeReviewRequest {
  files: string[];
  diff?: string;
  prNumber?: number;
  standards?: string[]; // Which .claude/rules/*.md to check
}

export interface CodeReviewResult {
  approval: 'APPROVED' | 'NEEDS_CHANGES' | 'REJECTED';
  violations: Array<{
    file: string;
    line?: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    rule: string;
    message: string;
    suggestion?: string;
  }>;
  autoFixable: Array<{
    file: string;
    fix: string;
    description: string;
  }>;
  summary: string;
  confidence: number;
}

export class CodeReviewerAgent extends BaseAgent {
  constructor() {
    super({
      name: 'CodeReviewerAgent',
      queueName: 'code-reviewer-queue',
      concurrency: 2 // Can review multiple PRs
    });
  }

  protected async processTask(task: AgentTask): Promise<CodeReviewResult> {
    const request = task.payload as CodeReviewRequest;
    const client = getAnthropicClient();

    // 1. Load relevant standards
    const standards = await this.loadStandards(request.standards || ['core-architecture', 'api-routes', 'ai-agents']);

    // 2. Review code with Claude
    const review = await this.reviewCode(client, request, standards);

    // 3. Check for auto-fixable issues
    const autoFixable = await this.findAutoFixableIssues(review.violations);

    // 4. Determine approval status
    const criticalViolations = review.violations.filter(v => v.severity === 'critical');
    const highViolations = review.violations.filter(v => v.severity === 'high');

    let approval: CodeReviewResult['approval'] = 'APPROVED';
    if (criticalViolations.length > 0) {
      approval = 'REJECTED';
    } else if (highViolations.length > 0) {
      approval = 'NEEDS_CHANGES';
    }

    return {
      approval,
      violations: review.violations,
      autoFixable,
      summary: review.summary,
      confidence: review.confidence
    };
  }

  /**
   * Load coding standards from .claude/rules/
   */
  private async loadStandards(standardFiles: string[]): Promise<string> {
    // In production, would read from .claude/rules/*.md
    // For now, return key standards
    return `
Multi-tenant isolation: ALL queries filter by workspace_id
API routes: Use withErrorBoundary + validateUserAndWorkspace
Agents: Extend BaseAgent, implement processTask
Testing: 100% pass rate required
Documentation: Update .claude/CLAUDE.md when changing architecture
`.trim();
  }

  /**
   * Review code using Claude
   */
  private async reviewCode(
    client: any,
    request: CodeReviewRequest,
    standards: string
  ): Promise<{
    violations: CodeReviewResult['violations'];
    summary: string;
    confidence: number;
  }> {
    const prompt = `
You are a code reviewer for Unite-Hub. Review these changes:

Files changed: ${request.files.join(', ')}
${request.diff ? `Diff:\n${request.diff}` : ''}

Check against these standards:
${standards}

Look for:
- Missing workspace_id filters (CRITICAL)
- Missing error handling
- No tests for new code
- Outdated documentation
- Security vulnerabilities
- Performance issues
- Code smells (long functions, duplicates)

Return JSON:
{
  "violations": [
    {
      "file": "path/to/file",
      "line": 42,
      "severity": "critical|high|medium|low",
      "rule": "workspace_isolation",
      "message": "Query missing workspace_id filter",
      "suggestion": "Add .eq('workspace_id', workspaceId)"
    }
  ],
  "summary": "Overall assessment",
  "confidence": 0.9
}`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }]
    });

    try {
      const result = JSON.parse(response.content[0].text);
      return result;
    } catch (err) {
      // Fallback if JSON parsing fails
      return {
        violations: [],
        summary: response.content[0].text,
        confidence: 0.5
      };
    }
  }

  /**
   * Find issues that can be auto-fixed
   */
  private async findAutoFixableIssues(
    violations: CodeReviewResult['violations']
  ): Promise<CodeReviewResult['autoFixable']> {
    // Auto-fixable: low severity + has suggestion
    return violations
      .filter(v => v.severity === 'low' && v.suggestion)
      .map(v => ({
        file: v.file,
        fix: v.suggestion || '',
        description: v.message
      }));
  }
}

// Singleton
let instance: CodeReviewerAgent | null = null;

export function getCodeReviewerAgent(): CodeReviewerAgent {
  if (!instance) {
    instance = new CodeReviewerAgent();
  }
  return instance;
}
