'use client';

/**
 * Report Export Bar
 * Phase 77: Export controls for reports
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Download,
  FileText,
  Presentation,
  Code,
  FileCode2,
  Loader2,
  Info,
} from 'lucide-react';

export type ExportFormat = 'pdf' | 'slides' | 'markdown' | 'html' | 'json';

interface ReportExportBarProps {
  reportType: string;
  clientId: string;
  workspaceId: string;
  clientName?: string;
  onExport?: (format: ExportFormat) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

const FORMAT_OPTIONS: Array<{
  value: ExportFormat;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    value: 'pdf',
    label: 'PDF',
    description: 'For sending to clients',
    icon: FileText,
  },
  {
    value: 'slides',
    label: 'Slides',
    description: 'For presentations',
    icon: Presentation,
  },
  {
    value: 'markdown',
    label: 'Markdown',
    description: 'For documentation',
    icon: FileCode2,
  },
  {
    value: 'html',
    label: 'HTML',
    description: 'For web viewing',
    icon: Code,
  },
  {
    value: 'json',
    label: 'JSON',
    description: 'For integrations',
    icon: Code,
  },
];

export function ReportExportBar({
  reportType,
  clientId,
  workspaceId,
  clientName,
  onExport,
  disabled = false,
  className = '',
}: ReportExportBarProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState<{
    format: ExportFormat;
    timestamp: Date;
  } | null>(null);

  const handleExport = async () => {
    if (disabled || isExporting) return;

    setIsExporting(true);
    try {
      if (onExport) {
        await onExport(selectedFormat);
      } else {
        // Default export behavior - call API
        const response = await fetch('/api/reports/export', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: clientId,
            workspace_id: workspaceId,
            report_type: reportType,
            client_name: clientName,
            format: selectedFormat,
          }),
        });

        if (!response.ok) {
          throw new Error('Export failed');
        }

        const data = await response.json();

        // Handle download based on format
        if (selectedFormat === 'pdf' || selectedFormat === 'html') {
          // Download as file
          const blob = new Blob([data.content], {
            type: data.content_type || 'text/html',
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = data.filename || `report.${selectedFormat}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } else if (selectedFormat === 'markdown') {
          // Copy to clipboard
          await navigator.clipboard.writeText(data.content);
        } else {
          // JSON or slides - download as JSON
          const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json',
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = data.filename || `report.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }

      setLastExport({
        format: selectedFormat,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const selectedOption = FORMAT_OPTIONS.find(f => f.value === selectedFormat);

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex items-center gap-3">
        <Select
          value={selectedFormat}
          onValueChange={(v) => setSelectedFormat(v as ExportFormat)}
          disabled={disabled || isExporting}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FORMAT_OPTIONS.map((format) => (
              <SelectItem key={format.value} value={format.value}>
                <div className="flex items-center gap-2">
                  <format.icon className="h-4 w-4" />
                  <div>
                    <span className="font-medium">{format.label}</span>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({format.description})
                    </span>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={handleExport}
          disabled={disabled || isExporting}
          className="flex items-center gap-2"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Export {selectedOption?.label}
            </>
          )}
        </Button>
      </div>

      {lastExport && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="h-3 w-3" />
          Last exported: {lastExport.format.toUpperCase()} at{' '}
          {lastExport.timestamp.toLocaleTimeString()}
        </p>
      )}

      {selectedFormat === 'pdf' && (
        <p className="text-xs text-muted-foreground">
          PDF exports include all sections with print-optimized formatting.
        </p>
      )}

      {selectedFormat === 'slides' && (
        <p className="text-xs text-muted-foreground">
          Slide exports return JSON frames for presentation tools.
        </p>
      )}
    </div>
  );
}

/**
 * Compact export buttons for inline use
 */
export function ReportExportButtons({
  reportType,
  clientId,
  workspaceId,
  clientName,
  onExport,
  disabled = false,
}: Omit<ReportExportBarProps, 'className'>) {
  const [isExporting, setIsExporting] = useState<ExportFormat | null>(null);

  const handleExport = async (format: ExportFormat) => {
    if (disabled || isExporting) return;

    setIsExporting(format);
    try {
      if (onExport) {
        await onExport(format);
      } else {
        const response = await fetch('/api/reports/export', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: clientId,
            workspace_id: workspaceId,
            report_type: reportType,
            client_name: clientName,
            format,
          }),
        });

        if (!response.ok) {
          throw new Error('Export failed');
        }

        const data = await response.json();

        // Handle download
        if (format === 'markdown') {
          await navigator.clipboard.writeText(data.content);
        } else {
          const blob = new Blob(
            [typeof data.content === 'string' ? data.content : JSON.stringify(data, null, 2)],
            { type: data.content_type || 'application/octet-stream' }
          );
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = data.filename || `report.${format}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('pdf')}
        disabled={disabled || isExporting !== null}
      >
        {isExporting === 'pdf' ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <FileText className="h-4 w-4 mr-2" />
        )}
        PDF
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('slides')}
        disabled={disabled || isExporting !== null}
      >
        {isExporting === 'slides' ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Presentation className="h-4 w-4 mr-2" />
        )}
        Slides
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('markdown')}
        disabled={disabled || isExporting !== null}
      >
        {isExporting === 'markdown' ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <FileCode2 className="h-4 w-4 mr-2" />
        )}
        Copy MD
      </Button>
    </div>
  );
}

export default ReportExportBar;
