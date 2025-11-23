'use client';

/**
 * Founder Governance Dashboard
 * Phase 63: Central governance and compliance oversight
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
} from 'lucide-react';
import GovernanceScoreBar from '@/ui/components/GovernanceScoreBar';
import GovernanceRiskCard from '@/ui/components/GovernanceRiskCard';
import ComplianceBadge from '@/ui/components/ComplianceBadge';

export default function FounderGovernancePage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  // Mock data
  const mockScores = {
    compliance_score: 92,
    governance_risk_score: 85,
    system_integrity_score: 88,
    calculated_at: new Date().toISOString(),
  };

  const mockRisks = [
    {
      id: 'risk-1',
      category: 'financial_costs',
      severity: 'medium' as const,
      title: 'Daily Budget at 80%',
      description: 'Token costs approaching daily budget limit. Consider optimization.',
      detected_at: new Date().toISOString(),
      requires_founder_action: false,
      auto_resolved: false,
    },
    {
      id: 'risk-2',
      category: 'client_outcomes',
      severity: 'low' as const,
      title: 'Client Activation Delay',
      description: 'One client behind on activation timeline (Day 35/30 target).',
      detected_at: new Date(Date.now() - 3600000).toISOString(),
      requires_founder_action: false,
      auto_resolved: false,
    },
  ];

  const mockAudits = [
    { type: 'AI Output Compliance', status: 'pass', score: 95, time: '2h ago' },
    { type: 'Token Costs', status: 'pass', score: 68, time: '2h ago' },
    { type: 'Visual Asset Quality', status: 'pass', score: 82, time: '2h ago' },
    { type: 'Mission Risk Levels', status: 'pass', score: 88, time: '2h ago' },
    { type: 'Storage/Bandwidth', status: 'pass', score: 92, time: '2h ago' },
    { type: 'Client Activation', status: 'warning', score: 78, time: '2h ago' },
  ];

  const mockPolicies = [
    { name: 'Truth Layer Compliance', status: 'compliant', threshold: 95, current: 98 },
    { name: 'Brand Color Compliance', status: 'compliant', threshold: 80, current: 87 },
    { name: 'Daily Cost Budget', status: 'warning', threshold: 100, current: 80 },
    { name: 'Response Time SLA', status: 'compliant', threshold: 95, current: 97 },
    { name: 'Data Isolation', status: 'compliant', threshold: 100, current: 100 },
  ];

  const getOverallStatus = () => {
    if (mockScores.compliance_score >= 90 && mockScores.governance_risk_score >= 80) {
      return 'healthy';
    }
    if (mockScores.compliance_score >= 70 && mockScores.governance_risk_score >= 60) {
      return 'warning';
    }
    return 'critical';
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
            <Shield className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Governance Engine</h1>
            <p className="text-sm text-muted-foreground">
              Autonomous compliance and security oversight
            </p>
          </div>
        </div>
        <ComplianceBadge
          status={overallStatus === 'healthy' ? 'compliant' : overallStatus === 'warning' ? 'warning' : 'non_compliant'}
          label={overallStatus === 'healthy' ? 'All Systems Compliant' : overallStatus === 'warning' ? 'Attention Needed' : 'Issues Detected'}
          size="lg"
        />
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <GovernanceScoreBar
              label="Compliance Score"
              score={mockScores.compliance_score}
              thresholds={{ warning: 80, critical: 60 }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <GovernanceScoreBar
              label="Governance Risk"
              score={mockScores.governance_risk_score}
              thresholds={{ warning: 70, critical: 50 }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <GovernanceScoreBar
              label="System Integrity"
              score={mockScores.system_integrity_score}
              thresholds={{ warning: 85, critical: 70 }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="risks">
            Risks
            {mockRisks.length > 0 && (
              <Badge className="ml-1" variant="secondary">
                {mockRisks.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="audits">Daily Audits</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quick Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">AI Behavior</span>
                    <ComplianceBadge status="compliant" size="sm" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Brand Consistency</span>
                    <ComplianceBadge status="compliant" size="sm" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Financial Costs</span>
                    <ComplianceBadge status="warning" size="sm" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Security</span>
                    <ComplianceBadge status="compliant" size="sm" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Data Integrity</span>
                    <ComplianceBadge status="compliant" size="sm" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileCheck className="h-4 w-4" />
                  Action Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="h-4 w-4 rounded" />
                    📊 Review daily audit results
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="h-4 w-4 rounded" />
                    💰 Monitor token cost trends
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="h-4 w-4 rounded" />
                    ✅ Verify compliance status
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="h-4 w-4 rounded" />
                    🔐 Check security events
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          {mockRisks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockRisks.map((risk) => (
                <GovernanceRiskCard
                  key={risk.id}
                  {...risk}
                  onResolve={() => console.log('Resolve:', risk.id)}
                  onView={() => console.log('View:', risk.id)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <ShieldCheck className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-muted-foreground">No active risks detected</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="audits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Daily Audit Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockAudits.map((audit, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      {audit.status === 'pass' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                      <div>
                        <div className="text-sm font-medium">{audit.type}</div>
                        <div className="text-xs text-muted-foreground">{audit.time}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${audit.score >= 80 ? 'text-green-500' : audit.score >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                        {audit.score}%
                      </div>
                      <Badge variant={audit.status === 'pass' ? 'default' : 'secondary'} className={audit.status === 'pass' ? 'bg-green-500' : 'bg-yellow-500'}>
                        {audit.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Policy Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockPolicies.map((policy, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{policy.name}</span>
                      <ComplianceBadge
                        status={policy.status as any}
                        size="sm"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Threshold: {policy.threshold}%</span>
                      <span>•</span>
                      <span>Current: {policy.current}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Governance Constraints */}
      <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
        Governance Engine operates autonomously with truth-layer validation.
        Founder control required for high-impact changes. Auto-OK for low-risk items.
        No client-impact changes without approval. Full rollback available.
      </div>
    </div>
  );
}
