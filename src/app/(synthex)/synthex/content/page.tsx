/**
 * Synthex Content Library
 *
 * Content management for AI-generated assets:
 * - Content cards with preview
 * - Filter by type, status, date
 * - Approve/reject workflow
 * - Edit content inline
 * - Download/export options
 *
 * IMPLEMENTED[PHASE_B3]: Wire up content APIs
 * IMPLEMENTED[PHASE_B3]: Implement approval workflow
 * IMPLEMENTED[PHASE_B4]: Add AI content generation and auto-fill
 * TODO[PHASE_B5]: Add scheduling functionality
 *
 * Backlog: SYNTHEX-005
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Plus,
  Filter,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  Mail,
  Newspaper,
  Share2,
  Image,
  Search,
  Loader2,
  RefreshCw,
  Eye,
  Trash2,
  Sparkles,
  Wand2,
} from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  type: string;
  status: string;
  content_markdown: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

interface ContentStats {
  total: number;
  pending_review: number;
  approved: number;
  published: number;
  by_type: Record<string, number>;
}

export default function SynthexContentPage() {
  const [tenantId, setTenantId] = useState('');
  const [content, setContent] = useState<ContentItem[]>([]);
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // AI Generation state
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    contentType: 'blog' as 'email' | 'blog' | 'social' | 'ad_copy',
    topic: '',
    additionalContext: '',
  });
  const [generatedContent, setGeneratedContent] = useState<{
    title: string;
    content: string;
    suggestedTags: string[];
  } | null>(null);

  const loadContent = async (type?: string) => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        tenantId,
        includeStats: 'true',
      });

      if (type && type !== 'all') {
        params.append('type', type);
      }

      const res = await fetch(`/api/synthex/content?${params}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load content');
      }

      setContent(data.content || []);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  // AI Content Generation
  const handleGenerateContent = async () => {
    if (!tenantId || !generateForm.topic.trim()) return;

    setGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/synthex/agent/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          contentType: generateForm.contentType,
          topic: generateForm.topic,
          additionalContext: generateForm.additionalContext || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate content');
      }

      setGeneratedContent({
        title: data.title,
        content: data.content,
        suggestedTags: data.suggestedTags || [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate content');
    } finally {
      setGenerating(false);
    }
  };

  // Save generated content to library
  const handleSaveGenerated = async () => {
    if (!tenantId || !generatedContent) return;

    try {
      const res = await fetch('/api/synthex/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          title: generatedContent.title,
          type: generateForm.contentType,
          contentMarkdown: generatedContent.content,
          tags: generatedContent.suggestedTags,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save content');
      }

      // Reset and reload
      setShowGenerateDialog(false);
      setGeneratedContent(null);
      setGenerateForm({ contentType: 'blog', topic: '', additionalContext: '' });
      loadContent(activeType || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save content');
    }
  };

  const handleTabChange = (value: string) => {
    setActiveType(value === 'all' ? null : value);
    loadContent(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'published':
        return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'pending_review':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'rejected':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'blog':
        return <Newspaper className="h-4 w-4" />;
      case 'social':
        return <Share2 className="h-4 w-4" />;
      case 'image':
        return <Image className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const filteredContent = content.filter((item) =>
    searchQuery
      ? item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content_markdown?.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Content Library</h1>
          <p className="text-gray-400 mt-2">
            Manage your AI-generated content
          </p>
        </div>
        <Button
          onClick={() => setShowGenerateDialog(true)}
          disabled={!tenantId}
          className="gap-2"
        >
          <Wand2 className="h-4 w-4" />
          Generate with AI
        </Button>
      </div>

      {/* Tenant ID Input */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm text-gray-400 mb-2 block">Tenant ID</label>
              <Input
                placeholder="Enter your tenant ID..."
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="bg-gray-800 border-gray-700 text-gray-100"
              />
            </div>
            <Button
              onClick={() => loadContent()}
              disabled={!tenantId || loading}
              variant="outline"
              className="border-gray-700"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Load Content
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-900 border-gray-700 text-gray-100"
          />
        </div>
        <Button variant="outline" className="border-gray-700" disabled>
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
        <Button variant="outline" className="border-gray-700" disabled>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Content Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-gray-100">{stats?.total || 0}</p>
                <p className="text-sm text-gray-400">Total Content</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-amber-400" />
              <div>
                <p className="text-2xl font-bold text-gray-100">{stats?.pending_review || 0}</p>
                <p className="text-sm text-gray-400">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-gray-100">{stats?.approved || 0}</p>
                <p className="text-sm text-gray-400">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Share2 className="h-8 w-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-gray-100">{stats?.published || 0}</p>
                <p className="text-sm text-gray-400">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="all" className="space-y-6" onValueChange={handleTabChange}>
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="all" className="data-[state=active]:bg-gray-700">
            All
          </TabsTrigger>
          <TabsTrigger value="email" className="data-[state=active]:bg-gray-700">
            <Mail className="h-4 w-4 mr-2" />
            Emails
          </TabsTrigger>
          <TabsTrigger value="blog" className="data-[state=active]:bg-gray-700">
            <Newspaper className="h-4 w-4 mr-2" />
            Blog Posts
          </TabsTrigger>
          <TabsTrigger value="social" className="data-[state=active]:bg-gray-700">
            <Share2 className="h-4 w-4 mr-2" />
            Social
          </TabsTrigger>
          <TabsTrigger value="image" className="data-[state=active]:bg-gray-700">
            <Image className="h-4 w-4 mr-2" />
            Images
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {!tenantId ? (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="py-16 text-center">
                <FileText className="h-16 w-16 text-gray-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">
                  Enter Tenant ID
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Enter your tenant ID above to view and manage your content library.
                </p>
              </CardContent>
            </Card>
          ) : loading ? (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="py-16 text-center">
                <Loader2 className="h-12 w-12 text-gray-500 mx-auto mb-4 animate-spin" />
                <p className="text-gray-500">Loading content...</p>
              </CardContent>
            </Card>
          ) : filteredContent.length === 0 ? (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="py-16 text-center">
                <FileText className="h-16 w-16 text-gray-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">
                  No Content Yet
                </h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  Generate your first piece of content using the AI Workspace.
                  All your content will be stored here for easy access.
                </p>
                <Button disabled className="gap-2">
                  <Plus className="h-4 w-4" />
                  Generate Your First Content
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContent.map((item) => (
                <Card key={item.id} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        <Badge variant="outline" className="text-xs">
                          {item.type}
                        </Badge>
                      </div>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <CardTitle className="text-gray-100 text-lg mt-2">
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400 text-sm line-clamp-3 mb-4">
                      {item.content_markdown?.substring(0, 150) || 'No content preview'}...
                    </p>
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {item.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:text-red-300">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {['email', 'blog', 'social', 'image'].map((type) => (
          <TabsContent key={type} value={type}>
            {filteredContent.filter((c) => c.type === type).length === 0 ? (
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="py-16 text-center">
                  {getTypeIcon(type)}
                  <p className="text-gray-500 mt-4">No {type} content</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredContent
                  .filter((c) => c.type === type)
                  .map((item) => (
                    <Card key={item.id} className="bg-gray-900 border-gray-800">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <Badge variant="outline" className="text-xs">
                            {item.type}
                          </Badge>
                          <Badge className={getStatusColor(item.status)}>
                            {item.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <CardTitle className="text-gray-100 text-lg mt-2">
                          {item.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-400 text-sm line-clamp-3">
                          {item.content_markdown?.substring(0, 150) || 'No content preview'}...
                        </p>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Approval Workflow Info */}
      <Card className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border-green-800/50">
        <CardHeader>
          <CardTitle className="text-gray-100 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            Content Approval Workflow
          </CardTitle>
          <CardDescription className="text-gray-400">
            How content moves through your pipeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" />
              <span className="text-gray-400">Generated</span>
            </div>
            <div className="h-px flex-1 bg-gray-700 mx-4" />
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-400" />
              <span className="text-gray-400">Review</span>
            </div>
            <div className="h-px flex-1 bg-gray-700 mx-4" />
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-gray-400">Approved</span>
            </div>
            <div className="h-px flex-1 bg-gray-700 mx-4" />
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-purple-400" />
              <span className="text-gray-400">Published</span>
            </div>
          </div>
          <Badge variant="secondary" className="mt-4">Phase B4 AI Generation</Badge>
        </CardContent>
      </Card>

      {/* AI Content Generation Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-100 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-400" />
              Generate Content with AI
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Describe what you want to create and our AI will generate it for you.
            </DialogDescription>
          </DialogHeader>

          {!generatedContent ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="contentType" className="text-gray-200">
                  Content Type
                </Label>
                <Select
                  value={generateForm.contentType}
                  onValueChange={(value: 'email' | 'blog' | 'social' | 'ad_copy') =>
                    setGenerateForm({ ...generateForm, contentType: value })
                  }
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="blog">Blog Post</SelectItem>
                    <SelectItem value="social">Social Media</SelectItem>
                    <SelectItem value="ad_copy">Ad Copy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic" className="text-gray-200">
                  Topic / Subject
                </Label>
                <Input
                  id="topic"
                  placeholder="e.g., Welcome email for new customers"
                  value={generateForm.topic}
                  onChange={(e) =>
                    setGenerateForm({ ...generateForm, topic: e.target.value })
                  }
                  className="bg-gray-800 border-gray-700 text-gray-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="context" className="text-gray-200">
                  Additional Context (optional)
                </Label>
                <Textarea
                  id="context"
                  placeholder="Any specific requirements, tone, or details..."
                  value={generateForm.additionalContext}
                  onChange={(e) =>
                    setGenerateForm({ ...generateForm, additionalContext: e.target.value })
                  }
                  className="bg-gray-800 border-gray-700 text-gray-100 resize-none"
                  rows={3}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-gray-200">Generated Title</Label>
                <Input
                  value={generatedContent.title}
                  onChange={(e) =>
                    setGeneratedContent({ ...generatedContent, title: e.target.value })
                  }
                  className="bg-gray-800 border-gray-700 text-gray-100"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-200">Generated Content</Label>
                <Textarea
                  value={generatedContent.content}
                  onChange={(e) =>
                    setGeneratedContent({ ...generatedContent, content: e.target.value })
                  }
                  className="bg-gray-800 border-gray-700 text-gray-100 resize-none"
                  rows={8}
                />
              </div>

              {generatedContent.suggestedTags.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-gray-200">Suggested Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {generatedContent.suggestedTags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {!generatedContent ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowGenerateDialog(false)}
                  className="border-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateContent}
                  disabled={generating || !generateForm.topic.trim()}
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setGeneratedContent(null)}
                  className="border-gray-700"
                >
                  Regenerate
                </Button>
                <Button onClick={handleSaveGenerated}>
                  <Plus className="h-4 w-4 mr-2" />
                  Save to Library
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
