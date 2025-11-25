'use client';

/**
 * Founder Analytics Page
 * Comprehensive analytics dashboard combining Search Console, GA4, and SEO data
 */

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { AnalyticsOverviewPanel } from '@/components/analytics/AnalyticsOverviewPanel';
import { SearchConsoleDetail } from '@/components/analytics/SearchConsoleDetail';
import { BarChart3, Search, TrendingUp } from 'lucide-react';

export default function FounderAnalyticsPage() {
  const { currentOrganization } = useAuth();
  const workspaceId = currentOrganization?.org_id || '';

  const [selectedBrand, setSelectedBrand] = useState<string>('all');

  const brands = [
    { value: 'all', label: 'All Brands' },
    { value: 'unite_group', label: 'Unite Group' },
    { value: 'aussie_stainless', label: 'Aussie Stainless' },
    { value: 'rp_tech', label: 'R&P Tech Solutions' },
    { value: 'bne_glass_pool_fencing', label: 'BNE Glass Pool Fencing' },
    { value: 'ultra_chrome', label: 'Ultra Chrome' },
  ];

  if (!workspaceId) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              Please select an organization to view analytics.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Intelligence</h1>
          <p className="text-muted-foreground mt-1">
            Search Console, Google Analytics, and SEO insights
          </p>
        </div>

        {/* Brand Selector */}
        <Select value={selectedBrand} onValueChange={setSelectedBrand}>
          <SelectTrigger className="w-[250px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {brands.map((brand) => (
              <SelectItem key={brand.value} value={brand.value}>
                {brand.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="search-console" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search Console
          </TabsTrigger>
          <TabsTrigger value="opportunities" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Opportunities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AnalyticsOverviewPanel
            workspaceId={workspaceId}
            brandSlug={selectedBrand === 'all' ? undefined : selectedBrand}
          />
        </TabsContent>

        <TabsContent value="search-console" className="space-y-6">
          <SearchConsoleDetail
            workspaceId={workspaceId}
            brandSlug={selectedBrand === 'all' ? undefined : selectedBrand}
          />
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-6">
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">SEO Opportunities</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  AI-powered keyword opportunities and content recommendations based on your
                  analytics data will appear here.
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  Coming in v1_1_08: Topic Discovery Engine integration with personalized
                  recommendations
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
