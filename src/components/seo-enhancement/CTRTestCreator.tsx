'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, MousePointerClick, Wand2, ArrowRight } from 'lucide-react';

interface CTRTestCreatorProps {
  workspaceId: string;
  accessToken: string;
  onTestCreated?: (test: CTRTest) => void;
}

interface CTRTest {
  id: string;
  url: string;
  keyword: string;
  variantA: { title: string; meta: string };
  variantB: { title: string; meta: string };
  status: string;
}

interface GeneratedVariant {
  title: string;
  meta: string;
  reasoning: string;
}

export function CTRTestCreator({
  workspaceId,
  accessToken,
  onTestCreated,
}: CTRTestCreatorProps) {
  const [url, setUrl] = useState('');
  const [keyword, setKeyword] = useState('');
  const [currentTitle, setCurrentTitle] = useState('');
  const [currentMeta, setCurrentMeta] = useState('');
  const [variantATitle, setVariantATitle] = useState('');
  const [variantAMeta, setVariantAMeta] = useState('');
  const [variantBTitle, setVariantBTitle] = useState('');
  const [variantBMeta, setVariantBMeta] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedVariants, setGeneratedVariants] = useState<GeneratedVariant[]>([]);

  const generateVariants = async (type: 'titles' | 'metas') => {
    if (!keyword || (type === 'titles' && !currentTitle) || (type === 'metas' && !currentMeta)) {
      setError(`Please enter keyword and current ${type === 'titles' ? 'title' : 'meta description'}`);
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/seo-enhancement/ctr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          workspaceId,
          action: type === 'titles' ? 'generateTitles' : 'generateMetas',
          keyword,
          [type === 'titles' ? 'currentTitle' : 'currentMeta']:
            type === 'titles' ? currentTitle : currentMeta,
          context: {
            url,
            industry: 'general',
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to generate ${type}`);
      }

      if (data.variants) {
        setGeneratedVariants(data.variants);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setGenerating(false);
    }
  };

  const selectVariant = (variant: GeneratedVariant, slot: 'A' | 'B', type: 'title' | 'meta') => {
    if (type === 'title') {
      if (slot === 'A') {
        setVariantATitle(variant.title);
      } else {
        setVariantBTitle(variant.title);
      }
    } else {
      if (slot === 'A') {
        setVariantAMeta(variant.meta);
      } else {
        setVariantBMeta(variant.meta);
      }
    }
  };

  const createTest = async () => {
    if (!url || !keyword || !variantATitle || !variantAMeta || !variantBTitle || !variantBMeta) {
      setError('Please fill in all fields for both variants');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/seo-enhancement/ctr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          workspaceId,
          action: 'createTest',
          url,
          keyword,
          variantATitle,
          variantAMeta,
          variantBTitle,
          variantBMeta,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create test');
      }

      const test: CTRTest = {
        id: data.test?.id,
        url,
        keyword,
        variantA: { title: variantATitle, meta: variantAMeta },
        variantB: { title: variantBTitle, meta: variantBMeta },
        status: 'draft',
      };

      onTestCreated?.(test);

      // Reset form
      setUrl('');
      setKeyword('');
      setCurrentTitle('');
      setCurrentMeta('');
      setVariantATitle('');
      setVariantAMeta('');
      setVariantBTitle('');
      setVariantBMeta('');
      setGeneratedVariants([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MousePointerClick className="h-5 w-5" />
          Create CTR A/B Test
        </CardTitle>
        <CardDescription>
          Test different titles and meta descriptions to improve click-through rates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="testUrl">Page URL</Label>
            <Input
              id="testUrl"
              type="url"
              placeholder="https://example.com/page"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="testKeyword">Target Keyword</Label>
            <Input
              id="testKeyword"
              placeholder="e.g., stainless steel balustrades"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
        </div>

        {/* Current Title/Meta for AI generation */}
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium">AI-Powered Variant Generation</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentTitle">Current Title</Label>
              <Input
                id="currentTitle"
                placeholder="Your current page title"
                value={currentTitle}
                onChange={(e) => setCurrentTitle(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => generateVariants('titles')}
                disabled={generating || !currentTitle || !keyword}
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Wand2 className="h-4 w-4 mr-1" />
                )}
                Generate Title Variants
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentMeta">Current Meta Description</Label>
              <Textarea
                id="currentMeta"
                placeholder="Your current meta description"
                value={currentMeta}
                onChange={(e) => setCurrentMeta(e.target.value)}
                rows={2}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => generateVariants('metas')}
                disabled={generating || !currentMeta || !keyword}
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Wand2 className="h-4 w-4 mr-1" />
                )}
                Generate Meta Variants
              </Button>
            </div>
          </div>

          {/* Generated Variants */}
          {generatedVariants.length > 0 && (
            <div className="space-y-2 mt-4">
              <Label>AI-Generated Variants (click to use)</Label>
              <div className="grid grid-cols-1 gap-2">
                {generatedVariants.map((variant, idx) => (
                  <div
                    key={idx}
                    className="p-3 border rounded-lg bg-background hover:border-primary cursor-pointer transition-colors"
                  >
                    {variant.title && (
                      <div className="mb-2">
                        <p className="font-medium text-sm text-blue-600">{variant.title}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground"
                            onClick={() => selectVariant(variant, 'A', 'title')}
                          >
                            Use as Variant A
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground"
                            onClick={() => selectVariant(variant, 'B', 'title')}
                          >
                            Use as Variant B
                          </Badge>
                        </div>
                      </div>
                    )}
                    {variant.meta && (
                      <div>
                        <p className="text-sm text-muted-foreground">{variant.meta}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground"
                            onClick={() => selectVariant(variant, 'A', 'meta')}
                          >
                            Use as Variant A
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground"
                            onClick={() => selectVariant(variant, 'B', 'meta')}
                          >
                            Use as Variant B
                          </Badge>
                        </div>
                      </div>
                    )}
                    {variant.reasoning && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        {variant.reasoning}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Test Variants */}
        <Tabs defaultValue="variantA" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="variantA">Variant A (Control)</TabsTrigger>
            <TabsTrigger value="variantB">Variant B (Test)</TabsTrigger>
          </TabsList>

          <TabsContent value="variantA" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="variantATitle">Title</Label>
              <Input
                id="variantATitle"
                placeholder="Title for Variant A"
                value={variantATitle}
                onChange={(e) => setVariantATitle(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {variantATitle.length}/60 characters
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="variantAMeta">Meta Description</Label>
              <Textarea
                id="variantAMeta"
                placeholder="Meta description for Variant A"
                value={variantAMeta}
                onChange={(e) => setVariantAMeta(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {variantAMeta.length}/155 characters
              </p>
            </div>
          </TabsContent>

          <TabsContent value="variantB" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="variantBTitle">Title</Label>
              <Input
                id="variantBTitle"
                placeholder="Title for Variant B"
                value={variantBTitle}
                onChange={(e) => setVariantBTitle(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {variantBTitle.length}/60 characters
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="variantBMeta">Meta Description</Label>
              <Textarea
                id="variantBMeta"
                placeholder="Meta description for Variant B"
                value={variantBMeta}
                onChange={(e) => setVariantBMeta(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {variantBMeta.length}/155 characters
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Tests run for 2-4 weeks to gather statistically significant data
          </div>
          <Button
            onClick={createTest}
            disabled={loading || !url || !keyword || !variantATitle || !variantAMeta || !variantBTitle || !variantBMeta}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ArrowRight className="h-4 w-4 mr-2" />
            )}
            Create Test
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
