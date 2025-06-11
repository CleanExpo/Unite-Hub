'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, Upload, FileText, FileSpreadsheet, 
  Check, X, AlertCircle, Info, RefreshCw,
  Users, Target, Clock, FileX
} from 'lucide-react';

interface ExportOptions {
  entities: string[];
  format: 'csv' | 'excel';
  includeMetadata: boolean;
  dateRange: {
    start: string | null;
    end: string | null;
  };
  filters: {
    status?: string[];
    priority?: string[];
  };
}

interface ImportResult {
  success: boolean;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  warnings: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

const ENTITY_OPTIONS = [
  { value: 'clients', label: 'Clients', icon: Users, description: 'Client contact information and details' },
  { value: 'deals', label: 'Deals', icon: Target, description: 'Sales deals and pipeline data' },
  { value: 'tasks', label: 'Tasks', icon: Clock, description: 'Task assignments and status' },
  { value: 'invoices', label: 'Invoices', icon: FileText, description: 'Invoice and billing information' },
];

const EXPORT_TEMPLATES = {
  clients: ['id', 'name', 'email', 'phone', 'company', 'address', 'status', 'created_at', 'updated_at'],
  deals: ['id', 'title', 'description', 'value', 'stage', 'status', 'client_id', 'assigned_to', 'expected_close_date', 'created_at', 'updated_at'],
  tasks: ['id', 'title', 'description', 'status', 'priority', 'assigned_to', 'client_id', 'deal_id', 'due_date', 'created_at', 'updated_at'],
  invoices: ['id', 'invoice_number', 'client_id', 'amount', 'tax_amount', 'total_amount', 'status', 'due_date', 'created_at', 'updated_at'],
};

export default function DataExportImport() {
  const [activeTab, setActiveTab] = useState('export');
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    entities: ['clients'],
    format: 'csv',
    includeMetadata: true,
    dateRange: { start: null, end: null },
    filters: {},
  });
  
  const [exportProgress, setExportProgress] = useState(0);
  const [importProgress, setImportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportProgress(0);
      setError(null);
      setSuccess(null);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/crm/export-import/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportOptions),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `crm-export-${exportOptions.entities.join('-')}-${timestamp}.${exportOptions.format === 'excel' ? 'xlsx' : 'csv'}`;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportProgress(100);
      setSuccess(`Successfully exported ${exportOptions.entities.join(', ')} data`);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportProgress(0), 2000);
    }
  };

  const handleImport = async (file: File) => {
    try {
      setIsImporting(true);
      setImportProgress(0);
      setError(null);
      setSuccess(null);
      setImportResult(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', exportOptions.entities[0]); // Use first selected entity

      // Simulate progress
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 300);

      const response = await fetch('/api/crm/export-import/import', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error('Import failed');
      }

      const result: ImportResult = await response.json();
      setImportResult(result);
      setImportProgress(100);

      if (result.success) {
        setSuccess(`Successfully imported ${result.successfulRows} of ${result.totalRows} records`);
      } else {
        setError(`Import completed with errors: ${result.failedRows} failed records`);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsImporting(false);
      setTimeout(() => setImportProgress(0), 2000);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validExtensions = ['.csv', '.xlsx', '.xls'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!validExtensions.includes(fileExtension)) {
        setError('Please select a valid CSV or Excel file');
        return;
      }

      handleImport(file);
    }
  };

  const downloadTemplate = async (entityType: string) => {
    try {
      const response = await fetch(`/api/crm/export-import/template?entityType=${entityType}`);
      
      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${entityType}-import-template.csv`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      setError('Failed to download template');
    }
  };

  const updateExportOptions = (key: keyof ExportOptions, value: any) => {
    setExportOptions(prev => ({ ...prev, [key]: value }));
  };

  const toggleEntity = (entity: string) => {
    const current = exportOptions.entities;
    const updated = current.includes(entity)
      ? current.filter(e => e !== entity)
      : [...current, entity];
    updateExportOptions('entities', updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Data Export & Import</h1>
          <p className="text-muted-foreground">
            Export your CRM data or import bulk data from files
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <Check className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="export" className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export Data</span>
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center space-x-2">
            <Upload className="h-4 w-4" />
            <span>Import Data</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Export Configuration */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Export Configuration</CardTitle>
                  <CardDescription>
                    Configure what data to export and in which format
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Entity Selection */}
                  <div>
                    <Label className="text-base font-medium">Select Data to Export</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                      {ENTITY_OPTIONS.map((entity) => {
                        const Icon = entity.icon;
                        return (
                          <div
                            key={entity.value}
                            className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                              exportOptions.entities.includes(entity.value)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => toggleEntity(entity.value)}
                          >
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                checked={exportOptions.entities.includes(entity.value)}
                                onCheckedChange={() => toggleEntity(entity.value)}
                              />
                              <Icon className="h-5 w-5 text-gray-600" />
                              <div className="flex-1">
                                <div className="font-medium">{entity.label}</div>
                                <div className="text-xs text-gray-500">{entity.description}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <Separator />

                  {/* Format Selection */}
                  <div>
                    <Label className="text-base font-medium">Export Format</Label>
                    <Select
                      value={exportOptions.format}
                      onValueChange={(value: 'csv' | 'excel') => updateExportOptions('format', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4" />
                            <span>CSV (Comma Separated Values)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="excel">
                          <div className="flex items-center space-x-2">
                            <FileSpreadsheet className="h-4 w-4" />
                            <span>Excel (.xlsx)</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Additional Options */}
                  <div>
                    <Label className="text-base font-medium">Additional Options</Label>
                    <div className="space-y-3 mt-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeMetadata"
                          checked={exportOptions.includeMetadata}
                          onCheckedChange={(checked) => updateExportOptions('includeMetadata', checked)}
                        />
                        <Label htmlFor="includeMetadata" className="text-sm">
                          Include metadata (created_at, updated_at, etc.)
                        </Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Export Summary */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Export Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm text-gray-600">Selected Entities</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {exportOptions.entities.map((entity) => (
                        <Badge key={entity} variant="secondary">
                          {entity}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600">Format</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      {exportOptions.format === 'csv' ? (
                        <FileText className="h-4 w-4" />
                      ) : (
                        <FileSpreadsheet className="h-4 w-4" />
                      )}
                      <span className="text-sm font-medium uppercase">
                        {exportOptions.format}
                      </span>
                    </div>
                  </div>

                  {isExporting && (
                    <div>
                      <Label className="text-sm text-gray-600">Progress</Label>
                      <Progress value={exportProgress} className="mt-2" />
                      <div className="text-xs text-gray-500 mt-1">
                        {exportProgress}% complete
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleExport}
                    disabled={isExporting || exportOptions.entities.length === 0}
                    className="w-full"
                  >
                    {isExporting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Export Data
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Import Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Import Data</CardTitle>
                <CardDescription>
                  Upload CSV or Excel files to import bulk data into your CRM
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    For best results, download our template files and follow the column format exactly.
                  </AlertDescription>
                </Alert>

                {/* Template Downloads */}
                <div>
                  <Label className="text-base font-medium">Download Templates</Label>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {ENTITY_OPTIONS.map((entity) => {
                      const Icon = entity.icon;
                      return (
                        <Button
                          key={entity.value}
                          variant="outline"
                          size="sm"
                          onClick={() => downloadTemplate(entity.value)}
                          className="flex items-center space-x-2"
                        >
                          <Icon className="h-4 w-4" />
                          <span>{entity.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* File Upload */}
                <div>
                  <Label className="text-base font-medium">Upload File</Label>
                  <div className="mt-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isImporting}
                      variant="outline"
                      className="w-full h-24 border-dashed"
                    >
                      {isImporting ? (
                        <div className="text-center">
                          <RefreshCw className="h-6 w-6 mx-auto mb-2 animate-spin" />
                          <div>Importing...</div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="h-6 w-6 mx-auto mb-2" />
                          <div>Click to select CSV or Excel file</div>
                          <div className="text-xs text-gray-500">Supports .csv, .xlsx, .xls files</div>
                        </div>
                      )}
                    </Button>
                  </div>

                  {isImporting && (
                    <div className="mt-4">
                      <Progress value={importProgress} />
                      <div className="text-xs text-gray-500 mt-1">
                        {importProgress}% complete
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Import Results */}
            {importResult && (
              <Card>
                <CardHeader>
                  <CardTitle>Import Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {importResult.successfulRows}
                      </div>
                      <div className="text-xs text-gray-500">Successful</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">
                        {importResult.failedRows}
                      </div>
                      <div className="text-xs text-gray-500">Failed</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-600">
                        {importResult.totalRows}
                      </div>
                      <div className="text-xs text-gray-500">Total</div>
                    </div>
                  </div>

                  {importResult.errors.length > 0 && (
                    <div>
                      <Label className="text-red-600 font-medium">Errors</Label>
                      <div className="max-h-32 overflow-y-auto mt-2 space-y-1">
                        {importResult.errors.slice(0, 5).map((error, index) => (
                          <div key={index} className="text-xs p-2 bg-red-50 rounded border">
                            Row {error.row}: {error.field} - {error.message}
                          </div>
                        ))}
                        {importResult.errors.length > 5 && (
                          <div className="text-xs text-gray-500">
                            +{importResult.errors.length - 5} more errors
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {importResult.warnings.length > 0 && (
                    <div>
                      <Label className="text-yellow-600 font-medium">Warnings</Label>
                      <div className="max-h-32 overflow-y-auto mt-2 space-y-1">
                        {importResult.warnings.slice(0, 3).map((warning, index) => (
                          <div key={index} className="text-xs p-2 bg-yellow-50 rounded border">
                            Row {warning.row}: {warning.field} - {warning.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Field Mapping Guide */}
            <Card>
              <CardHeader>
                <CardTitle>Field Requirements</CardTitle>
                <CardDescription>
                  Required and optional fields for each entity type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ENTITY_OPTIONS.map((entity) => (
                    <div key={entity.value}>
                      <div className="flex items-center space-x-2 mb-2">
                        <entity.icon className="h-4 w-4" />
                        <Label className="font-medium">{entity.label}</Label>
                      </div>
                      <div className="text-xs text-gray-600 ml-6">
                        Required: {EXPORT_TEMPLATES[entity.value as keyof typeof EXPORT_TEMPLATES].slice(0, 3).join(', ')}
                        <br />
                        Optional: {EXPORT_TEMPLATES[entity.value as keyof typeof EXPORT_TEMPLATES].slice(3).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
