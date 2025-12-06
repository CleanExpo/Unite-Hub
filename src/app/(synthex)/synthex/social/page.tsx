'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Share2,
  Plus,
  RefreshCw,
  Loader2,
  Calendar,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Sparkles,
  Hash,
  Image,
  Link,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  Facebook,
} from 'lucide-react';
import { useSynthexTenant } from '@/hooks/useSynthexTenant';

interface SocialAccount {
  id: string;
  provider: string;
  account_name?: string;
  account_handle?: string;
  connection_status: string;
  follower_count?: number;
}

interface SocialPost {
  id: string;
  account_id: string;
  content_type: string;
  text_content?: string;
  hashtags: string[];
  status: string;
  scheduled_for?: string;
  published_at?: string;
  platform_url?: string;
}

interface SocialSummary {
  connected_accounts: number;
  scheduled_posts: number;
  published_today: number;
  accounts_by_platform: Record<string, number>;
}

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  facebook: <Facebook className="h-4 w-4" />,
  instagram: <Instagram className="h-4 w-4" />,
  linkedin: <Linkedin className="h-4 w-4" />,
  twitter: <Twitter className="h-4 w-4" />,
  youtube: <Youtube className="h-4 w-4" />,
  tiktok: <Share2 className="h-4 w-4" />,
  threads: <Hash className="h-4 w-4" />,
  pinterest: <Image className="h-4 w-4" />,
  reddit: <Share2 className="h-4 w-4" />,
};

const PLATFORM_COLORS: Record<string, string> = {
  facebook: 'bg-blue-600/20 text-blue-400 border-blue-500/30',
  instagram: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  linkedin: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  twitter: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  youtube: 'bg-red-500/20 text-red-400 border-red-500/30',
  tiktok: 'bg-black/20 text-white border-gray-500/30',
  threads: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  pinterest: 'bg-red-600/20 text-red-400 border-red-500/30',
  reddit: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-400',
  scheduled: 'bg-blue-500/20 text-blue-400',
  publishing: 'bg-yellow-500/20 text-yellow-400',
  published: 'bg-green-500/20 text-green-400',
  failed: 'bg-red-500/20 text-red-400',
  cancelled: 'bg-gray-500/20 text-gray-400',
};

