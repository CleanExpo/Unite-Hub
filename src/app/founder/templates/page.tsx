'use client';

/**
 * Multi-Brand Template Library Dashboard
 *
 * Phase: D57 - Template Library & Provisioning
 * Tables: unite_templates, unite_template_blocks, unite_template_bindings
 *
 * Features:
 * - Template library with category/channel filtering
 * - Template preview with block visualization
 * - AI-powered template generation
 * - Block-based template composition
 * - Template bindings to campaigns/journeys
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Plus,
  Wand2,
  Trash2,
  ExternalLink,
  Filter,
  Tag,
  Edit,
  Copy,
  Search,
  Blocks,
  Link,
  CheckCircle,
  Archive,
  Eye,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

type TemplateScope = 'tenant' | 'global';
type TemplateStatus = 'draft' | 'published' | 'archived';
type BlockKind = 'text' | 'image' | 'cta' | 'hero' | 'footer' | 'section' | 'custom';

interface Template {
  id: string;
  tenant_id?: string;
  scope: TemplateScope;
  slug: string;
  name: string;
  description?: string;
  category?: string;
  channel?: string;
  status: TemplateStatus;
  structure?: Record<string, unknown>;
  ai_profile?: Record<string, unknown>;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

interface TemplateBlock {
  id: string;
  template_id: string;
  kind: BlockKind;
  order_index: number;
  label?: string;
  payload?: Record<string, unknown>;
  created_at: string;
}

interface TemplateBinding {
  id: string;
  tenant_id?: string;
  template_id: string;
  target_type: string;
  target_id?: string;
  config?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Component
// =============================================================================

export default function TemplatesPage() {
  const { currentOrganization } = useAuth();
  const tenantId = currentOrganization?.org_id || null;

  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [blocks, setBlocks] = useState<TemplateBlock[]>([]);
  const [bindings, setBindings] = useState<TemplateBinding[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [channelFilter, setChannelFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<TemplateStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showBlocksModal, setShowBlocksModal] = useState(false);
  const [showBindingsModal, setShowBindingsModal] = useState(false);

  // Form states
  const [newTemplate, setNewTemplate] = useState<Partial<Template>>({
    scope: 'tenant',
    status: 'draft',
    tags: [],
  });
  const [aiGoals, setAiGoals] = useState({
    description: '',
    category: 'email',
    channel: 'email',
  });
  const [newBlock, setNewBlock] = useState<Partial<TemplateBlock>>({
    kind: 'text',
    order_index: 0,
    payload: {},
  });
  const [newBinding, setNewBinding] = useState<Partial<TemplateBinding>>({
    target_type: 'campaign',
    config: {},
  });

  // =============================================================================
  // Data Fetching
  // =============================================================================

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (categoryFilter) params.append('category', categoryFilter);
      if (channelFilter) params.append('channel', channelFilter);
      if (statusFilter) params.append('status', statusFilter);
      params.append('limit', '100');

      const response = await fetch(`/api/unite/templates?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setTemplates(data.templates || []);
      } else {
        setError(data.error || 'Failed to fetch templates');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const fetchBlocks = async (templateId: string) => {
    try {
      const response = await fetch(
        `/api/unite/templates?action=blocks&id=${templateId}`
      );
      const data = await response.json();

      if (response.ok) {
        setBlocks(data.blocks || []);
      }
    } catch (err) {
      console.error('Failed to fetch blocks:', err);
    }
  };

  const fetchBindings = async (templateId: string) => {
    try {
      const response = await fetch(
        `/api/unite/templates/bindings?template_id=${templateId}`
      );
      const data = await response.json();

      if (response.ok) {
        setBindings(data.bindings || []);
      }
    } catch (err) {
      console.error('Failed to fetch bindings:', err);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [categoryFilter, channelFilter, statusFilter]);

  // =============================================================================
  // Actions
  // =============================================================================

  const handleCreateTemplate = async () => {
    try {
      const response = await fetch('/api/unite/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate),
      });

      const data = await response.json();

      if (response.ok) {
        setTemplates([data.template, ...templates]);
        setShowCreateModal(false);
        setNewTemplate({ scope: 'tenant', status: 'draft', tags: [] });
      } else {
        setError(data.error || 'Failed to create template');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    }
  };

  const handleAIGenerate = async () => {
    try {
      const response = await fetch('/api/unite/templates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiGoals),
      });

      const data = await response.json();

      if (response.ok && data.generated) {
        // Pre-fill template form with AI suggestions
        setNewTemplate({
          scope: 'tenant',
          slug: data.generated.name.toLowerCase().replace(/\s+/g, '_'),
          name: data.generated.name,
          description: data.generated.description,
          category: aiGoals.category,
          channel: aiGoals.channel,
          status: 'draft',
          tags: data.generated.tags || [],
        });
        setShowAIModal(false);
        setShowCreateModal(true);

        // Store blocks for later creation
        (window as unknown as { aiGeneratedBlocks?: typeof data.generated.blocks }).aiGeneratedBlocks = data.generated.blocks;
      } else {
        setError(data.error || 'Failed to generate template');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Delete this template? This will also delete all blocks and bindings.'))
      return;

    try {
      const response = await fetch(`/api/unite/templates?action=delete&id=${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        setTemplates(templates.filter((t) => t.id !== id));
        if (selectedTemplate?.id === id) {
          setSelectedTemplate(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete template:', err);
    }
  };

  const handleCreateBlock = async () => {
    if (!selectedTemplate) return;

    try {
      const response = await fetch('/api/unite/templates?action=create_block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          ...newBlock,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setBlocks([...blocks, data.block]);
        setNewBlock({ kind: 'text', order_index: blocks.length, payload: {} });
      }
    } catch (err) {
      console.error('Failed to create block:', err);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    try {
      const response = await fetch(`/api/unite/templates?action=delete_block&id=${blockId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        setBlocks(blocks.filter((b) => b.id !== blockId));
      }
    } catch (err) {
      console.error('Failed to delete block:', err);
    }
  };

  const handleCreateBinding = async () => {
    if (!selectedTemplate) return;

    try {
      const response = await fetch('/api/unite/templates/bindings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          ...newBinding,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setBindings([...bindings, data.binding]);
        setNewBinding({ target_type: 'campaign', config: {} });
      }
    } catch (err) {
      console.error('Failed to create binding:', err);
    }
  };

  const handleDeleteBinding = async (bindingId: string) => {
    try {
      const response = await fetch(`/api/unite/templates/bindings?action=delete&id=${bindingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        setBindings(bindings.filter((b) => b.id !== bindingId));
      }
    } catch (err) {
      console.error('Failed to delete binding:', err);
    }
  };

  const handleTemplateClick = (template: Template) => {
    setSelectedTemplate(template);
    fetchBlocks(template.id);
    fetchBindings(template.id);
  };

  // =============================================================================
  // Filtering
  // =============================================================================

  const filteredTemplates = templates.filter((template) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = template.name.toLowerCase().includes(query);
      const matchesDescription = template.description?.toLowerCase().includes(query);
      const matchesTags = template.tags?.some((tag) =>
        tag.toLowerCase().includes(query)
      );
      if (!matchesName && !matchesDescription && !matchesTags) return false;
    }
    return true;
  });

  // =============================================================================
  // Render
  // =============================================================================

  const getStatusColor = (status: TemplateStatus) => {
    switch (status) {
      case 'published':
        return 'bg-green-500';
      case 'draft':
        return 'bg-yellow-500';
      case 'archived':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getBlockKindIcon = (kind: BlockKind) => {
    switch (kind) {
      case 'hero':
        return '🎯';
      case 'text':
        return '📝';
      case 'image':
        return '🖼️';
      case 'cta':
        return '🔘';
      case 'footer':
        return '⬇️';
      case 'section':
        return '📦';
      default:
        return '🧩';
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-text-primary mb-2">
                Template Library
              </h1>
              <p className="text-text-secondary">
                Multi-brand template library with AI-powered generation and block-based composition
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowAIModal(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                AI Generate
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-accent-500 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Template
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4 items-center flex-wrap bg-bg-card p-4 rounded-lg border border-border-primary">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-bg-primary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 bg-bg-primary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
            >
              <option value="">All Categories</option>
              <option value="email">Email</option>
              <option value="social">Social</option>
              <option value="campaign">Campaign</option>
              <option value="journey">Journey</option>
            </select>

            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="px-4 py-2 bg-bg-primary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
            >
              <option value="">All Channels</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="social_facebook">Facebook</option>
              <option value="social_instagram">Instagram</option>
              <option value="social_twitter">Twitter</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TemplateStatus | '')}
              className="px-4 py-2 bg-bg-primary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Templates List */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="text-center py-12 text-text-secondary">Loading templates...</div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-12 bg-bg-card rounded-lg border border-border-primary">
                <FileText className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
                <p className="text-text-secondary">No templates found</p>
                <p className="text-text-tertiary text-sm mt-2">
                  Create your first template or use AI to generate one
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => handleTemplateClick(template)}
                    className={`
                      p-6 bg-bg-card rounded-lg border cursor-pointer transition-all
                      ${
                        selectedTemplate?.id === template.id
                          ? 'border-accent-500 ring-2 ring-accent-500/20'
                          : 'border-border-primary hover:border-accent-500/50'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-text-primary mb-1">
                          {template.name}
                        </h3>
                        {template.description && (
                          <p className="text-sm text-text-secondary line-clamp-2">
                            {template.description}
                          </p>
                        )}
                      </div>
                      <div
                        className={`w-2 h-2 rounded-full ${getStatusColor(template.status)}`}
                        title={template.status}
                      />
                    </div>

                    <div className="flex items-center gap-2 text-sm text-text-tertiary mb-3">
                      {template.category && (
                        <span className="px-2 py-1 bg-bg-primary rounded">
                          {template.category}
                        </span>
                      )}
                      {template.channel && (
                        <span className="px-2 py-1 bg-bg-primary rounded">
                          {template.channel}
                        </span>
                      )}
                      {template.scope === 'global' && (
                        <span className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded">
                          Global
                        </span>
                      )}
                    </div>

                    {template.tags && template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {template.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 bg-accent-500/10 text-accent-500 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-text-tertiary">
                      <span>{new Date(template.created_at).toLocaleDateString()}</span>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTemplate(template.id);
                        }}
                        className="text-red-400 hover:text-red-300"
                        variant="ghost"
                        size="sm"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Template Detail Panel */}
          <div className="lg:col-span-1">
            {selectedTemplate ? (
              <div className="bg-bg-card rounded-lg border border-border-primary p-6 sticky top-8">
                <h3 className="text-xl font-semibold text-text-primary mb-4">
                  Template Details
                </h3>

                <div className="space-y-4 mb-6">
                  <div>
                    <span className="text-sm text-text-tertiary">Name</span>
                    <p className="text-text-primary font-medium">{selectedTemplate.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-text-tertiary">Slug</span>
                    <p className="text-text-secondary text-sm font-mono">
                      {selectedTemplate.slug}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-text-tertiary">Status</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className={`w-2 h-2 rounded-full ${getStatusColor(
                          selectedTemplate.status
                        )}`}
                      />
                      <span className="text-text-primary capitalize">
                        {selectedTemplate.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      setShowBlocksModal(true);
                      fetchBlocks(selectedTemplate.id);
                    }}
                    className="w-full bg-blue-500 text-white"
                  >
                    <Blocks className="w-4 h-4 mr-2" />
                    Manage Blocks ({blocks.length})
                  </Button>
                  <Button
                    onClick={() => {
                      setShowBindingsModal(true);
                      fetchBindings(selectedTemplate.id);
                    }}
                    className="w-full bg-purple-500 text-white"
                  >
                    <Link className="w-4 h-4 mr-2" />
                    Manage Bindings ({bindings.length})
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-bg-card rounded-lg border border-border-primary p-6 text-center">
                <Eye className="w-12 h-12 mx-auto mb-3 text-text-tertiary" />
                <p className="text-text-secondary">Select a template to view details</p>
              </div>
            )}
          </div>
        </div>

        {/* Create Template Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-bg-card rounded-lg border border-border-primary p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-text-primary mb-6">Create Template</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm text-text-secondary mb-2">Name *</label>
                  <input
                    type="text"
                    value={newTemplate.name || ''}
                    onChange={(e) =>
                      setNewTemplate({ ...newTemplate, name: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-bg-primary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
                    placeholder="My Email Template"
                  />
                </div>

                <div>
                  <label className="block text-sm text-text-secondary mb-2">Slug *</label>
                  <input
                    type="text"
                    value={newTemplate.slug || ''}
                    onChange={(e) =>
                      setNewTemplate({ ...newTemplate, slug: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-bg-primary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500 font-mono"
                    placeholder="my_email_template"
                  />
                </div>

                <div>
                  <label className="block text-sm text-text-secondary mb-2">Description</label>
                  <textarea
                    value={newTemplate.description || ''}
                    onChange={(e) =>
                      setNewTemplate({ ...newTemplate, description: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-bg-primary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
                    rows={3}
                    placeholder="Brief description of this template"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-text-secondary mb-2">Category</label>
                    <select
                      value={newTemplate.category || ''}
                      onChange={(e) =>
                        setNewTemplate({ ...newTemplate, category: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-bg-primary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
                    >
                      <option value="">Select category</option>
                      <option value="email">Email</option>
                      <option value="social">Social</option>
                      <option value="campaign">Campaign</option>
                      <option value="journey">Journey</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-text-secondary mb-2">Channel</label>
                    <select
                      value={newTemplate.channel || ''}
                      onChange={(e) =>
                        setNewTemplate({ ...newTemplate, channel: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-bg-primary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
                    >
                      <option value="">Select channel</option>
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                      <option value="social_facebook">Facebook</option>
                      <option value="social_instagram">Instagram</option>
                      <option value="social_twitter">Twitter</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-text-secondary mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newTemplate.tags?.join(', ') || ''}
                    onChange={(e) =>
                      setNewTemplate({
                        ...newTemplate,
                        tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                      })
                    }
                    className="w-full px-4 py-2 bg-bg-primary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
                    placeholder="welcome, onboarding, promotional"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewTemplate({ scope: 'tenant', status: 'draft', tags: [] });
                  }}
                  className="flex-1 bg-bg-primary text-text-primary border border-border-primary"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTemplate}
                  disabled={!newTemplate.name || !newTemplate.slug}
                  className="flex-1 bg-accent-500 text-white disabled:opacity-50"
                >
                  Create Template
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* AI Generation Modal */}
        {showAIModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-bg-card rounded-lg border border-border-primary p-6 max-w-2xl w-full">
              <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
                <Wand2 className="w-6 h-6 text-purple-500" />
                AI Template Generator
              </h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm text-text-secondary mb-2">
                    Description *
                  </label>
                  <textarea
                    value={aiGoals.description}
                    onChange={(e) =>
                      setAiGoals({ ...aiGoals, description: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-bg-primary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
                    rows={4}
                    placeholder="Describe the template you want to generate, e.g., 'A welcome email template for new subscribers with a hero section, introduction text, and call-to-action button'"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-text-secondary mb-2">Category</label>
                    <select
                      value={aiGoals.category}
                      onChange={(e) =>
                        setAiGoals({ ...aiGoals, category: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-bg-primary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
                    >
                      <option value="email">Email</option>
                      <option value="social">Social</option>
                      <option value="campaign">Campaign</option>
                      <option value="journey">Journey</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-text-secondary mb-2">Channel</label>
                    <select
                      value={aiGoals.channel}
                      onChange={(e) =>
                        setAiGoals({ ...aiGoals, channel: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-bg-primary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
                    >
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                      <option value="social_facebook">Facebook</option>
                      <option value="social_instagram">Instagram</option>
                      <option value="social_twitter">Twitter</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowAIModal(false);
                    setAiGoals({ description: '', category: 'email', channel: 'email' });
                  }}
                  className="flex-1 bg-bg-primary text-text-primary border border-border-primary"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAIGenerate}
                  disabled={!aiGoals.description}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white disabled:opacity-50"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Template
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Blocks Management Modal */}
        {showBlocksModal && selectedTemplate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-bg-card rounded-lg border border-border-primary p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-text-primary mb-6">
                Blocks: {selectedTemplate.name}
              </h2>

              {/* Existing Blocks */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Current Blocks ({blocks.length})
                </h3>
                {blocks.length === 0 ? (
                  <p className="text-text-secondary text-center py-4">No blocks yet</p>
                ) : (
                  <div className="space-y-2">
                    {blocks.map((block) => (
                      <div
                        key={block.id}
                        className="p-4 bg-bg-primary rounded-lg border border-border-primary flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getBlockKindIcon(block.kind)}</span>
                          <div>
                            <p className="text-text-primary font-medium">
                              {block.label || block.kind}
                            </p>
                            <p className="text-text-tertiary text-sm">Order: {block.order_index}</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleDeleteBlock(block.id)}
                          className="text-red-400 hover:text-red-300"
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Block */}
              <div className="border-t border-border-primary pt-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Add New Block</h3>
                <div className="space-y-4 mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-text-secondary mb-2">Kind</label>
                      <select
                        value={newBlock.kind}
                        onChange={(e) =>
                          setNewBlock({ ...newBlock, kind: e.target.value as BlockKind })
                        }
                        className="w-full px-4 py-2 bg-bg-primary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
                      >
                        <option value="text">Text</option>
                        <option value="image">Image</option>
                        <option value="cta">CTA</option>
                        <option value="hero">Hero</option>
                        <option value="footer">Footer</option>
                        <option value="section">Section</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-text-secondary mb-2">
                        Order Index
                      </label>
                      <input
                        type="number"
                        value={newBlock.order_index}
                        onChange={(e) =>
                          setNewBlock({ ...newBlock, order_index: parseInt(e.target.value) })
                        }
                        className="w-full px-4 py-2 bg-bg-primary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
                        min="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-text-secondary mb-2">Label</label>
                    <input
                      type="text"
                      value={newBlock.label || ''}
                      onChange={(e) =>
                        setNewBlock({ ...newBlock, label: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-bg-primary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
                      placeholder="Hero Section"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleCreateBlock}
                  className="w-full bg-blue-500 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Block
                </Button>
              </div>

              <div className="mt-6">
                <Button
                  onClick={() => setShowBlocksModal(false)}
                  className="w-full bg-bg-primary text-text-primary border border-border-primary"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Bindings Management Modal */}
        {showBindingsModal && selectedTemplate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-bg-card rounded-lg border border-border-primary p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-text-primary mb-6">
                Bindings: {selectedTemplate.name}
              </h2>

              {/* Existing Bindings */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Current Bindings ({bindings.length})
                </h3>
                {bindings.length === 0 ? (
                  <p className="text-text-secondary text-center py-4">No bindings yet</p>
                ) : (
                  <div className="space-y-2">
                    {bindings.map((binding) => (
                      <div
                        key={binding.id}
                        className="p-4 bg-bg-primary rounded-lg border border-border-primary flex items-center justify-between"
                      >
                        <div>
                          <p className="text-text-primary font-medium">
                            {binding.target_type}
                          </p>
                          {binding.target_id && (
                            <p className="text-text-tertiary text-sm font-mono">
                              ID: {binding.target_id.substring(0, 8)}...
                            </p>
                          )}
                        </div>
                        <Button
                          onClick={() => handleDeleteBinding(binding.id)}
                          className="text-red-400 hover:text-red-300"
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Binding */}
              <div className="border-t border-border-primary pt-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Add New Binding</h3>
                <div className="space-y-4 mb-4">
                  <div>
                    <label className="block text-sm text-text-secondary mb-2">
                      Target Type
                    </label>
                    <select
                      value={newBinding.target_type}
                      onChange={(e) =>
                        setNewBinding({ ...newBinding, target_type: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-bg-primary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
                    >
                      <option value="campaign">Campaign</option>
                      <option value="journey">Journey</option>
                      <option value="sequence">Sequence</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-text-secondary mb-2">
                      Target ID (optional)
                    </label>
                    <input
                      type="text"
                      value={newBinding.target_id || ''}
                      onChange={(e) =>
                        setNewBinding({ ...newBinding, target_id: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-bg-primary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
                      placeholder="Leave empty to bind to all targets of this type"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleCreateBinding}
                  className="w-full bg-purple-500 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Binding
                </Button>
              </div>

              <div className="mt-6">
                <Button
                  onClick={() => setShowBindingsModal(false)}
                  className="w-full bg-bg-primary text-text-primary border border-border-primary"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
