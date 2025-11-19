/**
 * Client Digital Vault Page - Phase 2 Step 3
 *
 * Secure storage for credentials and sensitive data
 * Will be wired to /api/client/vault in Phase 2 Step 4
 */

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Lock, Plus, Eye, EyeOff, Copy, Trash2 } from 'lucide-react';

export default function ClientVaultPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [visibleValues, setVisibleValues] = useState<Record<string, boolean>>({});

  // TODO: Fetch real vault entries from /api/client/vault in Phase 2 Step 4
  const mockEntries = [
    {
      id: '1',
      key_name: 'AWS Access Key',
      category: 'api_keys',
      created_at: '2025-11-19T10:00:00Z',
      value: 'AKIAIOSFODNN7EXAMPLE', // Hidden in production
    },
    {
      id: '2',
      key_name: 'Stripe Secret Key',
      category: 'api_keys',
      created_at: '2025-11-18T15:30:00Z',
      value: 'sk_test_4eC39HqLyjWDarjtT1zdp7dc',
    },
    {
      id: '3',
      key_name: 'Database Password',
      category: 'credentials',
      created_at: '2025-11-17T12:00:00Z',
      value: 'super_secret_password_123',
    },
  ];

  const toggleValueVisibility = (id: string) => {
    setVisibleValues((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value);
    // TODO: Show toast notification in Phase 2 Step 4
    console.log('Copied to clipboard');
  };

  const getCategoryBadge = (category: string) => {
    const variants: Record<string, any> = {
      api_keys: 'info',
      credentials: 'warning',
      tokens: 'success',
      other: 'default',
    };
    return variants[category] || 'default';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">
            Digital Vault
          </h1>
          <p className="text-gray-400 mt-2">
            Securely store API keys, credentials, and sensitive data
          </p>
        </div>

        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setShowAddModal(true)}
        >
          Add Entry
        </Button>
      </div>

      {/* Security notice */}
      <Card variant="warning">
        <div className="p-4">
          <div className="flex items-start space-x-3">
            <Lock className="h-5 w-5 text-yellow-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-100 mb-1">
                Your data is encrypted
              </p>
              <p className="text-sm text-gray-400">
                All vault entries are encrypted at rest and in transit. Never share your vault entries with untrusted parties.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Vault stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="glass">
          <div className="p-4">
            <p className="text-sm text-gray-400">Total Entries</p>
            <p className="text-2xl font-bold text-gray-100 mt-1">
              {mockEntries.length}
            </p>
          </div>
        </Card>
        <Card variant="glass">
          <div className="p-4">
            <p className="text-sm text-gray-400">API Keys</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">
              {mockEntries.filter((e) => e.category === 'api_keys').length}
            </p>
          </div>
        </Card>
        <Card variant="glass">
          <div className="p-4">
            <p className="text-sm text-gray-400">Credentials</p>
            <p className="text-2xl font-bold text-yellow-400 mt-1">
              {mockEntries.filter((e) => e.category === 'credentials').length}
            </p>
          </div>
        </Card>
      </div>

      {/* Vault entries */}
      <div className="space-y-3">
        {mockEntries.map((entry) => (
          <Card key={entry.id} variant="glass">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Entry header */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <Lock className="h-4 w-4 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-100">
                        {entry.key_name}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={getCategoryBadge(entry.category)}>
                          {entry.category.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          Added {formatDate(entry.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Value display */}
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <code className="text-sm text-gray-300 font-mono">
                        {visibleValues[entry.id]
                          ? entry.value
                          : '•'.repeat(entry.value.length)}
                      </code>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleValueVisibility(entry.id)}
                          className="text-gray-400 hover:text-gray-100 transition-colors"
                          aria-label={visibleValues[entry.id] ? 'Hide value' : 'Show value'}
                        >
                          {visibleValues[entry.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => copyToClipboard(entry.value)}
                          className="text-gray-400 hover:text-gray-100 transition-colors"
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
                  className="ml-4 text-gray-400 hover:text-red-400 transition-colors"
                  aria-label="Delete entry"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      {mockEntries.length === 0 && (
        <Card>
          <div className="p-12 text-center">
            <Lock className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">
              No vault entries yet. Add your first API key or credential to get started.
            </p>
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setShowAddModal(true)}
            >
              Add First Entry
            </Button>
          </div>
        </Card>
      )}

      {/* Add entry modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Vault Entry"
      >
        <div className="space-y-4">
          <Input
            label="Entry Name"
            placeholder="e.g., AWS Access Key"
            helpText="A descriptive name for this entry"
          />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category
            </label>
            <select className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="api_keys">API Keys</option>
              <option value="credentials">Credentials</option>
              <option value="tokens">Tokens</option>
              <option value="other">Other</option>
            </select>
          </div>

          <Input
            label="Value"
            type="password"
            placeholder="Enter the sensitive value"
            helpText="This will be encrypted and securely stored"
          />

          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowAddModal(false)}>
              Add Entry
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
