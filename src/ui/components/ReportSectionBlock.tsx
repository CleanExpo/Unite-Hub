'use client';

/**
 * Report Section Block
 * Phase 76: Render a single report section with blocks
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { ReportSection, ReportBlock } from '@/lib/reports/reportCompositionEngine';

interface ReportSectionBlockProps {
  section: ReportSection;
  sectionNumber?: number;
  className?: string;
}

export function ReportSectionBlock({
  section,
  sectionNumber,
  className = '',
}: ReportSectionBlockProps) {
  const statusConfig = {
    complete: { icon: CheckCircle2, color: 'text-green-500 bg-green-500/10', label: 'Complete' },
    partial: { icon: AlertCircle, color: 'text-yellow-500 bg-yellow-500/10', label: 'Partial Data' },
    limited: { icon: AlertCircle, color: 'text-orange-500 bg-orange-500/10', label: 'Limited Data' },
    omitted: { icon: Info, color: 'text-muted-foreground bg-muted', label: 'Omitted' },
  }[section.data_status];

  const StatusIcon = statusConfig.icon;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">
              {sectionNumber ? `${sectionNumber}. ` : ''}{section.title}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {section.description}
            </p>
          </div>
          <Badge variant="outline" className={statusConfig.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {section.blocks.map((block) => (
          <BlockRenderer key={block.block_id} block={block} />
        ))}
        {section.omission_reason && (
          <div className="text-xs text-muted-foreground italic">
            {section.omission_reason}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Render individual block types
 */
function BlockRenderer({ block }: { block: ReportBlock }) {
  switch (block.type) {
    case 'text': {
      const content = block.content as { text: string };
      return (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {content.text}
        </p>
      );
    }

    case 'metric': {
      const content = block.content as { label: string; value: number; suffix?: string };
      return (
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <div className="text-3xl font-bold">
            {content.value}{content.suffix || ''}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {content.label}
          </div>
        </div>
      );
    }

    case 'list': {
      const content = block.content as { items: string[]; ordered?: boolean; title?: string };
      const ListTag = content.ordered ? 'ol' : 'ul';
      return (
        <div>
          {content.title && (
            <p className="text-sm font-medium mb-2">{content.title}</p>
          )}
          <ListTag className={`text-sm space-y-1 ${content.ordered ? 'list-decimal' : 'list-disc'} ml-4`}>
            {content.items.map((item, i) => (
              <li key={i} className="text-muted-foreground">{item}</li>
            ))}
          </ListTag>
        </div>
      );
    }

    case 'table': {
      const content = block.content as { headers: string[]; rows: string[][] };
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                {content.headers.map((header, i) => (
                  <th key={i} className="text-left p-2 font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {content.rows.map((row, i) => (
                <tr key={i} className="border-b last:border-0">
                  {row.map((cell, j) => (
                    <td key={j} className="p-2 text-muted-foreground">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case 'callout': {
      const content = block.content as { variant?: string; title?: string; message: string };
      const variant = content.variant || 'info';
      const variantConfig = {
        info: 'bg-blue-500/10 border-blue-500/30 text-blue-600',
        warning: 'bg-orange-500/10 border-orange-500/30 text-orange-600',
        success: 'bg-green-500/10 border-green-500/30 text-green-600',
      }[variant] || 'bg-muted border-muted-foreground/30';

      return (
        <div className={`p-3 rounded-lg border ${variantConfig}`}>
          {content.title && (
            <p className="font-medium text-sm mb-1">{content.title}</p>
          )}
          <p className="text-sm">{content.message}</p>
        </div>
      );
    }

    default:
      return null;
  }
}

/**
 * Compact section preview
 */
export function SectionPreview({
  section,
  onClick,
}: {
  section: ReportSection;
  onClick?: () => void;
}) {
  const firstBlock = section.blocks[0];
  let preview = '';

  if (firstBlock?.type === 'text') {
    const content = firstBlock.content as { text: string };
    preview = content.text.length > 100
      ? content.text.substring(0, 97) + '...'
      : content.text;
  }

  return (
    <div
      className={`p-3 border rounded-lg ${onClick ? 'cursor-pointer hover:bg-muted/50' : ''}`}
      onClick={onClick}
    >
      <p className="text-sm font-medium">{section.title}</p>
      {preview && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {preview}
        </p>
      )}
    </div>
  );
}

export default ReportSectionBlock;
