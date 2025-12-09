'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Search,
  Filter,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface ContentAsset {
  id: string;
  title: string;
  slug: string;
  type: string;
  format: string;
  status: 'draft' | 'review' | 'published';
  authorityScore: number;
  evergreenScore: number;
  aiSourceScore: number;
  createdAt: string;
  publishedAt?: string;
  qaBlocks: Array<{ question: string; answer: string }>;
}

interface ContentStats {
  total: number;
  byStatus: {
    draft: number;
    review: number;
    published: number;
  };
  averageScores: {
    authority: string;
    evergreen: string;
    aiSource: string;
  };
  algorithmicImmunity: {
    count: number;
    percentage: string;
  };
}

export default function AIDOContentPage() {
  const { currentOrganization, user } = useAuth();
  const [assets, setAssets] = useState<ContentAsset[]>([]);
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: 'all',
    minScore: '0',
    search: ''
  });

  useEffect(() => {
    if (currentOrganization?.org_id) {
      fetchContent();
    }
  }, [currentOrganization, filter]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        workspaceId: currentOrganization!.org_id
      });

      if (filter.status !== 'all') {
        params.append('status', filter.status);
      }

      if (parseFloat(filter.minScore) > 0) {
        params.append('minAISourceScore', filter.minScore);
      }

      const response = await fetch(`/api/aido/content?${params}`, {
        headers: {
          Authorization: `Bearer ${(await import('@/lib/supabase')).supabaseBrowser.auth.getSession().then(s => s.data.session?.access_token)}`
        }
      });

      const data = await response.json();

      if (data.success) {
        let filteredAssets = data.assets;

        // Client-side search filter
        if (filter.search) {
          filteredAssets = filteredAssets.filter((a: ContentAsset) =>
            a.title.toLowerCase().includes(filter.search.toLowerCase()) ||
            a.slug.toLowerCase().includes(filter.search.toLowerCase())
          );
        }

        setAssets(filteredAssets);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch content:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 0.8) {
return 'text-green-600 dark:text-green-400';
}
    if (score >= 0.6) {
return 'text-yellow-600 dark:text-yellow-400';
}
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 0.8) {
return 'bg-green-100 dark:bg-green-900/20';
}
    if (score >= 0.6) {
return 'bg-yellow-100 dark:bg-yellow-900/20';
}
    return 'bg-red-100 dark:bg-red-900/20';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: any }> = {
      draft: { color: 'bg-gray-500', icon: Clock },
      review: { color: 'bg-yellow-500', icon: Eye },
      published: { color: 'bg-green-500', icon: CheckCircle }
    };

    const variant = variants[status] || variants.draft;
    const Icon = variant.icon;

    return (
      <Badge className={`${variant.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const calculateCompositeScore = (asset: ContentAsset): number => {
    return (
      asset.authorityScore * 0.4 +
      asset.evergreenScore * 0.3 +
      asset.aiSourceScore * 0.3
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Assets Manager</h1>
          <p className="text-text-secondary mt-1">
            Algorithmic immunity content optimized for AI citation
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Generate Content
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Assets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
              <div className="flex gap-2 mt-2 text-xs">
                <span className="text-gray-500">
                  {stats.byStatus.draft} draft
                </span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-500">
                  {stats.byStatus.published} published
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Authority Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getScoreColor(parseFloat(stats.averageScores.authority))}`}>
                {(parseFloat(stats.averageScores.authority) * 100).toFixed(0)}%
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Expert depth & citations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                AI Source Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getScoreColor(parseFloat(stats.averageScores.aiSource))}`}>
                {(parseFloat(stats.averageScores.aiSource) * 100).toFixed(0)}%
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Clarity for AI ingestion
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Algorithmic Immunity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {stats.algorithmicImmunity.count}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {stats.algorithmicImmunity.percentage}% of content
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by title..."
                  className="pl-9"
                  value={filter.search}
                  onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filter.status} onValueChange={(value) => setFilter({ ...filter, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="minScore">Min AI Score</Label>
              <Select value={filter.minScore} onValueChange={(value) => setFilter({ ...filter, minScore: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Scores</SelectItem>
                  <SelectItem value="0.6">60%+</SelectItem>
                  <SelectItem value="0.7">70%+</SelectItem>
                  <SelectItem value="0.8">80%+ (Immune)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" className="w-full" onClick={fetchContent}>
                <Filter className="w-4 h-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Assets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Content Assets ({assets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              Loading content assets...
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No content assets yet</p>
              <Button className="mt-4" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Generate Your First Content
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {assets.map((asset) => (
                <Card key={asset.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{asset.title}</h3>
                          {getStatusBadge(asset.status)}
                          <Badge variant="outline" className="text-xs">
                            {asset.type}
                          </Badge>
                        </div>

                        <p className="text-sm text-gray-500 mb-3">
                          /{asset.slug}
                        </p>

                        <div className="flex gap-6">
                          {/* Authority Score */}
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Authority</p>
                            <div className="flex items-center gap-2">
                              <div className={`w-16 h-2 rounded-full ${getScoreBgColor(asset.authorityScore)}`}>
                                <div
                                  className={`h-2 rounded-full ${asset.authorityScore >= 0.8 ? 'bg-green-600' : asset.authorityScore >= 0.6 ? 'bg-yellow-600' : 'bg-red-600'}`}
                                  style={{ width: `${asset.authorityScore * 100}%` }}
                                />
                              </div>
                              <span className={`text-sm font-medium ${getScoreColor(asset.authorityScore)}`}>
                                {(asset.authorityScore * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>

                          {/* Evergreen Score */}
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Evergreen</p>
                            <div className="flex items-center gap-2">
                              <div className={`w-16 h-2 rounded-full ${getScoreBgColor(asset.evergreenScore)}`}>
                                <div
                                  className={`h-2 rounded-full ${asset.evergreenScore >= 0.7 ? 'bg-green-600' : asset.evergreenScore >= 0.5 ? 'bg-yellow-600' : 'bg-red-600'}`}
                                  style={{ width: `${asset.evergreenScore * 100}%` }}
                                />
                              </div>
                              <span className={`text-sm font-medium ${getScoreColor(asset.evergreenScore)}`}>
                                {(asset.evergreenScore * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>

                          {/* AI Source Score */}
                          <div>
                            <p className="text-xs text-gray-500 mb-1">AI Source</p>
                            <div className="flex items-center gap-2">
                              <div className={`w-16 h-2 rounded-full ${getScoreBgColor(asset.aiSourceScore)}`}>
                                <div
                                  className={`h-2 rounded-full ${asset.aiSourceScore >= 0.8 ? 'bg-green-600' : asset.aiSourceScore >= 0.6 ? 'bg-yellow-600' : 'bg-red-600'}`}
                                  style={{ width: `${asset.aiSourceScore * 100}%` }}
                                />
                              </div>
                              <span className={`text-sm font-medium ${getScoreColor(asset.aiSourceScore)}`}>
                                {(asset.aiSourceScore * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>

                          {/* Composite Score */}
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Composite</p>
                            <div className="flex items-center gap-2">
                              <TrendingUp className={`w-4 h-4 ${getScoreColor(calculateCompositeScore(asset))}`} />
                              <span className={`text-sm font-bold ${getScoreColor(calculateCompositeScore(asset))}`}>
                                {(calculateCompositeScore(asset) * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Algorithmic Immunity Badge */}
                        {asset.authorityScore >= 0.8 && asset.evergreenScore >= 0.7 && asset.aiSourceScore >= 0.8 && (
                          <div className="mt-3">
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Algorithmic Immunity Achieved
                            </Badge>
                          </div>
                        )}

                        {/* Low Score Warning */}
                        {(asset.authorityScore < 0.6 || asset.evergreenScore < 0.5 || asset.aiSourceScore < 0.6) && (
                          <div className="mt-3">
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Needs Improvement
                            </Badge>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </div>

                    {/* QA Blocks Preview */}
                    {asset.qaBlocks && asset.qaBlocks.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border-subtle">
                        <p className="text-xs text-gray-500 mb-2">
                          {asset.qaBlocks.length} Q&A Blocks
                        </p>
                        <p className="text-sm text-text-secondary line-clamp-1">
                          {asset.qaBlocks[0].question}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