export default function SocialSchedulerPage() {
  const { tenantId, isLoading: tenantLoading } = useSynthexTenant();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [summary, setSummary] = useState<SocialSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // New post form state
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postHashtags, setPostHashtags] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [creating, setCreating] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const [accountsRes, summaryRes, postsRes] = await Promise.all([
        fetch(`/api/synthex/social/accounts?tenantId=${tenantId}`),
        fetch(`/api/synthex/social/accounts?tenantId=${tenantId}&action=summary`),
        fetch(`/api/synthex/social/posts?tenantId=${tenantId}&limit=20`),
      ]);

      if (accountsRes.ok) {
        const data = await accountsRes.json();
        setAccounts(data.accounts || []);
      }

      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data.summary || null);
      }

      if (postsRes.ok) {
        const data = await postsRes.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Error fetching social data:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreatePost = async () => {
    if (!tenantId || !selectedAccountId || !postContent.trim()) return;
    setCreating(true);
    try {
      const hashtags = postHashtags
        .split(/[,\s]+/)
        .filter(Boolean)
        .map((h) => h.replace(/^#/, ''));

      const res = await fetch('/api/synthex/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          account_id: selectedAccountId,
          text_content: postContent.trim(),
          hashtags,
          scheduled_for: scheduledTime || undefined,
        }),
      });

      if (res.ok) {
        setPostContent('');
        setPostHashtags('');
        setScheduledTime('');
        fetchData();
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleOptimizeContent = async () => {
    if (!postContent.trim() || !selectedAccountId) return;

    const account = accounts.find((a) => a.id === selectedAccountId);
    if (!account) return;

    setOptimizing(true);
    try {
      const res = await fetch('/api/synthex/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          action: 'rewrite',
          content: postContent,
          platform: account.provider,
          include_hashtags: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          setPostContent(data.result.text);
          if (data.result.hashtags?.length > 0) {
            setPostHashtags(data.result.hashtags.join(', '));
          }
        }
      }
    } catch (error) {
      console.error('Error optimizing content:', error);
    } finally {
      setOptimizing(false);
    }
  };

  const handlePublishPost = async (postId: string) => {
    if (!tenantId) return;
    try {
      await fetch('/api/synthex/social/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          action: 'publish',
          post_id: postId,
        }),
      });
      fetchData();
    } catch (error) {
      console.error('Error publishing post:', error);
    }
  };

  if (tenantLoading || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-accent-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Share2 className="h-7 w-7 text-accent-500" />
            Social Media Scheduler
          </h1>
          <p className="text-text-secondary mt-1">
            Schedule and automate posts across all your social platforms
          </p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-bg-card border-border-default">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Link className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Connected</p>
                <p className="text-2xl font-bold text-text-primary">
                  {summary?.connected_accounts || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-bg-card border-border-default">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Clock className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Scheduled</p>
                <p className="text-2xl font-bold text-text-primary">
                  {summary?.scheduled_posts || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-bg-card border-border-default">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Published Today</p>
                <p className="text-2xl font-bold text-text-primary">
                  {summary?.published_today || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-bg-card border-border-default">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary?.accounts_by_platform || {}).map(([platform, count]) => (
                <Badge
                  key={platform}
                  className={PLATFORM_COLORS[platform] || 'bg-gray-500/20 text-gray-400'}
                >
                  {PLATFORM_ICONS[platform]} {count}
                </Badge>
              ))}
              {Object.keys(summary?.accounts_by_platform || {}).length === 0 && (
                <p className="text-sm text-text-secondary">No platforms connected</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="compose" className="space-y-4">
        <TabsList className="bg-bg-surface">
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="scheduled">
            Scheduled
            {posts.filter((p) => p.status === 'scheduled').length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {posts.filter((p) => p.status === 'scheduled').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-4">
          <Card className="bg-bg-card border-border-default">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-accent-500" />
                Create New Post
              </CardTitle>
              <CardDescription>
                Compose and schedule content with AI-powered optimization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {accounts.length === 0 ? (
                <div className="text-center py-8">
                  <Share2 className="h-12 w-12 mx-auto text-text-secondary mb-4" />
                  <p className="text-text-secondary mb-4">
                    No social accounts connected. Connect an account to start posting.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-sm text-text-secondary mb-2 block">Account</label>
                    <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                      <SelectTrigger className="bg-bg-surface border-border-default">
                        <SelectValue placeholder="Select an account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            <div className="flex items-center gap-2">
                              {PLATFORM_ICONS[account.provider]}
                              <span>
                                {account.account_name || account.account_handle || account.provider}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-text-secondary">Content</label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleOptimizeContent}
                        disabled={optimizing || !postContent.trim() || !selectedAccountId}
                      >
                        {optimizing ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4 mr-1" />
                        )}
                        AI Optimize
                      </Button>
                    </div>
                    <Textarea
                      placeholder="Write your post content..."
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      className="bg-bg-surface border-border-default min-h-[120px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-text-secondary mb-2 block">
                        Hashtags (comma separated)
                      </label>
                      <Input
                        placeholder="marketing, socialmedia, business"
                        value={postHashtags}
                        onChange={(e) => setPostHashtags(e.target.value)}
                        className="bg-bg-surface border-border-default"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-text-secondary mb-2 block">
                        Schedule (optional)
                      </label>
                      <Input
                        type="datetime-local"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="bg-bg-surface border-border-default"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreatePost}
                      disabled={creating || !selectedAccountId || !postContent.trim()}
                    >
                      {creating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : scheduledTime ? (
                        <Calendar className="h-4 w-4 mr-2" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      {scheduledTime ? 'Schedule Post' : 'Save as Draft'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <Card className="bg-bg-card border-border-default">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-accent-500" />
                Scheduled & Recent Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {posts.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-text-secondary mb-4" />
                  <p className="text-text-secondary">No posts yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {posts.map((post) => {
                    const account = accounts.find((a) => a.id === post.account_id);
                    return (
                      <div
                        key={post.id}
                        className="flex items-start gap-4 p-4 rounded-lg bg-bg-surface"
                      >
                        <div
                          className={`p-2 rounded-lg ${
                            PLATFORM_COLORS[account?.provider || ''] || 'bg-gray-500/20'
                          }`}
                        >
                          {PLATFORM_ICONS[account?.provider || ''] || <Share2 className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-text-primary line-clamp-2">
                            {post.text_content || 'No content'}
                          </p>
                          {post.hashtags?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {post.hashtags.slice(0, 3).map((tag, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  #{tag}
                                </Badge>
                              ))}
                              {post.hashtags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{post.hashtags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                          <p className="text-xs text-text-secondary mt-2">
                            {post.scheduled_for
                              ? `Scheduled: ${new Date(post.scheduled_for).toLocaleString()}`
                              : post.published_at
                              ? `Published: ${new Date(post.published_at).toLocaleString()}`
                              : 'Draft'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={STATUS_COLORS[post.status]}>{post.status}</Badge>
                          {post.status === 'draft' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePublishPost(post.id)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          <Card className="bg-bg-card border-border-default">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5 text-accent-500" />
                Connected Accounts
              </CardTitle>
              <CardDescription>
                Manage your connected social media accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {accounts.length === 0 ? (
                <div className="text-center py-8">
                  <Share2 className="h-12 w-12 mx-auto text-text-secondary mb-4" />
                  <p className="text-text-secondary mb-4">No accounts connected yet</p>
                  <p className="text-xs text-text-secondary">
                    Account connection will be available through OAuth integration
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center gap-4 p-4 rounded-lg bg-bg-surface"
                    >
                      <div
                        className={`p-3 rounded-lg ${
                          PLATFORM_COLORS[account.provider] || 'bg-gray-500/20'
                        }`}
                      >
                        {PLATFORM_ICONS[account.provider] || <Share2 className="h-5 w-5" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-text-primary">
                          {account.account_name || account.provider}
                        </p>
                        {account.account_handle && (
                          <p className="text-sm text-text-secondary">@{account.account_handle}</p>
                        )}
                      </div>
                      <div className="text-right">
                        {account.follower_count && (
                          <p className="text-sm text-text-primary">
                            {account.follower_count.toLocaleString()} followers
                          </p>
                        )}
                        <Badge
                          className={
                            account.connection_status === 'connected'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }
                        >
                          {account.connection_status === 'connected' ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {account.connection_status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
