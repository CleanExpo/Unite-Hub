/**
 * Global Insight Hub
 *
 * Aggregates insights from multiple agents into a unified intelligence layer.
 * Insights are ranked by severity and cross-referenced with contributing agents.
 */

export interface GlobalInsight {
  id: string;
  sourceAgents: string[];
  timeframe: string;
  theme: 'email_engagement' | 'content_quality' | 'scheduling_efficiency' | 'staff_utilization' | 'financial_health' | 'risk_alert' | 'opportunity' | 'cross_domain';
  summary: string;
  details: string;
  confidence: number; // 0–1
  severity: 'info' | 'warning' | 'critical';
  actionItems?: string[];
  createdAt: string;
}

// In-memory insight store (would use database in production)
let globalInsights: GlobalInsight[] = [];

/**
 * Record a new global insight
 */
export function recordGlobalInsight(insight: Omit<GlobalInsight, 'id' | 'createdAt'>): GlobalInsight {
  const record: GlobalInsight = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...insight,
  };
  globalInsights.push(record);
  return record;
}

/**
 * List global insights with filtering
 */
export function listGlobalInsights(opts?: {
  theme?: GlobalInsight['theme'];
  severity?: GlobalInsight['severity'];
  minConfidence?: number;
  limit?: number;
  sortBy?: 'severity' | 'confidence' | 'recency';
}): GlobalInsight[] {
  let res = globalInsights;

  // Apply filters
  if (opts?.theme) res = res.filter(i => i.theme === opts.theme);
  if (opts?.severity) res = res.filter(i => i.severity === opts.severity);
  if (opts?.minConfidence !== undefined) res = res.filter(i => i.confidence >= opts.minConfidence);

  // Sort
  const sortBy = opts?.sortBy ?? 'recency';
  if (sortBy === 'severity') {
    const severityOrder = { critical: 3, warning: 2, info: 1 };
    res = res.sort((a, b) => {
      const diff = (severityOrder[b.severity] ?? 0) - (severityOrder[a.severity] ?? 0);
      return diff !== 0 ? diff : b.createdAt.localeCompare(a.createdAt);
    });
  } else if (sortBy === 'confidence') {
    res = res.sort((a, b) => b.confidence - a.confidence || b.createdAt.localeCompare(a.createdAt));
  } else {
    res = res.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  return res.slice(0, opts?.limit ?? 50);
}

/**
 * Get insights from a specific agent
 */
export function getInsightsByAgent(agent: string): GlobalInsight[] {
  return globalInsights
    .filter(i => i.sourceAgents.includes(agent))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Get critical insights (highest priority)
 */
export function getCriticalInsights(): GlobalInsight[] {
  return globalInsights
    .filter(i => i.severity === 'critical')
    .sort((a, b) => b.confidence - a.confidence);
}

/**
 * Get insights by theme
 */
export function getInsightsByTheme(theme: GlobalInsight['theme']): GlobalInsight[] {
  return globalInsights
    .filter(i => i.theme === theme)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Cross-reference insights by common themes
 */
export function findRelatedInsights(insightId: string): GlobalInsight[] {
  const source = globalInsights.find(i => i.id === insightId);
  if (!source) return [];

  return globalInsights
    .filter(i => i.id !== insightId && i.theme === source.theme)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Update an insight
 */
export function updateInsight(id: string, update: Partial<Omit<GlobalInsight, 'id' | 'createdAt'>>): GlobalInsight | null {
  const insight = globalInsights.find(i => i.id === id);
  if (!insight) return null;

  Object.assign(insight, update);
  return insight;
}

/**
 * Delete an insight
 */
export function deleteInsight(id: string): boolean {
  const idx = globalInsights.findIndex(i => i.id === id);
  if (idx >= 0) {
    globalInsights.splice(idx, 1);
    return true;
  }
  return false;
}

/**
 * Get insight statistics
 */
export function getInsightStats() {
  return {
    totalInsights: globalInsights.length,
    bySeverity: {
      critical: globalInsights.filter(i => i.severity === 'critical').length,
      warning: globalInsights.filter(i => i.severity === 'warning').length,
      info: globalInsights.filter(i => i.severity === 'info').length,
    },
    byTheme: globalInsights.reduce((acc, i) => {
      acc[i.theme] = (acc[i.theme] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    avgConfidence: globalInsights.length > 0
      ? globalInsights.reduce((sum, i) => sum + i.confidence, 0) / globalInsights.length
      : 0,
    contributingAgents: Array.from(new Set(globalInsights.flatMap(i => i.sourceAgents))),
  };
}

/**
 * Clear all insights (for testing)
 */
export function clearAllInsights(): void {
  globalInsights = [];
}
