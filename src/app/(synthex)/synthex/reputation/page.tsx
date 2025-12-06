'use client';

/**
 * Synthex Reputation & Reviews Page
 * Phase: B21 - Reputation & Reviews Engine
 *
 * Displays reputation summary, reviews, and AI-powered insights.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Star,
  StarHalf,
  TrendingUp,
  TrendingDown,
  Minus,
  MessageSquare,
  Brain,
  Sparkles,
  ExternalLink,
  Reply,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { useSynthexTenant } from '@/hooks/useSynthexTenant';

interface ReputationSummary {
  avgRating: number;
  totalReviews: number;
  reviewCount30d: number;
  reviewCount90d: number;
  responseRate: number;
  trendScore: number | null;
  trendDirection: 'improving' | 'declining' | 'stable' | null;
  ratingDistribution: {
    '5': number;
    '4': number;
    '3': number;
    '2': number;
    '1': number;
  };
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  sourceCounts: {
    google: number;
    facebook: number;
    yelp: number;
    trustpilot: number;
    custom: number;
  };
}

interface Review {
  id: string;
  source: string;
  authorName: string;
  rating: number;
  title?: string;
  body: string;
  response?: string;
  respondedAt?: string;
  createdAt: string;
  externalUrl?: string;
}

interface ReviewInsight {
  summary?: string;
  sentiment?: string;
  sentimentScore?: number;
  priority?: string;
  urgencyScore?: number;
  requiresResponse?: boolean;
  actionItems?: Array<{ description: string; type: string; priority: string }>;
  suggestedResponse?: string;
  riskFlags?: Array<{ type: string; description: string; severity: string }>;
}

export default function ReputationPage() {
  const { tenantId } = useSynthexTenant();
  const [summary, setSummary] = useState<ReputationSummary | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [reviewInsight, setReviewInsight] = useState<ReviewInsight | null>(null);
  const [suggestedResponse, setSuggestedResponse] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [savingResponse, setSavingResponse] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);

  // Filters
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [responseFilter, setResponseFilter] = useState<string>('all');

  // Load reputation summary
  const loadSummary = async () => {
    if (!tenantId) return;

    try {
      const res = await fetch(`/api/synthex/reputation/summary?tenantId=${tenantId}`);
      const data = await res.json();

      if (res.ok) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to load summary:', err);
    }
  };

  // Load reviews
  const loadReviews = async () => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ tenantId, limit: '100' });

      if (sourceFilter !== 'all') {
        params.append('source', sourceFilter);
      }

      if (ratingFilter === 'positive') {
        params.append('minRating', '4');
      } else if (ratingFilter === 'neutral') {
        params.append('minRating', '2.5');
        params.append('maxRating', '3.9');
      } else if (ratingFilter === 'negative') {
        params.append('maxRating', '2.4');
      }

      if (responseFilter === 'responded') {
        params.append('hasResponse', 'true');
      } else if (responseFilter === 'pending') {
        params.append('hasResponse', 'false');
      }

      const res = await fetch(`/api/synthex/reviews?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load reviews');
      }

      setReviews(data.reviews || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  // Analyze review with AI
  const handleAnalyze = async (review: Review) => {
    setSelectedReview(review);
    setReviewInsight(null);
    setSuggestedResponse('');
    setSidePanelOpen(true);
    setLoadingInsight(true);

    try {
      const res = await fetch('/api/synthex/reviews/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId: review.id, tenantId }),
      });

      const data = await res.json();

      if (res.ok) {
        setReviewInsight(data.insight);
      }
    } catch (err) {
      console.error('Failed to analyze review:', err);
    } finally {
      setLoadingInsight(false);
    }
  };

  // Generate suggested response
  const handleDraftResponse = async () => {
    if (!selectedReview) return;

    setLoadingResponse(true);

    try {
      const res = await fetch('/api/synthex/reviews/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId: selectedReview.id, tenantId }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuggestedResponse(data.suggestedResponse);
      }
    } catch (err) {
      console.error('Failed to generate response:', err);
    } finally {
      setLoadingResponse(false);
    }
  };

  // Save response
  const handleSaveResponse = async () => {
    if (!selectedReview || !suggestedResponse.trim()) return;

    setSavingResponse(true);

    try {
      const res = await fetch('/api/synthex/reviews/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: selectedReview.id,
          tenantId,
          action: 'save',
          response: suggestedResponse,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Update the review in the list
        setReviews((prev) =>
          prev.map((r) =>
            r.id === selectedReview.id
              ? { ...r, response: suggestedResponse, respondedAt: new Date().toISOString() }
              : r
          )
        );
        setSidePanelOpen(false);
        loadSummary(); // Refresh summary
      }
    } catch (err) {
      console.error('Failed to save response:', err);
    } finally {
      setSavingResponse(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      loadSummary();
      loadReviews();
    }
  }, [tenantId, sourceFilter, ratingFilter, responseFilter]);

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />);
    }

    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="h-4 w-4 fill-yellow-500 text-yellow-500" />);
    }

    const remaining = 5 - stars.length;
    for (let i = 0; i < remaining; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-gray-600" />);
    }

    return stars;
  };

  const getTrendIcon = (direction: string | null) => {
    if (direction === 'improving') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (direction === 'declining') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/20 text-red-300 border-red-500/50';
      case 'high':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/50';
      case 'normal':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Reputation & Reviews</h1>
            <p className="text-gray-400 mt-1">Monitor and respond to customer reviews</p>
          </div>
          <Button
            onClick={() => {
              loadSummary();
              loadReviews();
            }}
            variant="outline"
            className="border-gray-700 bg-gray-900 text-white hover:bg-gray-800"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Average Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-white">
                    {summary.avgRating.toFixed(1)}
                  </span>
                  <div className="flex">{renderStars(summary.avgRating)}</div>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  {summary.totalReviews} total reviews
                </p>
              </CardContent>
            </Card>

            <Card className="border-gray-800 bg-gray-900">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{summary.reviewCount30d}</div>
                <p className="mt-2 text-sm text-gray-500">Reviews last 30 days</p>
              </CardContent>
            </Card>

            <Card className="border-gray-800 bg-gray-900">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Response Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  {summary.responseRate.toFixed(0)}%
                </div>
                <p className="mt-2 text-sm text-gray-500">Reviews responded to</p>
              </CardContent>
            </Card>

            <Card className="border-gray-800 bg-gray-900">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {getTrendIcon(summary.trendDirection)}
                  <span className="text-3xl font-bold text-white">
                    {summary.trendDirection || 'N/A'}
                  </span>
                </div>
                {summary.trendScore !== null && (
                  <p className="mt-2 text-sm text-gray-500">Score: {summary.trendScore}</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="border-gray-800 bg-gray-900">
          <CardHeader>
            <CardTitle className="text-white">
              <Filter className="mr-2 inline-block h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-400">Source</label>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-white"
                >
                  <option value="all">All Sources</option>
                  <option value="google">Google</option>
                  <option value="facebook">Facebook</option>
                  <option value="yelp">Yelp</option>
                  <option value="trustpilot">Trustpilot</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-400">Rating</label>
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-white"
                >
                  <option value="all">All Ratings</option>
                  <option value="positive">Positive (4-5★)</option>
                  <option value="neutral">Neutral (2.5-4★)</option>
                  <option value="negative">Negative (0-2.5★)</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-400">Response</label>
                <select
                  value={responseFilter}
                  onChange={(e) => setResponseFilter(e.target.value)}
                  className="rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-white"
                >
                  <option value="all">All Reviews</option>
                  <option value="pending">Pending Response</option>
                  <option value="responded">Responded</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reviews Table */}
        <Card className="border-gray-800 bg-gray-900">
          <CardHeader>
            <CardTitle className="text-white">
              <MessageSquare className="mr-2 inline-block h-5 w-5" />
              Reviews ({reviews.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12 text-red-400">
                <AlertCircle className="mr-2 h-5 w-5" />
                {error}
              </div>
            ) : reviews.length === 0 ? (
              <div className="py-12 text-center text-gray-500">No reviews found</div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-lg border border-gray-800 bg-gray-950 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex">{renderStars(review.rating)}</div>
                          <Badge
                            variant="outline"
                            className="border-gray-700 bg-gray-900 text-gray-300"
                          >
                            {review.source}
                          </Badge>
                          {review.respondedAt ? (
                            <Badge variant="outline" className="border-green-700 bg-green-900/20 text-green-400">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Responded
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-orange-700 bg-orange-900/20 text-orange-400">
                              <Clock className="mr-1 h-3 w-3" />
                              Pending
                            </Badge>
                          )}
                        </div>
                        <p className="mt-2 font-medium text-white">{review.authorName}</p>
                        {review.title && (
                          <p className="mt-1 text-sm font-medium text-gray-300">
                            {review.title}
                          </p>
                        )}
                        <p className="mt-2 text-gray-400">{review.body}</p>
                        {review.response && (
                          <div className="mt-4 rounded-md border border-gray-700 bg-gray-900 p-3">
                            <p className="text-sm font-medium text-gray-400">Your Response:</p>
                            <p className="mt-1 text-gray-300">{review.response}</p>
                          </div>
                        )}
                        <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                          <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                          {review.externalUrl && (
                            <a
                              href={review.externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-blue-400 hover:text-blue-300"
                            >
                              View on {review.source}
                              <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col gap-2">
                        <Button
                          onClick={() => handleAnalyze(review)}
                          size="sm"
                          variant="outline"
                          className="border-gray-700 bg-gray-900 text-white hover:bg-gray-800"
                        >
                          <Brain className="mr-2 h-4 w-4" />
                          Analyze
                        </Button>
                        {!review.response && (
                          <Button
                            onClick={() => {
                              setSelectedReview(review);
                              setSidePanelOpen(true);
                              handleDraftResponse();
                            }}
                            size="sm"
                            variant="outline"
                            className="border-gray-700 bg-gray-900 text-white hover:bg-gray-800"
                          >
                            <Reply className="mr-2 h-4 w-4" />
                            Respond
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Side Panel for Insights and Response */}
      <Dialog open={sidePanelOpen} onOpenChange={setSidePanelOpen}>
        <DialogContent className="max-w-2xl border-gray-800 bg-gray-900 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Review Analysis</DialogTitle>
            <DialogDescription className="text-gray-400">
              AI-powered insights and response suggestion
            </DialogDescription>
          </DialogHeader>

          {selectedReview && (
            <div className="mt-6 space-y-6">
              {/* Review Summary */}
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-400">Review</h3>
                <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex">{renderStars(selectedReview.rating)}</div>
                    <span className="text-gray-400">by {selectedReview.authorName}</span>
                  </div>
                  <p className="mt-2 text-gray-300">{selectedReview.body}</p>
                </div>
              </div>

              {/* Insights */}
              {loadingInsight ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                </div>
              ) : (
                reviewInsight && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-400">AI Insights</h3>

                    {reviewInsight.summary && (
                      <div>
                        <p className="text-sm text-gray-500">Summary</p>
                        <p className="mt-1 text-gray-300">{reviewInsight.summary}</p>
                      </div>
                    )}

                    <div className="flex gap-4">
                      {reviewInsight.sentiment && (
                        <div>
                          <p className="text-sm text-gray-500">Sentiment</p>
                          <Badge
                            variant="outline"
                            className={
                              reviewInsight.sentiment === 'positive'
                                ? 'border-green-700 bg-green-900/20 text-green-400'
                                : reviewInsight.sentiment === 'negative'
                                ? 'border-red-700 bg-red-900/20 text-red-400'
                                : 'border-gray-700 bg-gray-900 text-gray-300'
                            }
                          >
                            {reviewInsight.sentiment}
                          </Badge>
                        </div>
                      )}

                      {reviewInsight.priority && (
                        <div>
                          <p className="text-sm text-gray-500">Priority</p>
                          <Badge variant="outline" className={getPriorityColor(reviewInsight.priority)}>
                            {reviewInsight.priority}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {reviewInsight.actionItems && reviewInsight.actionItems.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500">Action Items</p>
                        <ul className="mt-2 space-y-2">
                          {reviewInsight.actionItems.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
                              {item.description}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {reviewInsight.riskFlags && reviewInsight.riskFlags.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500">Risk Flags</p>
                        <div className="mt-2 space-y-2">
                          {reviewInsight.riskFlags.map((flag, idx) => (
                            <div
                              key={idx}
                              className="rounded-md border border-red-800 bg-red-900/20 p-2 text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-red-400" />
                                <span className="font-medium text-red-400">{flag.type}</span>
                              </div>
                              <p className="mt-1 text-red-300">{flag.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}

              {/* Suggested Response */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-400">Response</h3>
                  <Button
                    onClick={handleDraftResponse}
                    disabled={loadingResponse}
                    size="sm"
                    variant="outline"
                    className="border-gray-700 bg-gray-900 text-white hover:bg-gray-800"
                  >
                    {loadingResponse ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Generate
                  </Button>
                </div>
                <textarea
                  value={suggestedResponse}
                  onChange={(e) => setSuggestedResponse(e.target.value)}
                  placeholder="AI-generated response will appear here..."
                  rows={6}
                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-3 text-white placeholder-gray-500"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handleSaveResponse}
                  disabled={!suggestedResponse.trim() || savingResponse}
                  className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                >
                  {savingResponse ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Save Response
                </Button>
                <Button
                  onClick={() => setSidePanelOpen(false)}
                  variant="outline"
                  className="border-gray-700 bg-gray-900 text-white hover:bg-gray-800"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
