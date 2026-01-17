'use client';

/**
 * Unite Cross-System Graph Fusion Console
 * Phase: D73 - Unite Cross-System Graph Fusion
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Network,
  Plus,
  Trash2,
  GitMerge,
  AlertTriangle,
  CheckCircle,
  Database,
  Clock,
  FileText,
} from 'lucide-react';

interface GraphSource {
  id: string;
  source: string;
  config?: {
    endpoint?: string;
    auth?: Record<string, unknown>;
    entity_mapping?: Record<string, string>;
    sync_interval?: number;
  };
  enabled: boolean;
  tenant_id?: string;
  created_at: string;
}

interface FusionLog {
  id: string;
  source: string;
  operation: 'merge' | 'conflict' | 'rollback' | 'validate';
  diff?: {
    entities_added: number;
    relationships_added: number;
    conflicts: Array<{
      type: string;
      entity_id?: string;
      message: string;
    }>;
    schema_changes: string[];
  };
  tenant_id?: string;
  executed_at: string;
}

export default function GraphFusionPage() {
  const [activeTab, setActiveTab] = useState<'sources' | 'logs' | 'conflicts'>('sources');
  const [sources, setSources] = useState<GraphSource[]>([]);
  const [logs, setLogs] = useState<FusionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<FusionLog | null>(null);

  useEffect(() => {
    if (activeTab === 'sources') {
      fetchSources();
    } else if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab]);

  const fetchSources = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/unite/graph/fuse?limit=100');
      const data = await response.json();
      if (response.ok) {
        setSources(data.sources || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/unite/graph/fuse?action=logs&limit=100');
      const data = await response.json();
      if (response.ok) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSource = async (sourceId: string, currentEnabled: boolean) => {
    try {
      await fetch('/api/unite/graph/fuse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_source',
          source_id: sourceId,
          enabled: !currentEnabled,
        }),
      });
      fetchSources();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSource = async (sourceId: string) => {
    try {
      await fetch('/api/unite/graph/fuse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_source',
          source_id: sourceId,
        }),
      });
      fetchSources();
    } catch (err) {
      console.error(err);
    }
  };

  const getOperationColor = (operation: string) => {
    const colors = {
      merge: 'bg-success-500/10 text-success-400 border-success-500/20',
      conflict: 'bg-error-500/10 text-error-400 border-error-500/20',
      rollback: 'bg-warning-500/10 text-warning-400 border-warning-500/20',
      validate: 'bg-info-500/10 text-info-400 border-info-500/20',
    };
    return colors[operation as keyof typeof colors] || colors.validate;
  };

  // Summary stats
  const totalSources = sources.length;
  const activeSources = sources.filter((s) => s.enabled).length;
  const totalLogs = logs.length;
  const totalConflicts = logs.reduce(
    (sum, log) => sum + (log.diff?.conflicts?.length || 0),
    0
  );
  const recentMerges = logs.filter(
    (log) => log.operation === 'merge' && new Date(log.executed_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  ).length;

  return (
    <div className="min-h-screen bg-bg-primary p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2 flex items-center gap-3">
            <GitMerge className="w-10 h-10 text-accent-500" />
            Cross-System Graph Fusion
          </h1>
          <p className="text-text-secondary">
            Merge graph data from multiple sources with schema validation
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Data Sources</span>
              <Database className="w-5 h-5 text-accent-500" />
            </div>
            <div className="text-3xl font-bold text-text-primary">{totalSources}</div>
            <div className="text-xs text-text-tertiary mt-1">{activeSources} active</div>
          </div>

          <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Fusion Operations</span>
              <GitMerge className="w-5 h-5 text-success-400" />
            </div>
            <div className="text-3xl font-bold text-text-primary">{totalLogs}</div>
            <div className="text-xs text-text-tertiary mt-1">{recentMerges} in 24h</div>
          </div>

          <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Conflicts</span>
              <AlertTriangle className="w-5 h-5 text-error-400" />
            </div>
            <div className="text-3xl font-bold text-text-primary">{totalConflicts}</div>
            <div className="text-xs text-text-tertiary mt-1">detected</div>
          </div>

          <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Success Rate</span>
              <CheckCircle className="w-5 h-5 text-success-400" />
            </div>
            <div className="text-3xl font-bold text-text-primary">
              {totalLogs > 0
                ? Math.round(
                    ((totalLogs - logs.filter((l) => l.operation === 'conflict').length) /
                      totalLogs) *
                      100
                  )
                : 0}
              <span className="text-sm text-text-tertiary ml-1">%</span>
            </div>
            <div className="text-xs text-text-tertiary mt-1">merge success</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-border-primary">
          {[
            { key: 'sources', label: 'Data Sources', icon: Database },
            { key: 'logs', label: 'Fusion Logs', icon: FileText },
            { key: 'conflicts', label: 'Conflict Resolution', icon: AlertTriangle },
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

        {/* Sources Tab */}
        {activeTab === 'sources' && (
          <div>
            {loading ? (
              <div className="text-center py-12 text-text-secondary">Loading sources...</div>
            ) : sources.length === 0 ? (
              <div className="text-center py-12 bg-bg-card rounded-lg border border-border-primary">
                <Database className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
                <p className="text-text-secondary">No graph sources configured</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sources.map((source) => (
                  <div
                    key={source.id}
                    className={`p-4 bg-bg-card rounded-lg border ${
                      source.enabled
                        ? 'border-border-primary'
                        : 'border-border-primary opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-text-primary">{source.source}</span>
                          {source.enabled ? (
                            <span className="px-2 py-0.5 text-xs bg-success-500/10 text-success-400 border border-success-500/20 rounded">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs bg-bg-hover0/10 text-text-muted border border-border/20 rounded">
                              Disabled
                            </span>
                          )}
                        </div>
                        {source.config && (
                          <div className="text-xs text-text-tertiary">
                            {source.config.endpoint && (
                              <div>Endpoint: {source.config.endpoint}</div>
                            )}
                            {source.config.sync_interval && (
                              <div>Sync: every {source.config.sync_interval}s</div>
                            )}
                          </div>
                        )}
                        <div className="text-xs text-text-tertiary mt-1">
                          Created: {new Date(source.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleSource(source.id, source.enabled)}
                        >
                          {source.enabled ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteSource(source.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div>
            {loading ? (
              <div className="text-center py-12 text-text-secondary">Loading fusion logs...</div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 bg-bg-card rounded-lg border border-border-primary">
                <FileText className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
                <p className="text-text-secondary">No fusion operations yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Log List */}
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-4 bg-bg-card rounded-lg border cursor-pointer hover:border-accent-500/50 ${
                        selectedLog?.id === log.id
                          ? 'border-accent-500'
                          : getOperationColor(log.operation)
                      }`}
                      onClick={() => setSelectedLog(log)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-text-primary">{log.source}</span>
                        <span
                          className={`px-2 py-0.5 text-xs rounded border ${getOperationColor(
                            log.operation
                          )}`}
                        >
                          {log.operation}
                        </span>
                      </div>
                      {log.diff && (
                        <div className="text-xs text-text-tertiary">
                          <div>Entities: +{log.diff.entities_added}</div>
                          <div>Relationships: +{log.diff.relationships_added}</div>
                          {log.diff.conflicts.length > 0 && (
                            <div className="text-error-400">
                              Conflicts: {log.diff.conflicts.length}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-xs text-text-tertiary mt-2">
                        <Clock className="w-3 h-3" />
                        {new Date(log.executed_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Log Details */}
                {selectedLog && (
                  <div className="bg-bg-card rounded-lg border border-border-primary p-6">
                    <h3 className="text-lg font-medium text-text-primary mb-4">
                      Fusion Operation Details
                    </h3>

                    {/* Operation Info */}
                    <div className="mb-4">
                      <div className="text-sm text-text-tertiary mb-1">Operation</div>
                      <div
                        className={`inline-block px-3 py-1 text-sm rounded border ${getOperationColor(
                          selectedLog.operation
                        )}`}
                      >
                        {selectedLog.operation}
                      </div>
                    </div>

                    {/* Stats */}
                    {selectedLog.diff && (
                      <>
                        <div className="mb-4">
                          <div className="text-sm text-text-tertiary mb-2">Changes</div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-text-secondary">Entities Added:</span>
                              <span className="text-text-primary font-medium">
                                +{selectedLog.diff.entities_added}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-text-secondary">Relationships Added:</span>
                              <span className="text-text-primary font-medium">
                                +{selectedLog.diff.relationships_added}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Schema Changes */}
                        {selectedLog.diff.schema_changes.length > 0 && (
                          <div className="mb-4">
                            <div className="text-sm text-text-tertiary mb-2">Schema Changes</div>
                            <ul className="space-y-1">
                              {selectedLog.diff.schema_changes.map((change, i) => (
                                <li key={i} className="text-xs text-text-secondary flex gap-2">
                                  <CheckCircle className="w-3 h-3 text-success-400 mt-0.5" />
                                  {change}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Conflicts */}
                        {selectedLog.diff.conflicts.length > 0 && (
                          <div>
                            <div className="text-sm text-text-tertiary mb-2">
                              Conflicts ({selectedLog.diff.conflicts.length})
                            </div>
                            <div className="space-y-2">
                              {selectedLog.diff.conflicts.map((conflict, i) => (
                                <div
                                  key={i}
                                  className="p-3 bg-bg-tertiary rounded border border-border-primary"
                                >
                                  <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-error-400 mt-0.5" />
                                    <div className="flex-1">
                                      <div className="text-xs text-text-tertiary mb-1">
                                        [{conflict.type}]
                                      </div>
                                      <div className="text-sm text-text-secondary">
                                        {conflict.message}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Conflicts Tab */}
        {activeTab === 'conflicts' && (
          <div>
            {loading ? (
              <div className="text-center py-12 text-text-secondary">
                Loading conflicts...
              </div>
            ) : (
              <div className="text-center py-12 bg-bg-card rounded-lg border border-border-primary">
                <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
                <p className="text-text-secondary">
                  Conflict resolution suggestions will appear here
                </p>
                <p className="text-xs text-text-tertiary mt-2">
                  AI-powered resolution strategies coming soon
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
