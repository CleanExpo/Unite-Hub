/**
 * Predictive Alerts Component
 *
 * AI-powered predictive alerting using Extended Thinking:
 * - Predict next alert type based on patterns
 * - Anomaly risk scoring
 * - Performance degradation predictions
 * - Escalation risk assessment
 * - Recommended preventive actions
 */

'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  Brain,
  Zap,
  TrendingUp,
  Target,
  CheckCircle,
  Clock,
  Lightbulb,
  RefreshCw,
} from 'lucide-react';
import { logger } from '@/lib/logging';

interface Prediction {
  id: string;
  type: 'next_alert' | 'anomaly_risk' | 'performance_issue' | 'escalation_risk';
  title: string;
  description: string;
  probability: number;
  confidence: 'high' | 'medium' | 'low';
  timeframe: string;
  predictedAlertType?: string;
  riskScore: number;
  preventiveActions: string[];
  thinkingTokens: number;
  estimatedCost: number;
  timestamp: string;
}

// Mock predictions
const MOCK_PREDICTIONS: Prediction[] = [
  {
    id: 'pred_001',
    type: 'next_alert',
    title: 'Threshold Alert Likely in Next 4 Hours',
    description: 'Based on recent patterns, effectiveness score is trending downward and may trigger a threshold alert within 4 hours.',
    probability: 89,
    confidence: 'high',
    timeframe: '4 hours',
    predictedAlertType: 'threshold',
    riskScore: 85,
    preventiveActions: [
      'Monitor effectiveness score closely',
      'Pre-allocate resources for potential response',
      'Review recent changes that may affect metrics',
    ],
    thinkingTokens: 4200,
    estimatedCost: 0.18,
    timestamp: new Date().toISOString(),
  },
  {
    id: 'pred_002',
    type: 'anomaly_risk',
    title: 'High Anomaly Detection Risk',
    description: 'Usage pattern deviation detected. Current metrics show 15% variance from baseline, creating conditions for anomaly alerts.',
    probability: 76,
    confidence: 'high',
    timeframe: '24 hours',
    riskScore: 72,
    preventiveActions: [
      'Investigate cause of usage pattern change',
      'Verify all systems are operating normally',
      'Consider adjusting anomaly detection thresholds',
      'Review customer activity patterns',
    ],
    thinkingTokens: 3800,
    estimatedCost: 0.16,
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'pred_003',
    type: 'performance_issue',
    title: 'Performance Degradation Forecast',
    description: 'Historical patterns suggest performance metrics may decline next week. Monday mornings typically see 20% increase in alert volume.',
    probability: 82,
    confidence: 'medium',
    timeframe: '7 days',
    riskScore: 68,
    preventiveActions: [
      'Schedule maintenance during off-peak hours',
      'Increase monitoring intensity on Monday',
      'Prepare incident response team',
      'Scale infrastructure proactively',
      'Run performance tests on Friday',
    ],
    thinkingTokens: 5100,
    estimatedCost: 0.21,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'pred_004',
    type: 'escalation_risk',
    title: 'Low Escalation Risk This Week',
    description: 'Based on 30-day analysis, escalation likelihood is low. System health and response times are stable.',
    probability: 12,
    confidence: 'high',
    timeframe: '7 days',
    riskScore: 15,
    preventiveActions: [
      'Continue current monitoring strategy',
      'Maintain alert configuration as-is',
      'Schedule routine health check',
    ],
    thinkingTokens: 2600,
    estimatedCost: 0.11,
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
];

function getConfidenceColor(confidence: 'high' | 'medium' | 'low'): string {
  switch (confidence) {
    case 'high':
      return 'bg-green-100 text-green-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-gray-100 text-gray-800';
  }
}

function getRiskColor(score: number): string {
  if (score >= 70) return 'text-red-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-green-600';
}

function getRiskBgColor(score: number): string {
  if (score >= 70) return 'bg-red-50';
  if (score >= 40) return 'bg-orange-50';
  return 'bg-green-50';
}

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

interface PredictionCardProps {
  prediction: Prediction;
  onViewDetails: (prediction: Prediction) => void;
}

function PredictionCard({ prediction, onViewDetails }: PredictionCardProps) {
  return (
    <Card className={`${getRiskBgColor(prediction.riskScore)}`}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-blue-600" />
                <Badge className={getConfidenceColor(prediction.confidence)}>
                  {prediction.confidence.charAt(0).toUpperCase() + prediction.confidence.slice(1)} Confidence
                </Badge>
              </div>
              <h3 className="font-semibold text-lg">{prediction.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{prediction.description}</p>
            </div>
            <div className={`text-right ml-4 ${getRiskColor(prediction.riskScore)}`}>
              <p className="text-xs font-medium text-gray-600">Risk Score</p>
              <p className="text-2xl font-bold">{prediction.riskScore}</p>
            </div>
          </div>

          <Separator />

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-600">Probability</p>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={prediction.probability} className="flex-1" />
                <span className="text-sm font-semibold">{prediction.probability}%</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-600">Timeframe</p>
              <p className="text-sm font-semibold mt-1">{prediction.timeframe}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Predicted At</p>
              <p className="text-sm font-semibold mt-1">{formatRelativeTime(prediction.timestamp)}</p>
            </div>
          </div>

          {/* Preventive Actions */}
          <div>
            <p className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
              <Lightbulb className="h-3 w-3" />
              Recommended Actions
            </p>
            <ul className="space-y-1">
              {prediction.preventiveActions.slice(0, 2).map((action, idx) => (
                <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                  <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0 text-green-600" />
                  <span>{action}</span>
                </li>
              ))}
              {prediction.preventiveActions.length > 2 && (
                <li className="text-xs text-blue-600 font-medium">
                  +{prediction.preventiveActions.length - 2} more actions
                </li>
              )}
            </ul>
          </div>

          {/* Footer with Cost and Details */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-gray-600">
              <span>AI Analysis Cost: </span>
              <span className="font-semibold text-gray-900">${prediction.estimatedCost.toFixed(2)}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewDetails(prediction)}
            >
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PredictiveAlerts({
  frameworkId,
  workspaceId,
}: {
  frameworkId: string;
  workspaceId: string;
}) {
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const highRiskPredictions = MOCK_PREDICTIONS.filter((p) => p.riskScore >= 70);
  const mediumRiskPredictions = MOCK_PREDICTIONS.filter((p) => p.riskScore >= 40 && p.riskScore < 70);
  const lowRiskPredictions = MOCK_PREDICTIONS.filter((p) => p.riskScore < 40);

  const totalThinkingTokens = MOCK_PREDICTIONS.reduce((sum, p) => sum + p.thinkingTokens, 0);
  const totalCost = MOCK_PREDICTIONS.reduce((sum, p) => sum + p.estimatedCost, 0);

  const handleGeneratePredictions = async () => {
    setIsGenerating(true);
    logger.info('[PREDICTIVE ALERTS] Generating new predictions using Extended Thinking...');

    // Simulate Extended Thinking API call
    // In production, this would call /api/convex/framework-alert-insights with Extended Thinking
    setTimeout(() => {
      setIsGenerating(false);
      logger.info('[PREDICTIVE ALERTS] Predictions generated successfully');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-blue-600" />
            Predictive Alerts
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            AI-powered predictions using Extended Thinking ({totalThinkingTokens.toLocaleString()} tokens)
          </p>
        </div>
        <Button
          onClick={handleGeneratePredictions}
          disabled={isGenerating}
          className="gap-2"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Generate Predictions
            </>
          )}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-6 w-6 text-red-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">High Risk</p>
              <p className="text-2xl font-bold text-red-600">{highRiskPredictions.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="h-6 w-6 text-orange-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Medium Risk</p>
              <p className="text-2xl font-bold text-orange-600">{mediumRiskPredictions.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Low Risk</p>
              <p className="text-2xl font-bold text-green-600">{lowRiskPredictions.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <Brain className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">AI Cost</p>
              <p className="text-2xl font-bold text-blue-600">${totalCost.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* High Risk Predictions */}
      {highRiskPredictions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            High Risk Predictions ({highRiskPredictions.length})
          </h3>
          <div className="space-y-4">
            {highRiskPredictions.map((pred) => (
              <PredictionCard
                key={pred.id}
                prediction={pred}
                onViewDetails={setSelectedPrediction}
              />
            ))}
          </div>
        </div>
      )}

      {/* Medium Risk Predictions */}
      {mediumRiskPredictions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-orange-700">
            <TrendingUp className="h-5 w-5" />
            Medium Risk Predictions ({mediumRiskPredictions.length})
          </h3>
          <div className="space-y-4">
            {mediumRiskPredictions.map((pred) => (
              <PredictionCard
                key={pred.id}
                prediction={pred}
                onViewDetails={setSelectedPrediction}
              />
            ))}
          </div>
        </div>
      )}

      {/* Low Risk Predictions */}
      {lowRiskPredictions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            Low Risk Predictions ({lowRiskPredictions.length})
          </h3>
          <div className="space-y-4">
            {lowRiskPredictions.map((pred) => (
              <PredictionCard
                key={pred.id}
                prediction={pred}
                onViewDetails={setSelectedPrediction}
              />
            ))}
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedPrediction && (
        <Dialog open={!!selectedPrediction} onOpenChange={() => setSelectedPrediction(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedPrediction.title}</DialogTitle>
              <DialogDescription>
                Predicted {formatRelativeTime(selectedPrediction.timestamp)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className={`p-3 rounded-lg ${getConfidenceColor(selectedPrediction.confidence)}`}>
                  <p className="text-xs font-medium">Confidence</p>
                  <p className="text-lg font-bold mt-1">
                    {selectedPrediction.confidence.charAt(0).toUpperCase() + selectedPrediction.confidence.slice(1)}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${getRiskBgColor(selectedPrediction.riskScore)}`}>
                  <p className="text-xs font-medium">Risk Score</p>
                  <p className={`text-lg font-bold mt-1 ${getRiskColor(selectedPrediction.riskScore)}`}>
                    {selectedPrediction.riskScore}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50">
                  <p className="text-xs font-medium text-blue-700">Probability</p>
                  <p className="text-lg font-bold text-blue-700 mt-1">{selectedPrediction.probability}%</p>
                </div>
              </div>

              <Separator />

              {/* Description */}
              <div>
                <p className="text-sm font-medium text-gray-700">Analysis</p>
                <p className="text-sm text-gray-600 mt-2">{selectedPrediction.description}</p>
              </div>

              {/* Timeframe */}
              <div>
                <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Expected Timeframe
                </p>
                <p className="text-sm text-gray-600 mt-1">{selectedPrediction.timeframe}</p>
              </div>

              {/* Preventive Actions */}
              <div>
                <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Lightbulb className="h-4 w-4" />
                  Recommended Preventive Actions
                </p>
                <ul className="space-y-2 mt-2">
                  {selectedPrediction.preventiveActions.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              {/* AI Processing Details */}
              <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Extended Thinking Tokens Used</span>
                  <span className="font-semibold">{selectedPrediction.thinkingTokens.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Model</span>
                  <span className="font-semibold">claude-opus-4-1-20250805</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Estimated Cost</span>
                  <span className="font-semibold">${selectedPrediction.estimatedCost.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1">Acknowledge & Prepare</Button>
              <Button variant="outline" onClick={() => setSelectedPrediction(null)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
