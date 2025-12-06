'use client';

/**
 * Synthex Template Marketplace Page
 * Phase B34: Template Marketplace for Campaigns, Content, and Automations
 *
 * Browse, rate, clone, and use templates across email, campaigns, automations, journeys, and prompts
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Mail,
  Target,
  Zap,
  Route,
  MessageSquare,
  Layout,
  Star,
  StarHalf,
  Copy,
  Search,
  Filter,
  Sparkles,
  RefreshCw,
  Plus,
  Eye,
  ThumbsUp,
  Globe,
  Lock,
  Building2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface Template {
  id: string;
  tenant_id?: string;
  scope: 'global' | 'agency' | 'tenant';
  type: string;
  name: string;
  description?: string;
  category?: string;
  tags: string[];
  content: Record<string, unknown>;
  is_public: boolean;
  is_featured: boolean;
  created_at: string;
  avg_rating?: number;
  rating_count?: number;
  usage_count?: number;
}

interface AIImprovement {
  category: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
  implementation_hint?: string;
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  campaign: Target,
  automation: Zap,
  journey: Route,
  prompt: MessageSquare,
  landing_page: Layout,
};

const TYPE_COLORS: Record<string, string> = {
  email: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  campaign: 'bg-green-500/20 text-green-400 border-green-500/30',
  automation: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  journey: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  prompt: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  landing_page: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
};

const SCOPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  global: Globe,
  agency: Building2,
  tenant: Lock,
};

export default function TemplateMarketplacePage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [featuredTemplates, setFeaturedTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [aiSuggestions, setAISuggestions] = useState<AIImprovement[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Filters
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Categories and counts
  const [categories, setCategories] = useState<string[]>([]);
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchTemplates();
    fetchFeatured();
    fetchCategories();
    fetchTypeCounts();
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [selectedType, selectedCategory, searchQuery]);

  const fetchTemplates = async () => {
    try {
      const params = new URLSearchParams();
      params.append('public', 'true');
      if (selectedType) params.append('type', selectedType);
      if (selectedCategory) params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/synthex/templates/marketplace?${params}`);
      const data = await res.json();
      if (data.templates) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeatured = async () => {
    try {
      const res = await fetch('/api/synthex/templates/marketplace?action=popular&limit=6');
      const data = await res.json();
      if (data.templates) {
        setFeaturedTemplates(data.templates);
      }
    } catch (error) {
      console.error('Failed to fetch featured:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/synthex/templates/marketplace?action=categories');
      const data = await res.json();
      if (data.categories) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchTypeCounts = async () => {
    try {
      const res = await fetch('/api/synthex/templates/marketplace?action=counts');
      const data = await res.json();
      if (data.counts) {
        setTypeCounts(data.counts);
      }
    } catch (error) {
      console.error('Failed to fetch counts:', error);
    }
  };

  const fetchAISuggestions = async (templateId: string) => {
    setLoadingSuggestions(true);
    try {
      const res = await fetch(`/api/synthex/templates/marketplace/${templateId}?action=suggestions`);
      const data = await res.json();
      if (data.suggestions) {
        setAISuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('Failed to fetch AI suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const cloneTemplate = async (templateId: string) => {
    try {
      const res = await fetch(`/api/synthex/templates/marketplace/${templateId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: 'current-tenant-id', // Would come from context
        }),
      });
      const data = await res.json();
      if (data.template) {
        alert('Template cloned successfully!');
      }
    } catch (error) {
      console.error('Failed to clone template:', error);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }
    if (hasHalf) {
      stars.push(<StarHalf key="half" className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }
    for (let i = stars.length; i < 5; i++) {
      stars.push(<Star key={i} className="h-4 w-4 text-zinc-600" />);
    }
    return stars;
  };

  const TypeIcon = ({ type }: { type: string }) => {
    const Icon = TYPE_ICONS[type] || Mail;
    return <Icon className="h-4 w-4" />;
  };

  const ScopeIcon = ({ scope }: { scope: string }) => {
    const Icon = SCOPE_ICONS[scope] || Globe;
    return <Icon className="h-3 w-3" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-orange-500" />
              Template Marketplace
            </h1>
            <p className="text-zinc-400 mt-1">
              Discover and use proven templates for emails, campaigns, automations, and more
            </p>
          </div>
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>

        {/* Type Counts */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {Object.entries(typeCounts).map(([type, count]) => {
            const Icon = TYPE_ICONS[type] || Mail;
            return (
              <Card
                key={type}
                className={`bg-zinc-900 border-zinc-800 cursor-pointer transition-all ${
                  selectedType === type ? 'ring-2 ring-orange-500' : ''
                }`}
                onClick={() => setSelectedType(selectedType === type ? null : type)}
              >
                <CardContent className="pt-4 pb-4 text-center">
                  <Icon className="h-6 w-6 mx-auto mb-2 text-zinc-400" />
                  <p className="text-xs text-zinc-500 capitalize">{type.replace('_', ' ')}</p>
                  <p className="text-lg font-bold text-white">{count}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-zinc-800 border-zinc-700 text-white"
            />
          </div>
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template Grid */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-zinc-800 border border-zinc-700">
                <TabsTrigger value="all" className="data-[state=active]:bg-orange-500">
                  All Templates
                </TabsTrigger>
                <TabsTrigger value="featured" className="data-[state=active]:bg-orange-500">
                  Featured
                </TabsTrigger>
                <TabsTrigger value="popular" className="data-[state=active]:bg-orange-500">
                  Popular
                </TabsTrigger>
                <TabsTrigger value="mine" className="data-[state=active]:bg-orange-500">
                  My Templates
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onSelect={() => {
                        setSelectedTemplate(template);
                        fetchAISuggestions(template.id);
                      }}
                      renderStars={renderStars}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="featured" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {featuredTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onSelect={() => {
                        setSelectedTemplate(template);
                        fetchAISuggestions(template.id);
                      }}
                      renderStars={renderStars}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="popular" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {featuredTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onSelect={() => {
                        setSelectedTemplate(template);
                        fetchAISuggestions(template.id);
                      }}
                      renderStars={renderStars}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="mine" className="mt-6">
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="py-12 text-center">
                    <Lock className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">Your Templates</h3>
                    <p className="text-zinc-400 mb-4">
                      Templates you create will appear here
                    </p>
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Template
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Template Detail Sidebar */}
          <div className="space-y-6">
            {selectedTemplate ? (
              <>
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={TYPE_COLORS[selectedTemplate.type] || TYPE_COLORS.email}>
                        <TypeIcon type={selectedTemplate.type} />
                        <span className="ml-1 capitalize">{selectedTemplate.type}</span>
                      </Badge>
                      <Badge variant="outline" className="text-zinc-400 border-zinc-600">
                        <ScopeIcon scope={selectedTemplate.scope} />
                        <span className="ml-1 capitalize">{selectedTemplate.scope}</span>
                      </Badge>
                    </div>
                    <CardTitle className="text-white">{selectedTemplate.name}</CardTitle>
                    <CardDescription>{selectedTemplate.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Rating */}
                    <div className="flex items-center gap-2">
                      <div className="flex">{renderStars(selectedTemplate.avg_rating || 0)}</div>
                      <span className="text-sm text-zinc-400">
                        ({selectedTemplate.rating_count || 0} reviews)
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                        <Eye className="h-4 w-4 mx-auto mb-1 text-zinc-400" />
                        <p className="text-xs text-zinc-500">Uses</p>
                        <p className="text-lg font-bold text-white">
                          {selectedTemplate.usage_count || 0}
                        </p>
                      </div>
                      <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                        <ThumbsUp className="h-4 w-4 mx-auto mb-1 text-zinc-400" />
                        <p className="text-xs text-zinc-500">Rating</p>
                        <p className="text-lg font-bold text-white">
                          {selectedTemplate.avg_rating?.toFixed(1) || '—'}
                        </p>
                      </div>
                    </div>

                    {/* Tags */}
                    {selectedTemplate.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="bg-zinc-800 text-zinc-300">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={() => cloneTemplate(selectedTemplate.id)}
                        className="flex-1 bg-orange-500 hover:bg-orange-600"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Clone & Edit
                      </Button>
                      <Button variant="outline" className="border-zinc-700 text-zinc-300">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Suggestions */}
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-orange-500" />
                      AI Improvement Ideas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingSuggestions ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin text-orange-500" />
                      </div>
                    ) : aiSuggestions.length > 0 ? (
                      <div className="space-y-3">
                        {aiSuggestions.map((suggestion, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg border ${
                              suggestion.priority === 'high'
                                ? 'bg-red-500/10 border-red-500/30'
                                : suggestion.priority === 'medium'
                                ? 'bg-yellow-500/10 border-yellow-500/30'
                                : 'bg-zinc-800/50 border-zinc-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant="outline"
                                className={
                                  suggestion.priority === 'high'
                                    ? 'border-red-500 text-red-400'
                                    : suggestion.priority === 'medium'
                                    ? 'border-yellow-500 text-yellow-400'
                                    : 'border-zinc-600 text-zinc-400'
                                }
                              >
                                {suggestion.priority}
                              </Badge>
                              <span className="text-xs text-zinc-500 capitalize">
                                {suggestion.category}
                              </span>
                            </div>
                            <p className="text-sm text-zinc-300">{suggestion.suggestion}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-500 text-center py-4">
                        Click on a template to see AI suggestions
                      </p>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="py-12 text-center">
                  <Target className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Select a Template</h3>
                  <p className="text-zinc-400">
                    Click on any template to see details and AI improvement suggestions
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* TODO markers for future phases */}
        <div className="text-xs text-zinc-600 space-y-1">
          <p>/* TODO: B35+ Template monetization (paid templates) */</p>
          <p>/* TODO: B35+ Template analytics dashboard */</p>
          <p>/* TODO: B35+ Template versioning and changelog */</p>
        </div>
      </div>
    </div>
  );
}

// Template Card Component
function TemplateCard({
  template,
  onSelect,
  renderStars,
}: {
  template: Template;
  onSelect: () => void;
  renderStars: (rating: number) => React.ReactNode;
}) {
  const Icon = TYPE_ICONS[template.type] || Mail;

  return (
    <Card
      className="bg-zinc-900 border-zinc-800 cursor-pointer hover:border-zinc-700 transition-all"
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge className={TYPE_COLORS[template.type] || TYPE_COLORS.email}>
            <Icon className="h-3 w-3 mr-1" />
            {template.type}
          </Badge>
          {template.is_featured && (
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
              Featured
            </Badge>
          )}
        </div>
        <CardTitle className="text-white text-lg mt-2">{template.name}</CardTitle>
        <CardDescription className="line-clamp-2">{template.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">{renderStars(template.avg_rating || 0)}</div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Eye className="h-3 w-3" />
            {template.usage_count || 0}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
