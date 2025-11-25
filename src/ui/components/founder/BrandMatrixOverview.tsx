'use client';

/**
 * Brand Matrix Overview
 *
 * Displays the complete Unite-Group brand ecosystem with:
 * - All 5 brands with positioning and cross-links
 * - Visual brand relationship map
 * - Brand intensity and pipeline metrics
 * - Quick actions for each brand
 *
 * @module ui/components/founder/BrandMatrixOverview
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Network,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  FileText,
} from 'lucide-react';
import type { Brand } from '@/lib/brands/brandRegistry';

interface BrandMatrixOverviewProps {
  workspaceId: string;
}

interface BrandWithMetrics extends Brand {
  metrics?: {
    active_campaigns: number;
    content_pieces: number;
    topic_opportunities: number;
    last_activity: string;
  };
}

export default function BrandMatrixOverview({ workspaceId }: BrandMatrixOverviewProps) {
  const [brands, setBrands] = useState<BrandWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registryMetadata, setRegistryMetadata] = useState<{
    last_sync: string;
    source: string;
    brand_count: number;
  } | null>(null);

  // Fetch brand matrix data
  const fetchBrands = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/founder/brands/matrix?workspaceId=${workspaceId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch brand matrix');
      }

      const data = await response.json();
      setBrands(data.brands);
      setRegistryMetadata(data.metadata);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchBrands();
  }, [workspaceId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Brand Matrix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Brand Matrix Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={fetchBrands} className="mt-4" variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const hubBrand = brands.find((b) => b.slug === 'unite-group');
  const otherBrands = brands.filter((b) => b.slug !== 'unite-group');

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Brand Matrix Overview
              </CardTitle>
              <CardDescription>
                {brands.length} brands • Last sync:{' '}
                {registryMetadata?.last_sync
                  ? new Date(registryMetadata.last_sync).toLocaleString()
                  : 'Unknown'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{registryMetadata?.source || 'Unknown'}</Badge>
              <Button onClick={fetchBrands} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Hub Brand (Unite-Group) */}
      {hubBrand && (
        <Card className="border-primary/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="default">NEXUS HUB</Badge>
              <CardTitle>{hubBrand.slug}</CardTitle>
            </div>
            <CardDescription>{hubBrand.role}</CardDescription>
          </CardHeader>
          <CardContent>
            <BrandCard brand={hubBrand} isHub={true} />
          </CardContent>
        </Card>
      )}

      {/* Other Brands */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {otherBrands.map((brand) => (
          <Card key={brand.slug}>
            <CardHeader>
              <CardTitle className="text-base">{brand.slug}</CardTitle>
              <CardDescription className="text-xs">{brand.role}</CardDescription>
            </CardHeader>
            <CardContent>
              <BrandCard brand={brand} isHub={false} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cross-Link Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Cross-Links</CardTitle>
          <CardDescription>Allowed brand reference relationships</CardDescription>
        </CardHeader>
        <CardContent>
          <CrossLinkVisualization brands={brands} />
        </CardContent>
      </Card>
    </div>
  );
}

// Brand Card Component
function BrandCard({ brand, isHub }: { brand: BrandWithMetrics; isHub: boolean }) {
  return (
    <div className="space-y-4">
      {/* Domain */}
      <div>
        <a
          href={brand.domain}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-primary hover:underline"
        >
          {brand.domain}
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Positioning */}
      <div>
        <h4 className="text-sm font-medium mb-2">Positioning</h4>
        <ul className="space-y-1">
          {brand.positioning.map((pos, idx) => (
            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              {pos}
            </li>
          ))}
        </ul>
      </div>

      {/* Cross-Links */}
      {brand.cross_links && brand.cross_links.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Cross-Links</h4>
          <div className="flex flex-wrap gap-2">
            {brand.cross_links.map((link) => (
              <Badge key={link} variant="outline">
                → {link}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Metrics */}
      {brand.metrics && (
        <div className="grid grid-cols-3 gap-3 pt-3 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <TrendingUp className="h-3 w-3" />
              Campaigns
            </div>
            <div className="text-lg font-bold">{brand.metrics.active_campaigns}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <FileText className="h-3 w-3" />
              Content
            </div>
            <div className="text-lg font-bold">{brand.metrics.content_pieces}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <Users className="h-3 w-3" />
              Topics
            </div>
            <div className="text-lg font-bold">{brand.metrics.topic_opportunities}</div>
          </div>
        </div>
      )}

      {/* Metadata */}
      {brand.metadata && (
        <div className="text-xs text-muted-foreground space-y-1 pt-3 border-t">
          <div>Industry: {brand.metadata.industry}</div>
          <div>Tone: {brand.metadata.tone_of_voice}</div>
          {brand.metadata.target_audience && (
            <div>Audience: {brand.metadata.target_audience.join(', ')}</div>
          )}
        </div>
      )}
    </div>
  );
}

// Cross-Link Visualization Component
function CrossLinkVisualization({ brands }: { brands: Brand[] }) {
  // Build cross-link map
  const crossLinkMap = new Map<string, string[]>();

  brands.forEach((brand) => {
    if (brand.cross_links && brand.cross_links.length > 0) {
      crossLinkMap.set(brand.slug, brand.cross_links);
    }
  });

  return (
    <div className="space-y-3">
      {Array.from(crossLinkMap.entries()).map(([source, targets]) => (
        <div key={source} className="flex items-center gap-3 p-3 border rounded-lg">
          <Badge variant="default">{source}</Badge>
          <span className="text-sm text-muted-foreground">→</span>
          <div className="flex flex-wrap gap-2">
            {targets.map((target) => (
              <Badge key={target} variant="outline">
                {target}
              </Badge>
            ))}
          </div>
        </div>
      ))}

      {crossLinkMap.size === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No cross-links configured
        </div>
      )}
    </div>
  );
}
