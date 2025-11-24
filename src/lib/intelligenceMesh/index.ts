/**
 * Intelligence Mesh Module
 * Phase 94: GIM - Global Intelligence Mesh
 */

// Types
export * from './meshTypes';

// Node Service
export {
  createNode,
  findNodeBySource,
  getNodeById,
  listNodesByRegion,
  listNodesByTenant,
  listNodesByType,
  updateNodeMetrics,
  deleteNode,
  getOrCreateNode,
} from './intelligenceNodeService';

// Edge Service
export {
  linkNodes,
  getEdgeById,
  listEdgesForNode,
  findEdgeBetween,
  listEdgesByRelationship,
  updateEdgeMetrics,
  deleteEdge,
  getOrCreateEdge,
  getStrongConnections,
} from './intelligenceEdgeService';

// Aggregation Service
export {
  aggregateRegionIntelligence,
  aggregateTenantIntelligence,
  globalMeshOverview,
  getTopWeightedNodes,
  getStrongestEdges,
  getMeshHealth,
} from './meshAggregationService';

// Insight Service
export {
  detectEmergingRisks,
  detectMomentumShifts,
  detectCrossRegionPatterns,
  generateFounderInsights,
} from './meshInsightService';

// Snapshot Service
export {
  createDailySnapshot,
  createWeeklySnapshot,
  createHourlySnapshot,
  getRecentSnapshots,
  getSnapshotById,
  compareSnapshots,
  getMeshTrend,
} from './meshSnapshotService';
