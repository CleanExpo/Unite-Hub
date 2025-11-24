'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Radar, Clock } from 'lucide-react';
import { OpportunityCard } from './OpportunityCard';
import type { OpportunityWindow } from '@/lib/predictive';

interface OpportunityRadarProps {
  windows: OpportunityWindow[];
  onViewDetails?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onAct?: (id: string) => void;
}

export function OpportunityRadar({
  windows,
  onViewDetails,
  onDismiss,
  onAct,
}: OpportunityRadarProps) {
  // Group by window type
  const by7Day = windows.filter(w => w.windowType === '7_day');
  const by14Day = windows.filter(w => w.windowType === '14_day');
  const by30Day = windows.filter(w => w.windowType === '30_day');

  // Get high confidence count
  const highConfidenceCount = windows.filter(w => w.confidence >= 0.7).length;

  if (windows.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Radar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Opportunities Detected</h3>
          <p className="text-muted-foreground">
            Check back later as new signals are collected and analyzed.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Radar className="h-5 w-5" />
            Opportunity Radar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{windows.length}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{highConfidenceCount}</div>
              <div className="text-xs text-muted-foreground">High Confidence</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{by7Day.length}</div>
              <div className="text-xs text-muted-foreground">7-Day Windows</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{by30Day.length}</div>
              <div className="text-xs text-muted-foreground">30-Day Windows</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Windows by timeframe */}
      <Tabs defaultValue="7_day" className="space-y-4">
        <TabsList>
          <TabsTrigger value="7_day" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            7 Days
            {by7Day.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {by7Day.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="14_day" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            14 Days
            {by14Day.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {by14Day.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="30_day" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            30 Days
            {by30Day.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {by30Day.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="7_day">
          {by7Day.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No 7-day opportunities detected
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {by7Day.map(opp => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  onViewDetails={onViewDetails}
                  onDismiss={onDismiss}
                  onAct={onAct}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="14_day">
          {by14Day.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No 14-day opportunities detected
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {by14Day.map(opp => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  onViewDetails={onViewDetails}
                  onDismiss={onDismiss}
                  onAct={onAct}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="30_day">
          {by30Day.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No 30-day opportunities detected
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {by30Day.map(opp => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  onViewDetails={onViewDetails}
                  onDismiss={onDismiss}
                  onAct={onAct}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
