'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Package,
  Download,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  ChevronDown,
} from 'lucide-react';
import type { GuardianExportBundle } from '@/lib/guardian/meta/exportBundleService';

interface CreateBundleForm {
  bundleKey: string;
  label: string;
  description: string;
  scope: string[];
}

const BUNDLE_PRESETS = {
  cs_transfer_kit: {
    label: 'CS Transfer Kit',
    description: 'Complete tenant readiness, uplift, governance, and lifecycle data for customer success handoff',
    scope: ['readiness', 'uplift', 'governance', 'lifecycle', 'adoption'],
  },
  exec_briefing_pack: {
    label: 'Exec Briefing Pack',
    description: 'High-level executive summary with readiness score, top insights, and recommendations',
    scope: ['executive', 'readiness', 'governance'],
  },
  implementation_handoff: {
    label: 'Implementation Handoff',
    description: 'Complete Z-series meta data for implementation team with all domains',
    scope: ['readiness', 'uplift', 'editions', 'executive', 'adoption', 'lifecycle', 'integrations', 'goals_okrs', 'playbooks', 'governance'],
  },
};

export default function ExportsPage() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId') || '';

  const [bundles, setBundles] = useState<GuardianExportBundle[]>([]);
  const [selectedBundle, setSelectedBundle] = useState<GuardianExportBundle | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CreateBundleForm>({
    bundleKey: 'cs_transfer_kit',
    label: '',
    description: '',
    scope: [],
  });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadBundles = async () => {
    if (!workspaceId) return;

    try {
      const res = await fetch(`/api/guardian/meta/exports?workspaceId=${workspaceId}`);
      const data = await res.json();
      setBundles(data.bundles || []);
    } catch (error) {
      console.error('Failed to load bundles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBundles();
  }, [workspaceId]);

  const handlePresetSelect = (presetKey: keyof typeof BUNDLE_PRESETS) => {
    const preset = BUNDLE_PRESETS[presetKey];
    setFormData({
      bundleKey: presetKey,
      label: preset.label,
      description: preset.description,
      scope: preset.scope,
    });
    setShowCreateForm(true);
  };

  const handleCreateBundle = async () => {
    if (!formData.bundleKey || !formData.label || !formData.description || formData.scope.length === 0) {
      alert('Please fill in all fields and select at least one scope');
      return;
    }

    setCreating(true);

    try {
      const res = await fetch(`/api/guardian/meta/exports?workspaceId=${workspaceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bundleKey: formData.bundleKey,
          label: formData.label,
          description: formData.description,
          scope: formData.scope,
        }),
      });

      if (!res.ok) {
        alert('Failed to create bundle');
        return;
      }

      // Reset form and reload
      setShowCreateForm(false);
      setFormData({ bundleKey: 'cs_transfer_kit', label: '', description: '', scope: [] });
      await loadBundles();
    } catch (error) {
      console.error('Failed to create bundle:', error);
      alert('Error creating bundle');
    } finally {
      setCreating(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBundles();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle2 className="w-4 h-4 text-success-600" />;
      case 'building':
        return <Clock className="w-4 h-4 text-info-600 animate-spin" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-error-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-text-muted" />;
      default:
        return null;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-success-100 text-success-800 border-success-300';
      case 'building':
        return 'bg-info-100 text-info-800 border-info-300';
      case 'failed':
        return 'bg-error-100 text-error-800 border-error-300';
      case 'pending':
        return 'bg-bg-hover text-text-secondary border-border';
      case 'archived':
        return 'bg-bg-hover text-text-muted border-border';
      default:
        return 'bg-bg-hover text-text-secondary';
    }
  };

  const downloadBundleJson = async (bundle: GuardianExportBundle) => {
    if (!bundle.manifest) {
      alert('Bundle not ready yet');
      return;
    }

    const json = JSON.stringify(bundle.manifest, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bundle.bundleKey}-${bundle.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadItemJson = async (bundle: GuardianExportBundle, itemKey: string) => {
    try {
      const res = await fetch(
        `/api/guardian/meta/exports/${bundle.id}/items/${itemKey}?workspaceId=${workspaceId}`
      );

      if (!res.ok) {
        alert('Failed to download item');
        return;
      }

      const data = await res.json();
      const json = JSON.stringify(data.item.content, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${bundle.bundleKey}-${itemKey}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download item:', error);
      alert('Error downloading item');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <p className="text-text-secondary">Loading exports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-accent-500" />
            <h1 className="text-3xl font-bold text-text-primary">Export Bundles</h1>
          </div>
          <Button onClick={handleRefresh} disabled={refreshing} size="sm" variant="outline">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <p className="text-text-secondary">
          Create and manage PII-free export bundles for Z01-Z10 meta data (CS transfers, exec briefings, implementation handoffs)
        </p>
      </div>

      {/* Quick Create Presets */}
      <Card className="bg-bg-card border border-border">
        <CardHeader>
          <CardTitle className="text-text-primary">Quick Create Presets</CardTitle>
          <p className="text-xs text-text-secondary mt-1">Select a template to start a new export bundle</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(BUNDLE_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => handlePresetSelect(key as keyof typeof BUNDLE_PRESETS)}
                className="p-4 bg-bg-secondary rounded-lg border border-border hover:border-accent-500 hover:bg-bg-secondary/80 transition text-left"
              >
                <p className="font-semibold text-text-primary text-sm">{preset.label}</p>
                <p className="text-xs text-text-secondary mt-2">{preset.description}</p>
                <p className="text-xs text-accent-500 mt-3 flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Create
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Bundle Form */}
      {showCreateForm && (
        <Card className="bg-bg-card border border-border border-accent-500 bg-accent-50/5">
          <CardHeader>
            <CardTitle className="text-text-primary">Create New Bundle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Label</label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded bg-bg-secondary text-text-primary"
                placeholder="e.g., Q4 Customer Success Handoff"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded bg-bg-secondary text-text-primary text-sm"
                rows={3}
                placeholder="Describe the purpose and contents of this bundle"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Scope (Select domains)</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'readiness',
                  'uplift',
                  'editions',
                  'executive',
                  'adoption',
                  'lifecycle',
                  'integrations',
                  'goals_okrs',
                  'playbooks',
                  'governance',
                ].map((scope) => (
                  <label key={scope} className="flex items-center gap-2 p-2 rounded hover:bg-bg-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.scope.includes(scope)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            scope: [...formData.scope, scope],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            scope: formData.scope.filter((s) => s !== scope),
                          });
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm text-text-primary">{scope}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleCreateBundle} disabled={creating} variant="default">
                {creating ? 'Creating...' : 'Create Bundle'}
              </Button>
              <Button onClick={() => setShowCreateForm(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bundles List */}
      <Card className="bg-bg-card border border-border">
        <CardHeader>
          <CardTitle className="text-text-primary">Export Bundles</CardTitle>
          <p className="text-xs text-text-secondary mt-1">{bundles.length} bundle(s)</p>
        </CardHeader>
        <CardContent>
          {bundles.length === 0 ? (
            <p className="text-sm text-text-secondary text-center py-6">No bundles yet. Create one using the presets above.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {bundles.map((bundle) => (
                <div
                  key={bundle.id}
                  className="p-4 bg-bg-secondary rounded-lg border border-border hover:border-accent-500/50 cursor-pointer transition"
                  onClick={() => setSelectedBundle(selectedBundle?.id === bundle.id ? null : bundle)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(bundle.status)}
                        <p className="font-semibold text-text-primary">{bundle.label}</p>
                        <Badge variant="outline" className={`text-xs ${getStatusBadgeColor(bundle.status)}`}>
                          {bundle.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-text-secondary mb-2">{bundle.description}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-text-secondary">
                          Scopes: {bundle.scope.join(', ')}
                        </span>
                        <span className="text-xs text-text-secondary">
                          Created: {new Date(bundle.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {bundle.status === 'ready' && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadBundleJson(bundle);
                        }}
                        size="sm"
                        variant="outline"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Expanded bundle details */}
                  {selectedBundle?.id === bundle.id && bundle.manifest && (
                    <div className="mt-4 pt-4 border-t border-border space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-text-primary mb-2">Items</p>
                        <div className="space-y-1">
                          {bundle.manifest.items.map((item) => (
                            <div
                              key={item.itemKey}
                              className="flex items-center justify-between p-2 bg-bg-primary/50 rounded text-xs"
                            >
                              <span className="text-text-primary">{item.itemKey}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-text-secondary font-mono text-[10px]">
                                  {item.checksum.substring(0, 8)}...
                                </span>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadItemJson(bundle, item.itemKey);
                                  }}
                                  size="sm"
                                  variant="ghost"
                                >
                                  <Download className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {bundle.manifest.warnings.length > 0 && (
                        <div className="p-2 bg-warning-50/50 rounded border border-warning-200">
                          <p className="text-xs font-semibold text-warning-800 mb-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Warnings
                          </p>
                          <ul className="space-y-1">
                            {bundle.manifest.warnings.map((w, i) => (
                              <li key={i} className="text-xs text-warning-700">
                                • {w}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {bundle.status === 'failed' && bundle.errorMessage && (
                    <div className="mt-3 p-2 bg-error-50/50 rounded border border-error-200">
                      <p className="text-xs text-error-700">{bundle.errorMessage}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
