'use client';

/**
 * Market Intelligence Dashboard
 * Displays geographic and content gap analysis powered by Scout + Auditor agents
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, FileText, Play, Image } from 'lucide-react';

export default function MarketIntelligencePage() {
  const [loading, setLoading] = useState(true);
  const [scoutLoading, setScoutLoading] = useState(false);
  const [overview, setOverview] = useState<any>(null);
  const [selectedPathway, setSelectedPathway] = useState<'geographic' | 'content'>('geographic');

  // Load overview data
  useEffect(() => {
    async function loadOverview() {
      try {
        // TODO: Get clientId and workspaceId from auth context
        const clientId = 'placeholder-client-id';
        const workspaceId = 'placeholder-workspace-id';

        const res = await fetch(`/api/client/market-intelligence?clientId=${clientId}&workspaceId=${workspaceId}`);
        const data = await res.json();

        if (data.success) {
          setOverview(data.data);
        }
      } catch (error) {
        console.error('Failed to load overview:', error);
      } finally {
        setLoading(false);
      }
    }

    loadOverview();
  }, []);

  // Trigger Scout analysis
  const handleRunScout = async () => {
    setScoutLoading(true);

    try {
      const res = await fetch('/api/client/market-intelligence/scout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: 'placeholder-client-id',
          workspaceId: 'placeholder-workspace-id',
          pathway: selectedPathway,
          targetState: 'NSW',
          targetService: 'plumber',
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert(`Scout found ${data.data.vacuumsFound} opportunities! Cost: $${data.data.costUsd.toFixed(2)}`);
        // Reload overview
        window.location.reload();
      }
    } catch (error) {
      console.error('Scout failed:', error);
      alert('Scout analysis failed');
    } finally {
      setScoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Market Intelligence</h1>
        <p className="text-muted-foreground">
          AI-powered gap analysis to find expansion opportunities
        </p>
      </div>

      {/* Pathway Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Pathway</CardTitle>
          <CardDescription>
            Choose how to discover market opportunities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setSelectedPathway('geographic')}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                selectedPathway === 'geographic'
                  ? 'border-accent-500 bg-accent-500/10'
                  : 'border-border-base hover:border-accent-500/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <MapPin className={`w-6 h-6 mt-1 ${selectedPathway === 'geographic' ? 'text-accent-500' : 'text-text-secondary'}`} />
                <div>
                  <div className="font-semibold">Geographic Gaps</div>
                  <div className="text-sm text-muted-foreground">
                    Find suburbs with low competitor density where you can dominate local search
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setSelectedPathway('content')}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                selectedPathway === 'content'
                  ? 'border-accent-500 bg-accent-500/10'
                  : 'border-border-base hover:border-accent-500/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <FileText className={`w-6 h-6 mt-1 ${selectedPathway === 'content' ? 'text-accent-500' : 'text-text-secondary'}`} />
                <div>
                  <div className="font-semibold">Content Gaps</div>
                  <div className="text-sm text-muted-foreground">
                    Identify missing proof points (photos, reviews, testimonials) in suburbs where you work
                  </div>
                </div>
              </div>
            </button>
          </div>

          <Button
            onClick={handleRunScout}
            disabled={scoutLoading}
            className="w-full"
          >
            {scoutLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Scout Analysis...
              </>
            ) : (
              `Run ${selectedPathway === 'geographic' ? 'Geographic' : 'Content'} Analysis`
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="geographic">Geographic Gaps</TabsTrigger>
          <TabsTrigger value="content">Content Gaps</TabsTrigger>
          <TabsTrigger value="audits">Visual Audits</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Vacuums Found</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{overview?.vacuums?.total || 0}</div>
                <div className="text-sm text-muted-foreground mt-2">
                  {overview?.vacuums?.geographic || 0} geographic, {overview?.vacuums?.content || 0} content
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">High Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{overview?.vacuums?.highPriority || 0}</div>
                <div className="text-sm text-muted-foreground mt-2">
                  Opportunities requiring immediate action
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Visual Audits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{overview?.audits?.total || 0}</div>
                <div className="text-sm text-muted-foreground mt-2">
                  Recorded gap evidence
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle>Top Opportunities</CardTitle>
              <CardDescription>Suburbs with biggest market gaps</CardDescription>
            </CardHeader>
            <CardContent>
              {overview?.opportunities?.suburbs?.length > 0 ? (
                <div className="space-y-2">
                  {overview.opportunities.suburbs.slice(0, 5).map((suburb: any) => (
                    <div
                      key={`${suburb.suburb}-${suburb.state}`}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{suburb.suburb}, {suburb.state}</div>
                        <div className="text-sm text-muted-foreground">
                          {suburb.total_jobs} jobs, {suburb.total_photo_count} photos
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={suburb.authority_score < 30 ? 'destructive' : 'secondary'}>
                          Authority: {suburb.authority_score}/100
                        </Badge>
                        <div className="text-sm text-muted-foreground mt-1">
                          Gap: {100 - suburb.authority_score}/100
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No opportunities found yet. Run Scout analysis above.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geographic Gaps Tab */}
        <TabsContent value="geographic">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Market Gaps</CardTitle>
              <CardDescription>Suburbs where you have low authority but high opportunity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground">
                Geographic gap analysis coming soon. Run Scout analysis to discover suburbs with weak competitor presence.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Gaps Tab */}
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Content Gaps</CardTitle>
              <CardDescription>Missing proof points in suburbs where you work</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground">
                Content gap analysis coming soon. Run Scout analysis to identify missing photos, reviews, and testimonials.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Visual Audits Tab */}
        <TabsContent value="audits">
          <Card>
            <CardHeader>
              <CardTitle>Visual Gap Recordings</CardTitle>
              <CardDescription>Loom-style walkthroughs and diagnostic pages</CardDescription>
            </CardHeader>
            <CardContent>
              {overview?.audits?.recent?.length > 0 ? (
                <div className="space-y-3">
                  {overview.audits.recent.map((audit: any) => (
                    <div key={audit.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent-500/10 rounded-lg flex items-center justify-center">
                          {audit.video_url ? <Play className="w-5 h-5 text-accent-500" /> : <Image className="w-5 h-5 text-accent-500" />}
                        </div>
                        <div>
                          <div className="font-medium">{audit.keyword}</div>
                          <div className="text-sm text-muted-foreground">
                            {audit.suburb}, {audit.state}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {audit.video_url && (
                          <Button variant="outline" size="sm" onClick={() => window.open(audit.video_url, '_blank')}>
                            Watch Video
                          </Button>
                        )}
                        {audit.static_page_url && (
                          <Button variant="outline" size="sm" onClick={() => window.open(audit.static_page_url, '_blank')}>
                            View Page
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No visual audits yet. Trigger Auditor from discovered gaps.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
