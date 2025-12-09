'use client';

/**
 * Founder Agents Dashboard
 * Main dashboard for autonomous agent planning, approval, and execution
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, Zap, AlertTriangle, Brain } from 'lucide-react';
import { AgentObjectivePanel } from '@/components/agents/AgentObjectivePanel';
import { AgentPlanViewer } from '@/components/agents/AgentPlanViewer';
import { AgentExecutionConsole } from '@/components/agents/AgentExecutionConsole';
import { AgentRiskApprovalModal } from '@/components/agents/AgentRiskApprovalModal';

export default function FounderAgentsDashboard() {
  const { session, currentOrganization } = useAuth();
  const [stats, setStats] = useState({
    totalPlans: 0,
    pendingApproval: 0,
    runningExecutions: 0,
    completedPlans: 0,
  });
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [planDetails, setPlanDetails] = useState<any>(null);

  const workspaceId = currentOrganization?.org_id || '';

  // Fetch stats
  useEffect(() => {
    if (!workspaceId || !session?.access_token) {
return;
}

    const fetchStats = async () => {
      try {
        const response = await fetch(
          `/api/agent/status?workspaceId=${workspaceId}`,
          {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }
        );

        if (response.ok) {
          const data = await response.json();
          // Update stats based on API response
          setStats({
            totalPlans: data.summary?.total_steps || 0,
            pendingApproval: 0, // Would fetch from database
            runningExecutions: 0,
            completedPlans: 0,
          });
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [workspaceId, session?.access_token]);

  if (!session) {
    return (
      <div className="p-8">
        <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Not Authenticated</AlertTitle>
          <AlertDescription>Please log in to access the autonomous agents dashboard.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Autonomous Agents</h1>
        <p className="text-text-secondary mt-2">
          Enable Synthex to autonomously plan, reason, and execute safe multi-step workflows
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Brain className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold">{stats.totalPlans}</div>
              <p className="text-sm text-text-secondary">Total Plans</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
              <div className="text-2xl font-bold">{stats.pendingApproval}</div>
              <p className="text-sm text-text-secondary">Pending Approval</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Zap className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold">{stats.runningExecutions}</div>
              <p className="text-sm text-text-secondary">Running Executions</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold">{stats.completedPlans}</div>
              <p className="text-sm text-text-secondary">Completed Plans</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Notice */}
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
        <Shield className="h-4 w-4" />
        <AlertTitle>Secure Autonomous Execution</AlertTitle>
        <AlertDescription>
          All agent plans are validated for safety before execution. High-risk plans require founder approval.
          Sandbox execution prevents access to system files and harmful commands. Full audit trail logged to Living Intelligence Archive.
        </AlertDescription>
      </Alert>

      {/* Main Content Tabs */}
      {session?.access_token && (
        <Tabs defaultValue="create" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="create">Create Plan</TabsTrigger>
            <TabsTrigger value="view">View Plan</TabsTrigger>
            <TabsTrigger value="execute">Execute</TabsTrigger>
            <TabsTrigger value="monitor">Monitor</TabsTrigger>
          </TabsList>

          {/* Create Plan Tab */}
          <TabsContent value="create" className="space-y-4">
            <AgentObjectivePanel
              workspaceId={workspaceId}
              accessToken={session.access_token}
              onPlanCreated={(planId) => {
                setSelectedPlanId(planId);
                // Switch to view tab
              }}
            />
          </TabsContent>

          {/* View Plan Tab */}
          <TabsContent value="view" className="space-y-4">
            {selectedPlanId ? (
              <AgentPlanViewer
                planId={selectedPlanId}
                workspaceId={workspaceId}
                accessToken={session.access_token}
                plan={selectedPlan}
                complexity_score={planDetails?.complexity_score}
                confidence_score={planDetails?.confidence_score}
                safety_validation={planDetails?.safety_validation}
                status={planDetails?.status}
              />
            ) : (
              <Card>
                <CardContent className="pt-8">
                  <p className="text-center text-text-secondary">
                    Create a plan to view its details
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Execute Tab */}
          <TabsContent value="execute" className="space-y-4">
            {selectedPlanId ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Execute Plan</CardTitle>
                    <CardDescription>
                      Launch the selected plan for execution through Synthex
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {planDetails?.safety_validation?.requires_approval ? (
                      <AgentRiskApprovalModal
                        planId={selectedPlanId}
                        workspaceId={workspaceId}
                        accessToken={session.access_token}
                        riskAssessment={{
                          risk_score: planDetails.safety_validation.risk_score,
                          risk_factors: planDetails.safety_validation.risk_factors,
                          risk_summary: `This plan has ${planDetails.safety_validation.risk_factors.length} risk factors`,
                          requires_founder_approval: true,
                        }}
                      />
                    ) : (
                      <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30">
                        <AlertTitle>Plan Ready to Execute</AlertTitle>
                        <AlertDescription>
                          This plan has been validated and is ready for execution.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-8">
                  <p className="text-center text-text-secondary">
                    Create and review a plan before execution
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Monitor Tab */}
          <TabsContent value="monitor" className="space-y-4">
            {selectedPlanId ? (
              <AgentExecutionConsole
                planId={selectedPlanId}
                workspaceId={workspaceId}
                accessToken={session.access_token}
                autoRefresh={true}
                refreshInterval={3000}
              />
            ) : (
              <Card>
                <CardContent className="pt-8">
                  <p className="text-center text-text-secondary">
                    Execute a plan to monitor its progress
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Truth Layer Info */}
      <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/30">
        <CardHeader>
          <CardTitle className="text-purple-900 dark:text-purple-100">Truth Layer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-purple-800 dark:text-purple-200">
          <p>✓ All agent plans logged to the Living Intelligence Archive</p>
          <p>✓ Agent disclosures of uncertainty at each execution step</p>
          <p>✓ Promised outcomes compared against actual results</p>
          <p>✓ Complete reasoning trace preserved for auditability</p>
          <p>✓ High-risk operations require explicit founder approval</p>
          <p>✓ All plans validated for safety before execution</p>
        </CardContent>
      </Card>
    </div>
  );
}
