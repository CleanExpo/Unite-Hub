/**
 * Mesh Insight Service
 * Phase 94: Generate higher-level insights from the intelligence mesh
 */

import { getSupabaseServer } from '@/lib/supabase';
import type { MeshInsight } from './meshTypes';
import { listEdgesByRelationship } from './intelligenceEdgeService';
import { listNodesByType } from './intelligenceNodeService';

const LEGAL_DISCLAIMER =
  '\n\n*Note: This insight is derived from pattern analysis and includes uncertainty. ' +
  'It should not be treated as a prediction or guarantee.*';

/**
 * Detect emerging risks across the mesh
 */
export async function detectEmergingRisks(): Promise<MeshInsight[]> {
  const insights: MeshInsight[] = [];
  const supabase = await getSupabaseServer();

  // Find high-weight early warning nodes
  const { data: warnings } = await supabase
    .from('intelligence_nodes')
    .select('*')
    .eq('node_type', 'early_warning')
    .gte('weight', 0.7)
    .order('weight', { ascending: false })
    .limit(10);

  if (warnings && warnings.length > 0) {
    insights.push({
      type: 'risk',
      severity: 'high',
      title: `${warnings.length} High-Weight Early Warnings Detected`,
      description:
        `The mesh contains ${warnings.length} early warning signals with weight ≥0.7. ` +
        `These may indicate emerging issues requiring attention.` +
        LEGAL_DISCLAIMER,
      confidence: calculateAverageConfidence(warnings),
      affectedNodes: warnings.map(w => w.id),
      metadata: {
        nodeCount: warnings.length,
        avgWeight: calculateAverage(warnings.map(w => w.weight)),
      },
      generatedAt: new Date().toISOString(),
    });
  }

  // Find conflict relationships
  const conflicts = await listEdgesByRelationship('conflicts', 20);
  const highStrengthConflicts = conflicts.filter(c => c.strength > 0.6);

  if (highStrengthConflicts.length > 0) {
    insights.push({
      type: 'risk',
      severity: 'medium',
      title: `${highStrengthConflicts.length} Conflicting Signals Detected`,
      description:
        `Found ${highStrengthConflicts.length} strong conflict relationships in the mesh. ` +
        `These may indicate contradictory signals that need resolution.` +
        LEGAL_DISCLAIMER,
      confidence: calculateAverage(highStrengthConflicts.map(c => c.confidence)),
      affectedNodes: [
        ...new Set([
          ...highStrengthConflicts.map(c => c.fromNodeId),
          ...highStrengthConflicts.map(c => c.toNodeId),
        ]),
      ],
      metadata: {
        conflictCount: highStrengthConflicts.length,
      },
      generatedAt: new Date().toISOString(),
    });
  }

  return insights;
}

/**
 * Detect momentum shifts (changes in patterns)
 */
export async function detectMomentumShifts(): Promise<MeshInsight[]> {
  const insights: MeshInsight[] = [];
  const supabase = await getSupabaseServer();

  // Find performance nodes with high weight
  const { data: performanceNodes } = await supabase
    .from('intelligence_nodes')
    .select('*')
    .eq('node_type', 'performance')
    .gte('weight', 0.8)
    .order('created_at', { ascending: false })
    .limit(10);

  if (performanceNodes && performanceNodes.length >= 3) {
    insights.push({
      type: 'momentum',
      severity: 'low',
      title: 'Strong Performance Signals Detected',
      description:
        `Found ${performanceNodes.length} high-weight performance signals. ` +
        `This may indicate positive momentum trends.` +
        LEGAL_DISCLAIMER,
      confidence: calculateAverageConfidence(performanceNodes),
      affectedNodes: performanceNodes.map(n => n.id),
      metadata: {
        nodeCount: performanceNodes.length,
      },
      generatedAt: new Date().toISOString(),
    });
  }

  // Look for reinforcing relationships
  const reinforces = await listEdgesByRelationship('reinforces', 20);
  const strongReinforcements = reinforces.filter(r => r.strength > 0.7);

  if (strongReinforcements.length >= 5) {
    insights.push({
      type: 'momentum',
      severity: 'low',
      title: 'Multiple Reinforcing Patterns',
      description:
        `Found ${strongReinforcements.length} strong reinforcing relationships. ` +
        `Multiple signals are supporting each other.` +
        LEGAL_DISCLAIMER,
      confidence: calculateAverage(strongReinforcements.map(r => r.confidence)),
      affectedNodes: [
        ...new Set([
          ...strongReinforcements.map(r => r.fromNodeId),
          ...strongReinforcements.map(r => r.toNodeId),
        ]),
      ],
      metadata: {
        reinforcementCount: strongReinforcements.length,
      },
      generatedAt: new Date().toISOString(),
    });
  }

  return insights;
}

