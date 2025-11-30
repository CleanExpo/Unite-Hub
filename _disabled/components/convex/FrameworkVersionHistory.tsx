/**
 * Framework Version History Component
 *
 * Displays version history with:
 * - Timeline of all versions
 * - Automatic version numbering
 * - Change summaries
 * - Version comparison
 * - Restore to previous versions
 * - Version metadata (author, date, changes)
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  RotateCcw,
  Eye,
  Download,
  Copy,
  ChevronRight,
  Clock,
  User,
  Save,
  AlertCircle,
  CheckCircle,
  Code,
} from 'lucide-react';
import { logger } from '@/lib/logging';

interface FrameworkVersion {
  id: string;
  version_number: number;
  name: string;
  description: string;
  framework_state: any;
  change_summary: string;
  created_by: string;
  created_at: string;
  component_count: number;
  rule_count: number;
  pattern_count: number;
}

interface FrameworkVersionHistoryProps {
  workspaceId: string;
  frameworkId: string;
  currentVersion: number;
  isOpen: boolean;
  onClose: () => void;
  onRestore: (versionId: string, versionNumber: number) => void;
}

export function FrameworkVersionHistory({
  workspaceId,
  frameworkId,
  currentVersion,
  isOpen,
  onClose,
  onRestore,
}: FrameworkVersionHistoryProps) {
  // State
  const [versions, setVersions] = useState<FrameworkVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<FrameworkVersion | null>(null);
  const [compareWithVersion, setCompareWithVersion] = useState<FrameworkVersion | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoreVersion, setRestoreVersion] = useState<FrameworkVersion | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [showSaveVersion, setShowSaveVersion] = useState(false);
  const [versionLabel, setVersionLabel] = useState('');
  const [versionDescription, setVersionDescription] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  // Load versions
  const loadVersions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/convex/framework-versions?workspaceId=${workspaceId}&frameworkId=${frameworkId}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        throw new Error('Failed to load versions');
      }

      const data = await response.json();
      setVersions(data.versions || []);
    } catch (error) {
      logger.error('[VERSION_HISTORY] Load error:', error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, frameworkId]);

  // Load versions on open
  React.useEffect(() => {
    if (isOpen) {
      loadVersions();
    }
  }, [isOpen, loadVersions]);

  // Save new version
  const handleSaveVersion = async () => {
    try {
      setSaveLoading(true);

      const response = await fetch('/api/convex/framework-versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          frameworkId,
          action: 'saveVersion',
          label: versionLabel,
          description: versionDescription,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save version');
      }

      // Reset form and reload
      setVersionLabel('');
      setVersionDescription('');
      setShowSaveVersion(false);
      loadVersions();
    } catch (error) {
      logger.error('[VERSION_HISTORY] Save version error:', error);
    } finally {
      setSaveLoading(false);
    }
  };

  // Restore version
  const handleRestoreVersion = async (version: FrameworkVersion) => {
    try {
      setRestoreLoading(true);

      const response = await fetch('/api/convex/framework-versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          frameworkId,
          action: 'restore',
          versionId: version.id,
          versionNumber: version.version_number,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to restore version');
      }

      setRestoreDialogOpen(false);
      setRestoreVersion(null);
      onRestore(version.id, version.version_number);
      loadVersions();
    } catch (error) {
      logger.error('[VERSION_HISTORY] Restore error:', error);
    } finally {
      setRestoreLoading(false);
    }
  };

  // Export version
  const handleExportVersion = (version: FrameworkVersion) => {
    const data = {
      version: version.version_number,
      name: version.name,
      description: version.description,
      framework_state: version.framework_state,
      exported_at: new Date().toISOString(),
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `framework-v${version.version_number}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Sort versions (newest first)
  const sortedVersions = useMemo(
    () => [...versions].sort((a, b) => b.version_number - a.version_number),
    [versions]
  );

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full max-w-2xl">
          <SheetHeader>
            <SheetTitle>Version History</SheetTitle>
            <SheetDescription>
              View, compare, and restore previous framework versions
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 py-4">
            {/* Save Version Button */}
            <Button
              onClick={() => setShowSaveVersion(true)}
              className="w-full"
              variant="outline"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Current Version
            </Button>

            {/* Versions Timeline */}
            <ScrollArea className="h-[600px] border rounded-lg p-4">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="text-muted-foreground">Loading versions...</div>
                </div>
              ) : sortedVersions.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <div className="text-center text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No versions yet
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedVersions.map((version, index) => (
                    <div key={version.id}>
                      {/* Timeline connector */}
                      {index < sortedVersions.length - 1 && (
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-background"></div>
                            <div className="w-0.5 h-12 bg-border my-1"></div>
                          </div>
                        </div>
                      )}

                      {/* Version Card */}
                      <Card
                        className={`cursor-pointer hover:shadow-md transition-shadow ${
                          version.version_number === currentVersion
                            ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                            : ''
                        }`}
                        onClick={() => setSelectedVersion(version)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <CardTitle className="text-base">
                                  v{version.version_number}
                                </CardTitle>
                                {version.version_number === currentVersion && (
                                  <Badge className="bg-green-600">Current</Badge>
                                )}
                              </div>
                              {version.name && (
                                <CardDescription className="font-semibold text-foreground">
                                  {version.name}
                                </CardDescription>
                              )}
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-3">
                          {/* Change Summary */}
                          {version.change_summary && (
                            <div>
                              <div className="text-xs text-muted-foreground font-semibold mb-1">
                                Changes
                              </div>
                              <p className="text-sm">{version.change_summary}</p>
                            </div>
                          )}

                          {/* Metadata */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span className="text-muted-foreground">
                                {new Date(version.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span className="text-muted-foreground">{version.created_by}</span>
                            </div>
                          </div>

                          {/* Component Counts */}
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="bg-muted p-2 rounded">
                              <span className="text-muted-foreground">Components</span>
                              <div className="font-semibold text-lg">{version.component_count}</div>
                            </div>
                            <div className="bg-muted p-2 rounded">
                              <span className="text-muted-foreground">Rules</span>
                              <div className="font-semibold text-lg">{version.rule_count}</div>
                            </div>
                            <div className="bg-muted p-2 rounded">
                              <span className="text-muted-foreground">Patterns</span>
                              <div className="font-semibold text-lg">{version.pattern_count}</div>
                            </div>
                          </div>

                          {/* Actions */}
                          <Separator className="my-2" />
                          <div className="flex gap-2">
                            {version.version_number !== currentVersion && (
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRestoreVersion(version);
                                  setRestoreDialogOpen(true);
                                }}
                                className="flex-1"
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Restore
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedVersion(version);
                                setCompareWithVersion(sortedVersions[0]);
                                setShowCompare(true);
                              }}
                            >
                              <Code className="h-3 w-3 mr-1" />
                              Compare
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExportVersion(version);
                              }}
                            >
                              <Download className="h-3 w-3 mr-1" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Summary */}
            <div className="text-xs text-muted-foreground">
              {versions.length} version{versions.length !== 1 ? 's' : ''}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Version Details Dialog */}
      {selectedVersion && (
        <Dialog open={!!selectedVersion} onOpenChange={() => setSelectedVersion(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>v{selectedVersion.version_number} - {selectedVersion.name}</DialogTitle>
              <DialogDescription>{selectedVersion.description}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Created By</Label>
                  <div className="font-semibold">{selectedVersion.created_by}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Created At</Label>
                  <div className="font-semibold">
                    {new Date(selectedVersion.created_at).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Change Summary */}
              <div>
                <Label className="text-xs text-muted-foreground">Change Summary</Label>
                <p className="text-sm mt-2 bg-muted p-3 rounded">
                  {selectedVersion.change_summary || 'No changes recorded'}
                </p>
              </div>

              {/* Framework State */}
              <div>
                <Label className="text-xs text-muted-foreground">Framework State</Label>
                <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-48 mt-2">
                  {JSON.stringify(selectedVersion.framework_state, null, 2)}
                </pre>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-xs text-muted-foreground">Components</div>
                    <div className="text-2xl font-bold">{selectedVersion.component_count}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-xs text-muted-foreground">Rules</div>
                    <div className="text-2xl font-bold">{selectedVersion.rule_count}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-xs text-muted-foreground">Patterns</div>
                    <div className="text-2xl font-bold">{selectedVersion.pattern_count}</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedVersion(null)}>
                Close
              </Button>
              {selectedVersion.version_number !== currentVersion && (
                <Button
                  onClick={() => {
                    setRestoreVersion(selectedVersion);
                    setRestoreDialogOpen(true);
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore This Version
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}

      {/* Save Version Dialog */}
      <Dialog open={showSaveVersion} onOpenChange={setShowSaveVersion}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Current Version</DialogTitle>
            <DialogDescription>
              Create a new version snapshot with your changes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Version Label (optional)</Label>
              <Input
                placeholder="e.g., Added value props"
                value={versionLabel}
                onChange={(e) => setVersionLabel(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Change Summary (optional)</Label>
              <Textarea
                placeholder="Describe what changed in this version..."
                value={versionDescription}
                onChange={(e) => setVersionDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveVersion(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveVersion} disabled={saveLoading}>
              {saveLoading ? 'Saving...' : 'Save Version'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Version?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore to v{restoreVersion?.version_number}? This will replace
              your current framework with this version. Your current version will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => restoreVersion && handleRestoreVersion(restoreVersion)}
              disabled={restoreLoading}
            >
              {restoreLoading ? 'Restoring...' : 'Restore'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
