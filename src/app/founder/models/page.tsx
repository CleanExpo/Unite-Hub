'use client';

/**
 * Unite Model Governance Console
 * Phase: D76 - Unite Model Governance Engine
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GitBranch, History, AlertTriangle, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface Model {
  id: string;
  name: string;
  version: string;
  schema_def: {
    properties: Record<string, { type: string; required?: boolean; description?: string }>;
    required?: string[];
  };
  constraints?: {
    validations?: Record<string, unknown>;
    relationships?: Array<{ target: string; type: string }>;
    indexes?: string[];
  };
  tenant_id?: string;
  updated_at: string;
}

interface ModelAudit {
  id: string;
  model_id: string;
  change_set: {
    added?: Record<string, unknown>;
    removed?: Record<string, unknown>;
    modified?: Record<string, unknown>;
    breaking?: boolean;
  };
  ai_interpretation?: {
    impact: string;
    risk_score: number;
    rollback_safe: boolean;
    recommendations: string[];
  };
  created_at: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ModelsConsolePage() {
  const [activeTab, setActiveTab] = useState<'models' | 'audits'>('models');
  const [models, setModels] = useState<Model[]>([]);
  const [audits, setAudits] = useState<ModelAudit[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [versions, setVersions] = useState<Model[]>([]);

  // Fetch models
  const fetchModels = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/unite/models');
      const data = await res.json();
      setModels(data.models || []);
    } catch (error) {
      console.error('Fetch models failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch audits
  const fetchAudits = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/unite/models/audit?limit=50');
      const data = await res.json();
      setAudits(data.audits || []);
    } catch (error) {
      console.error('Fetch audits failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch versions
  const fetchVersions = async (name: string) => {
    try {
      const res = await fetch(`/api/unite/models?action=versions&name=${name}`);
      const data = await res.json();
      setVersions(data.versions || []);
    } catch (error) {
      console.error('Fetch versions failed:', error);
    }
  };

  // Rollback
  const rollback = async (name: string, targetVersion: string) => {
    try {
      const res = await fetch('/api/unite/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rollback',
          name,
          target_version: targetVersion,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchModels();
        setSelectedModel(null);
        setVersions([]);
      } else {
        alert(`Rollback failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Rollback failed:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'models') fetchModels();
    if (activeTab === 'audits') fetchAudits();
  }, [activeTab]);

  // Risk badge
  const RiskBadge = ({ score }: { score: number }) => {
    let color = 'text-success-400 bg-success-400/10';
    if (score >= 70) color = 'text-error-400 bg-error-400/10';
    else if (score >= 40) color = 'text-warning-400 bg-warning-400/10';
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${color}`}>
        Risk: {score}/100
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Unite Model Governance</h1>
            <p className="text-text-secondary mt-1">Versioned schemas w/ rollback</p>
          </div>
          <Button
            onClick={() => (activeTab === 'models' ? fetchModels() : fetchAudits())}
            variant="outline"
            className="border-border-primary text-text-primary hover:bg-bg-hover"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border-primary">
          {(['models', 'audits'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-accent-500 border-b-2 border-accent-500'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-accent-500 animate-spin" />
          </div>
        )}

        {/* Models Tab */}
        {!loading && activeTab === 'models' && (
          <div className="space-y-4">
            {models.length === 0 ? (
              <Card className="bg-bg-card border-border-primary p-8 text-center">
                <GitBranch className="w-12 h-12 text-text-secondary mx-auto mb-3" />
                <p className="text-text-secondary">No models found</p>
              </Card>
            ) : (
              models.map((model) => (
                <Card key={model.id} className="bg-bg-card border-border-primary p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-text-primary">{model.name}</h3>
                        <span className="px-2 py-1 text-xs font-medium text-info-400 bg-info-400/10 rounded">
                          v{model.version}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary">
                        {Object.keys(model.schema_def.properties).length} properties
                      </p>
                      <p className="text-xs text-text-tertiary mt-1">
                        Updated: {new Date(model.updated_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          if (selectedModel?.id === model.id) {
                            setSelectedModel(null);
                            setVersions([]);
                          } else {
                            setSelectedModel(model);
                            fetchVersions(model.name);
                          }
                        }}
                        size="sm"
                        variant="outline"
                        className="border-border-primary text-text-primary hover:bg-bg-hover"
                      >
                        <History className="w-4 h-4 mr-1" />
                        {selectedModel?.id === model.id ? 'Hide' : 'Versions'}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded: Schema + Versions */}
                  {selectedModel?.id === model.id && (
                    <div className="mt-4 pt-4 border-t border-border-primary space-y-4">
                      {/* Schema */}
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary mb-2">Schema</h4>
                        <div className="bg-bg-primary p-3 rounded max-h-48 overflow-auto">
                          <pre className="text-xs text-text-secondary">
                            {JSON.stringify(model.schema_def, null, 2)}
                          </pre>
                        </div>
                      </div>

                      {/* Versions */}
                      {versions.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-text-primary mb-2">
                            Version History ({versions.length})
                          </h4>
                          <div className="space-y-2">
                            {versions.slice(0, 5).map((v) => (
                              <div
                                key={v.id}
                                className="flex items-center justify-between bg-bg-primary p-3 rounded"
                              >
                                <div>
                                  <span className="text-sm text-text-primary font-medium">
                                    v{v.version}
                                  </span>
                                  <span className="text-xs text-text-tertiary ml-2">
                                    {new Date(v.updated_at).toLocaleDateString()}
                                  </span>
                                </div>
                                {v.version !== model.version && (
                                  <Button
                                    onClick={() => rollback(model.name, v.version)}
                                    size="sm"
                                    variant="outline"
                                    className="border-border-primary text-text-primary hover:bg-bg-hover"
                                  >
                                    Rollback
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        )}

        {/* Audits Tab */}
        {!loading && activeTab === 'audits' && (
          <div className="space-y-4">
            {audits.length === 0 ? (
              <Card className="bg-bg-card border-border-primary p-8 text-center">
                <History className="w-12 h-12 text-text-secondary mx-auto mb-3" />
                <p className="text-text-secondary">No audits found</p>
              </Card>
            ) : (
              audits.map((audit) => (
                <Card key={audit.id} className="bg-bg-card border-border-primary p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {audit.change_set.breaking ? (
                          <AlertTriangle className="w-5 h-5 text-error-400" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-success-400" />
                        )}
                        <h3 className="text-lg font-semibold text-text-primary">
                          {audit.change_set.breaking ? 'Breaking Change' : 'Safe Change'}
                        </h3>
                        {audit.ai_interpretation && (
                          <RiskBadge score={audit.ai_interpretation.risk_score} />
                        )}
                      </div>
                      <p className="text-xs text-text-tertiary">
                        {new Date(audit.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Change details */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-text-secondary mb-1">Added</p>
                      <p className="text-sm text-success-400">
                        {Object.keys(audit.change_set.added || {}).length} fields
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary mb-1">Removed</p>
                      <p className="text-sm text-error-400">
                        {Object.keys(audit.change_set.removed || {}).length} fields
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary mb-1">Modified</p>
                      <p className="text-sm text-warning-400">
                        {Object.keys(audit.change_set.modified || {}).length} fields
                      </p>
                    </div>
                  </div>

                  {/* AI interpretation */}
                  {audit.ai_interpretation && (
                    <div className="bg-bg-primary p-3 rounded space-y-2">
                      <div>
                        <p className="text-xs text-text-secondary">Impact</p>
                        <p className="text-sm text-text-primary mt-1">
                          {audit.ai_interpretation.impact}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary">Rollback Safe</p>
                        <p className="text-sm text-text-primary mt-1">
                          {audit.ai_interpretation.rollback_safe ? (
                            <CheckCircle className="w-4 h-4 inline text-success-400" />
                          ) : (
                            <XCircle className="w-4 h-4 inline text-error-400" />
                          )}
                          <span className="ml-2">
                            {audit.ai_interpretation.rollback_safe ? 'Yes' : 'No'}
                          </span>
                        </p>
                      </div>
                      {audit.ai_interpretation.recommendations.length > 0 && (
                        <div>
                          <p className="text-xs text-text-secondary mb-1">Recommendations</p>
                          <ul className="list-disc list-inside text-sm text-text-tertiary space-y-1">
                            {audit.ai_interpretation.recommendations.map((rec, i) => (
                              <li key={i}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
