"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Mail, Target, Activity, Eye } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Tabs } from "@/components/patterns/Tabs";
import { Dropdown } from "@/components/patterns/Dropdown";
import { BarChart, LineChart, PieChart } from "@/components/patterns/Charts";
import { Alert } from "@/components/patterns/Alert";
import { supabase } from "@/lib/supabase";

export default function AnalyticsPage() {
  const [isInTrial, setIsInTrial] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string>("");

  useEffect(() => {
    async function checkTrial() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
return;
}

        const { data: profile } = await supabase
          .from("user_profiles")
          .select("workspace_id")
          .eq("user_id", session.user.id)
          .single();

        if (profile?.workspace_id) {
          setWorkspaceId(profile.workspace_id);

          // Check trial status via API
          const response = await fetch(
            `/api/trial/status?workspaceId=${profile.workspace_id}`,
            {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            setIsInTrial(data.isTrialActive);
          }
        }
      } catch (error) {
        console.error("Error checking trial status:", error);
      }
    }

    checkTrial();
  }, []);

  // Sample data for charts
  const trafficData = [
    { label: 'Jan', value: 2400 },
    { label: 'Feb', value: 1398 },
    { label: 'Mar', value: 9800 },
    { label: 'Apr', value: 3908 },
    { label: 'May', value: 4800 },
    { label: 'Jun', value: 3800 },
  ];

  const conversionData = [
    { label: 'Week 1', value: 65 },
    { label: 'Week 2', value: 78 },
    { label: 'Week 3', value: 90 },
    { label: 'Week 4', value: 81 },
  ];

  const channelData = [
    { label: 'Email', value: 400 },
    { label: 'Social', value: 300 },
    { label: 'Organic', value: 200 },
    { label: 'Direct', value: 100 },
  ];

  const tabItems = [
    {
      id: 'overview',
      label: 'Overview',
      content: (
        <div className="space-y-6">
          {/* Traffic Chart */}
          <Card className="bg-bg-card border border-border-subtle">
            <CardHeader>
              <CardTitle className="text-text-primary flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Traffic Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart data={trafficData} height={300} showLegend />
            </CardContent>
          </Card>

          {/* Conversion Trend */}
          <Card className="bg-bg-card border border-border-subtle">
            <CardHeader>
              <CardTitle className="text-text-primary">Conversion Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart data={conversionData} height={300} showLegend />
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: 'channels',
      label: 'By Channel',
      content: (
        <Card className="bg-bg-card border border-border-subtle">
          <CardHeader>
            <CardTitle className="text-text-primary">Traffic by Channel</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart data={channelData} height={400} showLegend />
          </CardContent>
        </Card>
      ),
    },
  ];

  return (
    <Container size="lg" padding="lg" className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-2">
          Analytics
        </h1>
        <p className="text-text-secondary">Track performance metrics and business insights</p>
        {isInTrial && (
          <Alert
            type="info"
            title="Read-only mode"
            description="During your trial, analytics are viewable but not editable. Upgrade to manage data settings."
            icon={<Eye className="h-5 w-5" />}
          />
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-bg-card border border-border-subtle hover:border-border-subtle/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">Total Visitors</CardTitle>
            <Users className="h-4 w-4 text-accent-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-primary">12,543</div>
            <p className="text-xs text-success-500 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" /> +18.2% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-bg-card border border-border-subtle hover:border-border-subtle/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-accent-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-primary">3.24%</div>
            <p className="text-xs text-success-500 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" /> +0.8% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-bg-card border border-border-subtle hover:border-border-subtle/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">Email Open Rate</CardTitle>
            <Mail className="h-4 w-4 text-accent-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-primary">42.8%</div>
            <p className="text-xs text-success-500 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" /> +5.3% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-bg-card border border-border-subtle hover:border-border-subtle/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">Active Campaigns</CardTitle>
            <Activity className="h-4 w-4 text-accent-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-primary">8</div>
            <p className="text-xs text-text-secondary mt-1">Across 3 channels</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts with Tabs */}
      <Tabs items={tabItems} />
    </Container>
  );
}
