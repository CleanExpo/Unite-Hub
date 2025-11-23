'use client';

/**
 * Pressure Opportunity Matrix
 * Phase 71: 2x2 matrix showing pressure vs opportunity
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Shield,
  AlertTriangle,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { GridZone } from '@/lib/operations/creativeOpsGridEngine';

interface PressureOpportunityMatrixProps {
  pressureScore: number;
  opportunityScore: number;
  currentZone: GridZone;
  className?: string;
}

export function PressureOpportunityMatrix({
  pressureScore,
  opportunityScore,
  currentZone,
  className = '',
}: PressureOpportunityMatrixProps) {
  // Calculate position in matrix (0-100 to percentage)
  const dotX = opportunityScore;
  const dotY = 100 - pressureScore; // Invert Y axis

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Pressure / Opportunity Matrix</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-square bg-muted/30 rounded-lg overflow-hidden">
          {/* Quadrants */}
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
            {/* Top-left: Stability (low pressure, low opportunity) */}
            <div className={`p-2 border-r border-b flex flex-col items-center justify-center ${currentZone === 'stability' ? 'bg-blue-500/20' : ''}`}>
              <Shield className="h-5 w-5 text-blue-500 mb-1" />
              <span className="text-[10px] font-medium text-blue-500">Stability</span>
              <span className="text-[8px] text-muted-foreground">Maintain</span>
            </div>

            {/* Top-right: Opportunity (low pressure, high opportunity) */}
            <div className={`p-2 border-b flex flex-col items-center justify-center ${currentZone === 'opportunity' ? 'bg-green-500/20' : ''}`}>
              <TrendingUp className="h-5 w-5 text-green-500 mb-1" />
              <span className="text-[10px] font-medium text-green-500">Opportunity</span>
              <span className="text-[8px] text-muted-foreground">Grow</span>
            </div>

            {/* Bottom-left: Pressure (high pressure, low opportunity) */}
            <div className={`p-2 border-r flex flex-col items-center justify-center ${currentZone === 'pressure' ? 'bg-red-500/20' : ''}`}>
              <AlertTriangle className="h-5 w-5 text-red-500 mb-1" />
              <span className="text-[10px] font-medium text-red-500">Pressure</span>
              <span className="text-[8px] text-muted-foreground">Fix</span>
            </div>

            {/* Bottom-right: Expansion (high pressure, high opportunity) */}
            <div className={`p-2 flex flex-col items-center justify-center ${currentZone === 'expansion' ? 'bg-purple-500/20' : ''}`}>
              <Zap className="h-5 w-5 text-purple-500 mb-1" />
              <span className="text-[10px] font-medium text-purple-500">Expansion</span>
              <span className="text-[8px] text-muted-foreground">Balance</span>
            </div>
          </div>

          {/* Position indicator */}
          <div
            className="absolute w-4 h-4 rounded-full bg-primary border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
            style={{
              left: `${dotX}%`,
              top: `${dotY}%`,
            }}
          />

          {/* Axis labels */}
          <div className="absolute bottom-0 left-0 right-0 text-center text-[9px] text-muted-foreground pb-1">
            Opportunity →
          </div>
          <div
            className="absolute left-0 top-0 bottom-0 text-[9px] text-muted-foreground pl-1"
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              transform: 'rotate(180deg)',
            }}
          >
            ← Pressure
          </div>
        </div>

        {/* Current state */}
        <div className="mt-3 text-center">
          <div className="text-xs text-muted-foreground">
            Pressure: <span className="font-medium">{pressureScore.toFixed(0)}%</span>
            {' · '}
            Opportunity: <span className="font-medium">{opportunityScore.toFixed(0)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default PressureOpportunityMatrix;
