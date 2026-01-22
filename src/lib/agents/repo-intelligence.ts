/**
 * Repo Intelligence Agent
 *
 * AI-powered repository analysis agent using Claude Opus 4.5 for:
 * - Codebase analysis and architecture insights
 * - Issue triage and prioritization
 * - PR review summaries
 * - Technical debt identification
 * - Security vulnerability detection
 *
 * @model Claude Opus 4.5 with Extended Thinking
 * @see spec: .claude/plans/SPEC-2026-01-23.md
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  CLAUDE_MODELS,
  createCacheableSystemPrompt,
  withThinking,
  THINKING_BUDGETS,
} from "@/lib/anthropic/features";
import { supabaseAdmin } from "@/lib/supabase";
import {
  createGitHubOAuthClient,
  listRepoIssues,
  listRepoPullRequests,
  type GitHubIssue,
  type GitHubPullRequest,
} from "@/lib/integrations/github";

// ============================================================================
// Types
// ============================================================================

export interface RepoAnalysisRequest {
  workspaceId: string;
  repoId: string;
  analysisType:
    | "issues"
    | "pull_requests"
    | "architecture"
    | "security"
    | "health";
  options?: {
    depth?: "quick" | "standard" | "deep";
    focusAreas?: string[];
  };
}

export interface IssueAnalysis {
  id: number;
  number: number;
  title: string;
  aiPriority: "critical" | "high" | "medium" | "low";
  aiCategory: string;
  aiSummary: string;
  suggestedLabels: string[];
  estimatedEffort: "trivial" | "small" | "medium" | "large" | "epic";
  relatedIssues?: number[];
}

export interface PRAnalysis {
  id: number;
  number: number;
  title: string;
  aiSummary: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  codeQualityNotes: string[];
  suggestedReviewers?: string[];
  potentialIssues: string[];
  testingRecommendations: string[];
}

export interface RepoHealthReport {
  overallScore: number;
  metrics: {
    issueVelocity: number;
    prMergeRate: number;
    avgIssueAge: number;
    avgPrAge: number;
    contributorActivity: number;
  };
  insights: string[];
  recommendations: string[];
  riskAreas: Array<{
    area: string;
    severity: "low" | "medium" | "high";
    description: string;
  }>;
}

// ============================================================================
// Agent Configuration
// ============================================================================

const REPO_INTELLIGENCE_SYSTEM_PROMPT = `You are a senior software architect and code intelligence analyst. Your task is to analyze GitHub repository data and provide actionable insights.

## Your Capabilities:
1. **Issue Triage**: Analyze issues, determine priority, categorize, and estimate effort
2. **PR Analysis**: Review PR summaries, identify risks, suggest improvements
3. **Architecture Insights**: Identify patterns, technical debt, and improvement opportunities
4. **Health Assessment**: Evaluate repository health and team velocity

## Issue Priority Guidelines:
- **Critical**: Security vulnerabilities, data loss risks, production outages
- **High**: Major bugs affecting many users, blocking features, performance issues
- **Medium**: Regular bugs, enhancements, improvements
- **Low**: Nice-to-haves, documentation, minor UX tweaks

## Category Guidelines:
- bug, feature, enhancement, documentation, security, performance, refactoring, testing, infrastructure, dependencies

## Output Format:
Provide structured JSON responses that can be parsed programmatically.
Be concise but thorough. Focus on actionable insights.

## Important:
- Prioritize security issues above all else
- Consider business impact when prioritizing
- Identify patterns across multiple issues
- Suggest automation opportunities`;

// Lazy Anthropic client
let anthropicClient: Anthropic | null = null;
let anthropicClientTimestamp = 0;
const ANTHROPIC_CLIENT_TTL = 60000;

function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - anthropicClientTimestamp > ANTHROPIC_CLIENT_TTL) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    anthropicClientTimestamp = now;
  }
  return anthropicClient;
}

// ============================================================================
// Analysis Functions
// ============================================================================

/**
 * Analyze and triage repository issues
 */
