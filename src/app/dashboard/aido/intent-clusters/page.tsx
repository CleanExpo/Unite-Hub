'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Target,
  Plus,
  Search,
  TrendingUp,
  Users,
  Brain,
  Zap,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye
} from 'lucide-react';

interface IntentCluster {
  id: string;
  topicId: string;
  primaryIntent: string;
  searcherMindset: string;
  businessImpact: number;
  difficultyScore: number;
  alignmentScore: number;
  questions: Array<{ question: string; searchVolume?: number }>;
  competitiveGap?: string;
  contentOpportunity?: string;
  createdAt: string;
}

interface Topic {
  id: string;
  name: string;
  slug: string;
}

export default function IntentClustersPage() {
  const { currentOrganization } = useAuth();
  const [clusters, setClusters] = useState<IntentCluster[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [seedKeywords, setSeedKeywords] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [competitorDomains, setCompetitorDomains] = useState('');

  useEffect(() => {
    if (currentOrganization?.org_id) {
      fetchData();
    }
  }, [currentOrganization]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const session = await (await import('@/lib/supabase')).supabaseBrowser.auth.getSession();
      const token = session.data.session?.access_token;

      const params = new URLSearchParams({
        workspaceId: currentOrganization!.org_id
      });

      // Fetch topics
      const topicsRes = await fetch(`/api/aido/topics?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const topicsData = await topicsRes.json();

      // Fetch intent clusters
      const clustersRes = await fetch(`/api/aido/intent-clusters?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const clustersData = await clustersRes.json();

      if (topicsData.success) {
        setTopics(topicsData.topics);
      }

      if (clustersData.success) {
        setClusters(clustersData.clusters);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCluster = async () => {
    if (!selectedTopic || !seedKeywords) {
      alert('Please select a topic and enter seed keywords');
      return;
    }

    setGenerating(true);
    try {
      const session = await (await import('@/lib/supabase')).supabaseBrowser.auth.getSession();
      const token = session.data.session?.access_token;

      const params = new URLSearchParams({
        workspaceId: currentOrganization!.org_id
      });

      const response = await fetch(`/api/aido/intent-clusters/generate?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          topicId: selectedTopic,
          seedKeywords: seedKeywords.split(',').map(k => k.trim()),
          industry,
          location,
          competitorDomains: competitorDomains ? competitorDomains.split(',').map(d => d.trim()) : undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`Intent cluster generated successfully! Cost: ~$0.40`);
        setDialogOpen(false);
        resetForm();
        fetchData();
      } else {
        alert(data.error || 'Failed to generate intent cluster');
      }
    } catch (error) {
      console.error('Failed to generate cluster:', error);
      alert('Failed to generate intent cluster');
    } finally {
      setGenerating(false);
    }
  };

  const resetForm = () => {
    setSelectedTopic('');
    setSeedKeywords('');
    setIndustry('');
    setLocation('');
    setCompetitorDomains('');
  };

  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-600 dark:text-green-400';
    if (score >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 0.8) return 'bg-green-100 dark:bg-green-900/20';
    if (score >= 0.6) return 'bg-yellow-100 dark:bg-yellow-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  const calculateCompositeScore = (cluster: IntentCluster): number => {
    return (
      cluster.businessImpact * 0.4 +
      (1 - cluster.difficultyScore) * 0.3 +
      cluster.alignmentScore * 0.3
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Intent Clusters Manager</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Question-based clusters that users actually ask AI systems
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Generate Cluster
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Generate Intent Cluster with AI</DialogTitle>
              <DialogDescription>
                Uses Perplexity Sonar + Claude Opus 4 to discover real search intents (~$0.40 per cluster)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="topic">Topic *</Label>
                <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a topic..." />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map(topic => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="seedKeywords">Seed Keywords * (comma-separated)</Label>
                <Input
                  id="seedKeywords"
                  placeholder="stainless steel balustrades, glass railings, modern handrails"
                  value={seedKeywords}
                  onChange={(e) => setSeedKeywords(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="industry">Industry (optional)</Label>
                  <Input
                    id="industry"
                    placeholder="construction, manufacturing, etc."
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="location">Location (optional)</Label>
                  <Input
                    id="location"
                    placeholder="Brisbane, Australia"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="competitors">Competitor Domains (optional, comma-separated)</Label>
                <Textarea
                  id="competitors"
                  placeholder="competitor1.com.au, competitor2.com.au"
                  value={competitorDomains}
                  onChange={(e) => setCompetitorDomains(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>What you'll get:</strong> 10-15 questions users actually ask, organized by searcher mindset,
                  with business impact scores, difficulty analysis, and competitive gaps. Perfect for H2 headings.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={generating}>
                Cancel
              </Button>
              <Button onClick={handleGenerateCluster} disabled={generating}>
                {generating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {generating ? 'Generating...' : 'Generate Cluster (~$0.40)'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Total Clusters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{clusters.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Brain className="w-4 h-4 mr-2" />
              Total Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {clusters.reduce((sum, c) => sum + (c.questions?.length || 0), 0)}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              H2-ready questions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Avg Business Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(clusters.length > 0 ? clusters.reduce((sum, c) => sum + c.businessImpact, 0) / clusters.length : 0)}`}>
              {clusters.length > 0 ? ((clusters.reduce((sum, c) => sum + c.businessImpact, 0) / clusters.length) * 100).toFixed(0) : 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Zap className="w-4 h-4 mr-2" />
              High-Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {clusters.filter(c => calculateCompositeScore(c) >= 0.7).length}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Composite score ≥70%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Intent Clusters List */}
      <Card>
        <CardHeader>
          <CardTitle>Intent Clusters ({clusters.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <Loader2 className="w-8 h-8 mx-auto animate-spin mb-4" />
              Loading intent clusters...
            </div>
          ) : clusters.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-2">No intent clusters yet</p>
              <p className="text-sm text-gray-400 mb-4">
                Generate your first cluster to discover what questions users are asking
              </p>
              <Button onClick={() => setDialogOpen(true)} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Generate Your First Cluster
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {clusters.map((cluster) => (
                <Card key={cluster.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold">{cluster.primaryIntent}</h3>
                            <Badge variant="outline" className="text-xs">
                              {cluster.questions?.length || 0} questions
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            <strong>Searcher Mindset:</strong> {cluster.searcherMindset}
                          </p>
                        </div>
                      </div>

                      {/* Scores */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Business Impact */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-gray-500">Business Impact</p>
                            <span className={`text-sm font-medium ${getScoreColor(cluster.businessImpact)}`}>
                              {(cluster.businessImpact * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className={`w-full h-2 rounded-full ${getScoreBgColor(cluster.businessImpact)}`}>
                            <div
                              className={`h-2 rounded-full ${cluster.businessImpact >= 0.8 ? 'bg-green-600' : cluster.businessImpact >= 0.6 ? 'bg-yellow-600' : 'bg-red-600'}`}
                              style={{ width: `${cluster.businessImpact * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Difficulty */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-gray-500">Difficulty</p>
                            <span className={`text-sm font-medium ${getScoreColor(1 - cluster.difficultyScore)}`}>
                              {(cluster.difficultyScore * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className={`w-full h-2 rounded-full ${getScoreBgColor(1 - cluster.difficultyScore)}`}>
                            <div
                              className={`h-2 rounded-full ${cluster.difficultyScore <= 0.3 ? 'bg-green-600' : cluster.difficultyScore <= 0.6 ? 'bg-yellow-600' : 'bg-red-600'}`}
                              style={{ width: `${cluster.difficultyScore * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Alignment */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-gray-500">Alignment</p>
                            <span className={`text-sm font-medium ${getScoreColor(cluster.alignmentScore)}`}>
                              {(cluster.alignmentScore * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className={`w-full h-2 rounded-full ${getScoreBgColor(cluster.alignmentScore)}`}>
                            <div
                              className={`h-2 rounded-full ${cluster.alignmentScore >= 0.8 ? 'bg-green-600' : cluster.alignmentScore >= 0.6 ? 'bg-yellow-600' : 'bg-red-600'}`}
                              style={{ width: `${cluster.alignmentScore * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Composite Score */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-gray-500">Composite</p>
                            <span className={`text-sm font-bold ${getScoreColor(calculateCompositeScore(cluster))}`}>
                              {(calculateCompositeScore(cluster) * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className={`w-full h-2 rounded-full ${getScoreBgColor(calculateCompositeScore(cluster))}`}>
                            <div
                              className={`h-2 rounded-full ${calculateCompositeScore(cluster) >= 0.8 ? 'bg-green-600' : calculateCompositeScore(cluster) >= 0.6 ? 'bg-yellow-600' : 'bg-red-600'}`}
                              style={{ width: `${calculateCompositeScore(cluster) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Priority Badge */}
                      {calculateCompositeScore(cluster) >= 0.7 && (
                        <div>
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            High Priority Target
                          </Badge>
                        </div>
                      )}

                      {/* Insights */}
                      {(cluster.competitiveGap || cluster.contentOpportunity) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                          {cluster.competitiveGap && (
                            <div>
                              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 flex items-center">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Competitive Gap
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {cluster.competitiveGap}
                              </p>
                            </div>
                          )}
                          {cluster.contentOpportunity && (
                            <div>
                              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 flex items-center">
                                <Zap className="w-3 h-3 mr-1" />
                                Content Opportunity
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {cluster.contentOpportunity}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Questions Preview */}
                      {cluster.questions && cluster.questions.length > 0 && (
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                              Questions (H2-Ready)
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {cluster.questions.length} questions
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            {cluster.questions.slice(0, 5).map((q, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-sm">
                                <span className="text-blue-600 dark:text-blue-400 font-medium min-w-[24px]">
                                  Q{idx + 1}:
                                </span>
                                <span className="text-gray-700 dark:text-gray-300">
                                  {q.question}
                                </span>
                                {q.searchVolume && (
                                  <Badge variant="outline" className="text-xs ml-auto">
                                    {q.searchVolume} vol
                                  </Badge>
                                )}
                              </div>
                            ))}
                            {cluster.questions.length > 5 && (
                              <p className="text-xs text-gray-500 pl-6">
                                + {cluster.questions.length - 5} more questions
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View All Questions
                        </Button>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <Zap className="w-4 h-4 mr-2" />
                          Generate Content
                        </Button>
                      </div>
                    </div>
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
