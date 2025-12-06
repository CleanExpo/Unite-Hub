'use client';

/**
 * Synthex Template Library Page
 * Phase: B24 - Template Packs & Cross-Business Playbooks
 *
 * Browse and clone template packs (global, shared, private).
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  Copy,
  Loader2,
  Search,
  Filter,
  Mail,
  Sparkles,
  FileText,
  Users,
  Globe,
  Lock,
  Share2,
  ChevronRight,
  Tag,
} from 'lucide-react';

interface TemplatePack {
  id: string;
  ownerTenantId: string | null;
  name: string;
  description: string | null;
  category: 'welcome' | 'promo' | 'drip' | 'seo' | 'nurture' | 're-engagement' | 'event' | 'other';
  visibility: 'private' | 'shared' | 'global';
  tags: string[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface Template {
  id: string;
  packId: string;
  type: 'email' | 'campaign' | 'automation' | 'segment' | 'prompt' | 'form' | 'landing_page';
  name: string;
  description: string | null;
  content: Record<string, any>;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

const CATEGORY_ICONS: Record<string, any> = {
  welcome: Mail,
  promo: Sparkles,
  drip: FileText,
  seo: Search,
  nurture: Users,
  're-engagement': Users,
  event: FileText,
  other: Package,
};

const VISIBILITY_ICONS: Record<string, any> = {
  global: Globe,
  shared: Share2,
  private: Lock,
};

export default function TemplatesPage() {
  const [tenantId, setTenantId] = useState('');
  const [packs, setPacks] = useState<TemplatePack[]>([]);
  const [filteredPacks, setFilteredPacks] = useState<TemplatePack[]>([]);
  const [selectedPack, setSelectedPack] = useState<TemplatePack | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [cloning, setCloning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all');

  // Load packs
  const loadPacks = async () => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ tenantId });
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (visibilityFilter !== 'all') params.append('visibility', visibilityFilter);

      const res = await fetch(`/api/synthex/templates/packs?${params}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load template packs');
      }

      setPacks(data.data || []);
      setFilteredPacks(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template packs');
    } finally {
      setLoading(false);
    }
  };

  // Load templates for selected pack
  const loadTemplates = async (packId: string) => {
    setLoadingTemplates(true);

    try {
      const res = await fetch(`/api/synthex/templates/${packId}/templates`);
      const data = await res.json();

      if (res.ok) {
        setTemplates(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Clone template
  const handleCloneTemplate = async (templateId: string) => {
    if (!tenantId) return;

    setCloning(templateId);

    try {
      const res = await fetch('/api/synthex/templates/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          tenantId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to clone template');
      }

      // Success - reload packs to show newly created private pack
      alert('Template cloned successfully! Check your private packs.');
      await loadPacks();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to clone template');
    } finally {
      setCloning(null);
    }
  };

  // Filter packs by search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredPacks(packs);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = packs.filter(
      (pack) =>
        pack.name.toLowerCase().includes(query) ||
        pack.description?.toLowerCase().includes(query) ||
        pack.tags.some((tag) => tag.toLowerCase().includes(query))
    );

    setFilteredPacks(filtered);
  }, [searchQuery, packs]);

  // Load packs on mount and filter change
  useEffect(() => {
    if (tenantId) {
      loadPacks();
    }
  }, [tenantId, categoryFilter, visibilityFilter]);

  // Load templates when pack selected
  useEffect(() => {
    if (selectedPack) {
      loadTemplates(selectedPack.id);
    }
  }, [selectedPack]);

  return (
    <div className="min-h-screen bg-bg-base p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Template Library
          </h1>
          <p className="text-text-secondary">
            Browse and clone ready-to-use templates for emails, campaigns, and automations
          </p>
        </div>

        {/* Tenant ID Input */}
        <Card className="mb-6 bg-bg-card border-border">
          <CardHeader>
            <CardTitle>Tenant Configuration</CardTitle>
            <CardDescription>Enter your tenant ID to browse templates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter tenant ID..."
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="flex-1 bg-bg-base border-border text-text-primary"
              />
              <Button onClick={loadPacks} disabled={!tenantId || loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Package className="mr-2 h-4 w-4" />
                    Load Templates
                  </>
                )}
              </Button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
          </CardContent>
        </Card>

        {/* Search and Filters */}
        {packs.length > 0 && (
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                <Input
                  placeholder="Search templates by name, description, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-bg-card border-border text-text-primary"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-bg-card border border-border rounded-md text-text-primary text-sm"
              >
                <option value="all">All Categories</option>
                <option value="welcome">Welcome</option>
                <option value="promo">Promotional</option>
                <option value="drip">Drip</option>
                <option value="seo">SEO</option>
                <option value="nurture">Nurture</option>
                <option value="re-engagement">Re-engagement</option>
                <option value="event">Event</option>
                <option value="other">Other</option>
              </select>

              {/* Visibility Filter */}
              <select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value)}
                className="px-3 py-2 bg-bg-card border border-border rounded-md text-text-primary text-sm"
              >
                <option value="all">All Visibility</option>
                <option value="global">Global</option>
                <option value="shared">Shared</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template Packs List */}
          <div className="lg:col-span-1">
            <Card className="bg-bg-card border-border">
              <CardHeader>
                <CardTitle className="text-text-primary">
                  Template Packs ({filteredPacks.length})
                </CardTitle>
                <CardDescription>
                  Select a pack to view templates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredPacks.length === 0 && !loading && (
                  <p className="text-sm text-text-tertiary text-center py-8">
                    No template packs found
                  </p>
                )}

                {filteredPacks.map((pack) => {
                  const CategoryIcon = CATEGORY_ICONS[pack.category] || Package;
                  const VisibilityIcon = VISIBILITY_ICONS[pack.visibility] || Globe;
                  const isSelected = selectedPack?.id === pack.id;

                  return (
                    <button
                      key={pack.id}
                      onClick={() => setSelectedPack(pack)}
                      className={`w-full p-3 rounded-lg border text-left transition-colors ${
                        isSelected
                          ? 'bg-accent-500/10 border-accent-500'
                          : 'bg-bg-base border-border hover:bg-bg-base/50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <CategoryIcon className="h-5 w-5 text-accent-500 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-text-primary text-sm truncate">
                              {pack.name}
                            </h3>
                            <VisibilityIcon className="h-3 w-3 text-text-tertiary flex-shrink-0" />
                          </div>
                          {pack.description && (
                            <p className="text-xs text-text-secondary line-clamp-2 mb-1">
                              {pack.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-xs">
                              {pack.category}
                            </Badge>
                            {pack.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        {isSelected && (
                          <ChevronRight className="h-4 w-4 text-accent-500 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Templates List */}
          <div className="lg:col-span-2">
            {selectedPack ? (
              <Card className="bg-bg-card border-border">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-text-primary">
                        {selectedPack.name}
                      </CardTitle>
                      <CardDescription>
                        {selectedPack.description || 'No description'}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={selectedPack.visibility === 'global' ? 'default' : 'outline'}
                      className="flex-shrink-0"
                    >
                      {selectedPack.visibility}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingTemplates ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-accent-500" />
                    </div>
                  ) : templates.length === 0 ? (
                    <p className="text-sm text-text-tertiary text-center py-12">
                      No templates in this pack
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {templates.map((template) => (
                        <div
                          key={template.id}
                          className="p-4 rounded-lg border border-border bg-bg-base"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-text-primary">
                                  {template.name}
                                </h4>
                                <Badge variant="secondary" className="text-xs">
                                  {template.type}
                                </Badge>
                              </div>
                              {template.description && (
                                <p className="text-sm text-text-secondary mb-2">
                                  {template.description}
                                </p>
                              )}

                              {/* Template Preview (Email specific) */}
                              {template.type === 'email' && template.content.subject && (
                                <div className="mt-2 p-2 bg-bg-card rounded border border-border">
                                  <p className="text-xs text-text-tertiary mb-1">Subject:</p>
                                  <p className="text-sm text-text-primary">
                                    {template.content.subject}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Clone Button */}
                            <Button
                              size="sm"
                              onClick={() => handleCloneTemplate(template.id)}
                              disabled={cloning === template.id}
                            >
                              {cloning === template.id ? (
                                <>
                                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                  Cloning...
                                </>
                              ) : (
                                <>
                                  <Copy className="mr-2 h-3 w-3" />
                                  Clone
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-bg-card border-border">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-16 w-16 text-text-tertiary mb-4" />
                  <h3 className="text-lg font-medium text-text-primary mb-2">
                    Select a Template Pack
                  </h3>
                  <p className="text-sm text-text-secondary text-center max-w-md">
                    Choose a template pack from the list to view its templates and clone them to your workspace
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