export async function analyzeIssues(
  request: RepoAnalysisRequest
): Promise<IssueAnalysis[]> {
  const { workspaceId, repoId, options = {} } = request;
  const depth = options.depth || "standard";

  console.log(`[RepoIntelligence] Analyzing issues for repo ${repoId}`);

  // Get repo and token
  const { data: repo } = await supabaseAdmin
    .from("founder_github_repos")
    .select("*")
    .eq("id", repoId)
    .eq("workspace_id", workspaceId)
    .single();

  if (!repo) {
    throw new Error("Repository not found");
  }

  // Create GitHub client
  const accessToken = Buffer.from(repo.access_token_encrypted, "base64").toString();
  const octokit = createGitHubOAuthClient(accessToken);

  // Fetch issues
  const issues = await listRepoIssues(
    octokit,
    repo.repo_owner,
    repo.repo_name,
    "open"
  );

  if (issues.length === 0) {
    return [];
  }

  // Prepare issues for analysis
  const issuesContext = issues
    .slice(0, depth === "deep" ? 50 : depth === "standard" ? 20 : 10)
    .map((issue) => ({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      body: issue.body?.slice(0, 1000) || "",
      labels: issue.labels.map((l) => l.name),
      created_at: issue.created_at,
      state: issue.state,
    }));

  // Call Claude for analysis
  const client = getAnthropicClient();

  const thinkingBudget =
    depth === "deep"
      ? THINKING_BUDGETS.COMPLEX
      : depth === "quick"
        ? THINKING_BUDGETS.MINIMAL
        : THINKING_BUDGETS.STANDARD;

  const systemPrompt = createCacheableSystemPrompt([
    { text: REPO_INTELLIGENCE_SYSTEM_PROMPT, cache: true, ttl: "1h" },
  ]);

  const messageParams = withThinking(
    {
      model: CLAUDE_MODELS.OPUS_4_5,
      max_tokens: 8192,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Analyze these GitHub issues and provide triage recommendations.

Repository: ${repo.full_name}
Language: ${repo.language || "Unknown"}

Issues to analyze:
${JSON.stringify(issuesContext, null, 2)}

For each issue, provide:
1. AI Priority (critical/high/medium/low)
2. Category (bug/feature/enhancement/documentation/security/etc)
3. Brief summary (1-2 sentences)
4. Suggested labels
5. Estimated effort (trivial/small/medium/large/epic)
6. Related issues (by number, if any seem related)

Respond with a JSON array of analysis objects matching this structure:
{
  "analyses": [
    {
      "id": <issue_id>,
      "number": <issue_number>,
      "title": "<issue_title>",
      "aiPriority": "high",
      "aiCategory": "bug",
      "aiSummary": "...",
      "suggestedLabels": ["bug", "needs-triage"],
      "estimatedEffort": "medium",
      "relatedIssues": [123, 456]
    }
  ]
}`,
        },
      ],
    },
    thinkingBudget
  );

  const response = await client.messages.create(messageParams);

  // Extract text response
  const textContent = response.content.find((block) => block.type === "text");
  const analysisText = textContent?.type === "text" ? textContent.text : "";

  // Parse JSON response
  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = analysisText.match(/```(?:json)?\s*([\s\S]*?)```/) ||
      analysisText.match(/\{[\s\S]*"analyses"[\s\S]*\}/);

    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : analysisText;
    const parsed = JSON.parse(jsonStr);
    const analyses: IssueAnalysis[] = parsed.analyses || [];

    // Store analyses in database
    for (const analysis of analyses) {
      await supabaseAdmin
        .from("founder_repo_items")
        .update({
          ai_summary: analysis.aiSummary,
          ai_priority: analysis.aiPriority,
          ai_category: analysis.aiCategory,
          ai_analyzed_at: new Date().toISOString(),
        })
        .eq("repo_id", repoId)
        .eq("github_item_id", analysis.id);
    }

    return analyses;
  } catch (error) {
    console.error("[RepoIntelligence] Failed to parse analysis:", error);
    throw new Error("Failed to parse issue analysis");
  }
}

/**
 * Analyze repository pull requests
 */
export async function analyzePullRequests(
  request: RepoAnalysisRequest
): Promise<PRAnalysis[]> {
  const { workspaceId, repoId, options = {} } = request;
  const depth = options.depth || "standard";

  console.log(`[RepoIntelligence] Analyzing PRs for repo ${repoId}`);

  // Get repo and token
  const { data: repo } = await supabaseAdmin
    .from("founder_github_repos")
    .select("*")
    .eq("id", repoId)
    .eq("workspace_id", workspaceId)
    .single();

  if (!repo) {
    throw new Error("Repository not found");
  }

  // Create GitHub client
  const accessToken = Buffer.from(repo.access_token_encrypted, "base64").toString();
  const octokit = createGitHubOAuthClient(accessToken);

  // Fetch PRs
  const prs = await listRepoPullRequests(
    octokit,
    repo.repo_owner,
    repo.repo_name,
    "open"
  );

  if (prs.length === 0) {
    return [];
  }

  // Prepare PRs for analysis
  const prsContext = prs
    .slice(0, depth === "deep" ? 20 : depth === "standard" ? 10 : 5)
    .map((pr) => ({
      id: pr.id,
      number: pr.number,
      title: pr.title,
      body: pr.body?.slice(0, 1500) || "",
      labels: pr.labels.map((l) => l.name),
      head_branch: pr.head.ref,
      base_branch: pr.base.ref,
      draft: pr.draft,
      created_at: pr.created_at,
      user: pr.user.login,
    }));

  // Call Claude for analysis
  const client = getAnthropicClient();

  const systemPrompt = createCacheableSystemPrompt([
    { text: REPO_INTELLIGENCE_SYSTEM_PROMPT, cache: true, ttl: "1h" },
  ]);

  const messageParams = withThinking(
    {
      model: CLAUDE_MODELS.OPUS_4_5,
      max_tokens: 8192,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Analyze these GitHub pull requests and provide review insights.

Repository: ${repo.full_name}
Language: ${repo.language || "Unknown"}

Pull Requests to analyze:
${JSON.stringify(prsContext, null, 2)}

For each PR, provide:
1. Brief summary of changes
2. Risk level (low/medium/high/critical)
3. Code quality notes
4. Potential issues to watch for
5. Testing recommendations

Respond with a JSON array:
{
  "analyses": [
    {
      "id": <pr_id>,
      "number": <pr_number>,
      "title": "<pr_title>",
      "aiSummary": "...",
      "riskLevel": "medium",
      "codeQualityNotes": ["..."],
      "potentialIssues": ["..."],
      "testingRecommendations": ["..."]
    }
  ]
}`,
        },
      ],
    },
    THINKING_BUDGETS.STANDARD
  );

  const response = await client.messages.create(messageParams);

  // Extract and parse response
  const textContent = response.content.find((block) => block.type === "text");
  const analysisText = textContent?.type === "text" ? textContent.text : "";

  try {
    const jsonMatch = analysisText.match(/```(?:json)?\s*([\s\S]*?)```/) ||
      analysisText.match(/\{[\s\S]*"analyses"[\s\S]*\}/);

    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : analysisText;
    const parsed = JSON.parse(jsonStr);
    const analyses: PRAnalysis[] = parsed.analyses || [];

    // Store analyses in database
    for (const analysis of analyses) {
      await supabaseAdmin
        .from("founder_repo_items")
        .update({
          ai_summary: analysis.aiSummary,
          ai_priority: analysis.riskLevel === "critical" ? "critical" :
                       analysis.riskLevel === "high" ? "high" : "medium",
          ai_analyzed_at: new Date().toISOString(),
        })
        .eq("repo_id", repoId)
        .eq("github_item_id", analysis.id);
    }

    return analyses;
  } catch (error) {
    console.error("[RepoIntelligence] Failed to parse PR analysis:", error);
    throw new Error("Failed to parse PR analysis");
  }
}

