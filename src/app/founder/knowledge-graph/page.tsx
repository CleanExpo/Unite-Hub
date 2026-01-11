'use client';

/**
 * Unite Knowledge Graph Console
 * Phase: D70 - Unite Knowledge Graph Core
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Network,
  Plus,
  Trash2,
  Search,
  Brain,
  GitBranch,
  Sparkles,
  Database,
} from 'lucide-react';

interface Entity {
  id: string;
  type: string;
  name: string;
  properties?: Record<string, unknown>;
  tenant_id?: string;
  created_at: string;
  updated_at: string;
}

interface Relationship {
  id: string;
  source_id: string;
  target_id: string;
  type: string;
  metadata?: Record<string, unknown>;
  tenant_id?: string;
  created_at: string;
}

interface GraphAnalysis {
  summary: string;
  insights: string[];
  recommendations: string[];
}

export default function KnowledgeGraphPage() {
  const [activeTab, setActiveTab] = useState<'entities' | 'relationships' | 'insights'>(
    'entities'
  );
  const [entities, setEntities] = useState<Entity[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [analysis, setAnalysis] = useState<GraphAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [neighbors, setNeighbors] = useState<{
    entities: Entity[];
    relationships: Relationship[];
  } | null>(null);

  // Filters
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [relationshipTypeFilter, setRelationshipTypeFilter] = useState<string>('all');

  useEffect(() => {
    if (activeTab === 'entities') {
      fetchEntities();
    } else if (activeTab === 'relationships') {
      fetchRelationships();
    } else if (activeTab === 'insights') {
      fetchAnalysis();
    }
  }, [activeTab, entityTypeFilter, relationshipTypeFilter]);

  const fetchEntities = async () => {
    try {
      setLoading(true);
      const typeParam = entityTypeFilter !== 'all' ? `&type=${entityTypeFilter}` : '';
      const response = await fetch(`/api/unite/graph/entities?limit=100${typeParam}`);
      const data = await response.json();
      if (response.ok) {
        setEntities(data.entities || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelationships = async () => {
    try {
      setLoading(true);
      const typeParam =
        relationshipTypeFilter !== 'all' ? `&type=${relationshipTypeFilter}` : '';
      const response = await fetch(`/api/unite/graph/relationships?limit=100${typeParam}`);
      const data = await response.json();
      if (response.ok) {
        setRelationships(data.relationships || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/unite/graph/similar?action=analyze');
      const data = await response.json();
      if (response.ok) {
        setAnalysis(data.analysis || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNeighbors = async (entityId: string) => {
    try {
      const response = await fetch(
        `/api/unite/graph/relationships?entity_id=${entityId}&depth=1`
      );
      const data = await response.json();
      if (response.ok) {
        setNeighbors(data.neighbors || { entities: [], relationships: [] });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEntityClick = (entity: Entity) => {
    setSelectedEntity(entity);
    fetchNeighbors(entity.id);
  };

  const deleteEntity = async (entityId: string) => {
    try {
      await fetch('/api/unite/graph/entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          entity_id: entityId,
        }),
      });
      fetchEntities();
      setSelectedEntity(null);
      setNeighbors(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Summary stats
  const totalEntities = entities.length;
  const totalRelationships = relationships.length;
  const entityTypes = [...new Set(entities.map((e) => e.type))];
  const relationshipTypes = [...new Set(relationships.map((r) => r.type))];

  return (
    <div className="min-h-screen bg-bg-primary p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2 flex items-center gap-3">
            <Network className="w-10 h-10 text-accent-500" />
            Unite Knowledge Graph
          </h1>
          <p className="text-text-secondary">
            Cross-system entity relationships and semantic search
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Entities</span>
              <Database className="w-5 h-5 text-accent-500" />
            </div>
            <div className="text-3xl font-bold text-text-primary">{totalEntities}</div>
            <div className="text-xs text-text-tertiary mt-1">
              {entityTypes.length} types
            </div>
          </div>

          <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Relationships</span>
              <GitBranch className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-text-primary">{totalRelationships}</div>
            <div className="text-xs text-text-tertiary mt-1">
              {relationshipTypes.length} types
            </div>
          </div>

          <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Connections</span>
              <Network className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-text-primary">
              {neighbors?.entities.length || 0}
            </div>
            <div className="text-xs text-text-tertiary mt-1">
              {selectedEntity ? 'for selected entity' : 'select an entity'}
            </div>
          </div>

          <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">AI Insights</span>
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-text-primary">
              {analysis?.insights.length || 0}
            </div>
            <div className="text-xs text-text-tertiary mt-1">discovered patterns</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-border-primary">
          {[
            { key: 'entities', label: 'Entities', icon: Database },
            { key: 'relationships', label: 'Relationships', icon: GitBranch },
            { key: 'insights', label: 'AI Insights', icon: Brain },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`px-6 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === key
                  ? 'border-accent-500 text-accent-500'
                  : 'border-transparent text-text-tertiary hover:text-text-secondary'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Entities Tab */}
        {activeTab === 'entities' && (
          <div>
            {/* Type Filter */}
            <div className="mb-4 flex gap-2">
              {['all', ...entityTypes].map((type) => (
                <button
                  key={type}
                  onClick={() => setEntityTypeFilter(type)}
                  className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                    entityTypeFilter === type
                      ? 'bg-accent-500 text-white'
                      : 'bg-bg-card text-text-secondary hover:bg-bg-tertiary'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-12 text-text-secondary">Loading entities...</div>
            ) : entities.length === 0 ? (
              <div className="text-center py-12 bg-bg-card rounded-lg border border-border-primary">
                <Database className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
                <p className="text-text-secondary">No entities found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Entity List */}
                <div className="space-y-3">
                  {entities.map((entity) => (
                    <div
                      key={entity.id}
                      className={`p-4 bg-bg-card rounded-lg border cursor-pointer hover:border-accent-500/50 ${
                        selectedEntity?.id === entity.id
                          ? 'border-accent-500'
                          : 'border-border-primary'
                      }`}
                      onClick={() => handleEntityClick(entity)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-text-primary">{entity.name}</span>
                            <span className="px-2 py-0.5 text-xs bg-bg-tertiary text-text-tertiary rounded">
                              {entity.type}
                            </span>
                          </div>
                          {entity.properties && Object.keys(entity.properties).length > 0 && (
                            <div className="text-xs text-text-tertiary">
                              {Object.keys(entity.properties).length} properties
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteEntity(entity.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Entity Details & Neighbors */}
                {selectedEntity && (
                  <div className="bg-bg-card rounded-lg border border-border-primary p-6">
                    <h3 className="text-lg font-medium text-text-primary mb-4">
                      Entity Details
                    </h3>
                    <div className="space-y-3 mb-6">
                      <div>
                        <div className="text-xs text-text-tertiary mb-1">Name</div>
                        <div className="text-sm text-text-primary">{selectedEntity.name}</div>
                      </div>
                      <div>
                        <div className="text-xs text-text-tertiary mb-1">Type</div>
                        <div className="text-sm text-text-primary">{selectedEntity.type}</div>
                      </div>
                      {selectedEntity.properties &&
                        Object.keys(selectedEntity.properties).length > 0 && (
                          <div>
                            <div className="text-xs text-text-tertiary mb-1">Properties</div>
                            <pre className="text-xs text-text-secondary bg-bg-tertiary p-2 rounded overflow-auto max-h-32">
                              {JSON.stringify(selectedEntity.properties, null, 2)}
                            </pre>
                          </div>
                        )}
                    </div>

                    {neighbors && (
                      <>
                        <h4 className="text-sm font-medium text-text-primary mb-3">
                          Connected Entities ({neighbors.entities.length})
                        </h4>
                        <div className="space-y-2">
                          {neighbors.entities.map((neighbor) => (
                            <div
                              key={neighbor.id}
                              className="p-3 bg-bg-tertiary rounded border border-border-primary"
                            >
                              <div className="font-medium text-text-primary text-sm">
                                {neighbor.name}
                              </div>
                              <div className="text-xs text-text-tertiary">{neighbor.type}</div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Relationships Tab */}
        {activeTab === 'relationships' && (
          <div>
            {/* Type Filter */}
            <div className="mb-4 flex gap-2">
              {['all', ...relationshipTypes].map((type) => (
                <button
                  key={type}
                  onClick={() => setRelationshipTypeFilter(type)}
                  className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                    relationshipTypeFilter === type
                      ? 'bg-accent-500 text-white'
                      : 'bg-bg-card text-text-secondary hover:bg-bg-tertiary'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-12 text-text-secondary">
                Loading relationships...
              </div>
            ) : relationships.length === 0 ? (
              <div className="text-center py-12 bg-bg-card rounded-lg border border-border-primary">
                <GitBranch className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
                <p className="text-text-secondary">No relationships found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {relationships.map((relationship) => (
                  <div
                    key={relationship.id}
                    className="p-4 bg-bg-card rounded-lg border border-border-primary"
                  >
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs rounded border border-blue-500/20">
                        {relationship.type}
                      </div>
                      <GitBranch className="w-4 h-4 text-text-tertiary" />
                      <div className="text-sm text-text-secondary">
                        Source: {relationship.source_id.slice(0, 8)}... → Target:{' '}
                        {relationship.target_id.slice(0, 8)}...
                      </div>
                    </div>
                    {relationship.metadata && Object.keys(relationship.metadata).length > 0 && (
                      <div className="mt-2 text-xs text-text-tertiary">
                        {Object.keys(relationship.metadata).length} metadata fields
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI Insights Tab */}
        {activeTab === 'insights' && (
          <div>
            {loading ? (
              <div className="text-center py-12 text-text-secondary">
                Analyzing graph structure...
              </div>
            ) : !analysis ? (
              <div className="text-center py-12 bg-bg-card rounded-lg border border-border-primary">
                <Brain className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
                <p className="text-text-secondary">No analysis available</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary */}
                <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
                  <h3 className="text-lg font-medium text-text-primary mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-accent-500" />
                    Summary
                  </h3>
                  <p className="text-text-secondary">{analysis.summary}</p>
                </div>

                {/* Insights */}
                {analysis.insights.length > 0 && (
                  <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
                    <h3 className="text-lg font-medium text-text-primary mb-3">Insights</h3>
                    <ul className="space-y-2">
                      {analysis.insights.map((insight, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 bg-accent-500 rounded-full mt-2" />
                          <span className="text-text-secondary text-sm">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {analysis.recommendations.length > 0 && (
                  <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
                    <h3 className="text-lg font-medium text-text-primary mb-3">
                      Recommendations
                    </h3>
                    <ul className="space-y-2">
                      {analysis.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2" />
                          <span className="text-text-secondary text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
