/**
 * Client Digital Vault Page - Phase 2 Step 6
 *
 * Secure storage for credentials and sensitive data
 * Wired to /api/client/vault
 */

'use client';

import { useState, useEffect } from 'react';
import { PageContainer, Section } from '@/ui/layout/AppGrid';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/Modal';
import { Lock, Plus, Eye, EyeOff, Copy, Trash2 } from 'lucide-react';
import { getVaultEntries, createVaultEntry, deleteVaultEntry, type VaultEntry } from '@/lib/services/client/clientService';
import { useToast } from '@/contexts/ToastContext';
import { vaultEntrySchema } from '@/lib/validation/schemas';
import { z } from 'zod';

export default function ClientVaultPage() {
  const toast = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [visibleValues, setVisibleValues] = useState<Record<string, boolean>>({});
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state for new entry
  const [newEntryName, setNewEntryName] = useState('');
  const [newEntryCategory, setNewEntryCategory] = useState('api_keys');
  const [newEntryValue, setNewEntryValue] = useState('');

  // Fetch vault entries on mount
  useEffect(() => {
    loadVaultEntries();
  }, []);

  async function loadVaultEntries() {
    setLoading(true);
    try {
      const response = await getVaultEntries();
      setEntries(response.data || []);
    } catch (error) {
      console.error('Failed to load vault entries:', error);
      toast.error('Failed to load vault entries. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const toggleValueVisibility = (id: string) => {
    setVisibleValues((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value);
    toast.success('Copied to clipboard');
  };

  async function handleDeleteEntry(id: string) {
    if (!confirm('Are you sure you want to delete this vault entry?')) {
      return;
    }

    try {
      await deleteVaultEntry(id);
      toast.success('Vault entry deleted successfully');
      // Reload vault entries after deletion
      loadVaultEntries();
    } catch (error) {
      console.error('Failed to delete vault entry:', error);
      toast.error('Failed to delete vault entry. Please try again.');
    }
  }

  async function handleAddEntry() {
    // Validate form data with Zod
    const formData = {
      service_name: newEntryName,
      encrypted_password: newEntryValue,
      notes: newEntryCategory,
    };

    try {
      // Validate with Zod schema
      const validated = vaultEntrySchema.parse(formData);

      setSubmitting(true);

      await createVaultEntry(validated);

      toast.success('Vault entry added successfully');

      // Reset form and close modal
      setNewEntryName('');
      setNewEntryCategory('api_keys');
      setNewEntryValue('');
      setShowAddModal(false);

      // Reload vault entries
      loadVaultEntries();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Show first validation error
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        console.error('Failed to create vault entry:', error);
        toast.error('Failed to create vault entry. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const getCategoryColour = (category: string): string => {
    const map: Record<string, string> = {
      api_keys: '#00F5FF',
      credentials: '#FFB800',
      tokens: '#00FF88',
      other: '#ffffff',
    };
    return map[category] || '#ffffff';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <p className="text-white/40 font-mono">Loading vault entries...</p>
      </div>
    );
  }

  return (
    <PageContainer>
      <Section>
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-mono text-white">
              Digital Vault
            </h1>
            <p className="text-white/40 mt-2 font-mono">
              Securely store API keys, credentials, and sensitive data
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Entry
          </button>
        </div>
      </Section>

      <Section>

      {/* Security notice */}
      <div className="bg-[#FFB800]/10 border border-[#FFB800]/30 rounded-sm p-4">
        <div className="flex items-start space-x-3">
          <Lock className="h-5 w-5 text-[#FFB800] mt-0.5" />
          <div>
            <p className="text-sm font-mono font-medium text-white mb-1">
              Your data is encrypted
            </p>
            <p className="text-sm font-mono text-white/40">
              All vault entries are encrypted at rest and in transit. Never share your vault entries with untrusted parties.
            </p>
          </div>
        </div>
      </div>

      {/* Vault stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
          <div className="p-4">
            <p className="text-sm font-mono text-white/40">Total Entries</p>
            <p className="text-2xl font-bold font-mono text-white mt-1">
              {entries.length}
            </p>
          </div>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
          <div className="p-4">
            <p className="text-sm font-mono text-white/40">Services</p>
            <p className="text-2xl font-bold font-mono text-[#00F5FF] mt-1">
              {new Set(entries.map((e) => e.service_name)).size}
            </p>
          </div>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
          <div className="p-4">
            <p className="text-sm font-mono text-white/40">Encrypted</p>
            <p className="text-2xl font-bold font-mono text-[#00FF88] mt-1">
              {entries.length}
            </p>
          </div>
        </div>
      </div>

      {/* Vault entries */}
      <div className="space-y-3">
        {entries.map((entry) => (
          <div key={entry.id} className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Entry header */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-[#00FF88]/10 rounded-sm">
                      <Lock className="h-4 w-4 text-[#00FF88]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-mono font-semibold text-white">
                        {entry.service_name}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        {entry.username && (
                          <span
                            className="text-xs font-mono px-2 py-0.5 rounded-sm border"
                            style={{
                              color: getCategoryColour('api_keys'),
                              borderColor: `${getCategoryColour('api_keys')}40`,
                              backgroundColor: `${getCategoryColour('api_keys')}10`,
                            }}
                          >
                            {entry.username}
                          </span>
                        )}
                        {entry.created_at && (
                          <span className="text-xs font-mono text-white/40">
                            Added {formatDate(entry.created_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {entry.notes && (
                    <p className="text-sm font-mono text-white/40 mb-3">
                      {entry.notes}
                    </p>
                  )}

                  {/* Value display */}
                  <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-sm">
                    <div className="flex items-center justify-between">
                      <code className="text-sm text-white/60 font-mono">
                        {visibleValues[entry.id]
                          ? entry.encrypted_password
                          : '•'.repeat(entry.encrypted_password.length)}
                      </code>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleValueVisibility(entry.id)}
                          className="text-white/40 hover:text-white transition-colors"
                          aria-label={visibleValues[entry.id] ? 'Hide value' : 'Show value'}
                        >
                          {visibleValues[entry.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => copyToClipboard(entry.encrypted_password)}
                          className="text-white/40 hover:text-white transition-colors"
                          aria-label="Copy to clipboard"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => handleDeleteEntry(entry.id)}
                  className="ml-4 text-white/40 hover:text-[#FF4444] transition-colors"
                  aria-label="Delete entry"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {entries.length === 0 && !loading && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
          <div className="p-12 text-center">
            <Lock className="h-12 w-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40 font-mono mb-4">
              No vault entries yet. Add your first API key or credential to get started.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 flex items-center gap-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              Add First Entry
            </button>
          </div>
        </div>
      )}

      {/* Add entry modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Vault Entry"
      >
        <div className="space-y-4">
          <Input
            label="Service Name"
            placeholder="e.g., AWS Access Key"
            value={newEntryName}
            onChange={(e) => setNewEntryName(e.target.value)}
            helpText="A descriptive name for this entry"
          />

          <div>
            <label className="block text-sm font-mono font-medium text-white/60 mb-2">
              Category/Notes
            </label>
            <select
              value={newEntryCategory}
              onChange={(e) => setNewEntryCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-sm text-white font-mono text-sm focus:outline-none focus:border-[#00F5FF]/40"
            >
              <option value="api_keys">API Keys</option>
              <option value="credentials">Credentials</option>
              <option value="tokens">Tokens</option>
              <option value="other">Other</option>
            </select>
          </div>

          <Input
            label="Password/Value"
            type="password"
            value={newEntryValue}
            onChange={(e) => setNewEntryValue(e.target.value)}
            placeholder="Enter the sensitive value"
            helpText="This will be encrypted and securely stored"
          />

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              onClick={() => {
                setShowAddModal(false);
                setNewEntryName('');
                setNewEntryCategory('api_keys');
                setNewEntryValue('');
              }}
              disabled={submitting}
              className="bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-3 py-1.5 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddEntry}
              disabled={submitting}
              className="bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add Entry'}
            </button>
          </div>
        </div>
      </Modal>
      </Section>
    </PageContainer>
  );
}
