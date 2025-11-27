'use client';

/**
 * CONVEX Version Comparison Component
 *
 * Displays side-by-side comparison of two strategy versions with:
 * - Diff visualization for all fields
 * - Similarity score highlighting
 * - Score change metrics
 * - One-click version restoration
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Copy,
  Download,
  RotateCcw,
} from 'lucide-react';

interface StrategyVersion {
  version: number;
  title: string;
  date: string;
  score: number;
  author: string;
  changeSummary?: string;
}

interface StrategyDiff {
  field: string;
  oldValue: any;
  newValue: any;
  changeType: 'added' | 'modified' | 'removed';
}

interface VersionComparisonProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  version1: StrategyVersion;
  version2: StrategyVersion;
  diffs: StrategyDiff[];
  scoreChange: number;
  similarityScore: number;
  strategyId: string;
  onRestore?: (versionNumber: number) => Promise<void>;
}

export function ConvexVersionComparison({
  open,
  onOpenChange,
  version1,
  version2,
  diffs,
  scoreChange,
  similarityScore,
  strategyId,
  onRestore,
}: VersionComparisonProps) {
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const handleRestore = async (versionNumber: number) => {
    if (!onRestore) return;

    setIsRestoring(true);
    setRestoreError(null);

    try {
      await onRestore(versionNumber);
      onOpenChange(false);
    } catch (error) {
      setRestoreError(
        error instanceof Error ? error.message : 'Failed to restore version'
      );
    } finally {
      setIsRestoring(false);
    }
  };

  // Group diffs by field category
  const contentDiffs = diffs.filter((d) => d.field === 'strategy_content');
  const frameworkDiffs = diffs.filter((d) => d.field.startsWith('frameworks'));
  const metadataDiffs = diffs.filter((d) =>
    ['title', 'convex_score', 'compliance_status'].includes(d.field)
  );
  const executionDiffs = diffs.filter((d) => d.field.startsWith('execution_plan'));
  const metricsDiffs = diffs.filter((d) => d.field.startsWith('success_metrics'));

  const getSimilarityColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compare Strategy Versions</DialogTitle>
          <DialogDescription>
            Side-by-side comparison with change tracking and restoration
          </DialogDescription>
        </DialogHeader>

        {restoreError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{restoreError}</AlertDescription>
          </Alert>
        )}

        {/* Version Overview Cards */}
        <div className="grid grid-cols-3 gap-4">
          {/* Version 1 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Version {version1.version}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{version1.date}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Score
                  </p>
                  <p className="text-2xl font-bold">{version1.score}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Author
                  </p>
                  <p className="text-sm truncate">{version1.author}</p>
                </div>
                {version1.changeSummary && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Changes
                    </p>
                    <p className="text-sm">{version1.changeSummary}</p>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => handleRestore(version1.version)}
                  disabled={isRestoring}
                >
                  <RotateCcw className="h-3 w-3 mr-2" />
                  Restore v{version1.version}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Comparison Metrics */}
          <Card className="flex flex-col justify-center">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                Comparison
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-xs font-semibold text-muted-foreground mb-1">
                  Similarity
                </p>
                <p
                  className={`text-3xl font-bold ${getSimilarityColor(
                    similarityScore
                  )}`}
                >
                  {similarityScore}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-muted-foreground mb-1">
                  Score Change
                </p>
                <p className={`text-2xl font-bold ${getScoreChangeColor(scoreChange)}`}>
                  {scoreChange > 0 ? '+' : ''}
                  {scoreChange}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-muted-foreground mb-1">
                  Changes
                </p>
                <p className="text-2xl font-bold">{diffs.length}</p>
              </div>
            </CardContent>
          </Card>

          {/* Version 2 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Version {version2.version}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{version2.date}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Score
                  </p>
                  <p className="text-2xl font-bold">{version2.score}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Author
                  </p>
                  <p className="text-sm truncate">{version2.author}</p>
                </div>
                {version2.changeSummary && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Changes
                    </p>
                    <p className="text-sm">{version2.changeSummary}</p>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => handleRestore(version2.version)}
                  disabled={isRestoring}
                >
                  <RotateCcw className="h-3 w-3 mr-2" />
                  Restore v{version2.version}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Diffs */}
        <Tabs defaultValue="metadata" className="mt-6">
          <TabsList>
            {metadataDiffs.length > 0 && <TabsTrigger value="metadata">Metadata</TabsTrigger>}
            {frameworkDiffs.length > 0 && <TabsTrigger value="frameworks">Frameworks</TabsTrigger>}
            {executionDiffs.length > 0 && <TabsTrigger value="execution">Execution</TabsTrigger>}
            {metricsDiffs.length > 0 && <TabsTrigger value="metrics">Metrics</TabsTrigger>}
            {contentDiffs.length > 0 && <TabsTrigger value="content">Content</TabsTrigger>}
          </TabsList>

          {/* Metadata Tab */}
          {metadataDiffs.length > 0 && (
            <TabsContent value="metadata">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {metadataDiffs.map((diff) => (
                      <div
                        key={diff.field}
                        className="border rounded-lg p-4 bg-muted/30"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm capitalize">
                            {diff.field.replace('_', ' ')}
                          </h4>
                          <Badge
                            variant={
                              diff.changeType === 'modified' ? 'default' : 'outline'
                            }
                          >
                            {diff.changeType}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              Before
                            </p>
                            <p className="text-sm font-mono bg-background p-2 rounded">
                              {String(diff.oldValue)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              After
                            </p>
                            <p className="text-sm font-mono bg-background p-2 rounded">
                              {String(diff.newValue)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Frameworks Tab */}
          {frameworkDiffs.length > 0 && (
            <TabsContent value="frameworks">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {frameworkDiffs.map((diff) => (
                      <div key={diff.field} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        {diff.changeType === 'added' && (
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                        )}
                        {diff.changeType === 'removed' && (
                          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                        )}
                        <span className="text-sm">{String(diff.newValue || diff.oldValue)}</span>
                        <Badge variant="outline" className="ml-auto">
                          {diff.changeType}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Execution Tab */}
          {executionDiffs.length > 0 && (
            <TabsContent value="execution">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {executionDiffs.map((diff) => (
                      <div key={diff.field} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm flex-1">{String(diff.newValue || diff.oldValue)}</span>
                        <Badge variant="outline">
                          {diff.changeType}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Metrics Tab */}
          {metricsDiffs.length > 0 && (
            <TabsContent value="metrics">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {metricsDiffs.map((diff) => (
                      <div key={diff.field} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm flex-1">{String(diff.newValue || diff.oldValue)}</span>
                        <Badge variant="outline">
                          {diff.changeType}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Content Tab */}
          {contentDiffs.length > 0 && (
            <TabsContent value="content">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-semibold mb-2">Content Changes</p>
                      <p className="text-sm text-muted-foreground">
                        {diffs.find((d) => d.field === 'strategy_content')?.oldValue} words →{' '}
                        {diffs.find((d) => d.field === 'strategy_content')?.newValue} words
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Dialog Footer */}
        <div className="flex gap-2 justify-end mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={() => {
              const comparison = {
                version1,
                version2,
                diffs,
                scoreChange,
                similarityScore,
              };
              const blob = new Blob([JSON.stringify(comparison, null, 2)], {
                type: 'application/json',
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `convex-comparison-v${version1.version}-v${version2.version}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
