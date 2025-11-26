'use client';

/**
 * ResultViewer Component
 *
 * Displays job results with rich formatting, copy/download functionality
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Download, Check } from 'lucide-react';
import { useState } from 'react';

interface Result {
  id: string;
  job_id: string;
  result_type: string;
  result_json: any;
  created_at: string;
}

interface ResultViewerProps {
  jobId: string;
  jobType: string;
  results: Result[];
  isLoading?: boolean;
}

export function ResultViewer({ jobId, jobType, results, isLoading = false }: ResultViewerProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (result: Result) => {
    navigator.clipboard.writeText(JSON.stringify(result.result_json, null, 2));
    setCopiedId(result.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (result: Result) => {
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(result.result_json, null, 2)], {
      type: 'application/json',
    });
    element.href = URL.createObjectURL(file);
    element.download = `result-${jobId}-${result.result_type}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-slate-600">Loading results...</p>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Job Results</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">No results yet. Check back when the job completes.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Results ({results.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {results.map((result) => (
          <div key={result.id} className="border rounded-lg p-4 space-y-3 bg-slate-50">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-slate-900">{result.result_type}</h4>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(result.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Result Preview */}
            <div className="bg-white rounded border border-slate-200 max-h-96 overflow-y-auto">
              <pre className="p-3 text-sm font-mono text-slate-700 whitespace-pre-wrap break-words">
                {JSON.stringify(result.result_json, null, 2)}
              </pre>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopy(result)}
                className="gap-2"
              >
                {copiedId === result.id ? (
                  <>
                    <Check size={16} />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownload(result)}
                className="gap-2"
              >
                <Download size={16} />
                Download
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
