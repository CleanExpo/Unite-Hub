'use client';

/**
 * Visual Intelligence Campaigns Dashboard
 * Phase 69: Campaign planning and bundle management
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Package,
  Layers,
  Wand2,
  ArrowRight,
  Filter,
} from 'lucide-react';

import { VisualMethodFilterBar, FilterState } from '@/ui/components/VisualMethodFilterBar';
import { VisualMethodGrid } from '@/ui/components/VisualMethodGrid';
import { CampaignBundleCard } from '@/ui/components/CampaignBundleCard';
import { ChannelAssetMatrix } from '@/ui/components/ChannelAssetMatrix';
import { BUNDLE_TEMPLATES, BundleTemplate } from '@/lib/visual/campaign/campaignBundles';
import { createCampaignBundle, CampaignBundle, CampaignBrief } from '@/lib/visual/campaign/visualCampaignEngine';
import { MethodMetadata } from '@/lib/visual/methods/metadata';

export default function CampaignsPage() {
  const [activeTab, setActiveTab] = useState('bundles');
  const [selectedBundle, setSelectedBundle] = useState<BundleTemplate | null>(null);
  const [generatedBundle, setGeneratedBundle] = useState<CampaignBundle | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: 'all',
    channel: 'all',
    costTier: 'all',
    complexity: 'all',
    motionOnly: false,
  });

  const handleBundleSelect = (bundle: BundleTemplate) => {
    setSelectedBundle(bundle);
  };

  const handleGenerateCampaign = () => {
    if (!selectedBundle) return;

    // Create a sample brief from the selected bundle
    const brief: CampaignBrief = {
      campaign_id: `campaign_${Date.now()}`,
      campaign_name: `${selectedBundle.name} Campaign`,
      industry: 'technology',
      goal: selectedBundle.goal,
      main_offer: 'Sample campaign offer',
      tone: 'professional',
      channels: selectedBundle.recommended_channels,
      budget_tier: selectedBundle.min_budget_tier,
      timeline_days: selectedBundle.typical_timeline_days,
    };

    const bundle = createCampaignBundle(brief);
    setGeneratedBundle(bundle);
    setActiveTab('generated');
  };

  const handleMethodSelect = (method: MethodMetadata) => {
    console.log('Selected method:', method);
    // Could open a detail modal or add to campaign
  };

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Visual Campaigns</h1>
          <p className="text-muted-foreground">
            Create multi-channel campaign bundles with AI-powered visuals
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="bundles" className="gap-2">
            <Package className="h-4 w-4" />
            Bundle Templates
          </TabsTrigger>
          <TabsTrigger value="methods" className="gap-2">
            <Layers className="h-4 w-4" />
            Method Library
          </TabsTrigger>
          {generatedBundle && (
            <TabsTrigger value="generated" className="gap-2">
              <Wand2 className="h-4 w-4" />
              Generated
            </TabsTrigger>
          )}
        </TabsList>

        {/* Bundle Templates Tab */}
        <TabsContent value="bundles" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bundle list */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Campaign Templates</h2>
                <Badge variant="outline">
                  {Object.keys(BUNDLE_TEMPLATES).length} templates
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.values(BUNDLE_TEMPLATES).map((bundle) => (
                  <CampaignBundleCard
                    key={bundle.id}
                    bundle={bundle}
                    selected={selectedBundle?.id === bundle.id}
                    onClick={() => handleBundleSelect(bundle)}
                  />
                ))}
              </div>
            </div>

            {/* Selected bundle details */}
            <div className="space-y-4">
              {selectedBundle ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        {selectedBundle.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {selectedBundle.description}
                      </p>

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Best For:</h4>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {selectedBundle.best_for.map((item, i) => (
                            <li key={i}>• {item}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Asset Structure:</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Feed Posts:</span>
                            <span className="ml-1 font-medium">
                              {selectedBundle.asset_structure.social_set.feed_posts}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Stories:</span>
                            <span className="ml-1 font-medium">
                              {selectedBundle.asset_structure.social_set.stories}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Reels:</span>
                            <span className="ml-1 font-medium">
                              {selectedBundle.asset_structure.social_set.reels}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Carousels:</span>
                            <span className="ml-1 font-medium">
                              {selectedBundle.asset_structure.social_set.carousels}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button
                        className="w-full"
                        onClick={handleGenerateCampaign}
                      >
                        Generate Campaign
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Select a bundle template to view details
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Method Library Tab */}
        <TabsContent value="methods" className="space-y-6">
          <VisualMethodFilterBar
            filters={filters}
            onFiltersChange={setFilters}
          />
          <VisualMethodGrid
            filters={filters}
            onMethodSelect={handleMethodSelect}
          />
        </TabsContent>

        {/* Generated Campaign Tab */}
        {generatedBundle && (
          <TabsContent value="generated" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Bundle info */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{generatedBundle.campaign_name}</CardTitle>
                      <Badge>{generatedBundle.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold">
                          {generatedBundle.total_assets}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Total Assets
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">
                          {generatedBundle.channel_assets.length}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Channels
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">
                          ${generatedBundle.estimated_cost}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Est. Cost
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">
                          {generatedBundle.estimated_time_hours}h
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Est. Time
                        </div>
                      </div>
                    </div>

                    {/* Generation queue */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Generation Queue</h4>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {generatedBundle.generation_queue.map((item) => (
                          <div
                            key={item.queue_id}
                            className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs"
                          >
                            <span>{item.asset_id}</span>
                            <Badge variant="outline">{item.status}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Channel matrix */}
              <div>
                <ChannelAssetMatrix bundle={generatedBundle} />
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
