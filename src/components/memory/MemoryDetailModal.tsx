'use client';

/**
 * MemoryDetailModal
 * Detailed view of a memory with full metadata and action options
 *
 * Shows complete memory details including content, relationships,
 * signals, and provides options to redact or link to other memories.
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Trash2, Link as LinkIcon, Copy, CheckCircle } from 'lucide-react';

interface MemoryDetailModalProps {
  memory: {
    id: string;
    memoryType: string;
    content: Record<string, any>;
    importance: number;
    confidence: number;
    recallPriority: number;
    keywords?: string[];
    createdAt: string;
    updatedAt: string;
    source?: string;
    agent?: string;
    uncertaintyNotes?: string;
    metadata?: Record<string, any>;
  };
  workspaceId: string;
  accessToken: string;
  onClose: () => void;
  onRedact?: (memoryId: string, reason: string) => Promise<void>;
}

const getMemoryTypeColor = (type: string) => {
  const colors: { [key: string]: string } = {
    lesson: 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200',
    pattern: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200',
    decision: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200',
    outcome: 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200',
    uncertainty: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200',
    signal: 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200',
    reasoning_trace: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200',
  };
  return colors[type] || 'bg-bg-raised text-text-primary';
};

export function MemoryDetailModal({
  memory,
  workspaceId,
  accessToken,
  onClose,
  onRedact,
}: MemoryDetailModalProps) {
  const [isRedacting, setIsRedacting] = useState(false);
  const [redactionReason, setRedactionReason] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCopyId = () => {
    navigator.clipboard.writeText(memory.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRedact = async () => {
    if (!redactionReason.trim()) {
      setError('Please provide a reason for redaction');
      return;
    }

    setIsRedacting(true);
    setError(null);

    try {
      if (onRedact) {
        await onRedact(memory.id, redactionReason);
        setSuccess('Memory redacted successfully');
        setTimeout(onClose, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to redact memory');
    } finally {
      setIsRedacting(false);
    }
  };

  const createdDate = new Date(memory.createdAt);
  const updatedDate = new Date(memory.updatedAt);
  const ageMs = Date.now() - createdDate.getTime();
  const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-subtle sticky top-0 bg-white dark:bg-gray-950">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Badge className={getMemoryTypeColor(memory.memoryType)}>
                {memory.memoryType}
              </Badge>
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              ID: <span className="font-mono">{memory.id.substring(0, 16)}...</span>
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Scores Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-bg-raised rounded">
              <p className="text-xs text-text-secondary mb-1">Recall Priority</p>
              <p className="text-2xl font-bold text-blue-600">{memory.recallPriority}</p>
            </div>
            <div className="p-3 bg-bg-raised rounded">
              <p className="text-xs text-text-secondary mb-1">Importance</p>
              <p className="text-2xl font-bold text-amber-600">{memory.importance}</p>
            </div>
            <div className="p-3 bg-bg-raised rounded">
              <p className="text-xs text-text-secondary mb-1">Confidence</p>
              <p className="text-2xl font-bold text-green-600">{memory.confidence}</p>
            </div>
            <div className="p-3 bg-bg-raised rounded">
              <p className="text-xs text-text-secondary mb-1">Age</p>
              <p className="text-2xl font-bold text-purple-600">{ageDays}d</p>
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Metadata</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-text-secondary">Source</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{memory.source || 'N/A'}</p>
              </div>
              <div>
                <p className="text-text-secondary">Agent</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{memory.agent || 'N/A'}</p>
              </div>
              <div>
                <p className="text-text-secondary">Created</p>
                <p className="font-medium text-gray-900 dark:text-gray-100 font-mono text-xs">
                  {createdDate.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-text-secondary">Updated</p>
                <p className="font-medium text-gray-900 dark:text-gray-100 font-mono text-xs">
                  {updatedDate.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Keywords */}
          {memory.keywords && memory.keywords.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {memory.keywords.map((keyword) => (
                  <Badge key={keyword} variant="outline">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Uncertainty Notes */}
          {memory.uncertaintyNotes && (
            <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30">
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                <strong>Uncertainty:</strong> {memory.uncertaintyNotes}
              </AlertDescription>
            </Alert>
          )}

          {/* Content */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Content</h3>
            <pre className="bg-bg-raised p-3 rounded text-xs overflow-auto max-h-48 text-text-secondary">
              {JSON.stringify(memory.content, null, 2)}
            </pre>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
              <AlertDescription className="text-red-800 dark:text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Redaction Section */}
          <div className="space-y-3 border-t border-border-subtle pt-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
              Redact Memory
            </h3>
            <p className="text-sm text-text-secondary">
              Mark this memory as redacted for compliance. The memory will be excluded from retrieval.
            </p>
            <textarea
              value={redactionReason}
              onChange={(e) => setRedactionReason(e.target.value)}
              placeholder="Reason for redaction (e.g., GDPR data deletion, compliance requirement)..."
              className="w-full px-3 py-2 border border-border-base rounded-md bg-bg-card text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
              rows={3}
              disabled={isRedacting}
            />
            <Button
              onClick={handleRedact}
              disabled={isRedacting || !redactionReason.trim()}
              variant="destructive"
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isRedacting ? 'Redacting...' : 'Redact Memory'}
            </Button>
          </div>

          {/* Utility Buttons */}
          <div className="flex gap-2 pt-4 border-t border-border-subtle">
            <Button
              onClick={handleCopyId}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Copy className="w-4 h-4 mr-2" />
              {copied ? 'Copied!' : 'Copy ID'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              Link Memory
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
