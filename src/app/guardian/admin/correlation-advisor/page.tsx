'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Recommendation {
  id: string;
  title: string;
  rationale: string;
  recommendation_type: string;
  source: 'ai' | 'heuristic';
  status: 'new' | 'reviewing' | 'accepted' | 'rejected' | 'applied';
  confidence?: number;
  created_at: string;
  target: Record<string, unknown>;
  recommendation: Record<string, unknown>;
  signals: Record<string, unknown>;
}

interface Annotation {
  id: string;
  cluster_id: string;
  label: string;
  category: string;
  notes?: string;
  tags: string[];
  created_at: string;
}

const STATUS_COLORS = {
  new: 'bg-info-100 text-info-800',
  reviewing: 'bg-warning-100 text-warning-800',
  accepted: 'bg-success-100 text-success-800',
  rejected: 'bg-error-100 text-error-800',
  applied: 'bg-info-100 text-info-800',
};

const SOURCE_COLORS = {
  ai: 'bg-info-100 text-info-800',
  heuristic: 'bg-bg-hover text-text-secondary',
};

export default function CorrelationAdvisorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId');
  const { toast } = useToast();

  const [tab, setTab] = useState('recommendations');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [windowDays, setWindowDays] = useState(7);
  const [showAnnotationForm, setShowAnnotationForm] = useState(false);
  const [annotationForm, setAnnotationForm] = useState({
    clusterId: '',
    label: '',
    category: 'general',
    notes: '',
    tags: '' as string,
  });

  // Filter state
  const [recFilters, setRecFilters] = useState({
    status: '',
    source: '',
  });

  // Fetch recommendations
  const fetchRecommendations = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);

    try {
      const params = new URLSearchParams({
        workspaceId,
        ...(recFilters.status && { status: recFilters.status }),
        ...(recFilters.source && { source: recFilters.source }),
      });

      const res = await fetch(`/api/guardian/ai/correlation-recommendations?${params}`);
      const data = await res.json();
      setRecommendations(data.data?.recommendations || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch recommendations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [workspaceId, recFilters, toast]);

  // Fetch annotations
  const fetchAnnotations = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);

    try {
      const res = await fetch(
        `/api/guardian/correlation/annotations?workspaceId=${workspaceId}`
      );
      const data = await res.json();
      setAnnotations(data.data?.annotations || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch annotations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [workspaceId, toast]);

  useEffect(() => {
    if (tab === 'recommendations') {
      fetchRecommendations();
    } else {
      fetchAnnotations();
    }
  }, [tab, fetchRecommendations, fetchAnnotations]);

  // Generate recommendations
  const handleGenerateRecommendations = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/guardian/ai/correlation-recommendations?workspaceId=${workspaceId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            windowDays,
            maxRecommendations: 10,
          }),
        }
      );

      if (!res.ok) throw new Error('Failed to generate recommendations');

      const data = await res.json();
      toast({
        title: 'Success',
        description: `Generated ${data.data.created} recommendations (AI: ${data.data.aiUsed})`,
      });
      setShowGenerateForm(false);
      await fetchRecommendations();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate recommendations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Update recommendation status
  const handleUpdateStatus = async (recId: string, newStatus: string) => {
    if (!workspaceId) return;

    try {
      const res = await fetch(
        `/api/guardian/ai/correlation-recommendations/${recId}?workspaceId=${workspaceId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!res.ok) throw new Error('Failed to update status');

      toast({ title: 'Success', description: 'Recommendation updated' });
      await fetchRecommendations();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update recommendation',
        variant: 'destructive',
      });
    }
  };

  // Add annotation
  const handleAddAnnotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !annotationForm.clusterId || !annotationForm.label) {
      return;
    }

    try {
      const res = await fetch(
        `/api/guardian/correlation/annotations?workspaceId=${workspaceId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clusterId: annotationForm.clusterId,
            label: annotationForm.label,
            category: annotationForm.category,
            notes: annotationForm.notes,
            tags: annotationForm.tags ? annotationForm.tags.split(',').map((t) => t.trim()) : [],
          }),
        }
      );

      if (!res.ok) throw new Error('Failed to add annotation');

      toast({ title: 'Success', description: 'Annotation added' });
      setShowAnnotationForm(false);
      setAnnotationForm({
        clusterId: '',
        label: '',
        category: 'general',
        notes: '',
        tags: '',
      });
      await fetchAnnotations();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add annotation',
        variant: 'destructive',
      });
    }
  };

  if (!workspaceId) {
    return <div className="p-6">Workspace ID required</div>;
  }

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Correlation Refinement Advisor
          </h1>
          <p className="text-text-secondary">
            AI-powered suggestions for optimizing correlation cluster parameters
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="annotations">Cluster Annotations</TabsTrigger>
          </TabsList>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-6">
            {!showGenerateForm ? (
              <Button onClick={() => setShowGenerateForm(true)}>Generate Recommendations</Button>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Generate Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleGenerateRecommendations} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Time Window (days)</label>
                      <Input
                        type="number"
                        value={windowDays}
                        onChange={(e) => setWindowDays(parseInt(e.target.value))}
                        min="1"
                        max="180"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Generating...' : 'Generate'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowGenerateForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    value={recFilters.status}
                    onValueChange={(val) =>
                      setRecFilters({ ...recFilters, status: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="reviewing">Reviewing</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="applied">Applied</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={recFilters.source}
                    onValueChange={(val) =>
                      setRecFilters({ ...recFilters, source: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      <SelectItem value="ai">AI</SelectItem>
                      <SelectItem value="heuristic">Heuristic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations List */}
            <div className="space-y-4">
              {recommendations.length === 0 ? (
                <p className="text-text-secondary">No recommendations</p>
              ) : (
                recommendations.map((rec) => (
                  <Card
                    key={rec.id}
                    className="cursor-pointer hover:border-accent-500"
                    onClick={() => setSelectedRec(rec)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <CardTitle>{rec.title}</CardTitle>
                          <CardDescription>{rec.rationale}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={SOURCE_COLORS[rec.source]}>
                            {rec.source}
                          </Badge>
                          <Badge className={STATUS_COLORS[rec.status]}>
                            {rec.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-text-secondary">Type:</span>{' '}
                          {rec.recommendation_type}
                        </div>
                        <div>
                          <span className="text-text-secondary">Confidence:</span>{' '}
                          {rec.confidence ? (rec.confidence * 100).toFixed(0) : 'N/A'}%
                        </div>
                        <div>
                          <span className="text-text-secondary">Created:</span>{' '}
                          {new Date(rec.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      {selectedRec?.id === rec.id && (
                        <div className="mt-4 p-4 bg-bg-card rounded border border-border">
                          <div className="space-y-2 text-sm mb-4">
                            <div>
                              <strong>Target:</strong>{' '}
                              {JSON.stringify(rec.target, null, 2)}
                            </div>
                            <div>
                              <strong>Recommendation:</strong>{' '}
                              {JSON.stringify(rec.recommendation, null, 2)}
                            </div>
                          </div>

                          <div className="flex gap-2 flex-wrap">
                            {rec.status === 'new' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateStatus(rec.id, 'reviewing')}
                                >
                                  Mark Reviewing
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateStatus(rec.id, 'accepted')}
                                >
                                  Accept
                                </Button>
                              </>
                            )}
                            {rec.status === 'accepted' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateStatus(rec.id, 'applied')}
                              >
                                Mark Applied
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(rec.id, 'rejected')}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Annotations Tab */}
          <TabsContent value="annotations" className="space-y-6">
            {!showAnnotationForm ? (
              <Button onClick={() => setShowAnnotationForm(true)}>Add Annotation</Button>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Add Cluster Annotation</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddAnnotation} className="space-y-4">
                    <Input
                      placeholder="Cluster ID (UUID)"
                      value={annotationForm.clusterId}
                      onChange={(e) =>
                        setAnnotationForm({ ...annotationForm, clusterId: e.target.value })
                      }
                      required
                    />
                    <Input
                      placeholder="Label"
                      value={annotationForm.label}
                      onChange={(e) =>
                        setAnnotationForm({ ...annotationForm, label: e.target.value })
                      }
                      required
                    />
                    <Select
                      value={annotationForm.category}
                      onValueChange={(val) =>
                        setAnnotationForm({ ...annotationForm, category: val })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="incident">Incident</SelectItem>
                        <SelectItem value="noise">Noise</SelectItem>
                        <SelectItem value="pattern">Pattern</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Notes (optional)"
                      value={annotationForm.notes}
                      onChange={(e) =>
                        setAnnotationForm({ ...annotationForm, notes: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Tags (comma-separated, optional)"
                      value={annotationForm.tags}
                      onChange={(e) =>
                        setAnnotationForm({ ...annotationForm, tags: e.target.value })
                      }
                    />
                    <div className="flex gap-2">
                      <Button type="submit">Add</Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAnnotationForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Annotations List */}
            <div className="space-y-4">
              {annotations.length === 0 ? (
                <p className="text-text-secondary">No annotations</p>
              ) : (
                annotations.map((ann) => (
                  <Card key={ann.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{ann.label}</CardTitle>
                          <CardDescription>
                            Cluster: {ann.cluster_id.slice(0, 8)}... •{' '}
                            {new Date(ann.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Badge variant="outline">{ann.category}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {ann.notes && <p className="text-sm">{ann.notes}</p>}
                      {ann.tags.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {ann.tags.map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
