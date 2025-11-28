"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Target,
  TrendingUp,
  Users,
  Search,
  BarChart3,
  Zap,
  ChevronRight,
  Loader2
} from "lucide-react";

interface ConvexStrategy {
  id: string;
  name: string;
  framework: string;
  status: "draft" | "active" | "completed";
  score: number;
  createdAt: string;
  updatedAt: string;
}

interface ConvexFramework {
  id: string;
  name: string;
  category: string;
  description: string;
  usageCount: number;
}

export default function ConvexStrategyDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [strategies, setStrategies] = useState<ConvexStrategy[]>([]);
  const [frameworks, setFrameworks] = useState<ConvexFramework[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setIsLoading(true);
    try {
      // Load strategies and frameworks from API
      const [strategiesRes, frameworksRes] = await Promise.all([
        fetch("/api/convex/strategies"),
        fetch("/api/convex/frameworks")
      ]);

      if (strategiesRes.ok) {
        const data = await strategiesRes.json();
        setStrategies(data.strategies || []);
      }

      if (frameworksRes.ok) {
        const data = await frameworksRes.json();
        setFrameworks(data.frameworks || []);
      }
    } catch (error) {
      console.error("Failed to load CONVEX dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const frameworkCategories = [
    { id: "brand_positioning", name: "Brand Positioning", icon: Target, color: "bg-blue-500" },
    { id: "funnel_design", name: "Funnel Design", icon: TrendingUp, color: "bg-green-500" },
    { id: "seo_patterns", name: "SEO Patterns", icon: Search, color: "bg-purple-500" },
    { id: "competitor_model", name: "Competitor Analysis", icon: Users, color: "bg-orange-500" },
    { id: "offer_architecture", name: "Offer Architecture", icon: BarChart3, color: "bg-pink-500" }
  ];

  const getStatusBadge = (status: ConvexStrategy["status"]) => {
    const styles = {
      draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      completed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    };
    return <Badge className={styles[status]}>{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CONVEX Strategy Dashboard</h1>
          <p className="text-muted-foreground">
            High-conversion marketing intelligence powered by CONVEX methodology
          </p>
        </div>
        <Button>
          <Zap className="mr-2 h-4 w-4" />
          Generate Strategy
        </Button>
      </div>

      {/* Framework Quick Access */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {frameworkCategories.map((category) => {
          const Icon = category.icon;
          return (
            <Card
              key={category.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className={`p-3 rounded-full ${category.color} text-white mb-2`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">{category.name}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
          <TabsTrigger value="frameworks">Frameworks</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active Strategies</CardDescription>
                <CardTitle className="text-3xl">
                  {strategies.filter(s => s.status === "active").length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Avg. Strategy Score</CardDescription>
                <CardTitle className="text-3xl">
                  {strategies.length > 0
                    ? Math.round(strategies.reduce((a, b) => a + b.score, 0) / strategies.length)
                    : 0}%
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Frameworks Used</CardDescription>
                <CardTitle className="text-3xl">{frameworks.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Strategies</CardDescription>
                <CardTitle className="text-3xl">{strategies.length}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Recent Strategies */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Strategies</CardTitle>
              <CardDescription>Your latest CONVEX-powered strategies</CardDescription>
            </CardHeader>
            <CardContent>
              {strategies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No strategies yet. Generate your first CONVEX strategy!</p>
                  <Button className="mt-4" variant="outline">
                    Get Started
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {strategies.slice(0, 5).map((strategy) => (
                    <div
                      key={strategy.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    >
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-medium">{strategy.name}</p>
                          <p className="text-sm text-muted-foreground">{strategy.framework}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {getStatusBadge(strategy.status)}
                        <span className="text-sm font-medium">{strategy.score}%</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategies">
          <Card>
            <CardHeader>
              <CardTitle>All Strategies</CardTitle>
              <CardDescription>Manage your CONVEX marketing strategies</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Strategy list content */}
              <p className="text-muted-foreground">Strategy management coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="frameworks">
          <Card>
            <CardHeader>
              <CardTitle>CONVEX Frameworks</CardTitle>
              <CardDescription>Browse and apply proven marketing frameworks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {frameworkCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <Card key={category.id} className="cursor-pointer hover:shadow-md">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          <div className={`p-2 rounded-lg ${category.color} text-white`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-medium">{category.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Click to explore {category.name.toLowerCase()} frameworks
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Execution Templates</CardTitle>
              <CardDescription>Ready-to-use templates for high-conversion marketing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "Landing Page", description: "High-conversion landing page structure" },
                  { name: "SEO Plan", description: "Semantic cluster SEO domination framework" },
                  { name: "Paid Ads", description: "Ad creative conversion template" },
                  { name: "Offer Architecture", description: "Value-maximizing offer blueprint" }
                ].map((template) => (
                  <Card key={template.name} className="cursor-pointer hover:shadow-md">
                    <CardContent className="p-4">
                      <h3 className="font-medium">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Use Template
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
