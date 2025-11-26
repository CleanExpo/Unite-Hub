'use client';

/**
 * ResultPreviewCard Component
 *
 * Displays a preview of job results
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Download, Eye } from 'lucide-react';
import { useState } from 'react';

interface Result {
  id: string;
  job_id: string;
  result_type: string;
  result_json: any;
  created_at: string;
}

interface ResultPreviewCardProps {
  result: Result;
  onViewFull?: () => void;
}

export function ResultPreviewCard({ result, onViewFull }: ResultPreviewCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(result.result_json, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(result.result_json, null, 2)], {
      type: 'application/json',
    });
    element.href = URL.createObjectURL(file);
    element.download = `result-${result.job_id}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Create a preview of the content
  const getPreview = () => {
    if (typeof result.result_json === 'string') {
      return result.result_json.slice(0, 200);
    }
    if (typeof result.result_json === 'object') {
      const preview = JSON.stringify(result.result_json).slice(0, 200);
      return preview;
    }
    return String(result.result_json).slice(0, 200);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{result.result_type}</CardTitle>
            <CardDescription>
              {new Date(result.created_at).toLocaleString()}
            </CardDescription>
          </div>
          <Badge variant="outline">{result.result_type}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview */}
        <div className="bg-slate-50 rounded border border-slate-200 p-3 max-h-32 overflow-hidden">
          <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">
            {getPreview()}
            {getPreview().length >= 200 && '...'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {onViewFull && (
            <Button
              size="sm"
              variant="outline"
              onClick={onViewFull}
              className="gap-2 flex-1"
            >
              <Eye size={16} />
              View Full
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="gap-2 flex-1"
          >
            <Copy size={16} />
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownload}
            className="gap-2 flex-1"
          >
            <Download size={16} />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ResultPreviewCard;
