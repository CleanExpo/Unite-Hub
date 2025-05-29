"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabaseClient } from "@/lib/supabase/client";
import { ArrowLeft, Loader2, TrendingUp, Users, DollarSign, Clock, Calendar } from "lucide-react";
// Fixed import path to use relative path instead of alias
import { AnalyticsDashboard } from "../../../components/analytics/AnalyticsDashboard";
import { trackPageView, type ReportTimePeriod, type DashboardConfig } from "@/lib/analytics";

// Analytics dashboard configuration
const dashboardConfig = {
  name: "Business Analytics",
  widgets: [
    {
      id: "overview-revenue",
      type: "metric",
      title: "Total Revenue",
      config: {
        metric: "total_revenue",
        format: "currency",
        prefix: "$",
        showComparison: true,
        comparisonLabel: "vs. previous period"
      }
    },
    {
      id: "overview-clients",
      type: "metric",
      title: "Total Clients",
      config: {
        metric: "client_count",
        showComparison: true,
        comparisonLabel: "vs. previous period"
      }
    },
    {
      id: "overview-projects",
      type: "metric",
      title: "Active Projects",
      config: {
        metric: "active_project_count",
        showComparison: true,
        comparisonLabel: "vs. previous period"
      }
    },
    {
      id: "overview-duration",
      type: "metric",
      title: "Avg. Project Duration",
      config: {
        metric: "avg_project_duration",
        suffix: " days",
        showComparison: false
      }
    },
    {
      id: "revenue-chart",
      type: "chart",
      title: "Revenue Overview",
      subtitle: "Monthly revenue for the past year",
      config: {
        type: "bar",
        metrics: ["monthly_revenue"],
        showLegend: true
      }
    },
    {
      id: "clients-chart",
      type: "chart",
      title: "Client Acquisition",
      subtitle: "New vs. returning clients by month",
      config: {
        type: "line",
        metrics: ["new_clients", "returning_clients"],
        showLegend: true
      }
    },
    {
      id: "services-distribution",
      type: "chart",
      title: "Services Distribution",
      subtitle: "Revenue breakdown by service type",
      config: {
        type: "pie",
        metrics: ["service_revenue"]
      }
    },
    {
      id: "project-status",
      type: "funnel",
      title: "Project Status Distribution",
      subtitle: "Current status of all projects",
      config: {
        steps: [
          { name: "Planning", metric: "planning_projects" },
          { name: "In Progress", metric: "progress_projects" },
          { name: "Review", metric: "review_projects" },
          { name: "Completed", metric: "completed_projects" }
        ],
        showConversionRates: true
      }
    }
  ],
  layout: [
    { widgetId: "overview-revenue", position: { x: 0, y: 0, width: 1, height: 1 } },
    { widgetId: "overview-clients", position: { x: 1, y: 0, width: 1, height: 1 } },
    { widgetId: "overview-projects", position: { x: 2, y: 0, width: 1, height: 1 } },
    { widgetId: "overview-duration", position: { x: 3, y: 0, width: 1, height: 1 } },
    { widgetId: "revenue-chart", position: { x: 0, y: 1, width: 2, height: 2 } },
    { widgetId: "clients-chart", position: { x: 2, y: 1, width: 2, height: 2 } },
    { widgetId: "services-distribution", position: { x: 0, y: 3, width: 2, height: 2 } },
    { widgetId: "project-status", position: { x: 2, y: 3, width: 2, height: 2 } }
  ]
};

// Sample data for the dashboard (would be replaced with real data from API)
const sampleData = {
  "overview-revenue": {
    value: 97500,
    previousValue: 84800
  },
  "overview-clients": {
    value: 63,
    previousValue: 58
  },
  "overview-projects": {
    value: 24,
    previousValue: 21
  },
  "overview-duration": {
    value: 42
  },
  "revenue-chart": {
    data: [
      { label: "Jan", monthly_revenue: 4000 },
      { label: "Feb", monthly_revenue: 3000 },
      { label: "Mar", monthly_revenue: 5000 },
      { label: "Apr", monthly_revenue: 7000 },
      { label: "May", monthly_revenue: 6000 },
      { label: "Jun", monthly_revenue: 8000 },
      { label: "Jul", monthly_revenue: 9000 },
      { label: "Aug", monthly_revenue: 8500 },
      { label: "Sep", monthly_revenue: 11000 },
      { label: "Oct", monthly_revenue: 10000 },
      { label: "Nov", monthly_revenue: 12000 },
      { label: "Dec", monthly_revenue: 14000 }
    ]
  },
  "clients-chart": {
    data: [
      { label: "Jan", new_clients: 5, returning_clients: 10 },
      { label: "Feb", new_clients: 8, returning_clients: 12 },
      { label: "Mar", new_clients: 10, returning_clients: 15 },
      { label: "Apr", new_clients: 7, returning_clients: 18 },
      { label: "May", new_clients: 9, returning_clients: 20 },
      { label: "Jun", new_clients: 12, returning_clients: 22 },
      { label: "Jul", new_clients: 15, returning_clients: 25 },
      { label: "Aug", new_clients: 13, returning_clients: 28 },
      { label: "Sep", new_clients: 18, returning_clients: 30 },
      { label: "Oct", new_clients: 20, returning_clients: 32 },
      { label: "Nov", new_clients: 22, returning_clients: 35 },
      { label: "Dec", new_clients: 25, returning_clients: 38 }
    ]
  },
  "services-distribution": {
    data: [
      { name: "Digital Transformation", value: 40 },
      { name: "IT Consulting", value: 30 },
      { name: "Software Development", value: 20 },
      { name: "Cloud Migration", value: 10 }
    ]
  },
  "project-status": {
    data: [
      { name: "Planning", value: 15 },
      { name: "In Progress", value: 30 },
      { name: "Review", value: 10 },
      { name: "Completed", value: 45 }
    ]
  }
};

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState(sampleData);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Track page view
    trackPageView('/dashboard/analytics');
    
    const checkUser = async () => {
      const { data: { session }, error } = await supabaseClient.auth.getSession();
      
      if (error) {
        console.error("Error checking session:", error);
        setLoading(false);
        return;
      }
      
      if (!session) {
        // Redirect to login if not authenticated - use locale-aware routing
        router.push("/en/login"); // Using 'en' as default locale for now
        return;
      }
      
      setUser(session.user);
      
      // Check if user is admin
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
        
      setIsAdmin(profile?.role === 'admin');
      setLoading(false);
    };
    
    checkUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-teal-400 animate-spin" />
      </div>
    );
  }

  // Only admins can access this page
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-3xl mx-auto bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-slate-300 mb-6">You don't have permission to access the analytics dashboard.</p>
          <Button asChild className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white">
            <Link href="/en/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-slate-300 hover:text-white"
                onClick={() => router.push('/en/dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-300">{user?.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AnalyticsDashboard 
          config={({
            ...dashboardConfig,
            id: "business-analytics-dashboard",
            description: "Key business metrics and performance indicators",
            timePeriod: {
              startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
              endDate: new Date().toISOString() // now
            },
            ownerId: user?.id || "admin",
            shared: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } as DashboardConfig)}
          data={analyticsData}
          isLoading={loading}
          onTimePeriodChange={(period: ReportTimePeriod) => {
            // In a real app, this would fetch new data based on the time period
            console.log("Time period changed:", period);
          }}
          onRefresh={() => {
            // In a real app, this would refresh the data
            console.log("Refreshing data...");
          }}
          className="bg-slate-800 text-white rounded-lg"
        />
      </div>
    </div>
  );
}
