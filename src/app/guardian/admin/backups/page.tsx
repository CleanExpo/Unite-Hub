'use client';

/**
 * Guardian Z15: Backups & Restore Console
 * Admin interface for creating backups and previewing/applying restores
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

type BackupScope =
  | 'readiness'
  | 'uplift'
  | 'editions'
  | 'executive'
  | 'adoption'
  | 'lifecycle'
  | 'integrations'
  | 'goals_okrs'
  | 'playbooks'
  | 'governance'
  | 'exports'
  | 'improvement_loop'
  | 'automation'
  | 'status';

interface Backup {
  id: string;
  backupKey: string;
  label: string;
  description: string;
  scope: BackupScope[];
  status: string;
  createdAt: string;
  createdBy?: string;
}

interface RestoreRun {
  id: string;
  status: string;
  backupId: string;
  targetMode: string;
  createdAt: string;
  finishedAt?: string;
  actor?: string;
  errorMessage?: string;
}

export default function BackupsConsole() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId') || '';

  const [activeTab, setActiveTab] = useState<'backups' | 'restore'>('backups');
  const [backups, setBackups] = useState<Backup[]>([]);
  const [restores, setRestores] = useState<RestoreRun[]>([]);
  const [loading, setLoading] = useState(true);

  // Backup creation
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    backupKey: '',
    label: '',
    description: '',
    scope: [] as BackupScope[],
    includeNotes: false,
  });
  const [creatingBackup, setCreatingBackup] = useState(false);

  // Restore workflow
  const [restoreStep, setRestoreStep] = useState<'select' | 'preview' | 'apply' | 'complete'>('select');
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<string | null>(null);
  const [restoreTargetMode, setRestoreTargetMode] = useState<'merge' | 'replace'>('merge');
  const [previewingRestore, setPreviewingRestore] = useState(false);
  const [currentRestoreRun, setCurrentRestoreRun] = useState<any>(null);
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [applyingRestore, setApplyingRestore] = useState(false);

  const BACKUP_SCOPES: BackupScope[] = [
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
    'exports',
    'improvement_loop',
    'automation',
    'status',
  ];

  useEffect(() => {
    loadData();
  }, [workspaceId, activeTab]);

  const loadData = async () => {
    if (!workspaceId) return;

    setLoading(true);
    try {
      if (activeTab === 'backups') {
        const res = await fetch(`/api/guardian/meta/backups?workspaceId=${workspaceId}&limit=50`);
        const data = await res.json();
        setBackups(data.backups || []);
      } else {
        const res = await fetch(`/api/guardian/meta/restores?workspaceId=${workspaceId}&limit=50`);
        const data = await res.json();
        setRestores(data.restores || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!createForm.backupKey || !createForm.label || createForm.scope.length === 0) {
      alert('Fill all required fields');
      return;
    }

    setCreatingBackup(true);
    try {
      const res = await fetch(`/api/guardian/meta/backups?workspaceId=${workspaceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      alert(`Backup created: ${data.backupId}`);
      setShowCreateForm(false);
      setCreateForm({
        backupKey: '',
        label: '',
        description: '',
        scope: [],
        includeNotes: false,
      });
      loadData();
    } catch (error) {
      alert(`Error: ${error}`);
    } finally {
      setCreatingBackup(false);
    }
  };

  const handlePreviewRestore = async () => {
    if (!selectedBackupForRestore) {
      alert('Select a backup');
      return;
    }

    setPreviewingRestore(true);
    try {
      const res = await fetch(`/api/guardian/meta/restores/preview?workspaceId=${workspaceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backupId: selectedBackupForRestore,
          targetMode: restoreTargetMode,
        }),
      });
      const data = await res.json();
      setCurrentRestoreRun(data.restoreRunId);
      setRestoreStep('preview');
    } catch (error) {
      alert(`Error: ${error}`);
    } finally {
      setPreviewingRestore(false);
    }
  };

  const handleApplyRestore = async () => {
    if (confirmPhrase !== 'RESTORE' || !confirmChecked) {
      alert('Type RESTORE and check the confirmation box');
      return;
    }

    setApplyingRestore(true);
    try {
      const res = await fetch(`/api/guardian/meta/restores/${currentRestoreRun}/apply?workspaceId=${workspaceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      });
      const data = await res.json();
      alert('Restore applied successfully!');
      setRestoreStep('complete');
      loadData();
    } catch (error) {
      alert(`Error: ${error}`);
    } finally {
      setApplyingRestore(false);
    }
  };

  if (!workspaceId) return <div className="p-6 text-text-secondary">Loading...</div>;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold mb-2">Backups & Restore</h1>
        <p className="text-text-secondary">
          Create backups of Guardian Z01-Z14 meta configuration and safely restore from backups with admin confirmation.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('backups')}
          className={`px-4 py-2 rounded ${activeTab === 'backups' ? 'bg-accent-500 text-white' : 'bg-bg-card'}`}
        >
          Backups
        </button>
        <button
          onClick={() => setActiveTab('restore')}
          className={`px-4 py-2 rounded ${activeTab === 'restore' ? 'bg-accent-500 text-white' : 'bg-bg-card'}`}
        >
          Restore
        </button>
      </div>

      {/* Backups Tab */}
      {activeTab === 'backups' && (
        <div className="space-y-4">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-accent-500 text-white rounded hover:bg-accent-600"
          >
            {showCreateForm ? 'Cancel' : '+ Create Backup'}
          </button>

          {showCreateForm && (
            <div className="p-4 bg-bg-card rounded border space-y-4">
              <h3 className="font-semibold mb-4">Create New Backup</h3>

              <div>
                <label className="text-sm text-text-secondary block mb-1">Backup Key</label>
                <input
                  type="text"
                  placeholder="e.g. pre_q1_rollout"
                  value={createForm.backupKey}
                  onChange={(e) => setCreateForm({ ...createForm, backupKey: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-secondary rounded border"
                />
              </div>

              <div>
                <label className="text-sm text-text-secondary block mb-1">Label</label>
                <input
                  type="text"
                  placeholder="e.g. Pre-Q1 Rollout"
                  value={createForm.label}
                  onChange={(e) => setCreateForm({ ...createForm, label: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-secondary rounded border"
                />
              </div>

              <div>
                <label className="text-sm text-text-secondary block mb-1">Description</label>
                <textarea
                  placeholder="e.g. Backup before Q1 major changes"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-secondary rounded border"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm text-text-secondary block mb-2">Scopes (select all to include)</label>
                <div className="grid grid-cols-2 gap-2">
                  {BACKUP_SCOPES.map((scope) => (
                    <label key={scope} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={createForm.scope.includes(scope)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCreateForm({ ...createForm, scope: [...createForm.scope, scope] });
                          } else {
                            setCreateForm({
                              ...createForm,
                              scope: createForm.scope.filter((s) => s !== scope),
                            });
                          }
                        }}
                      />
                      <span className="text-sm">{scope}</span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={createForm.includeNotes}
                  onChange={(e) => setCreateForm({ ...createForm, includeNotes: e.target.checked })}
                />
                <span className="text-sm">Include notes (internal-only backups only)</span>
              </label>

              <button
                onClick={handleCreateBackup}
                disabled={creatingBackup}
                className="w-full px-4 py-2 bg-accent-500 text-white rounded hover:bg-accent-600 disabled:opacity-50"
              >
                {creatingBackup ? 'Creating...' : 'Create Backup'}
              </button>
            </div>
          )}

          {/* Backups List */}
          {loading ? (
            <div className="text-center text-text-secondary">Loading backups...</div>
          ) : backups.length === 0 ? (
            <div className="text-center text-text-secondary py-8">No backups yet</div>
          ) : (
            <div className="space-y-2">
              {backups.map((backup) => (
                <div key={backup.id} className="p-4 bg-bg-card rounded border">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{backup.label}</h3>
                      <p className="text-sm text-text-secondary">{backup.backupKey}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${backup.status === 'ready' ? 'bg-green-100 text-green-900' : 'bg-yellow-100 text-yellow-900'}`}>
                      {backup.status}
                    </span>
                  </div>
                  <p className="text-sm mb-2">{backup.description}</p>
                  <div className="flex gap-1 flex-wrap">
                    {backup.scope.map((s) => (
                      <span key={s} className="text-xs bg-bg-secondary rounded px-2 py-1">
                        {s}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-text-secondary mt-2">{new Date(backup.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Restore Tab */}
      {activeTab === 'restore' && (
        <div className="space-y-6">
          {restoreStep === 'select' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-text-secondary block mb-2">Step 1: Select Backup</label>
                <select
                  value={selectedBackupForRestore || ''}
                  onChange={(e) => setSelectedBackupForRestore(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-card rounded border"
                >
                  <option value="">-- Select a backup --</option>
                  {backups.filter((b) => b.status === 'ready').map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.label} ({b.backupKey}) - {new Date(b.createdAt).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-text-secondary block mb-2">Step 2: Choose Restore Mode</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={restoreTargetMode === 'merge'}
                      onChange={() => setRestoreTargetMode('merge')}
                    />
                    <span className="text-sm">
                      <strong>Merge</strong> - Add/update missing config (safe, default)
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={restoreTargetMode === 'replace'}
                      onChange={() => setRestoreTargetMode('replace')}
                    />
                    <span className="text-sm">
                      <strong>Replace</strong> - Full replacement (only for safe entities)
                    </span>
                  </label>
                </div>
                {restoreTargetMode === 'replace' && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-900">
                    ⚠️ Replace mode will delete entities not in backup. Use with caution.
                  </div>
                )}
              </div>

              <button
                onClick={handlePreviewRestore}
                disabled={!selectedBackupForRestore || previewingRestore}
                className="w-full px-4 py-2 bg-accent-500 text-white rounded hover:bg-accent-600 disabled:opacity-50"
              >
                {previewingRestore ? 'Computing Preview...' : 'Step 3: Preview Changes'}
              </button>
            </div>
          )}

          {restoreStep === 'preview' && currentRestoreRun && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                <h3 className="font-semibold text-yellow-900 mb-2">Preview Restore Changes</h3>
                <p className="text-sm text-yellow-800 mb-3">Review the changes below. Click Apply to proceed.</p>

                <div className="bg-white rounded p-3 space-y-2 text-sm mb-4 font-mono">
                  <p>
                    <strong>Backup:</strong> {selectedBackupForRestore?.substring(0, 8)}...
                  </p>
                  <p>
                    <strong>Mode:</strong> {restoreTargetMode}
                  </p>
                  <p>
                    <strong>Changes Preview:</strong> Computing...
                  </p>
                </div>
              </div>

              <button
                onClick={() => setRestoreStep('apply')}
                className="w-full px-4 py-2 bg-accent-500 text-white rounded hover:bg-accent-600"
              >
                Proceed to Apply
              </button>

              <button
                onClick={() => {
                  setRestoreStep('select');
                  setCurrentRestoreRun(null);
                }}
                className="w-full px-4 py-2 bg-bg-card rounded border hover:bg-bg-secondary"
              >
                Cancel
              </button>
            </div>
          )}

          {restoreStep === 'apply' && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded">
                <h3 className="font-semibold text-red-900 mb-2">Confirm Restore</h3>
                <p className="text-sm text-red-800 mb-4">
                  This action will restore meta configuration from the selected backup. Type "RESTORE" and check the confirmation box to proceed.
                </p>

                <input
                  type="text"
                  placeholder="Type RESTORE to confirm"
                  value={confirmPhrase}
                  onChange={(e) => setConfirmPhrase(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded border mb-3"
                />

                <label className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    checked={confirmChecked}
                    onChange={(e) => setConfirmChecked(e.target.checked)}
                  />
                  <span className="text-sm">I understand this will restore meta configuration</span>
                </label>
              </div>

              <button
                onClick={handleApplyRestore}
                disabled={applyingRestore || confirmPhrase !== 'RESTORE' || !confirmChecked}
                className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {applyingRestore ? 'Applying...' : 'Apply Restore'}
              </button>

              <button
                onClick={() => {
                  setRestoreStep('preview');
                  setConfirmPhrase('');
                  setConfirmChecked(false);
                }}
                className="w-full px-4 py-2 bg-bg-card rounded border hover:bg-bg-secondary"
              >
                Back
              </button>
            </div>
          )}

          {restoreStep === 'complete' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded">
              <h3 className="font-semibold text-green-900">✓ Restore Completed</h3>
              <p className="text-sm text-green-800 mt-2">Restore applied successfully. Check the audit log (Z10) for details.</p>
              <button
                onClick={() => {
                  setRestoreStep('select');
                  setCurrentRestoreRun(null);
                  setSelectedBackupForRestore(null);
                  setConfirmPhrase('');
                  setConfirmChecked(false);
                }}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Start New Restore
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
