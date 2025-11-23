'use client';

/**
 * Report Viewer Modal
 * Phase 77: Preview report content before export
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Eye,
  Code,
  Copy,
  Check,
  Download,
  FileText,
  X,
} from 'lucide-react';

interface ReportViewerModalProps {
  title: string;
  subtitle?: string;
  htmlContent: string;
  markdownContent: string;
  completeness?: number;
  trigger?: React.ReactNode;
  onDownload?: () => void;
  children?: React.ReactNode;
}

export function ReportViewerModal({
  title,
  subtitle,
  htmlContent,
  markdownContent,
  completeness,
  trigger,
  onDownload,
  children,
}: ReportViewerModalProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdownContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{title}</DialogTitle>
              {subtitle && (
                <DialogDescription>{subtitle}</DialogDescription>
              )}
            </div>
            {completeness !== undefined && (
              <Badge
                variant="outline"
                className={
                  completeness >= 75
                    ? 'text-green-500 border-green-500/30'
                    : completeness >= 40
                    ? 'text-yellow-500 border-yellow-500/30'
                    : 'text-orange-500 border-orange-500/30'
                }
              >
                {completeness}% complete
              </Badge>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="preview" className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="preview">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="markdown">
                <Code className="h-4 w-4 mr-2" />
                Markdown
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyMarkdown}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy MD
                  </>
                )}
              </Button>
              {onDownload && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDownload}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
            </div>
          </div>

          <TabsContent value="preview" className="flex-1 mt-0">
            <ScrollArea className="h-[60vh] border rounded-lg">
              <div
                className="p-6 prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="markdown" className="flex-1 mt-0">
            <ScrollArea className="h-[60vh] border rounded-lg bg-muted">
              <pre className="p-4 text-xs font-mono whitespace-pre-wrap">
                {markdownContent}
              </pre>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {children}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Inline report preview (non-modal)
 */
export function ReportPreviewPane({
  htmlContent,
  markdownContent,
  className = '',
}: {
  htmlContent: string;
  markdownContent: string;
  className?: string;
}) {
  const [view, setView] = useState<'preview' | 'markdown'>('preview');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdownContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className={`border rounded-lg ${className}`}>
      <div className="flex items-center justify-between p-3 border-b bg-muted/50">
        <div className="flex gap-2">
          <Button
            variant={view === 'preview' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setView('preview')}
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button
            variant={view === 'markdown' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setView('markdown')}
          >
            <Code className="h-4 w-4 mr-1" />
            Markdown
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={handleCopy}>
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>

      <ScrollArea className="h-[400px]">
        {view === 'preview' ? (
          <div
            className="p-4 prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        ) : (
          <pre className="p-4 text-xs font-mono whitespace-pre-wrap bg-muted">
            {markdownContent}
          </pre>
        )}
      </ScrollArea>
    </div>
  );
}

export default ReportViewerModal;