/**
 * Generate repository health report
 */
export async function generateHealthReport(
  request: RepoAnalysisRequest
): Promise<RepoHealthReport> {
  const { workspaceId, repoId } = request;

  console.log(`[RepoIntelligence] Generating health report for repo ${repoId}`);

  // Get repo data
  const { data: repo } = await supabaseAdmin
    .from("founder_github_repos")
    .select("*")
    .eq("id", repoId)
    .eq("workspace_id", workspaceId)
    .single();

  if (!repo) {
    throw new Error("Repository not found");
  }

  // Get recent metrics
  const { data: metrics } = await supabaseAdmin
    .from("founder_repo_metrics")
    .select("*")
    .eq("repo_id", repoId)
    .order("metric_date", { ascending: false })
    .limit(30);

  // Get cached issues and PRs
  const { data: items } = await supabaseAdmin
    .from("founder_repo_items")
    .select("*")
    .eq("repo_id", repoId);

  const issues = items?.filter((i) => i.item_type === "issue") || [];
  const prs = items?.filter((i) => i.item_type === "pull_request") || [];

  // Calculate metrics
  const openIssues = issues.filter((i) => i.state === "open").length;
  const closedIssues = issues.filter((i) => i.state === "closed").length;
  const openPrs = prs.filter((p) => p.state === "open").length;
  const mergedPrs = prs.filter((p) => p.state === "merged").length;

  // Calculate average ages
  const now = new Date();
  const avgIssueAge = openIssues > 0
    ? issues
        .filter((i) => i.state === "open")
        .reduce((sum, i) => {
          const created = new Date(i.github_created_at);
          return sum + (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        }, 0) / openIssues
    : 0;

  const avgPrAge = openPrs > 0
    ? prs
        .filter((p) => p.state === "open")
        .reduce((sum, p) => {
          const created = new Date(p.github_created_at);
          return sum + (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        }, 0) / openPrs
    : 0;

  // Generate AI insights
  const client = getAnthropicClient();

  const systemPrompt = createCacheableSystemPrompt([
    { text: REPO_INTELLIGENCE_SYSTEM_PROMPT, cache: true, ttl: "1h" },
  ]);

  const contextData = {
    repo: {
      name: repo.full_name,
      language: repo.language,
      stars: repo.stars_count,
      forks: repo.forks_count,
      size_kb: repo.size_kb,
    },
    stats: {
      openIssues,
      closedIssues,
      openPrs,
      mergedPrs,
      avgIssueAgeDays: Math.round(avgIssueAge),
      avgPrAgeDays: Math.round(avgPrAge),
    },
    recentMetrics: metrics?.slice(0, 7) || [],
  };

  const messageParams = withThinking(
    {
      model: CLAUDE_MODELS.OPUS_4_5,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Generate a repository health assessment based on this data:

${JSON.stringify(contextData, null, 2)}

Provide:
1. Overall health score (0-100)
2. Key insights (3-5 points)
3. Recommendations for improvement (3-5 points)
4. Risk areas with severity

Respond with JSON:
{
  "overallScore": 75,
  "insights": ["..."],
  "recommendations": ["..."],
  "riskAreas": [
    {"area": "...", "severity": "medium", "description": "..."}
  ]
}`,
        },
      ],
    },
    THINKING_BUDGETS.STANDARD
  );

  const response = await client.messages.create(messageParams);

  // Extract and parse response
  const textContent = response.content.find((block) => block.type === "text");
  const analysisText = textContent?.type === "text" ? textContent.text : "";

  try {
    const jsonMatch = analysisText.match(/```(?:json)?\s*([\s\S]*?)```/) ||
      analysisText.match(/\{[\s\S]*"overallScore"[\s\S]*\}/);

    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : analysisText;
    const parsed = JSON.parse(jsonStr);

    return {
      overallScore: parsed.overallScore || 50,
      metrics: {
        issueVelocity: closedIssues / Math.max(openIssues + closedIssues, 1),
        prMergeRate: mergedPrs / Math.max(openPrs + mergedPrs, 1),
        avgIssueAge,
        avgPrAge,
        contributorActivity: repo.watchers_count,
      },
      insights: parsed.insights || [],
      recommendations: parsed.recommendations || [],
      riskAreas: parsed.riskAreas || [],
    };
  } catch (error) {
    console.error("[RepoIntelligence] Failed to parse health report:", error);

    // Return basic report on parse failure
    return {
      overallScore: 50,
      metrics: {
        issueVelocity: closedIssues / Math.max(openIssues + closedIssues, 1),
        prMergeRate: mergedPrs / Math.max(openPrs + mergedPrs, 1),
        avgIssueAge,
        avgPrAge,
        contributorActivity: repo.watchers_count,
      },
      insights: ["Analysis pending - please retry"],
      recommendations: [],
      riskAreas: [],
    };
  }
}

/**
 * Main entry point for repo analysis
 */
export async function executeRepoAnalysis(
  request: RepoAnalysisRequest
): Promise<{
  type: string;
  issues?: IssueAnalysis[];
  pullRequests?: PRAnalysis[];
  health?: RepoHealthReport;
}> {
  const { analysisType } = request;

  switch (analysisType) {
    case "issues":
      return {
        type: "issues",
        issues: await analyzeIssues(request),
      };

    case "pull_requests":
      return {
        type: "pull_requests",
        pullRequests: await analyzePullRequests(request),
      };

    case "health":
      return {
        type: "health",
        health: await generateHealthReport(request),
      };

    default:
      throw new Error(`Unknown analysis type: ${analysisType}`);
  }
}
