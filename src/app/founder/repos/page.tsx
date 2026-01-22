/**
 * GitHub Repositories Dashboard
 *
 * Unified view of all connected GitHub repositories with:
 * - Repository overview cards with metrics
 * - Sync status monitoring
 * - Quick actions (sync, disconnect)
 * - Connect new repos via OAuth
 *
 * @see spec: .claude/plans/SPEC-2026-01-23.md
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  GitBranch,
  GitPullRequest,
  AlertCircle,
  Plus,
  Search,
  Grid3X3,
  List,
  RefreshCw,
  Star,
  GitFork,
  ExternalLink,
  Lock,
  Unlock,
  Archive,
  CheckCircle2,
  XCircle,
  Loader2,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import { PageContainer, Section } from '@/ui/layout/AppGrid';
import { useWorkspace } from '@/hooks/useWorkspace';
import { cn } from '@/lib/utils';

interface GitHubRepo {
  id: string;
  github_repo_id: number;
  repo_url: string;
  repo_name: string;
  repo_owner: string;
  full_name: string;
  description: string | null;
  language: string | null;
  is_private: boolean;
  is_fork: boolean;
  is_archived: boolean;
  default_branch: string;
  stars_count: number;
  forks_count: number;
  open_issues_count: number;
  watchers_count: number;
  size_kb: number;
  sync_status: 'pending' | 'syncing' | 'synced' | 'error';
  last_sync_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

type ViewMode = 'grid' | 'list';

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f7df1e',
  Python: '#3572A5',
  Go: '#00ADD8',
  Rust: '#dea584',
  Java: '#b07219',
  Ruby: '#701516',
  PHP: '#4F5D95',
  'C++': '#f34b7d',
  C: '#555555',
  Swift: '#ffac45',
  Kotlin: '#A97BFF',
};

export default function ReposDashboardPage() {
  const { workspaceId, loading: workspaceLoading } = useWorkspace();
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<GitHubRepo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [loading, setLoading] = useState(true);
  const [syncingRepos, setSyncingRepos] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // URL params for success/error messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchRepos = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `/api/integrations/github/repos?workspaceId=${workspaceId}`
      );
      const data = await response.json();

      if (data.success) {
        setRepos(data.data.repos);
        setFilteredRepos(data.data.repos);
      } else {
        setError(data.error || 'Failed to fetch repos');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchRepos();

    // Check URL params for success/error
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'github_connected') {
      const count = params.get('repos_synced');
      setSuccessMessage(`Successfully connected ${count} repositories`);
      // Clear params from URL
      window.history.replaceState({}, '', '/founder/repos');
    }
    if (params.get('error')) {
      setError(params.get('error'));
      window.history.replaceState({}, '', '/founder/repos');
    }
  }, [fetchRepos]);

  useEffect(() => {
    let filtered = repos;

    if (searchQuery) {
      filtered = filtered.filter(
        (r) =>
          r.repo_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.repo_owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.language?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredRepos(filtered);
  }, [searchQuery, repos]);

  const handleSync = async (repoId: string) => {
    if (!workspaceId) {
return;
}

    setSyncingRepos((prev) => new Set(prev).add(repoId));

    try {
      const response = await fetch(
        `/api/integrations/github/repos?workspaceId=${workspaceId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repoId, action: 'sync' }),
        }
      );

      if (response.ok) {
        await fetchRepos();
      }
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncingRepos((prev) => {
        const next = new Set(prev);
        next.delete(repoId);
        return next;
      });
    }
  };

  const handleConnect = () => {
    if (!workspaceId) {
return;
}
    window.location.href = `/api/integrations/github?workspaceId=${workspaceId}`;
  };

  const getSyncStatusBadge = (status: GitHubRepo['sync_status']) => {
    switch (status) {
      case 'synced':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Synced
          </Badge>
        );
      case 'syncing':
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Syncing
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) {
return 'Never';
}
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-AU', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatSize = (sizeKb: number) => {
    if (sizeKb < 1024) {
return `${sizeKb} KB`;
}
    if (sizeKb < 1024 * 1024) {
return `${(sizeKb / 1024).toFixed(1)} MB`;
}
    return `${(sizeKb / (1024 * 1024)).toFixed(1)} GB`;
  };

  // Stats summary
  const totalRepos = repos.length;
  const privateRepos = repos.filter((r) => r.is_private).length;
  const totalStars = repos.reduce((sum, r) => sum + r.stars_count, 0);
  const totalIssues = repos.reduce((sum, r) => sum + r.open_issues_count, 0);

  return (
    <PageContainer>
      <Section>
        {/* Header */}
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                GitHub Repositories
              </h1>
              <p className="text-text-muted">
                Unified management of all your connected repositories
              </p>
            </div>
            <Button
              onClick={handleConnect}
              className="bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Connect GitHub
            </Button>
          </div>

          {/* Success/Error messages */}
          {successMessage && (
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-4 h-4 inline mr-2" />
              {successMessage}
            </div>
          )}
          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
              <XCircle className="w-4 h-4 inline mr-2" />
              {error}
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-bg-card border-border-base">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent-500/10">
                  <GitBranch className="w-5 h-5 text-accent-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">
                    {totalRepos}
                  </p>
                  <p className="text-xs text-text-muted">Total Repos</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-bg-card border-border-base">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Lock className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">
                    {privateRepos}
                  </p>
                  <p className="text-xs text-text-muted">Private</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-bg-card border-border-base">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Star className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">
                    {totalStars}
                  </p>
                  <p className="text-xs text-text-muted">Total Stars</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-bg-card border-border-base">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">
                    {totalIssues}
                  </p>
                  <p className="text-xs text-text-muted">Open Issues</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-bg-input border-border-subtle focus:border-accent-500"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode('grid')}
              className={cn(
                'border-border-base',
                viewMode === 'grid' && 'bg-accent-500/10 border-accent-500/50'
              )}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode('list')}
              className={cn(
                'border-border-base',
                viewMode === 'list' && 'bg-accent-500/10 border-accent-500/50'
              )}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                repos.forEach((r) => handleSync(r.id));
              }}
              className="border-border-base"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync All
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading || workspaceLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-accent-500" />
          </div>
        ) : filteredRepos.length === 0 ? (
          /* Empty State */
          <Card className="p-12 bg-bg-card border-border-base text-center">
            <GitBranch className="w-12 h-12 mx-auto mb-4 text-text-muted" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              No repositories connected
            </h3>
            <p className="text-text-muted mb-6">
              Connect your GitHub account to manage all your repos from one place
            </p>
            <Button
              onClick={handleConnect}
              className="bg-gradient-to-r from-accent-500 to-accent-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Connect GitHub Account
            </Button>
          </Card>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRepos.map((repo) => (
              <Card
                key={repo.id}
                className="p-5 bg-bg-card border-border-base hover:border-accent-500/50 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {repo.is_private ? (
                      <Lock className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Unlock className="w-4 h-4 text-emerald-400" />
                    )}
                    <Link
                      href={repo.repo_url}
                      target="_blank"
                      className="font-semibold text-text-primary hover:text-accent-500 transition-colors"
                    >
                      {repo.repo_name}
                    </Link>
                    {repo.is_archived && (
                      <Archive className="w-3 h-3 text-text-muted" />
                    )}
                  </div>
                  {getSyncStatusBadge(repo.sync_status)}
                </div>

                <p className="text-sm text-text-muted mb-4 line-clamp-2 min-h-[40px]">
                  {repo.description || 'No description'}
                </p>

                {/* Language and stats */}
                <div className="flex items-center gap-4 text-xs text-text-muted mb-4">
                  {repo.language && (
                    <span className="flex items-center gap-1">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor:
                            LANGUAGE_COLORS[repo.language] || '#888',
                        }}
                      />
                      {repo.language}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    {repo.stars_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitFork className="w-3 h-3" />
                    {repo.forks_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {repo.open_issues_count}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                  <span className="text-xs text-text-muted">
                    Synced: {formatDate(repo.last_sync_at)}
                  </span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSync(repo.id)}
                      disabled={syncingRepos.has(repo.id)}
                      className="h-7 px-2"
                    >
                      <RefreshCw
                        className={cn(
                          'w-3 h-3',
                          syncingRepos.has(repo.id) && 'animate-spin'
                        )}
                      />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      asChild
                      className="h-7 px-2"
                    >
                      <Link href={repo.repo_url} target="_blank">
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* List View */
          <Card className="bg-bg-card border-border-base overflow-hidden">
            <div className="divide-y divide-border-subtle">
              {filteredRepos.map((repo) => (
                <div
                  key={repo.id}
                  className="p-4 hover:bg-bg-hover transition-colors flex items-center gap-4"
                >
                  <div className="flex-shrink-0">
                    {repo.is_private ? (
                      <Lock className="w-5 h-5 text-amber-400" />
                    ) : (
                      <Unlock className="w-5 h-5 text-emerald-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={repo.repo_url}
                        target="_blank"
                        className="font-medium text-text-primary hover:text-accent-500"
                      >
                        {repo.full_name}
                      </Link>
                      {repo.is_fork && (
                        <Badge variant="outline" className="text-xs">
                          Fork
                        </Badge>
                      )}
                      {repo.is_archived && (
                        <Badge variant="outline" className="text-xs">
                          Archived
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-text-muted truncate">
                      {repo.description || 'No description'}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-text-muted">
                    {repo.language && (
                      <span className="flex items-center gap-1">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor:
                              LANGUAGE_COLORS[repo.language] || '#888',
                          }}
                        />
                        {repo.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1 w-16">
                      <Star className="w-4 h-4" />
                      {repo.stars_count}
                    </span>
                    <span className="flex items-center gap-1 w-16">
                      <AlertCircle className="w-4 h-4" />
                      {repo.open_issues_count}
                    </span>
                    <span className="w-20">{formatSize(repo.size_kb)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {getSyncStatusBadge(repo.sync_status)}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSync(repo.id)}
                      disabled={syncingRepos.has(repo.id)}
                    >
                      <RefreshCw
                        className={cn(
                          'w-4 h-4',
                          syncingRepos.has(repo.id) && 'animate-spin'
                        )}
                      />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </Section>
    </PageContainer>
  );
}
