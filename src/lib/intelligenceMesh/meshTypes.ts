/**
 * Intelligence Mesh Types
 * Phase 94: GIM - Global Intelligence Mesh
 */

export type NodeType =
  | 'signal'
  | 'region'
  | 'tenant'
  | 'engine'
  | 'composite'
  | 'early_warning'
  | 'performance'
  | 'compliance'
  | 'creative'
  | 'scaling';

export type RelationshipType =
  | 'influences'
  | 'conflicts'
  | 'reinforces'
  | 'depends_on'
  | 'aggregates'
  | 'causes'
  | 'correlates'
  | 'precedes'
  | 'follows';

export type SnapshotType = 'hourly' | 'daily' | 'weekly';

export interface IntelligenceNode {
  id: string;
  createdAt: string;
  nodeType: NodeType;
  sourceTable: string | null;
  sourceId: string | null;
  regionId: string | null;
  tenantId: string | null;
  weight: number;
  confidence: number;
  label: string | null;
  tags: string[];
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export interface IntelligenceEdge {
  id: string;
  createdAt: string;
  fromNodeId: string;
  toNodeId: string;
  relationship: RelationshipType;
  strength: number;
  confidence: number;
  isBidirectional: boolean;
  metadata: Record<string, unknown>;
}

export interface MeshSnapshot {
  id: string;
  createdAt: string;
  snapshotType: SnapshotType;
  snapshot: Record<string, unknown>;
  nodeCount: number;
  edgeCount: number;
  avgConfidence: number;
  metadata: Record<string, unknown>;
}

export interface NodeWithEdges {
  node: IntelligenceNode;
  outgoingEdges: Array<{
    id: string;
    toNodeId: string;
    relationship: RelationshipType;
    strength: number;
    confidence: number;
  }>;
  incomingEdges: Array<{
    id: string;
    fromNodeId: string;
    relationship: RelationshipType;
    strength: number;
    confidence: number;
  }>;
}

export interface RegionIntelligence {
  regionId: string;
  nodeCount: number;
  avgWeight: number;
  avgConfidence: number;
  byType: Record<NodeType, number>;
  highWeightNodes: Array<{
    id: string;
    label: string;
    weight: number;
    nodeType: NodeType;
  }>;
}

export interface TenantIntelligence {
  tenantId: string;
  nodeCount: number;
  avgWeight: number;
  avgConfidence: number;
  byType: Record<NodeType, number>;
}

export interface GlobalMeshOverview {
  totalNodes: number;
  totalEdges: number;
  avgConfidence: number;
  byNodeType: Record<NodeType, number>;
  byRelationship: Record<RelationshipType, number>;
  regionsWithNodes: number;
  tenantsWithNodes: number;
  generatedAt: string;
}

export interface MeshInsight {
  type: 'risk' | 'opportunity' | 'pattern' | 'momentum';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  confidence: number;
  affectedNodes: string[];
  metadata: Record<string, unknown>;
  generatedAt: string;
}

export interface CreateNodePayload {
  nodeType: NodeType;
  sourceTable?: string;
  sourceId?: string;
  regionId?: string;
  tenantId?: string;
  weight?: number;
  confidence?: number;
  label?: string;
  tags?: string[];
  payload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface CreateEdgePayload {
  fromNodeId: string;
  toNodeId: string;
  relationship: RelationshipType;
  strength: number;
  confidence: number;
  isBidirectional?: boolean;
  metadata?: Record<string, unknown>;
}
