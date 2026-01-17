'use client';

/**
 * Founder Creative Director Dashboard
 * Phase 61: Central creative oversight
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Palette,
  Image,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Star,
} from 'lucide-react';
import CreativeQualityBadge from '@/ui/components/CreativeQualityBadge';
import CreativeSignatureCard from '@/ui/components/CreativeSignatureCard';

export default function FounderCreativeDirectorPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [briefing, setBriefing] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBriefing();
  }, []);

  const fetchBriefing = async () => {
    try {
      const response = await fetch('/api/creative/insights?type=briefing');
      const result = await response.json();
      setBriefing(result.data);
    } catch (error) {
      console.error('Failed to fetch briefing:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for demonstration
  const mockBriefing = {
    generated_at: new Date().toISOString(),
    total_clients: 5,
    avg_quality_score: 78,
    avg_consistency_score: 82,
    assets_generated_7d: 47,
    top_performers: [
      { client_id: '1', score: 92 },
      { client_id: '2', score: 88 },
      { client_id: '3', score: 85 },
    ],
    attention_needed: [
      { client_id: '4', issue: 'Low quality score' },
    ],
    action_items: [
      '🔴 1 client needs creative attention',
      '🟢 3 top performing clients to showcase',
      '📊 Review weekly creative metrics',
      '🎨 Update brand signatures as needed',
    ],
  };

  const mockSignatures = [
    {
      clientName: 'ABC Restoration',
      signature: {
        name: 'Professional Trust',
        primary_colors: ['#2563eb', '#1d4ed8'],
        secondary_colors: ['#64748b', '#94a3b8'],
        typography: { heading_font: 'Inter', body_font: 'Inter' },
        tone_of_voice: 'Professional and reassuring',
        motion_style: 'subtle',
      },
    },
    {
      clientName: 'XYZ Plumbing',
      signature: {
        name: 'Local Reliable',
        primary_colors: ['#059669', '#047857'],
        secondary_colors: ['#6b7280', '#9ca3af'],
        typography: { heading_font: 'Roboto', body_font: 'Roboto' },
        tone_of_voice: 'Direct and reliable',
        motion_style: 'minimal',
      },
    },
    {
      clientName: 'Smith Consulting',
      signature: {
        name: 'Executive Authority',
        primary_colors: ['#1e293b', '#334155'],
        secondary_colors: ['#f59e0b', '#d97706'],
        typography: { heading_font: 'Playfair Display', body_font: 'Inter' },
        tone_of_voice: 'Authoritative yet approachable',
        motion_style: 'subtle',
      },
    },
  ];

  const displayBriefing = briefing || mockBriefing;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
            <Palette className="h-6 w-6 text-pink-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Creative Director</h1>
            <p className="text-sm text-muted-foreground">
              Brand consistency and creative quality oversight
            </p>
          </div>
        </div>
        <Badge variant="outline">
          {new Date(displayBriefing.generated_at).toLocaleDateString('en-AU', {
            weekday: 'long',
            day: 'numeric',
            month: 'short',
          })}
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-warning-500" />
              <span className="text-sm text-muted-foreground">Avg Quality</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {displayBriefing.avg_quality_score}
            </div>
            <Progress value={displayBriefing.avg_quality_score} className="h-1 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-info-500" />
              <span className="text-sm text-muted-foreground">Consistency</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {displayBriefing.avg_consistency_score}
            </div>
            <Progress value={displayBriefing.avg_consistency_score} className="h-1 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-success-500" />
              <span className="text-sm text-muted-foreground">Assets (7d)</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {displayBriefing.assets_generated_7d}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-accent-500" />
              <span className="text-sm text-muted-foreground">Need Attention</span>
            </div>
            <div className="text-2xl font-bold mt-1 text-accent-500">
              {displayBriefing.attention_needed.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="signatures">Brand Signatures</TabsTrigger>
          <TabsTrigger value="quality">Quality Scores</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success-500" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {displayBriefing.top_performers.map((performer: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm">Client {performer.client_id}</span>
                      <CreativeQualityBadge
                        score={performer.score}
                        grade={performer.score >= 90 ? 'A' : performer.score >= 80 ? 'B' : 'C'}
                        size="sm"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Attention Needed */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-accent-500" />
                  Attention Needed
                </CardTitle>
              </CardHeader>
              <CardContent>
                {displayBriefing.attention_needed.length > 0 ? (
                  <div className="space-y-3">
                    {displayBriefing.attention_needed.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm">Client {item.client_id}</span>
                        <Badge variant="outline" className="text-accent-500">
                          {item.issue}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <CheckCircle2 className="h-8 w-8 text-success-500 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">All clients on track</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="signatures" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockSignatures.map((item, i) => (
              <CreativeSignatureCard
                key={i}
                clientName={item.clientName}
                signature={item.signature}
                onEdit={() => console.log('Edit signature:', item.clientName)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quality Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Brand Consistency</span>
                    <span className="font-medium">82%</span>
                  </div>
                  <Progress value={82} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Accessibility</span>
                    <span className="font-medium">78%</span>
                  </div>
                  <Progress value={78} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Readability</span>
                    <span className="font-medium">85%</span>
                  </div>
                  <Progress value={85} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Truth Layer Compliance</span>
                    <span className="font-medium">100%</span>
                  </div>
                  <Progress value={100} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Today's Creative Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {displayBriefing.action_items.map((item: string, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border-subtle"
                    />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Creative Constraints Reminder */}
      <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
        All creative outputs follow brand signatures. No fake brand assets.
        Creative rationale provided for all recommendations. Major brand shifts require founder override.
      </div>
    </div>
  );
}
