'use client';

/**
 * Production Output Card Component
 * Phase 50: Displays a single production output/deliverable
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText, Image, Video, Music, FileJson, Code,
  Download, Eye, Copy, Check
} from 'lucide-react';
import { useState } from 'react';

interface ProductionOutputCardProps {
  id: string;
  outputType: string;
  title: string;
  content?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  status: string;
  metadata?: Record<string, any>;
  createdAt: string;
  onView?: (id: string) => void;
  onDownload?: (id: string) => void;
}

export function ProductionOutputCard({
  id,
  outputType,
  title,
  content,
  fileUrl,
  thumbnailUrl,
  status,
  metadata,
  createdAt,
  onView,
  onDownload,
}: ProductionOutputCardProps) {
  const [copied, setCopied] = useState(false);

  const getOutputIcon = () => {
    const icons: Record<string, any> = {
      text: FileText,
      markdown: FileText,
      html: Code,
      image: Image,
      video: Video,
      audio: Music,
      pdf: FileText,
      json: FileJson,
      svg: Image,
      script: Code,
    };
    const Icon = icons[outputType] || FileText;
    return <Icon className="h-5 w-5" />;
  };

  const handleCopy = async () => {
    if (content) {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusBadge = () => {
    const configs: Record<string, string> = {
      draft: 'secondary',
      approved: 'default',
      rejected: 'destructive',
      archived: 'outline',
    };
    return configs[status] || 'secondary';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-muted rounded">
              {getOutputIcon()}
            </div>
            <div>
              <CardTitle className="text-sm">{title}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {outputType.charAt(0).toUpperCase() + outputType.slice(1)}
              </p>
            </div>
          </div>
          <Badge variant={getStatusBadge() as any}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Thumbnail/Preview */}
        {thumbnailUrl && (
          <div className="mb-3 rounded-lg overflow-hidden bg-muted aspect-video">
            <img
              src={thumbnailUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content preview */}
        {content && !thumbnailUrl && (
          <div className="mb-3 p-2 bg-muted rounded-lg max-h-32 overflow-hidden">
            <pre className="text-xs whitespace-pre-wrap line-clamp-6">
              {content}
            </pre>
          </div>
        )}

        {/* Metadata */}
        {metadata && Object.keys(metadata).length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {metadata.wordCount && (
              <Badge variant="outline" className="text-xs">
                {metadata.wordCount} words
              </Badge>
            )}
            {metadata.characterCount && (
              <Badge variant="outline" className="text-xs">
                {metadata.characterCount} chars
              </Badge>
            )}
            {metadata.estimatedDuration && (
              <Badge variant="outline" className="text-xs">
                ~{metadata.estimatedDuration}s
              </Badge>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {new Date(createdAt).toLocaleDateString()}
          </span>
          <div className="flex gap-1">
            {content && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                className="h-7 px-2"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            )}
            {onView && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onView(id)}
                className="h-7 px-2"
              >
                <Eye className="h-3 w-3" />
              </Button>
            )}
            {(fileUrl || content) && onDownload && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDownload(id)}
                className="h-7 px-2"
              >
                <Download className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ProductionOutputCard;
