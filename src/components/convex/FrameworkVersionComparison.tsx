/**
 * Framework Version Comparison Component
 *
 * Side-by-side comparison of two framework versions with:
 * - Field-level diff visualization
 * - Similarity scoring
 * - Change highlighting
 * - Component comparison
 * - Rule comparison
 * - Pattern comparison
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle, Copy, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { logger } from '@/lib/logging';

interface ComparisonDiff {
  field: string;
  oldValue: any;
  newValue: any;
  type: 'added' | 'removed' | 'modified';
}

interface VersionComparisonProps {
  version1: {
    version_number: number;
    name: string;
    framework_state: any;
    created_at: string;
  };
  version2: {
    version_number: number;
    name: string;
    framework_state: any;
    created_at: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

function calculateDiff(obj1: any, obj2: any, path = ''): ComparisonDiff[] {
  const diffs: ComparisonDiff[] = [];

  // Check for modifications and removals
  for (const key in obj1) {
    const fullPath = path ? `${path}.${key}` : key;
    const val1 = obj1[key];
    const val2 = obj2[key];

    if (typeof val1 === 'object' && val1 !== null && typeof val2 === 'object' && val2 !== null) {
      diffs.push(...calculateDiff(val1, val2, fullPath));
    } else if (val2 === undefined) {
      diffs.push({
        field: fullPath,
        oldValue: val1,
        newValue: undefined,
        type: 'removed',
      });
    } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
      diffs.push({
        field: fullPath,
        oldValue: val1,
        newValue: val2,
        type: 'modified',
      });
    }
  }

  // Check for additions
  for (const key in obj2) {
    if (!(key in obj1)) {
      const fullPath = path ? `${path}.${key}` : key;
      diffs.push({
        field: fullPath,
        oldValue: undefined,
        newValue: obj2[key],
        type: 'added',
      });
    }
  }

  return diffs;
}

function calculateSimilarity(diffs: ComparisonDiff[]): number {
  if (diffs.length === 0) return 100;

  const totalChanges = diffs.length;
  const totalFields = totalChanges + (100 - totalChanges); // Estimated total fields

  // More modifications = lower similarity
  const modifiedCount = diffs.filter((d) => d.type === 'modified').length;
  const similarity = Math.max(0, 100 - (modifiedCount * 10 + diffs.length * 2));

  return Math.round(similarity);
}

export function FrameworkVersionComparison({
  version1,
  version2,
  isOpen,
  onClose,
}: VersionComparisonProps) {
  const [copySuccess, setCopySuccess] = useState(false);

  const diffs = useMemo(
    () => calculateDiff(version1.framework_state, version2.framework_state),
    [version1, version2]
  );

  const similarity = useMemo(() => calculateSimilarity(diffs), [diffs]);

  const diffsByType = useMemo(
    () => ({
      added: diffs.filter((d) => d.type === 'added'),
      removed: diffs.filter((d) => d.type === 'removed'),
      modified: diffs.filter((d) => d.type === 'modified'),
    }),
    [diffs]
  );

  const handleExportComparison = () => {
    const data = {
      from_version: version1.version_number,
      to_version: version2.version_number,
      similarity_score: similarity,
      total_changes: diffs.length,
      changes_by_type: {
        added: diffsByType.added.length,
        removed: diffsByType.removed.length,
        modified: diffsByType.modified.length,
      },
      diffs: diffs,
      exported_at: new Date().toISOString(),
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comparison-v${version1.version_number}-v${version2.version_number}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyJson = () => {
    const json = JSON.stringify(diffs, null, 2);
    navigator.clipboard.writeText(json).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const getSimilarityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Version Comparison</DialogTitle>
          <DialogDescription>
            Compare v{version1.version_number} with v{version2.version_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header with Versions */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">v{version1.version_number}</CardTitle>
                <CardDescription className="text-xs">
                  {new Date(version1.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm">{version1.name}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">v{version2.version_number}</CardTitle>
                <CardDescription className="text-xs">
                  {new Date(version2.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm">{version2.name}</div>
              </CardContent>
            </Card>
          </div>

          {/* Similarity Score */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Similarity Score</div>
                  <div className={`text-3xl font-bold ${getSimilarityColor(similarity)}`}>
                    {similarity}%
                  </div>
                </div>

                <div className="text-right space-y-2">
                  <div className="flex gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-semibold">{diffsByType.added.length} Added</span>
                  </div>
                  <div className="flex gap-2">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    <span className="text-sm font-semibold">{diffsByType.removed.length} Removed</span>
                  </div>
                  <div className="flex gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm font-semibold">{diffsByType.modified.length} Modified</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="added">Added ({diffsByType.added.length})</TabsTrigger>
              <TabsTrigger value="modified">Modified ({diffsByType.modified.length})</TabsTrigger>
              <TabsTrigger value="removed">Removed ({diffsByType.removed.length})</TabsTrigger>
            </TabsList>

            {/* Summary Tab */}
            <TabsContent value="summary" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Change Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{diffsByType.added.length}</div>
                      <div className="text-xs text-muted-foreground">Fields Added</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{diffsByType.modified.length}</div>
                      <div className="text-xs text-muted-foreground">Fields Modified</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{diffsByType.removed.length}</div>
                      <div className="text-xs text-muted-foreground">Fields Removed</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="text-sm font-semibold">Overall Impact</div>
                    {diffs.length === 0 ? (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        No changes between versions
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {diffs.length} total change{diffs.length !== 1 ? 's' : ''} across frameworks
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Added Tab */}
            <TabsContent value="added" className="space-y-2">
              <ScrollArea className="h-[400px] border rounded-lg p-4">
                {diffsByType.added.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No fields added
                  </div>
                ) : (
                  <div className="space-y-2">
                    {diffsByType.added.map((diff, i) => (
                      <Card key={i} className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                        <CardContent className="pt-4">
                          <div className="text-xs font-mono text-muted-foreground mb-1">
                            {diff.field}
                          </div>
                          <div className="text-sm text-green-700 dark:text-green-300">
                            + {typeof diff.newValue === 'string' ? diff.newValue : JSON.stringify(diff.newValue)}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Modified Tab */}
            <TabsContent value="modified" className="space-y-2">
              <ScrollArea className="h-[400px] border rounded-lg p-4">
                {diffsByType.modified.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No fields modified
                  </div>
                ) : (
                  <div className="space-y-3">
                    {diffsByType.modified.map((diff, i) => (
                      <Card key={i} className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
                        <CardContent className="pt-4">
                          <div className="text-xs font-mono text-muted-foreground mb-2">
                            {diff.field}
                          </div>
                          <div className="space-y-1 text-xs">
                            <div>
                              <span className="text-muted-foreground">Old: </span>
                              <span className="text-red-600">
                                {typeof diff.oldValue === 'string' ? diff.oldValue : JSON.stringify(diff.oldValue)}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">New: </span>
                              <span className="text-green-600">
                                {typeof diff.newValue === 'string' ? diff.newValue : JSON.stringify(diff.newValue)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Removed Tab */}
            <TabsContent value="removed" className="space-y-2">
              <ScrollArea className="h-[400px] border rounded-lg p-4">
                {diffsByType.removed.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No fields removed
                  </div>
                ) : (
                  <div className="space-y-2">
                    {diffsByType.removed.map((diff, i) => (
                      <Card key={i} className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                        <CardContent className="pt-4">
                          <div className="text-xs font-mono text-muted-foreground mb-1">
                            {diff.field}
                          </div>
                          <div className="text-sm text-red-700 dark:text-red-300">
                            - {typeof diff.oldValue === 'string' ? diff.oldValue : JSON.stringify(diff.oldValue)}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleCopyJson}>
              <Copy className="h-4 w-4 mr-2" />
              {copySuccess ? 'Copied!' : 'Copy'}
            </Button>
            <Button variant="outline" onClick={handleExportComparison}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