/**
 * Detect patterns appearing across multiple regions
 */
export async function detectCrossRegionPatterns(): Promise<MeshInsight[]> {
  const insights: MeshInsight[] = [];
  const supabase = await getSupabaseServer();

  // Group nodes by type across regions
  const { data: regionGroups } = await supabase
    .from('intelligence_nodes')
    .select('node_type, region_id, weight')
    .not('region_id', 'is', null)
    .gte('weight', 0.6);

  if (!regionGroups) return insights;

  // Find patterns appearing in multiple regions
  const patternMap = new Map<string, Set<string>>();

  for (const node of regionGroups) {
    const key = `${node.node_type}-high-weight`;
    if (!patternMap.has(key)) {
      patternMap.set(key, new Set());
    }
    patternMap.get(key)!.add(node.region_id);
  }

  for (const [pattern, regions] of patternMap) {
    if (regions.size >= 2) {
      insights.push({
        type: 'pattern',
        severity: 'medium',
        title: `Cross-Region Pattern: ${pattern}`,
        description:
          `The pattern "${pattern}" appears across ${regions.size} different regions. ` +
          `This may indicate a global trend or common issue.` +
          LEGAL_DISCLAIMER,
        confidence: 0.6,
        affectedNodes: [],
        metadata: {
          pattern,
          regionCount: regions.size,
          regions: Array.from(regions),
        },
        generatedAt: new Date().toISOString(),
      });
    }
  }

  return insights;
}

/**
 * Generate founder-level insights
 */
export async function generateFounderInsights(): Promise<{
  insights: MeshInsight[];
  summary: string;
}> {
  const [risks, momentum, patterns] = await Promise.all([
    detectEmergingRisks(),
    detectMomentumShifts(),
    detectCrossRegionPatterns(),
  ]);

  const allInsights = [...risks, ...momentum, ...patterns];

  // Sort by severity
  const severityOrder = { high: 0, medium: 1, low: 2 };
  allInsights.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );

  // Generate summary
  const highCount = allInsights.filter(i => i.severity === 'high').length;
  const mediumCount = allInsights.filter(i => i.severity === 'medium').length;

  let summary = `## Intelligence Mesh Summary\n\n`;
  summary += `Generated ${allInsights.length} insights from the mesh.\n\n`;

  if (highCount > 0) {
    summary += `⚠️ **${highCount} high-severity items** require attention.\n`;
  }
  if (mediumCount > 0) {
    summary += `📊 **${mediumCount} medium-severity patterns** detected.\n`;
  }
  if (allInsights.length === 0) {
    summary += `✅ No significant patterns or risks detected at this time.\n`;
  }

  summary +=
    '\n*These insights are derived from pattern analysis across the intelligence mesh. ' +
    'They include inherent uncertainty and should be validated with domain knowledge.*';

  return { insights: allInsights, summary };
}

function calculateAverageConfidence(nodes: any[]): number {
  if (nodes.length === 0) return 0;
  const sum = nodes.reduce((acc, n) => acc + (n.confidence || 0), 0);
  return Math.round((sum / nodes.length) * 100) / 100;
}

function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return Math.round((sum / values.length) * 100) / 100;
}
