/**
 * Business Health Monitor Agent
 *
 * AI-powered business health monitoring using Claude Haiku 4.5 for:
 * - Cross-business health assessment
 * - Revenue/growth anomaly detection
 * - Risk early warning signals
 * - Automated insight generation
 *
 * Integrates with Cognitive Twin for deeper analysis.
 *
 * @model Claude Haiku 4.5 (fast, cost-effective)
 * @see spec: .claude/plans/SPEC-2026-01-23.md
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  CLAUDE_MODELS,
  createCacheableSystemPrompt,
} from "@/lib/anthropic/features";
import { supabaseAdmin } from "@/lib/supabase";

// ============================================================================
// Types
// ============================================================================

export interface HealthCheckRequest {
  userId: string;
  businessId?: string; // Optional - if not provided, checks all businesses
  checkType: "full" | "quick" | "anomaly";
}

export interface HealthCheckResult {
  businessId: string;
  businessName: string;
  overallScore: number;
  riskScore: number;
  growthScore: number;
  status: "excellent" | "good" | "attention" | "critical";
  insights: string[];
  alerts: Array<{
    type: "warning" | "danger" | "info";
    message: string;
    metric?: string;
    value?: number;
  }>;
  recommendations: string[];
  checkedAt: string;
}

export interface AnomalyDetection {
  businessId: string;
  metric: string;
  currentValue: number;
  expectedValue: number;
  deviation: number;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
}

// ============================================================================
// Agent Configuration
// ============================================================================

const HEALTH_MONITOR_SYSTEM_PROMPT = `You are a business health monitoring AI assistant. Your role is to analyze business metrics and provide actionable health assessments.

## Your Responsibilities:
1. Analyze revenue, customer, and engagement metrics
2. Identify anomalies and concerning trends
3. Calculate health and risk scores
4. Generate clear, actionable insights
5. Prioritize alerts by business impact

## Health Score Guidelines (0-100):
- 90-100: Excellent - Strong growth, low risk
- 70-89: Good - Healthy metrics, minor concerns
- 50-69: Attention - Some issues need monitoring
- 30-49: Warning - Significant concerns
- 0-29: Critical - Immediate action required

## Risk Score Guidelines (0-100):
- 0-20: Low risk
- 21-40: Moderate risk
- 41-60: Elevated risk
- 61-80: High risk
- 81-100: Critical risk

## Output Format:
Provide concise, data-driven assessments. Focus on actionable insights.
Format numbers consistently (currency with 2 decimals, percentages with 1 decimal).`;

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
 * Run health check for one or all businesses
 */
export async function runHealthCheck(
  request: HealthCheckRequest
): Promise<HealthCheckResult[]> {
  const { userId, businessId, checkType } = request;

  console.log(`[BusinessHealthMonitor] Running ${checkType} health check for user ${userId}`);

  // Get businesses
  let businessQuery = supabaseAdmin
    .from("founder_businesses")
    .select("*")
    .eq("owner_user_id", userId)
    .eq("status", "active");

  if (businessId) {
    businessQuery = businessQuery.eq("id", businessId);
  }

  const { data: businesses } = await businessQuery;

  if (!businesses || businesses.length === 0) {
    return [];
  }

  const results: HealthCheckResult[] = [];

  for (const business of businesses) {
    const result = await analyzeBusinessHealth(business, checkType);
    results.push(result);

    // Store analytics update
    await storeHealthAnalytics(business.id, result);
  }

  return results;
}

/**
 * Analyze health of a single business
 */
