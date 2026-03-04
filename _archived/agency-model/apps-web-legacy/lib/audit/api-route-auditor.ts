/**
 * API Route Auditor - Autonomous Platform Audit System
 *
 * Audits all API routes for:
 * - Proper error handling
 * - Response format consistency
 * - Authentication/authorization checks
 * - Rate limiting
 * - Input validation
 * - Performance benchmarks
 */

import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";

// ============================================================================
// Types
// ============================================================================

export interface RouteDefinition {
  path: string;
  methods: HttpMethod[];
  file_path: string;
  has_auth?: boolean;
  has_validation?: boolean;
  has_error_handling?: boolean;
  has_rate_limiting?: boolean;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS";

export interface RouteAuditResult {
  route: RouteDefinition;
  audit_id: string;
  timestamp: string;
  status: "pass" | "fail" | "warning" | "error";
  checks: RouteCheck[];
  performance: PerformanceResult;
  issues: RouteIssue[];
  score: number; // 0-100
}

export interface RouteCheck {
  name: string;
  category: CheckCategory;
  status: "pass" | "fail" | "skip" | "warning";
  message: string;
  evidence?: string;
}

export type CheckCategory =
  | "security"
  | "validation"
  | "error_handling"
  | "performance"
  | "consistency"
  | "documentation";

export interface PerformanceResult {
  response_time_ms: number;
  response_size_bytes: number;
  time_to_first_byte_ms: number;
  status_code: number;
  headers: Record<string, string>;
}

export interface RouteIssue {
  severity: "critical" | "high" | "medium" | "low";
  category: CheckCategory;
  title: string;
  description: string;
  recommendation: string;
  line_number?: number;
}

export interface AuditReport {
  audit_id: string;
  started_at: string;
  completed_at: string;
  total_routes: number;
  routes_passed: number;
  routes_failed: number;
  routes_warning: number;
  average_score: number;
  results: RouteAuditResult[];
  summary: AuditSummary;
}

export interface AuditSummary {
  critical_issues: number;
  high_issues: number;
  medium_issues: number;
  low_issues: number;
  top_issues: RouteIssue[];
  routes_by_score: { route: string; score: number }[];
  recommendations: string[];
}

// ============================================================================
// Code Analysis Patterns
// ============================================================================

const CODE_PATTERNS = {
  // Error handling patterns
  hasTryCatch: /try\s*\{[\s\S]*?\}\s*catch/,
  hasErrorResponse: /NextResponse\.json\s*\(\s*\{[^}]*error/i,
  hasHandleApiError: /handleApiError/,

  // Auth patterns
  hasAuthCheck: /getServerSession|useAuth|auth\(\)|getSession/,
  hasRoleCheck: /role|permission|admin|user\.role/i,

  // Validation patterns
  hasZodValidation: /\.parse\(|\.safeParse\(/,
  hasInputValidation: /validate|Validator|Schema/,
  hasBodyParsing: /await\s+request\.json\(\)/,

  // Rate limiting
  hasRateLimit: /rateLimit|rateLimiter|upstash|redis/i,

  // Response patterns
  hasTypedResponse: /NextResponse<|Promise<NextResponse/,
  hasStatusCode: /status:\s*\d+|\{\s*status/,

  // Documentation
  hasJSDoc: /\/\*\*[\s\S]*?\*\//,
  hasOpenAPI: /@openapi|@swagger|@api/i,
};

// ============================================================================
// API Route Auditor
// ============================================================================

export class APIRouteAuditor {
  private readonly auditorId: string;
  private readonly baseUrl: string;
  private routes: RouteDefinition[] = [];

  constructor(options?: { baseUrl?: string }) {
    this.auditorId = `route_auditor_${uuidv4().slice(0, 8)}`;
    this.baseUrl = options?.baseUrl || "http://localhost:3000";
  }

  getAuditorId(): string {
    return this.auditorId;
  }

  /**
   * Discover API routes from the filesystem
   */
  async discoverRoutes(apiDir: string): Promise<RouteDefinition[]> {
    this.routes = [];
    await this.scanDirectory(apiDir, "/api");
    return this.routes;
  }

  /**
   * Recursively scan directory for route files
   */
  private async scanDirectory(dir: string, basePath: string): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Handle dynamic routes
          let routeSegment = entry.name;
          if (entry.name.startsWith("[") && entry.name.endsWith("]")) {
            routeSegment = `:${entry.name.slice(1, -1)}`;
          }
          await this.scanDirectory(fullPath, `${basePath}/${routeSegment}`);
        } else if (entry.name === "route.ts" || entry.name === "route.js") {
          const content = await fs.readFile(fullPath, "utf-8");
          const methods = this.extractMethods(content);
          const route = this.analyzeRouteCode(content, basePath, fullPath, methods);
          this.routes.push(route);
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }
  }

  /**
   * Extract HTTP methods from route file
   */
  private extractMethods(content: string): HttpMethod[] {
    const methods: HttpMethod[] = [];

    if (content.includes("export async function GET") || content.includes("export function GET")) {
      methods.push("GET");
    }
    if (content.includes("export async function POST") || content.includes("export function POST")) {
      methods.push("POST");
    }
    if (content.includes("export async function PUT") || content.includes("export function PUT")) {
      methods.push("PUT");
    }
    if (content.includes("export async function PATCH") || content.includes("export function PATCH")) {
      methods.push("PATCH");
    }
    if (content.includes("export async function DELETE") || content.includes("export function DELETE")) {
      methods.push("DELETE");
    }
    if (content.includes("export async function OPTIONS") || content.includes("export function OPTIONS")) {
      methods.push("OPTIONS");
    }

    return methods;
  }

  /**
   * Analyze route code for patterns
   */
  private analyzeRouteCode(
    content: string,
    routePath: string,
    filePath: string,
    methods: HttpMethod[]
  ): RouteDefinition {
    return {
      path: routePath,
      methods,
      file_path: filePath,
      has_auth: CODE_PATTERNS.hasAuthCheck.test(content),
      has_validation:
        CODE_PATTERNS.hasZodValidation.test(content) ||
        CODE_PATTERNS.hasInputValidation.test(content),
      has_error_handling:
        CODE_PATTERNS.hasTryCatch.test(content) ||
        CODE_PATTERNS.hasHandleApiError.test(content),
      has_rate_limiting: CODE_PATTERNS.hasRateLimit.test(content),
    };
  }

  /**
   * Audit a single route
   */
  async auditRoute(route: RouteDefinition): Promise<RouteAuditResult> {
    const auditId = `audit_${uuidv4().slice(0, 8)}`;
    const checks: RouteCheck[] = [];
    const issues: RouteIssue[] = [];

    // Read route file for detailed analysis
    let content = "";
    try {
      content = await fs.readFile(route.file_path, "utf-8");
    } catch {
      return {
        route,
        audit_id: auditId,
        timestamp: new Date().toISOString(),
        status: "error",
        checks: [],
        performance: {
          response_time_ms: 0,
          response_size_bytes: 0,
          time_to_first_byte_ms: 0,
          status_code: 0,
          headers: {},
        },
        issues: [
          {
            severity: "critical",
            category: "error_handling",
            title: "Cannot read route file",
            description: `Failed to read ${route.file_path}`,
            recommendation: "Verify file exists and has correct permissions",
          },
        ],
        score: 0,
      };
    }

    // Run all checks
    this.checkErrorHandling(content, checks, issues);
    this.checkValidation(content, route, checks, issues);
    this.checkSecurity(content, route, checks, issues);
    this.checkConsistency(content, checks, issues);
    this.checkDocumentation(content, checks, issues);

    // Test route performance (GET only)
    const performance = await this.testRoutePerformance(route);
    this.checkPerformance(performance, checks, issues);

    // Calculate score
    const passedChecks = checks.filter((c) => c.status === "pass").length;
    const totalChecks = checks.filter((c) => c.status !== "skip").length;
    const score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;

    // Determine overall status
    let status: RouteAuditResult["status"] = "pass";
    if (issues.some((i) => i.severity === "critical")) {
      status = "error";
    } else if (issues.some((i) => i.severity === "high")) {
      status = "fail";
    } else if (issues.some((i) => i.severity === "medium")) {
      status = "warning";
    }

    return {
      route,
      audit_id: auditId,
      timestamp: new Date().toISOString(),
      status,
      checks,
      performance,
      issues,
      score,
    };
  }

  /**
   * Check error handling patterns
   */
  private checkErrorHandling(
    content: string,
    checks: RouteCheck[],
    issues: RouteIssue[]
  ): void {
    // Check for try-catch
    const hasTryCatch = CODE_PATTERNS.hasTryCatch.test(content);
    checks.push({
      name: "Has try-catch block",
      category: "error_handling",
      status: hasTryCatch ? "pass" : "fail",
      message: hasTryCatch
        ? "Route uses try-catch for error handling"
        : "Route missing try-catch block",
    });

    if (!hasTryCatch) {
      issues.push({
        severity: "high",
        category: "error_handling",
        title: "Missing error handling",
        description: "Route does not have try-catch block",
        recommendation: "Wrap route handler in try-catch and return appropriate error responses",
      });
    }

    // Check for handleApiError utility
    const hasErrorHandler = CODE_PATTERNS.hasHandleApiError.test(content);
    checks.push({
      name: "Uses centralized error handler",
      category: "error_handling",
      status: hasErrorHandler ? "pass" : "warning",
      message: hasErrorHandler
        ? "Uses handleApiError utility"
        : "Not using centralized error handler",
    });
  }

  /**
   * Check validation patterns
   */
  private checkValidation(
    content: string,
    route: RouteDefinition,
    checks: RouteCheck[],
    issues: RouteIssue[]
  ): void {
    const needsValidation = route.methods.some((m) =>
      ["POST", "PUT", "PATCH"].includes(m)
    );

    if (!needsValidation) {
      checks.push({
        name: "Input validation",
        category: "validation",
        status: "skip",
        message: "GET/DELETE routes - validation check skipped",
      });
      return;
    }

    const hasValidation = CODE_PATTERNS.hasZodValidation.test(content);
    checks.push({
      name: "Input validation with Zod",
      category: "validation",
      status: hasValidation ? "pass" : "fail",
      message: hasValidation
        ? "Route validates input with Zod"
        : "Route missing input validation",
    });

    if (!hasValidation) {
      issues.push({
        severity: "high",
        category: "validation",
        title: "Missing input validation",
        description: "POST/PUT/PATCH route does not validate input",
        recommendation: "Use Zod schema to validate request body",
      });
    }
  }

  /**
   * Check security patterns
   */
  private checkSecurity(
    content: string,
    route: RouteDefinition,
    checks: RouteCheck[],
    issues: RouteIssue[]
  ): void {
    // Check for auth
    const hasAuth = CODE_PATTERNS.hasAuthCheck.test(content);
    checks.push({
      name: "Authentication check",
      category: "security",
      status: hasAuth ? "pass" : "warning",
      message: hasAuth ? "Route checks authentication" : "No authentication check found",
    });

    // Check for rate limiting on public routes
    const hasRateLimit = CODE_PATTERNS.hasRateLimit.test(content);
    if (!hasAuth && !hasRateLimit) {
      issues.push({
        severity: "medium",
        category: "security",
        title: "Public route without rate limiting",
        description: "Unauthenticated route should have rate limiting",
        recommendation: "Add rate limiting to prevent abuse",
      });
    }

    checks.push({
      name: "Rate limiting",
      category: "security",
      status: hasRateLimit ? "pass" : hasAuth ? "skip" : "warning",
      message: hasRateLimit
        ? "Route has rate limiting"
        : hasAuth
          ? "Auth-protected route - rate limiting optional"
          : "Public route without rate limiting",
    });
  }

  /**
   * Check consistency patterns
   */
  private checkConsistency(
    content: string,
    checks: RouteCheck[],
    issues: RouteIssue[]
  ): void {
    // Check for typed response
    const hasTypedResponse = CODE_PATTERNS.hasTypedResponse.test(content);
    checks.push({
      name: "Typed response",
      category: "consistency",
      status: hasTypedResponse ? "pass" : "warning",
      message: hasTypedResponse
        ? "Route has typed response"
        : "Response type not specified",
    });

    if (!hasTypedResponse) {
      issues.push({
        severity: "low",
        category: "consistency",
        title: "Untyped response",
        description: "Route handler does not specify response type",
        recommendation: "Add return type annotation to handler function",
      });
    }

    // Check for consistent status codes
    const hasStatusCode = CODE_PATTERNS.hasStatusCode.test(content);
    checks.push({
      name: "Explicit status codes",
      category: "consistency",
      status: hasStatusCode ? "pass" : "warning",
      message: hasStatusCode
        ? "Uses explicit status codes"
        : "Status codes not explicitly set",
    });
  }

  /**
   * Check documentation
   */
  private checkDocumentation(
    content: string,
    checks: RouteCheck[],
    issues: RouteIssue[]
  ): void {
    const hasJSDoc = CODE_PATTERNS.hasJSDoc.test(content);
    checks.push({
      name: "JSDoc documentation",
      category: "documentation",
      status: hasJSDoc ? "pass" : "warning",
      message: hasJSDoc ? "Route has JSDoc documentation" : "Missing JSDoc documentation",
    });

    if (!hasJSDoc) {
      issues.push({
        severity: "low",
        category: "documentation",
        title: "Missing documentation",
        description: "Route handler is not documented",
        recommendation: "Add JSDoc comments describing endpoint purpose and parameters",
      });
    }
  }

  /**
   * Test route performance
   */
  private async testRoutePerformance(
    route: RouteDefinition
  ): Promise<PerformanceResult> {
    // Only test GET endpoints for safety
    if (!route.methods.includes("GET")) {
      return {
        response_time_ms: 0,
        response_size_bytes: 0,
        time_to_first_byte_ms: 0,
        status_code: 0,
        headers: {},
      };
    }

    const url = `${this.baseUrl}${route.path}`;
    const startTime = performance.now();

    try {
      const response = await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(10000),
      });

      const ttfb = performance.now() - startTime;
      const body = await response.text();
      const totalTime = performance.now() - startTime;

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      return {
        response_time_ms: Math.round(totalTime),
        response_size_bytes: Buffer.byteLength(body, "utf8"),
        time_to_first_byte_ms: Math.round(ttfb),
        status_code: response.status,
        headers,
      };
    } catch {
      return {
        response_time_ms: 0,
        response_size_bytes: 0,
        time_to_first_byte_ms: 0,
        status_code: 0,
        headers: {},
      };
    }
  }

  /**
   * Check performance metrics
   */
  private checkPerformance(
    perf: PerformanceResult,
    checks: RouteCheck[],
    issues: RouteIssue[]
  ): void {
    if (perf.status_code === 0) {
      checks.push({
        name: "Performance test",
        category: "performance",
        status: "skip",
        message: "Could not test performance (non-GET or unreachable)",
      });
      return;
    }

    // Response time check
    const responseTimeOk = perf.response_time_ms < 1000;
    checks.push({
      name: "Response time < 1s",
      category: "performance",
      status: responseTimeOk ? "pass" : "warning",
      message: `Response time: ${perf.response_time_ms}ms`,
    });

    if (!responseTimeOk) {
      issues.push({
        severity: perf.response_time_ms > 3000 ? "high" : "medium",
        category: "performance",
        title: "Slow response time",
        description: `Response takes ${perf.response_time_ms}ms`,
        recommendation: "Investigate slow queries, add caching, or optimize logic",
      });
    }

    // Status code check
    const statusOk = perf.status_code >= 200 && perf.status_code < 400;
    checks.push({
      name: "Successful response",
      category: "performance",
      status: statusOk ? "pass" : "fail",
      message: `Status code: ${perf.status_code}`,
    });
  }

  /**
   * Audit all discovered routes
   */
  async auditAll(): Promise<AuditReport> {
    const startedAt = new Date().toISOString();
    const results: RouteAuditResult[] = [];

    for (const route of this.routes) {
      const result = await this.auditRoute(route);
      results.push(result);
    }

    const completedAt = new Date().toISOString();

    const passed = results.filter((r) => r.status === "pass").length;
    const failed = results.filter((r) => r.status === "fail" || r.status === "error").length;
    const warning = results.filter((r) => r.status === "warning").length;

    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const avgScore = results.length > 0 ? Math.round(totalScore / results.length) : 0;

    // Collect all issues
    const allIssues = results.flatMap((r) => r.issues);
    const criticalCount = allIssues.filter((i) => i.severity === "critical").length;
    const highCount = allIssues.filter((i) => i.severity === "high").length;
    const mediumCount = allIssues.filter((i) => i.severity === "medium").length;
    const lowCount = allIssues.filter((i) => i.severity === "low").length;

    // Top issues (critical and high)
    const topIssues = allIssues
      .filter((i) => i.severity === "critical" || i.severity === "high")
      .slice(0, 10);

    // Routes sorted by score
    const routesByScore = results
      .map((r) => ({ route: r.route.path, score: r.score }))
      .sort((a, b) => a.score - b.score);

    // Generate recommendations
    const recommendations = this.generateRecommendations(allIssues);

    return {
      audit_id: `audit_${uuidv4().slice(0, 8)}`,
      started_at: startedAt,
      completed_at: completedAt,
      total_routes: this.routes.length,
      routes_passed: passed,
      routes_failed: failed,
      routes_warning: warning,
      average_score: avgScore,
      results,
      summary: {
        critical_issues: criticalCount,
        high_issues: highCount,
        medium_issues: mediumCount,
        low_issues: lowCount,
        top_issues: topIssues,
        routes_by_score: routesByScore,
        recommendations,
      },
    };
  }

  /**
   * Generate recommendations from issues
   */
  private generateRecommendations(issues: RouteIssue[]): string[] {
    const recommendations: string[] = [];
    const seenCategories = new Set<string>();

    for (const issue of issues) {
      if (!seenCategories.has(issue.category)) {
        seenCategories.add(issue.category);
        recommendations.push(issue.recommendation);
      }
    }

    return recommendations.slice(0, 5);
  }
}

export default APIRouteAuditor;
