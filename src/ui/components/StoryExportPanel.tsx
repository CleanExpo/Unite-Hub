'use client';

/**
 * Story Export Panel
 * Phase 74: Export stories to multiple formats
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Copy,
  Check,
  FileJson,
  FileText,
  Mail,
  Video,
  Mic,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  ExportedStory,
  exportToJSON,
  exportToMarkdown,
  exportToEmail,
  exportVideoScript,
  exportVoiceScript,
  getExportOptions,
} from '@/lib/storytelling/storyExportFormats';
import { ClientStoryNarrative, VideoScript, VoiceScript } from '@/lib/storytelling/storytellingNarrativeBuilder';

interface StoryExportPanelProps {
  narrative: ClientStoryNarrative;
  videoScript?: VideoScript;
  voiceScript?: VoiceScript;
  className?: string;
}

export function StoryExportPanel({
  narrative,
  videoScript,
  voiceScript,
  className = '',
}: StoryExportPanelProps) {
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [expandedFormat, setExpandedFormat] = useState<string | null>(null);

  const options = getExportOptions(!!videoScript, !!voiceScript);

  const getFormatIcon = (formatId: string) => {
    switch (formatId) {
      case 'json':
        return FileJson;
      case 'markdown':
        return FileText;
      case 'email':
        return Mail;
      case 'video':
        return Video;
      case 'voice':
        return Mic;
      default:
        return FileText;
    }
  };

  const getExportContent = (formatId: string): ExportedStory | null => {
    switch (formatId) {
      case 'json':
        return exportToJSON(narrative);
      case 'markdown':
        return exportToMarkdown(narrative);
      case 'email':
        return exportToEmail(narrative);
      case 'video':
        return videoScript ? exportVideoScript(videoScript) : null;
      case 'voice':
        return voiceScript ? exportVoiceScript(voiceScript) : null;
      default:
        return null;
    }
  };

  const handleCopy = async (formatId: string) => {
    const exported = getExportContent(formatId);
    if (!exported) {
return;
}

    try {
      await navigator.clipboard.writeText(exported.content);
      setCopiedFormat(formatId);
      setTimeout(() => setCopiedFormat(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownload = (formatId: string) => {
    const exported = getExportContent(formatId);
    if (!exported) {
return;
}

    const blob = new Blob([exported.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exported.filename_suggestion;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleExpand = (formatId: string) => {
    setExpandedFormat(expandedFormat === formatId ? null : formatId);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Download className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">Export Story</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {options.map((option) => {
          const Icon = getFormatIcon(option.id);
          const isExpanded = expandedFormat === option.id;
          const exported = isExpanded ? getExportContent(option.id) : null;

          return (
            <div
              key={option.id}
              className="border rounded-lg overflow-hidden"
            >
              {/* Option header */}
              <div className="flex items-center justify-between p-3 bg-muted/30">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => handleCopy(option.id)}
                  >
                    {copiedFormat === option.id ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => handleDownload(option.id)}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => toggleExpand(option.id)}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Preview */}
              {isExpanded && exported && (
                <div className="p-3 border-t bg-muted/10">
                  <pre className="text-xs overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap font-mono">
                    {exported.content.substring(0, 1000)}
                    {exported.content.length > 1000 && (
                      <span className="text-muted-foreground">
                        ... ({exported.content.length - 1000} more characters)
                      </span>
                    )}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

/**
 * Compact export buttons
 */
export function StoryExportButtons({
  narrative,
  videoScript,
  voiceScript,
}: {
  narrative: ClientStoryNarrative;
  videoScript?: VideoScript;
  voiceScript?: VoiceScript;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopyMarkdown = async () => {
    const exported = exportToMarkdown(narrative);
    try {
      await navigator.clipboard.writeText(exported.content);
      setCopied('md');
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleCopyEmail = async () => {
    const exported = exportToEmail(narrative);
    try {
      await navigator.clipboard.writeText(exported.content);
      setCopied('email');
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyMarkdown}
        className="h-7 text-xs"
      >
        {copied === 'md' ? (
          <Check className="h-3 w-3 mr-1 text-green-500" />
        ) : (
          <FileText className="h-3 w-3 mr-1" />
        )}
        Copy Markdown
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyEmail}
        className="h-7 text-xs"
      >
        {copied === 'email' ? (
          <Check className="h-3 w-3 mr-1 text-green-500" />
        ) : (
          <Mail className="h-3 w-3 mr-1" />
        )}
        Copy Email
      </Button>
      {videoScript && (
        <Badge variant="outline" className="text-[10px]">
          <Video className="h-2.5 w-2.5 mr-1" />
          Video Script
        </Badge>
      )}
      {voiceScript && (
        <Badge variant="outline" className="text-[10px]">
          <Mic className="h-2.5 w-2.5 mr-1" />
          Voice Script
        </Badge>
      )}
    </div>
  );
}

export default StoryExportPanel;
