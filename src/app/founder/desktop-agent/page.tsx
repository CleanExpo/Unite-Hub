'use client';

/**
 * Desktop Agent Dashboard
 *
 * Founder interface for managing and monitoring desktop agent
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AgentConsole } from '@/components/desktop/AgentConsole';
import { AgentCommandPanel } from '@/components/desktop/AgentCommandPanel';
import { CapabilityMatrix } from '@/components/desktop/CapabilityMatrix';
import { Activity, Shield, Zap, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function DesktopAgentPage() {
  const { session, currentOrganization } = useAuth();
  const [stats, setStats] = useState({
    totalCommands: 0,
    pendingApprovals: 0,
    sessionCount: 0,
    errorCount: 0,
  });

  const workspaceId = currentOrganization?.org_id || '';

  useEffect(() => {
    if (!workspaceId || !session?.access_token) {
return;
}

    const fetchStats = async () => {
      try {
        const response = await fetch(
          `/api/desktop/capabilities?workspaceId=${workspaceId}`,
          {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setStats({
            totalCommands: data.stats?.totalCapabilities || 0,
            pendingApprovals: data.stats?.pendingApprovals || 0,
            sessionCount: 0,
            errorCount: 0,
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
        <Alert className="border-warning-200 bg-warning-50 dark:bg-warning-950/30">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Not Authenticated</AlertTitle>
          <AlertDescription>Please log in to access the desktop agent dashboard.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Desktop Agent</h1>
        <p className="text-text-secondary mt-2">
          Control and monitor desktop automation with Synthex integration
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Activity className="w-8 h-8 mx-auto mb-2 text-info-600" />
              <div className="text-2xl font-bold">{stats.totalCommands}</div>
              <p className="text-sm text-text-secondary">Available Commands</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="w-8 h-8 mx-auto mb-2 text-warning-600" />
              <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
              <p className="text-sm text-text-secondary">Pending Approvals</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Zap className="w-8 h-8 mx-auto mb-2 text-success-600" />
              <div className="text-2xl font-bold">Active</div>
              <p className="text-sm text-text-secondary">Status</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-error-600" />
              <div className="text-2xl font-bold">{stats.errorCount}</div>
              <p className="text-sm text-text-secondary">Recent Errors</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Notice */}
      <Alert className="border-info-200 bg-info-50 dark:bg-info-950/30">
        <Shield className="h-4 w-4" />
        <AlertTitle>Secure Sandbox</AlertTitle>
        <AlertDescription>
          All desktop commands are sandboxed, rate-limited to 5/minute, and logged to the Living Intelligence Archive.
          High-risk commands require founder approval. Truth layer ensures complete transparency.
        </AlertDescription>
      </Alert>

      {/* Main Content Tabs */}
      {session?.access_token && (
        <Tabs defaultValue="console" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="console">Console</TabsTrigger>
            <TabsTrigger value="builder">Builder</TabsTrigger>
            <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
            <TabsTrigger value="approvals">
              Approvals
              {stats.pendingApprovals > 0 && (
                <Badge className="ml-2 bg-warning-600">{stats.pendingApprovals}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="console" className="space-y-4">
            <AgentConsole
              workspaceId={workspaceId}
              accessToken={session.access_token}
              autoRefresh={true}
              maxLogs={100}
            />
          </TabsContent>

          <TabsContent value="builder" className="space-y-4">
            <AgentCommandPanel
              workspaceId={workspaceId}
              accessToken={session.access_token}
              onCommandSent={(commandId) => {
                console.log('Command sent:', commandId);
              }}
            />
          </TabsContent>

          <TabsContent value="capabilities" className="space-y-4">
            <CapabilityMatrix
              workspaceId={workspaceId}
              accessToken={session.access_token}
            />
          </TabsContent>

          <TabsContent value="approvals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>High-risk commands awaiting your approval</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.pendingApprovals === 0 ? (
                  <p className="text-text-secondary text-center py-8">
                    No pending approvals. All commands have been processed.
                  </p>
                ) : (
                  <p className="text-text-secondary">
                    {stats.pendingApprovals} command(s) awaiting your approval.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Truth Layer Info */}
      <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/30">
        <CardHeader>
          <CardTitle className="text-purple-900 dark:text-purple-100">Truth Layer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-purple-800 dark:text-purple-200">
          <p>✓ All commands are logged to the Living Intelligence Archive</p>
          <p>✓ Command outcomes are compared against promised results</p>
          <p>✓ Rate limiting enforced: 5 commands per minute</p>
          <p>✓ High-risk commands require explicit founder approval</p>
          <p>✓ Complete audit trail with timestamps and user attribution</p>
        </CardContent>
      </Card>
    </div>
  );
}
