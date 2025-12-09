'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Code, Copy, Check, AlertCircle } from 'lucide-react';

const SCHEMA_TYPES = [
  { value: 'Article', label: 'Article', description: 'Blog posts, news articles' },
  { value: 'Product', label: 'Product', description: 'E-commerce products' },
  { value: 'LocalBusiness', label: 'Local Business', description: 'Physical business locations' },
  { value: 'FAQ', label: 'FAQ Page', description: 'Frequently asked questions' },
  { value: 'HowTo', label: 'How-To', description: 'Step-by-step instructions' },
  { value: 'Recipe', label: 'Recipe', description: 'Food recipes' },
  { value: 'Event', label: 'Event', description: 'Events and gatherings' },
  { value: 'Organization', label: 'Organization', description: 'Company or organization' },
  { value: 'Person', label: 'Person', description: 'Individual person' },
  { value: 'Review', label: 'Review', description: 'Product or service reviews' },
  { value: 'VideoObject', label: 'Video', description: 'Video content' },
  { value: 'BreadcrumbList', label: 'Breadcrumbs', description: 'Navigation breadcrumbs' },
];

interface SchemaGeneratorProps {
  workspaceId: string;
  accessToken: string;
  onSchemaGenerated?: (schema: GeneratedSchema) => void;
}

interface GeneratedSchema {
  id: string;
  schemaType: string;
  schemaJson: object;
  scriptTag: string;
  validationErrors: string[];
}

export function SchemaGenerator({
  workspaceId,
  accessToken,
  onSchemaGenerated,
}: SchemaGeneratorProps) {
  const [url, setUrl] = useState('');
  const [schemaType, setSchemaType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedSchema, setGeneratedSchema] = useState<GeneratedSchema | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!url || !schemaType) {
return;
}

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/seo-enhancement/schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          workspaceId,
          url,
          schemaType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate schema');
      }

      const schema: GeneratedSchema = {
        id: data.schema?.id,
        schemaType: data.schema?.schema_type,
        schemaJson: data.schema?.schema_json,
        scriptTag: data.scriptTag,
        validationErrors: data.schema?.validation_errors || [],
      };

      setGeneratedSchema(schema);
      onSchemaGenerated?.(schema);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!generatedSchema?.scriptTag) {
return;
}

    try {
      await navigator.clipboard.writeText(generatedSchema.scriptTag);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          Schema Markup Generator
        </CardTitle>
        <CardDescription>
          Generate structured data markup for rich search results
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="schemaUrl">Page URL</Label>
            <Input
              id="schemaUrl"
              type="url"
              placeholder="https://example.com/page"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="schemaType">Schema Type</Label>
            <Select value={schemaType} onValueChange={setSchemaType}>
              <SelectTrigger>
                <SelectValue placeholder="Select schema type" />
              </SelectTrigger>
              <SelectContent>
                {SCHEMA_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <span className="font-medium">{type.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {type.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading || !url || !schemaType}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Generating...
            </>
          ) : (
            <>
              <Code className="h-4 w-4 mr-2" />
              Generate Schema
            </>
          )}
        </Button>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 p-3 rounded-md">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {generatedSchema && (
          <div className="space-y-4 mt-4">
            {generatedSchema.validationErrors.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="font-medium text-yellow-800 text-sm mb-2">
                  Validation Warnings:
                </p>
                <ul className="text-sm text-yellow-700 list-disc list-inside">
                  {generatedSchema.validationErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Generated Schema (JSON-LD)</Label>
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <div className="relative">
                <Textarea
                  readOnly
                  value={generatedSchema.scriptTag}
                  className="font-mono text-xs h-48"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Add this script tag to your page&apos;s &lt;head&gt; section for rich search results
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
