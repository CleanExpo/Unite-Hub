"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Sparkles, BarChart } from "lucide-react";

interface CopyVariationsProps {
  variations: Array<{
    headline: string;
    subheadline: string;
    bodyCopy?: string;
    cta?: string;
  }>;
  onSelect: (variation: any) => void;
  onGenerateMore: () => void;
}

export function CopyVariations({
  variations,
  onSelect,
  onGenerateMore,
}: CopyVariationsProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (variations.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Sparkles className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No variations yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Generate AI variations to A/B test different approaches
          </p>
          <Button onClick={onGenerateMore} className="mt-4 gap-2">
            <Sparkles className="h-4 w-4" />
            Generate Variations
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            A/B Test Variations
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onGenerateMore} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Generate More
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="0">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${variations.length}, 1fr)` }}>
            {variations.map((_, idx) => (
              <TabsTrigger key={idx} value={idx.toString()}>
                Variation {idx + 1}
              </TabsTrigger>
            ))}
          </TabsList>
          {variations.map((variation, idx) => (
            <TabsContent key={idx} value={idx.toString()} className="space-y-4">
              <div className="rounded-lg border p-6 space-y-4 bg-muted/50">
                {/* Headline */}
                <div>
                  <Badge variant="outline" className="mb-2">Headline</Badge>
                  <h3 className="text-2xl font-bold">{variation.headline}</h3>
                </div>

                {/* Subheadline */}
                {variation.subheadline && (
                  <div>
                    <Badge variant="outline" className="mb-2">Subheadline</Badge>
                    <p className="text-lg text-muted-foreground">{variation.subheadline}</p>
                  </div>
                )}

                {/* Body Copy */}
                {variation.bodyCopy && (
                  <div>
                    <Badge variant="outline" className="mb-2">Body Copy</Badge>
                    <p className="text-sm whitespace-pre-wrap">{variation.bodyCopy}</p>
                  </div>
                )}

                {/* CTA */}
                {variation.cta && (
                  <div>
                    <Badge variant="outline" className="mb-2">Call to Action</Badge>
                    <Button className="mt-2">{variation.cta}</Button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setSelectedIndex(idx);
                    onSelect(variation);
                  }}
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Use This Variation
                </Button>
                <Button variant="outline">
                  <BarChart className="h-4 w-4 mr-2" />
                  Compare
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
