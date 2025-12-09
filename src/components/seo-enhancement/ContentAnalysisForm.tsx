'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, X, Plus } from 'lucide-react';

interface ContentAnalysisFormProps {
  workspaceId: string;
  accessToken: string;
  onAnalysisComplete?: (result: ContentAnalysisResult) => void;
}

interface ContentAnalysisResult {
  id: string;
  url: string;
  targetKeyword: string;
  overallScore: number;
  readabilityScore: number;
  keywordDensity: number;
  recommendations: string[];
}

export function ContentAnalysisForm({
  workspaceId,
  accessToken,
  onAnalysisComplete,
}: ContentAnalysisFormProps) {
  const [url, setUrl] = useState('');
  const [targetKeyword, setTargetKeyword] = useState('');
  const [secondaryKeywords, setSecondaryKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addSecondaryKeyword = () => {
    if (newKeyword.trim() && !secondaryKeywords.includes(newKeyword.trim())) {
      setSecondaryKeywords([...secondaryKeywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const removeSecondaryKeyword = (keyword: string) => {
    setSecondaryKeywords(secondaryKeywords.filter((k) => k !== keyword));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !targetKeyword) {
return;
}

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/seo-enhancement/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          workspaceId,
          url,
          targetKeyword,
          secondaryKeywords: secondaryKeywords.length > 0 ? secondaryKeywords : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze content');
      }

      if (onAnalysisComplete && data.job) {
        // Poll for results if job was created
        pollForResults(data.job.id);
      }

      setUrl('');
      setTargetKeyword('');
      setSecondaryKeywords([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const pollForResults = async (jobId: string) => {
    const maxAttempts = 30;
    let attempts = 0;

    const checkStatus = async () => {
      attempts++;
      if (attempts > maxAttempts) {
        setError('Analysis timed out. Please check results later.');
        return;
      }

      try {
        const response = await fetch(
          `/api/seo-enhancement/content?jobId=${jobId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        const data = await response.json();

        if (data.result?.status === 'completed') {
          onAnalysisComplete?.(data.result);
        } else if (data.result?.status === 'failed') {
          setError('Analysis failed. Please try again.');
        } else {
          // Still processing, check again
          setTimeout(checkStatus, 2000);
        }
      } catch {
        setError('Failed to check analysis status');
      }
    };

    setTimeout(checkStatus, 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Content Analysis
        </CardTitle>
        <CardDescription>
          Analyze your content for keyword optimization and readability
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Page URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/page"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetKeyword">Target Keyword</Label>
            <Input
              id="targetKeyword"
              placeholder="e.g., stainless steel balustrades"
              value={targetKeyword}
              onChange={(e) => setTargetKeyword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Secondary Keywords (Optional)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add secondary keyword"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSecondaryKeyword())}
              />
              <Button type="button" variant="outline" onClick={addSecondaryKeyword}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {secondaryKeywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {secondaryKeywords.map((keyword) => (
                  <Badge key={keyword} variant="secondary" className="flex items-center gap-1">
                    {keyword}
                    <button
                      type="button"
                      onClick={() => removeSecondaryKeyword(keyword)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading || !url || !targetKeyword} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Analyze Content
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
