'use client';

/**
 * AGI Console Dashboard
 *
 * Founder command center for managing multi-model AGI governance.
 * Provides oversight, control, and audit capabilities.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Zap,
  Brain,
  Shield,
  TrendingUp,
  Radio,
  BarChart3,
  CheckCircle2,
  Clock,
  Settings,
} from 'lucide-react';

interface ModelMetrics {
  model: string;
  capability: string;
  selectionRate: number; // percentage
  avgLatency: number; // ms
  avgCost: number; // $ per request
  qualityScore: number; // 0-100
  successRate: number; // %
  trend: 'improving' | 'stable' | 'declining';
}

interface GovernanceStatus {
  activePolicy: string;
  totalDecisions: number;
  approvedDecisions: number;
  rejectedDecisions: number;
  escalatedDecisions: number;
  violationsDetected: number;
  criticalRisks: number;
}

interface RiskMetrics {
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  overallScore: number; // 0-100
  boundaryViolations: number;
  founderOverridesRequired: number;
  trend: 'stable' | 'improving' | 'worsening';
}

export default function AGIConsolePage() {
  const [models, setModels] = useState<ModelMetrics[]>([]);
  const [governance, setGovernance] = useState<GovernanceStatus | null>(null);
  const [risk, setRisk] = useState<RiskMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setModels([
        {
          model: 'claude-opus-4-1',
          capability: 'extended-thinking',
          selectionRate: 15,
          avgLatency: 2000,
          avgCost: 0.015,
          qualityScore: 95,
          successRate: 98,
          trend: 'stable',
        },
        {
          model: 'claude-sonnet-4-5',
          capability: 'general-purpose',
          selectionRate: 55,
          avgLatency: 1200,
          avgCost: 0.003,
          qualityScore: 88,
          successRate: 96,
          trend: 'improving',
        },
        {
          model: 'gemini-3-pro',
          capability: 'general-purpose',
          selectionRate: 20,
          avgLatency: 1000,
          avgCost: 0.001,
          qualityScore: 82,
          successRate: 94,
          trend: 'stable',
        },
        {
          model: 'claude-haiku-4-5',
          capability: 'lightweight',
          selectionRate: 10,
          avgLatency: 600,
          avgCost: 0.0004,
          qualityScore: 75,
          successRate: 92,
          trend: 'declining',
        },
      ]);

      setGovernance({
        activePolicy: 'Balanced Risk Profile',
        totalDecisions: 12847,
        approvedDecisions: 12156,
        rejectedDecisions: 89,
        escalatedDecisions: 602,
        violationsDetected: 28,
        criticalRisks: 2,
      });

      setRisk({
        riskLevel: 'medium',
        overallScore: 42,
        boundaryViolations: 28,
        founderOverridesRequired: 5,
        trend: 'improving',
      });

      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'safe':
        return 'bg-success-100 text-success-800';
      case 'low':
        return 'bg-info-100 text-info-800';
      case 'medium':
        return 'bg-warning-100 text-warning-800';
      case 'high':
        return 'bg-accent-100 text-accent-800';
      case 'critical':
        return 'bg-error-100 text-error-800';
      default:
        return 'bg-bg-hover text-text-primary';
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') {
return <TrendingUp className="w-4 h-4 text-success-600" />;
}
    if (trend === 'declining') {
return <AlertTriangle className="w-4 h-4 text-error-600" />;
}
    return <Radio className="w-4 h-4 text-text-muted" />;
  };

  if (loading) {
    return (
      <div className="p-10 space-y-4">
        <h1 className="text-3xl font-bold">AGI Console</h1>
        <p className="text-text-tertiary">Loading governance dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">AGI Governance Console</h1>
        <p className="text-text-secondary mt-2">
          Multi-model routing oversight, risk management, and founder control center.
          Maintains human authority over AGI operations.
        </p>
      </div>

      {/* Critical Status Alert */}
      {risk && risk.criticalRisks > 0 && (
        <Alert className="border-error-200 bg-error-50 dark:bg-error-950/30">
          <AlertTriangle className="h-4 w-4 text-error-600" />
          <AlertTitle>Critical Risks Detected</AlertTitle>
          <AlertDescription>
            {risk.criticalRisks} critical risk boundary violation(s). Immediate founder review required.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabbed Interface */}
      <Tabs defaultValue="models" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="models">Model Routing</TabsTrigger>
          <TabsTrigger value="governance">Governance</TabsTrigger>
          <TabsTrigger value="risks">Risk Management</TabsTrigger>
          <TabsTrigger value="controls">Controls</TabsTrigger>
        </TabsList>

        {/* Model Routing Tab */}
        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Model Performance & Routing
              </CardTitle>
              <CardDescription>
                Real-time metrics for all available models and routing decisions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {models.map(model => (
                  <Card key={model.model} className="bg-bg-raised">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold capitalize">{model.model}</p>
                            <p className="text-xs text-text-tertiary capitalize">{model.capability}</p>
                          </div>
                          {getTrendIcon(model.trend)}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-text-muted">Selection Rate</p>
                            <p className="font-semibold">{model.selectionRate}%</p>
                          </div>
                          <div>
                            <p className="text-text-muted">Quality</p>
                            <p className="font-semibold">{model.qualityScore}/100</p>
                          </div>
                          <div>
                            <p className="text-text-muted">Latency</p>
                            <p className="font-semibold">{model.avgLatency}ms</p>
                          </div>
                          <div>
                            <p className="text-text-muted">Success Rate</p>
                            <p className="font-semibold">{model.successRate}%</p>
                          </div>
                        </div>

                        <div className="w-full h-2 bg-bg-hover rounded-full overflow-hidden">
                          <div
                            className="h-full bg-info-600"
                            style={{ width: `${model.qualityScore}%` }}
                          />
                        </div>

                        <p className="text-xs text-text-tertiary">Cost: ${model.avgCost}/request</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Governance Tab */}
        <TabsContent value="governance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Governance Status
              </CardTitle>
              <CardDescription>Policy enforcement and decision audit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {governance && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-text-muted">Active Policy</p>
                      <p className="font-semibold text-lg">{governance.activePolicy}</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-text-muted">Total Decisions</p>
                      <p className="font-semibold text-lg">{governance.totalDecisions.toLocaleString()}</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-text-muted">Approval Rate</p>
                      <p className="font-semibold text-lg">
                        {Math.round((governance.approvedDecisions / governance.totalDecisions) * 100)}%
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-success-50 dark:bg-success-950/20">
                      <CardContent className="pt-4">
                        <p className="text-xs text-text-muted">Approved</p>
                        <p className="font-bold text-2xl text-success-700">
                          {governance.approvedDecisions.toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-warning-50 dark:bg-warning-950/20">
                      <CardContent className="pt-4">
                        <p className="text-xs text-text-muted">Escalated</p>
                        <p className="font-bold text-2xl text-warning-700">
                          {governance.escalatedDecisions.toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-accent-50 dark:bg-accent-950/20">
                      <CardContent className="pt-4">
                        <p className="text-xs text-text-muted">Rejected</p>
                        <p className="font-bold text-2xl text-accent-700">
                          {governance.rejectedDecisions.toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-error-50 dark:bg-error-950/20">
                      <CardContent className="pt-4">
                        <p className="text-xs text-text-muted">Violations</p>
                        <p className="font-bold text-2xl text-error-700">
                          {governance.violationsDetected.toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Policy Metrics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Approval Rate</span>
                        <span className="font-semibold">
                          {Math.round((governance.approvedDecisions / governance.totalDecisions) * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Escalation Rate</span>
                        <span className="font-semibold">
                          {Math.round((governance.escalatedDecisions / governance.totalDecisions) * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rejection Rate</span>
                        <span className="font-semibold">
                          {Math.round((governance.rejectedDecisions / governance.totalDecisions) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Management Tab */}
        <TabsContent value="risks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Risk Assessment
              </CardTitle>
              <CardDescription>Current risk exposure and boundary tracking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {risk && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold">Overall Risk Level</h4>
                        <Badge className={`capitalize ${getRiskColor(risk.riskLevel)}`}>
                          {risk.riskLevel}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Risk Score</span>
                          <span className="font-bold text-xl">{risk.overallScore}/100</span>
                        </div>
                        <div className="w-full h-3 bg-bg-hover rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              risk.overallScore < 30
                                ? 'bg-success-600'
                                : risk.overallScore < 50
                                ? 'bg-warning-600'
                                : risk.overallScore < 75
                                ? 'bg-accent-600'
                                : 'bg-error-600'
                            }`}
                            style={{ width: `${risk.overallScore}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {risk.trend === 'improving' && (
                            <>
                              <TrendingUp className="w-4 h-4 text-success-600" />
                              <span className="text-sm text-success-600">Risk improving</span>
                            </>
                          )}
                          {risk.trend === 'stable' && (
                            <>
                              <Radio className="w-4 h-4 text-text-muted" />
                              <span className="text-sm text-text-muted">Risk stable</span>
                            </>
                          )}
                          {risk.trend === 'worsening' && (
                            <>
                              <AlertTriangle className="w-4 h-4 text-error-600" />
                              <span className="text-sm text-error-600">Risk worsening</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-6">
                      <h4 className="font-semibold mb-4">Risk Incidents</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Boundary Violations</span>
                          <Badge variant="outline">{risk.boundaryViolations}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Founder Overrides Required</span>
                          <Badge variant="outline">{risk.founderOverridesRequired}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Critical Risks</span>
                          {risk.boundaryViolations > 0 ? (
                            <Badge className="bg-error-600">Active</Badge>
                          ) : (
                            <Badge className="bg-success-600">None</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 space-y-3">
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Risk Profile: Balanced</h4>
                      <p className="text-xs text-text-muted mb-3">
                        Standard risk boundaries with selective founder approval requirements
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Daily Cost Limit</span>
                        <span className="font-semibold">$500 / Requires Approval</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Single Request Limit</span>
                        <span className="font-semibold">$50 / Auto-approved</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Critical Path Latency</span>
                        <span className="font-semibold">5000ms / Auto-approved</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Safety-Critical Accuracy</span>
                        <span className="font-semibold">95% minimum / Requires Approval</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Controls Tab */}
        <TabsContent value="controls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Governance Controls
              </CardTitle>
              <CardDescription>Manual controls and policy configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="border rounded-lg p-4 space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Switch Risk Profile</h4>
                    <p className="text-xs text-text-muted mb-3">
                      Change governance strictness level
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline">
                      Conservative
                    </Button>
                    <Button size="sm" variant="default">
                      Balanced (Active)
                    </Button>
                    <Button size="sm" variant="outline">
                      Aggressive
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg p-4 space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Run Risk Simulation</h4>
                    <p className="text-xs text-text-muted mb-3">
                      Forecast agent behavior and outcomes under different conditions
                    </p>
                  </div>
                  <Button size="sm" variant="default">
                    <Zap className="w-4 h-4 mr-2" />
                    Launch Simulation
                  </Button>
                </div>

                <div className="border rounded-lg p-4 space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Review Pending Approvals</h4>
                    <p className="text-xs text-text-muted mb-3">
                      {governance ? governance.escalatedDecisions : 0} decisions waiting for founder decision
                    </p>
                  </div>
                  <Button size="sm" variant="default">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Review Queue
                  </Button>
                </div>

                <div className="border rounded-lg p-4 space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Override Decision</h4>
                    <p className="text-xs text-text-muted mb-3">
                      Manually approve or reject a governance decision
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Apply Override
                  </Button>
                </div>

                <div className="border rounded-lg p-4 space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Generate Audit Report</h4>
                    <p className="text-xs text-text-muted mb-3">
                      Export governance audit and compliance report
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <Card className="bg-info-50 dark:bg-info-950/20 border-info-200">
        <CardContent className="pt-6 text-sm text-text-secondary">
          <p>
            <strong>Last Updated:</strong> {new Date().toLocaleString()}
          </p>
          <p className="mt-2">
            Phase 8 – Strategic Governance & Multi-Model AGI Control: Intelligent model routing, risk-aware
            governance, scenario forecasting, and founder command center for ultimate oversight.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
