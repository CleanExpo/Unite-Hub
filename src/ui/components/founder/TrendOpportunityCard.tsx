'use client';

/**
 * Trend Opportunity Card
 *
 * Detailed view of a single trend opportunity with full recommended actions,
 * signals breakdown, and approval workflow for founder decision-making.
 *
 * @module ui/components/founder/TrendOpportunityCard
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Target,
  TrendingUp,
  Clock,
  Zap,
  CheckCircle,
  XCircle,
  FileEdit,
  Calendar,
  Signal,
} from 'lucide-react';
import type { TrendOpportunity, TopicSignal } from '@/lib/intel/topicDiscoveryEngine';

interface TrendOpportunityCardProps {
  opportunity: TrendOpportunity;
  onApprove?: (opportunityId: string, notes?: string) => Promise<void>;
  onReject?: (opportunityId: string, notes?: string) => Promise<void>;
  showActions?: boolean;
}

export default function TrendOpportunityCard({
  opportunity,
  onApprove,
  onReject,
  showActions = true,
}: TrendOpportunityCardProps) {
  const [notes, setNotes] = useState(opportunity.founder_notes || '');
  const [submitting, setSubmitting] = useState(false);

  const handleApprove = async () => {
    if (!onApprove) {
return;
}
    setSubmitting(true);
    try {
      await onApprove(opportunity.id, notes);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!onReject) {
return;
}
    setSubmitting(true);
    try {
      await onReject(opportunity.id, notes);
    } finally {
      setSubmitting(false);
    }
  };

  const priorityConfig = {
    critical: {
      variant: 'destructive' as const,
      icon: '🚨',
      label: 'CRITICAL',
    },
    high: {
      variant: 'default' as const,
      icon: '🔥',
      label: 'HIGH',
    },
    medium: {
      variant: 'secondary' as const,
      icon: '⚡',
      label: 'MEDIUM',
    },
    low: {
      variant: 'outline' as const,
      icon: '📌',
      label: 'LOW',
    },
  };

  const urgencyConfig = {
    immediate: { icon: '🚨', label: 'Act Now', color: 'text-red-500' },
    this_week: { icon: '⚡', label: 'This Week', color: 'text-orange-500' },
    this_month: { icon: '📅', label: 'This Month', color: 'text-yellow-500' },
    this_quarter: { icon: '📆', label: 'This Quarter', color: 'text-blue-500' },
  };

  const impactConfig = {
    high: { label: 'High Impact', color: 'text-green-600' },
    medium: { label: 'Medium Impact', color: 'text-yellow-600' },
    low: { label: 'Low Impact', color: 'text-gray-600' },
  };

  const config = priorityConfig[opportunity.priority];
  const urgency = urgencyConfig[opportunity.time_window.urgency];
  const impact = impactConfig[opportunity.estimated_impact];

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5" />
              <CardTitle>{opportunity.topic}</CardTitle>
            </div>
            <CardDescription className="flex items-center gap-2">
              <Badge variant={config.variant}>
                {config.icon} {config.label}
              </Badge>
              <span className={urgency.color}>
                {urgency.icon} {urgency.label}
              </span>
              <span className={impact.color}>• {impact.label}</span>
            </CardDescription>
          </div>
          {opportunity.approved !== undefined && (
            <Badge variant={opportunity.approved ? 'default' : 'destructive'}>
              {opportunity.approved ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Approved
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  Rejected
                </>
              )}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Opportunity Details */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Signal className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-sm mb-1">Opportunity Type</h4>
              <p className="text-sm text-muted-foreground capitalize">
                {opportunity.opportunity_type.replace(/_/g, ' ')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">Confidence</p>
              <p className="text-2xl font-bold">{opportunity.confidence_score}%</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-sm mb-1">Time Window</h4>
              <p className="text-sm text-muted-foreground">
                Start: {new Date(opportunity.time_window.optimal_start).toLocaleDateString()}
                {opportunity.time_window.optimal_end && (
                  <> • End: {new Date(opportunity.time_window.optimal_end).toLocaleDateString()}</>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Supporting Signals */}
        <div>
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Supporting Signals ({opportunity.signals.length})
          </h4>
          <div className="space-y-2">
            {opportunity.signals.map((signal) => (
              <SignalRow key={signal.id} signal={signal} />
            ))}
          </div>
        </div>

        {/* Recommended Actions */}
        <div>
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Recommended Actions
          </h4>
          <div className="space-y-3">
            {opportunity.recommended_actions.map((action, idx) => (
              <div key={idx} className="border rounded-lg p-3 bg-accent/50">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <Badge variant="outline" className="mb-2">
                      {action.action_type.replace(/_/g, ' ')}
                    </Badge>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {action.estimated_effort} effort
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Founder Notes */}
        {showActions && (
          <div>
            <label htmlFor="notes" className="font-medium text-sm mb-2 flex items-center gap-2">
              <FileEdit className="h-4 w-4" />
              Founder Notes
            </label>
            <Textarea
              id="notes"
              placeholder="Add your thoughts, decisions, or next steps..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        )}

        {/* Metadata */}
        <div className="text-xs text-muted-foreground border-t pt-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Created: {new Date(opportunity.created_at).toLocaleString()}
            </span>
            <span>ID: {opportunity.id}</span>
          </div>
        </div>
      </CardContent>

      {showActions && opportunity.approved === undefined && (
        <CardFooter className="flex gap-3 justify-end">
          <Button variant="outline" onClick={handleReject} disabled={submitting}>
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button onClick={handleApprove} disabled={submitting}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve & Execute
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

// Signal Row Component
function SignalRow({ signal }: { signal: TopicSignal }) {
  const sourceColors = {
    gsc: 'bg-blue-500/10 text-blue-700',
    bing: 'bg-orange-500/10 text-orange-700',
    dataforseo: 'bg-purple-500/10 text-purple-700',
    lia: 'bg-cyan-500/10 text-cyan-700',
    industry_events: 'bg-pink-500/10 text-pink-700',
  };

  const signalTypeIcons = {
    emerging: '🌱',
    trending: '📈',
    declining: '📉',
    opportunity: '🎯',
  };

  return (
    <div className="flex items-center gap-3 text-sm border rounded-lg p-2">
      <span className="text-lg">{signalTypeIcons[signal.signal_type]}</span>
      <div className="flex-1">
        <p className="font-medium">{signal.topic}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className={`text-xs ${sourceColors[signal.source]}`}>
            {signal.source.toUpperCase()}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Strength: {signal.strength}/100
          </span>
          <span className="text-xs text-muted-foreground">
            Velocity: {signal.velocity > 0 ? '+' : ''}{signal.velocity}%
          </span>
        </div>
      </div>
    </div>
  );
}
