'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Trash2,
  Archive,
  Download,
  AlertTriangle,
  CheckCircle,
  Filter,
  MoreVertical,
  Search,
  Users,
  Mail,
  Phone,
} from 'lucide-react';
import { TestDataRecord, TestDataManager, useTestDataManager } from '@/lib/crm/test-data-manager';
import { toast } from '@/components/ui/use-toast';

interface DataCleanupToolsProps {
  records: TestDataRecord[];
  onRefresh: () => void;
}

export default function DataCleanupTools({ records, onRefresh }: DataCleanupToolsProps) {
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'delete' | 'archive' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterConfidence, setFilterConfidence] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const {
    identifyTestData,
    getTestDataSummary,
    bulkDelete,
    bulkArchive,
    exportData,
    findDuplicates,
  } = useTestDataManager();

  const testRecords = identifyTestData(records);
  const summary = getTestDataSummary(records);
  const duplicates = findDuplicates(records);

  // Filter records by confidence level
  const filteredRecords = filterConfidence === 'all' 
    ? testRecords
    : testRecords.filter(r => {
        const confidence = TestDataManager.getTestDataConfidence(r);
        if (filterConfidence === 'high') return confidence >= 70;
        if (filterConfidence === 'medium') return confidence >= 40 && confidence < 70;
        if (filterConfidence === 'low') return confidence > 0 && confidence < 40;
        return true;
      });

  const handleSelectAll = () => {
    if (selectedRecords.size === filteredRecords.length) {
      setSelectedRecords(new Set());
    } else {
      setSelectedRecords(new Set(filteredRecords.map(r => r.id)));
    }
  };

  const handleSelectRecord = (id: string) => {
    const newSelected = new Set(selectedRecords);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRecords(newSelected);
  };

  const handleBulkAction = (action: 'delete' | 'archive') => {
    if (selectedRecords.size === 0) {
      toast({
        title: 'No records selected',
        description: 'Please select records to perform this action',
        variant: 'destructive',
      });
      return;
    }
    setConfirmAction(action);
    setShowConfirmDialog(true);
  };

  const performBulkAction = async () => {
    setIsProcessing(true);
    const selectedIds = Array.from(selectedRecords);

    try {
      if (confirmAction === 'delete') {
        await bulkDelete(selectedIds);
        toast({
          title: 'Records deleted',
          description: `Successfully deleted ${selectedIds.length} records`,
        });
      } else if (confirmAction === 'archive') {
        await bulkArchive(selectedIds);
        toast({
          title: 'Records archived',
          description: `Successfully archived ${selectedIds.length} records`,
        });
      }
      setSelectedRecords(new Set());
      onRefresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to perform bulk action',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setShowConfirmDialog(false);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    const data = await exportData(
      selectedRecords.size > 0 
        ? filteredRecords.filter(r => selectedRecords.has(r.id))
        : filteredRecords,
      format
    );

    // Create download link
    const blob = new Blob([data], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-data-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export complete',
      description: `Exported ${selectedRecords.size || filteredRecords.length} records`,
    });
  };

  const getConfidenceBadge = (record: TestDataRecord) => {
    const confidence = TestDataManager.getTestDataConfidence(record);
    if (confidence >= 70) {
      return <Badge variant="destructive">High</Badge>;
    } else if (confidence >= 40) {
      return <Badge variant="secondary">Medium</Badge>;
    } else {
      return <Badge variant="outline">Low</Badge>;
    }
  };

  const getFlagIcon = (flag: string) => {
    switch (flag) {
      case 'name_pattern':
        return <Users className="h-3 w-3" />;
      case 'email_pattern':
        return <Mail className="h-3 w-3" />;
      case 'phone_pattern':
        return <Phone className="h-3 w-3" />;
      default:
        return <AlertTriangle className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Data Quality Management</CardTitle>
          <CardDescription>
            Identify and manage test data, duplicates, and incomplete records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Records</p>
              <p className="text-2xl font-bold">{summary.total}</p>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">Potential Test Data</p>
              <p className="text-2xl font-bold">{summary.testDataCount}</p>
              <p className="text-xs text-red-500">{summary.percentage}%</p>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <p className="text-sm text-orange-600 dark:text-orange-400">Duplicates</p>
              <p className="text-2xl font-bold">{duplicates.size}</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">Clean Records</p>
              <p className="text-2xl font-bold">{summary.total - summary.testDataCount}</p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>High Confidence Test Data</span>
              <span className="font-medium">{summary.byConfidence.high} records</span>
            </div>
            <Progress value={(summary.byConfidence.high / summary.testDataCount) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleBulkAction('delete')}
            disabled={selectedRecords.size === 0}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete Selected ({selectedRecords.size})
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleBulkAction('archive')}
            disabled={selectedRecords.size === 0}
          >
            <Archive className="h-4 w-4 mr-1" />
            Archive Selected
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <Filter className="h-4 w-4 mr-1" />
                Filter: {filterConfidence === 'all' ? 'All' : filterConfidence}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterConfidence('all')}>
                All Test Data
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterConfidence('high')}>
                High Confidence
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterConfidence('medium')}>
                Medium Confidence
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterConfidence('low')}>
                Low Confidence
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Test Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Identified Test Data</CardTitle>
          <CardDescription>
            Records flagged as potential test data based on patterns and rules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedRecords.size === filteredRecords.length && filteredRecords.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No test data detected
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRecords.has(record.id)}
                          onCheckedChange={() => handleSelectRecord(record.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{record.name || '-'}</TableCell>
                      <TableCell>{record.email || '-'}</TableCell>
                      <TableCell>{record.phone || '-'}</TableCell>
                      <TableCell>{getConfidenceBadge(record)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {record.testDataFlags?.map((flag) => (
                            <Badge key={flag} variant="outline" className="text-xs">
                              {getFlagIcon(flag)}
                              <span className="ml-1">{flag.replace(/_/g, ' ')}</span>
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedRecords(new Set([record.id]));
                              handleBulkAction('delete');
                            }}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedRecords(new Set([record.id]));
                              handleBulkAction('archive');
                            }}>
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === 'delete' ? 'Delete Records' : 'Archive Records'}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {confirmAction} {selectedRecords.size} selected record(s)?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button
              variant={confirmAction === 'delete' ? 'destructive' : 'default'}
              onClick={performBulkAction}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : `${confirmAction === 'delete' ? 'Delete' : 'Archive'} Records`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
