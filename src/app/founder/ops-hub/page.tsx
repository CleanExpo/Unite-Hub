'use client';

/**
 * Founder Ops Hub - Main Page
 *
 * Central dashboard for managing all founder operations across brands.
 * Integrates Overview, Task Board, Brand Workload, and Execution Queue.
 *
 * @page /founder/ops-hub
 */

import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  KanbanSquare,
  TrendingUp,
  Calendar,
  Settings,
  Plus,
  RefreshCw,
} from 'lucide-react';
import FounderOpsHubOverview from '@/ui/founder/FounderOpsHubOverview';
import FounderOpsTaskBoard from '@/ui/founder/FounderOpsTaskBoard';
import FounderOpsBrandWorkload from '@/ui/founder/FounderOpsBrandWorkload';
import FounderOpsExecutionQueue from '@/ui/founder/FounderOpsExecutionQueue';

export default function FounderOpsHubPage() {
  const [workspaceId, setWorkspaceId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Get workspaceId from context/auth
  useEffect(() => {
    // TODO: Get from AuthContext or similar
    // For now, use placeholder
    setWorkspaceId('placeholder-workspace-id');
  }, []);

  if (!workspaceId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Loading workspace...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Founder Ops Hub</h1>
          <p className="text-muted-foreground mt-1">
            Centralized operations command center for all brands
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats Banner */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Welcome to Ops Hub</CardTitle>
              <CardDescription>
                Your autonomous operations layer across 5 Unite-Group brands
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              5 Brands Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-muted-foreground">All systems operational</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">Brand Matrix synced</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-muted-foreground">Topic Engine active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-muted-foreground">Queue processing</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="task-board" className="gap-2">
            <KanbanSquare className="h-4 w-4" />
            Task Board
          </TabsTrigger>
          <TabsTrigger value="brand-workload" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Brand Workload
          </TabsTrigger>
          <TabsTrigger value="execution-queue" className="gap-2">
            <Calendar className="h-4 w-4" />
            Execution Queue
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <FounderOpsHubOverview workspaceId={workspaceId} />
        </TabsContent>

        {/* Task Board Tab */}
        <TabsContent value="task-board" className="space-y-4">
          <FounderOpsTaskBoard workspaceId={workspaceId} />
        </TabsContent>

        {/* Brand Workload Tab */}
        <TabsContent value="brand-workload" className="space-y-4">
          <FounderOpsBrandWorkload workspaceId={workspaceId} />
        </TabsContent>

        {/* Execution Queue Tab */}
        <TabsContent value="execution-queue" className="space-y-4">
          <FounderOpsExecutionQueue workspaceId={workspaceId} />
        </TabsContent>
      </Tabs>

      {/* Footer Info */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div>
              Founder Ops Hub v1.1.01 • Phase 2 Complete • Brand-aware execution enabled
            </div>
            <div>
              Last sync: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
