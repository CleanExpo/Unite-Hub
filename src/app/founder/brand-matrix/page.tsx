'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { brandRegistry, getActiveBrands } from '@/lib/brands/brandRegistry';
import { brandPositioningMap } from '@/lib/brands/brandPositioningMap';
import { brandCrossLinkingRules } from '@/lib/brands/brandCrossLinkingRules';
import { getLinkingRulesFrom } from '@/lib/brands/brandCrossLinkingRules';

/**
 * Founder Dashboard: Brand Matrix
 *
 * Displays all brands under Unite-Hub Nexus with their:
 * - Registry (metadata)
 * - Positioning (mission, promise, audience, tone)
 * - Cross-linking rules (when and how brands interact)
 *
 * Used by: Founder for brand curation, content team for consistency validation
 */
export default function BrandMatrixPage() {
  const activeBrands = getActiveBrands();

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Brand Matrix</h1>
        <p className="text-gray-600">
          Manage all brands under Unite-Hub Nexus. Define positioning, cross-linking rules, and ensure brand consistency.
        </p>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Brands</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeBrands.length}</div>
            <p className="text-xs text-gray-600 mt-1">Active brands in portfolio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cross-Link Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brandCrossLinkingRules.length}</div>
            <p className="text-xs text-gray-600 mt-1">Brand relationships defined</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(brandCrossLinkingRules.map(r => r.from)).size}
            </div>
            <p className="text-xs text-gray-600 mt-1">Brands with outbound links</p>
          </CardContent>
        </Card>
      </div>

      {/* Brand Registry */}
      <Tabs defaultValue="registry" className="space-y-4">
        <TabsList>
          <TabsTrigger value="registry">Brand Registry</TabsTrigger>
          <TabsTrigger value="positioning">Positioning</TabsTrigger>
          <TabsTrigger value="cross-linking">Cross-Linking Rules</TabsTrigger>
        </TabsList>

        {/* Brand Registry Tab */}
        <TabsContent value="registry" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeBrands.map((brand) => (
              <Card key={brand.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{brand.name}</CardTitle>
                      <CardDescription>{brand.tagline}</CardDescription>
                    </div>
                    <Badge variant="outline">{brand.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Description</p>
                    <p className="text-sm mt-1">{brand.description}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Domain</p>
                    <a
                      href={brand.domain}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {brand.domain}
                    </a>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Brand ID: {brand.id}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Positioning Tab */}
        <TabsContent value="positioning" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeBrands.map((brand) => {
              const positioning = brandPositioningMap[brand.id];
              return (
                <Card key={brand.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{brand.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Mission</p>
                      <p className="text-sm mt-1">{positioning.mission}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-600">Promise</p>
                      <p className="text-sm mt-1">{positioning.promise}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Audience</p>
                      <div className="flex flex-wrap gap-2">
                        {positioning.audience.map((aud) => (
                          <Badge key={aud} variant="secondary">
                            {aud}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Tone</p>
                      <div className="flex flex-wrap gap-2">
                        {positioning.tone.map((t) => (
                          <Badge key={t} variant="secondary">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Strengths</p>
                      <ul className="text-sm space-y-1">
                        {positioning.strengths.map((s) => (
                          <li key={s} className="flex items-center gap-2">
                            <span className="text-green-600">✓</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Risk Flags</p>
                      <ul className="text-sm space-y-1">
                        {positioning.riskFlags.map((flag) => (
                          <li key={flag} className="flex items-start gap-2">
                            <span className="text-yellow-600 mt-0.5">⚠</span>
                            <span>{flag}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Cross-Linking Rules Tab */}
        <TabsContent value="cross-linking" className="space-y-4">
          <div className="space-y-4">
            {activeBrands.map((brand) => {
              const outgoingRules = getLinkingRulesFrom(brand.id);
              if (outgoingRules.length === 0) {
return null;
}

              return (
                <Card key={brand.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {brand.name} Cross-Linking Rules
                    </CardTitle>
                    <CardDescription>
                      {outgoingRules.length} outbound link{outgoingRules.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {outgoingRules.map((rule) => {
                        const targetBrand = brandRegistry.find(
                          (b) => b.id === rule.to
                        );
                        return (
                          <div
                            key={`${rule.from}-${rule.to}`}
                            className="border rounded-lg p-4 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{brand.name}</span>
                                <span className="text-gray-400">→</span>
                                <span className="font-medium">
                                  {targetBrand?.name || rule.to}
                                </span>
                              </div>
                              <Badge
                                variant={
                                  rule.frequency === 'common'
                                    ? 'default'
                                    : rule.frequency === 'occasional'
                                      ? 'secondary'
                                      : 'outline'
                                }
                              >
                                {rule.frequency}
                              </Badge>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-600">Context</p>
                              <p className="text-sm mt-1">{rule.context}</p>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-600">Rule</p>
                              <p className="text-sm mt-1">{rule.rule}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Documentation Footer */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm">How This Works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-gray-700">
          <p>
            <strong>Brand Registry</strong>: Central definition of all brands. Used by Founder Ops Hub for task assignment and content team for reference.
          </p>
          <p>
            <strong>Positioning</strong>: Mission, promise, audience, tone, and risk flags. Ensures all content aligns with brand identity and founder values.
          </p>
          <p>
            <strong>Cross-Linking Rules</strong>: Defines when brands can reference each other. Enables synergy while maintaining brand independence. Frequency indicator guides content generation.
          </p>
          <p>
            <strong>Truth Layer</strong>: Risk flags are enforced by content generation system. Any flagged content requires founder review.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