async function analyzeBusinessHealth(
  business: any,
  checkType: string
): Promise<HealthCheckResult> {
  // Get recent signals
  const { data: signals } = await supabaseAdmin
    .from("founder_business_signals")
    .select("*")
    .eq("founder_business_id", business.id)
    .order("observed_at", { ascending: false })
    .limit(50);

  // Get recent analytics
  const { data: analytics } = await supabaseAdmin
    .from("founder_business_analytics")
    .select("*")
    .eq("business_id", business.id)
    .order("period_start", { ascending: false })
    .limit(6);

  // Group signals by family
  const signalsByFamily = (signals || []).reduce((acc, s) => {
    if (!acc[s.signal_family]) {
acc[s.signal_family] = [];
}
    acc[s.signal_family].push(s);
    return acc;
  }, {} as Record<string, any[]>);

  // Build context for AI
  const context = {
    business: {
      name: business.display_name,
      code: business.code,
      industry: business.industry,
      region: business.region,
    },
    recentMetrics: {
      revenue: signalsByFamily.revenue?.slice(0, 10) || [],
      users: signalsByFamily.users?.slice(0, 10) || [],
      engagement: signalsByFamily.engagement?.slice(0, 10) || [],
      performance: signalsByFamily.performance?.slice(0, 10) || [],
    },
    analyticsHistory: (analytics || []).map((a) => ({
      period: a.period_start,
      revenue: a.revenue_total,
      customers: a.customers_total,
      growth: a.revenue_growth_pct,
      churn: a.churn_rate,
    })),
  };

  // Quick check uses simpler heuristics
  if (checkType === "quick") {
    return generateQuickHealthCheck(business, context);
  }

  // Full/anomaly check uses AI
  const client = getAnthropicClient();

  const systemPrompt = createCacheableSystemPrompt([
    { text: HEALTH_MONITOR_SYSTEM_PROMPT, cache: true, ttl: "1h" },
  ]);

  const response = await client.messages.create({
    model: CLAUDE_MODELS.HAIKU_4_5,
    max_tokens: 2048,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Analyze this business health data and provide a comprehensive assessment.

Business Data:
${JSON.stringify(context, null, 2)}

Provide your analysis as JSON with this structure:
{
  "overallScore": <0-100>,
  "riskScore": <0-100>,
  "growthScore": <0-100>,
  "status": "excellent|good|attention|critical",
  "insights": ["insight 1", "insight 2", ...],
  "alerts": [
    {"type": "warning|danger|info", "message": "...", "metric": "...", "value": <number>}
  ],
  "recommendations": ["rec 1", "rec 2", ...]
}`,
      },
    ],
  });

  // Parse response
  const textContent = response.content.find((block) => block.type === "text");
  const analysisText = textContent?.type === "text" ? textContent.text : "";

  try {
    const jsonMatch = analysisText.match(/```(?:json)?\s*([\s\S]*?)```/) ||
      analysisText.match(/\{[\s\S]*"overallScore"[\s\S]*\}/);

    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : analysisText;
    const parsed = JSON.parse(jsonStr);

    return {
      businessId: business.id,
      businessName: business.display_name,
      overallScore: parsed.overallScore || 50,
      riskScore: parsed.riskScore || 50,
      growthScore: parsed.growthScore || 50,
      status: parsed.status || "attention",
      insights: parsed.insights || [],
      alerts: parsed.alerts || [],
      recommendations: parsed.recommendations || [],
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[BusinessHealthMonitor] Failed to parse AI response:", error);
    return generateQuickHealthCheck(business, context);
  }
}

/**
 * Generate quick health check without AI
 */
function generateQuickHealthCheck(
  business: any,
  context: any
): HealthCheckResult {
  const { analyticsHistory } = context;

  // Calculate basic scores from available data
  const latestAnalytics = analyticsHistory[0];
  const previousAnalytics = analyticsHistory[1];

  let overallScore = 50;
  let riskScore = 50;
  let growthScore = 50;
  const insights: string[] = [];
  const alerts: HealthCheckResult["alerts"] = [];

  if (latestAnalytics) {
    // Growth analysis
    if (latestAnalytics.growth > 10) {
      growthScore = 80;
      insights.push(`Strong growth of ${latestAnalytics.growth}% in latest period`);
    } else if (latestAnalytics.growth < -10) {
      growthScore = 30;
      riskScore = 70;
      alerts.push({
        type: "danger",
        message: "Revenue declining significantly",
        metric: "revenue_growth",
        value: latestAnalytics.growth,
      });
    }

    // Churn analysis
    if (latestAnalytics.churn > 5) {
      riskScore = Math.max(riskScore, 60);
      alerts.push({
        type: "warning",
        message: "Elevated churn rate detected",
        metric: "churn_rate",
        value: latestAnalytics.churn,
      });
    }

    // Calculate overall
    overallScore = Math.round((growthScore + (100 - riskScore)) / 2);
  } else {
    insights.push("No analytics data available - consider setting up metrics tracking");
  }

  // Determine status
  let status: HealthCheckResult["status"] = "good";
  if (overallScore >= 80) {
status = "excellent";
} else if (overallScore >= 60) {
status = "good";
} else if (overallScore >= 40) {
status = "attention";
} else {
status = "critical";
}

  return {
    businessId: business.id,
    businessName: business.display_name,
    overallScore,
    riskScore,
    growthScore,
    status,
    insights,
    alerts,
    recommendations: [
      "Set up automated metrics collection for better insights",
      "Review customer feedback regularly",
      "Monitor competitor activity",
    ],
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Store health analytics in database
 */
async function storeHealthAnalytics(
  businessId: string,
  result: HealthCheckResult
): Promise<void> {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

  await supabaseAdmin.from("founder_business_analytics").upsert(
    {
      business_id: businessId,
      period_type: "monthly",
      period_start: periodStart.toISOString().split("T")[0],
      period_end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split("T")[0],
      ai_summary: result.insights.join(" "),
      ai_recommendations: result.recommendations,
      ai_risk_score: result.riskScore,
      ai_growth_score: result.growthScore,
      ai_analyzed_at: result.checkedAt,
    },
    {
      onConflict: "business_id,period_type,period_start",
    }
  );
}

/**
 * Detect anomalies across all business metrics
 */
export async function detectAnomalies(
  userId: string
): Promise<AnomalyDetection[]> {
  console.log(`[BusinessHealthMonitor] Detecting anomalies for user ${userId}`);

  // Get businesses
  const { data: businesses } = await supabaseAdmin
    .from("founder_businesses")
    .select("id, display_name")
    .eq("owner_user_id", userId)
    .eq("status", "active");

  if (!businesses || businesses.length === 0) {
    return [];
  }

  const anomalies: AnomalyDetection[] = [];

  for (const business of businesses) {
    // Get recent signals
    const { data: signals } = await supabaseAdmin
      .from("founder_business_signals")
      .select("signal_key, value_numeric, observed_at")
      .eq("founder_business_id", business.id)
      .order("observed_at", { ascending: false })
      .limit(100);

    if (!signals || signals.length < 10) {
continue;
}

    // Group by signal key and detect anomalies
    const signalGroups = signals.reduce((acc, s) => {
      if (!acc[s.signal_key]) {
acc[s.signal_key] = [];
}
      acc[s.signal_key].push(s.value_numeric);
      return acc;
    }, {} as Record<string, number[]>);

    for (const [key, values] of Object.entries(signalGroups)) {
      if (values.length < 5) {
continue;
}

      const current = values[0];
      const historical = values.slice(1);
      const mean = historical.reduce((a, b) => a + b, 0) / historical.length;
      const stdDev = Math.sqrt(
        historical.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) /
          historical.length
      );

      // Check for significant deviation (> 2 standard deviations)
      if (stdDev > 0) {
        const deviation = Math.abs(current - mean) / stdDev;

        if (deviation > 2) {
          let severity: AnomalyDetection["severity"] = "low";
          if (deviation > 4) {
severity = "critical";
} else if (deviation > 3) {
severity = "high";
} else if (deviation > 2.5) {
severity = "medium";
}

          anomalies.push({
            businessId: business.id,
            metric: key,
            currentValue: current,
            expectedValue: mean,
            deviation,
            severity,
            description: `${key} is ${deviation.toFixed(1)} standard deviations from normal`,
          });
        }
      }
    }
  }

  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  anomalies.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return anomalies;
}

/**
 * Main entry point for health monitoring
 */
export async function executeHealthMonitor(request: HealthCheckRequest): Promise<{
  healthChecks: HealthCheckResult[];
  anomalies?: AnomalyDetection[];
}> {
  const healthChecks = await runHealthCheck(request);

  // Include anomaly detection for full checks
  let anomalies: AnomalyDetection[] | undefined;
  if (request.checkType === "full" || request.checkType === "anomaly") {
    anomalies = await detectAnomalies(request.userId);
  }

  return { healthChecks, anomalies };
}
