'use client';

/**
 * Variation Performance Table
 * Phase 70: Display A/B test variations and their performance
 */

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle2, Trophy, Beaker } from 'lucide-react';
import { VisualABTest, VisualVariant } from '@/lib/visual/reactive/abVisualTestingService';

interface VariationPerformanceTableProps {
  tests: VisualABTest[];
  className?: string;
}

export function VariationPerformanceTable({
  tests,
  className = '',
}: VariationPerformanceTableProps) {
  if (tests.length === 0) {
    return (
      <div className={`text-center py-8 text-muted-foreground ${className}`}>
        No A/B tests running
      </div>
    );
  }

  return (
    <div className={className}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Test</TableHead>
            <TableHead>Variant</TableHead>
            <TableHead className="text-right">Impressions</TableHead>
            <TableHead className="text-right">Eng. Rate</TableHead>
            <TableHead className="text-right">CTR</TableHead>
            <TableHead className="text-center">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tests.flatMap((test) => {
            const allVariants = [test.control, ...test.variations];
            return allVariants.map((variant, idx) => (
              <TableRow key={`${test.test_id}_${variant.variant_id}`}>
                {idx === 0 && (
                  <TableCell
                    rowSpan={allVariants.length}
                    className="font-medium align-top"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-sm">{test.test_name}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] w-fit ${getStatusColor(test.status)}`}
                      >
                        {test.status}
                      </Badge>
                    </div>
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-2">
                    {variant.is_control && (
                      <span className="text-[10px] px-1 py-0.5 bg-muted rounded">
                        Control
                      </span>
                    )}
                    {test.winner === variant.variant_id && (
                      <Trophy className="h-3 w-3 text-yellow-500" />
                    )}
                    <span className="text-sm">{variant.variant_name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {variant.impressions.toLocaleString()}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {variant.engagement_rate !== null
                    ? `${(variant.engagement_rate * 100).toFixed(2)}%`
                    : '-'}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {variant.ctr !== null
                    ? `${(variant.ctr * 100).toFixed(2)}%`
                    : '-'}
                </TableCell>
                <TableCell className="text-center">
                  {test.winner === variant.variant_id ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                  ) : test.status === 'active' ? (
                    <Beaker className="h-4 w-4 text-blue-500 mx-auto animate-pulse" />
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            ));
          })}
        </TableBody>
      </Table>

      {/* Summary */}
      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
        <div className="grid grid-cols-4 gap-4 text-center text-xs">
          <div>
            <div className="font-bold">{tests.length}</div>
            <div className="text-muted-foreground">Total Tests</div>
          </div>
          <div>
            <div className="font-bold text-blue-500">
              {tests.filter(t => t.status === 'active').length}
            </div>
            <div className="text-muted-foreground">Active</div>
          </div>
          <div>
            <div className="font-bold text-green-500">
              {tests.filter(t => t.winner).length}
            </div>
            <div className="text-muted-foreground">Winners Found</div>
          </div>
          <div>
            <div className="font-bold">
              {calculateAvgLift(tests)}%
            </div>
            <div className="text-muted-foreground">Avg. Lift</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'border-blue-500 text-blue-500';
    case 'completed':
      return 'border-green-500 text-green-500';
    case 'paused':
      return 'border-yellow-500 text-yellow-500';
    default:
      return 'border-muted text-muted-foreground';
  }
}

function calculateAvgLift(tests: VisualABTest[]): string {
  const testsWithLift = tests.filter(t => t.lift !== null);
  if (testsWithLift.length === 0) {
return '0';
}

  const avgLift = testsWithLift.reduce((sum, t) => sum + (t.lift || 0), 0) / testsWithLift.length;
  return (avgLift * 100).toFixed(1);
}

export default VariationPerformanceTable;
